import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/configStore";
import { StickerPack, StickerItem } from "./stickerPack";
import { ContextMenu } from "@/renderer/components/contextMenu";
import { openFolder } from "@/renderer/utils/nativeCall";

import type { StickerStore } from "@/common/types/localStickers";

interface LtStickerEvent extends CustomEvent {
  detail: { path: string; name: string };
}

declare global {
  interface HTMLElementEventMap {
    // 关键：将事件名与类型关联
    "lt-select-sticker": LtStickerEvent;
    "lt-send-sticker": LtStickerEvent;
  }
}

const log = createLogger("stickerIcon");

@customElement("lt-sticker-icon")
export class StickerIcon extends LitElement {
  static styles = css`
    :host {
      display: block;
      --transition-time: 150ms;
      --shadow-width: 8px;
      --shadow-offset: calc(var(--shadow-width) * 3);
      --offset-x: -38px;
      --offset-y: 6px;
      position: relative;
    }
    :host(:not(:last-child)) {
      margin-right: 4px;
    }
    :host(:not(:first-child)) {
      margin-left: 4px;
    }
    .lt-sticker-icon {
      align-items: center;
      display: flex;
      position: relative;
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

    .lt-sticker-panel-container {
      position: absolute;
      bottom: calc(100% + var(--offset-y) - var(--shadow-offset));
      right: calc(var(--offset-x) - var(--shadow-offset));
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition:
        clip-path var(--transition-time) var(--transition-time),
        opacity var(--transition-time);
      clip-path: inset(60% 0 0 60% round 6px);
      filter: drop-shadow(0 8px var(--shadow-width) rgba(0, 0, 0, 0.14));
      border-radius: 6px;
      padding: var(--shadow-offset);

      &.left {
        right: unset;
        left: calc(var(--offset-x) - var(--shadow-offset));
        clip-path: inset(60% 60% 0 0 round 6px);
      }
      &.center {
        right: unset;
        left: 50%;
        transform: translateX(-50%);
        clip-path: inset(60% 60% 0 60% round 6px);
      }
      &::after {
        content: "";
        display: block;
        width: 100%;
        height: 10px;
        position: absolute;
        left: 0;
        bottom: -10px;
      }
      &.show {
        opacity: 1;
        transition-delay: unset;
        clip-path: inset(0 0 0 0 round 6px);
        lt-sticker-panel {
          pointer-events: auto;
        }
      }
    }
  `;

  @state()
  public stickerStore: StickerStore = { status: "info", msg: "初始化中..." };

  @state()
  private config!: Config;

  @state()
  private isReady = false;

  @state()
  private showPanel = false;

  @state()
  private ignoreClick = false;

  private get panelWidth() {
    return this?.config?.localStickers?.panelWidth ?? 350;
  }

  private get panelHeight() {
    return this?.config?.localStickers?.panelHeight ?? 420;
  }

  private get stickersPerRow() {
    return this?.config?.localStickers?.stickersPerRow ?? 6;
  }

  private listenerSet = new Set<() => void>();

  @query("lt-context-menu", true)
  private contextMenu!: ContextMenu;

  private longPressTimer?: ReturnType<typeof setTimeout>;

  private activeStickerItem?: StickerItem;

  @state()
  private previewStickerPath?: string;

  @state()
  private showPreview = false;

  private handleContextMenu = (e: MouseEvent) => {
    const path = e.composedPath() as HTMLElement[];
    const stickerItem = path.find((item) => item instanceof StickerItem);
    const stickerIcon = path.find((item) => item instanceof StickerIcon);
    if (!stickerIcon) return;
    e.preventDefault();
    e.stopPropagation();

    // 贴纸的右键菜单
    if (stickerItem) {
      stickerItem.active = true;
      const stickerPack = path.find((item) => item instanceof StickerPack)!;
      this.activeStickerItem = stickerItem;
      this.showPreview = false;
      this.contextMenu.show = true;
      this.contextMenu.position = { x: e.clientX, y: e.clientY };
      this.contextMenu.menuList = [
        {
          label: "打开文件夹",
          callback: () => {
            openFolder(stickerItem.sticker.path);
            this.closeContextMenu();
          },
        },
        {
          label: "设为图标",
          callback: () => {
            const iconName = stickerItem.sticker.path.split("/").pop()!;
            lite_tools.updateStickerPackConfig(stickerPack.stickerPack.dirPath, "icon", iconName);
            this.closeContextMenu();
          },
        },
        {
          label: "删除",
          type: "danger",
          callback: () => {
            this.closeContextMenu();
            lite_tools.deleteSticker(stickerItem.sticker.path);
          },
        },
      ];
    }
  };

