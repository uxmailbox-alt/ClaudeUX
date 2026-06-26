/*
 * normalize.js — turn raw message text into clean, speakable text.
 *
 * This is one of the two modules where Hebrew TTS actually lives or dies (the
 * other is wa-adapter.js). Engines choke on emoji, zero-width marks, and very
 * long runs, and group chats need the sender announced. Keep all of that here
 * so engines stay dumb and swappable.
 *
 * Shared via the WAHTTS global namespace (content scripts share one isolated
 * world, so this object is visible to the later content scripts).
 */
(function () {
  const WAHTTS = (window.WAHTTS = window.WAHTTS || {});

  // Emoji + pictographs + variation selectors + zero-width joiners.
  const EMOJI_RE =
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;
  // Hebrew letters (incl. final forms) and niqqud range.
  const HEBREW_RE = /[֐-׿יִ-ﭏ]/;

  function hasHebrew(text) {
    return HEBREW_RE.test(text || "");
  }

  function stripEmoji(text) {
    return (text || "").replace(EMOJI_RE, " ");
  }

  /**
   * Is there anything worth speaking? Skips emoji-only, whitespace-only, and
   * media placeholders with no caption.
   */
  function isSpeakable(text) {
    const cleaned = stripEmoji(text || "").replace(/\s+/g, " ").trim();
    // Require at least one letter or digit in any script.
    return /[\p{L}\p{N}]/u.test(cleaned);
  }

  /**
   * Normalize a raw message into speakable text.
   * @param {string} raw
   * @param {{sender?: string, announceSender?: boolean}} [opts]
   * @returns {string} cleaned text ("" if nothing to say)
   */
  function normalizeForSpeech(raw, opts = {}) {
    let text = stripEmoji(raw || "");
    // Collapse whitespace and trim zero-width / bidi control marks.
    text = text.replace(/[​-‏‪-‮⁦-⁩]/g, "");
    text = text.replace(/\s+/g, " ").trim();
    if (!isSpeakable(text)) return "";

    // In groups, announce who is speaking so audio is followable.
    if (opts.announceSender && opts.sender) {
      text = `${opts.sender}: ${text}`;
    }
    return text;
  }

  /**
   * Split long text at sentence boundaries so the Web Speech API doesn't choke
   * and so neural prefetch stays granular. Falls back to hard-wrapping a single
   * very long run.
   * @param {string} text
   * @param {number} [maxLen=200]
   * @returns {string[]}
   */
  function chunkBySentence(text, maxLen = 200) {
    if (!text) return [];
    if (text.length <= maxLen) return [text];

    // Hebrew uses the same . ! ? plus we also break on newlines.
    const parts = text.match(/[^.!?\n]+[.!?\n]?/g) || [text];
    const chunks = [];
    let buf = "";
    for (const part of parts) {
      if ((buf + part).length > maxLen && buf) {
        chunks.push(buf.trim());
        buf = "";
      }
      if (part.length > maxLen) {
        // Single oversized sentence — hard-wrap on spaces.
        for (const word of part.split(" ")) {
          if ((buf + " " + word).length > maxLen && buf) {
            chunks.push(buf.trim());
            buf = "";
          }
          buf += (buf ? " " : "") + word;
        }
      } else {
        buf += part;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
    return chunks;
  }

  WAHTTS.normalize = {
    hasHebrew,
    stripEmoji,
    isSpeakable,
    normalizeForSpeech,
    chunkBySentence,
  };
})();
