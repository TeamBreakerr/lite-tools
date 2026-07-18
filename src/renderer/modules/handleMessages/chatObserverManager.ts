import { waitForElement } from "@/renderer/utils/domWaitFor";
import { createLogger } from "@/renderer/utils/createLogger";

const log = createLogger("chatObserverManager");

interface ChatObserverTask {
  name: string;
  selector: string;
  handler: (elements: HTMLElement[]) => void;
  onRemove?: (elements: HTMLElement[]) => void;
}

class ChatObserverManager {
  private observer: MutationObserver | null = null;
  private tasks: Set<ChatObserverTask> = new Set();
  private target: HTMLElement | null = null;

  /**
   * @param targetSelector 监听的根容器
   * @param itemSelector 消息实体的通用选择器
   */
  constructor(
    private targetSelector: string,
    private itemSelector: string,
  ) {}

  public addTask(task: ChatObserverTask) {
    this.tasks.add(task);
    return () => this.tasks.delete(task);
  }

  public async start() {
    this.target = await waitForElement(this.targetSelector);
    if (!this.target) return;

    this.observer = new MutationObserver((mutationsList) => {
      if (!this.target?.isConnected) {
        this.destroy();
        return;
      }

      const addedElements = new Set<HTMLElement>();
      const removedElements = new Set<HTMLElement>();

      for (const mutation of mutationsList) {
        if (mutation.type !== "childList") continue;

        const targetEl = mutation.target as HTMLElement;
        if (targetEl.isConnected) {
          const entity = targetEl.closest?.<HTMLElement>(this.itemSelector);
          if (entity && entity.isConnected) addedElements.add(entity);
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.isConnected) {
            if (node.matches(this.itemSelector)) {
              addedElements.add(node);
            }
            node.querySelectorAll<HTMLElement>(this.itemSelector).forEach((el) => addedElements.add(el));
          }
        });

        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches(this.itemSelector)) removedElements.add(node);
            node.querySelectorAll<HTMLElement>(this.itemSelector).forEach((el) => removedElements.add(el));
          }
        });
      }

      if (addedElements.size > 0 || removedElements.size > 0) {
        this.dispatch(Array.from(addedElements), Array.from(removedElements));
      }
    });

    this.observer.observe(this.target, {
      childList: true,
      subtree: true,
    });
  }

  private dispatch(addedElements: HTMLElement[], removedElements: HTMLElement[]) {
    log(
      addedElements
        .filter((el) => el.querySelector(".pic"))
        .map((el) => el.classList)
        .join(","),
    );
    for (const task of this.tasks) {
      if (addedElements.length > 0) {
        const matchedAdded = addedElements.filter((el) => el.querySelector(task.selector));
        log(task.name, matchedAdded.length);
        if (matchedAdded.length > 0) {
          try {
            task.handler(matchedAdded);
          } catch (error) {
            log(`[ObserverTask] 任务 "${task.name}" handler 执行失败:`, error);
          }
        }
      }

      if (task.onRemove && removedElements.length > 0) {
        const matchedRemoved = removedElements.filter((el) => el.querySelector(task.selector));
        if (matchedRemoved.length > 0) {
          try {
            task.onRemove(matchedRemoved);
          } catch (error) {
            log(`[ObserverTask] 任务 "${task.name}" onRemove 执行失败:`, error);
          }
        }
      }
    }
  }

  public destroy() {
    this.observer?.disconnect();
    this.observer = null;
    this.tasks.clear();
  }
}

const chatObserverManager = new ChatObserverManager(".chat-msg-area__vlist", ".ml-item");
export { chatObserverManager };
