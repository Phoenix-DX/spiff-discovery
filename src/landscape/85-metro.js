<script>
/* =====================================================================
   Landscape — the Metro picture
   Same facts, same routes, same detail panel and Live data as the boxes
   picture; drawn as a metro map. A route is a line, a box is a station,
   Identity and the floor are the interchanges every line meets. Gates are
   the stations on the main line. Withheld is a branch. Context is a loop.
   Built beside the boxes picture; Thato evaluated the two side by side
   on 14 Sep 2026 and decided to keep both, with the Metro | Boxes switch.
   ===================================================================== */

/* stations: where each stands on a 1440 × 880 canvas, and how its label sits */
const MS = {
  ask:      {x:200,  y:460, t:"You ask",           lb:"below", k:"pill-s"},
  identity: {x:280,  y:460, t:"Identity",          sub:"runs as you", lb:"upleft", dy:-14, k:"xchg"},
  "gate-understand":{x:460, y:460, t:"Understand", lb:"upright", k:"gate"},
  "gate-fetch":     {x:620, y:460, t:"Fetch",      lb:"upright", dx:6, k:"gate"},
  "gate-rules":     {x:780, y:460, t:"Apply rules",lb:"upright", k:"gate"},
  "gate-compose":   {x:940, y:460, t:"Compose",    lb:"upright", k:"gate"},
  "gate-deliver":   {x:1100,y:460, t:"Deliver",    lb:"upright", k:"gate"},
  "dest-people":    {x:1300,y:460, t:"People",     lb:"below", k:"stn"},
  "dest-comms":     {x:1300,y:380, t:"Comms & files", lb:"above", k:"stn"},
  "dest-clients":   {x:1300,y:220, t:"External AI clients", lb:"above", k:"stn"},
  context:  {x:540,  y:400, t:"Context",           sub:"working memory", lb:"above", dy:-8, k:"stn"},
  provider: {x:1060, y:280, t:"Provider",          lb:"above", dy:-4, k:"stn"},
  catalogue:{x:460,  y:540, t:"Catalogue",         lb:"right", k:"stn"},
  withheld: {x:780,  y:700, t:"Withheld",          lb:"right", k:"stn-crit"},
  keep:     {x:1100, y:560, t:"Keep & run",        lb:"right", k:"stn"},
  templates:{x:900,  y:540, t:"Templates",         lb:"below", k:"stn"},
  "sys-directory":{x:120, y:80,  t:"Directory",    lb:"right", k:"sys"},
  "sys-connect":  {x:120, y:140, t:"Connect",      lb:"right", k:"sys"},
  "sys-assemble": {x:120, y:200, t:"Assemble",     lb:"right", k:"sys"},
  "sys-orbit":    {x:120, y:260, t:"Orbit",        lb:"right", k:"sys"},
  "sys-none":     {x:120, y:680, t:"No finance system", sub:"declared absence", lb:"right", k:"ghost"},
  inbox:    {x:1300, y:640, t:"Inbox",             lb:"above", k:"tray"},
  log:      {x:780,  y:820, t:"Activity log — the floor", lb:"floor", k:"floor"}
};
const MS_FLOOR = {x0:100, x1:1340, y:820};
const M_WITHHELD = function(){ return [mp("gate-rules"), mp("withheld"), mp("log")]; };
const M_OUTSIDE = function(){ return [mp("dest-clients"), [400,220], [280,340], mp("identity",0,-20)]; };
function plen(pts){ let n=0; for(let i=1;i<pts.length;i++) n += Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]); return n; }

/* a metro path: straight runs with rounded corners */
function mpath(pts, r){
  r = r || 22;
  let d = "M"+pts[0][0]+","+pts[0][1];
  for(let i=1; i<pts.length-1; i++){
    const p=pts[i-1], c=pts[i], n=pts[i+1];
    const d1=Math.hypot(c[0]-p[0], c[1]-p[1]), d2=Math.hypot(n[0]-c[0], n[1]-c[1]);
    const r1=Math.min(r, d1/2), r2=Math.min(r, d2/2);
    const a=[c[0]-(c[0]-p[0])/d1*r1, c[1]-(c[1]-p[1])/d1*r1], b=[c[0]+(n[0]-c[0])/d2*r2, c[1]+(n[1]-c[1])/d2*r2];
    d += " L"+a[0]+","+a[1]+" Q"+c[0]+","+c[1]+" "+b[0]+","+b[1];
  }
  const l = pts[pts.length-1]; d += " L"+l[0]+","+l[1];
  return d;
}
function mp(id, dx, dy){ const s = MS[id]; return [s.x+(dx||0), s.y+(dy||0)]; }

