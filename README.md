# US datacenter siting suitability, 2026

An interactive, single-file map ranking all 50 states on suitability for large-scale (hyperscale and AI-training) datacenter development, as of September 2026.

Live site: https://sonnetx.github.io/datacenter-map/

## What it does

- Choropleth of composite suitability with adjustable weights across nine factors
- Three lenses: Combined, Political will and plausibility, Physical fundamentals
- Scatter plotting the two lenses against each other, with median quadrants
- Per-state breakdown, 2026 policy notes and posture label (Courting, Courting with conditions, Reviewing or paused, Restrictive, No active state posture)
- Sortable 50-state table
- Methodology and source list on the page

Hatched states have a statewide 2026 action that changes the calculus: New York's EO 62 moratorium, Texas's interconnection pause, incentive pauses in Arizona, Illinois and Ohio, North Carolina's electricity exemption repeal, Virginia's consumption tax, Utah's stricter review order.

## Scoring

Each state has eight sub-scores plus power price, all mapped to 0 to 100 (higher is more favorable). The composite is a weighted average.

| Factor | Basis |
|---|---|
| Power cost | EIA-861 2024 industrial average, 5.43¢ = 100, 13¢+ = 0 |
| Power headroom | 1 to 5 judgment: queues, utility receptivity, 2026 pauses |
| Incentives and policy | 1 to 5 judgment: exemption status, statewide actions |
| Community and permitting | 1 to 5 judgment: local moratoriums, site rejections |
| Water | 1 to 5 judgment: basin stress, drought, scarcity rules |
| Natural hazard | 1 to 5 judgment aligned to FEMA NRI patterns |
| Climate for cooling | 1 to 5 judgment: cooling degree days, humidity |
| Connectivity and ecosystem | 1 to 5 judgment: fiber, existing market, labor |
| Buildout momentum | 1 to 5 judgment: tracked projects, recent commitments |

Lens weights: Political = policy 40, community 35, momentum 25. Physical = headroom 30, cost 25, water 20, hazard 15, climate 10.

Only power cost is measured data; the rest are structured judgment calls grounded in the sources listed on the page. Treat the composite as a screening tool for which states to diligence, not a site decision.

## Updating

All scores, notes and per-state source links live in `data/states.json`. Each state has an optional `srcs` list of `{"t": title, "u": url}` entries that render under the state's note. Edit that file, then:

```
python3 build.py
```

`index.html` is fully self-contained (map geometry and TopoJSON library are inlined), so the site has no runtime dependencies.

## Deploying to GitHub Pages

1. Create an empty repo on GitHub.
2. In this folder:
   ```
   git init && git add . && git commit -m "Datacenter siting suitability map"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. Repo Settings, Pages, Source: Deploy from a branch, Branch: `main`, folder `/ (root)`. The site appears at the URL above within a minute or two.

## Data sources

Full linked list on the page, under Methodology. An independent review of the sources, scoring and interaction design is in [review/](review/), along with the EIA price comparison and the recorded HTTP status of every cited link. Power prices were diffed against the EIA-861 historical state file (Total Electric Industry, 2024 industrial) on Sept 7, 2026 and all 50 match. The seven hatched statewide actions were checked against primary sources (executive order text, bill pages, ERCOT notices, enacted budgets) on the same date.

Summary: EIA-861; CNBC Top States for Business 2026; New York EO 62; Texas Governor directives (June 10 and Aug 3, 2026) and ERCOT notices; Ashurst Perkins Coie multistate executive action review; Williams Mullen and Bloomberg Tax (Virginia budget); Data Center Knowledge and EY (North Carolina); Construction Owners Club incentive update citing NCSL and Good Jobs First; Georgia PSC December 2025 order; ElectricChoice, datacenterbans.com and dcmap.us moratorium trackers; PoweredByWho and Aterio project counts; Quartz, Fortune and ABA on western water stress; Ascend Analytics and Utility Dive on interconnection queues.
