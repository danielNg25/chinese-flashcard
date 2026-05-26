# Shared Extraction & Docs Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate ~600 lines of CSS+JS duplication across `hanyu.html`, `lesson.html`, `grammar.html` by extracting them into `shared.css` + `shared.js`, add minimal tests to prevent regressions during/after the extraction, and rewrite the now-misleading `CLAUDE.md` to match current reality.

**Architecture:** Zero-dep static site, no build step. Two new files at repo root: `shared.css` (CSS variables + cross-page styles) and `shared.js` (pure helpers + DOM helpers used by all 3 pages). Each HTML page loads them before its own inline styles/scripts. A new `tests/shared.test.html` runs the pure helpers in a browser and prints PASS/FAIL — no test framework. The Hide & Seek logic and the lesson-quiz duplication of grammar exercises are deliberately deferred to follow-up plans.

**Tech Stack:** Plain HTML/CSS/JS, no bundler, no framework, no TypeScript. Tests run by opening `tests/shared.test.html` via a local static server (e.g., `python3 -m http.server`).

**Scope reference:** [docs/superpowers/specs/2026-05-26-app-review-audit.md](../specs/2026-05-26-app-review-audit.md), specifically CQ-1, CQ-2, CQ-7, CQ-8.

**Out of scope (separate future plans):** Hide & Seek dedup, lesson.html Quiz vs grammar.html exercise dedup, SRS rework (LE-1/2/3), framework migration.

---

## File structure (locked in before tasks)

| File | Action | Responsibility |
|---|---|---|
| [shared.css](../../../shared.css) | **Create** | `:root` CSS variables, `.app-header`/`.app-nav`/`.app-title`/`.app-nav-btn`, `.mode-toggle`/`.mode-btn`, `.badge` + all POS color classes (`.n .v .pron .adv .adj .part .other` + new `.num .mw`), `.hv`, `.audio-btn`, `.char-clickable`, `.related-overlay`/`.related-popup`/etc., `.radical-toggle`/`.radical-row`/`.radical-panel`/etc., `.abbr` + tooltip styling, `.fc-message` family |
| [shared.js](../../../shared.js) | **Create** | Pure: `normalizePinyin`, `normalizeViet`, `checkPinyinMatch`, `checkViet`, `posClass`, `shuffle` (Fisher-Yates). DOM: `speakZh`, `audioBtn`, `radicalLines`, `radicalToggleHtml`, `radicalPanelInner`, `toggleRadical`, `showRelated`, `closeRelated`, `availableLessons`, `populateLessonSelects`, `ABBR_TOOLTIPS`, `addAbbrTooltips`. Click delegation for `.abbr.active` toggle and `Escape` to close popup. |
| [tests/shared.test.html](../../../tests/shared.test.html) | **Create** | Self-contained test runner. Imports `../shared.js`. Tests pure helpers (no DOM, no localStorage). Prints colored PASS/FAIL list. |
| [hanyu.html](../../../hanyu.html) | **Modify** | Load `shared.css` + `shared.js` in `<head>`. Remove all CSS now in `shared.css`. Remove all JS functions now in `shared.js`. Replace 4 inline Fisher-Yates loops with `shuffle()` call. Keep page-specific code (Hide & Seek, study-mode logic, weight system, Match/Choose/Listen/Pinyin/Writing modes). |
| [lesson.html](../../../lesson.html) | **Modify** | Same as above. Remove 2 inline Fisher-Yates loops. Keep page-specific code (lesson selector, quiz mode, lesson-specific Hide & Seek wrappers). |
| [grammar.html](../../../grammar.html) | **Modify** | Same as above. Remove 1 inline Fisher-Yates loop. Keep page-specific code (5 exercise renderers). |
| [CLAUDE.md](../../../CLAUDE.md) | **Rewrite** | Replace entirely. Current content references files/structures that no longer exist. New content reflects 3-page architecture, real data shapes, weighted-shuffle (not SM-2) reality, and points to the audit + this plan. |

---

## Conventions used in this plan

- **All commits stay on `main`** (this is a solo personal project, no PR workflow).
- Commit messages follow the existing repo style: plain, no AI attribution (`CLAUDE.md` explicitly forbids it).
- Verification uses a local static server: run `python3 -m http.server 8000` from the repo root, visit `http://localhost:8000/<page>.html` and `http://localhost:8000/tests/shared.test.html`. (`file://` may work in Firefox but Chrome blocks `<script src="../...">` from local files.)
- Each task ends with a commit. Tasks are small enough to commit independently.

---

## Task 0: Baseline smoke test (no code changes)

**Goal:** Capture current working behavior in a checklist before we change anything, so regressions are visible later.

**Files:** Create: `docs/superpowers/plans/smoke-checklist.md` (workspace-only; can delete after extraction).

- [ ] **Step 1: Start the local server**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
python3 -m http.server 8000
```

Leave it running in a terminal tab.

- [ ] **Step 2: Walk through all 3 pages and confirm each works**

Open each URL in the browser and verify the listed behaviors. Mark any that fail BEFORE the refactor (those are pre-existing bugs, not regressions you'll cause).

`http://localhost:8000/lesson.html`:
- Lesson dropdown shows Lesson 1 through Lesson 11
- Selecting a lesson populates the Vocabulary tab with a table
- Grammar tab shows pattern accordions; clicking expands explanation/examples/notes
- Quiz tab → Start Quiz produces vocab + grammar questions; can complete one
- Hide & Seek button hides cells, Check verifies, Reveal shows answer

`http://localhost:8000/hanyu.html`:
- Browse mode: table loads, search and POS/lesson filters work
- Each of 6 study modes (Character, Meaning, Pinyin, Choose, Listen, Match) renders a card and accepts input/clicks
- Listen mode plays Mandarin TTS (may take 1-2s on first card; acceptable)
- Clicking a character in Browse opens the Related Characters popup; Escape closes it
- `分析` button on a row with `radical` data expands a panel

`http://localhost:8000/grammar.html`:
- Each of 5 exercise types (Fill in Blank, Sentence Order, Error Correction, Pattern Match, Translation) loads a question
- Restart starts a new session

- [ ] **Step 3: Note pre-existing bugs in a temporary checklist**

