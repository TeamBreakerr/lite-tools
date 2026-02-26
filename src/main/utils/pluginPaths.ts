import path from "node:path";
import packageJson from "package.json";
import { isll, isqwq } from "@/main/utils/loaderInspector";

let configPath: string;
let dataPath: string;
let pluginPath: string;
if (isll) {
  configPath = path.join(LiteLoader.plugins[packageJson.name].path.data, "configs");
  dataPath = path.join(LiteLoader.plugins[packageJson.name].path.data, "data");
  pluginPath = path.join(LiteLoader.plugins[packageJson.name].path.plugin);
} else if (isqwq) {
  configPath = path.join(qwqnt.framework.paths.configs, packageJson.name);
  dataPath = path.join(qwqnt.framework.paths.data, packageJson.name);
  pluginPath = path.join(qwqnt.framework.plugins[packageJson.name].meta.path);
} else {
  throw new Error("Unsupported loader!");
}

export { configPath, dataPath, pluginPath };
