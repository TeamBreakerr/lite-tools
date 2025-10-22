import path from "node:path";

let configPath: string;
let dataPath: string;
let pluginPath: string;
if ("qwqnt" in globalThis) {
  configPath = path.join(qwqnt.framework.paths.configs, "lite_tools");
  dataPath = path.join(qwqnt.framework.paths.data, "lite_tools");
  pluginPath = path.join(qwqnt.framework.plugins.lite_tools.meta.path);
} else if ("LiteLoader" in globalThis) {
  configPath = path.join(LiteLoader.plugins.lite_tools.path.data, "configs");
  dataPath = path.join(LiteLoader.plugins.lite_tools.path.data, "data");
  pluginPath = path.join(LiteLoader.plugins.lite_tools.path.plugin);
}

export { configPath, dataPath, pluginPath };
