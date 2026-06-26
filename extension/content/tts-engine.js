/*
 * tts-engine.js — the swappable TTS strategy.
 *
 * This is the seam that makes "free vs. premium" a one-line change instead of a
 * rewrite. Every engine implements the same interface:
 *
 *   init()            -> Promise<void>     (load voices, warm up)
 *   speak(text, opts) -> Promise<void>     (resolves when the chunk finishes)
 *   cancel()          -> void              (stop immediately, drop current)
 *   status()          -> { ready, warning } (for the UI)
 *
 * Phase 1 ships WebSpeechEngine (free, local, runs in the page context because
 * speechSynthesis is unavailable in a service worker). NeuralEngine is stubbed
 * here and will route text → background → Dicta Nakdan → neural TTS → audio in
 * Phase 2 via the same interface.
 */
(function () {
  const WAHTTS = (window.WAHTTS = window.WAHTTS || {});

  /* ----------------------------- Web Speech ------------------------------ */
  class WebSpeechEngine {
    constructor() {
      this.synth = window.speechSynthesis;
      this.voice = null;
      this.warning = null;
      this._ready = false;
    }

    async init() {
      const voices = await this._loadVoices();
      // Prefer a real he-IL voice; otherwise warn loudly (the silent failure
      // mode is an English voice mangling Hebrew).
      this.voice =
        voices.find((v) => /^he([-_]|$)/i.test(v.lang)) ||
        voices.find((v) => /hebrew/i.test(v.name)) ||
        null;
      if (!this.voice) {
        this.warning =
          "No Hebrew (he-IL) voice is installed in this browser/OS. Speech " +
          "will be wrong. Install a Hebrew voice or switch to the premium engine.";
      }
      this._ready = true;
    }

    _loadVoices() {
      return new Promise((resolve) => {
        const existing = this.synth.getVoices();
        if (existing.length) return resolve(existing);
        // getVoices() is async — it populates on 'voiceschanged'.
        const onChange = () => {
          this.synth.removeEventListener("voiceschanged", onChange);
          resolve(this.synth.getVoices());
        };
        this.synth.addEventListener("voiceschanged", onChange);
        // Safety timeout so we never hang if the event never fires.
        setTimeout(() => resolve(this.synth.getVoices()), 1500);
      });
    }

    speak(text, opts = {}) {
      return new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "he-IL";
        u.rate = opts.rate ?? 1.0;
        u.pitch = opts.pitch ?? 1.0;
        if (this.voice) u.voice = this.voice;
        // Resolve on end OR error so the queue can never deadlock.
        u.onend = () => resolve();
        u.onerror = () => resolve();
        this.synth.speak(u);
      });
    }

    cancel() {
      try {
        this.synth.cancel();
      } catch (_) {}
    }

    status() {
      return { ready: this._ready, warning: this.warning };
    }
  }

  /* ------------------------------- Neural -------------------------------- */
  // Phase 2: same interface, but speak() will message the background worker,
  // which runs the Nakdan → neural-TTS → cache pipeline and returns audio that
  // an offscreen document plays. Stubbed so the strategy wiring is exercised now.
  class NeuralEngine {
    async init() {
      this.warning = "Premium engine not configured yet (Phase 2).";
    }
    async speak() {
      throw new Error("NeuralEngine not implemented yet");
    }
    cancel() {}
    status() {
      return { ready: false, warning: this.warning };
    }
  }

  function createEngine(name) {
    switch (name) {
      case "neural":
        return new NeuralEngine();
      case "webspeech":
      default:
        return new WebSpeechEngine();
    }
  }

  WAHTTS.engines = { WebSpeechEngine, NeuralEngine, createEngine };
})();
