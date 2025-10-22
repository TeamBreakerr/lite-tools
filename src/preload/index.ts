import { contextBridge, ipcRenderer } from "electron";
import type { Config } from "@/types/config";
import type { RecallData } from "@/main/modules/preventRecall";

const exposeFunctions = {
  updateConfig: (config: Config) => ipcRenderer.send("lite_tools.updateConfig", config),
  getConfig: async (): Promise<Config> => ipcRenderer.invoke("lite_tools.getConfig"),
  isIndependent: (): boolean => ipcRenderer.sendSync("lite_tools.isIndependent"),
  isInitialized: (): boolean => ipcRenderer.sendSync("lite_tools.isInitialized"),
  onConfigChange: (callback: (config: Config) => void) =>
    ipcRenderer.on("lite_tools.configChanged", (_, config: Config) => callback(config)),
  getWebContentId: (): number => ipcRenderer.sendSync("lite_tools.getWebContentId"),
  // 防撤回相关
  onRecallMessagesFound: (callback: (recallDatas: RecallData[]) => void) =>
    ipcRenderer.on("lite_tools.recallMessagesFound", (_, recallDatas: RecallData[]) => callback(recallDatas)),
  onUpdateRecallCacheSize: (callback: (size: number) => void) =>
    ipcRenderer.on("lite_tools.updateRecallCacheSize", (_, size: number) => callback(size)),
  getRecallCacheSize: (): Promise<number> => ipcRenderer.invoke("lite_tools.getRecallCacheSize"),
  clearRecallCache: () => ipcRenderer.send("lite_tools.clearRecallCache"),

  nativeCall: (event: any, payload: any, awaitCallback?: boolean | string | string[]) => {
    const callbackId = crypto.randomUUID();
    const webContentId = ipcRenderer.sendSync("lite_tools.getWebContentId");
    let resolve;
    if (awaitCallback) {
      resolve = new Promise((res) => {
        function onEvent(...args: any[]) {
          if (typeof awaitCallback === "boolean") {
            if (args[1]?.callbackId === callbackId) {
              ipcRenderer.off(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
              res(args[2]);
            }
          } else if (Array.isArray(awaitCallback)) {
            if (awaitCallback.includes(args?.[1]?.cmdName)) {
              ipcRenderer.off(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
              res(args[2]);
            }
          } else {
            if (args?.[2]?.cmdName === awaitCallback) {
              ipcRenderer.off(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
              res(args[2]);
            }
          }
        }
        ipcRenderer.on(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
      });
    } else {
      resolve = Promise.resolve(null);
    }
    ipcRenderer.send(
      `RM_IPCFROM_RENDERER${webContentId}`,
      {
        peerId: webContentId,
        callbackId,
        ...event,
      },
      payload
    );
    return resolve;
  },
};

contextBridge.exposeInMainWorld("lite_tools", exposeFunctions);

export type LiteTools = typeof exposeFunctions;
