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

    const isValid = await this.checkProxy(proxyUrl);
    if (isValid) {
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
    ipcMain.on("lite_tools.checkProxy", () => {
      this.checkProxy(this.targetProxyUrl);
    });

    // 应用代理指令：测试并尝试应用，无论成功与否都将该地址写入配置文件
    ipcMain.handle("lite_tools.applyProxy", async (_event, proxyUrl: string) => {
      this.targetProxyUrl = proxyUrl;

      const isValid = await this.checkAndApplyProxy(proxyUrl);
      const currentConfig = configManager.value;

      // 更新全局配置
      const newConfig = {
        ...currentConfig,
        global: {
          ...(currentConfig.global || {}),
          httpProxy: proxyUrl,
        },
      };

      configManager.updateConfig(newConfig as any);
      return isValid;
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

  private sendToSettingsWindow(channel: string, ...args: any[]): void {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send(channel, ...args);
    }
  }

  private async checkProxy(proxyUrl?: string): Promise<boolean> {
    const testDispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : new Agent();
    const testType = proxyUrl ? `代理 (${proxyUrl})` : "直连";

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
        this.sendToSettingsWindow("lite_tools.updateProxyStatus", {
          success: true,
          message: "代理有效",
        });
        return true;
      } else {
        log(`${testType} 请求失败`, res.status);
        this.sendToSettingsWindow("lite_tools.updateProxyStatus", {
          success: false,
          message: `请求失败 ${res.status}`,
        });
        return false;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === "AbortError";
      log(`${testType} 异常`, err);

      this.sendToSettingsWindow("lite_tools.updateProxyStatus", {
        success: false,
        message: isTimeout ? "请求超时" : `请求失败: ${err.message || err}`,
      });
      return false;
    }
  }
}

const proxyManager = new ProxyManager();
const fetch = proxyManager.fetch;

export { proxyManager, fetch };
