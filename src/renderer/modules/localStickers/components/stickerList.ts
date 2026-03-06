import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

import type { StickerPack } from "../index";

import type { StickerStore, StickerPack as StickerPackType } from "@/common/types/localStickers";

@customElement("lt-sticker-list")
export class StickerList extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .lt-sticker-list {
      min-height: 0;
      min-width: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: color(from var(--blur_middle_standard) srgb r g b / 1);
      position: relative;
    }
    .lt-sticker-list::-webkit-scrollbar {
      display: none;
    }
  `;

  @property({ type: Object })
  stickerStore!: StickerStore;

  @property({ type: Number })
  stickersPerRow = 6;

  @query(".lt-sticker-list")
  private _stickerList!: HTMLDivElement;

  private _observer?: IntersectionObserver;
  private _visibleItems = new Set<StickerPack>();
  private _ignoreScroll = false;

  gotoPackByPath(dirPath: StickerPackType["dirPath"]) {
    const pack = Array.from(this.renderRoot.querySelectorAll(`lt-sticker-pack`)).find(
      (pack) => pack.stickerPack.dirPath === dirPath,
    );
    if (pack) {
      this._ignoreScroll = true;
      this._stickerList.scrollTop = pack.offsetTop;
      setTimeout(() => (this._ignoreScroll = false), 10);
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

  get _sortStickerPacks() {
    return this.stickerStore.stickerPacks
      ?.sort((a, b) => a.title.localeCompare(b.title))
      ?.sort((a, b) => a.index - b.index);
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
            target.isVisible = true;
          } else {
            this._visibleItems.delete(target);
            target.isVisible = false;
          }
        });
        this._calculateClosest();
      },
      {
        root: this._stickerList,
      },
    );
  }

  private _calculateClosest() {
    if (this._ignoreScroll) return;
    let closest: StickerPack | null = null;
    let minTop = Infinity;
    const containerRect = this._stickerList.getBoundingClientRect();
    for (const stickerPack of this._visibleItems) {
      const rect = stickerPack.getBoundingClientRect();
      const relativeTop = rect.bottom - containerRect.top;
      if (relativeTop > 0 && relativeTop < minTop) {
        minTop = relativeTop;
        closest = stickerPack;
      }
    }

    if (closest) {
      this.dispatchEvent(new CustomEvent("updateTopPack", { detail: { dirPath: closest.stickerPack.dirPath } }));
    }
  }

  render() {
    return html`<div class="lt-sticker-list">
      ${this._sortStickerPacks?.map(
        (stickerPack) =>
          html`<lt-sticker-pack
            @item-mounted="${this._itemMounted}"
            .stickerPack="${stickerPack}"
            .stickersPerRow="${this.stickersPerRow}"
          ></lt-sticker-pack>`,
      ) || []}
    </div>`;
  }
}
