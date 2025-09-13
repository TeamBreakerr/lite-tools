import { handleMessages } from "@/main/modules/handleMessages";

export function setupIpcInterceptor() {
  IpcInterceptor.onIpcSend((...args) => {
    handleMessages(args);
  });
}
