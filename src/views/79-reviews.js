<script>
/* =====================================================================
   Every "In review" reaches the Inbox — 15 Sep 2026
   Thato asked who reviews what, and from where. The Inbox is the one
   queue; four kinds of review never reached it and one was addressed to
   the wrong person. Now: a template in review goes to its approver; a
   proposed change to a definition goes to the term's owner with the
   impact list; a rule in review goes to its approvers with Approve and
   Send back; a budget raise goes to the Platform Admins; a watch card
   that crosses its line sends a notice. Same handlers everywhere: a
   decision made here is the decision.
   ===================================================================== */

/* ---------- the new kinds ---------- */
INBOX_KINDS.template   = {label:"Template in review",  icon:"file",  sev:"info", due:"none — drafts are recommended to nobody"};
INBOX_KINDS.definition = {label:"Definition proposed", icon:"book",  sev:"warn", due:"none — every answer keeps the current version until agreed"};
INBOX_KINDS.raise      = {label:"Budget raise",        icon:"trend", sev:"warn", due:"before month end"};
if(typeof NOTICE_KINDS !== "undefined") NOTICE_KINDS.threshold = {label:"Threshold crossed", icon:"bolt"};

/* ---------- definition proposals ---------- */
const PROPOSALS = [
  {id:"prop-1", term:"Attendance", by:"Pavitra Govender", on:"yesterday 15:20", status:"waiting",
   wording:"A member with a confirmed check-in at a meeting of type Regular or Special. Excludes cancelled meetings and duplicate check-ins within four hours. Visitor check-ins are counted separately and never in the member total.",
   why:"Two localities have been adding visitors into attendance since the check-in rewrite; their rates read four points high against the rest of the division."}
];
function proposalById(id){ return PROPOSALS.filter(function(p){ return p.id===id; })[0]; }
function glossImpact(term){
  const dsets = DATASETS.filter(function(d){ return (d.fields||[]).some(function(f){ return f.glossary===term; }); });
  const answers = Object.keys(ANSWERS).filter(function(k){ return (ANSWERS[k].metric||"").toLowerCase().indexOf(term.toLowerCase())>=0 || (ANSWERS[k].q||"").toLowerCase().indexOf(term.toLowerCase())>=0; });
  const autos = (typeof WORKFLOWS!=="undefined" ? WORKFLOWS : []).filter(function(w){ return JSON.stringify(w).toLowerCase().indexOf(term.toLowerCase())>=0; });
  return {datasets:dsets, answers:answers, autos:autos};
}
function glossImpactModal(pid){
  const p = proposalById(pid); if(!p) return; const g = GLOSSARY.filter(function(x){ return x.term===p.term; })[0]; const im = glossImpact(p.term);
  openModal('<h3>What changes if “'+esc2(p.term)+'” changes</h3>'
    + '<div class="msub">Version '+g.version+' → '+(g.version+1)+'. Everything below recomputes on its next run; nothing is re-stated retrospectively.</div>'
    + '<div class="g2">'
    + '<div><div class="lbl2">Now</div><div class="defblock">'+esc2(g.def)+'</div></div>'
    + '<div><div class="lbl2">Proposed by '+esc2(p.by)+'</div><div class="defblock" style="border-color:var(--accent)">'+esc2(p.wording)+'</div></div>'
    + '</div>'
    + '<div class="lbl2" style="margin-top:14px">Why</div><div style="font-size:13.5px;line-height:1.55">'+esc2(p.why)+'</div>'
    + '<div class="lbl2" style="margin-top:14px">Impact · '+(g.used||im.datasets.length)+' places</div>'
    + '<div class="stack" style="gap:6px">'
    + im.datasets.map(function(d){ return '<div class="lrow" onclick="closeModal();openDataset(\''+esc2(d.id)+'\')"><div class="li">'+I2.db+'</div><div class="lm"><div class="lt">'+esc2(d.name)+'</div><div class="ls">dataset · fields that carry this word</div></div><div class="lr">'+I2.chev+'</div></div>'; }).join('')
    + im.answers.slice(0,4).map(function(k){ return '<div class="lrow" onclick="closeModal();openFromCard(\''+k+'\')"><div class="li">'+I2.file+'</div><div class="lm"><div class="lt">'+esc2(ANSWERS[k].q)+'</div><div class="ls">saved answer · re-runs on the new version when next opened</div></div><div class="lr">'+I2.chev+'</div></div>'; }).join('')
    + '</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button><button class="btn danger" onclick="closeModal();glossDeclineGo(\''+pid+'\')">Decline</button><button class="btn pri" onclick="closeModal();glossAgreeGo(\''+pid+'\')">Agree — version '+(g.version+1)+'</button></div>', 720);
}
function glossAgreeGo(pid){
  const p = proposalById(pid); if(!p || p.status!=="waiting") return; const g = GLOSSARY.filter(function(x){ return x.term===p.term; })[0];
  g.def = p.wording; g.version += 1; g.agreed = FX.short; p.status = "agreed";
  inboxMarkDone("def:"+pid, "Agreed");
  NOTICES.unshift({id:"n-def-"+pid, kind:"definition", icon:"book", text:"“"+p.term+"” moved to version "+g.version+" — "+p.by+"'s wording, agreed by "+g.owner+". "+(g.used||"")+" places recompute on their next run.", when:"today "+FX.time, read:false, js:"go('glossary')"});
  toast("Agreed — “"+p.term+"” is now version "+g.version);
  if($('#view-glossary') && $('#view-glossary').classList.contains('on')) renderGlossary();
}
function glossDeclineGo(pid){
  const p = proposalById(pid); if(!p || p.status!=="waiting") return;
  confirmAsk({title:"Decline the change to “"+esc2(p.term)+"”?", body:"Version stays as it is. "+esc2(p.by)+" is told, with your reason on the activity log.", verb:"Decline", onConfirm:function(){
    p.status = "declined"; inboxMarkDone("def:"+pid, "Declined"); toast("Declined — "+p.by+" has been told"); }});
}
/* proposing from the Definitions page now lands in the owner's Inbox */
function catalogProposeSend(term){
  const g = GLOSSARY.filter(function(x){ return x.term===term; })[0] || GLOSSARY[0];
  const w = $('#gl-wording') || $('#gloss-def'), y = $('#gl-why');
  const wording = w ? w.value.trim() : "", why = y ? y.value.trim() : "";
  if(!why){ toast("Say why it needs to change — the owner reads that first"); return; }
  PROPOSALS.unshift({id:"prop-"+Date.now(), term:g.term, by:ME.full, on:"today "+FX.time, status:"waiting", wording: wording || g.def, why: why});
  closeModal(); inboxAfterDecision();
  toast("Proposal sent to "+g.owner+" — it is in their Inbox with the impact list");
}

