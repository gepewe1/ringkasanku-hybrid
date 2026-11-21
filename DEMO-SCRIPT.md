# Demo video script — RingkasanKu Hybrid (target 2:00, max 3:00, English)

**0:00–0:15 — Problem.** "Field teams run on long meeting notes and chat threads. Sending every note to the cloud is slow, costs per call, and leaks private details. But on-device models aren't everywhere. This is RingkasanKu Hybrid."
**0:15–0:35 — The ladder.** Show the capability bar at the top. "Three rungs: Gemini Nano on-device via the Chrome Prompt API, Firebase AI Logic's hybrid model, and a local engine that always works offline. The app tells you which rung answered — and why."
**0:35–1:05 — On-device.** Load the Indonesian sample → Summarize. "Short notes stay on the device: fast, free, private." Click Action items. "Owners and deadlines, extracted — Budi, Sari, Andi — in Indonesian and English."
**1:05–1:35 — Cloud escalation.** Paste a long note (500+ words). "Long documents escalate through Firebase AI Logic with PREFER_ON_DEVICE — cloud Gemini does the heavy lifting, on-device is the fallback. Sensitive-looking text never leaves the device; watch the router keep it local."
**1:35–1:55 — Offline proof.** Turn off network / open DevTools offline → run again. "No connection, no keys — the local extractive engine still answers. The demo never dead-ends."
**1:55–2:00 — Close.** "Hybrid inference, with the routing made visible. Built with Firebase AI Logic for #BuildHybridAI."
