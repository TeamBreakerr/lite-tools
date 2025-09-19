import { waitForInstance } from "@/renderer/utils/waitForInstance";
import { configStore } from "@/renderer/modules/config";

const topFuncSet = new Set() as Set<string>;
const chatFuncSet = new Set() as Set<string>;

async function updateTopFuncBar() {
  await configStore.ready;
  const { element, instance } = await waitForInstance(".panel-header__action .func-bar", "props.items");
  await instance.proxy.$nextTick();
  const value = instance.props.items;
  const oldFuncSize = topFuncSet.size;
  value.forEach((item: any) => {
    topFuncSet.add(item.label);
  });
  if (topFuncSet.size > oldFuncSize && topFuncSet.size > configStore.config.topFuncBar.length) {
    configStore.config.topFuncBar = Array.from(topFuncSet).map((item) => {
      return {
        name: item,
        enabled: true,
      };
    });
    configStore.setConfig(configStore.config);
  }
  configStore.config.topFuncBar.forEach((item) => {
    const findEl = element.querySelector(`[aria-label="${item.name}"]`)?.closest(".bar-icon");
    if (findEl) {
      findEl.style.display = item.enabled ? "flex" : "none";
    }
  });
}

async function updateChatFuncBar() {
  await configStore.ready;
  const { element, instance, value } = await waitForInstance(".chat-input-area .chat-func-bar.shortcuts", "proxy.list");
  await instance.proxy.$nextTick();
  value.forEach((item: any) => {
    if (item.label) {
      chatFuncSet.add(item.label);
    }
  });
  if (chatFuncSet.size > configStore.config.chatFuncBar.length) {
    configStore.config.chatFuncBar = Array.from(chatFuncSet).map((item) => {
      return {
        name: item,
        enabled: true,
      };
    });
    configStore.setConfig(configStore.config);
  }
  configStore.config.chatFuncBar.forEach((item) => {
    const findEl = element.querySelector(`[aria-label="${item.name}"]`)?.closest(".bar-icon");
    if (findEl) {
      findEl.style.display = item.enabled ? "flex" : "none";
    }
  });
}

export { updateTopFuncBar, updateChatFuncBar };
