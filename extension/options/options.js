/* options.js — load/save settings to chrome.storage.sync */
const DEFAULTS = {
  engine: "webspeech",
  rate: 1.0,
  announceSenderInGroups: true,
  maxChunkLen: 200,
  backendUrl: "",
  neuralVoice: "he-IL-AvriNeural",
};

const $ = (id) => document.getElementById(id);

function reflectPremium() {
  $("premiumBox").classList.toggle("enabled", $("engine").value === "neural");
}

async function load() {
  const { settings } = await chrome.storage.sync.get(["settings"]);
  const s = { ...DEFAULTS, ...(settings || {}) };
  $("engine").value = s.engine;
  $("rate").value = s.rate;
  $("rateVal").textContent = Number(s.rate).toFixed(1);
  $("announce").checked = !!s.announceSenderInGroups;
  $("backendUrl").value = s.backendUrl || "";
  $("neuralVoice").value = s.neuralVoice || "";
  reflectPremium();
}

async function save() {
  const settings = {
    ...DEFAULTS,
    engine: $("engine").value,
    rate: parseFloat($("rate").value),
    announceSenderInGroups: $("announce").checked,
    backendUrl: $("backendUrl").value.trim(),
    neuralVoice: $("neuralVoice").value.trim() || DEFAULTS.neuralVoice,
  };
  await chrome.storage.sync.set({ settings });
  const saved = $("saved");
  saved.hidden = false;
  setTimeout(() => (saved.hidden = true), 1500);
}

$("rate").addEventListener("input", (e) => {
  $("rateVal").textContent = Number(e.target.value).toFixed(1);
});
$("engine").addEventListener("change", reflectPremium);
$("save").addEventListener("click", save);
document.addEventListener("DOMContentLoaded", load);
