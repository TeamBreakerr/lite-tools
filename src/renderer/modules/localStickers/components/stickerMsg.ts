import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { StickerStore } from "@/common/types/localStickers";

@customElement("lt-sticker-msg")
export class StickerMsg extends LitElement {
  @property({ type: Object })
  stickerStore!: StickerStore;

  static styles = css`
    :host {
      display: block;
    }
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
      background-color: var(--panel-background);
      &.info {
        color: var(--text-secondary-02);
      }
      &.failed {
        color: var(--text-error);
      }
      span {
        display: block;
      }
    }
  `;

  render() {
    return html`<div class="lt-sticker-msg ${this.stickerStore.status === "info" ? "info" : "failed"}">
      <span>${this.stickerStore.msg}</span>
    </div>`;
  }
}
