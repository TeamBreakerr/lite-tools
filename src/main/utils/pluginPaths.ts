import path from "node:path";
import packageJson from "root/package.json";

let CONFIG_DIR: string;
let DATA_DIR: string;
let PLUGIN_DIR: string;
if ("LiteLoader" in globalThis && LiteLoader.plugins?.[packageJson.name]) {
  CONFIG_DIR = path.join(LiteLoader.plugins[packageJson.name].path.data, "configs");
  DATA_DIR = path.join(LiteLoader.plugins[packageJson.name].path.data, "data");
  PLUGIN_DIR = path.join(LiteLoader.plugins[packageJson.name].path.plugin);
} else if ("qwqnt" in globalThis && qwqnt.framework?.plugins?.[packageJson.name]) {
  CONFIG_DIR = path.join(qwqnt.framework.paths.configs, packageJson.name);
  DATA_DIR = path.join(qwqnt.framework.paths.data, packageJson.name);
  PLUGIN_DIR = path.join(qwqnt.framework.plugins[packageJson.name].meta.path);
}

export { CONFIG_DIR, DATA_DIR, PLUGIN_DIR };
