// Scoring model. Pure functions over STATES and the scenario state (size,
// weights, view, rankMode, priceScale); no DOM. tests/model.test.cjs loads this
// file directly, so keep it free of browser globals.
const FACTORS = [
  {k:"pw", name:"Power headroom", sub:"queue length, utility receptivity, 2026 pauses"},
  {k:"p",  name:"Power cost", sub:"EIA 2024 industrial ¢/kWh"},
  {k:"po", name:"Incentives and policy", sub:"exemption status, statewide actions"},
  {k:"op", name:"Community and permitting", sub:"local moratoriums, site rejections"},
  {k:"w",  name:"Water", sub:"basin stress, drought, scarcity rules"},
  {k:"h",  name:"Natural hazard", sub:"hurricane, tornado, seismic, wildfire"},
  {k:"c",  name:"Climate for cooling", sub:"cooling degree days, humidity"},
  {k:"x",  name:"Connectivity and ecosystem", sub:"fiber, existing market, labor"},
  {k:"sr", name:"Winter solar resource", sub:"December mean irradiance, NASA POWER 2001-2020"}
];
// Versioned, explicit assumptions. No inferred delivery dates or probability scores.
// Version 3 adds the measured winter solar factor. Every grid-connected preset
// and band weights it at zero, so version 2 output is unchanged unless a
// reader raises it or chooses the off-grid band.
const MODEL_VERSION = "3";
// The two measured factors. Their anchors are preferences on a measured scale;
// the other seven factors are 1-to-5 analyst ratings.
const MEASURED = new Set(["p","sr"]);
const SOLAR_SCALE = {low:1.0, high:4.0}; // December kWh per square metre per day; 0 and 100 points
const LENSES = {
  politics: {pw:0,p:0,po:50,op:50,w:0,h:0,c:0,x:0,sr:0},
  physical: {pw:30,p:25,po:0,op:0,w:20,h:15,c:10,x:0,sr:0}
};
const PRESETS = {
  balanced: {pw:10,p:10,po:10,op:10,w:10,h:10,c:10,x:10,sr:0},
  ai:   {pw:30,p:20,po:10,op:15,w:10,h:5,c:5,x:5,sr:0},
  cost: {pw:15,p:35,po:15,op:5,w:5,h:5,c:15,x:5,sr:0},
  safe: {pw:15,p:10,po:15,op:15,w:15,h:20,c:5,x:5,sr:0},
  colo: {pw:15,p:15,po:10,op:10,w:5,h:10,c:5,x:30,sr:0}
};
// Project size. Each band loads a starting weight profile and sets the
// headroom and permitting ratings a project of that scale needs before its
// delivery concerns read as lower. Hyperscale reproduces the version 2 rule
// exactly (1 major, 2 elevated, 3 to 5 lower), so it is the default. The
// off-grid band buys no grid power and joins no queue, so price and headroom
// carry nothing and only permitting can raise a delivery concern.
const SIZES = {
  micro: {label:"Edge or micro", noun:"an edge or micro site", mw:"under 5 MW", floors:{pw:2,op:2}, weights:{pw:5,p:15,po:5,op:10,w:0,h:15,c:10,x:40,sr:0}},
  colo:  {label:"Enterprise or colocation", noun:"an enterprise or colocation project", mw:"5 to 50 MW", floors:{pw:3,op:2}, weights:{pw:15,p:15,po:10,op:10,w:5,h:10,c:5,x:30,sr:0}},
  hyper: {label:"Hyperscale", noun:"a hyperscale project", mw:"50 to 300 MW", floors:{pw:3,op:3}, weights:{pw:25,p:20,po:15,op:15,w:10,h:5,c:5,x:5,sr:0}},
  gw:    {label:"Gigawatt campus", noun:"a gigawatt campus", mw:"300 MW and up", floors:{pw:4,op:3}, weights:{pw:35,p:25,po:10,op:20,w:5,h:5,c:0,x:0,sr:0}},
  solar: {label:"Off-grid solar and battery", noun:"an off-grid solar and battery unit", mw:"self-powered, any size", floors:{pw:1,op:3}, weights:{pw:0,p:0,po:5,op:20,w:0,h:15,c:15,x:10,sr:35}}
};
// Workload variants for the off-grid band: only the connectivity weight moves.
const WORKLOADS = {
  batch: {label:"Batch inference", x:10},
  realtime: {label:"Real-time serving", x:25},
  training: {label:"Distributed training", x:40}
};
let size = "hyper";
let weights = {...PRESETS.balanced};
let view = "all", rankMode = "fit";
let priceScale = {low:5,high:35};
let selected = null, profilePanel = "overview";
let sortKey = "rank", sortAsc = true;
const shortlist = new Set();

