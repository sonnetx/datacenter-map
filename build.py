"""Rebuild index.html from src/template.html + data/states.json.
Edit data/states.json (scores, notes, tags), then run: python3 build.py
"""
import json, pathlib
root = pathlib.Path(__file__).parent
read = lambda p: (root/p).read_text(encoding="utf-8")
tpl = read("src/template.html")
states = read("data/states.json")
S = json.loads(states); assert len(S) == 50
# the JSON lands inside a <script> block, so a "</" in any string would close it
states = states.replace("</", "<\\/")
out = (tpl.replace("__TOPOJSON_LIB__", read("src/topojson-client.min.js"))
          .replace("__TOPO__", read("src/states-albers-10m.json"))
          .replace("__STATES__", states))
(root/"index.html").write_text(out, encoding="utf-8")
print("wrote index.html", len(out)//1024, "KB")
