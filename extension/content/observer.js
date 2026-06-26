/*
 * observer.js — watch the open chat for newly-added message rows.
 *
 * A debounced MutationObserver on the messages container. It does NOT decide
 * what to speak (that's the controller) — it just emits raw added rows and a
 * "chat changed" signal so the controller can re-arm.
 */
(function () {
  const WAHTTS = (window.WAHTTS = window.WAHTTS || {});
  const { adapter } = WAHTTS;

  class ChatObserver {
    /**
     * @param {(rows: HTMLElement[]) => void} onRows  new message rows added
     * @param {() => void} onChatChange               active chat switched
     */
    constructor(onRows, onChatChange) {
      this.onRows = onRows;
      this.onChatChange = onChatChange;
      this._mo = null;
      this._pending = [];
      this._flushTimer = null;
      this._chatId = null;
      this._chatPoll = null;
    }

    start() {
      this._attach();
      // WhatsApp swaps the whole #main subtree on chat switch, so poll the
      // active-chat fingerprint and re-attach + signal when it changes.
      this._chatId = adapter.getActiveChatId();
      this._chatPoll = setInterval(() => {
        const now = adapter.getActiveChatId();
        if (now !== this._chatId) {
          this._chatId = now;
          this._attach();
          this.onChatChange?.();
        }
      }, 1000);
    }

    _attach() {
      this._mo?.disconnect();
      const container = adapter.getMessagesContainer();
      if (!container) return;
      this._mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            this._pending.push(...adapter.messageRowsIn(node));
          }
        }
        this._scheduleFlush();
      });
      this._mo.observe(container, { childList: true, subtree: true });
    }

    // Debounce: rapid bursts of mutations collapse into one batch, de-duped.
    _scheduleFlush() {
      if (this._flushTimer) return;
      this._flushTimer = setTimeout(() => {
        this._flushTimer = null;
        const rows = Array.from(new Set(this._pending));
        this._pending = [];
        if (rows.length) this.onRows?.(rows);
      }, 120);
    }

    stop() {
      this._mo?.disconnect();
      this._mo = null;
      clearInterval(this._chatPoll);
      clearTimeout(this._flushTimer);
      this._flushTimer = null;
      this._pending = [];
    }
  }

  WAHTTS.ChatObserver = ChatObserver;
})();
