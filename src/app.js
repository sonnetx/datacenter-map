// Interface: political map views, local moratoriums, findings, map,
// priorities panel, scenario address, state profiles, table, shortlist
// comparison, share card and scatter plot. Runs after model.js in the same
// script.

// Theme colors, read from the stylesheet so SVG and canvas drawings follow
// the light or dark scheme the page is showing. Re-read when the scheme flips.
const THEME={};
function readTheme(){
  const cs=getComputedStyle(document.documentElement), v=n=>cs.getPropertyValue(n).trim();
  Object.assign(THEME,{ink:v("--ink"),muted:v("--muted"),rule:v("--rule"),soft:v("--rule-soft"),panel:v("--panel"),bg:v("--bg"),
    warn:v("--warn"),focus:v("--focus"),wall:v("--wall"),edge:v("--edge"),quiet:v("--quiet"),sand:v("--sand-ink"),
    posture:[0,1,2,3,4].map(i=>v("--po"+i)),pushback:[0,1,2].map(i=>v("--pb"+i)),rules:["e",0,1,2,3].map(i=>v("--ru"+i))});
  return THEME;
}
readTheme();

// --- local moratoriums ---
// Moratorium Nation's city, county, township and tribal measures on data
// centers, with the source's own status as of its update date. They are
// context, like the reception record, and never touch fit or rank.
const LOCAL_BY={};
STATES.forEach(s=>{ LOCAL_BY[s.a]={inForce:[],pending:[],past:[]}; });
LOCAL.measures.forEach(([x,y,st,name,type,enacted,status,end])=>{
  const bucket=LOCAL_BY[st]; if(!bucket) return;
  const m={x,y,st,name,type,enacted,status,end};
  (status==="a"||status==="e" ? bucket.inForce : status==="p" ? bucket.pending : bucket.past).push(m);
});
STATES.forEach(s=>{ s.localIn=LOCAL_BY[s.a].inForce.length; s.localPending=LOCAL_BY[s.a].pending.length; });
const LOCAL_TOTAL={inForce:STATES.reduce((n,s)=>n+s.localIn,0),pending:STATES.reduce((n,s)=>n+s.localPending,0)};
// The source gives a month or only a year when it cannot confirm the day.
function longDate(iso){
  const parts=/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(iso||"");
  if(!parts) return iso||"an unrecorded date";
  const [,y,m,d]=parts, month=m?["January","February","March","April","May","June","July","August","September","October","November","December"][+m-1]:"";
  return m ? (d ? `${month} ${+d}, ${y}` : `${month} ${y}`) : y;
}
const LOCAL_AS_OF=longDate(LOCAL.source.updated);

// --- political map views ---
// The first three views color states by a recorded category, not a score,
// because ordinal analyst labels do not support finer distinctions. Siting
// fit is the scored model, with its controls under Advanced analysis.
const POSTURE_ORDER=["Courting","Courting, with conditions","No active state posture","Reviewing or paused","Restrictive"];
// The four axes share one friction scale, so each level names its rule and
// its tax incentive reading together.
const RULE_LABEL={"-1":"Eases entry","0":"No specific rule","1":"Reporting or incentive conditions","2":"Binding conditions or narrowed incentives","3":"Pause, ban or repealed incentives"};
// The strongest datacenter-specific statewide rule in force on any of the
// four axes. A state whose only rules ease entry reads -1.
function strongestRule(s){ const v=["wt","pg","zn","tx"].map(k=>s.rr[k]), top=Math.max(...v); return top>0 ? top : Math.min(...v)<0 ? -1 : 0; }
const MAP_VIEWS={
  posture:{label:"State posture",classOf:s=>s.st,
    classes:()=>POSTURE_ORDER.map((c,i)=>({key:c,label:c,color:THEME.posture[i]})),
    note:"Posture is an analyst label for how the state government treated data center development in 2026, from courting it to restricting it. It follows statewide actions and announced direction, so a state can be Restrictive before its rules take effect."},
  pushback:{label:"Public pushback",classOf:s=>s.rr.pb,
    classes:()=>["Low","Moderate","High"].map((c,i)=>({key:c,label:c,color:THEME.pushback[i]})),
    note:"Pushback records organized public opposition. Low means none on record, Moderate means local restrictions or contested proceedings in some places, and High means multiple local bans, a statewide restriction that cleared a chamber, or a referendum."},
  rules:{label:"Rules in force",classOf:s=>strongestRule(s),
    classes:()=>[-1,0,1,2,3].map((c,i)=>({key:c,label:RULE_LABEL[c],color:THEME.rules[i]})),
    note:"The strongest datacenter-specific statewide rule in force on water, power cost, siting or tax incentives. Pending bills and enacted laws that have not taken effect count as no rule."},
  fit:{label:"Siting fit"}
};
let mapView="posture", showLocal=true;
// --- map ---
function pathOf(geom){
  const f = topojson.feature(TOPO, geom).geometry;
  const rings = f.type==="Polygon" ? [f.coordinates] : f.coordinates;
  let d="";
  rings.forEach(poly=>poly.forEach(ring=>{
    ring.forEach((pt,i)=>{ d += (i?"L":"M")+pt[0].toFixed(1)+","+pt[1].toFixed(1); });
    d+="Z";
  }));
  return d;
}
function centroidOf(geom){
  const f = topojson.feature(TOPO, geom).geometry;
  const rings = f.type==="Polygon" ? [f.coordinates] : f.coordinates;
  // use largest ring bbox center
  let best=null,bestArea=-1;
  rings.forEach(poly=>{const r=poly[0];let minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;r.forEach(p=>{minx=Math.min(minx,p[0]);maxx=Math.max(maxx,p[0]);miny=Math.min(miny,p[1]);maxy=Math.max(maxy,p[1]);});const ar=(maxx-minx)*(maxy-miny);if(ar>bestArea){bestArea=ar;best=[(minx+maxx)/2,(miny+maxy)/2];}});
  return best;
}
const gStates=document.getElementById("states"), gHatch=document.getElementById("hatches"), gLabels=document.getElementById("labels");
const tip=document.getElementById("tip"), mapcard=document.querySelector(".mapcard");
const svgEl=document.querySelector("svg.map");
const paths={};
TOPO.objects.states.geometries.forEach(g=>{
  const abbr=NAME2ABBR[g.properties.name]; if(!abbr) return;
  const d=pathOf(g);
  const p=document.createElementNS("http://www.w3.org/2000/svg","path");
  p.setAttribute("d",d); p.setAttribute("class","state"); p.dataset.a=abbr; p.setAttribute("tabindex","0");
  p.setAttribute("aria-label",g.properties.name);
  gStates.appendChild(p); paths[abbr]=p;
  if(BY[abbr].tag){
    const h=document.createElementNS("http://www.w3.org/2000/svg","path");
    h.setAttribute("d",d); h.setAttribute("fill","url(#hatch)"); h.setAttribute("stroke","none");
    gHatch.appendChild(h);
  }
  const c=centroidOf(g);
  const small=["RI","DE","DC","CT","NJ","MD","NH","VT","MA","HI"].includes(abbr);
  if(!small){
    const t=document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x",c[0]); t.setAttribute("y",c[1]+4); t.setAttribute("text-anchor","middle");
    t.setAttribute("font-size","11"); t.setAttribute("font-weight","500"); t.setAttribute("fill","#fff");
    t.setAttribute("style","paint-order:stroke;stroke:rgba(0,0,0,.35);stroke-width:2px;font-family:inherit");
    t.textContent=abbr; gLabels.appendChild(t);
  }
  p.addEventListener("mousemove",e=>showTip(abbr,e));
  p.addEventListener("mouseleave",()=>tip.style.display="none");
  p.addEventListener("click",()=>select(abbr));
  p.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();select(abbr);} });
  p.addEventListener("focus",e=>{ const r=p.getBoundingClientRect(); showTip(abbr,{clientX:r.left+r.width/2,clientY:r.top+r.height/2}); });
  p.addEventListener("blur",()=>tip.style.display="none");
});

// In-force measures draw over proposed ones; ended measures are not drawn.
const gDots=document.getElementById("local-dots");
gDots.innerHTML=LOCAL.measures.filter(m=>m[6]==="p").map(m=>`<circle class="lm-pending" cx="${m[0]}" cy="${m[1]}" r="2.2"/>`).join("")
  +LOCAL.measures.filter(m=>m[6]==="a"||m[6]==="e").map(m=>`<circle class="lm-in" cx="${m[0]}" cy="${m[1]}" r="2.2"/>`).join("");
