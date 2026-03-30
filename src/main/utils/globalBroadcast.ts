import { BrowserWindow } from "electron";
import { createLogger } from "@/main/utils/createLogger";

const log = createLogger("globalBroadcast", true);

let pendingBroadcasts: { channel: string; data: any[] }[] = [];
let broadcastScheduled = false;

function globalBroadcast(channel: string, ...data: any[]) {
  pendingBroadcasts.push({ channel, data });

  if (!broadcastScheduled) {
    broadcastScheduled = true;
    setImmediate(() => {
      const broadcasts = pendingBroadcasts;
      pendingBroadcasts = [];
      broadcastScheduled = false;
      for (const window of BrowserWindow.getAllWindows()) {
        if (!window.isDestroyed()) {
          try {
            for (const broadcast of broadcasts) {
              window.webContents.send(broadcast.channel, ...broadcast.data);
            }
          } catch (err) {
            log("广播失败:", err);
          }
        }
      }
    });
  }
}

export { globalBroadcast };
