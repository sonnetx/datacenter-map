"""Rebuild index.html from the sources in src/ and data/states.json.

    python3 build.py

src/template.html holds the markup. build.py inlines, in this order:

    __CSS__            src/styles.css
    __TOPOJSON_LIB__   src/topojson-client.min.js
    __TOPO__           src/states-albers-10m.json   (map geometry)
    __STATES__         data/states.json             (the state records)
    __LOCAL__          data/local_measures.json     (local moratoriums, from scripts/local_measures.py)
    __MODEL_JS__       src/model.js                 (scoring, no DOM)
    __APP_JS__         src/app.js                   (map, panel, profiles, table)
    __FIGURES_JS__     src/figures.js               (the twelve figures)
    __MAIN_JS__        src/main.js                  (start-up and dataset download)

The result is one self-contained file, which GitHub Pages serves directly.
Never edit index.html by hand; CI fails when it is stale.
"""
import json, pathlib, sys
root = pathlib.Path(__file__).parent
read = lambda p: (root/p).read_text(encoding="utf-8")

PARTS = {
    "__CSS__": "src/styles.css",
    "__TOPOJSON_LIB__": "src/topojson-client.min.js",
    "__TOPO__": "src/states-albers-10m.json",
    "__MODEL_JS__": "src/model.js",
    "__APP_JS__": "src/app.js",
    "__FIGURES_JS__": "src/figures.js",
    "__MAIN_JS__": "src/main.js",
}

def build():
    tpl = read("src/template.html")
    states = read("data/states.json")
    S = json.loads(states); assert len(S) == 50, "expected 50 state records"
    # the JSON lands inside a <script> block, so a "</" in any string would close it
    states = states.replace("</", "<\\/")
    out = tpl
    for marker, path in PARTS.items():
        assert out.count(marker) == 1, f"{marker} must appear exactly once in the template"
        body = read(path).rstrip("\n")
        if path.endswith(".js") and "</script" in body.lower():
            sys.exit(f"{path} contains '</script', which would end the inline script early")
        out = out.replace(marker, body)
    assert out.count("__STATES__") == 1
    out = out.replace("__STATES__", states)
    local = read("data/local_measures.json").rstrip("\n").replace("</", "<\\/")
    assert out.count("__LOCAL__") == 1
    out = out.replace("__LOCAL__", local)
    return out

if __name__ == "__main__":
    out = build()
    (root/"index.html").write_text(out, encoding="utf-8")
    print("wrote index.html", len(out)//1024, "KB")
