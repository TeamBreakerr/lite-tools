import { RecallMsgViewer } from "./components/recallMsgViewer";

function mountRecallMsgViewer(root: HTMLElement = document.body) {
  document.documentElement.style.height = "100%";
  document.body.style.height = "100%";
  document.body.style.margin = "0";
  document.body.style.overflow = "hidden";
  document.body.style.userSelect = "none";

  const viewer = document.createElement("lt-recall-msg-viewer") as RecallMsgViewer;
  root.replaceChildren(viewer);
  return viewer;
}

export { mountRecallMsgViewer, RecallMsgViewer };
