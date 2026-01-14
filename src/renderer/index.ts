import { getHash } from "@/renderer/utils/getHash";
import { createLogger } from "@/renderer/utils/createLogger";

// pages
import { setupMainPage } from "@/renderer/pages/main";
import { setupChatPage } from "@/renderer/pages/chat";
import { setupImageViewer } from "@/renderer/pages/imageViewer";

const log = createLogger("renderer");

log("start");

export async function main() {
  const hash = await getHash();
  log("hash Update", hash);
  switch (hash) {
    case "#/main/message":
      setupMainPage();
      break;
    case "#/chat":
      setupChatPage();
      break;
    case "#/forward":
      break;
    case "#/image-viewer":
      setupImageViewer();
      break;
    case "#/setting/settings/common":
      break;
    default:
      console.warn(`Unknown Path: ${hash}`);
  }
}
