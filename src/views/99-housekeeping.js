<script>
/* =====================================================================
   HOUSEKEEPING — applied uniformly across the app:
   - anything a person creates gets a delete
   - anything a person edits by hand gets an edit/change action
   - anything AI-generated/AI-proposed gets a kebab (⋮): AI-suggested
     refinements, plus a free-text box for when none of them fit
   ===================================================================== */

/* ---------- shared AI-refinement engine ---------- */
const REFINE_REGISTRY = {};
/* opts: {label, suggestions:[{label, apply}], onApply(newText, instruction, key)} */
function registerRefine(key, opts){ REFINE_REGISTRY[key] = opts; }
function refineBtn(key, title){
  return '<button class="kebab" onclick="event.stopPropagation();openRefine(\''+key+'\')" title="'+esc2(title||'Refine with AI')+'" aria-label="Refine with AI">'+I2.more+'</button>';
}
function openRefine(key){
  const r = REFINE_REGISTRY[key]; if(!r) return;
  const chips = (r.suggestions||[]).map(function(s,i){
    return '<button class="refchip" data-i="'+i+'">'+I2.spark+' '+esc2(s.label)+'</button>';
  }).join('');
  openModal('<h3>Refine this'+(r.label?' — '+esc2(r.label):'')+'</h3>'
    + '<div class="msub">Pick a suggestion, or describe what you want changed — your own words become the new wording.</div>'
    + (chips ? '<div class="refchips">'+chips+'</div>' : '')
    + '<div class="field"><label>Or describe the change</label><div class="fcontrol"><textarea id="ref-custom" rows="3" placeholder="e.g. make this shorter, or explain why confidence is low…"></textarea></div></div>'
    + modalFoot('Cancel','Apply','applyRefine(\''+key+'\')'), 560);
  const box = $('#modal');
  box.querySelectorAll('.refchip').forEach(function(b){
    b.onclick = function(){
      const s = r.suggestions[+b.dataset.i];
      closeModal();
      r.onApply(s.apply, s.label, key);
    };
  });
}
/* inline variant: suggestion chips that fill a textarea already open in the SAME modal,
   for forms where the free-text box already exists (edit-before-accepting, propose-a-change) —
   never calls openModal() again, since that would destroy the form it's meant to help fill in */
function refineChipsInline(suggestions, targetId){
  return '<div class="refchips" data-target="'+targetId+'">'+suggestions.map(function(s,i){
    return '<button type="button" class="refchip" data-i="'+i+'">'+I2.spark+' '+esc2(s.label)+'</button>';
  }).join('')+'</div>';
}
function wireRefineChipsInline(suggestions, targetId){
  const wrap = $('#modal').querySelector('.refchips[data-target="'+targetId+'"]'); if(!wrap) return;
  wrap.querySelectorAll('.refchip').forEach(function(b){
    b.onclick = function(){
      const s = suggestions[+b.dataset.i], el = document.getElementById(targetId);
      if(el){ el.value = s.apply; el.focus(); }
      toast('Suggestion applied · review, then submit');
    };
  });
}
function applyRefine(key){
  const r = REFINE_REGISTRY[key]; if(!r) return;
  const box = $('#ref-custom'), text = box ? box.value.trim() : '';
  if(!text){ toast('Pick a suggestion or describe the change first'); if(box) box.focus(); return; }
  closeModal();
  r.onApply(text, text, key);
}

/* ---------- chat: delete a conversation ---------- */
function chatDeleteAsk(id){
  const t = threadById(id); if(!t) return;
  confirmAsk({title:'Delete “'+esc2(t.title)+'”?',
    body:'It leaves your conversations now. Anything you already saved from it to My workspace stays there.',
    verb:'Delete', onConfirm:function(){ chatDeleteGo(id); }});
}
function chatDeleteGo(id){
  const i = THREADS.findIndex(function(t){ return t.id===id; }); if(i<0) return;
  const wasCurrent = CHAT_UI.tid===id;
  THREADS.splice(i,1);
  closeModal(); toast('Conversation deleted');
  if(wasCurrent) CHAT_UI.tid = THREADS.length ? THREADS[0].id : null;
  if(CHAT_UI.tid) renderChat();
}
function chatTRow(t,cur){
  return '<div class="trow'+(t.id===cur.id?' on':'')+'" onclick="openThread(\''+t.id+'\')">'
    + '<div style="flex:1;min-width:0">'
      + '<div class="tt3">'+(t.pinned?'<span style="color:var(--accent)">'+I2.star+'</span> ':'')+esc(t.title)+'</div>'
      + '<div class="tm"><span class="trunc">'+esc(chatSnip(t))+'</span></div>'
      + '<div class="tm">'+(t.running?CHAT_SPIN+'<span style="color:var(--warn);font-weight:600">Running</span>':'<span>'+esc(t.when)+'</span>')
      + (CHAT_UI.by==='time'?'<span style="opacity:.5">·</span><span class="trunc">'+esc(t.project)+'</span>':'')
      + (t.artifacts.length?'<span class="sp"></span><span title="Outputs">'+I2.file+' '+t.artifacts.length+'</span>':'')
      + '</div>'
    + '</div>'
    + kebabHTML([{label:'Open', icon:'msg', onclick:"openThread('"+t.id+"')"},
                 {label:'Delete conversation', icon:'trash', danger:true, onclick:"chatDeleteAsk('"+t.id+"')"}]) + '</div>';
}