/* the lines: same ids, names, colours and sentences as the boxes picture; only the geometry differs */
function lsMetroRoutes(f){
  const base = {}; lsRoutes(LS_GEO, f).forEach(function(r){ base[String(r.id)] = r; });
  const L = function(id, o){ return Object.assign({}, base[id], o, {id: base[id] ? base[id].id : id}); };
  const R = [];
  /* 2 · the main line */
  R.push(L("2", {paths:[mpath([mp("ask"), mp("dest-people")])], badge:{x:240, y:444},
    touches:["ask","identity","gate-understand","gate-fetch","gate-rules","gate-compose","gate-deliver","dest-people"]}));
  /* 4 · on a clock: Keep → round the bottom → Identity → the parallel track → Comms */
  R.push(L("4", {paths:[mpath([mp("keep",12,0), [1112,760], [280,760], mp("identity",0,14), [1100,474], [1206,474], mp("dest-comms")])],
    badge:{x:700, y:776}, touches:["keep","identity","gate-understand","gate-fetch","gate-rules","gate-compose","gate-deliver","dest-comms"]}));
  /* 2b · connectors: Fetch down the systems column */
  R.push(L("2b", {paths:[mpath([mp("gate-fetch",12,0), [632,330], [120,330], mp("sys-directory")])], badge:{x:652, y:380},
    touches:["gate-fetch","sys-directory","sys-connect","sys-assemble","sys-orbit"]}));
  /* 1 · source reads: the systems, on the parallel track, to the Catalogue */
  R.push(L("1", {paths:[mpath([mp("sys-directory",-12,0), mp("sys-orbit",-12,0), [108,540], mp("catalogue")])], badge:{x:92, y:470},
    touches:["sys-directory","sys-connect","sys-assemble","sys-orbit","catalogue"]}));
  /* 2c · looking it up: Understand ↔ Catalogue */
  R.push(L("2c", {paths:[mpath([mp("gate-understand"), mp("catalogue")])], badge:{x:442, y:500}, touches:["gate-understand","catalogue"]}));
  /* 2d · context: the loop above Understand and Fetch */
  R.push(L("2d", {paths:[mpath([mp("gate-understand"), [460,400], [620,400], mp("gate-fetch")])], badge:{x:600, y:384}, touches:["gate-understand","gate-fetch","context"]}));
  /* 2e · withheld: the branch at Apply rules, down to the floor */
  R.push(L("2e", {paths:[mpath(M_WITHHELD())], badge:{x:798, y:770}, touches:["gate-rules","withheld","log"]}));
  /* 2f · laying it out: Compose → Templates */
  R.push(L("2f", {paths:[mpath([mp("gate-compose"), [940,500], mp("templates")])], badge:{x:958, y:520}, touches:["gate-compose","templates"]}));
  /* 3 · save and share: Deliver → Keep */
  R.push(L("3", {paths:[mpath([mp("gate-deliver"), mp("keep")])], badge:{x:1118, y:510}, touches:["gate-deliver","keep"]}));
  /* 5 · from outside in: Clients → Identity */
  R.push(L("5", {paths:[mpath(M_OUTSIDE())], badge:{x:840, y:204}, touches:["dest-clients","identity"]}));
  /* 6 · a decision: four spurs onto one trunk, to the Inbox */
  R.push(L("6", {paths:[
      mpath([mp("identity",-12,20), [268,640], mp("inbox")]),
      mpath([mp("catalogue"), [460,640], mp("inbox")]),
      mpath([mp("provider"), [1060,640], mp("inbox")]),
      mpath([mp("keep"), [1100,640], mp("inbox")])
    ], badge:{x:1200, y:624}, touches:["identity","catalogue","provider","keep","inbox"]}));
  /* 7 · metering: Compose ↔ Provider */
  R.push(L("7", {paths:[mpath([mp("gate-compose"), [940,400], mp("provider")])], badge:{x:1014, y:354}, touches:["gate-compose","provider"]}));
  return R;
}

