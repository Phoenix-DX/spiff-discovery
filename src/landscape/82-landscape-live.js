<script>
/* =====================================================================
   Landscape — Live mode
   The same picture, with today on it: one dot per event in today's
   activity log travelling the route it took; what each gate did today;
   what is held and waiting on a person; connector health on the systems.
   Nothing here is invented — every dot is an AUDIT event, every count is
   the number the Activity log and Inbox already show. Still read-only.
   ===================================================================== */

/* which route an event kind travelled */
const LS_KIND_ROUTE = {
  "q.asked":"2","q.answered":"2","q.refined":"2","q.followup":"2","q.chart":"2","q.export":"2","q.export_denied":"2",
  "d.query":"2","d.rows":"2","d.suppressed":"2","d.masked":"2","d.denied":"2","d.sample":"1",
  "g.rule_fired":"2","q.saved":"3","q.opened":"3",
  "au.created":"4","au.started":"4","au.ok":"4","au.fail":"4","au.cloned":"3","au.shared":"3","au.sub_add":"4","au.sub_rm":"4","au.threshold":"6",
  "c.tool":"2b","c.tool_denied":"2b","c.consent":"6","c.consent_rev":"6","c.connected":"6","c.tools_changed":"6",
  "a.requested":"6","a.approved":"6","a.completed":"6","a.declined":"6","a.expired":"6","a.revoked":"6","a.group":"6","a.role":"6","a.review":"6","a.sim":"6",
  "g.rule_created":"6","g.rule_edited":"6","g.rule_suspended":"6","g.certified":"6","g.cert_broken":"6","g.definition":"6",
  "x.quota":"7","x.retention":"6","x.capability":"6","x.policy":"6"
};
const LS_ROUTE_DUR = {"1":9,"2":7,"2b":4,"2c":5,"2d":3,"2e":6,"2f":3,"3":5,"4":8,"5":6,"6":7,"7":3};

function lsKindInfo(k){ return AUDIT_KINDS.filter(function(x){ return x.id===k; })[0] || {label:k, group:"qa", color:"mut"}; }
function lsToday(){ return AUDIT.filter(function(e){ return /^today/.test(e.when); }).sort(function(a,b){ return a.ts<b.ts?1:-1; }); }

/* the live facts, derived from the same fixtures as the screens */
function lsLive(f){
  const today = lsToday(), S = AUDIT_STATS;
  const bad = function(e){ return e.outcome==="denied"||e.outcome==="error"||/denied|suppressed|masked|cert_broken|fail/.test(e.kind); };
  const by = function(re){ return today.filter(function(e){ return re.test(e.kind); }).length; };
  const health = {};
  f.systems.forEach(function(s){ const c = connectorById(s.conn)||{}; health[s.id] = c.state==="connected"?"ok":c.state==="reauth"?"warn":c.state==="error"||c.state==="blocked"?"crit":"mut"; });
  const degraded = CONNECTORS.filter(function(c){ return c.state==="reauth"||c.state==="error"; });
  const failedRuns = (typeof inboxItems==="function" ? inboxItems().filter(function(i){ return i.kind==="run" && i.status==="waiting" && /failed/.test(i.what); }) : []);
  const held = degraded.map(function(c){ return {where:"gate-fetch", what:(c.state==="reauth"?"Sign-in expired — ":"Unreachable — ")+c.name, cls:c.state==="reauth"?"warn":"crit", open:"go('mcp')"}; })
    .concat(failedRuns.map(function(i){ return {where:"keep", what:i.what.replace(/[“”]/g,'"'), cls:"crit", open:"go('inbox')"}; }));
  const denied = today.filter(function(e){ return e.outcome==="denied"; }).length;
  return {
    today: today, asAt: today.length ? today[0].when.replace("today ","") : "16:20",
    kpis: {
      events: S.eventsToday, questions: S.questionsToday, askers: S.askersToday,
      answered: by(/^q\.answered$/), withheld: S.suppressedToday + S.maskedToday, denied: denied,
      reads: by(/^(d\.query|q\.opened)$/), calls: by(/^c\.tool/), runs: by(/^au\.(started|ok|fail)$/),
      decisions: f.inbox.waiting, held: held.length,
      spend: BUDGET.tenant.used, cap: BUDGET.tenant.cap, spendPct: budgetPct(BUDGET.tenant.used, BUDGET.tenant.cap)
    },
    gates: {
      "gate-understand": {n: S.questionsToday, l:"asked today", sub: "by "+S.askersToday+" people"},
      "gate-fetch":      {n: by(/^(d\.query|q\.opened|c\.tool)/), l:"fetches", held: degraded.length, sub: degraded.length+" connector"+(degraded.length===1?"":"s")+" down"},
      "gate-rules":      {n: S.suppressedToday + S.maskedToday, l:"rows withheld", sub: denied+" denied outright"},
      "gate-compose":    {n: by(/^q\.answered$/), l:"composed", sub: NZD(BUDGET.me.used)+" yours"},
      "gate-deliver":    {n: by(/^(q\.answered|q\.export|au\.ok)$/), l:"delivered", sub: by(/^q\.export_denied$/)+" export refused"}
    },
    health: health, held: held, bad: bad,
    clients: today.filter(function(e){ return e.source==="client"; })
  };
}