/* ---------- chat: refine an answer, and a real (non-stub) token refine ---------- */
function chatMsg(m,i,t){
  if(m.role==='me') return '<div class="msg me"><div class="mb">'+esc(m.text)+'</div></div>';
  const key = t.id+'-'+i;
  let h = '<div class="msg"><div class="mhead">'
    + '<span style="width:22px;height:22px;border-radius:7px;background:var(--accent);color:#fff;display:grid;place-items:center">'
    + '<span style="width:13px;height:13px;display:block">'+I2.spark+'</span></span>Spiff'
    + (m.plan?'<span style="opacity:.5">·</span> proposed a plan':'')
    + (m.trace?'<span style="opacity:.5">·</span> '+m.trace.length+' steps':'')
    + '</div>';
  if(m.tokens) h += chatTokens(m, i===1, t.id, i);
  if(m.plan)   h += chatPlan(m.plan);
  if(m.trace)  h += chatTrace(m.trace,key);
  h += '<div class="mb">'+m.text+'</div>';
  if(m.answer) h += chatAnswerCard(m.answer);
  if(m.result) h += chatResult(m.result);
  if(m.wall)   h += chatWall(m.wall);
  if(m.approve)h += chatApproveCard(m.approve);
  if(m.sources)h += chatProv(m);
  if(m.text){
    registerRefine('chatmsg:'+key, {label:'this answer', suggestions:[
      {label:'Make it shorter', apply: (m.text.split(/(?<=[.!?])\s/)[0]||m.text)+' …'},
      {label:'Add more detail', apply: m.text+' Spiff can break this down further by locality or by month if that helps.'},
      {label:'Explain what changed since last time', apply: m.text+' Compared with your last saved version of this answer, this reflects the most recent refresh.'}
    ], onApply: function(newText, instruction, k){
      m.text = newText;
      toast('Refined · '+instruction);
      renderChat();
    }});
    h += refineBtn('chatmsg:'+key,'Refine this answer');
  }
  h += chatActs(key,m);
  return h + '</div>';
}
function chatTokens(m,legend,tid,mi){
  const chips = m.tokens.map(function(tk,ti){
    const key = 'chattok:'+tid+':'+mi+':'+ti;
    if(!tk.blocked){
      registerRefine(key, {label:'“'+tk.label+'”', suggestions:[
        {label:'Use a raw count instead of a rate', apply: tk.label.replace(/rate|%|percent/i,'').trim() || tk.label},
        {label:'Broaden this', apply: tk.t==='filt' ? 'All periods' : tk.label},
        {label:'Remove this term', apply: ''}
      ], onApply: function(newLabel, instruction, k){
        if(newLabel===''){ m.tokens.splice(ti,1); }
        else { tk.label = newLabel; tk.changed = true; }
        toast('Read updated · '+instruction);
        renderChat();
      }});
    }
    return '<span class="tok '+tk.t+(tk.changed?' chg':'')+'"'+(tk.blocked?' style="opacity:.45;text-decoration:line-through"':' onclick="openRefine(\''+key+'\')"')
      +' title="Click to change how this was read">'+esc(tk.label)
      +(tk.blocked?' <span class="x">no access</span>':' <span class="x">&times;</span>')+'</span>';
  }).join('');
  return '<div style="background:var(--surface);border:1px solid var(--hair);border-radius:12px;padding:11px 13px;margin-bottom:13px">'
    + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:8px">Read as</div>'
    + '<div class="tokrow">'+chips+'</div>'
    + (m.diffNote?'<div style="margin-top:9px;font-size:12.5px;color:var(--accent);font-weight:600">'+esc(m.diffNote)+'</div>':'')
    + (legend?'<div class="toklegend" style="margin-top:10px"><span><i style="background:var(--measure)"></i>measure</span><span><i style="background:var(--attr)"></i>attribute</span><span><i style="background:var(--filt)"></i>filter</span><span>Correct a chip instead of retyping the question.</span></div>':'')
    + '</div>';
}

/* ---------- home: unfollow a followed metric ---------- */
function homeUnfollow(id){
  const i = HOME_EXTRA.indexOf(id); if(i<0) return;
  HOME_EXTRA.splice(i,1);
  toast('Unfollowed — open any answer and follow it again any time');
  renderHome();
}
/* homeTile now lives in views/78-home-prefs.js (the configurable watch card) */

