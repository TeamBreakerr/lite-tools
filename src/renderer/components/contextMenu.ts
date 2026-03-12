import { LitElement, html, css, PropertyValues, nothing } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

@customElement("lt-context-menu-item")
export class ContextMenuItem extends LitElement {
  static styles = css`
    .item-wrapper {
      max-width: 180px;
      position: relative;
      &:hover {
        background-color: var(--overlay_hover);
        .icon {
          animation-duration: 0.5s;
          animation-name: iconAnimate;
          animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
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
        img {
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

    .item-wrapper:hover {
      .submenu-panel {
        opacity: 1;
        visibility: visible;
        transition-delay: 100ms;
        transform: translateX(0);
      }
    }
    .submenu-panel {
      --show-offset: -4px;

      position: absolute;
      left: 100%;
      top: -4px;
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
      transition: 150ms;
      transition-delay: 300ms;
      transform: translateX(var(--show-offset));
      &.left {
        --show-offset: 4px;
        left: unset;
        right: 100%;
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

  @property({ type: String })
  icon?: string;

  @property({ type: String })
  name = "";

  @property({ type: String })
  type?: "danger" | "disabled" | "success" | "warning" | "none" = "none";

  // 接收从外部或父组件传来的配置和回调
  @property({ type: Array })
  childrenList?: ContextMenuType[];

  @property({ attribute: false })
  callback?: ContextMenuType["callback"];

  private get _hasChildren() {
    return this.childrenList && this.childrenList.length > 0;
  }

  private _handleClick(e: MouseEvent) {
    if (this._hasChildren) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    if (this.callback) {
      this.callback(e);
    }
  }

  private static foldIcon = html`<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3L17 12L8 21" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"></path>
  </svg>`;

  render() {
    return html`
      <div class="item-wrapper ${this.type}" @click=${this._handleClick}>
        <div class="item-context">
          ${this.showIcon ? html`<span class="icon"> ${this.icon ? html`<img src=${this.icon} />` : ""} </span>` : ""}
          <span class="text">${this.name}</span>
          ${this._hasChildren ? html`<span class="arrow-icon">${ContextMenuItem.foldIcon}</span>` : ""}
        </div>
        ${this._hasChildren
          ? html`
              <div class="submenu-panel">
                ${this.childrenList!.map(
                  (child) => html`
                    <lt-context-menu-item
                      .name=${child.name}
                      .icon=${child.icon}
                      .type=${child.type}
                      .callback=${child.callback}
                      .childrenList=${child.children}
                      .showIcon=${this.childrenList!.some((i) => i.icon)}
                    ></lt-context-menu-item>
                  `,
                )}
              </div>
            `
          : ""}
      </div>
    `;
  }
}

interface ContextMenuType {
  icon?: string;
  name: string;
  type?: "danger" | "disabled" | "success" | "warning" | "none";
  callback?: (e: MouseEvent) => void;
  children?: ContextMenuType[];
}

interface LtContextMenuCancel extends CustomEvent {}

declare global {
  interface HTMLElementEventMap {
    "lt-context-menu-cancel": LtContextMenuCancel;
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
      transform: translateY(-6px);
      left: 0;
      top: 0;
      margin: 0;
      translate: clamp(0px, var(--x), calc(100vw - 100% - var(--padding-offset)))
        clamp(0px, var(--y), calc(100vh - 100% - var(--padding-offset)));
      transition:
        opacity 100ms,
        transform 100ms;
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
    return html` <div @contextmenu=${this._cancel} @click=${this._cancel} class="mask ${this.show ? "show" : ""}"></div>
      <a
        style="--x: ${this.position.x}px; --y: ${this.position.y}px;"
        class="lt-context-menu ${this.show ? "show" : ""}"
      >
        ${this.menuList.map(
          (item) =>
            html`<lt-context-menu-item
              .icon=${item.icon}
              .name=${item.name}
              .type=${item?.type}
              .callback=${item.callback}
              .childrenList=${item.children}
              .showIcon=${this.menuList.some((i) => i.icon)}
            >
            </lt-context-menu-item>`,
        )}
      </a>`;
  }
}
