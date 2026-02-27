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
  private stickerStore = this.createStickerStoreResult("info", "初始化中...");
  private stickerPacksManager: StickerPacksManager = new StickerPacksManager();

  constructor() {}

  private notifyStickerStoreUpdated = createThrottledDispatcher(() => {
    this.stickerStore = this.createStickerStoreResult("success", this.stickerPacksManager.getPackList());
    this.broadcastStickerStoreUpdated();
  }, 1100);

  private broadcastStickerStoreUpdated() {
    log("通知更新", this.stickerStore);
    globalBroadcast("lite_tools.stickerStore.updated", this.stickerStore);
  }

  setup() {
    this.bindIpcMain();
    this.update(configManager.value);
    configManager.onConfigUpdate((config) => this.update(config));
    log("初始化完成");
  }

  private bindIpcMain() {
    ipcMain.handle("lite_tools.stickerStore.get", async (): Promise<StickerStore> => {
      if (!configManager.value.localStickers.enabled) {
        return this.createStickerStoreResult("failed", "功能未启用");
      }
      return this.stickerStore;
    });
  }

  private async update(config: Config) {
    if (config.localStickers.enabled) {
      await this.addListener(config.localStickers.path);
    } else {
      await this.offListener();
    }
  }

  private async addListener(targetPath: string) {
    log("更新监听目录:", targetPath);

    // 如果路径没变且正在监听，则跳过
    if (this.watcher && this.currentListeningPath === targetPath) {
      log("路径无变化");
      return;
    }

    // 重置状态
    this.initializedReady = false;
    await this.offListener();

    if (!targetPath) {
      this.stickerStore = this.createStickerStoreResult("failed", "请选择目录");
      this.broadcastStickerStoreUpdated();
      this.currentListeningPath = "";
      return;
    }

    try {
      // 必须使用异步的 stat 防止阻塞主进程
      const stat = await fs.promises.stat(targetPath);
      if (!stat.isDirectory()) {
        this.stickerStore = this.createStickerStoreResult("failed", "路径无效");
        this.broadcastStickerStoreUpdated();
        this.currentListeningPath = "";
        return;
      }

      this.currentListeningPath = targetPath;
      this.stickerStore = this.createStickerStoreResult("info", "扫描表情中...");
      this.broadcastStickerStoreUpdated();

      this.watcher = chokidar.watch(targetPath, {
        ignoreInitial: false,
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100,
        },
      });

      // 监听 ready 事件来放行 IPC
      this.watcher.on("ready", () => {
        log("首次扫描完成");
        this.initializedReady = true;
        this.notifyStickerStoreUpdated();
      });

      this.watcher.on("all", (event, path) => {
        log("文件变化", event, path);
        // TODO: 这里需要实现实际的构建 stickerStore 逻辑
        this.stickerPacksManager?.onEvent(event, path);
        if (this.initializedReady) {
          this.notifyStickerStoreUpdated();
        }
      });

      this.watcher.on("error", (err: any) => {
        log("监听失败", err);
        // 如果报错了，也要让挂起的 IPC 返回，避免前端死锁
        this.stickerStore = this.createStickerStoreResult("failed", `监听文件夹失败: ${err.message}`);
        this.currentListeningPath = "";
        this.broadcastStickerStoreUpdated();
        this.offListener();
      });
    } catch (err: any) {
      log("监听失败", err);
      // 如果报错了，也要让挂起的 IPC 返回，避免前端死锁
      this.stickerStore = this.createStickerStoreResult("failed", `监听文件夹失败: ${err.message}`);
      this.currentListeningPath = "";
      this.broadcastStickerStoreUpdated();
      this.offListener();
    }
  }

  private async offListener() {
    // if (!this.watcher) return;
    // log("关闭监听");
    this.initializedReady = false;
    const oldWatcher = this.watcher;
    this.watcher = null;
    this.currentListeningPath = ""; // 清空路径状态

    // 重置 stickerStore
    this.stickerStore = this.createStickerStoreResult("failed", "监听已关闭");
    this.stickerPacksManager.clear();

    await oldWatcher?.close();
  }

  private createStickerStoreResult(status: "success", stickerPacks: StickerPack[]): StickerStore;
  private createStickerStoreResult(status: "info" | "failed", msg: string): StickerStore;
  private createStickerStoreResult(status: "success" | "info" | "failed", arg: StickerPack[] | string): StickerStore {
    log("创建 stickerStore", status, arg);
    return {
      status,
      ...(status === "success" ? { stickerPacks: arg } : { msg: arg }),
    } as StickerStore;
  }
}

const localStickers = new LocalStickers();

export { localStickers };
