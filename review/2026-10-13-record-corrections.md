# State record corrections, October 13, 2026

Research into the 2026 elections and local moratoria turned up state actions that the September records missed or described incorrectly. We checked each one against a primary source where one exists. This pass changes facts, reception fields, posture labels, tags and citations. It leaves every analyst rating alone, so fit scores and rankings do not move.

## Statewide actions

| State | What changed | Fields | Primary source |
|---|---|---|---|
| Nebraska | LB901 repealed the data center sales tax exemption from July 1, 2026. Executive Order 26-17 (July 20) ends ImagiNE approvals for new data center applications. LB1010 sets interconnection and cost allocation standards for loads above 20 MW. | `tx` 0 to 3, `pg` 0 to 2, posture Courting to Reviewing or paused, tag Incentives ended | Nebraska Department of Revenue, governor's release, Unicameral Update |
| Massachusetts | EOED stopped accepting exemption applications on June 25. Executive Order 658 (September 8) withholds state permits for projects over 25 MW until the developer files a community benefits agreement, and requires clean self-supply or payments into a ratepayer fund. | `tx` 0 to 2, `zn` 0 to 2, `pg` 0 to 2, posture No active state posture to Reviewing or paused, tag Incentive pause | Mass.gov exemption page, Executive Order 658 |
| Texas | The governor's September 21 letter stops TCEQ from issuing any data center permit until ERCOT completes its review, targeted for December 10. | `zn` 0 to 3, posture Courting, with conditions to Reviewing or paused, tag Interconnection pause to Permit and grid pause | Governor's letter to TCEQ |
| Oregon | A September 8 directive from the governor's chief of staff pauses state agency work on state land for data centers through July 1, 2027. | `zn` 0 to 3, posture Courting, with conditions to Reviewing or paused, tag State land pause | Oregon governor's newsroom |
| Maryland | Executive Order 01.01.2026.16 (September 23) sets a state review for projects of 25 MW or more. HB 120 and SB 596 died in committee. Anne Arundel County adopted a moratorium on October 5. | `tx` 0 to 1, `zn` 0 to 2, tag Stricter review | Governor's order, General Assembly bill pages, county bill page |
| Pennsylvania | Executive Order 2026-05 (August 18) is the binding instrument. The May GRID standards were voluntary until then. The budget adds energy and water reporting from July 1, 2027. | `zn` 0 to 2 | Pennsylvania Bulletin |
| Nevada | Executive Order 2026-005 (September 17) conditions new abatements on an unabated school tax, a water standard, full cost of service and curtailment priority. | `tx` 0 to 1, posture Courting to Courting, with conditions | Governor's order |
| Alabama | SB 270 took effect October 1 and requires contracts with data centers of 150 MW or more to recover incremental costs. HB 399 caps abatements granted from 2027 at 20 years. The map had listed SB 270 as pending. | `pg` 0 to 2, `tx` 0 to 2, posture Courting to Courting, with conditions | Enrolled bills |
| Wisconsin | The PSC's May 21 final decision makes the We Energies large-load tariff mandatory above 100 MW with a 15-year minimum term and full cost recovery. | `pg` 0 to 2 | PSC release and final decision |
| Iowa | HF 976 (2025) limits the electricity exemption for facilities completed after June 6, 2025 to 10 or 15 years of operation. | `tx` 0 to 2 | Enrolled bill |
| California | The governor signed seven data center bills on September 21. They take effect January 1, 2027, so the axes stay at 0 until then. | Prose only | Governor's release |
| Ohio | The 25 MW constitutional amendment missed the 2026 ballot. DeWine has said his exemption freeze lasts until he leaves office. | Prose only | Reporting |
| Vermont | S.205 never left Senate Finance and died with the biennium. | Prose only | Bill status page |
| South Dakota | SB 232 was tabled on February 18. SB 135 bars the state from preempting local data center ordinances. | Prose only | Bill pages |
| New Hampshire | Gov. Ayotte plans a budget moratorium effective no earlier than July 2027. Nottingham voters ratified a local moratorium. | Pushback Low to Moderate | Reporting |

## Pushback

The data documentation defines Low pushback as no recorded organized opposition or local restriction. Thirteen states labeled Low had at least one local data center moratorium or ban in force, so we relabeled them Moderate and cited one measure each. They are Colorado, Idaho, Kansas, Kentucky, Massachusetts, Mississippi, Montana, Nebraska, New Hampshire, North Dakota, Rhode Island, South Carolina and Tennessee. Where a state had several measures, we cited a long-running one so the label does not lapse with a short pause. Alaska, Hawaii and Wyoming stay Low. Houston, Alaska scheduled an October 8 vote on a two-year moratorium whose outcome we could not confirm, and Cheyenne rejected a pause in May.

We located measures through the Moratorium Nation dataset (September 23, 2026 snapshot, CC BY 4.0) and filtered it to measures that cover data centers, because it also tracks battery and solar pauses. We checked every cited measure against an ordinance, resolution or news report. The dataset needs care. Its Kentucky "Boone County" row describes Boone County, Indiana. Its count grew from 533 to 1,291 measures between August and September, mostly from wider collection rather than new adoptions.

## Left unchanged

We raised no state to High. The definition counts multiple local bans, a statewide restriction passed by one chamber or a referendum, and the dataset does not reliably separate permanent bans from time-limited moratoria. Several Moderate states may already meet the definition. Port Washington, Wisconsin and Augusta Township, Michigan reportedly held data center referendums in 2026. Georgia's SB 476 passed the Senate in February 2026. Iowa has county-level measures in a third of its counties. These need a maintainer decision.

No analyst rating changed. Nebraska keeps a policy rating of 4 after its exemption ended, and Texas keeps 3 during a statewide permit pause. Those ratings now disagree with the records, and a separate record proposes rules for resolving them.

The social card was rebuilt from the page's own map and now shows twelve hatched states instead of eight.