  private handleClick = (e: MouseEvent) => {
    if (this.ignoreClick) return;
    if (e.button === 0) {
      const path = e.composedPath() as HTMLElement[];
      const target = path.find((item) => item instanceof StickerItem);
      if (target) {
        if (!e.altKey) {
          this.dispatchEvent(
            new CustomEvent("lt-select-sticker", {
              detail: target.sticker,
              bubbles: true,
              composed: true,
            }),
          );
        } else {
          this.dispatchEvent(
            new CustomEvent("lt-send-sticker", {
              detail: target.sticker,
              bubbles: true,
              composed: true,
            }),
          );
        }
        if (!e.ctrlKey) {
          this.showPanel = false;
        }
      }
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.showPanel = false;
    }

    const path = e.composedPath() as HTMLElement[];
    const target = path.find((item) => item instanceof StickerItem);
    const contextMenu = path.find((item) => item instanceof ContextMenu);
    if (!contextMenu) {
      this.closeContextMenu();
    }
    if (target && e.button === 0) {
      this.longPressTimer = setTimeout(() => {
        this.previewStickerPath = target.sticker.path;
        this.showPreview = true;
        this.ignoreClick = true;
      }, 300);
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
    this.showPreview = false;
    setTimeout(() => (this.ignoreClick = false));
  };

  private handleMouseMove = (e: Event) => {
    if (this.showPreview) {
      const path = e.composedPath() as HTMLElement[];
      const target = path.find((item) => item instanceof StickerItem);
      if (target) {
        this.previewStickerPath = target.sticker.path;
      }
    }
  };

  private closeContextMenu = () => {
    this.contextMenu.show = false;
    if (this.activeStickerItem) {
      this.activeStickerItem.active = false;
      this.activeStickerItem = undefined;
    }
  };

  private showPanelHandler = () => {
    this.showPanel = !this.showPanel;
  };

  protected async firstUpdated(): Promise<void> {
    await configStore.ready;

    this.stickerStore = await lite_tools.getStickerStore();
    this.config = configStore.value;
    log("更新 stickerStore", this.stickerStore);

    this.listenerSet.add(
      lite_tools.onConfigChange((config) => {
        this.config = config;
      }) as unknown as () => void, // todo 修改preload.ts
    );

    this.listenerSet.add(
      lite_tools.onStickerStoreUpdated((stickerStore) => {
        log("更新 stickerStore", stickerStore);
        this.stickerStore = stickerStore;
      }),
    );
    this.contextMenu.addEventListener("lt-context-menu-cancel", this.closeContextMenu);

    document.addEventListener("mousedown", this.handleMouseDown);
    document.addEventListener("mouseup", this.handleMouseUp);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("contextmenu", this.handleContextMenu);
    document.addEventListener("click", this.handleClick);

    this.isReady = true;
  }

  // 销毁函数
  public destroy() {
    this.listenerSet.forEach((unsubscribe) => unsubscribe());
    this.listenerSet.clear();

    this.contextMenu.removeEventListener("lt-context-menu-cancel", this.closeContextMenu);

    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mouseup", this.handleMouseUp);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("contextmenu", this.handleContextMenu);
    document.removeEventListener("click", this.handleClick);

    this.isReady = false;
  }

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
    return html`<lt-context-menu></lt-context-menu>
      <lt-sticker-full-viewer
        .show="${this.showPreview}"
        .stickerPath="${this.previewStickerPath}"
      ></lt-sticker-full-viewer>
      ${this.isReady
        ? html`<div
            style=${styleMap({
              maxWidth: `min(100vw, ${this.panelWidth}px)`,
              maxHeight: `min(100vh, ${this.panelHeight}px)`,
            })}
            class="lt-sticker-panel-container right ${this.showPanel ? "show" : ""}"
          >
            <lt-sticker-panel
              .panelWidth="${this.panelWidth}"
              .panelHeight="${this.panelHeight}"
              .stickersPerRow="${this.stickersPerRow}"
              .stickerStore="${this.stickerStore as any}"
              .showPanel="${this.showPanel}"
            ></lt-sticker-panel>
          </div>`
        : ""}
      <div @click="${this.showPanelHandler}" class="lt-sticker-icon">
        <div style="display: ${!this.showPanel ? "block" : "none"}" class="flot-card">本地贴纸</div>
        <div class="icon-item" aria-label="本地贴纸" tabindex="0">${StickerIcon.ICON}</div>
      </div>`;
  }
}
