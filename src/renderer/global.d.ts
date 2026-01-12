import type { LiteTools } from "@/preload/index";

declare global {
  // LiteLoader 兼容
  const LiteLoader: any;

  // ipc-logger 兼容
  const Logs: any;

  const lite_tools: LiteTools;

  interface Peer {
    chatType: 1 | 2 | 100;
    guildId: string;
    peerUid: string;
  }

  interface Window {
    navigation: any;
    qwqnt: any;
    lt_logs: () => void;
    lt_errors: () => void;
  }

  interface Element {
    __VUE__?: any[];
    __vue_app__?: any;
  }
}

export {};
