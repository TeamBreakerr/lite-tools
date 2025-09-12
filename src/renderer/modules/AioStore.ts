import { createLogger } from "../utils/logs";

const log = createLogger("captureAIO");

class AioStore {
  private listeners: Set<Function> = new Set();
  private readyPromise: Promise<void>;
  private captureResolve: () => void;
  private curAioData: any;

  constructor() {
    const { resolve, promise } = Promise.withResolvers<void>();
    log("初始化");
    this.readyPromise = promise;
    this.captureResolve = resolve;
    this.setupCaptureAIO();
  }

  get ready() {
    return this.readyPromise;
  }

  async setupCaptureAIO(): Promise<void> {
    while (true) {
      const vueInstance = document.querySelector(".aio .vue-component")?.__VUE__;
      log("查询中", vueInstance);
      if (vueInstance) {
        const instance = vueInstance.find((instance) => instance?.proxy?.aioStore || instance?.proxy?.commonAioStore);
        const aioStore = instance?.proxy?.aioStore || instance?.proxy?.commonAioStore;
        if (aioStore) {
          this.handleCurAioData(aioStore);
          this.captureResolve();
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  handleCurAioData(aioStore: any) {
    this.curAioData = aioStore?.curAioData;
    Object.defineProperty(aioStore, "curAioData", {
      enumerable: true,
      configurable: true,
      get: () => {
        return this.curAioData;
      },
      set: (newVal) => {
        log("curAioData更新", newVal);
        this.curAioData = newVal;
        this.notify();
      },
    });
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.curAioData));
  }

  onChange(listener: (val: any) => void) {
    if (!this.listeners.has(listener)) {
      this.listeners.add(listener);
    }
    return () => this.offChange(listener);
  }

  offChange(listener: (val: any) => void) {
    if (this.listeners.has(listener)) {
      this.listeners.delete(listener);
    }
  }
}

export { AioStore };
