import getHash from "./utils/getHash";

export async function main() {
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