```bash
cat > docs/superpowers/plans/smoke-checklist.md <<'EOF'
# Pre-refactor smoke baseline (2026-05-26)

Status of each item BEFORE shared extraction. Any FAIL here is a pre-existing
bug, not a regression. Delete this file once extraction is verified.

## lesson.html
- [ ] Lesson dropdown populated with all lessons
- [ ] Vocabulary tab renders table
- [ ] Grammar tab accordion expand/collapse
- [ ] Quiz: Start Quiz → answer one question → Next
- [ ] Hide & Seek: Check + Reveal both work

## hanyu.html
- [ ] Browse: search filters rows
- [ ] Browse: POS filter
- [ ] Browse: Lesson filter
- [ ] Character mode: card flips on Check
- [ ] Meaning mode
- [ ] Pinyin mode
- [ ] Choose mode (auto-advance on correct)
- [ ] Listen mode (TTS works, replay works)
- [ ] Match mode (4 pairs)
- [ ] Related Characters popup opens + Escape closes
- [ ] Radical 分析 expand

## grammar.html
- [ ] Fill in Blank
- [ ] Sentence Order
- [ ] Error Correction
- [ ] Pattern Match
- [ ] Translation
EOF
```

- [ ] **Step 4: Commit the checklist**

```bash
git add docs/superpowers/plans/smoke-checklist.md
git commit -m "Add pre-refactor smoke checklist for shared extraction"
```

**Estimate:** 10–15 minutes.

---

## Task 1: Rewrite CLAUDE.md (CQ-2)

**Goal:** Replace the misleading `CLAUDE.md` so future Claude sessions have accurate context. This task is independent of the extraction and can be done in any order.

**Files:** Rewrite: [CLAUDE.md](../../../CLAUDE.md).

- [ ] **Step 1: Replace CLAUDE.md entirely**

```bash
cat > "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web/CLAUDE.md" <<'EOF'
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chinese vocabulary + grammar study app for Vietnamese speakers. Single-author personal tool, deployed as a static site via GitHub Pages from the `main` branch. Zero dependencies: no build, no framework, no package manager.

Remote: https://github.com/danielNg25/chinese-flashcard

## Architecture

Three HTML pages, two data files, and (after the 2026-05-26 shared extraction) two shared assets:

| File | Role |
|---|---|
| `lesson.html` | Default entry. Per-lesson view: vocabulary table + grammar accordion + integrated Quiz tab. |
| `hanyu.html` | Vocabulary study: Browse table + 6 study modes (Character, Meaning, Pinyin, Choose, Listen, Match). |
| `grammar.html` | Grammar exercises: Browse patterns + 5 exercise types (Fill in Blank, Sentence Order, Error Correction, Pattern Match, Translation). |
| `words.js` | Vocabulary array. |
| `grammar_data.js` | `grammarPatterns` array + `grammarQuestions` array. |
| `shared.css` | Cross-page styles: CSS variables, app header/nav, mode toggle, badges, related-char popup, radical panel, abbreviation tooltips, fc-message family. |
| `shared.js` | Cross-page helpers: see "Shared module" below. |
| `tests/shared.test.html` | Browser-runnable PASS/FAIL tests for pure helpers in `shared.js`. Open via local HTTP server. |
| `docs/superpowers/specs/` | Audit + design docs. |
| `docs/superpowers/plans/` | Implementation plans. |

The shared extraction is documented in [docs/superpowers/plans/2026-05-26-shared-extraction-and-docs-refresh.md](docs/superpowers/plans/2026-05-26-shared-extraction-and-docs-refresh.md). A full audit of the app's state lives at [docs/superpowers/specs/2026-05-26-app-review-audit.md](docs/superpowers/specs/2026-05-26-app-review-audit.md).

## Data shapes

### `words[]` (in `words.js`)
```js
{
  char: "你好",
  pinyin: "nǐ hǎo",           // tones as combining diacritics; "v" written for "ü"
  pos: "n.",                  // "" | n. | v. | pron. | adv. | adj. | part. | suff. | mw. | num. | q.
  viet: "chào bạn",            // comma-separates synonyms; parentheticals stripped on match
  lesson: 1,
  hv: "...",                   // optional Hán Việt explanation
  radical: "...",              // optional radical/etymology breakdown, "|"-separated for multi-char words
  n: 12,                       // auto-assigned at file end; do not hand-set
}
```
The `n` field is assigned by `words.forEach((w, i) => w.n = i + 1)` at the bottom of `words.js`. New entries go before the `// ── Add new words below ──` marker without an `n` field.

### `grammarPatterns[]` (in `grammar_data.js`)
```js
{
  id: "B1-NP2",                // stable id used by grammarQuestions to link
  lesson: 1,
  title: "...",
  structure: "CN + 是/不是 + DT",  // CN/VN/TN/DT/TT/ĐT/ĐN/LT auto-tooltipped via shared.js
  explanation: "<html>",
  examples: [{ zh, vi }, ...],
  notes: ["..."],
}
```

### `grammarQuestions[]` (in `grammar_data.js`)
```js
{
  id: "...",
  lesson: 1,
  type: "fill-blank" | "sentence-builder" | "error-correction" | "pattern-match" | "translation",
  grammarId: "B1-NP2",         // optional link back to a pattern
  // ...type-specific fields (see existing entries for shape)
}
```

## Shared module (`shared.js`)

Loaded by all 3 HTML pages BEFORE their inline scripts. Exposes the following globals (no IIFE yet — see [audit CQ-4](docs/superpowers/specs/2026-05-26-app-review-audit.md)):

**Pure helpers (covered by `tests/shared.test.html`):**
- `normalizePinyin(str)` — lowercase, NFD-strip diacritics, drop whitespace, ü → v
- `normalizeViet(str)` — lowercase, NFD-strip diacritics, đ → d, strip non-alphanumeric
- `checkPinyinMatch(userAnswer, word)` — splits `word.pinyin` on `/`, matches normalized
- `checkViet(userAnswer, word)` — splits `word.viet` on `,`, strips parentheticals, fuzzy includes
- `posClass(pos)` — maps a POS string to a CSS class name; expects the trailing dot (e.g., `"n."`)
- `shuffle(arr)` — Fisher-Yates; returns a new array

**DOM helpers:**
- `speakZh(text)` / `audioBtn(char)` — Web Speech API; voice pref order Google → Ting → any zh-CN → any zh
- `radicalLines(w)` / `radicalToggleHtml(w, suffix?)` / `radicalPanelInner(w)` / `toggleRadical(n)` — radical breakdown UI
- `showRelated(char)` / `closeRelated()` — Related Characters popup (requires page to have the `#relatedOverlay`/`#relatedPopup` DOM scaffold)
- `availableLessons()` / `populateLessonSelects()` — data-driven lesson dropdown population
- `ABBR_TOOLTIPS` / `addAbbrTooltips(html)` — wrap `CN`/`VN`/`TN`/`DT`/`TT`/`ĐT`/`ĐN`/`LT` tokens with tooltip spans

Page-specific code (Hide & Seek logic, study modes, quiz logic, weight system) lives in each HTML file's own `<script>`.

## Persistence (localStorage)

Five per-mode weight stores, keyed by word `n`:
- `weights_char`, `weights_meaning`, `weights_pinyin`, `weights_choose`, `weights_audio`

