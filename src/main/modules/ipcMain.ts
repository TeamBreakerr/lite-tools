import { ipcMain } from "electron";

function setupIpcMain() {
  // 返回窗口id
  ipcMain.on("lite_tools.getWebContentId", (event) => {
    event.returnValue = event.sender.id;
  });
}

export { setupIpcMain };