const NAME2ABBR = {}; STATES.forEach(s=>NAME2ABBR[s.n]=s.a);
const BY = {}; STATES.forEach(s=>BY[s.a]=s);

function sub(s,k){
  if(k==="p"){ return Math.max(0,Math.min(1,(priceScale.high-s.p)/(priceScale.high-priceScale.low)))*100; }
  if(k==="sr"){ return Math.max(0,Math.min(1,(s.sr-SOLAR_SCALE.low)/(SOLAR_SCALE.high-SOLAR_SCALE.low)))*100; }
  return (s[k]-1)/4*100;
}
function totalWeight(W){ return Object.values(W).reduce((a,b)=>a+b,0); }
// an unweighted factor contributes nothing even if its value is missing
function lensScore(s,W){ const tw=totalWeight(W); if(tw<=0) return null; let t=0; FACTORS.forEach(f=>{const w=W[f.k]||0; if(w>0) t+=w*sub(s,f.k);}); return t/tw; }
// share of the composite that a factor actually contributes, in points
function contribution(s,k){ const W=activeWeights(), tw=totalWeight(W), w=W[k]||0; if(tw<=0||w<=0) return 0; return w*sub(s,k)/tw; }
function hasWeights(){ return totalWeight(activeWeights())>0; }
// A rating at or above the size's floor is lower concern, one level under it
// is elevated, two or more under is major. The worse of the two factors wins.
function factorTier(rating,floor){ return rating>=floor ? 0 : rating===floor-1 ? 1 : 2; }
function deliveryTier(s){ const f=SIZES[size].floors; return Math.max(factorTier(s.pw,f.pw),factorTier(s.op,f.op)); }
function deliveryLabel(s){ return ["Lower modeled concerns","Elevated modeled concerns","Major modeled concerns"][deliveryTier(s)]; }
function sizeLabel(){ return SIZES[size].label; }
function deliveryContext(){ return `for ${SIZES[size].noun} (${SIZES[size].mw})`; }
function compareFit(a,b){
  if(rankMode==="delivery" && deliveryTier(a)!==deliveryTier(b)) return deliveryTier(a)-deliveryTier(b);
  const delta=b.total-a.total;
  return Math.abs(delta)<1e-9 ? 0 : delta;
}
function rankOf(candidate){ return 1+STATES.filter(other=>other.a!==candidate.a && compareFit(other,candidate)<0).length; }
function compute(){
  STATES.forEach(s=>{
    s.total = lensScore(s,activeWeights());
    s.pol = lensScore(s,LENSES.politics);
    s.phy = lensScore(s,LENSES.physical);
    s.tied=false;
  });
  if(!hasWeights()){ STATES.forEach(s=>{s.rank=null;s.rankMin=null;s.rankMax=null;}); return; }
  STATES.forEach(s=>{s.rank=rankOf(s);});
  STATES.forEach(s=>{
    s.tied=STATES.some(other=>other.a!==s.a && other.rank===s.rank);
    // One rating in this state changes at a time; every other state is held fixed.
    const ranks=[s.rank];
    FACTORS.filter(f=>!MEASURED.has(f.k) && ((activeWeights()[f.k]||0)>0 || (rankMode==="delivery" && ["pw","op"].includes(f.k)))).forEach(f=>{
      [-1,1].forEach(delta=>{
        const value=s[f.k]+delta;
        if(value<1||value>5) return;
        const trial={...s,[f.k]:value};
        trial.total=lensScore(trial,activeWeights());
        ranks.push(rankOf(trial));
      });
    });
    s.rankMin=Math.min(...ranks);s.rankMax=Math.max(...ranks);
  });
}

// cividis-like ramp
const STOPS=[[0,32,76],[49,68,107],[102,105,112],[149,143,120],[196,181,108],[255,234,70]];
function color(v){ // v 0..100
  const lo=0, hi=100; // fixed full scale for every scenario
  let t=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));
  const seg=t*(STOPS.length-1), i=Math.min(STOPS.length-2,Math.floor(seg)), f=seg-i;
  const a=STOPS[i], b=STOPS[i+1];
  const c=a.map((x,j)=>Math.round(x+(b[j]-x)*f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// The weights in force: the reader's own sliders in the Combined view, or a
// fixed reference profile in one of the two lens views.
function activeWeights(){ return view==="all" ? weights : LENSES[view]; }
function viewLabel(){ return view==="all" ? "Combined" : view==="politics" ? "Political outlook" : "Physical fundamentals"; }
function rankModeLabel(){ return rankMode==="delivery" ? "Delivery first" : "Weighted fit"; }