document.getElementById("local-inforce").textContent=LOCAL_TOTAL.inForce.toLocaleString("en-US");
document.getElementById("local-pending").textContent=LOCAL_TOTAL.pending.toLocaleString("en-US");
document.querySelectorAll("#local-updated,.local-asof").forEach(el=>{ el.textContent=LOCAL_AS_OF; });
document.getElementById("show-local").addEventListener("change",e=>{ showLocal=e.target.checked; gDots.style.display=showLocal?"":"none"; scheduleURL(); });

// only factors you actually weighted can be a strength or a drag on your score
function bestWorst(s){
  const W=activeWeights();
  const arr=FACTORS.filter(f=>(W[f.k]||0)>0).map(f=>({f,v:sub(s,f.k)}));
  if(!arr.length) return null;
  arr.sort((a,b)=>b.v-a.v);
  return {best:arr[0].f.name.toLowerCase(), worst:arr[arr.length-1].f.name.toLowerCase()};
}
function showTip(abbr,e){
  const s=BY[abbr];
  if(mapView!=="fit"){
    const head=mapView==="pushback" ? s.rr.pb+" pushback" : mapView==="rules" ? RULE_LABEL[strongestRule(s)] : s.st;
    tip.innerHTML=`<b>${s.n}</b>${s.tag?` <span class="small">(${s.tag})</span>`:""}<span class="sc cat">${head}</span><span class="small">Posture: ${s.st}<br>Pushback: ${s.rr.pb}<br>Strongest rule in force: ${RULE_LABEL[strongestRule(s)].toLowerCase()}<br>Local moratoriums: ${s.localIn} in force, ${s.localPending} proposed</span>`;
    placeTip(e); return;
  }
  const bw=bestWorst(s);
  const head = hasWeights()
    ? `<span class="sc">${s.total.toFixed(0)} <span class="small" style="font-size:13px">rank ${s.rank} of 50${s.tied?", tied":""}</span></span>`
    : `<span class="sc" style="font-size:15px">No score</span>`;
  const body = hasWeights()
    ? `${deliveryLabel(s)} ${deliveryContext()}<br>One-rating sensitivity: rank ${s.rankMin}–${s.rankMax}<br>Highest rated factor: ${bw.best}<br>Lowest rated factor: ${bw.worst}`
    : `${s.st}<br>Raise at least one priority to score this state.`;
  tip.innerHTML=`<b>${s.n}</b>${s.tag?` <span class="small">(${s.tag})</span>`:""}${head}<span class="small">${body}</span>`;
  placeTip(e);
}
function placeTip(e){
  tip.style.display="block";
  const r=mapcard.getBoundingClientRect();
  const bounds=tip.getBoundingClientRect();
  let x=e.clientX-r.left+14, y=e.clientY-r.top+14;
  if(x+bounds.width>r.width) x=e.clientX-r.left-bounds.width-14;
  if(y+bounds.height>r.height) y=e.clientY-r.top-bounds.height-14;
  x=Math.max(4,Math.min(x,r.width-bounds.width-4));
  y=Math.max(4,Math.min(y,r.height-bounds.height-4));
  tip.style.left=x+"px"; tip.style.top=y+"px";
}
function paint(){
  const scored=hasWeights(), fit=mapView==="fit";
  const fill=fit ? null : Object.fromEntries(MAP_VIEWS[mapView].classes().map(c=>[String(c.key),c.color]));
  STATES.forEach(s=>{ paths[s.a].style.fill = fit ? (scored ? fitColor(s.total) : THEME.soft) : fill[String(MAP_VIEWS[mapView].classOf(s))]; });
  // the hatch marks a 2026 action on the fit map; the political views already show it
  gHatch.style.display=fit?"":"none";
  renderRampLegend(); renderMapLegend();
  document.getElementById("hint").textContent = !fit
    ? "Select a state to see its record and sources."
    : scored
    ? "Select a state to see its scores and sources."
    : "Choose a priority or preset to see scores.";
}
// Swatches with how many states fall in each, for the three political views.
function renderMapLegend(){
  const box=document.getElementById("legend-cat"), note=document.getElementById("legend-catnote");
  if(mapView==="fit"){ box.innerHTML=""; note.textContent=""; return; }
  const mv=MAP_VIEWS[mapView], counts={};
  STATES.forEach(s=>{ const k=String(mv.classOf(s)); counts[k]=(counts[k]||0)+1; });
  box.innerHTML=mv.classes().map(c=>`<span class="cat"><i style="background:${c.color}"></i>${c.label}<b>${counts[String(c.key)]||0}</b></span>`).join("");
  note.textContent=mv.note;
}
function setMapView(id,opts={}){
  if(!MAP_VIEWS[id]) return;
  mapView=id;
  document.querySelectorAll("#mapview button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.m===id)));
  mapcard.classList.toggle("politics",id!=="fit");
  document.body.classList.toggle("fit-view",id==="fit");
  // the twelve figures all draw fit, so a political view always shows the map
  FIGS.setView(id==="fit" ? FIGS.active() : "map");
  paint(); renderDetail(); scheduleURL();
  if(id==="fit" && opts.openPanel && matchMedia("(min-width:901px)").matches) wpanel.open=true;
}
document.querySelectorAll("#mapview button").forEach(b=>b.addEventListener("click",()=>setMapView(b.dataset.m,{openPanel:true})));

// The ramp legend reads the domain the colors actually span. Under Stretch
// the end labels carry the scenario's lowest and highest fit.
function renderRampLegend(){
  const [lo,hi]=fitDomain(), stretched=colorScale==="stretch"&&hasWeights();
  document.getElementById("ramp-lo").textContent=stretched?`Lower fit · ${lo.toFixed(0)}`:"Lower fit · 0";
  document.getElementById("ramp-hi").textContent=stretched?`${hi.toFixed(0)} · Higher fit`:"100 · Higher fit";
  document.querySelectorAll("#scale-toggle button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.k===colorScale)));
}
function setColorScale(k){
  if(k!=="fixed"&&k!=="stretch") return;
  colorScale=k; paint(); renderScatter(); FIGS.draw(); scheduleURL();
}
document.querySelectorAll("#scale-toggle button").forEach(b=>b.addEventListener("click",()=>setColorScale(b.dataset.k)));

// --- weights UI ---
// Everything in the Advanced analysis panel changes the siting model, so
// opening the panel or editing anything in it shows the Siting fit map.
const wpanel=document.getElementById("wpanel");
wpanel.addEventListener("toggle",()=>{ if(wpanel.open && mapView!=="fit") setMapView("fit"); });
for(const ev of ["input","change"]) wpanel.addEventListener(ev,()=>{ if(mapView!=="fit") setMapView("fit"); },true);
wpanel.addEventListener("click",e=>{ if(e.target.closest("#sizes button,#presets button,#workload button,#lens button") && mapView!=="fit") setMapView("fit"); },true);
const wbox=document.getElementById("weights");
FACTORS.forEach(f=>{
  const d=document.createElement("div"); d.className="w";
  d.innerHTML=`<label title="${f.sub}" for="w-${f.k}">${f.name}<span class="sub">${f.sub}</span></label><span class="val" id="v-${f.k}"></span><input type="range" id="w-${f.k}" min="0" max="40" step="5">`;
  wbox.appendChild(d);
  const inp=d.querySelector("input");
  inp.addEventListener("input",()=>{ weights[f.k]=+inp.value; view="all"; setLens("all"); setPressed(presetMatching(weights)); refresh(); });
});
function syncSliders(){
  const Z=SIZES[size], F=Z.floors, offGrid=F.pw<=1;
  document.getElementById("rank-explanation").textContent=rankMode==="fit"
    ? "Ranks by your weighted fit. Delivery concerns remain a separate signal."
    : offGrid
      ? `Groups states by modeled delivery concerns for ${Z.noun} first, then ranks by fit within each group. Only permitting counts: below ${F.op} is elevated, two levels below is major.`
      : `Groups states by modeled delivery concerns for ${Z.noun} first, then ranks by fit within each group. Headroom below ${F.pw} or permitting below ${F.op} is elevated; two levels below is major.`;
  const lead=FACTORS.map(f=>({f,w:Z.weights[f.k]||0})).filter(d=>d.w>0).sort((a,b)=>b.w-a.w).slice(0,3).map(d=>`${d.f.name.toLowerCase()} ${d.w}%`).join(", ");
  document.getElementById("size-note").textContent=`${Z.label} (${Z.mw}) starts from ${lead}. `+(offGrid
    ? `Lower delivery concern needs permitting ${F.op} of 5; grid headroom is not required.`
    : `Lower delivery concern needs headroom ${F.pw} and permitting ${F.op} of 5.`);
  const wl=document.getElementById("workload"); wl.hidden = size!=="solar";
  wl.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed", String(size==="solar" && WORKLOADS[b.dataset.wl].x===weights.x)));
  document.getElementById("legend-rampnote").textContent=(colorScale==="stretch"
    ? `Color spreads this scenario's lowest to highest fit across the ramp, so colors are not comparable between scenarios. `
    : `Color shows weighted fit on a fixed 0–100 scale. `)+`Delivery concerns, judged for ${Z.noun}, are shown separately in each profile.`;
  document.getElementById("share-card").disabled=!hasWeights();
  const tw=totalWeight(weights);
  FACTORS.forEach(f=>{
    const inp=document.getElementById("w-"+f.k);
    inp.value=weights[f.k];
    // effective share, so the number means something next to the other sliders
    const share=tw>0 ? +(weights[f.k]/tw*100).toFixed(1) : 0;
    document.getElementById("v-"+f.k).textContent=tw>0?share+"%":"--";
    inp.setAttribute("aria-valuetext", tw>0
      ? `${f.name}: ${share}% of your Combined fit`
      : `${f.name}: no priorities set`);
  });
  document.getElementById("total").textContent = tw>0
    ? `Percentages show each factor’s share of your Combined score. Rounded values may not add to 100%.`
    : "Choose at least one priority or select a preset to calculate scores.";
  document.getElementById("view-note").textContent = view==="all"
    ? "Adjust a slider to update the Combined map and ranking."
    : `Viewing ${viewLabel()}. Adjusting a slider returns to your Combined view.`;
}
function setPressed(id){
  document.querySelectorAll("#presets button").forEach(b=>b.setAttribute("aria-pressed", b.dataset.p===id ? "true":"false"));
}
// the pressed preset is inferred from the weights, so it stays honest when a
// reader drags the sliders back onto one
function presetMatching(W){ return Object.keys(PRESETS).find(k=>FACTORS.every(f=>PRESETS[k][f.k]===(W[f.k]||0)))||null; }
document.querySelectorAll("#presets button").forEach(b=>b.addEventListener("click",()=>{ weights={...PRESETS[b.dataset.p]}; setPressed(b.dataset.p); view="all"; setLens("all"); refresh(); }));
function setSize(id){ document.querySelectorAll("#sizes button").forEach(b=>b.setAttribute("aria-pressed", b.dataset.z===id?"true":"false")); }
// a size loads its weight profile; presets and sliders then adjust from there
document.querySelectorAll("#sizes button").forEach(b=>b.addEventListener("click",()=>{ size=b.dataset.z; weights={...SIZES[size].weights}; setSize(size); setPressed(presetMatching(weights)); view="all"; setLens("all"); refresh(); }));
// a workload only moves the connectivity weight; the other shares rescale
document.querySelectorAll("#workload button").forEach(b=>b.addEventListener("click",()=>{ weights.x=WORKLOADS[b.dataset.wl].x; setPressed(presetMatching(weights)); view="all"; setLens("all"); refresh(); }));
function setLens(id){ document.querySelectorAll("#lens button").forEach(b=>b.setAttribute("aria-pressed", b.dataset.l===id?"true":"false")); }
// the lens is a view, not an edit: switching to a lens and back restores the user's own weights
document.querySelectorAll("#lens button").forEach(b=>b.addEventListener("click",()=>{ view=b.dataset.l; setLens(view); refresh(); }));

document.getElementById("rank-mode").addEventListener("change",e=>{
  rankMode=e.target.value;sortKey="rank";sortAsc=true;refresh();
});
for(const id of ["price-low","price-high"]){
  document.getElementById(id).addEventListener("change",()=>{
    const lowInput=document.getElementById("price-low"),highInput=document.getElementById("price-high");
    // round to the 0.5 step the scenario link decodes, so a copied link
    // reproduces the typed anchors
    const low=Math.round(lowInput.valueAsNumber*2)/2,high=Math.round(highInput.valueAsNumber*2)/2;
    const valid=Number.isFinite(low)&&Number.isFinite(high)&&low>=0&&high<=100&&high>low;
    lowInput.setAttribute("aria-invalid",String(!valid));highInput.setAttribute("aria-invalid",String(!valid));
    document.getElementById("price-error").textContent=valid?"":"Enter a lower price below the upper price, between 0 and 100¢. The last valid scale is still in use.";
    if(valid){lowInput.value=low;highInput.value=high;priceScale={low,high};refresh();}
  });
}

document.getElementById("reset-model").addEventListener("click",()=>{
  size="hyper";weights={...PRESETS.balanced};view="all";rankMode="fit";priceScale={low:5,high:35};sortKey="rank";sortAsc=true;colorScale="fixed";
  document.getElementById("rank-mode").value="fit";
  for(const [id,value] of [["price-low",5],["price-high",35]]){const input=document.getElementById(id);input.value=value;input.removeAttribute("aria-invalid");}
  document.getElementById("price-error").textContent="";document.getElementById("link-status").textContent="";
  setSize("hyper");setPressed("balanced");setLens("all");refresh();
});

// --- scenario URL ---
// Every setting that changes the ranking lives in the query string, omitted
// when it equals its default, so a pristine page keeps a clean address and a
// copied link reproduces the scenario exactly. Nothing is stored elsewhere.
let urlReady=false, urlTimer=null;
const DEFAULT_SCALE={low:5,high:35};
function weightsKey(W){ return FACTORS.map(f=>W[f.k]||0).join("."); }
// with no size in the address the page starts from Balanced; with one, from
// that size's profile. Encoding and decoding share this rule.
function baseWeights(z){ return z==="hyper" ? PRESETS.balanced : SIZES[z].weights; }
// Any siting setting away from its default means the link was made on the
// Siting fit map, so such links omit m=fit and older links keep opening there.
function impliesFit(){
  return size!=="hyper" || weightsKey(weights)!==weightsKey(baseWeights(size)) || view!=="all" || rankMode!=="fit"
    || priceScale.low!==DEFAULT_SCALE.low || priceScale.high!==DEFAULT_SCALE.high || FIGS.active()!=="map" || colorScale!=="fixed";
}
function encodeURLState(){
  const parts=[];
  if(mapView!==(impliesFit()?"fit":"posture")) parts.push("m="+mapView);
  if(!showLocal) parts.push("d=0");
  if(size!=="hyper") parts.push("z="+size);
  if(weightsKey(weights)!==weightsKey(baseWeights(size))) parts.push("w="+weightsKey(weights));
  if(view!=="all") parts.push("v="+view);
  if(rankMode!=="fit") parts.push("r="+rankMode);
  if(priceScale.low!==DEFAULT_SCALE.low||priceScale.high!==DEFAULT_SCALE.high) parts.push("c="+priceScale.low+"-"+priceScale.high);
  const fig=FIGS.active(); if(fig!=="map") parts.push("f="+fig);
  if(colorScale!=="fixed") parts.push("k="+colorScale);
  if(shortlist.size) parts.push("s="+[...shortlist].join(","));
  // an open profile travels with the link, so a state can be sent directly
  if(selected && profileDialog.open) parts.push("st="+selected);
  return parts.join("&");
}
function writeURL(){
  if(!urlReady) return;
  const q=encodeURLState();
  try{ history.replaceState(null,"",location.pathname+(q?"?"+q:"")+location.hash); }catch(err){}
}
function scheduleURL(){ clearTimeout(urlTimer); urlTimer=setTimeout(writeURL,150); }
// Malformed values are dropped one at a time and can never throw: a bad link
// still opens the page with everything else it asked for.
function readURLState(){
  let figure=null, profile=null, map=null;
  try{
    const q=new URLSearchParams(location.search);
    const z=q.get("z");
    if(z && SIZES[z]){ size=z; weights={...SIZES[z].weights}; }
    const w=q.get("w"); let parsed=null;
    if(w){
      const t=w.split(".");
      // version 2 links carried eight weights; the solar factor reads as zero
      if(t.length===FACTORS.length-1) t.push("0");
      if(t.length===FACTORS.length && t.every(x=>/^\d{1,2}$/.test(x))){
        parsed={}; FACTORS.forEach((f,i)=>{ parsed[f.k]=Math.max(0,Math.min(40,Math.round(+t[i]/5)*5)); });
      }
    }
    if(parsed) weights=parsed;
    else if(q.get("p") && PRESETS[q.get("p")]) weights={...PRESETS[q.get("p")]};
    const v=q.get("v"); if(v==="politics"||v==="physical") view=v;
    if(q.get("r")==="delivery") rankMode="delivery";
    const c=(q.get("c")||"").match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
    if(c){ const low=Math.round(+c[1]*2)/2, high=Math.round(+c[2]*2)/2; if(low>=0&&high<=100&&high>low) priceScale={low,high}; }
    (q.get("s")||"").split(",").map(x=>x.trim().toUpperCase()).filter(x=>BY[x]).forEach(x=>shortlist.add(x));
    figure=q.get("f");
    if(q.get("k")==="stretch") colorScale="stretch";
    const st=(q.get("st")||"").trim().toUpperCase(); if(BY[st]) profile=st;
    if(MAP_VIEWS[q.get("m")]) map=q.get("m");
    if(q.get("d")==="0"){ showLocal=false; document.getElementById("show-local").checked=false; gDots.style.display="none"; }
  }catch(err){}
  setSize(size); setPressed(presetMatching(weights)); setLens(view);
  document.getElementById("rank-mode").value=rankMode;
  document.getElementById("price-low").value=priceScale.low; document.getElementById("price-high").value=priceScale.high;
  renderShortlistChips();
  return {figure,profile,map};
}
function copyAddress(status,doneText){
  writeURL();
  const done=()=>{ status.textContent=doneText; };
  const fail=()=>{ status.textContent="Copy the address bar to share this. It already holds every setting."; };
  try{ (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(done,fail); }catch(err){ fail(); }
}
document.getElementById("copy-link").addEventListener("click",()=>{
  copyAddress(document.getElementById("link-status"),"Link copied. It reproduces the map view, size, priorities, ranking rule, price anchors, color scale, figure and shortlist.");
});

// --- state profiles ---
const profileDialog=document.getElementById("state-dialog");
const sourceNotes={
  "Government record":"Check the document's status and jurisdiction; a bill or agenda item is not necessarily an enacted rule.",
  "Grid operator":"Describes the named grid or market, not every utility territory in the state.",
  "Company statement":"Self-reported plans, investment or operations. An announcement does not establish available capacity for another project.",
  "Reporting":"Secondary reporting. Follow the original records for a permitting, tariff or investment decision.",
  "Legal analysis":"Professional interpretation; the enacted law or order controls.",
  "Market research":"A market-specific estimate, not a statewide measurement.",
  "Advocacy statement":"The organization's account of its position or legal action; allegations are not court findings.",
  "Reprinted release":"A reproduction of a government statement, hosted by a news publisher."
};
const EIA_SOURCE={t:"EIA-861: 2024 industrial electricity prices",u:"https://www.eia.gov/electricity/data/state/xls/861/HS861%202010-.xlsx",type:"Government dataset",supports:"The state's historical industrial average. Matched to the Total Electric Industry sheet; not a datacenter tariff.",reviewed:"2026-09-07"};
const SOLAR_SOURCE={t:"NASA POWER: 2001–2020 solar climatology",u:"https://power.larc.nasa.gov/",type:"Government dataset",supports:"All-sky surface shortwave irradiance, December and annual means, at the state's 2020 Census center of population. One grid cell of roughly 0.5 degrees per state, not a site survey; yield varies within a state.",reviewed:"2026-09-23"};
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function sourceCard(r){
  const type=r.type||"Unclassified reference";
  return `<li><span class="source-type">${escapeHTML(type)}</span><a href="${escapeHTML(r.u)}" target="_blank" rel="noopener">${escapeHTML(r.t)}</a><p>${escapeHTML(r.supports||sourceNotes[type]||"Scope has not been reviewed.")}</p>${r.reviewed?`<p class="checked">Scope checked ${escapeHTML(r.reviewed)}. This does not verify an analyst rating.</p>`:""}</li>`;
}
const sortedStates=[...STATES].sort((a,b)=>a.n.localeCompare(b.n));
for(const id of ["state-picker","profile-state"]){
  const picker=document.getElementById(id);
  sortedStates.forEach(s=>{const option=document.createElement("option");option.value=s.a;option.textContent=s.n;picker.appendChild(option);});
  picker.addEventListener("change",()=>{if(picker.value) select(picker.value);if(id==="state-picker") picker.value="";});
}
function setProfilePanel(panel){
  profilePanel=panel;
  document.querySelectorAll(".profile-tabs button").forEach(b=>{const on=b.dataset.panel===panel;b.setAttribute("aria-selected",String(on));b.tabIndex=on?0:-1;});
  document.querySelectorAll("#detail [role=tabpanel]").forEach(p=>p.hidden=p.id!=="panel-"+panel);
}
const profileTabs=[...document.querySelectorAll(".profile-tabs button")];
profileTabs.forEach((button,i)=>{
  button.addEventListener("click",()=>setProfilePanel(button.dataset.panel));
  button.addEventListener("keydown",e=>{
    let next;
    if(e.key==="ArrowRight") next=(i+1)%profileTabs.length;
    else if(e.key==="ArrowLeft") next=(i+profileTabs.length-1)%profileTabs.length;
    else if(e.key==="Home") next=0;
    else if(e.key==="End") next=profileTabs.length-1;
    else return;
    e.preventDefault();profileTabs[next].focus();setProfilePanel(profileTabs[next].dataset.panel);
  });
});
profileDialog.addEventListener("click",e=>{
  const r=profileDialog.getBoundingClientRect();
  if(e.target===profileDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)) profileDialog.close();
});
// closing drops the state from the address again
profileDialog.addEventListener("close",()=>{ document.getElementById("profile-link-status").textContent=""; scheduleURL(); });
// Previous and next walk the current ranking, or the alphabet when nothing is
// scored, so a reader can page through profiles without leaving the dialog.
function profileOrder(){ return hasWeights() ? rankedStates() : sortedStates; }
function stepProfile(dir){
  if(!selected) return;
  const order=profileOrder(), i=order.findIndex(s=>s.a===selected);
  const next=order[i+dir]; if(next) select(next.a);
}
function renderProfileNav(){
  const order=profileOrder(), i=order.findIndex(s=>s.a===selected), prev=order[i-1], next=order[i+1], scored=hasWeights();
  const label=s=>scored?`${s.n} · #${s.rank}`:s.n;
  const prevBtn=document.getElementById("profile-prev"), nextBtn=document.getElementById("profile-next");
  prevBtn.disabled=!prev; nextBtn.disabled=!next;
  prevBtn.querySelector("span").textContent=prev?label(prev):"";
  nextBtn.querySelector("span").textContent=next?label(next):"";
  prevBtn.setAttribute("aria-label",prev?`Previous: ${label(prev)}`:"No previous state");
  nextBtn.setAttribute("aria-label",next?`Next: ${label(next)}`:"No next state");
}
document.getElementById("profile-prev").addEventListener("click",()=>stepProfile(-1));
document.getElementById("profile-next").addEventListener("click",()=>stepProfile(1));
profileDialog.addEventListener("keydown",e=>{
  // Alt with an arrow pages through profiles from anywhere in the dialog; the
  // bare arrows still belong to the tab strip and the select.
  if(!e.altKey) return;
  if(e.key==="ArrowLeft"){ e.preventDefault(); stepProfile(-1); }
  if(e.key==="ArrowRight"){ e.preventDefault(); stepProfile(1); }
});
document.getElementById("profile-link").addEventListener("click",()=>{
  copyAddress(document.getElementById("profile-link-status"),"Link copied. It opens this profile with the current scenario.");
});
function rankedStates(){ return [...STATES].sort((a,b)=>a.rank-b.rank||a.n.localeCompare(b.n)); }
// --- findings ---
// Each list is a rule over the records, written out beside it, so a reader can
// check the rule as well as the result, and the lists move when records do.
const courting=s=>s.st==="Courting"||s.st==="Courting, with conditions";
const FINDINGS=[
  {title:"Courting states with the most local moratoriums",
   rule:"State posture is Courting or Courting with conditions. Ranked by local moratoriums in force.",
   pick:()=>STATES.filter(s=>courting(s)&&s.localIn>0).sort((a,b)=>b.localIn-a.localIn||a.n.localeCompare(b.n)).slice(0,5),
   value:s=>`${s.localIn} local`},
  {title:"Courting states with high pushback",
   rule:"State posture is Courting or Courting with conditions, and public pushback is High.",
   pick:()=>STATES.filter(s=>courting(s)&&s.rr.pb==="High")},
  {title:"High pushback where building continues",
   rule:"Public pushback is High, and buildout momentum is 4 or 5 of 5.",
   pick:()=>STATES.filter(s=>s.rr.pb==="High"&&s.mo>=4)},
  {title:"Restrictive or paused with no rule in force",
   rule:"State posture is Restrictive or Reviewing or paused, with no datacenter-specific statewide rule in force yet.",
   pick:()=>STATES.filter(s=>(s.st==="Restrictive"||s.st==="Reviewing or paused")&&strongestRule(s)<=0)}
];
function renderFindings(){
  const box=document.getElementById("findings-list");
  box.innerHTML=FINDINGS.map(f=>{
    const list=f.pick(); if(!list.length) return "";
    const shown=f.value?list:[...list].sort((a,b)=>a.n.localeCompare(b.n));
    return `<div class="finding"><h3>${f.title}</h3><div class="finding-states">${shown.map(s=>`<button type="button" class="candidate" data-a="${s.a}" aria-pressed="${s.a===selected}">${s.n}${f.value?`<span>${f.value(s)}</span>`:""}</button>`).join("")}</div><p class="fine">${f.rule}</p></div>`;
  }).join("");
  box.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>select(b.dataset.a)));
}
function renderCandidates(){
  const box=document.getElementById("candidates");
  if(!hasWeights()){box.textContent="Choose a priority or preset to rank states.";return;}
  const top=rankedStates().slice(0,5);
  box.innerHTML=`<span>Leading states · ${rankModeLabel().toLowerCase()}</span>`+top.map(s=>`<button class="candidate" data-a="${s.a}" aria-pressed="${s.a===selected}" aria-label="Open ${s.n}, rank ${s.rank}, fit ${s.total.toFixed(0)}">${s.n}<span>${s.total.toFixed(0)}</span></button>`).join("");
  box.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>select(b.dataset.a)));
}
// Top and bottom five under the current size and ranking rule. Ties keep their
// shared rank number rather than being counted off 1 to 5.
function renderTiers(){
  const box=document.getElementById("tiers");
  if(!hasWeights()){ box.innerHTML='<p class="fine">Choose a priority or preset to rank states.</p>'; return; }
  const all=rankedStates();
  const col=(title,list)=>`<div><h3>${title}</h3><ol>${list.map(s=>`<li value="${s.rank}"><button type="button" class="tier-item" data-a="${s.a}" aria-label="Open ${s.n}, rank ${s.rank}, fit ${s.total.toFixed(0)}">${s.n}<span>${s.total.toFixed(0)}</span></button></li>`).join("")}</ol></div>`;
  box.innerHTML=`<p class="tiers-head">Top and bottom five · ${sizeLabel()} · ${rankModeLabel().toLowerCase()} · ${viewLabel()}</p>`
    +col("Top five",all.slice(0,5))+col("Bottom five",all.slice(-5))
    +`<p class="fine">Seven of nine factors are provisional analyst ratings. Equal scores share a rank number. Fit does not establish site readiness.</p>`;
  box.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>select(b.dataset.a)));
}
function select(abbr){
  if(!BY[abbr]) return;
  selected=abbr;
  document.querySelectorAll(".state,#tbody tr,#scsvg .dot").forEach(el=>el.classList.toggle("selected",el.dataset.a===abbr));
  document.querySelectorAll(".candidate").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.a===abbr)));
  renderDetail();
  tip.style.display="none";
  if(!profileDialog.open) profileDialog.showModal();
  profileDialog.scrollTop=0;
  scheduleURL();
}
// --- reception and regulation (context only, never scored) ---
const RR_AXES=[
  {k:"wt",name:"Water",scale:"rule"},{k:"pg",name:"Power and cost",scale:"rule"},
  {k:"zn",name:"Siting and zoning",scale:"rule"},{k:"tx",name:"Tax incentives",scale:"tax"}
];
// One friction scale across all four axes, worded for each. Only rules
// actually in force count; a pending bill sits at 0 and is described in the
// prose instead.
const RR_LEVELS={
  rule:{"-1":"State rule eases entry","0":"No datacenter-specific rule","1":"Disclosure or reporting","2":"Binding conditions","3":"Pause or prohibition"},
  tax:{"-1":"Incentive widened","0":"Incentive unrestricted or none offered","1":"Conditional eligibility","2":"Narrowed or paused","3":"Repealed or barred"}
};
const RR_PUSHBACK={
  Low:"No organized opposition or local restriction on record.",
  Moderate:"Local restrictions or contested proceedings in some jurisdictions.",
  High:"Multiple local bans, a statewide restriction that cleared a chamber, or a referendum."
};
function ticks(level){
  // -1 reads as a single mark in the link color: eased, not restricted.
  if(level<0) return '<span class="ticks" aria-hidden="true"><i class="eased"></i><i></i><i></i></span>';
  let h="";
  for(let i=1;i<=3;i++) h+=`<i class="${i<=level?"on"+(level>=3?" hot":""):""}"></i>`;
  return `<span class="ticks" aria-hidden="true">${h}</span>`;
}
function renderReception(s){
  const rr=s.rr;
  const rows=RR_AXES.map(a=>{
    const level=rr[a.k], label=RR_LEVELS[a.scale][String(level)];
    return `<li><span class="axis-name">${a.name}</span>${ticks(level)}<span class="axis-state">${label}</span></li>`;
  }).join("");
  return `
    <h3>Public response to development</h3>
    <div class="reception" data-level="${rr.pb}"><b>${rr.pb} pushback</b><span>${RR_PUSHBACK[rr.pb]}</span></div>
    <h3>Datacenter-specific rules in force</h3>
    <ul class="axes">${rows}</ul>
    <p class="note">${rr.n}</p>
    ${renderLocal(s)}
    <p class="evidence-note">Reception and regulation are provisional analyst assessments. They contribute no points and do not affect rankings. Regulatory axes record statewide rules in force; notes describe pending bills. Public opposition and regulatory requirements are distinct. Local moratorium counts come from Moratorium Nation and contribute no points either.</p>`;
}
// The state's own local measures, newest first. County and town action can
// stop a project where state policy courts it, and a state view hides that.
const LOCAL_SHOWN=8;
function renderLocal(s){
  const b=LOCAL_BY[s.a];
  const recent=[...b.inForce].sort((x,y)=>(y.enacted||"").localeCompare(x.enacted||"")||x.name.localeCompare(y.name));
  const item=m=>`<li><b>${escapeHTML(m.name)}</b><span>${escapeHTML(m.type)}${m.enacted?" · enacted "+longDate(m.enacted):""}${m.status==="e"?" · extended":""}${m.end?" · scheduled to end "+longDate(m.end):""}</span></li>`;
  const counts=`${b.inForce.length} in force and ${b.pending.length} proposed in ${s.n}'s cities, counties, townships and tribal governments, as Moratorium Nation recorded them on ${LOCAL_AS_OF}.${b.past.length?` Another ${b.past.length} ${b.past.length===1?"has":"have"} expired, been replaced by permanent rules or been rescinded.`:""}`;
  return `<h3>Local moratoriums</h3>
    <p class="note">${counts}</p>
    ${recent.length?`<ul class="local-list">${recent.slice(0,LOCAL_SHOWN).map(item).join("")}</ul>`:""}
    <p class="fine">${recent.length>LOCAL_SHOWN?`The ${LOCAL_SHOWN} most recent are listed. `:""}<a href="${escapeHTML(LOCAL.source.url)}" target="_blank" rel="noopener">Every measure, with its documents, at Moratorium Nation ↗</a></p>`;
}
function renderDetail(){
  if(!selected) return;
  const s=BY[selected], scored=hasWeights(), W=activeWeights();
  document.getElementById("profile-state").value=selected;
  document.getElementById("profile-title").textContent=s.n+" · State profile";
  renderProfileNav();
  const bars=FACTORS.map(f=>{
    const value=sub(s,f.k), points=contribution(s,f.k), off=(W[f.k]||0)===0;
    return `<div class="bar${off?" off":""}"><span class="label">${f.name}<span class="factor-kind">${MEASURED.has(f.k)?"Measured benchmark":"Provisional analyst rating · "+s[f.k]+"/5"}</span></span><span class="c">${off?"Not weighted":"+"+points.toFixed(1)+" pts"}</span><div class="track" aria-hidden="true"><div class="fill" style="width:${value}%"></div></div><span class="n">${value.toFixed(0)}/100</span></div>`;
  }).join("");
  const order=["Government dataset","Government record","Grid operator","Reporting","Market research","Legal analysis","Reprinted release","Company statement","Advocacy statement"];
  const sources=[...(s.srcs||[])].sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type));
  const swing=s.swing?` The largest single move is ${s.swing.name.toLowerCase()} at ${s.swing.value}/5 instead of ${s[s.swing.k]}/5, which would place it at rank ${s.swing.rank}.`:(scored?" No single one-level change moves its rank.":"");
  const sensitivity=scored?`<p class="sensitivity"><b>One-rating sensitivity: rank ${s.rankMin}–${s.rankMax}.</b> This changes one of this state's analyst ratings by one level at a time, holding all other states fixed.${swing} It is not a confidence interval.</p>`:"";
  document.getElementById("detail").innerHTML=`
    <div class="top"><div><h2>${s.n}</h2>${s.tag?`<span class="chip">${s.tag}</span>`:""}</div>${mapView==="fit"?`<div class="score">${scored?s.total.toFixed(0):"—"}<small>fit / 100</small></div>`:`<div class="posture-head">${s.st}<small>state posture</small></div>`}</div>
    <button type="button" class="close-btn" id="save-state" aria-pressed="${shortlist.has(s.a)}" onclick="toggleShortlist(selected)">${shortlist.has(s.a)?"Remove from shortlist":"Add to shortlist"}</button>
    <p class="rank">${!scored?"Set a priority to calculate fit. Facts and sources remain available.":mapView==="fit"?`Rank ${s.rank} of 50${s.tied?" (tied)":""} · ${rankModeLabel()} · ${viewLabel()} · ${sizeLabel()}`:`Siting fit ${s.total.toFixed(0)} of 100, rank ${s.rank} of 50${s.tied?" (tied)":""}, under the Advanced analysis settings`}</p>
    <section id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" tabindex="0">
      <dl class="politics-facts">
        <div><dt>State posture</dt><dd>${s.st}</dd></div>
        <div><dt>Public pushback</dt><dd>${s.rr.pb}</dd></div>
        <div><dt>Strongest statewide rule in force</dt><dd>${RULE_LABEL[strongestRule(s)]}</dd></div>
        <div><dt>Local moratoriums</dt><dd>${s.localIn} in force · ${s.localPending} proposed</dd></div>
      </dl>
      <div class="delivery-status" data-tier="${deliveryTier(s)}"><b>${deliveryLabel(s)} ${deliveryContext()}</b><p>Power headroom ${s.pw}/5 · Community and permitting ${s.op}/5. Lower concern at this size needs headroom ${SIZES[size].floors.pw} and permitting ${SIZES[size].floors.op}. These are analyst ratings, not a confirmed power allocation or permit decision.</p></div>
      <div class="fact"><p>2024 industrial electricity price</p><strong>${s.p.toFixed(2)}¢/kWh</strong><a href="${EIA_SOURCE.u}" target="_blank" rel="noopener">EIA measured benchmark ↗</a></div>
      <div class="fact"><p>December solar irradiance at the state's population center (annual ${s.sy.toFixed(2)})</p><strong>${s.sr.toFixed(2)} kWh/m²/day</strong><a href="${SOLAR_SOURCE.u}" target="_blank" rel="noopener">NASA POWER 2001–2020 climatology ↗</a></div>
      <details class="diligence"><summary>What to verify before advancing ${s.n}</summary>
        <ul><li>Utility: available MW at the proposed substation, energization date, upgrade costs and the applicable tariff.</li><li>Local authority: parcel zoning, permit sequence, hearing requirements and current restrictions.</li><li>Water provider: supply allocation, cooling design and discharge requirements.</li><li>Project team: site hazards, fiber routes and incentive eligibility for this project.</li></ul>
        <p class="evidence-note">Record project-specific answers alongside the state evidence in the Sources tab.</p>
      </details>
      <h3>Analyst summary</h3><p class="note">${s.note}</p>
      <p class="evidence-note">${sources.length?"References are listed in Sources, with their type and scope. The summary and individual ratings have not been fully verified against original records.":"No state-specific references are recorded. The summary and judgment ratings need supporting evidence; only the EIA price has been checked."}</p>
      <div class="meta"><span>Buildout momentum: ${s.mo}/5 · context only</span><span>Posture, pushback, rules and local moratoriums are context and add no points</span></div>
    </section>
    <section id="panel-reception" role="tabpanel" aria-labelledby="tab-reception" tabindex="0" hidden>
      ${renderReception(s)}
    </section>
    <section id="panel-scores" role="tabpanel" aria-labelledby="tab-scores" tabindex="0" hidden>
      <p class="breakdown-hint">Bars show factor values. Points show the contribution under ${viewLabel()} weights. Momentum is excluded.</p>
      ${sensitivity}<div class="bars">${bars}</div>
      <p class="evidence-note">Seven factors use provisional 1–5 judgments. Higher fit does not establish that a project can connect or obtain permits. ${rankMode==="delivery"?`Delivery-first rankings group states by headroom and permitting against the ${sizeLabel().toLowerCase()} thresholds before comparing fit.`:"Weighted-fit rankings allow trade-offs between factors. Review delivery concerns separately."}</p>
    </section>
    <section id="panel-sources" role="tabpanel" aria-labelledby="tab-sources" tabindex="0" hidden>
      <h3>Evidence and its limits</h3><p class="evidence-note">Source type describes who published the material, not a credibility score. A source can support a policy event without validating a 1–5 rating. Company and advocacy statements represent the publisher's own account.</p>
      <ul class="source-list">${sourceCard(EIA_SOURCE)}${sourceCard(SOLAR_SOURCE)}${sources.map(sourceCard).join("")}</ul>
      ${sources.length?"":'<p class="note">No state-specific citations yet. This is an evidence gap.</p>'}
    </section>`;
  setProfilePanel(profilePanel);
}

