# Citation pass and political map, October 20, 2026

Fifteen state records had no citations: Alaska, Connecticut, Delaware, Florida, Georgia, Hawaii, Maine, Michigan, Minnesota, Missouri, New Jersey, Oklahoma, Washington, West Virginia and Wyoming. We listed every specific claim in each record's profile note and reception note and looked for a primary record of each one, such as a bill page, enrolled text, an executive order or a commission order. We used reporting only where no primary record exists or to establish an event that a record cannot, such as a halted project. Each of the 100 new citations was opened, and its `supports` field says what it establishes. Every state now cites at least one source.

The pass also found claims that the sources contradict and statewide actions the records missed. We corrected the prose in all fifteen records and applied the registered rules in `2026-10-13-election-rerating-rules.md` to the axis values. We changed no posture label, no tag and no pushback label.

## Axis and rating changes

| State | Change | Rule | Source |
|---|---|---|---|
| Delaware | `pg` 0 to 2, `tx` 0 to 3, `po` 3 to 2 | R5 for the large energy use rate class (HS 1 for HB 233) and self-supply mandate (HB 445). R2 for HB 310, which bars large energy use facilities from job-creation tax credits and license fee reductions, with Maine's LD 713 as precedent | Delaware General Assembly bill pages, signed August 26, 2026 |
| Florida | `pg` 0 to 2, `wt` 0 to 2 | R5 for SB 484's full cost-of-service tariffs for loads of 50 MW or more. Binding conditions for its limits on large data center water permits | SB 484 status, ch. 2026-65 |
| Georgia | `pg` 0 to 2 | R5 for the January 2025 PSC rule on new loads over 100 MW | Georgia PSC advisory |
| Michigan | `pg` 0 to 2 | R5 for the MPSC's Consumers Energy tariff (U-21859) and the conditions on DTE's Saline and Google contracts | MPSC releases |
| Minnesota | `pg` 0 to 2 | R5 for HF 16's very large customer class and the PUC's May 2026 Xcel tariff | Minnesota Revisor, PUC bulletin |
| Missouri | `pg` 0 to 2 | R5 for SB 4 (RSMo 393.130), in force since August 28, 2025 | Missouri Revisor, PSC fact sheet |
| Oklahoma | `zn` 0 to 1 | Disclosure, for HB 2992 Section 7's notice requirement on rural land bought for large loads | Enrolled HB 2992 |
| Washington | `tx` 1 to 2 | R3 for ESSB 6231, which narrowed both data center exemptions from July 1, 2026. Washington's `po` of 3 already meets the R3 cap | ESSB 6231 final bill report |

Delaware's policy rating is the only scored change, so Delaware's fit falls under every weighting that counts policy.

## Prose corrections

| State | Correction |
|---|---|
| Connecticut | The record said no datacenter-specific statute exists. PA 21-1 (2021) grants qualified data centers sales, use and property tax exemptions. Groton's 2022 moratorium was deleted in 2023 and replaced by a 12,500 square foot cap |
| Delaware | The record said no statute exists. Three laws were signed on August 26, 2026. Dover adopted its moratorium on October 12 |
| Florida | The 100 MW exemption threshold came from HB 7031 (2025), not a 2026 Hyperscale Data Center Act. SB 484 (2026) sets tariff and water rules |
| Georgia | The exemption ends December 31, 2031, not 2032. Camden County's moratorium runs six months, not nine. The 69 GW figure was the whole economic development pipeline at the end of 2025, and the pipeline reached 76.2 GW in March 2026 |
| Minnesota | Microsoft has not filed plans in Becker and Amazon suspended its project there. The electricity exemption ended under the 2025 tax law, not HF 16. The water rule adds conditions inside the existing permit system |
| Missouri | The record said no statute exists. SB 4 (2025) requires large-load tariffs. St. Charles banned data centers in May 2026 |
| New Jersey | The Fair Share Act directs the BPU to set standards within 12 months, and no rate class exists yet. The incentive freeze became permanent under P.L.2026, c.77 |
| Oklahoma | HB 2992 is the Data Center Customer Ratepayer Protection Act. SB 259 restricts groundwater cooling from November 1, 2026 |
| Washington | A second exemption covers King, Pierce and Snohomish counties. HB 2515 died in March 2026. The CNBC ranking claim could not be confirmed and is removed |
| West Virginia | HB 2014 sets no fuel requirement for certified microgrids |
| Wyoming | Google, not Crusoe, owns the Cheyenne campus, now Project Tembo at 2.7 GW. The binding cost rule is W.S. 37-3-116, since EO 2026-03 sets nonbinding principles |

Alaska, Hawaii and Maine gained detail without corrections. Claims we could not source, such as Washington's grid ranking and the fiber limits in West Virginia and Wyoming, were removed.

## Left for a maintainer decision

Posture labels have no written rubric, so we changed none. Delaware reads Reviewing or paused with a rate class, a self-supply mandate and an incentive bar in force, which resembles New Jersey, labeled Restrictive. Alaska reads No active state posture while DNR proposes leasing state land for a gas-powered computing campus.

Pushback labels stay as they were. Alaska stays Low, as the October 13 record decided, although Anchorage now requires conditional use review and DNR's North Slope lease drew more than 500 comments, most of them opposed. Both fit the Moderate definition's local restrictions or contested proceedings. Hawaii stays Low with a countywide ban pending on the Big Island, and Wyoming stays Low after Cheyenne rejected a moratorium. Missouri stays Moderate, although Peculiar's 2024 zoning change and St. Charles's 2026 ban may count as the multiple local bans that define High.

Two axis values wait on dates or facts we could not confirm. Oklahoma's `wt` moves to 2 when SB 259 takes effect on November 1, 2026. New Jersey's `wt` may move to 1 under its new reporting law once its effective date is confirmed. Michigan's PA 207 of 2024 may attach clean energy and water conditions to its exemption, which would make `tx` 1 under R4, and we did not confirm its text.

## Local moratorium data

The page now draws Moratorium Nation's local measures as dots, counts them per state and lists each state's most recent ones in its profile. `scripts/local_measures.py` downloads the inventory, keeps the 1,079 rows whose sectors include data centers and checks each point against its own state's outline. It drops the Kentucky Boone County row, which repeats the Indiana ordinance as the October 13 record found. Statuses are the dataset's own as of its September 23, 2026 update. Counting active and extended measures, Ohio has 148 in force and Michigan 122.
