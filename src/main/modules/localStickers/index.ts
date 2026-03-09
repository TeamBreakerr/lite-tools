import fs from "node:fs";
import { ipcMain } from "electron";
import chokidar from "chokidar";
import { createLogger } from "@/main/utils/createLogger";
import { globalBroadcast } from "@/main/utils/globalBroadcast";
import { StickerPacksManager } from "./StickerPacksManager";
import { createThrottledDispatcher } from "@/common/createThrottledDispatcher";
import { configManager } from "@/main/modules/configManager";

import type { FSWatcher } from "chokidar";
import type { StickerStore, StickerPack } from "@/common/types/localStickers";

const log = createLogger("localStickers");

class LocalStickers {
  private initializedReady = false;
  private watcher: FSWatcher | null = null;
  private currentListeningPath = "";
  private stickerStore = this._createStickerStoreResult("info", "初始化中...");
  private stickerPacksManager: StickerPacksManager = new StickerPacksManager();

  constructor() {}

  private _notifyStickerStoreUpdated = createThrottledDispatcher(() => {
    if (!this.initializedReady) return; // 避免因节流导致的 offListener 后状态被覆盖
    const stickerStore = this._createStickerStoreResult("success", this.stickerPacksManager.getPackList());
    if (stickerStore.stickerPacks?.length) {
      this.stickerStore = stickerStore;
    } else {
      this.stickerStore = this._createStickerStoreResult("failed", "路径下没有贴纸");
    }
    this._broadcastStickerStoreUpdated();
  }, 200);

  private _broadcastStickerStoreUpdated() {
    log("通知更新", this.stickerStore);
    globalBroadcast("lite_tools.stickerStore.updated", this.stickerStore);
  }

  public setup() {
    this._bindIpcMain();
    this._update(configManager.value);
    configManager.onConfigUpdate((config) => this._update(config));
    log("初始化完成");
  }

  private _bindIpcMain() {
    ipcMain.handle("lite_tools.stickerStore.get", async (): Promise<StickerStore> => {
      return this.stickerStore;
    });
    ipcMain.on("lite_tools.stickerPacksManager.updatePackConfig", (_, path, key, value) => {
      this.stickerPacksManager.updatePackConfig(path, key, value);
      this._notifyStickerStoreUpdated();
    });
  }

  private async _update(config: Config) {
    if (config.localStickers.enabled) {
      await this._addListener(config.localStickers.path);
    } else {
      await this._offListener();
      this.stickerStore = this._createStickerStoreResult("failed", "功能未启用");
      this._broadcastStickerStoreUpdated();
    }
  }

  private async _addListener(targetPath: string) {
    // 如果路径没变且正在监听，则跳过
    if (this.watcher && this.currentListeningPath === targetPath) {
      return;
    }

    log("更新监听目录:", targetPath);

    // 重置状态
    this.initializedReady = false;
    await this._offListener();

    // 更新 rootPath
    this.stickerPacksManager.rootPath = targetPath;

    if (!targetPath) {
      this.stickerStore = this._createStickerStoreResult("failed", "请选择目录");
      this._broadcastStickerStoreUpdated();
      this.currentListeningPath = "";
      return;
    }

    try {
      // 必须使用异步的 stat 防止阻塞主进程
      const stat = await fs.promises.stat(targetPath);
      if (!stat.isDirectory()) {
        this.stickerStore = this._createStickerStoreResult("failed", "路径无效");
        this._broadcastStickerStoreUpdated();
        this.currentListeningPath = "";
        return;
      }

      this.currentListeningPath = targetPath;
      this.stickerStore = this._createStickerStoreResult("info", "扫描表情中...");
      this._broadcastStickerStoreUpdated();

      this.watcher = chokidar.watch(targetPath, {
        ignoreInitial: false,
        depth: 10, // 限制目录深度，防止过度扫描子目录导致性能问题
      });

      // 监听 ready 事件来放行 IPC
      this.watcher.on("ready", () => {
        log("首次扫描完成");
        this.initializedReady = true;
        this._notifyStickerStoreUpdated();
      });

      this.watcher.on("all", (event, path) => {
        // 初始扫描时避免疯狂日志刷屏卡顿
        if (this.initializedReady) {
          log("文件变化", event, path);
        }

        this.stickerPacksManager.onEvent(event, path);

        if (this.initializedReady) {
          this._notifyStickerStoreUpdated();
        }
      });

      this.watcher.on("error", async (err: any) => {
        log("监听失败", err);
        await this._offListener();
        this.stickerStore = this._createStickerStoreResult("failed", `监听文件夹失败: ${err.message}`);
        this.currentListeningPath = "";
        this._broadcastStickerStoreUpdated();
      });
    } catch (err: any) {
      log("监听失败", err);
      await this._offListener();
      this.stickerStore = this._createStickerStoreResult("failed", `监听文件夹失败: ${err.message}`);
      this.currentListeningPath = "";
      this._broadcastStickerStoreUpdated();
    }
  }

  private async _offListener() {
    // if (!this.watcher) return;
    // log("关闭监听");
    this.initializedReady = false;
    const oldWatcher = this.watcher;
    this.watcher = null;
    this.currentListeningPath = ""; // 清空路径状态

    // 重置 stickerStore
    this.stickerStore = this._createStickerStoreResult("failed", "监听已关闭");
    this.stickerPacksManager.clear();

    await oldWatcher?.close();
  }

  private _createStickerStoreResult(status: "success", stickerPacks: StickerPack[]): StickerStore;
  private _createStickerStoreResult(status: "info" | "failed", msg: string): StickerStore;
  private _createStickerStoreResult(status: "success" | "info" | "failed", arg: StickerPack[] | string): StickerStore {
    log("创建 stickerStore", status, arg);
    return {
      status,
      ...(status === "success" ? { stickerPacks: arg } : { msg: arg }),
    } as StickerStore;
  }
}

const localStickers = new LocalStickers();

export { localStickers };
