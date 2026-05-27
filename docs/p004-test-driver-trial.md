# P004 test-driver trial: safety-histogram reviewed requirements

## Test-driver evidence

- Renderer: `safety-histogram`
- Source requirements: `/private/tmp/safety-agent-edit/docs/requirements/safety-histogram.md`
- Reviewed requirement IDs in this trial: `SH-FUNC-004A`, `SH-FUNC-004B`, `SH-FUNC-004C`, `SH-FUNC-005A`, `SH-FUNC-005B`, `SH-FUNC-005C`, `SH-FUNC-005D`, `SH-FUNC-010`, `SH-FUNC-011`, `SH-FUNC-012`
- Implementation/demo inspected: local repo `/Users/obot/.openclaw/workspace/projects/safety-histogram`, branch `test-driver/safety-histogram-trial`; root demo page `test-page/index.html` and `test-page/index.js`
- Commands run:
  - `git -C /Users/obot/.openclaw/workspace/projects/safety-histogram status --short --branch`
  - `sed -n ... /private/tmp/safety-agent-edit/skills/p004-test-driver/SKILL.md`
  - `sed -n ... /private/tmp/safety-agent-edit/docs/test-framework.md`
  - `sed -n ... /private/tmp/safety-agent-edit/docs/requirements/safety-histogram.md`
  - `find . -maxdepth 3 -type f | sort | head -200`
  - `cat package.json`
  - `find src/test-page ...` which confirmed there is no `src/test-page`; the actual demo is `test-page/`
  - inspected `test-page/index.html`, `test-page/index.js`, `src/index.js`, `src/layout.js`, `src/configuration/*`, and the relevant `src/callbacks/*` files
  - `npm test` failed because dependencies are not installed (`Cannot find module '@babel/register'`)
- Tests added: none. This bounded trial only writes this QA/test-driver plan.
- Console result: not browser-run in this trial. Static inspection found an unconditional `console.log(...)` in `src/callbacks/onResize/addBinEventListeners/click.js`, which will likely create expected console noise on every bar click unless intentionally allowed or removed by implementation work.

## Actual repo test readiness assessment

The repository is not ready to run the P004 test-driver workflow as executable Vitest/Playwright evidence without test harness work.

What exists:

- `package.json` has legacy scripts:
  - `npm test`: runs two statistical result generators under `test/`.
  - `npm run bundle`: Rollup bundle.
  - `npm run build`: runs `npm audit fix`, bundle, format, wiki generation, and schema check.
  - `npm run test-page`: Windows-specific browser launch command using `start chrome`, `start firefox`, and `start iexplore`.
- Existing tests are generator/comparison scripts for Shapiro-Wilk and Kolmogorov-Smirnov calculations, not requirement-tagged UI tests.
- The demo page exists at `test-page/index.html`, not `src/test-page`.
- The demo loads external CDN scripts/styles and remote CSV data from GitHub, so it is useful for manual/browser smoke testing but not deterministic enough as the only CI fixture.
- Source uses ES modules and Webcharts/D3 v3. Unit/integration tests will need a transform strategy compatible with this package's current Babel/Rollup setup or a modern test harness that can import source modules safely.

Current blocker to running even the existing test script:

```text
npm test
Error: Cannot find module '@babel/register'
```

`node_modules` is absent. I did not run `npm install` because this trial's write scope is `docs/p004-test-driver-trial.md` only.

## Existing scripts and gaps

### Existing scripts

- `test`: statistical generators only. No assertions are wired to fail on mismatches unless the generators themselves throw; not mapped to these reviewed UI requirements.
- `bundle`: creates `safetyHistogram.js` via Rollup.
- `build`: unsuitable as a routine CI evidence command in this repo state because it starts with `npm audit fix`, which can mutate dependency files before tests.
- `test-page`: not portable to macOS/Linux CI and not suitable for Playwright.

### Gaps for the reviewed SH-FUNC rows

