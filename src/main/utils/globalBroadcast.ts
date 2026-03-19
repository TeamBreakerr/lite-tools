import { BrowserWindow } from "electron";
import { createLogger } from "@/main/utils/createLogger";

const log = createLogger("globalBroadcast", true);

// 白名单
const allowedRoutes = new Set(["main", "chat", "setting", "record", "forward"]);

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
              const url = window.webContents.getURL();
              const hash = url.split("#")[1] || "";
              const routeModule = hash.split("/")[1];
              if (allowedRoutes.has(routeModule)) {
                log("send", routeModule, broadcast.channel);
                window.webContents.send(broadcast.channel, ...broadcast.data);
              }
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
