import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";

import type { StickerPack as StickerPackType, Sticker } from "@/common/types/localStickers";

@customElement("lt-sticker-item")
export class StickerItem extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-width: 0;
      min-height: 0;
      aspect-ratio: 1 / 1;
    }

    .lt-sticker-item {
      width: 100%;
      height: 100%;
      cursor: pointer;
      font-size: 0;
      border-radius: 6px;
      content-visibility: auto;
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 6px;
        pointer-events: none;
        user-select: none;
        overflow: hidden;
        opacity: 0;
        transition: opacity 150ms;
      }
      svg {
        width: 100%;
        height: 100%;
        color: #cdcdcd;
      }
      &:hover {
        background-color: var(--hover-background);
        box-shadow: 0 0 0 3px var(--hover-background);
      }
      &:hover:active {
        background-color: var(--overlay_pressed);
        box-shadow: 0 0 0 3px var(--overlay_pressed);
      }
    }
  `;

  static ERR_ICON = html`<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M854.5 82h-685c-58.2 0-105.4 49.2-105.4 109.8v640.4c0 60.6 47.2 109.8 105.4 109.8h685.1c58.2 0 105.4-49.2 105.4-109.8V191.8C959.9 131.2 912.7 82 854.5 82zM223.6 223.3l11.3-11.7c8.1-8.4 54.7 22.5 101.4 64.9 46.9-42.8 93.4-73.4 101.5-64.9l11.3 11.7c9.6 10-20.2 57.3-61.3 105.3 41.9 47.3 71.3 94.3 60.6 105.5l-11.3 11.7c-10.6 11-55.3-19.8-100.8-63.1-45.4 43-90.3 74-100.8 63.1L224.3 434c-10.5-11 19.3-58.3 60.7-105.5-40.9-47.8-70.9-95.3-61.4-105.2z m630.9 590.6c-12.9 41.9 0.6 36.6-333.7 36.6-338.1 0-342.2-0.8-351.3-47.8-14.2-73.5 64.8-246.2 122.9-208.3 24.9 16.2 81.4 72.5 105.4 73.2 126.9 3.9 212.1-237.9 298.6-237.9 82.3 0 190.8 278.1 158.1 384.2z"
      fill="currentColor"
      p-id="2104"
    ></path>
  </svg>`;

  @state()
  _isError = false;

  @state()
  _opacity = 0;

  @property({ type: Object })
  sticker!: Sticker;

  render() {
    return html`
      <div class="lt-sticker-item">
        ${!this._isError
          ? html`<img
              loading="lazy"
              style="opacity: ${this._opacity}"
              @load="${() => (this._opacity = 1)}"
              @error="${() => (this._isError = true)}"
              src="appimg://${this.sticker.path!}"
            />`
          : StickerItem.ERR_ICON}
      </div>
    `;
  }
}

@customElement("lt-sticker-pack")
export class StickerPack extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .lt-sticker-pack {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      container-type: inline-size;
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
        z-index: 1;
        background-color: var(--panel-background);
        & .lt-sticker-pack-name {
          max-width: calc(100% - 20px);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }
      }
      & .lt-sticker-pack-content {
        --gap: 6px;
        --cols: var(--pack-columns-count);

        width: 100%;
        padding: 3px 8px 8px;
        box-sizing: border-box;
        display: grid;
        overflow: auto;
        grid-template-columns: repeat(var(--pack-columns-count), minmax(0, 1fr));
        height: calc(
          (var(--rows) * ((100cqw - 16px - ((var(--cols) - 1) * var(--gap))) / var(--cols))) +
            ((var(--rows) - 1) * var(--gap)) + 11px
        );
        gap: var(--gap);
      }
    }
  `;

  @property({ type: Object })
  public stickerPack!: StickerPackType;

  @property({ type: Boolean })
  public isVisible: boolean = false;

  @property({ type: Number })
  public stickersPerRow = 6;

  private get _estimatedRows() {
    const total = this.stickerPack?.stickers?.length ?? 0;
    const cols = this.stickersPerRow || 1; // 确保分母至少为 1
    return Math.ceil(total / cols);
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {}

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
        <div style="--rows: ${this._estimatedRows}" class="lt-sticker-pack-content">
          ${this.isVisible
            ? this.stickerPack.stickers.map(
                (item) => html`<lt-sticker-item .isVisible="${this.isVisible}" .sticker="${item}"></lt-sticker-item>`,
              )
            : ""}
        </div>
      </div>
    `;
  }
}
