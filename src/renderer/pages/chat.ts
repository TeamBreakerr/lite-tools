import { aioStore } from "@/renderer/modules/aioStore";
import { setupPreventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/configStore";
import { updateTopFuncBar, updateChatFuncBar } from "@/renderer/modules/funcBarManager";
import { setupHandleMessages } from "@/renderer/modules/handleMessages";

import type { Config } from "@/types/Config";

const log = createLogger("chat");

async function setupChatPage() {
  log("await init");
  await configStore.ready;
  await aioStore.ready;
  log("initialized");
  setupPreventMutipleSelect("chat-msg-area");
  setupHandleMessages();
  updateTopFuncBar();
  updateChatFuncBar();
  updateRecallConfig(configStore.value);
  aioStore.onChange(() => {
    updateTopFuncBar();
    updateChatFuncBar();
  });
  configStore.onChange((config) => {
    updateTopFuncBar();
    updateChatFuncBar();
    updateRecallConfig(config);
  });
}

function updateRecallConfig(config: Config) {
  document.body.classList.toggle("lt-custom-recall-color", config.message.preventRecall.customColor);
  document.body.style.setProperty("--lt-recall-color-light", config.message.preventRecall.customTextColor.light);
  document.body.style.setProperty("--lt-recall-color-dark", config.message.preventRecall.customTextColor.dark);
}

export { setupChatPage };
