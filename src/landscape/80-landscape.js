<script>
/* =====================================================================
   Landscape — 14 Sep 2026 (built as an isolated preview on the "landscape" branch, merged the same day)
   One picture of how Spiff works: where records live, the gate every
   question passes through, the five steps an answer takes, where answers
   go, and what sits underneath. Every count is read from the same data the
   screens use, so the picture cannot disagree with them.

   Decisions with Thato, 14 Sep: governance is drawn as gates on the
   route, not a box; Admin is not on the map; read-only — a verb appears
   here only if the inbox would offer it, and none do yet. Architecture
   mode is the frozen picture the spec will reference; Live mode (one dot
   per event today, gate counts, held items) lives in 82-landscape-live.js.
   ===================================================================== */

const LS = { mode:"arch", pin:null, picture:"metro" };   /* picture: "metro" or "boxes" — Innocent compared them on 14 Sep 2026 and kept both */
function lsActiveRoutes(f){ return (LS.picture==="metro" && typeof lsMetroRoutes==="function") ? lsMetroRoutes(f) : lsRoutes(LS_GEO, f); }
CRUMB.landscape = "How Spiff works";

/* ---------- the facts, derived ---------- */
function lsFacts(){
  const sysOf = function(id){ return DATASETS.filter(function(d){ return d.sys===id; }).length; };
  const readsOf = function(id){ const src = SOURCES_REG.filter(function(s){ return s.system===id; }).map(function(s){ return s.id; }); return SCANS.filter(function(sc){ return src.indexOf(sc.sourceId)>=0; }).length; };
  const conn = function(id){ return connectorById(id); };
  const systems = [
    {id:"directory", name:"Directory", conn:"directory", color:sysById("directory").color, kind:"System of record"},
    {id:"connect",   name:"Connect",   conn:"warehouse", color:sysById("connect").color,   kind:"System of record"},
    {id:"assemble",  name:"Assemble",  conn:"assemble",  color:sysById("assemble").color,  kind:"System of record"},
    {id:"orbit",     name:"Orbit",     conn:"orbit",     color:sysById("orbit").color,     kind:"System of record"}
  ].map(function(s){ const c=conn(s.conn)||{tools:[],state:"available"}; return Object.assign(s, {datasets:sysOf(s.id), reads:readsOf(s.id), tools:c.tools.length, writes:c.tools.filter(function(t){ return t.kind!=="read"; }).length, state:c.state}); });
  const comms = CONNECTORS.filter(function(c){ return /Comms|Files/.test(c.category) && c.state!=="blocked"; });
  return {
    systems: systems,
    absent: {name:"No finance system", note:"Cost centres & budgets is described so people can ask for it. Nothing is connected."},
    identity: {people:ORG.users, groups:GROUPS.length, bundles:ROLES.length, scope:"Country · Locality · Subdivision"},
    gates: [
      {id:"understand", name:"Understand", ms:"320 ms", sub:"the question, in the agreed words", counts:GLOSSARY.length+" definitions"},
      {id:"fetch",      name:"Fetch",      ms:"610 ms", sub:"through connectors, as the asker",  counts:CONNECTORS.filter(function(c){ return c.category==="Data"&&c.state==="connected"; }).length+" data connectors"},
      {id:"rules",      name:"Apply rules",ms:"45 ms",  sub:"filter · mask · suppress · round",  counts:RULES.filter(function(r){ return r.status==="Active"; }).length+" active rules"},
      {id:"compose",    name:"Compose",    ms:"1.8 s",  sub:"the answer, with its working",      counts:rateById(MODEL_ROUTES[0].model).model},
      {id:"deliver",    name:"Deliver",    ms:"95 ms",  sub:"to you, a workspace, or a clock",   counts:""}
    ],
    provider: {host:PROVIDER.host.split(" — ")[0], where:PROVIDER.host.split(" — ")[1]||"", key:providerWho(), spend:NZD(BUDGET.tenant.used)+" of "+NZD(BUDGET.tenant.cap)+" · "+BUDGET.month},
    catalogue: {datasets:DATASETS.length, verified:DATASETS.filter(function(d){ return d.cert==="verified"; }).length, warnings:DATASETS.filter(function(d){ return d.cert==="warning"; }).length, findings:FINDINGS.filter(function(f){ return f.status==="pending"; }).length},
    keep: {saved:REPORTS.length+LIBRARY.length, teams:TEAMS.length, automations:WORKFLOWS.length, clocks:SCHEDRUNS.length+TRIGRULES.length},
    people: {subs:(typeof AUTOSUBS!=="undefined"?Object.keys(AUTOSUBS).length:3)},
    comms: {names:comms.map(function(c){ return c.name.replace(" & Calendar",""); }), writes:comms.reduce(function(a,c){ return a+c.tools.filter(function(t){ return t.kind!=="read"; }).length; },0)},
    clients: ["Claude","Microsoft Copilot","ChatGPT"],
    inbox: {waiting:(typeof inboxWaiting==="function"?inboxWaiting().length:0), unread:(typeof NOTICES!=="undefined"?NOTICES.filter(function(n){ return !n.read; }).length:0)},
    ctx: {chats:THREADS.length},
    templates: {n:TEMPLATES.length, verified:TEMPLATES.filter(function(t){ return t.status==="Approved"; }).length},
    withheld: {rows:AUDIT_STATS.suppressedToday + AUDIT_STATS.maskedToday, masked:AUDIT_STATS.maskedToday, denied:AUDIT.filter(function(e){ return /^today/.test(e.when) && e.outcome==="denied"; }).length},
    log: {n:AUDIT.length}
  };
}