/* ---------- templates: approve or send back ---------- */
function tplSubmit(id){
  const t = templateById(id); if(!t) return;
  if(!t.approver){ toast("Give the template an approver first — Edit, then Name"); return; }
  t.status = "In review"; inboxAfterDecision();
  toast("Sent to "+t.approver+" — it is in their Inbox"); if(typeof tplRepaint==="function") tplRepaint();
}
function tplApproveGo(id){
  const t = templateById(id); if(!t) return;
  t.status = "Approved"; t.agreed = FX.short; inboxMarkDone("tpl:"+id, "Approved");
  NOTICES.unshift({id:"n-tpl-"+id, kind:"template", icon:"file", text:"“"+t.name+"” v"+t.version+" was approved by "+(t.approver||"its approver")+" — it is now recommended where it applies.", when:"today "+FX.time, read:false, js:"go('templates')"});
  toast("Approved — "+t.name+" is now recommended where it applies"); if(typeof tplRepaint==="function") tplRepaint();
}
function tplSendBackGo(id){
  const t = templateById(id); if(!t) return;
  confirmAsk({title:"Send “"+esc2(t.name)+"” back?", body:"It returns to Draft with "+esc2(t.owner)+". Nobody is recommended a draft.", verb:"Send back", onConfirm:function(){
    t.status = "Draft"; inboxMarkDone("tpl:"+id, "Sent back"); toast("Sent back to "+t.owner); if(typeof tplRepaint==="function") tplRepaint(); }});
}

