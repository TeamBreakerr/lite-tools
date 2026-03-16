import path from "node:path";
import fs from "node:fs";
import type { StickerPack } from "@/common/types/localStickers";

// 定义支持的图片后缀
const SUPPORTED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"]);

// 定义内部使用的存储结构：Sticker 列表改为 Set<string>
interface InternalStickerPack {
  title: string;
  index: number;
  icon?: string;
  dirPath: string;
  stickerPaths: Set<string>; // 内部只存路径
}

interface StickerConfig {
  title: string;
  index: number;
  icon?: string;
}

class StickerPacksManager {
  private stickerPacks: Map<string, InternalStickerPack> = new Map();

  public rootPath!: string;

  constructor() {}

  public onEvent(eventName: string, _filePath: string) {
    const filePath = _filePath.replace(/\\/g, "/");
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
      // 先查找目录下是否有sticker.json配置文件
      const configPath = path.join(dirPath, "sticker.json");
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as StickerConfig;
        pack = {
          title: config.title || this.baseName(dirPath),
          index: config.index || 0,
          icon: config.icon || undefined,
          dirPath: dirPath,
          stickerPaths: new Set<string>(),
        };
      } else {
        pack = {
          title: this.baseName(dirPath),
          index: 0,
          icon: undefined,
          dirPath: dirPath,
          stickerPaths: new Set<string>(),
        };
        this.writeConfig(pack);
      }

      this.stickerPacks.set(dirPath, pack);
    }
    return pack;
  }

  private baseName(stickerPath: string) {
    if (stickerPath === this.rootPath) {
      return path.basename(stickerPath);
    }
    return stickerPath.replace(this.rootPath + "/", "");
  }

  private writeConfig(pack: InternalStickerPack) {
    const configPath = path.join(pack.dirPath, "sticker.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          title: pack.title,
          index: pack.index,
          icon: pack.icon,
        },
        null,
        2,
      ),
    );
  }

  private addSticker(stickerPath: string) {
    const dirPath = path.dirname(stickerPath);
    const pack = this.ensurePackExists(dirPath);
    pack.stickerPaths.add(stickerPath);
  }

  private deleteSticker(stickerPath: string) {
    const dirPath = path.dirname(stickerPath);
    const pack = this.stickerPacks.get(dirPath);
    if (!pack) return;
    pack.stickerPaths.delete(stickerPath);
    fs.unlinkSync(stickerPath);
    if (pack.stickerPaths.size === 0) {
      this.stickerPacks.delete(dirPath);
      return;
    }
    const baseName = path.basename(stickerPath);
    if (pack.icon === baseName) {
      pack.icon = path.basename(pack.stickerPaths.values().next().value!);
      this.writeConfig(pack);
    }
  }

  /**
   * 在导出时进行数据转换：Set<string> -> Sticker[]
   */
  public getPackList(): StickerPack[] {
    return Array.from(this.stickerPacks.values())
      .filter((pack) => pack.stickerPaths.size > 0)
      .map((pack) => {
        const stickers = Array.from(pack.stickerPaths).map((filePath) => ({
          name: path.basename(filePath, path.extname(filePath)),
          path: filePath,
        }));

        return {
          title: pack.title,
          dirPath: pack.dirPath,
          index: pack.index,
          icon: (pack.icon ? path.join(pack.dirPath, pack.icon) : stickers[0]?.path).replace(/\\/g, "/"),
          stickers,
        };
      });
  }

  public updatePackConfig(path: string, key: "index" | "title" | "icon", value: string | number) {
    if (["index", "title", "icon"].includes(key)) {
      const pack = this.stickerPacks.get(path);
      if (pack) {
        (pack as any)[key] = value;
        this.writeConfig(pack);
      }
    }
  }

  public clear() {
    this.stickerPacks.clear();
  }
}

export { StickerPacksManager };