/* ---------- geometry (a 1440 × 700 canvas) ---------- */
const LS_GEO = {
  sys:   [{x:30,y:90},{x:30,y:200},{x:30,y:310},{x:30,y:420}], sysW:250, sysH:86, absent:{x:30,y:530},
  ident: {x:330,y:90,w:44,h:416},
  gates: {x0:430,y:118,w:112,h:150,gap:8},
  prov:  {x:760,y:14,w:300,h:70},
  ctx:   {x:430,y:14,w:232,h:70},
  withheld:{x:616,y:530,w:220,h:60},
  tpl:   {x:760,y:300,w:200,h:66},
  cat:   {x:430,y:400,w:280,h:96},
  keep:  {x:760,y:400,w:300,h:96},
  dest:  [{x:1130,y:90},{x:1130,y:200},{x:1130,y:310}], destW:280, destH:86,
  tray:  {x:1130,y:430,w:280,h:70},
  floor: {x:30,y:626,w:1380,h:52},
  ask:   {x:330,y:44}
};

/* the routes: id, colour, label, style, the paths, and the boxes/gates they touch */
function lsRoutes(g, f){
  const G = LS_GEO, gx = function(i){ return G.gates.x0 + i*(G.gates.w+G.gates.gap); };
  const gateMid = G.gates.y + G.gates.h/2;
  const sysRight = G.sys[0].x + G.sysW, sysMid = function(i){ return G.sys[i].y + G.sysH/2; };
  const identX = G.ident.x, identR = G.ident.x + G.ident.w;
  const curve = function(x1,y1,x2,y2){ const c=(x2-x1)/2; return "M"+x1+","+y1+" C"+(x1+c)+","+y1+" "+(x2-c)+","+y2+" "+x2+","+y2; };
  const R = [];
  /* 1 · source reads: each system → Catalogue (shape only, read once) */
  R.push({id:1, name:"Source read", style:"dashed", color:"var(--teal)", touches:["sys-directory","sys-connect","sys-assemble","sys-orbit","catalogue"],
    paths: f.systems.map(function(s,i){ return curve(sysRight, sysMid(i)+22, G.cat.x, G.cat.y + 20 + i*18); }),
    badge:{x:G.cat.x-24, y:G.cat.y+48},
    sub:"A system's shape — schema, code, documents; never rows — is read once, findings are proposed, a person accepts them into the Catalogue. Scheduled or on request.",
    open:"go('sources')", counts:f.catalogue.findings+" findings waiting"});
  /* 2 · a question: ask → identity → five gates → deliver → people */
  const askY = G.ask.y+12;
  R.push({id:2, name:"A question", style:"solid", color:"var(--accent)", touches:["identity","gate-understand","gate-fetch","gate-rules","gate-compose","gate-deliver","dest-people"],
    paths: ["M"+(identX+G.ident.w/2)+","+(askY+12)+" L"+(identX+G.ident.w/2)+","+(G.ident.y),
            "M"+identR+","+gateMid+" L"+gx(0)+","+gateMid,
            "M"+(gx(4)+G.gates.w)+","+gateMid+" "+curve(gx(4)+G.gates.w, gateMid, G.dest[0].x, G.dest[0].y+G.destH/2).slice(1)],
    badge:{x:(identR+gx(0))/2, y:gateMid-16},
    sub:"You ask. Identity says who you are and what you may see. Five steps later an answer arrives, built from the rows you are allowed — and only those.",
    open:"go('home')", counts:"real time · most of the dots"});
  /* connectors: Fetch ↔ each system, as the asker */
  R.push({id:"2b", name:"Connectors (part of route 2)", style:"solid", color:"var(--accent)", faint:true, touches:["gate-fetch","sys-directory","sys-connect","sys-assemble","sys-orbit"],
    paths: f.systems.map(function(s,i){ return curve(sysRight, sysMid(i)-18, gx(1)+G.gates.w/2, G.gates.y+G.gates.h); }),
    sub:"Fetch reaches each system live, through its connector, as the person asking.", open:"go('mcp')", counts:""});
  /* 2c · looking it up: Understand ↔ Catalogue — what exists, what the words mean */
  const uX = gx(0)+G.gates.w/2, fX = gx(1)+G.gates.w/2, rX = gx(2)+G.gates.w/2;
  R.push({id:"2c", name:"Looking it up (part of route 2)", style:"dashed", color:"var(--teal)", touches:["gate-understand","catalogue"],
    paths:["M"+uX+","+(G.gates.y+G.gates.h)+" L"+uX+","+G.cat.y],
    badge:{x:uX-18, y:(G.gates.y+G.gates.h+G.cat.y)/2},
    sub:"Understand goes back to what the source reads produced — the Catalogue — for what exists and what the words mean. Shape, never rows. What it resolves goes into Context so Fetch does not start from nothing.",
    open:"go('catalog')", counts:f.catalogue.datasets+" datasets · "+GLOSSARY.length+" definitions"});
  /* 2d · context: Understand and Fetch ↔ working memory */
  R.push({id:"2d", name:"Context (part of route 2)", style:"solid", color:"var(--accent)", touches:["gate-understand","gate-fetch","context"],
    paths:["M"+uX+","+G.gates.y+" L"+uX+","+(G.ctx.y+G.ctx.h), "M"+fX+","+G.gates.y+" L"+fX+","+(G.ctx.y+G.ctx.h)],
    badge:{x:(uX+fX)/2, y:(G.gates.y+G.ctx.y+G.ctx.h)/2},
    sub:"Understand writes what it resolved; Fetch reads the plan and writes what it brought back — for this person, this conversation. Who may see what is never taken from here: Identity is re-checked on every run. Cleared with the chat.",
    open:"go('chat')", counts:f.ctx.chats+" open conversations"});
  /* 2e · withheld: Apply rules → Withheld → the floor */
  R.push({id:"2e", name:"Withheld (part of route 2)", style:"solid", color:"var(--crit)", touches:["gate-rules","withheld","log"],
    paths:["M"+rX+","+(G.gates.y+G.gates.h)+" L"+rX+","+G.withheld.y, "M"+rX+","+(G.withheld.y+G.withheld.h)+" L"+rX+","+G.floor.y],
    badge:{x:rX+18, y:(G.gates.y+G.gates.h+G.withheld.y)/2},
    sub:"What Apply rules stops — rows outside scope, small counts, masked fields, refused exports — drops out of the answer here. The viewer is told what was withheld and why; the log records it. Nothing is dropped in silence.",
    open:"go('audit')", counts:f.withheld.rows+" rows today · "+f.withheld.denied+" denied"});
  /* 2f · laying it out: Compose ↔ Templates — the shape, never the numbers */
  const cX = gx(3)+G.gates.w/2;
  R.push({id:"2f", name:"Laying it out (part of route 2)", style:"dashed", color:"var(--purple)", touches:["gate-compose","templates"],
    paths:["M"+cX+","+(G.gates.y+G.gates.h)+" L"+cX+","+G.tpl.y],
    badge:{x:cX+18, y:(G.gates.y+G.gates.h+G.tpl.y)/2},
    sub:"Compose asks which template fits the question — bound to its datasets or the asker's team — and lays the answer out in that shape: blocks, order, formats. One match is applied and named in the footer; several are offered; none means Spiff's default. The shape changes; the numbers never do.",
    open:"go('templates')", counts:f.templates.verified+" verified of "+f.templates.n});
  /* 3 · save and share: Deliver → Keep & run */
  R.push({id:3, name:"Save and share", style:"solid", color:"var(--purple)", touches:["gate-deliver","keep"],
    paths: [curve(gx(4)+G.gates.w/2, G.gates.y+G.gates.h, G.keep.x+G.keep.w-24, G.keep.y)],
    badge:{x:gx(4)+G.gates.w/2+40, y:(G.gates.y+G.gates.h+G.keep.y)/2},
    sub:"An answer into My workspace or one of your Team workspaces. When someone else opens it, it goes round route 2 again as them. Sharing organises, it never widens access.",
    open:"go('library')", counts:f.keep.saved+" saved · "+f.keep.teams+" teams"});
  /* 4 · on a clock: Keep & run → Identity (as owner) and → Comms */
  R.push({id:4, name:"On a clock", style:"solid", color:"var(--warn)", touches:["keep","identity","dest-comms","dest-people"],
    paths: ["M"+G.keep.x+","+(G.keep.y+G.keep.h/2)+" C"+(G.keep.x-120)+","+(G.keep.y+G.keep.h/2)+" "+(identR+40)+","+(G.ident.y+G.ident.h-10)+" "+identR+","+(G.ident.y+G.ident.h-10),
            curve(G.keep.x+G.keep.w, G.keep.y+G.keep.h/2-10, G.dest[1].x, G.dest[1].y+G.destH/2)],
    badge:{x:G.keep.x-60, y:G.keep.y+G.keep.h/2-14},
    sub:"An automation runs as its owner, round route 2, and delivers through Comms or to People. Each subscriber gets their own re-run, scoped to them.",
    open:"go('autos')", counts:f.keep.automations+" automations · "+f.keep.clocks+" clocks"});
  /* 5 · from outside in: External clients → Identity */
  R.push({id:5, name:"From outside in", style:"dashed", color:"var(--pink)", touches:["dest-clients","identity"],
    paths: ["M"+G.dest[2].x+","+(G.dest[2].y+G.destH/2)+" C"+(G.dest[2].x-60)+","+(G.dest[2].y+G.destH/2)+" "+(identX+G.ident.w/2+60)+","+(G.ask.y-10)+" "+(identX+G.ident.w/2+16)+","+(G.ask.y+4)],
    badge:{x:G.dest[2].x-70, y:G.dest[2].y+G.destH/2-14},
    sub:"Claude, Copilot or ChatGPT ask Spiff. Same gate, same rules, same log — the client gets what the person could see, nothing more.",
    open:"MCPV.tab='server';go('mcp')", counts:f.clients.length+" clients"});
  /* 6 · decisions: from Identity, Catalogue, Keep, Provider → Inbox */
  R.push({id:6, name:"A decision", style:"dotted", color:"var(--crit)", touches:["identity","catalogue","keep","provider","inbox"],
    paths: [curve(G.cat.x+G.cat.w, G.cat.y+G.cat.h-16, G.tray.x, G.tray.y+22),
            curve(G.keep.x+G.keep.w, G.keep.y+G.keep.h-12, G.tray.x, G.tray.y+40),
            curve(G.prov.x+G.prov.w, G.prov.y+G.prov.h/2, G.tray.x+G.tray.w/2, G.tray.y),
            "M"+(identX+G.ident.w/2)+","+(G.ident.y+G.ident.h)+" C"+(identX+G.ident.w/2)+","+(G.ident.y+G.ident.h+14)+" "+(G.tray.x-40)+","+(G.tray.y+70)+" "+G.tray.x+","+(G.tray.y+58)],
    badge:{x:G.tray.x-30, y:G.tray.y-6},
    sub:"A request, a review, a finding, a connector request, an expiry or a budget alert lands in the Inbox. The decision changes Identity, the Catalogue or Keep & run — and is logged.",
    open:"go('inbox')", counts:f.inbox.waiting+" waiting"});
  /* 7 · metering: Compose ↔ Provider */
  R.push({id:7, name:"Metering", style:"dotted", color:"var(--muted)", touches:["gate-compose","provider"],
    paths: ["M"+(gx(3)+G.gates.w/2)+","+G.gates.y+" L"+(gx(3)+G.gates.w/2)+","+(G.prov.y+G.prov.h)],
    badge:{x:gx(3)+G.gates.w/2+18, y:(G.gates.y+G.prov.y+G.prov.h)/2},
    sub:"Every model call is tokens; the rate card turns them into NZ$ on the tenant, team and person meters. At the cap, schedules pause first.",
    open:"ADM.tab='budgets';go('admin')", counts:f.provider.spend});
  return R;
}