/* ---------- rules: the approvers sign, or send back ---------- */
function rulesApproveGo(id){
  const r = RULES.filter(function(x){ return x.id===id; })[0]; if(!r) return;
  r.status = "Active"; inboxMarkDone("rule:"+id, "Approved");
  NOTICES.unshift({id:"n-rule-"+id, kind:"rule", icon:"shield", text:"Rule “"+r.name+"” is active — out of shadow mode from the next run.", when:"today "+FX.time, read:false, js:"openRule('"+inboxQ(id)+"')"});
  toast("Approved — "+r.name+" applies from the next run");
}
function rulesSendBackGo(id){
  const r = RULES.filter(function(x){ return x.id===id; })[0]; if(!r) return;
  confirmAsk({title:"Send “"+esc2(r.name)+"” back to draft?", body:"Shadow mode stops. "+esc2(r.owner)+" is told, with your reason on the activity log.", verb:"Send back", onConfirm:function(){
    r.status = "Draft"; inboxMarkDone("rule:"+id, "Sent back"); toast("Sent back to "+r.owner); }});
}

/* ---------- budget raises: the Platform Admins decide ---------- */
function raiseById(id){ return (BUDGET.raises||[]).filter(function(x){ return x.id===id; })[0]; }
function raiseApproveGo(id){
  const x = raiseById(id); if(!x || x.status!=="waiting") return; const b = budgetFor(x.team);
  b.allowance += x.add; x.status = "approved"; inboxMarkDone("raise:"+id, "Approved");
  NOTICES.unshift({id:"n-raise-"+id, kind:"budget", icon:"trend", text:x.team+"'s allowance is now "+NZD(b.allowance)+" a month — the raise "+x.by+" asked for was approved.", when:"today "+FX.time, read:false, js:"ADM.tab='budgets';go('admin')"});
  toast(x.team+" can spend "+NZD(b.allowance)+" a month from now"); if(typeof admRepaint==="function" && $('#view-admin') && $('#view-admin').classList.contains('on')) admRepaint('budgets');
}
function raiseDeclineGo(id){
  const x = raiseById(id); if(!x || x.status!=="waiting") return;
  confirmAsk({title:"Decline the raise for "+esc2(x.team)+"?", body:"The allowance stays at "+NZD(budgetFor(x.team).allowance)+". "+esc2(x.by)+" is told; schedules pause first if it runs out.", verb:"Decline", onConfirm:function(){
    x.status = "declined"; inboxMarkDone("raise:"+id, "Declined"); toast("Declined — "+x.by+" has been told"); }});
}

