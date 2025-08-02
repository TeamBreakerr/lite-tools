import { Logs } from "./logs.js";
import { findShortestPathAndValue } from "./findShortestPathAndValue.js";
const log = new Logs("peer管理模块");

let curAioData = null;
let peer = null;
const eventList = [];

/**
 * 监听聊天对象变动
 * @returns {void}
 */
function initCurAioData() {
  const findObj = findShortestPathAndValue(app, "curAioData");
  if (!findObj?.value?.chatType) {
    setTimeout(initCurAioData, 500);
    log("等待数据初始化");
    return;
  }
  log("获取到curAioData", findObj);
  curAioData = findObj.value;
  Object.defineProperty(findObj.parent, "curAioData", {
    enumerable: true,
    configurable: true,
    get() {
      return curAioData;
    },
    set(newVal) {
      log("peer更新", newVal);
      curAioData = newVal;
      emitEvent();
    },
  });
  emitEvent();
}

function emitEvent() {
  peer = {
    chatType: curAioData.chatType,
    peerUid: curAioData?.header?.uid,
    guildId: "",
  };
  eventList.forEach((func) => {
    func(peer);
  });
}

/**
 * 添加peer监听函数
 * @param {Function} func 监听函数
 */
function addEventPeerChange(func) {
  eventList.push(func);
}
/**
 * 获取Peer
 * @returns {Object}
 */
function getPeer() {
  // log("返回peer", peer);
  return peer;
}

export { getPeer, addEventPeerChange, initCurAioData };
