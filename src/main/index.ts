import { configManager } from "@/main/modules/configManager";
import { createLogger } from "@/main/utils/createLogger";
import { setupHandleMessages } from "@/main/modules/handleMessages";
import { setupIpcMain } from "@/main/modules/ipcMain";
import { setupSideBar } from "@/main/modules/sideBar";
import { captureWindow } from "@/main/utils/captureWindow";
import { setupIpcInterceptor } from "@/main/modules/ipcInterceptor";
import { wallpaperService } from "@/main/modules/WallpaperService";
import { setupDevWindow } from "@/main/modules/devWindow";
import type { BrowserWindow } from "electron";

const log = createLogger("lt_main");

log("插件启动");

// 监听登录成功后读取配置文件
const unSubscribe = IpcInterceptor.onIpcSendEvents("nodeIKernelSessionListener/onSessionInitComplete", (...args) => {
  setupMain(args[2].payload.uid);
  unSubscribe();
});

// 初始化
function setupMain(uid: string) {
  try {
    configManager.setup(uid);
    setupHandleMessages();
    setupIpcMain();
    setupSideBar();
    setupIpcInterceptor();
    setupDevWindow();
    wallpaperService.setup();
  } catch (err) {
    log("初始化出错", err);
  }
}

function onBrowserWindowCreated(window: BrowserWindow) {
  captureWindow(window);
}

if ("qwqnt" in globalThis) {
  qwqnt.main.hooks.whenBrowserWindowCreated.peek(onBrowserWindowCreated);
}

// 错误处理
process.on("uncaughtException", (e) => {
  log("主进程出错", e, e?.stack);
});

module.exports = { onBrowserWindowCreated };
