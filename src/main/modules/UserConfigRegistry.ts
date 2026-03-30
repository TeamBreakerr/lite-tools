import fs from "node:fs";
import path from "node:path";
import { dialog } from "electron";
import configTemplate from "@/config/main.template.json";

export class UserConfigRegistry {
  private registryFilePath: string;
  private baseConfigDir: string;
  private registryMap: Map<string, string>;

  constructor(baseConfigDir: string) {
    this.baseConfigDir = baseConfigDir;
    this.registryFilePath = path.join(this.baseConfigDir, "UserConfigRegistry.json");
    this.registryMap = new Map();
    this.load();
  }

  private load() {
    if (fs.existsSync(this.registryFilePath)) {
      try {
        this.registryMap = new Map(JSON.parse(fs.readFileSync(this.registryFilePath, "utf-8")));
      } catch {
        fs.renameSync(this.registryFilePath, `${this.registryFilePath}.bak`);
        this.registryMap.clear();
        this.save();
        dialog.showMessageBox({
          type: "info",
          title: "[轻量工具箱] 配置文件损坏",
          message: "独立配置索引文件损坏，请重新配置",
          buttons: ["确定"],
        });
      }
    } else {
      this.save();
    }
  }

  resolve(uid: string) {
    const configPath = this.registryMap.get(uid);
    if (configPath) {
      return configPath;
    } else {
      return this.create(uid);
    }
  }

  register(uid: string, configPath: string) {
    this.registryMap.set(uid, configPath);
    this.save();
  }

  delete(uid: string) {
    this.registryMap.delete(uid);
    this.save();
  }

  create(uid: string) {
    const userConfigsDir = path.join(this.baseConfigDir, "configs");
    const configPath = path.join(userConfigsDir, `${uid}.json`);
    if (!fs.existsSync(userConfigsDir)) {
      fs.mkdirSync(userConfigsDir, { recursive: true });
    }
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2), "utf-8");
    }
    this.register(uid, configPath);
    return configPath;
  }

  private save() {
    fs.writeFileSync(this.registryFilePath, JSON.stringify([...this.registryMap], null, 2), "utf-8");
  }
}
