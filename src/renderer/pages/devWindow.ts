import { setupLocalStickers } from "@/renderer/modules/localStickers";
import { styleManager } from "@/renderer/modules/styleManager";
import { StickerContainer } from "@/renderer/modules/localStickers";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    styleManager.inject("test-style");
    setupLocalStickers();
    document
      .querySelector(".func-bar-native")
      ?.insertAdjacentHTML("afterbegin", `<lt-sticker-container></lt-sticker-container>`);
  }, 3000);
});
