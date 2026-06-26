# WhatsApp Web Hebrew TTS

Reads incoming WhatsApp Web messages aloud in Hebrew — with a quality-first
pipeline (niqqud diacritization → neural TTS) instead of the robotic default
browser voice.

> **Status:** Phase 0 (quality spike) + Phase 1 (free-engine extension skeleton)
> scaffolded. See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture and
> roadmap.

## Why this exists

Written Hebrew omits vowels, so every TTS engine guesses pronunciation and gets
homographs wrong. The browser's built-in `he-IL` voice is robotic and often not
even installed. This project treats **pronunciation quality as the product**:

1. **Diacritize** the text first (Dicta Nakdan adds niqqud).
2. **Synthesize** with a neural voice (Azure `he-IL`, ElevenLabs).
3. **Cache** aggressively so common phrases are free and instant.

A free Web Speech engine ships as the zero-setup default; the niqqud→neural
pipeline is the opt-in premium upgrade — same code path, swapped engine.

## Repo layout

```
spike/          Phase 0 — A/B/C listening harness (open in a browser)
extension/      Phase 1 — MV3 Chrome extension (free Web Speech engine working)
docs/PLAN.md    Full architectural review + phased roadmap
```

## Quick start

### Phase 0 — hear the quality difference
Open `spike/tts-compare.html` in Chrome. Paste Hebrew text and compare the
built-in voice vs. the neural pipeline (neural columns need API keys — see the
in-page instructions; the Web Speech column works with no setup).

### Phase 1 — load the extension
1. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select the `extension/` folder.
2. Open <https://web.whatsapp.com>, open a chat, click the floating **🔊** button
   to start reading new incoming messages. Click again to stop.

## Privacy

- **Free engine:** 100% local. No message text leaves your browser.
- **Premium engine:** message text is sent to the diacritization/TTS APIs to
  synthesize audio. No messages are stored beyond an ephemeral audio cache.

## License

MIT (see `LICENSE`).
