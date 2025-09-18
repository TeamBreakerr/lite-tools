import { AioStore } from "@/renderer/modules/AioStore";
import { preventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/config";
import { createComparator } from "@/common/createComparator";
import type { Config } from "@/types/Config";

const log = createLogger("main");

async function setupMainPage() {
  log("await init");
  await configStore.ready;
  const aioStore = new AioStore();
  await aioStore.ready;
  log("main ok");
  const topSideBarhasChanged = createComparator(configStore.config.sideBar.top);
  const bottomSideBarhasChanged = createComparator(configStore.config.sideBar.bottom);
  preventMutipleSelect("chat-msg-area");
  updateTopSideBar(configStore.config, false);
  updateBottomSideBar(configStore.config);
  configStore.onChange((config) => {
    if (topSideBarhasChanged(config.sideBar.top)) {
      updateTopSideBar(config, false);
    }
    if (bottomSideBarhasChanged(config.sideBar.bottom)) {
      updateBottomSideBar(config);
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

export { setupMainPage };
