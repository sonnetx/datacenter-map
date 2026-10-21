"""Rebuild data/local_measures.json from the Moratorium Nation local inventory.

    python3 scripts/local_measures.py                 # download the current CSV
    python3 scripts/local_measures.py inventory.csv   # or read a saved copy

Moratorium Nation (Michael J. Bommarito, CC BY 4.0) records city, county,
township and tribal moratoriums on data centers, solar, wind, batteries and
crypto mining. This keeps the rows whose sectors include data centers and
projects each one onto the page's map with the same Albers USA projection
(d3.geoAlbersUsa, scale 1300, translate 487.5 305) that produced
src/states-albers-10m.json.

Every projected point is tested against its own state's outline. A row that
lands outside it, or has no coordinates, is dropped and reported, so a bad
geocode cannot put a Michigan township in Ohio.

Statuses are the source's own, as of its update date. Nothing here infers
that a temporary measure has lapsed.
"""
import csv
import datetime
import io
import json
import math
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "local_measures.json"
TOPO = ROOT / "src" / "states-albers-10m.json"
STATES = ROOT / "data" / "states.json"
CSV_URL = "https://mjbommar.github.io/moratorium-data-2026/data/moratorium_inventory.csv"
PAGE_URL = "https://mjbommar.github.io/moratorium-data-2026/"

# Rows the source has wrong, with the reason. Each is dropped and reported.
KNOWN_ERRORS = {
    "ky-boone-county-2026": "repeats the Boone County, Indiana ordinance (review/2026-10-13-record-corrections.md)",
}

# One letter per source status, to keep the inlined file small.
STATUS = {"active": "a", "extended": "e", "pending": "p", "replaced": "r", "expired": "x", "rescinded": "d"}

# --- Albers USA, after d3-geo -------------------------------------------------
RAD = math.pi / 180
K, TX, TY = 1300, 487.5, 305


def conic_equal_area(parallels, rotate, center, scale, translate):
    y0, y1 = parallels[0] * RAD, parallels[1] * RAD
    sy0 = math.sin(y0)
    n = (sy0 + math.sin(y1)) / 2
    c = 1 + sy0 * (2 * n - sy0)
    r0 = math.sqrt(c) / n

    def raw(lam, phi):
        r = math.sqrt(c - 2 * n * math.sin(phi)) / n
        return r * math.sin(lam * n), r0 - r * math.cos(lam * n)

    cx, cy = raw(center[0] * RAD, center[1] * RAD)
    dx, dy = translate[0] - scale * cx, translate[1] + scale * cy

    def project(lon, lat):
        lam = (lon + rotate) * RAD
        lam = (lam + math.pi) % (2 * math.pi) - math.pi
        x, y = raw(lam, lat * RAD)
        return dx + scale * x, dy - scale * y

    return project


LOWER48 = conic_equal_area((29.5, 45.5), 96, (-0.6, 38.7), K, (TX, TY))
ALASKA = conic_equal_area((55, 65), 154, (-2, 58.5), K * 0.35, (TX - 0.307 * K, TY + 0.201 * K))
HAWAII = conic_equal_area((8, 18), 157, (-3, 19.9), K, (TX - 0.205 * K, TY + 0.212 * K))


def project(state, lon, lat):
    return (ALASKA if state == "AK" else HAWAII if state == "HI" else LOWER48)(lon, lat)


# --- state outlines from the page's own topology ------------------------------
def state_rings():
    topo = json.loads(TOPO.read_text())
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for qx, qy in arc:
            x += qx
            y += qy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(ids):
        pts = []
        for i in ids:
            seg = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts.extend(seg if not pts else seg[1:])
        return pts

    names = {s["n"]: s["a"] for s in json.loads(STATES.read_text())}
    out = {}
    for g in topo["objects"]["states"]["geometries"]:
        code = names.get(g["properties"]["name"])
        if not code:
            continue
        polys = [g["arcs"]] if g["type"] == "Polygon" else g["arcs"]
        out[code] = [[ring(r) for r in poly] for poly in polys]
    return out


def inside(pt, polys):
    x, y = pt

    def in_ring(r):
        hit = False
        for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                hit = not hit
        return hit

    return any(in_ring(poly[0]) and not any(in_ring(h) for h in poly[1:]) for poly in polys)


