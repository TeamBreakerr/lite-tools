import { isqwq, isll } from "@/main/utils/loaderInspector";

function resolvePath(filePath: string) {
  if (isll) {
    return `local:///${filePath}`;
  } else if (isqwq) {
    return qwqnt.framework.protocol.pathToStorageUrl(filePath);
  }
  return filePath;
}

export { resolvePath };
