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
        pointer-events: none;
        content: "";
        position: absolute;
        background: red;
        right: 0;
        bottom: 0;
        width: 1024px;
        height: 1024px;
        background: var(--url);
        animation: reverseLoop 16s linear infinite;
      }
    `,
  ];

  @state()
  private url: string = resource.url;

  constructor() {
    super();
    resource.subscribe((url: string) => (this.url = url));
  }

  private handleClick = (e: MouseEvent) => {
    this.style.setProperty("--mask-x", `${e.offsetX}px`);
    this.style.setProperty("--mask-y", `${e.offsetY}px`);
    // this.removeAttribute("reveal");
    // this.offsetHeight;
    this.setAttribute("reveal", "");
    this.addEventListener("animationend", () => {
      this.remove();
    });
    this.removeEventListener("click", this.handleClick);
  };

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.handleClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
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
