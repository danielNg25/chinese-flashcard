/**
 * shared.js — Cross-page helpers for hanyu.html, lesson.html, grammar.html.
 *
 * No build, no modules. Functions are attached to the global scope. Loaded
 * before each page's own inline <script>. See CLAUDE.md "Shared module" for
 * the full API and intent.
 */

// ── Pure helpers ────────────────────────────────────────────────────────────

function normalizePinyin(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .replace(/ü/g, 'v')
    .trim();
}

function normalizeViet(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function checkPinyinMatch(userAnswer, word) {
  const parts = word.pinyin.split('/').map(s => s.trim());
  const nu = normalizePinyin(userAnswer);
  return userAnswer.length > 0 && parts.some(p => normalizePinyin(p) === nu);
}

function checkViet(userAnswer, word) {
  const parts = word.viet.split(',').map(s => s.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
  const nu = normalizeViet(userAnswer);
  return userAnswer.length > 0 && parts.some(p => {
    const np = normalizeViet(p);
    return nu === np || np.includes(nu) || nu.includes(np);
  });
}

// Resolved from hanyu.html (startsWith('n')) vs lesson.html (startsWith('n.'))
// drift. Lesson's stricter form is correct — it prevents pos:"num." from being
// silently classified as a noun badge. See audit CQ-1 / UX-1.
function posClass(pos) {
  if (!pos) return 'other';
  if (pos.startsWith('n.')) return 'n';
  if (pos.startsWith('v.')) return 'v';
  if (pos.startsWith('pron.')) return 'pron';
  if (pos.startsWith('adv.')) return 'adv';
  if (pos.startsWith('adj.')) return 'adj';
  if (pos.startsWith('part.')) return 'part';
  return 'other';
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