/* a station */
function mStation(id, s, f){
  const x = s.x, y = s.y;
  let g = '<g class="stn '+s.k+'" data-node="'+id+'" transform="translate('+x+','+y+')">';
  if(s.k==="xchg") g += '<rect x="-13" y="-31" width="26" height="62" rx="13"/>';
  else if(s.k==="gate") g += '<rect x="-12" y="-12" width="24" height="24" rx="6"/><path class="bar" d="M-5,-6 L-5,6 M5,-6 L5,6"/>';
  else if(s.k==="sys") g += '<rect x="-21" y="-9" width="30" height="18" rx="9"/>';
  else if(s.k==="ghost") g += '<circle r="9" class="ghost"/>';
  else if(s.k==="tray") g += '<rect x="-11" y="-11" width="22" height="22" rx="5"/>';
  else if(s.k==="floor") g += '<circle r="8"/>';
  else if(s.k==="pill-s") g += '<circle r="9"/>';
  else g += '<circle r="9"/>';
  /* label */
  const lx = (s.lb==="right" ? (id==="keep" ? 26 : 20) : s.lb==="upright" ? 16 : s.lb==="left" || s.lb==="upleft" ? (s.k==="gate" ? -16 : -22) : 0) + (s.dx||0);
  const anchor = s.lb==="right" || s.lb==="upright" ? "start" : s.lb==="left" || s.lb==="upleft" ? "end" : "middle";
  const ly = (s.lb==="above" ? -26 : s.lb==="upleft" || s.lb==="upright" ? -34 : s.lb==="below" ? 30 : s.lb==="floor" ? -18 : 5) + (s.dy||0);
  const lx2 = s.lb==="floor" ? -(MS_FLOOR.x1-MS_FLOOR.x0)/2 + 40 : lx;
  const anchor2 = s.lb==="floor" ? "start" : anchor;
  const fact = mFact(id, f);
  if(s.k==="gate"){
    if(fact) g += '<text class="sf" x="'+lx2+'" y="'+(ly)+'" text-anchor="'+anchor2+'">'+esc2(fact)+'</text>';
    g += '<text class="sl" x="'+lx2+'" y="'+(ly+15)+'" text-anchor="'+anchor2+'">'+esc2(s.t)+'</text>';
  } else {
    g += '<text class="sl" x="'+lx2+'" y="'+ly+'" text-anchor="'+anchor2+'">'+esc2(s.t)+'</text>';
    if(s.sub) g += '<text class="ss" x="'+lx2+'" y="'+(ly+14)+'" text-anchor="'+anchor2+'">'+esc2(s.sub)+'</text>';
    if(fact) g += '<text class="sf" x="'+lx2+'" y="'+(s.sub ? ly+28 : ly+14)+'" text-anchor="'+anchor2+'">'+esc2(fact)+'</text>';
  }
  g += '</g>';
  return g;
}
function mFact(id, f){
  const sys = function(i){ const s=f.systems[i]; return s.datasets+" datasets · "+s.reads+" read"+(s.reads===1?"":"s")+(s.writes?" · "+s.writes+" write":""); };
  switch(id){
    case "identity": return fmt(f.identity.people)+" people · "+f.identity.groups+" groups";
    case "context": return f.ctx.chats+" conversations · not kept";
    case "provider": return f.provider.host+" · "+f.provider.where.replace(/\s*\(.*$/,"");
    case "catalogue": return f.catalogue.datasets+" datasets · "+f.catalogue.verified+" verified";
    case "keep": return f.keep.saved+" saved · "+f.keep.automations+" automations · "+f.keep.clocks+" clocks";
    case "templates": return f.templates.verified+" verified of "+f.templates.n+" · shape only";
    case "withheld": return f.withheld.rows+" rows today · "+f.withheld.denied+" denied";
    case "dest-people": return "answers · digests · alerts";
    case "dest-comms": return f.comms.names.map(function(n){ return n.replace(/^Microsoft |^Google /,""); }).slice(0,3).join(" · ")+(f.comms.names.length>3?" +"+(f.comms.names.length-3):"");
    case "dest-clients": return f.clients.map(function(c){ return c.replace(/^Microsoft /,""); }).join(" · ");
    case "inbox": return f.inbox.waiting+" decisions · "+f.inbox.unread+" unread notices";
    case "sys-directory": return sys(0); case "sys-connect": return sys(1); case "sys-assemble": return sys(2); case "sys-orbit": return sys(3);
    case "sys-none": return "0 datasets · 0 reads";
    case "log": return "every line ends here, as the person it ran as · append-only · "+fmt(f.log.n)+" events";
    case "gate-understand": return f.gates[0].counts; case "gate-fetch": return f.gates[1].counts; case "gate-rules": return f.gates[2].counts; case "gate-compose": return f.gates[3].counts.replace(/^Claude /,"");
    default: return null;
  }
}

/* the picture */
function lsMetroSVG(f){
  const R = lsMetroRoutes(f);
  let s = '<svg viewBox="0 0 1440 880" xmlns="http://www.w3.org/2000/svg" class="metro" role="img" aria-label="Spiff as a metro map: the main line carries a question through Identity and five gates to People; other lines carry source reads, saves, clocks, outside clients, decisions and metering; every line ends on the activity log">';
  /* legend labels */
  s += '<text class="lbl" x="380" y="60">Spiff — every line, one map</text>'
     + '<text class="lbl2" x="380" y="80">Lines are routes; stations are systems, stores and destinations. The main line is a question.</text>';
  /* the floor */
  s += '<g class="floorline" data-node="log"><path d="M'+MS_FLOOR.x0+','+MS_FLOOR.y+' L'+MS_FLOOR.x1+','+MS_FLOOR.y+'"/></g>';
  /* lines, thick and under the stations */
  R.forEach(function(r){
    s += '<g class="route line '+r.style+(r.faint?' faint':'')+'" data-route="'+r.id+'" style="color:'+r.color+'">'
      + r.paths.map(function(p, pi){ return '<path id="ls-mp-'+String(r.id).replace(/[^a-z0-9]/gi,'')+'-'+pi+'" d="'+p+'" stroke="'+r.color+'"/>'; }).join('')
      + (r.badge ? '<g class="n" transform="translate('+r.badge.x+','+r.badge.y+')"><circle r="11" stroke="'+r.color+'"/><text fill="'+r.color+'">'+r.id+'</text></g>' : '')
      + '</g>';
  });
  /* stations */
  Object.keys(MS).forEach(function(id){ s += mStation(id, MS[id], f); });
  if(LS.mode==="live" && typeof lsMetroLive==="function") s += lsMetroLive(f, R);
  s += '</svg>';
  return s;
}

/* Live on the metro: trains on the lines, counts under the gates, held badges, health on the systems */
function lsMetroLive(f, R){
  const L = lsLiveCached(f), byId = {}; R.forEach(function(r){ byId[String(r.id)] = r; });
  let s = '<g class="live">';
  /* a hidden path for withheld traffic: main line to Apply rules, then the branch */
  s += '<path id="ls-mp-2w" fill="none" stroke="none" d="'+mpath([mp("ask")].concat(M_WITHHELD()))+'"/>';
  /* counts under the gates */
  Object.keys(L.gates).forEach(function(id){
    const g = L.gates[id], st = MS[id]; if(!st) return;
    const tx = st.x + 18, ta = "start";
    s += '<text class="lc" x="'+tx+'" y="'+(st.y+28)+'" text-anchor="'+ta+'">'+fmt(g.n)+' '+esc2(g.l)+'</text>'
       + '<text class="lc2" x="'+tx+'" y="'+(st.y+40)+'" text-anchor="'+ta+'">'+esc2(g.sub)+'</text>';
  });
  /* health on the systems */
  f.systems.forEach(function(sy){ const st = MS["sys-"+sy.id], h = L.health[sy.id]; s += '<g class="hp '+h+'" transform="translate('+(st.x-6)+','+st.y+')"><circle r="4"/>'+(h!=="ok"?'<circle class="ring" r="8"/>':'')+'</g>'; });
  /* from outside in: a client's question arrives green, travels the outside line orange, and is blue — an ordinary question — once Identity has said who is asking */
  const outside = M_OUTSIDE(), inside = [mp("identity",0,-20), mp("identity"), mp("dest-people")];
  const kAt = plen(outside) / (plen(outside) + plen(inside));
  s += '<path id="ls-mp-5in" fill="none" stroke="none" d="'+mpath(outside.concat(inside.slice(1)))+'"/>';
  L.clients.forEach(function(e, i){
    const dur = 12, begin = -((i/Math.max(1,L.clients.length))*dur).toFixed(2)+"s", k = kAt.toFixed(3), k2 = (kAt+0.03).toFixed(3);
    const fillAnim = function(cls){ return '<animate attributeName="fill" values="#1E8449;#C77E12;#C77E12;#2E7CD6;#2E7CD6" keyTimes="0;0.04;'+k+';'+k2+';1" dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite"/>'; };
    s += '<g class="dot client" data-ev="'+e.id+'"><circle class="halo" r="8" fill="#1E8449">'+fillAnim()+'</circle><circle r="4.5" fill="#1E8449">'+fillAnim()+'</circle>'
       + '<animateMotion dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite"><mpath href="#ls-mp-5in"/></animateMotion>'
       + '<title>'+esc2(e.when+" · "+lsKindInfo(e.kind).label+" · "+e.actor+" · "+e.detail.split(".")[0])+'</title></g>';
  });
  /* held */
  const heldAt = {}; L.held.forEach(function(h){ heldAt[h.where] = (heldAt[h.where]||[]).concat([h]); });
  Object.keys(heldAt).forEach(function(where){
    const st = MS[where]; if(!st) return; const n = heldAt[where].length, cls = heldAt[where].some(function(h){ return h.cls==="crit"; }) ? "crit" : "warn";
    s += '<g class="hold '+cls+'" transform="translate('+(st.x-18)+','+(st.y-14)+')"><circle r="10"/><text y="1">'+n+'</text><title>'+esc2(heldAt[where].map(function(h){ return h.what; }).join("\n"))+'</title></g>';
  });
  /* spend under the provider */
  s += '<text class="lc2" x="'+(MS.provider.x+16)+'" y="'+(MS.provider.y+5)+'">'+esc2(NZD(L.kpis.spend)+" of "+NZD(L.kpis.cap)+" · "+L.kpis.spendPct+"%")+'</text>';
  /* trains: one per event today */
  const perRoute = {};
  L.today.forEach(function(e){ const rid = LS_KIND_ROUTE[e.kind]; if(!rid || !byId[rid]) return; perRoute[rid] = (perRoute[rid]||[]).concat([e]); });
  perRoute["2c"] = L.today.filter(function(e){ return e.kind==="q.asked"||e.kind==="q.followup"||e.kind==="g.definition"; });
  perRoute["2d"] = L.today.filter(function(e){ return e.kind==="d.query"||e.kind==="q.opened"||e.kind==="q.refined"; });
  perRoute["2f"] = L.today.filter(function(e){ return e.kind==="q.answered"||e.kind==="q.chart"; });
  Object.keys(perRoute).forEach(function(rid){
    const r = byId[rid], evs = perRoute[rid], dur = (LS_ROUTE_DUR[rid]||6) * 1.4, n = evs.length;
    evs.forEach(function(e, i){
      const begin = -((i/n)*dur).toFixed(2)+"s", title = '<title>'+esc2(e.when+" · "+lsKindInfo(e.kind).label+" · "+e.actor+(e.subject?" · "+e.subject:""))+'</title>';
      if(rid==="2c"||rid==="2d"||rid==="2f"){
        s += '<g class="dot" style="color:'+r.color+'"><circle class="halo" r="7"/><circle r="3.5"/><animateMotion dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear"><mpath href="#ls-mp-'+rid+'-0"/></animateMotion>'+title+'</g>';
        return;
      }
      const href = rid==="2" ? (L.bad(e) ? "#ls-mp-2w" : "#ls-mp-2-0") : "#ls-mp-"+String(rid).replace(/[^a-z0-9]/gi,'')+"-"+(i % r.paths.length);
      s += '<g class="dot'+(L.bad(e)?' bad':'')+'" data-ev="'+e.id+'" style="color:'+r.color+'"><circle class="halo" r="8"/><circle r="4.5"/>'
         + '<animateMotion dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite"><mpath href="'+href+'"/></animateMotion>'+title+'</g>';
    });
  });
  s += '<g class="asat" transform="translate(1340,800)"><circle class="pulse" cx="-8" cy="-4" r="4"/><text text-anchor="end" x="-18">live · as at '+esc2(L.asAt)+' · '+fmt(L.today.length)+' events, one train each</text></g>';
  s += '</g>';
  return s;
}

</script>
