import path from "node:path";

let configPath: string;
let dataPath: string;
if ("qwqnt" in globalThis) {
  configPath = path.join(qwqnt.framework.paths.configs, "lite_tools");
  dataPath = path.join(qwqnt.framework.paths.data, "lite_tools");
} else if ("LiteLoader" in globalThis) {
  configPath = LiteLoader.plugins.lite_tools.path.data;
  dataPath = LiteLoader.plugins.lite_tools.path.data;
}

export { configPath, dataPath };
