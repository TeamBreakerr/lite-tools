import { LitElement, html, css, TemplateResult, nothing, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

type ContextMenuStatus = "danger" | "disabled" | "success" | "warning" | "none";

type IconContent = string | TemplateResult;

export interface ContextMenuType {
  icon?: IconContent;
  label: string;
  type?: ContextMenuStatus;
  callback?: (e: MouseEvent) => void;
  children?: ContextMenuType[];
}

interface LtContextMenuCancel extends CustomEvent {}

declare global {
  interface HTMLElementEventMap {
    "lt-context-menu-cancel": LtContextMenuCancel;
  }
}

@customElement("lt-context-menu-item")
export class ContextMenuItem extends LitElement {
  static styles = css`
    :host {
      --submenu-offset-y: -4px; /* 子菜单默认的Y轴偏移量 */
      --submenu-safe-gap: 8px; /* 距离屏幕边缘的安全边距 */
      --submenu-offset-x: -4px; /* 子菜单默认的X轴偏移量 */
    }
    .item-wrapper {
      max-width: 180px;
      position: relative;
      border-radius: 4px;
      color: var(--text_primary);
      &:hover {
        background-color: var(--overlay_hover);
        .icon {
          animation-duration: 0.5s;
          animation-name: iconAnimate;
          animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
        }
        .submenu-panel {
          visibility: visible;
          transition-delay: 50ms;
        }
      }

      &.danger {
        color: var(--text-error);
      }
      &.disabled {
        pointer-events: none;
        background-color: transparent !important;
        opacity: 0.3;
        cursor: unset;
      }
      &.success {
        color: var(--text-success);
      }
      &.warning {
        color: var(--text-warning);
      }
      &.none {
        color: var(--text_primary);
      }
    }

    .item-context {
      cursor: pointer;
      align-items: center;
      appearance: none;
      color: inherit;
      background-color: transparent;
      border-radius: 4px;
      display: flex;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
      padding: 4px 12px 4px 8px;
      .text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .arrow-icon {
        height: 14px;
        width: 14px;
        margin-left: 8px;
        margin-right: -6px;
        font-size: 0;
        svg {
          width: 100%;
          height: 100%;
        }
      }
      .icon {
        height: 16px;
        width: 16px;
        margin-right: 8px;
        * {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      &:hover:active {
        background-color: var(--overlay_pressed);
      }
    }

    .submenu-panel {
      box-sizing: border-box;
      position: fixed;
      border: var(--border_secondary);
      border-radius: 8px;
      box-shadow: var(--shadow_bg_middle_secondary);
      padding: 4px;
      display: flex;
      flex-direction: column;
      min-width: max-content;
      z-index: 10001;
      visibility: hidden;
      transition: visibility 0s linear 150ms;
      &::before {
        backdrop-filter: blur(8px);
        background-color: var(--blur_middle_standard);
        content: "";
        inset: 0;
        pointer-events: none;
        position: absolute;
        z-index: -1;
        border-radius: inherit;
      }
      &::-webkit-scrollbar {
        display: none;
      }

      .submenu-content {
        max-height: calc(100vh - (var(--submenu-safe-gap) * 2) - 8px);
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 4px;

        display: flex;
        flex-direction: column;
        min-width: max-content;

        &::-webkit-scrollbar {
          display: none;
        }
      }
    }

    @keyframes iconAnimate {
      0% {
        transform: scale(1);
      }
      30% {
        transform: scale(1.1);
      }
      60% {
        transform: scale(0.95);
      }
      80% {
        transform: scale(1.02);
      }
      to {
        transform: scale(1);
      }
    }
  `;

  @property({ type: Boolean })
  showIcon = false;

  @property({ type: Object })
  item!: ContextMenuType;

  @state()
  private showLeft = false;

  @state()
  private dynamicTop: string | null = null;

  @state()
  private dynamicLeft: string | null = null;

  private get hasChildren() {
    return this.item?.children && this.item.children.length > 0;
  }

  private handleClick(e: MouseEvent) {
    if (this.hasChildren) {
      e.stopPropagation();
      e.preventDefault();
      // return;
    }
    if (this.item?.callback) {
      this.item.callback(e);
    }
  }

  private handleMouseEnter(e: MouseEvent) {
    if (this.hasChildren) {
      const wrapperEl = this.renderRoot.querySelector(".item-wrapper")!;
      const childEl = this.renderRoot.querySelector<HTMLElement>(".submenu-panel")!;

      const parentRect = wrapperEl.getBoundingClientRect();
      const childRect = childEl.getBoundingClientRect();

      const defaultOffsetY = -5; // Y轴默认偏移
      const offsetX = -4; // X轴重叠偏移
      const safeGap = 8; // 屏幕安全距离

      // 计算 X 轴
      let targetLeft = parentRect.right + offsetX;
      this.showLeft = false;

      // 预测右侧溢出，如果溢出则向左翻转
      if (targetLeft + childRect.width > window.innerWidth - safeGap) {
        targetLeft = parentRect.left - childRect.width - offsetX;
        this.showLeft = true;
      }

      // 计算 Y 轴
      let targetTop = parentRect.top + defaultOffsetY;
      const expectedBottom = targetTop + childRect.height;

      // 预测底部溢出
      if (expectedBottom > window.innerHeight - safeGap) {
        targetTop -= expectedBottom - (window.innerHeight - safeGap);
        if (targetTop < safeGap) {
          targetTop = safeGap;
        }
      }

      this.dynamicLeft = `${targetLeft}px`;
      this.dynamicTop = `${targetTop}px`;
    }
  }

  private static foldIcon = html`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3L17 12L8 21" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
  </svg>`;

  private renderIcon(icon?: IconContent) {
    if (!icon) return nothing;
    if (typeof icon === "string") {
      return html`<img src=${icon} />`;
    }
    return icon;
  }

  render() {
    const childShowIcon = this.item?.children?.some((i) => i.icon) ?? false;
    return html`
      <div class="item-wrapper ${this.item.type}" @click=${this.handleClick}>
        <div class="item-context" @mouseenter=${this.handleMouseEnter}>
          ${this.showIcon ? html`<span class="icon">${this.renderIcon(this.item.icon)}</span>` : ""}
          <span class="text">${this.item.label}</span>
          ${this.hasChildren ? html`<span class="arrow-icon">${ContextMenuItem.foldIcon}</span>` : ""}
        </div>
        ${this.hasChildren
          ? html`
              <div
                class="submenu-panel ${this.showLeft ? "left" : ""}"
                style="top: ${this.dynamicTop || "0px"}; left: ${this.dynamicLeft || "0px"}"
              >
                <div class="submenu-content">
                  ${this.item.children!.map(
                    (child) =>
                      html`<lt-context-menu-item
                        .item=${child as any}
                        .showIcon=${childShowIcon}
                      ></lt-context-menu-item>`,
                  )}
                </div>
              </div>
            `
          : ""}
      </div>
    `;
  }
}

@customElement("lt-context-menu")
export class ContextMenu extends LitElement {
  static styles = css`
    :host {
      --padding-offset: 8px;
    }
    .context-menu {
      -webkit-app-region: no-drag;
      box-sizing: border-box;
      z-index: 10000;
      outline: none;
      position: fixed;
      user-select: none;
      background-clip: padding-box;
      border: var(--border_secondary);
      border-radius: 8px;
      box-shadow: var(--shadow_bg_middle_secondary);
      padding: 4px;
      pointer-events: none;
      visibility: hidden;
      left: clamp(var(--padding-offset), var(--x), calc(100vw - var(--width) - var(--padding-offset)));
      top: clamp(var(--padding-offset), var(--y), calc(100vh - var(--height) - var(--padding-offset)));
      margin: 0;
      &.show {
        pointer-events: auto;
        visibility: visible;
      }
      &::before {
        backdrop-filter: blur(8px);
        background-color: var(--blur_middle_standard);
        content: "";
        inset: 0;
        pointer-events: none;
        position: absolute;
        z-index: -1;
        border-radius: inherit;
      }
      .context-content {
        max-height: calc(100vh - (var(--padding-offset) * 2) - 8px);
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 4px;

        display: flex;
        flex-direction: column;
        min-width: max-content;
        &::-webkit-scrollbar {
          display: none;
        }
      }
    }
    .mask {
      z-index: 9999;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      opacity: 0;
      transition: opacity 100ms;
      &.show {
        pointer-events: auto;
        opacity: 1;
      }
    }
  `;

  private cancel = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(new CustomEvent("lt-context-menu-cancel"));
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", this.cancel);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this.cancel);
  }

  @property({ type: Boolean })
  show = false;

  @property({ type: Object })
  position = { x: 0, y: 0 };

  @state()
  rect = { width: 0, height: 0 };

  @query(".context-menu")
  contextMenu?: HTMLElement;

  @property({ type: Array })
  menuList: ContextMenuType[] = [];

  protected async updated(changedProperties: PropertyValues<this>): Promise<void> {
    super.updated(changedProperties);
    if (changedProperties.has("menuList")) {
      if (this.menuList.length > 0) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        this.rect = this.contextMenu!.getBoundingClientRect();
      }
    }
  }

  render() {
    const showIcon = this.menuList?.some((i) => i.icon);
    return html` <div @contextmenu=${this.cancel} @click=${this.cancel} class="mask ${this.show ? "show" : ""}"></div>
      <a
        style="
        --x: ${this.position.x}px; 
        --y: ${this.position.y}px; 
        --width: ${this.rect.width}px; 
        --height: ${this.rect.height}px"
        class="context-menu ${this.show ? "show" : ""}"
      >
        <div class="context-content">
          ${this.menuList.map(
            (item) => html`<lt-context-menu-item .item=${item as any} .showIcon=${showIcon}> </lt-context-menu-item>`,
          )}
        </div>
      </a>`;
  }
}
