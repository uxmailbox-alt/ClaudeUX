# WhatsApp Web Hebrew TTS — Architectural Review & 100X Build Plan

## Context

You drafted a plan for a userscript that reads incoming WhatsApp Web messages
aloud using the browser's Web Speech API, with Hebrew support. You asked, as a
SaaS chief architect, how to make it **100X better** and for an actionable build
plan.

After reviewing the plan and researching the 2026 Hebrew-TTS and WhatsApp-
automation landscape, my core finding is: **the original plan optimizes the
wrong layer.** It spends its detail on UI/queue mechanics (the easy 20%) and
treats the two things that actually decide success — *Hebrew pronunciation
quality* and *DOM robustness* — as footnotes. The single highest-leverage change
is replacing "Web Speech API" with a **niqqud → neural-TTS pipeline**. That one
decision is the difference between a robotic toy and something people pay for.

This document is (1) a critique of the original plan and (2) a phased, buildable
architecture. It is written to start as a perfected personal tool and grow into
a shippable product without re-architecture.

### Recommended defaults (please confirm/redirect at approval)
- **Ambition:** Build the *personal tool, done right* first (Phase 1–2), but
  structure it as a Chrome extension + thin backend so it can become an MVP for
  real users with no rewrite. *(Fork: pure-personal vs. publishable MVP vs. full SaaS.)*
- **TTS quality:** **Hybrid** — free Web Speech as the zero-setup default, with
  an opt-in **premium pipeline** (Dicta Nakdan niqqud → Azure/ElevenLabs neural).
  The premium pipeline is the moat. *(Fork: free-only vs. premium vs. hybrid.)*
- **Primary use case:** Hands-free multitasking (matches your doc), with
  **accessibility** (blind/low-vision Hebrew speakers) as the expansion market —
  it's genuinely underserved and is the strongest "real product" angle.

---

## Part 1 — What's wrong with the original plan (the 100X gaps)

| # | Original plan | Problem | 100X fix |
|---|---|---|---|
| 1 | **Web Speech API for Hebrew** | `he-IL` voices are robotic and **often not installed** on macOS/Chrome — it then silently mispronounces Hebrew with an English voice. Quality ceiling is low. | Treat TTS as a swappable engine. Add a **neural** engine (Azure `he-IL` Avri/Hila, or ElevenLabs multilingual). |
| 2 | **No niqqud handling** | Written Hebrew omits vowels, so *every* engine guesses homographs wrong (שלום/שלם, ספר as sefer/sapar/safar). This is *the* Hebrew TTS problem and the plan ignores it. | Insert a **diacritization pass** via **Dicta Nakdan** (free, best-in-class) before TTS. Biggest quality lever; almost nobody does it. |
| 3 | **Brittle CSS selectors** (`.message-li`, `#main > div > div...`) | WhatsApp ships obfuscated, rotating class names; nth-child paths break weekly. | Anchor on **stable attributes**: `[data-pre-plain-text]` (sender+timestamp), `.message-in`/`.message-out`, `[data-id]`, `copyable-text`. Isolate all selectors in one hot-swappable **adapter module**. |
| 4 | **Skip own messages via "match user's phone number"** | Fragile and you may not know your own number string. | Use the DOM's own signal: incoming = `.message-in`, outgoing = `.message-out`. No phone parsing. |
| 5 | **`getVoices()` called synchronously** | `speechSynthesis.getVoices()` is **async** (populates on `voiceschanged`); the plan's `.find()` returns empty on first load. | Await `voiceschanged`; cache voices; graceful fallback + user-visible warning. |
| 6 | **"Start from current point" undefined** | No mechanism given. | Snapshot existing `[data-id]` values at activation; only speak rows whose `data-id` is new. Dedupe by id. |
| 7 | **Queue = naive speak-then-next** | Neural TTS has network latency; sequential fetch stalls audio. | **Pipeline**: prefetch/synthesize message N+1 while N plays. Cache audio by `hash(text+voice)`. |
| 8 | **API keys in a userscript** | Anyone can read them; can't ship. | **Thin backend proxy** holds keys + cache + rate limits; or BYO-key stored in extension storage for personal use. |
| 9 | **"SaaS" conflated with userscript** | A userscript has no backend, tenancy, or monetization. And a hosted service **cannot legally log into users' consumer WhatsApp** (ToS/ban). | Be honest about the fork: client-side extension (low ban risk, read-only) **or** pivot to the official **WhatsApp Business API** for a true multi-tenant SaaS. |
| 10 | **Edge cases as a bullet list** | Emoji-only, long messages, RTL+numbers, group sender names, media captions are where it actually breaks. | First-class **text-normalization module** (strip/convert emoji, sentence-chunk, read sender name in groups, handle mixed Heb/En/digits). |

