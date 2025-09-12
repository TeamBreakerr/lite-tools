function checkChatType(peer: any) {
  if (!peer) {
    return false;
  }
  return [1, 2, 100].includes(peer?.chatType);
}

export { checkChatType };
