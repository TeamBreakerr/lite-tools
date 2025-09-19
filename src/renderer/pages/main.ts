import { AioStore } from "@/renderer/modules/AioStore";
import { preventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/config";
import { createComparator } from "@/common/createComparator";
import { waitForInstance } from "@/renderer/utils/waitForInstance";
import type { Config } from "@/types/Config";

const log = createLogger("main");

const topFuncSet = new Set() as Set<string>;
const chatFuncSet = new Set() as Set<string>;

async function setupMainPage() {
  log("await init");
  const aioStore = new AioStore();
  await configStore.ready;
  await aioStore.ready;
  log("main ok");
  const topSideBarhasChanged = createComparator(configStore.config.sideBar.top);
  const bottomSideBarhasChanged = createComparator(configStore.config.sideBar.bottom);
  const topFuncBarhasChanged = createComparator(configStore.config.topFuncBar);
  const chatFuncBarhasChanged = createComparator(configStore.config.chatFuncBar);
  preventMutipleSelect("chat-msg-area");
  updateTopSideBar(configStore.config, false);
  updateBottomSideBar(configStore.config);
  aioStore.onChange(() => {
    updateTopFuncBar();
    updateChatFuncBar();
  });
  configStore.onChange((config) => {
    if (topSideBarhasChanged(config.sideBar.top)) {
      updateTopSideBar(config, false);
    }
    if (bottomSideBarhasChanged(config.sideBar.bottom)) {
      updateBottomSideBar(config);
    }
    if (topFuncBarhasChanged(config.topFuncBar)) {
      updateTopFuncBar();
    }
    if (chatFuncBarhasChanged(config.chatFuncBar)) {
      updateChatFuncBar();
    }
  });
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        updateTopSideBar(configStore.config, true);
      }
    }
  });
  observer.observe(document.querySelector(".nav.sidebar__nav")!, { childList: true });
  setTimeout(() => observer.disconnect(), 30 * 1000);
}

function updateTopSideBar(config: Config, onlySpecial: boolean) {
  // 更新侧边栏
  if (!onlySpecial) {
    document.querySelector(".nav.sidebar__nav")?.__VUE__?.[0]?.proxy?.navStore?.loadSideBarConfig();
  }
  // 特殊栏目
  (document.querySelector(".nav.sidebar__nav .nav-item:nth-child(1)") as HTMLElement)!.style.display = config.sideBar
    .top[0].enabled
    ? "flex"
    : "none";
  (document.querySelector(".nav.sidebar__nav .nav-item:nth-child(2)") as HTMLElement)!.style.display = config.sideBar
    .top[1].enabled
    ? "flex"
    : "none";
  (document.querySelector(".nav.sidebar__nav .nav-item:last-child") as HTMLElement)!.style.display = config.sideBar.top[
    config.sideBar.top.length - 1
  ].enabled
    ? "flex"
    : "none";
}

function updateBottomSideBar(config: Config) {
  (document.querySelectorAll(".sidebar-nav .sidebar__lower .func-menu__item_wrap") as NodeListOf<HTMLElement>).forEach(
    (item, index) => {
      item.style.display = config.sideBar.bottom[index].enabled ? "flex" : "none";
    }
  );
}

async function updateTopFuncBar() {
  const { element, instance } = await waitForInstance(".panel-header__action .func-bar", "props.items");
  await instance.proxy.$nextTick();
  const value = instance.props.items;
  const oldFuncSize = topFuncSet.size;
  value.forEach((item: any) => {
    topFuncSet.add(item.label);
  });
  if (topFuncSet.size > oldFuncSize && topFuncSet.size > configStore.config.topFuncBar.length) {
    configStore.config.topFuncBar = Array.from(topFuncSet).map((item) => {
      return {
        name: item,
        enabled: true,
      };
    });
    configStore.setConfig(configStore.config);
  }
  configStore.config.topFuncBar.forEach((item) => {
    const findEl = element.querySelector(`[aria-label="${item.name}"]`)?.closest(".bar-icon");
    if (findEl) {
      findEl.style.display = item.enabled ? "flex" : "none";
    }
  });
}

async function updateChatFuncBar() {
  const { element, instance, value } = await waitForInstance(".chat-input-area .chat-func-bar.shortcuts", "proxy.list");
  await instance.proxy.$nextTick();
  value.forEach((item: any) => {
    if (item.label) {
      chatFuncSet.add(item.label);
    }
  });
  if (chatFuncSet.size > configStore.config.chatFuncBar.length) {
    configStore.config.chatFuncBar = Array.from(chatFuncSet).map((item) => {
      return {
        name: item,
        enabled: true,
      };
    });
    configStore.setConfig(configStore.config);
  }
  configStore.config.chatFuncBar.forEach((item) => {
    const findEl = element.querySelector(`[aria-label="${item.name}"]`)?.closest(".bar-icon");
    if (findEl) {
      findEl.style.display = item.enabled ? "flex" : "none";
    }
  });
}

export { setupMainPage };