// --- table ---
const COLS=[
  {k:"rank",label:"#"},{k:"n",label:"State"},{k:"total",label:"Fit"},{k:"swing",label:"Rank range"},
  {k:"p",label:"¢/kWh"},{k:"sr",label:"Dec sun"},{k:"pw",label:"Headroom"},{k:"po",label:"Policy"},{k:"op",label:"Community"},
  {k:"w",label:"Water"},{k:"h",label:"Hazard"},{k:"c",label:"Climate"},{k:"x",label:"Connectivity"},{k:"delivery",label:"Delivery concerns"},
  {k:"pb",label:"Pushback"},{k:"rules",label:"Rules in force"},{k:"local",label:"Local moratoriums"},
  {k:"phy",label:"Physical"},{k:"pol",label:"Political"}
];
const thead=document.getElementById("thead");
COLS.forEach(c=>{
  const th=document.createElement("th"); th.dataset.k=c.k; th.scope="col";
  // a real button so the header is reachable and operable from the keyboard
  const btn=document.createElement("button"); btn.type="button"; btn.className="sortbtn"; btn.textContent=c.label;
  th.appendChild(btn);
  const doSort=()=>{ if(sortKey===c.k){sortAsc=!sortAsc;} else {sortKey=c.k; sortAsc=(c.k==="n"||c.k==="p"||c.k==="rank"||c.k==="delivery"||c.k==="swing");} renderTable(); };
  btn.addEventListener("click",doSort);
  thead.appendChild(th);
});
const PB_ORDER={Low:0,Moderate:1,High:2};
// How many of the four axes carry a rule that is actually in force. An eased
// axis (-1) is not a rule to clear, so it does not count.
const ruleCount=s=>RR_AXES.filter(a=>s.rr[a.k]>0).length;
function sortValue(s,key){
  if(key==="delivery") return deliveryTier(s);
  // the width of the one-rating sensitivity band; narrower is steadier
  if(key==="swing") return s.rank===null ? null : s.rankMax-s.rankMin;
  if(key==="pb") return PB_ORDER[s.rr.pb];
  if(key==="rules") return ruleCount(s);
  if(key==="local") return s.localIn;
  return s[key];
}
function renderTable(){
  document.querySelectorAll("#thead th").forEach(th=>{
    const on=th.dataset.k===sortKey;
    th.classList.toggle("sorted",on); th.classList.toggle("asc",on&&sortAsc);
    th.setAttribute("aria-sort", on ? (sortAsc?"ascending":"descending") : "none");
    const b=th.querySelector("button");
    b.setAttribute("aria-label", `${b.textContent}, ${on?(sortAsc?"sorted ascending":"sorted descending"):"not sorted"}. Activate to sort.`);
  });
  const scored=hasWeights();
  const rows=STATES.filter(s=>!document.getElementById("shortlist-only").checked || shortlist.has(s.a)).sort((a,b)=>{
    let va=sortValue(a,sortKey), vb=sortValue(b,sortKey);
    if(va===null||va===undefined) va=-1; if(vb===null||vb===undefined) vb=-1;
    if(typeof va==="string") return sortAsc? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc? va-vb : vb-va;
  });
  document.getElementById("shortlist-status").textContent=`${shortlist.size} saved · ${rows.length} states shown`;
  document.getElementById("export-comparison").disabled=rows.length===0;
  const dash=v=>scored?v:"--";
  const tb=document.getElementById("tbody");
  tb.innerHTML=rows.map(s=>`<tr data-a="${s.a}" tabindex="0" class="${s.a===selected?"selected":""}" aria-label="${s.n}${scored?`, score ${s.total.toFixed(0)}, rank ${s.rank}`:", not scored"}"><td>${dash(s.rank)}</td><td>${s.n}${s.tag?`<span class="flag" title="${s.tag}"></span>`:""}</td><td class="tot">${dash(scored?s.total.toFixed(0):null)}</td><td>${dash(scored?(s.rankMin===s.rankMax?String(s.rank):s.rankMin+"–"+s.rankMax):null)}</td><td>${s.p.toFixed(2)}</td><td>${s.sr.toFixed(1)}</td><td>${s.pw}</td><td>${s.po}</td><td>${s.op}</td><td>${s.w}</td><td>${s.h}</td><td>${s.c}</td><td>${s.x}</td><td>${deliveryLabel(s).replace(" modeled","")}</td><td>${s.rr.pb}</td><td>${ruleCount(s)} of 4</td><td>${s.localIn}</td><td>${dash(scored?s.phy.toFixed(0):null)}</td><td>${dash(scored?s.pol.toFixed(0):null)}</td></tr>`).join("");
  if(!rows.length) tb.innerHTML=`<tr><td colspan="${COLS.length}" class="empty">Your shortlist is empty. Add a state above or from a state profile to start comparing.</td></tr>`;
  tb.querySelectorAll("tr[data-a]").forEach(tr=>{
    tr.addEventListener("click",()=>select(tr.dataset.a));
    tr.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();select(tr.dataset.a);} });
  });
}

