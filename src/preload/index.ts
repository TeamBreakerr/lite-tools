import { contextBridge, ipcRenderer } from "electron";
import type { Config } from "@common/types";

const exposeFunctions = {
  updateConfig: (config: Config) => ipcRenderer.invoke("lite_tools.updateConfig", config),
  getConfig: (): Config => ipcRenderer.sendSync("lite_tools.getConfig"),
  onConfigChange: (callback: (config: Config) => void) =>
    ipcRenderer.on("lite_tools.onConfigChange", (_, config) => callback(config)),
};

contextBridge.exposeInMainWorld("lite_tools", exposeFunctions);

export type LiteTools = typeof exposeFunctions;
