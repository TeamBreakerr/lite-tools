import type { Config } from "@common/types";
import type { LiteTools } from "@preload/index";

declare const lite_tools: LiteTools;
type ConfigListener = (config: Config) => void;

class ConfigStore {
  private listeners: Set<ConfigListener> = new Set();
  private readyPromise: Promise<void>;

  config!: Config;

  constructor() {
    // 异步获取初始配置
    this.readyPromise = lite_tools.getConfig().then((config: Config) => {
      this.config = config;

      // 订阅主进程广播的更新
      lite_tools.onConfigChange((update: Config) => {
        Object.assign(this.config, update);
        this.notify();
      });
    });
  }

  async ready() {
    return this.readyPromise;
  }

  setConfig(update: Config) {
    Object.assign(this.config, update);
    lite_tools.updateConfig(this.config);
  }

  onChange(listener: ConfigListener) {
    if (!this.listeners.has(listener)) {
      this.listeners.add(listener);
    }
  }

  offChange(listener: ConfigListener) {
    if (this.listeners.has(listener)) {
      this.listeners.delete(listener);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.config));
  }
}

export default new ConfigStore();
