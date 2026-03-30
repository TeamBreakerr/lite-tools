import { ipcMain, BrowserWindow } from "electron";
import { PLUGIN_DIR } from "@/main/utils/pluginPaths";
import path from "node:path";

let devWindow: Electron.BrowserWindow | null = null;

function setupDevWindow() {
  ipcMain.on("lite_tools.openDevWindow", (event) => {
    openRecallMsgList();
  });
}

function openRecallMsgList() {
  if (devWindow && devWindow.isDestroyed() === false) {
    devWindow.webContents.focus();
  } else {
    devWindow = new BrowserWindow({
      width: 800,
      height: 600,
      autoHideMenuBar: true,
      webPreferences: {
        // 不是错误，需要绑定一个预加载脚本才能通过loader注入流程
        preload: path.join(PLUGIN_DIR, `/dist/preload/recallMsgViewer.js`),
      },
    });
    devWindow.setMenuBarVisibility(false);
    const htmlPath = path.join(PLUGIN_DIR, `/dist/renderer/pages/devWindow/index.html`);
    devWindow.loadFile(htmlPath);
    devWindow.webContents.on("before-input-event", (_, input) => {
      if (input.key == "F5" && input.type == "keyUp") {
        devWindow!.loadFile(htmlPath);
      }
    });
    devWindow.on("closed", () => {
      devWindow = null;
    });
  }
}

export { setupDevWindow };
