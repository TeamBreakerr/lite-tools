import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";

@customElement("lt-sticker-full-viewer")
export class StickerFullViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .lt-sticker-full-viewer {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10000;
      pointer-events: none;
      user-select: none;
      overflow: hidden;
      transition: opacity 150ms;
      backdrop-filter: unset;
      background-color: color(from var(--background_05) srgb r g b / 0.6);
      opacity: 0;

      display: flex;
      align-items: center;
      justify-content: center;

      &.blur {
        transition: backdrop-filter 150ms;
        &.show {
          backdrop-filter: blur(20px);
        }
      }

      &.show {
        opacity: 1;
      }

      img,
      svg {
        width: 325px;
        height: 325px;
        object-fit: contain;
        aspect-ratio: 1 / 1;
        color: #cdcdcd;
      }
    }
  `;

  @state()
  private isError = false;

  @property({ type: String })
  stickerPath?: string;

  @property({ type: Boolean })
  show = false;

  willUpdate(changedProperties: PropertyValues<StickerFullViewer>) {
    if (changedProperties.has("stickerPath")) {
      this.isError = false;
    }
  }

  static ERR_ICON = html`<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M854.5 82h-685c-58.2 0-105.4 49.2-105.4 109.8v640.4c0 60.6 47.2 109.8 105.4 109.8h685.1c58.2 0 105.4-49.2 105.4-109.8V191.8C959.9 131.2 912.7 82 854.5 82zM223.6 223.3l11.3-11.7c8.1-8.4 54.7 22.5 101.4 64.9 46.9-42.8 93.4-73.4 101.5-64.9l11.3 11.7c9.6 10-20.2 57.3-61.3 105.3 41.9 47.3 71.3 94.3 60.6 105.5l-11.3 11.7c-10.6 11-55.3-19.8-100.8-63.1-45.4 43-90.3 74-100.8 63.1L224.3 434c-10.5-11 19.3-58.3 60.7-105.5-40.9-47.8-70.9-95.3-61.4-105.2z m630.9 590.6c-12.9 41.9 0.6 36.6-333.7 36.6-338.1 0-342.2-0.8-351.3-47.8-14.2-73.5 64.8-246.2 122.9-208.3 24.9 16.2 81.4 72.5 105.4 73.2 126.9 3.9 212.1-237.9 298.6-237.9 82.3 0 190.8 278.1 158.1 384.2z"
      fill="currentColor"
      p-id="2104"
    ></path>
  </svg>`;

  render() {
    return html`<div class="lt-sticker-full-viewer ${this.show ? "show" : ""}">
      ${!this.isError
        ? html`<img src="appimg://${this.stickerPath}" @error="${() => (this.isError = true)}" />`
        : StickerFullViewer.ERR_ICON}
    </div>`;
  }
}