Values: integer 1–4. `1`=Easy, `2`=Good (default for new), `3`=Hard, `4`=Forgot. Higher = appears earlier in shuffle. Stores are **independent** — failing a word in "Pinyin" does not affect any other mode's session (see [audit LE-2](docs/superpowers/specs/2026-05-26-app-review-audit.md)).

**This is not real spaced repetition.** There is no `dueDate`, `interval`, `easeFactor`, or `lastReview` field stored. "SRS" is a weighted shuffle that surfaces harder words earlier within a session.

Plus `grammar_progress` (per-question correct/wrong counters from `grammar.html`).

## Adding content

### New words
Append to `words.js` before the `// ── Add new words below ──` marker. No `n` field needed:
```js
{ char:"大", pinyin:"dà", pos:"adj.", viet:"to, lớn", lesson:4 },
```

### New lessons
No HTML edit needed — lesson dropdowns are populated from data via `populateLessonSelects()` in `shared.js`. Just set the `lesson` field on words/patterns/questions.

### New grammar patterns / questions
Append to the corresponding array in `grammar_data.js`. Both the `grammarPatterns` browse view and `grammarQuestions` exercise system will pick them up. **Important:** changes to a grammar pattern must propagate to any matching `grammarQuestions` — there is no automated link enforcement.

## Testing

```bash
python3 -m http.server 8000
# Open http://localhost:8000/tests/shared.test.html
```

Tests cover the pure helpers in `shared.js` only. No framework. PASS/FAIL printed to the page.

## Commit convention

- Do not include AI attribution, co-author lines, or `🤖 Generated with` markers in commits.
- Plain, lower-stakes voice. Match existing repo style (e.g., "Add new vocabulary for Lesson 8", "Update words.js").
EOF
```

- [ ] **Step 2: Verify the file is what you expect**

```bash
head -40 "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web/CLAUDE.md"
```

Skim the output. Confirm: no references to `chinese_vocab_study.html`, no claims about SM-2 / `easeFactor` / `dueDate`, mentions all 3 pages.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add CLAUDE.md
git commit -m "Rewrite CLAUDE.md to match current 3-page architecture"
```

**Estimate:** 30–45 minutes.

---

## Task 2: Write the failing tests (tests/shared.test.html)

**Goal:** Capture expected behavior of the pure helpers BEFORE creating `shared.js`. Run them and watch them fail. This is the safety net for the extraction.

**Files:**
- Create: [tests/shared.test.html](../../../tests/shared.test.html)

- [ ] **Step 1: Create the test runner**

```bash
mkdir -p "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web/tests"
```

Then create `tests/shared.test.html`:

```html
<!doctype html>
<meta charset="utf-8">
<title>shared.js tests</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 1.5rem; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 18px; margin-bottom: 1rem; }
  .pass { color: #27500A; }
  .fail { color: #72243E; font-weight: 600; }
  .summary { margin-top: 1rem; padding: 10px 14px; border-radius: 6px; font-weight: 600; }
  .summary.ok { background: #EAF3DE; color: #27500A; }
  .summary.bad { background: #FBEAF0; color: #72243E; }
  ul { list-style: none; padding: 0; font-family: ui-monospace, Menlo, monospace; font-size: 13px; }
  li { padding: 2px 0; }
</style>
<h1>shared.js — pure-helper tests</h1>
<ul id="results"></ul>
<div id="summary" class="summary"></div>

<script src="../shared.js"></script>
<script>
const results = [];
function t(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, err: e.message });
  }
}
function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error((msg ? msg + ': ' : '') + `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function truthy(v, msg) { if (!v) throw new Error((msg || 'expected truthy') + `: got ${JSON.stringify(v)}`); }
function falsy(v, msg)  { if (v)  throw new Error((msg || 'expected falsy') + `: got ${JSON.stringify(v)}`); }

// ── normalizePinyin ─────────────────────────────────────────────────────────
t('normalizePinyin strips tone diacritics', () => {
  eq(normalizePinyin('nǐ hǎo'), 'nihao');
});
t('normalizePinyin lowercases', () => {
  eq(normalizePinyin('NI HAO'), 'nihao');
});
t('normalizePinyin maps ü to v', () => {
  eq(normalizePinyin('lǜ'), 'lv');
});
t('normalizePinyin drops all whitespace', () => {
  eq(normalizePinyin('  ni  hao  '), 'nihao');
});

// ── normalizeViet ───────────────────────────────────────────────────────────
t('normalizeViet strips Vietnamese diacritics', () => {
  eq(normalizeViet('chào bạn'), 'chao ban');
});
t('normalizeViet maps đ to d', () => {
  eq(normalizeViet('đi'), 'di');
});
t('normalizeViet strips punctuation', () => {
  eq(normalizeViet('chào, bạn!'), 'chao ban');
});

// ── checkPinyinMatch ────────────────────────────────────────────────────────
t('checkPinyinMatch exact match (with tones)', () => {
  truthy(checkPinyinMatch('nǐ hǎo', { pinyin: 'nǐ hǎo' }));
});
t('checkPinyinMatch toneless match', () => {
  truthy(checkPinyinMatch('ni hao', { pinyin: 'nǐ hǎo' }));
});
t('checkPinyinMatch slash-separated alternatives', () => {
  truthy(checkPinyinMatch('le', { pinyin: 'le / liǎo' }));
  truthy(checkPinyinMatch('liao', { pinyin: 'le / liǎo' }));
});
t('checkPinyinMatch rejects wrong answer', () => {
  falsy(checkPinyinMatch('zaijian', { pinyin: 'nǐ hǎo' }));
});
t('checkPinyinMatch empty string is wrong', () => {
  falsy(checkPinyinMatch('', { pinyin: 'nǐ hǎo' }));
});

// ── checkViet ───────────────────────────────────────────────────────────────
t('checkViet exact match', () => {
  truthy(checkViet('chào bạn', { viet: 'chào bạn' }));
});
t('checkViet comma-separated synonyms', () => {
  truthy(checkViet('khỏe', { viet: 'tốt, khỏe, hay, ngon' }));
  truthy(checkViet('ngon', { viet: 'tốt, khỏe, hay, ngon' }));
});
t('checkViet ignores parentheticals in source', () => {
  truthy(checkViet('thầy', { viet: 'thầy (giáo viên nam)' }));
});
t('checkViet partial includes match', () => {
  // "chào" is included in "chào bạn"; should accept
  truthy(checkViet('chào', { viet: 'chào bạn' }));
});
t('checkViet rejects unrelated word', () => {
  falsy(checkViet('xin chào', { viet: 'tạm biệt' }));
});

