import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";

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
  private stickerList!: HTMLDivElement;

  private observer?: IntersectionObserver;
  private visibleItems = new Set<StickerPack>();
  private ignoreScroll = false;

  gotoPackByPath(dirPath: StickerPackType["dirPath"]) {
    const pack = Array.from(this.renderRoot.querySelectorAll(`lt-sticker-pack`)).find(
      (pack) => pack.stickerPack.dirPath === dirPath,
    );
    if (pack) {
      this.ignoreScroll = true;
      this.stickerList.scrollTop = pack.offsetTop;
      setTimeout(() => (this.ignoreScroll = false), 10);
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.initObserver();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  private get sortStickerPacks() {
    return this.stickerStore.stickerPacks
      ?.sort((a, b) => a.label.localeCompare(b.label))
      ?.sort((a, b) => a.index - b.index);
  }

  private itemMounted(e: CustomEvent) {
    this.observer?.observe(e.detail.element);
  }

  private initObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as StickerPack;
          if (entry.isIntersecting) {
            this.visibleItems.add(target);
            target.isVisible = true;
          } else {
            this.visibleItems.delete(target);
            target.isVisible = false;
          }
        });
        this.calculateClosest();
      },
      {
        root: this.stickerList,
      },
    );
  }

  private calculateClosest() {
    if (this.ignoreScroll) return;
    let closest: StickerPack | null = null;
    let minTop = Infinity;
    const containerRect = this.stickerList.getBoundingClientRect();
    for (const stickerPack of this.visibleItems) {
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
      ${this.sortStickerPacks?.map(
        (stickerPack) =>
          html`<lt-sticker-pack
            @item-mounted="${this.itemMounted}"
            .stickerPack="${stickerPack}"
            .stickersPerRow="${this.stickersPerRow}"
          ></lt-sticker-pack>`,
      ) || []}
    </div>`;
  }
}