- No `vitest` dependency or `npm run test:unit` / `npm run test:integration` script.
- No `@playwright/test` dependency or `npm run test:browser` script.
- No deterministic local fixture for the reviewed normal-range, x-axis-limit, and listing interactions.
- No static serving script for the demo bundle.
- No test IDs. Tests can use existing classes/labels, but selectors would be less brittle if implementation eventually adds stable `data-testid` attributes.
- No browser-console assertion layer.
- No requirement IDs in existing tests or scripts.

## Requirement-to-evidence mapping for this trial

| Requirement | Proposed primary layer | Notes |
|---|---:|---|
| `SH-FUNC-004A` | Playwright browser, plus optional jsdom integration | Needs rendered SVG position/size assertion for `.normal-range__rect`. |
| `SH-FUNC-004B` | Playwright browser | Verify control is present unchecked by default when `display_normal_range: false`; checking it draws the band. Current root test page sets `display_normal_range: true`, so a dedicated fixture page/config is needed. |
| `SH-FUNC-004C` | Playwright browser or integration | Needs fixture measure with no lower/upper normal values or settings without normal columns. Current implementation appears to remove the control only when `normal_range: false`, not per selected-measure data availability, so this may expose an implementation gap. |
| `SH-FUNC-005A` | Playwright browser, optional integration | Fill/step lower input, blur, assert x-domain/x-axis and redrawn bars. |
| `SH-FUNC-005B` | Playwright browser, optional integration | Fill/step upper input, blur, assert x-domain/x-axis and redrawn bars. |
| `SH-FUNC-005C` | Playwright browser | Existing code sets the `step` attribute to `this.measure.step`, not always `1`; Jeremy-confirmed row says stepper behavior by 1. Test will likely fail unless the implementation or requirement wording is reconciled. |
| `SH-FUNC-005D` | Playwright browser | Requires `blur` after typed value and a visible redraw/domain assertion. |
| `SH-FUNC-010` | Playwright browser | Click a bar and assert detail table headers and rows include participant ID, result, LLN, ULN. |
| `SH-FUNC-011` | Playwright browser | Click a bar and assert selected bar opacity `1` and unselected bars `0.5`. |
| `SH-FUNC-012` | Playwright browser | Click a bar and assert `.sh-foot-note--bar-details` reports the selected bar record count. |

## Proposed Vitest tests

Vitest should focus on deterministic setup and source-level behavior that does not require real SVG layout. These are proposed, not added in this trial.

Recommended files:

- `test/safety-histogram.requirements.test.js` for pure configuration and callback behavior.
- `test/fixtures/safetyHistogramReviewedFixture.js` for shared data/config.

Recommended package additions later:

```json
{
  "scripts": {
    "test:unit": "vitest run test/*.requirements.test.js --environment jsdom"
  },
  "devDependencies": {
    "vitest": "latest",
    "jsdom": "latest"
  }
}
```

Proposed Vitest cases:

1. `SH-FUNC-004B normal range starts hidden when display_normal_range is false`
   - Import `rendererSettings()` or instantiate the chart with `display_normal_range: false` in jsdom.
   - Assert synced/default setting `display_normal_range` is false unless explicitly enabled.
   - If instantiating full chart, assert `#normal-range input[type="checkbox"]` exists and is unchecked.

2. `SH-FUNC-004C removes or disables Normal Range control when selected measure has no normal range data`
   - Fixture includes two measures:
     - `Albumin (g/L)` with `STNRLO`/`STNRHI` populated.
     - `Pulse (beats/min)` with `STNRLO`/`STNRHI` empty or missing for every row.
   - Instantiate with `normal_range: true`.
   - Select no-normal-range measure and draw.
   - Expected assertion: `#normal-range` is hidden, removed, or disabled.
   - Likely implementation gap: `syncControlInputs()` only removes this control for global `normal_range: false`, not per measure availability.

3. `SH-FUNC-005A and SH-FUNC-005B x-domain limits are updated from lower/upper controls`
   - Full jsdom chart may be heavy because Webcharts depends on SVG layout; if viable, dispatch `change` events on `#lower input` and `#upper input`.
   - Assert `chart.config.x.domain[0]` and `[1]` update and survive `draw()`.
   - If direct full integration is unstable, leave x-domain assertions to Playwright only.

