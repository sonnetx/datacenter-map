// Start-up: score, read the address, draw, then wire the dataset download.
function refresh(){ compute(); syncSliders(); paint(); renderCandidates(); renderTiers(); renderDetail(); renderTable(); renderCompare(); renderScatter(); FIGS.draw(); scheduleURL(); }
// Redraw when the operating system flips between light and dark: the SVG and
// canvas drawings read their colors from the stylesheet at draw time.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ readTheme(); paint(); renderScatter(); FIGS.draw(); });
// The Advanced analysis panel starts closed, and a phone keeps it closed so the
// map comes first. On a wide screen a link made on the Siting fit map opens it.
(function(){
  const mq=window.matchMedia("(max-width:900px)"), panel=document.getElementById("wpanel");
  mq.addEventListener("change",e=>{ if(e.matches) panel.removeAttribute("open"); });
})();
// Read the address first, score, then show the requested figure (figures read
// scores, so they cannot be drawn before the first compute) and map view, then
// normalize the address so a copied link is canonical.
const initial=readURLState();
refresh();
renderFindings();
if(initial.figure && FIGS.has(initial.figure)) FIGS.setView(initial.figure);
setMapView(initial.map || (impliesFit() ? "fit" : "posture"),{openPanel:true});
// A linked profile opens last, once every figure and rank it shows exists.
if(initial.profile) select(initial.profile);
urlReady=true; writeURL();

// --- dataset release ---
// The dataset is CC BY and already in the public repository, so the download
// asks for nothing. Counting is left to the same GoatCounter that measures
// page views, which records that a download happened and nothing about who.
(function(){
  const links=document.getElementById("dp-links");
  const stamp=new Date().toISOString().slice(0,10);

  // One row per state, with the reception record flattened alongside the
  // ratings so the CSV stands on its own.
  const COLUMNS=[
    ["postal",s=>s.a],["state",s=>s.n],
    ["industrial_price_cents_kwh_2024",s=>s.p],
    ["december_ghi_kwh_m2_day",s=>s.sr],["annual_ghi_kwh_m2_day",s=>s.sy],
    ["power_headroom_1_5",s=>s.pw],["incentives_policy_1_5",s=>s.po],
    ["community_permitting_1_5",s=>s.op],["water_1_5",s=>s.w],
    ["natural_hazard_1_5",s=>s.h],["climate_cooling_1_5",s=>s.c],
    ["connectivity_1_5",s=>s.x],["momentum_1_5",s=>s.mo],
    ["state_posture",s=>s.st],["action_tag_2026",s=>s.tag],
    ["pushback",s=>s.rr.pb],["strongest_rule_in_force",s=>strongestRule(s)],
    ["local_moratoriums_in_force",s=>s.localIn],["local_moratoriums_proposed",s=>s.localPending],
    ["rule_water",s=>s.rr.wt],["rule_power_cost",s=>s.rr.pg],
    ["rule_siting_zoning",s=>s.rr.zn],["rule_tax_incentives",s=>s.rr.tx],
    ["rules_in_force_count",s=>ruleCount(s)],
    ["reception_note",s=>s.rr.n],["analyst_note",s=>s.note],
    ["source_urls",s=>(s.srcs||[]).map(x=>x.u).join(" | ")]
  ];
  const cell=v=>{ const t=String(v??""); return /[",\r\n]/.test(t)?'"'+t.replace(/"/g,'""')+'"':t; };
  const byPostal=()=>[...STATES].sort((a,b)=>a.a.localeCompare(b.a));
  const toCSV=()=>[COLUMNS.map(c=>c[0]).join(",")]
    .concat(byPostal().map(s=>COLUMNS.map(c=>cell(c[1](s))).join(",")))
    .join("\n")+"\n";
  // Ship the record as authored, without the fields compute() adds at runtime.
  const AUTHORED=["a","n","p","sr","sy","pw","po","op","w","h","c","x","mo","st","tag","note","rr","srcs"];
  const toJSON=()=>JSON.stringify(byPostal().map(s=>Object.fromEntries(
    AUTHORED.filter(k=>s[k]!==undefined).map(k=>[k,s[k]]))),null,1)+"\n";

  function download(format){
    const csv=format==="csv";
    const blob=new Blob([csv?toCSV():toJSON()],{type:(csv?"text/csv":"application/json")+";charset=utf-8"});
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url; a.download=`us-datacenter-conditions-${stamp}.${format}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  }
  // Blocked, still loading, or the visitor declined it: counting a download
  // must never be the reason one fails.
  function count(format){
    try{
      window.goatcounter?.count?.({path:"dataset-download-"+format,title:"Dataset download ("+format.toUpperCase()+")",event:true});
    }catch(err){}
  }
  links.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
    download(b.dataset.format);
    count(b.dataset.format);
  }));
})();
