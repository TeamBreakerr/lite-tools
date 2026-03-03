import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import type { StickerStore } from "@/common/types/localStickers";

@customElement("lt-sticker-msg")
export class StickerMsg extends LitElement {
  @property({ type: Object })
  stickerStore!: StickerStore;

  static styles = css`
    .lt-sticker-msg {
      width: 100%;
      height: 100%;
      font-size: 18px;
      line-height: 42px;
      text-align: center;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px;
      overflow: auto;
      font-weight: 600;
    }
    .lt-sticker-msg.info {
      color: var(--text-secondary-02);
    }
    .lt-sticker-msg.failed {
      color: var(--text-error);
    }
    .lt-sticker-msg span {
      display: block;
    }
  `;

  render() {
    return html`<div class="lt-sticker-msg ${this.stickerStore.status === "info" ? "info" : "failed"}">
      <span>${this.stickerStore.msg}</span>
    </div>`;
  }
}
