class Resource {
  private value: string = "";
  private listeners: Set<Function> = new Set();

  subscribe(fn: Function) {
    this.listeners.add(fn);
  }

  set url(url: string) {
    this.value = url;
    this.listeners.forEach((fn) => fn(url));
  }

  get url() {
    return this.value;
  }
}

const resource = new Resource();

export { resource };
