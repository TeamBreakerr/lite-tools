import path from "node:path";

import type { StickerPack } from "@/common/types/localStickers";

// 定义支持的图片后缀
const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

class StickerPacksManager {
  // 内部维护 Map，不直接操作外部传来的 store 引用
  private stickerPacks: Map<string, StickerPack> = new Map();

  constructor() {}

  public onEvent(eventName: string, filePath: string) {
    const ext = path.extname(filePath).toLowerCase();

    switch (eventName) {
      case "addDir":
        this.ensurePackExists(filePath);
        break;
      case "unlinkDir":
        this.stickerPacks.delete(filePath);
        break;
      case "add":
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          this.addSticker(filePath);
        }
        break;
      case "unlink":
        this.deleteSticker(filePath);
        break;
    }
  }

  private ensurePackExists(dirPath: string, title?: string): StickerPack {
    let pack = this.stickerPacks.get(dirPath);
    if (!pack) {
      pack = {
        title: title || path.basename(dirPath) || "未知分组",
        dirPath: dirPath,
        stickers: [],
      };
      this.stickerPacks.set(dirPath, pack);
    }
    return pack;
  }

  private addSticker(stickerPath: string) {
    const dirPath = path.dirname(stickerPath);
    // 自动确保目录存在（容错处理：即使 addDir 没触发也能自动创建分组）
    const pack = this.ensurePackExists(dirPath);

    // 防重处理
    if (!pack.stickers.some((s) => s.path === stickerPath)) {
      pack.stickers.push({
        name: path.basename(stickerPath),
        path: stickerPath,
      });
    }
  }

  private deleteSticker(stickerPath: string) {
    const dirPath = path.dirname(stickerPath);
    const pack = this.stickerPacks.get(dirPath);
    if (pack) {
      pack.stickers = pack.stickers.filter((s) => s.path !== stickerPath);
    }
  }

  getPackList(): StickerPack[] {
    // 过滤掉没有图片的空分组（可选）
    return Array.from(this.stickerPacks.values())
      .filter((pack) => pack.stickers.length > 0)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  clear() {
    this.stickerPacks.clear();
  }
}

export { StickerPacksManager };
