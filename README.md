# RingkasanKu Hybrid — #BuildHybridAI 2026 entry (Web/Chrome)

**One-liner:** Meeting & field notes, distilled — *on-device first* (private, free, offline-capable), *cloud when it earns it*, via Firebase AI Logic hybrid inference.

## The problem
Field teams, warung owners, and small ops teams in Indonesia run on long chat threads and meeting notes. Sending every note to a cloud LLM is slow on patchy connections, costs money per call, and leaks private business details. But purely on-device models aren't on every device. Hybrid inference is the honest answer — if the routing is *visible and principled*, not magic.

## What it does
Paste notes (Indonesian or English) and pick a task: **Summarize**, **Key points**, or **Action items**. The app shows *which rung answered and why*:

| Rung | Engine | When |
|---|---|---|
| 1 | Chrome Prompt API → **Gemini Nano on-device** | Short text, or sensitive-looking text (password/gaji/rahasia/confidential cues) — privacy and zero cost win |
| 2 | **Firebase AI Logic hybrid model** (`InferenceMode.PREFER_ON_DEVICE`, `inCloudParams: gemini-3.8-flash`) | Long text escalates to cloud Gemini; the SDK itself falls back to on-device when needed. App Check is initialized first, as Firebase AI Logic requires — this project **enforces** App Check, via the reCAPTCHA Enterprise (Fraud Defense) provider |
| 3 | Local extractive engine (`app/core.js`) | No Prompt API and no Firebase config: a real frequency/position-scoring summarizer + bilingual (EN/ID) action-cue extractor that runs fully offline, so the demo *never* dead-ends |

## Firebase AI Logic at runtime (hackathon requirement)
`app/firebase-ai.js` imports the Firebase JS SDK and **actually calls** `getAI(..., { backend: new GoogleAIBackend() })` and `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE, inCloudParams: { model: 'gemini-3.8-flash' } })`, then `model.generateContent(prompt)`. `app/firebase-config.js` contains the author's own dedicated hackathon project (`ringkasanku-hybrid`, free Spark plan, no billing): AI Logic is enabled on it and App Check is registered and enforced. A Firebase web config is public by design — access is governed by App Check, not by hiding the config.

## Run it locally (no build, no keys)
```bash
cd app && python3 -m http.server 8931
# open http://localhost:8931  (Chrome desktop recommended)
node test.mjs   # from the repo root: 15 core-engine tests
```
Load a sample → Summarize / Action items. In a plain browser you will see Rung 3 answer with the routing explanation; on Chrome with Gemini Nano available, Rung 1 answers short notes; with a Firebase config filled in, long notes escalate to Rung 2.

## Honest status (21 Nov 2026)
- ✅ Core engine: 15/15 Node tests pass; full UI flow verified in headless Chrome (sample → summary + action items rendered, routing label correct).
- ✅ Rung 2 wiring is live: the author's Firebase project is configured in `app/firebase-config.js`, AI Logic (Gemini Developer API) is enabled, and App Check is registered (Fraud Defense / reCAPTCHA Enterprise). Verified from the server side: the project's backend accepts the key and **rejects token-less requests with 401**, i.e. App Check enforcement is really on.
- ⚠️ Rung 1 (Gemini Nano) could not be exercised in the build VM's headless Chrome (model not available under SwiftShader) — code follows the documented Prompt API surface (`window.LanguageModel`) and degrades gracefully.
- Hosted copy: GitHub Pages (branch `gh-pages`) at https://gepewe1.github.io/ringkasanku-hybrid/ — that domain is allow-listed in the project's reCAPTCHA key.
- Submission deadline: **Tue 1 Dec 2026, 05:00 WIB**.

## License
Apache-2.0 (see LICENSE) — the license preferred by the hackathon sponsor.
