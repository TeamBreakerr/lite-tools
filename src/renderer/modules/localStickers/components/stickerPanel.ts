import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import { defaultStickerStore, StickerList } from "./index";

import type { StickerStore, StickerPack } from "@/common/types/localStickers";

function log(...args: any[]) {
  console.log(...args);
}

@customElement("lt-sticker-panel")
export class StickerPanel extends LitElement {
  private _unsubscribe?: () => void;

  static styles = css`
    .lt-sticker-panel {
      --panel-height: 420px;
      --panel-width: 350px;
      --panel-background: var(--background-05);
      --bar-height: 36px;
      --bar-width: var(--panel-width);
      --bar-item-padding: 3px;

      --pack-columns-count: 6;

      --hover-background: var(--background-02);

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
  private _stickerStore: StickerStore = defaultStickerStore;

  @state()
  private _activeDirPath: StickerPack["dirPath"] = "";

  // 生命周期
  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    this._stickerStore = await lite_tools.getStickerStore();
  }

  // 实例创建
  connectedCallback(): void {
    super.connectedCallback();
    this._unsubscribe = lite_tools.onStickerStoreUpdated((store) => {
      this._stickerStore = store;
    });
  }

  // 实例销毁
  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }

  // 更新当前激活的 pack
  private _updateActivePack(e: CustomEvent) {
    log("更新当前激活的 pack", e.detail);
    this._activeDirPath = e.detail.dirPath;
    const stickerList = this.renderRoot.querySelector("lt-sticker-list") as StickerList;
    stickerList.gotoPackByPath(e.detail.dirPath);
  }

  // 渲染
  render() {
    return html`<div class="lt-sticker-panel">
      ${this._stickerStore.status === "success"
        ? html`<lt-sticker-list .stickerStore="${this._stickerStore}"></lt-sticker-list>
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
