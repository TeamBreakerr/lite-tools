import settingsHTML from "./html/settings.html";
import getHash from "./utils/getHash";

console.log(settingsHTML)

export default async function main() {
  const hash = await getHash();
  switch (hash) {
    case "#/main/message":
      break;
    case "#/chat":
      break;
    case "#/forward":
      break;
    case "#/image-viewer":
      break;
    case "#/setting/settings/common":
      break;
    default:
      console.warn(`Unknown Path: ${hash}`);
  }
}