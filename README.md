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

## Repository layout

| Path | Role |
|---|---|
| `src/template.html` | The whole interface and model. Styles, markup and scoring code live here. |
| `data/states.json` | The 50 state records. Ratings, prose and citations. |
| `src/states-albers-10m.json`, `src/topojson-client.min.js` | Map geometry and the projection helper, inlined at build time. |
| `build.py` | Substitutes the data and geometry into the template and writes `index.html`. |
| `index.html` | Build output, checked in because GitHub Pages serves it directly. Never edit by hand. |
| `tests/` | Data validation, model tests and browser tests. |
| `review/` | Dated review and change records. Historical snapshots, not live documentation. |

## State record schema

Each entry in `data/states.json` uses short keys. `tests/validate_data.py` enforces all of this and names the offending state and field.

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
| `srcs` | Optional list of citations. |

Ratings run 1 to 5 with higher being more favorable, including for hazard and water, where a high score means low risk. A citation is `{"t": title, "u": https url, "type": publisher role}`, with optional `supports` and `reviewed` describing what a checked document actually establishes. Titles cap at 60 characters so they fit the profile panel. Permitted `type` values are listed in the validator.

## Working on it

Install nothing for the core loop. You need Python 3 and Node 22 or newer.

```sh
python3 tests/validate_data.py      # check state records before anything else
python3 build.py                    # regenerate index.html
node --test tests/model.test.cjs    # scoring tests, run against the real model
```

The model tests extract the scoring code straight out of `src/template.html` and run it under `node:vm`, so there is no second copy of the model to drift. Browser tests need Playwright and Chromium:

```sh
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/browser.py
```

Two things catch people out. Editing `src/template.html` or `data/states.json` without running `build.py` changes nothing that visitors see, since Pages serves the checked-in `index.html`. And adding a `tag` to a state without adding `srcs` fails validation on purpose, because a flagged policy action is the claim readers are most likely to check.

CI runs the validator, the model tests, a browser pass and a staleness check on `index.html` for every pull request.

## Contributing

Corrections to state records are the most useful contribution, especially citations for the 32 states that do not yet have any. A good pull request cites a primary source, says what the source establishes, and adjusts the rating only when the evidence contradicts it. Ratings are analyst judgments and reasonable people move them a level either way, so explain the reasoning in the description rather than only changing the number.

## License

Code is MIT. The state records and written analysis are CC BY 4.0. Third-party map geometry and libraries keep their own terms. See [LICENSE](LICENSE).
