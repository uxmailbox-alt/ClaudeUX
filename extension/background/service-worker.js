/*
 * service-worker.js — MV3 background.
 *
 * Phase 1: just seeds default settings. Phase 2: this worker hosts the premium
 * pipeline — it receives { type: "speak", text } from the content script, runs
 * Dicta Nakdan → neural TTS (via the backend proxy), caches the audio by
 * hash(text+voice), and hands the mp3 to an offscreen document to play. Web
 * Speech stays in the content script because speechSynthesis isn't available
 * here.
 */

const DEFAULT_SETTINGS = {
  engine: "webspeech",
  rate: 1.0,
  announceSenderInGroups: true,
  maxChunkLen: 200,
  // Phase 2 fields (unused yet):
  backendUrl: "",
  apiKey: "",
  neuralVoice: "he-IL-AvriNeural",
};

chrome.runtime.onInstalled.addListener(async () => {
  const { settings } = await chrome.storage.sync.get(["settings"]);
  if (!settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }
});

// Placeholder for the Phase 2 premium pipeline message handler.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "speak:neural") {
    // TODO(Phase 2): proxy → Nakdan → neural TTS → offscreen playback.
    sendResponse({ ok: false, error: "neural pipeline not implemented yet" });
    return true;
  }
  return false;
});
