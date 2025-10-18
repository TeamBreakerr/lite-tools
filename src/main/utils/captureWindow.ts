import type { BrowserWindow } from "electron";

let mainWindow: BrowserWindow | null = null;
let settingWindow: BrowserWindow | null = null;

function captureWindow(window: BrowserWindow) {
  window.webContents.on("did-stop-loading", () => {
    if (window.webContents.getURL().indexOf("#/main/message") !== -1) {
      mainWindow = window;
      handleWindowClose(window);
    }
    if (window.webContents.getURL().indexOf("#/setting/settings/common") !== -1) {
      settingWindow = window;
      handleWindowClose(window);
    }
  });
}

function handleWindowClose(window: BrowserWindow) {
  window.once("close", () => {
    if (window === mainWindow) mainWindow = null;
    else if (window === settingWindow) settingWindow = null;
  });
}

export { captureWindow, mainWindow, settingWindow };
