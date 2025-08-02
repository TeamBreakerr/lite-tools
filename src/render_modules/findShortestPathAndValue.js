// 预定义要忽略的属性（只创建一次）
const IGNORE_PROPS = new Set([
  "dep",
  "__v_raw",
  "__v_skip",
  "_value",
  "__ob__",
  "prevDep",
  "nextDep",
  "prevSub",
  "nextSub",
  "deps",
  "subs",
  "__vueParentComponent",
  "parent",
  "provides",
]);

/**
 * 找到 targetKey 的最短路径和值（BFS），返回 { path, value } 或 null。
 * @param {object} rootObject 根对象
 * @param {string} targetKey 要找的键
 * @param {string} [rootName='app'] 用于构造路径的根名称（不用于访问，仅用于返回的字符串）
 */
export function findShortestPathAndValue(rootObject, targetKey, rootName = "app") {
  if (!rootObject || typeof rootObject !== "object") return null;

  const isObject = (o) => o && typeof o === "object";
  const visited = new WeakSet();
  const queue = [{ obj: rootObject, pathSegments: [] }]; // 不用 shift，下面用索引
  visited.add(rootObject);

  // 帮助格式化路径段
  const formatSegment = (seg) => {
    // 数字索引（数组）用 [idx]
    if (/^\d+$/.test(seg)) return `[${seg}]`;
    // 合法标识符用 .name
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)) return `.${seg}`;
    // 其他用 ['...'] 并转义单引号
    return `['${seg.replace(/'/g, "\\'")}']`;
  };

  for (let qi = 0; qi < queue.length; qi++) {
    const { obj, pathSegments } = queue[qi];

    if (isObject(obj) && Object.prototype.hasOwnProperty.call(obj, targetKey)) {
      const value = obj[targetKey];
      // 构造路径字符串
      const fullPath = rootName + pathSegments.map(formatSegment).join("") + formatSegment(targetKey);
      return { path: fullPath, value, parent: obj };
    }

    // 遍历 own keys（包括数组索引）
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const prop = keys[i];
      if (IGNORE_PROPS.has(prop)) continue;

      const child = obj[prop];
      if (isObject(child) && !visited.has(child)) {
        visited.add(child);
        // 新的路径段数组（复制一份以保持不变性）
        const newSegments = pathSegments.length ? pathSegments.slice() : [];
        newSegments.push(prop);
        queue.push({ obj: child, pathSegments: newSegments });
      }
    }
  }

  return null;
}
