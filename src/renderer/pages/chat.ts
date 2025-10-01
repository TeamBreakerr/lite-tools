import { aioStore } from "@/renderer/modules/aioStore";
import { setupPreventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";
import { configStore } from "@/renderer/modules/config";
import { updateTopFuncBar, updateChatFuncBar } from "@/renderer/modules/funcBarManager";

const log = createLogger("chat");

async function setupChatPage() {
  log("await aio");
  await configStore.ready;
  await aioStore.ready;
  log("ok");
  setupPreventMutipleSelect("chat-msg-area");
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
