import { StickerPanel } from "./stickerPanel";
import { StickerMsg } from "./stickerMsg";
import { StickerList } from "./stickerList";
import { StickerBar, StickerBarItem } from "./stickerBar";
import { StickerPack } from "./stickerPack";

import type { StickerStore } from "@/common/types/localStickers";

const defaultStickerStore: StickerStore = { status: "info", msg: "初始化中..." };

export { StickerPanel, StickerMsg, StickerList, StickerBar, StickerPack, defaultStickerStore };

declare global {
  interface HTMLElementTagNameMap {
    "lt-sticker-store": StickerPanel;
    "lt-sticker-msg": StickerMsg;
    "lt-sticker-list": StickerList;
    "lt-sticker-pack": StickerPack;
    "lt-sticker-bar": StickerBar;
    "lt-sticker-bar-item": StickerBarItem;
  }
}
