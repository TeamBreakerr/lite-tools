import type { BrowserWindow } from "electron";
import { createLogger } from "@/main/utils/createLogger";

const log = createLogger("windowTracker");

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

function trackWindow(window: BrowserWindow) {
  // 1. 独立监听销毁事件：使用 'closed' 而不是 'close'
  // 使用 .once 确保即使发生意外也只触发一次
  window.once("closed", () => {
    if (window === mainWindow) {
      mainWindow = null;
      log("主窗口已释放");
    } else if (window === settingsWindow) {
      settingsWindow = null;
      log("设置窗口已释放");
    }
  });

  // 2. 监听加载完成来识别身份（每次重载都会触发，但不会重复绑定 closed 事件）
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