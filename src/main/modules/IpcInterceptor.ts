import { handleMessages } from "./handleMessages";

export function setupIpcInterceptor() {
  IpcInterceptor.onIpcSend((...args) => {
    handleMessages(args);
  });
}