4. `SH-FUNC-005C lower and upper controls expose step=1`
   - Instantiate and inspect `#lower input` / `#upper input` `step` attributes.
   - Expected by requirement: `1`.
   - Likely implementation gap: `updateXAxisLimits.js` sets `step` to `this.measure.step`, which varies by measure range.

5. `SH-FUNC-010 detail listing has required default columns`
   - Test `syncSettings()` with default details and mappings.
   - Assert `settings.details` includes labels/columns for participant identifier, result, lower limit of normal, and upper limit of normal:
     - `USUBJID` / `Participant ID`
     - `STRESN` / `Result`
     - `STNRLO` / `Lower Limit of Normal`
     - `STNRHI` / `Upper Limit of Normal`

Vitest is not the best primary layer for `SH-FUNC-011` and `SH-FUNC-012`; those depend on rendered bars, click handlers, and DOM/SVG state, so Playwright should own them.

## Proposed Playwright tests

Recommended file:

- `tests/browser/safety-histogram.requirements.spec.js`

Recommended package additions later:

```json
{
  "scripts": {
    "test:browser": "playwright test tests/browser/*.requirements.spec.js --project=chromium"
  },
  "devDependencies": {
    "@playwright/test": "latest"
  }
}
```

Recommended serving approach:

- Add a deterministic fixture page under `test-page/requirements.html` or serve a Playwright-generated HTML page that imports the local built `safetyHistogram.js` and injects fixture data inline.
- Avoid relying on `https://raw.githubusercontent.com/RhoInc/data-library/.../adbds.csv` during CI.
- Build the bundle before browser tests, or use an ESM test harness that imports `src/index.js` directly.

Proposed Playwright cases:

1. `SH-FUNC-004B normal range control is visible and hidden by default`
   - Launch fixture with measure containing normal range data and settings `{ normal_range: true, display_normal_range: false }`.
   - Assert `#normal-range` is visible.
   - Assert `#normal-range input[type="checkbox"]` is unchecked.
   - Assert `.normal-ranges .normal-range__rect` count is `0` before activation.

2. `SH-FUNC-004A checking Normal Range renders band behind histogram bars`
   - From the same fixture, check `#normal-range input[type="checkbox"]`.
   - Assert `.sh-chart svg .normal-ranges .normal-range__rect` count is at least `1`.
   - Assert normal range group appears before `.bar-supergroup` in SVG DOM so the band is behind bars.
   - Assert rect has non-zero `width` and `height` and expected fill/stroke color if product accepts the current color. Note: requirement says gray band; current implementation uses `#c26683` pink/magenta. Treat color mismatch as an implementation issue unless Jeremy accepts this as visual approximation.

3. `SH-FUNC-004C hides Normal Range control for measure without normal range values`
   - Change `#measure select` to the no-normal-range fixture measure.
   - Assert `#normal-range` is hidden, absent, or disabled.
   - Assert checking/toggling is impossible and no `.normal-range__rect` renders.

4. `SH-FUNC-005A Lower Limit input updates x-axis minimum`
   - Use fixture where raw x-domain is known, e.g. `[10, 35]`.
   - Fill `#lower input` with `15`.
   - Blur the input.
   - Assert `#lower input` value normalizes to `15` or configured precision.
   - Assert left-most x-axis tick/domain reflects `15` and no bar data below `15` remains visible.
   - If the chart instance is exposed in fixture page as `window.__sh`, assert `window.__sh.config.x.domain[0] === 15`.

5. `SH-FUNC-005B Upper Limit input updates x-axis maximum`
   - Fill `#upper input` with `30`, blur.
   - Assert `window.__sh.config.x.domain[1] === 30` or equivalent axis tick/domain evidence.
   - Assert bars redraw for the limited domain.

