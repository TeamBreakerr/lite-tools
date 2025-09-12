import { config } from "@/main/modules/config";

class LocalLogger {
  constructor(private moduleName: string) {}
  log(...args: any[]) {
    console.log(`[${this.moduleName}]`, ...args);
  }
}

function createLogger(moduleName: string) {
  const logsInstance = "Logs" in globalThis ? new Logs(moduleName) : new LocalLogger(moduleName);
  return (...args: any[]) => {
    if (config?.debug?.mainConsole !== false) {
      logsInstance.log(...args);
    }
  };
}

export { createLogger };
