import { existsSync } from "node:fs";
import { webContents } from "electron";
import { dispatchIpcEvent } from "@/main/utils/dispatchIpcEvent";
import { configManager } from "@/main/modules/configManager";

function largPicFileToPicMsg(picFileElement: any, webContentId: number) {}

export { largPicFileToPicMsg };
