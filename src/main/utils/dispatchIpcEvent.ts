import { webContents } from "electron";
import { randomUUID } from "crypto";

function dispatchIpcEvent(
  webContentId: number,
  event: any,
  payload: any,
  awaitCallback?: boolean | string | string[]
): Promise<any> {
  const webContent = webContents.fromId(webContentId);
  if (!webContent) {
    return Promise.resolve(null);
  }
  const callbackId = randomUUID();
  const ipcFromMain = `RM_IPCFROM_MAIN${webContentId}`;
  const ipcFromRenderer = `RM_IPCFROM_RENDERER${webContentId}`;
  let resolve;
  if (awaitCallback) {
    resolve = new Promise((res) => {
      function onEvent(channel: string, ...args: any[]): InterceptResult {
        if (channel === ipcFromMain) {
          if (typeof awaitCallback === "boolean") {
            if (args[0]?.callbackId === callbackId) {
              unsubscribe();
              res(args[1]);
              return {
                action: "block",
              };
            }
          } else if (Array.isArray(awaitCallback)) {
            if (awaitCallback.includes(args?.[1]?.cmdName)) {
              unsubscribe();
              res(args[1]);
              return {
                action: "block",
              };
            }
          } else {
            if (args?.[1]?.cmdName === awaitCallback) {
              unsubscribe();
              res(args[1]);
              return {
                action: "block",
              };
            }
          }
        }
        return {
          action: "pass",
        };
      }
      const unsubscribe = IpcInterceptor.interceptIpcSend(onEvent);
    });
  } else {
    resolve = Promise.resolve(null);
  }

  const emitData = [
    ipcFromRenderer,
    {
      peerId: webContentId,
      callbackId,
      ...event,
    },
    payload,
  ];

  webContent.emit(
    "-ipc-message",
    {
      frameId: 1,
      frameTreeNodeId: 2,
      sender: webContent,
      processId: 5,
      senderFrame: {},
    },
    false,
    ipcFromRenderer,
    [
      {
        peerId: webContentId,
        callbackId,
        ...event,
      },
      payload,
    ]
  );
  return resolve;
}

export { dispatchIpcEvent };
