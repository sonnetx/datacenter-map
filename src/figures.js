/* ===================== revolving figures ==================================
   One frame, twelve encodings of the same fifty states. Every figure that can
   answer the priority sliders does; the rest are fixed by construction and
   their notes say so. Rotation stops for good the first time a reader touches
   the card, so a figure never changes under someone who is reading it.
   Each figure carries what it hides as well as what it shows, because the
   second list is the one that misleads people.
*/
const FIGS = (function(){
const NS="http://www.w3.org/2000/svg";
// Colors come from the stylesheet at draw time (see readTheme in app.js), so
// every figure follows the light or dark scheme without its own palette.
const P=THEME;
const viewport=document.getElementById("viewport");
const viewbar=document.getElementById("viewbar");
const viewnote=document.getElementById("viewnote");
const rotateBtn=document.getElementById("rotate-btn");
const rotateLabel=document.getElementById("rotate-label");
const legendHatch=document.getElementById("legend-hatch");
const legendRamp=document.getElementById("legend-ramp");
const legendRampNote=document.getElementById("legend-rampnote");
const mapcardEl=document.querySelector(".mapcard");
viewport.insertAdjacentHTML("afterbegin",
  '<svg width="0" height="0" aria-hidden="true" style="position:absolute">'+
  '<defs><pattern id="fighatch" patternUnits="userSpaceOnUse" width="7" height="7" '+
  'patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#B5432A" '+
  'stroke-width="1.6" opacity=".85"/></pattern></defs></svg>');

function E(tag,a,parent){
  const n=document.createElementNS(NS,tag);
  for(const k in a) if(a[k]!==null&&a[k]!==undefined) n.setAttribute(k,a[k]);
  if(parent) parent.appendChild(n);
  return n;
}
function T(parent,x,y,str,a){
  const n=E("text",Object.assign({x,y,"font-size":11,fill:P.muted},a||{}),parent);
  n.textContent=str; return n;
}
function SV(host,w,h){
  const s=E("svg",{viewBox:`0 0 ${w} ${h}`,preserveAspectRatio:"xMidYMid meet",
    "aria-hidden":"true"},host);
  return s;
}
function bindState(node,abbr){
  node.style.cursor="pointer";
  node.addEventListener("mousemove",e=>showTip(abbr,e));
  node.addEventListener("mouseleave",()=>{tip.style.display="none";});
  node.addEventListener("click",()=>select(abbr));
}
const scored=()=>hasWeights();
const fillFor=s=>scored()?fitColor(s.total):P.soft;
const fitOf=s=>scored()?s.total:0;
function byFit(){
  return [...STATES].sort((a,b)=>scored()?compareFit(a,b):a.a.localeCompare(b.a));
}

/* geometry, decoded once: the ring lists the map itself does not keep */
const RINGS={};
TOPO.objects.states.geometries.forEach(g=>{
  const abbr=NAME2ABBR[g.properties.name]; if(!abbr) return;
  const f=topojson.feature(TOPO,g).geometry;
  const rings = f.type==="Polygon" ? f.coordinates : f.coordinates.flat();
  let cy=0,n=0,big=rings[0];
  rings.forEach(r=>{ if(r.length>big.length) big=r; });
  big.forEach(pt=>{cy+=pt[1];n++;});
  // Tiny islands extruded into hairlines read as noise, so the relief walls
  // are built only from rings big enough to be land.
  const solid=rings.filter(r=>{
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    r.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);});
    return (x1-x0)>6||(y1-y0)>6;
  });
  RINGS[abbr]={rings,solid:solid.length?solid:rings,cy:cy/n,abbr};
});

/* one tile per state, arranged to keep rough adjacency, not true position */
const HEX={
  ME:[11,0], AK:[0,1], VT:[10,1], NH:[11,1],
  WA:[1,2],ID:[2,2],MT:[3,2],ND:[4,2],MN:[5,2],WI:[6,2],MI:[8,2],NY:[9,2],MA:[10,2],RI:[11,2],
  OR:[1,3],NV:[2,3],WY:[3,3],SD:[4,3],IA:[5,3],IL:[6,3],IN:[7,3],OH:[8,3],PA:[9,3],NJ:[10,3],CT:[11,3],
  CA:[1,4],UT:[2,4],CO:[3,4],NE:[4,4],MO:[5,4],KY:[6,4],WV:[7,4],VA:[8,4],MD:[9,4],DE:[10,4],
  AZ:[2,5],NM:[3,5],KS:[4,5],AR:[5,5],TN:[6,5],NC:[7,5],SC:[8,5],
  HI:[0,6],OK:[3,6],LA:[4,6],MS:[5,6],AL:[6,6],GA:[7,6],
  TX:[3,7],FL:[8,7]
};

/* ------------------------------------------------------------------ relief */
function drawRelief(host){
  host.innerHTML="";
  const cv=document.createElement("canvas");
  cv.style.cssText="display:block;width:100%";
  host.appendChild(cv);
  const W=Math.max(320,Math.round(host.clientWidth||900));
  const sc=W/975, lift=Math.max(26,W*0.055), H=Math.round(610*sc+lift+8);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.height=H+"px";
  const ctx=cv.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,W,H);
  const order=Object.values(RINGS).sort((a,b)=>a.cy-b.cy);
  order.forEach(g=>{
    const s=BY[g.abbr]; if(!s) return;
    const v=fitOf(s), h=v/100*lift;
    const trace=(dy,rings)=>{
      ctx.beginPath();
      rings.forEach(r=>{
        r.forEach((pt,i)=>{
          const x=pt[0]*sc, y=pt[1]*sc+lift+dy;
          i?ctx.lineTo(x,y):ctx.moveTo(x,y);
        });
        ctx.closePath();
      });
    };
    ctx.fillStyle=P.wall;
    for(let d=h;d>=0;d-=1){ trace(-d,g.solid); ctx.fill(); }
    trace(-h,g.rings);
    ctx.fillStyle=fillFor(s); ctx.fill();
    ctx.strokeStyle=P.panel; ctx.lineWidth=0.8; ctx.stroke();
  });
}

