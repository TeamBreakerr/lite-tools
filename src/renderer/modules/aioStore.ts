import { createLogger } from "@/renderer/utils/createLogger";

const log = createLogger("captureAIO");

enum InitStatus {
  Uninitialized,
  Initializing,
  Initialized,
}

class AioStore {
  private listeners: Set<Function> = new Set();
  private readyPromise: Promise<void>;
  private resolveReady: () => void;
  private curAioData: any;
  private status = InitStatus.Uninitialized;

  constructor() {
    const { resolve, promise } = Promise.withResolvers<void>();
    this.readyPromise = promise;
    this.resolveReady = resolve;
  }

  get ready() {
    if (this.status === InitStatus.Uninitialized) {
      this.status = InitStatus.Initializing;
      this.setupCaptureAIO();
    }
    return this.readyPromise;
  }

  async setupCaptureAIO(): Promise<void> {
    log("开始初始化");
    while (true) {
      const vueInstance = document.querySelector(".aio .vue-component")?.__VUE__;
      if (vueInstance) {
        const instance = vueInstance.find((instance) => instance?.proxy?.aioStore || instance?.proxy?.commonAioStore);
        const aioStore = instance?.proxy?.aioStore || instance?.proxy?.commonAioStore;
        if (aioStore) {
          this.handleCurAioData(aioStore);
          this.status = InitStatus.Initialized;
          this.resolveReady();
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
    this.listeners.delete(listener);
  }
}

const aioStore = new AioStore();

export { aioStore };
