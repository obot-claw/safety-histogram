# Issue #6 evidence reconciliation — 2026-06-05

Scope: reconcile implementation PR #1 (`p004-nextgen-chartjs-histogram`) with evidence-harness PR #2 (`test-driver/safety-histogram-trial`) for obot-claw/safety-agent#6.

## Branches inspected

- PR #1 implementation: `p004-nextgen-chartjs-histogram` at `0dd042a`.
- PR #2 evidence harness: `test-driver/safety-histogram-trial` at `73da38b`.
- Base branch: `master`.

## Requirement-ID crosswalk

| PR #1 ID | PR #1 behavior | Closest PR #2 IDs | PR #2 coverage | Current disposition |
|---|---|---|---|---|
| `SH-DATA-001` | Accept one record per measurement using configured measure/result columns. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | Covered by PR #1 implementation/matrix only; needs future data-shape harness rows. |
| `SH-DATA-002` | Remove missing or non-numeric results and report count. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | Needs future negative-data fixture coverage. |
| `SH-DATA-003` | Support optional participant, unit, normal-low/high, filters, details columns. | `SH-FUNC-010` | Browser test checks listing details include participant/result/LLN/ULN. Unit test checks default detail labels/columns. | Partially covered by listing context; optional-column behavior still broader than PR #2. |
| `SH-CTRL-001` | Measure selector updates displayed distribution. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | Needs future browser row. |
| `SH-CTRL-002` | Configured filters subset chart data. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | PR #1 has a smoke test for participant-note update, but PR #2 does not cover it. |
| `SH-CTRL-003` | Participant count updates when filters apply. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | PR #1 smoke coverage only. |
| `SH-CTRL-004` | Normal range checkbox displays normal range overlay when available. | `SH-FUNC-004A`, `SH-FUNC-004B`, `SH-FUNC-004C` | PR #2 browser asserts default hidden state and checked rendering; trial notes also propose no-normal-range-measure coverage. | Partially covered. `004A/004B` align; `004C` is not executable in the current PR #2 browser file. |
| `SH-CTRL-005` | Lower/upper x-axis inputs update chart domain and flip invalid ranges. | `SH-FUNC-005A`, `SH-FUNC-005B`, `SH-FUNC-005C`, `SH-FUNC-005D` | PR #2 unit asserts controls exist and bin controls are present; trial notes propose browser domain/step/blur checks. | Partially covered only. Executable PR #2 tests do not yet validate actual domain update, step-by-1 behavior, invalid-range flip, or redraw on blur. |
| `SH-CTRL-006` | Binning controls support algorithm, quantity, width, custom mode. | `SH-FUNC-005*` adjacent | PR #2 unit checks algorithm includes Custom and quantity/width controls exist. | Partially covered. |
| `SH-CTRL-007` | X-axis tick mode can show linear centers or bin boundaries. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | Needs future browser row. |
| `SH-CHART-001` | Histogram bars show distribution for selected measure/filters. | Setup prerequisite for browser tests. | PR #2 browser waits for `.bar-group .bar`, which is legacy SVG/Webcharts-specific. | Coverage is not directly portable to PR #1 because PR #1 uses Chart.js canvas, not SVG bars. |
| `SH-CHART-002` | Hovering over bars reports count and value range. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | Needs future Chart.js-compatible browser row. |
| `SH-CHART-003` | Clicking a bar opens linked listing. | `SH-FUNC-010`, `SH-FUNC-011`, `SH-FUNC-012` | PR #2 browser clicks `.bar-group` and expects listing, selected/unselected opacity, and footnote count. | Behavior overlaps, but selectors are legacy SVG-specific and need adaptation for PR #1 canvas clicks. |
| `SH-CHART-004` | Group-by control renders grouped histograms. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | PR #1 smoke coverage only. |
| `SH-CHART-005` | Normality and group-comparison p-value annotations. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | PR #1 implements browser-side screening approximations. Treat as accepted approximation only if reviewer accepts the disclaimer; otherwise mark as deferred validation gap. |
| `SH-LIST-001` | Listing shows record details for clicked bin. | `SH-FUNC-010` | PR #2 browser checks listing headers and rows after a click. | Behavior overlaps; selectors/click mechanics need Chart.js adaptation. |
| `SH-LIST-002` | Listing pagination supports first/previous/next/last. | Not covered in current `SH-FUNC-*` trial. | PR #2 does not assert pagination controls. | PR #1 smoke test only checks listing action text, not navigation. Needs stronger harness coverage. |
| `SH-LIST-003` | Listing CSV export is available. | Not covered in current `SH-FUNC-*` trial. | PR #2 does not assert export. | PR #1 smoke test checks `Export: CSV` text only. Needs future export assertion. |
| `SH-LIST-004` | Listing search and sortable columns. | Not covered in current `SH-FUNC-*` trial. | PR #2 does not assert search/sort. | Code inspection found PR #1 implements a `.sh-listing-search` input and sortable table headers, so the PR body's known-gap wording is stale. Needs executable coverage before ready-review. |
| `SH-API-001` | Clean nextgen lifecycle API: `init`, `setData`, `setSettings`, `render`, `resize`, `destroy`. | Not covered in current `SH-FUNC-*` trial. | No executable PR #2 assertion. | Needs unit/API harness row. |
| `SH-API-002` | Webcharts API preservation is not required. | Not covered in current `SH-FUNC-*` trial. | PR #2 is currently Webcharts/legacy-selector-oriented. | PR #2 must be adapted before it can validate PR #1's non-Webcharts API. |

