import packageJson from "package.json";
import settingsHTML from "@renderer/html/settings.html";
import settingsCss from "@renderer/scss/settings.scss";
import createLogger from "@renderer/utils/logs";
import { getValueByPath, setValueByPath } from "@renderer/utils/objectHandler";
import { options } from "@renderer/utils/options";
import { isQwQ } from "@renderer/utils/loaderInspector";

const log = createLogger("settings");

document.head.appendChild(document.createElement("style")).appendChild(document.createTextNode(settingsCss));

function initSettingView(view: HTMLDivElement) {
  const devInfo: HTMLDivElement = document.createElement("div");
  devInfo.className = "wrap";
  devInfo.innerHTML = `
  <div class="vertical-list-item">
  <p>加载器：${isQwQ ? "QWQNT" : "LiteLoaderQQNT"}</p>
  <p>插件名称：${packageJson.name}</p>
  <p>插件版本：${packageJson.version}</p>
  </div>
  `;
  view.insertAdjacentHTML("beforeend", settingsHTML);
  view.querySelector(".lite-tools-settings")!.insertAdjacentElement("afterbegin", devInfo);
  log("初始化HTML完成");
  initSettings(view);
}

async function initSettings(view: HTMLDivElement) {
  // 列表展开功能
  view.querySelectorAll(".wrap .vertical-list-item.title").forEach((el) => {
    el.addEventListener("click", () => {
      const wrap = el.parentElement!;
      wrap.querySelector(".icon")!.classList.toggle("is-fold");
      wrap.querySelector("ul")!.classList.toggle("hidden");
    });
  });
  // 初始化switch功能
  view.querySelectorAll(".q-switch").forEach((el) => {
    const configPath = el.getAttribute("data-config");
    if (configPath) {
      const configValue = getValueByPath(options, configPath);
      if (configValue !== undefined) {

        el.classList.toggle("is-active", configValue);
        // 初始化时触发一次事件
        const event = new CustomEvent(configPath, { detail: configValue });
        view.dispatchEvent(event);
        // 添加事件
        el.addEventListener("click", function () {
          const newValue = el.classList.toggle("is-active");
          log("更新配置项", configPath, newValue);
          setValueByPath(options, configPath, newValue);
          const event = new CustomEvent(configPath, { detail: newValue });
          view.dispatchEvent(event);
          // 通知主进程配置被修改
          // lite_tools.setOptions(options);
          // 彩蛋触发函数
          // switchButtons();
        });
      } else if (options.debug.isDev) {
        el.classList.add("error-switch");
        el.setAttribute("title", "配置项不存在");
      }
    } else if (options.debug.isDev) {
      el.classList.add("error-switch");
      el.setAttribute("title", "未填写配置项");
    }
  });
  log("初始化设置页面完成");
}

export default initSettingView;
