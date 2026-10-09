<script>
/* =====================================================================
   SPIFF v2 — BUSINESS RULES
   List + rule editor. The sentence is the rule; the slots are the settings.
   ===================================================================== */

const RULES_STATE = {q:"", cat:"all", status:"all", sev:"all", sort:"prec", dir:1, previewAs:null, edits:{}};

/* ---------- sentence parsing: {{key:label}} -> editable slots ---------- */
const RULES_SLOTRE = /\{\{([a-z]+):([^}]*)\}\}/g;
function rulesSlots(rule){
  const out=[]; let m; RULES_SLOTRE.lastIndex=0;
  while((m=RULES_SLOTRE.exec(rule.sentence))!==null) out.push({key:m[1], label:m[2]});
  const ed = RULES_STATE.edits[rule.id]||{};
  out.forEach((s,i)=>{ if(ed[i]!=null) s.label=ed[i]; });
  return out;
}
function rulesPlain(rule){
  const s=rulesSlots(rule); let i=0;
  RULES_SLOTRE.lastIndex=0;
  return rule.sentence.replace(RULES_SLOTRE, function(){ return s[i++].label; });
}
function rulesTrunc(t,n){ return t.length>n ? t.slice(0,n-1).replace(/[ ,.]+$/,'')+'…' : t; }
function rulesSlotCls(key){
  if(key==='except'||key==='allow'||key==='keep'||key==='when') return 'ok';
  if(key==='fields'||key==='deny'||key==='not'||key==='exclude'||key==='condition') return 'crit';
  return '';
}
function rulesSentenceHTML(rule){
  const slots=rulesSlots(rule), locked=!!rule.locked; let i=0;
  RULES_SLOTRE.lastIndex=0;
  const body = esc2(rule.sentence).replace(/\{\{([a-z]+):([^}]*)\}\}/g, function(){
    const s=slots[i], idx=i; i++;
    if(locked) return '<span class="slot '+rulesSlotCls(s.key)+'" style="cursor:not-allowed;border-style:solid;opacity:.8" title="This rule is locked">'+I2.lock+esc2(s.label)+'</span>';
    return '<span class="slot '+rulesSlotCls(s.key)+'" onclick="rulesSlotPick(\''+rule.id+'\','+idx+')" title="Change this part of the rule">'+esc2(s.label)+I2.pencil+'</span>';
  });
  return '<div class="sentence">'+body+'</div>';
}

/* ---------- slot pickers ---------- */
function rulesSlotOptions(key,current){
  const byKey = {
    method: MASK_METHODS.map(m=>m.label),
    except: ["everyone, with no exception","National Office","National Statistics","Regional Coordinators","Data Stewards","Safeguarding Leads with a recorded purpose","Travel Office","Event Operations with an active event assignment","Records Office"],
    join:   ["AND","OR"],
    value:  ["“<5”","“[withheld]”","“—”","a rounded number"],
    window: ["travel date within 7 days either side of today","travel date within 30 days either side of today","travel date within 90 days either side of today","the current financial year"],
    when:   ["the end of the reporting period","the last complete month","yesterday's close"],
    period: ["a complete calendar month","a complete quarter","a rolling 12 months"],
    grain:  ["locality grain and below","subdivision grain and below","locality grain and below"],
    condition:["the count is under 5","the count is under 10","the member is under 18","the member is 18 or older","contact consent is true"]
  };
  const list = byKey[key] ? byKey[key].slice() : [current,"a narrower set","a wider set"];
  if(list.indexOf(current)<0) list.unshift(current);
  return list;
}
function rulesSlotPick(id,idx){
  const rule=ruleById(id); if(!rule||rule.locked) return;
  const s=rulesSlots(rule)[idx]; if(!s) return;
  const opts=rulesSlotOptions(s.key,s.label);
  const explain = s.key==='method'
    ? '<div class="mutedtext" style="margin-bottom:12px">Each method changes what the viewer actually sees. Pick the one that keeps the answer useful.</div>' : '';
  const body = opts.map(function(o){
    const mm = s.key==='method' ? MASK_METHODS.find(function(m){return m.label===o;}) : null;
    return '<div class="pickcard'+(o===s.label?' on':'')+'" data-v="'+esc2(o)+'" onclick="rulesApplySlot(\''+id+'\','+idx+',this.dataset.v)" style="margin-bottom:9px">'
      +'<div class="pi">'+(o===s.label?I2.check:I2.chev)+'</div>'
      +'<div><div class="pn2">'+esc2(o)+'</div>'+(mm?'<div class="pd2">'+esc2(mm.sees)+'</div>':'')+'</div></div>';
  }).join('');
  openModal('<h3>'+esc2(s.key.charAt(0).toUpperCase()+s.key.slice(1))+'</h3>'
    +'<div class="msub">One part of <b>'+esc2(rule.name)+'</b>. Changing it changes the rule, which puts it back into review.</div>'
    +explain+body+modalFoot('Cancel'), 520);
}
function rulesApplySlot(id,idx,val){
  if(!RULES_STATE.edits[id]) RULES_STATE.edits[id]={};
  RULES_STATE.edits[id][idx]=val;
  closeModal();
  const rule=ruleById(id);
  $('#rules-sentence').innerHTML = rulesSentenceHTML(rule);
  toast('Changed in this draft only. The live rule is untouched until two approvers sign it off.');
}

