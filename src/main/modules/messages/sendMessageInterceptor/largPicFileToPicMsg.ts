import { isImgFile } from "@/main/utils/fileExtension";
import { sendMessage } from "@/main/utils/nativeCall";

function largPicFileToPicMsg(msgPayload: any) {
  const msgElement = msgPayload.msgElements[0];
  if (
    msgElement &&
    msgElement?.elementType === 3 &&
    msgElement?.fileElement &&
    isImgFile(msgElement.fileElement.filePath) &&
    +msgElement.fileElement.fileSize / 1024 / 1024 <= 99
  ) {
    sendMessage(msgPayload.peer, [
      {
        type: "image",
        path: msgElement.fileElement.filePath,
      },
    ]);
    return true;
  }
  return false;
}

export { largPicFileToPicMsg };
