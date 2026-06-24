import { LitElement, css, html, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";

import { getPicList, getRecallSenderName, getRecallTail, getTextContent, jumpToRecallMessage } from "../utils";

@customElement("lt-recall-message-item")
export class RecallMessageItem extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .msg-item {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      margin-bottom: 12px;
    }

    .msg-box {
      width: auto;
      max-width: calc(100% - 32px);
    }

    .user-name {
      margin: 0;
      font-size: 12px;
      padding-left: 8px;
      color: var(--msg-content-text-color);
    }

    .msg-content {
      width: 100%;
      min-width: calc(var(--tail-width, 0px) + 20px);
      margin-top: 4px;
      height: auto;
      background-color: var(--msg-content-bg-color);
      color: var(--msg-content-text-color);
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
      padding: 8px 10px;
      cursor: pointer;
    }

    .msg-text-box {
      width: 100%;
      height: auto;
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      font-size: 14px;
      min-height: 18px;
    }

    .msg-img-list {
      width: 100%;
      height: auto;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      flex-wrap: wrap;
    }

    .msg-img-item {
      width: 132px;
      height: 132px;
      margin-right: 4px;
      margin-bottom: 4px;
      border-radius: 6px;
      overflow: hidden;
      background-color: var(--msg-img-item-bg-color);
    }

    .msg-img-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .msg-text {
      margin: 0;
      word-break: break-all;
    }

    .tail {
      right: 0px;
      float: right;
      font-size: 12px;
      line-height: 16px;
      width: auto;
      text-align: right;
      margin-left: 6px;
      white-space: nowrap;
      visibility: hidden;
      user-select: none;
    }

    .tail::after {
      content: attr(time);
      visibility: visible;
      position: absolute;
      display: block;
      width: auto;
      text-align: right;
      font-size: 12px;
      line-height: 11px;
      bottom: 0;
      right: 0;
      opacity: 0.6;
    }
  `;

  @property({ attribute: false })
  message?: Message;

  @query(".tail")
  private tailEl?: HTMLElement;

  @state()
  private tailWidth = 0;

  protected updated() {
    const nextTailWidth = Math.ceil(this.tailEl?.getBoundingClientRect().width ?? 0);
    if (nextTailWidth !== this.tailWidth) {
      this.tailWidth = nextTailWidth;
    }
  }

  private handleJump() {
    if (!this.message) return;
    jumpToRecallMessage(this.message);
  }

  render() {
    if (!this.message) return nothing;

    const textContent = getTextContent(this.message.elements);
    const picList = getPicList(this.message.elements);
    const unsupported = !textContent.length && !picList.length;
    const recallTail = getRecallTail(this.message);

    return html`
      <div class="msg-item">
        <div class="msg-box">
          <p class="user-name">${getRecallSenderName(this.message)}</p>
          <div class="msg-content" style=${styleMap({ "--tail-width": `${this.tailWidth}px` })} @click=${this.handleJump}>
            ${picList.length
              ? html`<div class="msg-img-list">
                  ${repeat(
                    picList,
                    (pic) => pic,
                    (pic) => html`
                      <div class="msg-img-item">
                        <img src=${`appimg://${pic}`} alt="加载失败" />
                      </div>
                    `,
                  )}
                </div>`
              : ""}
            <div class="msg-text-box">
              <p class="msg-text">
                ${unsupported ? "[不支持的消息类型]" : textContent}
                <span class="tail" time=${recallTail}>${recallTail}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lt-recall-message-item": RecallMessageItem;
  }
}
