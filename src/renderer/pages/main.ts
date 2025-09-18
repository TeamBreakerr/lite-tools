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
  updateTopSideBar(configStore.config);
  updateBottomSideBar(configStore.config);
  configStore.onChange((config) => {
    if (topSideBarhasChanged(config.sideBar.top)) {
      log("顶部侧边栏参数更新");
      updateTopSideBar(config);
    }
    if (bottomSideBarhasChanged(config.sideBar.bottom)) {
      log("底部侧边栏参数更新");
      updateBottomSideBar(config);
    }
  });
  // 避免部分按钮延迟加载导致没有拦截到
  for (let i = 0; i < 10; i++) {
    await new Promise((res) => setTimeout(res, 100));
    updateTopSideBar(configStore.config);
    updateBottomSideBar(configStore.config);
  }
}

function updateTopSideBar(config: Config) {
  // 更新侧边栏
  document.querySelector(".nav.sidebar__nav")?.__VUE__?.[0]?.proxy?.navStore?.loadSideBarConfig();
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
