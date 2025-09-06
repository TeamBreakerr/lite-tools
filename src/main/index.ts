import { setupConfig } from "./modules/config";
import createLogger from "./utils/createLogger";
import type { BrowserWindow } from "electron";

if (!("IpcInterceptor" in globalThis)) {
  throw new Error("请安装前置插件 ipc_interceptor");
}

const log = createLogger("lt_main");

log("插件启动");

const unSubscribe = IpcInterceptor.onIpcSendEvents("nodeIKernelSessionListener/onSessionInitComplete", (...args) => {
  log("获取到UID", args);
  setupConfig(args[2].payload.uid);
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

export default { onBrowserWindowCreated };
