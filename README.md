# US datacenter comparison, 2026

An interactive map for exploring state-level conditions for hyperscale and AI training development. [Live site](https://sonnetx.github.io/datacenter-map/).

## Interface

- Find a state above the map, select a leading candidate, or use the map, scatter plot or table.
- State profiles open in a side panel with Overview, Scores and Sources tabs. Profiles support keyboard navigation and close with Escape.
- Choose Balanced, Build sooner, Lower costs, Lower risk or Connectivity first, then adjust relative priorities. Effective percentage shares update automatically.
- Switch between Combined, Political outlook and Physical fundamentals without losing custom priorities. Editing a slider returns to Combined.
- Priorities collapse above the map on mobile. Wide charts and tables scroll within their containers.

Hatching identifies a recorded 2026 statewide policy action. Its scope differs by state; consult the profile and original record.

## Model version 2

Balanced is the default: each of eight factors receives 12.5%. Fit is the weighted mean of their normalized values, on a fixed 0–100 scale.

| Factor | Input and normalization |
|---|---|
| Power cost | EIA 2024 industrial average; 100 at 5¢/kWh, 0 at 35¢/kWh, linear between, clamped outside. Users can change these preference anchors. |
| Power headroom | Provisional analyst rating, 1–5 |
| Incentives and policy | Provisional analyst rating, 1–5 |
| Community and permitting | Provisional analyst rating, 1–5 |
| Water | Provisional analyst rating, 1–5 |
| Natural hazard | Provisional analyst rating, 1–5 |
| Climate for cooling | Provisional analyst rating, 1–5 |
| Connectivity and ecosystem | Provisional analyst rating, 1–5 |

Analyst ratings map to 0, 25, 50, 75 and 100. Equal steps are an assumption, not measured differences. Momentum remains context and contributes no points.

Delivery concerns use the lower of headroom and permitting: 1 = major, 2 = elevated, 3–5 = lower. Default ranking compares fit; optional Delivery first compares concern groups before fit. These groups are model judgments, not confirmed connection timelines or permitting eligibility.

Each profile reports the rank range obtained by moving one active analyst rating one level at a time, holding other states fixed. Delivery first also varies headroom and permitting when their fit weights are zero. This limited sensitivity test is not a confidence interval. Exact ties share ranks; all-zero weights remove scores and ranks.

Reference weights: Political outlook = policy 50%, permitting 50%. Physical fundamentals = headroom 30%, price 25%, water 20%, hazards 15%, climate 10%. Cost anchors also affect the physical reference score.

## Evidence

All 50 electricity prices matched the EIA-861 historical workbook's 2024 industrial data, Total Electric Industry sheet. These are historical state averages, not datacenter tariffs. Seven analyst factors remain provisional and have not been individually validated against original records.

State citations carry `type`, with optional `supports` and `reviewed` fields explaining a checked document's scope. Source type identifies the publisher's role, not a credibility rating. Company announcements are self-reported; advocacy statements describe their publisher's position. References to policy events do not establish numerical ratings.

See the [model and source change record](review/2026-09-07-model-v2.md), [initial review](review/2026-09-07-review.md), and [EIA comparison](review/power-price-check-2026-09-07.csv). The initial review and HTTP audit are historical snapshots and include sources subsequently removed.

## Development and deployment

Edit `src/template.html` for the interface/model and `data/states.json` for state records. Rebuild the checked-in page and run the scoring tests:

```sh
python3 build.py
node --test tests/model.test.cjs
```

The model tests run the actual scoring code with Node's built-in test runner; no package install is needed. Browser interaction tests require Python Playwright and Chromium:

```sh
python3 tests/browser.py
```

Map geometry and TopoJSON are inlined into `index.html`; external fonts are optional. GitHub Pages deploys `index.html` from the root of `main` after a push.
