import { BrowserWindow } from "electron";
function onBrowserWindowCreated(browserWindow: BrowserWindow): void {
  
}

if ("qwqnt" in globalThis) {
  qwqnt.main.hooks.whenBrowserWindowCreated.peek(onBrowserWindowCreated);
}

export default { onBrowserWindowCreated };
