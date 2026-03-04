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
        transition: opacity 300ms;
      }
      &:hover {
        background-color: var(--hover-background);
        box-shadow: 0 0 0 3px var(--hover-background);
      }
    }
  `;

  @state()
  _opacity = 0;

  @property({ type: Object })
  sticker!: Sticker;

  render() {
    return html`
      <div class="lt-sticker-item">
        <img
          loading="lazy"
          style="opacity: ${this._opacity}"
          @load="${() => (this._opacity = 1)}"
          src="${this.sticker.path!}"
        />
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
          max-width: calc(100% - 40px);
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
          <div class="lt-sticker-pack-name">${this.stickerPack?.title}[${this.stickerPack?.index}]</div>
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
