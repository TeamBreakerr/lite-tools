import { AioStore } from "@/renderer/modules/AioStore";
import { setupPreventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/config";
import { createComparator } from "@/common/createComparator";
import { updateTopFuncBar, updateChatFuncBar } from "@/renderer/modules/funcBarManager";
import type { Config } from "@/types/Config";

const log = createLogger("main");

async function setupMainPage() {
  log("await init");
  const aioStore = new AioStore();
  await configStore.ready;
  await aioStore.ready;
  log("ok");
  const topSideBarhasChanged = createComparator(configStore.config.sideBar.top);
  setupPreventMutipleSelect("chat-msg-area");
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
    updateBottomSideBar(config);
    updateTopFuncBar();
    updateChatFuncBar();
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
  const message = document.querySelector<HTMLElement>(".nav.sidebar__nav .nav-item:nth-child(1)");
  if (message) {
    message.style.display = config.sideBar.top[0].enabled ? "flex" : "none";
  }
  const contact = document.querySelector<HTMLElement>(".nav.sidebar__nav .nav-item:nth-child(2)");
  if (contact) {
    contact.style.display = config.sideBar.top[1].enabled ? "flex" : "none";
  }
  const more = document.querySelector<HTMLElement>(".nav.sidebar__nav .nav-item:last-child");
  if (more) {
    more.style.display = config.sideBar.top[config.sideBar.top.length - 1].enabled ? "flex" : "none";
  }
}

function updateBottomSideBar(config: Config) {
  const bottomSideBar = document.querySelector<HTMLElement>(".sidebar-nav .sidebar__lower")!;

  config.sideBar.bottom.forEach((item) => {
    const findEl = bottomSideBar
      .querySelector(`[aria-label="${item.name}"]`)
      ?.closest<HTMLElement>(".func-menu__item_wrap");
    if (findEl) {
      findEl.style.display = item.enabled ? "flex" : "none";
    }
  });
}

export { setupMainPage };