/* ---------- the Inbox carries them ---------- */
const inboxItemsBase = inboxItems;
inboxItems = function(){
  const out = inboxItemsBase();
  const push = function(o){ o.done = INBOX_DONE[o.id] || null; o.status = o.done ? "done" : "waiting"; out.push(o); };
  TEMPLATES.filter(function(t){ return t.status==="In review" || INBOX_DONE["tpl:"+t.id]; }).forEach(function(t){
    push({id:"tpl:"+t.id, kind:"template", what:"“"+esc2(t.name)+"” v"+t.version+" — "+esc2(t.owner)+" asks "+esc2(t.approver||"an approver")+" to sign it", sub:"Shape only: "+t.blocks.map(function(b){ return tplBlock(b).label; }).join(" › ")+" · applies to "+esc2(tplAppliesText(t)), from:t.owner, ageDays:2, due:"—",
      verbs:[{label:"Approve", pri:true, js:"tplApproveGo('"+inboxQ(t.id)+"')"},{label:"Send back", js:"tplSendBackGo('"+inboxQ(t.id)+"')"},{label:"Open", js:"tplDetail('"+inboxQ(t.id)+"')"}], open:"tplDetail('"+inboxQ(t.id)+"')"});
  });
  PROPOSALS.filter(function(p){ return p.status==="waiting" || INBOX_DONE["def:"+p.id]; }).forEach(function(p){
    const g = GLOSSARY.filter(function(x){ return x.term===p.term; })[0] || {owner:"the owner", version:1, used:0};
    push({id:"def:"+p.id, kind:"definition", what:"“"+esc2(p.term)+"” — a change proposed by "+esc2(p.by)+", for "+esc2(g.owner)+" to agree", sub:esc2(p.why)+" · version "+g.version+" → "+(g.version+1)+" · "+(g.used||"several")+" places change", from:p.by, ageDays:1, due:"—",
      verbs:[{label:"See the impact", pri:true, js:"glossImpactModal('"+inboxQ(p.id)+"')"},{label:"Agree", js:"glossAgreeGo('"+inboxQ(p.id)+"')"},{label:"Decline", js:"glossDeclineGo('"+inboxQ(p.id)+"')"}], open:"glossImpactModal('"+inboxQ(p.id)+"')"});
  });
  (BUDGET.raises||[]).filter(function(x){ return x.status==="waiting" || INBOX_DONE["raise:"+x.id]; }).forEach(function(x){
    const b = budgetFor(x.team), left = BUDGET.tenant.cap - Object.keys(BUDGET.teams).reduce(function(a,k){ return a + BUDGET.teams[k].allowance; },0);
    push({id:"raise:"+x.id, kind:"raise", what:esc2(x.team)+" asks for "+NZD(x.add)+" more a month — "+NZD(b.allowance)+" → "+NZD(b.allowance+x.add), sub:esc2(x.why)+" · "+NZD(left)+" unallocated in the tenant cap · for the Platform Admins", from:x.by, ageDays:0, due:fxSlideStr("30 Sep 2026"),
      verbs:[{label:"Approve", pri:true, js:"raiseApproveGo('"+inboxQ(x.id)+"')"},{label:"Decline", js:"raiseDeclineGo('"+inboxQ(x.id)+"')"},{label:"Open Budgets", js:"ADM.tab='budgets';go('admin')"}], open:"ADM.tab='budgets';go('admin')"});
  });
  return out;
};

/* ---------- watch cards that cross their line send a notice ---------- */
function watchNotify(){
  if(typeof homeWatch!=="function" || typeof watchThresholdState!=="function") return;
  homeWatch().forEach(function(w){
    const th = watchThresholdState(w); if(!th || !th.hit) return;
    const id = "n-th-"+w.id; if(NOTICES.some(function(n){ return n.id===id; })) return;
    NOTICES.unshift({id:id, kind:"threshold", icon:"bolt", text:"“"+w.l+"” crossed its line — "+w.v+" this morning, "+(w.threshold.dir==="below"?"below ":"above ")+w.threshold.value+(String(w.v).indexOf("%")>=0?"%":"")+". "+(w.threshold.who==="team"?"Your team was told too.":"Only you were told."), when:"today "+w.at, read:false, js:"go('home')"});
  });
  const c = $('#inbox-count'); if(c && typeof inboxWaiting==="function"){ const n = inboxWaiting().length; c.textContent = n; c.style.display = n ? '' : 'none'; }
}
watchNotify();
const homeWatchSaveBase = homeWatchSave;
homeWatchSave = function(){ homeWatchSaveBase(); watchNotify(); };
</script>
