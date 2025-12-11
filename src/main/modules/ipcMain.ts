import { ipcMain, dialog, BrowserWindow } from "electron";
import { mainWindow } from "@/main/utils/captureWindow";

function setupIpcMain() {
  // 返回窗口id
  ipcMain.on("lite_tools.getWebContentId", (event) => {
    event.returnValue = event.sender.id;
  });
  ipcMain.on("lite_tools.broadcast", (event, channelName, payload) => {
    if (mainWindow && mainWindow?.webContents?.send) {
      mainWindow.webContents.send("lite_tools.broadcast", channelName, payload);
    }
  });
  ipcMain.handle("lite_tools.showOpenDialog", (event, options: Electron.OpenDialogOptions) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return dialog.showOpenDialog(win!, options);
  });
}

export { setupIpcMain };
