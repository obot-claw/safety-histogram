# Safety Histogram Nextgen Requirements Matrix

Source: RhoInc safety-histogram wiki Technical Documentation and Data Guidelines.

| ID | Requirement | Current nextgen coverage |
|---|---|---|
| SH-DATA-001 | Accept one record per measurement with measure/result columns. | Implemented via `measure_col` and `value_col`. |
| SH-DATA-002 | Remove missing or non-numeric results and report count. | Implemented with console warning and page note. |
| SH-DATA-003 | Support optional participant, unit, normal-low, normal-high, filters, and details columns. | Implemented. |
| SH-CTRL-001 | Measure selector updates displayed distribution. | Implemented. |
| SH-CTRL-002 | Configured filters subset chart data. | Implemented. |
| SH-CTRL-003 | Participant count updates when filters apply. | Implemented. |
| SH-CTRL-004 | Normal range checkbox displays normal range overlay when available. | Implemented. |
| SH-CTRL-005 | Lower/upper x-axis inputs update chart domain and flip invalid ranges. | Implemented; covered by `tests/e2e/safety-histogram.spec.js` once CI runs the Chart.js browser harness. |
| SH-CTRL-006 | Binning controls support algorithm, quantity, width, and custom mode. | Implemented. |
| SH-CTRL-007 | X-axis tick mode can show linear centers or bin boundaries. | Implemented. |
| SH-CHART-001 | Histogram bars show distribution for selected measure and filters. | Implemented using Chart.js. |
| SH-CHART-002 | Hovering over bars reports count and value range. | Implemented via tooltip and footnote. |
| SH-CHART-003 | Clicking a bar opens linked listing. | Implemented; covered by Chart.js canvas-selection browser harness. |
| SH-CHART-004 | Group-by control renders grouped histograms. | Implemented. |
| SH-CHART-005 | Normality and group-comparison p-value annotations. | Implemented as approximate browser-side screening annotations with info-icon links and validation disclaimer; disclaimer covered by browser harness. |
| SH-LIST-001 | Listing shows record details for clicked bin. | Implemented. |
| SH-LIST-002 | Listing pagination supports first/previous/next/last. | Implemented; next-page behavior covered by browser harness. |
| SH-LIST-003 | Listing CSV export is available. | Implemented; download filename covered by browser harness. |
| SH-LIST-004 | Listing search and sortable columns. | Implemented; search result filtering and sort indicators covered by browser harness. |
| SH-API-001 | Expose clean nextgen lifecycle API. | Implemented: `init`, `setData`, `setSettings`, `render`, `resize`, `destroy`; covered by browser lifecycle API harness. |
| SH-API-002 | Do not preserve Webcharts API as a requirement. | Implemented by replacing Webcharts dependency. |