/* ---------- who is exempt ---------- */
function rulesExempt(rule,person){
  const ex=rule.exempt||{roles:[],groups:[]};
  const r=(ex.roles||[]).some(function(x){return (person.roles||[]).indexOf(x)>=0;});
  const g=(ex.groups||[]).some(function(x){return (person.groups||[]).indexOf(x)>=0;});
  return r||g;
}

/* =====================================================================
   LIST
   ===================================================================== */
function renderRules(arg){ if(arg) return rulesDetail(arg); rulesList(); }
V2ROUTES.rules = renderRules;
function openRule(id){ go('rules', id); }

function rulesList(){
  const live = RULES.filter(function(r){return r.status==='Active';});
  const fired = RULES.filter(function(r){return r.evalsToday>0;});
  const rows = RULES.reduce(function(a,r){return a+r.rowsAffected;},0);
  const inrev = RULES.filter(function(r){return r.status==='In review';});
  const exp = RULES.filter(function(r){return r.expiresIn!=null && r.expiresIn<=30;});

  const kpis = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:14px;margin-bottom:18px">'
    +kpi('Active rules', live.length, 'of '+RULES.length+' on the books')
    +kpi('Fired today', fired.length, fmt(RULES.reduce(function(a,r){return a+r.evalsToday;},0))+' checks')
    +kpi('Rows affected today', rows>=1000000?(rows/1000000).toFixed(1)+' M':fmt(Math.round(rows/1000))+' k', 'masked, filtered or suppressed')
    +kpi('In review', inrev.length, inrev.length?'running in shadow mode':'nothing waiting')
    +kpi('Expiring in 30 days', exp.length, exp.length?'re-argue or let them lapse':'none')
    +'</div>';

  $('#view-rules').innerHTML =
    pageHead({
      eyebrow:'Govern',
      title:'Business rules',
      desc:'A rule is an object with an owner, an approver, a status and a change history — not a checkbox in a settings screen. Every rule below is written as a sentence, re-evaluated on every run for whoever is asking, and written to the activity log.',
      acts:'<button class="btn" onclick="go(\'audit\')">'+I2.log+' Activity log</button>'
        +'<button class="btn pri" onclick="rulesNew()">'+I2.plus+' New rule</button>'
    })
    + kpis
    + '<div class="split wide"><div>'
    +   '<div class="bigsearch" style="margin-bottom:12px">'+I2.search
    +   '<input placeholder="Search rules — try minors, travel, suppression, consent" value="'+esc2(RULES_STATE.q)+'" oninput="rulesQ(this.value)"></div>'
    +   '<div id="rules-chips">'+rulesChipsHTML()+'</div>'
    +   '<div id="rules-results" style="margin-top:14px">'+rulesResultsHTML()+'</div>'
    + '</div><div class="stack">'
    +   panel('Who owns what', RULES.reduce(function(acc,r){ if(acc.seen[r.owner]) return acc; acc.seen[r.owner]=1;
          acc.html+='<div class="lrow" onclick="openPerson(\''+esc2(r.owner)+'\')"><div class="li">'+avatar(r.owner)+'</div>'
            +'<div class="lm"><div class="lt">'+esc2(r.owner)+'</div><div class="ls">'+RULES.filter(function(x){return x.owner===r.owner;}).length+' rules</div></div>'
            +'<div class="lr">'+I2.chev+'</div></div>'; return acc; },{html:'',seen:{}}).html,
        {icon:'people', tight:true, sub:'Accountable, not a mailbox', foot:'Every rule has one named owner. If they leave, the rule blocks until it is re-owned.'})
    + '</div></div>'
    + '<div style="margin-top:14px">'+rulesHitPanel()+'</div>';
}

function rulesChipsHTML(){
  const c = function(kind,val,label,n){
    return '<button class="fchip2'+(RULES_STATE[kind]===val?' on':'')+'" onclick="rulesChip(\''+kind+'\',\''+val+'\')">'
      +esc2(label)+(n!=null?'<span class="mono" style="opacity:.6">'+n+'</span>':'')+'</button>';
  };
  const cats = RULE_CATEGORIES.map(function(k){
    return c('cat',k.id,k.label,RULES.filter(function(r){return r.category===k.id;}).length);
  }).join('');
  const stats = RULE_STATUSES.map(function(s){
    return c('status',s,s,RULES.filter(function(r){return r.status===s;}).length);
  }).join('');
  const sevs = RULE_SEVERITIES.map(function(s){ return c('sev',s,s); }).join('');
  return '<div class="stack" style="gap:10px">'
    +'<div class="chipbar">'+c('cat','all','All categories',RULES.length)+cats+'</div>'
    +'<div class="chipbar">'+c('status','all','Any status')+stats+'</div>'
    +'<div class="chipbar">'+c('sev','all','Any severity')+sevs+'</div></div>';
}
function rulesChip(kind,val){
  RULES_STATE[kind]=val;
  $('#rules-chips').innerHTML=rulesChipsHTML();
  $('#rules-results').innerHTML=rulesResultsHTML();
}
function rulesQ(v){ RULES_STATE.q=v; $('#rules-results').innerHTML=rulesResultsHTML(); }

