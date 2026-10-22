---
name: polish-proof
description: Improve the visual quality of an existing web UI while preserving its content, controls, and behavior. Use for bounded polish with paired screenshots and regression evidence, not new-site generation or a full rebrand.
---
# Polish Proof

Make an existing screen more intentional **without silently replacing the product**. Deliver a small visual patch and a reviewable receipt, not a beauty score. This complements a design-direction skill; it is not another library of preferred fonts and palettes.

## Lock what should not change

Read the repository instructions and render the real target route before editing. Identify the user's task on this screen, what feels wrong, and the smallest surface authorized to change. Existing tokens, brand, copy, destinations, controls, data, and interaction behavior are the default invariants. A request to polish is not permission to refactor logic, rewrite copy, install a design system, or remove inconvenient content.

Record a short contract: target route/state, allowed visual files, protected logic/content files, brand tokens to retain, relevant viewport sizes, and one or two critical interaction flows. If the user asked for review only, do not edit. Resolve a genuinely missing design direction with one focused question; otherwise state a conservative assumption and work within the existing visual language.

## Look, diagnose, then patch

Capture and inspect the **same page state** at phone and desktop widths (plus an intermediate width when layout changes there). Record the top 1–3 visible defects, each with screenshot location, effect on the user's task, and a testable change hypothesis. Examples: two equally loud actions obscure the next step; nested card borders compete with lesson titles; a fixed-width grid clips essential text on mobile.

Separate objective breakage from taste. A font, purple accent, rounded corner, or centered heading is not inherently wrong. Do not replace one generic template with another. Prefer changes to hierarchy, grouping, line length, type scale, spacing rhythm, and action emphasis that express this product's actual content. Keep a coherent hierarchy across widths, not a desktop composition merely squeezed to phone size.

Apply the smallest coherent patch. CSS-only is useful when feasible, not a rule that excuses bad semantics. If a necessary fix crosses the agreed boundary, disclose that before expanding it. Never hide, truncate, rewrite, or delete content simply to improve screenshots or metrics.

## Prove what changed and what did not

Use the project's browser/test tooling when available. For a small local web preview, the bundled [receipt helper](references/receipt.md) can capture PNGs, source-file hashes, text/control inventories, layout metrics, and a machine-readable comparison. It needs Node + Playwright; it does not install dependencies or touch application source. Capture before editing and after the final patch with an unchanged contract. Do not regenerate the baseline to make a failure pass.

Read the actual paired screenshots at every captured width. Check the original defect, remaining hierarchy, overflow, awkward wraps, whitespace, control clarity, and adjacent surfaces. Re-run the relevant interaction flows—including dismiss/reopen or repeat when applicable—and the repository's required checks. A matching label or source hash does not establish a successful interaction. Keep screenshot state and test state separate.

Stop when the agreed defects are fixed, invariants and relevant behavior checks pass, and no new visual defect appears in the compared states. If a pass reveals an unrelated issue, report it rather than silently widening the redesign. If browser evidence is unavailable, label the result source-only and do not claim visual verification.

## Deliver the receipt

Report: (1) the bounded visual changes, (2) before/after screenshots with identical framing, (3) concrete checks and their results, (4) protected content/behavior evidence, and (5) remaining limits. Use [the review rubric](references/review.md) for a concise visual judgment; do not combine it into an invented objective aesthetic score. Claims of superiority over another skill require a separate controlled evaluation, not this demo.
