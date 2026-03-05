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
import { toastManager } from "@/renderer/modules/toastManager";
import { sendMessage } from "@/renderer/utils/nativeCall";
import { aioStore } from "@/renderer/modules/aioStore";

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
  const stickerIcon = document.createElement("lt-sticker-icon") as StickerIcon;

  const editor = (await waitForElement(".ck.ck-content.ck-editor__editable")) as any;

  const ckeditorInstance = editor.ckeditorInstance;
  const ckeditEditorModel = ckeditorInstance.model;

  // ckeditEditorModel.document.on("change:data", debounceQuickInsertion);

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

  stickerIcon.addEventListener("lt-select-sticker", (e) => {
    ckeditEditorModel.change((writer: any) => {
      const picSubType = configStore.value.localStickers.sendAsPic ? 0 : 1;
      const selection = ckeditEditorModel.document.selection;
      const position = selection.getFirstPosition();
      const writerEl = writer.createElement("msg-img", {
        data: JSON.stringify({ type: "pic", src: e.detail.path, picSubType }),
      });
      writer.insert(writerEl, position);
      writer.setSelection(writer.createPositionAt(writerEl, "after"));
    });
  });

  stickerIcon.addEventListener("lt-send-sticker", (e) => {
    const picSubType = configStore.value.localStickers.sendAsPic ? 0 : 1;
    // 暂未实现
    toastManager.show("暂未实现", "default", 1500);
    // sendMessage(aioStore.getPeer(), [{ type: "image", path: e.detail.path, picSubType }]);
    console.log("send", e);
  });
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
