import { Config } from "@common/types";

let _config: Config;

// 更新配置
function updateConfig(config: Config) {
  lite_tools.updateConfig(config);
}

// 获取配置
function getConfig(): Readonly<Config> {
  return JSON.parse(JSON.stringify(_config));
}

// 通知渲染进程配置变化
function dispatchConfigChange(config: Config) {
  const event = new CustomEvent("lt_configChange", { detail: config });
  document.dispatchEvent(event);
}

// 初始化配置
async function setupConfig() {
  _config = await lite_tools.getConfig();
  lite_tools.onConfigChange((config: Config) => {
    _config = config;
    dispatchConfigChange(JSON.parse(JSON.stringify(config)));
  });
}

// 初始化
setupConfig();

export { getConfig, updateConfig };