## Follow-up harness adaptation

This branch now carries a PR #1-native Playwright harness in `tests/e2e/safety-histogram.spec.js` plus `.github/workflows/test-driver.yml`. The harness keeps the PR #2 intent but adapts it to Chart.js/canvas behavior instead of legacy SVG selectors. New executable rows cover:

- Chart.js canvas bar selection -> linked listing state and selected-bin footnote (`SH-CHART-003`, `SH-LIST-001`).
- Listing pagination, search, sortable headers, and CSV download (`SH-LIST-002`, `SH-LIST-003`, `SH-LIST-004`).
- X-axis lower/upper redraw and invalid-range normalization (`SH-CTRL-005`).
- Normality and group-comparison p-value approximation disclaimer (`SH-CHART-005`).
- Lifecycle API methods and return behavior for `init`, `setData`, `setSettings`, `render`, `resize`, and `destroy` (`SH-API-001`).

The adapted tests intercept the demo fixture request with deterministic clinical-trial rows, then use the exposed nextgen instance and Chart.js bar metadata to exercise the canvas bar selection handler. This avoids PR #2's non-portable `.bar-group .bar` selectors while preserving behavior-level coverage.

## Harness comparison result

A direct branch merge of PR #2 into PR #1 is not clean:

```text
git merge --no-commit --no-ff pr-2-tests
CONFLICT (content): .gitignore
CONFLICT (content): package-lock.json
CONFLICT (content): package.json
CONFLICT (add/add): playwright.config.js
```

The current PR #2 browser harness is not drop-in compatible with PR #1 because it targets legacy Webcharts/SVG selectors such as `.bar-group .bar`, `.normal-ranges rect.normal-range__rect`, and SVG `fill-opacity`. PR #1 renders the primary histogram with Chart.js canvas and uses different DOM affordances for click/listing behavior.

## Contradiction cleanup

- PR #1 body says p-value annotations, listing search, and sortable listing columns are known gaps.
- PR #1 matrix says `SH-CHART-005` and `SH-LIST-004` are implemented.
- Code inspection of PR #1 found:
  - `src/index.js` renders approximate normality annotations when `test_normality` is enabled and labels them as a browser-side screen.
  - `src/index.js` includes `.sh-listing-search` with `oninput` filtering.
  - `src/index.js` sorts listing rows when table headers are clicked.

Disposition: keep `SH-CHART-005` as implemented approximation requiring reviewer acceptance or statistical validation deferral; treat `SH-LIST-004` as implemented but missing executable harness coverage. The PR body should be updated to say these are coverage/validation gaps, not absent implementation.

## Checks run locally

```text
npm install --cache /private/tmp/npm-cache-safety-histogram-issue6
npm test
```

Result: `npm test` passed and rebuilt `safetyHistogram.js`.

```text
node --check tests/e2e/safety-histogram.spec.js
npm run test:e2e -- --project=chromium
```

Result: syntax check passed. The browser run is still blocked before executing assertions by the local macOS Chromium Mach port sandbox:

```text
FATAL:base/apple/mach_port_rendezvous_mac.cc:159] Check failed: kr == KERN_SUCCESS. bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)
```

I installed/used Playwright Chromium under `/Users/obot/.openclaw/tmp/ms-playwright` to avoid the default external cache, but the runner still cannot launch Chromium because of the known macOS Mach port sandbox. The new GitHub Actions workflow installs Chromium on Ubuntu and should provide executable browser evidence once pushed.

## Recommended sequence

1. Keep PR #2 as the reviewed-requirement harness baseline, but adapt it onto PR #1 rather than merging it wholesale.
2. Land the adapted PR #1 browser harness and workflow, then use GitHub Actions as the authoritative browser evidence because local Chromium remains sandbox-blocked.
3. Add a stable assertion for the Chart.js normal-range overlay if reviewer requires visual proof beyond the control/default-state and p-value/listing coverage now present.
4. Update the PR #1 body/ready-review note so p-values/search/sort are classified as implemented-with-executable-coverage/validation-gaps rather than absent implementation.
5. Re-run GitHub Actions/browser evidence after this adapted harness lands.
