# Verification receipt — 2026-10-22

## Verified source and raw evidence

- Source commit: [`6636256c8ab6210782e61c4f7aca15679c57588b`](https://github.com/mozzie49/polish-proof/commit/6636256c8ab6210782e61c4f7aca15679c57588b).
- [CI run 39752555452](https://github.com/mozzie49/polish-proof/actions/runs/39752555452): success. 20/20 helper tests; 4/4 browser interaction runs; mechanical receipt passes with no failures.
- Chromium `151.0.7922.34`; viewports 390×844, 768×1024, 1440×1000. Light mode, reduced motion, en-US, UTC, DPR1.
- [Original CI archive](ci-6636256.zip), retained byte-for-byte. SHA256: `d827c03c053de5e2a0ebf42d85170407ddf4a9386ebf5fa4f650c72c929e1403`. This matches GitHub's artifact digest. It contains both complete snapshots, six PNGs, receipt and interaction results.
- Published PNGs and JSON are unmodified copies from that archive. `before-phone.png` is 820px wide because full-page capture includes the measured overflow from its 390px viewport; it was not captured at a different viewport.

HTML and JavaScript are byte-identical before/after. Snapshot SHA256s:

```
index.html b33dccd81b04e887adc53ca0dc655546c297c041a027f3a8e89f1323a23fcb6f
app.js     8e93de8f2fca4cea743560c8c5fd51f53870464dda68c2e549626680ada19d66
```

All three captures preserve the frozen contract, extracted text sequence and control descriptors. The contract was not loosened between iterations. The interaction runner independently exercises matching/empty/reset search, all three quiz entry buttons, wrong/correct answers, close, reopen/Escape, and Help on both variants at phone and desktop sizes. This is not all possible behavior.

## Actual before/after measurements

| Viewport | Horizontal overflow | Direct-text elements below 14px | Continue height |
|---|---|---|---|
| Phone | 430 → 0px | 19 → 5 | 24 → 46.8px |
| Tablet | 52 → 0px | 19 → 0 | 24 → 46.8px |
| Desktop | 0 → 0px | 19 → 0 | 24 → 46.8px |

The 14px count is reporting-only, not an accessibility pass/fail or a universal design rule. Final declared targets are visible, horizontally in bounds, and at least 44×44px. The phone Continue occupies y762.36–809.16, within the 844px first viewport. These measurements are not aesthetic scores.

## Screenshot review and iteration

The first local forward test was blocked by the execution sandbox before editing. Chromium sockets were unavailable, the standard cloud browser could not reach the separate loopback server, and file-URL navigation was unsupported. Those restrictions were not bypassed; no local visual result was invented. The synthetic fixture was subsequently published with an explicitly unverified CSS proposal and validated in an authorized GitHub Actions browser environment.

1. [First CI](https://github.com/mozzie49/polish-proof/actions/runs/39751004081) passed mechanics. Actual screenshot review nevertheless found the mobile Continue button at y841–888, mostly below the first fold. [Retained first draft](first-draft-phone.png).
2. [Second CI](https://github.com/mozzie49/polish-proof/actions/runs/39751795417) verified the mobile-only intro correction: Continue moved to y762–809. Copy, behavior and contract stayed unchanged.
3. The final source adds balanced mobile heading wraps to remove the orphan final word. Its phone image was actually inspected. The other five final PNGs are byte-identical to the already-reviewed captures.

A separate agent performed a non-blinded review of all six first-run images; the implementing agent reviewed all six and the later phone iterations. This is not a blinded human study.

| Rubric axis | Judgment | Visible evidence |
|---|---|---|
| Task hierarchy | Improved for continue-learning | Continue alone has filled primary treatment; secondary actions remain present |
| Grouping and rhythm | Improved | Fewer competing nested surfaces; each lesson reads as one unit |
| Type and reading | Improved | Larger metadata/search/body and clearer levels; final mobile titles balance without an orphan |
| Responsive integrity | Improved, with tradeoff | No apparent after clipping/overlap; phone fits its viewport, at the cost of more vertical scrolling |
| Product continuity | Unchanged | Purple, Arial, content and recognizable learning identity retained; exact source invariants checked separately |

**Tradeoffs retained, not concealed:** tablet Review begins around y1006 and its button around y1309; desktop Explore crosses the 1000px fold. Larger type and stacked lessons reduce scan density. Help has weaker button affordance. The intended primary task is continuing a lesson; a different priority may warrant a different layout.

## What this does not establish

The fixture is deliberately flawed, synthetic, and authored for the demonstration. No randomized no-skill baseline, competitor comparison, blinded human preference test, external adoption, or general aesthetic uplift is claimed. The helper is a portable evidence layer, not an objective judge of beauty. The initial failed environment and the first visually imperfect proposal remain disclosed.
