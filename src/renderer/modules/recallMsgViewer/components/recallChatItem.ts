import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import { CHAT_TYPE_LABEL } from "../utils";

@customElement("lt-recall-chat-item")
export class RecallChatItem extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    button {
      cursor: pointer;
      width: 100%;
      min-height: 32px;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      padding: 6px 8px;
      justify-content: flex-start;
      font: inherit;
      font-size: 14px;
      color: var(--sidebar-text-color);
      border: 0;
      border-radius: 4px;
      background: transparent;
      transition:
        background-color 0.15s ease,
        color 0.15s ease;
      text-align: left;
    }

    button:hover:not(:disabled) {
      background-color: var(--sidebar-hover-bg-color);
    }

    button.active {
      background-color: var(--sidebar-active-bg-color) !important;
      color: var(--sidebar-active-text-color);
    }

    button:disabled {
      cursor: default;
      opacity: 0.8;
    }

    span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 2px;
    }

    .chat-type {
      flex: 0 0 16px;
      font-size: 10px;
      display: inline-block;
      height: 16px;
      width: 16px;
      text-align: center;
      background-color: var(--chat-tag-bg-color);
      color: var(--chat-tag-text-color);
      border-radius: 4px;
    }

    .peer-name {
      min-width: 0;
    }

    .peer-uid {
      opacity: 0.7;
      flex-shrink: 0;
    }
  `;

  @property()
  peerUid = "";

  @property()
  peerName = "";

  @property()
  peerUin = "";

  @property({ type: Number })
  chatType = 0;

  @property({ type: Boolean })
  active = false;

  @property({ type: Boolean })
  disabled = false;

  @property()
  tag = "";

  private get chatTypeLabel() {
    return this.tag || CHAT_TYPE_LABEL[this.chatType] || "";
  }

  private handleClick() {
    if (this.disabled || !this.peerUid) return;

    this.dispatchEvent(
      new CustomEvent("lt-recall-chat-select", {
        detail: {
          peerUid: this.peerUid,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    return html`
      <button
        class=${classMap({ active: this.active })}
        ?disabled=${this.disabled}
        title=${this.peerUin ? `${this.peerName} ${this.peerUin}` : this.peerName}
        @click=${this.handleClick}
      >
        ${this.chatTypeLabel ? html`<span class="chat-type">${this.chatTypeLabel}</span>` : ""}
        <span class="peer-name">${this.peerName}</span>
        ${this.peerUin ? html`<span class="peer-uid">(${this.peerUin})</span>` : ""}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lt-recall-chat-item": RecallChatItem;
  }
}
