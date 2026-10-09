<script>
function macFieldList(r){var f=r&&r.fields;if(!f)return 'Whole dataset';return Array.isArray(f)?f.join(', '):String(f);}
/* =====================================================================
   SPIFF v2 — My access
   The self-service side of access governance, written for someone who
   does not know what a row filter is. Four tabs: what I can see, my
   requests, the queue I approve, and the reviews I run.
   ===================================================================== */

const MYACC_STATE = { lvl:"all", q:"", appDone:{}, revOpen:null, revDec:{}, diff:false };
const MYACC_LVL = {
  full: {label:"In full",            cls:"ok",   ico:"unlock", blurb:"Every row in your scope, nothing masked."},
  part: {label:"In part",            cls:"warn", ico:"eyeoff", blurb:"You get the rows, but some fields come back hidden."},
  none: {label:"Not yours yet",      cls:"mut",  ico:"lock",   blurb:"You would have to ask, and someone would have to say yes."},
  block:{label:"Blocked for everyone",cls:"crit",ico:"shield", blurb:"Policy keeps this out of Spiff. There is nothing to request."}
};

/* ---------- fallbacks: used only when data/52-access.js is absent ---------- */
const MYACC_RULENAMES = {
  "r-locality-scope":"Locality scoping — default deny", "r-small-count":"Suppress counts under 5",
  "r-minor-detail":"Minors are name-only", "r-minor-dob":"No date of birth for minors, ever",
  "r-attendance-def":"Attendance is defined once", "r-contact-mask":"Mask email and mobile outside your locality",
  "r-deceased-tail":"Deceased members: 24-month tail", "r-consent":"Consent respected on outreach fields",
  "r-travel-window":"Travel visible only ±30 days", "r-travel-docs":"No passport or document numbers",
  "r-wellbeing":"Dietary and accessibility notes withheld", "r-retention-reg":"Registrations purged after 13 months",
  "r-round-base5":"Round locality counts to base 5", "r-point-in-time":"Membership status is point-in-time",
  "r-finance-restrict":"Finance data is Finance-approved", "r-pastoral-block":"Pastoral notes are never queryable"
};
const MYACC_GRANT = {
  meetings:"southern-cluster", localities:"ldm-coordinators", events:"all-staff", appointments:"ldm-coordinators",
  properties:"all-staff", growth:"all-staff", members:"southern-cluster", families:"southern-cluster",
  registrations:"southern-cluster", comms:"southern-cluster"
};
const MYACC_EXPIRY = {
  "all-staff":"No end date — follows your Directory record",
  "ldm-coordinators":"Expires 31 Mar 2027",
  "southern-cluster":"Ends when your area attribute changes"
};
/* second-person statements: what you actually get, and why */
const MYACC_SAY = {
  meetings:["Full — every row in your 4 areas","Every meeting occurrence and every check-in for Makhanda, Bloemfontein, Pietermaritzburg and Stellenbosch. Any breakdown that lands on fewer than 5 people shows as “<5” instead of a number."],
  localities:["Full — all 312 localities","Name, subdivision, locality and current standing for every locality in the division. Nothing here is personal, so nothing is masked."],
  events:["Full — all 9 areas","Every event and programme, including the ones outside your cluster. Registrations are a separate dataset with its own rules."],
  appointments:["Full — your 4 areas","Who holds which service appointment, since when, and which localities are still vacant."],
  properties:["Full — all 9 areas","Every property and room in Estates. No personal data in this one, so no masking applies to anyone."],
  growth:["Full — aggregate only","Joins, transfers, lapses and deaths for all 9 areas. There are no member-level rows in this dataset at all — not for you, not for National Statistics. Locality counts are rounded to the nearest 5."],
  members:["Partial — names and contact details are hashed outside your locality","Inside your own locality you see full name, email and mobile. Outside it those three come back as a hash you can count but cannot read. Dates of birth are rounded to the year, and under-18 records are withheld entirely."],
  families:["Partial — household addresses are masked outside your locality","You see the family unit, its size and its locality everywhere in your areas. The street address only resolves for households in your own locality."],
  registrations:["Partial — wellbeing notes are withheld","You see who registered, what they registered for and whether they turned up. Dietary and accessibility notes come back as “[withheld]” — they are health-adjacent and belong to Event Operations."],
  comms:["Partial — recipient identity is hashed","You see what went out, when, and whether it was delivered. Who received it is hashed. Anyone who has not consented to contact is filtered out before the row reaches you."],
  travel:["No access — request it","Travel Office holds this one. With a grant you would see bookings within 30 days either side of the travel date. Passport and document numbers stay hidden for everyone, including them."],
  itineraries:["No access — request it","Journeys, legs and accommodation. Still a draft dataset, so the definitions may move under you while you use it."],
  budgets:["No access — request it","Cost centres, budgets and contributions. Finance approve this one themselves and rarely grant it outside the finance team."],
  checkins:["No access — retired","The raw check-in feed that sits behind Meetings & attendance. It is deprecated: same events, none of the definitions applied. Ask Meetings & attendance instead."],
  care:["Blocked by policy — for everyone","Pastoral care notes are excluded from Spiff entirely. Not masked, not listed, not requestable — the fields do not exist on this side of the wall. That includes Platform Admins."]
};
/* what would have to change for you to see more */
const MYACC_MORE = {
  meetings:["r-locality-scope","northern-cluster","Pretoria, Polokwane, Nelspruit and Rustenburg are outside your attribute rule. Northern Cluster carries them."],
  members:["r-contact-mask","records-office","Records Office is the only group whose grant lifts the contact mask. Everything else — locality, dates of birth, minors — stays as it is."],
  families:["r-contact-mask","records-office","The address mask comes off for Records Office and nobody else."],
  registrations:["r-wellbeing","event-ops","Event Operations see wellbeing notes while they hold an active event assignment. The grant expires with the assignment."],
  comms:["r-consent",null,"Nothing lifts this one. The consent filter has no exception clause: if a member has not consented to contact, their row does not exist for any viewer, at any level."],
  travel:["r-travel-window","travel-office","Travel Office holds the dataset and widens the window. Document numbers stay masked even for them."],
  itineraries:["r-travel-window","travel-office","Same grant as Travel bookings — one request covers both."],
  budgets:["r-finance-restrict","finance-team","Finance own the dataset and approve their own grants. Brendan Jooste is the approver."],
  checkins:["r-locality-scope","stewards","Data Stewards keep the raw feed for reconciliation. You almost certainly want Meetings & attendance instead."],
  growth:["r-small-count","national-stats","National Statistics see unrounded aggregates for statutory returns. Detail rows do not exist for them either."],
  care:["r-pastoral-block",null,"There is no group, no role and no approver. The rule has no exception clause and is not overridable."]
};
const MYACC_CHANGES = [
  ["Travel bookings — access ended","14 Aug 2026","Your 90-day grant from the Nkosi conference ran out. Nobody removed it; it expired, which is how every grant here is meant to end.","mut"],
  ["Member records — masking tightened","02 Aug 2026","Mask email and mobile outside your locality now covers mobile as well as email. Sindi Mthembu approved the change; 214 people were affected, you among them.","warn"],
  ["Notices & delivery — added","21 Jul 2026","Southern Cluster picked up this dataset when it launched. You did not request it and nobody approved it for you personally — the group grant covers it.","ok"],
  ["Membership movement — narrowed to aggregate","06 Jul 2026","Detail rows were withdrawn from this dataset for everyone, including National Statistics. Your access level did not change; what sits behind it did.","mut"],
  ["Meetings & attendance — Makhanda added","19 Jun 2026","Your Directory record changed area and the Southern Cluster attribute rule picked it up on the next run. No request, no approval — the attribute did it.","ok"]
];
const MYACC_REQ_FB = [
  {id:"REQ-2411", who:"Thato Sekhoto", whoTitle:ME.title, dataset:"budgets", fields:["Cost centre","Budget line","Committed to date"], purpose:"Budget monitoring", justification:"The Southern Cluster meeting-venue spend is queried at every monthly review and I rebuild it by hand from three spreadsheets.", requested:"26 Aug 2026", duration:"90 days", stage:2, status:"Pending", risk:"standard",
   stages:[{name:"Your manager",who:"Reneilwe Dlomo",state:"done",when:"26 Aug, 09:14"},{name:"Privacy review",who:"Cathleen Oberholzer",state:"done",when:"27 Aug, 11:02"},{name:"Data owner",who:"Brendan Jooste",state:"current",when:"waiting since 27 Aug"},{name:"Provisioning",who:"Automatic — nightly 02:00",state:"waiting",when:""}]},
  {id:"REQ-2388", who:"Thato Sekhoto", whoTitle:ME.title, dataset:"travel", fields:["Booking reference","Travel date","Traveller locality"], purpose:"Event logistics", justification:"Six regional gatherings in the next quarter and I am the one reconciling arrivals against the expected lists.", requested:"19 Aug 2026", duration:"180 days", stage:3, status:"Approved", risk:"standard",
   stages:[{name:"Your manager",who:"Reneilwe Dlomo",state:"done",when:"19 Aug, 16:40"},{name:"Privacy review",who:"Skipped — no personal fields",state:"skipped",when:""},{name:"Data owner",who:"Colette Marais",state:"done",when:"21 Aug, 08:55"},{name:"Provisioning",who:"Automatic — tonight 02:00",state:"current",when:""}]},
  {id:"REQ-2350", who:"Thato Sekhoto", whoTitle:ME.title, dataset:"registrations", fields:["Registration status","Attended"], purpose:"Event logistics", justification:"Reconciling the July youth programme registrations against attendance.", requested:"04 Aug 2026", duration:"90 days", stage:4, status:"Completed", risk:"standard",
   stages:[{name:"Your manager",who:"Reneilwe Dlomo",state:"done",when:"04 Aug, 10:11"},{name:"Privacy review",who:"Cathleen Oberholzer",state:"done",when:"05 Aug, 14:20"},{name:"Data owner",who:"Amira Rasool",state:"done",when:"11 Aug, 09:02"},{name:"Provisioning",who:"Automatic",state:"done",when:"12 Aug, 03:14"}]},
  {id:"REQ-2299", who:"Thato Sekhoto", whoTitle:ME.title, dataset:"members", fields:["Full name","Email","Mobile"], purpose:"Membership care", justification:"Contacting members across the cluster about the winter programme.", requested:"11 Jul 2026", duration:"12 months", stage:2, status:"Declined", risk:"unusual",
   reason:"Cluster-wide contact detail is not proportionate to a programme mailing. Notices & delivery already answers who was contacted and whether it landed, without exposing the addresses. If you need to reach people directly, Records Office send on your behalf.", decidedBy:"Sindi Mthembu", decidedOn:"15 Jul 2026",
   stages:[{name:"Your manager",who:"Reneilwe Dlomo",state:"done",when:"11 Jul, 09:30"},{name:"Privacy review",who:"Sindi Mthembu",state:"done",when:"15 Jul, 11:48"},{name:"Data owner",who:"Not reached",state:"skipped",when:""},{name:"Provisioning",who:"Not reached",state:"skipped",when:""}]},
  {id:"REQ-2104", who:"Thato Sekhoto", whoTitle:ME.title, dataset:"travel", fields:["Booking reference","Travel date"], purpose:"Event logistics", justification:"Nkosi conference arrivals desk.", requested:"16 May 2026", duration:"90 days", stage:4, status:"Expired", risk:"standard",
   stages:[{name:"Your manager",who:"Reneilwe Dlomo",state:"done",when:"16 May, 08:02"},{name:"Privacy review",who:"Skipped — no personal fields",state:"skipped",when:""},{name:"Data owner",who:"Colette Marais",state:"done",when:"17 May, 13:26"},{name:"Provisioning",who:"Automatic",state:"done",when:"18 May, 03:11"}]}
];
const MYACC_APP_FB = [
  {id:"REQ-2456", who:"Martinus Viljoen", whoTitle:"Locality Secretary · Stellenbosch", dataset:"meetings", fields:["All localities"], purpose:"Divisional analysis", justification:"Comparing our attendance against the northern subdivisions before the September review.", requested:"29 Aug 2026", duration:"12 months", risk:"unusual", note:"Suspended in Directory — a role change is pending. Granting now grants to whatever role lands."},
  {id:"REQ-2451", who:"Gugu Pillay", whoTitle:"Event Coordinator · Pietermaritzburg", dataset:"registrations", fields:["Dietary notes","Accessibility notes"], purpose:"Event logistics", justification:"Catering and access planning for the KZN youth weekend.", requested:"28 Aug 2026", duration:"12 months", risk:"unusual", note:"Wellbeing fields are health-adjacent. A 12-month grant outlives the event by ten months."},
  {id:"REQ-2447", who:"Pierre Vermeulen", whoTitle:"Locality Secretary · Kimberley", dataset:"members", fields:["Full name","Email"], purpose:"Membership care", justification:"Updating the locality contact list.", requested:"27 Aug 2026", duration:"12 months", risk:"dormant", note:"Granted Southern Cluster 14 months ago, asked 3 questions, last active 94 days ago."},
  {id:"REQ-2444", who:"Dawid Kruger", whoTitle:"Locality Secretary · Bloemfontein", dataset:"comms", fields:["Notice","Sent date","Delivered"], purpose:"Membership care", justification:"Checking which notices reached my locality before I re-send them.", requested:"27 Aug 2026", duration:"12 months", risk:"standard", note:""},
  {id:"REQ-2440", who:"Johannes Swanepoel", whoTitle:"Estates Officer · Makhanda", dataset:"appointments", fields:["Appointment","Locality","Held since"], purpose:"Operations", justification:"Need the current secretary for each locality when I schedule property inspections.", requested:"26 Aug 2026", duration:"12 months", risk:"standard", note:""}
];
const MYACC_REV_FB = [
  {id:"REV-08", name:"Southern Cluster — half-year access review", scope:"88 people · 11 datasets", owner:"Thato Sekhoto", due:"12 Sep 2026", progress:0, total:6, decided:0,
   items:[
     {who:"Pierre Vermeulen", whoTitle:"Locality Secretary", group:"southern-cluster", dataset:"members", access:"Partial", since:"14 months ago", lastUsed:"94 days ago", normal:true, flag:"Dormant — 3 questions in 14 months"},
     {who:"Martinus Viljoen", whoTitle:"Locality Secretary", group:"southern-cluster", dataset:"meetings", access:"Full", since:"9 months ago", lastUsed:"41 days ago", normal:true, flag:"Suspended in Directory"},
     {who:"Johannes Swanepoel", whoTitle:"Estates Officer", group:"southern-cluster", dataset:"members", access:"Partial", since:"3 months ago", lastUsed:"never", normal:false, flag:"Unusual for role — no other Estates Officer holds this"},
     {who:"Dawid Kruger", whoTitle:"Locality Secretary", group:"southern-cluster", dataset:"meetings", access:"Full", since:"2 years ago", lastUsed:"3 hours ago", normal:true, flag:""},
     {who:"Londiwe Zwane", whoTitle:"Regional Coordinator", group:"ldm-coordinators", dataset:"comms", access:"Partial", since:"7 months ago", lastUsed:"25 minutes ago", normal:true, flag:""},
     {who:"Kobus Prinsloo", whoTitle:"Estates Manager", group:"southern-cluster", dataset:"properties", access:"Full", since:"2 years ago", lastUsed:"3 days ago", normal:true, flag:""}
   ]},
  {id:"REV-07", name:"Personal data in Member records", scope:"34 grants · 1 dataset", owner:"Sindi Mthembu", due:"30 Sep 2026", progress:100, total:3, decided:3,
   items:[
     {who:"Rika Olivier", whoTitle:"Records Officer", group:"records-office", dataset:"members", access:"Full", since:"3 years ago", lastUsed:"2 hours ago", normal:true, flag:""},
     {who:"Zinhle Kunene", whoTitle:"Care Coordinator", group:"safeguarding", dataset:"members", access:"Full", since:"11 months ago", lastUsed:"8 hours ago", normal:true, flag:""},
     {who:"Rethabile Sibanda", whoTitle:"Statistics Analyst", group:"northern-cluster", dataset:"members", access:"Partial", since:"5 months ago", lastUsed:"6 hours ago", normal:true, flag:""}
   ]}
];