function toggleShortlist(abbr){
  if(!BY[abbr]) return;
  if(shortlist.has(abbr)) shortlist.delete(abbr); else shortlist.add(abbr);
  const refocus=document.activeElement?.id==="save-state";
  renderShortlistChips();
  renderTable(); renderCompare(); renderDetail(); scheduleURL();
  if(refocus) document.getElementById("save-state")?.focus();
}

// --- shortlist comparison ---
// The saved states side by side, one column each, in rank order. Every row
// marks its most favorable cell, and the factor rows carry the same value
// bars as a profile so a trade-off reads as a shape rather than a digit. The
// table below still holds all fifty states; this card holds the decision.
const COMPARE_MAX=8;
function renderCompare(){
  const box=document.getElementById("compare");
  const saved=[...shortlist].map(a=>BY[a]).sort((x,y)=>hasWeights()?compareFit(x,y)||x.n.localeCompare(y.n):x.n.localeCompare(y.n));
  box.hidden=saved.length<2;
  if(saved.length<2){ box.innerHTML=""; return; }
  const shown=saved.slice(0,COMPARE_MAX), scored=hasWeights(), W=activeWeights();
  const fmt1=v=>Number.isFinite(v)?v.toFixed(1):"—";
  // Rows: [label, value fn for sorting best, cell renderer, higher-is-better]
  const head=`<tr><th scope="col" class="cmp-label"><span class="visually-hidden">Measure</span></th>${shown.map(s=>`<th scope="col"><button type="button" class="cmp-state" data-a="${s.a}" aria-label="Open ${s.n}">${s.n}</button><button type="button" class="cmp-remove" data-remove="${s.a}" aria-label="Remove ${s.n} from shortlist">×</button></th>`).join("")}</tr>`;
  const row=(label,vals,render,opts={})=>{
    const nums=vals.filter(v=>Number.isFinite(v));
    let best=null;
    if(opts.mark!==false && nums.length>1 && new Set(nums).size>1) best=opts.lowerBetter?Math.min(...nums):Math.max(...nums);
    return `<tr><th scope="row" class="cmp-label">${label}${opts.sub?`<span class="factor-kind">${opts.sub}</span>`:""}</th>${vals.map((v,i)=>`<td class="${best!==null&&v===best?"best":""}">${render(v,shown[i])}</td>`).join("")}</tr>`;
  };
  const rows=[];
  rows.push(row("Fit",shown.map(s=>scored?s.total:null),v=>scored?`<b class="cmp-big">${v.toFixed(0)}</b>`:"—"));
  rows.push(row("Rank of 50",shown.map(s=>scored?s.rank:null),(v,s)=>scored?`${v}${s.tied?" tied":""}<span class="cmp-fine">range ${s.rankMin}–${s.rankMax}</span>`:"—",{lowerBetter:true}));
  rows.push(row("Delivery concerns",shown.map(s=>deliveryTier(s)),(v,s)=>`<span class="cmp-tier" data-tier="${v}">${deliveryLabel(s).replace(" modeled concerns","")}</span>`,{lowerBetter:true}));
  rows.push(row("2024 industrial price",shown.map(s=>s.p),v=>`${v.toFixed(2)}¢<span class="cmp-fine">per kWh</span>`,{lowerBetter:true,sub:"EIA, measured"}));
  rows.push(row("December sun",shown.map(s=>s.sr),v=>`${v.toFixed(2)}<span class="cmp-fine">kWh/m²/day</span>`,{sub:"NASA POWER, measured"}));
  FACTORS.forEach(f=>{
    const off=(W[f.k]||0)===0;
    rows.push(row(f.name,shown.map(s=>sub(s,f.k)),(v,s)=>`<div class="cmp-bar${off?" off":""}" aria-hidden="true"><i style="width:${v}%"></i></div><span class="cmp-fine">${MEASURED.has(f.k)?v.toFixed(0)+"/100":s[f.k]+"/5"}${off||!scored?"":" · +"+contribution(s,f.k).toFixed(1)+" pts"}</span>`,{sub:off?"not weighted":MEASURED.has(f.k)?"measured":"analyst rating"}));
  });
  rows.push(row("Pushback",shown.map(s=>PB_ORDER[s.rr.pb]),(v,s)=>s.rr.pb,{mark:false}));
  rows.push(row("Rules in force",shown.map(s=>ruleCount(s)),v=>`${v} of 4`,{mark:false}));
  rows.push(row("Local moratoriums",shown.map(s=>s.localIn),(v,s)=>`${v} in force<span class="cmp-fine">${s.localPending} proposed</span>`,{mark:false,sub:"Moratorium Nation"}));
  rows.push(row("State posture",shown.map(()=>null),(v,s)=>s.st,{mark:false}));
  // Where the shortlist disagrees most, among the factors that count.
  const spreads=FACTORS.filter(f=>(W[f.k]||0)>0).map(f=>{const vs=shown.map(s=>sub(s,f.k));return {f,d:Math.max(...vs)-Math.min(...vs)};}).sort((p,q)=>q.d-p.d);
  const lead=spreads[0], agree=spreads.filter(d=>d.d===0).map(d=>d.f.name.toLowerCase());
  const summary=scored&&lead
    ? `Widest gap among weighted factors: <b>${lead.f.name.toLowerCase()}</b>, ${lead.d.toFixed(0)} points between ${shown[shown.map(s=>sub(s,lead.f.k)).indexOf(Math.max(...shown.map(s=>sub(s,lead.f.k))))].n} and ${shown[shown.map(s=>sub(s,lead.f.k)).indexOf(Math.min(...shown.map(s=>sub(s,lead.f.k))))].n}.${agree.length?` The shortlist agrees on ${agree.join(", ")}.`:""}`
    : "Set a priority to compare fit; facts and ratings are shown regardless.";
  box.innerHTML=`<div class="cmp-head"><h2>Shortlist side by side</h2><p>${shown.length} of ${saved.length} saved states${saved.length>COMPARE_MAX?(scored?`, the ${COMPARE_MAX} highest ranked`:`, the first ${COMPARE_MAX} alphabetically`):""} · ${sizeLabel()} · ${viewLabel()} · ${rankModeLabel()}. Marked cells are the most favorable in each row.</p></div>
    <div class="cmp-scroll"><table class="cmp"><thead>${head}</thead><tbody>${rows.join("")}</tbody></table></div>
    <p class="cmp-summary">${summary}</p>
    <p class="fine">Seven of nine factors are provisional analyst ratings, so a one-level gap is within the model's own uncertainty. Reception and rules are context and never scored.</p>`;
  box.querySelectorAll(".cmp-state").forEach(b=>b.addEventListener("click",()=>select(b.dataset.a)));
  box.querySelectorAll(".cmp-remove").forEach(b=>b.addEventListener("click",()=>toggleShortlist(b.dataset.remove)));
}
function renderShortlistChips(){
  document.getElementById("shortlist-chips").innerHTML=[...shortlist].map(a=>`<button type="button" class="candidate" data-remove="${a}" aria-label="Remove ${BY[a].n} from shortlist">${BY[a].n} ×</button>`).join("");
  document.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>toggleShortlist(b.dataset.remove)));
}
const shortlistPicker=document.getElementById("shortlist-picker");
[...STATES].sort((a,b)=>a.n.localeCompare(b.n)).forEach(s=>shortlistPicker.add(new Option(s.n,s.a)));
shortlistPicker.addEventListener("change",()=>{
  if(shortlistPicker.value && !shortlist.has(shortlistPicker.value)) toggleShortlist(shortlistPicker.value);
  shortlistPicker.value="";
});
document.getElementById("shortlist-only").addEventListener("change",renderTable);
document.getElementById("export-comparison").addEventListener("click",()=>{
  const W=activeWeights(), tw=totalWeight(W);
  const columns=["state","postal","rank_of_50","fit_0_100","delivery_concern","project_size","rating_sensitivity_rank_min","rating_sensitivity_rank_max","industrial_price_cents_kwh_2024","december_ghi_kwh_m2_day","view","ranking_rule","model_version","price_anchor_low","price_anchor_high","solar_anchor_low","solar_anchor_high",...FACTORS.map(f=>"weight_share_"+f.k),"evidence_limit"];
  const rows=[...document.querySelectorAll("#tbody tr[data-a]")].map(tr=>BY[tr.dataset.a]).map(s=>[
    s.n,s.a,s.rank,s.total,deliveryLabel(s),size,s.rankMin,s.rankMax,s.p,s.sr,view,rankMode,MODEL_VERSION,priceScale.low,priceScale.high,SOLAR_SCALE.low,SOLAR_SCALE.high,...FACTORS.map(f=>tw?(W[f.k]||0)/tw:0),"EIA 2024 state average and NASA POWER climatology at one point per state; seven provisional analyst ratings. Not site readiness or a utility tariff."
  ]);
  const cell=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const blob=new Blob([[columns,...rows].map(r=>r.map(cell).join(",")).join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob), link=document.createElement("a");
  link.href=url;link.download="datacenter-comparison.csv";document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),0);
});

