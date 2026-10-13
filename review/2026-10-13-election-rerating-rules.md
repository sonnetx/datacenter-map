# Election re-rating rules, October 13, 2026

We publish these rules before the November 3, 2026 elections so that later updates apply them mechanically, and the results cannot shape them. The pull request that adds this file fixes its date. The rules cover the incentives and policy rating (`po`), the community and permitting rating (`op`), the posture label and the pushback label. They take the corrected records of October 13 as their starting point (see `2026-10-13-record-corrections.md`).

## Principle

A rating or label changes only when an action takes effect. The data documentation already applies this test to the regulatory axes, where pending bills score 0. An election result, a governor-elect's pledge or a new majority on a utility commission changes no rating on its own. The profile prose records each of them with a source.

## Rating rules

The policy and permitting ratings have had no written rubric. These rules take the current records as precedent and name the states each rule rests on. Each rule caps a rating, and only rescission under R7 moves a rating in the favorable direction.

| Rule | Trigger, once in force | Record change | Rating change | Precedent |
|---|---|---|---|---|
| R1 | A statewide moratorium, or a statewide hold on state permits for all new data centers | `zn` 3 | `po` 1, `op` at most 2 | New York (Executive Order 62) |
| R2 | The state stops new approvals under its main data center incentive, or repeals that incentive entirely | `tx` 2 or 3 | `po` at most 2 | Arizona, Illinois, Ohio, Maine |
| R3 | The state repeals part of its incentive or narrows eligibility | `tx` 2 | `po` at most 3 | Minnesota, North Carolina |
| R4 | The state attaches conditions to incentive eligibility | `tx` 1 | None | Indiana, Idaho, Pennsylvania and Florida hold 5, 4, 3 and 3 |
| R5 | A binding ratepayer or cost-allocation statute or commission order | `pg` 2 | None | Tennessee, South Carolina, Wyoming, Oklahoma, Oregon |
| R6 | A pause that covers only some state approvals, such as state land | `zn` 3 | None | No precedent. Oregon is the first case |
| R7 | A governor rescinds an action, or it lapses at its stated end | The axis returns to its earlier value | The rating returns to its value before the action. If the record began after the action, the rating rises one level | No precedent yet |

R3 and R2 differ in scope. North Carolina repealed the electricity exemption and kept the equipment exemption, so R3 applies there. Nebraska repealed its exemption and closed ImagiNE to new data centers, so R2 applies there. Utah's review framework and Maryland's new order resemble each other, but one precedent is too few to set a rule, so neither moves on that basis. Power headroom changes only with a cited order or grid operator filing that states capacity or connection timelines.

## Pushback rules

The pushback definition stays as written in the data documentation, with three clarifications.

| Rule | Clarification |
|---|---|
| B1 | One in-force local data center moratorium or ban rules out Low. |
| B2 | A local referendum or initiative counts toward High when voters approve a binding restriction, such as a ban, a capacity cap, a voter approval requirement or the repeal of a rezoning. Advisory questions and measures that ease development do not count. |
| B3 | A state returns from Moderate to Low only when no local restriction remains in force. Permanent zoning that admits data centers only in some districts still counts as a restriction. |

We locate measures through the Moratorium Nation dataset, filtered to measures that cover data centers, and cite at least one ordinance, resolution or news report for each change.

## Changes these rules make to the corrected records

Applying the rules to the October 13 records moves five ratings. These changes land in a separate pull request after this one merges.

| State | Rule | Change |
|---|---|---|
| Texas | R1, for the TCEQ permit hold | `po` 3 to 1, `op` 3 to 2. R7 restores both when the hold lifts. |
| Nebraska | R2 | `po` 4 to 2 |
| Iowa | R3, for HF 976 | `po` 4 to 3 |
| Alabama | R3, for HB 399 | `po` 4 to 3 |

Massachusetts already sits at `po` 2 and needs no change under R2.

## States to watch

