import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { StickerBar, StickerList } from "../index";

import type { StickerStore, StickerPack } from "@/common/types/localStickers";

@customElement("lt-sticker-panel")
export class StickerPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .lt-sticker-panel {
      border-radius: 8px;
      isolation: isolate;
      width: min(100vw, var(--panel-width));
      height: 100%;
      max-height: min(100vh, var(--panel-height));
      box-sizing: border-box;
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

  @property({ type: Number })
  panelWidth = 350;

  @property({ type: Number })
  panelHeight = 420;

  @property({ type: Object })
  stickerStore!: StickerStore;

  @property({ type: Number })
  stickersPerRow!: number;

  @property({ type: Boolean })
  showPanel = false;

  @state()
  private _activeDirPath: StickerPack["dirPath"] = "";

  private _updateActivePack(e: CustomEvent) {
    if (!this.showPanel) return;
    console.log("更新激活贴纸");
    this._activeDirPath = e.detail.dirPath;
    const stickerList = this.renderRoot.querySelector("lt-sticker-list") as StickerList;
    stickerList.gotoPackByPath(e.detail.dirPath);
  }

  private _updateTopPack(e: CustomEvent) {
    if (!this.showPanel) return;
    console.log("更新顶部贴纸");
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
      "--pack-columns-count": this.stickersPerRow,
      "--hover-background": "var(--background-02)",
    };

    return html`<div class="lt-sticker-panel" style=${styleMap(panelStyles)}>
      ${this.stickerStore.status === "success"
        ? html`<lt-sticker-list
              @updateTopPack="${this._updateTopPack}"
              .stickerStore="${this.stickerStore}"
              .stickersPerRow="${this.stickersPerRow}"
            ></lt-sticker-list>
            <lt-sticker-bar
              @gotoPack="${this._updateActivePack}"
              .activeDirPath="${this._activeDirPath}"
              .stickerStore="${this.stickerStore}"
            ></lt-sticker-bar>`
        : html`<lt-sticker-msg .stickerStore="${this.stickerStore}"></lt-sticker-msg>`}
    </div>`;
  }
}
