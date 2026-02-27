import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import { defaultStickerStore, StickerPack } from "./index";

import type { StickerStore, StickerPack as StickerPackType } from "@/common/types/localStickers";

@customElement("lt-sticker-list")
export class StickerList extends LitElement {
  private _observer?: IntersectionObserver;
  private _visibleItems = new Set<StickerPack>();

  static styles = css`
    .lt-sticker-list {
      min-height: 0;
      height: 100%;
      overflow-y: auto;
    }
    .lt-sticker-list::-webkit-scrollbar {
      display: none;
    }
  `;

  @property({ type: Object })
  public stickerStore: StickerStore = defaultStickerStore;

  @query(".lt-sticker-list")
  private _stickerList!: HTMLDivElement;

  public gotoPackByPath(dirPath: StickerPackType["dirPath"]) {
    const pack = Array.from(this.renderRoot.querySelectorAll(`lt-sticker-pack`)).find(
      (pack) => pack.stickerPack.dirPath === dirPath,
    );
    if (pack) {
      this._stickerList.scrollTop = pack.offsetTop;
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._initObserver();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  private _itemMounted(e: CustomEvent) {
    this._observer?.observe(e.detail.element);
  }

  private _initObserver() {
    this._observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as StickerPack;
          if (entry.isIntersecting) {
            this._visibleItems.add(target);
          } else {
            this._visibleItems.delete(target);
          }
        });
        this._calculateClosest();
      },
      {
        root: this._stickerList,
        threshold: [0, 0.1], // 只要露头就触发
      },
    );
  }

  private _calculateClosest() {
    let closest: StickerPack | null = null;
    let minTop = Infinity;
    const containerRect = this._stickerList.getBoundingClientRect();
    for (const stickerPack of this._visibleItems) {
      const rect = stickerPack.getBoundingClientRect();
      const relativeTop = rect.bottom - containerRect.top;
      console.log(stickerPack.stickerPack.title, relativeTop);
      if (relativeTop > 0 && relativeTop < minTop) {
        minTop = relativeTop;
        closest = stickerPack;
      }
    }

    console.log(">======<");
    if (closest) {
      console.log("顶部最近", closest.stickerPack.title, closest.offsetTop);
    }
    console.log("<======>");
  }

  render() {
    return html`<div class="lt-sticker-list">
      ${this.stickerStore.stickerPacks?.map(
        (pack) => html`<lt-sticker-pack @item-mounted="${this._itemMounted}" .stickerPack="${pack}"></lt-sticker-pack>`,
      ) || []}
    </div>`;
  }
}
