import { Logs } from "./logs.js";
const log = new Logs("QQ通信模块");
const webContentId = lite_tools.getWebContentId() || 3;

log("获取到当前窗口Id", webContentId);

/**
 *
 * @param {Array} message 消息链
 * @returns
 */
async function convertMessage(message) {
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
      const type = await lite_tools.nativeCall("ns-FsApi", "getFileType", [path], webContentId, true, false);
      const md5 = await lite_tools.nativeCall("ns-FsApi", "getFileMd5", [path], webContentId, true, false);
      const fileName = `${md5}.${type.ext}`;
      const filePath = await lite_tools.nativeCall(
        "ns-ntApi",
        "nodeIKernelMsgService/getRichMediaFilePathForGuild",
        [
          {
            path_info: {
              downloadType: 1,
              elementSubType: message.picSubType,
              elementType: 2,
              fileName: fileName,
              file_uuid: "",
              md5HexStr: md5,
              needCreate: true,
              thumbSize: 0,
            },
          },
        ],
        webContentId,
        true,
        false,
      );
      const fileExist = await lite_tools.nativeCall("ns-FsApi", "isFileExist", [filePath], webContentId, true, false);
      log("文件是否存在", fileExist, message);
      if (!fileExist) {
        await lite_tools.nativeCall("ns-FsApi", "copyFile", [{ fromPath: path, toPath: filePath }], webContentId, true, false);
      }
      const imageSize = await lite_tools.nativeCall("ns-FsApi", "getImageSizeFromPath", [path], webContentId, true, false);
      const fileSize = await lite_tools.nativeCall("ns-FsApi", "getFileSize", [path], webContentId, true, false);
      const picElement = {
        md5HexStr: md5,
        fileSize: fileSize,
        picWidth: imageSize.width,
        picHeight: imageSize.height,
        fileName: fileName,
        sourcePath: filePath,
        original: true,
        picType: message.picSubType ? 1002 : 1001,
        picSubType: message.picSubType,
        fileUuid: "",
        fileSubId: "",
        thumbFileSize: 0,
        summary: "",
      };
      const messageChannel = {
        elementType: 2,
        elementId: "",
        picElement,
      };
      if (message.picSubType) {
        messageChannel.extBufForUI = "";
      }
      return messageChannel;
    }
    default:
      return null;
  }
}

/**
 *
 * @param {Peer} peer peer对象
 * @param {Array} messages 消息链
 */
async function sendMessage(peer, messages) {
  log("发送消息", peer, messages);
  lite_tools.nativeCall(
    {
      eventName: "ntApi",
      type: "request",
    },
    {
      cmdName: "nodeIKernelMsgService/sendMsg",
      cmdType: "invoke",
      payload: [
        {
          msgId: "0",
          peer,
          msgElements: await Promise.all(messages.map((message) => convertMessage(message))),
          msgAttributeInfos: new Map(),
        },
        null,
      ],
    },
  );
}

/**
 *
 * @param {Peer} srcpeer 转发消息Peer
 * @param {Peer} dstpeer 目标Peer
 * @param {Array} msgIds 消息Id数组
 */
function forwardMessage(srcpeer, dstpeer, msgIds) {
  log("转发消息", srcpeer, dstpeer, msgIds);
  lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelMsgService/forwardMsgWithComment",
      cmdType: "ntApi",
      payload: [
        {
          commentElements: [],
          dstContacts: [dstpeer],
          msgAttributeInfos: new Map(),
          msgIds,
          srcContact: srcpeer,
        },
        null,
      ],
    },
  );
}

/**
 * 获取用户信息
 * @param {String} uid 用户Uid
 * @returns Object
 */
function getUserInfo(uid) {
  return lite_tools.nativeCall(
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
    ["nodeIKernelProfileListener/onProfileDetailInfoChanged", "nodeIKernelProfileListener/onProfileSimpleChanged"],
  );
}

/**
 * 通过uid获取用户头像
 * @param {String[]} uids 用户uid
 */
function getMembersAvatar(uids) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelAvatarService/getMembersAvatarPath",
      cmdType: "invoke",
      payload: [
        {
          uids,
          clarity: 1,
        },
      ],
    },
    true,
  );
}

/**
 * 通过群号获取群组头像
 * @param {String[]} groupCodes 群组id
 */
function getGroupsAvatar(groupCodes) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelAvatarService/getConfGroupsAvatarPath",
      cmdType: "invoke",
      payload: [
        {
          groupCodes,
          clarity: 1,
        },
      ],
    },
    true,
  );
}

/**
 * 跳转到指定群组的指定消息id处
 * @param {Object} sceneData 场景数据
 * @returns
 */
function goMainWindowScene(sceneData) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "WindowApi",
    },
    {
      cmdName: "nodeIKernelAvatarService/getConfGroupsAvatarPath",
      cmdType: "invoke",
      payload: [
        {
          scene: sceneData.scene,
          sceneParams: {
            peerUid: sceneData.peerUid,
            chatType: sceneData.chatType,
            type: sceneData.type,
            params: {
              msgId: sceneData.msgId,
            },
          },
        },
      ],
    },
  );
}

/**
 *
 * @param {String} uid 获取群组信息
 * @returns Object
 */
function getGroupInfo(groupCode) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelGroupService/getGroupDetailInfo",
      cmdType: "invoke",
      payload: [
        {
          groupCode,
          source: 4,
        },
        null,
      ],
    },
  );
}

/**
 * 激活聊天窗口，并返回最新预览消息
 */
function activeChatAndReturnPreview(peer) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelMsgService/getAioFirstViewLatestMsgsAndAddActiveChat",
      cmdType: "invoke",
      payload: [
        {
          peer,
          cnt: 10,
        },
        null,
      ],
    },
  );
}

/**
 * 获取记录的账号 - 登录界面选择账号列表
 */
function getLoginList() {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelLoginService/getLoginList",
      cmdType: "invoke",
      payload: [null, null],
    },
  );
}

/**
 * 获取当前登录账号信息
 */
function getAuthData() {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "GlobalDataApi",
    },
    {
      cmdName: "fetchAuthData",
      cmdType: "invoke",
      payload: [],
    },
  );
}

/**
 * 移除账号登录信息
 * @param {String} uin 账号uin
 * @returns
 */
function resetLoginInfo(uin) {
  return lite_tools.nativeCall(
    {
      type: "request",
      eventName: "ntApi",
    },
    {
      cmdName: "nodeIKernelLoginService/deleteLoginInfo",
      cmdType: "invoke",
      payload: [
        {
          uin,
        },
        null,
      ],
    },
  );
}

export {
  sendMessage,
  forwardMessage,
  goMainWindowScene,
  getUserInfo,
  getMembersAvatar,
  getGroupsAvatar,
  getGroupInfo,
  getAuthData,
  activeChatAndReturnPreview,
  getLoginList,
  resetLoginInfo,
};
