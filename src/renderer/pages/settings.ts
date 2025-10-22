import packageJson from "package.json";
import settingsHTML from "@/renderer/html/settings.html";
import settingsCss from "@/renderer/scss/settings.scss";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/configStore";
import { isQwQ } from "@/renderer/utils/loaderInspector";
import type { Config } from "@/types/config";

type OptionItem = {
  name: string;
  [key: string]: any;
};

const log = createLogger("settings");

document.head.appendChild(document.createElement("style")).appendChild(document.createTextNode(settingsCss));

async function initSettingView(view: HTMLDivElement) {
  await configStore.ready;
  const config = configStore.value;
  log("获取到配置数据", config);

  const devInfo: HTMLDivElement = document.createElement("div");
  devInfo.className = "wrap";
  devInfo.innerHTML = `
  <div class="vertical-list-item">
  <p>加载器：${isQwQ ? "QWQNT" : "LiteLoaderQQNT"}</p>
  <p>插件名称：${packageJson.name}</p>
  <p>插件版本：${packageJson.version}</p>
  </div>
  `;
  devInfo.insertAdjacentHTML(
    "afterbegin",
    `<div style="color: red;justify-content: center;" class="vertical-list-item">
    <p><strong>该版本仅供内部测试，请勿外传</strong></p>
  </div>`
  );
  view.insertAdjacentHTML("beforeend", settingsHTML);
  view.querySelector(".lite-tools-settings")!.insertAdjacentElement("afterbegin", devInfo);
  log("初始化HTML完成");
  initSettings(view, config);
}

async function initSettings(view: HTMLDivElement, config: Config) {
  // 显示插件版本信息
  const versionLink = view.querySelector(".version .link") as HTMLElement;
  versionLink.innerText = packageJson.version;
  // 初始化折叠
  initWrap(view);
  // 初始化switch按钮
  initSwitchButton(view, config);
  // 初始化下拉菜单
  initSelectMenu(view, config);
  // 初始化精简功能
  const sidebarEl = view.querySelector(".sideBar ul") as HTMLElement;
  const topFuncBarEl = view.querySelector(".topFuncBar ul") as HTMLElement;
  const chatFuncBarEl = view.querySelector(".chatFuncBar ul") as HTMLElement;
  createOptionItems(config, config.sideBar.top, sidebarEl, "sideBar.top", "enabled");
  createOptionItems(config, config.sideBar.bottom, sidebarEl, "sideBar.bottom", "enabled");
  if (config.topFuncBar.length > 1) {
    topFuncBarEl.querySelector(".first-tips")?.remove();
  }
  createOptionItems(config, config.topFuncBar, topFuncBarEl, "topFuncBar", "enabled");
  if (config.chatFuncBar.length > 1) {
    chatFuncBarEl.querySelector(".first-tips")?.remove();
  }
  createOptionItems(config, config.chatFuncBar, chatFuncBarEl, "chatFuncBar", "enabled");
  configStore.onChange((config) => {
    updateOptionItems(config.sideBar.top, sidebarEl, "sideBar.top", "enabled");
    updateOptionItems(config.sideBar.bottom, sidebarEl, "sideBar.bottom", "enabled");
  });
  // 初始化撤回相关选项
  initRecallOptions(view, config);
  log("初始化设置页面完成");
}

function initRecallOptions(view: HTMLDivElement, config: Config) {
  const light = view.querySelector<HTMLInputElement>(".custom-text-color-lite")!;
  const dark = view.querySelector<HTMLInputElement>(".custom-text-color-dark")!;
  light.value = config.message.preventRecall.customTextColor.light;
  dark.value = config.message.preventRecall.customTextColor.dark;
  light.addEventListener("change", () => {
    config.message.preventRecall.customTextColor.light = light.value;
    configStore.setConfig(config);
  });
  dark.addEventListener("change", () => {
    config.message.preventRecall.customTextColor.dark = dark.value;
    configStore.setConfig(config);
  });
}

