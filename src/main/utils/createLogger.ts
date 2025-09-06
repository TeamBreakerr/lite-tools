export function createLogger(moduleName: string) {
  let log = (...args: any) => {
    console.log(`[${moduleName}]`, ...args);
  };
  if ("Logs" in globalThis) {
    log = new Logs(moduleName);
  }
  return log;
}
