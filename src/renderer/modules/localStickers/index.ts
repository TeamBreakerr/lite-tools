import { StickerPanel } from "./components/stickerPanel";
import { StickerMsg } from "./components/stickerMsg";
import { StickerList } from "./components/stickerList";
import { StickerBar, StickerBarItem } from "./components/stickerBar";
import { StickerPack, StickerItem } from "./components/stickerPack";
import { StickerIcon } from "./components/stickerIcon";
import { StickerFullViewer } from "./components/stickerFullViewer";

export { StickerPanel, StickerMsg, StickerList, StickerBar, StickerPack, StickerItem, StickerIcon, StickerFullViewer };

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
