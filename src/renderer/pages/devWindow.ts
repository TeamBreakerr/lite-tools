import { setupLocalStickers } from "@/renderer/modules/localStickers";
import { styleManager } from "@/renderer/modules/styleManager";
import { StickerContainer } from "@/renderer/modules/localStickers";
import { configStore } from "@/renderer/modules/configStore";
import { setupRevealMask } from "@/renderer/modules/revealMask";

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(async () => {
    // 初始化遮罩
    setupRevealMask();

    await configStore.ready;
    styleManager.inject("test-style");
    setupLocalStickers();
    document
      .querySelector(".func-bar-native")
      ?.insertAdjacentHTML("afterbegin", `<lt-sticker-container></lt-sticker-container>`);
  }, 100);
});
