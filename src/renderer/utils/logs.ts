import configStore from "./config";
import type { Config } from "@common/types";

const logList: { name: string; log: any[] }[] = [];

let config: Config | null = null;

// 异步初始化 config
const logsReady = (async () => {
  await configStore.ready();
  config = configStore.config;
})();

// 日志类
class Logs {
  moduleName: string;
  private cachedLogs: any[][] = [];

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  logToConsole = (...args: any[]) => {
    if (!config) {
      this.cachedLogs.push(args);
      return;
    }

    if (config.debug.console) {
      console.log(`[${this.moduleName}]`, ...args);
      this.saveToLogList(args);
    }

    if (this.cachedLogs.length > 0) {
      if (!config.debug.console) {
        this.cachedLogs = [];
        return;
      }
      this.cachedLogs.forEach((logArgs) => {
        console.log(`[${this.moduleName}]`, ...logArgs);
        this.saveToLogList(logArgs);
      });
      this.cachedLogs = [];
    }
  };

  private saveToLogList(logData: any[]) {
    logList.push({ name: this.moduleName, log: logData });
  }
}

// 全局函数
window.lt_logs = () => {
  logsReady.then(() => {
    if (config?.debug.console) {
      logList.forEach((el) => console.log(`[${el.name}]`, ...el.log));
      console.log("[日志模块]", "log-end");
    } else {
      console.log("[日志模块]", "当前没有启用debug");
    }
  });
};

export function createLogger(moduleName: string) {
  return new Logs(moduleName).logToConsole;
}
