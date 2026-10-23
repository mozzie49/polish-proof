# Why this prototype exists

Research checked 2026-10-22. This is a hypothesis and a local proof-of-work, not traction or a superiority claim.

## Concrete demand

- **Direct request, 2026-10-21:** a developer with a working free offline educational app asks for a Claude Code skill to improve layout, colors, typography, spacing and styling while keeping logic, structure and functionality intact. This is the narrow task chosen here. [Original request](https://www.reddit.com/r/ClaudeAI/comments/1xbvrfa/is_there_a_claude_code_skill_for_redesigning_an/). Evidence was returned in web-search result including the dated body; direct open later returned a cache miss. No contact or adoption is implied.
- **Broader complaint, 2026-10-11:** a user asks how to avoid recognizably AI-generated UI; replies emphasize specific references, real content and decisions rather than “modern” as the brief. [Original discussion](https://www.reddit.com/r/ClaudeCode/comments/1x3go5l/any_tips_on_making_a_uiux_frontend_not_look_like/). This is qualitative evidence, not a demand estimate.
- **Reported concrete symptoms:** unnecessary cards, excessive explanatory text, inconsistent spacing, and generic layouts were identified by a Codex user describing why they created a skill. This is a creator's own account, not independent validation of their skill. [Original discussion](https://www.reddit.com/r/codex/comments/1v2lf1u/i_made_a_frontend_design_skill_because/).

## Existing work inspected; what not to duplicate

| Project | Observed coverage | Implication |
|---|---|---|
| [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Subject-specific direction, type, content, layout, plan/build/critique; recognizes that fashionable anti-default styles can themselves become generic | A list banning purple, Inter or rounded corners is not a differentiator |
| [Impeccable](https://github.com/pbakaus/impeccable) | Broad design commands, live browser iteration, deterministic detectors, product/design context | “Critique then verify screenshots” is already covered; do not claim this workflow is novel |
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Searchable design guidance, systems and stack rules; responsive and resilient-text guidance | Do not build another large style/palette catalog |
| [avoid-ai-design](https://github.com/funboy322/avoid-ai-design) | Detect/rewrite existing AI UI and a scanner, including newer fashionable defaults | “Remove AI tells from existing code” is not a unique pitch |
| [StyleSeed](https://github.com/bitjaru/styleseed) | Project choices, render/score/revise evidence and a published benchmark claim | Preserve-and-verify is also covered; no superiority claim without a controlled comparison |
| [mlhiter skills](https://github.com/mlhiter/skills) | Reusable design workflow; its design skill is indexed with a bounded visual quick-fix mode and preserve/evidence contract | Similar conceptual scope exists; the portable executable receipt is a packaging choice, not an invention |

These observations describe inspected public docs, not hands-on evaluations of the competitors. Star counts and installation claims are intentionally omitted: they are not proof this particular prototype will earn adoption.

## Proposed small wedge

**Polish the screen, keep the product, show the receipt.** A compact skill plus a local-only helper that rejects changed text/control/source contracts and records paired responsive screenshots. Explicitly compatible with an existing design-direction skill. Preserve a user's purple brand and Arial when asked; do not force a new aesthetic to advertise the skill.

The current fixture is authored for this demo. It is not the Reddit user's app, not a real client engagement, and not a randomly sampled baseline. The independent forward-test assesses whether another agent can use the package; it does not isolate causal uplift from the skill. A genuine efficacy study would need repeated matched tasks, no-skill and competitor conditions, the same model/tool budget, blinded task-based reviewers, retained failures and public raw outputs.

## Adoption test before broad promotion

After publication and outreach are separately authorized: offer one scoped screen repair to the original requester, return their real before/after and invariant/behavior evidence, and ask whether they used it or would use it again. Count actual installs/uses/repeated use separately from stars. If they already use a tool that does this better, contribute the missing proof piece there rather than create a redundant competing catalog. No outreach has been made.

## Concrete follow-on gap: compact report screenshots

On 2026-10-23, [Claude Code issue #104618](https://github.com/anthropics/claude-code/issues/104618) reported a 375×4777px phone screenshot, repeated post-crop difficulties, and eventual omission of the images from a report. The issue body was read directly. Its specific macOS tool behavior has not been independently reproduced here; this is one reported workflow failure, not an adoption signal.

Polish Proof originally captured only full-page PNGs. The narrow response is an optional capture-time viewport companion plus filename/dimension/hash/framing metadata, while retaining the full-page original. We do not adopt a universal “never crop” rule or claim every report image should be a fixed-size JPEG. The long-page fixture checks the two complementary views and preserves below-fold evidence. No source-issue outreach has been made.
