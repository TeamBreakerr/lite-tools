import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";

import type { ToastIconType } from "@/common/types/toastManager";

interface ToastData {
  id: string;
  content: string;
  type: ToastIconType;
  duration: number;
  visible: boolean;
}

interface ToastCloseDetail {
  id: string;
}

@customElement("lt-toast-container")
export class ToastContainer extends LitElement {
  @state()
  private toastList: ToastData[] = [];

  static styles = css`
    :host {
      --lt-toast-item-height: 58px;
      --lt-toast-margin: 12px;
      --lt-toast-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 5000;
      pointer-events: none;
      width: 100vw;
    }

    .lt-toast {
      display: flex;
      left: 0;
      right: 0;
      top: 0;
      align-items: center;
      flex-direction: column;
      width: 100%;
    }
  `;

  public show(content: string, type: ToastIconType = "default", duration = 3000) {
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

    const item: ToastData = {
      id,
      content,
      type,
      duration,
      visible: true,
    };

    this.toastList = [...this.toastList, item];
  }

  public clear() {
    this.toastList = this.toastList.map((toast) => ({
      ...toast,
      visible: false,
    }));
  }

  private handleToastClose(id: string) {
    this.toastList = this.toastList.map((toast) => (toast.id === id ? { ...toast, visible: false } : toast));
  }

  private handleToastClosed(id: string) {
    this.toastList = this.toastList.filter((toast) => toast.id !== id);
  }

  private handleToastCloseRequest(event: CustomEvent<ToastCloseDetail>) {
    event.stopPropagation();
    this.handleToastClose(event.detail.id);
  }

  private handleToastClosedEvent(event: CustomEvent<ToastCloseDetail>) {
    event.stopPropagation();
    this.handleToastClosed(event.detail.id);
  }

  render() {
    return html`
      <div class="lt-toast">
        ${repeat(
          this.toastList,
          (toast) => toast.id,
          (toast) => html`
            <lt-toast-item
              .toastId=${toast.id}
              .content=${toast.content}
              .type=${toast.type}
              .duration=${toast.duration}
              .visible=${toast.visible}
              @request-close=${this.handleToastCloseRequest}
              @closed=${this.handleToastClosedEvent}
            >
            </lt-toast-item>
          `,
        )}
      </div>
    `;
  }
}