/* --------------------------------------------------------------- cartogram */
function drawCartogram(host){
  host.innerHTML="";
  const R=34, W=Math.sqrt(3)*R, Hs=1.5*R, pad=8;
  const s=SV(host, 12*W+W/2+pad*2, 8*Hs+R*0.7+pad*2);
  STATES.forEach(st=>{
    const pos=HEX[st.a]; if(!pos) return;
    const [c,r]=pos;
    const cx=pad+W/2+c*W+(r%2)*W/2, cy=pad+R+r*Hs;
    let pts="";
    for(let i=0;i<6;i++){
      const a=Math.PI/180*(60*i-90);
      pts+=`${(cx+(R-1.5)*Math.cos(a)).toFixed(1)},${(cy+(R-1.5)*Math.sin(a)).toFixed(1)} `;
    }
    const poly=E("polygon",{points:pts.trim(),fill:fillFor(st),stroke:P.panel,
      "stroke-width":1.6},s);
    bindState(poly,st.a);
    if(st.tag) E("polygon",{points:pts.trim(),fill:"url(#fighatch)",stroke:"none",
      "pointer-events":"none"},s);
    T(s,cx,cy+4,st.a,{"text-anchor":"middle","font-size":13,"font-weight":500,
      fill:"#fff",style:"paint-order:stroke;stroke:rgba(0,0,0,.35);stroke-width:2px;pointer-events:none"});
  });
}

/* ---------------------------------------------------------------- beeswarm */
function drawPrices(host){
  host.innerHTML="";
  const W=900,H=250,m={l:46,r:22,t:20,b:44};
  const s=SV(host,W,H);
  const lo=Math.min(5,priceScale.low), hi=Math.max(35,priceScale.high);
  const x=v=>m.l+(v-lo)/(hi-lo)*(W-m.l-m.r), base=H-m.b;
  const stepTick=(hi-lo)>40?10:5;
  for(let t=Math.ceil(lo/stepTick)*stepTick;t<=hi;t+=stepTick){
    E("line",{x1:x(t),x2:x(t),y1:m.t,y2:base,stroke:P.soft,"stroke-width":1},s);
    T(s,x(t),base+17,t+"¢",{"text-anchor":"middle","font-size":10.5});
  }
  E("line",{x1:m.l,x2:W-m.r,y1:base,y2:base,stroke:P.rule,"stroke-width":1},s);
  T(s,m.l,base+35,"EIA 2024 average industrial price, cents per kilowatt-hour",
    {"font-size":10.5});
  const r=7, placed=[], sorted=[...STATES].sort((a,b)=>a.p-b.p);
  sorted.forEach(st=>{
    const cx=x(st.p);
    let row=0, cy=base-13;
    while(row<14){
      cy=base-13-row*(r*1.7);
      if(!placed.some(q=>Math.abs(q.cy-cy)<r*1.45&&Math.abs(q.cx-cx)<r*2)) break;
      row++;
    }
    placed.push({cx,cy});
    const c=E("circle",{cx,cy,r,fill:fillFor(st),stroke:P.edge,"stroke-width":1},s);
    bindState(c,st.a);
  });
  ["HI","AK","CT","RI","MA","ID","WY","LA","WA","TX"].forEach(a=>{
    const i=sorted.findIndex(z=>z.a===a); if(i<0) return;
    T(s,placed[i].cx,placed[i].cy-r-5,a,{"text-anchor":"middle","font-size":10,fill:P.ink});
  });
}

/* -------------------------------------------------------------- ridgelines */
function drawSpread(host){
  host.innerHTML="";
  const W=900,H=400,m={l:170,r:26,t:16,b:42};
  const s=SV(host,W,H);
  const x=v=>m.l+v/100*(W-m.l-m.r);
  const rowH=(H-m.t-m.b)/FACTORS.length, amp=rowH*2.4, bw=6;
  for(let t=0;t<=100;t+=25){
    E("line",{x1:x(t),x2:x(t),y1:m.t,y2:H-m.b,stroke:P.soft,"stroke-width":1},s);
    T(s,x(t),H-m.b+17,t,{"text-anchor":"middle","font-size":10.5});
  }
  T(s,m.l,H-m.b+34,"normalized score, 0 unfavourable to 100 favourable",{"font-size":10.5});
  const dens=FACTORS.map(f=>{
    const vals=STATES.map(st=>sub(st,f.k)), pts=[];
    let peak=0;
    for(let g=0;g<=100;g++){
      let d=0;
      vals.forEach(v=>{ d+=Math.exp(-0.5*Math.pow((g-v)/bw,2)); });
      d/=(vals.length*bw*Math.sqrt(2*Math.PI));
      pts.push(d); if(d>peak) peak=d;
    }
    return {f,pts,peak};
  });
  const gPeak=Math.max(...dens.map(d=>d.peak));
  for(let i=FACTORS.length-1;i>=0;i--){
    const d=dens[i], base=m.t+rowH*(i+0.92);
    let path=`M${x(0)},${base}`;
    d.pts.forEach((v,g)=>{ path+=`L${x(g).toFixed(1)},${(base-v/gPeak*amp).toFixed(1)}`; });
    path+=`L${x(100)},${base}Z`;
    E("path",{d:path,fill:ramp(i/(FACTORS.length-1)*0.7+0.15),"fill-opacity":.9,
      stroke:P.panel,"stroke-width":1.2,"stroke-linejoin":"round"},s);
    T(s,m.l-12,base-2,d.f.name,{"text-anchor":"end","font-size":11.5,fill:P.ink});
    T(s,m.l-12,base+11,MEASURED.has(d.f.k)?"measured":"analyst rating",
      {"text-anchor":"end","font-size":9.5});
  }
}