/* one computation per paint */
function lsLiveCached(f){ if(!LS._lv) LS._lv = lsLive(f || lsFacts()); return LS._lv; }

/* two lines at the foot of each gate: what it did today */
function lsGateExtra(g, x, y, w, h){
  if(LS.mode!=="live") return '';
  const L = lsLiveCached(), t = L.gates["gate-"+g.id]; if(!t) return '';
  const cx = x + (w-14)/2;
  return '<text class="gl2" x="'+cx+'" y="'+(y+h-22)+'">'+fmt(t.n)+' '+esc2(t.l)+'</text>'
       + '<text class="gl3" x="'+cx+'" y="'+(y+h-9)+'">'+esc2(t.sub)+'</text>';
}

/* the layer drawn over the Architecture picture in Live mode */
function lsLiveLayer(f){
  const G = LS_GEO, L = lsLiveCached(f), R = lsRoutes(G, f), byId = {};
  R.forEach(function(r){ byId[String(r.id)] = r; });
  let s = '<g class="live">';
  /* hidden motion path for route 2: ask → identity → straight through the gates → people */
  const gateMid = G.gates.y + G.gates.h/2, identR = G.ident.x + G.ident.w, gx4 = G.gates.x0 + 4*(G.gates.w+G.gates.gap) + G.gates.w;
  const c = (G.dest[0].x - gx4)/2, ix = G.ident.x + G.ident.w/2;
  s += '<path id="ls-m-2" fill="none" stroke="none" d="M'+ix+','+(G.ask.y+24)+' L'+ix+','+(G.ident.y+2)+' L'+ix+','+gateMid+' L'+identR+','+gateMid+' L'+gx4+','+gateMid+' C'+(gx4+c)+','+gateMid+' '+(G.dest[0].x-c)+','+(G.dest[0].y+G.destH/2)+' '+G.dest[0].x+','+(G.dest[0].y+G.destH/2)+'"/>';
  const rX = G.gates.x0 + 2*(G.gates.w+G.gates.gap) + G.gates.w/2;
  s += '<path id="ls-m-2w" fill="none" stroke="none" d="M'+ix+','+(G.ask.y+24)+' L'+ix+','+(G.ident.y+2)+' L'+ix+','+gateMid+' L'+identR+','+gateMid+' L'+rX+','+gateMid+' L'+rX+','+(G.gates.y+G.gates.h)+' L'+rX+','+G.withheld.y+'"/>';
  /* connector health on each system */
  f.systems.forEach(function(sy, i){
    const p = G.sys[i], h = L.health[sy.id];
    s += '<g class="hp '+h+'" transform="translate('+(p.x+G.sysW-16)+','+(p.y+G.sysH-18)+')"><circle r="5"/>'+(h!=="ok"?'<circle class="ring" r="9"/>':'')+'<title>'+esc2(sy.name+" connector: "+((connectorById(sy.conn)||{}).state||"—"))+'</title></g>';
  });
  /* held items pinned where they stopped */
  const heldAt = {};
  L.held.forEach(function(h){ heldAt[h.where] = (heldAt[h.where]||[]).concat([h]); });
  Object.keys(heldAt).forEach(function(where){
    const n = heldAt[where].length, cls = heldAt[where].some(function(h){ return h.cls==="crit"; }) ? "crit" : "warn";
    let x, y;
    if(where==="keep"){ x = G.keep.x + G.keep.w - 8; y = G.keep.y - 8; }
    else { x = G.gates.x0 + 1*(G.gates.w+G.gates.gap) + G.gates.w - 10; y = G.gates.y - 6; }
    s += '<g class="hold '+cls+'" transform="translate('+x+','+y+')"><circle r="11"/><text y="1">'+n+'</text><title>'+esc2(heldAt[where].map(function(h){ return h.what; }).join("\n"))+'</title></g>';
  });
  /* spend meter on the provider */
  const pw = G.prov.w - 32, px = G.prov.x + 16, py = G.prov.y + G.prov.h - 5;
  s += '<rect class="mt" x="'+px+'" y="'+py+'" width="'+pw+'" height="3" rx="1.5"/><rect class="mf '+(L.kpis.spendPct>=80?'warn':'')+'" x="'+px+'" y="'+py+'" width="'+(pw*Math.min(1,L.kpis.spendPct/100)).toFixed(1)+'" height="3" rx="1.5"/>';
  /* one dot per event today, on the route it took */
  const perRoute = {};
  L.today.forEach(function(e){ const rid = LS_KIND_ROUTE[e.kind]; if(!rid || !byId[rid] || e.source==="client") return; perRoute[rid] = (perRoute[rid]||[]).concat([e]); });
  /* from outside in: green at the client, orange on the way, blue once Identity has said who is asking */
  const r5 = byId["5"], kIn = 0.47;
  if(r5){
    s += '<path id="ls-p-5in" fill="none" stroke="none" d="'+r5.paths[0]+' L'+ix+','+(G.ask.y+24)+' L'+ix+','+(G.ident.y+2)+' L'+ix+','+gateMid+' L'+identR+','+gateMid+' L'+gx4+','+gateMid+' C'+(gx4+c)+','+gateMid+' '+(G.dest[0].x-c)+','+(G.dest[0].y+G.destH/2)+' '+G.dest[0].x+','+(G.dest[0].y+G.destH/2)+'"/>';
    L.clients.forEach(function(e, i){
      const dur = 11, begin = -((i/Math.max(1,L.clients.length))*dur).toFixed(2)+"s";
      const fillAnim = '<animate attributeName="fill" values="#1E8449;#C77E12;#C77E12;#2E7CD6;#2E7CD6" keyTimes="0;0.04;'+kIn+';'+(kIn+0.03)+';1" dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite"/>';
      s += '<g class="dot client" data-ev="'+e.id+'"><circle class="halo" r="8" fill="#1E8449">'+fillAnim+'</circle><circle r="4.5" fill="#1E8449">'+fillAnim+'</circle>'
         + '<animateMotion dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite"><mpath href="#ls-p-5in"/></animateMotion>'
         + '<title>'+esc2(e.when+" · "+lsKindInfo(e.kind).label+" · "+e.actor+" · "+e.detail.split(".")[0])+'</title></g>';
    });
  }
  /* every question also looks something up (2c); every fetch also reads and writes context (2d) */
  perRoute["2c"] = L.today.filter(function(e){ return e.kind==="q.asked"||e.kind==="q.followup"||e.kind==="g.definition"; });
  perRoute["2d"] = L.today.filter(function(e){ return e.kind==="d.query"||e.kind==="q.opened"||e.kind==="q.refined"; });
  perRoute["2f"] = L.today.filter(function(e){ return e.kind==="q.answered"||e.kind==="q.chart"; });
  Object.keys(perRoute).forEach(function(rid){
    const r = byId[rid], evs = perRoute[rid], dur = LS_ROUTE_DUR[rid]||6, n = evs.length;
    evs.forEach(function(e, i){
      if(rid==="2c"||rid==="2d"||rid==="2f"){
        const p = r.paths[i % r.paths.length], back = p.replace(/^M([^ ]+) L([^ ]+)$/, "M$1 L$2 L$1");
        s += '<g class="dot" style="color:'+r.color+'"><circle class="halo" r="7"/><circle r="3.5"/><animateMotion dur="'+dur+'s" begin="'+(-((i/n)*dur).toFixed(2))+'s" repeatCount="indefinite" path="'+back+'"/><title>'+esc2(e.when+" · "+lsKindInfo(e.kind).label+" · "+e.actor)+'</title></g>';
        return;
      }
      const href = rid==="2" ? (L.bad(e) ? "#ls-m-2w" : "#ls-m-2") : "#ls-p-"+String(rid).replace(/[^a-z0-9]/gi,'')+"-"+(i % r.paths.length);
      const begin = -((i/n)*dur).toFixed(2)+"s";
      s += '<g class="dot'+(L.bad(e)?' bad':'')+'" data-ev="'+e.id+'" style="color:'+r.color+'"><circle class="halo" r="8"/><circle r="4.5"/>'
         + '<animateMotion dur="'+dur+'s" begin="'+begin+'" repeatCount="indefinite" rotate="0"><mpath href="'+href+'"/></animateMotion>'
         + '<title>'+esc2(e.when+" · "+lsKindInfo(e.kind).label+" · "+e.actor+(e.subject?" · "+e.subject:""))+'</title></g>';
    });
  });
  /* as-at stamp */
  s += '<g class="asat" transform="translate(1130,52)"><circle class="pulse" cx="4" cy="-4" r="4"/><text x="14">live · as at '+esc2(L.asAt)+' · '+fmt(L.today.length)+' events, one dot each</text></g>';
  s += '</g>';
  return s;
}

