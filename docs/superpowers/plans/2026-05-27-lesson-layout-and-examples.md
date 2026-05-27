# Lesson Layout + Example Sentences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact lesson.html's 3-row top nav into a single row (Hide & Seek auto-hidden on non-Vocab tabs), and add optional `examples: [{zh, vi}]` field to words[] surfaced on hanyu flashcard backs and as an expandable row in the lesson vocab table.

**Architecture:** Two bundled improvements built on the existing shared.js/shared.css module. Part 1 moves Hide & Seek toolbar out of `render()`'s vocab-view innerHTML into a persistent `#hsToolbar` slot inside a new `.top-controls` flex container; a new `renderHsToolbar()` function is wired from 5 callsites to keep it in sync with `currentTab` + `lessonHsMode`. Part 2 adds an optional data field, a shared `exampleLines()` helper, shared CSS, and surfaces the data in two places via existing patterns (mirrors radical-row for the lesson table, mirrors hv hint for card backs).

**Tech Stack:** Plain HTML/CSS/JS. Zero deps. Browser tests via `tests/shared.test.html` (no framework). Smoke checks via Playwright (`example-skills:webapp-testing`).

**Source spec:** [docs/superpowers/specs/2026-05-27-lesson-layout-and-examples.md](../specs/2026-05-27-lesson-layout-and-examples.md)

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| [tests/shared.test.html](../../../tests/shared.test.html) | **Modify** | Add 5 tests for `exampleLines()` |
| [shared.js](../../../shared.js) | **Modify (append)** | Add `exampleLines(w)` helper after `radicalPanelInner` |
| [shared.css](../../../shared.css) | **Modify (append)** | Add `.example-toggle`, `.example-row`, `.example-row.open`, `.example-row > td`, `.example-panel`, `.example-zh`, `.example-vi` |
| [words.js](../../../words.js) | **Modify** | Add `examples` field to 8 Lesson 1 entries; update header docstring |
| [hanyu.html](../../../hanyu.html) | **Modify** | Append examples block to Character (`renderCard`) / Meaning (`renderWritingCard`) / Pinyin (`renderPinyinCard`) card backs |
| [lesson.html](../../../lesson.html) | **Modify** | (a) Wrap top controls in `<div class="top-controls">`; add `<div id="hsToolbar">` slot. (b) Add `.top-controls` CSS. (c) Move hsToolbar generation out of `render()` into `renderHsToolbar()`; wire from 5 callsites. (d) Add `例` button + expandable `.example-row` to vocab table. (e) Add `openExamples` Set + `toggleExample(n)` helper (page-specific, mirrors `openRadicals`/`toggleRadical`). |
| [CLAUDE.md](../../../CLAUDE.md) | **Modify** | Update `words[]` data shape section to document the optional `examples` field |

---

## Conventions

- All commits on `main` (solo project, no PR workflow). User has standing authorization.
- Commit messages **MUST NOT** contain AI attribution, Co-Authored-By lines, or 🤖 markers. Use the exact commit messages specified in each task.
- Local test server: `python3 -m http.server 8765` from repo root. Background it before Tasks 7, 10, 12.
- Playwright smoke uses the `example-skills:webapp-testing` skill — dispatched as a subagent after layout and example-surfacing tasks land.
- Each task is independently committable. Tasks are ordered so each one leaves the app working.

---

## Risk callouts

**Risk 1 — `renderHsToolbar` state-machine sync.** Five callsites must invoke it: `selectTab`, `selectLesson`, `startLessonHideSeek`, `stopLessonHideSeek`, `changeLessonHsMode`. If any is missed, the H&S strip will desync from reality (stuck in old state, or visible when it shouldn't be). Task 10 lists every site explicitly; Task 12 smoke-checks all transitions.

**Risk 2 — `render()` still injects `${hsToolbar}` into vocab-view.** After moving hsToolbar generation out, the `${hsToolbar}` template interpolation in `render()` must be removed or it'll produce duplicate (and now-undefined) content. Task 10 Step 3 explicitly deletes the interpolation site.

**Risk 3 — Demo example sentences using forward-reference characters.** Each seeded example must use ONLY characters that appear in Lesson 1. Task 5 lists each sentence with the Lesson 1 vocab it uses; verify before commit.

**Risk 4 — `examples` field accidentally breaks `pickChooseDistractors` or other word-iteration code.** The field is purely additive (other code never reads it). Smoke checks in Tasks 7 and 12 confirm Choose / Listen / Match all still work.

**Risk 5 — CSS specificity collision.** `.example-row` should not collide with the existing `.radical-row`. Task 4 uses a distinct `display: table-row` pattern matched 1:1 with the radical version; only color/background differs. CSS reviewed in Task 13.

---

## Total estimate

~3.5–4 hours of focused work, 13 commits.

---

## Task 1: Write failing tests for `exampleLines()`

**Goal:** Capture behavior contract for the new pure helper before implementing it.

**Files:** Modify: [tests/shared.test.html](../../../tests/shared.test.html)

- [ ] **Step 1: Add 5 test cases** to `tests/shared.test.html` immediately AFTER the `shuffle` tests block (before the `// ── Render results` comment).

Insert this block:

```js

// ── exampleLines ────────────────────────────────────────────────────────────
t('exampleLines returns empty array when no examples field', () => {
  const out = exampleLines({ char: '好' });
  eq(JSON.stringify(out), '[]');
});
t('exampleLines returns empty array when examples is empty', () => {
  const out = exampleLines({ char: '好', examples: [] });
  eq(JSON.stringify(out), '[]');
});
t('exampleLines returns one HTML line per example', () => {
  const out = exampleLines({ char: '你好', examples: [
    { zh: '你好，老师！', vi: 'Chào thầy/cô!' }
  ]});
  eq(out.length, 1);
  truthy(out[0].includes('你好，老师！'), 'zh present');
  truthy(out[0].includes('Chào thầy/cô!'), 'vi present');
  truthy(out[0].includes('example-zh'), 'has zh class');
  truthy(out[0].includes('example-vi'), 'has vi class');
});
t('exampleLines handles multiple examples', () => {
  const out = exampleLines({ char: '我', examples: [
    { zh: '我叫王。', vi: 'Tôi tên là Vương.' },
    { zh: '我是学生。', vi: 'Tôi là học sinh.' }
  ]});
  eq(out.length, 2);
});
t('exampleLines tolerates missing vi or zh fields gracefully', () => {
  const out = exampleLines({ char: '?', examples: [
    { zh: '只有中文' }  // no vi
  ]});
  eq(out.length, 1);
  truthy(out[0].includes('只有中文'), 'zh shown even without vi');
});
```

- [ ] **Step 2: Verify tests fail.** Cannot run a browser here, but static-verify:

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "exampleLines" shared.js  # expect 0 (function doesn't exist yet)
grep -c "exampleLines" tests/shared.test.html  # expect 5 (one per test)
```

When the user opens `http://localhost:8765/tests/shared.test.html`, all 5 new tests will fail with `exampleLines is not defined`.

- [ ] **Step 3: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add tests/shared.test.html
git commit -m "Add failing tests for exampleLines() helper"
```

**Estimate:** 10 min.

---

## Task 2: Implement `exampleLines()` in shared.js

**Goal:** Make Task 1's tests pass.

**Files:** Modify: [shared.js](../../../shared.js)

- [ ] **Step 1: Append the helper after `radicalPanelInner`.** Open `shared.js`. Find the existing `function radicalPanelInner(w) { ... }` (around line 108). Immediately AFTER its closing `}`, insert:

```js

