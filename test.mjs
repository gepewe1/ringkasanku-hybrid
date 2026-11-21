// Node tests for RingkasanKu Hybrid core engine (app/core.js)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Core = require('./app/core.js');

let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('PASS', name); } else { fail++; console.log('FAIL', name); } }

const idText = `Rapat koordinasi tim operasional, Selasa 16 November. Penjualan bulan ini naik karena kampanye akhir tahun berjalan lebih awal dari rencana. Namun gudang melaporkan stok produk terlaris hampir habis dan pengiriman dari pemasok terlambat dua minggu. Budi perlu menghubungi pemasok utama besok pagi untuk memastikan jadwal pengiriman baru. Sari akan menyiapkan laporan stok lengkap sebelum hari Jumat. Tim sepakat harga tidak naik selama stok masih terbatas agar pelanggan tidak kecewa. Deadline kampanye berikutnya adalah tanggal 30 November dan semua materi promosi harus selesai sebelumnya. Andi ditugaskan menindaklanjuti keluhan pelanggan soal ongkir. Rapat berikutnya dijadwalkan Senin depan untuk mengevaluasi progres.`;

const sentences = Core.splitSentences(idText);
check('splitSentences >= 8', sentences.length >= 8);

const summary = Core.summarizeExtractive(idText, 3);
check('summary has exactly 3 sentences', Core.splitSentences(summary).length === 3);
check('summary shorter than source', summary.length < idText.length);
check('summary sentences come from source', Core.splitSentences(summary).every(s => idText.includes(s)));

const actions = Core.extractActions(idText);
check('extractActions finds >= 3 (perlu/akan/ditugaskan/deadline)', actions.length >= 3);
check('actions include Budi item', actions.some(a => a.includes('Budi')));

const enText = `Weekly sync. Priya will contact the payment provider today. The beta slipped by one week. Marcus needs to prepare the pricing page before Thursday. Support tickets doubled this month.`;
const enActions = Core.extractActions(enText);
check('EN actions >= 2', enActions.length >= 2);

const r1 = Core.decideRoute('short note', { chromeNano: true, firebase: true });
check('route short -> chrome-nano', r1.rung === 'chrome-nano');
const longText = Array(60).fill(idText).join(' ');
const r2 = Core.decideRoute(longText, { chromeNano: true, firebase: true });
check('route long -> firebase-hybrid', r2.rung === 'firebase-hybrid');
const r3 = Core.decideRoute(idText, { chromeNano: false, firebase: false });
check('route no caps -> local-extractive', r3.rung === 'local-extractive');
const r4 = Core.decideRoute('my password is secret and this note is short', { chromeNano: true, firebase: true });
check('route sensitive -> chrome-nano', r4.rung === 'chrome-nano');

check('runLocal summary non-empty', Core.runLocal('summary', idText).length > 40);
check('runLocal actions is bullet list', Core.runLocal('actions', idText).startsWith('- '));
check('runLocal empty actions gives tip', Core.runLocal('actions', 'The sky is blue today. Water is wet.').includes('No explicit action items'));
check('empty input summary is empty string', Core.summarizeExtractive('', 3) === '');

console.log(`\n${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
