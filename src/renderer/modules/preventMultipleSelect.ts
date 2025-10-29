import { configStore } from "@/renderer/modules/configStore.js";

let listenTarget = false;
let interception = false;

function setupPreventMutipleSelect(className: string) {
  const app = document.querySelector("#app") as HTMLElement;
  app.addEventListener("pointerdown", (event) => {
    if (configStore.value.interface.preventSelect && (event.buttons === 1 || event.buttons === 4)) {
      const target = event.target as HTMLElement;
      interception = !!(
        !target.closest(".message-content__wrapper") &&
        target.closest(`.${className}`) &&
        !target.closest(".v-scrollbar-track")
      );
    } else {
      interception = false;
    }
  });
  app.addEventListener("pointerup", (event) => {
    if (configStore.value.interface.preventSelect) {
      if (event.buttons === 0) {
        interception = false;
      }
    }
  });

  app.addEventListener("mousemove", (event) => {
    if (!listenTarget && document.querySelector(`.${className}`)) {
      (document.querySelector(`.${className}`) as HTMLElement).addEventListener("pointerdown", (event) => {
        if (configStore.value.interface.preventSelect && (event.buttons === 1 || event.buttons === 4)) {
          document.querySelector(".q-context-menu")?.remove();
        }
      });
      listenTarget = true;
    }
    if (configStore.value.interface.preventSelect && (event.buttons === 1 || event.buttons === 4)) {
      if (interception) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

export { setupPreventMutipleSelect };
