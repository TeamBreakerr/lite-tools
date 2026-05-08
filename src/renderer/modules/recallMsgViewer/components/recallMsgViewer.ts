import { LitElement, css, html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import { decodeRecallMessages, normalizeChatList } from "../utils";
import type { RecallChatItemData, RecallChatSelectEvent } from "../types";

import "./recallChatItem";
import "./recallMessageItem";

@customElement("lt-recall-msg-viewer")
export class RecallMsgViewer extends LitElement {
  static styles = css`
    :host {
      --sider-bar-minwidth: 250px;
      --sider-bar-widhth: 30%;
      --sider-bar-maxwidth: 350px;
      --scrollbar-thumb-color: #0000001a;
      --sidebar-active-bg-color: #0099ff;
      --sidebar-active-text-color: #ffffff;
      --sidebar-bg-color: #ffffff;
      --sidebar-text-color: #111111;
      --msg-content-bg-color: #ffffff;
      --msg-content-text-color: #111111;
      --msg-img-item-bg-color: #f2f2f2;
      --content-list-bg-color: #f2f2f2;
      --sidebar-hover-bg-color: rgba(0, 153, 255, 0.1);
      --chat-tag-bg-color: #90a4ae;
      --chat-tag-text-color: #ffffff;
      --empty-text-color: #777777;
      --message-unsupported-color: #0d6ecf;
      display: block;
      width: 100%;
      height: 100vh;
      font-family: Arial, sans-serif;
      color: var(--msg-content-text-color);
      background-color: var(--content-list-bg-color);
    }

    @media (prefers-color-scheme: dark) {
      :host {
        --scrollbar-thumb-color: #ffffff3d;
        --sidebar-active-bg-color: #0d6ecf;
        --sidebar-active-text-color: #ffffffe6;
        --sidebar-bg-color: #1b1b1b;
        --sidebar-text-color: #ffffffe6;
        --msg-content-bg-color: #262626;
        --msg-content-text-color: #ffffffe6;
        --msg-img-item-bg-color: #111111;
        --content-list-bg-color: #111111;
        --sidebar-hover-bg-color: rgba(0, 153, 255, 0.3);
        --chat-tag-bg-color: #67767e;
        --chat-tag-text-color: #ffffffa1;
        --empty-text-color: #ffffff8c;
        --message-unsupported-color: #5baeff;
      }
    }

    * {
      box-sizing: border-box;
    }

    *::-webkit-scrollbar {
      height: 8px;
      width: 8px;
    }

    *::-webkit-scrollbar-thumb {
      background-color: transparent;
      border-radius: 10px;
    }

    *:hover::-webkit-scrollbar-thumb {
      background-color: var(--scrollbar-thumb-color);
    }

    .data {
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      background-color: var(--content-list-bg-color);
    }

    .qq-number-filter {
      width: var(--sider-bar-widhth);
      min-width: var(--sider-bar-minwidth);
      max-width: var(--sider-bar-maxwidth);
      height: 100vh;
      overflow: auto;
      background-color: var(--sidebar-bg-color);
      padding: 10px 6px;
      flex: 0 0 auto;
    }

    .msg-list {
      width: calc(100% - min(var(--sider-bar-widhth), var(--sider-bar-maxwidth)));
      max-width: calc(100% - var(--sider-bar-minwidth));
      min-width: 400px;
      padding: 20px 10px;
      height: 100vh;
      overflow: auto;
      box-sizing: border-box;
      background-color: var(--content-list-bg-color);
    }

    .empty-state {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--empty-text-color);
      font-size: 14px;
    }
  `;

  @state()
  private chats: RecallChatItemData[] = [];

  @state()
  private messages: Message[] = [];

  @state()
  private selectedPeerUid = "";

  @state()
  private loadingChats = true;

  @state()
  private loadingMessages = false;

  @state()
  private errorMessage = "";

  @query(".msg-list")
  private msgListEl?: HTMLElement;

  protected firstUpdated() {
    this.loadChats();
  }

  private async loadChats() {
    this.loadingChats = true;
    this.errorMessage = "";

    try {
      const chatList = await lt_showRecallList.getAllRecallChatList();
      this.chats = normalizeChatList(chatList);
    } catch (err: any) {
      this.errorMessage = `加载撤回列表失败：${err?.message || err}`;
      this.chats = [];
    } finally {
      this.loadingChats = false;
    }
  }

  private async handleChatSelect(event: RecallChatSelectEvent) {
    this.selectedPeerUid = event.detail.peerUid;
    this.loadingMessages = true;
    this.errorMessage = "";
    this.messages = [];

    try {
      const buffer = await lt_showRecallList.getRecallMessagesByUid(this.selectedPeerUid);
      this.messages = decodeRecallMessages(buffer).reverse();
      await this.updateComplete;
      this.msgListEl?.scrollTo({ top: 0 });
    } catch (err: any) {
      this.errorMessage = `加载撤回消息失败：${err?.message || err}`;
      this.messages = [];
    } finally {
      this.loadingMessages = false;
    }
  }

  private renderChatList() {
    if (this.loadingChats) {
      return html`<lt-recall-chat-item peerName="加载数据中..." ?disabled=${true}></lt-recall-chat-item>`;
    }

    if (!this.chats.length) {
      return html`<lt-recall-chat-item tag="空" peerName="没有撤回数据" ?disabled=${true}></lt-recall-chat-item>`;
    }

    return repeat(
      this.chats,
      (item) => item.peerUid,
      (item) => html`
        <lt-recall-chat-item
          .peerUid=${item.peerUid}
          .peerName=${item.peerName}
          .peerUin=${item.peerUin}
          .chatType=${item.chatType}
          ?active=${item.peerUid === this.selectedPeerUid}
        ></lt-recall-chat-item>
      `,
    );
  }

  private renderMessages() {
    if (this.errorMessage) {
      return html`<div class="empty-state">${this.errorMessage}</div>`;
    }

    if (this.loadingMessages) {
      return html`<div class="empty-state">加载消息中...</div>`;
    }

    if (!this.selectedPeerUid) {
      return html`<div class="empty-state">请选择左侧会话</div>`;
    }

    if (!this.messages.length) {
      return html`<div class="empty-state">该会话没有撤回数据</div>`;
    }

    return repeat(
      this.messages,
      (message) => `${message.msgId}-${message.lt_recall?.recallTime || message.msgTime}`,
      (message) => html`<lt-recall-message-item .message=${message}></lt-recall-message-item>`,
    );
  }

  render() {
    return html`
      <div class="data" @lt-recall-chat-select=${this.handleChatSelect}>
        <div class="qq-number-filter">${this.renderChatList()}</div>
        <div class="msg-list">${this.renderMessages()}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "lt-recall-msg-viewer": RecallMsgViewer;
  }
}
