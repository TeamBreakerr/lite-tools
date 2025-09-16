import { AioStore } from "@/renderer/modules/AioStore";
import { preventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/config";
import { createComparator } from "@/common/createComparator";
import type { Config } from "@/types/Config";

const log = createLogger("main");

async function setupMainPage() {
  log("await aio");
  await configStore.ready;
  const aioStore = new AioStore();
  await aioStore.ready;
  const sideBarhasChanged = createComparator(configStore.config.sideBar.top);
  log("main ok");
  preventMutipleSelect("chat-msg-area");
  updateSideBar(configStore.config);
  configStore.onChange((config) => {
    if (sideBarhasChanged(config.sideBar.top)) {
      log("顶部侧边栏参数更新");
      updateSideBar(config);
    }
  });
}

function updateSideBar(config: Config) {
  // 更新侧边栏
  document.querySelector(".nav.sidebar__nav")?.__VUE__?.[0]?.proxy?.navStore?.loadSideBarConfig();
  // 特殊栏目
  (document.querySelector(".nav.sidebar__nav .nav-item:nth-child(1)") as HTMLElement)!.style.display = config.sideBar
    .top[0].enabled
    ? "block"
    : "none";
  (document.querySelector(".nav.sidebar__nav .nav-item:nth-child(2)") as HTMLElement)!.style.display = config.sideBar
    .top[1].enabled
    ? "block"
    : "none";
  (document.querySelector(".nav.sidebar__nav .nav-item:last-child") as HTMLElement)!.style.display = config.sideBar.top[
    config.sideBar.top.length - 1
  ].enabled
    ? "block"
    : "none";
}

export { setupMainPage };
