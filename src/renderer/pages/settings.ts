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
  // 显示插件版本信息
  const versionLink = view.querySelector(".version .link") as HTMLElement;
  versionLink.innerText = packageJson.version;
  // 初始化折叠
  initWrap(view);
  // 初始化switch按钮
  initSwitchButton(view);
  // 初始化下拉菜单
  initSelectMenu(view);
  log("初始化设置页面完成");
}

function dispatchEvent(el: HTMLElement, configPath: string, detail: any) {
  const event = new CustomEvent(configPath, { detail });
  el.dispatchEvent(event);
}

// 初始化折叠
function initWrap(view: HTMLDivElement) {
  view.querySelectorAll(".wrap .vertical-list-item.title").forEach((el) => {
    el.addEventListener("click", () => {
      const wrap = el.parentElement!;
      wrap.querySelector(".icon")!.classList.toggle("is-fold");
      wrap.querySelector("ul")!.classList.toggle("hidden");
    });
  });
}

// 初始化switch按钮
function initSwitchButton(view: HTMLDivElement) {
  view.querySelectorAll(".q-switch").forEach((el) => {
    const configPath = el.getAttribute("data-config");
    if (configPath) {
      const configValue = getValueByPath(options, configPath);
      if (configValue !== undefined) {
        el.classList.toggle("is-active", configValue);
        // 初始化时触发一次事件
        dispatchEvent(view, configPath, configValue);
        // 添加事件
        el.addEventListener("click", function () {
          const newValue = el.classList.toggle("is-active");
          log("更新配置项", configPath, newValue);
          setValueByPath(options, configPath, newValue);
          // 通知主进程配置被修改
          // lite_tools.setOptions(options);
          dispatchEvent(view, configPath, newValue);
          // 彩蛋触发函数
          // switchButtons();
        });
      } else {
        el.classList.add("error-switch");
        el.setAttribute("title", "配置项不存在");
      }
    }
  });
}

// 初始化下拉菜单
function initSelectMenu(view: HTMLDivElement) {
  // 全局点击事件，关闭下拉菜单
  view.addEventListener("click", function (event) {
    const target = event.target as HTMLElement;
    if (!target.closest(".setting-select")) {
      view.querySelectorAll(".setting-option")!.forEach((item) => {
        item.classList.remove("show");
      });
    }
  });
  view.querySelectorAll(".setting-select").forEach((el) => {
    const item = el as HTMLElement;
    const configPath = item.getAttribute("data-config");
    if (configPath) {
      // 初始化选项
      const configValue = getValueByPath(options, configPath);
      if (configValue !== undefined) {
        const findEl = Array.from(item.querySelectorAll(".setting-item")).find(
          (item) => item.getAttribute("data-value") === configValue
        ) as HTMLElement;
        const showVlaue = findEl?.innerText ?? configValue;
        item.querySelector("input.setting-input")!.setAttribute("value", showVlaue);
        item.querySelector("div.setting-view")!.setAttribute("data-value", showVlaue);
        // 初始化时触发一次事件
        dispatchEvent(view, configPath, configValue);
        // 添加监听
        item.addEventListener("click", function (event) {
          const target = event.target as HTMLElement;
          log("点击下拉菜单", target.classList);
          if (target.classList.contains("setting-item")) {
            const newValue = target.getAttribute("data-value");
            const showVlaue = target.innerText;
            setValueByPath(options, configPath, newValue);
            log("更新配置项", item, configPath, newValue);
            // 通知主进程配置被修改
            // lite_tools.setOptions(options);
            item.querySelector("input.setting-input")?.setAttribute("value", showVlaue);
            item.querySelector("div.setting-view")?.setAttribute("data-value", showVlaue);
            dispatchEvent(view, configPath, newValue);
          }
          view.querySelectorAll(".setting-select")!.forEach((item) => {
            if (item === el) return;
            item.querySelector(".setting-option")!.classList.remove("show");
          });
          item.querySelector(".setting-option")!.classList.toggle("show");
        });
      } else {
        el.classList.add("error-switch");
        el.setAttribute("title", "配置项不存在");
      }
    }
  });
}

export default initSettingView;
