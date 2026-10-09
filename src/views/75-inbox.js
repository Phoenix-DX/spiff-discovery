<script>
/* =====================================================================
   Inbox — 11 Sep 2026
   Every decision the product asks of a person, in one place, with the
   verb inline — and every notice that needs no decision, on a second tab.
   Eleven kinds of decision used to surface seven ways, four of them only
   on their own screens; one dismissable Home card stood in for dozens of
   items. Now a decision made anywhere marks its inbox item done, and an
   item that would expire on silence is never silent.

   The inbox derives from the same data the screens use — requests,
   reviews, findings, connector requests, clocks, budgets — so it cannot
   disagree with them. Oren, 11 Sep: decisions and notices, together.
   ===================================================================== */

const INBOX = { tab:"decisions", filter:"waiting", kind:"all" };
const INBOX_DONE = {           /* item id → how it was decided; seeded with three from last week */
  "req:REQ-1032":  {verb:"Approved", by:"Thato Sekhoto", when:"30 Aug"},
  "creq:req-slack":{verb:"Declined", by:"Marcus Vilakazi",  when:"20 Aug"},
  "find:f-att-def":{verb:"Accepted", by:"Rupert Mackenzie", when:"03 Sep"}
};
const INBOX_TODAY = new Date(FX.now.getFullYear(), FX.now.getMonth(), FX.now.getDate());
const INBOX_KINDS = {
  access:   {label:"Access request",   icon:"people", sev:"warn", due:"10 working days"},
  review:   {label:"Access review",    icon:"shield", sev:"info", due:"the campaign's end date"},
  expiry:   {label:"Expiring grants",  icon:"clock",  sev:"crit", due:"the expiry date — silence removes access"},
  finding:  {label:"Source finding",   icon:"spark",  sev:"info", due:"none — but the catalogue waits"},
  connector:{label:"Connector request",icon:"plug",   sev:"warn", due:"10 working days"},
  consent:  {label:"Re-consent",       icon:"lock",   sev:"warn", due:"14 days"},
  signin:   {label:"Sign-in expired",  icon:"plug",   sev:"crit", due:"now — answers on it are stale"},
  run:      {label:"Run failed",       icon:"flow",   sev:"crit", due:"now"},
  rule:     {label:"Rule in review",   icon:"book",   sev:"info", due:"none"},
  budget:   {label:"Budget alert",     icon:"trend",  sev:"warn", due:"month end"},
  admin:    {label:"New system admin", icon:"shield", sev:"info", due:"before it takes effect"}
};
function inboxQ(s){ return esc2(String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'")); }
function inboxDate(s){ const m=/^(\d{1,2}) (\w{3})(?: (\d{4}))?/.exec(String(s||"")); if(!m) return null; const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[2]); return mo<0?null:new Date(+(m[3]||2026), mo, +m[1]); }
function inboxDays(s){ const d=inboxDate(s); return d ? Math.round((INBOX_TODAY - d)/86400000) : null; }
function inboxAge(days){ return days==null ? "—" : days<=0 ? "today" : days===1 ? "1 day" : days+" days"; }
function inboxDue(dueDate){ const d=inboxDate(dueDate); if(!d) return {label:"—", days:9999}; const n=Math.round((d-INBOX_TODAY)/86400000); return {label: n<0 ? "overdue by "+(-n)+" day"+(-n===1?"":"s") : n===0 ? "today" : "in "+n+" day"+(n===1?"":"s"), days:n}; }
function inboxAddDays(s, n){ const d=inboxDate(s); if(!d) return "—"; d.setDate(d.getDate()+n); return d.getDate()+" "+["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]+" 2026"; }
function inboxMe(){ return (typeof ME!=="undefined" && ME.full) || "Thato Sekhoto"; }

/* ---------- the decision items, derived from the screens' own data ---------- */
function inboxItems(){
  const out = [], me = inboxMe();
  const push = function(o){ o.done = INBOX_DONE[o.id] || o.done || null; o.status = o.done ? "done" : (o.status || "waiting"); out.push(o); };
  /* access requests — everyone's but mine */
  (typeof macReqs==="function" ? macReqs() : []).forEach(function(r){
    if(/^Thato/.test(r.who||"")) return;
    const d = ds(r.dataset)||{name:r.dataset}, decided = MYACC_STATE.appDone[r.id];
    const st = decided ? "done" : r.status==="Pending" ? "waiting" : r.status==="Expired" ? "expired" : "done";
    const dec = (r.stages||[]).filter(function(s){ return /done/.test(s.state) && /Declined|Approved/.test(s.when||""); }).slice(-1)[0];
    push({id:"req:"+r.id, kind:"access", what:esc2(r.who)+" asks for "+esc2(d.name), sub:esc2(r.fields||"")+(r.purpose?" · "+esc2(r.purpose):""), from:r.who, ageDays:inboxDays(r.requested), due:inboxAddDays(r.requested,14), status:st,
      done: decided ? {verb: decided==="approved"?"Approved":"Declined", by:me, when:"today"} : (st==="done" && !INBOX_DONE["req:"+r.id] ? {verb:r.status, by:(dec&&dec.who)||"an approver", when:(dec&&dec.when||"").replace(/^(Declined|Approved)\s*/,"")} : null),
      std: r.risk==="standard",
      verbs:[{label:"Approve", pri:true, js:"macApprove('"+inboxQ(r.id)+"')"},{label:"Decline", js:"macDecline('"+inboxQ(r.id)+"')"}],
      open:"go('people');switchTab('ppl','app')"});
  });
  /* access review campaigns */
  (typeof macRevs==="function" ? macRevs() : []).forEach(function(r){
    const tot=macRevTotal(r), dec=macRevDecided(r), left=tot-dec;
    push({id:"rev:"+r.id, kind:"review", what:esc2(r.name), sub:fmt(left)+" of "+fmt(tot)+" grants still to decide · "+esc2(r.scope||""), from:r.owner, ageDays:inboxDays(r.opened||"25 Aug 2026"), due:r.due, status: left>0 ? (inboxDue(r.due).days<0 ? "expired" : "waiting") : "done",
      done: left>0 ? null : {verb:"Signed off", by:r.owner, when:r.due},
      verbs:[{label:"Open the review", pri:true, js:"go('people');switchTab('ppl','rev');MYACC_STATE.revOpen='"+inboxQ(r.id)+"';macRenderRev()"}],
      open:"go('people');switchTab('ppl','rev')"});
  });
  /* my own grants about to expire — the one that expires on silence */
  push({id:"expiry:sep", kind:"expiry", what:"9 of your grants expire on "+fxSlideStr("17 September")+" unless you confirm them", sub:"Silence removes access, it never keeps it. Reminders at 7, 3 and 1 days — this is the 7-day one.", from:"Spiff", ageDays:0, due:"17 Sep 2026",
    verbs:[{label:"Confirm or drop", pri:true, js:"go('people');switchTab('ppl','rev')"}], open:"go('myaccess')"});
  /* source-read findings */
  (typeof FINDINGS!=="undefined" ? FINDINGS : []).forEach(function(f){
    const sc = undScan(f.scanId); if(!sc) return;
    const st = f.status==="pending" ? "waiting" : "done";
    push({id:"find:"+f.id, kind:"finding", what:esc2(f.statement).slice(0,110), sub:esc2(undTypeInfo(f.type).label)+" · "+esc2(undBand(f.confidence).label)+" · needs "+esc2(f.needs||undApprover(f)), from:sc.label, ageDays:inboxDays(sc.startedAt), due:"—", status:st,
      done: st==="done" && !INBOX_DONE["find:"+f.id] ? {verb: f.status==="accepted"?"Accepted":f.status==="edited"?"Accepted with edits":"Rejected", by:(typeof undSignedBy==="function"?undSignedBy(f):"a person"), when:(typeof undSignedOn==="function"?undSignedOn(f):"")} : null,
      verbs:[{label:"Accept", pri:true, js:"undAccept('"+inboxQ(f.id)+"')"},{label:"Reject", js:"undRejectAsk('"+inboxQ(f.id)+"')"}],
      open:"go('understand',{scanId:'"+inboxQ(f.scanId)+"'})"});
  });
  /* connector requests */
  MCP_POLICY.requests.forEach(function(r){
    const c = connectorById(r.connector)||{name:r.connector};
    push({id:"creq:"+r.id, kind:"connector", what:esc2(r.who)+" asks to connect "+esc2(c.name), sub:esc2(r.note||""), from:r.who, ageDays:inboxDays(r.on), due:inboxAddDays(r.on,14), status: r.status==="open" ? "waiting" : "done",
      done: r.status!=="open" && !INBOX_DONE["creq:"+r.id] ? {verb: r.status==="approved"?"Approved":"Declined", by:"an admin", when:"—"} : null,
      verbs:[{label:"Approve", pri:true, js:"mcpDecide('"+inboxQ(r.id)+"','approve')"},{label:"Decline", js:"mcpDecide('"+inboxQ(r.id)+"','decline')"}],
      open:"MCPV.tab='server';go('mcp')"});
  });
  /* connectors that changed their tools since consent, and sign-ins that expired */
  CONNECTORS.forEach(function(c){
    if(c.changed && c.changed.length) push({id:"consent:"+c.id, kind:"consent", what:esc2(c.name)+" added "+c.changed.length+" tool"+(c.changed.length===1?"":"s")+" since you consented", sub:c.changed.map(esc2).join(", ")+" — gated until you look", from:c.name, ageDays:3, due:inboxAddDays("08 Sep 2026",14),
      verbs:[{label:"Review the tools", pri:true, js:"mcpReviewChanges('"+inboxQ(c.id)+"')"}], open:"openConnector('"+inboxQ(c.id)+"')"});
    if(c.state==="reauth") push({id:"reconnect:"+c.id, kind:"signin", what:"Your "+esc2(c.name)+" sign-in expired", sub:"Answers that read it still run, on data from before, and say so. Two automations paused rather than run as anyone else.", from:c.name, ageDays:0, due:fxSlideStr("11 Sep 2026"),
      verbs:[{label:"Reconnect", pri:true, js:"mcpConsent('"+inboxQ(c.id)+"',1)"}], open:"openConnector('"+inboxQ(c.id)+"')"});
    if(c.state==="error") push({id:"retry:"+c.id, kind:"run", what:esc2(c.name)+" is unreachable — three timeouts since 06:12", sub:"Nothing you can do from here but retry; Estates was told at 06:20.", from:c.name, ageDays:0, due:fxSlideStr("11 Sep 2026"),
      verbs:[{label:"Retry", pri:true, js:"mcpRetry('"+inboxQ(c.id)+"')"}], open:"openConnector('"+inboxQ(c.id)+"')"});
  });
  /* the failed automation run */
  push({id:"run:weekly-attendance", kind:"run", what:"“Weekly attendance alert” failed its 06:00 run", sub:"It runs as you and could not reach Travel bookings. Nothing was sent — no one received half an answer.", from:"Automations", ageDays:0, due:fxSlideStr("11 Sep 2026"),
    verbs:[{label:"Retry now", pri:true, js:"toast('Retrying — it runs as you, and tells you when it lands');inboxMarkDone('run:weekly-attendance','Retried')"},{label:"Open", js:"go('autos')"}], open:"go('autos')"});
  /* rules waiting for approval */
  RULES.filter(function(r){ return r.status==="In review"; }).forEach(function(r){
    const who = (r.approvers||[]).map(function(a){ return a.name; });
    push({id:"rule:"+r.id, kind:"rule", what:esc2(r.name)+" — "+esc2(r.owner)+" asks "+(who.length?esc2(who.join(" and ")):"its approvers")+" to sign it", sub:"In review · running in shadow mode: Spiff records what it would have done, no answer changes until it is signed", from:r.owner, ageDays:4, due:"—",
      verbs:[{label:"Open the rule", pri:true, js:"openRule('"+inboxQ(r.id)+"')"},{label:"Approve", js:"rulesApproveGo('"+inboxQ(r.id)+"')"},{label:"Send back", js:"rulesSendBackGo('"+inboxQ(r.id)+"')"}], open:"openRule('"+inboxQ(r.id)+"')"});
  });
  /* budgets over their forecast — to the team manager */
  Object.keys(BUDGET.teams).forEach(function(t){
    const b = BUDGET.teams[t], pct = budgetPct(b.used, b.allowance);
    if(pct >= 80 && !b.paused) push({id:"budget:"+t, kind:"budget", what:esc2(t)+" has used "+pct+"% of its "+NZD(b.allowance)+" allowance", sub:"On track for "+NZD(budgetForecast(b.used))+" by month end. Schedules pause first if it runs out.", from:"Budgets", ageDays:0, due:fxSlideStr("30 Sep 2026"),
      verbs:[{label:"Raise the allowance", pri:true, js:"admRaiseModal('"+inboxQ(t)+"')"},{label:"Pause schedules", js:"admPauseAsk('"+inboxQ(t)+"')"}], open:"ADM.tab='budgets';go('admin')"});
  });
  /* new system admins to acknowledge */
  PEOPLE.filter(function(p){ return p.adminSince==="just now"; }).forEach(function(p){
    push({id:"admin:"+p.id, kind:"admin", what:esc2(p.name)+" was made a system admin", sub:"Until "+esc2(p.adminUntil||"no end date")+" · "+esc2(p.adminWhy||""), from:me, ageDays:0, due:fxSlideStr("11 Sep 2026"),
      verbs:[{label:"Acknowledge", pri:true, js:"inboxMarkDone('admin:"+inboxQ(p.id)+"','Acknowledged')"}], open:"ADM.tab='admins';go('admin')"});
  });
  return out;
}
function inboxWaiting(){ return inboxItems().filter(function(i){ return i.status==="waiting"; }); }
function inboxMarkDone(id, verb){ INBOX_DONE[id] = {verb:verb, by:inboxMe(), when:"just now"}; inboxAfterDecision(); }
function inboxAfterDecision(){
  const c = $('#inbox-count'); if(c){ const n = inboxWaiting().length; c.textContent = n; c.style.display = n ? '' : 'none'; }
  if($('#view-inbox') && $('#view-inbox').classList.contains('on')) renderInbox();
  if($('#view-home') && $('#view-home').classList.contains('on')) renderHome();
}
/* a decision made on its own screen marks the inbox item done — these wrappers record it */
(function(){
  const wrap = function(fn, rec){ const orig = window[fn]; if(typeof orig !== "function") return;
    window[fn] = function(){ const r = orig.apply(this, arguments); try{ const d = rec.apply(null, arguments); if(d) INBOX_DONE[d[0]] = {verb:d[1], by:inboxMe(), when:"just now"}; }catch(e){} inboxAfterDecision(); return r; }; };
  wrap("macApproveGo", function(id){ return ["req:"+id, "Approved"]; });
  wrap("macDeclineGo", function(id){ return ["req:"+id, "Declined"]; });
  wrap("macBulkGo",    function(){ (typeof macApps==="function"?macApps():[]).filter(function(r){ return r.risk==="standard"; }).forEach(function(r){ INBOX_DONE["req:"+r.id] = {verb:"Approved", by:inboxMe(), when:"just now"}; }); return null; });
  wrap("undAccept",    function(id){ return ["find:"+id, "Accepted"]; });
  wrap("undRejectDo",  function(id){ return ["find:"+id, "Rejected"]; });
  wrap("undEditDo",    function(id){ return ["find:"+id, "Accepted with edits"]; });
  wrap("mcpDecided",   function(id, v){ return ["creq:"+id, v==="approve"?"Approved":"Declined"]; });
  wrap("mcpReviewed",  function(id){ return ["consent:"+id, "Reviewed"]; });
  wrap("mcpRetry",     function(id){ return ["retry:"+id, "Retried"]; });
})();

/* ---------- notices: things that happened and need no decision ---------- */
const NOTICES = [
  {id:"n1",  kind:"refreshed", icon:"refresh", text:"3 answers you follow refreshed at 06:12 — LDM meetings, Attendance · Oakridge, Net new members", when:"today 06:14", read:false, js:"go('home')"},
  {id:"n2",  kind:"approved",  icon:"check",   text:"Your request for Travel bookings was approved by Colette Marais — live after tonight's provisioning run", when:"today 08:41", read:false, js:"go('myaccess');switchTab('mac','req')"},
  {id:"n3",  kind:"shared",    icon:"people",  text:"Pavitra Govender shared “Attendance rate by locality, this year vs last” to LDM Operations", when:"today 09:02", read:false, js:"go('library')"},
  {id:"n4",  kind:"subscribed",icon:"send",    text:"Murray Shepstone subscribed to your Weekly LDM pack — he gets his own copy, scoped to him", when:"yesterday 09:30", read:true, js:"go('autos')"},
  {id:"n5",  kind:"definition",icon:"book",    text:"“Net movement” moved to version 2 — it now excludes the current incomplete month. 4 of your saved answers were re-labelled", when:"yesterday 10:47", read:true, js:"go('glossary')"},
  {id:"n6",  kind:"data",      icon:"warn",    text:"Travel bookings is flagged: the supplier feed has been late three times this month. Your Orbit tile says so", when:"yesterday 10:46", read:false, js:"openDataset('travel')"},
  {id:"n7",  kind:"connector", icon:"plug",    text:"Notifications Relay came back after 3 hours unreachable. No automation ran as anyone else in the meantime", when:"yesterday 14:10", read:true, js:"go('mcp')"},
  {id:"n8",  kind:"ran",       icon:"flow",    text:"“Overdue locality outreach” ran at 07:00 and sent 14 messages, as Pavitra", when:"yesterday 07:03", read:true, js:"go('autos')"},
  {id:"n9",  kind:"budget",    icon:"trend",   text:"LDM Operations used a third of its September allowance by day 11 — inside its forecast", when:"Mon 08 Sep 06:00", read:true, js:"ADM.tab='budgets';go('admin')"},
  {id:"n10", kind:"review",    icon:"shield",  text:"The August access review for LDM Coordinators was signed off by Reneilwe Dlomo: 34 kept, 2 revoked, 1 delegated", when:"Sun 31 Aug 14:20", read:true, js:"go('people');switchTab('ppl','rev')"},
  {id:"n11", kind:"completed", icon:"check",   text:"Membership movement is live for you — approved and provisioned", when:"Tue 12 Aug 03:14", read:true, js:"openDataset('growth')"},
  {id:"n12", kind:"certified", icon:"shield",  text:"Localities & subdivisions was certified by Lesedi Mofokeng", when:"Sat 30 Aug 13:55", read:true, js:"openDataset('localities')"}
];
function inboxNoticeRead(id, open){ const n = NOTICES.find(function(x){ return x.id===id; }); if(n){ n.read = true; if(open && n.js){ try{ (new Function(n.js))(); }catch(e){} return; } } renderInbox(); }
function inboxNoticeDismiss(id){ const i = NOTICES.findIndex(function(x){ return x.id===id; }); if(i>=0) NOTICES.splice(i,1); toast('Dismissed — it stays in your activity log'); renderInbox(); }
function inboxNoticesReadAll(){ NOTICES.forEach(function(n){ n.read = true; }); renderInbox(); }

/* ---------- the page ---------- */
function inboxSet(k, v){ INBOX[k] = v; renderInbox(); }
function inboxDecisionsPane(){
  const all = inboxItems(), waiting = all.filter(function(i){ return i.status==="waiting"; });
  const shown = all.filter(function(i){
    if(INBOX.filter==="waiting" && i.status!=="waiting") return false;
    if(INBOX.filter==="done"    && i.status!=="done") return false;
    if(INBOX.filter==="expired" && i.status!=="expired") return false;
    if(INBOX.kind!=="all" && i.kind!==INBOX.kind) return false;
    return true;
  });
  const std = waiting.filter(function(i){ return i.kind==="access" && i.std; }).length;
  const chip = function(v, label, n){ return '<button class="fchip2'+(INBOX.filter===v?' on':'')+'" onclick="inboxSet(\'filter\',\''+v+'\')">'+label+(n!=null?' <span class="mono">'+n+'</span>':'')+'</button>'; };
  const kinds = Object.keys(INBOX_KINDS).filter(function(k){ return all.some(function(i){ return i.kind===k; }); });
  const head = '<div class="rowflex" style="margin-bottom:12px;gap:10px">'
    + '<div class="chipbar">'+chip("waiting","Waiting on me",waiting.length)+chip("done","Done",all.filter(function(i){ return i.status==="done"; }).length)+chip("expired","Expired",all.filter(function(i){ return i.status==="expired"; }).length)+chip("all","All")+'</div>'
    + '<div class="sp"></div>'
    + '<label class="lf-sort">Kind <select onchange="inboxSet(\'kind\',this.value)"><option value="all"'+(INBOX.kind==="all"?' selected':'')+'>All kinds</option>'
    +   kinds.map(function(k){ return '<option value="'+k+'"'+(INBOX.kind===k?' selected':'')+'>'+esc2(INBOX_KINDS[k].label)+'</option>'; }).join('')+'</select></label>'
    + (std ? '<button class="btn sm" onclick="macBulk()">'+I2.check+' Approve all '+std+' standard-for-role</button>' : '')
    + '</div>';
  const frame = listFrame("inbox", {
    items: shown, repaint: renderInbox, noun: "items", noun1: "item", size: 15,
    /* the row wears its due state: red overdue, orange due within the day, green with time in hand */
    rowStyle: function(i){ if(i.status!=="waiting") return ""; const d=inboxDue(i.due).days; if(d===9999) return "";
      return d<0 ? "background:var(--crit-soft);box-shadow:inset 4px 0 0 var(--crit)" : d===0 ? "background:var(--warn-soft);box-shadow:inset 4px 0 0 var(--warn)" : "background:var(--good-soft);box-shadow:inset 4px 0 0 var(--good)"; },
    search: function(i){ return i.what+' '+i.sub+' '+i.from+' '+INBOX_KINDS[i.kind].label; }, placeholder: "Search by person, dataset, connector or kind…",
    sorts: [{key:"due",  label:"Due soonest",  get:function(i){ return i.status==="waiting" ? inboxDue(i.due).days : 99999; }},
            {key:"age",  label:"Waiting longest", get:function(i){ return i.ageDays==null?-1:i.ageDays; }, desc:true},
            {key:"new",  label:"Newest",       get:function(i){ return i.ageDays==null?999:i.ageDays; }},
            {key:"kind", label:"Kind",         get:function(i){ return INBOX_KINDS[i.kind].label; }},
            {key:"from", label:"From",         get:function(i){ return i.from; }}],
    /* fixed columns: nothing scrolls sideways; a cell that cannot fit ends in … and shows itself in full on hover */
    cols: [{label:"Kind", sort:"kind", style:"width:142px", cell:function(i){ const k=INBOX_KINDS[i.kind]; return '<span class="bdg '+k.sev+'">'+(I2[k.icon]||'')+esc2(k.label)+'</span>'; }},
           {label:"What", cell:function(i){ return '<div class="ell" style="font-weight:600;line-height:1.35">'+i.what+'</div><div class="ell mutedtext" style="font-size:12px;margin-top:3px">'+i.sub+'</div>'; }},
           {label:"From", sort:"from", style:"width:128px", cell:function(i){ return '<span class="ell">'+esc2(i.from)+'</span>'; }},
           {label:"Waiting", sort:"age", style:"width:82px", cell:function(i){ return '<span class="mutedtext nw">'+inboxAge(i.ageDays)+'</span>'; }},
           {label:"Due", sort:"due", style:"width:132px", cell:function(i){ if(i.status!=="waiting") return '<span class="mutedtext">—</span>'; const d=inboxDue(i.due); return d.days===9999 ? '<span class="mutedtext">none</span>' : '<span class="'+(d.days<0?'':'mutedtext')+' nw" style="'+(d.days<0?'color:var(--crit);font-weight:600':d.days<=2?'color:var(--warn);font-weight:600':'')+'">'+esc2(d.label)+'</span>'; }},
           {label:"Decide", style:"width:236px", cell:function(i){
              if(i.status==="done" && i.done) return '<span class="ell">'+bdg(i.done.verb+' · '+i.done.by+(i.done.when?' · '+i.done.when:''),'ok','check')+'</span>';
              if(i.status==="expired") return bdg('Expired — nobody decided','mut','clock');
              return '<div class="rowflex" style="gap:6px;flex-wrap:wrap">'+i.verbs.map(function(v){ return '<button class="btn sm'+(v.pri?' pri':'')+'" onclick="event.stopPropagation();'+v.js+'">'+esc2(v.label)+'</button>'; }).join('')+'</div>'; }}],
    rowClick: function(i){ return i.open; },
    emptyTitle: INBOX.filter==="waiting" ? "Nothing is waiting on you" : "Nothing here", emptySub: INBOX.filter==="waiting" ? "Every decision that is yours has been made. New ones land here the moment they are asked." : "", emptyIcon: "check"
  });
  return callout("info","<b>Everything that is yours to decide, wherever it was asked.</b> Deciding here or on the item's own screen is the same decision, recorded once. An item that expires on silence is reminded at 7, 3 and 1 days, and says what happens if you do nothing.")
    + '<div style="height:14px"></div>' + head + frame;
}
function inboxNoticesPane(){
  const unread = NOTICES.filter(function(n){ return !n.read; }).length;
  return callout("mut","<b>Things that happened and need no decision.</b> An answer refreshed, a request approved for you, a connector came back. Kept for 30 days, then they are in the activity log only.")
    + '<div style="height:14px"></div>'
    + listFrame("inbox-notices", {
        items: NOTICES, repaint: renderInbox, noun: "notices", noun1: "notice", size: 15,
        search: function(n){ return n.text+' '+n.kind; }, placeholder: "Search notices…",
        sorts: [{key:"new", label:"Newest first", get:function(n){ return NOTICES.indexOf(n); }},
                {key:"unread", label:"Unread first", get:function(n){ return n.read ? 1 : 0; }},
                {key:"kind", label:"Kind", get:function(n){ return n.kind; }}],
        row: function(n){ return '<div class="lrow'+(n.read?'':' unread')+'" onclick="inboxNoticeRead(\''+n.id+'\',true)">'
            + '<div class="li">'+(I2[n.icon]||I2.info)+'</div>'
            + '<div class="lm"><div class="lt">'+(n.read?'':'<span class="dotd" style="color:var(--accent)"></span>')+esc2(n.text)+'</div><div class="ls">'+esc2(n.when)+' · '+esc2(n.kind)+'</div></div>'
            + '<div class="lr">'+kebabHTML([{label:'Open', icon:'chev', onclick:"inboxNoticeRead('"+n.id+"',true)"},{label:n.read?'Mark unread':'Mark read', icon:'check', onclick:"(function(){var x=NOTICES.find(function(y){return y.id==='"+n.id+"'});if(x){x.read=!x.read;renderInbox();}})()"},{label:'Dismiss', icon:'x', danger:true, onclick:"inboxNoticeDismiss('"+n.id+"')"}])+'</div></div>'; },
        emptyTitle: "No notices", emptySub: "Anything that happens to your answers, requests and connectors lands here.", emptyIcon: "check"
      });
}
function renderInbox(){
  const waiting = inboxWaiting().length, unread = NOTICES.filter(function(n){ return !n.read; }).length;
  const c = $('#inbox-count'); if(c){ c.textContent = waiting; c.style.display = waiting ? '' : 'none'; }
  $('#view-inbox').innerHTML =
      pageHead({eyebrow:"Home", title:"Inbox",
        desc:"Every decision that is yours, and every notice about your answers, requests and connectors — in one place. Deciding here is the same as deciding on the item's own screen; it is recorded once.",
        badges: bdg(waiting+" waiting on you", waiting?"warn":"ok", "bolt") + bdg(unread+" unread notices","mut","info"),
        acts: INBOX.tab==="notices" ? '<button class="btn" onclick="inboxNoticesReadAll()">'+I2.check+' Mark all read</button>' : ''})
    + tabsHTML("inbox", [["decisions","Decisions",waiting],["notices","Notices",unread]], INBOX.tab)
    + pane("inbox","decisions", inboxDecisionsPane(), INBOX.tab==="decisions")
    + pane("inbox","notices",   inboxNoticesPane(),   INBOX.tab==="notices");
  document.querySelectorAll('[data-tabs="inbox"] button').forEach(function(b){ b.addEventListener("click", function(){ INBOX.tab = b.dataset.tab; }); });
}
V2ROUTES.inbox = renderInbox;
CRUMB.inbox = "Inbox";

/* ---------- Home: the needs-you panel is the top of the inbox now ---------- */
function homeNeeds(){
  return inboxWaiting().slice().sort(function(a,b){ return inboxDue(a.due).days - inboxDue(b.due).days; }).slice(0,5).map(function(i){
    const k = INBOX_KINDS[i.kind];
    return {id:(i.kind==="access"?"approvals":i.id), sev:k.sev, icon:k.icon, t:i.what.replace(/<[^>]+>/g,''), s:i.sub.replace(/<[^>]+>/g,''), a:i.verbs[0].label, js:i.verbs[0].js, open:i.open, n:i.kind==="access"?1:0};
  });
}
function homeApprovalsItem(){ const n = inboxWaiting().filter(function(i){ return i.kind==="access"; }).length; return {n:n, t:n+" access request"+(n===1?" is":"s are")+" waiting for your decision"}; }
function homeNeedsRow(x){
  const col = "var(--"+x.sev+")", soft = "var(--"+x.sev+"-soft)";
  return '<div class="lrow" onclick="'+x.open+'">'
    + '<div class="li" style="background:'+soft+';color:'+col+'">'+(I2[x.icon]||I2.info)+'</div>'
    + '<div class="lm"><div class="lt"><span class="dotd" style="color:'+col+'"></span>'+esc(x.t)+'</div><div class="ls">'+esc(x.s)+'</div></div>'
    + '<div class="lr"><button class="btn sm pri" onclick="event.stopPropagation();'+x.js+'">'+esc(x.a)+'</button></div></div>';
}
function homeNeedsPanel(){
  const items = homeNeeds(), n = inboxWaiting().length;
  const body = items.length ? items.map(homeNeedsRow).join("") : emptyState("Nothing needs you","Every decision that is yours has been made. New ones land in your inbox the moment they are asked.","check");
  return panel("Needs you", body, {icon:"bolt", tight:true,
    sub: n ? "the "+Math.min(5,n)+" due soonest of "+n : "all clear",
    act: '<button class="btn sm" onclick="go(\'inbox\')">'+I2.send+' Open inbox'+(n?' ('+n+')':'')+'</button>',
    foot:"Everything here is yours because of a role you hold. Deciding it here or in the inbox is the same decision, recorded once."});
}

/* the greeting counts everything waiting, not the five cards below it */
function homeBand(){
  const n = inboxWaiting().length, a = homeApprovalsItem().n;
  const line = n
    ? '<b>3 answers you follow</b> refreshed overnight, and <b>'+n+' '+(n===1?"decision is":"decisions are")+' waiting for you</b>'
      + (a ? ' — including '+a+' access request'+(a===1?'':'s')+' waiting for your decision.' : '.')
    : '<b>3 answers you follow</b> refreshed overnight. Nothing else needs you today.';
  return pageHead({
    eyebrow: homeToday(),
    title: esc(homeGreeting())+", "+esc(homeFirst()),
    desc: line+' Everything below re-runs as you, scoped to <b>'+esc(homeScope())+'</b>.',
    badges: bdg("Runs as you","ok","shield")+bdg(ORG.name,"mut","db")+bdg(ORG.activeThisWeek+" of "+ORG.users+" people asked something this week","mut","people"),
    acts: '<button class="btn" onclick="go(\'inbox\')">'+I2.send+' Open inbox'+(n?' ('+n+')':'')+'</button><button class="btn" onclick="go(\'sim\')">'+I2.eye+' View as someone else</button><button class="btn" onclick="homePrefsModal()" title="Choose what this page shows">'+I2.grid+' Customise</button>'
  });
}

/* ---------- the shout-out: hover (or tap) a truncated Inbox cell and read it in full ---------- */
(function(){
  let bubble = null, pinned = null;
  function get(){ if(!bubble){ bubble = document.createElement('div'); bubble.className = 'shout'; bubble.setAttribute('role','tooltip'); document.body.appendChild(bubble); } return bubble; }
  function show(el){
    const b = get(); b.textContent = el.textContent.trim(); b.style.display = 'block';
    const r = el.getBoundingClientRect(), bw = Math.min(440, window.innerWidth - 24);
    b.style.maxWidth = bw + 'px';
    const br = b.getBoundingClientRect();
    let left = Math.max(12, Math.min(r.left, window.innerWidth - br.width - 12));
    let top = r.bottom + 10; b.classList.remove('up');
    if(top + br.height > window.innerHeight - 12){ top = r.top - br.height - 10; b.classList.add('up'); }
    b.style.left = left + 'px'; b.style.top = top + 'px';
    b.style.setProperty('--arrow', Math.max(14, Math.min(r.left + 18 - left, br.width - 14)) + 'px');
  }
  function hide(){ if(bubble && !pinned) bubble.style.display = 'none'; }
  function truncated(el){ if(!el) return false; if(el.classList.contains('ell2')) return el.scrollHeight > el.clientHeight + 1; return el.classList.contains('ell') && el.scrollWidth > el.clientWidth + 1; }
  document.addEventListener('mouseover', function(e){ const el = e.target.closest && e.target.closest('.ell, .ell2'); if(truncated(el)) show(el); });
  document.addEventListener('mouseout', function(e){ const el = e.target.closest && e.target.closest('.ell, .ell2'); if(el) hide(); });
  document.addEventListener('click', function(e){
    const el = e.target.closest && e.target.closest('.ell, .ell2');
    if(truncated(el)){ e.stopPropagation(); if(pinned===el){ pinned=null; hide(); } else { pinned=el; show(el); } return; }
    if(pinned){ pinned = null; hide(); }
  }, true);
  document.addEventListener('scroll', function(){ pinned = null; hide(); }, true);
})();
</script>
