import { ipcMain } from "electron";
import { extname } from "path";
import { rangesServer } from "@/main/utils/rangesServer";
import { configManager } from "@/main/modules/configManager";
import { globalBroadcast } from "@/main/utils/globalBroadcast";
import { createLogger } from "@/main/utils/createLogger";
import type { WallpaperData } from "@/common/types/wallpaper";

const log = createLogger("wallpaper");

const wallpaperData: WallpaperData = {
  type: "image",
  path: "",
  url: "",
};

const imgExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".avif"];
const videoExt = [".mp4", ".webm"];

let currentPath: string | null = null;

async function setupWallpaper() {
  await configManager.ready;
  configManager.onConfigUpdate(updateWallpaper);
  ipcMain.on("lite_tools.getWallpaperData", () => {
    log("获取背景数据", wallpaperData);
    getWallpaperData();
  });
}

async function getWallpaperData() {
  const config = configManager.value as Config;
  if (currentPath != config.interface.wallpaper.path) {
    currentPath = config.interface.wallpaper.path;
    if (imgExt.includes(extname(config.interface.wallpaper.path).toLocaleString())) {
      wallpaperData.type = "image";
      wallpaperData.path = config.interface.wallpaper.path;
      log("更新背景图片", wallpaperData);
    } else if (videoExt.includes(extname(config.interface.wallpaper.path))) {
      log("启动http服务");
      wallpaperData.type = "video";
      rangesServer.setFilePath(config.interface.wallpaper.path);
      const port = await rangesServer.startServer();
      const name = config.interface.wallpaper.path.split("/").pop()!;
      wallpaperData.url = `http://localhost:${port}/${name}`;
      log("更新背景视频", wallpaperData);
    } else {
      wallpaperData.type = "image";
      wallpaperData.path = "";
      log("不支持的文件格式", wallpaperData, config.interface.wallpaper);
    }
  }
  globalBroadcast("lite_tools.wallpaperChanged", wallpaperData);
}

function updateWallpaper() {
  const config = configManager.value as Config;
  if (!config.interface.wallpaper.enabled) {
    currentPath = null;
    rangesServer.stopServer();
  }
}

export { setupWallpaper };
