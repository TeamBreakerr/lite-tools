import { extname } from "node:path";

function isVideoFile(filePath: string) {
  const exts = [".mp4", ".avi", ".mkv", ".flv", ".webm"];
  const ext = extname(filePath).toLowerCase();
  return exts.includes(ext);
}

function isImgFile(filePath: string) {
  const etxs = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".avif"];
  const ext = extname(filePath).toLowerCase();
  return etxs.includes(ext);
}

export { isVideoFile, isImgFile };
