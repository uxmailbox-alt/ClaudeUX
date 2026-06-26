/*
 * Minimal zero-dependency tests for normalize.js.
 * Run: node extension/test/normalize.test.js
 */
global.window = {};
require("../content/normalize.js");
const N = window.WAHTTS.normalize;

let pass = 0,
  fail = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(
    (ok ? "PASS" : "FAIL") +
      ": " +
      name +
      (ok ? "" : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`)
  );
  ok ? pass++ : fail++;
}

eq("hasHebrew true", N.hasHebrew("שלום"), true);
eq("hasHebrew false", N.hasHebrew("hello 123"), false);
eq("emoji-only not speakable", N.isSpeakable("😀😀"), false);
eq("text speakable", N.isSpeakable("היי 😀"), true);
eq("strip emoji keeps text", N.normalizeForSpeech("היי 😀😀"), "היי");
eq(
  "sender announce",
  N.normalizeForSpeech("מה קורה", { sender: "דנה", announceSender: true }),
  "דנה: מה קורה"
);
eq(
  "no announce when off",
  N.normalizeForSpeech("מה קורה", { sender: "דנה", announceSender: false }),
  "מה קורה"
);
eq("emoji-only -> empty", N.normalizeForSpeech("🎉🎉"), "");

const long = "משפט אחד. משפט שני! משפט שלישי? ".repeat(10);
const chunks = N.chunkBySentence(long, 60);
eq("chunks under max", chunks.every((c) => c.length <= 60), true);
eq("chunks rejoin nonempty", chunks.length > 1, true);
eq("short text single chunk", N.chunkBySentence("שלום", 200), ["שלום"]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
