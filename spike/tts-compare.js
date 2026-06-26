/*
 * tts-compare.js — Phase 0 quality spike logic.
 *
 * Three playback paths over the same input so you can A/B/C the Hebrew:
 *   A) Web Speech he-IL              (free, local, no diacritics)
 *   B) Azure neural on raw text      (engine guesses vowels)
 *   C) Dicta Nakdan → Azure neural   (diacritized first — the hypothesis)
 *
 * Keys live only in this tab. Network calls may be CORS-blocked in a normal
 * browser; that's fine — the point is to hear the difference, and the real
 * product routes these through a backend proxy.
 */
const $ = (id) => document.getElementById(id);
const status = (msg) => ($("status").textContent = msg);

/* ----------------------------- sample buttons ---------------------------- */
document.querySelectorAll(".samples button").forEach((b) =>
  b.addEventListener("click", () => ($("text").value = b.dataset.s))
);

/* --------------------------------- A: free ------------------------------- */
let heVoice = null;
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  heVoice = voices.find((v) => /^he([-_]|$)/i.test(v.lang)) || null;
}
speechSynthesis.addEventListener("voiceschanged", loadVoices);
loadVoices();

$("playA").addEventListener("click", () => {
  const u = new SpeechSynthesisUtterance($("text").value);
  u.lang = "he-IL";
  if (heVoice) u.voice = heVoice;
  else status("⚠ No he-IL voice installed — A will sound wrong (this is the point).");
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
});

/* ----------------------------- Azure neural ------------------------------ */
async function azureSpeak(text) {
  const key = $("azKey").value.trim();
  const region = $("azRegion").value.trim();
  const voice = $("azVoice").value.trim();
  if (!key) throw new Error("Add your Azure Speech key in Settings.");

  const ssml =
    `<speak version='1.0' xml:lang='he-IL'>` +
    `<voice name='${voice}'>${escapeXml(text)}</voice></speak>`;

  const res = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    }
  );
  if (!res.ok) throw new Error(`Azure ${res.status}: ${await res.text()}`);
  const blob = await res.blob();
  new Audio(URL.createObjectURL(blob)).play();
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c])
  );
}

$("playB").addEventListener("click", async () => {
  try {
    status("Synthesizing B (raw)…");
    await azureSpeak($("text").value);
    status("Played B.");
  } catch (e) {
    status("B failed: " + e.message);
  }
});

/* --------------------------- Dicta Nakdan (niqqud) ----------------------- */
async function diacritize(text) {
  // Public Dicta Nakdan endpoint. Returns per-word options; we take the top.
  const res = await fetch(
    "https://nakdan-2-0.loadbalancer.dicta.org.il/api",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: "nakdan", data: text, genre: "modern" }),
    }
  );
  if (!res.ok) throw new Error(`Nakdan ${res.status}`);
  const data = await res.json();
  // Response shape: array of tokens; vocalized form under options[0].w or sep.
  return data
    .map((tok) => {
      if (!tok.options || !tok.options.length) return tok.word || tok.sep || "";
      const opt = tok.options[0];
      return (opt.w || opt).toString();
    })
    .join("");
}

$("playC").addEventListener("click", async () => {
  try {
    status("Adding niqqud via Dicta Nakdan…");
    const niqqud = await diacritize($("text").value);
    $("diac").textContent = niqqud;
    status("Synthesizing C (niqqud → neural)…");
    await azureSpeak(niqqud);
    status("Played C. Compare against A and B.");
  } catch (e) {
    status("C failed: " + e.message + "  (likely CORS — see notes.)");
  }
});

/* enable B/C once a key is present */
function reflectKey() {
  const has = !!$("azKey").value.trim();
  $("playB").disabled = !has;
  $("playC").disabled = !has;
}
$("azKey").addEventListener("input", reflectKey);
reflectKey();
