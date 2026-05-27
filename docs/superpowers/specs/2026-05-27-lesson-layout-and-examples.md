# Lesson Layout + Example Sentences — Design Spec

**Date:** 2026-05-27
**Scope:** Two bundled improvements:
1. **Lesson.html top controls compaction** — collapse 3 stacked rows (lesson select / inner tabs / Hide & Seek) into a single horizontal row, with Hide & Seek auto-hidden on Grammar/Quiz tabs.
2. **CS-1 — Example sentences per word** — add an optional `examples: [{zh, vi}]` field to vocabulary entries, surfaced on flashcard card backs and as an expandable row in the lesson vocabulary table. Seed 5–10 demo examples in Lesson 1.

**Source:** Builds on [2026-05-26 app review audit](./2026-05-26-app-review-audit.md) (item CS-1) + a direct user request for the lesson-layout fix.

---

## Part 1: Lesson layout compaction

### Current state
On [lesson.html](../../../lesson.html), the top of the wrap is 3 stacked rows:

| Row | Content | Margin-bottom |
|---|---|---|
| 1 | `<select class="lesson-select">` | 2rem |
| 2 | `<div class="inner-tabs">` (Vocab / Grammar / Quiz buttons) | 1.5rem |
| 3 | `<div class="hs-toolbar">` (only present on Vocab tab; rendered inside `vocab-view` innerHTML by `render()`) | 1rem |

Total vertical: ~120px wasted to navigation chrome before the user sees any content.

### Target state
Single flex row, wrapping on narrow screens:

```
[Lesson 1 ▾]  [Vocabulary | Grammar | Quiz]            [Hide & Seek] [Random mix ▾]
                                                       ↑ auto-hidden on Grammar / Quiz tabs
```

When Hide & Seek is active, the rightmost slot swaps to: `[Random mix ▾] [Check All] [Stop] [Score]`.

### Approach
1. Wrap the three controls in a new `<div class="top-controls">` container in the HTML.
2. Move the H&S toolbar OUT of the `vocab-view` innerHTML (where `render()` currently builds it) and into a persistent `<div id="hsToolbar">` slot inside `.top-controls`.
3. Add a `renderHsToolbar()` function that populates `#hsToolbar` based on `currentTab` and `lessonHsMode`. Empty content when `currentTab !== 'vocabulary'`. Wired up via `selectTab()`, `selectLesson()`, `startLessonHideSeek()`, `stopLessonHideSeek()`, `changeLessonHsMode()`.
4. CSS: `.top-controls { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 1.25rem; }`. Push H&S to the right with `margin-left: auto`. Zero out the existing per-control bottom margins. Use `:empty { display: none; }` so the H&S slot completely disappears when empty (no awkward gap).
5. Mobile (`@media max-width: 600px`): lesson select takes full width; tabs + H&S wrap naturally underneath.

### Out of scope for Part 1
- No behavior changes to Hide & Seek itself.
- No restyling of the buttons / dropdowns themselves.

---

## Part 2: CS-1 — Example sentences per word

### Data shape
Add an optional `examples` field to word entries in [words.js](../../../words.js):

```js
{
  char: "你好",
  pinyin: "nǐ hǎo",
  pos: "",
  viet: "chào bạn",
  lesson: 1,
  hv: "...",
  radical: "...",
  examples: [
    { zh: "你好，老师！", vi: "Chào thầy/cô!" },
    { zh: "他对我说你好。", vi: "Anh ấy nói chào tôi." }
  ],
}
```

Same shape as `grammarPatterns[].examples` — consistency.

The `n` auto-assign at the bottom of `words.js` is unaffected; field is optional.

### Where examples surface (per user choice)

**A. Flashcard card backs in [hanyu.html](../../../hanyu.html):**
- Character mode (front: char → back: pinyin/meaning + examples)
- Meaning mode (front: viet → back: char/pinyin + examples)
- Pinyin mode (front: pinyin → back: char/meaning + examples)
- Show all examples (typically 1–3 per word). Compact layout: `zh` on one line, `vi` muted small below.
- If `examples` is absent or empty: no extra row, no whitespace.

**B. Lesson vocab table in [lesson.html](../../../lesson.html):**
- Add a `例` (examples) toggle button next to the existing `分析` (radical) button, only on rows where `w.examples?.length > 0`.
- Clicking it expands an inline panel beneath the row (same pattern as the radical-row mechanism), styled similarly but in a different color (green-ish to distinguish from blue radicals).

### Where examples do NOT surface (explicitly out of scope)
- Quiz feedback area (user opted out)
- Related Characters popup (user opted out)
- Hide & Seek (no change)
- Match mode (front-only tiles, no back face)
- Listen mode (audio-driven; examples would be visual clutter)

### Demo seed
Add `examples` to 5–10 selected Lesson 1 words covering varied POS:
- A noun (老师), a verb (是 or 叫), an adjective (好), a pronoun (我 or 你), a particle (吗), and a greeting (你好).
- 1–2 examples each, kept short (≤ 6 chars Chinese), using only vocabulary that exists in Lesson 1 to avoid forward references.

Sentence content guideline: must be grammatically correct and educational; aim for sentences that combine 2–3 known Lesson 1 words. Sample style — but final content goes in the plan's actual code:
- 你好 → "你好，老师！" / "Chào thầy/cô!"
- 老师 → "她是老师。" / "Cô ấy là giáo viên."

### Shared infrastructure
Add an `exampleLines(w)` helper to [shared.js](../../../shared.js) (mirrors `radicalLines`). Returns an array of HTML strings or empty array.

Add CSS to [shared.css](../../../shared.css): `.example-toggle`, `.example-row`/`.example-row.open`, `.example-panel`, `.example-zh`, `.example-vi`. Color palette: distinct from radicals (use a muted green or amber).

---

## Risks & tradeoffs

| Risk | Mitigation |
|---|---|
| Card backs become tall on words with many examples | Cap visible examples at 3 (rest collapsed) — or just keep simple (show all) since most will have 1–2. Picking "show all" for v1; revisit if it becomes a problem. |
| `renderHsToolbar` adds a new state machine that can desync from the existing `render()` | `selectTab()`, `selectLesson()`, `startLessonHideSeek()`, `stopLessonHideSeek()`, `changeLessonHsMode()` all need to call `renderHsToolbar()`. Plan task lists every callsite explicitly. |
| `.top-controls` + `flex-wrap` may look ugly at a specific medium width | Single media query at 600px handles mobile; between 600px and 1400px the flex naturally arranges. No special case needed. |
| Demo example sentences use characters from later lessons by accident | Constrain seed words to use only Lesson 1 vocab; cross-check before adding. |

---

## Memory respected
- No difficulty / level indicators in UI ([memory: feedback_no_difficulty](../../../../../.claude/projects/-Users-daniel-WorkStation-Giao-Trinh-TQ-learn-web/memory/feedback_no_difficulty.md))
- Grammar data ↔ exercise coupling unaffected (not in scope here)

## Out-of-scope (deferred)

- Other audit items (LE-1/2/3/4, UX-1/2/3/4/5/6/7/8/9, CS-2/3/4/5, CQ-3/4/5/6/7/9)
- Backfilling examples for the full 285-word corpus (user adds as they study)
- Audio playback of example sentences
