import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

function getFileMD5(filePath: string) {
  const hash = createHash("md5");
  const fileBuffer = readFileSync(filePath);
  hash.update(fileBuffer);
  return hash.digest("hex");
}
export { getFileMD5 };
