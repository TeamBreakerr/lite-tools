import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import type { ToastIconType } from "@/common/types/toastManager";

@customElement("lt-toast-icon")
export class ToastIcon extends LitElement {
  @property()
  type: ToastIconType = "default";

  static styles = css`
    :host {
      margin-right: 8px;
      display: block;
      width: 16px;
      height: 16px;
    }
    i {
      display: inline-block;
      width: 16px;
      height: 16px;
    }

    i[data-type="default"] {
      color: #0099ff;
    }

    i[data-type="error"] {
      color: #ff5967;
    }

    i[data-type="success"] {
      color: #15d173;
    }
  `;

  static defaultIcon = html`
    <i data-type="default">
      <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM8.5 6.5V11.5H7.5V6.5H8.5ZM8.5 5.5V4.5H7.5V5.5H8.5Z"
        ></path>
      </svg>
    </i>
  `;

  static errorIcon = html`
    <i data-type="error">
      <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM8.5 4.5V9.5H7.5V4.5H8.5ZM8.5 11.5V10.5H7.5V11.5H8.5Z"
        ></path>
      </svg>
    </i>
  `;

  static successIcon = html`
    <i data-type="success">
      <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM7.45232 10.2991L11.3555 6.35155L10.6445 5.64845L7.08919 9.2441L5.22771 7.44087L4.53193 8.15913L6.74888 10.3067L7.10435 10.651L7.45232 10.2991Z"
        ></path>
      </svg>
    </i>
  `;

  render() {
    switch (this.type) {
      case "success":
        return ToastIcon.successIcon;
      case "error":
        return ToastIcon.errorIcon;
      case "default":
      default:
        return ToastIcon.defaultIcon;
    }
  }
}
