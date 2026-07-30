import { configStore } from "@/renderer/modules/configStore";

let logList: { name: string; log: any[] }[] = [];
let logMap: Map<string, any[]> = new Map();
let filterKey: string = "";

let config: Config | null = null;

// 异步初始化 config
const logsReady = (async () => {
  await configStore.ready;
  config = configStore.value;
})();

configStore.onChange((config) => {
  if (!config.debug.console) {
    logList = [];
    logMap = new Map();
  }
});

// 日志类
class Logs {
  moduleName: string;
  private cachedLogs: any[][] = [];

  constructor(moduleName: string) {
    this.moduleName = moduleName;
    logMap.set(moduleName, []);
  }

  logToConsole = (...args: any[]) => {
    if (!config) {
      this.cachedLogs.push(args);
      return;
    }

    if (config.debug.console) {
      if (!filterKey) {
        console.log(`[${this.moduleName}]`, ...args);
      } else if (filterKey === this.moduleName) {
        console.log(`[${this.moduleName}]`, ...args);
      }
      this.saveToLogList(args);
    }

    if (this.cachedLogs.length > 0) {
      if (!config.debug.console) {
        this.cachedLogs = [];
        return;
      }
      for (const logArgs of this.cachedLogs) {
        if (!filterKey) {
          console.log(`[${this.moduleName}]`, ...args);
        } else if (filterKey === this.moduleName) {
          console.log(`[${this.moduleName}]`, ...args);
        }
        this.saveToLogList(logArgs);
      }
      this.cachedLogs = [];
    }
  };

  private saveToLogList(logData: any[]) {
    logMap.get(this.moduleName)!.push(logData);
    logList.push({ name: this.moduleName, log: logData });
  }
}

// 全局函数
window.ltlog = {
  all() {
    logsReady.then(() => {
      if (config?.debug.console) {
        for (const el of logList) {
          console.log(`[${el.name}]`, ...el.log);
        }
        console.log("[日志模块]", "log-end");
      } else {
        console.log("[日志模块]", "功能未启用");
      }
    });
    return "log-end";
  },
  ls() {
    if (config?.debug.console) {
      Array.from(logMap.keys()).map((item) => {
        console.log(`${item}(${logMap.get(item)?.length})`);
      });
    } else {
      console.log("[日志模块]", "功能未启用");
    }
  },
  filter: (key: string) => {
    if (config?.debug.console) {
      if (!logMap.has(key)) {
        console.log(`不存在 ${key}`);
      }
      Array.from(logMap.get(key) || []).forEach((log) => console.log(`[${key}]`, log));
    } else {
      console.log("[日志模块]", "功能未启用");
    }
  },
  setFilter(key: string) {
    filterKey = key;
    if (key) {
      console.log(`日志过滤器已设置为 ${key}`);
    } else {
      console.log(`日志过滤器已关闭`);
    }
  },
};

export function createLogger(moduleName: string) {
  return new Logs(moduleName).logToConsole;
}
