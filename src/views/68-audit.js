<script>
/* =====================================================================
   SPIFF v2 — ACTIVITY LOG
   The screen that proves the promise: every dataset, question, run and
   access decision is written down — including the reads that most
   reporting tools never record at all.
   ===================================================================== */

const AUDIT_UI = {
  q:"", groups:[], actor:"all", dataset:"all", outcome:"all",
  range:"7d", mode:"stream", sort:"ts", dir:"desc",
  trace:"sa-attend", traceFilter:null
};
const AUDIT_RANGES = [["1h","Last hour"],["today","Today"],["7d","7 days"],["30d","30 days"]];
const AUDIT_COLS = [
  ["ts","When",""],["kind","Event",""],["actor","Who",""],["runAs","Ran as",""],
  ["dataset","Dataset",""],["outcome","Outcome",""],["rows","Rows","num"],
  ["suppressed","Withheld","num"],["ms","Took","num"],["source","Source",""]
];

/* ---------- one plain-English sentence per event ---------- */
const AUDIT_PHRASE = {
  "q.asked":"{a} asked {s}",
  "q.answered":"{a} got an answer to {s}",
  "q.refined":"{a} refined {s}",
  "q.followup":"{a} followed up with {s}",
  "q.chart":"{a} changed the chart on {s}",
  "q.saved":"{a} saved {s}",
  "q.opened":"{a} opened the shared answer {s}, which re-ran under their own identity",
  "q.export":"{a} exported {s}",
  "q.export_denied":"{a} was refused an export of {s}",
  "d.query":"{a} queried {d}",
  "d.rows":"{d} returned {n} rows to {a}",
  "d.suppressed":"{a} had rows withheld from {d}",
  "d.masked":"{a} saw a masked column in {d}",
  "d.denied":"{a} was refused {d}",
  "d.sample":"{a} viewed the sample rows of {d}",
  "g.rule_fired":"The {r} fired while {a} was reading {d}",
  "g.rule_created":"{a} published a new rule, {s}",
  "g.rule_edited":"{a} edited the live rule {s}",
  "g.rule_suspended":"{a} suspended the rule {s}",
  "g.certified":"{a} certified {d}",
  "g.cert_broken":"{d} lost its certification",
  "g.definition":"{a} changed an agreed definition, {s}",
  "a.requested":"{a} asked for access to {s}",
  "a.approved":"{a} approved access for {s}",
  "a.completed":"The grant for {s} completed on {d}",
  "a.declined":"{a} declined access for {s}",
  "a.expired":"The grant held by {s} on {d} expired",
  "a.revoked":"{a} revoked access for {s} on {d}",
  "a.group":"{a} changed who is in {s}",
  "a.role":"{a} assigned the bundle {s}",
  "a.review":"{a} signed off {s}",
  "a.sim":"{a} previewed Spiff as {s}",
  "au.created":"{a} created the automation {s}",
  "au.started":"{s} started, running as {a}",
  "au.ok":"{s} ran and delivered, as {a}",
  "au.fail":"{s} stopped rather than deliver, running as {a}",
  "au.cloned":"{a} took their own copy of {s}",
  "au.shared":"{a} shared {s} — everyone who takes it gets their own copy",
  "au.sub_add":"{a} subscribed to {s}",
  "au.sub_rm":"{a} unsubscribed from {s}",
  "au.threshold":"{s} crossed its threshold and told {a}",
  "c.connected":"{a} connected {s}",
  "c.tool":"Spiff called {s} as {a}",
  "c.tool_denied":"Spiff was blocked from calling {s} for {a}",
  "c.consent":"{a} let {s} act on their behalf",
  "c.consent_rev":"{a} revoked consent on {s}",
  "c.tools_changed":"{a} changed what Spiff may do in {s}",
  "x.quota":"{a} changed a quota, {s}",
  "x.retention":"A retention rule ran on {s}",
  "x.capability":"{a} enabled {s}",
  "x.policy":"{a} changed a policy, {s}"
};

