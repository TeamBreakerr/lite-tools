import packageJson from "package.json";

const isqwq = "qwqnt" in globalThis && !!qwqnt.framework?.plugins?.[packageJson.name];
const isll = "LiteLoader" in globalThis && !!LiteLoader.plugins?.[packageJson.name];

export { isqwq, isll };
