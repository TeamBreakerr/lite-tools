function getValueByPath<T = any>(target: Record<string, any>, path: string): T | undefined {
  const pathArr = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let result: any = target;

  for (let i = 0; i < pathArr.length; i++) {
    if (result != null && result[pathArr[i]] !== undefined) {
      result = result[pathArr[i]];
    } else {
      return undefined;
    }
  }

  return result as T;
}

/**
 * 设置对象指定路径上的值。
 * @param {Object} target - 要设置值的目标对象。
 * @param {string} path - 以点分隔的路径字符串。
 * @param {*} value - 要设置的值。
 * @param {boolean} [createPath=false] - 如果为 true，则在路径不存在时创建它。
 * @param {boolean} [overridePath=false] - 如果为 true，则在路径存在但不是对象时覆盖它。
 * @returns {boolean} - 如果成功设置值，则返回 true；否则返回 false。
 *
 * @example
 * const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
 * setValueByPath(obj, 'a.b[1].c', 3); // true, obj.a.b[1].c 现在是 3
 *
 * @example
 * const obj = { a: { b: [{ c: 1 }, { c: 2 }] } };
 * setValueByPath(obj, 'a.b[2].d.e', 4, true); // true, obj.a.b[2] 被创建并设置为 { d: { e: 4 } }
 *
 * @example
 * const obj = { a: { b: 1 } };
 * setValueByPath(obj, 'a.b.c', 4, false, true); // true, obj.a.b 被覆盖为对象 { c: 4 }
 *
 * @example
 * const obj = { a: { b: 1 } };
 * setValueByPath(obj, 'a.b.c', 4); // false, 因为 obj.a.b 不是对象且没有设置 overridePath
 */
function setValueByPath(
  target: Record<string, any>,
  path: string,
  value: any,
  createPath: boolean = false,
  overridePath: boolean = false
): boolean {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: any = target;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];

    if ((!current[key] && createPath) || (!(current[key] instanceof Object) && overridePath)) {
      current[key] = {};
    }

    if (!current[key]) {
      return false;
    }

    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return true;
}

export { getValueByPath, setValueByPath };