function auditSentence(ev){
  const d = ev.dataset ? ds(ev.dataset) : null;
  let t = AUDIT_PHRASE[ev.kind] || "{a} — {s}";
  t = t.replace("{a}", '<b>'+esc2(ev.actor)+'</b>')
       .replace("{s}", ev.subject ? '<i>'+esc2(ev.subject)+'</i>' : 'this')
       .replace("{d}", d ? '<b>'+esc2(d.name)+'</b>' : 'a dataset')
       .replace("{n}", fmt(ev.rows||0))
       .replace("{r}", esc2(auditRuleLabel(ev.rule)));
  const tail = [];
  if(ev.suppressed) tail.push(fmt(ev.suppressed)+' row'+(ev.suppressed===1?'':'s')+' suppressed'+(ev.rule?' by the '+esc2(auditRuleLabel(ev.rule)):''));
  if(ev.masked)     tail.push(ev.masked+' column'+(ev.masked===1?'':'s')+' masked');
  if(ev.outcome==="denied" && ev.rule) tail.push('refused by the '+esc2(auditRuleLabel(ev.rule)));
  return t + (tail.length ? '; '+tail.join('; ') : '');
}

/* ---------- small builders ---------- */
/* The actor list grows with the organisation — every person who has ever asked
   anything appears in it. Past a couple of dozen it becomes a scroll, so these
   hand off to the shared type-to-filter picker. */
function auditSelect(label,id,opts,val,js,pickFn){
  if(pickFn && opts.length > 21){
    return '<div style="min-width:190px;flex:1">'
      + pickList(label, opts.filter(o=>o[0]!=="all"), val, pickFn, {allLabel:opts[0] ? opts[0][1] : "All"})
      + '</div>';
  }
  return '<div style="min-width:158px;flex:1"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:5px">'+esc2(label)+'</div>'
    +'<select id="'+id+'" onchange="'+js+'" style="width:100%;border:1px solid var(--hair);background:var(--ground);border-radius:9px;padding:8px 11px;font-family:inherit;font-size:13.5px;color:var(--ink)">'
    +opts.map(o=>'<option value="'+esc2(o[0])+'"'+(o[0]===val?' selected':'')+'>'+esc2(o[1])+'</option>').join('')
    +'</select></div>';
}
function auditPickActor(v){ auditSetField('actor', v); }
function auditPickDataset(v){ auditSetField('dataset', v); }
function auditSeg(id,items,val,fn){
  return '<div class="seg2" id="'+id+'">'+items.map(i=>'<button class="'+(i[0]===val?'on':'')+'" onclick="'+fn+'(\''+i[0]+'\')">'+(i[2]?I2[i[2]]:'')+esc2(i[1])+'</button>').join('')+'</div>';
}
function auditDatasetChip(id){
  const d = ds(id); if(!d) return '';
  return '<span class="bdg mut clickable" onclick="event.stopPropagation();openDataset(\''+esc2(id)+'\')">'+I2.db+esc2(d.name)+'</span>';
}
function auditRuleChip(id){
  return '<span class="bdg warn clickable" onclick="event.stopPropagation();openRule(\''+esc2(id)+'\')">'+I2.shield+esc2(auditRuleLabel(id))+'</span>';
}

/* ---------- filter state ---------- */
function auditActive(){
  let n = 0;
  if(AUDIT_UI.q) n++;
  n += AUDIT_UI.groups.length;
  if(AUDIT_UI.actor   !== "all") n++;
  if(AUDIT_UI.dataset !== "all") n++;
  if(AUDIT_UI.outcome !== "all") n++;
  if(AUDIT_UI.range   !== "7d")  n++;
  if(AUDIT_UI.traceFilter) n++;
  return n;
}
function auditSetQ(v){ AUDIT_UI.q = v; auditPaint(); }
function auditSetField(f,v){ AUDIT_UI[f] = v; auditPaint(); }
function auditSetRange(v){ AUDIT_UI.range = v; auditPaint(); }
function auditSetMode(m){ AUDIT_UI.mode = m; auditPaint(); }
function auditToggleGroup(g){
  const i = AUDIT_UI.groups.indexOf(g);
  if(i === -1) AUDIT_UI.groups.push(g); else AUDIT_UI.groups.splice(i,1);
  auditPaint();
}
function auditClearTrace(){ AUDIT_UI.traceFilter = null; auditPaint(); }
function auditClear(){
  AUDIT_UI.q=""; AUDIT_UI.groups=[]; AUDIT_UI.actor="all"; AUDIT_UI.dataset="all";
  AUDIT_UI.outcome="all"; AUDIT_UI.range="7d"; AUDIT_UI.traceFilter=null;
  const box=$('#audit-search'); if(box) box.value="";
  ["audit-actor","audit-dataset","audit-outcome"].forEach(id=>{const s=$('#'+id); if(s) s.value="all";});
  auditPaint(); toast('Filters cleared');
}
function auditSortBy(col){
  if(AUDIT_UI.sort === col) AUDIT_UI.dir = (AUDIT_UI.dir === "asc" ? "desc" : "asc");
  else { AUDIT_UI.sort = col; AUDIT_UI.dir = (col==="rows"||col==="suppressed"||col==="ms") ? "desc" : "asc"; }
  auditPaint();
}

