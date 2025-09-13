import { setupConfig } from "@/main/modules/config";
import { createLogger } from "@/main/utils/createLogger";
import { setupIpcInterceptor } from "@/main/modules/IpcInterceptor";
import type { BrowserWindow } from "electron";

const log = createLogger("lt_main");

log("插件启动");

const unSubscribe = IpcInterceptor.onIpcSendEvents("nodeIKernelSessionListener/onSessionInitComplete", (...args) => {
  setupConfig(args[2].payload.uid);
  setupIpcInterceptor();
  unSubscribe();
});

function onBrowserWindowCreated(browserWindow: BrowserWindow) {}

if ("qwqnt" in globalThis) {
  qwqnt.main.hooks.whenBrowserWindowCreated.peek(onBrowserWindowCreated);
}

// 错误处理
process.on("uncaughtException", (e) => {
  log("主进程出错", e, e?.stack);
});

module.exports = { onBrowserWindowCreated };