Ratings come from the prediction tables in each race's Wikipedia article on October 13, which carry the Cook Political Report (October 1), Sabato's Crystal Ball (October 6) and Inside Elections (October 1). We could not read those publishers' pages directly. Pledges are as reported in the sources listed below.

| State | In force now | Nominees and pledges | What would follow under the rules |
|---|---|---|---|
| Ohio | An exemption freeze that DeWine says lasts until he leaves office. Open seat, rated a tossup. | Acton (D) asks the legislature for a conditional moratorium. Ramaswamy (R) would end local property tax abatements. | If the freeze lapses in January with no successor action, R7 returns `tx` to 0 and raises `po` from 2 to 3. A moratorium statute would trigger R1. |
| Georgia | Sales tax exemption through 2032. The PSC is 3-2 Republican with two seats up. Open governor's seat, rated a tossup. | Bottoms (D) wants a statewide pause through the legislature or the PSC. Jackson (R) would approve only projects that do not raise local utility costs. Democrats take the PSC only by holding District 3 and winning District 5, possibly in a December 1 runoff. | Nothing on the result. A PSC order on large-load terms triggers R5 and can support a headroom review. |
| Nevada | Executive Order 2026-005 conditions abatements. Rated a tossup. | Ford (D) would stop abatements. Lombardo (R) keeps his order. | A stop to abatements triggers R2, so `po` falls from 4 to at most 2. |
| Michigan | 2024 exemption in force. Open seat, lean Democratic. | Benson (D) pledges a statewide moratorium and an end to the tax breaks. James (R) leaves siting to localities. | A moratorium in force triggers R1, so `po` falls from 4 to 1 and `op` stays at most 2. A repeal triggers R2. |
| Kansas | SB 98 exemption (2025 statute). Open seat, lean Republican. | Holscher (D) backs a moratorium. Masterson (R) defends SB 98. | A moratorium in force triggers R1, so `po` falls from 4 to 1 and `op` from 4 to 2. A repeal triggers R2. |
| Oregon | POWER Act and a state land pause to July 1, 2027. Lean Democratic. | Kotek (D) seeks a statewide moratorium in 2027. Drazan (R) opposed the POWER Act. | A statewide moratorium triggers R1, so `po` falls from 3 to 1 and `op` from 3 to 2. |
| New Mexico | No statewide rule. Open seat, solid Democratic. | Haaland (D) pledges a day-one executive moratorium. Hull (R) opposes a statewide moratorium. | An executive moratorium triggers R1, so `po` falls from 4 to 1 and `op` from 4 to 2. |
| Maine | LD 713 bars incentives. Open seat, solid Democratic. | Pingree (D) pledges a moratorium. Bennett (I) backs a pause. Charles (R) said in June he would sign one and called himself agnostic in October. | A moratorium triggers R1, so `po` falls from 2 to 1. `op` is already 2. |

In Iowa, Illinois, Pennsylvania, Texas, Wisconsin and New Hampshire, both governor nominees favor ending incentives, requiring full cost recovery or pausing development, so the rules would apply under either winner. Fourteen states hold no governor's race this year. They are Delaware, Indiana, Kentucky, Louisiana, Mississippi, Missouri, Montana, New Jersey, North Carolina, North Dakota, Utah, Virginia, Washington and West Virginia.

Under B2, a binding restriction approved on November 3 in Kansas (Emporia, El Dorado or Ottawa), Wisconsin (Janesville) or Michigan raises that state to High. Ohio, Florida and California are already High. Illinois's questions are advisory, and the Boulder City, Nevada measure would allow development, so neither counts.

## Dated events

