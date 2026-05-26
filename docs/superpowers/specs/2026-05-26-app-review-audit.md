# App Review — Audit & Prioritized Backlog

**Date:** 2026-05-26
**Reviewer:** Claude (Opus 4.7)
**Scope:** Full read of [hanyu.html](../../../hanyu.html), [lesson.html](../../../lesson.html), [grammar.html](../../../grammar.html), [words.js](../../../words.js), [grammar_data.js](../../../grammar_data.js), [CLAUDE.md](../../../CLAUDE.md), and [agent-docs/](../../../agent-docs/).
**Not in scope:** Live browser walk-through (UX claims here are inferred from CSS/JS; recommend a manual pass before committing UX fixes), entry-by-entry vocabulary accuracy, third-party tool benchmarking.

---

## TL;DR — Top 5

1. **`CLAUDE.md` is out of date in ways that will mislead future sessions** — it describes a single-file app (`chinese_vocab_study.html`) and an SM-2 SRS with `easeFactor/interval/dueDate` that does not exist. Reality: 3 HTML pages, weight-based shuffle.
2. **Three HTML files duplicate ~600 lines of CSS/JS each** — `speakZh`, `audioBtn`, `posClass`, `checkPinyinMatch`, `checkViet`, `radicalLines`, `showRelated`, `populateLessonSelects`, Hide & Seek, plus the entire app-header + related-popup + radical CSS. Every change to a shared concept is a 3-place edit waiting to drift.
3. **The "SRS" is a per-mode 1–4 weight, not real spaced repetition.** Five separate `localStorage` keys (`weights_char`, `weights_meaning`, `weights_pinyin`, `weights_choose`, `weights_audio`); they never cross-pollinate. Match mode has the only combined view and only reads (never writes). No date-based scheduling — getting it wrong today doesn't make it surface tomorrow.
4. **Choose & Listen auto-advance silently override weight on correct.** Both call `saveWeight(..., 2)` on correct answers — overwriting any prior `Forgot/Hard` rating without asking. A word you've struggled with becomes "Good" the moment you guess it right once in multiple choice.
5. **POS dropdown has `mw.` and `num.` options that fall through to "other" badge styling** — `posClass()` in [hanyu.html:553-562](../../../hanyu.html#L553-L562) doesn't handle them. Cosmetic bug, but obvious once seen.

---

## App state snapshot

| Surface | File | Lines | Purpose |
|---|---|---|---|
| Lesson view | [lesson.html](../../../lesson.html) | 1652 | Per-lesson vocab table + grammar accordion + integrated 10-type Quiz (5 vocab + 5 grammar) + Hide & Seek |
| Vocabulary | [hanyu.html](../../../hanyu.html) | 2187 | Browse + 6 study modes (Character, Meaning, Pinyin, Choose, Listen, Match) + Hide & Seek |
| Grammar | [grammar.html](../../../grammar.html) | 751 | Browse + 5 exercise types (fill-blank, sentence-builder, error-correction, pattern-match, translation) |
| Vocab data | [words.js](../../../words.js) | 366 (~286 entries, ~95 KB) | `char`, `pinyin`, `pos`, `viet`, `lesson`, `hv`, `radical`. `n` auto-assigned at file end. |
| Grammar data | [grammar_data.js](../../../grammar_data.js) | 2590 (~240 KB) | Two arrays: `grammarPatterns` and `grammarQuestions` |
| Docs | [CLAUDE.md](../../../CLAUDE.md), [agent-docs/](../../../agent-docs/) | — | Project guidance + planning docs |

Active development is steady — last 11 commits all add lesson content (lessons 6–11) or new features (radical breakdown, related-chars popup, Hide & Seek). The grammar exercises in `lesson.html` are a second implementation that largely re-does what `grammar.html` does, but inside the lesson view.

---

## Findings by area

### Learning effectiveness

#### LE-1 — "SRS" is not spaced repetition. **[P1]**
[hanyu.html:918-940, 986-1001](../../../hanyu.html#L918-L1001), [CLAUDE.md:30-33](../../../CLAUDE.md#L30-L33)

What `CLAUDE.md` claims (SM-2 with `easeFactor / interval / dueDate / state`) is absent from the code. Reality: each rating writes a single integer weight (Forgot=4, Hard=3, Good=2, Easy=1), used only to bias session shuffle order via `weightedShuffle`. There is no time component. A word marked "Forgot" yesterday and a word marked "Forgot" three weeks ago are indistinguishable.

**Why it matters:** the value proposition of SRS is *time-based scheduling* — surfacing things just before you'd forget them. Weighted shuffle gives you "harder things appear more often *within today's session*" which is a real but smaller benefit. Worth deciding consciously whether this is OK or whether you want true SRS.

**Recommendation:** Pick one of two paths and document the choice:
- **Keep simple:** rename "SRS" to "weighted review" in docs, drop the `dueDate` claim from `CLAUDE.md`, and add a clear "this is a leech surfacer, not a scheduler" note.
- **Go SRS:** add `lastReview` + `interval` per card per mode and gate session inclusion on `dueDate <= today`. Modest data-model change; ~50 lines of logic.

#### LE-2 — Five disjoint weight stores; weakness in one mode doesn't transfer. **[P1]**
[hanyu.html:919](../../../hanyu.html#L919) (`WEIGHT_KEYS`)

`weights_char`, `weights_meaning`, `weights_pinyin`, `weights_choose`, `weights_audio` are independent. If you fail "Pinyin" on 你好 ten times, the "Character" mode is unaffected. Only Match mode reads the maximum across them ([hanyu.html:1845-1854](../../../hanyu.html#L1845-L1854)) — and only for selecting which 4 pairs to show, not for writing back.

**Why it matters:** the modes test different facets of the same word. Weakness on any facet is a signal the whole word needs attention. Mode silos hide that.

**Recommendation:** Add a combined view (max across modes) used by all session builders, not just Match. Optionally weight per-mode contributions (e.g., "you got Listen wrong" boosts Listen 2x and other modes 1x).

#### LE-3 — Auto-advance overwrites prior ratings without consent. **[P1]**
[hanyu.html:1606-1614](../../../hanyu.html#L1606-L1614) (Choose), [hanyu.html:1793-1803](../../../hanyu.html#L1793-L1803) (Listen)

When the user picks the right option in Choose, after 800ms the code calls `saveWeight('choose', w.n, 2)` — silently setting the weight to "Good" regardless of what it was. If you'd marked the same word "Forgot" yesterday, one lucky guess today resets it. Same in Listen at 900ms.

**Why it matters:** the rating buttons promise the user "harder words appear more often" ([hanyu.html:1083](../../../hanyu.html#L1083)) — auto-promotion silently breaks that promise for these two modes.

**Recommendation:** Don't decay; only improve. Make auto-advance set `min(currentWeight, 2)` — never *worsen* a difficulty rating. Or skip the auto-write entirely and treat correct auto-advance as "no rating recorded."

#### LE-4 — No surfacing of "weak words" outside Match. **[P1]**
None of the session builders (`startFlashcardSession`, `startWritingSession`, `startPinyinSession`, etc.) offer a "review just my weak words" filter. They sample from the lesson/all and rely on `weightedShuffle` to bias order. With 50+ words per lesson the weak ones may still take a while to recur.

**Recommendation:** Add a "Weak only" toggle that filters to `combinedWeight >= 3` words across all modes. Cheap; reuses the combined-weight helper from LE-2.

#### LE-5 — No retention metrics; user can't see progress over time. **[P2]**
The app shows session-local correct/wrong, but nothing persists for "% of words you knew this week" or "X words newly learned." This is fine for solo study but limits the "am I improving?" feedback loop.

**Recommendation:** If you decide LE-1 → real SRS, retention metrics fall out naturally. Otherwise, a simple "first-correct date" per word would unlock a basic "words learned this week" stat. Defer until LE-1 is decided.

#### LE-6 — Choose/Listen distractor quality is OK but can be uneven. **[P2]**
[hanyu.html:1492-1508](../../../hanyu.html#L1492-L1508), [hanyu.html:736-752](../../../hanyu.html#L736-L752)

`pickChooseDistractors` prefers same-lesson, different-POS distractors. With sparse lessons or many same-POS words this can fall through to other lessons quickly. Not broken; just sometimes too-easy distractors (POS difference alone often makes the answer obvious).

**Recommendation:** Bias toward same-POS distractors *first* (the harder case), with different-POS as fallback. Counter-intuitive but better discrimination.

---

### UX & UI polish

#### UX-1 — POS badge falls back to "other" for `mw.` and `num.`. **[P2]**
[hanyu.html:553-562](../../../hanyu.html#L553-L562), [hanyu.html:370-371](../../../hanyu.html#L370-L371) (dropdown options that have no badge color)

The POS filter dropdown offers Measure word and Numeral, but `posClass()` returns `'other'` for them — they render with the gray "other" badge instead of distinct color. Same omission in [lesson.html:490-499](../../../lesson.html#L490-L499).

**Recommendation:** Add `mw` and `num` classes to the CSS (any two new colors from your existing palette) and extend `posClass()`. ~6 lines per file (or one line once shared — see CQ-1).

#### UX-2 — 7 mode buttons in `hanyu.html` cramp on mobile. **[P2]**
[hanyu.html:347-355](../../../hanyu.html#L347-L355), CSS [hanyu.html:248-249](../../../hanyu.html#L248-L249)

Mobile rule `.mode-btn { flex: 1; padding: 12px 8px; font-size: 13px; }` divides 7 buttons across ~360 CSS px → ~51px each. With 13px text plus padding, "Character", "Writing" etc. fit but it's tight and easy to mis-tap.

**Recommendation:** Either (a) group into a primary "Practice" dropdown ("Type / Choose / Listen / Match") + keep Browse and Flashcard as primary, or (b) let the row scroll horizontally on mobile with snap-points. Option (b) is smaller surgery.

#### UX-3 — `Listen` mode uses TTS that loads voices asynchronously. **[P2]**
[hanyu.html:594-601, 1752-1756](../../../hanyu.html#L1752-L1756)

`speechSynthesis.getVoices()` returns `[]` on first call in most browsers; voices populate later via the `voiceschanged` event. The first Listen card may speak with a default (non-Chinese) voice or fail to find Mandarin entirely. The `// Preload voices` comment at line 604 calls `getVoices()` once but doesn't wait for the event.

**Recommendation:** Add `speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices()` plus a small retry on first speak. ~5 lines.

#### UX-4 — Choose & Listen handle "wrong" inconsistently with everything else. **[P2]**
Across modes: Flashcard / Writing / Pinyin require an explicit 1–4 rating before advancing. Choose and Listen auto-advance on correct (800–900ms) but require a manual rating on wrong. Match has no rating at all (uses Moves counter). The asymmetry means "rate honestly" is required to make the SRS work, but the easiest-feeling modes silently skip it (see LE-3).

**Recommendation:** Either unify on "always require rating" (slower but consistent) or "always auto-advance" (faster but loses signal). My read: keep manual rating, drop auto-advance — the rating taps are how you tell the app what to do next.

#### UX-5 — Match mode is fixed at 4 pairs / 8 tiles; can't pick a harder set. **[P2]**
[hanyu.html:1856-1892](../../../hanyu.html#L1856-L1892)

It picks the 4 weakest words and shows 8 tiles. No way to do 6 or 8 pairs. Also: same word may be "weakest" two sessions in a row → same Match game.

**Recommendation:** Add `<select>` for 4/6/8 pairs (mirror the other modes' card-count selector). Add a small "exclude last-shown" filter to avoid back-to-back repetition.

#### UX-6 — Color-only state on `correct`/`incorrect`/`revealed` inputs. **[P2]**
Hide & Seek inputs ([hanyu.html:108-111](../../../hanyu.html#L108-L111)) change border + background only. Already has ✓/✗ on flashcard feedback rows but not on inputs themselves.

**Recommendation:** Add a small icon (✓ / ✗ / 👁) inside or beside the input on state change. Better for colorblind users and lower-contrast environments.

#### UX-7 — Abbreviation tooltips are CSS `::after content` — screen readers won't read them. **[P2]**
[lesson.html:144](../../../lesson.html#L144), [grammar.html](../../../grammar.html) similar

The CN/VN/TN/etc. abbreviations have hover tooltips via `::after content: attr(data-tip)`. Screen readers skip generated content. The element does have `tabindex="0"`, which is good, but the tooltip text isn't in the accessibility tree.

**Recommendation:** Mirror the tooltip text into `aria-label` (or `<abbr title="...">` which gets both visual and a11y for free).

#### UX-8 — No "back to lesson" link in `grammar.html`'s session-complete; only Vocabulary. **[P2]**
[grammar.html:705-707](../../../grammar.html#L705-L707)

The "Done!" screen offers Restart + a "← Vocabulary" button. Most users will want to return to a lesson, not the global vocab page.

**Recommendation:** Add "← Lessons" as a third button.

#### UX-9 — Card flip animation is disabled on mobile but the structure remains. **[P2]**
[hanyu.html:277-285](../../../hanyu.html#L277-L285)

Mobile drops the 3D flip (good) and just `display: none`s the back face until `.flipped`. The semantics work but the `.card-container { aspect-ratio: auto; height: auto; }` change creates a jumpy layout shift when answer appears. Not severe; noticeable.

**Recommendation:** Reserve a min-height for the back face or animate the height with `transition` rather than instant swap.

---

### Code quality & maintainability

#### CQ-1 — ~600 lines of CSS + JS are duplicated across the 3 HTML files. **[P0]**
Comprehensive list (file → file appearances):

| Function/CSS | hanyu | lesson | grammar |
|---|---|---|---|
| `speakZh`, `audioBtn` | ✓ | ✓ (×2) | — |
| `normalizePinyin`, `normalizeViet`, `checkPinyinMatch`, `checkViet` | ✓ | ✓ | — |
| `posClass` | ✓ | ✓ | — |
| `availableLessons`, `populateLessonSelects` | ✓ | ✓ | ✓ |
| `radicalLines`, `radicalToggleHtml`, `radicalPanelInner`, `toggleRadical` | ✓ | ✓ | — |
| `showRelated`, `closeRelated`, Related-popup HTML+CSS | ✓ | ✓ | — |
| `ABBR_TOOLTIPS`, `addAbbrTooltips` | — | ✓ | ✓ |
| Hide & Seek logic | ✓ | ✓ (renamed `lesson*`) | — |
| `:root` CSS variables block | ✓ | ✓ | ✓ |
| `.app-header`, `.app-nav`, `.app-title`, `.app-nav-btn` CSS | ✓ | ✓ | ✓ |
| `.mode-toggle`, `.mode-btn` CSS | ✓ | ✓ | ✓ |
| `.badge`, `.n/.v/.pron/.adv/.adj/.part/.other` colors | ✓ | ✓ | ✓ |
| `.fc-message`, `.fc-msg-actions` | ✓ | ✓ (rebranded `q-complete`) | (rebranded `session-msg`) |

Plus: [lesson.html](../../../lesson.html)'s Quiz section is a *second implementation* of grammar exercises (fill-blank, sentence-builder, error-correction, pattern-match, translation) — same `grammar_data.js` source, mostly the same logic as [grammar.html](../../../grammar.html), but separately maintained. Three places to update when a grammar exercise type changes.

**Why it matters:** Every "small fix" risks 3-file drift. We already see early drift — `posClass` in `lesson.html` uses `startsWith('n.')` (with the dot) while `hanyu.html` uses `startsWith('n')` (without). Different filtering behavior across pages.

**Recommendation:** Extract shared code. Three rough options, escalating in lift:

1. **`shared.js` + `shared.css`** — pull the duplicated functions and styles into two new files; include via `<script>` and `<link>` from each HTML. No build. Smallest change, immediate wins. **Recommended starting point.**
2. **Light templating** — keep shared.js + shared.css, but also build a tiny header/nav partial via JS template literal injected into a `<div id="app-header-mount">`. Removes the HTML duplication.
3. **Framework** — Vite + Preact/Svelte/Vue, route per page. Largest change; only worth it if you also want component composition (e.g., a single `<WordRow>` used in browse + lesson + popup). Defer unless you commit to it.

#### CQ-2 — `CLAUDE.md` describes an architecture that no longer exists. **[P0]**
[CLAUDE.md](../../../CLAUDE.md) references `chinese_vocab_study.html` (doesn't exist), claims SM-2 SRS with `easeFactor/interval/dueDate/state` (none of these are stored), and describes 3 modes (Browse / Flashcards / Write Chinese — actually 7 modes plus lesson + grammar pages now).

**Why it matters:** Future Claude sessions read `CLAUDE.md` first. They will look for files that don't exist, expect data shapes that don't exist, and miss the entire 3-page architecture.

**Recommendation:** Rewrite. Outline:
- Three pages: `lesson.html` (entry), `hanyu.html` (vocab study), `grammar.html` (grammar exercises). Plus `words.js`, `grammar_data.js`.
- Data shapes for `words[]` and `grammarPatterns[]` and `grammarQuestions[]` (the latter two are undocumented today).
- Current persistence: 5× `weights_*` per-mode + `grammar_progress`. Weight values, semantics, and that this is *not* time-based SRS.
- Updating lesson-filter dropdowns: now data-driven via `populateLessonSelects()` — the "update 3 selects when adding a lesson" instruction in current `CLAUDE.md` is obsolete.
- Pointer to this audit doc.

#### CQ-3 — Inline `onclick` everywhere, with fragile manual escaping. **[P1]**
~150+ `onclick="..."` strings across the 3 HTML files. Inside them, character data is interpolated with `replace(/'/g,"\\'")` ([hanyu.html:822, 845](../../../hanyu.html#L822)). This handles single-quotes but breaks on `"`, `<`, `>`, or `\`. Today's vocabulary has no such characters, so it works — but it's a latent bug if you ever paste an English meaning with quotes.

**Why it matters:** It's not just safety; refactoring is hard. Renaming `checkRowHs` requires editing all the inline strings, which IDEs can't track.

**Recommendation:** Phase in event delegation. Add `data-*` attributes (`data-action="checkRow" data-n="42"`) and a single `document.addEventListener('click', ...)` per page that dispatches. Works without build tools.

#### CQ-4 — Global `window` namespace pollution. **[P1]**
`let words`, `let hsMode`, `let openRadicals`, `let fcQueue`, `let pyIndex`, `let quizQueue`, plus `window._qvOpts`, `window._qgOpts`, `window._qgAnswer` etc. ([hanyu.html:1161, 1180](../../../hanyu.html#L1161)). Quiz mode in `lesson.html` literally uses `window.` prefix.

**Why it matters:** Two scripts conflict if you ever inline a second one. Also: it's harder to reason about state when it could be mutated from anywhere.

**Recommendation:** Wrap each page's script in an IIFE; explicitly export only what `onclick` handlers need (e.g., `window.app = { switchMode, rateCard, ... }`). If/when you tackle CQ-3, this becomes natural.

#### CQ-5 — Data files load on every page; will grow. **[P2]**
`words.js` (~95 KB) + `grammar_data.js` (~240 KB) = ~335 KB JS parsed on every page load. Not a problem today on desktop, may bite on slow mobile by lesson 30+.

**Recommendation:** Defer. Reconsider when total > 1 MB. If/when you need it: split per-lesson chunks (`words-lesson-1.js` etc.) loaded on demand. Don't optimize now.

#### CQ-6 — Planning docs in `agent-docs/` are git-ignored and orphaned. **[P2]**
[.gitignore](../../../.gitignore) excludes `agent-docs/`; the directory exists locally with four planning docs (`GRAMMAR_EXERCISES_PLAN.md`, `GRAMMAR_EXTEND.md`, `RADICAL_ANALYSIS_PLAN.md`, `lesson7.md`) but none are in version control. They exist only on your machine and would be lost on `rm -rf`.

**Recommendation:** Either commit them (un-gitignore and own that planning docs are part of the repo) or accept they're personal scratch and move them out of the repo root. Pick deliberately.

#### CQ-7 — No tests. **[P2]**
Zero tests exist. Acceptable for a solo static app; flagging it because if CQ-1 → shared.js extraction lands, having even 5–10 tests for `checkPinyinMatch`, `checkViet`, `normalizePinyin` would catch regressions during the extraction.

**Recommendation:** Add a single `tests/shared.test.html` that runs the pure helpers and prints PASS/FAIL — no framework needed. Defer to during/after a refactor.

#### CQ-8 — Repeated inline Fisher-Yates shuffle. **[P2]**
At least 6 inline copies of the same Fisher-Yates loop across the 3 HTMLs ([hanyu.html:646-649, 1542-1545, 1722-1725, 1879-1882](../../../hanyu.html#L646-L649)). Trivial; ideal candidate for `shared.js`.

#### CQ-9 — `agent-docs/` planning docs may be stale. **[P2]**
`GRAMMAR_EXERCISES_PLAN.md` (Apr 21), `RADICAL_ANALYSIS_PLAN.md` (May 9), `lesson7.md`. Some of this is built; some may be aspirational. Worth a pass.

**Recommendation:** Audit `agent-docs/` in a follow-up; either mark items "done", "deferred", or delete. Low priority but cheap.

---

### Content scope

#### CS-1 — No example sentences per word. **[P1]**
`words.js` has `char`, `pinyin`, `pos`, `viet`, `hv`, `radical` — but no `examples` field. Example sentences live only inside `grammarPatterns`. The Listen mode plays a single character/word; you never hear it in context.

**Why it matters:** vocabulary retention is much stronger when a word is encoded with at least one usage context. Also unlocks new study modes (cloze sentences, listening comprehension, reading aloud).

**Recommendation:** Add optional `examples: [{ zh, vi }]` to `words.js` entries. Don't backfill everything at once — add to new entries and existing words during natural review. Surface in flashcard back face when present.

#### CS-2 — No tone-only drill. **[P2]**
Pinyin checking via `normalizePinyin` strips diacritics — `ni hao` and `nǐ hǎo` both pass. You can't drill *just* tones (which is a common weak spot).

**Recommendation:** Add a "Tone" mode or a "strict pinyin" toggle that does *not* strip diacritics. Reuses Pinyin mode infrastructure.

#### CS-3 — No handwriting / stroke-order practice. **[P2]**
Memory says no difficulty indicators; that's not stroke order, so this is fair game. Stroke order is one of the highest-leverage Chinese skills for retention but completely absent.

**Recommendation:** Defer unless you want this. If you do, use [Hanzi Writer](https://hanziwriter.org/) — it's a single JS file, draws strokes for any character, supports quiz mode. Drops in cleanly to a new "Write" mode.

#### CS-4 — `radical` data is great but not exposed in writing/listening modes. **[P2]**
The radical breakdown is rich and shown only in Browse + Lesson tables. Flashcard back, Writing back, Listen reveal don't show it.

**Recommendation:** Add a small "view radical" toggle on the card back faces. Cheap.

#### CS-5 — `hv` (Hán Việt) field is the app's killer feature; underused in quiz. **[P2]**
[hanyu.html](../../../hanyu.html) quiz feedback shows `hv` as a hint after answering (good). Lesson tables show it as a yellow badge (good). But it's never the *front* of a card. For Vietnamese speakers, "given this Hán Việt, what's the Chinese?" is uniquely valuable.

**Recommendation:** Add a "Hán Việt → Chinese" mode. Probably very small lift; reuses Writing infrastructure.

---

## Prioritized backlog

### P0 — Do soon; actively misleading or blocking
1. **CQ-2** — Rewrite `CLAUDE.md` to reflect current architecture. (~30 min)
2. **CQ-1** — Extract `shared.js` + `shared.css` from the 3 HTML files. (1–2 days; biggest single unlock)

### P1 — Meaningful friction or risk; each worth its own spec
3. **LE-2** — Combined cross-mode weight + use it everywhere (not just Match).
4. **LE-3** — Stop auto-promoting Choose/Listen correct answers past their prior rating.
5. **LE-1** — Decide: keep weighted-shuffle and rename, OR add real date-based SRS.
6. **LE-4** — Add "Weak only" filter to all session builders.
7. **CQ-3** — Phase out inline `onclick`; switch to event delegation + `data-*` attrs.
8. **CQ-4** — IIFE-wrap page scripts; expose only the handlers `onclick` needs.
9. **CS-1** — Add `examples` field to `words.js`; surface in flashcard backs.

### P2 — Polish & nice-to-have
10. **UX-1** — Add badge classes for `mw.` and `num.`.
11. **UX-2** — Fix 7-mode crowding on mobile.
12. **UX-3** — Wait for `voiceschanged` before first Listen call.
13. **UX-4** — Unify Choose/Listen advancement with rest (manual rating).
14. **UX-5** — Add 6/8-pair option to Match; avoid back-to-back repeats.
15. **UX-6** — Add ✓/✗ icons to Hide & Seek inputs (not just color).
16. **UX-7** — Fix abbreviation tooltips for screen readers.
17. **UX-8** — "← Lessons" button on grammar session-complete.
18. **UX-9** — Stabilize card layout on mobile flip.
19. **LE-5** — Retention metrics (defer until LE-1 decided).
20. **LE-6** — Bias distractors toward same-POS.
21. **CQ-5** — Per-lesson data chunks (defer; not yet a problem).
22. **CQ-6** — Resolve `.gitignore`/`agent-docs/` inconsistency.
23. **CQ-7** — Add minimal pure-function tests.
24. **CQ-8** — Shared `shuffle()` helper (lands naturally with CQ-1).
25. **CQ-9** — Audit `agent-docs/` for staleness.
26. **CS-2** — Strict-pinyin / tone-only drill.
27. **CS-3** — Handwriting via Hanzi Writer (defer unless wanted).
28. **CS-4** — Expose `radical` on card backs.
29. **CS-5** — "Hán Việt → Chinese" mode.

---

## Suggested sequencing (opinion, not commitment)

If I were picking what to tackle in what order:

**First: CQ-2 then CQ-1.** Fix `CLAUDE.md` first (30 min, unblocks every future session). Then extract `shared.js` + `shared.css` — this is the single biggest force multiplier because every subsequent fix (UX-1 POS classes, LE-2 combined weights, LE-3 auto-advance fix, CS-1 examples surfacing) becomes a one-file change instead of a three-file change. Adding `CQ-7` minimal tests during this extraction makes it safe.

**Second: LE-3 then LE-2.** Stop the silent weight-overrides (LE-3 is small, ~10 lines), then unify weights across modes (LE-2). Together they make the rating taps actually mean something.

**Third: LE-1 decision.** Once weights are sane, decide whether to add real SRS or rename and accept what you have. This is a thinking task more than a coding task.

Everything else is opportunistic.

---

## Limitations of this audit

- **No live UX testing.** All UX claims are inferred from CSS/JS. A 30-minute manual walk-through on phone + desktop would catch things I can't see from code (animation jank, TTS voice quality, real tap-target ergonomics). Recommend doing this before committing UX-3, UX-5, UX-9.
- **No content accuracy review.** I did not verify Chinese/Vietnamese accuracy in `words.js` — you are the authority there.
- **Performance not measured.** Estimates are eyeball-only; no Lighthouse or real device timing.
- **Memory respected:** No recommendations to add difficulty/level indicators in the UI ([memory: feedback_no_difficulty](../../../../../.claude/projects/-Users-daniel-WorkStation-Giao-Trinh-TQ-learn-web/memory/feedback_no_difficulty.md)).
