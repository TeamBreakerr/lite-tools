import chokidar from "chokidar";

import { configManager } from "@/main/modules/configManager";

class LocalEmoticons {
  private initialized = false;
  private listening = false;
  setup() {
    this.init();
    configManager.onConfigUpdate(this.update);
    this.update(configManager.value);
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
  }
  update(config: Config) {
    if (config.localEmoticons.enabled) {
      this.addListener();
    } else {
      this.offListener();
    }
  }
  // 表情包文件夹监听
  addListener() {
    this.listening = true;
  }
  // 停止监听
  offListener() {
    this.listening = false;
  }
}
