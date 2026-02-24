import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import chokidar from "chokidar";
import { createLogger } from "@/main/utils/createLogger";
import { globalBroadcast } from "@/main/utils/globalBroadcast";
import type { FSWatcher } from "chokidar";
import type { StickerStore } from "@/common/types/localStickers";

import { configManager } from "@/main/modules/configManager";

const log = createLogger("localStickers");

class LocalStickers {
  private initialized = false;
  private watcher: FSWatcher | null = null;
  private currentListeningPath = "";
  private readyPromise: Promise<void> = Promise.resolve(); // 赋初始值，防止在未初始化时被 await
  private resolveReady: () => void = () => {};
  private stickerStore = this.createEmptyStickerStore();

  constructor() {
    this.createReadyPromise();
  }

  setup() {
    this.init();
    // 使用箭头函数绑定 this
    configManager.onConfigUpdate((config) => this.update(config));
    this.update(configManager.value);
  }

  private init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bindIpcMain();
  }

  private bindIpcMain() {
    ipcMain.handle("lite_tools.getStickerStore", async (event, data): Promise<StickerStore> => {
      if (configManager.value.localStickers.enabled) {
        await this.readyPromise;
        return this.stickerStore;
      } else {
        return this.createEmptyStickerStore("未启用本地表情");
      }
    });
  }

  private createReadyPromise() {
    const { promise, resolve } = Promise.withResolvers<void>();
    this.readyPromise = promise;
    this.resolveReady = resolve;
  }

  private async update(config: Config) {
    if (config.localStickers.enabled) {
      await this.addListener(config.localStickers.path);
    } else {
      await this.offListener();
    }
  }

  private async addListener(targetPath: string) {
    if (!targetPath) return;

    // 如果路径没变且正在监听，则跳过
    if (this.watcher && this.currentListeningPath === targetPath) return;

    // 如果之前有监听器，先彻底关闭
    await this.offListener();

    try {
      // 必须使用异步的 stat 防止阻塞主进程
      const stat = await fs.promises.stat(targetPath);
      if (!stat.isDirectory()) {
        this.stickerStore = this.createEmptyStickerStore("路径无效");
        this.broadcastStickerUpdate();
        return;
      }

      this.currentListeningPath = targetPath;
      this.createReadyPromise(); // 重新开启监听时，重置 ready 状态

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
        this.resolveReady();
      });

      this.watcher.on("all", (event, path) => {
        log("文件变化", event, path);
        // TODO: 这里需要实现实际的构建 stickerStore 逻辑

      });

      this.watcher.on("error", (err: any) => {
        log("监听失败", err);
        // 如果报错了，也要让挂起的 IPC 返回，避免前端死锁
        this.stickerStore = this.createEmptyStickerStore(`监听文件夹失败: ${err.message}`);
        this.broadcastStickerUpdate();
        this.resolveReady();
      });
    } catch (err: any) {
      log("监听失败", err);
      // 如果报错了，也要让挂起的 IPC 返回，避免前端死锁
      this.stickerStore = this.createEmptyStickerStore(`监听文件夹失败: ${err.message}`);
      this.broadcastStickerUpdate();
      this.resolveReady();
    }
  }

  private async offListener() {
    if (!this.watcher) return;
    const oldWatcher = this.watcher;
    this.watcher = null;
    this.currentListeningPath = ""; // 清空路径状态

    // 重置 stickerStore
    this.stickerStore = this.createEmptyStickerStore("监听已关闭");
    this.broadcastStickerUpdate();

    // 如果关闭时处于未 ready 状态，立刻放行，防止旧的 IPC 挂起
    this.resolveReady();

    await oldWatcher.close();
  }

  private broadcastStickerUpdate() {
    globalBroadcast("lite_tools.stickerStoreUpdated", this.stickerStore);
  }

  private createEmptyStickerStore(errMsg?: string): StickerStore {
    return {
      recent: [],
      stickers: [],
      errMsg,
    };
  }
}

const localStickers = new LocalStickers();

export { localStickers };
