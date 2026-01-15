import { pluginPath } from "@/renderer/utils/pluginPaths";
import { join, resolvePath } from "@/renderer/utils/pathUtils";

class StyleManager {
  private basePath: string = join(pluginPath, "dist", "css");
  async inject(cssName: string) {
    const cssPath = resolvePath(join(this.basePath, `${cssName}.css`));
    if (await this.checkFile(cssPath)) {
      const style = document.createElement("link");
      style.rel = "stylesheet";
      style.type = "text/css";
      style.href = cssPath;
      style.dataset.ltCssName = CSS.escape(cssName);
      document.head.appendChild(style);
      if (__DEV__) {
        const loopUpdate = setInterval(() => {
          if (style.isConnected) {
            style.href = cssPath + `?t=${new Date().getTime()}`;
          } else {
            clearInterval(loopUpdate);
          }
        }, 500);
      }
    } else {
      console.error(`[StyleManager] ${cssName}.css not found`);
    }
  }
  remove(cssName: string) {
    const style = document.querySelector(`link[data-lt-css-name="${CSS.escape(cssName)}"]`);
    if (style) {
      style.remove();
    } else {
      console.error(`[StyleManager] ${cssName} not injected`);
    }
  }
  async checkFile(cssPath: string) {
    try {
      await fetch(cssPath);
      return true;
    } catch (err) {
      return false;
    }
  }
}

const styleManager = new StyleManager();
export { styleManager };