/* ---------- results ---------- */
function auditSorted(list){
  const c = AUDIT_UI.sort, s = AUDIT_UI.dir === "asc" ? 1 : -1;
  return list.slice().sort(function(a,b){
    let x = a[c], y = b[c];
    if(c === "kind"){ x = auditKind(a.kind).label; y = auditKind(b.kind).label; }
    if(c === "dataset"){ x = a.dataset?ds(a.dataset).name:"~"; y = b.dataset?ds(b.dataset).name:"~"; }
    if(x == null) x = -1; if(y == null) y = -1;
    return x < y ? -s : x > y ? s : 0;
  });
}
function auditEventHTML(ev){
  const k = auditKind(ev.kind), oc = AUDIT_OUTCOMES[ev.outcome] || AUDIT_OUTCOMES.ok;
  const sc = AUDIT_SOURCES[ev.source] || AUDIT_SOURCES.chat;
  return '<div class="tev clickable" onclick="auditOpen(\''+ev.id+'\')">'
    +'<div class="td3 '+oc.cls+'"></div>'
    +'<div style="display:flex;gap:11px;align-items:flex-start">'
      +avatar(ev.actor,'sm')
      +'<div style="flex:1;min-width:0">'
        +'<div class="tt2" style="font-weight:500;line-height:1.5">'+auditSentence(ev)+'</div>'
        +'<div class="rowflex" style="gap:6px;margin-top:6px">'
          +bdg(k.label,k.color,k.icon)
          +(ev.dataset ? auditDatasetChip(ev.dataset) : '')
          +(ev.outcome !== "ok" ? bdg(oc.label,oc.cls) : '')
          +(ev.source !== "chat" ? bdg(sc.label,'mut',sc.icon) : '')
        +'</div>'
      +'</div>'
      +'<div class="tw" style="flex:none;text-align:right;line-height:1.7">'+esc2(ev.when)
        +'<div style="opacity:.55">'+esc2(ev.trace)+'</div></div>'
    +'</div></div>';
}
function auditTableHTML(list){
  const head = AUDIT_COLS.map(c=>{
    const on = AUDIT_UI.sort === c[0];
    return '<th class="'+c[2]+' clickable" onclick="auditSortBy(\''+c[0]+'\')">'+esc2(c[1])
      +(on ? ' <span style="color:var(--accent)">'+(AUDIT_UI.dir==="asc"?'&#9650;':'&#9660;')+'</span>' : '')+'</th>';
  }).join('');
  const rows = list.map(function(ev){
    const k = auditKind(ev.kind), oc = AUDIT_OUTCOMES[ev.outcome] || AUDIT_OUTCOMES.ok;
    const d = ev.dataset ? ds(ev.dataset) : null;
    return '<tr class="clk" onclick="auditOpen(\''+ev.id+'\')">'
      +'<td class="tech" style="white-space:nowrap">'+esc2(ev.when)+'</td>'
      +'<td>'+bdg(k.label,k.color,k.icon)+'</td>'
      +'<td><div class="rowflex" style="gap:7px;flex-wrap:nowrap">'+avatar(ev.actor,'sm')+'<span style="font-weight:600">'+esc2(ev.actor)+'</span></div></td>'
      +'<td class="tech">'+esc2(ev.runAs)+'</td>'
      +'<td>'+(d ? esc2(d.name) : '<span class="mutedtext">—</span>')+'</td>'
      +'<td>'+bdg(oc.label,oc.cls)+'</td>'
      +'<td class="num">'+(ev.rows==null?'—':fmt(ev.rows))+'</td>'
      +'<td class="num">'+(ev.suppressed||ev.masked ? '<span style="color:var(--warn);font-weight:600">'+(ev.suppressed?fmt(ev.suppressed)+'r':'')+(ev.suppressed&&ev.masked?' ':'')+(ev.masked?ev.masked+'c':'')+'</span>' : '—')+'</td>'
      +'<td class="num">'+(ev.ms==null?'—':(ev.ms>=1000?(ev.ms/1000).toFixed(1)+' s':ev.ms+' ms'))+'</td>'
      +'<td class="tech">'+esc2((AUDIT_SOURCES[ev.source]||{label:ev.source}).label)+'</td>'
    +'</tr>';
  }).join('');
  return '<div class="dtbl-wrap scrollx"><table class="dtbl"><thead><tr>'+head+'</tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function auditResultsHTML(list){
  if(!list.length){
    return '<div class="empty2">'+I2.filter
      +'<div class="et">Nothing matches those filters</div>'
      +'<div>The log holds '+AUDIT.length+' events across the last five days. Widen the time range, or drop a filter.</div>'
      +'<div style="margin-top:15px"><button class="btn" onclick="auditClear()">Clear all filters</button></div></div>';
  }
  if(AUDIT_UI.mode === "table") return auditTableHTML(auditSorted(list));
  let out = "", day = null;
  list.forEach(function(ev){
    const key = ev.ts.slice(0,10);
    if(key !== day){
      day = key;
      const n = list.filter(x=>x.ts.slice(0,10)===key).length;
      out += '<div style="margin:'+(out?'6px':'0')+' 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);font-weight:700">'
           + esc2(auditDayLabel(key))+' <span class="mono" style="opacity:.55;letter-spacing:0">'+n+'</span></div>';
    }
    out += auditEventHTML(ev);
  });
  return '<div style="padding:20px 18px 8px"><div class="tline">'+out+'</div></div>';
}
function auditDayLabel(key){
  const todayKey = AUDIT_NOW.toISOString().slice(0,10);
  const yKey = new Date(AUDIT_NOW.getTime()-864e5).toISOString().slice(0,10);
  const long = new Date(key+"T12:00:00Z").toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});
  return key===todayKey ? 'Today · '+long : key===yKey ? 'Yesterday · '+long : long;
}
function auditChipsHTML(){
  const counts = auditGroupCounts(AUDIT_UI.range);   /* one pass for every chip */
  return AUDIT_GROUPS.map(function(g){
    const n = counts[g.id] || 0;
    const on = AUDIT_UI.groups.indexOf(g.id) !== -1;
    return '<button class="fchip2'+(on?' on':'')+'" title="'+esc2(g.desc)+'" onclick="auditToggleGroup(\''+g.id+'\')">'+esc2(g.label)+' <span class="mono" style="opacity:.65">'+n+'</span></button>';
  }).join('')
  + (AUDIT_UI.traceFilter ? '<button class="fchip2 on" onclick="auditClearTrace()">'+I2.link+'Trace '+esc2(AUDIT_UI.traceFilter)+' &#10005;</button>' : '');
}
function auditPaint(){
  const list = auditFor({
    q:AUDIT_UI.q, groups:AUDIT_UI.groups, actor:AUDIT_UI.actor, dataset:AUDIT_UI.dataset,
    outcome:AUDIT_UI.outcome, range:AUDIT_UI.range, trace:AUDIT_UI.traceFilter
  });
  const r = $('#audit-results'); if(r) r.innerHTML = auditResultsHTML(list);
  const c = $('#audit-count'); if(c) c.innerHTML = '<b>'+list.length+'</b> of '+AUDIT.length+' events';
  const f = $('#audit-active'); if(f) f.innerHTML = auditActive()
    ? '<span class="bdg info">'+auditActive()+' filter'+(auditActive()===1?'':'s')+' on</span> <button class="btn sm ghost" onclick="auditClear()">Clear</button>'
    : '<span class="mutedtext">No filters — showing the last 7 days</span>';
  const ch = $('#audit-chips'); if(ch) ch.innerHTML = auditChipsHTML();
  const rg = $('#audit-range'); if(rg) rg.querySelectorAll('button').forEach(function(b,i){ b.classList.toggle('on', AUDIT_RANGES[i][0] === AUDIT_UI.range); });
  const md = $('#audit-mode'); if(md) md.querySelectorAll('button').forEach(function(b,i){ b.classList.toggle('on', (i===0?'stream':'table') === AUDIT_UI.mode); });
}

