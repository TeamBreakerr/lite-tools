import { readFileSync, writeFileSync } from "fs";

const PACKAGE_PATH = "./package.json";
const RELEASE_PATH = "./release.md";
const CHANGELOG_PATH = "./changeLog.md";

/**
 * 格式化日期为完整字符串
 * @param {Date} date
 * @returns {string}
 */
function formatDateToFullString(date = new Date()) {
  const d = new Date(date.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }));
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(
    d.getSeconds(),
  )}`;
}

/**
 * 判断版本号是否在日志中出现
 * @param {string} logText 整个更新日志文本
 * @param {string} version 版本号，如 "v2.33.9"
 * @returns {boolean}
 */
function isVersionLogged(logText, version) {
  const versionHeaderRegex = new RegExp(`^##\\s*${version}\\b`, "m");
  return versionHeaderRegex.test(logText);
}

/**
 * 替换 changelog 中指定版本的内容
 * @param {string} logText 原始 changelog 文本
 * @param {string} version 版本号（如 "v2.33.9"）
 * @param {string} newContent 替换后的内容（完整包含 "## v2.33.9 - ..." 开头）
 * @returns {string} 替换后的文本
 */
function replaceVersionContent(logText, version, newContent) {
  const versionPattern = `##\\s*${version}\\b[^#]*?(?=(\\n##\\s*v|\\n?$))`;
  const regex = new RegExp(versionPattern, "gs");
  return logText.replace(regex, newContent.trim());
}

/**
 * 更新 changelog
 */
function updateChangeLog() {
  const packageJSON = JSON.parse(readFileSync(PACKAGE_PATH, "utf-8"));
  const releaseBody = readFileSync(RELEASE_PATH, "utf-8");
  const currentVersion = `v${packageJSON.version}`;
  const changeLog = readFileSync(CHANGELOG_PATH, "utf-8");
  const releaseText = `## ${currentVersion} - ${formatDateToFullString()}\n\n` + releaseBody;

  let newChangeLog = changeLog;
  if (isVersionLogged(changeLog, currentVersion)) {
    console.log("版本号已在日志中出现，更新内容");
    newChangeLog = replaceVersionContent(changeLog, currentVersion, releaseText);
  } else {
    console.log("版本号未在日志中出现，追加日志");
    newChangeLog = `${releaseText}\n\n\n${changeLog}`;
  }
  writeFileSync(CHANGELOG_PATH, newChangeLog);
}

export { updateChangeLog };