6. `SH-FUNC-005C x-axis limit steppers increment and decrement by 1`
   - Assert `#lower input` and `#upper input` have `type="number"` and `step="1"`.
   - Use keyboard/DOM stepper equivalent if browser permits: focus lower input, call `input.stepUp()`, dispatch change/blur, assert value increased by 1.
   - Expected current risk: implementation sets `step` to a computed measure step instead of `1`.

7. `SH-FUNC-005D typed x-axis limit changes apply on blur and redraw histogram`
   - Record initial bar count/positions and x-domain.
   - Type a valid lower or upper value without pressing Enter.
   - Blur the input.
   - Assert x-domain changed and SVG bars/ticks changed after redraw.

8. `SH-FUNC-010 clicking a bar displays raw records in linked detail table`
   - Click `.sh-chart .bar-group` for a bin with known fixture rows.
   - Assert `.sh-listing` becomes visible.
   - Assert table headers include `Participant ID`, `Result`, `Lower Limit of Normal`, `Upper Limit of Normal`.
   - Assert at least one expected fixture row appears, including exact `USUBJID`, `STRESN`, `STNRLO`, and `STNRHI` values from the clicked bin.

9. `SH-FUNC-011 selected bar remains emphasized and unselected bars are lightened`
   - Click a bar.
   - Assert clicked `.bar` has `fill-opacity="1"`.
   - Assert at least one other `.bar` has `fill-opacity="0.5"`.
   - Assert only one `.bar-group.selected` exists across the main chart and small multiples, if small multiples are enabled.

10. `SH-FUNC-012 selected bar record count is displayed underneath chart`
    - Click a known bin.
    - Assert `.sh-foot-note--bar-details` text matches `Table displays ... <N> records ...` for the clicked bin.
    - Use fixture data with a bin that has an unambiguous count, ideally exactly 2 records, to avoid fragile statistical bin-boundary assumptions.

Every Playwright test should collect console messages and fail on unexpected `error` plus unexpected `warning`. Because current click handling logs a D3 selection with `console.log`, decide whether ordinary logs fail or are reported as noise.

## Exact fixtures needed

A deterministic fixture should be small, inline, and designed around predictable domains and bins. Proposed data shape uses the package defaults:

```js
const reviewedFixture = [
  { USUBJID: '01-001', TEST: 'Albumin', STRESU: 'g/L', STRESN: '10', STNRLO: '12', STNRHI: '30', SEX: 'F', ARM: 'Placebo' },
  { USUBJID: '01-002', TEST: 'Albumin', STRESU: 'g/L', STRESN: '12', STNRLO: '12', STNRHI: '30', SEX: 'M', ARM: 'Placebo' },
  { USUBJID: '01-003', TEST: 'Albumin', STRESU: 'g/L', STRESN: '18', STNRLO: '12', STNRHI: '30', SEX: 'F', ARM: 'Drug A' },
  { USUBJID: '01-004', TEST: 'Albumin', STRESU: 'g/L', STRESN: '24', STNRLO: '12', STNRHI: '30', SEX: 'M', ARM: 'Drug A' },
  { USUBJID: '01-005', TEST: 'Albumin', STRESU: 'g/L', STRESN: '30', STNRLO: '12', STNRHI: '30', SEX: 'F', ARM: 'Drug B' },
  { USUBJID: '01-006', TEST: 'Albumin', STRESU: 'g/L', STRESN: '35', STNRLO: '12', STNRHI: '30', SEX: 'M', ARM: 'Drug B' },
  { USUBJID: '02-001', TEST: 'Pulse', STRESU: 'beats/min', STRESN: '60', STNRLO: '', STNRHI: '', SEX: 'F', ARM: 'Placebo' },
  { USUBJID: '02-002', TEST: 'Pulse', STRESU: 'beats/min', STRESN: '70', STNRLO: '', STNRHI: '', SEX: 'M', ARM: 'Drug A' },
  { USUBJID: '02-003', TEST: 'Pulse', STRESU: 'beats/min', STRESN: '80', STNRLO: '', STNRHI: '', SEX: 'F', ARM: 'Drug B' }
];
```

Recommended settings for the normal-range/x-axis/detail trial page:

```js
const reviewedSettings = {
  filters: [
    { value_col: 'SEX', label: 'Sex' },
    { value_col: 'ARM', label: 'Treatment Group' }
  ],
  groups: [{ value_col: 'ARM', label: 'Treatment Group' }],
  start_value: 'Albumin (g/L)',
  bin_algorithm: 'Custom',
  x: { bin: 5 },
  normal_range: true,
  display_normal_range: false,
  annotate_bin_boundaries: true,
  test_normality: false,
  compare_distributions: false
};
```

Important fixture notes:

- The fixture page should expose `window.__sh = instance` after `instance.init(reviewedFixture)` so browser tests can assert chart state without depending only on pixel/SVG interpretation.
- If `x.bin` cannot be supplied through settings as shown above because `syncSettings()` overwrites or expects another field, use `bin_algorithm: 'Custom'` with the package-supported `x.bin`/`x.bin_algorithm` values after confirming via a smoke test.
- For `SH-FUNC-010`/`SH-FUNC-012`, fixture bins must be calibrated so one clicked bar maps to a known row set. If Webcharts' binning boundaries make that ambiguous, add a fixture helper that selects the first bar and reads `window.__sh.highlighteD.values.raw` after click, then asserts the DOM table matches the same raw records.

## Exact selectors needed

Use current selectors where possible:

- Renderer root: `.safety-histogram`
- Controls wrapper: `.sh-controls .wc-controls`
- Measure control: `#measure select`
- Normal Range control group: `#normal-range`
- Normal Range checkbox: `#normal-range input[type="checkbox"]`
- Lower limit control group: `#lower`
- Lower limit input: `#lower input[type="number"]`
- Upper limit control group: `#upper`
- Upper limit input: `#upper input[type="number"]`
- Reset button, if needed for setup: `.x-axis-limits-grouping-fieldset button:has-text("Reset")`
- Main chart container: `.sh-chart`
- Main SVG: `.sh-chart svg`
- Histogram bar groups: `.sh-chart .bar-group`
- Histogram bars: `.sh-chart .bar-group .bar`
- Normal range group: `.sh-chart svg .normal-ranges`
- Normal range rectangles: `.sh-chart svg .normal-ranges .normal-range__rect`
- Listing container: `.sh-listing`
- Listing table: `.sh-listing table`
- Listing headers: `.sh-listing table thead th` if Webcharts table markup includes `thead`; otherwise use `.sh-listing th`
- Listing rows: `.sh-listing table tbody tr` if present; otherwise `.sh-listing tr`
- Click prompt / clear link: `.sh-foot-note--bar-click`
- Selected-bar details note: `.sh-foot-note--bar-details`
- Small multiples, if enabled: `.sh-multiples .wc-small-multiples .wc-chart`

Recommended future stable selectors:

- `data-testid="sh-root"`
- `data-testid="sh-measure"`
- `data-testid="sh-normal-range-toggle"`
- `data-testid="sh-lower-limit"`
- `data-testid="sh-upper-limit"`
- `data-testid="sh-main-bar"` with `data-bin-low`/`data-bin-high`
- `data-testid="sh-normal-range-band"`
- `data-testid="sh-detail-table"`
- `data-testid="sh-bar-details-note"`

## Blockers and likely implementation issues surfaced by the trial

1. Dependencies are absent in the worktree, so existing scripts cannot run without installing `node_modules`.
2. The current package has no Vitest or Playwright infrastructure.
3. The root demo page depends on CDN scripts and remote CSV; this is not deterministic enough for CI/browser evidence.
4. `src/test-page` does not exist despite being named in the task; actual demo files are under `test-page/`.
5. `SH-FUNC-004C` may not be implemented. Static inspection only found global removal of the normal-range control when `settings.normal_range` is false; I did not find selected-measure logic that hides/disables it when normal values are unavailable.
6. `SH-FUNC-005C` may conflict with implementation. The code sets x-axis input `step` to a computed `this.measure.step`, while the reviewed requirement says stepper behavior by 1.
7. `SH-FUNC-004A` says gray normal-range band/rectangle; current implementation draws `fill`/`stroke` `#c26683`. That may be a visual parity gap.
8. Bar click currently calls `console.log(safetyHistogram.svg.selectAll('.bar-group'))`, which will pollute browser-console evidence.
9. `npm run build` includes `npm audit fix`, which is mutating and unsuitable as a clean test prerequisite.
10. Existing code has a typo in deselect footnote text: `Bar encompases ...`; not in the selected reviewed rows unless tests exercise deselection, but worth noting.