/* ---------- defensive accessors ---------- */
function macReqs(){ return (typeof REQUESTS!=='undefined' && REQUESTS && REQUESTS.length) ? REQUESTS : MYACC_REQ_FB; }
function macRevs(){ return (typeof REVIEWS!=='undefined' && REVIEWS && REVIEWS.length) ? REVIEWS : MYACC_REV_FB; }
function macMine(){ var all=macReqs().filter(function(r){return /^Thato/.test(r.who||'');}); return all.length?all:macReqs(); }
function macApps(){
  var all=macReqs().filter(function(r){return r.status==='Pending' && !/^Thato/.test(r.who||'');});
  if(!all.length) all=MYACC_APP_FB;
  var rank={unusual:0, dormant:1, standard:2};
  return all.filter(function(r){return !MYACC_STATE.appDone[r.id];})
            .slice().sort(function(a,b){return (rank[a.risk]==null?2:rank[a.risk])-(rank[b.risk]==null?2:rank[b.risk]);});
}
function macLevel(id){
  if(typeof myAccess==='function'){ try{ var v=myAccess(id); if(v) return v; }catch(e){} }
  var a=(ds(id)||{}).access||'';
  return /^Full/.test(a) ? 'full' : /^Partial/.test(a) ? 'part' : /^Blocked/.test(a) ? 'block' : 'none';
}
function macRuleName(id){
  if(typeof ruleById==='function'){ var r=ruleById(id); if(r&&r.name) return r.name; }
  return MYACC_RULENAMES[id]||id;
}
function macGrantGroup(dsId){
  if(typeof ENTITLEMENTS!=='undefined' && ENTITLEMENTS){
    var rank={full:3,part:2,none:1,block:0}, best=null;
    (ME.groups||[]).forEach(function(g){
      var m=ENTITLEMENTS[g]; if(!m||!m[dsId]) return;
      if(!best || rank[m[dsId]]>rank[best.lvl]) best={id:g, lvl:m[dsId]};
    });
    if(best && best.lvl!=='none' && best.lvl!=='block') return best.id;
  }
  return MYACC_GRANT[dsId]||null;
}
function macGroupName(id){ var g=(typeof groupById==='function')?groupById(id):null; return g?g.name:id; }
function macExpiry(gid){ return MYACC_EXPIRY[gid] || "Expires 31 Mar 2027"; }
function macSay(id){ var d=ds(id)||{}; return MYACC_SAY[id] || [d.access||'—', d.accessNote||'']; }
function macQ(s){ return esc2(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")); }
function macOpenPerson(n){ if(typeof openPerson==='function') openPerson(n); else toast('Person profile is not wired up in this build'); }
function macAsk(id){ var d=ds(id)||{}; askText((d.questions&&d.questions[0]) || ('Show me '+d.name)); }
function macGoRequest(id){ closeModal(); if(typeof requestAccessModal==='function') requestAccessModal(id); else toast('Request form is not wired up in this build'); }

/* =====================================================================
   TAB 1 — What I can see
   ===================================================================== */
function macRuleChips(d){
  if(!d.rules||!d.rules.length) return '<span style="font-size:12px;color:var(--muted)">No rules shape this one.</span>';
  return d.rules.map(function(r){
    return '<button class="fchip2" onclick="event.stopPropagation();openRule(\''+macQ(r)+'\')">'+esc2(macRuleName(r))+'</button>';
  }).join('');
}
function macRow(d){
  var lvl=macLevel(d.id), say=macSay(d.id), gid=macGrantGroup(d.id), meta=MYACC_LVL[lvl];
  var right = (lvl==='full'||lvl==='part')
    ? '<div style="text-align:right;font-size:12px;color:var(--muted);line-height:1.6;min-width:180px">'
        +'<div>Granted by <b style="color:var(--ink)">'+esc2(gid?macGroupName(gid):'—')+'</b></div>'
        +'<div>'+esc2(gid?macExpiry(gid):'—')+'</div></div>'
    : '<div style="text-align:right;font-size:12px;color:var(--muted);min-width:180px">'+(lvl==='block'?'Nothing to grant':'No group of yours holds it')+'</div>';
  return '<div class="lrow" style="align-items:flex-start" onclick="openDataset(\''+d.id+'\')">'
    +'<div class="li">'+(I2[meta.ico]||I2.db)+'</div>'
    +'<div class="lm">'
      +'<div class="lt">'+esc2(d.name)+' '+sensBadge(d.sens)+' '+certBadge(d)+'</div>'
      +'<div style="font-weight:600;font-size:13px;margin-top:4px;color:var(--'+(lvl==='full'?'ok':lvl==='part'?'warn':lvl==='block'?'crit':'muted')+')">'+esc2(say[0])+'</div>'
      +'<div style="font-size:12.5px;color:var(--muted);margin-top:4px;line-height:1.6;max-width:66ch">'+esc2(say[1])+'</div>'
      +'<div class="chipbar" style="margin-top:9px">'+macRuleChips(d)+'</div>'
      +'<div class="rowflex" style="margin-top:11px;gap:8px">'
        +'<button class="btn sm" onclick="event.stopPropagation();macAsk(\''+d.id+'\')">'+I2.msg+' Ask a question</button>'
        +'<button class="btn sm ghost" onclick="event.stopPropagation();macWhy(\''+d.id+'\')">'+I2.info+' Why can&rsquo;t I see more?</button>'
      +'</div>'
    +'</div>'+right+'</div>';
}
function macSeeFilter(l){ MYACC_STATE.lvl=l; macRenderSee(); }
function macSeeSearch(v){ MYACC_STATE.q=v; macRenderSee(); }
function macRenderSee(){
  var el=$('#mac-see-body'); if(!el) return;
  var q=MYACC_STATE.q.trim().toLowerCase();
  var order=['full','part','none','block'], out='';
  order.forEach(function(l){
    if(MYACC_STATE.lvl!=='all' && MYACC_STATE.lvl!==l) return;
    var rows=DATASETS.filter(function(d){
      if(macLevel(d.id)!==l) return false;
      if(!q) return true;
      return (d.name+' '+d.domain+' '+macSay(d.id).join(' ')).toLowerCase().indexOf(q)>=0;
    });
    if(!rows.length) return;
    var m=MYACC_LVL[l];
    out += '<div class="panel"><div class="panel-h">'+(I2[m.ico]||'')+'<span>'+esc2(m.label)+'</span>'
        +'<span class="sub">'+esc2(m.blurb)+'</span><div class="sp"></div>'
        +bdg(rows.length+(rows.length===1?' dataset':' datasets'), m.cls)+'</div>'
        +'<div class="panel-b tight">'+rows.map(macRow).join('')+'</div></div>';
  });
  el.innerHTML = out || emptyState('Nothing matches','Try a different word, or clear the filter.','search');
}
function macWhy(id){
  var d=ds(id)||{}, lvl=macLevel(id), more=MYACC_MORE[id], say=macSay(id);
  var body='<h3>'+esc2(d.name)+'</h3><div class="msub">Why you see what you see, and what would change it.</div>';
  body += '<div class="defblock" style="margin-bottom:16px"><b>Right now:</b> '+esc2(say[0])+'<br>'+esc2(say[1])+'</div>';
  if(lvl==='full' && !more){
    body += callout('ok','You already have everything this dataset holds for your scope. There is no higher level to ask for.');
    openModal(body+modalFoot('Close','Open the dataset','closeModal();openDataset(\''+id+'\')'),560); return;
  }
  var rule=more?more[0]:(d.rules||[])[0], grp=more?more[1]:null, expl=more?more[2]:'';
  body += '<div class="kvlist" style="margin-bottom:16px">'
    +'<div class="r"><span class="k">The rule doing it</span><span class="v">'+esc2(macRuleName(rule))+'</span></div>'
    +'<div class="r"><span class="k">Rule reference</span><span class="v mono">'+esc2(rule||'—')+'</span></div>'
    +'<div class="r"><span class="k">Group that would grant it</span><span class="v">'+(grp?esc2(macGroupName(grp)):'None — no group carries this')+'</span></div>'
    +(grp?'<div class="r"><span class="k">Who owns that group</span><span class="v">'+esc2((groupById(grp)||{}).owner||'—')+'</span></div>':'')
    +'</div>';
  body += callout(lvl==='block'?'crit':'info', esc2(expl));
  body += '<div class="hairline"></div><div style="font-size:12.5px;color:var(--muted);line-height:1.6">This is re-checked every time you ask a question. If your Directory record changes tomorrow, this page changes with it — nobody has to remember to update anything.</div>';
  var act = lvl==='block' ? '' : lvl==='full' ? 'Request the wider grant' : 'Request access';
  openModal(body+'<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    +(rule?'<button class="btn sm ghost" onclick="closeModal();openRule(\''+macQ(rule)+'\')">See the rule</button>':'')
    +(act?'<button class="btn pri" onclick="macGoRequest(\''+id+'\')">'+act+'</button>':'')+'</div>', 580);
}

/* =====================================================================
   TAB 2 — My requests
   ===================================================================== */
function macStages(r){
  if(r.stages && r.stages.length) return r.stages;
  var names=["Your manager","Privacy review","Data owner","Provisioning"], st=r.stage||1;
  return names.map(function(n,i){ return {name:n, who:'—', state:i<st-1?'done':i===st-1?'current':'waiting', when:''}; });
}
function macStepsHTML(r){
  var st=macStages(r), out='<div class="steps" style="margin-bottom:14px">';
  st.forEach(function(s,i){
    var c = s.state==='done'?'done' : s.state==='current'?'on' : '';
    out += '<div class="st '+c+'"><div class="sc">'+(s.state==='done'?'&#10003;':s.state==='skipped'?'&ndash;':(i+1))+'</div>'
        +'<div class="sn2">'+esc2(s.name)+'</div></div>'+(i<st.length-1?'<div class="bar"></div>':'');
  });
  return out+'</div><div class="kvlist">'+st.map(function(s){
    var tone = s.state==='done'?'ok' : s.state==='current'?'info' : s.state==='skipped'?'mut':'mut';
    return '<div class="r"><span class="k">'+esc2(s.name)+' &middot; '+esc2(s.who)+'</span><span class="v">'
      +bdg(s.state==='done'?('Decided '+(s.when||'')):s.state==='current'?(s.when||'With them now'):s.state==='skipped'?'Skipped':'Not started', tone)+'</span></div>';
  }).join('')+'</div>';
}
/* a pending request is yours to withdraw. Nothing was granted, so nothing is lost. */
function macWithdrawAsk(id){
  var r = macMine().filter(function(x){ return x.id===id; })[0]; if(!r) return;
  var d = ds(r.dataset)||{name:r.dataset};
  confirmAsk({title:'Withdraw your request for '+esc2(d.name)+'?',
    body:'It leaves the approver\'s queue now. Nothing was granted, so nothing changes for you — and asking again later carries the purpose and justification over.',
    verb:'Withdraw', onConfirm:function(){ r.status='Withdrawn'; r.stage='Withdrawn'; toast('Withdrawn — '+r.id); macRenderReq(); var c=$('#acc-count'); if(c) c.textContent=macApps().length; }});
}
function macReqCard(r){
  var d=ds(r.dataset)||{name:r.dataset}, s=r.status;
  var tone = s==='Completed'?'ok' : s==='Approved'?'info' : s==='Declined'?'crit' : s==='Expired'?'warn' : 'mut';
  var note='';
  if(s==='Withdrawn') note = callout('mut','<b>Withdrawn by you.</b> Nobody decided it and nothing was granted. Ask again any time — the purpose and justification carry over.');
  if(s==='Approved') note = callout('warn','<b>Approved, not yet live.</b> Every approver has said yes. You still cannot see this data: provisioning is a separate step and it runs tonight at 02:00. Spiff will not show you as holding access until the grant actually exists.');
  if(s==='Completed') note = callout('ok','<b>Live since 12 Aug, 03:14.</b> Approved and provisioned. Ask a question of it and the rows come back.');
  /* a request that was never granted can still expire — unanswered. That is
     not a grant running its course, and the card must not say it was. */
  var wasGrant = s==='Expired' && r.duration && r.duration!=='—';
  if(s==='Declined'){
    var dec = (r.stages||[]).filter(function(st){ return /^Declined/.test(st.when||''); })[0];
    var by  = dec ? (dec.who==='Automatic' ? 'the policy check' : dec.who) : (r.decidedBy||'the approver');
    var on  = dec ? dec.when.replace(/^Declined\s*/,'') : (r.decidedOn||'');
    /* the outcome sentence opens by restating who declined it; the heading already says that */
    var why = (r.outcome||r.reason||'No reason was recorded.').replace(/^Declined[^.]*\.\s*/,'');
    note = callout('crit','<b>Declined by '+esc2(by)+(on?' on '+esc2(on):'')+'.</b><br>'+esc2(why));
  }
  if(s==='Expired') note = wasGrant
    ? callout('warn','<b>This grant ran its course.</b> It lasted '+esc2(r.duration)+' and ended on schedule. Renewing is a shorter conversation than requesting from scratch — the purpose and justification carry over.')
    : callout('warn','<b>This request expired unanswered.</b> '+esc2(r.outcome||'Nobody decided it inside the window, so it lapsed. Asking again carries the purpose and justification over.'));
  var acts = '<button class="btn sm" onclick="openDataset(\''+macQ(r.dataset)+'\')">Open the dataset</button>';
  if(wasGrant) acts = '<button class="btn sm pri" onclick="macRenew(\''+macQ(r.id)+'\')">'+I2.refresh+' Renew</button>'+acts;
  if(s==='Expired' && !wasGrant) acts = '<button class="btn sm pri" onclick="macGoRequest(\''+macQ(r.dataset)+'\')">Ask again</button>'+acts;
  if(s==='Declined') acts = '<button class="btn sm" onclick="macGoRequest(\''+macQ(r.dataset)+'\')">Ask again with a narrower scope</button>'+acts;
  return panel('<span class="mono" style="font-size:12.5px;opacity:.6">'+esc2(r.id)+'</span> &nbsp; '+esc2(d.name),
    '<div class="kvlist" style="margin-bottom:16px">'
      +'<div class="r"><span class="k">What you asked for</span><span class="v">'+esc2(macFieldList(r)||'Whole dataset')+'</span></div>'
      +'<div class="r"><span class="k">Purpose</span><span class="v">'+esc2(r.purpose||'—')+'</span></div>'
      +'<div class="r"><span class="k">Requested</span><span class="v">'+esc2(r.requested||'—')+'</span></div>'
      +'<div class="r"><span class="k">Duration asked for</span><span class="v">'+esc2(r.duration||'—')+'</span></div>'
    +'</div>'
    +'<div class="defblock" style="margin-bottom:18px">'+esc2(r.justification||'')+'</div>'
    +macStepsHTML(r)+(note?'<div style="margin-top:16px">'+note+'</div>':''),
    {sub:'', act:bdg(s, tone)+(s==='Pending'?kebabHTML([{label:'Withdraw request', icon:'x', danger:true, onclick:"macWithdrawAsk('"+macQ(r.id)+"')"}]):''),
     foot:'<div class="rowflex" style="gap:8px">'+acts+'</div>'});
}
function macRenew(id){
  var r=macMine().filter(function(x){return x.id===id;})[0]||{};
  openModal('<h3>Renew this grant</h3><div class="msub">Travel bookings, same fields, same purpose.</div>'
    +callout('info','Renewal reuses the purpose and justification you already wrote. It still goes to '+esc2((macStages(r)[2]||{}).who||'the data owner')+' — a renewal is a decision, not a formality.')
    +'<div class="field"><label>How long this time</label><select><option>90 days</option><option>180 days</option><option>Until 31 Mar 2027</option></select></div>'
    +modalFoot('Cancel','Send renewal','closeModal();toast(\'Renewal sent — REQ-2104 reopened with Colette Marais\')'),520);
}
function macRenderReq(){
  var el=$('#mac-req-body'); if(!el) return;
  var mine=macMine();
  const stRank = {Pending:0, Approved:1, Completed:2, Declined:3, Expired:4, Withdrawn:5};
  el.innerHTML = listFrame("mac-req", {
    items: mine, repaint: macRenderReq, noun: "requests", noun1: "request", size: 10,
    search: function(r){ var d=ds(r.dataset)||{}; return r.id+' '+(d.name||r.dataset)+' '+(r.purpose||'')+' '+r.status; },
    placeholder: "Search your requests by dataset, purpose or reference…",
    sorts: [{key:"newest", label:"Newest first", get:function(r){ return catalogDateKey(r.requested); }, desc:true},
            {key:"status", label:"Status",       get:function(r){ return stRank[r.status]==null ? 9 : stRank[r.status]; }},
            {key:"ds",     label:"Dataset",      get:function(r){ var d=ds(r.dataset)||{}; return d.name||r.dataset; }}],
    row: macReqCard, bodyClass: "stack",
    emptyTitle: 'You have not asked for anything', emptySub: 'When you request a dataset, it lands here with its approval chain.', emptyIcon: 'file'
  });
}

/* =====================================================================
   TAB 3 — Approvals
   ===================================================================== */
function macPeers(r){
  var p=(typeof personByName==='function')?personByName(r.who):null;
  if(!p) return {n:0, names:[]};
  var peers=PEOPLE.filter(function(x){
    return x.name!==p.name && (x.title===p.title || (x.roles||[]).some(function(ro){return (p.roles||[]).indexOf(ro)>=0;}));
  });
  return {n:peers.length, names:peers.slice(0,4).map(function(x){return x.name;}), title:p.title};
}
function macAppRow(r,i){
  var d=ds(r.dataset)||{name:r.dataset}, pe=macPeers(r);
  var tone = r.risk==='unusual'?'crit' : r.risk==='dormant'?'warn' : 'mut';
  var label = r.risk==='unusual'?'Unusual for this person' : r.risk==='dormant'?'Dormant requester' : 'Standard for role';
  return '<div style="padding:17px 18px;border-bottom:1px solid var(--hair2)">'
    +'<div class="rowflex" style="gap:12px;align-items:flex-start">'
      +'<div onclick="macOpenPerson(\''+macQ(r.who)+'\')" style="cursor:pointer">'+personChip(r.who, r.whoTitle)+'</div>'
      +'<div class="sp"></div>'+bdg(label, tone)+'<span class="mono" style="font-size:12px;color:var(--muted)">'+esc2(r.id)+'</span>'
    +'</div>'
    +'<div class="kvlist" style="margin-top:14px">'
      +'<div class="r"><span class="k">Wants</span><span class="v">'+esc2(d.name)+' &middot; '+esc2(macFieldList(r))+'</span></div>'
      +'<div class="r"><span class="k">Purpose</span><span class="v">'+esc2(r.purpose||'—')+'</span></div>'
      +'<div class="r"><span class="k">For how long</span><span class="v">'+esc2(r.duration||'—')+'</span></div>'
      +'<div class="r"><span class="k">Asked</span><span class="v">'+esc2(r.requested||'—')+'</span></div>'
    +'</div>'
    +'<div class="defblock" style="margin-top:13px">'+esc2(r.justification||'')+'</div>'
    +(r.note?'<div style="margin-top:12px">'+callout(tone==='crit'?'crit':'warn', esc2(r.note))+'</div>':'')
    +'<div class="rowflex" style="margin-top:13px;gap:10px;font-size:12.5px;color:var(--muted)">'
      +(pe.n?'<div class="avstack">'+pe.names.map(function(n){return avatar(n,'sm');}).join('')+(pe.n>4?'<span class="more">+'+(pe.n-4)+'</span>':'')+'</div>':'')
      +'<span>'+(pe.n?esc2(pe.n+' other people with the same role already hold something like this'):'Nobody else with this role holds it')+'</span>'
    +'</div>'
    +'<div class="rowflex" style="margin-top:14px;gap:8px">'
      +'<button class="btn sm pri" onclick="macApprove(\''+macQ(r.id)+'\')">'+I2.check+' Approve</button>'
      +'<button class="btn sm danger" onclick="macDecline(\''+macQ(r.id)+'\')">'+I2.x+' Decline</button>'
      +'<button class="btn sm ghost" onclick="toast(\'Question sent to '+macQ(r.who)+' — the request stays with you until they answer\')">'+I2.msg+' Ask a question</button>'
    +'</div></div>';
}
function macFindApp(id){ return macApps().filter(function(r){return r.id===id;})[0] || MYACC_APP_FB.filter(function(r){return r.id===id;})[0] || {}; }
function macNoteGate(noteId, btnId){
  var t=document.getElementById(noteId), b=document.getElementById(btnId); if(!t||!b) return;
  var ok=t.value.trim().length>3; b.disabled=!ok; b.style.opacity=ok?'1':'.45';
}
function macApprove(id){
  var r=macFindApp(id), d=ds(r.dataset)||{name:r.dataset};
  openModal('<h3>Approve for '+esc2(r.who)+'</h3><div class="msub">'+esc2(d.name)+' &middot; '+esc2(macFieldList(r))+'</div>'
    +callout('info','<b>What this does.</b> '+esc2(r.who)+' gets these fields under their own scope, not yours — the rules re-run for them on every question. Approving does not provision: the grant goes live at the next nightly run and they will see it as Approved until then.')
    +'<div class="field"><label>How long</label><select id="mac-approve-dur"><option>30 days</option><option>90 days</option><option selected>180 days</option><option>Until 31 Mar 2027</option><option>12 months</option></select></div>'
    +'<div class="field"><label>Why you are approving — required, and kept with the grant</label><div class="fcontrol">'
      +'<textarea id="mac-approve-note" rows="3" placeholder="One line an auditor could read in a year." oninput="macNoteGate(\'mac-approve-note\',\'mac-approve-go\')"></textarea></div></div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>'
    +'<button class="btn pri" id="mac-approve-go" disabled style="opacity:.45" onclick="macApproveGo(\''+macQ(id)+'\')">Approve</button></div>', 560);
}
function macApproveGo(id){
  var r=macFindApp(id); MYACC_STATE.appDone[id]='approved'; closeModal();
  toast('Approved — '+r.who+' goes live at tonight\u2019s run'); macRenderApp();
}
function macDecline(id){
  var r=macFindApp(id), d=ds(r.dataset)||{name:r.dataset};
  openModal('<h3>Decline for '+esc2(r.who)+'</h3><div class="msub">'+esc2(d.name)+'</div>'
    +callout('crit','<b>Blast radius.</b> '+esc2(r.who)+' keeps everything they already have and gains nothing. They are told who declined and why, in your words — so write the reason for them, not for the file. Nothing they can currently see changes.')
    +'<div class="field"><label>Reason — required, and shown to them verbatim</label><div class="fcontrol">'
      +'<textarea id="mac-dec-note" rows="3" placeholder="What would need to be different for this to be a yes?" oninput="macNoteGate(\'mac-dec-note\',\'mac-dec-go\')"></textarea></div></div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>'
    +'<button class="btn danger" id="mac-dec-go" disabled style="opacity:.45" onclick="macDeclineGo(\''+macQ(id)+'\')">Decline</button></div>', 560);
}
function macDeclineGo(id){
  var r=macFindApp(id); MYACC_STATE.appDone[id]='declined'; closeModal();
  toast('Declined — '+r.who+' has been told, with your reason'); macRenderApp();
}
function macBulk(){
  var std=macApps().filter(function(r){return r.risk==='standard';});
  if(!std.length){ toast('Nothing standard-for-role is waiting'); return; }
  openModal('<h3>Approve '+std.length+' standard requests</h3><div class="msub">Everything here matches what people in the same role already hold.</div>'
    +'<div class="panel-b tight" style="border:1px solid var(--hair);border-radius:12px;margin-bottom:16px">'
      +std.map(function(r){var d=ds(r.dataset)||{name:r.dataset};
        return '<div class="lrow" style="cursor:default"><div class="lm"><div class="lt">'+esc2(r.who)+'</div>'
        +'<div class="ls">'+esc2(d.name)+' &middot; '+esc2(macFieldList(r))+'</div></div>'
        +'<div class="lr">'+esc2(r.duration||'')+'</div></div>';}).join('')
    +'</div>'
    +callout('warn','<b>Blast radius.</b> '+std.length+' people gain access at tonight&rsquo;s run, each under their own scope. Nothing widens for anyone else. You can revoke any of them from the next access review, and every one of these expires on its own.')
    +'<div class="field"><label>One note covering all '+std.length+' — required</label><div class="fcontrol">'
      +'<textarea id="mac-bulk-note" rows="2" placeholder="Standard for role, checked against peers." oninput="macNoteGate(\'mac-bulk-note\',\'mac-bulk-go\')"></textarea></div></div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>'
    +'<button class="btn pri" id="mac-bulk-go" disabled style="opacity:.45" onclick="macBulkGo()">Approve all '+std.length+'</button></div>', 600);
}
function macBulkGo(){
  var std=macApps().filter(function(r){return r.risk==='standard';});
  std.forEach(function(r){ MYACC_STATE.appDone[r.id]='approved'; });
  closeModal(); toast(std.length+' requests approved — all go live tonight'); macRenderApp();
}
function macRenderApp(){
  var el=$('#mac-app-body'); if(!el) return;
  var list=macApps(), std=list.filter(function(r){return r.risk==='standard';});
  var badge=document.querySelector('[data-tabs="mac"] [data-tab="app"] .n');
  if(badge) badge.textContent=list.length;
  if(!list.length){
    el.innerHTML = panel('Your queue', emptyState('Nothing is waiting on you','Every request for the Southern Cluster has a decision. New ones land here and nobody is blocked in the meantime.','check'), {icon:'check'});
    return;
  }
  el.innerHTML =
    callout('info','Sorted the way you should read it: <b>unusual first</b>, then people who have not used what they already have, then the ordinary ones. The ordinary ones are the bottom of the list on purpose.')
   +panel('Waiting on you',
      listFrame("mac-app", {
        items: list, repaint: macRenderApp, noun: "requests", noun1: "request", size: 10,
        sorts: [{key:"risk",   label:"Unusual first", get:function(r){ var k={unusual:0,dormant:1,standard:2}; return k[r.risk]==null?9:k[r.risk]; }},
                {key:"newest", label:"Newest first",  get:function(r){ return catalogDateKey(r.requested); }, desc:true},
                {key:"who",    label:"Person",        get:function(r){ return r.who; }},
                {key:"ds",     label:"Dataset",       get:function(r){ var d=ds(r.dataset)||{}; return d.name||r.dataset; }}],
        row: macAppRow
      }),
      {icon:'clock', sub:'Southern Cluster', tight:true,
       act: std.length ? '<button class="btn sm" onclick="macBulk()">'+I2.check+' Approve all '+std.length+' standard-for-role</button>' : '',
       foot:'<span style="font-size:12.5px;color:var(--muted)">Approving grants under <b>their</b> scope, never yours. Every grant you make here has an end date and comes back to you at the next review.</span>'});
}

/* =====================================================================
   TAB 4 — Access reviews
   ===================================================================== */
function macRevTotal(r){ return r.total || (r.items||[]).length; }
function macRevDecided(r){
  var mine=MYACC_STATE.revDec[r.id]||{};
  return Math.min(macRevTotal(r), (r.decided||0) + Object.keys(mine).length);
}
function macChanged(it){ return !!it.flag || it.normal===false; }
function macRevCard(r){
  var tot=macRevTotal(r), dec=macRevDecided(r), pct=tot?Math.round(dec/tot*100):0;
  return '<div class="panel"><div class="panel-h">'+I2.shield+'<span>'+esc2(r.name)+'</span>'
    +'<span class="sub">'+esc2(r.scope||'')+'</span><div class="sp"></div>'
    +bdg(dec===tot?'Ready to sign off':'In progress', dec===tot?'ok':'warn')+'</div>'
    +'<div class="panel-b">'
      +'<div class="kvlist" style="margin-bottom:14px">'
        +'<div class="r"><span class="k">Owner</span><span class="v">'+esc2(r.owner||'—')+'</span></div>'
        +'<div class="r"><span class="k">Due</span><span class="v">'+esc2(r.due||'—')+'</span></div>'
        +'<div class="r"><span class="k">Decided</span><span class="v mono">'+dec+' of '+tot+'</span></div>'
      +'</div>'
      +meter(pct, pct===100?'ok':'')
      +'<div style="font-size:12.5px;color:var(--muted);margin-top:10px;line-height:1.6">You cannot sign this off until every item has a decision. That is the point of it — a review with gaps in it is not a review.</div>'
    +'</div>'
    +'<div class="panel-f"><button class="btn sm pri" onclick="macOpenReview(\''+macQ(r.id)+'\')">'+(MYACC_STATE.revOpen===r.id?'Close':'Open')+' this review</button></div></div>';
}
function macRevRow(r,it,i){
  var dec=(MYACC_STATE.revDec[r.id]||{})[i];
  var d=ds(it.dataset)||{name:it.dataset};
  var dormant=/never|days ago|months? ago|year/.test(it.lastUsed||'') && !/hours?|minutes?/.test(it.lastUsed||'');
  var btn=function(k,lbl,c){
    return '<button class="btn sm'+(c?' '+c:'')+(dec===k?' pri':'')+'" onclick="macDecide(\''+macQ(r.id)+'\','+i+',\''+k+'\')">'+esc2(lbl)+'</button>';
  };
  return '<tr>'
    +'<td><div onclick="macOpenPerson(\''+macQ(it.who)+'\')" style="cursor:pointer">'+personChip(it.who, it.whoTitle)+'</div></td>'
    +'<td>'+esc2(macGroupName(it.group))+'</td>'
    +'<td><span onclick="openDataset(\''+macQ(it.dataset)+'\')" style="cursor:pointer;color:var(--accent);font-weight:600">'+esc2(d.name)+'</span></td>'
    +'<td>'+bdg(it.access, it.access==='Full'?'ok':'warn')+'</td>'
    +'<td class="mono" style="font-size:12px">'+esc2(it.since||'—')+'</td>'
    +'<td class="mono" style="font-size:12px;color:var(--'+(dormant?'crit':'muted')+');font-weight:'+(dormant?'700':'400')+'">'+esc2(it.lastUsed||'—')+'</td>'
    +'<td>'+(it.normal===false?bdg('Unusual','crit'):bdg('Normal','mut'))+(it.flag?'<div style="font-size:11.5px;color:var(--warn);margin-top:4px;max-width:26ch;line-height:1.5">'+esc2(it.flag)+'</div>':'')+'</td>'
    +'<td><div class="rowflex" style="gap:5px;justify-content:flex-end">'
      +btn('keep','Keep')+btn('limit','Time-limit')+btn('delegate','Delegate')
      +'<button class="btn sm danger'+(dec==='revoke'?' pri':'')+'" onclick="macRevoke(\''+macQ(r.id)+'\','+i+')">Revoke</button>'
    +'</div></td></tr>';
}
function macDecide(rid,i,k){
  MYACC_STATE.revDec[rid]=MYACC_STATE.revDec[rid]||{};
  MYACC_STATE.revDec[rid][i]=k;
  toast(k==='keep'?'Kept — the clock resets for another six months':k==='limit'?'Time-limited to 90 days — it expires rather than needing another review':'Delegated to the group owner for a second opinion');
  macRenderRev();
}
function macRevoke(rid,i){
  var r=macRevs().filter(function(x){return x.id===rid;})[0]||{}, it=(r.items||[])[i]||{}, d=ds(it.dataset)||{name:it.dataset};
  openModal('<h3>Revoke '+esc2(d.name)+' from '+esc2(it.who)+'</h3><div class="msub">Held since '+esc2(it.since||'—')+' &middot; last used '+esc2(it.lastUsed||'—')+'</div>'
    +callout('crit','<b>Blast radius.</b> '+esc2(it.who)+' loses '+esc2(d.name)+' at their very next question — within a minute, not overnight. Answers they have already saved from it keep their shape but come back empty, labelled &ldquo;no rows you can see&rdquo; rather than failing silently. Any automation of theirs that reads it runs and returns nothing. They keep every other grant. Nobody else is affected.')
    +'<div class="field"><label>Reason — required, kept with the item and shown to them</label><div class="fcontrol">'
      +'<textarea id="mac-rev-note" rows="3" placeholder="e.g. No longer needed for the role — Estates inspections use Appointments instead." oninput="macNoteGate(\'mac-rev-note\',\'mac-rev-go\')"></textarea></div></div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>'
    +'<button class="btn danger" id="mac-rev-go" disabled style="opacity:.45" onclick="macRevokeGo(\''+macQ(rid)+'\','+i+')">Revoke access</button></div>', 600);
}
function macRevokeGo(rid,i){
  MYACC_STATE.revDec[rid]=MYACC_STATE.revDec[rid]||{};
  MYACC_STATE.revDec[rid][i]='revoke';
  closeModal(); toast('Revoked — takes effect at their next question'); macRenderRev();
}
function macSignoff(rid){
  var r=macRevs().filter(function(x){return x.id===rid;})[0]||{}, mine=MYACC_STATE.revDec[rid]||{};
  var rev=Object.keys(mine).filter(function(k){return mine[k]==='revoke';}).length;
  var kept=macRevDecided(r)-rev;
  openModal('<h3>Sign off '+esc2(r.name)+'</h3><div class="msub">This closes the campaign and puts your name on it.</div>'
    +callout('warn','<b>Blast radius.</b> '+rev+' revocation'+(rev===1?'':'s')+' take effect immediately &mdash; '+rev+' '+(rev===1?'person loses':'people lose')+' access at their next question. '+kept+' grants are kept and get a fresh six-month clock. The whole set is written to the activity log against your name and cannot be edited afterwards.')
    +modalFoot('Not yet','Sign off','closeModal();toast(\'Signed off — the campaign is closed and logged\')'), 560);
}
function macDiff(){ MYACC_STATE.diff=!MYACC_STATE.diff; macRenderRev(); }
function macOpenReview(id){ MYACC_STATE.revOpen = (MYACC_STATE.revOpen===id)?null:id; macRenderRev(); }
function macRenderRev(){
  var el=$('#mac-rev-body'); if(!el) return;
  var revs=macRevs(), open=revs.filter(function(r){return r.id===MYACC_STATE.revOpen;})[0];
  var cards=listFrame("mac-rev", {
    items: revs, repaint: macRenderRev, noun: "reviews", noun1: "review", size: 10,
    sorts: [{key:"due",      label:"Due soonest",          get:function(r){ return catalogDateKey(r.due); }},
            {key:"name",     label:"Name",                 get:function(r){ return r.name; }},
            {key:"progress", label:"Least decided first",  get:function(r){ return macRevDecided(r)/Math.max(1,macRevTotal(r)); }}],
    row: macRevCard, bodyClass: "g2"
  });
  if(!open){ el.innerHTML=cards; return; }
  var items=(open.items||[]).map(function(it,i){return {it:it,i:i};});
  var shown = MYACC_STATE.diff ? items.filter(function(x){return macChanged(x.it);}) : items;
  var tot=macRevTotal(open), dec=macRevDecided(open), ready=dec>=tot;
  var table = shown.length
    ? '<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Person</th><th>Group</th><th>Dataset</th><th>Access</th><th>Granted</th><th>Last used</th><th>Normal for role</th><th style="text-align:right">Decision</th></tr></thead><tbody>'
      +shown.map(function(x){return macRevRow(open,x.it,x.i);}).join('')+'</tbody></table></div>'
    : emptyState('Nothing changed since the June review','Every grant in this campaign is exactly as you left it last time. Turn the toggle off to see the full list.','check');
  el.innerHTML = cards
    + panel(esc2(open.name),
        callout('info','<b>Last used is the column that matters.</b> A grant nobody has used in three months is the cheapest thing you will ever revoke. Everything here is a person, a group and a dataset &mdash; never a table and a username.')
        +'<div class="rowflex" style="margin:14px 0 16px;gap:12px">'
          +sw(MYACC_STATE.diff,'macDiff()')
          +'<div><div style="font-weight:600;font-size:13.5px">Review the diff, not the list</div>'
          +'<div style="font-size:12.5px;color:var(--muted)">Show only what changed since the last review &mdash; '+items.filter(function(x){return macChanged(x.it);}).length+' of '+items.length+' items.</div></div>'
          +'<div class="sp"></div>'
          +'<div style="min-width:180px">'+meter(tot?Math.round(dec/tot*100):0, ready?'ok':'')
          +'<div class="mono" style="font-size:11.5px;color:var(--muted);margin-top:6px;text-align:right">'+dec+' of '+tot+' decided</div></div>'
        +'</div>'+table,
        {icon:'list', sub:esc2(open.scope||''),
         act:'<button class="btn sm ghost" onclick="macOpenReview(\''+macQ(open.id)+'\')">Close</button>',
         foot:'<div class="rowflex" style="gap:12px">'
           +'<button class="btn pri" '+(ready?'':'disabled style="opacity:.45"')+' onclick="'+(ready?'macSignoff(\''+macQ(open.id)+'\')':'toast(\'Still '+(tot-dec)+' items without a decision\')')+'">'+I2.check+' Sign off</button>'
           +'<span style="font-size:12.5px;color:var(--muted)">'+(ready
              ? 'Every item has a decision. Signing off closes the campaign and logs it against your name.'
              : (tot-dec)+' item'+((tot-dec)===1?'':'s')+' still need a decision. Sign-off stays locked until then &mdash; a partial review is worse than none, because it looks finished.')+'</span></div>'});
}

/* =====================================================================
   Page
   ===================================================================== */
function renderMyAccess(){
  var counts={full:0,part:0,none:0,block:0};
  DATASETS.forEach(function(d){ counts[macLevel(d.id)]++; });
  var sentence = counts.full+' datasets in full, '+counts.part+' in part, '+counts.none
    +' you would have to request, and '+counts.block+' blocked for everyone.';
  var apps=macApps(), mine=macMine();

  var strip='<div class="g4" style="margin-bottom:20px">'
    +kpi('In full', counts.full, 'Every row in your scope')
    +kpi('In part', counts.part, 'Rows yes, some fields hidden')
    +kpi('Would have to ask', counts.none, 'Nothing of yours carries them')
    +kpi('Blocked for everyone', counts.block, 'Policy, not permission')
    +'</div>';

  var changed='<div class="tline">'+MYACC_CHANGES.map(function(c){
    return '<div class="tev"><div class="td3 '+c[3]+'"></div><div class="tt2">'+esc2(c[0])+'</div>'
      +'<div class="ts2">'+esc2(c[2])+'</div><div class="tw">'+esc2(c[1])+'</div></div>';
  }).join('')+'</div>';

  var see='<div class="split">'
    +'<div>'
      +'<div class="bigsearch" style="margin-bottom:12px">'+I2.search
        +'<input placeholder="Find a dataset — meetings, travel, budgets…" oninput="macSeeSearch(this.value)" value="'+esc2(MYACC_STATE.q)+'"></div>'
      +'<div class="chipbar" style="margin-bottom:16px">'
        +['all','full','part','none','block'].map(function(l){
          var lbl = l==='all' ? 'Everything ('+DATASETS.length+')' : MYACC_LVL[l].label+' ('+counts[l]+')';
          return '<button class="fchip2'+(MYACC_STATE.lvl===l?' on':'')+'" onclick="macSeeFilter(\''+l+'\')">'+esc2(lbl)+'</button>';
        }).join('')
      +'</div>'
      +'<div class="mutedtext" style="font-size:12.5px;margin:-6px 0 12px">Grouped by what you can see — in full first — and in catalogue order inside each group.</div>'
      +'<div id="mac-see-body" class="stack"></div>'
    +'</div>'
    +'<div class="stack">'
      +panel('What changed for me', changed, {icon:'clock', sub:'Last 90 days'})
      +panel('Where this comes from',
        '<div class="kvlist">'
          +'<div class="r"><span class="k">Your groups</span><span class="v">'+ME.groups.map(function(g){return esc2(macGroupName(g));}).join('<br>')+'</span></div>'
          +'<div class="r"><span class="k">Your localities</span><span class="v">'+ME.localities.length+' of '+ORG.localityCount+'</span></div>'
          +'<div class="r"><span class="k">Last reviewed</span><span class="v">'+esc2(ME.lastReview)+'</span></div>'
        +'</div><div class="hairline"></div>'
        +'<div style="font-size:12.5px;color:var(--muted);line-height:1.65">Nothing on this page is granted to you personally. It all comes from a group, and every group is either synced from Directory or driven by an attribute rule. Change your area in Directory and this page changes on the next question you ask &mdash; no ticket, no admin.</div>',
        {icon:'people'})
    +'</div></div>';

  var req='<div class="rowflex" style="margin-bottom:16px"><div style="font-size:13.5px;color:var(--muted);max-width:70ch">'
    +'Approved and Completed are deliberately different words. Approved means every person has said yes; Completed means the grant actually exists and you can see the data. Spiff will never show you as holding access you do not hold.'
    +'</div><div class="sp"></div><button class="btn pri" onclick="go(\'catalog\')">'+I2.plus+' New request</button></div>'
    +'<div id="mac-req-body"></div>';

  /* Approvals and Access reviews are queues of work assigned to you, not
     descriptions of your own access. They moved to Access administration on
     9 Sep 2026, which is where the other administrative queues already live.
     What is left here is genuinely yours: what you can see, and what you
     asked for. */
  $('#view-myaccess').innerHTML =
     pageHead({eyebrow:'Access', title:'My access',
       desc:'What you can see, and what you have asked for. '+esc2(sentence),
       badges: bdg(ME.title,'mut') + bdg('Scoped to '+ME.localities.length+' localities','info','eye') + bdg(ME.groups.length+' groups','mut','people'),
       acts:'<button class="btn" onclick="openPerson(ME.full)">'+I2.people+' My full profile</button>'
            +'<button class="btn" onclick="startSim(\'Dawid Kruger\')">'+I2.eye+' View as someone else</button>'
            +'<button class="btn" onclick="go(\'catalog\')">'+I2.db+' Data catalogue</button>'})
    +strip
    +((apps.length||macRevs().length)
      ? callout('warn','<b>'+(apps.length?fmt(apps.length)+' approval'+(apps.length===1?'':'s'):'')
          +(apps.length&&macRevs().length?' and ':'')
          +(macRevs().length?fmt(macRevs().length)+' access review'+(macRevs().length===1?'':'s'):'')
          +' are waiting on you.</b> Those are other people\'s access, not yours, so they live in '
          +'<button class="lnk" onclick="go(\'people\')">Access administration</button>.')
      : '')
    +tabsHTML('mac', [['see','What I can see',DATASETS.length],['req','My requests',mine.length]], 'see')
    +pane('mac','see',see,true)
    +pane('mac','req',req);

  macRenderSee(); macRenderReq();
}
V2ROUTES.myaccess = renderMyAccess;
</script>
