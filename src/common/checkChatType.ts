function checkChatType(peer: Peer) {
  if (!peer) {
    return false;
  }
  return [1, 2, 100].includes(peer?.chatType);
}

export { checkChatType };
