import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("lt-sticker-icon")
export class StickerIcon extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .lt-sticker-icon {
      align-items: center;
      display: flex;
      position: relative;
      cursor: pointer;
      &::before {
        content: "";
        border-radius: 8px;
        height: 32px;
        pointer-events: none;
        position: absolute;
        transition: opacity 0.1s linear;
        width: max(32px, 100%);
      }
      &:hover:before {
        background: var(--overlay_hover);
      }
      &:hover:active:before {
        background: var(--overlay_pressed);
      }
      &:hover .flot-card {
        opacity: 1;
        transition-delay: 200ms;
      }
      .icon-item {
        align-items: center;
        display: flex;
        flex-grow: 0;
        flex-shrink: 0;
        font-size: 20px;
        justify-content: center;
        line-height: 0;
        position: relative;
        padding: 6px;
        svg {
          width: 20px;
          height: 20px;
          color: var(--icon_primary);
        }
      }
      .flot-card {
        background-clip: padding-box;
        background-color: var(--bg_top_light);
        border: var(--border_secondary);
        border-radius: 4px;
        box-shadow: var(--shadow_bg_top);
        padding: 4px 6px;
        text-align: center;
        user-select: none;
        white-space: nowrap;
        font-size: 12px;
        position: absolute;
        z-index: 1000;
        left: 50%;
        top: -29px;
        transform: translateX(-50%);
        opacity: 0;
        pointer-events: none;
      }
    }
  `;

  // 接收从 Container 传来的状态，决定是否隐藏浮动提示
  @property({ type: Boolean })
  public showPanel = false;

  static readonly ICON = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <path
      fill="currentColor"
      d="M185,190H15c-8.3,0-15-6.7-15-14.9V24.9C0,16.7,6.7,10,15,10h87.7c8.3,0,15,6.7,15,14.9v13.3c0,2.8,2.2,5,5,5H185
	c8.3,0,15,6.7,15,14.9v116.9C200,183.3,193.3,190,185,190z M20,24.6c-2.6,0-4.7,2.1-4.7,4.7v141.5c0,2.6,2.1,4.7,4.7,4.7H180
	c2.6,0,4.7-2.1,4.7-4.7V60.6c0-2.6-2.1-4.7-4.7-4.7h-59.6c-7.8,0-15.1-6.3-15.1-14.1V29.3c0-2.6-2.1-4.7-4.7-4.7L20,24.6L20,24.6z"
    />
    <path
      fill="currentColor"
      d="M51.3,134.5c26.9,26.9,70.6,26.9,97.5,0c0,0,0,0,0,0c2.9-2.9,2.9-7.6,0-10.4c-2.9-2.9-7.6-2.9-10.4,0
	c-21.2,21.1-55.4,21.1-76.6,0c-2.9-2.9-7.6-2.9-10.4,0C48.4,126.9,48.4,131.6,51.3,134.5C51.3,134.5,51.3,134.5,51.3,134.5z"
    />
    <path
      fill="currentColor"
      d="M53.8,84.3c0,6.4,5.2,11.5,11.5,11.5s11.5-5.2,11.5-11.5c0-6.4-5.2-11.5-11.5-11.5C59,72.7,53.8,77.9,53.8,84.3L53.8,84.3z"
    />
    <path
      fill="currentColor"
      d="M123.1,84.3c0,6.4,5.2,11.5,11.5,11.5c6.4,0,11.5-5.2,11.5-11.5c0,0,0,0,0,0c0-6.4-5.2-11.5-11.5-11.5
	C128.3,72.7,123.1,77.9,123.1,84.3C123.1,84.2,123.1,84.2,123.1,84.3z"
    />
  </svg>`;

  render() {
    return html`
      <div class="lt-sticker-icon">
        <div style="display: ${!this.showPanel ? "block" : "none"}" class="flot-card">本地贴纸</div>
        <div class="icon-item" aria-label="本地贴纸" tabindex="0">${StickerIcon.ICON}</div>
      </div>
    `;
  }
}