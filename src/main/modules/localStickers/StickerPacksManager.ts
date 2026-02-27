import path from "node:path";
import type { StickerPack } from "@/common/types/localStickers";

// 定义支持的图片后缀
const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

// 定义内部使用的存储结构：Sticker 列表改为 Set<string>
interface InternalStickerPack {
  title: string;
  index?: number;
  icon?: string;
  dirPath: string;
  stickerPaths: Set<string>; // 内部只存路径
}

class StickerPacksManager {
  private stickerPacks: Map<string, InternalStickerPack> = new Map();

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

  private ensurePackExists(dirPath: string): InternalStickerPack {
    let pack = this.stickerPacks.get(dirPath);
    if (!pack) {
      pack = {
        title: path.basename(dirPath),
        dirPath: dirPath,
        index: 0,
        stickerPaths: new Set<string>(), // 初始化 Set
      };
      this.stickerPacks.set(dirPath, pack);
    }
    return pack;
  }

  private addSticker(stickerPath: string) {
    const dirPath = path.dirname(stickerPath);
    const pack = this.ensurePackExists(dirPath);
    if (pack.stickerPaths.size === 0 && !pack.icon) {
      pack.icon = stickerPath;
    }
    pack.stickerPaths.add(stickerPath);
  }

  private deleteSticker(stickerPath: string) {
    const dirPath = path.dirname(stickerPath);
    const pack = this.stickerPacks.get(dirPath);
    if (pack) {
      pack.stickerPaths.delete(stickerPath);
    }
  }

  /**
   * 在导出时进行数据转换：Set<string> -> Sticker[]
   */
  public getPackList(): StickerPack[] {
    return Array.from(this.stickerPacks.values())
      .filter((pack) => pack.stickerPaths.size > 0)
      .map((pack) => ({
        title: pack.title,
        dirPath: pack.dirPath,
        index: pack.index,
        icon: pack.icon,
        // 在这里统一生成前端需要的对象结构
        stickers: Array.from(pack.stickerPaths).map((filePath) => ({
          name: path.basename(filePath, path.extname(filePath)),
          path: filePath,
        })),
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  public clear() {
    this.stickerPacks.clear();
  }
}

export { StickerPacksManager };
