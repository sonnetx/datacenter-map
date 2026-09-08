"""Validate data/states.json against the schema the page expects.

Run it after editing state records:

    python3 tests/validate_data.py

Every problem is reported at once, with the state and field named, so a bad
edit fails here rather than silently rendering a broken page. Exits non-zero
if anything is wrong.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "states.json"

# The 50 states. DC and territories are deliberately out of scope: the map
# geometry, the ranking and the "of 50" copy all assume exactly these.
POSTAL = set(
    "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS "
    "MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV "
    "WI WY".split()
)

# Analyst rating fields. Each is an integer 1 to 5, higher being more
# favorable, and each maps onto 0/25/50/75/100 in the model.
RATINGS = {
    "pw": "power headroom",
    "po": "incentives and policy",
    "op": "community and permitting",
    "w": "water",
    "h": "natural hazard",
    "c": "climate for cooling",
    "x": "connectivity and ecosystem",
    "mo": "buildout momentum (context only, contributes no points)",
}

# Non-rating fields.
SCALARS = {
    "a": "two-letter postal code",
    "n": "state name",
    "p": "EIA 2024 industrial price, cents per kWh",
    "tag": "short label for a 2026 statewide action, or empty string",
    "note": "prose shown in the state profile",
    "st": "state posture label",
}

POSTURES = {
    "Courting",
    "Courting, with conditions",
    "Reviewing or paused",
    "Restrictive",
    "No active state posture",
}

# What kind of publisher a citation is. This records the publisher's role so a
# reader can weigh it. It is not a credibility rating.
SOURCE_TYPES = {
    "Government record",
    "Grid operator",
    "Company statement",
    "Advocacy statement",
    "Legal analysis",
    "Market research",
    "Reporting",
    "Reprinted release",
}

SOURCE_REQUIRED = {"t", "u", "type"}
SOURCE_OPTIONAL = {"supports", "reviewed"}

MAX_SOURCE_TITLE = 60
PRICE_RANGE = (3.0, 40.0)

problems = []


def fail(where, message):
    problems.append(f"{where}: {message}")


def check_source(where, i, rec):
    at = f"{where} source {i + 1}"
    if not isinstance(rec, dict):
        fail(at, "must be an object")
        return
    missing = SOURCE_REQUIRED - set(rec)
    if missing:
        fail(at, f"missing {', '.join(sorted(missing))}")
    unknown = set(rec) - SOURCE_REQUIRED - SOURCE_OPTIONAL
    if unknown:
        fail(at, f"unexpected field {', '.join(sorted(unknown))}")
    title = rec.get("t")
    if isinstance(title, str):
        if not title.strip():
            fail(at, "title 't' is empty")
        elif len(title) > MAX_SOURCE_TITLE:
            fail(at, f"title is {len(title)} chars, over the {MAX_SOURCE_TITLE} limit: {title!r}")
    url = rec.get("u")
    if isinstance(url, str) and not url.startswith("https://"):
        fail(at, f"url must be https, got {url!r}")
    kind = rec.get("type")
    if kind is not None and kind not in SOURCE_TYPES:
        fail(at, f"type {kind!r} is not one of {', '.join(sorted(SOURCE_TYPES))}")
    for field in SOURCE_OPTIONAL:
        if field in rec and not (isinstance(rec[field], str) and rec[field].strip()):
            fail(at, f"'{field}' is present but empty")


def main():
    try:
        states = json.loads(DATA.read_text())
    except json.JSONDecodeError as e:
        print(f"data/states.json is not valid JSON: {e}", file=sys.stderr)
        return 1

    if not isinstance(states, list):
        print("data/states.json must be a list of state objects", file=sys.stderr)
        return 1

    if len(states) != 50:
        fail("file", f"expected 50 states, found {len(states)}")

    seen_codes, seen_names = {}, {}

    for idx, s in enumerate(states):
        code = s.get("a") if isinstance(s, dict) else None
        where = f"[{idx}] {code or '??'}"
        if not isinstance(s, dict):
            fail(where, "must be an object")
            continue

        for field in list(SCALARS) + list(RATINGS):
            if field not in s:
                fail(where, f"missing '{field}' ({SCALARS.get(field) or RATINGS.get(field)})")

        unknown = set(s) - set(SCALARS) - set(RATINGS) - {"srcs"}
        if unknown:
            fail(where, f"unexpected field {', '.join(sorted(unknown))}")

        if isinstance(code, str):
            if code not in POSTAL:
                fail(where, f"'a' is {code!r}, not a US state postal code")
            if code in seen_codes:
                fail(where, f"duplicate postal code, also at index {seen_codes[code]}")
            seen_codes[code] = idx

        name = s.get("n")
        if isinstance(name, str):
            if not name.strip():
                fail(where, "'n' is empty")
            if name in seen_names:
                fail(where, f"duplicate state name, also at index {seen_names[name]}")
            seen_names[name] = idx

        price = s.get("p")
        if isinstance(price, bool) or not isinstance(price, (int, float)):
            fail(where, f"'p' must be a number, got {price!r}")
        elif not PRICE_RANGE[0] <= price <= PRICE_RANGE[1]:
            fail(where, f"'p' is {price}, outside the plausible {PRICE_RANGE[0]} to {PRICE_RANGE[1]} c/kWh range")

        for field, label in RATINGS.items():
            v = s.get(field)
            if isinstance(v, bool) or not isinstance(v, int):
                fail(where, f"'{field}' ({label}) must be an integer 1 to 5, got {v!r}")
            elif not 1 <= v <= 5:
                fail(where, f"'{field}' ({label}) is {v}, outside 1 to 5")

        posture = s.get("st")
        if posture not in POSTURES:
            fail(where, f"'st' is {posture!r}, not one of: {'; '.join(sorted(POSTURES))}")

        tag = s.get("tag")
        if not isinstance(tag, str):
            fail(where, f"'tag' must be a string, empty when there is no 2026 action, got {tag!r}")

        note = s.get("note")
        if not isinstance(note, str) or not note.strip():
            fail(where, "'note' must be non-empty prose")
        elif re.search(r"\s{2,}", note):
            fail(where, "'note' contains a double space")

        srcs = s.get("srcs")
        if srcs is not None:
            if not isinstance(srcs, list) or not srcs:
                fail(where, "'srcs' must be a non-empty list when present, or omitted entirely")
            else:
                for i, rec in enumerate(srcs):
                    check_source(where, i, rec)
                urls = [r.get("u") for r in srcs if isinstance(r, dict)]
                dupes = {u for u in urls if urls.count(u) > 1}
                if dupes:
                    fail(where, f"repeats a source url: {', '.join(sorted(dupes))}")

        # A state flagged with a 2026 action is a claim readers will check, so
        # it has to carry its own citations.
        if isinstance(tag, str) and tag.strip() and not srcs:
            fail(where, f"has tag {tag!r} but no 'srcs'; flagged states must cite their source")

    missing = sorted(POSTAL - set(seen_codes))
    if missing:
        fail("file", f"no record for {', '.join(missing)}")

    if problems:
        print(f"data/states.json: {len(problems)} problem(s)\n", file=sys.stderr)
        for p in problems:
            print(f"  {p}", file=sys.stderr)
        print(
            "\nSchema: each of the 50 entries needs "
            + ", ".join(sorted(SCALARS))
            + " plus the 1-5 ratings "
            + ", ".join(sorted(RATINGS))
            + ". 'srcs' is optional, and required for any state with a 'tag'.",
            file=sys.stderr,
        )
        return 1

    cited = sum(1 for s in states if s.get("srcs"))
    links = sum(len(s.get("srcs") or []) for s in states)
    print(f"data/states.json ok: 50 states, {cited} with citations, {links} source links")
    return 0


if __name__ == "__main__":
    sys.exit(main())
