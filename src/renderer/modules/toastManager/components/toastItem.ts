import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import type { ToastIconType } from "@/common/types/toastManager";

@customElement("lt-toast-item")
export class ToastItem extends LitElement {
  @property()
  toastId = "";

  @property()
  type: ToastIconType = "default";

  @property()
  content = "";

  @property({ type: Number })
  duration = 3000;

  @property({ type: Boolean, reflect: true })
  visible = false;

  @state()
  private isMounted = false;

  private timeoutId?: number;

  static styles = css`
    :host {
      display: block;
      pointer-events: none;
    }

    .lt-toast-item {
      display: flex;
      align-items: flex-end;
      justify-content: center;
      opacity: 0;
      transform: translateY(-30px) scale(0.8);
      height: 0;
      transition: 500ms;
      position: relative;
      width: 100%;
    }

    .lt-toast-item.show {
      opacity: 1;
      height: var(--lt-toast-item-height);
      transform: translateY(0) scale(1);
    }

    .lt-toast-content {
      display: flex;
      align-items: center;
      justify-content: center;
      height: auto;
      background-color: var(--lt-toast-bg);
      box-shadow:
        var(--lt-toast-shadow),
        inset 0 0 0 1.5px var(--lt-border-standard);
      border-radius: 12px;
      box-sizing: border-box;
      padding: 14px 16px;
      max-width: calc(100% - var(--lt-toast-margin) * 2);
    }

    .lt-toast-text {
      overflow: hidden;
      text-overflow: ellipsis;
      word-break: break-word;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.5;
      flex-shrink: 0;
    }
  `;

  connectedCallback() {
    super.connectedCallback();

    requestAnimationFrame(() => {
      this.isMounted = true;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimer();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("duration") || changed.has("visible") || changed.has("isMounted")) {
      this.syncAutoCloseTimer();
    }
  }

  private syncAutoCloseTimer() {
    this.clearTimer();
    if (!this.visible || !this.isMounted) return;
    if (this.duration <= 0) return;

    this.timeoutId = window.setTimeout(() => {
      this.requestClose();
    }, this.duration);
  }

  private clearTimer() {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }

  /**
   * 请求关闭：通知 container 把 visible 改为 false
   */
  private requestClose() {
    this.dispatchEvent(
      new CustomEvent("request-close", {
        bubbles: true,
        composed: true,
        detail: { id: this.toastId },
      }),
    );
  }

  /**
   * 过渡结束后，如果当前是隐藏状态，则通知 container 真正删除
   */
  private handleTransitionEnd(event: TransitionEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "opacity") return;
    if (this.visible && this.isMounted) return;

    this.dispatchEvent(
      new CustomEvent("closed", {
        bubbles: true,
        composed: true,
        detail: { id: this.toastId },
      }),
    );
  }

  render() {
    const shouldShow = this.visible && this.isMounted;

    return html`
      <div class="lt-toast-item ${shouldShow ? "show" : ""}" @transitionend=${this.handleTransitionEnd}>
        <div class="lt-toast-content">
          <lt-toast-icon .type=${this.type}></lt-toast-icon>
          <span class="lt-toast-text">${this.content}</span>
        </div>
      </div>
    `;
  }
}