function rulesMatch(r){
  const s=RULES_STATE, q=s.q.trim().toLowerCase();
  if(s.cat!=='all' && r.category!==s.cat) return false;
  if(s.status!=='all' && r.status!==s.status) return false;
  if(s.sev!=='all' && r.severity!==s.sev) return false;
  if(!q) return true;
  return (r.name+' '+rulesPlain(r)+' '+r.id+' '+r.owner+' '+r.dimension+' '+(r.scope.tags||[]).join(' ')).toLowerCase().indexOf(q)>=0;
}
/* a rule retires; it is never deleted. Its record and its history stay. */
function rulesRetireAsk(id){
  const r = RULES.filter(function(x){ return x.id===id; })[0]; if(!r) return;
  confirmAsk({title:'Retire “'+esc2(r.name)+'”?',
    body:'It stops being evaluated from the next run. Answers already published under it keep saying so in their trace, and its change history stays — retiring never deletes the record.',
    verb:'Retire', onConfirm:function(){ r.status='Retired'; toast('Retired — '+r.name); rulesList(); }});
}
function rulesResultsHTML(){
  const items = RULES.filter(rulesMatch);
  const sevRank = {"Block":0, "Redact silently":1, "Redact with notice":2, "Warn":3, "Log only":4};
  return panel(null, listFrame("rules", {
    items: items, noun: "rules", noun1: "rule",
    repaint: function(){ const el=$('#rules-results'); if(el) el.innerHTML = rulesResultsHTML(); },
    sorts: [{key:"prec",   label:"Precedence — lowest runs first", get:function(r){ return r.precedence; }},
            {key:"name",   label:"Name",              get:function(r){ return r.name; }},
            {key:"cat",    label:"Category",          get:function(r){ return ruleCat(r.category).label; }},
            {key:"sev",    label:"Severity",          get:function(r){ return sevRank[r.severity]==null ? 9 : sevRank[r.severity]; }},
            {key:"ds",     label:"Datasets bound",    get:function(r){ return r.scope.datasets.length; }, desc:true},
            {key:"owner",  label:"Owner",             get:function(r){ return r.owner; }},
            {key:"status", label:"Status",            get:function(r){ return r.status; }},
            {key:"evals",  label:"Evaluations today", get:function(r){ return r.evalsToday; }, desc:true},
            {key:"pass",   label:"Allowed — share of checks that let the row through",         get:function(r){ return r.passRate; }, desc:true}],
    cols: [{label:"Order", sort:"prec", num:true, cell:function(r){ return '<span class="mono">'+r.precedence+'</span>'; }},
           {label:"Rule", sort:"name", style:"min-width:300px", cell:function(r){
              return '<div style="font-weight:600">'+esc2(r.name)+'</div>'
                + '<div class="mutedtext" style="margin-top:3px;max-width:56ch">'+esc2(rulesTrunc(rulesPlain(r),104))+'</div>'; }},
           {label:"Category", sort:"cat", cell:function(r){ const cat=ruleCat(r.category); return bdg(cat.label,cat.color,cat.icon); }},
           {label:"Severity", sort:"sev", cell:function(r){ return bdg(r.severity,RULE_SEVCLS[r.severity]); }},
           {label:"Datasets", sort:"ds", num:true, cell:function(r){ return r.scope.datasets.length; }},
           {label:"Owner", sort:"owner", cell:function(r){ return '<div class="person">'+avatar(r.owner,'sm')+'<div class="pn" style="font-size:12.5px">'+esc2(r.owner)+'</div></div>'; }},
           {label:"Status", sort:"status", cell:function(r){ return bdg(r.status,RULE_STATUSCLS[r.status]); }},
           {label:"Last run", cell:function(r){ return '<span class="mutedtext nw">'+esc2(r.lastRun)+'</span>'; }},
           {label:"Checked today", sort:"evals", num:true, cell:function(r){ return r.evalsToday ? fmt(r.evalsToday) : '—'; }},
           {label:"Allowed", sort:"pass", style:"min-width:110px", cell:function(r){
              return '<div class="rowflex" style="gap:8px"><span class="mono" style="font-size:11.5px">'+r.passRate+'%</span>'+meter(r.passRate,scoreCls(r.passRate))+'</div>'; }}],
    rowClick: function(r){ return "openRule('"+r.id+"')"; },
    actions: function(r){
      const a = [{label:'Open', icon:'book', onclick:"openRule('"+r.id+"')"}];
      if(r.status !== 'Retired') a.push({label:'Retire rule', icon:'archive', danger:true, onclick:"rulesRetireAsk('"+r.id+"')"});
      return a;
    },
    emptyTitle:'No rule matches that', emptySub:'Try clearing a filter, or search for a dataset name instead.', emptyIcon:'filter'
  }), {tight:true, foot:'A rule is an object with a history. It retires; it is never deleted.'});
}