**ToS/ban reality (researched):** bans target *sending* automation and protocol
reverse-engineering (whatsapp-web.js, Baileys). A **read-only** tool that only
reads the rendered DOM and speaks it — never sending, never touching the
protocol — is a much lower-risk category (still a gray area). **Architectural
guardrail: never add send/automation features to the client.** A real SaaS must
go through the official Business API instead.

---

## Part 2 — Target architecture

```
┌─────────────────────────── Chrome Extension (MV3) ───────────────────────────┐
│ content script (web.whatsapp.com)                                            │
│   ├── wa-adapter.js     ← ALL selectors/DOM knowledge (hot-swappable)         │
│   ├── observer.js       ← MutationObserver → new-message events (debounced)   │
│   ├── normalize.js      ← emoji/RTL/number/sender-name → clean speakable text │
│   ├── ui.js             ← floating toggle, status, settings shortcut          │
│   └── controller.js     ← state machine (idle/listening), start-from-now snap │
│                                                                               │
│ service worker (background)                                                   │
│   ├── tts-engine.js     ← strategy: WebSpeechEngine | NeuralEngine            │
│   ├── pipeline.js       ← prefetch/synth queue + audio cache (hash→blob)      │
│   └── settings.js       ← engine, voice, rate, translate, key (chrome.storage)│
│                                                                               │
│ offscreen document      ← audio playback for neural mp3 (MV3 requirement)     │
│ options page            ← engine/voice/rate/lang/key/translation UI           │
└───────────────────────────────────────────────────────────────────────────────┘
                                   │ (premium only)
                                   ▼
┌──────────────── Thin Backend Proxy (optional, premium pipeline) ──────────────┐
│  POST /speak { text, voice, lang }                                            │
│    1. cache lookup  hash(text+voice) → return mp3 if hit                       │
│    2. Dicta Nakdan  → add niqqud (cache niqqud too)                            │
│    3. Neural TTS    → Azure he-IL / ElevenLabs → mp3                           │
│    4. store + return mp3                                                       │
│  + rate limiting, usage metering, key hiding. (Cloudflare Worker or small Node)│
└───────────────────────────────────────────────────────────────────────────────┘
```

**Why this shape:** the `tts-engine` strategy interface means Web Speech and the
neural pipeline are interchangeable — the hybrid default and the premium upgrade
are the *same code path* with a different engine injected. The `wa-adapter`
isolates every fragile selector so DOM breakage is a one-file fix.

### Engine recommendation
- **Default / free:** Web Speech (`he-IL`) — zero setup, fully private, offline.
  Set honest expectations in the UI ("basic voice").
- **Premium:** **Dicta Nakdan → Azure Neural `he-IL` (Avri/Hila)** as the default
  premium combo (best price/quality/latency); ElevenLabs multilingual as a
  higher-cost "most natural" option. Cache audio aggressively.
- **Niqqud caching is what makes premium cheap:** common phrases ("בסדר",
  "מה קורה", "אני בדרך") get cached once and replayed for free.

### Unit economics (for the SaaS question)
- Azure neural ≈ **$16 / 1M chars**; avg WA message ≈ 50 chars ⇒ ≈ **$0.0008/msg**
  before caching. With phrase caching, effective cost drops sharply. A generous
  free tier + a few-dollars/mo premium tier is viable. ElevenLabs is ~10–20× pricier — reserve for a top tier.

---

## Part 3 — Phased, actionable build plan

> Repo `uxmailbox-alt/ClaudeUX` is currently empty (one empty `README.md`). All
> files below are **new**. Work happens on branch `claude/exciting-ritchie-gnr8yu`.

### Phase 0 — Quality spike (½–1 day) — *do this before anything else*
**Goal: prove the Hebrew quality thesis before building UI.**
- `spike/tts-compare.html` — paste Hebrew text, hear it 3 ways: (a) Web Speech
  `he-IL`, (b) Azure neural raw, (c) **Nakdan → Azure neural**.
