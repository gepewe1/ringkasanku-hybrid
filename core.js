/* RingkasanKu Hybrid — core logic (pure JS, no dependencies).
 * Runs identically in the browser and in Node (for tests).
 * This is the always-available ON-DEVICE engine: a real extractive
 * summarizer + action-item extractor that runs 100% locally, offline,
 * with zero API keys. It is the last rung of the hybrid ladder:
 *   1. Chrome Prompt API (Gemini Nano on-device) when available
 *   2. Firebase AI Logic hybrid model (PREFER_ON_DEVICE -> cloud Gemini)
 *   3. This local extractive engine (works everywhere, even offline)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HybridCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STOPWORDS = new Set(('the a an and or but if then else of at by for with about into through after over between out against during without before under around is am are was were be been being have has had will would shall should can could may might must do does did i you he she it we they this that these those as in on to from ' +
    'yang dan di ke dari untuk dengan pada adalah ini itu tidak juga akan sudah saya kami kita mereka atau dalam oleh sebagai lebih dapat bisa harus ada telah saat menjadi seperti hanya baik sangat lagi maka namun karena ketika sehingga antara melalui tanpa tentang sejak selama sebelum sesudah nya lah kah pun per para seorang sebuah suatu ialah merupakan yakni yaitu agar supaya bila jika kalau maka').split(' '));

  var ACTION_CUES = ['todo', 'to-do', 'action:', 'perlu', 'harus', 'wajib', 'tolong', 'deadline', 'tenggat', 'akan mengirim', 'akan membuat', 'akan menghubungi', 'mengirim', 'menyiapkan', 'menyelesaikan', 'follow up', 'follow-up', 'tindak lanjut', 'menindaklanjuti', 'will send', 'will prepare', 'will contact', 'will finish', 'will review', 'must', 'need to', 'needs to', 'should', 'assigned', 'ditugaskan', 'bertanggung jawab', 'pic:', 'due '];

  function splitSentences(text) {
    var cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    var parts = cleaned.match(/[^.!?\n]+[.!?]+["')\]]*|\S[^.!?\n]*$/g) || [];
    return parts.map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; });
  }

  function tokenize(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9\u00C0-\u024F\u1E00-\u1EFF\s-]/gi, ' ').split(/\s+/).filter(Boolean);
  }

  function wordFrequencies(sentences) {
    var freq = {};
    sentences.forEach(function (s) {
      tokenize(s).forEach(function (w) {
        if (!STOPWORDS.has(w) && w.length > 2) freq[w] = (freq[w] || 0) + 1;
      });
    });
    var max = 0;
    Object.keys(freq).forEach(function (k) { if (freq[k] > max) max = freq[k]; });
    if (max > 0) Object.keys(freq).forEach(function (k) { freq[k] = freq[k] / max; });
    return freq;
  }

  function scoreSentence(sentence, freq, index, total) {
    var words = tokenize(sentence);
    if (!words.length) return 0;
    var sum = 0, hits = 0;
    words.forEach(function (w) { if (freq[w]) { sum += freq[w]; hits++; } });
    var density = hits ? sum / words.length : 0;
    var positionBonus = index === 0 ? 0.25 : (index < 3 ? 0.1 : 0);
    var lengthPenalty = words.length > 40 ? 0.15 : (words.length < 4 ? 0.2 : 0);
    var digitBonus = /\d/.test(sentence) ? 0.05 : 0;
    return density + positionBonus + digitBonus - lengthPenalty + (total > 1 ? (1 - index / total) * 0.03 : 0);
  }

  function summarizeExtractive(text, maxSentences) {
    maxSentences = maxSentences || 3;
    var sentences = splitSentences(text);
    if (!sentences.length) return '';
    if (sentences.length <= maxSentences) return sentences.join(' ');
    var freq = wordFrequencies(sentences);
    var scored = sentences.map(function (s, i) {
      return { s: s, i: i, score: scoreSentence(s, freq, i, sentences.length) };
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var picked = scored.slice(0, maxSentences).sort(function (a, b) { return a.i - b.i; });
    return picked.map(function (p) { return p.s; }).join(' ');
  }

  function extractActions(text) {
    var sentences = splitSentences(text);
    var actions = [];
    sentences.forEach(function (s) {
      var low = s.toLowerCase();
      var isAction = ACTION_CUES.some(function (cue) { return low.indexOf(cue) !== -1; });
      if (isAction) actions.push(s);
    });
    // De-duplicate, keep order
    return actions.filter(function (v, i) { return actions.indexOf(v) === i; });
  }

  function extractKeyPoints(text, maxPoints) {
    maxPoints = maxPoints || 5;
    var summary = summarizeExtractive(text, maxPoints);
    return splitSentences(summary);
  }

  /* Routing policy — the heart of the hybrid design.
   * Short + sensitive-looking text stays on-device; long/complex text is
   * escalated to the cloud rung; if no AI rung exists, local engine serves.
   */
  function decideRoute(text, caps) {
    caps = caps || {};
    var words = tokenize(text).length;
    var sensitive = /(password|sandi|rahasia|confidential|npwp|ktp|salary|gaji|private)/i.test(text || '');
    if (caps.chromeNano) {
      if (words <= 400 || sensitive) {
        return { rung: 'chrome-nano', reason: sensitive ? 'Sensitive-looking content: kept on-device.' : 'Short text: on-device Gemini Nano is fast, free and private.' };
      }
      return { rung: 'firebase-hybrid', fallback: 'chrome-nano', reason: 'Long text (' + words + ' words): escalated to Firebase AI Logic hybrid (cloud Gemini), on-device as fallback.' };
    }
    if (caps.firebase) {
      return { rung: 'firebase-hybrid', reason: 'No Chrome Prompt API here; Firebase AI Logic hybrid model (PREFER_ON_DEVICE, cloud fallback) handles it.' };
    }
    return { rung: 'local-extractive', reason: 'No on-device AI and no Firebase config in this browser: local extractive engine runs fully offline.' };
  }

  function runLocal(task, text) {
    if (task === 'actions') {
      var acts = extractActions(text);
      return acts.length ? acts.map(function (a) { return '- ' + a; }).join('\n') : 'No explicit action items found. Tip: write actions with cues like "X will send ...", "Perlu ...", or "Deadline ...".';
    }
    if (task === 'points') {
      var pts = extractKeyPoints(text, 5);
      return pts.map(function (p) { return '- ' + p; }).join('\n');
    }
    // default: summary
    return summarizeExtractive(text, 3);
  }

  return {
    splitSentences: splitSentences,
    tokenize: tokenize,
    summarizeExtractive: summarizeExtractive,
    extractActions: extractActions,
    extractKeyPoints: extractKeyPoints,
    decideRoute: decideRoute,
    runLocal: runLocal
  };
});
