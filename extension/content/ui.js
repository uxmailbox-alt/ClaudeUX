/*
 * ui.js — the floating control + status surface.
 *
 * Deliberately dumb: it renders state and forwards clicks. All behavior lives
 * in the controller. Styling is in content/styles.css.
 */
(function () {
  const WAHTTS = (window.WAHTTS = window.WAHTTS || {});

  class FloatingUI {
    constructor(onToggle) {
      this.onToggle = onToggle;
      this.root = null;
      this.btn = null;
      this.toast = null;
    }

    mount() {
      if (this.root) return;
      const root = document.createElement("div");
      root.className = "wahtts-root";
      root.innerHTML = `
        <button class="wahtts-btn" title="Read incoming Hebrew messages aloud">
          <span class="wahtts-icon">🔊</span>
          <span class="wahtts-label">Start</span>
        </button>
        <div class="wahtts-toast" role="status" aria-live="polite"></div>
      `;
      document.body.appendChild(root);
      this.root = root;
      this.btn = root.querySelector(".wahtts-btn");
      this.toast = root.querySelector(".wahtts-toast");
      this.btn.addEventListener("click", () => this.onToggle?.());
    }

    setActive(active) {
      if (!this.btn) return;
      this.btn.classList.toggle("wahtts-active", active);
      this.btn.querySelector(".wahtts-label").textContent = active
        ? "Stop"
        : "Start";
    }

    setSpeaking(speaking) {
      this.btn?.classList.toggle("wahtts-speaking", speaking);
    }

    notify(msg, kind = "info") {
      if (!this.toast) return;
      this.toast.textContent = msg;
      this.toast.dataset.kind = kind;
      this.toast.classList.add("wahtts-show");
      clearTimeout(this._t);
      this._t = setTimeout(
        () => this.toast.classList.remove("wahtts-show"),
        kind === "warn" ? 6000 : 2500
      );
    }
  }

  WAHTTS.FloatingUI = FloatingUI;
})();