/* the strip above the picture */
function lsLiveStrip(f){
  const L = lsLive(f), k = L.kpis;
  return '<div class="ls-kpis">'
    + kpi("Events today", fmt(k.events), "one dot each on the map")
    + kpi("Questions", fmt(k.questions), "from "+k.askers+" people · "+k.answered+" answered")
    + kpi("Rows withheld", fmt(k.withheld), k.denied+" denied outright · every one told")
    + kpi("Runs & calls", fmt(k.runs+k.calls), k.runs+" automation runs · "+k.calls+" connector calls")
    + kpi("Held", '<span class="'+(k.held?'crit':'')+'">'+k.held+'</span>', k.held ? "stopped, waiting on a person" : "nothing is stuck")
    + kpi("Decisions", fmt(k.decisions), "waiting in the Inbox")
    + kpi("Spend", NZD(k.spend), "of "+NZD(k.cap)+" · "+esc2(BUDGET.month)+meter(k.spendPct, k.spendPct>=80?'warn':''))
    + '</div>';
}

/* what just happened — the feed, newest first */
function lsLiveFeed(f){
  const L = lsLiveCached(f), routes = lsActiveRoutes(f);
  const rows = L.today.slice(0, 14).map(function(e){
    const ki = lsKindInfo(e.kind), rid = LS_KIND_ROUTE[e.kind], r = rid ? routes.filter(function(x){ return String(x.id)===rid; })[0] : null;
    const o = AUDIT_OUTCOMES[e.outcome] || {cls:"mut", label:e.outcome};
    return '<div class="ls-ev'+(L.bad(e)?' bad':'')+'" '+(r?'onmouseenter="if(!LS.pin)lsFocus(\'route\',\''+r.id+'\',false)" onmouseleave="if(!LS.pin)lsFocus(null,null,false)" onclick="lsFocus(\'route\',\''+r.id+'\',true)"':'')+'>'
      + '<span class="t">'+esc2(e.when.replace("today ",""))+'</span>'
      + '<span class="rn" style="'+(r?'color:'+r.color+';border-color:'+r.color:'opacity:.35')+'">'+(r?r.id:'·')+'</span>'
      + '<div class="b"><div class="w">'+esc2(ki.label)+' <span class="who">· '+esc2(e.actor)+'</span></div>'
      + (e.subject?'<div class="s">'+esc2(e.subject)+'</div>':'')+'</div>'
      + '<span class="bdg '+o.cls+'">'+esc2(o.label)+'</span>'
      + '</div>';
  }).join('');
  const held = L.held.length ? '<div class="lbl2" style="margin-top:16px">Held — stopped, waiting on a person</div>'
    + L.held.map(function(h){ return '<div class="ls-held '+h.cls+'">'+I2.warn+'<div>'+esc2(h.what)+'</div><button class="btn sm" onclick="'+h.open+'">'+I2.chev+' Open</button></div>'; }).join('') : '';
  return '<div class="lbl2">What just happened — newest first · hover a line to light its route</div><div class="ls-feed">'+rows+'</div>'
    + '<div style="margin-top:10px"><button class="btn sm" onclick="go(\'audit\')">'+I2.chev+' Open the Activity log — all '+fmt(AUDIT.length)+' events</button></div>' + held;
}

