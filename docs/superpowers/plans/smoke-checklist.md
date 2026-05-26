# Pre-refactor smoke baseline (2026-05-26)

Status of each item BEFORE shared extraction. Any FAIL here is a pre-existing
bug, not a regression. Delete this file once extraction is verified.

**How to use:** start `python3 -m http.server 8000` from the repo root, then
walk through each page and tick boxes that work. Any unticked box at the end
is something to investigate before the extraction (or accept as known broken).

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
