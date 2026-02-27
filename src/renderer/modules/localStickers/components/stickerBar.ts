import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import { defaultStickerStore } from "./index";

import type { StickerPack, StickerStore } from "@/common/types/localStickers";

@customElement("lt-sticker-bar-item")
export class StickerBarItem extends LitElement {
  static styles = css`
    .lt-sticker-bar-item {
      width: calc(var(--bar-height) - var(--bar-item-padding) * 2);
      height: calc(var(--bar-height) - var(--bar-item-padding) * 2);
      padding: var(--bar-item-padding);
      box-sizing: border-box;
      position: relative;
      transform: rotate(90deg);
      transform-origin: center center;
      cursor: pointer;
      transition: background-color 150ms;
      border-radius: 6px;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 6px;
        pointer-events: none;
        user-select: none;
        transition: opacity 150ms;
        opacity: 0;
      }
      &.active {
        background-color: var(--hover-background);
      }
    }
  `;

  @property({ type: Object })
  public stickerPack!: StickerPack;

  @property({ type: String })
  public activeDirPath = "";

  private _loadImage(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.opacity = "1";
  }

  render() {
    return html`<div class="lt-sticker-bar-item ${this.activeDirPath === this.stickerPack.dirPath ? "active" : ""}">
      <img src="${this.stickerPack.icon!}" @load="${this._loadImage}" />
    </div>`;
  }
}

@customElement("lt-sticker-bar")
export class StickerBar extends LitElement {
  static styles = css`
    .lt-sticker-bar {
      flex-shrink: 0;
      width: var(--bar-width);
      height: var(--bar-height);
      flex-shrink: 0;
      overflow: hidden;
      background-color: var(--background-03);
    }
    .scroll-container {
      width: var(--bar-height);
      height: var(--bar-width);

      overflow-y: auto;
      overflow-x: hidden;
      box-sizing: border-box;
      padding: var(--bar-item-padding);
      transform: translateY(var(--bar-height)) rotate(-90deg);
      transform-origin: top left;
    }
    .scroll-container::-webkit-scrollbar {
      display: none;
    }
  `;

  @property({ type: Object })
  public stickerStore: StickerStore = defaultStickerStore;

  @property({ type: String })
  public activeDirPath: StickerPack["dirPath"] = "";

  @query(".scroll-container")
  private _stickerContainer!: HTMLDivElement;

  private _gotoPack(e: Event) {
    const target = e.target as StickerBarItem;
    const dirPath = target.stickerPack.dirPath;
    this.dispatchEvent(new CustomEvent("gotoPack", { detail: { dirPath } }));
    this.selectPackIcon(dirPath);
  }

  public selectPackIcon(dirPath: StickerPack["dirPath"]) {
    const pack = Array.from(this.renderRoot.querySelectorAll(`lt-sticker-bar-item`)).find(
      (pack) => pack.stickerPack.dirPath === dirPath,
    );
    if (pack) {
      this._stickerContainer.scrollTo({
        top: pack.offsetTop - this._stickerContainer.offsetHeight / 2 + pack.offsetHeight / 2,
        behavior: "smooth",
      });
    }
  }

  render() {
    return html`<div class="lt-sticker-bar">
      <div class="scroll-container">
        ${this.stickerStore.stickerPacks?.map((stickerPack) => {
          return html`<lt-sticker-bar-item
            @click="${this._gotoPack}"
            .activeDirPath="${this.activeDirPath}"
            .stickerPack="${stickerPack}"
          ></lt-sticker-bar-item>`;
        })}
      </div>
    </div>`;
  }
}