// --- share card ---
// A 1200 by 675 image of the current scenario, drawn on a canvas so it needs
// no server and carries the address back to the page. Counting a download
// must never be the reason one fails, so the counter is guarded.
const EVIDENCE_REVIEW="September 7, 2026";
const CARD_FONT='"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
function countEvent(path,title){ try{ window.goatcounter?.count?.({path,title,event:true}); }catch(err){} }
function drawShareCard(){
  const W=1200,H=675, cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const ctx=cv.getContext("2d"), INK="#18212B", MUTED="#5C6773";
  const font=(px,wt)=>{ ctx.font=`${wt||400} ${px}px ${CARD_FONT}`; };
  const text=(t,x,y,px,wt,fill,align)=>{ font(px,wt); ctx.fillStyle=fill||INK; ctx.textAlign=align||"left"; ctx.fillText(t,x,y); };
  ctx.fillStyle="#FFFFFF"; ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#B5432A"; ctx.fillRect(0,0,12,H);
  ctx.textBaseline="alphabetic";
  const Z=SIZES[size];
  text("US datacenter comparison, 2026",60,86,42,600);
  text(`${Z.label} (${Z.mw}) · ${viewLabel()} · ${rankModeLabel()}`,60,124,23,400,MUTED);
  text(`Model version ${MODEL_VERSION} · evidence review ${EVIDENCE_REVIEW} · EIA 2024 industrial prices`,60,154,16,400,MUTED);
  rankedStates().slice(0,5).forEach((s,i)=>{
    const y=222+i*80;
    ctx.fillStyle=fitColor(s.total); ctx.fillRect(60,y-32,40,40);
    text(`#${s.rank}${s.tied?" tied":""}`,118,y-6,17,400,MUTED);
    text(s.n,190,y,30,600);
    text(s.total.toFixed(0),720,y,30,600,INK,"right");
    text(deliveryLabel(s),190,y+24,15,400,MUTED);
  });
  const Wt=activeWeights(), tw=totalWeight(Wt), x0=800;
  const shares=FACTORS.map(f=>tw>0?(Wt[f.k]||0)/tw*100:0), maxShare=Math.max(1,...shares);
  text("Priority shares",x0,200,19,600);
  FACTORS.forEach((f,i)=>{
    const y=236+i*28, share=shares[i], bw=Math.round(share/maxShare*170);
    text(f.name.replace(" and ecosystem","").replace("Winter solar resource","Winter sun").replace("Incentives and policy","Policy").replace("Community and permitting","Permitting").replace("Climate for cooling","Climate").replace("Natural hazard","Hazard").replace("Power headroom","Headroom").replace("Power cost","Cost"),x0,y,14,400,MUTED);
    ctx.fillStyle=share>0?INK:"#E6EAEE"; ctx.fillRect(x0+110,y-12,Math.max(bw,3),14);
    text(share>0?share.toFixed(0)+"%":"0%",x0+340,y,14,400,MUTED,"right");
  });
  text("sonnetx.github.io/datacenter-map",60,632,18,600);
  text("Two measured inputs and seven provisional analyst ratings. Not site readiness.",1140,632,15,400,MUTED,"right");
  return cv;
}
function downloadShareCard(){
  if(!hasWeights()) return;
  drawShareCard().toBlob(blob=>{
    if(!blob) return;
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url; a.download=`datacenter-scenario-${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  },"image/png");
  countEvent("share-card-png","Share card (PNG)");
}
document.getElementById("share-card").addEventListener("click",downloadShareCard);

function median(a){const b=[...a].sort((x,y)=>x-y);const m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2;}
function renderScatter(){
  const svg=document.getElementById("scsvg"); const L=52,R=880,T=18,B=478;
  const xs=v=>L+(R-L)*(v/100), ys=v=>B-(B-T)*(v/100);
  const mx=median(STATES.map(s=>s.phy)), my=median(STATES.map(s=>s.pol));
  const C=THEME;
  let h=`<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" stroke="${C.rule}"/><line x1="${L}" y1="${T}" x2="${L}" y2="${B}" stroke="${C.rule}"/>`;
  h+=`<line x1="${xs(mx)}" y1="${T}" x2="${xs(mx)}" y2="${B}" stroke="${C.warn}" stroke-dasharray="3 4" opacity=".6"/><line x1="${L}" y1="${ys(my)}" x2="${R}" y2="${ys(my)}" stroke="${C.warn}" stroke-dasharray="3 4" opacity=".6"/>`;
  [0,25,50,75,100].forEach(v=>{h+=`<text x="${xs(v)}" y="${B+16}" font-size="11" text-anchor="middle" fill="${C.muted}">${v}</text><text x="${L-8}" y="${ys(v)+4}" font-size="11" text-anchor="end" fill="${C.muted}">${v}</text>`;});
  h+=`<text x="${(L+R)/2}" y="${B+36}" font-size="12.5" text-anchor="middle" fill="${C.ink}">Physical fundamentals →</text>`;
  h+=`<text transform="translate(14 ${(T+B)/2}) rotate(-90)" font-size="12.5" text-anchor="middle" fill="${C.ink}">Political outlook →</text>`;
  // label placement with collision avoidance
  const placed=[]; const LW=16, LH=11;
  const cands=[[8,4],[-24,4],[-8,-9],[-8,17],[8,-8],[8,16],[-24,-8],[-24,16],[8,28],[-8,-20]];
  const pts=STATES.map(s=>({s,x:xs(s.phy),y:ys(s.pol)}));
  pts.forEach(p=>placed.push({x:p.x-6,y:p.y-6,w:12,h:12,dot:true}));
  const hit=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  pts.forEach(p=>{
    let best=null;
    for(const [dx,dy] of cands){ const box={x:p.x+dx,y:p.y+dy-LH,w:LW,h:LH}; if(!placed.some(q=>hit(box,q)&&!(q.dot&&q.x===p.x-6&&q.y===p.y-6))){best=[dx,dy,box];break;} }
    if(!best){ best=[8,4,{x:p.x+8,y:p.y+4-LH,w:LW,h:LH}]; }
    placed.push(best[2]); p.lx=p.x+best[0]; p.ly=p.y+best[1];
  });
  pts.forEach(p=>{const s=p.s;
    h+=`<g class="dot ${s.a===selected?"selected":""}" data-a="${s.a}" tabindex="0" role="button" aria-label="${s.n}: physical fundamentals ${s.phy.toFixed(0)}, political outlook ${s.pol.toFixed(0)}. ${s.st}. Activate to select."><circle cx="${p.x}" cy="${p.y}" r="6" fill="${hasWeights()?fitColor(s.total):C.soft}" stroke="${C.panel}" stroke-width="1.2"/><text x="${p.lx}" y="${p.ly}" font-size="10.5" fill="${C.ink}" style="paint-order:stroke;stroke:${C.panel};stroke-width:2.5px">${s.a}</text><title>${s.n}: physical ${s.phy.toFixed(0)}, political ${s.pol.toFixed(0)}. ${s.st}.</title></g>`;
  });
  svg.innerHTML=h;
  svg.querySelectorAll(".dot").forEach(g=>{
    g.addEventListener("click",()=>select(g.dataset.a));
    g.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();select(g.dataset.a);} });
  });
}