| Date | Event | Rule |
|---|---|---|
| November 3, 2026 | Elections and about 34 local data center measures | B2 for approved restrictions. Prose for results. |
| December 1, 2026 | Possible Georgia PSC runoff | Prose |
| December 10, 2026 | ERCOT's target for its audit report | When the Texas holds lift, R7 restores `zn` 0, `pg` 2 under SB 6, `po` 3 and `op` 3, and the tag comes off |
| December 2026 | Louisiana PSC vote on Entergy's Hyperion units | R5 if the order sets large-load terms |
| December 31, 2026 | Year-end deadline the sponsor cites for New York's S10642. MassDEP's deadline for the Massachusetts ratepayer fund mechanism. | New York is already at `po` 1 and `op` 1, so signing changes prose only |
| January 1, 2027 | California's seven laws take effect. Georgia PSC winners take office. | R5 and record changes for California's water and review rules |
| January 2027 | Inaugurations. DeWine's freeze ends. | R7 for Ohio unless the new governor continues it |
| January to September 2027 | About 590 local moratoria reach their scheduled ends | B1 and B3 |
| July 1, 2027 | Oregon's state land pause ends. Earliest date for New Hampshire's budget moratorium. | R7 for Oregon. R1 for New Hampshire if enacted |

## Sources

Race ratings and nominees come from each state's "2026 gubernatorial election" article on Wikipedia, read October 13, 2026. The pledges come from these reports.

- Ohio. [Statehouse News Bureau, September 23, 2026](https://www.statenews.org/government-politics/2026-09-23/acton-suggesting-data-center-halt-along-with-gas-tax-holiday-but-republicans-dismiss-that) and [August 6, 2026](https://www.statenews.org/government-politics/2026-08-06/dewine-ohio-data-center-tax-break-is-for-next-governor-to-decide-on)
- Georgia. [Atlanta News First, September 14, 2026](https://www.atlantanewsfirst.com/2026/09/14/bottoms-jackson-trade-hypocrisy-claims-bitter-clash-over-georgia-data-centers/) and [Ballotpedia, August 10, 2026](https://news.ballotpedia.org/2026/08/10/partisan-control-of-georgia-public-service-commission-at-stake-in-november-election/)
- Nevada. [KOLO, September 8, 2026](https://www.kolotv.com/2026/09/08/nevada-gubernatorial-candidates-weigh-data-centers/)
- Michigan. [Michigan Independent](https://michiganindependent.com/politics/jocelyn-benson-calls-for-statewide-moratorium-on-new-data-center-construction/) and [Bridge Michigan](https://bridgemi.com/michigan-government/fact-check-john-james-jocelyn-benson-debate-data-centers-tariffs-more/)
- Kansas. [High Plains Public Radio, October 12, 2026](https://www.hppr.org/hppr-news/2026-10-12/debate-about-kansas-law-incentivizing-data-center-construction-charges-up-governors-race)
- Oregon. [KTVZ, October 8, 2026](https://ktvz.com/news/government-politics/2026/10/08/tina-kotek-and-christine-drazan-clash-over-data-centers-in-medford-debate/)
- New Mexico. [nm.news, September 17, 2026](https://nm.news/2026/09/17/haaland-data-centers/) and [KOB](https://www.kob.com/new-mexico/data-center-debate-enters-gubernatorial-race-candidates-spar-over-project-jupiter-donations/)
- Maine. [Central Maine, June 30, 2026](https://www.centralmaine.com/2026/06/30/would-maines-next-governor-sign-a-moratorium-on-new-data-centers/) and [Maine Morning Star, October 8, 2026](https://mainemorningstar.com/2026/10/08/on-ice-tribal-rights-data-centers-charles-is-outlier-in-gubernatorial-field/)
- Local ballot measures. [Ballotpedia, September 21, 2026](https://news.ballotpedia.org/2026/09/21/ohio-leads-states-in-number-of-local-ballot-measures-on-data-centers-for-2026/) and [Newsweek, October 6, 2026](https://www.newsweek.com/map-shows-states-where-data-centers-are-on-the-ballot-12528253)
- Moratorium expirations. [Moratorium Nation, September 23, 2026](https://mjbommar.github.io/moratorium-data-2026/), our calculation from adoption date plus term, which ignores extensions
