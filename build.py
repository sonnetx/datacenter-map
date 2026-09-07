"""Rebuild index.html from src/template.html + data/states.json.
Edit data/states.json (scores, notes, tags), then run: python3 build.py
"""
import json, pathlib
root = pathlib.Path(__file__).parent
tpl = (root/"src/template.html").read_text()
states = (root/"data/states.json").read_text()
S = json.loads(states); assert len(S) == 50
out = (tpl.replace("__TOPOJSON_LIB__", (root/"src/topojson-client.min.js").read_text())
          .replace("__TOPO__", (root/"src/states-albers-10m.json").read_text())
          .replace("__STATES__", states))
(root/"index.html").write_text(out)
print("wrote index.html", len(out)//1024, "KB")
