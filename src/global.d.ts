declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.html" {
  const content: string;
  export default content;
}

interface Window {
  navigation: any;
  qwqnt: any;
  lt_logs: () => void;
  lt_errors: () => void;
}

interface Element {
  __VUE__?: any[]; // 或指定具体类型
}

interface Peer {
  chatType: 1 | 2 | 100;
  guildId: string;
  peerUid: string;
}

// LiteLoader 兼容
declare const LiteLoader: any;

// ipc-logger 兼容
declare const Logs: any;

// RendererEvents
declare namespace RendererEvents {
  const onSettingsWindowCreated: (callback: () => void) => void;
}

// PluginSettings
interface IQwQNTPlugin {
  name: string;
  qwqnt: {
    name: string;
    icon?: string;
    inject?: {
      renderer?: string;
      preload?: string;
    };
  };
}

declare namespace PluginSettings {
  interface ICommon {
    readConfig: <T>(id: string, defaultConfig?: T) => T;
    writeConfig: <T>(id: string, newConfig: T) => boolean;
    openPath: (path: string) => void;
    openExternal: (url: string) => void;
  }
  interface IRenderer extends ICommon {
    registerPluginSettings: (packageJson: IQwQNTPlugin) => Promise<HTMLDivElement>;
  }

  const main: ICommon;
  const preload: ICommon;
  const renderer: IRenderer;
}

// ipc-interceptor.d.ts

type Unsubscribe = () => void;
type EventName = string | string[];
type IpcCallback = (...args: any[]) => void;

interface IpcInterceptorType {
  onIpcReceive(callback: IpcCallback): Unsubscribe;
  onIpcSend(callback: IpcCallback): Unsubscribe;
  offIpcReceive(callback: IpcCallback): void;
  offIpcSend(callback: IpcCallback): void;
  onIpcReceiveEvents(eventName: EventName, callback: IpcCallback): Unsubscribe;
  onIpcSendEvents(eventName: EventName, callback: IpcCallback): Unsubscribe;
  offIpcReceiveEvents(eventName: EventName, callback: IpcCallback): void;
  offIpcSendEvents(eventName: EventName, callback: IpcCallback): void;
}

declare const IpcInterceptor: IpcInterceptorType;
