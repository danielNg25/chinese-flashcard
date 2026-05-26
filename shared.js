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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/ü/g, 'v')
    .trim();
}

function normalizeViet(str) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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

// ── Web Speech ──────────────────────────────────────────────────────────────

function speakZh(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = 0.85;
  u.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Google')) ||
                  voices.find(v => v.lang === 'zh-CN' && v.name.includes('Ting')) ||
                  voices.find(v => v.lang.startsWith('zh-CN')) ||
                  voices.find(v => v.lang.startsWith('zh'));
  if (zhVoice) u.voice = zhVoice;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
if (typeof speechSynthesis !== 'undefined') speechSynthesis.getVoices();

function audioBtn(char) {
  return `<button class="audio-btn" onclick="event.stopPropagation();speakZh('${char.replace(/'/g, "\\'")}')" title="Listen">&#128264;</button>`;
}

// ── Radical breakdown ───────────────────────────────────────────────────────
// `openRadicals` is a module-level Set shared across all pages. Each page's
// rendering reads it; this means the open/closed state is per-page-session.

const openRadicals = new Set();

function radicalLines(w) {
  if (!w.radical) return [];
  return w.radical.split('|').map(s => s.trim()).filter(Boolean);
}

function radicalToggleHtml(w, suffix) {
  if (!w.radical) return '';
  const sfx = suffix || '';
  const arrowId = `radical-arrow-${sfx}${w.n}`;
  const arrow = openRadicals.has(w.n) ? '▴' : '▾';
  return `<button class="radical-toggle" onclick="toggleRadical(${w.n})" title="Phân tích chữ"><span class="arrow" id="${arrowId}">${arrow}</span> 分析</button>`;
}

function radicalPanelInner(w) {
  return radicalLines(w).map(l => `<div class="radical-line">${l}</div>`).join('');
}

function toggleRadical(n) {
  const isOpen = openRadicals.has(n);
  if (isOpen) openRadicals.delete(n); else openRadicals.add(n);
  // Desktop row (table layout)
  const row = document.getElementById(`radical-row-${n}`);
  if (row) row.classList.toggle('open', !isOpen);
  // Mobile panel (card layout — used by hanyu.html browse only)
  const mob = document.getElementById(`radical-panel-m-${n}`);
  if (mob) mob.classList.toggle('open', !isOpen);
  // Update both arrows
  const arrowD = document.getElementById(`radical-arrow-${n}`);
  if (arrowD) arrowD.textContent = isOpen ? '▾' : '▴';
  const arrowM = document.getElementById(`radical-arrow-m-${n}`);
  if (arrowM) arrowM.textContent = isOpen ? '▾' : '▴';
}

// ── Related Characters popup ────────────────────────────────────────────────
// Requires the page to have this DOM scaffold:
//   <div class="related-overlay" id="relatedOverlay" onclick="if(event.target===this)closeRelated()">
//     <div class="related-popup" id="relatedPopup">
//       <button class="related-close" onclick="closeRelated()">&#x2715;</button>
//       <div class="related-popup-title" id="relatedTitle"></div>
//       <div class="related-popup-char" id="relatedChar"></div>
//       <div class="related-popup-hv" id="relatedHv"></div>
//       <div id="relatedRadical"></div>
//       <div class="related-list" id="relatedList"></div>
//     </div>
//   </div>

function showRelated(clickedChar) {
  if (typeof words === 'undefined') return;  // page didn't load words.js — no-op
  const chars = [...new Set(clickedChar.replace(/\s/g, '').split(''))];
  const sections = chars.map(c => ({
    c,
    matches: words.filter(w => w.char !== clickedChar && w.char.replace(/\s/g, '').includes(c)),
  }));
  const totalOthers = [...new Set(sections.flatMap(s => s.matches.map(w => w.char)))].length;
  document.getElementById('relatedTitle').textContent =
    `Các từ chứa chữ trong "${clickedChar}" — ${totalOthers} từ liên quan`;
  document.getElementById('relatedChar').textContent = clickedChar;

  const clicked = words.find(w => w.char === clickedChar);
  const hvEl = document.getElementById('relatedHv');
  hvEl.innerHTML = clicked && clicked.hv ? `<span class="hv">✨ ${clicked.hv}</span>` : '';
  const radEl = document.getElementById('relatedRadical');
  radEl.innerHTML = clicked && clicked.radical
    ? `<div class="related-popup-radical">${radicalLines(clicked).map(l => `<div class="radical-line">${l}</div>`).join('')}</div>`
    : '';

  const listEl = document.getElementById('relatedList');
  listEl.innerHTML = '';
  const shown = new Set();
  sections.forEach(({ c, matches }) => {
    if (matches.length === 0) return;
    const div = document.createElement('div');
    div.className = 'related-divider';
    div.textContent = `Chứa chữ "${c}"`;
    listEl.appendChild(div);
    matches.forEach(w => {
      if (shown.has(w.char)) return;
      shown.add(w.char);
      const highlighted = w.char.replace(/\s/g, '').split('').map(ch =>
        ch === c ? `<span style="color:#0C447C;font-weight:700">${ch}</span>` : ch
      ).join('');
      const radHtml = w.radical
        ? `<div class="related-item-radical">${radicalLines(w).map(l => `<div class="radical-line">${l}</div>`).join('')}</div>`
        : '';
      const item = document.createElement('div');
      item.className = 'related-item';
      item.innerHTML = `
        <div class="related-item-char">${highlighted}${audioBtn(w.char)}</div>
        <div class="related-item-right">
          <div class="related-item-pinyin">${w.pinyin}</div>
          <div class="related-item-viet">${w.viet}</div>
          ${w.hv ? `<div class="related-item-hv">${w.hv}</div>` : ''}
          ${radHtml}
        </div>
        <div class="related-item-lesson">L${w.lesson}</div>`;
      listEl.appendChild(item);
    });
  });
  if (shown.size === 0) {
    listEl.innerHTML = '<div style="color:var(--color-text-tertiary);font-size:13px;text-align:center;padding:16px">Không có từ liên quan trong bảng từ vựng.</div>';
  }
  document.getElementById('relatedOverlay').classList.add('open');
}

function closeRelated() {
  const ov = document.getElementById('relatedOverlay');
  if (ov) ov.classList.remove('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRelated(); });

// ── Lesson dropdown population ──────────────────────────────────────────────

function availableLessons() {
  const set = new Set();
  const addFrom = arr => { if (Array.isArray(arr)) for (const x of arr) if (Number.isInteger(x.lesson)) set.add(x.lesson); };
  if (typeof words !== 'undefined') addFrom(words);
  if (typeof grammarPatterns !== 'undefined') addFrom(grammarPatterns);
  if (typeof grammarQuestions !== 'undefined') addFrom(grammarQuestions);
  return [...set].sort((a, b) => a - b);
}

function populateLessonSelects() {
  const lessons = availableLessons();
  document.querySelectorAll('select').forEach(sel => {
    const first = sel.options[0];
    if (!first || first.value !== '' || !/lesson/i.test(first.textContent)) return;
    const prev = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    for (const n of lessons) {
      const o = document.createElement('option');
      o.value = String(n);
      o.textContent = `Lesson ${n}`;
      sel.appendChild(o);
    }
    if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
  });
}

// ── Grammar abbreviation tooltips ───────────────────────────────────────────

const ABBR_TOOLTIPS = {
  'CN': 'Chủ ngữ (Subject)',
  'VN': 'Vị ngữ (Predicate)',
  'TN': 'Tân ngữ (Object)',
  'DT': 'Danh từ (Noun)',
  'TT': 'Tính từ (Adjective)',
  'ĐT': 'Động từ (Verb)',
  'ĐN': 'Định ngữ (Modifier)',
  'LT': 'Lượng từ (Measure word)',
};

function addAbbrTooltips(html) {
  if (!html) return html;
  return String(html).replace(/(?<![A-Za-zĐđ])(CN|VN|TN|DT|TT|ĐT|ĐN|LT)(?![A-Za-zĐđ])/g, (m, a) =>
    `<span class="abbr" data-tip="${ABBR_TOOLTIPS[a]}" tabindex="0">${a}</span>`);
}

document.addEventListener('click', e => {
  const abbr = e.target.closest && e.target.closest('.abbr');
  document.querySelectorAll('.abbr.active').forEach(el => { if (el !== abbr) el.classList.remove('active'); });
  if (abbr) { abbr.classList.toggle('active'); e.stopPropagation(); }
}, true);