function exampleLines(w) {
  if (!w.examples || !w.examples.length) return [];
  return w.examples.map(ex => {
    const zh = ex.zh || '';
    const vi = ex.vi || '';
    const viHtml = vi ? `<div class="example-vi">${vi}</div>` : '';
    return `<div class="example-pair"><div class="example-zh">${zh}</div>${viHtml}</div>`;
  });
}
```

- [ ] **Step 2: Verify via Node.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
node -e "
const fs = require('fs');
const code = fs.readFileSync('shared.js', 'utf-8');
const head = code.substring(0, code.indexOf('// ── Web Speech'));
// also need radicalLines (used by no helper here, but eval'd together)
eval(head);
// Now eval just exampleLines
const start = code.indexOf('function exampleLines');
const end = code.indexOf('}', code.indexOf('}', start) + 1) + 1;
eval(code.substring(start, end));

let p=0,f=0;
const T=(n,fn)=>{try{fn();p++;}catch(e){f++;console.log('FAIL',n,e.message);}};
T('empty without field', () => { if(JSON.stringify(exampleLines({char:'好'})) !== '[]') throw new Error('x'); });
T('empty with []', () => { if(JSON.stringify(exampleLines({char:'好',examples:[]})) !== '[]') throw new Error('x'); });
T('one example', () => { const o = exampleLines({char:'你好',examples:[{zh:'你好，老师！',vi:'Chào thầy/cô!'}]}); if(o.length!==1) throw new Error('len'); if(!o[0].includes('你好，老师！')) throw new Error('zh'); if(!o[0].includes('Chào thầy/cô!')) throw new Error('vi'); });
T('two examples', () => { const o = exampleLines({char:'我',examples:[{zh:'a',vi:'b'},{zh:'c',vi:'d'}]}); if(o.length!==2) throw new Error('x'); });
T('missing vi', () => { const o = exampleLines({char:'?',examples:[{zh:'只有中文'}]}); if(o.length!==1) throw new Error('len'); if(!o[0].includes('只有中文')) throw new Error('zh'); });
console.log(p,'pass,',f,'fail');
"
```

Expected output: `5 pass, 0 fail`.

- [ ] **Step 3: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add shared.js
git commit -m "Add exampleLines() helper to shared.js"
```

**Estimate:** 10 min.

---

## Task 3: Add example CSS to shared.css

**Goal:** Style the example block (used by both hanyu card backs and lesson table rows). Distinct from radical's blue palette — use muted green.

**Files:** Modify: [shared.css](../../../shared.css)

- [ ] **Step 1: Append example styles** to the end of [shared.css](../../../shared.css):

```css

