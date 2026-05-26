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
