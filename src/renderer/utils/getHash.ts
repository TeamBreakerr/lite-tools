function getHash() {
  const { promise, resolve } = Promise.withResolvers();
  if (location.hash === "#/blank" || location.hash === "#/") {
    window.navigation.addEventListener("navigatesuccess", () => resolve(location.hash), { once: true });
  } else {
    resolve(location.hash);
  }
  return promise;
}

export { getHash };
