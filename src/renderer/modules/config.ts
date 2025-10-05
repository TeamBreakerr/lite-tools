import type { Config } from "@/types/Config";
import type { LiteTools } from "@/preload/index";

declare const lite_tools: LiteTools;
type ConfigListener = (config: Config) => void;

enum InitStatus {
  Uninitialized,
  Initializing,
  Initialized,
}

class ConfigStore {
  private listeners: Set<ConfigListener> = new Set();
  private readyPromise: Promise<void>;
  private resolveReady: () => void;
  private status = InitStatus.Uninitialized;

  config!: Config;

  constructor() {
    const { promise, resolve } = Promise.withResolvers<void>();
    this.readyPromise = promise;
    this.resolveReady = resolve;
  }

  get ready() {
    if (this.status === InitStatus.Uninitialized && lite_tools.isInitialized()) {
      this.status = InitStatus.Initializing;
      this.setupConfig();
    }
    return this.readyPromise;
  }

  private async setupConfig() {
    const config = await lite_tools.getConfig();
    this.config = config;

    lite_tools.onConfigChange((config) => {
      Object.assign(this.config, config);
      this.notify();
    });

    this.status = InitStatus.Initialized;
    this.resolveReady();
  }

  setConfig(update: Config) {
    Object.assign(this.config, update);
    lite_tools.updateConfig(this.config);
  }

  onChange(listener: ConfigListener) {
    if (!this.listeners.has(listener)) {
      this.listeners.add(listener);
    }
    return () => this.offChange(listener);
  }

  offChange(listener: ConfigListener) {
    this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.config));
  }
}

const configStore = new ConfigStore();

export { configStore };
