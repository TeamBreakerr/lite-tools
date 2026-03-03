import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { StickerBar, StickerList } from "./index";

import type { StickerStore, StickerPack } from "@/common/types/localStickers";

function log(...args: any[]) {
  console.log(...args);
}

@customElement("lt-sticker-panel")
export class StickerPanel extends LitElement {
  private _unsubscribe?: () => void;
  // 定义一些默认值，你可以把它们变成 @property 从而允许外部修改
  @property({ type: Number }) panelHeight = 420;
  @property({ type: Number }) panelWidth = 350;
  @property({ type: Number }) packColumns = 6;

  static styles = css`
    .lt-sticker-panel {
      /* 静态样式只保留布局逻辑 */
      border-radius: 8px;
      max-height: min(100vh, var(--panel-height));
      width: min(100vw, var(--panel-width));
      box-sizing: border-box;
      background-color: var(--panel-background);
      overflow: hidden;
      position: relative;

      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1fr) var(--bar-height);
    }

    .lt-sticker-panel:has(*:first-child:last-child) {
      grid-template-rows: 1fr;
    }
  `;

  @state()
  private _stickerStore: StickerStore = { status: "info", msg: "初始化中..." };

  @state()
  private _activeDirPath: StickerPack["dirPath"] = "";

  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    this._stickerStore = await lite_tools.getStickerStore();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._unsubscribe = lite_tools.onStickerStoreUpdated((stickerStore) => {
      this._stickerStore = stickerStore;
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  private _updateActivePack(e: CustomEvent) {
    log("更新当前激活的 pack", e.detail.dirPath);
    this._activeDirPath = e.detail.dirPath;
    const stickerList = this.renderRoot.querySelector("lt-sticker-list") as StickerList;
    stickerList.gotoPackByPath(e.detail.dirPath);
  }

  private _updateTopPack(e: CustomEvent) {
    log("更新顶部 pack", e.detail);
    this._activeDirPath = e.detail.dirPath;
    const stickerBar = this.renderRoot.querySelector("lt-sticker-bar") as StickerBar;
    stickerBar.selectPackIcon(e.detail.dirPath);
  }

  render() {
    // 2. 构建动态样式对象
    const panelStyles = {
      "--panel-height": `${this.panelHeight}px`,
      "--panel-width": `${this.panelWidth}px`,
      "--panel-background": "var(--background-05)",
      "--bar-height": "36px",
      "--bar-width": `${this.panelWidth}px`,
      "--bar-item-padding": "3px",
      "--pack-columns-count": this.packColumns,
      "--hover-background": "var(--background-02)",
    };

    return html`<div class="lt-sticker-panel" style=${styleMap(panelStyles)}>
      ${this._stickerStore.status === "success"
        ? html`<lt-sticker-list
              @updateTopPack="${this._updateTopPack}"
              .stickerStore="${this._stickerStore}"
            ></lt-sticker-list>
            <lt-sticker-bar
              @gotoPack="${this._updateActivePack}"
              .activeDirPath="${this._activeDirPath}"
              .stickerStore="${this._stickerStore}"
            ></lt-sticker-bar>`
        : html`<lt-sticker-msg .stickerStore="${this._stickerStore}"></lt-sticker-msg>`}
    </div>`;
  }
}

// 测试
setTimeout(() => {
  document.querySelector(".test")!.innerHTML = `<lt-sticker-panel></lt-sticker-panel>`;
}, 100);
