import type { BrowserWindow } from "electron";
import { createLogger } from "@/main/utils/createLogger";

const log = createLogger("windowTracker");

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

function trackWindow(window: BrowserWindow) {
  window.once("closed", () => {
    if (window === mainWindow) {
      mainWindow = null;
      log("主窗口已释放");
    } else if (window === settingsWindow) {
      settingsWindow = null;
      log("设置窗口已释放");
    }
  });

  window.webContents.on("did-stop-loading", () => {
    const url = window.webContents.getURL();
    
    if (url.includes("#/main/message")) {
      mainWindow = window;
    } else if (url.includes("#/setting/settings/common")) {
      settingsWindow = window;
    }
  });
}

export { trackWindow, mainWindow, settingsWindow };