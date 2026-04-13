import { configStore } from "@/renderer/modules/configStore";

let listenTarget = false;
let interception = false;

// 1:左键 4:中键 8:后退 16:前进
const mouseButtons = [1, 4, 8, 16];

function setupPreventMutipleSelect(className: string) {
  const app = document.querySelector<HTMLElement>("#app")!;
  app.addEventListener("pointerdown", (event) => {
    if (configStore.value.interface.preventSelect && mouseButtons.includes(event.buttons)) {
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
        if (configStore.value.interface.preventSelect && mouseButtons.includes(event.buttons)) {
          document.querySelector(".q-context-menu")?.remove();
        }
      });
      listenTarget = true;
    }
    if (configStore.value.interface.preventSelect && mouseButtons.includes(event.buttons)) {
      if (interception) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

export { setupPreventMutipleSelect };
