# US datacenter comparison, 2026

An interactive map that compares the 50 states on conditions for hyperscale and AI training development. [Live site](https://sonnetx.github.io/datacenter-map/).

Pick a project size and a set of priorities, and the page ranks states on power cost, winter solar resource, grid headroom, policy, permitting, water, hazards, cooling climate and connectivity. Each state has a profile with its scores, sensitivity range, public reception and sources. You can shortlist states, export the comparison, copy a link that records the scenario, or download a share image. Hatching on the map marks a recorded 2026 statewide policy action.

Electricity prices come from EIA 2024 industrial averages and solar irradiance from NASA POWER. The other seven factors are provisional analyst ratings on a 1 to 5 scale that have not been individually validated against original records. [docs/model.md](docs/model.md) describes the scoring model, project size bands, sensitivity test and scenario link format, and [docs/data.md](docs/data.md) defines the state record schema.

## Development

Validation and builds need Python 3 and Node 22 or newer.

```sh
python3 tests/validate_data.py      # check state records
python3 build.py                    # regenerate index.html
node --test tests/model.test.cjs    # scoring tests, run against the real model
```

Browser tests need Playwright and Chromium.

```sh
python3 -m pip install playwright && python3 -m playwright install chromium
python3 tests/browser.py
```

`src/template.html` holds the interface, the scoring model and the figures, and `data/states.json` holds the state records. `build.py` inlines the data and map geometry into the template and writes `index.html`, which is committed because GitHub Pages serves it directly. Never edit `index.html` by hand. Rerun the build after changing the template or data, since CI fails when `index.html` is stale. `review/` holds dated review and change records, which are historical snapshots rather than live documentation.

## Contributing

Corrections should cite primary sources, identify the claims they support, and explain any rating changes. Fork the repository and open a pull request. Changes to `main` need passing CI, resolved review comments and maintainer approval, and new commits invalidate prior approval. A maintainer has to start CI for pull requests from forks.

## License

Code is MIT. The state records and written analysis are CC BY 4.0. Third-party map geometry and libraries keep their own terms. See [LICENSE](LICENSE).
