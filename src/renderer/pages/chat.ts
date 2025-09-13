import { AioStore } from "@/renderer/modules/AioStore";
import { preventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";

const log = createLogger("chat");


async function setupChatPage() {
  log("await aio");
  const aioStore = new AioStore();
  await aioStore.ready;
  log("chat ok");
  preventMutipleSelect("chat-msg-area");
}

export { setupChatPage };
