import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { resource } from "../resource";

@customElement("reveal-mask")
export class RevealMAsk extends LitElement {
  static styles = [
    css`
      @keyframes loop {
        from {
          transform: translate3d(0, 0, 0);
        }
        to {
          transform: translate3d(-512px, -512px, 0);
        }
      }
      @keyframes reverseLoop {
        from {
          transform: translate3d(512px, 0, 0);
        }
        to {
          transform: translate3d(0, 512px, 0);
        }
      }
      :host {
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        backdrop-filter: blur(32px);
        background-color: rgba(0, 0, 0, 0.13);
        border-radius: var(--mask-border-radius);
        user-select: none;
        -webkit-user-drag: none;
        overflow: hidden;
        pointer-events: none;

        --mask-x: 50%;
        --mask-y: 50%;

        --reveal-center: rgba(0, 0, 0, 1);
        --reveal-edge: rgba(0, 0, 0, 1);
        --reveal-diffusion: 0px;
        --reveal-offset: 0px;

        mask-image: radial-gradient(
          circle 2000px at var(--mask-x) var(--mask-y),
          var(--reveal-center) var(--reveal-diffusion),
          var(--reveal-edge) calc(var(--reveal-diffusion) + var(--reveal-offset))
        );

        /* background: radial-gradient(
          circle 2000px at var(--mask-x) var(--mask-y),
          var(--reveal-center) var(--reveal-diffusion),
          var(--reveal-edge) calc(var(--reveal-diffusion) + var(--reveal-offset))
        ); */
      }
      :host([reveal]) {
        animation: reveal 1s ease-in-out forwards;
      }

      @keyframes reveal {
        0% {
          --reveal-center: rgba(0, 0, 0, 0);
          --reveal-diffusion: 0px;
          --reveal-offset: 15px;
        }
        15% {
          --reveal-offset: 100px;
        }
        100% {
          --reveal-center: rgba(0, 0, 0, 0);
          --reveal-diffusion: 2000px;
        }
      }

      .mask {
        z-index: 11;
        pointer-events: none;
        will-change: transform;
        position: absolute;
        left: 0;
        top: 0;
        width: 1024px;
        height: 1024px;
        background: var(--url);
        animation: loop 16s linear infinite;
      }
      .reverse-mask {
        z-index: 10;
        pointer-events: none;
        content: "";
        position: absolute;
        right: 0;
        bottom: 0;
        width: 1024px;
        height: 1024px;
        background: var(--url);
        animation: reverseLoop 16s linear infinite;
      }
      .filter-blur {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        image-rendering: -webkit-optimize-contrast;
        object-fit: fill;
        object-position: center top;
        text-indent: 100%;
      }
      .backdrop-blur {
        position: absolute;
        left: 0;
        top: 0;
        z-index: 1;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(32px);
      }
    `,
  ];

  @state()
  private url: string = resource.url;

  @state()
  private target?: HTMLElement;

  constructor() {
    super();
    resource.subscribe((url: string) => (this.url = url));
  }

  private handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    this.style.setProperty("--mask-x", `${e.offsetX}px`);
    this.style.setProperty("--mask-y", `${e.offsetY}px`);
    // this.removeAttribute("reveal");
    // this.offsetHeight;
    this.setAttribute("reveal", "");
    // this.target?.querySelector("img")?.style.setProperty("filter", "");
    this.addEventListener("animationend", () => {
      this.remove();
    });
    this.target?.blur();
    this.removeEventListener("click", this.handleClick);
  };

  public setupTarget = async (target: HTMLElement) => {
    this.target = target;
    this.target.addEventListener("click", this.handleClick);
    // this.target.querySelector("img")?.style.setProperty("filter", "blur(32px)");
  };

  disconnectedCallback() {
    if (this.target) {
      this.target.removeEventListener("click", this.handleClick);
      this.target.style.filter = "";
      // this.target.querySelector("img")?.style.setProperty("filter", "");
    }

    super.disconnectedCallback();
  }

  render() {
    return html`<div style="--url: url(${this.url})" class="mask"></div>
      <div style="--url: url(${this.url})" class="reverse-mask"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "reveal-mask": RevealMAsk;
  }
}