/* ---------- how overlaps resolve ---------- */
function rulesHitPanel(){
  const pol = HIT_POLICIES.map(function(h){
    return '<div style="padding:10px 0;border-bottom:1px solid var(--hair2)"><div style="font-weight:600;font-size:13.5px">'+esc2(h.label)+'</div>'
      +'<div class="mutedtext" style="margin-top:2px;line-height:1.55">'+esc2(h.desc)+'</div></div>';
  }).join('');
  const worked =
    '<div class="defblock" style="margin-top:14px">'
    +'<b>A collision, worked through.</b> Nokuthula asks for members by locality. The cell for Somerset West holds <span class="mono">3</span>. Two rules match it.'
    +'</div>'
    +'<div class="dtbl-wrap scrollx" style="margin-top:12px"><table class="dtbl"><thead><tr><th class="num">#</th><th>Rule</th><th>Would do</th><th>Outcome</th></tr></thead><tbody>'
    +'<tr class="clk" onclick="openRule(\'r-small-count\')"><td class="num mono">30</td><td>Small-count suppression</td><td>Replace 3 with &lt;5</td><td>'+bdg('Applied','ok','check')+'</td></tr>'
    +'<tr class="clk" onclick="openRule(\'r-round-base5\')"><td class="num mono">34</td><td>Round to base 5</td><td>Replace 3 with 5</td><td>'+bdg('Never reached','mut')+'</td></tr>'
    +'</tbody></table></div>'
    +'<div class="mutedtext" style="margin-top:12px;line-height:1.6">Both rules use <b>Collect</b>, so they run in precedence order rather than competing. Suppression runs first and hands on <span class="mono">&lt;5</span> — not a number — so rounding has nothing to round. Had rounding won, the cell would have read <span class="mono">5</span> and implied a locality of five people that does not exist.</div>'
    +'<div class="rowflex" style="margin-top:12px"><button class="btn sm" onclick="toast(\'Every answer carries this trace. Open any answer and expand How this was worked out.\')">'+I2.eye+' See this on a real answer</button></div>';
  return panel('How overlapping rules resolve',
    '<div class="split" style="gap:26px"><div>'+worked+'</div><div>'
    +'<div class="mutedtext" style="margin-bottom:8px">Every rule declares one of four policies.</div>'+pol+'</div></div>',
    {icon:'flow', sub:'Two rules match the same cell. Which one wins?'});
}

/* ---------- new rule ---------- */
function rulesNew(){
  const cats = RULE_CATEGORIES.map(function(c){
    return '<div class="pickcard" onclick="closeModal();toast(\'Draft created in the '+esc2(c.label)+' category. It runs in shadow mode until two approvers sign it off — no live answer changes in the meantime.\')" style="margin-bottom:9px">'
      +'<div class="pi">'+(I2[c.icon]||I2.file)+'</div><div><div class="pn2">'+esc2(c.label)+'</div><div class="pd2">'+esc2(c.desc)+'</div></div></div>';
  }).join('');
  openModal('<h3>New rule</h3><div class="msub">Pick what the rule does. Spiff writes the first draft of the sentence; you edit the slots and name an owner before it can leave Draft.</div>'+cats+modalFoot('Cancel'),540);
}

/* =====================================================================
   DETAIL / EDITOR
   ===================================================================== */
