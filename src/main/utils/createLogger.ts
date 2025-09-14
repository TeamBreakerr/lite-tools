import { config } from "@/main/modules/config";

class LocalLogger {
  constructor(private moduleName: string) {}
  log = (...args: any[]) => {
    if (config?.debug?.mainConsole !== false) {
      console.log(`[${this.moduleName}]`, ...args);
    }
  };
}

function createLogger(moduleName: string) {
  const logsInstance = "Logs" in globalThis ? new Logs(moduleName) : new LocalLogger(moduleName).log;
  return (...args: any[]) => {
    if (config?.debug?.mainConsole !== false) {
      logsInstance(...args);
    }
  };
}

export { createLogger };
