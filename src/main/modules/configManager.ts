import fs from "node:fs";
import path from "node:path";
import { dialog, ipcMain } from "electron";
import { CONFIG_DIR, DATA_DIR } from "@/main/utils/pluginPaths";
import { UserConfigRegistry } from "@/main/modules/UserConfigRegistry";
import { globalBroadcast } from "@/main/utils/globalBroadcast";
import configTemplate from "@/config/main.template.json";

type ConfigListener = (config: Config) => void;

class ConfigManager {
  private isUserSpecific = false;
  private isInitialized = false;
  private config = {} as Config;
  private defaultConfigPath = path.join(CONFIG_DIR, "config.json");
  private currentConfigPath = "";
  private userUid = "";
  private updateListeners: Set<ConfigListener> = new Set();
  private readyPromise: Promise<void>;
  private resolveReady: () => void;
  private userConfigRegistry: UserConfigRegistry;
  private _lastUpdatedConfigs: ConfigPath[] = [];

  constructor() {
    const { promise, resolve } = Promise.withResolvers<void>();
    this.readyPromise = promise;
    this.resolveReady = resolve;
    this.setupPath();
    this.setupIpcEvent();
    this.userConfigRegistry = new UserConfigRegistry(CONFIG_DIR);
  }

  private setupIpcEvent() {
    ipcMain.on("lite_tools.isUserSpecific", (event) => {
      event.returnValue = this.isUserSpecific;
    });
    ipcMain.on("lite_tools.isInitialized", (event) => {
      event.returnValue = this.isInitialized;
    });
    ipcMain.handle("lite_tools.getConfig", () => {
      return this.config;
    });
    ipcMain.on("lite_tools.updateConfig", (_, data) => {
      this.updateConfig(data);
    });
  }

  private setupPath() {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(path.join(CONFIG_DIR, "configs"), { recursive: true });
      }
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (err) {
      dialog.showMessageBox({
        type: "info",
        title: "[轻量工具箱] 路径错误",
        message: "无法访问配置文件路径，请检查路径是否存在，或读写权限是否正确",
        buttons: ["确定"],
      });
      throw err;
    }
  }

  private safeMergeConfig<T>(userConfig: Partial<T>, baseConfig: T): T {
    if (!userConfig || typeof userConfig !== "object") return baseConfig;
    const result: Partial<T> = {};
    for (const key in baseConfig) {
      const k = key as keyof T;
      const baseValue = baseConfig[k];
      const userValue = userConfig[k];
      if (baseValue && typeof baseValue === "object" && baseValue !== null && !Array.isArray(baseValue)) {
        if (!userValue || typeof userValue !== "object") {
          result[k] = baseValue;
        } else {
          result[k] = this.safeMergeConfig(userValue, baseValue);
        }
      } else {
        result[k] = typeof userValue === typeof baseValue ? userValue : baseValue;
      }
    }
    return result as T;
  }

  private loadConfig(configPath: string): BaseConfig {
    try {
      if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2), "utf-8");
        return configTemplate;
      }
      return this.safeMergeConfig(JSON.parse(fs.readFileSync(configPath, "utf-8")), configTemplate);
    } catch (err) {
      dialog.showMessageBox({
        type: "info",
        title: "[轻量工具箱] 配置文件损坏",
        message: "用户配置文件损坏，请重新配置",
        buttons: ["确定"],
      });
      fs.renameSync(configPath, `${configPath}.bak`);
      fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2), "utf-8");
      return configTemplate;
    }
  }

  private calculateChangedKeys(oldObj: any, newObj: any, prefix = ""): string[] {
    const changedKeys: string[] = [];

    for (const key in newObj) {
      const oldVal = oldObj ? oldObj[key] : undefined;
      const newVal = newObj[key];
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof newVal === "object" && newVal !== null && !Array.isArray(newVal)) {
        if (typeof oldVal !== "object" || oldVal === null) {
          changedKeys.push(currentPath);
        } else {
          const nestedChanges = this.calculateChangedKeys(oldVal, newVal, currentPath);
          changedKeys.push(...nestedChanges);
        }
      } else {
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changedKeys.push(currentPath);
        }
      }
    }

    return changedKeys;
  }

  public setup(uid: string) {
    try {
      const userConfigPath = this.userConfigRegistry.resolve(uid);
      this.userUid = uid;
      this.config = this.loadConfig(userConfigPath) as Config;
      this.currentConfigPath = userConfigPath;
      this.isInitialized = true;
      this.isUserSpecific = true;
      this.resolveReady();
    } catch (err) {
      this.userUid = uid;
      this.config = this.loadConfig(this.defaultConfigPath) as Config;
      this.currentConfigPath = this.defaultConfigPath;
      this.isInitialized = true;
      this.resolveReady();
    }
  }

  public updateConfig(newConfig: Config) {
    this._lastUpdatedConfigs = this.calculateChangedKeys(this.config, newConfig) as ConfigPath[];

    Object.assign(this.config, newConfig);
    fs.writeFileSync(this.currentConfigPath, JSON.stringify(this.config, null, 2), "utf-8");
    for (const listener of this.updateListeners) {
      listener(this.config);
    }
    globalBroadcast("lite_tools.configChanged", this.config);
  }

  public onConfigUpdate(listener: ConfigListener) {
    this.updateListeners.add(listener);
    return () => this.offConfigUpdate(listener);
  }

  public offConfigUpdate(listener: ConfigListener) {
    this.updateListeners.delete(listener);
  }

  get value(): Readonly<Config> {
    return this.config;
  }

  get ready() {
    return this.readyPromise;
  }

  get uid() {
    return this.userUid;
  }

  get lastUpdatedConfigs(): ReadonlyArray<ConfigPath> {
    return this._lastUpdatedConfigs;
  }
}

const configManager = new ConfigManager();
export { configManager };
