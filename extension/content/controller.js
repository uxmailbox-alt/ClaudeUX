/*
 * controller.js — the brain. Wires observer → adapter → normalize → engine,
 * and owns the state machine. Loaded LAST so every other module exists.
 *
 * Responsibilities the original plan left undefined:
 *   - "Start from now": snapshot existing message ids at activation; only speak
 *     ids we haven't seen.
 *   - "Skip own": rely on adapter's incoming/outgoing class, not phone numbers.
 *   - Serial queue with no overlap; cancel clears it instantly.
 *   - Re-arm cleanly on chat switch.
 */
(function () {
  const WAHTTS = window.WAHTTS;
  const { adapter, normalize, engines, ChatObserver, FloatingUI } = WAHTTS;

  const DEFAULT_SETTINGS = {
    engine: "webspeech",
    rate: 1.0,
    announceSenderInGroups: true,
    maxChunkLen: 200,
  };

  class Controller {
    constructor() {
      this.active = false;
      this.settings = { ...DEFAULT_SETTINGS };
      this.engine = null;
      this.observer = null;
      this.ui = new FloatingUI(() => this.toggle());
      this.seenIds = new Set(); // ids present before/at activation or already spoken
      this.queue = []; // [{text, opts}]
      this.speaking = false;
    }

    async boot() {
      this.settings = await this._loadSettings();
      this.ui.mount();
      // React to settings changes from the options page without a reload.
      chrome.storage?.onChanged?.addListener((changes, area) => {
        if (area === "sync" && changes.settings) {
          this.settings = { ...DEFAULT_SETTINGS, ...changes.settings.newValue };
        }
      });
    }

    _loadSettings() {
      return new Promise((resolve) => {
        try {
          chrome.storage.sync.get(["settings"], (res) =>
            resolve({ ...DEFAULT_SETTINGS, ...(res?.settings || {}) })
          );
        } catch (_) {
          resolve({ ...DEFAULT_SETTINGS });
        }
      });
    }

    async toggle() {
      if (this.active) this.stop();
      else await this.start();
    }

    async start() {
      // Build the engine and surface availability problems immediately.
      this.engine = engines.createEngine(this.settings.engine);
      await this.engine.init();
      const { warning } = this.engine.status();
      if (warning) this.ui.notify(warning, "warn");

      // "Start from now": everything currently on screen is considered seen.
      this.seenIds = adapter.snapshotMessageIds();

      this.observer = new ChatObserver(
        (rows) => this._onRows(rows),
        () => this._onChatChange()
      );
      this.observer.start();

      this.active = true;
      this.ui.setActive(true);
      this.ui.notify("Reading new incoming messages…");
    }

    stop() {
      this.observer?.stop();
      this.observer = null;
      this.engine?.cancel();
      this.queue = [];
      this.speaking = false;
      this.active = false;
      this.ui.setActive(false);
      this.ui.setSpeaking(false);
      this.ui.notify("Stopped.");
    }

    _onChatChange() {
      // New conversation: drop the queue and re-snapshot so we don't suddenly
      // read the freshly-loaded history.
      this.engine?.cancel();
      this.queue = [];
      this.speaking = false;
      this.seenIds = adapter.snapshotMessageIds();
    }

    _onRows(rows) {
      for (const row of rows) {
        const msg = adapter.parseMessage(row);
        if (!msg.id || this.seenIds.has(msg.id)) continue;
        this.seenIds.add(msg.id);

        if (!msg.incoming) continue; // skip our own messages
        const text = normalize.normalizeForSpeech(msg.text, {
          sender: msg.sender,
          announceSender: this.settings.announceSenderInGroups && !!msg.sender,
        });
        if (!text) continue; // emoji-only / media-only

        for (const chunk of normalize.chunkBySentence(
          text,
          this.settings.maxChunkLen
        )) {
          this.queue.push({ text: chunk, opts: { rate: this.settings.rate } });
        }
      }
      this._pump();
    }

    // Serial pump: one chunk at a time, never overlapping.
    async _pump() {
      if (this.speaking || !this.active) return;
      const item = this.queue.shift();
      if (!item) return;
      this.speaking = true;
      this.ui.setSpeaking(true);
      try {
        await this.engine.speak(item.text, item.opts);
      } catch (_) {
        /* swallow — keep the queue moving */
      }
      this.speaking = false;
      if (!this.queue.length) this.ui.setSpeaking(false);
      // Continue draining.
      if (this.active) this._pump();
    }
  }

  // Boot once the page is interactive.
  const controller = new Controller();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => controller.boot());
  } else {
    controller.boot();
  }
  WAHTTS.controller = controller;
})();
