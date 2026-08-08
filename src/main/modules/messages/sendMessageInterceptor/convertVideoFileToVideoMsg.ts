import { createLogger } from "@/main/utils/createLogger";
import { isVideoFile } from "@/main/utils/fileExtension";
import { sendMessage } from "@/main/utils/nativeCall";

const log = createLogger("convertVideoFileToVideoMsg");

function convertVideoFileToVideoMsg(msgPayload: any): boolean {
  const msgElement = msgPayload.msgElements[0];
  log(
    msgElement,
    msgElement?.elementType === 3,
    msgElement?.fileElement,
    isVideoFile(msgElement.fileElement.filePath),
    +msgElement.fileElement.fileSize / 1024 / 1024 <= 99,
  );
  if (
    msgElement &&
    msgElement?.elementType === 3 &&
    msgElement?.fileElement &&
    isVideoFile(msgElement.fileElement.filePath) &&
    +msgElement.fileElement.fileSize / 1024 / 1024 <= 99
  ) {
    // const { fileName, filePath, picHeight, picWidth, picThumbPath, fileSize } = msgElement.fileElement;
    // const videoElement = {
    //   elementType: ElementType.VideoElement,
    //   elementId: "",
    //   videoElement: {
    //     filePath: filePath,
    //     fileName,
    //     videoMd5: md5HexStr,
    //     thumbMd5: Utils.getFileMD5(oldThumbPath),
    //     fileSize,
    //     thumbWidth: picWidth,
    //     thumbHeight: picHeight,
    //     thumbPath: picThumbPath,
    //   },
    // };
    sendMessage(msgPayload.peer, [
      {
        type: "video",
        path: msgElement.fileElement.filePath,
        originMsgEl:msgElement.fileElement
      },
    ]);
    return true;
  }
  return false;
}

export { convertVideoFileToVideoMsg };
