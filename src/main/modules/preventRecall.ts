import { ipcMain, dialog } from "electron";
import { serialize, deserialize } from "node:v8";
import { deflateSync, inflateSync } from "node:zlib";
import path from "node:path";
import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { dataPath } from "@/main/utils/localPath";
import { settingWindow } from "@/main/utils/captureWindow";
import { createLogger } from "@/main/utils/createLogger";
import { configManager } from "@/main/modules/configManager";
import { globalBroadcast } from "@/main/utils/globalBroadcast";

const log = createLogger("preventRecall");

type MsgId = string;
type Message = any;
type RecallCache = Map<MsgId, Message>;
type FilePath = string;
type PersistedFiles = { time: number; path: FilePath }[];
type RecallElement = {
  isSelfOperate: boolean;
  operatorNick: string;
  operatorRemark: string;
  operatorMemRemark: string;
  origMsgSenderNick: string;
  origMsgSenderRemark: string;
  origMsgSenderMemRemark: string;
};

class MsgStore {
  // 最近消息 <msgId, msg>
  private recentMessages: RecallCache = new Map();
  // 实时阻止撤回的消息 <msgId, msg>
  private activeRecallCache: RecallCache = new Map();
  // 持久化保存的文件列表
  private persistedFiles: PersistedFiles = [];
  // 缓存的已加载持久化撤回数据
  private loadedPersistedCache: Map<FilePath, RecallCache> = new Map();
  // 缓存持久化文件的数量
  private readonly MAX_PERSISTED_FILES = 5;
  // 每个切片文件储存消息数量
  private readonly MAX_MESSAGES_PER_FILE = 1000;
  // 实时缓存的消息数量
  private readonly MAX_RECALL_CACHE_SIZE = 100000;
  // 本地持久化文件路径
  private LOCAL_DATA_PATH!: string;

  constructor() {
    this.init();
  }

  private async init() {
    log("initing...");
    await configManager.ready;

    this.initLocalDataPath();
    this.initIpcEvent();
    this.loadActiveRecallCacheBuffer();
    this.loadPersistedFiles();

    log("init done");
  }

  private initLocalDataPath() {
    this.LOCAL_DATA_PATH = path.join(dataPath, "messageRecall", configManager.uid);
    if (!existsSync(this.LOCAL_DATA_PATH)) {
      mkdirSync(this.LOCAL_DATA_PATH, { recursive: true });
    }
    if (!existsSync(path.join(this.LOCAL_DATA_PATH, "activeRecallCache.bin"))) {
      writeFileSync(path.join(this.LOCAL_DATA_PATH, "activeRecallCache.bin"), Buffer.alloc(0));
    }
  }

  private initIpcEvent() {
    ipcMain.handle("lite_tools.getRecallChats", (event) => {
      return [];
    });
    ipcMain.handle("lite_tools.getRecallCacheFromChatId", (event) => {
      return [];
    });
    ipcMain.handle("lite_tools.getRecallCacheSize", (event) => {
      return this.recallCacheSize;
    });
    ipcMain.on("lite_tools.clearRecallCache", (event) => {
      this.clearPersistedFiles();
    });
  }

  private loadActiveRecallCacheBuffer() {
    const data = readFileSync(path.join(this.LOCAL_DATA_PATH, "activeRecallCache.bin"));
    let offset = 0;
    while (offset < data.length) {
      try {
        const len = data.readUInt32BE(offset);
        offset += 4;
        const msgBuf = data.subarray(offset, offset + len);
        offset += len;
        const message = deserialize(inflateSync(msgBuf));
        this.activeRecallCache.set(message.msgId, message);
      } catch (e) {
        offset += 1;
        log("读取缓存数据出错", e);
      }
    }
    log(`成功读取 ${this.activeRecallCache.size} 条缓存数据`);
  }

