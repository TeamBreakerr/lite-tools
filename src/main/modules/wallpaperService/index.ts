import { ipcMain } from "electron";
import { extname, basename } from "path";
import { configManager } from "@/main/modules/configManager";
import { globalBroadcast } from "@/main/utils/globalBroadcast";
import { createLogger } from "@/main/utils/createLogger";
import { videoStreamServer } from "./videoStreamServer";

import type { WallpaperData } from "@/common/types/wallpaper";

const log = createLogger("wallpaper");

class WallpaperService {
  private wallpaperData: WallpaperData = {
    type: "image",
    path: "",
    url: "",
  };
  private readonly IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".avif"];
  private readonly VIDEO_EXTENSIONS = [".mp4", ".webm"];
  private currentPath: string | null = null;

  setup() {
    configManager.onConfigUpdate(this.teardownIfDisabled.bind(this));
    ipcMain.on("lite_tools.getWallpaperData", () => {
      log("获取背景数据", this.wallpaperData);
      this.syncWallpaperState();
    });
  }
  teardownIfDisabled() {
    const config = configManager.value as Config;
    if (!config.interface.wallpaper.enabled) {
      this.currentPath = null;
      videoStreamServer.stopServer();
    }
  }
  async syncWallpaperState() {
    const config = configManager.value as Config;
    if (this.currentPath != config.interface.wallpaper.path) {
      this.currentPath = config.interface.wallpaper.path;
      if (this.IMAGE_EXTENSIONS.includes(extname(config.interface.wallpaper.path).toLocaleString())) {
        this.wallpaperData.type = "image";
        this.wallpaperData.path = config.interface.wallpaper.path;
        log("更新背景图片", this.wallpaperData);
      } else if (this.VIDEO_EXTENSIONS.includes(extname(config.interface.wallpaper.path))) {
        log("启动http服务");
        this.wallpaperData.type = "video";
        videoStreamServer.setFilePath(config.interface.wallpaper.path);
        const port = await videoStreamServer.startServer();
        const fileName = basename(config.interface.wallpaper.path);
        this.wallpaperData.url = `http://localhost:${port}/${fileName}`;
        log("更新背景视频", this.wallpaperData);
      } else {
        this.wallpaperData.type = "image";
        this.wallpaperData.path = "";
        log("不支持的文件格式", this.wallpaperData, config.interface.wallpaper);
      }
    }
    globalBroadcast("lite_tools.wallpaperChanged", this.wallpaperData);
  }
}

const wallpaperService = new WallpaperService();

export { wallpaperService };
