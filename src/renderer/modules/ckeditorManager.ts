import { configStore } from "@/renderer/modules/configStore";
import { waitForElement } from "@/renderer/utils/domWaitFor";
import { createLogger } from "@/renderer/utils/createLogger";
const log = createLogger("ckeditorManager");

class CkeditorManager {
  setup() {
    this.replyCleanup();
  }

  private async replyCleanup() {
    const { model, doc } = await this.getCkeditorInstance();
    let isCleaning = false;
    let replyElement: any;
    doc.on("change:data", () => {
      try {
        const root: any = doc.getRoot();

        if (!configStore.value.message.removeReplyAt || isCleaning) return;

        if (!root) return;
        log("root",root);

        const curReplyElement = root.getChildren().find((block: any) => block.is?.("element", "msg-reply"));
        if (replyElement === curReplyElement) return;
        replyElement = curReplyElement;
        isCleaning = true;
        model.enqueueChange("transparent", (writer: any) => {
          try {
            const currentRoot: any = doc.getRoot();
            if (!currentRoot) return;

            const targets = {
              at: null as any,
              next: null as any,
            };

            for (const block of currentRoot.getChildren()) {
              if (!block.is?.("element", "paragraph")) continue;

              const children = Array.from(block.getChildren());
              for (let i = 0; i < children.length - 1; i++) {
                const cur = children[i] as any;
                const next = children[i + 1] as any;

                if (cur.is?.("element", "msg-at")) {
                  targets.at = cur;
                  targets.next = next;
                }
              }
            }
            log("targets", targets);

            const textNode = targets.next;

            if (textNode?.root && textNode.is?.("$text")) {
              const oldText = textNode.data;
              const newText = oldText.replace(/^\s+/, "");
              if (newText !== oldText) {
                const insertPos = writer.createPositionBefore(textNode);
                const attrs = Object.fromEntries(textNode.getAttributes());
                writer.remove(textNode);
                if (newText.length > 0) {
                  writer.insertText(newText, attrs, insertPos);
                }
              }
            }

            if (targets.at && targets.at.root) {
              writer.remove(writer.createRangeOn(targets.at));
            }

            writer.setSelection(writer.createPositionAt(currentRoot, "end"));
          } finally {
            isCleaning = false;
          }
        });
      } catch (err) {
        isCleaning = false;
        log(err);
      }
    });
  }

  private async getCkeditorInstance() {
    log("await getCkeditorInstance");
    const ckeditorEl: any = await waitForElement(".ck.ck-content.ck-editor__editable");
    const ckeditorInstance = ckeditorEl?.ckeditorInstance;
    if (!ckeditorInstance) throw new Error("Ckeditor instance not found");
    const editor = ckeditorInstance;
    const model = editor.model;
    const doc = model.document;
    return { editor, model, doc };
  }
}

const ckeditorManager = new CkeditorManager();
export { ckeditorManager };