## Handoff notes

- Keep product changes separate from test-driver changes. This trial intentionally did not edit source, package metadata, requirements, or fixtures.
- First implementation-independent next step: add a dedicated deterministic requirement demo/fixture page and Playwright harness in a test-driver commit.
- After the harness exists, run the proposed Playwright tests before changing product behavior. Expected first failures are likely `SH-FUNC-004C`, `SH-FUNC-005C`, color for `SH-FUNC-004A`, and console noise on `SH-FUNC-010`/`SH-FUNC-011`/`SH-FUNC-012` clicks.
- Prefer browser evidence as primary for all ten reviewed rows because they are UI/rendered behavior requirements. Use Vitest only to pin configuration defaults and listing-column setup where it reduces browser-test complexity.
- If Jeremy wants exact legacy visual parity, clarify whether the normal-range band must literally be gray or whether the current translucent colored band is acceptable.

## Follow-up: setup/write-tests skill split trial

This branch now contains a first executable test-driver harness, split according to the safety-agent skills:

- `p004-test-setup`: checked requirement matrix readiness, installed test dependencies, added scripts/config/fixture page.
- `p004-write-tests`: wrote concrete Vitest and Playwright tests for reviewed histogram rows.

Files added by the write-tests phase:

- `playwright.config.js`
- `test/fixtures/safetyHistogramReviewedFixture.js`
- `test/safety-histogram.requirements.test.js`
- `test-page/requirements/index.html`
- `test-page/requirements/requirements.js`
- `tests/browser/safety-histogram.requirements.spec.js`

Package scripts added:

- `npm run test:unit`
- `npm run test:browser`
- `npm run serve:test`

Commands run on 2026-05-26:

```text
npm --cache /Users/obot/.openclaw/tmp/npm-cache install --save-dev vitest @playwright/test jsdom http-server
npm run test:unit
PLAYWRIGHT_BROWSERS_PATH=/Users/obot/.openclaw/tmp/ms-playwright npx playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/Users/obot/.openclaw/tmp/ms-playwright npm run test:browser
```

Results:

- `npm run test:unit`: passed, 3 tests / 1 file.
- First `npm run test:browser`: failed because Playwright browser binaries were not installed.
- After installing Chromium to a writable sandbox cache, `npm run test:browser`: still failed before page execution because sandboxed Chromium cannot register its macOS Mach port:
  - `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer... Permission denied (1100)`

Interpretation:

- The setup/write-tests skill split is useful and produced real tests, not just a plan.
- Unit-level evidence can run in the current sandbox.
- Direct Playwright browser execution remains blocked in this sandbox. Browser tests should run in GitHub Actions or through OpenClaw's managed browser path rather than launching Chromium directly from the sandbox.
- No implementation changes were made in this commit. This remains a `test-driver:` change set.

## Follow-up: GitHub Actions test-driver framework

Added `.github/workflows/test-driver.yml` for CI execution of the test-driver harness.

Jobs:

- `unit`: installs with `npm ci`, runs `npm run test:unit`, runs legacy `npm test`, and fails if the legacy result generator mutates committed result CSVs.
- `browser`: installs with `npm ci`, installs Playwright Chromium with system dependencies, runs `npm run test:browser`, and uploads Playwright reports/traces on success or failure.

Purpose:

- Keep browser execution out of the local macOS sandbox where direct Chromium launch is blocked by Mach port permissions.
- Make test-driver commits produce visible GHA evidence on the PR.
- Preserve separation between test-driver evidence and implementation work.