- Test set: 10 sentences loaded with homographs and mixed Heb/En/numbers.
- **Decision gate:** confirm (c) is clearly best and that Nakdan latency is
  tolerable (+cacheable). If the quality delta isn't obvious, revisit engines
  before investing in the extension.

### Phase 1 — Core extension, free engine, done right (2–3 days)
Ship the original scope but on the robust architecture.
- `manifest.json` (MV3), `content/` (`wa-adapter.js`, `observer.js`,
  `normalize.js`, `ui.js`, `controller.js`), `background/tts-engine.js`
  (WebSpeechEngine), `background/settings.js`, `options.html/js`, `styles.css`,
  `icons/`.
- Implement: floating toggle, **start-from-now snapshot** (by `data-id`),
  **skip-own** (`.message-out`), async `voiceschanged` handling, sequential
  queue, sentence-chunking, empty/emoji skip, group sender-name prefix,
  re-init observer on chat switch / SPA route change.
- **Acceptance:** every box in your original Acceptance Criteria, plus: Hebrew
  voice *absence* is detected and surfaced (not silently wrong); rapid messages
  never overlap; switching chats re-arms cleanly.

### Phase 2 — Premium pipeline (2–3 days)
- `tts-engine.js`: add `NeuralEngine` behind the same interface.
- Backend proxy `server/` (Cloudflare Worker or small Node/Express):
  `POST /speak` → cache → Nakdan → Azure → mp3; rate-limit; meter usage.
- Extension: offscreen-document audio playback; `pipeline.js` prefetch + audio
  cache; engine toggle + (BYO-key **or** hosted sign-in) in options.
- **Acceptance:** premium reads homograph sentences correctly where free fails;
  cached phrases replay instantly with no API call.

### Phase 3 — Product polish & differentiation (2–4 days)
- Accessibility mode (sender + message + read-state cues; keyboard control).
- Optional **Hebrew→English translation** (LibreTranslate self-host or Google),
  cached by text hash, as an opt-in toggle — done as a normalize-stage plugin.
- Adjustable rate/voice picker, pause/resume, per-chat enable.
- Package for Chrome Web Store (privacy policy: free engine = 100% local; premium
  = ephemeral text to TTS, no message storage beyond audio cache).

### Phase 4 — Only if going full SaaS (separate track)
- Accounts, usage metering, billing (Stripe), landing page, free/premium tiers.
- **Architecture fork to decide here:** stay a client extension (BYO-key or
  hosted TTS proxy) **or** pivot the multi-tenant story to the official
  **WhatsApp Business API** (the only sanctioned automation path). These are
  different products; pick deliberately.

---

## Key external dependencies (researched, current to 2026)
- **Dicta Nakdan** — free Hebrew diacritizer API (`dicta.org.il`). The moat.
- **Azure AI Speech** — `he-IL` neural voices (Avri, Hila); best premium price/quality.
- **ElevenLabs** multilingual — top naturalness, higher cost; reserve for a premium tier.
- **Web Speech API** — free/offline default; quality and availability unreliable.

## Reuse note
This is a greenfield repo — no existing utilities to reuse. The reuse discipline
that matters is *internal*: the `tts-engine` strategy interface and the
`wa-adapter` selector module are the two seams that keep engine swaps and DOM
breakage from rippling through the codebase. Build those interfaces first.

---

## Verification
1. **Phase 0 spike** is its own verification: A/B/C listening test on the
   homograph sentence set; confirm Nakdan→neural wins.
2. **Unit:** `normalize.js` (emoji-only → skip; mixed Heb/En/digits; long-message
   chunking) and `wa-adapter` parsing of `data-pre-plain-text` against captured
   fixtures.
3. **Manual E2E on web.whatsapp.com:** Start → only *new* incoming messages read;
   own messages never read; rapid burst doesn't overlap; switch chats and confirm
   re-arm; kill the Hebrew voice and confirm the warning fires.
4. **Premium:** send a known homograph; confirm correct pronunciation and that a
   repeat phrase is served from cache (no API hit in network log).
5. **Resilience drill:** change a class name in a fixture and confirm only
   `wa-adapter.js` needs editing.

## Open questions (carried from the interrupted question prompt)
1. **Ambition** — personal tool / publishable MVP / full SaaS? (Default: build
   personal-done-right, structured to become an MVP.)
2. **TTS** — free-only / premium / hybrid? (Default: hybrid.)
3. **Use case** — multitasking / accessibility / language-learning? (Default:
   multitasking primary, accessibility as expansion.)
