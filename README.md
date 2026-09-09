# US datacenter comparison, 2026

An interactive map for exploring state-level conditions for hyperscale and AI training development. [Live site](https://sonnetx.github.io/datacenter-map/).

## Interface

- Find a state above the map, select a leading candidate, or use the map, scatter plot or table.
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
| `rr` | Reception and regulation. Context only, contributes no points. |
| `srcs` | Optional list of citations. |

Ratings run 1 to 5 with higher being more favorable, including for hazard and water, where a high score means low risk. A citation is `{"t": title, "u": https url, "type": publisher role}`, with optional `supports` and `reviewed` describing what a checked document actually establishes. Titles cap at 60 characters so they fit the profile panel. Permitted `type` values are listed in the validator.

## Reception and regulation

The `rr` record answers two questions the fit score deliberately does not. How has a state received datacenter development, and how much datacenter-specific rule is there to clear? Neither feeds the score, the ranking or the delivery signal, and `tests/model.test.cjs` asserts that the whole record can be stripped from the dataset without moving a single number. The profile's Reception tab shows it, and the comparison table carries a pushback column and a count of rules in force.

`rr.pb` records reception as Low, Moderate or High pushback. Low means no organized opposition or local restriction on record. Moderate means local restrictions or contested proceedings in some jurisdictions. High means multiple local bans, a statewide restriction that cleared a chamber, or a referendum. Local action counts here rather than on the rule axes, which stay strictly statewide.

`rr.wt`, `rr.pg`, `rr.zn` and `rr.tx` cover water, power and ratepayer cost, siting and zoning, and tax incentives. Each runs on one scale.

| Value | Meaning | For `tx` |
|---|---|---|
| -1 | A state rule eases entry or preempts ordinary review | Incentive widened |
| 0 | No datacenter-specific rule in force | Incentive unrestricted, or none offered |
| 1 | Disclosure, reporting or study requirement in force | Conditional eligibility |
| 2 | Binding conditions in force | Narrowed or paused |
| 3 | A pause, moratorium or prohibition in force | Repealed or barred |

Only what is in force counts. A pending bill sits at 0 no matter how far it has travelled, and `rr.n` says what is pending. Keeping proposals out of the numbers is what stops the axes from tracking legislative noise, and it is why a state can show four zeroes while its legislature is busy. `rr.n` is one to three sentences naming the statutes, executive orders and local actions behind the row.

These readings are provisional analyst judgments on the same footing as the seven 1-5 factors, and they have not been individually validated against original records.

## Releasing the data

The page offers the dataset as CSV, one row per state with the `rr` record flattened, and as JSON matching `data/states.json`. Both are generated in the browser from the loaded data, so they cannot drift from what the page shows.

`DATA_REQUEST_ENDPOINT` near the bottom of `src/template.html` controls whether a short form comes first. Leave it empty and the download stands alone. Set it to a form endpoint that accepts a POST and emails the submission, such as a Formspree form URL, and visitors give a name, email, organization and intended use before the download appears. A failed send still hands over the file: the data is openly licensed and sits in this repository, so the form asks who is using it rather than restricting access, and the page says so.

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

Fork the repository, push your work to a branch there and open a pull request. Nobody pushes to `main` directly. A pull request lands once CI is green, review comments are resolved and the maintainer has approved it, and pushing a new commit clears an earlier approval. CI on a pull request from a fork waits for a maintainer to start it, so a run that sits pending is normal rather than broken.

## License

Code is MIT. The state records and written analysis are CC BY 4.0. Third-party map geometry and libraries keep their own terms. See [LICENSE](LICENSE).