/* ---------- dataset: refine the AI-context paragraph on a field ---------- */
const DSP_AI_OVERRIDE = {};
function dspFieldModal(dsid,i){
  const d=ds(dsid), f=d.fields[i], mk=dspMask(d,f), rid=dspRuleFor(d,f);
  const g=(typeof GLOSSARY!=="undefined"&&f.glossary)?GLOSSARY.filter(x=>x.term===f.glossary)[0]:null;
  const prio=1+dspHash(f.tech,0)%9;
  const okey = dsid+':'+i;
  const ai = DSP_AI_OVERRIDE[okey] || (f.type==="measure"
    ? "When a question says “"+(f.synonyms[0]||f.label.toLowerCase())+"”, use this column and aggregate it with "+dspAgg(f).split(" —")[0]+". "+f.desc
    : "Group and filter by this; it is a label, not a number. Recognise it from: "+([f.label].concat(f.synonyms||[]).join(", "))+".");
  registerRefine('dsfield:'+okey, {label:'the AI context for '+f.label, suggestions:[
    {label:'Make it less technical', apply: ai.replace(/aggregate it with [^.]+\./,'').replace(/Recognise it from:[^.]+\./,'').trim()},
    {label:'Add a worked example', apply: ai+' For example: “'+f.label.toLowerCase()+' in '+(d.name||'this dataset').toLowerCase()+' last quarter.”'},
    {label:'Shorten to one sentence', apply: (ai.split(/(?<=[.!?])\s/)[0]||ai)}
  ], onApply: function(newText, instruction, k){
    DSP_AI_OVERRIDE[okey] = newText;
    toast('AI context refined · '+instruction);
    dspFieldModal(dsid,i);
  }});
  openModal('<h3>'+esc2(f.label)+'</h3><div class="msub"><span class="mono">'+esc2(f.tech)+'</span> · '+esc2(d.name)+'</div>'
    +'<div class="rowflex" style="margin-bottom:14px">'+dspTypeTok(f.type)+sensBadge(f.sens)+dspMaskBadge(mk)+(f.glossary?bdg(f.glossary,"info","book"):"")+'</div>'
    +'<div class="defblock" style="margin-bottom:14px">'+esc2(f.desc)+'</div>'+callout(mk.state==="clear"?"ok":"warn",'<b>What you see.</b> '+esc2(mk.you)
      +(f.mask?'<div style="margin-top:5px;font-size:12.5px">Rule in force: <span class="mono">'+esc2(rid||"—")+'</span>'
        +(rid?' <a class="clickable" style="color:var(--accent)" onclick="closeModal();openRule(\''+dspArg(rid)+'\')">open the rule</a>':"")+'</div>':""))
    +'<div class="hairline"></div>'+'<div class="kv"><dt>Example value</dt><dd class="mono">'+esc2(f.example)+'</dd>'+'<dt>Aggregation</dt><dd>'+esc2(dspAgg(f))+'</dd>'
    +'<dt>Format pattern</dt><dd class="mono">'+esc2(f.format)+'</dd>'+'<dt>Completeness</dt><dd>'+f.complete+'% of rows carry a value</dd>'
    +'<dt>Distinct values</dt><dd>'+esc2(f.distinct)+'</dd>'+'<dt>Usage</dt><dd>'+esc2(f.usage)+'</dd>'
    +'<dt>Search priority</dt><dd>'+prio+' of 10 — how hard Spiff reaches for this column when the wording is loose</dd>'
    +'<dt>Also called<\dt><dd>'+((f.synonyms||[]).length?esc2(f.synonyms.join(", ")):"No synonyms recorded")+'</dd>'
    +(g?'<dt>Agreed definition<\dt><dd>'+esc2(g.def)+' <span class="mutedtext">— '+esc2(g.owner)+', v'+g.version+'<\span><\dd>':"")+'</div><div class="hairline"></div>'
    +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><div style="flex:1;font-size:12.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em">AI context</div>'
    +refineBtn('dsfield:'+okey,'Refine this AI context')+'</div>'
    +'<div style="font-size:13.5px;line-height:1.6">'+esc2(ai)+'</div>'+modalFoot("Close","Ask about this field","closeModal();dspAsk('"+dspArg(f.label+" by locality, this year")+"')"),560);
}

