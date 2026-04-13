# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chinese vocabulary flashcard app for Vietnamese speakers. Single-page static site — no build tools, no framework, no dependencies.

## Architecture

- **`chinese_vocab_study.html`** — The entire app: CSS styles, HTML structure, and all JavaScript logic (SRS engine, UI rendering, event handling). Uses CSS custom variables with fallback values in `:root`.
- **`words.js`** — Vocabulary data array. Each word has `char`, `pinyin`, `pos`, `viet`, `lesson`. The `n` field is auto-assigned at the bottom of the file (`words.forEach`), so never hardcode it.

### Three modes (tab-based):
1. **Browse Table** — searchable/filterable vocabulary table
2. **Flashcards** — shows Chinese character, user types pinyin, card flips to reveal answer. Uses SM-2 spaced repetition with weighted shuffle (harder cards appear more often).
3. **Write Chinese** — shows Vietnamese meaning + POS, user types Chinese character. Shares SRS data with Flashcards.

### SRS Data
- Stored in `localStorage` key `"srs_cards"`
- Per-card record: `{ easeFactor, interval, repetitions, dueDate, lastReview, state, weight }`
- Weight system: Forgot=4, Hard=3, Good=2 (default), Easy=1. Higher weight = more likely to appear.
- `buildQueue()` respects card count limit from dropdown and uses `weightedShuffle()`.

## Adding Words

Add entries to `words.js` before the `// ── Add new words below ──` comment. No `n` field needed:
```js
{ char:"大", pinyin:"dà", pos:"adj.", viet:"to, lớn", lesson:4 },
```

If adding a new lesson number, update the lesson filter `<select>` dropdowns in the HTML (there are 3: browse, flashcard, writing).

## Deployment

Static files served via GitHub Pages from `main` branch. Remote: `https://github.com/danielNg25/chinese-flashcard`

## Commit Convention

Do not include AI attribution or co-author lines in commits.