// ── posClass ────────────────────────────────────────────────────────────────
t('posClass maps n. to n', () => { eq(posClass('n.'), 'n'); });
t('posClass maps v. to v', () => { eq(posClass('v.'), 'v'); });
t('posClass maps pron. to pron', () => { eq(posClass('pron.'), 'pron'); });
t('posClass maps adv. to adv', () => { eq(posClass('adv.'), 'adv'); });
t('posClass maps adj. to adj', () => { eq(posClass('adj.'), 'adj'); });
t('posClass maps part. to part', () => { eq(posClass('part.'), 'part'); });
t('posClass returns other for empty', () => { eq(posClass(''), 'other'); });
t('posClass returns other for unknown', () => { eq(posClass('xyz.'), 'other'); });
// The audit's resolution of the hanyu/lesson drift: lesson's stricter
// startsWith('n.') is the chosen behavior. num. and mw. must NOT collapse to 'n'.
t('posClass does NOT map num. to n (drift fix)', () => { eq(posClass('num.'), 'other'); });
t('posClass does NOT map mw. to anything stupid', () => { eq(posClass('mw.'), 'other'); });

// ── shuffle ─────────────────────────────────────────────────────────────────
t('shuffle returns a new array (does not mutate input)', () => {
  const input = [1, 2, 3, 4, 5];
  const before = input.slice();
  shuffle(input);
  eq(JSON.stringify(input), JSON.stringify(before), 'input was mutated');
});
t('shuffle preserves length', () => {
  eq(shuffle([1, 2, 3, 4, 5]).length, 5);
});
t('shuffle preserves elements (multiset equality)', () => {
  const out = shuffle([1, 2, 3, 4, 5]);
  eq(out.slice().sort().join(','), '1,2,3,4,5');
});
t('shuffle handles empty array', () => {
  eq(JSON.stringify(shuffle([])), '[]');
});
t('shuffle handles single-element array', () => {
  eq(JSON.stringify(shuffle([42])), '[42]');
});

// ── Render results ─────────────────────────────────────────────────────────
const ul = document.getElementById('results');
let passed = 0, failed = 0;
results.forEach(r => {
  const li = document.createElement('li');
  if (r.ok) {
    li.className = 'pass';
    li.textContent = '✓ ' + r.name;
    passed++;
  } else {
    li.className = 'fail';
    li.textContent = '✗ ' + r.name + '  — ' + r.err;
    failed++;
  }
  ul.appendChild(li);
});
const sum = document.getElementById('summary');
sum.textContent = `${passed} passed, ${failed} failed (${results.length} total)`;
sum.className = 'summary ' + (failed === 0 ? 'ok' : 'bad');
</script>
```

- [ ] **Step 2: Run the tests; expect total failure (shared.js does not exist yet)**

With the local server running (from Task 0), open `http://localhost:8000/tests/shared.test.html`. Expected: red summary, every test fails with `normalizePinyin is not defined` (or similar). The page must still load.

If the page is blank or the script tag errors-out hard, fix the HTML before continuing.

- [ ] **Step 3: Commit the failing test**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add tests/shared.test.html
git commit -m "Add tests/shared.test.html (failing baseline before extraction)"
```

**Estimate:** 25–35 minutes.

---

## Task 3: Create shared.js with pure helpers only; make tests pass

**Goal:** Create `shared.js` with just enough code to make Task 2's tests pass. Leaves the existing HTML files untouched — they still have their own copies. We migrate them in later tasks.

**Files:**
- Create: [shared.js](../../../shared.js)

- [ ] **Step 1: Create shared.js with the 6 pure helpers**

```bash
cat > "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web/shared.js" <<'EOF'
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
EOF
```

- [ ] **Step 2: Re-run tests; expect all green**

Reload `http://localhost:8000/tests/shared.test.html`. Expected: green summary, all tests pass (~27 PASS, 0 FAIL).

If any fail, fix `shared.js` (don't change tests) before continuing.

- [ ] **Step 3: Commit**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add shared.js
git commit -m "Create shared.js with pure helpers (tests pass)"
```

**Estimate:** 20–30 minutes.

---

## Task 4: Add DOM helpers + ABBR + lesson-selects to shared.js

**Goal:** Add the rest of the to-be-shared JS (not tested directly, but exercised when the pages are wired up). After this, `shared.js` has everything the 3 HTML pages will need.

**Files:**
- Modify: [shared.js](../../../shared.js) (append)

- [ ] **Step 1: Append DOM helpers to shared.js**

Open `shared.js` and append the following at the end (after the `shuffle` function):

```js

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
```

- [ ] **Step 2: Reload the test page; tests still pass**

Reload `http://localhost:8000/tests/shared.test.html`. Expected: same green result. (The new functions aren't tested, but they shouldn't break the existing ones.)

- [ ] **Step 3: Commit**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add shared.js
git commit -m "Add DOM helpers, abbr, lesson-selects, related-popup to shared.js"
```

**Estimate:** 30–40 minutes.

---

## Task 5: Create shared.css

**Goal:** Pull the cross-page CSS into `shared.css`. Pages still inline-style everything for now — extraction from each page happens in Tasks 6–8.

**Files:**
- Create: [shared.css](../../../shared.css)

- [ ] **Step 1: Create shared.css**

```bash
cat > "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web/shared.css" <<'EOF'
/**
 * shared.css — Cross-page styles for hanyu.html, lesson.html, grammar.html.
 *
 * Loaded BEFORE each page's inline <style>. Inline styles can override
 * shared rules where intentional. See CLAUDE.md for context.
 */

/* ── CSS variables ──────────────────────────────────────────────────────── */
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --color-background-primary: #ffffff;
  --color-background-secondary: #f5f5f5;
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-tertiary: #999999;
  --color-border-secondary: #e0e0e0;
  --color-border-tertiary: #eeeeee;
  --border-radius-md: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font-sans); }
.wrap { padding: 1rem 3rem; max-width: 1400px; margin: 0 auto; }

/* ── App header / nav ───────────────────────────────────────────────────── */
.app-header { display: flex; align-items: center; gap: 16px; padding: 0.75rem 3rem; border-bottom: 1px solid var(--color-border-tertiary); background: var(--color-background-primary); }
.app-title { font-size: 18px; font-weight: 600; color: var(--color-text-primary); letter-spacing: 0.02em; }
.app-nav { display: flex; gap: 0; border: 1px solid var(--color-border-secondary); border-radius: var(--border-radius-md); overflow: hidden; }
.app-nav-btn { padding: 6px 18px; font-size: 14px; text-decoration: none; color: var(--color-text-secondary); background: var(--color-background-primary); transition: all 0.2s; }
.app-nav-btn.active { background: var(--color-background-secondary); color: var(--color-text-primary); font-weight: 600; }
.app-nav-btn:hover:not(.active) { background: var(--color-background-secondary); }