function rulesDetail(id){
  const r=ruleById(id);
  if(!r){ $('#view-rules').innerHTML=emptyState('No such rule','That rule id is not on the books.','warn'); return; }
  const cat=ruleCat(r.category), locked=!!r.locked;
  crumbTrail([['Business rules',"go('rules')"],[esc(r.name),null]]);
  if(!RULES_STATE.previewAs) RULES_STATE.previewAs = 'Nokuthula Dladla';

  const stepIdx = r.status==='Draft'?0 : r.status==='In review'?1 : 2;
  const steps='<div class="steps">'+[['Draft','Written and owned'],['In review','Approvers sign it'],['Active','Applied on every run']].map(function(s,i){
    const st=i<stepIdx?'done':i===stepIdx?'on':'';
    return '<div class="st '+st+'"><div class="sc">'+(i<stepIdx?'✓':(i+1))+'</div><div class="sn2">'+esc2(s[0])+'</div></div>'+(i<2?'<div class="bar"></div>':'');
  }).join('')+'</div>';

  const statusNote = r.status==='Suspended'
    ? callout('warn','<b>Suspended.</b> This rule is not being applied. Everything it used to hide is visible to everyone who could otherwise reach it. '+esc2(r.lastRun)+'.','warn')
    : r.status==='Retired'
      ? callout('mut','<b>Retired on '+esc2(r.effectiveTo||'—')+'.</b> Kept on the books so answers produced while it was live can still be explained. It is not applied to anything now.','archive')
      : r.status!=='Active'
        ? callout('info','<b>'+esc2(r.status)+'.</b> Running in shadow mode — Spiff evaluates it and records what it would have done, but no answer is changed until it is activated.','info')
        : '';

  const lockNote = locked
    ? callout('crit','<b>This rule cannot be edited here.</b> Pastoral confidentiality is set in '+esc2(r.basis.doc)+', not in Spiff. The fields are excluded at the connector, so there is nothing for a Platform Admin to switch off. Changing it takes a signed change to the standard and a new connector build.','lock')
    : '';

  /* effect panel */
  const mm = r.method ? maskMethod(r.method) : null;
  const effect = '<div class="kvlist">'
    +'<div class="r"><span class="k">Action</span><span class="v">'+esc2(r.action)+'</span></div>'
    +(mm?'<div class="r"><span class="k">Method</span><span class="v">'+esc2(mm.label)+'</span></div>':'')
    +'<div class="r"><span class="k">Severity</span><span class="v">'+bdg(r.severity,RULE_SEVCLS[r.severity])+'</span></div>'
    +'<div class="r"><span class="k">Precedence</span><span class="v mono">'+r.precedence+'</span></div>'
    +'<div class="r"><span class="k">When two rules match</span><span class="v">'+esc2(hitPolicy(r.hitPolicy).label)+'</span></div>'
    +'</div>'
    +(mm?'<div class="defblock" style="margin-top:14px"><b>What the viewer sees.</b> '+esc2(mm.sees)+'</div>':'')
    +'<div class="mutedtext" style="margin-top:12px;line-height:1.6">'+esc2(hitPolicy(r.hitPolicy).desc)+'</div>'
    +'<div class="hairline"></div>'
    +'<div class="kv"><dt>If</dt><dd class="mono" style="font-size:12.5px">'+esc2(r.condition)+'</dd>'
    +'<dt>Except</dt><dd>'+esc2(r.exception)+'</dd></div>';

  /* scope panel */
  const dsChips = r.scope.datasets.map(function(d){
    const D=ds(d);
    return '<button class="fchip2" onclick="openDataset(\''+d+'\')">'+I2.db+esc2(D?D.name:d)+'</button>';
  }).join('');
  const scope = '<div class="mutedtext" style="margin-bottom:9px">Binds to '+r.scope.datasets.length+' dataset'+(r.scope.datasets.length===1?'':'s')+'. Open one to see the rule listed on its own profile.</div>'
    +'<div class="chipbar">'+dsChips+'</div>'
    +'<div class="hairline"></div>'
    +'<div class="kv"><dt>Fields</dt><dd>'+(r.scope.fields.length?r.scope.fields.map(function(f){return '<span class="tok a">'+esc2(f)+'</span>';}).join(' '):'<span class="mutedtext">Whole dataset</span>')+'</dd>'
    +'<dt>Tags</dt><dd>'+(r.scope.tags.length?r.scope.tags.map(function(t){return '<span class="tok f">'+esc2(t)+'</span>';}).join(' '):'<span class="mutedtext">—</span>')+'</dd></div>'
    +(r.glossary?'<div class="defblock" style="margin-top:14px"><b>'+esc2(r.glossary)+'</b> — '+esc2((GLOSSARY.find(function(g){return g.term===r.glossary;})||{def:''}).def)
      +' <button class="btn sm ghost" onclick="go(\'glossary\')">Open the definition</button></div>':'');

  /* governance panel */
  const appr = r.approvers.length
    ? r.approvers.map(function(a){ return '<div class="lrow" style="cursor:default"><div class="li">'+avatar(a.name)+'</div>'
        +'<div class="lm"><div class="lt">'+esc2(a.name)+'</div><div class="ls">'+esc2(a.role)+'</div></div>'
        +'<div class="lr">'+bdg('Signed '+a.on,'ok','check')+'</div></div>'; }).join('')
    : '<div class="mutedtext" style="padding:4px 0">Nobody has signed this yet. A rule needs two approvals before it can leave Draft.</div>';
  const gov = '<div class="kvlist" style="margin-bottom:12px">'
    +'<div class="r"><span class="k">Owner</span><span class="v">'+personChip(r.owner,'Accountable')+'</span></div>'
    +'<div class="r"><span class="k">Status</span><span class="v">'+bdg(r.status,RULE_STATUSCLS[r.status])+'</span></div>'
    +'<div class="r"><span class="k">Effective from</span><span class="v mono">'+esc2(r.effectiveFrom)+'</span></div>'
    +'<div class="r"><span class="k">Effective to</span><span class="v mono">'+esc2(r.effectiveTo||'No end date')+'</span></div>'
    +'</div>'
    +(r.expiresIn!=null && r.expiresIn<=30 ? callout('warn','Expires in '+r.expiresIn+' days. On that date it stops applying and everything it hides becomes visible. Re-argue it or let it lapse deliberately.','clock')+'<div style="height:12px"></div>' : '')
    +appr;

  /* activity */
  const hist = '<div class="tline">'+r.history.map(function(h,i){
    return '<div class="tev"><div class="td3'+(i===0?'':' mut')+'"></div>'
      +'<div class="tt2">'+esc2(h.what)+'</div>'
      +'<div class="ts2">'+esc2(h.who)+'</div><div class="tw">'+esc2(h.when)+'</div></div>';
  }).join('')+'</div>';
  const firings = '<div class="dtbl-wrap scrollx"><table class="dtbl"><thead><tr><th>When</th><th>Asked by</th><th>Dataset</th><th class="num">Rows</th></tr></thead><tbody>'
    +[[r.lastRun,'Thato S.',r.scope.datasets[0]||'—',Math.max(1,Math.round(r.rowsAffected/1400))],
      ['22 minutes ago','Londiwe Zwane',r.scope.datasets[1]||r.scope.datasets[0]||'—',Math.max(1,Math.round(r.rowsAffected/2600))],
      ['1 hour ago','Dawid Kruger',r.scope.datasets[0]||'—',Math.max(1,Math.round(r.rowsAffected/900))],
      ['3 hours ago','Farida Padayachee',r.scope.datasets[2]||r.scope.datasets[0]||'—',Math.max(1,Math.round(r.rowsAffected/1900))]]
      .map(function(f){ const D=ds(f[2]);
        return '<tr><td class="mutedtext">'+esc2(f[0])+'</td><td>'+esc2(f[1])+'</td><td>'+esc2(D?D.name:f[2])+'</td><td class="num">'+(r.evalsToday?fmt(f[3]):'—')+'</td></tr>'; }).join('')
    +'</tbody></table></div>';

  /* tests */
  const tests = '<div class="stack" style="gap:0">'+r.tests.map(function(t){
    const c = t.status==='pass'?'ok':t.status==='warn'?'warn':'crit';
    return '<div class="swrow"><div class="sl"><div class="sn">'+esc2(t.name)+'</div><div class="sd">'+esc2(t.expect)+'</div></div>'
      +bdg(t.status==='pass'?'Passes':t.status==='warn'?'Check':'Fails',c,t.status==='pass'?'check':'warn')+'</div>';
  }).join('')+'</div>';

  /* footer actions */
  const dis = locked ? ' disabled style="opacity:.4;cursor:not-allowed"' : '';
  const acts = '<div class="rowflex">'
    +'<button class="btn"'+dis+' onclick="rulesAction(\''+r.id+'\',\'save\')">'+I2.file+' Save draft</button>'
    +'<button class="btn pri"'+dis+' onclick="rulesAction(\''+r.id+'\',\'approve\')">'+I2.send+' Send for approval</button>'
    +'<div class="sp"></div>'
    +'<button class="btn"'+dis+' onclick="rulesAction(\''+r.id+'\',\'suspend\')">'+I2.eyeoff+' Suspend</button>'
    +'<button class="btn danger"'+dis+' onclick="rulesAction(\''+r.id+'\',\'retire\')">'+I2.archive+' Retire</button>'
    +'</div>'
    +(locked?'<div class="mutedtext" style="margin-top:10px">These controls are disabled for every user of Spiff, including Platform Admins.</div>':'');

  $('#view-rules').innerHTML =
    pageHead({
      eyebrow:'Business rule · '+esc(r.id),
      title:esc(r.name),
      desc:esc(r.dimension)+' · owned by '+esc(r.owner)+'. Evaluated on every run, for whoever is asking, and written to the activity log.',
      back:"go('rules')",
      badges:bdg(cat.label,cat.color,cat.icon)+bdg(r.severity,RULE_SEVCLS[r.severity])+bdg(r.status,RULE_STATUSCLS[r.status])
        +bdg('Precedence '+r.precedence,'mut')+bdg(hitPolicy(r.hitPolicy).label,'info','flow')
        +(locked?bdg('Not overridable','crit','lock'):''),
      acts:'<button class="btn" onclick="go(\'audit\')">'+I2.log+' Where it fired</button>'
        +'<button class="btn" onclick="rulesImpact(\''+r.id+'\')">'+I2.bolt+' Show me what changes</button>'
    })
    + steps + statusNote + (statusNote?'<div style="height:14px"></div>':'') + lockNote + (lockNote?'<div style="height:14px"></div>':'')
    + panel('The rule', '<div id="rules-sentence">'+rulesSentenceHTML(r)+'</div>'
        +'<div class="mutedtext" style="margin-top:14px;line-height:1.6">'+(locked
          ?'The slots are locked. This sentence is a copy of the standard, not a control.'
          :'Every highlighted part is a setting. Click one to change it — the sentence stays readable, and the change goes back into review.')+'</div>',
        {icon:'pencil', sub:'The sentence is the rule'})
    + panel('Test and preview',
        '<div class="rowflex" style="margin-bottom:14px;align-items:flex-end">'
        +'<div style="min-width:250px">'
        + pickList("Preview as", PEOPLE.map(function(p){ return [p.name, p.name+" — "+p.title]; }),
            RULES_STATE.previewAs, "rulesPreviewAs", {noAll:true})
        +'</div><div class="sp"></div>'
        +'<button class="btn sm" onclick="startSim(RULES_STATE.previewAs)">'+I2.eye+' Simulate them everywhere</button></div>'
        +'<div id="rules-prev">'+rulesPreviewHTML(r)+'</div>'
        +'<div class="hairline"></div>'+tests,
        {icon:'shield', sub:'Show me what they would see'})
    + '<div class="split wide" style="margin-top:14px"><div class="stack">'
    +   panel('Effect', effect, {icon:'bolt', sub:'What it does, and who wins'})
    +   panel('Scope', scope, {icon:'db', sub:'What it binds to'})
    +   panel('Recent firings', firings, {icon:'log', tight:true, foot:'Every firing is in the activity log with the question that caused it.'})
    + '</div><div class="stack">'
    +   panel('Identity', '<div class="kvlist">'
          +'<div class="r"><span class="k">Rule id</span><span class="v mono">'+esc2(r.id)+'</span></div>'
          +'<div class="r"><span class="k">Category</span><span class="v">'+bdg(cat.label,cat.color,cat.icon)+'</span></div>'
          +'<div class="r"><span class="k">Dimension</span><span class="v">'+esc2(r.dimension)+'</span></div>'
          +'<div class="r"><span class="k">Last run</span><span class="v">'+esc2(r.lastRun)+'</span></div>'
          +'<div class="r"><span class="k">Evaluations today</span><span class="v mono">'+(r.evalsToday?fmt(r.evalsToday):'—')+'</span></div>'
          +'<div class="r"><span class="k">Rows affected today</span><span class="v mono">'+(r.rowsAffected?fmt(r.rowsAffected):'—')+'</span></div>'
          +'<div class="r"><span class="k">Allowed</span><span class="v">'+r.passRate+'%</span></div>'
          +'<div class="r"><span class="k">Incidents</span><span class="v">'+(r.incidents?bdg(r.incidents+' logged','warn','warn'):bdg('None','ok','check'))+'</span></div>'
          +'</div>'
          +'<div class="hairline"></div>'
          +'<div class="mutedtext" style="margin-bottom:6px">Policy basis</div>'
          +'<button class="btn sm" style="width:100%;justify-content:flex-start" onclick="toast(\'Opens '+esc2(r.basis.doc)+' in the UBT policy library.\')">'+I2.book+' '+esc2(r.basis.doc)+'</button>'
          +'<div class="mutedtext" style="margin-top:7px">'+esc2(r.basis.sec)+(r.basis.law&&r.basis.law!=='—'?' · '+esc2(r.basis.law):'')+'</div>',
          {icon:'info'})
    +   panel('Governance', gov, {icon:'shield', sub:'Owner and approvals'})
    +   panel('Change history', hist, {icon:'clock', sub:r.history.length+' changes'})
    +   panel('Actions', acts, {icon:'bolt'})
    + '</div></div>';
}

