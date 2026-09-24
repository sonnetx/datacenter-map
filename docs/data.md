# State record schema

`tests/validate_data.py` validates every record in `data/states.json` and reports errors by state and field.

| Key | Meaning |
|---|---|
| `a` | Two-letter postal code. Must be one of the 50 states, no duplicates. |
| `n` | State name. |
| `p` | EIA 2024 industrial price in cents per kWh. |
| `sr` | NASA POWER 2001-2020 December mean irradiance at the population center, kWh/m²/day. |
| `sy` | NASA POWER 2001-2020 annual mean irradiance at the same point, kWh/m²/day. Context only in the model. Must be at least `sr`. |
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

Ratings run 1 to 5 with higher being more favorable, including for hazard and water, where a high score means low risk.

A citation is `{"t": title, "u": https url, "type": publisher role}`, with optional `supports` and `reviewed` fields describing what a checked document actually establishes. Titles cap at 60 characters so they fit the profile panel. The validator lists the permitted `type` values.

## Reception and regulation

The `rr` record describes public response and statewide regulation. It does not affect fit, rankings or delivery concerns, and the model tests verify this independence. The Reception tab displays the record, and the comparison table reports pushback and the number of regulatory categories with requirements in force.

`rr.pb` classifies pushback as Low (no recorded organized opposition or local restriction), Moderate (local restrictions or contested proceedings in some jurisdictions), or High (multiple local bans, a statewide restriction passed by one chamber, or a referendum). Local actions inform pushback. The regulatory axes cover statewide measures only.

`rr.wt`, `rr.pg`, `rr.zn` and `rr.tx` describe water, power and ratepayer costs, siting and zoning, and tax incentives.

| Value | Rule in force | Tax incentive status (`tx`) |
|---|---|---|
| -1 | Facilitates entry or preempts ordinary review | Expanded |
| 0 | No datacenter-specific rule | Unrestricted or unavailable |
| 1 | Disclosure, reporting or study requirement | Conditional eligibility |
| 2 | Binding conditions | Narrowed or paused |
| 3 | Pause, moratorium or prohibition | Repealed or barred |

Pending bills do not affect these values. `rr.n` summarizes relevant statutes, executive orders, proposals and local actions in one to three sentences. Classifications are provisional analyst judgments, and nobody has individually verified them against original records.

## Downloads

The page exports CSV with one row per state and flattened `rr` fields, or JSON matching `data/states.json`. Both use the loaded dataset. Downloads require no registration, and GoatCounter records CSV and JSON download events.
