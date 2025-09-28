type Options = {
  autoDisconnect?: number;
  attributes?: boolean;
  characterData?: boolean;
  childList?: boolean;
  subtree?: boolean;
};

type ObserverCallback = (mutationsList: MutationRecord[], observer: MutationObserver) => void;

function observeMutations(target: HTMLElement, callback: ObserverCallback, options: Options = {}) {
  if (!target || !callback) {
    return () => {};
  }
  console.log("开始监听元素", target);
  const observer = new MutationObserver((mutationsList) => {
    callback(mutationsList, observer);
  });

  observer.observe(target, {
    attributes: options.attributes ?? false,
    characterData: options.characterData ?? false,
    childList: options.childList ?? false,
    subtree: options.subtree ?? false,
  });

  if (options.autoDisconnect && options.autoDisconnect > 0) {
    setTimeout(() => observer.disconnect(), options.autoDisconnect);
  }

  return () => observer.disconnect();
}

export { observeMutations };
