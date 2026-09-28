# Interface record, September 28, 2026

Presentation and workflow changes. The scoring model is unchanged and remains version 3: every score, rank, sensitivity band, export and share card renders the same numbers as before this record.

## What changed

**Sources.** `src/template.html` was split into markup plus `src/styles.css`, `src/model.js`, `src/app.js`, `src/figures.js` and `src/main.js`. `build.py` inlines them in place, so the built page is still one file. The model tests load `src/model.js` directly instead of slicing the template by string markers. Three helpers (`activeWeights`, `viewLabel`, `rankModeLabel`) moved from the interface into the model so the scoring file stands alone.

**Shortlist comparison.** Saving two or more states renders a side-by-side card above the table: one column per state in rank order (the eight highest ranked when more are saved), rows for fit, rank with its sensitivity range, delivery concern, the two measured inputs, the nine factors with value bars and contributions, then pushback, rules in force and posture as unscored context. The most favorable cell in each scored row is marked; context rows are never marked. A summary names the weighted factor with the widest gap and the factors the shortlist agrees on.

**Profiles.** The Scores tab names the single one-level rating change that moves the state's rank furthest, and the rank it would produce. Previous and Next buttons (and Alt with an arrow key) walk the current ranking, or the alphabet when nothing is scored. Copy profile link copies the address with the state included.

**Address.** Two parameters were added, both omitted at their defaults: `k=stretch` for the color scale and `st=XX` for an open profile, which leaves the address when the dialog closes. Version 2 and 3 links open unchanged.

**Color scale.** A Fixed 0–100 / Stretch to range control sits at the end of the ramp legend. Stretch spreads the ramp across the scenario's lowest and highest fit; the legend ends show those values and the note says colors are then incomparable between scenarios. Factor colors in the coxcombs and the ridgeline palette stay fixed.

**Table.** A Rank range column repeats each profile's sensitivity band and sorts narrow first. The rank and state columns stay in view while the table scrolls sideways.

**Dark scheme.** The page follows `prefers-color-scheme`. Only the neutrals move; the fit ramp, hatch red and sand tones are data colors and stay put. SVG and canvas figures read their colors from the stylesheet at draw time and redraw when the scheme flips. The share card stays light because it is an exported image.

**Print.** A print stylesheet keeps the map, legend, tiers, scatter, comparison, table and methodology and drops the controls, figure switches, dialog and sticky positioning.

**Metadata.** A schema.org Dataset record, `color-scheme` and `theme-color` metas.

## Checks

- `node --test tests/model.test.cjs`: 15 tests, including the fixed and stretched color domain and the sensitivity attribution.
- `tests/browser.py`: the existing checks plus the comparison card, the rank range column and sticky columns, the color scale control and its address parameter, profile deep links and navigation, malformed `k` and `st` values, and a dark-scheme pass that redraws all twelve figures.
- Scores, ranks and exports compared equal before and after the source split.
