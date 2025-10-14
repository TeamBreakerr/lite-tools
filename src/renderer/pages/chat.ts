import { aioStore } from "@/renderer/modules/aioStore";
import { setupPreventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/config";
import { updateTopFuncBar, updateChatFuncBar } from "@/renderer/modules/funcBarManager";
import { setupHandleMessages } from "@/renderer/modules/handleMessages";

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
  aioStore.onChange(() => {
    updateTopFuncBar();
    updateChatFuncBar();
  });
  configStore.onChange(() => {
    updateTopFuncBar();
    updateChatFuncBar();
  });
}

export { setupChatPage };