// 派发事件
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
function initSwitchButton(view: HTMLDivElement, config: Config) {
  view.querySelectorAll(".q-switch").forEach((el) => {
    const configPath = el.getAttribute("data-config");
    if (configPath) {
      const configValue = getValueByPath(config, configPath);
      if (configValue !== undefined) {
        el.classList.toggle("is-active", configValue);
        // 初始化时触发一次事件
        dispatchEvent(view, configPath, configValue);
        // 添加事件
        el.addEventListener("click", function () {
          const newValue = el.classList.toggle("is-active");
          log("更新配置项", configPath, newValue);
          setValueByPath(config, configPath, newValue);
          configStore.setConfig(config);
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
function initSelectMenu(view: HTMLDivElement, config: Config) {
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
      const configValue = getValueByPath(config, configPath);
      if (configValue !== undefined) {
        const findEl = Array.from(item.querySelectorAll(".setting-item")).find(
          (item) => item.getAttribute("data-value") === configValue
        ) as HTMLElement;
        const showVlaue = findEl?.innerText ?? configValue;
        item.querySelector("input.setting-input")?.setAttribute("value", showVlaue);
        item.querySelector("div.setting-view")?.setAttribute("data-value", showVlaue);
        // 初始化时触发一次事件
        dispatchEvent(view, configPath, configValue);
        // 添加监听
        item.addEventListener("click", function (event) {
          const target = event.target as HTMLElement;
          log("点击下拉菜单", target.classList);
          if (target.classList.contains("setting-item")) {
            const newValue = target.getAttribute("data-value");
            const showVlaue = target.innerText;
            log("更新下拉配置项", item, configPath, newValue);
            setValueByPath(config, configPath, newValue);
            configStore.setConfig(config);
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

// 创建选项
function createOptionItems<T extends OptionItem>(
  config: Config,
  list: T[],
  element: HTMLElement,
  objKey: string,
  key: keyof T
) {
  const frag = document.createDocumentFragment();

  list.forEach((item, index) => {
    const hr = document.createElement("hr");
    hr.classList.add("horizontal-dividing-line");

    const li = document.createElement("li");
    li.classList.add("vertical-list-item");
    li.dataset.id = `${objKey}-${item.name}`;

    const div = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = item.name;
    div.append(title);
    if (item.desc) {
      const desc = document.createElement("p");
      desc.classList.add("secondary-text");
      desc.textContent = item.desc;
      div.append(desc);
    }
    li.append(div);

    if (item[key] !== undefined) {
      const switchEl = document.createElement("div");
      switchEl.classList.add("q-switch");
      switchEl.classList.toggle("is-active", item[key]);
      switchEl.dataset.index = index.toString();
      switchEl.addEventListener("click", () => {
        const active = !switchEl.classList.contains("is-active");
        log("更新配置项", objKey, index, key, active);
        setValueByPath(config, `${objKey}[${index}].${String(key)}`, active);
        switchEl.classList.toggle("is-active", active);
        configStore.setConfig(config);
      });
      const span = document.createElement("span");
      span.classList.add("q-switch__handle");
      switchEl.append(span);
      li.append(switchEl);
    }

    frag.append(hr, li);
  });

  element.appendChild(frag);
}

// 更新选项
function updateOptionItems<T extends OptionItem>(list: T[], element: HTMLElement, objKey: string, key: keyof T) {
  list.forEach((item) => {
    const switchEl = element.querySelector(`li[data-id="${objKey}-${item.name}"] .q-switch`) as HTMLElement;
    switchEl.classList.toggle("is-active", item[key]);
  });
}

// 获取配置
function getValueByPath<T = any>(target: Record<string, any>, path: string): T | undefined {
  const pathArr = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let result: any = target;
  for (let i = 0; i < pathArr.length; i++) {
    if (result != null && result[pathArr[i]] !== undefined) {
      result = result[pathArr[i]];
    } else {
      return undefined;
    }
  }
  return result as T;
}

// 设置配置
function setValueByPath(
  target: Record<string, any>,
  path: string,
  value: any,
  createPath: boolean = false,
  overridePath: boolean = false
): boolean {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: any = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if ((!current[key] && createPath) || (!(current[key] instanceof Object) && overridePath)) {
      current[key] = {};
    }
    if (!current[key]) {
      return false;
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
  return true;
}

export { initSettingView };