/* ---------- preview ---------- */
function rulesPreviewAs(name){ RULES_STATE.previewAs=name; const r=ruleById(CURRENT_ARG); if(r) $('#rules-prev').innerHTML=rulesPreviewHTML(r); }

function rulesPreviewHTML(r){
  const person = PEOPLE.find(function(p){return p.name===RULES_STATE.previewAs;}) || PEOPLE[0];
  if(r.locked){
    return callout('crit','<b>There is no before and after.</b> '+esc2(r.preview.note)+' Nothing on this dataset can be previewed, unmasked or requested — by '+esc2(person.name)+' or by anyone else.','lock');
  }
  const s = RULE_SAMPLES[(r.preview&&r.preview.sample)||'member'];
  const pv = r.preview||{};
  const exempt = rulesExempt(r,person);
  const affect = pv.affect||[], hide = pv.hide||[], onlyRows = pv.rows||null;
  const shadow = r.status!=='Active';

  const head='<thead><tr>'+s.cols.map(function(c){return '<th>'+esc2(c)+'</th>';}).join('')+'</tr></thead>';
  const raw = '<table class="dtbl">'+head+'<tbody>'+s.rows.map(function(row){
    return '<tr>'+row.map(function(c){return '<td>'+esc2(c)+'</td>';}).join('')+'</tr>';
  }).join('')+'</tbody></table>';

  const seen = '<table class="dtbl">'+head+'<tbody>'+s.rows.map(function(row,ri){
    if(!exempt && hide.indexOf(ri)>=0){
      return '<tr style="opacity:.5"><td colspan="'+s.cols.length+'" class="mutedtext">'+I2.eyeoff+' Row withheld — '+esc2(r.name.toLowerCase())+'</td></tr>';
    }
    return '<tr>'+row.map(function(c,ci){
      const a = exempt ? null : affect.find(function(x){return x.col===ci && (!onlyRows || onlyRows.indexOf(ri)>=0);});
      if(a) return '<td style="background:var(--crit-soft);color:var(--crit);font-weight:600" title="'+esc2(a.why)+'">'+esc2(a.as)+'</td>';
      return '<td>'+esc2(c)+'</td>';
    }).join('')+'</tr>';
  }).join('')+'</tbody></table>';

  const verdict = exempt
    ? callout('warn','<b>'+esc2(person.name)+' is in the exception.</b> '+esc2(r.exception)+' They see these rows exactly as stored — and every one of those reads is in the activity log.','unlock')
    : callout('ok','<b>The rule applies to '+esc2(person.name)+'.</b> '+esc2(person.title)+' · '+esc2(person.locality)+'. Spiff re-checks this on every run, so the answer follows the person, not the report.','shield');

  return verdict
    +(shadow?'<div style="height:12px"></div>'+callout('info','<b>Shadow mode.</b> This preview shows what the rule <i>would</i> do. It is not applied to live answers yet.','info'):'')
    +'<div class="g2" style="margin-top:14px">'
    +panel('Rows as stored', '<div class="dtbl-wrap scrollx">'+raw+'</div>', {tight:true, sub:esc2(s.label)})
    +panel('As '+esc2(person.name.split(' ')[0])+' sees them', '<div class="dtbl-wrap scrollx">'+seen+'</div>', {tight:true, sub:exempt?'Exempt — nothing changes':'Changed cells are marked'})
    +'</div>'
    +'<div class="mutedtext" style="margin-top:12px;line-height:1.6">'+esc2(pv.note||'')+'</div>'
    +'<div class="rowflex" style="margin-top:12px"><button class="btn sm" onclick="rulesImpact(\''+r.id+'\')">'+I2.bolt+' Show me what changes</button>'
    +'<button class="btn sm" onclick="toast(\'Nothing was shared. A preview is yours alone — the person you previewed is not told, and no answer was created.\')">'+I2.info+' Does '+esc2(person.name.split(' ')[0])+' know?</button></div>';
}