  private loadPersistedFiles() {
    const filterRegex = /^\d+\.bin$/;
    this.persistedFiles = readdirSync(this.LOCAL_DATA_PATH)
      .filter((name) => filterRegex.test(name))
      .map((name) => {
        return {
          time: parseInt(name.split(".")[0], 10),
          path: path.join(this.LOCAL_DATA_PATH, name),
        };
      })
      .sort((a, b) => a.time - b.time);
    log(`读取到 ${this.persistedFiles.length} 个持久化文件`);
    this.persistedFiles.forEach((item) => {
      log(
        new Date(item.time).toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    });
  }

  private saveToTempFile(message: Message) {
    try {
      const buf = deflateSync(serialize(message));
      const lenBuf = Buffer.alloc(4);
      lenBuf.writeUInt32BE(buf.length);
      appendFileSync(path.join(this.LOCAL_DATA_PATH, "activeRecallCache.bin"), Buffer.concat([lenBuf, buf]));
      log("写入临时数据", message.msgId);
    } catch (e) {
      log("写入临时数据出错", e);
    }
  }

  private saveToPersistedFile(fileName: number) {
    writeFileSync(path.join(this.LOCAL_DATA_PATH, `${fileName}.bin`), deflateSync(serialize(this.activeRecallCache)));
    log("写入持久化文件", `${fileName}.bin`);
  }

  private loadFromPersistedFile(msgId: MsgId, recallTime: number) {
    const find = this.persistedFiles.find((item) => item.time >= recallTime);
    if (find) {
      log("找到持久化文件", find.path);
      if (this.loadedPersistedCache.has(find.path)) {
        log("文件已被加载");
        const persistedCache = this.loadedPersistedCache.get(find.path)!;
        const fromPersistedCache = persistedCache.get(msgId);
        if (fromPersistedCache) {
          log("从持久化文件中找到数据", msgId);
          return fromPersistedCache;
        }
        log("消息不在持久化文件中");
        return null;
      } else if (existsSync(find.path)) {
        try {
          log("加载持久化文件");
          const persistedCache = deserialize(inflateSync(readFileSync(find.path))) as RecallCache;
          this.loadedPersistedCache.set(find.path, persistedCache);
          if (this.loadedPersistedCache.size > this.MAX_PERSISTED_FILES) {
            this.loadedPersistedCache.delete(this.loadedPersistedCache.keys().next().value!);
          }
          const fromPersistedCache = persistedCache.get(msgId);
          if (fromPersistedCache) {
            log("从持久化文件中找到数据", msgId);
            return fromPersistedCache;
          }
        } catch (e) {
          log("加载持久化文件失败", find.path, e);
          return null;
        }
        log("消息不在持久化文件中");
        return null;
      } else {
        log("没有找到持久化文件", find.path);
        return null;
      }
    }
    log("没有创建持久化文件");
    return null;
  }

  private async clearPersistedFiles() {
    if (settingWindow && settingWindow?.isDestroyed() === false) {
      const { response } = await dialog.showMessageBox(settingWindow, {
        type: "question",
        title: "确认",
        message: "确定要清除所有撤回数据吗？",
        buttons: ["取消", "确定"],
      });

      if (response === 1) {
        for (const file of this.persistedFiles) {
          unlinkSync(file.path);
        }
        this.persistedFiles = [];
        this.loadedPersistedCache.clear();
        this.activeRecallCache.clear();
        writeFileSync(path.join(this.LOCAL_DATA_PATH, "activeRecallCache.bin"), Buffer.alloc(0));
        settingWindow.webContents.send("lite_tools.updateRecallCacheSize", 0);
      }
    }
  }

  static createRecallData(message: Message) {
    const recallInfo = MsgStore.getRecallInfo(message)!;
    return {
      operatorNick: recallInfo.operatorNick,
      operatorRemark: recallInfo.operatorRemark,
      operatorMemRemark: recallInfo.operatorMemRemark,
      origMsgSenderNick: recallInfo.origMsgSenderNick,
      origMsgSenderRemark: recallInfo.origMsgSenderRemark,
      origMsgSenderMemRemark: recallInfo.origMsgSenderMemRemark,
      recallTime: message.recallTime,
    };
  }

  static getRecallInfo(message: Message): RecallElement | null {
    if (message.elements.length === 1) {
      if (message.elements[0]?.grayTipElement?.subElementType === 1) {
        return message.elements[0].grayTipElement.revokeElement;
      }
    }
    return null;
  }

  get recallCacheSize() {
    const size = this.activeRecallCache.size + this.persistedFiles.length * this.MAX_MESSAGES_PER_FILE;
    return size;
  }

  addMessageToCache(message: Message) {
    this.recentMessages.set(message.msgId, message);
    if (this.recentMessages.size >= this.MAX_RECALL_CACHE_SIZE) {
      this.recentMessages.delete(this.recentMessages.keys().next().value!);
    }
  }

  findRecallMsg(message: Message) {
    const msgId = message.msgId;
    const recallTime = parseInt(message.recallTime) * 1000;
    const fromRecent = this.recentMessages.get(msgId);
    if (fromRecent) {
      log("从内存消息中找到数据", msgId);
      this.recentMessages.delete(msgId);
      this.activeRecallCache.set(msgId, fromRecent);
      if (settingWindow && settingWindow?.isDestroyed() === false) {
        settingWindow.webContents.send("lite_tools.updateRecallCacheSize", this.recallCacheSize);
      }
      if (this.activeRecallCache.size >= this.MAX_MESSAGES_PER_FILE) {
        this.saveToPersistedFile(Date.now());
        writeFileSync(path.join(this.LOCAL_DATA_PATH, "activeRecallCache.bin"), Buffer.alloc(0));
        this.activeRecallCache.clear();
      } else {
        this.saveToTempFile(fromRecent);
      }
      return fromRecent;
    }

    const fromActiveRecallCache = this.activeRecallCache.get(msgId);
    if (fromActiveRecallCache) {
      log("从实时缓存中找到数据", msgId);
      return fromActiveRecallCache;
    }
    const fromPersistedFile = this.loadFromPersistedFile(msgId, recallTime);
    if (fromPersistedFile) {
      log("从持久化文件中找到数据", msgId);
      return fromPersistedFile;
    }
    return null;
  }
}

const msgStore = new MsgStore();

type RecallData = {
  id: number;
  recallData?: ReturnType<typeof MsgStore.createRecallData>;
};

function preventRecall(msgList: Message[]) {
  const recallDatas: RecallData[] = [];
  for (let index = 0; index < msgList.length; index++) {
    const message = msgList[index];
    const recallInfo = MsgStore.getRecallInfo(message);
    if (recallInfo) {
      log("找到撤回标记");
      if (recallInfo.isSelfOperate && !configManager.value.message.preventRecall.preventSelfMsg) {
        log("不处理自己撤回的消息");
        continue;
      }
      const recallMsg = msgStore.findRecallMsg(message);
      if (recallMsg) {
        log("找到撤回消息，完成替换", recallMsg.msgId);
        const recallData = MsgStore.createRecallData(message);
        msgList[index] = recallMsg;
        msgList[index].lt_recall = recallData;
        recallDatas.push({
          id: recallMsg.msgId,
        });
      }
    } else {
      msgStore.addMessageToCache(message);
    }
  }
  if (recallDatas.length) {
    globalBroadcast("lite_tools.recallMessagesFound", recallDatas);
  }
}

export type { RecallData };
export { preventRecall };
