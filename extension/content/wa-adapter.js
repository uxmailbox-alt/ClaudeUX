/*
 * wa-adapter.js — the ONLY module that knows WhatsApp Web's DOM.
 *
 * WhatsApp ships obfuscated, rotating CSS class names and deep nth-child trees
 * that break constantly. Every selector and every piece of DOM parsing lives
 * here so a WhatsApp redesign is a one-file fix. Anchor on STABLE signals:
 *
 *   - [data-pre-plain-text]  → "[12:34, 6/26/2026] Sender Name: " (sender+time)
 *   - .message-in / .message-out → incoming vs. our own messages (no phone math)
 *   - [data-id]              → stable per-message id (for start-from-now + dedupe)
 *   - .copyable-text / .selectable-text → the actual text span
 *
 * If WhatsApp breaks the tool, update SELECTORS first.
 */
(function () {
  const WAHTTS = (window.WAHTTS = window.WAHTTS || {});

  const SELECTORS = {
    // The app root + the conversation panel.
    appRoot: "#app",
    mainPanel: "#main",
    // Scrollable list that holds message rows. We resolve it defensively below.
    messagesContainer: "#main div[role='application']",
    // A single message row carries data-id and an in/out class.
    messageRow: "div.message-in, div.message-out",
    incoming: "div.message-in",
    outgoing: "div.message-out",
    // Sender + timestamp metadata.
    prePlainText: "[data-pre-plain-text]",
    // The visible text of the message.
    textSpan: "span.selectable-text, span.copyable-text",
  };

  function getMainPanel() {
    return document.querySelector(SELECTORS.mainPanel);
  }

  /**
   * Resolve the scrollable messages container. Falls back through a couple of
   * strategies because the exact wrapper changes between releases.
   */
  function getMessagesContainer() {
    const main = getMainPanel();
    if (!main) return null;
    return (
      main.querySelector(SELECTORS.messagesContainer) ||
      main.querySelector("div[role='application']") ||
      // Last resort: the deepest scrollable region inside #main.
      main.querySelector("div[tabindex] [data-id]")?.closest("div[tabindex]") ||
      main
    );
  }

  /** True if a DOM node is (or contains) a message row. */
  function isMessageRow(node) {
    if (!(node instanceof HTMLElement)) return false;
    return node.matches?.(SELECTORS.messageRow) || !!node.querySelector?.(SELECTORS.messageRow);
  }

  /** Yield every message-row element within an added node. */
  function messageRowsIn(node) {
    if (!(node instanceof HTMLElement)) return [];
    const rows = [];
    if (node.matches?.(SELECTORS.messageRow)) rows.push(node);
    rows.push(...node.querySelectorAll(SELECTORS.messageRow));
    return rows;
  }

  function getMessageId(row) {
    // data-id lives on the row or a close ancestor/descendant.
    const el =
      row.closest("[data-id]") || row.querySelector("[data-id]") || row;
    return el?.getAttribute?.("data-id") || null;
  }

  /**
   * Parse the "[12:34, 6/26/2026] Dana Cohen: " prefix to get the sender name.
   * Returns null for 1:1 chats where the prefix may omit a name.
   */
  function parseSender(row) {
    const meta = row.querySelector(SELECTORS.prePlainText);
    const pre = meta?.getAttribute("data-pre-plain-text") || "";
    const m = pre.match(/\]\s*(.*?):\s*$/);
    return m ? m[1].trim() : null;
  }

  function getText(row) {
    // Prefer the innermost selectable text spans; join multiple lines.
    const spans = row.querySelectorAll(SELECTORS.textSpan);
    if (!spans.length) return "";
    return Array.from(spans)
      .map((s) => s.innerText)
      .join(" ")
      .trim();
  }

  /**
   * Parse a message row into a structured record.
   * @returns {{id: string|null, sender: string|null, text: string, incoming: boolean}}
   */
  function parseMessage(row) {
    const target = row.matches(SELECTORS.messageRow)
      ? row
      : row.closest(SELECTORS.messageRow) || row;
    return {
      id: getMessageId(target),
      sender: parseSender(target),
      text: getText(target),
      incoming: !!target.closest(SELECTORS.incoming),
    };
  }

  /** Identify the currently open chat so we can re-arm on chat switch. */
  function getActiveChatId() {
    const meta = getMainPanel()?.querySelector(SELECTORS.prePlainText);
    // Cheap stable-ish fingerprint of the open conversation.
    return meta?.getAttribute("data-pre-plain-text")?.split("]")[0] || null;
  }

  /** Snapshot every message id currently in the DOM (for "start from now"). */
  function snapshotMessageIds() {
    const container = getMessagesContainer();
    if (!container) return new Set();
    const ids = new Set();
    container.querySelectorAll(SELECTORS.messageRow).forEach((row) => {
      const id = getMessageId(row);
      if (id) ids.add(id);
    });
    return ids;
  }

  WAHTTS.adapter = {
    SELECTORS,
    getMainPanel,
    getMessagesContainer,
    isMessageRow,
    messageRowsIn,
    parseMessage,
    getActiveChatId,
    snapshotMessageIds,
  };
})();
