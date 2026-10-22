# Polish Proof

**Polish the screen. Keep the product. Show the receipt.**

A small agent skill for improving an existing web UI without silently rewriting its copy, controls, brand or logic. It pairs visual judgment with inspectable before/after evidence. It is a complement to a design-direction skill, not a replacement for one.

**Experimental prototype.** The first local browser run was blocked by the execution sandbox. The CSS treatment is currently an unverified proposal; browser evidence must pass in CI and the screenshots must be reviewed before claiming a successful visual improvement. No external users or claim of outperforming other design skills. See [demand and competition](DEMAND.md) and [verification status](evidence/verification-status.md).

## Use the skill

Copy `skills/polish-proof` into your agent's supported skills directory. For a repository-local Codex-style installation:

```sh
mkdir -p /path/to/project/.agents/skills
cp -R skills/polish-proof /path/to/project/.agents/skills/
```

Then ask:

> Use polish-proof to make this learning screen feel less cluttered. Preserve our purple brand, Arial font, all copy and behavior. Check phone and desktop, and show me exactly what improved and what stayed the same.

The skill works with existing project/browser tools. The optional receipt helper needs Node + Playwright; it never installs anything, uploads data, or edits the application.

## What makes the result reviewable

- A bounded patch rather than an unsolicited rebrand or rewrite.
- Paired screenshots from the same states/viewports.
- A frozen contract for page text, control descriptors, protected source files and declared target dimensions.
- Explicit interaction tests; source hashes alone are **not** behavior proof.
- A task-based visual review with `improved / unchanged / worse / uncertain` judgments—not a made-up beauty score.

## Reproduce the demo

`demo/before` is a deliberately flawed, working educational fixture authored for this project. `demo/after` is a CSS-only treatment proposal, not yet visually verified. HTML and JavaScript remain byte-identical. They are not a real user's app or proof of general model uplift.

```sh
npm install
npx playwright install chromium
npm test
npm run demo:verify
# Or use an existing system browser:
CHROMIUM_PATH=/usr/bin/chromium npm run demo:verify
```

Use an authorized environment that permits local preview servers and Chromium. Evidence is written under `evidence/run-*`. The capture refuses to overwrite an existing snapshot. Unit tests cover broken-preservation and missing-proof cases; they do not certify aesthetic quality.

Full instructions: [SKILL.md](skills/polish-proof/SKILL.md) · [receipt helper](skills/polish-proof/references/receipt.md) · [visual review rubric](skills/polish-proof/references/review.md).

## Limits

The helper captures a fresh light-mode Chromium state, not all states or all browsers. It does not prove full accessibility, detect every overlay/clipping case, or cover canvas/shadow-root content. It cannot decide whether the interface is beautiful. A preview/browser permission failure remains a verification blocker, not a reason to invent a successful result. Inspect screenshots and run the actual product flows.
