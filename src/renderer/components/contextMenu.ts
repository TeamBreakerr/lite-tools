import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state, property, query } from "lit/decorators.js";

@customElement("lt-context-menu-item")
export class ContextMenuItem extends LitElement {
  static styles = css`
    .lt-context-menu-item {
      align-items: center;
      appearance: none;
      background-color: transparent;
      border-radius: 4px;
      color: var(--text_primary);
      display: flex;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
      padding: 4px 12px 4px 8px;
      position: relative;
      cursor: pointer;
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
      &:hover {
        background-color: var(--overlay_hover);
        .icon {
          animation-duration: 0.5s;
          animation-name: iconAnimate;
          animation-timing-function: cubic-bezier(0.5, 0, 0.5, 1);
        }
      }
      &:hover:active {
        background-color: var(--overlay_pressed);
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
      .text {
        flex: 1;
        white-space: nowrap;
      }

      /* 新增 */
      .arrow-icon {
        margin-left: 16px;
        opacity: 0.6;
        font-size: 10px;
      }

      .submenu-panel {
        position: absolute;
        left: 100%; /* 出现在父项的右侧 */
        top: -4px; /* 与父级容器的 padding 对齐 */
        background-color: var(--bg_top_light);
        border: var(--border_secondary);
        border-radius: 8px;
        box-shadow: var(--shadow_bg_middle_secondary);
        padding: 4px;
        display: none;
        flex-direction: column;
        min-width: max-content;
        z-index: 10001; /* 确保层级高于兄弟元素 */
      }

      /* 当 hover 父级 item 时，显示子面板 */
      .lt-context-menu-item:hover > .submenu-panel {
        display: flex;
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

  @property({ type: Object })
  callback?: (e: MouseEvent) => void;

  private _handleClick(e: MouseEvent) {
    // 如果有子菜单，点击时阻止事件冒泡，防止误触发全局的关闭事件
    if (this.childrenList && this.childrenList.length > 0) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    // 如果没有子菜单且有回调，则执行
    if (this.callback) {
      this.callback(e);
    }
  }

  render() {
    const hasChildren = this.childrenList && this.childrenList.length > 0;

    return html`
      <div class="lt-context-menu-item ${this.type}" @click="${this._handleClick}">
        ${this.showIcon ? html`<span class="icon"> ${this.icon ? html`<img src="${this.icon}" />` : ""} </span>` : ""}
        <span class="text">${this.name}</span>

        ${hasChildren
          ? html`
              <span class="arrow-icon">▶</span>
              <div class="submenu-panel">
                ${this.childrenList!.map(
                  (child) => html`
                    <lt-context-menu-item
                      .name="${child.name}"
                      .icon="${child.icon}"
                      .type="${child.type}"
                      .callback="${child.callback}"
                      .childrenList="${child.children}"
                      .showIcon="${this.childrenList!.some((i) => i.icon)}"
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
    // 关键：将事件名与类型关联
    "lt-context-menu-cancel": LtContextMenuCancel;
  }
}

@customElement("lt-context-menu")
export class ContextMenu extends LitElement {
  static styles = css`
    .lt-context-menu {
      --padding-offset: 8px;
      -webkit-app-region: no-drag;
      box-sizing: border-box;
      display: flex;
      z-index: 10000;
      flex-direction: column;
      max-height: var(--q-contextmenu-max-height);
      outline: none;
      /* overflow: hidden auto; */
      position: fixed;
      user-select: none;
      width: max-content;
      background-clip: padding-box;
      background-color: var(--bg_top_light);
      border: var(--border_secondary);
      border-radius: 8px;
      box-shadow: var(--shadow_bg_middle_secondary);
      padding: 4px;
      pointer-events: none;
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
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
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
        opacity: 1;
        pointer-events: auto;
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
    return html` <div
        @contextmenu="${this._cancel}"
        @click="${this._cancel}"
        class="mask ${this.show ? "show" : ""}"
      ></div>
      <a
        style="--x: ${this.position.x}px; --y: ${this.position.y}px;"
        class="lt-context-menu ${this.show ? "show" : ""}"
      >
        ${this.menuList.map(
          (item) =>
            html`<lt-context-menu-item
              @click="${item.callback}"
              .icon="${item.icon}"
              .name="${item.name}"
              .type="${item?.type}"
              .callback="${item.callback}"
              .childrenList="${item.children}"
              .showIcon="${this.menuList.some((i) => i.icon)}"
            >
            </lt-context-menu-item>`,
        )}
      </a>`;
  }
}
