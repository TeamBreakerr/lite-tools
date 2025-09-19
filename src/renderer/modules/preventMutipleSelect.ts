import { configStore } from "@/renderer/modules/config.js";
import { createLogger } from "@/renderer/utils/createLogger";

const log = createLogger("阻止滑动选择");

let listenTarget = false;
let interception = false;

function setupPreventMutipleSelect(className: string) {
  log("已加载");
  const app = document.querySelector("#app") as HTMLElement;
  app.addEventListener("pointerdown", (event) => {
    if (configStore.config.message.preventSelect && (event.buttons === 1 || event.buttons === 4)) {
      const target = event.target as HTMLElement;
      interception = !!(
        !target.closest(".message-content__wrapper") &&
        target.closest(`.${className}`) &&
        !target.closest(".v-scrollbar-track")
      );
    } else {
      interception = false;
    }
    log("更新状态", interception);
  });
  app.addEventListener("pointerup", (event) => {
    if (configStore.config.message.preventSelect) {
      if (event.buttons === 0) {
        interception = false;
      }
      log("更新状态", interception);
    }
  });

  app.addEventListener("mousemove", (event) => {
    if (!listenTarget && document.querySelector(`.${className}`)) {
      log("已捕获目标元素");
      (document.querySelector(`.${className}`) as HTMLElement).addEventListener("pointerdown", (event) => {
        if (configStore.config.message.preventSelect && (event.buttons === 1 || event.buttons === 4)) {
          document.querySelector(".q-context-menu")?.remove();
        }
      });
      listenTarget = true;
    }
    if (configStore.config.message.preventSelect && (event.buttons === 1 || event.buttons === 4)) {
      if (interception) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

export { setupPreventMutipleSelect };
