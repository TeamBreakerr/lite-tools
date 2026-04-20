import { ToastIcon } from "./components/toastIcon";
import { ToastItem } from "./components/toastItem";
import { ToastContainer } from "./components/toastContainer";

import type { ToastIconType } from "@/common/types/toastManager";

declare global {
  interface HTMLElementTagNameMap {
    "lt-toast-icon": ToastIcon;
    "lt-toast-item": ToastItem;
    "lt-toast-container": ToastContainer;
  }
}

class ToastManager {
  private isReady = false;
  private hasBoundEvents = false;
  private container: ToastContainer | null = null;

  public async setup(): Promise<void> {
    this.getOrCreateContainer();
    this.bindEvents();
    this.isReady = true;
  }

  private getOrCreateContainer(): ToastContainer {
    if (this.container && document.body.contains(this.container)) {
      return this.container;
    }

    let container = document.querySelector("lt-toast-container") || null;

    if (!container) {
      container = document.createElement("lt-toast-container");
      document.body.appendChild(container);
    }

    this.container = container;
    return container;
  }

  public show(content: string, type: ToastIconType = "default", duration: number = 3000): void {
    if (!this.isReady) {
      console.warn("ToastManager: setup() has not completed yet. Toast ignored.");
      return;
    }

    const container = this.getOrCreateContainer();
    container.show(content, type, duration);
  }

  public clear(): void {
    const container = this.getOrCreateContainer();
    container.clear();
  }

  private bindEvents(): void {
    if (this.hasBoundEvents) return;
    this.hasBoundEvents = true;

    lite_tools.onToast((toast) => {
      this.show(toast.content, toast.type, toast.duration);
    });

    lite_tools.clearToast(() => {
      this.clear();
    });
  }
}

const toastManager = new ToastManager();

export { ToastIcon, ToastItem, ToastContainer, toastManager };
