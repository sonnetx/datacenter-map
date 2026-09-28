# US datacenter comparison, 2026

An interactive map that compares the 50 states on conditions for hyperscale and AI training development. [Live site](https://sonnetx.github.io/datacenter-map/).

[![Choropleth of the 50 states shaded by datacenter siting fit](assets/social-card.png)](https://sonnetx.github.io/datacenter-map/)

Pick a project size and a set of priorities, and the page ranks states on power cost, winter solar resource, grid headroom, policy, permitting, water, hazards, cooling climate and connectivity. Each state has a profile with its scores, sensitivity range, public reception and sources. Hatching on the map marks a recorded 2026 statewide policy action.

- **Twelve figures of the same fifty states**: choropleth, prism map, hex cartogram, price beeswarm, factor ridgelines, coxcombs, bump chart, alluvial, hypothetical outcome plot, isotype, glyphs and an attrition band. Each note says what the figure hides.
- **Shortlist and compare**: save states from a profile or the table and read them side by side, one column each, with every factor's value bar and contribution and the most favorable cell marked in each row.
- **Profiles that explain themselves**: each state's one-rating sensitivity band names the single rating change that moves its rank furthest. Previous and Next page through the ranking without leaving the dialog.
- **Links that carry everything**: size, priorities, ranking rule, price anchors, color scale, figure, shortlist and an open profile all live in the address, omitted at their defaults. Copy scenario link and Copy profile link do the rest.
- **Fixed or stretched colors**: fit is shaded on a fixed 0 to 100 scale by default so links stay comparable; Stretch to range spreads the ramp across the scenario's own extremes when the middle needs separating.
- **Dark scheme and print**: the page follows the operating system's color scheme, including every SVG and canvas figure, and prints as the map, comparison, table and methodology without the controls.
- **Open data**: CSV and JSON downloads, a Dataset schema.org record for search engines, CC BY 4.0.

Electricity prices come from EIA 2024 industrial averages and solar irradiance from NASA POWER. The other seven factors are provisional analyst ratings on a 1 to 5 scale that have not been individually validated against original records. [docs/model.md](docs/model.md) describes the scoring model, project size bands, sensitivity test and scenario link format, and [docs/data.md](docs/data.md) defines the state record schema.

## Development

Validation and builds need Python 3 and Node 22 or newer.

```sh
python3 tests/validate_data.py      # check state records
python3 build.py                    # regenerate index.html
node --test tests/model.test.cjs    # scoring tests, run against the real model
```

Browser tests need Playwright and Chromium. Set `CHROME_PATH` to use a system Chrome instead of the Playwright download.

```sh
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/browser.py
CHROME_PATH=/usr/bin/google-chrome python3 tests/browser.py   # or a system browser
```

The page is built from these sources; `build.py` inlines them, plus the map geometry, into a single `index.html`, which is committed because GitHub Pages serves it directly.

| File | Holds |
|---|---|
| `src/template.html` | The markup, with one placeholder per source below |
| `src/styles.css` | Styles, including the dark scheme and print rules |
| `src/model.js` | The scoring model: factors, presets, size bands, ranking, sensitivity, color scale. No DOM, so `tests/model.test.cjs` runs it as-is |
| `src/app.js` | Map, priorities panel, scenario address, profiles, table, comparison card, share card, scatter |
| `src/figures.js` | The twelve figures and their rotation |
| `src/main.js` | Start-up order and the dataset download |
| `data/states.json` | The fifty state records ([schema](docs/data.md)) |

Never edit `index.html` by hand. Rerun the build after changing a source or the data, since CI fails when `index.html` is stale. `review/` holds dated review and change records, which are historical snapshots rather than live documentation.

## Contributing

Corrections should cite primary sources, identify the claims they support, and explain any rating changes. Fork the repository and open a pull request. Changes to `main` need passing CI, resolved review comments and maintainer approval, and new commits invalidate prior approval. A maintainer has to start CI for pull requests from forks.

## License

Code is MIT. The state records and written analysis are CC BY 4.0. Third-party map geometry and libraries keep their own terms. See [LICENSE](LICENSE).
