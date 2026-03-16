import { LitElement, html, css, TemplateResult, nothing } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

type ContextMenuStatus = "danger" | "disabled" | "success" | "warning" | "none";

type IconContent = string | TemplateResult;

interface ContextMenuType {
  icon?: IconContent;
  name: string;
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
      --submenu-offset-x: -4px; /* 子菜单默认的X轴偏移量 (覆盖面板重叠度) */
    }
    .item-wrapper {
      max-width: 180px;
      position: relative;
      border-radius: 4px;
      &:hover {
        background-color: var(--overlay_hover);
        .icon {
          animation-duration: 0.5s;
          animation-name: iconAnimate;
          animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
        }
        .submenu-panel {
          opacity: 1;
          visibility: visible;
          transform: translateX(0);
          transition-delay: 0s;
        }
      }
    }

    .item-context {
      cursor: pointer;
      align-items: center;
      appearance: none;
      color: var(--text_primary);
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

      &:hover:active {
        background-color: var(--overlay_pressed);
      }
    }

    .submenu-panel {
      max-height: calc(100vh - (var(--submenu-safe-gap) * 2));
      position: absolute;
      left: 100%;
      top: var(--submenu-offset-y);
      background-color: var(--bg_top_light);
      border: var(--border_secondary);
      border-radius: 8px;
      box-shadow: var(--shadow_bg_middle_secondary);
      padding: 4px;
      display: flex;
      flex-direction: column;
      min-width: max-content;
      z-index: 10001;
      visibility: hidden;
      opacity: 0;
      transition:
        opacity 150ms,
        transform 150ms,
        visibility 150ms;
      transition-delay: 150ms;
      transform: translateX(var(--submenu-offset-x));
      &.left {
        left: unset;
        right: 100%;
        transform: translateX(calc(var(--submenu-offset-x) * -1));
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
  private _showLeft = false;

  @state()
  private _dynamicTop: string | null = null;

  private get _hasChildren() {
    return this.item?.children && this.item.children.length > 0;
  }

  private _handleClick(e: MouseEvent) {
    if (this._hasChildren) {
      e.stopPropagation();
      e.preventDefault();
      // return;
    }
    if (this.item?.callback) {
      this.item.callback(e);
    }
  }

  private _handleMouseEnter(e: MouseEvent) {
    if (this._hasChildren) {
      const wrapperEl = this.renderRoot.querySelector(".item-wrapper")!;
      const childEl = this.renderRoot.querySelector<HTMLElement>(".submenu-panel")!;

      const parentRect = wrapperEl.getBoundingClientRect();
      const childRect = childEl.getBoundingClientRect();

      const defaultOffsetY = -4;
      const safeGap = 8;

      // 预测翻转
      if (parentRect.right + childRect.width > window.innerWidth) {
        this._showLeft = true;
      } else {
        this._showLeft = false;
      }

      const expectedBottom = parentRect.top + defaultOffsetY + childRect.height;

      let targetTop = defaultOffsetY;

      // 预测溢出
      if (expectedBottom > window.innerHeight - safeGap) {
        const overflowY = expectedBottom - (window.innerHeight - safeGap);
        targetTop -= overflowY;

        const expectedTop = parentRect.top + targetTop;
        if (expectedTop < safeGap) {
          targetTop = safeGap - parentRect.top;
        }
      }

      this._dynamicTop = `${targetTop}px`;
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
      <div class="item-wrapper ${this.item.type}" @click=${this._handleClick}>
        <div class="item-context" @mouseenter=${this._handleMouseEnter}>
          ${this.showIcon ? html`<span class="icon">${this.renderIcon(this.item.icon)}</span>` : ""}
          <span class="text">${this.item.name}</span>
          ${this._hasChildren ? html`<span class="arrow-icon">${ContextMenuItem.foldIcon}</span>` : ""}
        </div>
        ${this._hasChildren
          ? html`
              <div
                class="submenu-panel ${this._showLeft ? "left" : ""}"
                style="top: ${this._dynamicTop !== null ? this._dynamicTop : "var(--submenu-offset-y)"};"
              >
                ${this.item.children!.map(
                  (child) => html`
                    <lt-context-menu-item .item=${child as any} .showIcon=${childShowIcon}></lt-context-menu-item>
                  `,
                )}
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
      --pointer-events: none;
      --padding-offset: 8px;
    }
    .lt-context-menu {
      -webkit-app-region: no-drag;
      box-sizing: border-box;
      display: flex;
      z-index: 10000;
      flex-direction: column;
      outline: none;
      position: fixed;
      user-select: none;
      width: max-content;
      background-clip: padding-box;
      background-color: var(--bg_top_light);
      border: var(--border_secondary);
      border-radius: 8px;
      box-shadow: var(--shadow_bg_middle_secondary);
      padding: 4px;
      pointer-events: var(--pointer-events);
      opacity: 0;
      left: 0;
      top: 0;
      margin: 0;
      translate: clamp(0px, var(--x), calc(100vw - 100% - var(--padding-offset)))
        clamp(0px, var(--y), calc(100vh - 100% - var(--padding-offset)));
      transition: opacity 150ms;
      &.show {
        --pointer-events: auto;
        opacity: 1;
        transform: translateY(0);
      }
    }
    .mask {
      z-index: 9999;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: var(--pointer-events);
      opacity: 0;
      transition: opacity 100ms;
      &.show {
        --pointer-events: auto;
        opacity: 1;
      }
    }
  `;

  private _cancel = (e: Event) => {
    e.stopPropagation();
    e.preventDefault();
    this.dispatchEvent(new CustomEvent("lt-context-menu-cancel"));
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("resize", this._cancel);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("resize", this._cancel);
  }

  @property({ type: Boolean })
  show = false;

  @property({ type: Object })
  position = { x: 0, y: 0 };

  @property({ type: Array })
  menuList: ContextMenuType[] = [];

  render() {
    const showIcon = this.menuList?.some((i) => i.icon);
    return html` <div @contextmenu=${this._cancel} @click=${this._cancel} class="mask ${this.show ? "show" : ""}"></div>
      <a
        style="--x: ${this.position.x}px; --y: ${this.position.y}px;"
        class="lt-context-menu ${this.show ? "show" : ""}"
      >
        ${this.menuList.map(
          (item) => html`<lt-context-menu-item .item=${item as any} .showIcon=${showIcon}> </lt-context-menu-item>`,
        )}
      </a>`;
  }
}
