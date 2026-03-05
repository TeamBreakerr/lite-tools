import { StickerPanel } from "./components/stickerPanel";
import { StickerMsg } from "./components/stickerMsg";
import { StickerList } from "./components/stickerList";
import { StickerBar, StickerBarItem } from "./components/stickerBar";
import { StickerPack, StickerItem } from "./components/stickerPack";
import { StickerIcon } from "./components/stickerIcon";
import { StickerFullViewer } from "./components/stickerFullViewer";

import { configStore } from "@/renderer/modules/configStore";
import { waitForElement } from "@/renderer/utils/domWaitFor";
import { observeMutations } from "@/renderer/utils/observeMutations";

declare global {
  interface HTMLElementTagNameMap {
    "lt-sticker-store": StickerPanel;
    "lt-sticker-msg": StickerMsg;
    "lt-sticker-list": StickerList;
    "lt-sticker-pack": StickerPack;
    "lt-sticker-bar": StickerBar;
    "lt-sticker-bar-item": StickerBarItem;
    "lt-sticker-icon": StickerIcon;
    "lt-sticker-full-viewer": StickerFullViewer;
  }
}

async function setupLocalStickers() {
  await configStore.ready;
  const injectPosition = ".chat-func-bar .func-bar-native.func-bar-shortcuts:last-child";
  const stickerIcon = document.createElement("lt-sticker-icon");
  let offObserver: ReturnType<typeof observeMutations> | null = null;

  const updateIconState = async () => {
    const isEnabled = configStore.value.localStickers.enabled;
    const existingIcon = document.querySelector("lt-sticker-icon");

    if (isEnabled) {
      if (!existingIcon) {
        const target = await waitForElement(injectPosition);
        if (target) {
          target.insertAdjacentElement("afterbegin", stickerIcon);
          offObserver?.();
          offObserver = observeMutations(target, updateIconState, {
            childList: true,
          });
        }
      }
    } else {
      existingIcon?.remove();
      offObserver?.();
    }
  };
  updateIconState();
  configStore.onChange(updateIconState);
}

export {
  StickerPanel,
  StickerMsg,
  StickerList,
  StickerBar,
  StickerPack,
  StickerItem,
  StickerIcon,
  StickerFullViewer,
  setupLocalStickers,
};