/* ---------- drawing ---------- */
function lsBox(cls, id, x, y, w, h, mark, markColor, kicker, title, counts, extra){
  return '<g class="box '+cls+'" data-node="'+id+'" transform="translate('+x+','+y+')">'
    + '<rect width="'+w+'" height="'+h+'"/>'
    + (mark ? '<rect class="mark" x="14" y="16" width="28" height="28" fill="'+markColor+'"/><text class="mk" x="28" y="34" text-anchor="middle">'+esc2(mark)+'</text>' : '')
    + '<text class="k" x="'+(mark?56:16)+'" y="26">'+esc2(kicker)+'</text>'
    + '<text class="t" x="'+(mark?56:16)+'" y="46">'+esc2(title)+'</text>'
    + '<text class="c" x="16" y="68">'+esc2(counts)+'</text>'
    + (extra||'') + '</g>';
}
function lsGate(i, g){
  const G = LS_GEO, x = G.gates.x0 + i*(G.gates.w+G.gates.gap), y = G.gates.y, w = G.gates.w, h = G.gates.h, s = 14;
  const d = "M"+x+","+y+" L"+(x+w-s)+","+y+" L"+(x+w)+","+(y+h/2)+" L"+(x+w-s)+","+(y+h)+" L"+x+","+(y+h)+" L"+(x+s)+","+(y+h/2)+" Z";
  return '<g class="gate" data-node="gate-'+g.id+'"><path class="body" d="'+d+'"/>'
    + '<text class="gt" x="'+(x+w/2)+'" y="'+(y+h/2-8)+'">'+esc2(g.name)+'</text>'
    + '<text class="gs" x="'+(x+w/2)+'" y="'+(y+h/2+12)+'">median '+esc2(g.ms)+'</text>'
    + (g.counts ? '<text class="gs" x="'+(x+w/2)+'" y="'+(y+h/2+28)+'">'+esc2(g.counts)+'</text>' : '')
    + (typeof lsGateExtra==="function" ? lsGateExtra(g, x, y, w, h) : '')
    + '</g>';
}
function lsSVG(f){
  const G = LS_GEO, R = lsRoutes(G, f);
  let s = '<svg viewBox="0 0 1440 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="How Spiff works: systems of record on the left, the identity gate, five steps of an answer, destinations on the right, the catalogue and keep-and-run below, the inbox tray, and the activity log as the floor">';
  /* column labels */
  s += '<text class="lbl" x="30" y="72">Where records live</text>'
     + '<text class="lbl" x="1060" y="'+(G.gates.y+G.gates.h+24)+'">How an answer is built</text><text class="lbl" x="1060" y="'+(G.gates.y+G.gates.h+38)+'">five steps, every time</text>'
     + '<text class="lbl" x="1130" y="72">Where answers go</text>'
     + '<text class="lbl" x="'+G.cat.x+'" y="388">What Spiff knows</text>'
     + '<text class="lbl" x="'+G.keep.x+'" y="388">What Spiff keeps and runs</text>'
     + '<text class="lbl" x="'+G.tray.x+'" y="418">What is waiting on a person</text>';
  /* routes first, under the boxes */
  R.forEach(function(r){
    s += '<g class="route '+r.style+(r.faint?' faint':'')+'" data-route="'+r.id+'" style="color:'+r.color+'">'
      + r.paths.map(function(p, pi){ return '<path id="ls-p-'+String(r.id).replace(/[^a-z0-9]/gi,'')+'-'+pi+'" d="'+p+'" stroke="'+r.color+'"/>'; }).join('')
      + (r.badge ? '<g class="n" transform="translate('+r.badge.x+','+r.badge.y+')"><circle r="10" stroke="'+r.color+'"/><text fill="'+r.color+'">'+r.id+'</text></g>' : '')
      + '</g>';
  });
  /* the ask pill */
  s += '<g class="pill" transform="translate('+(G.ask.x-30)+','+G.ask.y+')"><rect width="104" height="24"/><text x="52" y="16" text-anchor="middle">you ask</text></g>';
  /* systems */
  f.systems.forEach(function(sy, i){
    const p = G.sys[i];
    s += lsBox("sys", "sys-"+sy.id, p.x, p.y, G.sysW, G.sysH, sy.name.slice(0,2).toUpperCase(), sy.color, sy.kind, sy.name,
      sy.datasets+" datasets · "+sy.reads+" read"+(sy.reads===1?"":"s")+" · "+sy.tools+" tools",
      sy.writes ? '<text class="c" x="'+(G.sysW-16)+'" y="26" text-anchor="end" style="fill:var(--crit);font-weight:700">'+sy.writes+' write</text>' : '');
  });
  s += lsBox("sys absent", "sys-none", G.absent.x, G.absent.y, G.sysW, 64, null, null, "Declared absence", f.absent.name, "0 datasets · 0 reads · 0 tools");
  /* identity */
  s += '<g class="identity box" data-node="identity" transform="translate('+G.ident.x+','+G.ident.y+')"><rect width="'+G.ident.w+'" height="'+G.ident.h+'"/>'
     + '<text class="t" transform="translate(28,'+(G.ident.h/2)+') rotate(-90)" text-anchor="middle">Identity — runs as you</text>'
     + '<text class="c" transform="translate(14,'+(G.ident.h/2)+') rotate(-90)" text-anchor="middle">'+fmt(f.identity.people)+' people · '+f.identity.groups+' groups · '+f.identity.bundles+' bundles</text></g>';
  /* gates */
  f.gates.forEach(function(g, i){ s += lsGate(i, g); });
  /* provider */
  s += lsBox("prov", "provider", G.prov.x, G.prov.y, G.prov.w, G.prov.h, null, null, "Provider · "+(PROVIDER.mode==="byo"?"your own credential":PROVIDER.key.kind==="entra"?"managed identity":"managed key"), f.provider.host+" · "+f.provider.where.replace(/\s*\(.*$/,""), f.provider.spend);
  s += lsBox("ctx", "context", G.ctx.x, G.ctx.y, G.ctx.w, G.ctx.h, null, null, "Context · per person", "Working memory", f.ctx.chats+" conversations · not kept");
  /* catalogue, keep */
  s += lsBox("cat", "catalogue", G.cat.x, G.cat.y, G.cat.w, G.cat.h, null, null, "Catalogue", f.catalogue.datasets+" datasets", f.catalogue.verified+" verified · "+f.catalogue.warnings+" warnings · "+f.catalogue.findings+" findings");
  s += lsBox("keep", "keep", G.keep.x, G.keep.y, G.keep.w, G.keep.h, null, null, "Keep & run", f.keep.saved+" saved answers · "+f.keep.teams+" teams", f.keep.automations+" automations · "+f.keep.clocks+" clocks");
  s += lsBox("tpl", "templates", G.tpl.x, G.tpl.y, G.tpl.w, G.tpl.h, null, null, "Templates · the shape", f.templates.n+" templates", f.templates.verified+" verified · shape only");
  s += lsBox("withheld", "withheld", G.withheld.x, G.withheld.y, G.withheld.w, G.withheld.h, null, null, "Withheld · viewer told", f.withheld.rows+" rows today", f.withheld.masked+" masked · "+f.withheld.denied+" denied");
  /* destinations */
  s += lsBox("dest", "dest-people", G.dest[0].x, G.dest[0].y, G.destW, G.destH, null, null, "People", "You, and subscribers as themselves", "answers · digests · alerts");
  s += lsBox("dest", "dest-comms", G.dest[1].x, G.dest[1].y, G.destW, G.destH, null, null, "Comms & files", f.comms.names.map(function(n){ return n.replace(/^Microsoft |^Google /,""); }).slice(0,3).join(" · ")+(f.comms.names.length>3?" +"+(f.comms.names.length-3):""), f.comms.writes+" write tools · consented per person");
  s += lsBox("dest", "dest-clients", G.dest[2].x, G.dest[2].y, G.destW, G.destH, null, null, "External AI clients", f.clients.join(" · "), "reach in through Spiff as a connector");
  /* inbox tray */
  s += '<g class="tray box" data-node="inbox" transform="translate('+G.tray.x+','+G.tray.y+')"><rect width="'+G.tray.w+'" height="'+G.tray.h+'"/>'
     + '<text class="t" x="16" y="30">Inbox</text><text class="c" x="16" y="52">'+f.inbox.waiting+' decisions · '+f.inbox.unread+' unread notices</text></g>';
  /* the floor */
  s += '<g class="floor box" data-node="log" transform="translate('+G.floor.x+','+G.floor.y+')"><rect width="'+G.floor.w+'" height="'+G.floor.h+'"/>'
     + '<text class="t" x="18" y="22">Activity log — the floor</text><text class="c" x="18" y="40">Every route writes here, as the person it ran as. Append-only: nothing on it is ever edited or removed. '+fmt(f.log.n)+' events in this fixture.</text></g>';
  if(LS.mode==="live" && typeof lsLiveLayer==="function") s += lsLiveLayer(f);
  s += '</svg>';
  return s;
}

/* ---------- what a box or route means (the read-only detail) ---------- */
function lsDetailFor(kind, id, f){
  const D = {
    "sys-directory":{k:"System of record", t:"Directory", d:"Members, localities, subdivisions, households and appointments — who belongs where. Spiff never stores its rows. It is understood through source reads and reached live through the Directory connector, as the person asking.", kv:[["Understood","from "+f.systems[0].reads+" reads · "+f.systems[0].datasets+" datasets"],["Reached","through "+f.systems[0].tools+" tools, read-only"]], open:["Open the dataset list","go('catalog')"]},
    "sys-connect":  {k:"System of record", t:"Connect", d:"Access and role domains, notices, polls, sites and the user activity log. The largest of the four. Reached as one shared read-only account — the one place per-viewer scoping is re-applied by Spiff after the read, which the Sources screen says plainly.", kv:[["Understood",f.systems[1].reads+" read · "+f.systems[1].datasets+" datasets"],["Reached",f.systems[1].tools+" tools"]], open:["Open Sources","go('sources')"]},
    "sys-assemble": {k:"System of record", t:"Assemble", d:"Managed events, event types, invitations and recurrence patterns. Attendance does not live here: check-ins are a Connect concept.", kv:[["Understood",f.systems[2].reads+" reads · "+f.systems[2].datasets+" datasets"],["Reached",f.systems[2].tools+" tools"]], open:["Open Sources","go('sources')"]},
    "sys-orbit":    {k:"System of record", t:"Orbit", d:"Travel bookings, itineraries and accommodation. The one system with write tools — an automation can place a 24-hour hold as you. Signed in per person; when a token expires, that person's answers stop and nobody else's do.", kv:[["Understood",f.systems[3].reads+" read · "+f.systems[3].datasets+" datasets"],["Reached",f.systems[3].tools+" tools · "+f.systems[3].writes+" write"]], open:["Open the connector","openConnector('orbit')"]},
    "sys-none":     {k:"Declared absence", t:f.absent.name, d:f.absent.note+" Drawing the gap keeps a builder from inventing a source for it.", kv:[], open:["Open the dataset","openDataset('budgets')"]},
    "identity":     {k:"The gate", t:"Identity — runs as you", d:"Every runtime route passes here first. Who you are (B2C), your groups, the bundles they grant, and your scope — Country, Locality, Subdivision. Nothing is granted to a person directly; nothing moves without this.", kv:[["People",fmt(f.identity.people)],["Groups",f.identity.groups],["Bundles",f.identity.bundles],["Scope",f.identity.scope]], open:["Open Access administration","go('people')"]},
    "gate-understand":{k:"Step 1 of 5", t:"Understand", d:"The question is read in the agreed words. Definitions apply here — attendance, net movement, active member — so two people asking the same thing get the same arithmetic. A vague question is asked back, not guessed.", kv:[["Definitions",f.catalogue&&GLOSSARY.length]], open:["Open Definitions","go('glossary')"]},
    "gate-fetch":   {k:"Step 2 of 5", t:"Fetch", d:"Rows are fetched through the systems' connectors as the person asking. The Catalogue says what exists and what it means; the connector fetches it live. No shared account anywhere on this step.", kv:[["Data connectors",f.gates[1].counts]], open:["Open Connectors","go('mcp')"]},
    "gate-rules":   {k:"Step 3 of 5", t:"Apply rules", d:"Business rules run on the fetched rows for this viewer: filter to scope, mask, suppress small counts, round. What is withheld is logged as withheld. A rule never knows what a report is supposed to look like; it only knows who may see what.", kv:[["Active rules",RULES.filter(function(r){ return r.status==='Active'; }).length]], open:["Open Business rules","go('rules')"]},
    "gate-compose": {k:"Step 4 of 5", t:"Compose", d:"The model writes the answer and its working from the rows that survived step 3. This is where tokens are spent; the Provider above meters them into NZ$.", kv:[["Model",f.gates[3].counts],["This month",f.provider.spend]], open:["Open AI provider","ADM.tab='provider';go('admin')"]},
    "gate-deliver": {k:"Step 5 of 5", t:"Deliver", d:"To you on screen, to a workspace, to a dashboard tile, or to whoever an automation sends it to — each of whom gets their own re-run.", kv:[], open:["Open Home","go('home')"]},
    "provider":     {k:"Satellite", t:"Provider", d:"Where answers are generated and whose credential pays. "+f.provider.host+" at "+f.provider.where+", as "+f.provider.key+". Inside UBT's own Azure tenancy when hosted at Foundry. Tokens are metered here and shown as dollars on the Budgets tab; nobody in the product sees a token.", kv:[["Spend",f.provider.spend]], open:["Open Budgets","ADM.tab='budgets';go('admin')"]},
    "catalogue":    {k:"What Spiff knows", t:"Catalogue", d:"Every dataset and field Spiff can answer about, each certified by a named person. Fed only by source reads that a person accepted. It describes; it never holds rows.", kv:[["Datasets",f.catalogue.datasets],["Verified",f.catalogue.verified],["Warnings",f.catalogue.warnings],["Findings waiting",f.catalogue.findings]], open:["Open the Data catalogue","go('catalog')"]},
    "keep":         {k:"What Spiff keeps and runs", t:"Keep & run", d:"Saved answers, team workspaces, dashboard tiles, automations and their clocks — anything that re-runs an answer later, for someone, on a schedule. Every re-run goes round route 2 as that person.", kv:[["Saved answers",f.keep.saved],["Teams",f.keep.teams],["Automations",f.keep.automations],["Clocks",f.keep.clocks]], open:["Open Automations","go('autos')"]},
    "dest-people":  {k:"Destination", t:"People", d:"You, on screen; and every subscriber to a shared answer or an automation, each as themselves. Nobody inherits anyone else's scope by being on a list.", kv:[], open:["Open Team workspace","go('library')"]},
    "dest-comms":   {k:"Destination", t:"Comms & files", d:f.comms.names.join(", ")+" — the connectors that act as you: post, send, upload. Each write tool needs your consent and is logged against you.", kv:[["Write tools",f.comms.writes]], open:["Open Connectors","go('mcp')"]},
    "dest-clients": {k:"Destination — and origin", t:"External AI clients", d:f.clients.join(", ")+" connect to Spiff as a connector and ask it questions. They pass the same gate and get what their person could see. Consent per client, revocable.", kv:[["Clients",f.clients.length]], open:["Open Spiff as a connector","MCPV.tab='server';go('mcp')"]},
    "inbox":        {k:"What is waiting on a person", t:"Inbox", d:"Every decision the product asks of someone — requests, reviews, findings, connector requests, expiries, budget alerts — and every notice that needs none. A decision made anywhere is recorded once.", kv:[["Waiting",f.inbox.waiting],["Unread notices",f.inbox.unread]], open:["Open the Inbox","go('inbox')"]},
    "ask":          {k:"Where it starts", t:"You ask", d:"A question in plain words, in Spiff or from an external AI client. Nothing has been read yet. The next stop decides who you are and what you may see.", kv:[], open:["Open Home","go('home')"]},
    "context":      {k:"Working memory", t:"Context", d:"What one conversation needs to hold together: the question, the words Understand resolved, the plan, and the rows Fetch brought back — for this person only. It is how the five steps work together and why a follow-up does not start again. It never decides who may see what: Identity is re-checked on every run.", kv:[["Holds","question · resolved words · plan · fetched rows"],["Never holds","entitlements — re-checked every run"],["Kept","until the chat ends · "+f.ctx.chats+" open now"]], open:["Open Chats","go('chat')"]},
    "templates":    {k:"The shape", t:"Templates", d:"How a class of answer is laid out: which blocks, in what order, with what formats. Bound to datasets and teams; Compose picks the best fit and names it under the answer. A template never touches a number — that is the rule's job — and it can never remove the scope, the as-at or the withheld notice.", kv:[["Templates", f.templates.n+" · "+f.templates.verified+" verified"],["Fixes","the shape at Compose — as Definitions fix the words at Understand and rules fix the rows at Apply rules"]], open:["Open Templates","go('templates')"]},
    "withheld":     {k:"Stopped at Apply rules", t:"Withheld", d:"Everything the business rules kept out of an answer: rows outside the viewer's scope, small counts suppressed, personal fields masked, exports refused. The viewer sees that something was withheld and why. The floor records each one, as withheld — never as if it had not existed.", kv:[["Today",f.withheld.rows+" rows suppressed or masked · "+f.withheld.denied+" refused outright"],["Told","the viewer, every time"],["Logged","every one, on the floor"]], open:["Open the Activity log","go('audit')"]},
    "log":          {k:"The floor", t:"Activity log", d:"Every route writes here as the person it ran as: the read, not just the write; every row returned and every row withheld. Append-only. Reading the log is itself on the log.", kv:[["Events in fixture",fmt(f.log.n)]], open:["Open the Activity log","go('audit')"]}
  };
  if(kind==="route"){
    const r = lsActiveRoutes(f).filter(function(x){ return String(x.id)===String(id); })[0]; if(!r) return null;
    return {k:"Route "+r.id, t:r.name, d:r.sub, kv:r.counts?[["Now",r.counts]]:[], open:["Open where it lives", r.open]};
  }
  return D[id] || null;
}
function lsDetailHTML(kind, id){
  const f = lsFacts(), d = lsDetailFor(kind, id, f);
  if(d && kind!=="route" && typeof lsLiveKV==="function") d.kv = d.kv.concat(lsLiveKV(id));
  if(!d) return '<div class="ls-detail"><div class="dk">Hover or click</div><div class="dt">Any box, gate or route</div><div class="dd">The picture is read-only. Each part says what it is, what passes through it, and where to open it in Spiff. A verb will appear here only if the Inbox would offer it — none do yet.</div></div>';
  return '<div class="ls-detail"><div class="dk">'+esc2(d.k)+'</div><div class="dt">'+esc2(d.t)+'</div><div class="dd">'+esc2(d.d)+'</div>'
    + (d.kv.length ? '<div class="kvlist">'+d.kv.map(function(p){ return '<div class="r"><span class="k">'+esc2(p[0])+'</span><span class="v">'+esc2(String(p[1]))+'</span></div>'; }).join('')+'</div>' : '')
    + (d.open ? '<div style="margin-top:12px"><button class="btn sm" onclick="'+d.open[1]+'">'+I2.chev+' '+esc2(d.open[0])+'</button></div>' : '')
    + '</div>';
}

/* ---------- interaction: hover shows, click pins ---------- */
function lsFocus(kind, id, pin){
  const c = $('#ls-canvas'); if(!c) return;
  if(pin) LS.pin = id==null ? null : {kind:kind, id:id};
  const target = id==null ? LS.pin : {kind:kind, id:id};
  c.querySelectorAll('.on,.rel').forEach(function(e){ e.classList.remove('on','rel'); });
  c.classList.toggle('focus', !!target);
  if(target){
    const f = lsFacts(), routes = lsActiveRoutes(f);
    if(target.kind==="route"){
      const r = routes.filter(function(x){ return String(x.id)===String(target.id); })[0];
      c.querySelectorAll('[data-route="'+target.id+'"]').forEach(function(e){ e.classList.add('on'); });
      if(r) r.touches.forEach(function(n){ const e=c.querySelector('[data-node="'+n+'"]'); if(e) e.classList.add('rel'); });
    } else {
      const e = c.querySelector('[data-node="'+target.id+'"]'); if(e) e.classList.add('on');
      routes.filter(function(r){ return r.touches.indexOf(target.id)>=0; }).forEach(function(r){
        c.querySelectorAll('[data-route="'+r.id+'"]').forEach(function(e){ e.classList.add('on'); });
        r.touches.forEach(function(n){ const x=c.querySelector('[data-node="'+n+'"]'); if(x && n!==target.id) x.classList.add('rel'); });
      });
    }
  }
  const d = $('#ls-detail'); if(d) d.innerHTML = lsDetailHTML(target?target.kind:null, target?target.id:null);
  document.querySelectorAll('.ls-route').forEach(function(el){ el.classList.toggle('on', !!target && target.kind==="route" && el.dataset.route===String(target.id)); });
}
function lsWire(){
  const c = $('#ls-canvas'); if(!c) return;
  c.querySelectorAll('[data-node]').forEach(function(el){
    el.addEventListener('mouseenter', function(){ if(!LS.pin) lsFocus('node', el.dataset.node, false); });
    el.addEventListener('mouseleave', function(){ if(!LS.pin) lsFocus(null, null, false); });
    el.addEventListener('click', function(ev){ ev.stopPropagation(); const same = LS.pin && LS.pin.id===el.dataset.node; lsFocus('node', same?null:el.dataset.node, true); });
  });
  c.querySelectorAll('[data-route]').forEach(function(el){
    el.addEventListener('mouseenter', function(){ if(!LS.pin) lsFocus('route', el.dataset.route, false); });
    el.addEventListener('mouseleave', function(){ if(!LS.pin) lsFocus(null, null, false); });
    el.addEventListener('click', function(ev){ ev.stopPropagation(); const same = LS.pin && String(LS.pin.id)===el.dataset.route; lsFocus('route', same?null:el.dataset.route, true); });
  });
  c.addEventListener('click', function(){ lsFocus(null, null, true); });
}

/* ---------- the page ---------- */
function renderLandscape(){
  LS._lv = null;
  const f = lsFacts(), routes = lsActiveRoutes(f).filter(function(r){ return !r.faint; });
  const routeCards = routes.concat([{id:8, name:"Writing back", color:"var(--crit)", sub:"The only route that changes a system of record — a hold in Orbit, a post in Teams, as you. Not drawn in this version: the map is read-only until the picture is agreed.", notDrawn:true}])
    .map(function(r){ return '<div class="ls-route'+(r.notDrawn?' notdrawn':'')+'" data-route="'+r.id+'" '+(r.notDrawn?'':'onmouseenter="if(!LS.pin)lsFocus(\'route\',\''+r.id+'\',false)" onmouseleave="if(!LS.pin)lsFocus(null,null,false)" onclick="lsFocus(\'route\',\''+r.id+'\',true)"')+'>'
      + '<span class="rn" style="color:'+r.color+';border-color:'+r.color+'">'+r.id+'</span><div><div class="rt">'+esc2(r.name)+(r.notDrawn?' <span class="bdg mut">not drawn yet</span>':(typeof lsLineStatus==="function"?lsLineStatus(String(r.id)):''))+'</div><div class="rs">'+esc2(r.sub)+'</div></div></div>'; }).join('');
  $('#view-landscape').innerHTML =
      pageHead({eyebrow:"Help", title:"How Spiff works",
        desc:"How Spiff works, on one page: where records live, the gate every question passes, the five steps an answer takes, where answers go, and what sits underneath. Every count is the same number the screens show. Read-only — this picture explains and points; it does not configure.",
        badges: bdg(f.systems.length+" systems of record","mut","db") + bdg(fmt(f.identity.people)+" people behind one gate","ok","shield") + bdg(f.catalogue.datasets+" datasets","mut","grid") + bdg(f.inbox.waiting+" decisions waiting","warn","bolt"),
        acts:'<div class="ls-pic seg2"><button class="'+(LS.picture==="metro"?"on":"")+'" onclick="LS.picture=\'metro\';renderLandscape()">Metro</button><button class="'+(LS.picture==="boxes"?"on":"")+'" onclick="LS.picture=\'boxes\';renderLandscape()" title="The same facts as boxes and routes">Boxes</button></div>'
          + '<div class="ls-mode seg2"><button class="'+(LS.mode==="arch"?"on":"")+'" onclick="LS.mode=\'arch\';renderLandscape()">Map</button><button class="'+(LS.mode==="live"?"on":"")+'" onclick="LS.mode=\'live\';renderLandscape()">'+I2.bolt+' Today</button></div>'
          + (LS.mode==="live" ? '<label class="ls-motion">Motion '+sw(!LS.paused, 'lsMotion(LS.paused)', 'Dots move')+'</label>' : '')})
    + (LS.mode==="live" ? lsLiveStrip(f) : '')
    + '<div class="ls-canvas" id="ls-canvas">'+((LS.picture==="metro" && typeof lsMetroSVG==="function") ? lsMetroSVG(f) : lsSVG(f))+'</div>'
    + '<div class="ls-below">'
    +   '<div>'+(LS.mode==="live" ? lsLiveFeed(f) : '<div class="lbl2">The routes — and the parts of route 2</div><div class="ls-routes">'+routeCards+'</div>')+'</div>'
    +   '<div class="ls-side">'
    +     panel("What you are looking at", '<div id="ls-detail">'+lsDetailHTML(null,null)+'</div>', {icon:"eye"})
    +     (LS.mode==="live" && typeof lsLineStatusPanel==="function" ? lsLineStatusPanel(f) : '')
    +     panel("Conventions", '<div class="ls-conv">'
    +        '<div><b>Left to right</b> is the way a question travels. <b>Down</b> is what Spiff keeps.</div>'
    +        '<div style="margin-top:6px"><b>A box</b> is a system or a store. <b>A gate</b> is a step every answer takes. <b>A route</b> is a numbered sentence; hover any to see what it touches, click to pin.</div>'
    +        '<div style="margin-top:6px"><b>Solid</b> lines carry rows. <b>Dashed</b> lines carry shape or requests, never rows. <b>Dotted</b> lines carry decisions and meters.</div>'
    +        '<div style="margin-top:6px"><b>Definitions</b> are applied at Understand; <b>business rules</b> at Apply rules — for whoever is asking, every time. Scope was fixed at the gate on the left.</div>'
    +        '<div style="margin-top:6px"><b>The floor</b> is the activity log: every route writes to it.</div>'
    +        '<div style="margin-top:6px"><b>Counts</b> are today\'s, from the same data as the screens. <b>Medians</b> are estimates.</div>'
    +        (LS.mode==="live" ? '<div style="margin-top:6px"><b>Live:</b> one dot per event in today\'s activity log, on the route it took; red dots were refused or withheld. A numbered badge is something <b>held</b> — stopped and waiting on a person. Under each gate: what it did today.</div>' : '')
    +        '<div style="margin-top:6px"><b>Not on the map:</b> Admin (it configures the boxes; the map points to it), datasets, people, rules — those stay in their lists.</div>'
    +      '</div>', {icon:"book"})
    +   '</div>'
    + '</div>';
  lsWire();
  if(LS.mode==="live" && LS.paused && typeof lsMotion==="function") lsMotion(false);
  if(LS.pin) lsFocus(LS.pin.kind, LS.pin.id, false);
}
V2ROUTES.landscape = renderLandscape;
</script>
