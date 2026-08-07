import { existsSync } from "node:fs";
import { webContents } from "electron";
import { dispatchIpcEvent } from "@/main/utils/dispatchIpcEvent";
import { configManager } from "@/main/modules/configManager";

function convertVideoFileToVideoMsg(videoFileElement: any, webContentId: number) {
  
}

export { convertVideoFileToVideoMsg };
