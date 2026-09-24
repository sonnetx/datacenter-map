# Scoring model, version 3

Balanced is the default. Each of the eight grid-siting factors receives 12.5% and winter solar resource receives 0%. Fit is the weighted mean of the normalized values, on a fixed 0 to 100 scale. Version 3 added the solar factor and the off-grid band on September 23, 2026. Every version 2 preset and band weights solar at zero, so version 2 output is unchanged.

| Factor | Input and normalization |
|---|---|
| Power cost | EIA 2024 industrial average. 100 at 5¢/kWh, 0 at 35¢/kWh, linear between, clamped outside. Users can change these preference anchors. |
| Winter solar resource | NASA POWER 2001-2020 December mean all-sky irradiance at the state's 2020 Census center of population, kWh/m²/day. 0 at 1.0, 100 at 4.0, linear between, clamped outside. One grid cell per state. |
| Power headroom | Provisional analyst rating, 1 to 5 |
| Incentives and policy | Provisional analyst rating, 1 to 5 |
| Community and permitting | Provisional analyst rating, 1 to 5 |
| Water | Provisional analyst rating, 1 to 5 |
| Natural hazard | Provisional analyst rating, 1 to 5 |
| Climate for cooling | Provisional analyst rating, 1 to 5 |
| Connectivity and ecosystem | Provisional analyst rating, 1 to 5 |

Analyst ratings map to 0, 25, 50, 75 and 100. Equal steps are an assumption, not measured differences. Momentum remains context and contributes no points.

Reference weights for the two alternate views are fixed. Political outlook weights policy 50% and permitting 50%. Physical fundamentals weights headroom 30%, price 25%, water 20%, hazards 15% and climate 10%. Cost anchors also affect the physical reference score.

## Project size

| Band | Range | Starting weights (pw, p, po, op, w, h, c, x, sr) | Floors (headroom, permitting) |
|---|---|---|---|
| Edge or micro | under 5 MW | 5, 15, 5, 10, 0, 15, 10, 40, 0 | 2, 2 |
| Enterprise or colocation | 5 to 50 MW | 15, 15, 10, 10, 5, 10, 5, 30, 0 | 3, 2 |
| Hyperscale (default) | 50 to 300 MW | 25, 20, 15, 15, 10, 5, 5, 5, 0 | 3, 3 |
| Gigawatt campus | 300 MW and up | 35, 25, 10, 20, 5, 5, 0, 0, 0 | 4, 3 |
| Off-grid solar and battery | self-powered, any size | 0, 0, 5, 20, 0, 15, 15, 10, 35 | 1, 3 |

Delivery concerns compare headroom and permitting with the size floors. At or above the floor is lower, one level below is elevated, and two or more below is major. The worse factor sets the level. Hyperscale reproduces the original rule (1 is major, 2 is elevated, 3 to 5 is lower), so the default output is unchanged. Floors are analyst judgments about scale, not measured capacity, and state ratings do not change with size. Default ranking compares fit. The optional Delivery first rule compares concern groups before fit. These groups are model judgments, not confirmed connection timelines or permitting eligibility. See [the project size record](../review/2026-09-20-project-size.md).

A headroom floor of 1 means headroom never raises a concern, so the off-grid band groups states by permitting alone. Its workload buttons set connectivity to 10 (batch inference), 25 (real-time serving) or 40 (distributed training) and leave every other weight in place. Battery autonomy, land, local maintenance and physical security have no state-level public source, so the model leaves them out. See [the solar factor record](../review/2026-09-23-solar-factor.md).

## Sensitivity and ties

Each profile reports the rank range obtained by moving one active analyst rating one level at a time, holding other states fixed. Delivery first also varies headroom and permitting when their fit weights are zero. This limited sensitivity test is not a confidence interval. Exact ties share ranks. All-zero weights remove scores and ranks.

## Scenario links

The address records the scenario, and each parameter is omitted at its default.

| Parameter | Meaning |
|---|---|
| `z` | Project size |
| `w` | Nine weights in factor order. Eight-weight links from version 2 still open, with solar read as zero. |
| `v` | View (Combined, Political outlook, Physical fundamentals) |
| `r` | Ranking rule |
| `c` | Price anchors as `low-high` |
| `f` | Figure |
| `s` | Shortlist postal codes |
| `p` | Preset name, read only when `w` is absent |

## Evidence

All 50 electricity prices matched the EIA-861 historical workbook's 2024 industrial data, Total Electric Industry sheet. These are historical state averages, not datacenter tariffs. Solar irradiance comes from the NASA POWER climatology API at each state's 2020 Census center of population, and eight states were spot-checked against NREL's solar resource service. It is one grid cell per state, not a site survey. Seven analyst factors remain provisional, and nobody has individually validated them against original records.

The power-demand context section records EIA's September 9, 2026 national electricity-sales forecasts for 2026 and 2027 and the commercial sector's share of 2026 sales growth. These dated forecasts do not affect state ratings or rankings. See [the source review](../review/2026-09-13-demand-context.md).

Source type identifies the publisher's role, not a credibility rating. Company announcements are self-reported, and advocacy statements describe their publisher's position. References to policy events do not establish numerical ratings.

The [model and source change record](../review/2026-09-07-model-v2.md), [initial review](../review/2026-09-07-review.md) and [EIA comparison](../review/power-price-check-2026-09-07.csv) hold the earlier checks. The initial review and HTTP audit are historical snapshots and include sources removed since.
