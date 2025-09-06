import fs from "node:fs";
import path from "node:path";
import { dialog, ipcMain } from "electron";
import { configPath, dataPath } from "@main/utils/localPath";
import { UserConfigRegistry } from "@main/utils/UserConfigRegistry";
import { globalBroadcast } from "@main/utils/globalBroadcast";
import configTemplate from "@common/config.template.json";
import type { Config } from "@common/types";

let config = {} as Config;
let isInitialized = false;
let isIndependent = false;
let currentConfigPath: string;

type ConfigListener = (config: Config) => void;
const listeners = new Set<ConfigListener>();

const defaultConfigPath = path.join(configPath, "config.json");

const register = new UserConfigRegistry(path.join(configPath, "UserConfigRegistry.json"));

function setupConfig(uid: string) {
  setupPath();
  setupIpcEvent();
  const userConfigPath = register.get(uid);
  if (userConfigPath) {
    config = loadConfig(userConfigPath);
    currentConfigPath = userConfigPath;
    isInitialized = true;
    isIndependent = true;
  } else {
    config = loadConfig(defaultConfigPath);
    currentConfigPath = defaultConfigPath;
    isInitialized = true;
  }
}

function loadConfig(configPath: string): Config {
  try {
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2), "utf-8");
      return configTemplate;
    }
    return safeMergeConfig(JSON.parse(fs.readFileSync(configPath, "utf-8")), configTemplate);
  } catch (err) {
    dialog.showMessageBox({
      type: "info",
      title: "[轻量工具箱] 配置文件损坏",
      message: "用户配置文件损坏，请重新配置\n\n这不是QQ的问题，请勿向腾讯团队反馈！",
      buttons: ["确定"],
    });
    fs.renameSync(configPath, `${configPath}.bak`);
    fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2), "utf-8");
    return configTemplate;
  }
}

function setupPath() {
  try {
    if (!fs.existsSync(configPath)) {
      fs.mkdirSync(configPath, { recursive: true });
      fs.mkdirSync(path.join(configPath, "configs"), { recursive: true });
      fs.mkdirSync(path.join(configPath, "messageRecall"), { recursive: true });
    }
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
  } catch (err) {
    dialog.showMessageBox({
      type: "info",
      title: "[轻量工具箱] 权限错误",
      message: "无法访问配置文件路径，请检查权限\n\n这不是QQ的问题，请勿向腾讯团队反馈！",
      buttons: ["确定"],
    });
    throw err;
  }
}

function safeMergeConfig(fileConfig: any, defaultConfig: any): any {
  if (!fileConfig || typeof fileConfig !== "object") return defaultConfig;
  const result: any = {};
  for (const key in defaultConfig) {
    const defaultVal = defaultConfig[key];
    const fileVal = fileConfig[key];
    if (defaultVal && typeof defaultVal === "object" && !Array.isArray(defaultVal)) {
      result[key] = safeMergeConfig(fileVal, defaultVal);
      continue;
    }
    result[key] = typeof fileVal === typeof defaultVal ? fileVal : defaultVal;
  }
  return result;
}

function setupIpcEvent() {
  ipcMain.on("lite_tools.getConfig", (event) => {
    event.returnValue = config;
  });
  ipcMain.on("lite_tools.updateConfig", (_, data) => {
    Object.assign(config, data);
    fs.writeFileSync(currentConfigPath, JSON.stringify(data, null, 2), "utf-8");
    listeners.forEach((listener) => listener(config));
    globalBroadcast("lite_tools.configChanged", data);
  });
}

function onConfigUpdate(listener: ConfigListener) {
  listeners.add(listener);
  return () => offConfigUpdate(listener);
}

function offConfigUpdate(listener: ConfigListener) {
  listeners.delete(listener);
}

export { setupConfig, config, onConfigUpdate, offConfigUpdate };