/* ── Example sentences (per-word) ───────────────────────────────────────── */
.example-toggle { background: none; border: 1px solid var(--color-border-tertiary); cursor: pointer; font-size: 11px; color: #2d6a3e; padding: 1px 7px; border-radius: 4px; margin-left: 4px; vertical-align: middle; transition: background 0.12s, color 0.12s; font-family: inherit; line-height: 1.5; }
.example-toggle:hover { background: #eaf4ec; color: #1d4f2c; }
.example-toggle .arrow { font-size: 10px; margin-left: 2px; }
.example-row { display: none; }
.example-row.open { display: table-row; }
.example-row > td { padding: 0 10px 8px; border-bottom: 0.5px solid var(--color-border-tertiary); background: var(--color-background-primary); }
.example-panel { background: #eaf4ec; color: #1d4f2c; font-size: 12px; padding: 8px 12px; border-radius: 6px; line-height: 1.6; display: flex; flex-direction: column; gap: 6px; }
.example-pair { display: flex; flex-direction: column; gap: 1px; }
.example-zh { font-size: 14px; color: #1d4f2c; font-weight: 500; }
.example-vi { font-size: 12px; color: #4a6a55; font-style: italic; }
```

- [ ] **Step 2: Verify.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "^\.example-" shared.css  # expect 9 (toggle, toggle:hover, .arrow, row, row.open, row>td, panel, zh, vi — but .arrow nested counts differently). Use:
grep -E "^\.example" shared.css | wc -l  # expect ~9
```

- [ ] **Step 3: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add shared.css
git commit -m "Add example sentence styles to shared.css"
```

**Estimate:** 5 min.

---

## Task 4: Seed 8 demo `examples` in words.js (Lesson 1 only)

**Goal:** Make the feature visible without forcing the user to fill in data. Use ONLY Lesson 1 vocab — no forward references to later lessons.

**Files:** Modify: [words.js](../../../words.js)

The 8 target entries with the exact examples to add (each uses only Lesson 1 vocab: 你好, 好, 你, 是, 老师, 吗, 不, 我, 学生, 她, 谢谢, 您, 叫, 什么, 名字, 大卫, 王):

| Char | Examples to add |
|---|---|
| 你好 | `[{ zh: "你好，老师！", vi: "Chào thầy/cô!" }]` |
| 老师 | `[{ zh: "她是老师。", vi: "Cô ấy là giáo viên." }]` |
| 我 | `[{ zh: "我叫大卫。", vi: "Tôi tên là David." }]` |
| 你 | `[{ zh: "你叫什么名字？", vi: "Bạn tên là gì?" }]` |
| 是 | `[{ zh: "我是学生。", vi: "Tôi là học sinh." }]` |
| 吗 | `[{ zh: "你是学生吗？", vi: "Bạn có phải là học sinh không?" }]` |
| 谢谢 | `[{ zh: "谢谢老师！", vi: "Cảm ơn thầy/cô!" }]` |
| 不 | `[{ zh: "我不是老师。", vi: "Tôi không phải là giáo viên." }]` |

- [ ] **Step 1: Open [words.js](../../../words.js).** Locate each of the 8 entries above (they're all in the Lesson 1 section, lines ~11–25). For each entry, append `, examples: [...]` AFTER the existing `radical` field (or after `hv` if no `radical`).

Example — change line 11 from:
```js
{ char:"你好",   pinyin:"nǐ hǎo",       pos:"",      viet:"chào bạn",                                          lesson:1, hv:"NỄ HẢO — lit. 'bạn tốt' = chào", radical:"你 = 亻(NHÂN — người) + 尔(NHĨ — bạn) → một người gọi 'bạn' | 好 = 女(NỮ — phụ nữ) + 子(TỬ — con) → mẹ bồng con = tốt/lành" },
```

To:
```js
{ char:"你好",   pinyin:"nǐ hǎo",       pos:"",      viet:"chào bạn",                                          lesson:1, hv:"NỄ HẢO — lit. 'bạn tốt' = chào", radical:"你 = 亻(NHÂN — người) + 尔(NHĨ — bạn) → một người gọi 'bạn' | 好 = 女(NỮ — phụ nữ) + 子(TỬ — con) → mẹ bồng con = tốt/lành", examples:[{ zh:"你好，老师！", vi:"Chào thầy/cô!" }] },
```

Apply the same pattern to the other 7 entries:
- 老师 → `examples:[{ zh:"她是老师。", vi:"Cô ấy là giáo viên." }]`
- 我 → `examples:[{ zh:"我叫大卫。", vi:"Tôi tên là David." }]`
- 你 → `examples:[{ zh:"你叫什么名字？", vi:"Bạn tên là gì?" }]`
- 是 → `examples:[{ zh:"我是学生。", vi:"Tôi là học sinh." }]`
- 吗 → `examples:[{ zh:"你是学生吗？", vi:"Bạn có phải là học sinh không?" }]`
- 谢谢 → `examples:[{ zh:"谢谢老师！", vi:"Cảm ơn thầy/cô!" }]`
- 不 → `examples:[{ zh:"我不是老师。", vi:"Tôi không phải là giáo viên." }]`

- [ ] **Step 2: Update the docstring** at the top of [words.js](../../../words.js). Currently:

```js
/**
 * Chinese Vocabulary Data
 *
 * To add a new word, just append to the array — `n` is assigned automatically.
 *   { char: "汉字", pinyin: "pīnyīn", pos: "n.", viet: "nghĩa tiếng Việt", lesson: <number> }
 *
 * pos options: n. (noun), v. (verb), pron. (pronoun), adv. (adverb), adj. (adjective), part. (particle), suff. (suffix), q. (quantifier), or "" (none)
 */
```

Change to:
```js
/**
 * Chinese Vocabulary Data
 *
 * To add a new word, just append to the array — `n` is assigned automatically.
 *   { char: "汉字", pinyin: "pīnyīn", pos: "n.", viet: "nghĩa tiếng Việt", lesson: <number> }
 *
 * pos options: n. (noun), v. (verb), pron. (pronoun), adv. (adverb), adj. (adjective), part. (particle), suff. (suffix), q. (quantifier), or "" (none)
 *
 * Optional fields:
 *   hv: "<Hán Việt explanation>"
 *   radical: "<char1 = radical breakdown | char2 = ...>" (use | between characters)
 *   examples: [{ zh: "Chinese sentence", vi: "Vietnamese translation" }, ...]
 */
```

- [ ] **Step 3: Verify all 8 examples landed and use only Lesson 1 chars.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "examples:" words.js  # expect 8
# Spot-check that the examples sentences contain only chars present in Lesson 1.
# (No automated check possible; trust the table above.)
```

- [ ] **Step 4: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add words.js
git commit -m "Add example sentences to 8 Lesson 1 words; document examples field"
```

**Estimate:** 15 min.

---

## Task 5: Wire `hanyu.html` Character mode card back

**Goal:** Show examples on the back face of Character mode cards (`renderCard`).

**Files:** Modify: [hanyu.html](../../../hanyu.html)

- [ ] **Step 1: Locate the card-back block in `renderCard`** (around line 926). Currently:

```html
          <div class="card-face card-back">
            <div class="card-char">${w.char} ${audioBtn(w.char)}</div>
            <div class="card-pinyin">${w.pinyin}</div>
            <div class="card-meaning">${w.viet}</div>
            ${w.hv ? `<div style="font-size:12px;color:#7c5c00;background:#fdf3dc;border-radius:6px;padding:3px 10px;margin-top:6px">✨ ${w.hv}</div>` : ''}
            <div class="card-pos">${posHtml}</div>
            <div id="answerFeedback"></div>
          </div>
```

- [ ] **Step 2: Insert examples between hv hint and card-pos.** Add the examples block right after the hv line:

```html
          <div class="card-face card-back">
            <div class="card-char">${w.char} ${audioBtn(w.char)}</div>
            <div class="card-pinyin">${w.pinyin}</div>
            <div class="card-meaning">${w.viet}</div>
            ${w.hv ? `<div style="font-size:12px;color:#7c5c00;background:#fdf3dc;border-radius:6px;padding:3px 10px;margin-top:6px">✨ ${w.hv}</div>` : ''}
            ${exampleLines(w).length ? `<div class="example-panel" style="margin-top:8px;max-width:90%">${exampleLines(w).join('')}</div>` : ''}
            <div class="card-pos">${posHtml}</div>
            <div id="answerFeedback"></div>
          </div>
```

The only new line is the `${exampleLines(w).length ? ...}` between `hv` hint and `card-pos`.

- [ ] **Step 3: Verify the edit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "exampleLines(w)" hanyu.html  # expect 2 (the .length check and the .join — both on the same line)
```

- [ ] **Step 4: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add hanyu.html
git commit -m "Show examples on Character mode card back in hanyu.html"
```

**Estimate:** 5 min.

---

## Task 6: Wire `hanyu.html` Meaning + Pinyin card backs

**Goal:** Surface examples on the other two card-back-bearing modes.

**Files:** Modify: [hanyu.html](../../../hanyu.html)

- [ ] **Step 1: Update `renderWritingCard` card-back** (around line 1080). Find:

```html
          <div class="card-face card-back">
            <div class="card-char">${w.char} ${audioBtn(w.char)}</div>
            <div class="card-pinyin">${w.pinyin}</div>
            <div class="card-meaning">${w.viet}</div>
            ${w.hv ? `<div style="font-size:12px;color:#7c5c00;background:#fdf3dc;border-radius:6px;padding:3px 10px;margin-top:6px">✨ ${w.hv}</div>` : ''}
            <div id="wrFeedback"></div>
          </div>
```

Insert the examples block AFTER hv, BEFORE `<div id="wrFeedback">`:

```html
          <div class="card-face card-back">
            <div class="card-char">${w.char} ${audioBtn(w.char)}</div>
            <div class="card-pinyin">${w.pinyin}</div>
            <div class="card-meaning">${w.viet}</div>
            ${w.hv ? `<div style="font-size:12px;color:#7c5c00;background:#fdf3dc;border-radius:6px;padding:3px 10px;margin-top:6px">✨ ${w.hv}</div>` : ''}
            ${exampleLines(w).length ? `<div class="example-panel" style="margin-top:8px;max-width:90%">${exampleLines(w).join('')}</div>` : ''}
            <div id="wrFeedback"></div>
          </div>
```

- [ ] **Step 2: Update `renderPinyinCard` card-back** (around line 1222). Find:

```html
          <div class="card-face card-back">
            <div class="card-char">${w.char} ${audioBtn(w.char)}</div>
            <div class="card-pinyin">${w.pinyin}</div>
            <div class="card-meaning">${w.viet}</div>
            ${w.hv ? `<div style="font-size:12px;color:#7c5c00;background:#fdf3dc;border-radius:6px;padding:3px 10px;margin-top:6px">✨ ${w.hv}</div>` : ''}
            <div id="pyFeedback"></div>
          </div>
```

Insert examples the same way:

```html
          <div class="card-face card-back">
            <div class="card-char">${w.char} ${audioBtn(w.char)}</div>
            <div class="card-pinyin">${w.pinyin}</div>
            <div class="card-meaning">${w.viet}</div>
            ${w.hv ? `<div style="font-size:12px;color:#7c5c00;background:#fdf3dc;border-radius:6px;padding:3px 10px;margin-top:6px">✨ ${w.hv}</div>` : ''}
            ${exampleLines(w).length ? `<div class="example-panel" style="margin-top:8px;max-width:90%">${exampleLines(w).join('')}</div>` : ''}
            <div id="pyFeedback"></div>
          </div>
```

- [ ] **Step 3: Verify.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "exampleLines(w)" hanyu.html  # expect 6 (2 per card-back × 3 modes)
```

- [ ] **Step 4: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add hanyu.html
git commit -m "Show examples on Meaning + Pinyin card backs in hanyu.html"
```

**Estimate:** 5 min.

---

## Task 7: Playwright smoke check for hanyu.html examples

**Goal:** Verify examples appear on card backs and don't break any of the 6 study modes.

**Setup (controller):** start the server if not already running:
```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
python3 -m http.server 8765 &
```

**Dispatch a smoke-check subagent** with this prompt:

> Playwright smoke check against `http://localhost:8765/hanyu.html`. Use `example-skills:webapp-testing` skill.
>
> **Background:** Examples (`examples: [{zh, vi}]`) were just added to 8 Lesson 1 words and surfaced on card backs of Character / Meaning / Pinyin modes.
>
> **Checks:**
> 1. Navigate to hanyu.html. Zero JS console errors expected.
> 2. Use the Lesson filter dropdown — pick "Lesson 1".
> 3. Click "Character" mode. Click "Check" (or fill an answer to flip). Verify the card back shows the `.example-panel` block with `.example-zh` and `.example-vi` content. Try cycling cards until you hit a seeded word (你好, 老师, 我, 你, 是, 吗, 谢谢, 不) — at least one of the first 10 cards should have examples.
> 4. Click "Meaning" mode. Same verification on the card back.
> 5. Click "Pinyin" mode. Same verification on the card back.
> 6. Click "Browse" — confirm vocab table renders (no regressions).
> 7. Click "Choose" — confirm a question card renders (regression check for `pickChooseDistractors`).
> 8. Click "Listen" — confirm a card renders.
> 9. Click "Match" — confirm 8 tiles render.
> 10. Cards that have NO `examples` field should not show an empty `.example-panel` — should be absent entirely.
> 11. Screenshot: `/tmp/smoke-baseline/task7-hanyu-examples.png`.
>
> Report: PASS / FAIL with console errors list, which seeded examples were observed, and which modes were verified.

- [ ] **If smoke PASS:** mark task complete.

- [ ] **If smoke FAIL:** read the report, identify the broken card back or mode, fix with a follow-up Edit before continuing.

**Estimate:** 15 min (smoke runs autonomously).

---

## Task 8: Add `例` toggle button to lesson.html vocab table

**Goal:** Add an "例" button next to the existing `分析` button on rows where `w.examples?.length > 0`. Clicking it expands a `.example-row` panel beneath, just like the radical pattern.

**Files:** Modify: [lesson.html](../../../lesson.html)

- [ ] **Step 1: Add page-specific state + helpers** to the lesson.html inline `<script>`. Locate where `radicalLines` etc. used to live (now empty — those came from shared.js). Insert this block AFTER the `selectTab` function (around line 391, just before `function render()`):

```js

/* ── Example sentences (per-word, expandable in lesson vocab table) ─────── */
const openExamples = new Set();  // word.n values currently expanded

function exampleToggleHtml(w) {
  if (!w.examples || !w.examples.length) return '';
  const arrowId = `example-arrow-${w.n}`;
  const arrow = openExamples.has(w.n) ? '▴' : '▾';
  return `<button class="example-toggle" onclick="toggleExample(${w.n})" title="Ví dụ"><span class="arrow" id="${arrowId}">${arrow}</span> 例</button>`;
}

function toggleExample(n) {
  const isOpen = openExamples.has(n);
  if (isOpen) openExamples.delete(n); else openExamples.add(n);
  const row = document.getElementById(`example-row-${n}`);
  if (row) row.classList.toggle('open', !isOpen);
  const arrow = document.getElementById(`example-arrow-${n}`);
  if (arrow) arrow.textContent = isOpen ? '▾' : '▴';
}
```

- [ ] **Step 2: Modify the `render()` word-row builder.** Locate the wordRows map in `render()` (around lines 418–438). Currently the cell with the char + radical toggle:

```js
    const radToggle = radicalToggleHtml(w);
    const radRow = w.radical
      ? `<tr class="radical-row${openRadicals.has(w.n) ? ' open' : ''}" id="radical-row-${w.n}"><td colspan="${colspan}"><div class="radical-panel">${radicalPanelInner(w)}</div></td></tr>`
      : '';
    return `
    <tr>
      <td style="color:var(--color-text-tertiary); font-size:13px;">${i + 1}</td>
      <td>${charCell}${radToggle}</td>
      <td>${pinyinCell}</td>
      ...
    </tr>${radRow}`;
```

Change to add the `例` button + example row:

```js
    const radToggle = radicalToggleHtml(w);
    const exToggle = exampleToggleHtml(w);
    const radRow = w.radical
      ? `<tr class="radical-row${openRadicals.has(w.n) ? ' open' : ''}" id="radical-row-${w.n}"><td colspan="${colspan}"><div class="radical-panel">${radicalPanelInner(w)}</div></td></tr>`
      : '';
    const exRow = (w.examples && w.examples.length)
      ? `<tr class="example-row${openExamples.has(w.n) ? ' open' : ''}" id="example-row-${w.n}"><td colspan="${colspan}"><div class="example-panel">${exampleLines(w).join('')}</div></td></tr>`
      : '';
    return `
    <tr>
      <td style="color:var(--color-text-tertiary); font-size:13px;">${i + 1}</td>
      <td>${charCell}${radToggle}${exToggle}</td>
      <td>${pinyinCell}</td>
      ...
    </tr>${radRow}${exRow}`;
```

(Keep the middle `...` rows — pinyin/pos/viet/hv/checkCell — exactly as they are. Only `${exToggle}` is added to the char cell, and `${exRow}` is appended after `${radRow}` in the return template.)

- [ ] **Step 3: Verify.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "exampleToggleHtml\|toggleExample\|openExamples\|exampleLines" lesson.html  # expect ~7 (1 def each for first 3 + 1-2 callsites + exampleLines used in 1 spot)
grep -c "example-row" lesson.html  # expect ~3 (in the render template)
```

- [ ] **Step 4: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add lesson.html
git commit -m "Add 例 toggle button + expandable row to lesson.html vocab table"
```

**Estimate:** 15 min.

---

## Task 9: Playwright smoke check for lesson.html examples

**Goal:** Verify the `例` button appears, toggles correctly, and doesn't disturb radical or H&S behavior.

**Dispatch a smoke-check subagent** with this prompt:

> Playwright smoke check against `http://localhost:8765/lesson.html` (Vocabulary tab, Lesson 1). Use `example-skills:webapp-testing` skill.
>
> **Background:** A new `例` (examples) toggle button was added next to the existing `分析` (radical) button. It should appear only on rows where the word has examples (8 seeded words in Lesson 1).
>
> **Checks:**
> 1. Navigate to lesson.html. Zero JS console errors.
> 2. Confirm Lesson 1 is selected by default (or select it).
> 3. Count `.example-toggle` buttons in the table — expect 8 (one per seeded word).
> 4. Click the `例` button on the first seeded word (你好). Verify:
>    - `#example-row-N` (where N is its `n` value) gains class `open`
>    - `.example-panel` becomes visible
>    - `.example-zh` and `.example-vi` content visible
>    - Arrow flips from ▾ to ▴
> 5. Click `例` again on the same row. Verify it collapses (loses `open` class, arrow back to ▾).
> 6. Click `分析` on a word with both buttons — verify radical row opens independently (both can be open at the same time).
> 7. Click `Hide & Seek` toolbar button. Verify H&S still works (inputs appear in rows; rows shuffle).
> 8. Click `Stop` to exit H&S. Verify return to normal state.
> 9. Switch to Grammar tab → switch back to Vocabulary. Verify table re-renders cleanly with `例` buttons still working.
> 10. Screenshot: `/tmp/smoke-baseline/task9-lesson-examples.png`.
>
> Report: PASS / FAIL with details for any failure.

- [ ] **If smoke PASS:** mark complete.
- [ ] **If smoke FAIL:** fix before proceeding.

**Estimate:** 15 min.

---

## Task 10: Restructure lesson.html top into single row

**Goal:** Wrap lesson select + inner tabs + H&S slot in `.top-controls` flex container; move H&S generation out of `render()` into `renderHsToolbar()`. H&S only visible on Vocabulary tab.

**Files:** Modify: [lesson.html](../../../lesson.html)

This is the largest task (5 separate sub-changes) — split commits if you prefer, but the spec allows one commit since all changes are interlocking.

- [ ] **Step 1: Add `.top-controls` CSS** to lesson.html's inline `<style>`. Insert just BEFORE the existing `.hs-toolbar` rule (around line 23):

```css

/* Single-row top controls — lesson select + inner tabs + H&S slot */
.top-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 1.25rem; }
.top-controls .lesson-select { margin-bottom: 0; }
.top-controls .inner-tabs { margin-bottom: 0; }
.top-controls #hsToolbar { margin-bottom: 0; margin-left: auto; }
.top-controls #hsToolbar:empty { display: none; }
@media (max-width: 600px) {
  .top-controls .lesson-select { flex: 1 1 100%; }
  .top-controls #hsToolbar { margin-left: 0; }
}
```

Also, the existing `.hs-toolbar { margin-bottom: 1rem; }` rule should remain (it's inherited inside `#hsToolbar`), but the `margin-bottom` is overridden by the `#hsToolbar` rule above. The existing `.lesson-select { ... margin-bottom: 2rem; ... }` (line 6) also gets overridden by `.top-controls .lesson-select` — no need to change line 6.

- [ ] **Step 2: Wrap the 3 controls in HTML.** Find the existing markup in lesson.html (around lines 211–219):

```html
<div class="wrap">
  <select id="lessonSelect" class="lesson-select" onchange="selectLesson(Number(this.value))">
  </select>

  <div class="inner-tabs">
    <button class="inner-tab active" data-tab="vocabulary" onclick="selectTab('vocabulary')">Vocabulary</button>
    <button class="inner-tab" data-tab="grammar" onclick="selectTab('grammar')">Grammar</button>
    <button class="inner-tab" data-tab="quiz" onclick="selectTab('quiz')">Quiz</button>
  </div>
```

Replace with:

```html
<div class="wrap">
  <div class="top-controls">
    <select id="lessonSelect" class="lesson-select" onchange="selectLesson(Number(this.value))">
    </select>

    <div class="inner-tabs">
      <button class="inner-tab active" data-tab="vocabulary" onclick="selectTab('vocabulary')">Vocabulary</button>
      <button class="inner-tab" data-tab="grammar" onclick="selectTab('grammar')">Grammar</button>
      <button class="inner-tab" data-tab="quiz" onclick="selectTab('quiz')">Quiz</button>
    </div>

    <div id="hsToolbar"></div>
  </div>
```

(Keep the rest of `<div class="wrap">` body — `<div id="vocab-view">`, `<div id="grammar-view">`, `<div id="quiz-view">` — exactly as is.)

- [ ] **Step 3: Move hsToolbar generation out of `render()`.** In the inline `<script>`, locate `function render()` (around line 392). The current `render()` builds a local `hsToolbar` variable (around lines 405–415) and then interpolates `${hsToolbar}` into `document.getElementById('vocab-view').innerHTML` (around line 472).

Delete the local `hsToolbar` build block (lines ~405–415):

```js
  const hsToolbar = lessonWords.length ? (lessonHsMode ? `
    <div class="hs-toolbar">
      <select id="hsModeSelect" class="hs-mode-select" onchange="changeLessonHsMode()">${modeOptions}</select>
      <button class="hs-btn primary" onclick="checkAllLessonHs()">Check All</button>
      <button class="hs-btn" onclick="stopLessonHideSeek()">Stop</button>
      <div class="hs-score" id="hsScore" style="display:none"></div>
    </div>` : `
    <div class="hs-toolbar">
      <button class="hs-btn primary" onclick="startLessonHideSeek()">Hide &amp; Seek</button>
      <select id="hsModeSelect" class="hs-mode-select">${modeOptions}</select>
    </div>`) : '';
```

Also keep the `modeOptions` computation (lines ~400–403) — `renderHsToolbar()` will need it too. Wait — `modeOptions` IS only used by `hsToolbar` now. Move it INTO `renderHsToolbar()`. So delete both `modeOptions` and `hsToolbar` from `render()`. The cleanest approach:

Remove lines ~400–415 (both `modeOptions` and the `hsToolbar` build).

Then in the innerHTML template (line ~472), change:
```js
  document.getElementById('vocab-view').innerHTML = lessonWords.length ? `
    ${hsToolbar}
    <table>
```

To:
```js
  document.getElementById('vocab-view').innerHTML = lessonWords.length ? `
    <table>
```

(Just remove the `${hsToolbar}` line.)

- [ ] **Step 4: Add `renderHsToolbar()` function.** Insert immediately AFTER the `selectTab` function (around line 391, the same block where you added `openExamples` in Task 8 — put this BEFORE the `Example sentences` block, OR after — doesn't matter, but pick one and be consistent):

```js

/* ── Hide & Seek toolbar (lives in #hsToolbar slot inside .top-controls) ─ */
function renderHsToolbar() {
  const slot = document.getElementById('hsToolbar');
  if (!slot) return;
  // Only show when on the Vocabulary tab and the current lesson has words.
  const hasWords = words.some(w => w.lesson === currentLesson);
  if (currentTab !== 'vocabulary' || !hasWords) {
    slot.innerHTML = '';
    return;
  }
  const modeOptions = ['random', 'char', 'pinyin', 'viet', 'pinyin-viet'].map(v => {
    const label = { random: 'Random mix', char: 'Characters only', pinyin: 'Pinyin only', viet: 'Meanings only', 'pinyin-viet': 'Pinyin + Meanings' }[v];
    return `<option value="${v}"${lessonHsField === v ? ' selected' : ''}>${label}</option>`;
  }).join('');
  slot.innerHTML = lessonHsMode ? `
    <div class="hs-toolbar">
      <select id="hsModeSelect" class="hs-mode-select" onchange="changeLessonHsMode()">${modeOptions}</select>
      <button class="hs-btn primary" onclick="checkAllLessonHs()">Check All</button>
      <button class="hs-btn" onclick="stopLessonHideSeek()">Stop</button>
      <div class="hs-score" id="hsScore" style="display:none"></div>
    </div>` : `
    <div class="hs-toolbar">
      <button class="hs-btn primary" onclick="startLessonHideSeek()">Hide &amp; Seek</button>
      <select id="hsModeSelect" class="hs-mode-select">${modeOptions}</select>
    </div>`;
}
```

- [ ] **Step 5: Wire `renderHsToolbar()` from 5 callsites.** Each call should be added at the END of the relevant function (after any existing `render()` call):

**5a. `selectLesson` (around line 368)** — already calls `render()` at the end. Add `renderHsToolbar()` right after:

```js
function selectLesson(n) {
  currentLesson = n;
  if (lessonHsMode) {
    lessonHsMode = false;
    lessonHsHidden = {};
    lessonHsOrder = {};
  }
  const sel = document.getElementById('lessonSelect');
  if (sel) sel.value = n;
  render();
  renderHsToolbar();
}
```

**5b. `selectTab` (around line 381)** — currently does NOT call render. Add `renderHsToolbar()` at the end:

```js
function selectTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.inner-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.getElementById('vocab-view').style.display = tab === 'vocabulary' ? '' : 'none';
  document.getElementById('grammar-view').style.display = tab === 'grammar' ? '' : 'none';
  document.getElementById('quiz-view').style.display = tab === 'quiz' ? '' : 'none';
  if (tab === 'quiz' && !quizActive) renderQuizIntro();
  renderHsToolbar();
}
```

**5c. `startLessonHideSeek` (around line 266)** — at the end:

```js
function startLessonHideSeek() {
  // ... existing body ...
  render();
  renderHsToolbar();
}
```

**5d. `stopLessonHideSeek` (around line 283)**:

```js
function stopLessonHideSeek() {
  lessonHsMode = false;
  lessonHsHidden = {};
  lessonHsOrder = {};
  render();
  renderHsToolbar();
}
```

**5e. `changeLessonHsMode` (around line 290)**:

```js
function changeLessonHsMode() {
  // If currently active, restart with the new field selection.
  if (lessonHsMode) startLessonHideSeek();
  // (startLessonHideSeek already calls renderHsToolbar; no double-call needed)
}
```

(`changeLessonHsMode` only calls `renderHsToolbar` via the `startLessonHideSeek` it triggers — no separate call. But if `lessonHsMode === false`, `changeLessonHsMode` does nothing, so no call needed in that branch either.)

- [ ] **Step 6: Initial call at page load.** Locate the `// ── Init ──` block at the bottom of the inline `<script>` (around line 1648). Currently:

```js
/* ── Init ── */
renderLessonButtons();
populateLessonSelects();
```

(There may also be a `render()` call already — check.) Add `renderHsToolbar()` after the existing initialization calls:

```js
/* ── Init ── */
renderLessonButtons();
populateLessonSelects();
render();              // if not already present
renderHsToolbar();
```

(If `render()` is already there, just append `renderHsToolbar()`. If neither is, add both.)

- [ ] **Step 7: Verify.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "renderHsToolbar" lesson.html  # expect 7 (1 def + 6 callsites: init + 5 wires; but changeLessonHsMode doesn't call it directly, so actually 6)
grep -c "function renderHsToolbar" lesson.html  # expect 1
grep -c '<div id="hsToolbar">' lesson.html  # expect 1
grep -c "\${hsToolbar}" lesson.html  # expect 0 (interpolation must be gone)
grep -c "class=\"top-controls\"" lesson.html  # expect 1
```

- [ ] **Step 8: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add lesson.html
git commit -m "Compact lesson.html top into single row; move H&S into persistent slot"
```

**Estimate:** 35 min.

---

## Task 11: Playwright smoke check for lesson layout

**Goal:** Verify the new single-row layout, tab switching hides H&S, and Hide & Seek functionality still works.

**Dispatch a smoke-check subagent** with this prompt:

> Playwright smoke check against `http://localhost:8765/lesson.html`. Use `example-skills:webapp-testing` skill.
>
> **Background:** Lesson.html top controls were just restructured: lesson select + inner tabs + Hide & Seek button are now in a single flex row (`.top-controls`). H&S should be visible on Vocabulary tab and HIDDEN on Grammar / Quiz tabs.
>
> **Checks:**
> 1. Navigate to lesson.html. Zero JS console errors.
> 2. Verify `.top-controls` exists and contains: `#lessonSelect`, `.inner-tabs`, `#hsToolbar`.
> 3. On default Vocabulary tab: verify `#hsToolbar` is NOT empty (has "Hide & Seek" button + mode select).
> 4. Click "Grammar" tab. Verify `#hsToolbar` is EMPTY (innerHTML === '' or its rendered height is 0 due to `:empty` CSS rule).
> 5. Click "Quiz" tab. Verify `#hsToolbar` is EMPTY.
> 6. Click "Vocabulary" tab again. Verify `#hsToolbar` is repopulated with the H&S button.
> 7. Click "Hide & Seek" button. Verify:
>    - `#hsToolbar` content swaps to show Check All + Stop buttons
>    - Inputs appear in vocab table rows
> 8. Click "Stop" button. Verify:
>    - `#hsToolbar` swaps back to "Hide & Seek" + mode select
>    - Inputs disappear from vocab rows
> 9. Start H&S → switch to Grammar tab. Verify `#hsToolbar` is empty (H&S effectively paused from the UI view). Switch back to Vocabulary — verify state shows correctly (either resumes H&S or back to the start button).
> 10. Change lesson dropdown to Lesson 2. Verify everything still works.
> 11. Visually verify single-row layout (no vertical wasted space) at desktop width (1200px viewport).
> 12. Resize viewport to 400px mobile width. Verify controls wrap gracefully (lesson select full-width, tabs + H&S below).
> 13. Screenshots: `/tmp/smoke-baseline/task11-lesson-desktop.png` and `task11-lesson-mobile.png`.
>
> Report: PASS / FAIL with detail on each check, especially the H&S visibility transitions.

- [ ] **If smoke PASS:** mark complete.
- [ ] **If smoke FAIL:** investigate. Most likely culprits: (a) one of the 5 wires missing → `renderHsToolbar` not called; (b) the `${hsToolbar}` interpolation not removed from `render()` → duplicate content; (c) the `:empty` selector not applying on Grammar/Quiz tabs.

**Estimate:** 15 min.

---

## Task 12: Update CLAUDE.md data shapes section

**Goal:** Document the new optional `examples` field.

**Files:** Modify: [CLAUDE.md](../../../CLAUDE.md)

- [ ] **Step 1: Locate the `words[]` data shape section.** Currently:

```js
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

- [ ] **Step 2: Add the `examples` field** between `radical` and `n`. Change to:

```js
{
  char: "你好",
  pinyin: "nǐ hǎo",           // tones as combining diacritics; "v" written for "ü"
  pos: "n.",                  // "" | n. | v. | pron. | adv. | adj. | part. | suff. | mw. | num. | q.
  viet: "chào bạn",            // comma-separates synonyms; parentheticals stripped on match
  lesson: 1,
  hv: "...",                   // optional Hán Việt explanation
  radical: "...",              // optional radical/etymology breakdown, "|"-separated for multi-char words
  examples: [                  // optional; surfaced on hanyu flashcard backs + as a 例 expand-row on lesson.html vocab table
    { zh: "你好，老师！", vi: "Chào thầy/cô!" }
  ],
  n: 12,                       // auto-assigned at file end; do not hand-set
}
```

- [ ] **Step 3: Update the "Shared module" section** to note `exampleLines`. Find the "Pure helpers" list and add a new line under it (or extend the "DOM helpers" list since `exampleLines` is a pure helper that returns HTML strings — it's a pure helper despite returning HTML). Add to the **Pure helpers** list:

Find:
```
- `posClass(pos)` — maps a POS string to a CSS class name; expects the trailing dot (e.g., `"n."`)
- `shuffle(arr)` — Fisher-Yates; returns a new array
```

Add a line after `shuffle`:
```
- `exampleLines(w)` — returns an array of HTML strings, one per `w.examples[]` entry; empty array if no examples
```

- [ ] **Step 4: Verify.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -c "examples:" CLAUDE.md  # expect at least 2 (the field declaration + the example value)
grep -c "exampleLines" CLAUDE.md  # expect 1
```

- [ ] **Step 5: Commit.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git add CLAUDE.md
git commit -m "Document examples field and exampleLines helper in CLAUDE.md"
```

**Estimate:** 10 min.

---

## Task 13: Final pass — no leftover duplicates, dead code, or layout regressions

**Goal:** Verify the bundled work is clean.

- [ ] **Step 1: Check for orphan `hsToolbar` references.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
grep -n "hsToolbar" lesson.html
```

Expected matches: the `<div id="hsToolbar">` element, the `function renderHsToolbar`, all `renderHsToolbar()` callsites, and the `#hsToolbar` selector in CSS. NO `const hsToolbar = ...` (deleted) and NO `${hsToolbar}` (deleted).

- [ ] **Step 2: Check for orphan `modeOptions` references.**

```bash
grep -n "modeOptions" lesson.html
```

Expected: ONE definition inside `renderHsToolbar()`, ZERO outside. The old definition in `render()` should be gone.

- [ ] **Step 3: Run the test suite once more (via the static node check).**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
node -e "
const fs = require('fs');
const code = fs.readFileSync('shared.js', 'utf-8');
const head = code.substring(0, code.indexOf('// ── Web Speech'));
eval(head);
const start = code.indexOf('function exampleLines');
const end = code.indexOf('}', code.indexOf('}', start) + 1) + 1;
eval(code.substring(start, end));
let p=0,f=0;
const T=(n,fn)=>{try{fn();p++;}catch(e){f++;console.log('FAIL',n,e.message);}};
T('e1', () => { if(JSON.stringify(exampleLines({char:'好'})) !== '[]') throw new Error('x'); });
T('e2', () => { const o = exampleLines({char:'你好',examples:[{zh:'你好，老师！',vi:'Chào thầy/cô!'}]}); if(o.length!==1) throw new Error('x'); });
T('shuffle', () => { const o = shuffle([1,2,3]); if(o.length!==3) throw new Error('x'); });
T('posClass num.', () => { if(posClass('num.')!=='other') throw new Error('x'); });
console.log(p,'pass,',f,'fail');
"
```

Expected: `4 pass, 0 fail`.

- [ ] **Step 4: Visual diff summary.**

```bash
cd "/Users/daniel/WorkStation/Giao Trinh TQ/learn-web"
git log --oneline 4267c81^..HEAD
git diff --stat 4267c81^..HEAD
```

Confirm:
- ~11–13 commits with clean messages (no AI attribution)
- Roughly: +20 lines shared.js, +12 lines shared.css, +30 lines tests, +50 lines lesson.html, +20 lines hanyu.html, +10 lines words.js, +5 lines CLAUDE.md (very rough)

- [ ] **Step 5: Stop the local server** if you started it for smoke checks.

```bash
pkill -f "http.server 8765" 2>/dev/null
```

**Estimate:** 10 min.

---

## Spec coverage check

| Spec section | Covered by |
|---|---|
| Part 1 — top-controls wrapper | Task 10 Steps 1–2 |
| Part 1 — renderHsToolbar function | Task 10 Steps 3–4 |
| Part 1 — wired from 5 callsites | Task 10 Step 5 (5a–5e) |
| Part 1 — `:empty` H&S hiding | Task 10 Step 1 CSS |
| Part 1 — mobile responsive | Task 10 Step 1 media query |
| Part 1 — risk: `${hsToolbar}` removed | Task 10 Step 3 |
| Part 2 — `examples` data shape | Task 4 |
| Part 2 — `exampleLines` helper | Task 1 + Task 2 |
| Part 2 — shared.css for examples | Task 3 |
| Part 2 — card backs (Char / Meaning / Pinyin) | Tasks 5 + 6 |
| Part 2 — 例 expand-row in lesson table | Task 8 |
| Part 2 — demo seed (8 words) | Task 4 |
| Part 2 — CLAUDE.md docs | Task 12 |
| Out-of-scope deferrals | Not implemented — confirmed |

All spec items covered.
