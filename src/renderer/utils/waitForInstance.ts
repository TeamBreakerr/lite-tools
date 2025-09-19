function getByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const segments = path
    .replace(/\[(\w+)\]/g, ".$1") // 把 [1] 转成 .1
    .split(".")
    .filter(Boolean);
  return segments.reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function waitForInstance(classSelector: string, propPath: string, pollInterval = 100): Promise<any> {
  return new Promise((resolve) => {
    const check = () => {
      const element = document.querySelector(classSelector) as any;
      if (element) {
        const vueInstances = element.__VUE__;
        if (vueInstances?.length) {
          for (const instance of vueInstances) {
            const value = getByPath(instance, propPath);
            if (value !== undefined) {
              resolve({ element, instance, value });
              return;
            }
          }
        }
      }
      setTimeout(check, pollInterval);
    };
    check();
  });
}

export { waitForInstance };
