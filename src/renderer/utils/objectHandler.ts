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
