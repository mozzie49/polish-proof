# Local receipt helper

Requirements: Node 20+ and Playwright resolvable by Node, plus permission to launch Chromium and reach a local preview server. A sandbox can have all binaries installed yet block the browser; if so, stop and report the launch failure rather than bypass restrictions. Use a supported authorized runtime or CI for the same synthetic fixture. Use the project's existing installation. If absent, request any needed installation authorization; the package's development setup is `npm install` and `npx playwright install chromium`. A system Chromium can be selected with `--chromium /path/to/chromium`. Do not claim cross-browser coverage from this Chromium helper.

Create a contract *before editing*. Example:

```json
{
  "version": 1,
  "viewports": [
    {"name":"phone","width":390,"height":844},
    {"name":"desktop","width":1440,"height":1000}
  ],
  "protectedFiles": ["src/logic.js"],
  "targets": [
    {"name":"continue","selector":"#continue","minWidth":44,"minHeight":44,"visible":true}
  ]
}
```

The 44px target is a chosen project target, not a universal aesthetic or conformance rule. Omit size thresholds if they are not part of this screen's requirements. Selectors must match exactly one element. `protectedFiles` are files that the visual patch must not alter; paths are relative to `--project-root`, and symlinks outside that root are rejected. If content and styles share a file, do not claim a whole-file lock that cannot be honored: protect separate logic and use the DOM inventory plus diff review instead.

```sh
node /path/to/polish-proof/scripts/receipt.cjs capture \
  --url http://127.0.0.1:3000/learn --contract contract.json \
  --project-root . --out evidence/before
# Apply the authorized patch; keep the server and contract equivalent.
node /path/to/polish-proof/scripts/receipt.cjs capture \
  --url http://127.0.0.1:3000/learn --contract contract.json \
  --project-root . --out evidence/after
node /path/to/polish-proof/scripts/receipt.cjs compare \
  --before evidence/before/snapshot.json --after evidence/after/snapshot.json \
  --out evidence/receipt.json
```

Each capture creates full-page screenshots and JSON. The existing `${name}.png` filename remains unchanged. To also create report-friendly viewport images, set `"viewportCompanion": true` in the contract **before both captures**:

```json
{
  "version": 1,
  "viewportCompanion": true,
  "viewports": [{"name":"phone","width":375,"height":812}],
  "protectedFiles": [],
  "targets": []
}
```

This opt-in adds `phone.viewport.png` using a direct viewport screenshot in the same browser context/page, immediately alongside `phone.png`. It does not reload, click, scroll, crop the full-page image, or replace it. Embed the compact companion in a report and link the full-page evidence so below-fold failures remain reviewable. This is not a universal ban on cropping: a separately labeled crop can be useful, but must not masquerade as a complete viewport or substitute for the original evidence.

Snapshot version 2 records each image's filename, actual PNG dimensions, SHA256 and viewport/scroll framing; the comparison receipt carries both manifests. Incorrect or missing entries, changed framing, and a companion setting that differs across before/after fail comparison. The helper checks page geometry around captures and fails on drift. Captures are sequential, not atomic: JS timers or same-size content changes still require a project-native deterministic state harness. `compare` validates the recorded manifest; it does not reopen or rehash files after capture.

Legacy version-1 snapshot pairs remain comparable. Do not mix a version-1 baseline with a version-2 after snapshot. Keep the old evidence, and if migrating, create a new evidence set from both preserved source revisions with the same helper; do not overwrite or silently regenerate a baseline from the edited page.

Fresh browser contexts use a fixed locale/timezone, reduced motion, light mode and device scale 1. Dark mode, authenticated data, seeded state, user-spacing/zoom, animations, hover/focus, and alternate states need project-native tests or an adapted harness; do not pretend this helper covers them. Do not use it against untrusted previews or sensitive data without appropriate access and handling. It does not perform clicks, remote upload, telemetry, or dependency installation. A viewport companion intentionally excludes below-fold content: inspect and link the full-page image too.

Mechanical checks compare the exact capture contract, browser, source hashes, text-node sequence, and control descriptors; fail on post-patch horizontal document overflow, new page runtime errors, or unmet declared targets. It flags pre-existing issues too: the receipt is not an authorization to repair outside the agreed scope. If such an issue is out of scope, leave the failure explicit and report it.

Limits: controls can be present yet broken; text can remain in DOM yet be clipped; matching files do not prove end-to-end behavior. The helper does not inspect shadow roots, cross-origin frames, canvas text, CSS-generated content, or all CSS clipping/occlusion. Full-page images can themselves extend to overflow width: the JSON preserves the viewport and actual overflow amount. Visually inspect them. Under-14px text count is a diagnostic only; a lower count does not mean a better design. Exit codes: 0 mechanical checks pass, 1 comparison needs attention, 2 tool error.