/* ------------------------------------------------------------------- roses */
function rose(st,S){
  const R=S*0.44, c=S/2;
  const s=E("svg",{viewBox:`0 0 ${S} ${S}`,"aria-hidden":"true"});
  E("circle",{cx:c,cy:c,r:R,fill:"none",stroke:P.soft,"stroke-width":1},s);
  FACTORS.forEach((f,i)=>{
    const v=sub(st,f.k), rr=Math.max(2,v/100*R);
    const n=FACTORS.length, a0=(i/n)*2*Math.PI-Math.PI/2, a1=((i+1)/n)*2*Math.PI-Math.PI/2-0.04;
    const d=`M${c},${c}L${(c+rr*Math.cos(a0)).toFixed(2)},${(c+rr*Math.sin(a0)).toFixed(2)}`+
      `A${rr.toFixed(2)},${rr.toFixed(2)} 0 0 1 ${(c+rr*Math.cos(a1)).toFixed(2)},${(c+rr*Math.sin(a1)).toFixed(2)}Z`;
    E("path",{d,fill:color(v),stroke:P.edge,"stroke-width":.6},s);
  });
  return s;
}
function drawProfiles(host){
  host.innerHTML="";
  const wrap=document.createElement("div"); wrap.className="rosewrap";
  byFit().forEach(st=>{
    const cell=document.createElement("div"); cell.className="rosecell";
    cell.appendChild(rose(st,64));
    const lab=document.createElement("span");
    lab.textContent=st.a+(scored()?" · "+st.total.toFixed(0):"");
    cell.appendChild(lab);
    bindState(cell,st.a);
    wrap.appendChild(cell);
  });
  host.appendChild(wrap);
}

