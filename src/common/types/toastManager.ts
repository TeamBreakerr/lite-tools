// 类型定义
type ToastIconType = "default" | "error" | "success";
type Toast = { type: ToastIconType; content: string; duration: number };

export type { ToastIconType, Toast };