/* ---------- understanding-run: AI-suggested rewrites alongside the free-text edit ---------- */
function undEditAsk(id){
  var f = undFind(id); if(!f) return;
  var sugg = [
    {label:'Shorten to one sentence', apply:(f.statement.split(/(?<=[.!?])\s/)[0]||f.statement)},
    {label:'Soften the confidence language', apply:f.statement.replace(/\bis\b/,'appears to be')},
    {label:'Name the evidence inline', apply:f.statement+(f.evidence&&f.evidence[0]?' (per '+f.evidence[0].ref+')':'')}
  ];
  openModal('<h3>Edit before accepting</h3>'
    + '<div class="msub">Change the wording, not the evidence. What you accept is what enters the catalogue, and the original proposal is kept alongside it so the two can be compared.</div>'
    + '<label style="font-size:12.5px;color:var(--muted);font-weight:700">Plain-English statement — a non-engineer has to be able to judge it</label>'
    + refineChipsInline(sugg,'und-stmt')
    + '<div class="fcontrol"><textarea id="und-stmt" rows="3">' + esc2(f.statement) + '</textarea></div>'
    + '<div class="field"><label>Detail</label><div class="fcontrol"><textarea id="und-det" rows="4">' + esc2(f.detail) + '</textarea></div></div>'
    + '<div class="mutedtext" style="font-size:12.5px">Accepted with edits by ' + esc2(undMe()) + ', recorded as an edit rather than a plain acceptance. The evidence beneath it does not change.</div>'
    + modalFoot("Cancel", "Accept with edits", "undEditDo('" + undQ(id) + "')"), 700);
  wireRefineChipsInline(sugg,'und-stmt');
}

