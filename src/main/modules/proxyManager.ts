import { fetch as u_fetch, ProxyAgent, Agent, Dispatcher } from "undici";
import { ipcMain } from "electron";
import { configManager } from "@/main/modules/configManager";
import { createLogger } from "@/main/utils/createLogger";
import { settingsWindow } from "@/main/utils/windowTracker";

const log = createLogger("proxyManager");

class ProxyManager {
  private currentProxyUrl?: string; // 当前底层实际正在生效的代理
  private targetProxyUrl?: string; // 配置中指定的目标代理
  private dispatcher: Dispatcher = new Agent();
  private isInitialized = false;
  public proxyIsValid = false;

  async setup() {
    if (this.isInitialized) {
      log("代理管理器已初始化，跳过");
      return;
    }

    this.setupIpcEvent();
    this.setupConfigListener();

    // 初始化时读取配置项并自动检测、应用
    const initialProxy = configManager.value?.global?.httpProxy;
    this.targetProxyUrl = initialProxy;
    await this.checkAndApplyProxy(initialProxy);

    this.isInitialized = true;
    log("代理管理器初始化完成");
  }

  fetch = async (url: string | URL, options: Parameters<typeof u_fetch>[1] = {}) => {
    return u_fetch(url, {
      dispatcher: this.dispatcher,
      ...options,
    });
  };

  private async checkAndApplyProxy(proxyUrl?: string): Promise<boolean> {
    if (!proxyUrl) {
      this.updateDispatcher(undefined);
      return false;
    }

    this.proxyIsValid = await this.checkProxy(proxyUrl);
    if (this.proxyIsValid) {
      this.updateDispatcher(proxyUrl);
      return true;
    } else {
      this.updateDispatcher(undefined);
      return false;
    }
  }

  private setupConfigListener() {
    configManager.onConfigUpdate((newConfig) => {
      const newProxy = newConfig?.global?.httpProxy;
      // 只有修改了代理地址时，才触发重新检测和应用
      if (this.targetProxyUrl !== newProxy) {
        this.targetProxyUrl = newProxy;
        this.checkAndApplyProxy(newProxy);
      }
    });
  }

  private setupIpcEvent() {
    // 纯测试指令：测试当前配置中的代理，不修改任何状态
    ipcMain.on("lite_tools.proxy.check", () => {
      this.checkProxy(this.targetProxyUrl, false);
    });
  }

  private updateDispatcher(proxyUrl?: string): void {
    if (proxyUrl) {
      if (this.currentProxyUrl !== proxyUrl) {
        this.currentProxyUrl = proxyUrl;
        this.dispatcher = new ProxyAgent(proxyUrl);
        log("代理已生效:", proxyUrl);
      }
    } else {
      if (this.currentProxyUrl !== undefined) {
        this.currentProxyUrl = undefined;
        this.dispatcher = new Agent();
        log("代理已关闭，切换为直连");
      }
    }
  }

  private sendWindowMessage(content: string, type: "default" | "error" | "success", duration: number = 6000): void {
    if (!settingsWindow || !settingsWindow.webContents) return;
    this.clearWindowMessage();
    settingsWindow.webContents.send("lite_tools.toast", {
      content,
      type,
      duration,
    });
  }

  private clearWindowMessage(): void {
    if (!settingsWindow || !settingsWindow.webContents) return;
    settingsWindow.webContents.send("lite_tools.clearToast");
  }

  private async checkProxy(proxyUrl?: string, mute = true): Promise<boolean> {
    const testDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : new Agent();
    const testType = proxyUrl ? proxyUrl : "直连";

    log(`开始测试网络: ${testType}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await u_fetch("http://www.google.com/generate_204", {
        dispatcher: testDispatcher,
        signal: controller.signal as any,
      });

      clearTimeout(timeoutId);

      if (res.status === 204) {
        log(`${testType} 测试通过`);
        !mute && this.sendWindowMessage(`代理 ${testType} 有效`, "success");
        return true;
      } else {
        log(`${testType} 请求失败`, res.status);
        !mute && this.sendWindowMessage(`代理 ${testType} 无效`, "error");
        return false;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === "AbortError";
      log(`${testType} 异常`, err);
      !mute && this.sendWindowMessage(isTimeout ? "请求超时" : `请求失败`, "error");
      return false;
    }
  }
}

const proxyManager = new ProxyManager();
const fetch = proxyManager.fetch;

export { proxyManager, fetch };