/* ---------- the detail modal ---------- */
function auditOpen(id){
  const ev = auditById(id); if(!ev) return;
  const k = auditKind(ev.kind), oc = AUDIT_OUTCOMES[ev.outcome] || AUDIT_OUTCOMES.ok;
  const sc = AUDIT_SOURCES[ev.source] || AUDIT_SOURCES.chat, d = ev.dataset ? ds(ev.dataset) : null;
  const known = !!personByName(ev.actor);
  const withheld = ev.suppressed || ev.masked;

  const stat = (label,val,cls) => '<div style="flex:1;min-width:110px;background:var(--hair2);border-radius:11px;padding:11px 13px">'
    +'<div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700">'+esc2(label)+'</div>'
    +'<div class="mono" style="font-size:19px;font-weight:600;margin-top:4px'+(cls?';color:var('+cls+')':'')+'">'+val+'</div></div>';

  openModal(
    '<h3>'+esc2(k.label)+'</h3>'
    +'<div class="msub">'+esc2(k.desc)+'</div>'
    +'<div class="defblock" style="margin-bottom:16px">'+auditSentence(ev)+'</div>'
    +'<div class="rowflex" style="gap:8px;margin-bottom:16px">'+bdg(oc.label,oc.cls)+bdg(sc.label,'mut',sc.icon)
      +(d?auditDatasetChip(ev.dataset):'')+'<span class="bdg mut">'+esc2(ev.when)+'</span></div>'

    +'<div style="border:1px solid var(--hair);border-radius:12px;padding:13px 15px;margin-bottom:14px">'
      +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:10px">Whose identity this ran as</div>'
      +personChip(ev.actor, ev.actorTitle)
      +'<div class="mutedtext" style="margin-top:9px;line-height:1.6">Ran as <b style="color:var(--ink)">'+esc2(ev.runAs)+'</b>. '
      +(ev.kind==="a.sim"
        ? 'A simulation is a preview. No rows were returned to anyone, nothing was shared, and '+esc2(ev.subject||'the person previewed')+' was never signed in.'
        : 'Spiff re-checked identity and permissions against Directory at the moment this ran — not against a cached entitlement list.')+'</div>'
    +'</div>'

    +'<div class="rowflex" style="gap:10px;margin-bottom:14px;align-items:stretch">'
      +stat('Rows returned', ev.rows==null?'—':fmt(ev.rows), null)
      +stat('Rows withheld', ev.suppressed?fmt(ev.suppressed):'0', ev.suppressed?'--warn':null)
      +stat('Columns masked', ev.masked?ev.masked:'0', ev.masked?'--warn':null)
      +stat('Took', ev.ms==null?'—':(ev.ms>=1000?(ev.ms/1000).toFixed(1)+' s':ev.ms+' ms'), null)
    +'</div>'

    +(ev.rule
      ? '<div style="margin-bottom:14px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:8px">Rules that fired</div>'
        +'<div class="rowflex" style="gap:7px">'+auditRuleChip(ev.rule)+'</div></div>'
      : '')

    +callout(withheld ? 'warn' : (ev.outcome==="denied" ? 'crit' : 'mut'),
        withheld
          ? '<b>Withheld, not missing.</b> '+esc2(ev.detail)
          : (ev.outcome==="denied"
              ? '<b>Refused before anything was read.</b> '+esc2(ev.detail)
              : esc2(ev.detail)))

    +'<div class="kv" style="margin-top:16px">'
      +'<dt>Event</dt><dd class="mono">'+esc2(ev.id)+'</dd>'
      +'<dt>Trace</dt><dd class="mono">'+esc2(ev.trace)+'</dd>'
      +'<dt>Recorded</dt><dd class="mono">'+esc2(ev.ts.replace("T"," ").replace("Z"," UTC"))+'</dd>'
      +'<dt>Source</dt><dd>'+esc2(sc.desc)+'</dd>'
      +'<dt>Address</dt><dd class="mono">'+esc2(ev.ip)+'</dd>'
      +(ev.subject?'<dt>Subject</dt><dd>'+esc2(ev.subject)+'</dd>':'')
    +'</div>'

    +'<div class="rowflex" style="gap:8px;margin-top:16px">'
      +(d?'<button class="btn sm" onclick="closeModal();openDataset(\''+esc2(ev.dataset)+'\')">'+I2.db+'Open dataset</button>':'')
      +(ev.rule?'<button class="btn sm" onclick="closeModal();openRule(\''+esc2(ev.rule)+'\')">'+I2.shield+'Open rule</button>':'')
      +(known?'<button class="btn sm" onclick="closeModal();openPerson(\''+esc2(ev.actor)+'\')">'+I2.people+'Open '+esc2(ev.actor.split(" ")[0])+'</button>':'')
    +'</div>'
    +modalFoot('Close','Show the whole trace','auditShowTrace(\''+esc2(ev.trace)+'\')')
  , 640);
}
function auditShowTrace(tr){
  closeModal(); AUDIT_UI.traceFilter = tr; AUDIT_UI.range = "30d"; auditPaint();
  toast('Filtered to trace '+tr);
  const el = $('#audit-results'); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth",block:"start"});
}
function auditExport(what){
  toast(what==="siem" ? 'Streaming to the security log — 5-second batches, admin only'
     : 'Export queued. Exporting the activity log is itself an event on the activity log.');
}
function auditJump(id){ const el=$('#'+id); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth",block:"start"}); }

/* ---------- trace a number ---------- */
function auditPickTrace(id){ AUDIT_UI.trace = id; const el=$('#audit-trace'); if(el) el.innerHTML = auditTraceHTML(); }
function auditTraceHTML(){
  const t = auditTrace(AUDIT_UI.trace);
  const cards = AUDIT_TRACES.map(x=>'<div class="pickcard'+(x.id===t.id?' on':'')+'" onclick="auditPickTrace(\''+x.id+'\')">'
      +'<div class="pi">'+I2.star+'</div><div><div class="pn2">'+esc2(x.title)+'</div>'
      +'<div class="pd2">'+esc2(x.owner)+' · saved '+esc2(x.saved.replace(/,.*$/,''))+'</div></div></div>').join('');

  const step = (dot,title,body) => '<div class="tev"><div class="td3 '+dot+'"></div><div class="tt2">'+title+'</div><div class="ts2" style="line-height:1.6">'+body+'</div></div>';

  const chain = '<div class="tline">'
    + step('','The question',  '<i>'+esc2(t.question)+'</i> — asked by '+esc2(t.owner)+', '+esc2(t.ownerTitle)+', and saved on '+esc2(t.saved)+'.')
    + step('','Datasets read', '<div class="rowflex" style="gap:6px;margin-top:5px">'+t.datasets.map(auditDatasetChip).join('')+'</div>')
    + step('warn','Rules that fired','<div class="rowflex" style="gap:6px;margin-top:5px">'+t.rules.map(auditRuleChip).join('')+'</div>')
    + step('','Agreed definition','<b>'+esc2(t.definition)+'</b> — '+esc2(t.definitionNote)+' <span class="clickable" style="color:var(--accent);font-weight:600" onclick="go(\'glossary\')">See the definition</span>')
    + step(t.suppressed?'warn':'ok','What came back, and what did not',
        fmt(t.scanned)+' rows matched the question. '+fmt(t.rows)+' reached '+esc2(t.owner.split(" ")[0])+'. '
        +(t.suppressed?fmt(t.suppressed)+' were withheld and named. ':'None were withheld. ')
        +(t.masked?t.masked+' column'+(t.masked===1?'':'s')+' came back masked. ':'No columns were masked. ')
        +'Took '+(t.ms/1000).toFixed(1)+' seconds.')
    + step('','Where it has gone since', t.viewers.length+' people have opened it. Each one re-ran it as themselves — the table below is what each of them actually saw.')
    +'</div>';

  const viewers = '<div class="dtbl-wrap scrollx"><table class="dtbl"><thead><tr>'
    +'<th>Viewer</th><th>Opened</th><th class="num">Rows they saw</th><th class="num">Withheld</th><th>Outcome</th><th>What that means</th></tr></thead><tbody>'
    +t.viewers.map(function(v){
      const oc = AUDIT_OUTCOMES[v.outcome] || AUDIT_OUTCOMES.ok;
      const known = !!personByName(v.name);
      return '<tr'+(known?' class="clk" onclick="openPerson(\''+esc2(v.name)+'\')"':'')+'>'
        +'<td><div class="rowflex" style="gap:8px;flex-wrap:nowrap">'+avatar(v.name,'sm')+'<span style="font-weight:600">'+esc2(v.name)+'</span></div></td>'
        +'<td class="tech" style="white-space:nowrap">'+esc2(v.when)+'</td>'
        +'<td class="num"'+(v.rows===0?' style="color:var(--crit);font-weight:700"':'')+'>'+fmt(v.rows)+'</td>'
        +'<td class="num">'+(v.suppressed?'<span style="color:var(--warn);font-weight:600">'+fmt(v.suppressed)+'</span>':'—')+(v.masked?' <span class="mutedtext">'+v.masked+'c</span>':'')+'</td>'
        +'<td>'+bdg(oc.label,oc.cls)+'</td>'
        +'<td style="max-width:340px;white-space:normal;line-height:1.5">'+esc2(v.note)+'</td></tr>';
    }).join('')+'</tbody></table></div>';

  return '<div class="g3" style="margin-bottom:18px">'+cards+'</div>'
    +'<div class="rowflex" style="gap:18px;align-items:flex-start;margin-bottom:16px">'
      +'<div><div class="count-lg">'+esc2(t.number)+'</div><div class="mutedtext" style="margin-top:5px">'+esc2(t.numberLabel)+'</div></div>'
      +'<div class="sp"></div>'
      +'<button class="btn sm" onclick="auditShowTrace(\''+esc2(t.trace)+'\')">'+I2.log+'Show these '+t.events.length+' events in the log</button>'
    +'</div>'
    +callout('info','<b>Why this number is this number.</b> '+esc2(t.story))
    +(t.warning?'<div style="margin-top:12px">'+callout('warn','<b>Under review.</b> '+esc2(t.warning))+'</div>':'')
    +'<div class="hairline"></div>'
    +chain
    +'<div class="hairline"></div>'
    +'<div style="font-family:var(--dsp);font-size:15.5px;font-weight:600;margin-bottom:4px">Who has opened it, and what each of them saw</div>'
    +'<div class="mutedtext" style="margin-bottom:13px">Sharing organised this answer; it did not widen anyone\'s access. Every row below is a separate run under a separate identity.</div>'
    +viewers;
}

/* ---------- retention and export ---------- */
function auditRetentionHTML(){
  const rows = AUDIT_RETENTION.map(r=>'<tr><td style="font-weight:600">'+esc2(auditGroup(r.group).label)+'</td>'
    +'<td class="mono" style="white-space:nowrap">'+esc2(r.keep)+'</td>'
    +'<td style="white-space:normal;line-height:1.5" class="mutedtext">'+esc2(r.why)+'</td></tr>').join('');
  const readers = AUDIT_READERS.map(r=>'<div class="swrow"><div class="sl"><div class="sn">'+esc2(r.who)+'</div>'
    +'<div class="sd">'+esc2(r.note)+'</div></div>'+bdg(r.scope,r.cls)+'</div>').join('');
  return '<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Category</th><th>Kept for</th><th>Why that long</th></tr></thead><tbody>'+rows+'</tbody></table></div>'
    +'<div style="padding:16px 18px 4px"><div style="font-family:var(--dsp);font-size:15px;font-weight:600;margin-bottom:2px">Who can read this log</div>'
    +readers
    +'<div style="margin-top:14px">'+callout('ok','<b>You can always read your own.</b> Every event that names you is readable by you, without asking anyone and without an admin in the middle.')+'</div>'
    +'<div style="margin-top:10px">'+callout('mut','Reading the activity log is itself an event on the activity log. Your visit today is on it, and so is this export button if you press it.')+'</div>'
    +'<div class="rowflex" style="gap:8px;margin:16px 0 4px">'
      +'<button class="btn sm" onclick="auditExport(\'csv\')">'+I2.down+'Export this view (CSV)</button>'
      +'<button class="btn sm" onclick="auditExport(\'json\')">'+I2.down+'Export 30 days (JSON)</button>'
      +'<button class="btn sm" onclick="auditExport(\'siem\')">'+I2.link+'Stream to security log</button>'
    +'</div></div>';
}

/* ---------- the page ---------- */
/* The filter options are a property of the whole log, not of the current
   filters, so they were being recomputed by scanning every event twice on
   every paint. Computed once instead. */
let AUDIT_OPTS = null;
function auditOptions(){
  if(AUDIT_OPTS) return AUDIT_OPTS;
  const actors = [...new Set(AUDIT.map(e=>e.actor))].sort();
  const dsets  = [...new Set(AUDIT.map(e=>e.dataset).filter(Boolean))].sort(function(a,b){ return ds(a).name < ds(b).name ? -1 : 1; });
  AUDIT_OPTS = {actors:actors, dsets:dsets};
  return AUDIT_OPTS;
}
function renderAudit(){
  const _o = auditOptions(), actors = _o.actors, dsets = _o.dsets;

  $('#view-audit').innerHTML =
    pageHead({
      eyebrow:"Govern",
      title:"Activity log",
      desc:"Spiff logs the read, not just the write — every question asked, every dataset queried, every row returned and every row withheld, recorded as the person it ran as.",
      badges: bdg(AUDIT.length+' events · last 5 days','mut','log')
             +bdg('Reads, queries and exports all logged','ok','eye')
             +bdg('You can always read your own','info','shield'),
      acts:'<button class="btn" onclick="auditJump(\'audit-trace-panel\')">'+I2.link+'Trace a number</button>'
          +'<button class="btn pri" onclick="auditExport(\'csv\')">'+I2.down+'Export</button>'
    })

    +'<div class="g3" style="margin-bottom:18px">'
      +AUDIT_STATS.tiles.map(t=>kpi(t.label, fmt(t.value), esc2(t.sub)+sparkline(t.spark), t.delta)).join('')
    +'</div>'

    +panel('Filter the log',
        '<div class="bigsearch">'+I2.search+'<input id="audit-search" placeholder="Search people, questions, datasets, rules, trace ids…" oninput="auditSetQ(this.value)"></div>'
       +'<div class="chipbar" id="audit-chips" style="margin-top:13px">'+auditChipsHTML()+'</div>'
       +'<div class="rowflex" style="gap:12px;margin-top:14px;align-items:flex-end">'
         +auditSelect('Who','audit-actor',[["all","Anyone ("+actors.length+")"]].concat(actors.map(a=>[a,a])),AUDIT_UI.actor,"auditSetField('actor',this.value)",'auditPickActor')
         +auditSelect('Dataset','audit-dataset',[["all","Any dataset"]].concat(dsets.map(i=>[i,ds(i).name])),AUDIT_UI.dataset,"auditSetField('dataset',this.value)",'auditPickDataset')
         +auditSelect('Outcome','audit-outcome',[["all","Any outcome"],["ok","Delivered"],["partial","Partial — something withheld"],["denied","Denied"],["error","Stopped"]],AUDIT_UI.outcome,"auditSetField('outcome',this.value)")
         +'<div><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:5px">When</div>'
           +auditSeg('audit-range',AUDIT_RANGES.map(r=>[r[0],r[1],null]),AUDIT_UI.range,'auditSetRange')+'</div>'
       +'</div>'
       +'<div class="rowflex" style="margin-top:14px"><span id="audit-active"></span></div>',
      {icon:'filter', sub:'Every filter here runs over the whole log, not a page of it'})

    +panel('<span id="audit-count"></span>',
        '<div id="audit-results"></div>',
        {icon:'log', tight:true,
         sub:'Click any event for the full record — including what it withheld',
         act:auditSeg('audit-mode',[["stream","Stream","list"],["table","Table","grid"]],AUDIT_UI.mode,'auditSetMode'),
         foot:'Suppressed rows are counted where the viewer was told about them, so one withheld row is never counted twice.'})

    +'<div class="split wide" style="margin-top:18px" id="audit-trace-panel">'
      +panel('Trace a number',
          '<div id="audit-trace">'+auditTraceHTML()+'</div>',
          {icon:'link', sub:'Pick a saved answer and follow it back to the question, the rules and the rows'})
      +panel('Retention and export',
          auditRetentionHTML(),
          {icon:'archive', tight:true, sub:'How long each category is kept, and who may read it',
           foot:'Retention is set per category, not per event. Changing it is a policy change, and appears above.'})
    +'</div>';

  auditPaint();
}
V2ROUTES.audit = renderAudit;
</script>
