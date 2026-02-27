import { LitElement, html, css, PropertyValues, CSSResultGroup } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import type { StickerStore, StickerPack as StickerPackType, Sticker } from "@/common/types/localStickers";

@customElement("lt-sticker-item")
export class StickerItem extends LitElement {
  @property({ type: Object })
  public sticker!: Sticker;

  static styles = css`
    .lt-sticker-item {
      width: auto;
      height: auto;
      aspect-ratio: 1 / 1;
      cursor: pointer;
      font-size: 0;
      border-radius: 6px;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 6px;
        pointer-events: none;
        user-select: none;
      }
      &:hover {
        background-color: var(--hover-background);
        box-shadow: 0 0 0 3px var(--hover-background);
      }
    }
  `;

  render() {
    return html`
      <div class="lt-sticker-item">
        <img src="${this.sticker.path!}" />
      </div>
    `;
  }
}

@customElement("lt-sticker-pack")
export class StickerPack extends LitElement {
  @property({ type: Object })
  public stickerPack!: StickerPackType;

  static styles = css`
    .lt-sticker-pack {
      width: 100%;
      box-sizing: border-box;
      & .lt-sticker-pack-top-bar {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 12px;
        font-weight: 600;
        font-size: 14px;
        color: var(--text-secondary-01);
        position: sticky;
        top: 0;
        left: 0;
        background-color: var(--panel-background);
        backdrop-filter: blur(50px);
        & .lt-sticker-pack-name {
          max-width: calc(100% - 40px);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
      }
      & .lt-sticker-pack-content {
        padding: 3px 8px 8px;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: repeat(var(--pack-columns-count), 1fr);
        gap: 6px;
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.dispatchEvent(new CustomEvent("item-mounted", { detail: { element: this } }));
  }

  render() {
    return html`
      <div class="lt-sticker-pack">
        <div class="lt-sticker-pack-top-bar">
          <div class="lt-sticker-pack-name">${this.stickerPack?.title}</div>
        </div>
        <div class="lt-sticker-pack-content">
          ${this.stickerPack.stickers.map((item) => html`<lt-sticker-item .sticker="${item}"></lt-sticker-item>`)}
        </div>
      </div>
    `;
  }
}