/* extra facts on the detail panel while live */
function lsLiveKV(id){
  if(LS.mode!=="live" || !id) return [];
  const f = lsFacts(), L = lsLive(f);
  if(L.gates[id]) { const g = L.gates[id]; return [["Today", fmt(g.n)+" "+g.l], ["Also", g.sub]]; }
  if(/^sys-/.test(id)){ const sy = f.systems.filter(function(s){ return "sys-"+s.id===id; })[0]; if(sy){ const c = connectorById(sy.conn)||{}; return [["Connector", (c.state||"—")+(c.calls30d?" · "+fmt(c.calls30d)+" calls in 30 days":"")]]; } }
  if(id==="inbox") return [["Waiting", L.kpis.decisions+" decisions · "+L.kpis.held+" held"]];
  if(id==="provider") return [["This month", NZD(L.kpis.spend)+" of "+NZD(L.kpis.cap)+" · "+L.kpis.spendPct+"%"]];
  if(id==="log") return [["Today", fmt(L.today.length)+" events · newest "+L.asAt]];
  return [];
}

/* line status — which routes are running clean today, and which have something held on them */
function lsLineStatusPanel(f){
  const L = lsLiveCached(f), routes = lsActiveRoutes(f).filter(function(r){ return !r.faint; });
  const rows = routes.map(function(r){
    const rid = String(r.id);
    const held = L.held.filter(function(h){ return (rid==="2"||rid==="2b") && h.where==="gate-fetch" || rid==="4" && h.where==="keep"; });
    const n = rid==="5" ? L.clients.length : L.today.filter(function(e){ return LS_KIND_ROUTE[e.kind]===rid && e.source!=="client"; }).length;
    return '<div class="ls-ls" onmouseenter="if(!LS.pin)lsFocus(\'route\',\''+rid+'\',false)" onmouseleave="if(!LS.pin)lsFocus(null,null,false)" onclick="lsFocus(\'route\',\''+rid+'\',true)">'
      + '<span class="rn" style="color:'+r.color+';border-color:'+r.color+'">'+rid+'</span><span class="nm">'+esc2(r.name.replace(/ \(part of route 2\)/,''))+'</span>'
      + '<span class="sp"></span>'+(n?'<span class="cnt">'+n+' today</span>':'')
      + (held.length ? '<span class="bdg warn">'+I2.warn+' '+held.length+' held</span>' : '<span class="bdg ok">good service</span>')+'</div>';
  }).join('');
  return panel("Line status", '<div class="ls-lines">'+rows+'</div>', {icon:"bolt", tight:true, sub:"today"});
}

/* pause and resume the dots */
function lsMotion(on){
  LS.paused = !on;
  const svg = document.querySelector('#ls-canvas svg'); if(!svg) return;
  try { if(on) svg.unpauseAnimations(); else svg.pauseAnimations(); } catch(e){}
  const b = $('#ls-motion'); if(b){ b.classList.toggle('on', on); b.setAttribute('aria-checked', on?'true':'false'); }
}
</script>
