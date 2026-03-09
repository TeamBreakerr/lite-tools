import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import type { StickerPack, StickerStore } from "@/common/types/localStickers";

@customElement("lt-sticker-bar-item")
export class StickerBarItem extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
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
      svg {
        width: 100%;
        height: 100%;
        color: #cdcdcd;
      }
      &.active {
        background-color: var(--overlay_hover_brand);
      }
    }
  `;

  @property({ type: Object })
  public stickerPack!: StickerPack;

  @property({ type: String })
  public activeDirPath = "";

  static ERR_ICON = html`<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M854.5 82h-685c-58.2 0-105.4 49.2-105.4 109.8v640.4c0 60.6 47.2 109.8 105.4 109.8h685.1c58.2 0 105.4-49.2 105.4-109.8V191.8C959.9 131.2 912.7 82 854.5 82zM223.6 223.3l11.3-11.7c8.1-8.4 54.7 22.5 101.4 64.9 46.9-42.8 93.4-73.4 101.5-64.9l11.3 11.7c9.6 10-20.2 57.3-61.3 105.3 41.9 47.3 71.3 94.3 60.6 105.5l-11.3 11.7c-10.6 11-55.3-19.8-100.8-63.1-45.4 43-90.3 74-100.8 63.1L224.3 434c-10.5-11 19.3-58.3 60.7-105.5-40.9-47.8-70.9-95.3-61.4-105.2z m630.9 590.6c-12.9 41.9 0.6 36.6-333.7 36.6-338.1 0-342.2-0.8-351.3-47.8-14.2-73.5 64.8-246.2 122.9-208.3 24.9 16.2 81.4 72.5 105.4 73.2 126.9 3.9 212.1-237.9 298.6-237.9 82.3 0 190.8 278.1 158.1 384.2z"
      fill="currentColor"
      p-id="2104"
    ></path>
  </svg>`;

  @state()
  _isError = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has("stickerPack")) {
      this._isError = false;
    }
  }

  private _loadImage(e: Event) {
    const img = e.target as HTMLImageElement;
    img.style.opacity = "1";
  }

  render() {
    return html`<div class="lt-sticker-bar-item ${this.activeDirPath === this.stickerPack.dirPath ? "active" : ""}">
      ${!this._isError
        ? html`<img
            loading="lazy"
            src="appimg://${this.stickerPack.icon!}"
            @error="${() => (this._isError = true)}"
            @load="${this._loadImage}"
          />`
        : StickerBarItem.ERR_ICON}
    </div>`;
  }
}

@customElement("lt-sticker-bar")
export class StickerBar extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .lt-sticker-bar {
      flex-shrink: 0;
      height: var(--bar-height);
      width: min(100vw, var(--bar-width));
      flex-shrink: 0;
      overflow: hidden;
      background-color: color-mix(in srgb, color(from var(--blur_middle_standard) srgb r g b / 1), gray 10%);
    }
    .scroll-container {
      width: var(--bar-height);
      height: min(100vw, var(--bar-width));
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
  public stickerStore!: StickerStore;

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
