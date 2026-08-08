import { dirname, basename, join as pathjoin, extname } from "node:path";
import fs from "node:fs";
import { access } from "node:fs/promises";
import { createLogger } from "@/main/utils/createLogger";
import { getFileMD5 } from "@/main/utils/getFileMD5";
import { dispatchIpcEvent } from "@/main/utils/dispatchIpcEvent";

const log = createLogger("nativeCall");

function getUserInfo(uid: string[], webContentId: number = 2) {
  return dispatchIpcEvent(
    webContentId,
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelProfileService/fetchUserDetailInfo",
      cmdType: "invoke",
      payload: [
        {
          callFrom: "BuddyProfileStore",
          uid,
          bizList: [0],
          source: 0,
        },
        null,
      ],
    },
    true,
  );
}

async function convertMessage(message: any) {
  switch (message.type) {
    case "text":
      return {
        elementType: 1,
        elementId: "",
        textElement: {
          content: message.content,
          atType: 0,
          atUid: "",
          atTinyId: "",
          atNtUid: "",
        },
      };
    case "image": {
      const path = message.path;
      await dispatchIpcEvent(
        2,
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getFileType",
          cmdType: "invoke",
          payload: [path],
        },
        true,
      );
      const copyFile = (await dispatchIpcEvent(
        2,
        {
          type: "request",
          eventName: "ntApi",
        },
        {
          cmdName: "nodeIKernelMsgService/copyFileWithDelExifInfo",
          cmdType: "invoke",
          payload: [
            {
              sourcePath: path,
              elementSubType: message.picSubType,
            },
            null,
          ],
        },
        true,
      )) as any;
      const fileType = (await dispatchIpcEvent(
        2,
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getFileType",
          cmdType: "invoke",
          payload: [copyFile.newPath],
        },
        true,
      )) as any;
      const imageSize = (await dispatchIpcEvent(
        2,
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getImageSizeFromPath",
          cmdType: "invoke",
          payload: [path],
        },
        true,
      )) as any;
      const fileSize = (await dispatchIpcEvent(
        2,
        {
          type: "request",
          eventName: "FileApi",
        },
        {
          cmdName: "getFileSize",
          cmdType: "invoke",
          payload: [path],
        },
        true,
      )) as number;

      const fileName = basename(copyFile.newPath);

      const picElement = {
        md5HexStr: copyFile.md5,
        picWidth: imageSize.width,
        picHeight: imageSize.height,
        fileName,
        fileSize: `${fileSize}`,
        original: true,
        picSubType: message.picSubType,
        sourcePath: copyFile.newPath,
        thumbPath: null,
        picType: fileType.ext === "gif" ? 2000 : 1000,
        fileUuid: "",
        fileSubId: "",
        thumbFileSize: 0,
        summary: message.summary || "",
      };
      const messageChannel = {
        elementType: 2,
        elementId: "",
        picElement,
        extBufForUI: new Uint8Array(),
      };
      return messageChannel;
    }
    case "video": {
      try {
        const path = message.path;
        const md5HexStr = getFileMD5(path);
        const copyFile = (await dispatchIpcEvent(
          2,
          {
            type: "request",
            eventName: "ntApi",
          },
          {
            cmdName: "nodeIKernelMsgService/copyFileWithDelExifInfo",
            cmdType: "invoke",
            payload: [
              {
                sourcePath: path,
                elementSubType: 0,
              },
              null,
            ],
          },
          true,
        )) as any;

        // 我没辙了
        const videoPath = copyFile.newPath.replace(/Pic/, "Video");
        fs.mkdirSync(dirname(videoPath), { recursive: true });
        fs.renameSync(copyFile.newPath, videoPath);

        const fileName = basename(copyFile.newPath);
        const picThumbPath = Array.from<[string, string]>(message.originMsgEl.picThumbPath)[0][1];

        const videoExt = extname(basename(videoPath));
        const videoBaseName = basename(videoPath, videoExt);

        const videoThumbPath = pathjoin(dirname(videoPath).replace("Ori", "Thumb"), `${videoBaseName}_0.png`);
        fs.mkdirSync(dirname(videoThumbPath), { recursive: true });

        await checkFileExists(picThumbPath);

        fs.renameSync(picThumbPath, videoThumbPath);

        const thumbPath = new Map();
        thumbPath.set(0, videoThumbPath);

        const videoElement = {
          filePath: videoPath,
          fileName,
          videoMd5: getFileMD5(videoPath),
          thumbMd5: getFileMD5(videoThumbPath),
          fileSize: message.originMsgEl.fileSize,
          thumbWidth: 1280,
          thumbHeight: 1080,
          thumbPath,
        };
        const messageChannel = {
          elementType: 5,
          elementId: "",
          videoElement,
        };
        return messageChannel;
      } catch (err: any) {
        log(err, err?.stack);
      }
    }

    default:
      return null;
  }
}

// 从星之杖偷来的，能用就行
function checkFileExists(filePath: string, interval: number = 200, maxAttempts: number = 10) {
  const { promise, resolve, reject } = Promise.withResolvers();
  let attempts = 0;

  const check = async () => {
    attempts++;
    try {
      await access(filePath);
      resolve(filePath);
    } catch {
      if (attempts > maxAttempts) {
        return reject(new Error("找不到视频封面"));
      }
      setTimeout(check, interval);
    }
  };
  check();

  return promise;
}

async function sendMessage(peer: Peer, messages: any[]) {
  const msgElements = await Promise.all(messages.map((message) => convertMessage(message)));
  if (!msgElements) return;
  return dispatchIpcEvent(
    2,
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelMsgService/sendMsg",
      cmdType: "invoke",
      payload: [
        {
          msgId: "0",
          peer,
          msgElements,
          msgAttributeInfos: new Map(),
        },
        null,
      ],
    },
  );
}

export { getUserInfo, sendMessage };
