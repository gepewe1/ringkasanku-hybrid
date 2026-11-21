/* RingkasanKu Hybrid — browser glue.
 * Ladder:
 *  Rung 1: Chrome Prompt API (window.LanguageModel) = Gemini Nano on-device.
 *  Rung 2: Firebase AI Logic hybrid model (firebase-ai.js) — only when
 *          Yuga's firebase-config.js is filled in.
 *  Rung 3: HybridCore local extractive engine (core.js) — always works.
 */
import { firebaseConfigured, runFirebaseHybrid } from './firebase-ai.js';

const $ = (s) => document.querySelector(s);
const notesEl = $('#notes'), outputEl = $('#output'), routeEl = $('#route'),
      capsEl = $('#caps'), metaEl = $('#meta'), counterEl = $('#counter');

const SAMPLES = {
  id: `Rapat koordinasi tim operasional, Selasa 16 November. Penjualan bulan ini naik karena kampanye akhir tahun berjalan lebih awal dari rencana. Namun gudang melaporkan stok produk terlaris hampir habis dan pengiriman dari pemasok terlambat dua minggu. Budi perlu menghubungi pemasok utama besok pagi untuk memastikan jadwal pengiriman baru. Sari akan menyiapkan laporan stok lengkap sebelum hari Jumat. Tim sepakat harga tidak naik selama stok masih terbatas agar pelanggan tidak kecewa. Deadline kampanye berikutnya adalah tanggal 30 November dan semua materi promosi harus selesai sebelumnya. Andi ditugaskan menindaklanjuti keluhan pelanggan soal ongkir. Rapat berikutnya dijadwalkan Senin depan untuk mengevaluasi progres. Keuangan mengingatkan bahwa anggaran iklan bulan ini sudah terpakai 80 persen. Oleh karena itu setiap pengeluaran baru harus disetujui manajer terlebih dahulu.`,
  en: `Weekly product sync, Monday. The beta launch slipped by one week because the payment integration failed its security review twice. Priya will contact the payment provider today and request a written remediation timeline. The design team presented the new onboarding flow and early testers completed signup 30 percent faster. Marcus needs to prepare the updated pricing page before Thursday. We agreed to freeze new features until the launch is stable. Support reported that password reset emails are landing in spam for many users, and Tom is assigned to investigate the mail configuration. The next milestone review is scheduled for Friday afternoon. Budget for contractor help must be approved by finance this week. Everyone should update their launch checklist by Wednesday.`
};

let chromeNano = false;

async function detectChromeNano() {
  try {
    const LM = window.LanguageModel || (window.ai && window.ai.languageModel);
    if (!LM) return false;
    if (typeof LM.availability === 'function') {
      const a = await LM.availability();
      return a === 'available' || a === 'downloadable' || a === 'downloading';
    }
    return true;
  } catch { return false; }
}

async function runChromeNano(prompt) {
  const LM = window.LanguageModel || (window.ai && window.ai.languageModel);
  const session = await LM.create({ initialPrompts: [{ role: 'system', content: 'You distill meeting notes. Answer concisely in the same language as the notes.' }] });
  try { return await session.prompt(prompt); } finally { if (session.destroy) session.destroy(); }
}

function buildPrompt(task, text) {
  if (task === 'actions') return 'Extract every action item (owner + task + deadline if present) as a bullet list from these notes:\n\n' + text;
  if (task === 'points') return 'List the 5 most important key points from these notes as a bullet list:\n\n' + text;
  return 'Summarize these notes in at most 3 sentences, keeping names, numbers and dates:\n\n' + text;
}

async function refreshCaps() {
  chromeNano = await detectChromeNano();
  const fb = firebaseConfigured();
  capsEl.innerHTML =
    `Rung 1 · Chrome Gemini Nano: <b>${chromeNano ? 'available' : 'not available in this browser'}</b> &nbsp;|&nbsp; ` +
    `Rung 2 · Firebase AI Logic: <b>${fb ? 'configured' : 'not configured yet (add firebase-config.js)'}</b> &nbsp;|&nbsp; ` +
    `Rung 3 · Local engine: <b>always available, offline</b>`;
  return { chromeNano, firebase: fb };
}

let caps = { chromeNano: false, firebase: false };
refreshCaps().then(c => { caps = c; });

function updateCounter() {
  const w = HybridCore.tokenize(notesEl.value).length;
  counterEl.textContent = w + ' words';
}
notesEl.addEventListener('input', updateCounter);

document.querySelectorAll('[data-sample]').forEach(btn => {
  btn.addEventListener('click', () => { notesEl.value = SAMPLES[btn.dataset.sample]; updateCounter(); });
});
$('#copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(outputEl.textContent); metaEl.textContent = 'Copied.'; } catch {}
});

document.querySelectorAll('.task').forEach(btn => {
  btn.addEventListener('click', async () => {
    const task = btn.dataset.task;
    const text = notesEl.value.trim();
    if (!text) { outputEl.textContent = 'Paste some notes first (or load a sample).'; return; }
    caps = await refreshCaps();
    const route = HybridCore.decideRoute(text, caps);
    const prompt = buildPrompt(task, text);
    const t0 = performance.now();
    let answer = null, used = route.rung, note = '';

    try {
      if (route.rung === 'chrome-nano') answer = await runChromeNano(prompt);
      else if (route.rung === 'firebase-hybrid') answer = await runFirebaseHybrid(prompt);
    } catch (e) { note = ' (' + (e && e.message ? e.message : 'AI rung failed') + ' — fell back)'; }

    if (!answer && route.fallback === 'chrome-nano' && chromeNano) {
      try { answer = await runChromeNano(prompt); used = 'chrome-nano'; } catch {}
    }
    if (!answer) { answer = HybridCore.runLocal(task, text); used = 'local-extractive'; }

    const ms = Math.round(performance.now() - t0);
    const label = { 'chrome-nano': '🟢 On-device · Gemini Nano (Chrome Prompt API)', 'firebase-hybrid': '☁️ Firebase AI Logic hybrid · cloud Gemini', 'local-extractive': '🔒 On-device · local extractive engine (offline)' }[used];
    routeEl.innerHTML = `<b>${label}</b><br>Planned route: ${route.rung} — ${route.reason}${note}`;
    outputEl.textContent = answer;
    metaEl.textContent = `${ms} ms · ${HybridCore.tokenize(text).length} words in · ${HybridCore.tokenize(answer).length} words out`;
  });
});