/* ── Mode toggle (sub-tab strip) ────────────────────────────────────────── */
.mode-toggle { display: flex; gap: 0; margin-bottom: 1rem; border: 1px solid var(--color-border-secondary); border-radius: var(--border-radius-md); overflow: hidden; width: fit-content; }
.mode-btn { padding: 8px 20px; font-size: 14px; border: none; cursor: pointer; background: var(--color-background-primary); color: var(--color-text-secondary); transition: all 0.2s; font-family: inherit; }
.mode-btn.active { background: var(--color-background-secondary); color: var(--color-text-primary); font-weight: 600; }
.mode-btn:hover:not(.active) { background: var(--color-background-secondary); }

/* ── POS badges (shared color palette) ──────────────────────────────────── */
.badge { display: inline-block; font-size: 11px; padding: 2px 7px; border-radius: 99px; font-weight: 500; }
.n     { background: #E6F1FB; color: #0C447C; }
.v     { background: #EAF3DE; color: #27500A; }
.pron  { background: #EEEDFE; color: #3C3489; }
.adv   { background: #FAEEDA; color: #633806; }
.adj   { background: #FBEAF0; color: #72243E; }
.part  { background: #FAECE7; color: #712B13; }
.other { background: #F1EFE8; color: #444441; }

/* ── Hán Việt + audio + clickable char ──────────────────────────────────── */
.hv { color: #7c5c00; font-size: 12px; background: #fdf3dc; padding: 2px 8px; border-radius: 4px; display: inline-block; }
.audio-btn { background: none; border: none; cursor: pointer; font-size: 16px; padding: 2px 4px; opacity: 0.5; transition: opacity 0.15s; vertical-align: middle; }
.audio-btn:hover { opacity: 1; }
.char-clickable { cursor: pointer; border-bottom: 1.5px dashed #bbb; transition: color 0.15s; }
.char-clickable:hover { color: #0C447C; border-bottom-color: #0C447C; }

/* ── Related Characters popup ───────────────────────────────────────────── */
.related-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.35); z-index: 1000; align-items: center; justify-content: center; }
.related-overlay.open { display: flex; }
.related-popup { background: var(--color-background-primary); border-radius: 12px; padding: 24px; max-width: 480px; width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.18); position: relative; }
.related-popup-title { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 12px; }
.related-popup-char { font-size: 52px; font-weight: 600; text-align: center; margin-bottom: 4px; }
.related-popup-hv { text-align: center; margin-bottom: 16px; }
.related-close { position: absolute; top: 14px; right: 16px; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--color-text-secondary); line-height: 1; }
.related-close:hover { color: var(--color-text-primary); }
.related-list { display: flex; flex-direction: column; gap: 8px; }
.related-item { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 8px; background: var(--color-background-secondary); }
.related-item-char { font-size: 22px; font-weight: 500; min-width: 56px; }
.related-item-right { flex: 1; }
.related-item-pinyin { font-size: 12px; color: var(--color-text-secondary); font-style: italic; }
.related-item-viet { font-size: 13px; color: var(--color-text-primary); }
.related-item-hv { font-size: 11px; color: #7c5c00; background: #fdf3dc; padding: 1px 6px; border-radius: 4px; display: inline-block; margin-top: 2px; }
.related-item-radical { font-size: 11px; color: #1a3a6b; background: #f0f4ff; padding: 4px 8px; border-radius: 4px; display: block; margin-top: 4px; line-height: 1.55; }
.related-item-lesson { font-size: 11px; color: var(--color-text-tertiary); background: var(--color-background-primary); padding: 1px 5px; border-radius: 4px; margin-left: auto; white-space: nowrap; }
.related-divider { font-size: 11px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin: 10px 0 4px; }
.related-popup-radical { background: #f0f4ff; color: #1a3a6b; font-size: 12px; padding: 8px 12px; border-radius: 6px; line-height: 1.7; margin: 0 0 14px; text-align: left; }
.related-popup-radical .radical-line { margin: 0; }

/* ── Radical breakdown (collapsible per row, table layout) ──────────────── */
.radical-toggle { background: none; border: 1px solid var(--color-border-tertiary); cursor: pointer; font-size: 11px; color: #4d6db8; padding: 1px 7px; border-radius: 4px; margin-left: 4px; vertical-align: middle; transition: background 0.12s, color 0.12s; font-family: inherit; line-height: 1.5; }
.radical-toggle:hover { background: #f0f4ff; color: #1a3a6b; }
.radical-toggle .arrow { font-size: 10px; margin-left: 2px; }
.radical-row { display: none; }
.radical-row.open { display: table-row; }
.radical-row > td { padding: 0 10px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); }
.radical-panel { background: #f0f4ff; color: #1a3a6b; font-size: 12px; padding: 8px 12px; border-radius: 6px; line-height: 1.7; }
.radical-line { margin: 0; }
/* Mobile collapsible panel (used by hanyu.html browse cards) */
.radical-panel-mobile { display: none; }
.radical-panel-mobile.open { display: block; }

/* ── Abbreviation tooltips (CN / VN / TN / etc.) ────────────────────────── */
.abbr { display: inline-block; cursor: help; border-bottom: 1px dotted var(--color-text-tertiary); position: relative; outline: none; }
.abbr::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 6px 10px; border-radius: 6px; white-space: nowrap; font-size: 12px; font-weight: 400; pointer-events: none; opacity: 0; visibility: hidden; transition: opacity 0.15s, visibility 0.15s; z-index: 9999; }
.abbr:hover::after, .abbr:focus::after, .abbr.active::after { opacity: 1; visibility: visible; }
EOF
```

- [ ] **Step 2: Commit** (no behavior change yet — pages still inline-style)

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add shared.css
git commit -m "Create shared.css (not yet wired into pages)"
```

**Estimate:** 15–20 minutes.

---

## Task 6: Wire hanyu.html — load shared, delete duplicates

**Goal:** Make `hanyu.html` use `shared.css` + `shared.js` and delete the now-duplicate content from its inline `<style>` and `<script>`.

**Files:**
- Modify: [hanyu.html](../../../hanyu.html)

- [ ] **Step 1: Add `<link>` + `<script>` near the top**

In [hanyu.html](../../../hanyu.html), the file currently starts with `<meta name="viewport" ...>` then `<style>...</style>`. Add the shared loaders immediately AFTER the meta tag and BEFORE the opening `<style>` tag:

Find:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
```

Replace with:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="shared.css">
<style>
```

- [ ] **Step 2: Load shared.js BEFORE words.js**

Find (around line 549):
```html
<script src="words.js"></script>
<script>
```

Replace with:
```html
<script src="shared.js"></script>
<script src="words.js"></script>
<script>
```

- [ ] **Step 3: Smoke test BEFORE removing anything**

Reload `http://localhost:8000/hanyu.html`. Walk through the smoke checklist (Browse search/filter, each study mode, related popup, radical toggle). Expected: identical to before. The shared file's rules are duplicated by the inline `<style>` so nothing should look different.

If something is broken at this step, the issue is the shared files themselves — fix before deleting any inline content.

- [ ] **Step 4: Delete inline CSS that's now in shared.css**

Open `hanyu.html`. Delete these CSS blocks from the inline `<style>` (line numbers are approximate; identify by content):

Lines 3-13 (`:root { ... }`) — delete.
Lines 14-16 (`* { box-sizing... }`, `body { ... }`, `.wrap { ... }`) — delete.
Lines 19-24 (`.app-header`, `.app-title`, `.app-nav`, `.app-nav-btn`, `.app-nav-btn.active`, `.app-nav-btn:hover...`) — delete.
Lines 27-30 (`.mode-toggle`, `.mode-btn`, `.mode-btn.active`, `.mode-btn:hover...`) — delete.
Lines 46-53 (`.badge`, `.n`, `.v`, `.pron`, `.adv`, `.adj`, `.part`, `.other`) — delete.
Lines 65-69 (`.hv`, `.audio-btn`, `.audio-btn:hover`, `.char-clickable`, `.char-clickable:hover`) — delete.
Lines 72-89 (`.related-*` block, all rules with `related-` prefix through `.related-popup-radical .radical-line`) — delete.
Lines 92-101 (`.radical-toggle` through `.radical-panel-mobile.open`) — delete.

Keep all other CSS — Hide & Seek styles, flashcard styles, choose/listen/match mode styles, mobile-card / mobile-cards styles, fc-* family (specific to hanyu, not yet shared), keyframes, etc.

- [ ] **Step 5: Delete inline JS that's now in shared.js**

In the same file, delete these function definitions from the inline `<script>`:

- `function posClass(pos)` (lines ~553–562)
- `function speakZh(text)` (lines ~588–602) AND the `speechSynthesis.getVoices()` line right after it (~604)
- `function audioBtn(char)` (lines ~606–608)
- `const openRadicals = new Set();` AND `function radicalLines/radicalToggleHtml/radicalPanelInner/toggleRadical` (lines ~768–801)
- `function normalizePinyin` (lines ~1102–1104), `function checkViet` (~1106–1113), `function checkPinyinMatch` (~1115–1119), `function normalizeViet` (~1416–1418)
- `function availableLessons` (~2079–2086) and `function populateLessonSelects` (~2088–2103)
- `function showRelated(clickedChar)` (~2106–2154) and `function closeRelated()` (~2178–2180)
- The line `document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRelated(); });` (just after closeRelated)

Use your editor's find to locate each. Be careful not to delete adjacent unrelated functions (`weightBadge`, `weightLabel`, `toggleRatings`, etc. STAY).

- [ ] **Step 6: Smoke test again — should still work**

Reload `http://localhost:8000/hanyu.html`. Walk the smoke checklist. Expected: identical behavior. If something breaks, the issue is either:
- A delete that took too much (recover from git, redo with narrower scope)
- A subtle difference between the page's old version and shared.js (compare carefully)

- [ ] **Step 7: Commit**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add hanyu.html
git commit -m "Wire hanyu.html to shared.js/css; remove duplicated definitions"
```

**Estimate:** 30–45 minutes.

---

## Task 7: Wire lesson.html — load shared, delete duplicates

**Goal:** Same surgery as Task 6, on `lesson.html`.

**Files:**
- Modify: [lesson.html](../../../lesson.html)

- [ ] **Step 1: Add `<link>` + `<script>` near the top**

In [lesson.html](../../../lesson.html), find (around line 1-3):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lessons — 汉语学习</title>
<style>
```

Replace with:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lessons — 汉语学习</title>
<link rel="stylesheet" href="shared.css">
<style>
```

- [ ] **Step 2: Load shared.js BEFORE words.js / grammar_data.js**

Find (around line 312):
```html
<script src="words.js"></script>
<script src="grammar_data.js"></script>
<script>
```

Replace with:
```html
<script src="shared.js"></script>
<script src="words.js"></script>
<script src="grammar_data.js"></script>
<script>
```

- [ ] **Step 3: Smoke test before deleting (sanity check)**

Reload `http://localhost:8000/lesson.html`. Walk the lesson section of the smoke checklist. Expected: works exactly like before.

- [ ] **Step 4: Delete inline CSS now in shared.css**

Delete these blocks from `lesson.html`'s `<style>`:

Lines 4-14 (`:root { ... }`) — delete.
Lines 15-17 (`* { box-sizing }`, `body { ... }`, `.wrap { ... }`) — delete.
Lines 20-25 (`.app-header`, `.app-title`, `.app-nav`, `.app-nav-btn`, `.app-nav-btn.active`, hover) — delete.
Lines 28-31 (`.mode-toggle`, `.mode-btn`, `.mode-btn.active`, hover) — delete.
Lines 43 (`.hv`) — delete.
Lines 44-51 (`.badge`, `.n`-`.other`) — delete.
Lines 53-57 (`.audio-btn`, hover, `.char-clickable`, hover) — delete.
Lines 60-79 (`.related-*` through `.related-popup-radical .radical-line`) — delete.
Lines 101-108 (`.radical-toggle` through `.radical-line`) — delete.
Lines 142-145 (`.abbr` and `.abbr::after`, `.abbr:hover::after`...) — delete.

Keep everything else (`.lesson-select`, `.section-heading`, `.gr-table`, `.detail-panel`, Hide & Seek, Quiz styles).

- [ ] **Step 5: Delete inline JS now in shared.js**

Delete from `lesson.html`'s inline `<script>`:

- `const ABBR_TOOLTIPS = { ... }` (~lines 445–454) AND `function addAbbrTooltips` (~455–459) AND the `document.addEventListener('click', e => { ... }, true);` right after (~460–464). All three together.
- `function posClass(pos)` (~lines 490–499)
- `const openRadicals = new Set();` (~line 502) AND `function radicalLines/radicalToggleHtml/radicalPanelInner/toggleRadical` (~504–527)
- `function normalizePinyin` (~lines 658–660), `function normalizeViet` (~661–663), `function checkPinyinMatch` (~664–668), `function checkViet` (~669–676), `function audioBtn` (~677–679), `function speakZh` (~681–694) AND the `speechSynthesis.getVoices()` line right after (~695)
- `function availableLessons` (~lines 1549–1556) and `function populateLessonSelects` (~1558–1573)
- `function showRelated` (~lines 1584–1639) and `function closeRelated` (~1641–1643)
- The line `document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRelated(); });` (~line 1645)

Be careful: `selectLesson`, `selectTab`, `lessonHsConfigFor`, `startLessonHideSeek`, etc. STAY — these are lesson-specific.

- [ ] **Step 6: Smoke test again**

Reload `http://localhost:8000/lesson.html`. Walk the lesson section of the smoke checklist. Click around the Quiz tab too — the quiz uses several of the now-shared helpers (`speakZh`, `pickVocabDistractors` calls into `checkPinyinMatch`, etc.).

- [ ] **Step 7: Commit**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add lesson.html
git commit -m "Wire lesson.html to shared.js/css; remove duplicated definitions"
```

**Estimate:** 30–45 minutes.

---

## Task 8: Wire grammar.html — load shared, delete duplicates

**Goal:** Same surgery on `grammar.html`. Smaller file, fewer dupes.

**Files:**
- Modify: [grammar.html](../../../grammar.html)

- [ ] **Step 1: Add `<link>` + `<script>` near the top**

In [grammar.html](../../../grammar.html), find (around line 1-3):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ngữ Pháp — Hán ngữ</title>
<style>
```

Replace with:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ngữ Pháp — Hán ngữ</title>
<link rel="stylesheet" href="shared.css">
<style>
```

- [ ] **Step 2: Load shared.js BEFORE grammar_data.js**

Find (around line 238):
```html
<script src="grammar_data.js"></script>
<script>
```

Replace with:
```html
<script src="shared.js"></script>
<script src="grammar_data.js"></script>
<script>
```

- [ ] **Step 3: Smoke test before deleting**

Reload `http://localhost:8000/grammar.html`. Walk the grammar section of the smoke checklist.

- [ ] **Step 4: Delete inline CSS now in shared.css**

Delete from `grammar.html`'s `<style>`:

Lines 4-14 (`:root { ... }`) — delete.
Lines 15-18 (`* { box-sizing }`, `th { text-align: left; }`, `body { ... }`, `.wrap { ... }`) — keep `th { text-align: left; }` (page-specific); delete the rest.
Lines 21-26 (`.app-header`, `.app-title`, `.app-nav`, `.app-nav-btn`, hover) — delete.
Lines 28-31 (`.mode-toggle`, `.mode-btn`, `.mode-btn.active`, hover) — delete.

Note: `grammar.html` does not contain the badge classes, hv, audio-btn, related-popup, radical, or abbr blocks in shared.css — those don't appear in the inline style here, so there's less to delete than the other pages.

- [ ] **Step 5: Delete inline JS now in shared.js**

Delete from `grammar.html`'s inline `<script>`:

- `const ABBR_TOOLTIPS = { ... }` (~lines 243–252) AND `function addAbbrTooltips` (~253–257) AND the `document.addEventListener('click', e => { ... }, true);` right after (~258–262)
- `function availableLessons` (~lines 722–729) and `function populateLessonSelects` (~731–746)

Page-specific (KEEP): `switchExType`, `onFilter`, `buildQueue`, `renderFillBlank`, `checkFb`, all sentence-builder/error-correction/pattern-match/translation logic.

- [ ] **Step 6: Smoke test again**

Reload `http://localhost:8000/grammar.html`. Walk through each of the 5 exercise types.

- [ ] **Step 7: Commit**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add grammar.html
git commit -m "Wire grammar.html to shared.js/css; remove duplicated definitions"
```

**Estimate:** 20–30 minutes.

---

## Task 9: Replace inline Fisher-Yates with shuffle()

**Goal:** Replace the 7 inline Fisher-Yates loops across the codebase with calls to `shuffle()` from `shared.js`.

**Files:**
- Modify: [hanyu.html](../../../hanyu.html) (4 sites), [lesson.html](../../../lesson.html) (2 sites), [grammar.html](../../../grammar.html) (1 site)

Each site has the same pattern: there's some `let arr = [...]` (or already-existing array), then a `for (let i = arr.length - 1; i > 0; i--) { ... swap ... }` block that shuffles in place. We replace each with `arr = shuffle(arr)` (or the equivalent assignment for that site).

- [ ] **Step 1: hanyu.html site 1 — `startHideSeek` (around line 646)**

Find this block in `hanyu.html`:
```js
  const shuffledNs = filtered.map(w => w.n);
  for (let i = shuffledNs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledNs[i], shuffledNs[j]] = [shuffledNs[j], shuffledNs[i]];
  }
```
Replace with:
```js
  const shuffledNs = shuffle(filtered.map(w => w.n));
```

- [ ] **Step 2: hanyu.html site 2 — `renderChooseCard` distractor shuffle (~line 1542)**

Find:
```js
  const opts = [w, ...distractors];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  chOptions = opts;
```
Replace with:
```js
  const opts = shuffle([w, ...distractors]);
  chOptions = opts;
```

- [ ] **Step 3: hanyu.html site 3 — `renderListenCard` (~line 1722)**

Find:
```js
  const opts = [w, ...distractors];
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  lnOptions = opts;
```
Replace with:
```js
  const opts = shuffle([w, ...distractors]);
  lnOptions = opts;
```

- [ ] **Step 4: hanyu.html site 4 — `startMatchSession` tile shuffle (~line 1879)**

Find:
```js
  // Shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  tiles.forEach((t, i) => t.id = i);
```
Replace with:
```js
  const shuffledTiles = shuffle(tiles);
  shuffledTiles.forEach((t, i) => t.id = i);
  tiles.length = 0;
  tiles.push(...shuffledTiles);
```

(We must keep `tiles` as the same reference since later code refers to it; `shuffle()` returns a new array, so we splice it back in. Slightly awkward but preserves the original variable.)

Actually, simpler: change `const tiles = [];` declaration earlier in the function to `let tiles = [];`, then replace the shuffle block with `tiles = shuffle(tiles);`. Use whichever fits the local pattern better.

- [ ] **Step 5: lesson.html site 1 — `startLessonHideSeek` (~line 348)**

Find:
```js
  const shuffledNs = lessonWords.map(w => w.n);
  for (let i = shuffledNs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledNs[i], shuffledNs[j]] = [shuffledNs[j], shuffledNs[i]];
  }
```
Replace with:
```js
  const shuffledNs = shuffle(lessonWords.map(w => w.n));
```

- [ ] **Step 6: lesson.html site 2 — `shuffleArr` helper (~line 648)**

Find the helper:
```js
function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

This function is identical to `shuffle()` in `shared.js`. Delete the function definition (7 lines). Then in the same file, replace all 11 `shuffleArr(` callsites with `shuffle(`. The callsites (as of 2026-05-26) are at approximately lines 742 (×4 in one expression), 761, 770, 773, 828, 862, 930, 972, 1150, 1369, 1370 — but use find-replace, don't trust line numbers.

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
# Before: should report 12 (1 definition + 11 callers)
grep -c "shuffleArr(" lesson.html
# Do the replace in your editor: shuffleArr( → shuffle(  (don't use sed in case
# you want to review each match; or use sed -i '' 's/shuffleArr(/shuffle(/g' lesson.html)
# After: should report 0
grep -c "shuffleArr(" lesson.html
```

Verify the count drops to 0 after replacement.

- [ ] **Step 7: grammar.html site — `buildQueue` (~line 297)**

Find:
```js
  let qs = grammarQuestions.filter(q => q.type === type);
  if (lesson) qs = qs.filter(q => String(q.lesson) === lesson);
  for (let i = qs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [qs[i], qs[j]] = [qs[j], qs[i]];
  }
  return qs;
```
Replace with:
```js
  let qs = grammarQuestions.filter(q => q.type === type);
  if (lesson) qs = qs.filter(q => String(q.lesson) === lesson);
  return shuffle(qs);
```

- [ ] **Step 8: Verify no inline Fisher-Yates remain**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -n "for (let i = .* - 1; i > 0; i--)" hanyu.html lesson.html grammar.html || echo "all clear"
```

Expected: `all clear`.

- [ ] **Step 9: Full smoke test**

Reload all 3 pages and walk the entire smoke checklist. Every mode that shuffles (Hide & Seek, study modes, quiz, grammar exercises) must still work.

- [ ] **Step 10: Commit**

```bash
git add hanyu.html lesson.html grammar.html
git commit -m "Replace 7 inline Fisher-Yates loops with shared shuffle()"
```

**Estimate:** 25–35 minutes.

---

## Task 10: Final pass — confirm no leftover duplication, cleanup

**Goal:** Verify the extraction is clean (no duplicates remain in any HTML), then remove the workspace-only smoke checklist.

- [ ] **Step 1: Grep for any remaining duplicate function definitions**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
for fn in normalizePinyin normalizeViet checkPinyinMatch checkViet posClass speakZh audioBtn radicalLines radicalToggleHtml radicalPanelInner toggleRadical showRelated closeRelated availableLessons populateLessonSelects addAbbrTooltips; do
  count=$(grep -c "function $fn\|const $fn" hanyu.html lesson.html grammar.html shared.js 2>/dev/null | awk -F: '{sum+=$2} END {print sum}')
  echo "$fn: $count definition(s)"
done
```

Expected: each function should report `1 definition(s)` (the one in `shared.js`).

If any reports `2` or more, find the leftover with:
```bash
grep -n "function FUNC_NAME" *.html
```
and delete the duplicate.

- [ ] **Step 2: Grep for inline Fisher-Yates**

```bash
grep -rn "for (let i = .* - 1; i > 0; i--)" *.html shared.js
```

Expected: no matches.

- [ ] **Step 3: Verify the tests still pass**

Reload `http://localhost:8000/tests/shared.test.html`. Expected: all green.

- [ ] **Step 4: One more full smoke walk-through**

Re-run the entire smoke checklist on all 3 pages. This is the final sign-off.

- [ ] **Step 5: Delete the temporary smoke-checklist**

```bash
rm "docs/superpowers/plans/smoke-checklist.md"
git rm "docs/superpowers/plans/smoke-checklist.md"
```

- [ ] **Step 6: Verify file size reductions**

```bash
wc -l hanyu.html lesson.html grammar.html shared.js shared.css
```

Rough expectation: each HTML drops ~150–300 lines. Total LOC across the 3 HTMLs + 2 shared files should be smaller than the original 3 HTMLs alone.

- [ ] **Step 7: Final commit**

```bash
git commit -m "Remove temporary smoke checklist after successful shared extraction"
```

**Estimate:** 15–25 minutes.

---

## Risk callouts

**Risk 1: `shared.js` global pollution conflicts with page-specific code.**
The pages define functions like `posClass` in their own scripts. When `shared.js` loads first, then the inline script redefines `posClass`, the later definition wins — meaning during the wiring tasks, both can coexist temporarily. The deletion in Steps 4–5 of Tasks 6–8 is what actually engages `shared.js`. *Why this is OK:* if the deletion misses a function, the page just keeps using the old inline copy. Tests + smoke walks catch silent drift.

**Risk 2: posClass behavior change for `num.` POS.**
The audit's drift fix means `pos: "num."` words will get `class="other"` instead of `class="n"`. Visually: gray "other" badge instead of blue "n" badge. This is *intended* (the blue noun badge for numerals is wrong). Verify it during Task 6's smoke test: filter Browse to a lesson with numerals (lesson 6 has `零` `百` etc.) and confirm they show gray badges, not blue.

**Risk 3: `showRelated` requires the popup DOM scaffold to be on the page.**
`hanyu.html` and `lesson.html` both have the `#relatedOverlay` div. `grammar.html` does *not* — and that's fine because `grammar.html` never calls `showRelated`. If a future page wants to call it, copy the scaffold or refactor `showRelated` to create its own DOM. Not in this plan's scope; just noted.

**Risk 4: Script load order — `shared.js` must load before page inline `<script>`.**
This is guaranteed by the placement in Steps 1–2 of Tasks 6–8 (before `words.js` / `grammar_data.js` / inline script). Don't add `defer` or `async` to either tag.

**Risk 5: Tests rely on `<script src="../shared.js">` from `tests/`.**
Browsers may block this for `file://` URLs. Always test via the local HTTP server. Document this in CLAUDE.md (done in Task 1's "Testing" section).

**Risk 6: TTS voice availability is async — first Listen call may use wrong voice.**
Pre-existing issue (audit UX-3), not introduced by this refactor. Behavior is preserved. Fix is in a future plan.

---

## Spec coverage check

| Audit item | Addressed in this plan? | Tasks |
|---|---|---|
| CQ-1: extract shared.js + shared.css | Yes | 3, 4, 5, 6, 7, 8 |
| CQ-1 sub: resolve posClass drift | Yes | 3 (use lesson's stricter version), Risk 2 callout |
| CQ-2: rewrite CLAUDE.md | Yes | 1 |
| CQ-7: minimal pure-function tests | Yes | 2 |
| CQ-8: shared shuffle() helper | Yes | 3, 9 |
| Hide & Seek dedup | **No (deferred — separate plan)** | — |
| Lesson Quiz vs grammar.html dedup | **No (deferred — separate plan)** | — |
| Everything else in audit (LE-*, UX-*, CQ-3/4/5/6/9, CS-*) | **No (out of scope per user)** | — |

---

## Total estimate

~3.5 to 5 hours of focused work, broken into 10 commits. The plan is sized so each task is independently committable and reversible.