def distance(pt, polys):
    """Distance in map pixels from a point to the nearest edge of an outline."""
    x, y = pt
    best = math.inf
    for poly in polys:
        for r in poly:
            for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
                dx, dy = x2 - x1, y2 - y1
                t = 0 if dx == dy == 0 else max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
                best = min(best, math.hypot(x - x1 - t * dx, y - y1 - t * dy))
    return best


# The outlines are simplified, so a town on a river or a coast can sit a pixel
# or two outside its state, sometimes over the neighbor across the river.
# Within this distance a point is kept where its coordinates put it, and it
# still counts toward its own state.
EDGE_PX = 4


def main():
    if len(sys.argv) > 1:
        text = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
    else:
        with urllib.request.urlopen(CSV_URL, timeout=60) as r:
            text = r.read().decode("utf-8")
        with urllib.request.urlopen(PAGE_URL, timeout=60) as r:
            page = r.read().decode("utf-8")
    rows = list(csv.DictReader(io.StringIO(text)))
    rings = state_rings()

    kept, dropped, edge = [], [], []
    for row in rows:
        if "data_center" not in (row.get("sectors") or ""):
            continue
        st = row["state_abbrev"].strip().upper()
        status = STATUS.get(row["enacted_status"].strip())
        where = f'{row["moratorium_id"]} ({st}, {row["jurisdiction"]})'
        if row["moratorium_id"] in KNOWN_ERRORS:
            dropped.append(f"{where}: {KNOWN_ERRORS[row['moratorium_id']]}")
            continue
        if st not in rings or not status:
            dropped.append(f"{where}: state {st!r} or status {row['enacted_status']!r} not recognized")
            continue
        try:
            lat, lon = float(row["latitude"]), float(row["longitude"])
        except ValueError:
            dropped.append(f"{where}: no coordinates")
            continue
        x, y = project(st, lon, lat)
        if not inside((x, y), rings[st]):
            gap = distance((x, y), rings[st])
            other = next((o for o, polys in rings.items() if o != st and inside((x, y), polys)), None)
            if gap > EDGE_PX:
                dropped.append(f"{where}: {lat:.4f}, {lon:.4f} falls outside {st}"
                               + (f", inside {other}" if other else f", {gap:.1f}px from its edge"))
                continue
            edge.append(f"{where}: {gap:.1f}px outside the simplified outline" + (f", over {other}" if other else ""))
        name = re.sub(r"\s+", " ", row["jurisdiction"]).strip()
        # the page writes these strings into markup
        name = name.replace("<", "").replace(">", "").replace('"', "'")
        kept.append([round(x, 1), round(y, 1), st, name, row["jurisdiction_type"].strip(),
                     row["date_enacted_iso"].strip(), status, row["current_end_date_iso"].strip()])

    kept.sort(key=lambda m: (m[2], m[5], m[3]))
    updated = None
    if len(sys.argv) == 1:
        m = re.search(r"Updated (\d{1,2} \w+ \d{4})", page)
        if m:
            updated = datetime.datetime.strptime(m.group(1), "%d %B %Y").date().isoformat()
    doc = {
        "source": {
            "title": "Moratorium Nation: U.S. Infrastructure Moratorium Data",
            "author": "Michael J. Bommarito",
            "url": PAGE_URL,
            "csv": CSV_URL,
            "license": "CC BY 4.0",
            "updated": updated or (json.loads(OUT.read_text())["source"]["updated"] if OUT.exists() else None),
            "retrieved": datetime.date.today().isoformat(),
        },
        "fields": ["x", "y", "state", "jurisdiction", "type", "enacted", "status", "end"],
        "status": {v: k for k, v in STATUS.items()},
        "measures": kept,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    counts = {}
    for m in kept:
        counts[m[6]] = counts.get(m[6], 0) + 1
    print(f"wrote {OUT.relative_to(ROOT)}: {len(kept)} data center measures, "
          + ", ".join(f"{doc['status'][k]} {v}" for k, v in sorted(counts.items(), key=lambda kv: -kv[1])))
    for e in edge:
        print("  kept near the border", e)
    for d in dropped:
        print("  dropped", d)
    return 0


if __name__ == "__main__":
    sys.exit(main())
