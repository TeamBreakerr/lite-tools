const logList: { name: string; log: any }[] = [];
const errorList: { type: string; msg: any }[] = [];

// 临时参数
const options = {
  debug: {
    console: true,
  },
};

window.lt_logs = () => {
  if (options.debug.console) {
    logList.forEach((el) => {
      console.log(`[${el.name}]`, ...el.log);
    });
    console.log("[日志模块]", "log-end");
  } else {
    console.log("[日志模块]", "当前没有启用debug");
  }
};

window.lt_errors = () => {
  if (options.debug.console) {
    errorList.forEach((el) => {
      console.log(`[${el.type}]`, ...el.msg);
    });
    console.log("[日志模块]", "error-end");
  } else {
    console.log("[日志模块]", "当前没有启用debug");
  }
};

// 捕获全局错误
type ErrorHandler = (error: any) => void;
function setupGlobalErrorHandler(handler: ErrorHandler) {
  // 捕获同步错误
  window.onerror = (message, source, lineno, colno, error) => {
    handler({ type: "onerror", msg: [message, source, lineno, colno, error] });
  };

  // 捕获资源加载错误
  window.addEventListener(
    "error",
    (event) => {
      handler({ type: "resourceError", msg: event });
    },
    true // 必须 true 才能捕获资源加载错误
  );

  // 捕获未处理的 Promise 异常
  window.addEventListener("unhandledrejection", (event) => {
    handler({ type: "unhandledrejection", msg: event.reason });
  });
}

setupGlobalErrorHandler((error) => {
  errorList.push(error);
});

class Logs {
  moduleName: string;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  logToConsole = (...args: any[]) => {
    if (options.debug.console) {
      console.log(`[${this.moduleName}]`, ...args);
      this.saveToLogList(args);
    }
  };

  private saveToLogList(logData: any[]) {
    logList.push({
      name: this.moduleName,
      log: logData,
    });
  }
}

export default function createLogger(moduleName: string) {
  return new Logs(moduleName).logToConsole;
}