/* ---------- glossary: AI-suggested rewrites alongside "propose a change" ---------- */
function catalogProposeModal(term){
  var g = GLOSSARY.filter(function(x){ return x.term === term; })[0] || GLOSSARY[0];
  var sugg = [
    {label:'Shorten to one sentence', apply:(g.def.split(/(?<=[.!?])\s/)[0]||g.def)},
    {label:'Make it less technical', apply:g.def.replace(/\([^)]*\)/g,'').trim()},
    {label:'Add the source it comes from', apply:g.def+' (per the accepted finding it was drawn from.)'}
  ];
  openModal('<h3>Propose a change · ' + esc2(g.term) + '</h3>'
    + '<div class="msub">One definition, one owner. Anyone can propose; only ' + esc2(g.owner) + ' can agree it. Until they do, every answer keeps using version ' + g.version + '.</div>'
    + '<div class="defblock" style="margin-bottom:16px">' + esc2(g.def) + '</div>'
    + '<label style="font-size:12.5px;color:var(--muted);font-weight:700">Proposed wording</label>'
    + refineChipsInline(sugg,'gloss-def')
    + '<div class="fcontrol"><textarea id="gloss-def" rows="4" placeholder="Write the definition as you believe it should read.">' + esc2(g.def) + '</textarea></div>'
    + '<div class="field"><label>Why it needs to change</label><div class="fcontrol"><textarea id="gl-why" rows="3" placeholder="e.g. Two localities are counting cancelled meetings differently, and the totals disagree by 4%."></textarea></div></div>'
    + callout("warn", "Changing this definition changes <b>" + g.used + " places</b> at once — every dataset, saved answer and automation that uses it. " + esc2(g.owner) + " sees the impact list before signing off, and the version number moves to " + (g.version + 1) + ".", "warn")
    + modalFoot("Cancel", "Send to " + g.owner.split(" ")[0], "catalogProposeSend('" + esc2(g.term).replace(/'/g, "\'") + "')"), 620);
  wireRefineChipsInline(sugg,'gloss-def');
}

/* ---------- people: revoke a time-bound grant, remove from a manually-managed group ---------- */
function pplRevokeAsk(who,dsid){
  const d=ds(dsid);
  openModal('<h3>Revoke access?</h3><div class="msub">'+esc2(who)+' · '+esc2(d?d.name:dsid)+'</div>'
    +callout("warn","Takes effect immediately — the next question they ask under this grant returns nothing, and this is logged against your name.")
    +modalFoot('Cancel','Revoke','pplRevokeGo(\''+pplQ(who)+'\',\''+pplQ(dsid)+'\')'),480);
}
function pplRevokeGo(who,dsid){
  const i=ACCESS_TIMEBOUND.findIndex(function(t){return t.who===who&&t.dataset===dsid;});
  if(i>=0) ACCESS_TIMEBOUND.splice(i,1);
  closeModal(); toast('Revoked — logged against your name');
  renderPerson(who);
}
function pplRenew(who,dsid){
  const d = ds(dsid);
  openModal('<h3>Renew time-bound access</h3>'
    + '<div class="msub">'+esc2(who)+' · '+esc2(d?d.name:dsid)+'</div>'
    + callout("info","Renewing extends the same grant. It does not widen it — the level, the masking and the row scope all stay exactly as they are.")
    + '<div style="height:14px"></div>'
    + '<div class="field"><label>New end date</label><select id="ppl-pick"><option>90 days — 29 Nov 2026</option><option>180 days — 27 Feb 2027</option><option>12 months — 31 Aug 2027</option></select></div>'
    + '<div class="field"><label>Reason — recorded against your name</label><div class="fcontrol">'
    + '<textarea id="ppl-reason" rows="3" placeholder="Why does this still need to be open?"></textarea></div></div>'
    + '<div class="mfoot"><button class="btn danger" style="margin-right:auto" onclick="pplRevokeAsk(\''+pplQ(who)+'\',\''+pplQ(dsid)+'\')">Revoke instead</button>'
    + '<button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="pplRenewGo()">Renew</button></div>', 560);
}
function pplRemoveFromGroupAsk(gid,name){
  const g=groupById(gid),p=personByName(name); if(!g||!p) return;
  confirmAsk({title:'Remove '+esc2(p.name)+' from '+esc2(g.name)+'?',
    body:'They lose everything this group grants the moment this saves — nothing is cached. Their other groups are untouched.',
    verb:'Remove', onConfirm:function(){ pplRemoveFromGroupGo(gid, name); }});
}
function pplRemoveFromGroupGo(gid,name){
  const p=personByName(name); if(!p) return;
  p.groups=(p.groups||[]).filter(function(x){return x!==gid;});
  const g=groupById(gid); if(g&&g.members>0) g.members--;
  closeModal(); toast('Removed '+p.name+' from the group');
  pplOpenGroup(gid);
}
function pplOpenGroup(gid){
  const g = groupById(gid); if(!g) return;
  const m = ENT_META[gid] || {}, listed = pplMembersOf(gid), ent = ENTITLEMENTS[gid] || {};
  const manual = gid!=='all-staff' && !g.rule;
  openModal('<h3>'+esc2(g.name)+'</h3>'
    + '<div class="msub">'+esc2(g.type)+' · '+fmt(g.members)+' members · owned by '+esc2(g.owner)+'</div>'
    + (m.why ? '<div class="defblock" style="margin-bottom:14px">'+esc2(m.why)+'</div>' : '')
    + (g.rule ? callout("mut","<b>Attribute rule</b> — "+esc2(g.rule)+". Nobody approves membership; Directory does.")+'<div style="height:14px"></div>' : '')
    + '<div class="rowflex" style="margin-bottom:14px"><span class="mutedtext">Grants</span>'
    + g.roles.map(function(r){ const R=roleById(r); return R?'<button class="bdg mut" style="border:none;cursor:pointer" onclick="pplOpenRole(\''+pplQ(r)+'\')">'+I2.shield+esc2(R.name)+'</button>':""; }).join("")+'</div>'
    /* "All staff" is everyone in the organisation. Eight of 428 is fine until you
       need one particular person, so the list caps and searches. */
    + '<div class="rowflex" style="margin-bottom:8px;align-items:baseline">'
    +   '<span style="font-weight:600">Members</span>'
    +   '<span class="mutedtext" style="font-size:12.5px">'+fmt(listed.length)+' listed of '+fmt(g.members)+'</span></div>'
    + (listed.length > 8
        ? '<div class="bigsearch" style="margin-bottom:10px">'+I2.search
          + '<input value="'+esc2(PPL_GROUP_FIND[gid]||"")+'" oninput="pplGroupFind(\''+pplQ(gid)+'\',this.value)"'
          + ' placeholder="Find someone in '+esc2(g.name)+'…"></div>'
        : '')
    + '<div id="grp-members" data-manual="'+(manual?1:0)+'" style="margin-bottom:16px">'+pplGroupMembersHTML(gid, manual)+'</div>'
    + '<div style="font-weight:600;margin-bottom:8px">What this group can see</div>'
    + '<div class="dtbl-wrap cap"><table class="dtbl"><thead><tr><th>Dataset</th><th>Sensitivity</th><th>Access</th></tr></thead><tbody>'
    + DATASETS.map(function(d){
        const L = ACCESS_LEVELS[ent[d.id] || "none"];
        return '<tr><td>'+esc2(d.name)+'</td><td>'+sensBadge(d.sens)+'</td><td>'+bdg(L.label,L.cls)+'</td></tr>';
      }).join("")
    + '</tbody></table></div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    + (listed.length ? '<button class="btn" onclick="closeModal();startSim(\''+pplQ(listed[0].name)+'\')">'+I2.eye+' Simulate a member</button>' : '')
    + '<button class="btn pri" onclick="closeModal();toast(\'Review campaign drafted for '+pplQ(g.name)+'\')">Start a review</button></div>', 720);
}

/* ---------- automations: delete one from the list ---------- */
function deleteWorkflowAsk(i){
  const w=WORKFLOWS[i]; if(!w) return;
  const subs=autoSubsFor(w).length;
  confirmAsk({title:'Delete “'+esc2(w.name)+'”?',
    body:'It stops now and leaves Automations. '+(subs?fmt(subs)+' subscriber'+(subs===1?'':'s')+' stop receiving it.':'Nobody is subscribed to it.'),
    verb:'Delete', onConfirm:function(){ deleteWorkflowGo(i); }});
}
function deleteWorkflowGo(i){
  const w=WORKFLOWS[i]; if(!w) return;
  WORKFLOWS.splice(i,1);
  delete AUTOSUBS[w.name];
  closeModal(); toast('Automation deleted');
  renderAutomations();
}

/* ---------- data catalogue: pagination instead of one long scroll ---------- */
const CATALOG_PAGE_SIZE = 24;
function catalogSig(){
  var st=CATALOG_STATE;
  return [st.q,st.view,st.sort,st.domain.join(','),st.sys.join(','),st.cert.join(','),st.sens.join(','),st.access.join(','),st.fresh.join(',')].join('|');
}
function catalogGoPage(n){
  CATALOG_STATE.page = n;
  catalogPaint();
  var res=$('#catalog-results'); if(res) res.scrollIntoView({block:'start',behavior:REDUCE?'auto':'smooth'});
}
/* windowed — see pagerHTML in the UI kit */
function catalogPagerHTML(page,pages){ return pagerHTML(page,pages,"catalogGoPage"); }

function catalogPaint(){
  var base = catalogSearched();
  var list = catalogSorted(base.filter(function(x){ return catalogPassesFacets(x.d); }));
  var q = CATALOG_STATE.q.trim(), fieldHits = list.filter(function(x){ return x.via && x.via.kind === "field"; }).length;

  var sig = catalogSig();
  if(CATALOG_STATE._sig !== sig){ CATALOG_STATE._sig = sig; CATALOG_STATE.page = 0; }
  var pages = Math.max(1, Math.ceil(list.length / CATALOG_PAGE_SIZE));
  if(CATALOG_STATE.page > pages-1) CATALOG_STATE.page = pages-1;
  if(CATALOG_STATE.page < 0) CATALOG_STATE.page = 0;
  var pageList = list.slice(CATALOG_STATE.page*CATALOG_PAGE_SIZE, (CATALOG_STATE.page+1)*CATALOG_PAGE_SIZE);

  /* facet rail — counts are taken over the search result, so a facet never lies about what exists */
  var railBody = CATALOG_FACETS.map(function(f, fi){
    var title = f.key === "access" && SIM ? "Access for " + SIM.name.split(" ")[0] : f.title;
    return '<div class="facet"><div class="fh">' + esc2(title) + '</div>' + f.opts.map(function(o, oi){
      var n = base.filter(function(x){ return catalogValOf(f.key, x.d) === o; }).length;
      var on = CATALOG_STATE[f.key].indexOf(o) >= 0;
      return '<label><input type="checkbox"' + (on ? ' checked' : '') + (n ? '' : ' disabled')
        + ' onchange="catalogFacet(' + fi + ',' + oi + ',this.checked)"><span'
        + (n ? '' : ' style="opacity:.45"') + '>' + esc2(catalogOptLabel(f.key, o)) + '</span>'
        + '<span class="cnt">' + n + '</span></label>';
    }).join("") + '</div>';
  }).join("");
  var any = catalogFacetsOn() || !!q;
  $('#catalog-facets').innerHTML = panel("Narrow it down", railBody, {
    icon:"filter",
    act: any ? '<button class="btn sm ghost" onclick="catalogClear()">' + I2.x + ' Clear all</button>' : ''
  });

  /* count line */
  $('#catalog-count').innerHTML = '<b>' + list.length + '</b> of ' + DATASETS.length + ' datasets'
    + (q ? ' matching “' + esc2(q) + '”' : '')
    + (fieldHits ? ' · <span style="color:var(--accent)">' + fieldHits + ' matched on a field name, not a dataset name</span>' : '')
    + (pages>1 ? ' · page ' + (CATALOG_STATE.page+1) + ' of ' + pages : '')
    + ' · access states computed for <b>' + esc2(viewer().name) + '</b>, ' + esc2(catalogScope());

  /* suggested strip hides once the viewer starts hunting */
  $('#catalog-sug').style.display = any ? 'none' : '';

  /* results */
  var out;
  if(!list.length){
    out = '<div class="panel"><div class="panel-b">'
      + emptyState("Nothing matches that", "No dataset name, field, synonym or saved question matched. Try a plainer word — “attendance”, “travel”, “locality”.", "search")
      + '<div class="rowflex" style="justify-content:center"><button class="btn" onclick="catalogClear()">' + I2.refresh + ' Clear filters</button>'
      + '<button class="btn pri" onclick="go(\'ask\')">' + I2.spark + ' Ask Spiff instead</button></div></div></div>';
  } else if(CATALOG_STATE.view === "list"){
    out = '<div class="panel"><div class="dtbl-wrap"><table class="dtbl"><thead><tr>'
      + '<th>Dataset</th><th>Domain</th><th>Source</th><th>Trust</th><th>Sensitivity</th>'
      + '<th>' + (SIM ? esc2(SIM.name.split(" ")[0]) + '’s access' : 'Your access') + '</th><th>Refreshed</th>'
      + '<th class="num">People</th><th class="num">Rank</th></tr></thead><tbody>'
      + pageList.map(catalogTableRow).join("") + '</tbody></table></div>'
      + catalogPagerHTML(CATALOG_STATE.page,pages) + '</div>';
  } else {
    out = '<div class="g3">' + pageList.map(catalogCard).join("") + '</div>'
      + catalogPagerHTML(CATALOG_STATE.page,pages);
  }
  $('#catalog-results').innerHTML = out;
}

/* ---------- people & access: pagination instead of one long scroll ---------- */
const PPL_PAGE_SIZE = 20;
function pplSig(){
  const S=PPL_STATE;
  return [S.q,S.team,S.locality,S.role,S.status,S.sort,S.dormant].join('|');
}
function pplGoPage(n){
  PPL_STATE.page = n;
  pplRefresh();
  const list=$('#ppl-list'); if(list) list.scrollIntoView({block:'start',behavior:REDUCE?'auto':'smooth'});
}
function pplPagerHTML(page,pages){ return pagerHTML(page,pages,"pplGoPage"); }

function pplEnsurePage(rowCount){
  const sig = pplSig();
  if(PPL_STATE._sig !== sig){ PPL_STATE._sig = sig; PPL_STATE.page = 0; }
  const pages = Math.max(1, Math.ceil(rowCount / PPL_PAGE_SIZE));
  if(!Number.isInteger(PPL_STATE.page) || PPL_STATE.page > pages-1) PPL_STATE.page = pages-1;
  if(PPL_STATE.page < 0) PPL_STATE.page = 0;
  return pages;
}
function pplTh(key,label,num){
  const on = PPL_STATE.sort===key;
  return '<th class="sortable'+(on?' on':'')+(num?' num':'')+'" onclick="pplSetFilter(\'sort\',\''+key+'\')">'+esc2(label)
    + '<span class="sortmark">'+(on?'↑':'↕')+'</span></th>';
}
function pplTableHTML(){
  const rows = pplSorted(), sel = PPL_STATE.sel;
  if(!rows.length) return emptyState("Nobody matches that","Try a wider filter, or clear them all.","search");
  const pages = pplEnsurePage(rows.length);
  const pageRows = rows.slice(PPL_STATE.page*PPL_PAGE_SIZE, (PPL_STATE.page+1)*PPL_PAGE_SIZE);
  return '<div class="dtbl-wrap"><table class="dtbl"><thead><tr>'
    + '<th style="width:36px"><input type="checkbox" onclick="pplSelectAll(this.checked)"'+(sel.length&&sel.length===rows.length?" checked":"")+'></th>'
    + pplTh('name','Person') + pplTh('team','Team') + pplTh('locality','Locality') + '<th>Roles</th><th class="num">Groups</th>'
    + pplTh('last','Last active') + pplTh('asked','Asked',true) + pplTh('access','What they can see') + '</tr></thead><tbody>'
    + pageRows.map(function(p){
        const c = pplCounts(p), gids = pplGroupsOf(p);
        return '<tr class="clk" onclick="openPerson(\''+pplQ(p.name)+'\')">'
          + '<td onclick="event.stopPropagation()"><input type="checkbox" onclick="pplToggleSel(this,\''+pplQ(p.id)+'\')"'+(sel.indexOf(p.id)>=0?" checked":"")+'></td>'
          + '<td><div class="person">'+avatar(p.name)+'<div><div class="pn">'+esc2(p.name)+(p.me?' '+bdg("You","info"):'')+'</div>'
          +      '<div class="pr">'+esc2(p.title)+'</div></div></div></td>'
          + '<td>'+esc2(p.team)+'</td><td>'+esc2(p.locality)+'</td>'
          + '<td>'+(p.roles||[]).map(function(r){ const R=roleById(r); if(!R) return '';
                return bdg(R.name, R.risk==="critical"?"crit":R.risk==="high"?"warn":"mut"); }).join(" ")+'</td>'
          + '<td class="num">'+gids.length+'</td>'
          + '<td>'+esc2(p.last)+(p.status!=="active"?' '+pplStatusBadge(p):'')
          +      (pplReviewFlag(p.name)?' '+bdg(pplReviewFlag(p.name),"warn","warn"):'')+'</td>'
          + '<td class="num">'+fmt(p.asked)+'</td>'
          + '<td><span class="mutedtext">'+(c.full?'<b>'+c.full+'</b> full':'')+(c.full&&c.part?' · ':'')
          +      (c.part?'<b>'+c.part+'</b> partial':'')+(!c.full&&!c.part?'nothing beyond reference data':'')
          +      ' of '+DATASETS.length+'</span></td>'
          + '</tr>';
      }).join("")
    + '</tbody></table></div>'
    + pplPagerHTML(PPL_STATE.page,pages);
}
function pplCountHTML(){
  const shown = pplSorted().length;
  const filtered = shown !== PEOPLE.length;
  const pages = pplEnsurePage(shown);
  return '<div class="rowflex" style="margin:2px 0 12px">'
    + '<span class="mutedtext">Showing <b>'+shown+'</b> of <b>'+PEOPLE.length+'</b> listed'
    + (filtered ? ' (filtered)' : '')
    + (pages>1 ? ' · page '+(PPL_STATE.page+1)+' of '+pages : '')
    + ' · <b>'+fmt(ORG.users)+'</b> people in this tenant</span>'
    + (filtered ? ' <button class="btn sm ghost" onclick="pplClearFilters()">Clear filters</button>' : '')
    + '</div>';
}

/* ---------- activity log: group the timeline by who did it, not one sequence of everyone ---------- */
const AUD_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
function auditGroupedHTML(list){
  const order = [], groups = {};
  list.forEach(function(ev){
    if(!groups[ev.actor]){ groups[ev.actor] = []; order.push(ev.actor); }
    groups[ev.actor].push(ev);
  });
  return order.map(function(actor){
    const evs = groups[actor], latest = evs[0];
    return '<details class="audit-actorgroup">'
      + '<summary>'
        + avatar(actor,'sm')
        + '<div style="flex:1;min-width:0"><b>'+esc2(actor)+'</b>'
          + '<div class="mutedtext" style="font-size:12px;margin-top:1px">'+evs.length+' event'+(evs.length===1?'':'s')+' · most recent '+esc2(latest.when)+'</div></div>'
        + '<span class="audit-chev">'+AUD_CHEV+'</span>'
      + '</summary>'
      + '<div class="tb"><div class="tline">'+evs.map(auditEventHTML).join('')+'</div></div>'
    + '</details>';
  }).join('');
}
/* ---------------------------------------------------------------------
   The activity log is the one surface that grows without limit: every
   question, read, export and denial, for every person, for ever. It used
   to render the whole array. At a year of real use that is tens of
   thousands of nodes built synchronously on a route change, and the screen
   stops responding rather than slowing down.
   It now pages. The count above the list is always the full match count,
   so paging never hides how much there is.
   --------------------------------------------------------------------- */
const AUDIT_PAGE_SIZE = 20;
function auditSig(){
  const U = AUDIT_UI;
  return [U.q,U.actor,U.dataset,U.outcome,U.range,U.mode,U.sort,U.dir,(U.groups||[]).join(","),U.traceFilter].join('|');
}
function auditGoPage(n){
  AUDIT_UI.page = n;
  auditPaint();
  const el = $('#audit-results'); if(el) el.scrollIntoView({block:'start',behavior:REDUCE?'auto':'smooth'});
}
function auditEnsurePage(rowCount){
  const sig = auditSig();
  if(AUDIT_UI._sig !== sig){ AUDIT_UI._sig = sig; AUDIT_UI.page = 0; }
  const pages = Math.max(1, Math.ceil(rowCount / AUDIT_PAGE_SIZE));
  if(!Number.isInteger(AUDIT_UI.page) || AUDIT_UI.page > pages-1) AUDIT_UI.page = pages-1;
  if(AUDIT_UI.page < 0) AUDIT_UI.page = 0;
  return pages;
}
function auditResultsHTML(list){
  if(!list.length){
    return '<div class="empty2">'+I2.filter
      +'<div class="et">Nothing matches those filters</div>'
      +'<div>The log holds '+fmt(AUDIT.length)+' events. Widen the time range, or drop a filter.</div>'
      +'<div style="margin-top:15px"><button class="btn" onclick="auditClear()">Clear all filters</button></div></div>';
  }
  const sorted = AUDIT_UI.mode === "table" ? auditSorted(list) : list;
  const pages  = auditEnsurePage(sorted.length);
  const from   = AUDIT_UI.page * AUDIT_PAGE_SIZE;
  const page   = sorted.slice(from, from + AUDIT_PAGE_SIZE);
  const bar =
      '<div class="rowflex capnote" style="padding:0 18px;justify-content:space-between">'
    +   '<span>Showing <b>'+fmt(from+1)+'–'+fmt(from+page.length)+'</b> of <b>'+fmt(sorted.length)+'</b> matching events'
    +     (sorted.length < AUDIT.length ? ' <span style="opacity:.7">(filtered from '+fmt(AUDIT.length)+')</span>' : '')+'</span>'
    +   '<span>Newest first. Append-only — nothing here can be edited or removed. Nothing is hidden by paging; the count is the full match.</span>'
    + '</div>';
  const body = AUDIT_UI.mode === "table"
    ? auditTableHTML(page)
    : '<div style="padding:14px 18px 8px">'+auditGroupedHTML(page)+'</div>';
  return bar + body + '<div style="padding:0 18px 18px">'+pagerHTML(AUDIT_UI.page, pages, "auditGoPage")+'</div>';
}
</script>
