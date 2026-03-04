import { StickerPanel } from "./stickerPanel";
import { StickerMsg } from "./stickerMsg";
import { StickerList } from "./stickerList";
import { StickerBar, StickerBarItem } from "./stickerBar";
import { StickerPack, StickerItem } from "./stickerPack";
import { StickerIcon } from "./stickerIcon";

export { StickerPanel, StickerMsg, StickerList, StickerBar, StickerPack, StickerItem, StickerIcon };

declare global {
  interface HTMLElementTagNameMap {
    "lt-sticker-store": StickerPanel;
    "lt-sticker-msg": StickerMsg;
    "lt-sticker-list": StickerList;
    "lt-sticker-pack": StickerPack;
    "lt-sticker-bar": StickerBar;
    "lt-sticker-bar-item": StickerBarItem;
    "lt-sticker-icon": StickerIcon;
  }
}
