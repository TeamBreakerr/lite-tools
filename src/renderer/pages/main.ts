import { AioStore } from "@/renderer/modules/AioStore";
import { preventMutipleSelect } from "@/renderer/modules/preventMutipleSelect";
import { createLogger } from "@/renderer/utils/createLogger";

const log = createLogger("main");

async function setupMainPage() {
  log("await aio");
  const aioStore = new AioStore();
  await aioStore.ready;
  log("main ok");
  preventMutipleSelect("chat-msg-area");
}

export { setupMainPage };
