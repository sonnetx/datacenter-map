# US datacenter comparison, 2026

An interactive map for exploring state-level conditions for hyperscale and AI training development. [Live site](https://sonnetx.github.io/datacenter-map/).

## Interface

- Find a state above the map, select a leading candidate, or use the map, scatter plot or table.
- The map card holds twelve figures of the same 50 states, one at a time. Choose one from the row of buttons, or leave it rotating every eight seconds. Rotation stops for good the first time you click, key or scroll inside the card, and never starts when the browser asks for reduced motion.
- Every figure that can answer the priority sliders does. Relief, cartogram, prices, profiles, ranks, flow, uncertainty and count all re-read your weights; spread, glyphs and screens are fixed by construction and their notes say so. Each figure names what it hides as well as what it shows.
- State profiles open in a side panel with Overview, Scores, Reception and Sources tabs. Profiles support keyboard navigation and close with Escape.
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

## Repository layout

| Path | Role |
|---|---|
| `src/template.html` | Interface styles, markup, scoring model and the twelve figures. |
| `data/states.json` | Ratings, summaries and citations for 50 states. |
| `src/states-albers-10m.json`, `src/topojson-client.min.js` | Map geometry and the projection helper, inlined at build time. |
| `build.py` | Substitutes the data and geometry into the template and writes `index.html`. |
| `index.html` | Build output, checked in because GitHub Pages serves it directly. Never edit by hand. |
| `tests/` | Data validation, model tests and browser tests. |
| `review/` | Dated review and change records. Historical snapshots, not live documentation. |

## State record schema

`tests/validate_data.py` validates the following fields and reports errors by state and field.

| Key | Meaning |
|---|---|
| `a` | Two-letter postal code. Must be one of the 50 states, no duplicates. |
| `n` | State name. |
| `p` | EIA 2024 industrial price in cents per kWh. |
| `pw` | Power headroom, 1 to 5. |
| `po` | Incentives and policy, 1 to 5. |
| `op` | Community and permitting, 1 to 5. |
| `w` | Water, 1 to 5. |
| `h` | Natural hazard, 1 to 5. |
| `c` | Climate for cooling, 1 to 5. |
| `x` | Connectivity and ecosystem, 1 to 5. |
| `mo` | Buildout momentum, 1 to 5. Context only, contributes no points. |
| `st` | Posture label. One of Courting, Courting with conditions, Reviewing or paused, Restrictive, No active state posture. |
| `tag` | Short label for a 2026 statewide action, or an empty string. A non-empty tag requires `srcs`. |
| `note` | Prose shown in the state profile. |
| `rr` | Reception and regulation. Context only, contributes no points. |
| `srcs` | Optional list of citations. |

Ratings run 1 to 5 with higher being more favorable, including for hazard and water, where a high score means low risk. A citation is `{"t": title, "u": https url, "type": publisher role}`, with optional `supports` and `reviewed` describing what a checked document actually establishes. Titles cap at 60 characters so they fit the profile panel. Permitted `type` values are listed in the validator.

## Reception and regulation

The `rr` record describes public response and statewide regulation. It does not affect fit, rankings or delivery concerns; model tests verify this independence. The Reception tab displays the record. The comparison table reports pushback and the number of regulatory categories with requirements in force.

`rr.pb` classifies pushback as Low (no recorded organized opposition or local restriction), Moderate (local restrictions or contested proceedings in some jurisdictions), or High (multiple local bans, a statewide restriction passed by one chamber, or a referendum). Local actions inform pushback; regulatory axes cover statewide measures only.

`rr.wt`, `rr.pg`, `rr.zn` and `rr.tx` describe water, power and ratepayer costs, siting and zoning, and tax incentives.

| Value | Rule in force | Tax incentive status (`tx`) |
|---|---|---|
| -1 | Facilitates entry or preempts ordinary review | Expanded |
| 0 | No datacenter-specific rule | Unrestricted or unavailable |
| 1 | Disclosure, reporting or study requirement | Conditional eligibility |
| 2 | Binding conditions | Narrowed or paused |
| 3 | Pause, moratorium or prohibition | Repealed or barred |

Pending bills do not affect these values. `rr.n` summarizes relevant statutes, executive orders, proposals and local actions in one to three sentences. Classifications are provisional analyst judgments and have not been individually verified against original records.

## Data downloads

The page exports CSV with one row per state and flattened `rr` fields, or JSON matching `data/states.json`. Both use the loaded dataset.

Downloads require no registration. GoatCounter records CSV and JSON download events.

## Development

Core validation and builds require Python 3 and Node 22 or newer.

```sh
python3 tests/validate_data.py      # check state records before anything else
python3 build.py                    # regenerate index.html
node --test tests/model.test.cjs    # scoring tests, run against the real model
```

Model tests execute scoring code from `src/template.html` in `node:vm`. Browser tests require Playwright and Chromium:

```sh
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/browser.py
```

Run `build.py` after editing the template or dataset: GitHub Pages serves the committed `index.html`. Each non-empty state `tag` requires `srcs` to support the recorded policy action.

CI runs the validator, the model tests, a browser pass and a staleness check on `index.html` for every pull request.

## Contributing

Corrections should cite primary sources, identify the claims they support, and explain any rating changes. State summaries and analyst ratings require further validation.

Fork the repository and submit a pull request. Changes to `main` require passing CI, resolved review comments and maintainer approval. New commits invalidate prior approval. CI for forked pull requests requires a maintainer to initiate the run.

## License

Code is MIT. The state records and written analysis are CC BY 4.0. Third-party map geometry and libraries keep their own terms. See [LICENSE](LICENSE).
