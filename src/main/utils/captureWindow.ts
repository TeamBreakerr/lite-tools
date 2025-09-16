import type { BrowserWindow } from "electron";

let mainWindow: BrowserWindow | null = null;
let settingWindow: BrowserWindow | null = null;

function captureWindow(window: BrowserWindow) {
  window.webContents.on("did-stop-loading", () => {
    if (window.webContents.getURL().indexOf("#/main/message") !== -1) {
      mainWindow = window;
    }
    if (window.webContents.getURL().indexOf("#/setting/settings/common") !== -1) {
      settingWindow = window;
    }
  });
}
export { captureWindow, mainWindow, settingWindow };
