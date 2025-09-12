import fs from "node:fs";
import path from "node:path";
import { dialog } from "electron";
import configTemplate from "@/assets/config.template.json";

export class UserConfigRegistry {
  private userConfigRegistryPath: string;
  private list: Map<string, string>;

  constructor(path: string) {
    this.userConfigRegistryPath = path;
    this.list = new Map();
    this.load();
  }

  private load() {
    if (fs.existsSync(this.userConfigRegistryPath)) {
      try {
        this.list = new Map(JSON.parse(fs.readFileSync(this.userConfigRegistryPath, "utf-8")));
      } catch {
        fs.renameSync(this.userConfigRegistryPath, `${this.userConfigRegistryPath}.bak`);
        this.list.clear();
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

  get(uid: string) {
    return this.list.get(uid);
  }

  set(uid: string, configPath: string) {
    this.list.set(uid, configPath);
    this.save();
  }

  delete(uid: string) {
    this.list.delete(uid);
    this.save();
  }

  create(uid: string, baseDir: string) {
    const configPath = path.join(baseDir, "configs", `${uid}.json`);
    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2), "utf-8");
    }
    this.set(uid, configPath);
    return configPath;
  }

  private save() {
    fs.writeFileSync(this.userConfigRegistryPath, JSON.stringify([...this.list], null, 2), "utf-8");
  }
}