/* -------------------------------------------------------------- bump chart */
function drawRanks(host){
  host.innerHTML="";
  const cols=[...Object.keys(PRESETS).map(k=>({label:PRESETLABEL[k],W:PRESETS[k]})),
              {label:"Yours",W:activeWeights()}];
  const W=900,H=520,m={l:118,r:112,t:30,b:26};
  const s=SV(host,W,H);
  const colX=i=>m.l+i*((W-m.l-m.r)/(cols.length-1));
  const rowY=r=>m.t+(r-1)*((H-m.t-m.b)/49);
  const maps=cols.map(c=>{
    const tw=totalWeight(c.W);
    const ord=[...STATES].map(st=>({a:st.a,v:tw>0?lensScore(st,c.W):0}))
      .sort((p,q)=>q.v-p.v||p.a.localeCompare(q.a));
    const mp=new Map(); ord.forEach((d,i)=>mp.set(d.a,i+1)); return mp;
  });
  cols.forEach((c,i)=>{
    E("line",{x1:colX(i),x2:colX(i),y1:m.t-8,y2:H-m.b+8,stroke:P.soft,"stroke-width":1},s);
    T(s,colX(i),m.t-14,c.label,{"font-size":10.5,
      "text-anchor":i===0?"start":i===cols.length-1?"end":"middle"});
  });
  const lead=byFit().slice(0,3).map(z=>z.a);
  const LEADC=[P.ink,P.warn,P.focus];
  const labelsL=[], labelsR=[];
  STATES.forEach(st=>{
    const idx=lead.indexOf(st.a);
    const pts=maps.map((mp,i)=>[colX(i),rowY(mp.get(st.a))]);
    let d=`M${pts[0][0]},${pts[0][1]}`;
    for(let i=1;i<pts.length;i++){
      const [x0,y0]=pts[i-1],[x1,y1]=pts[i],mx=(x0+x1)/2;
      d+=`C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    const line=E("path",{d,fill:"none",stroke:idx>=0?LEADC[idx]:P.quiet,
      "stroke-width":idx>=0?2.6:1.1,"stroke-opacity":idx>=0?1:.9,
      "stroke-linecap":"round"},s);
    bindState(line,st.a);
    if(idx>=0){
      pts.forEach(pt=>E("circle",{cx:pt[0],cy:pt[1],r:3.6,fill:LEADC[idx],
        stroke:P.panel,"stroke-width":1.6,"pointer-events":"none"},s));
      labelsL.push({y:pts[0][1],text:st.n,c:LEADC[idx],x:pts[0][0]-9});
      labelsR.push({y:pts[pts.length-1][1],text:"#"+maps[cols.length-1].get(st.a),
        c:LEADC[idx],x:pts[pts.length-1][0]+9});
    }
  });
  // Ranks 1, 2 and 3 sit about nine pixels apart, so their labels would
  // overlap. Push each down until it clears the one above it.
  const place=(list,anchor)=>{
    list.sort((a,b)=>a.y-b.y);
    let prev=-1e9;
    list.forEach(L=>{
      const y=Math.max(L.y,prev+12); prev=y;
      T(s,L.x,y+4,L.text,{"text-anchor":anchor,"font-size":11.5,"font-weight":500,
        fill:L.c,"pointer-events":"none"});
    });
  };
  place(labelsL,"end"); place(labelsR,"start");
  T(s,m.l-9,rowY(1)-11,"rank 1",{"text-anchor":"end","font-size":10});
  T(s,m.l-9,rowY(50)+14,"rank 50",{"text-anchor":"end","font-size":10});
}

/* ---------------------------------------------------------------- alluvial */
function drawFlow(host){
  host.innerHTML="";
  const POSTURE=["Courting","Courting, with conditions","No active state posture",
                 "Reviewing or paused","Restrictive"];
  const CONCERN=["Lower modeled concerns","Elevated modeled concerns","Major modeled concerns"];
  const TIER=["Top third","Middle third","Bottom third"];
  const ord=byFit();
  const tierOf=st=>{ const i=ord.findIndex(z=>z.a===st.a); return i<17?TIER[0]:i<34?TIER[1]:TIER[2]; };
  const stages=[{key:st=>st.st,cats:POSTURE,title:"State posture"},
                {key:st=>deliveryLabel(st),cats:CONCERN,title:"Delivery concern"},
                {key:tierOf,cats:TIER,title:"Fit tercile"}];
  const W=900,H=430,m={t:46,b:20},nodeW=13,gap=12;
  const s=SV(host,W,H);
  const colX=[118,(W-nodeW)/2,W-118-nodeW];
  const nodes=stages.map(stg=>{
    const counts=stg.cats.map(c=>STATES.filter(st=>stg.key(st)===c).length);
    const total=counts.reduce((a,b)=>a+b,0);
    const span=H-m.t-m.b-gap*(stg.cats.length-1);
    let y=m.t; const out={};
    stg.cats.forEach((c,i)=>{
      const h=counts[i]/total*span;
      out[c]={y0:y,h,n:counts[i],inY:y,outY:y};
      y+=h+gap;
    });
    return out;
  });
  for(let si=0;si<2;si++){
    const groups={};
    STATES.forEach(st=>{
      const a=stages[si].key(st), b=stages[si+1].key(st), k=a+" "+b;
      (groups[k]=groups[k]||{a,b,list:[]}).list.push(st);
    });
    Object.keys(groups).sort((k1,k2)=>
      stages[si].cats.indexOf(groups[k1].a)-stages[si].cats.indexOf(groups[k2].a)||
      stages[si+1].cats.indexOf(groups[k1].b)-stages[si+1].cats.indexOf(groups[k2].b)
    ).forEach(k=>{
      const g=groups[k], A=nodes[si][g.a], B=nodes[si+1][g.b];
      if(!A||!B||!A.n||!B.n) return;
      const hA=g.list.length/A.n*A.h, hB=g.list.length/B.n*B.h;
      const y0=A.outY, y1=B.inY; A.outY+=hA; B.inY+=hB;
      const x0=colX[si]+nodeW, x1=colX[si+1], mx=(x0+x1)/2;
      const d=`M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}`+
              `L${x1},${y1+hB}C${mx},${y1+hB} ${mx},${y0+hA} ${x0},${y0+hA}Z`;
      const mean=g.list.reduce((t,z)=>t+fitOf(z),0)/g.list.length;
      const rib=E("path",{d,fill:scored()?fitColor(mean):P.soft,"fill-opacity":.5},s);
      rib.style.cursor="pointer";
      rib.addEventListener("mousemove",e=>{
        rib.setAttribute("fill-opacity",".8");
        tip.innerHTML=`<b>${g.a} → ${g.b}</b><span class="sc" style="font-size:20px">${g.list.length}</span>`+
          `<span class="small">${g.list.map(z=>z.a).join(" ")}</span>`;
        tip.style.display="block";
        const r=mapcardEl.getBoundingClientRect(), bb=tip.getBoundingClientRect();
        let x=e.clientX-r.left+14, y=e.clientY-r.top+14;
        if(x+bb.width>r.width) x=e.clientX-r.left-bb.width-14;
        if(y+bb.height>r.height) y=e.clientY-r.top-bb.height-14;
        tip.style.left=Math.max(4,x)+"px"; tip.style.top=Math.max(4,y)+"px";
      });
      rib.addEventListener("mouseleave",()=>{rib.setAttribute("fill-opacity",".5");tip.style.display="none";});
    });
  }
  stages.forEach((stg,si)=>{
    T(s,colX[si]+(si===2?nodeW:0),m.t-22,stg.title,
      {"font-size":10.5,"text-anchor":si===2?"end":"start"});
    stg.cats.forEach(c=>{
      const N=nodes[si][c]; if(!N||N.h<=0) return;
      E("rect",{x:colX[si],y:N.y0,width:nodeW,height:N.h,rx:1,fill:P.ink},s);
      const right=si!==2;
      const short=c.replace(" modeled concerns","").replace("No active state posture","No posture");
      T(s,right?colX[si]+nodeW+8:colX[si]-8,N.y0+N.h/2+4,`${short} · ${N.n}`,
        {"text-anchor":right?"start":"end","font-size":11,fill:P.ink,
         style:`paint-order:stroke;stroke:${P.panel};stroke-width:3.5px;stroke-linejoin:round`});
    });
  });
}

/* ------------------------------------------------------------- uncertainty */
let hopTimer=null, hopFrame=0, hopRuns=null;
function stopHop(){ if(hopTimer){clearInterval(hopTimer);hopTimer=null;} }
function drawUncertainty(host){
  host.innerHTML=""; stopHop();
  if(!scored()){
    const p=document.createElement("p");
    p.className="viewnote";
    p.textContent="Raise at least one priority to shake the ranking.";
    host.appendChild(p); return;
  }
  const N=400, W=900, rowH=15, m={l:150,r:40,t:34,b:28}, H=m.t+m.b+50*rowH;
  const base=activeWeights();
  let seed=20260908;
  const rnd=()=>{ seed=(seed*1664525+1013904223)%4294967296; return seed/4294967296; };
  const gauss=()=>{ let u=0,v=0; while(!u)u=rnd(); while(!v)v=rnd();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  hopRuns=[];
  const dist=new Map(STATES.map(st=>[st.a,[]]));
  for(let i=0;i<N;i++){
    const W2={}; let any=0;
    FACTORS.forEach(f=>{
      const b=base[f.k]||0;
      W2[f.k]=b>0 ? b*Math.exp(gauss()*0.55) : 0;
      any+=W2[f.k];
    });
    if(any<=0) FACTORS.forEach(f=>{W2[f.k]=1;});
    const ordered=[...STATES].map(st=>({a:st.a,v:lensScore(st,W2)}))
      .sort((p,q)=>q.v-p.v||p.a.localeCompare(q.a));
    const mp=new Map(); ordered.forEach((d,j)=>{mp.set(d.a,j+1); dist.get(d.a).push(j+1);});
    hopRuns.push(mp);
  }
  const rows=STATES.map(st=>{
    const v=[...dist.get(st.a)].sort((a,b)=>a-b);
    return {st,med:v[Math.floor(v.length/2)],lo:v[Math.floor(v.length*.05)],
      hi:v[Math.floor(v.length*.95)],all:dist.get(st.a)};
  }).sort((a,b)=>a.med-b.med||a.st.a.localeCompare(b.st.a));
  const s=SV(host,W,H);
  const x=r=>m.l+(r-1)/49*(W-m.l-m.r);
  for(let r=1;r<=50;r+=7){
    E("line",{x1:x(r),x2:x(r),y1:m.t-6,y2:H-m.b,stroke:P.soft,"stroke-width":1},s);
    T(s,x(r),m.t-13,"#"+r,{"text-anchor":"middle","font-size":10});
  }
  T(s,m.l,H-m.b+17,`rank across ${N} random variations on your priorities`,{"font-size":10.5});
  rows.forEach((d,i)=>{
    const y=m.t+i*rowH+rowH/2;
    E("line",{x1:x(d.lo),x2:x(d.hi),y1:y,y2:y,stroke:P.rule,"stroke-width":1.4},s);
    const counts=new Map();
    d.all.forEach(r=>counts.set(r,(counts.get(r)||0)+1));
    const mx=Math.max(...counts.values());
    counts.forEach((c,r)=>{
      E("rect",{x:x(r)-1.5,y:y-4.5,width:3,height:9,rx:1,fill:P.muted,
        "fill-opacity":.18+.72*(c/mx)},s);
    });
    E("rect",{x:x(d.med)-1.3,y:y-7,width:2.6,height:14,fill:P.ink},s);
    T(s,m.l-10,y+4,d.st.n,{"text-anchor":"end","font-size":11,fill:P.ink});
    const hit=E("rect",{x:0,y:y-rowH/2,width:W,height:rowH,fill:"transparent"},s);
    bindState(hit,d.st.a);
  });
  const live=E("g",{"pointer-events":"none"},s);
  const step=()=>{
    while(live.firstChild) live.removeChild(live.firstChild);
    const mp=hopRuns[hopFrame%hopRuns.length];
    rows.forEach((d,i)=>{
      E("circle",{cx:x(mp.get(d.st.a)),cy:m.t+i*rowH+rowH/2,r:4,fill:P.warn,
        stroke:P.panel,"stroke-width":1.4},live);
    });
    hopFrame++;
  };
  step();
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches) hopTimer=setInterval(step,900);
}

/* ----------------------------------------------------------------- isotype */
function drawCount(host){
  host.innerHTML="";
  const POSTURE=["Courting","Courting, with conditions","Reviewing or paused",
                 "Restrictive","No active state posture"];
  const W=900,uw=27,uh=34,cg=7,rg=22,per=13,m={l:210,t:10};
  const groups=POSTURE.map(p=>({p,list:STATES.filter(st=>st.st===p)}));
  const rowsOf=g=>Math.max(1,Math.ceil(g.list.length/per));
  let H=m.t; groups.forEach(g=>{H+=rowsOf(g)*(uh+rg)+16;});
  const s=SV(host,W,H+6);
  let y=m.t;
  groups.forEach(g=>{
    T(s,m.l-16,y+14,g.p,{"text-anchor":"end","font-size":11,fill:P.ink});
    T(s,m.l-16,y+29,g.list.length+" states",{"text-anchor":"end","font-size":10.5});
    g.list.forEach((st,i)=>{
      const cx=m.l+(i%per)*(uw+cg), cy=y+Math.floor(i/per)*(uh+rg);
      const gg=E("g",{},s);
      E("rect",{x:cx,y:cy,width:uw,height:uh,rx:2,fill:fillFor(st),
        stroke:P.rule,"stroke-width":1},gg);
      for(let k=0;k<3;k++)
        E("rect",{x:cx+4,y:cy+6+k*9,width:uw-8,height:3.5,rx:1,fill:P.panel,
          "fill-opacity":.75},gg);
      if(st.tag) E("rect",{x:cx,y:cy,width:uw,height:uh,rx:2,fill:"url(#fighatch)"},gg);
      T(s,cx+uw/2,cy+uh+11,st.a,{"text-anchor":"middle","font-size":9.5});
      bindState(gg,st.a);
    });
    y+=rowsOf(g)*(uh+rg)+16;
  });
}

/* ------------------------------------------------------------------ glyphs */
function glyph(st,S){
  const c=S/2, maxR=S*0.40;
  const s=E("svg",{viewBox:`0 0 ${S} ${S}`,"aria-hidden":"true"});
  const stemH=fitOf(st)/100*(S*0.28);
  E("line",{x1:c,y1:S-3,x2:c,y2:S-3-stemH,stroke:P.ink,"stroke-width":1.8,
    "stroke-linecap":"round"},s);
  E("line",{x1:c-S*0.06,y1:S-3,x2:c+S*0.06,y2:S-3,stroke:P.ink,"stroke-width":1.8,
    "stroke-linecap":"round"},s);
  const pr=2.5+(1-Math.max(0,Math.min(1,(priceScale.high-st.p)/(priceScale.high-priceScale.low))))*8;
  E("circle",{cx:c,cy:c,r:pr,fill:"#C4B56C",stroke:"#958F78","stroke-width":1.2},s);
  FACTORS.forEach((f,i)=>{
    const v=sub(st,f.k), a=(i/FACTORS.length)*2*Math.PI-Math.PI/2;
    const r0=pr+2, r1=r0+v/100*(maxR-r0);
    E("line",{x1:c+r0*Math.cos(a),y1:c+r0*Math.sin(a),x2:c+r1*Math.cos(a),
      y2:c+r1*Math.sin(a),stroke:P.muted,"stroke-width":2.4,
      "stroke-linecap":"round"},s);
  });
  for(let k=0;k<(st.mo||0);k++){
    const a=-Math.PI/2+(k-((st.mo-1)/2))*0.2;
    E("line",{x1:c+(maxR+3)*Math.cos(a),y1:c+(maxR+3)*Math.sin(a),
      x2:c+(maxR+7)*Math.cos(a),y2:c+(maxR+7)*Math.sin(a),
      stroke:P.muted,"stroke-width":1.4,"stroke-linecap":"round"},s);
  }
  if(st.tag) E("path",{d:`M${c},${S-3-stemH}L${c+9},${S-3-stemH+3.5}L${c},${S-3-stemH+7}Z`,
    fill:P.warn},s);
  return s;
}
function drawGlyphs(host){
  host.innerHTML="";
  const wrap=document.createElement("div"); wrap.className="glyphwrap";
  byFit().forEach(st=>{
    const cell=document.createElement("div"); cell.className="rosecell";
    cell.appendChild(glyph(st,84));
    const lab=document.createElement("span"); lab.textContent=st.a;
    cell.appendChild(lab);
    bindState(cell,st.a);
    wrap.appendChild(cell);
  });
  host.appendChild(wrap);
}

/* ------------------------------------------------------------ Minard band */
function drawScreens(host){
  host.innerHTML="";
  const GATES=[
    {label:"All fifty states",test:()=>true},
    {label:"Power at 9¢ or less",test:st=>st.p<=9},
    {label:"Headroom 4 or better",test:st=>st.pw>=4},
    {label:"Permitting 3 or better",test:st=>st.op>=3},
    {label:"Water 3 or better",test:st=>st.w>=3},
    {label:"Hazard 3 or better",test:st=>st.h>=3}
  ];
  let liveSet=[...STATES]; const stages=[];
  GATES.forEach((g,i)=>{
    const kept=liveSet.filter(g.test), dropped=liveSet.filter(st=>!g.test(st));
    const sortedP=[...kept].sort((a,b)=>a.p-b.p);
    stages.push({g,kept,dropped:i===0?[]:dropped,
      med:kept.length?sortedP[Math.floor(kept.length/2)].p:null});
    liveSet=kept;
  });
  const W=900,m={l:30,r:30,t:56},bandH=168,stripH=92,H=m.t+bandH+92+stripH+44;
  const s=SV(host,W,H);
  const n=stages.length, colW=(W-m.l-m.r)/(n-1), x=i=>m.l+i*colW;
  const mid=m.t+bandH/2, half=i=>stages[i].kept.length/50*(bandH/2);
  let top=`M${x(0)},${mid-half(0)}`, bot="";
  for(let i=1;i<n;i++){ const mx=(x(i-1)+x(i))/2;
    top+=`C${mx},${mid-half(i-1)} ${mx},${mid-half(i)} ${x(i)},${mid-half(i)}`; }
  for(let i=n-1;i>0;i--){ const mx=(x(i)+x(i-1))/2;
    bot+=`C${mx},${mid+half(i)} ${mx},${mid+half(i-1)} ${x(i-1)},${mid+half(i-1)}`; }
  E("path",{d:top+`L${x(n-1)},${mid+half(n-1)}`+bot+"Z",fill:"#C4B56C",
    stroke:"#958F78","stroke-width":1.1},s);
  stages.forEach((st,i)=>{
    E("line",{x1:x(i),x2:x(i),y1:m.t-38,y2:m.t+bandH+50,stroke:P.soft,
      "stroke-width":1,"stroke-dasharray":"2 3"},s);
    const anchor=i===0?"start":i===n-1?"end":"middle";
    const words=st.g.label.split(" ");
    let line="", lines=[];
    words.forEach(w=>{ if((line+" "+w).trim().length>15){lines.push(line.trim());line=w;} else line+=" "+w; });
    lines.push(line.trim());
    lines.forEach((ln,li)=>T(s,x(i),m.t-40+li*13,ln,{"text-anchor":anchor,"font-size":10.5}));
    T(s,x(i)+(i===0?8:i===n-1?-8:0),mid+6,st.kept.length,
      {"text-anchor":"middle","font-size":19,"font-weight":600,fill:P.ink});
    if(st.dropped.length){
      const shown=st.dropped.slice(0,12);
      shown.forEach((d,k)=>{
        const t2=T(s,x(i)-24+Math.floor(k/6)*28,m.t+bandH+16+(k%6)*12.5,d.a,
          {"font-size":10,"text-anchor":"start"});
        bindState(t2,d.a);
      });
      if(st.dropped.length>shown.length)
        T(s,x(i)-24,m.t+bandH+16+6*12.5,"+"+(st.dropped.length-shown.length)+" more",{"font-size":10});
      T(s,x(i),m.t+bandH+8,"−"+st.dropped.length,
        {"text-anchor":"middle","font-size":11.5,"font-weight":600,fill:P.warn});
    }
  });
  const sy=m.t+bandH+92+stripH, prices=stages.map(d=>d.med).filter(v=>v!==null);
  if(prices.length){
    const plo=Math.min(...prices)-0.5, phi=Math.max(...prices)+0.5;
    const py=v=>sy-((v-plo)/(phi-plo||1))*(stripH-26);
    E("line",{x1:m.l,x2:W-m.r,y1:sy,y2:sy,stroke:P.rule,"stroke-width":1},s);
    T(s,m.l,sy+18,"median industrial price among the survivors, ¢/kWh",{"font-size":10.5});
    let pd="";
    stages.forEach((st,i)=>{ if(st.med===null) return;
      pd+=(pd?"L":"M")+x(i)+","+py(st.med).toFixed(1); });
    E("path",{d:pd,fill:"none",stroke:P.ink,"stroke-width":1.5},s);
    stages.forEach((st,i)=>{ if(st.med===null) return;
      E("line",{x1:x(i),x2:x(i),y1:py(st.med),y2:sy,stroke:P.soft,"stroke-width":1},s);
      E("circle",{cx:x(i),cy:py(st.med),r:3.2,fill:P.ink,stroke:P.panel,"stroke-width":1.3},s);
      T(s,x(i),py(st.med)-9,st.med.toFixed(2)+"¢",
        {"text-anchor":"middle","font-size":10.5,"font-weight":600,fill:P.ink});
    });
  }
  T(s,W-m.r,H-8,liveSet.length?"clearing all six: "+liveSet.map(z=>z.a).join(" "):"no survivors",
    {"text-anchor":"end","font-size":11,"font-weight":600,fill:P.sand});
}

/* ------------------------------------------------------------------ registry */
const VIEWS=[
  {id:"map",label:"Map",tall:false,
   note:"<b>Choropleth.</b> Weighted fit shaded onto the states themselves. <span class='hides'>Hides that area is not importance: large states occupy more space, while small states can be difficult to select. Use Find a state to open any profile.</span>"},
  {id:"relief",label:"Relief",draw:drawRelief,
   note:"<b>Prism map, after Tufte.</b> The same fit as height, which the eye reads without a legend. <span class='hides'>Hides whatever stands behind Texas. Occlusion here is lost data, not a rendering artifact.</span>"},
  {id:"cartogram",label:"Cartogram",draw:drawCartogram,
   note:"<b>Hex tiles.</b> One tile per state, so Rhode Island argues at the same volume as Wyoming. <span class='hides'>Hides distance, adjacency and the grid: two touching tiles may sit in different interconnection queues.</span>"},
  {id:"prices",label:"Prices",draw:drawPrices,wide:true,
   note:"<b>Beeswarm.</b> Every state as one dot on the measured price axis. Thirty-odd states clot between 6 and 10 cents, then a long thin tail. <span class='hides'>Hides that these are historical statewide averages, not a tariff anyone would sign.</span>"},
  {id:"spread",label:"Spread",draw:drawSpread,wide:true,
   note:"<b>Ridgelines.</b> All nine factor distributions on one axis. <span class='hides'>Hides nothing, and that is why it is here: seven curves are five spikes wearing a smooth coat, because seven of the nine factors are 1-to-5 analyst ratings.</span>"},
  {id:"profiles",label:"Profiles",draw:drawProfiles,tall:true,
   note:"<b>Fifty coxcombs, after Nightingale.</b> Clockwise from twelve: headroom, cost, incentives, permitting, water, hazard, climate, connectivity, winter sun. A state with one collapsed petal is a different object from a merely mediocre state. <span class='hides'>Hides which petal is which until you have learned the order, and wedge area grows as the square of a radius the eye reads as linear.</span>"},
  {id:"ranks",label:"Ranks",draw:drawRanks,tall:true,wide:true,
   note:"<b>Bump chart.</b> Every state's rank across the five presets and your own weights. Flat lines do not depend on what you value; plunging lines are winning on one weighting choice. <span class='hides'>Hides the size of the gaps: a line can fall six places on two points of fit.</span>"},
  {id:"flow",label:"Flow",draw:drawFlow,wide:true,
   note:"<b>Alluvial, after Sankey.</b> Fifty states from posture through delivery concern to fit tercile. Posture and deliverability are close to independent. <span class='hides'>Hides identity: fifty states enter and fifty anonymous units leave.</span>"},
  {id:"uncertainty",label:"Uncertainty",draw:drawUncertainty,tall:true,wide:true,
   note:"<b>Hypothetical outcome plot.</b> Four hundred random variations on your priorities. The moving dot is one draw; the strips are the whole distribution. Stable ranks indicate less sensitivity to these weight variations, not greater certainty about the underlying evidence. <span class='hides'>Hides that the ratings themselves are uncertain, which is the larger of the two problems and is not modeled at all.</span>"},
  {id:"count",label:"Count",draw:drawCount,tall:true,wide:true,
   note:"<b>Isotype, after Neurath.</b> One mark per state, grouped by posture; hatched marks carry a 2026 statewide action. <span class='hides'>Hides magnitude of every kind: a state with four campuses and a state with none are one mark each.</span>"},
  {id:"glyphs",label:"Glyphs",draw:drawGlyphs,tall:true,
   note:"<b>Bespoke grammar, after Dear Data.</b> Stem height is fit, the disc grows with the price of power, nine hairs are the nine factors, rim dashes count momentum, a pennant marks a 2026 action. <span class='hides'>Hides comparability. Nothing here supports reading one state precisely against another.</span>"},
  {id:"screens",label:"Screens",draw:drawScreens,wide:true,
   note:"<b>Attrition band, after Minard.</b> A shortlist losing width as six thresholds are applied, with the states labeled where they drop and the survivors' median price running beneath. <span class='hides'>Hides the order of operations, which does more work than any single threshold. This is also not the Minard we want: the data has no flows, no transmission geography and no time axis, so the band keeps the geometry and admits the gap.</span>"}
];
const PRESETLABEL={balanced:"Balanced",ai:"Build sooner",cost:"Lower costs",
  safe:"Lower risk",colo:"Connectivity first"};

let active="map", rotating=false, rotTimer=null, stopped=false;
const panes={};
function paneFor(v){
  if(panes[v.id]) return panes[v.id];
  let d=viewport.querySelector(`[data-v="${v.id}"]`);
  if(!d){ d=document.createElement("div"); d.dataset.v=v.id; d.hidden=true; viewport.appendChild(d); }
  d.className="viewpane"+(v.tall?" tall":"")+(v.wide?" wide":"");
  panes[v.id]=d; return d;
}
VIEWS.forEach(v=>{
  paneFor(v);
  const b=document.createElement("button");
  b.type="button"; b.textContent=v.label; b.dataset.v=v.id;
  b.setAttribute("aria-pressed",String(v.id===active));
  b.addEventListener("click",()=>{ setView(v.id); scheduleURL(); });
  viewbar.appendChild(b);
});
function currentView(){ return VIEWS.find(v=>v.id===active)||VIEWS[0]; }
function drawActive(){
  const v=currentView();
  if(v.draw) v.draw(paneFor(v));
  if(v.id!=="uncertainty") stopHop();
}
function setView(id){
  if(!VIEWS.some(v=>v.id===id)) return;
  if(id!==active) stopHop();
  active=id;
  VIEWS.forEach(v=>{
    const p=paneFor(v);
    p.hidden = v.id!==id;
    if(v.id!==id && v.draw) p.innerHTML="";
  });
  viewbar.querySelectorAll("button").forEach(b=>
    b.setAttribute("aria-pressed",String(b.dataset.v===id)));
  viewnote.innerHTML=currentView().note;
  legendHatch.hidden = !["map","cartogram","count"].includes(id);
  // the local moratorium dots exist only on the map
  document.getElementById("legend-dots").hidden = id!=="map";
  const showsFit=["map","relief","cartogram","prices","profiles","flow","count"].includes(id);
  legendRamp.hidden=!showsFit; legendRampNote.hidden=!showsFit;
  tip.style.display="none";
  drawActive();
}

/* --- rotation ---------------------------------------------------------
   Auto-advance is opt-in on a reduced-motion setting and stops permanently
   on the first real interaction with the page, since a figure that changes
   under a reader mid-comparison is worse than one that never moved. */
function setRotating(on){
  rotating=on && !stopped;
  rotateBtn.setAttribute("aria-pressed",String(rotating));
  rotateLabel.textContent = rotating ? "Pause figures" : "Play figures";
  if(rotTimer){ clearInterval(rotTimer); rotTimer=null; }
  if(rotating) rotTimer=setInterval(()=>{
    if(document.hidden) return;
    const i=VIEWS.findIndex(v=>v.id===active);
    setView(VIEWS[(i+1)%VIEWS.length].id);
  },8000);
}
rotateBtn.addEventListener("click",()=>{ stopped=false; setRotating(!rotating); });
["pointerdown","keydown","wheel"].forEach(ev=>{
  document.addEventListener(ev,e=>{
    if(rotateBtn.contains(e.target)) return;
    if(!rotating) return;
    stopped=true; setRotating(false);
  },{passive:true});
});

let drawPending=null;
function requestDraw(){
  if(drawPending) clearTimeout(drawPending);
  const delay = active==="uncertainty" ? 280 : 90;
  drawPending=setTimeout(()=>{ drawPending=null; drawActive(); },delay);
}

setView("map");
// Keep the comparison stable until the reader explicitly plays the figures.
let resizeTimer=null;
window.addEventListener("resize",()=>{
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{ if(currentView().id==="relief") drawActive(); },200);
});
return {draw:requestDraw,setView,active:()=>active,has:id=>VIEWS.some(v=>v.id===id)};
})();