function rulesImpact(id){
  const r=ruleById(id);
  const bound = PEOPLE.filter(function(p){return !rulesExempt(r,p);}).length;
  const people = Math.round(bound/PEOPLE.length*ORG.users);
  const rows = r.rowsAffected ? (r.rowsAffected>=1000000 ? (r.rowsAffected/1000000).toFixed(1)+' M' : fmt(Math.round(r.rowsAffected/100)*100)) : 'no';
  toast('This affects '+r.scope.datasets.length+' datasets, about '+people+' people and '+rows+' rows a day.');
}

/* ---------- footer actions, honestly worded ---------- */
function rulesAction(id,what){
  const r=ruleById(id);
  if(what==='save'){ toast('Draft saved against '+r.id+'. Nothing changes for anyone until two approvers sign it off.'); return; }
  if(what==='approve'){
    const who = r.approvers.length ? r.approvers.map(function(a){return a.name;}).join(' and ') : 'the two named approvers for this domain';
    toast('Sent to '+who+'. They see the sentence, the change against the live version and the test results before signing.');
    return;
  }
  if(what==='suspend'){
    const bound = PEOPLE.filter(function(p){return !rulesExempt(r,p);}).length;
    const people = Math.round(bound/PEOPLE.length*ORG.users);
    openModal('<h3>Suspend '+esc2(r.name)+'?</h3>'
      +'<div class="msub">Suspension takes effect on the next run — within a minute.</div>'
      +callout('warn','<b>About '+people+' people would immediately see what this rule hides</b> across '+r.scope.datasets.length+' datasets. Nothing is deleted and nothing is exported, but until it is switched back on, every answer runs without it.','warn')
      +'<div class="mutedtext" style="margin-top:12px">Suspension is recorded in the activity log against your name, and the owner, '+esc2(r.owner)+', is told.</div>'
      +modalFoot('Keep it running','Suspend the rule',"closeModal();toast('Suspended. "+esc2(r.owner)+" has been told, and the activity log shows who did it and when.')"),480);
    return;
  }
  if(what==='retire'){
    openModal('<h3>Retire '+esc2(r.name)+'?</h3>'
      +'<div class="msub">Retiring is permanent. Rules are never deleted.</div>'
      +callout('crit','<b>Retiring stops the rule applying,</b> so everything it hides becomes visible to everyone who could otherwise reach it. Write a replacement first — that is what happened when r-legacy-minor was retired.','warn')
      +'<div class="mutedtext" style="margin-top:12px">The rule stays on the books with its full history, so answers produced while it was live can still be explained.</div>'
      +modalFoot('Cancel','Retire the rule',"closeModal();toast('Retired. It stays on the books, greyed out, so old answers can still be explained.')"),480);
    return;
  }
}
</script>
