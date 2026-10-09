<script>
/* =====================================================================
   Templates — the page, the wizard, and the footer on every answer
   Govern › Templates. Shape only: which blocks, in what order, with what
   formats. "Save as template" lifts the shape out of an answer you like.
   Spiff recommends one per question and says so under the answer; the
   person can change the layout, and the numbers never move.
   ===================================================================== */
CRUMB2.templates = "Templates"; CRUMB.templates = "Templates";

/* ---------- helpers ---------- */
function tplBlocksHTML(t){
  return '<span class="tpl-blocks">'+t.blocks.map(function(b){ const B = tplBlock(b); return '<span class="tb'+(B.fixed?' fx':'')+'" title="'+esc2(B.desc||'')+'">'+esc2(B.label)+'</span>'; }).join('<span class="tarrow">›</span>')+'</span>';
}
function tplAppliesText(t){
  const d = t.applies.datasets.map(function(id){ const x = ds(id); return x ? x.name : id; });
  const parts = [];
  if(d.length) parts.push(d.join(", "));
  if(t.applies.teams.length) parts.push(t.applies.teams.join(", "));
  return parts.length ? parts.join(" · ") : (t.system ? "Everything else" : "Not bound yet");
}
function tplRepaint(){ const el = $('#tpl-results'); if(el) el.innerHTML = tplResultsHTML(); const k = $('#tpl-kpis'); if(k) k.innerHTML = tplKpisHTML(); }

/* ---------- the page ---------- */
function tplKpisHTML(){
  const live = TEMPLATES.filter(function(t){ return t.status==="Approved"; });
  const rev = TEMPLATES.filter(function(t){ return t.status==="In review" || t.status==="Draft"; });
  const answers = TEMPLATES.reduce(function(a,t){ return a+t.usedBy.answers; },0), autos = TEMPLATES.reduce(function(a,t){ return a+t.usedBy.automations; },0);
  return kpi("Approved templates", live.length, "of "+TEMPLATES.length+" · one is Spiff's default")
    + kpi("Drafts and in review", rev.length, rev.length ? "not yet recommended to anyone" : "nothing waiting")
    + kpi("Answers laid out", fmt(answers), "saved answers using a template")
    + kpi("Automations bound", autos, "deliver in a prescribed shape");
}
function tplResultsHTML(){
  const q = TPL_STATE.q.trim().toLowerCase();
  const items = TEMPLATES.filter(function(t){
    if(TPL_STATE.status!=="all" && t.status!==TPL_STATE.status) return false;
    if(!q) return true;
    return (t.name+" "+tplAppliesText(t)+" "+t.owner+" "+t.note).toLowerCase().indexOf(q)>=0;
  });
  return panel(null, listFrame("templates", {
    items: items, noun:"templates", noun1:"template", repaint: tplRepaint, size: 10,
    sorts:[{key:"name", label:"Name", get:function(t){ return t.name; }},
           {key:"status", label:"Status", get:function(t){ return TPL_STATUSES.indexOf(t.status); }},
           {key:"owner", label:"Owner", get:function(t){ return t.owner; }},
           {key:"used", label:"Most used", get:function(t){ return t.usedBy.answers+t.usedBy.automations; }, desc:true},
           {key:"agreed", label:"Most recently agreed", get:function(t){ return t.agreed; }, desc:true}],
    cols:[{label:"Template", sort:"name", style:"min-width:260px", cell:function(t){
             return '<div style="font-weight:600">'+esc2(t.name)+(t.system?' <span class="bdg mut">default</span>':'')+'</div>'
               + '<div class="mutedtext" style="margin-top:3px;max-width:52ch">'+esc2(t.note.length>110 ? t.note.slice(0,108)+"…" : t.note)+'</div>'; }},
          {label:"Applies to", cell:function(t){ return '<span style="font-size:12.5px">'+esc2(tplAppliesText(t))+'</span>'; }},
          {label:"Shape", style:"min-width:300px", cell:function(t){ return tplBlocksHTML(t); }},
          {label:"Chart", cell:function(t){ return '<span class="mono" style="font-size:12px">'+esc2(t.chart)+'</span>'; }},
          {label:"Owner", sort:"owner", cell:function(t){ return t.system ? '<span class="mutedtext">Spiff</span>' : '<div class="person">'+avatar(t.owner,'sm')+'<div class="pn" style="font-size:12.5px">'+esc2(t.owner)+'</div></div>'; }},
          {label:"Status", sort:"status", cell:function(t){ return bdg(t.status, TPL_STATUSCLS[t.status])+' <span class="mono mutedtext" style="font-size:11.5px">v'+t.version+'</span>'; }},
          {label:"Used by", sort:"used", num:true, cell:function(t){ return (t.usedBy.answers?t.usedBy.answers+' answers':'')+(t.usedBy.answers&&t.usedBy.automations?' · ':'')+(t.usedBy.automations?t.usedBy.automations+' automations':'')||'—'; }}],
    rowClick:function(t){ return "tplDetail('"+t.id+"')"; },
    actions:function(t){ return t.system ? [{label:'Open', icon:'eye', onclick:"tplDetail('"+t.id+"')"}] : [
      {label:'Open', icon:'eye', onclick:"tplDetail('"+t.id+"')"},
      {label:'Edit', icon:'pencil', onclick:"tplModal('"+t.id+"')"}].concat(t.status==='Draft' ? [{label:'Send for approval', icon:'send', onclick:"tplSubmit('"+t.id+"')"}] : []).concat([
      {label:'Duplicate', icon:'copy', onclick:"tplDuplicate('"+t.id+"')"},
      {label:'Retire', icon:'archive', danger:true, onclick:"tplRetireAsk('"+t.id+"')"}]); },
    notOurs:function(t){ return !!t.system; },
    emptyTitle:"No templates match", emptySub:"Clear the search or the status filter.", emptyIcon:"file"
  }), {tight:true});
}
function tplChip(s){ TPL_STATE.status = s; $('#tpl-chips').innerHTML = tplChipsHTML(); tplRepaint(); }
function tplChipsHTML(){
  const c = function(val,label,n){ return '<button class="fchip2'+(TPL_STATE.status===val?' on':'')+'" onclick="tplChip(\''+val+'\')">'+esc2(label)+(n!=null?'<span class="mono" style="opacity:.6">'+n+'</span>':'')+'</button>'; };
  return '<div class="chipbar">'+c('all','Any status',TEMPLATES.length)+TPL_STATUSES.map(function(s){ return c(s,s,TEMPLATES.filter(function(t){ return t.status===s; }).length); }).join('')+'</div>';
}
function renderTemplates(){
  $('#view-templates').innerHTML =
    pageHead({
      eyebrow:'Govern',
      title:'Templates',
      desc:'How a class of answer is laid out: which blocks, in what order, with what formats. A template never touches a number — the shape changes, the numbers do not. Definitions fix the words at Understand, business rules fix the rows at Apply rules, templates fix the shape at Compose.',
      badges: bdg(TEMPLATES.filter(function(t){ return t.status==="Approved"; }).length+" approved","ok","check") + bdg("shape only — no checks yet","mut","info"),
      acts:'<button class="btn" onclick="go(\'glossary\')">'+I2.book+' Definitions</button>'
        +'<button class="btn" onclick="go(\'rules\')">'+I2.shield+' Business rules</button>'
        +'<button class="btn pri" onclick="tplModal()">'+I2.plus+' New template</button>'
    })
    + '<div id="tpl-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(168px,1fr));gap:14px;margin-bottom:18px">'+tplKpisHTML()+'</div>'
    + '<div class="split wide"><div>'
    +   '<div class="bigsearch" style="margin-bottom:12px">'+I2.search+'<input placeholder="Search templates — try finance, statutory, digest" value="'+esc2(TPL_STATE.q)+'" oninput="TPL_STATE.q=this.value;tplRepaint()"></div>'
    +   '<div id="tpl-chips">'+tplChipsHTML()+'</div>'
    +   '<div id="tpl-results" style="margin-top:14px">'+tplResultsHTML()+'</div>'
    + '</div><div class="stack">'
    +   panel('How Spiff picks one', '<div class="stack" style="gap:9px;font-size:13.5px;line-height:1.6">'
          + '<div><b>One match</b> — applied, and the answer says so in its footer.</div>'
          + '<div><b>Several</b> — the best fit is recommended with its reason; the others sit in the Layout menu on the answer.</div>'
          + '<div><b>None</b> — Spiff\'s default. There is always exactly one template in force.</div>'
          + '<div><b>Automations</b> carry a template on their delivery step, so a Monday digest looks like last Monday\'s.</div>'
          + '</div>', {icon:"spark", tight:false, foot:"A person can change the layout of any answer. Nobody can change its numbers."})
    +   panel('What a template can never remove', '<div style="font-size:13.5px;line-height:1.6">The scope statement, the as-at time, the withheld notice and the link to the working. They belong to Spiff, not to the template.</div>', {icon:"lock"})
    +   panel('Where templates come from', '<div style="font-size:13.5px;line-height:1.6">Mostly from an answer someone liked — <b>Save as template</b> lifts the shape out of it. Or from scratch, here. Either way: an owner, a version, a status, and retirement rather than deletion.</div>', {icon:"file"})
    + '</div></div>';
}
V2ROUTES.templates = renderTemplates;

/* ---------- detail ---------- */
function tplDetail(id){
  const t = templateById(id); if(!t) return;
  const f = t.formats;
  const m = $('#modal');
  m.innerHTML = '<div class="modal" style="max-width:640px">'
    + '<h3>'+esc2(t.name)+' <span class="mono mutedtext" style="font-size:12px">v'+t.version+'</span> '+bdg(t.status, TPL_STATUSCLS[t.status])+'</h3>'
    + '<div class="msub">'+esc2(t.note)+'</div>'
    + '<div class="kvlist">'
    +   '<div class="r"><span class="k">Applies to</span><span class="v">'+esc2(tplAppliesText(t))+(t.applies.note?' <span class="mutedtext">· '+esc2(t.applies.note)+'</span>':'')+'</span></div>'
    +   '<div class="r"><span class="k">Shape</span><span class="v">'+tplBlocksHTML(t)+'</span></div>'
    +   '<div class="r"><span class="k">Chart</span><span class="v">'+esc2(t.chart)+' · commentary '+esc2(t.commentary)+' · header '+esc2(t.header)+'</span></div>'
    +   '<div class="r"><span class="k">Numbers</span><span class="v">'+esc2(f.numbers)+'</span></div>'
    +   '<div class="r"><span class="k">Currency</span><span class="v">'+esc2(f.currency)+'</span></div>'
    +   '<div class="r"><span class="k">Period</span><span class="v">'+esc2(f.period)+'</span></div>'
    +   '<div class="r"><span class="k">Negatives</span><span class="v">'+esc2(f.negatives)+'</span></div>'
    +   '<div class="r"><span class="k">Owner</span><span class="v">'+esc2(t.owner)+(t.agreed!=="—"?' · approved '+esc2(t.agreed):'')+'</span></div>'
    +   '<div class="r"><span class="k">Approver</span><span class="v">'+(t.approver?esc2(t.approver):'<span class="mutedtext">none — Spiff\'s default needs no sign-off</span>')+(t.status==="In review"?' · <span class="bdg warn">waiting on them — in their Inbox</span>':'')+'</span></div>'
    +   '<div class="r"><span class="k">Used by</span><span class="v">'+t.usedBy.answers+' saved answers · '+t.usedBy.automations+' automations</span></div>'
    + '</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    + (t.system ? '' : '<button class="btn" onclick="closeModal();tplModal(\''+t.id+'\')">'+I2.pencil+' Edit</button>')
    + '</div></div>';
  m.classList.add('on');
}

/* ---------- the wizard: new, edit, or from an answer ---------- */
function tplModal(id, seed){
  const t = id ? templateById(id) : null;
  const d = t ? JSON.parse(JSON.stringify(t)) : Object.assign({
    id:'', name:'', applies:{datasets:[], teams:[], note:''}, blocks:['headline','chart','table','commentary','notes'], chart:'any', commentary:'short',
    formats:{numbers:'Thousands separators · one decimal on rates', currency:'NZ$ to the dollar', period:'Named — never "last quarter"', negatives:'Minus sign'},
    header:'none', owner: ME.full, approver:'', status:'Draft', version:1, agreed:'—', usedBy:{answers:0, automations:0}, note:''
  }, seed||{});
  const bindable = DATASETS.slice();
  wizardOpen({
    title: t ? 'Edit '+esc2(t.name) : seed ? 'Save this answer\'s shape as a template' : 'New template',
    intro: 'Shape only. Which blocks, in what order, with what formats. It never decides what a viewer may see — that stays with business rules.',
    finish: t ? 'Save version '+(t.version+1) : 'Create template', width: 620,
    data: d,
    steps:[
      { name:'Name', render:function(d){ return admInput('tpl-name','Template name','e.g. Finance monthly pack', d.name)
            + '<div class="g2">'+admSelect('tpl-owner','Owner — writes the shape', admPeopleOptions(d.owner))+admSelect('tpl-approver','Approver — signs it off', '<option value="">Choose…</option>'+admPeopleOptions(d.approver))+'</div>'
            + '<div class="field"><label>Applies to datasets</label><div class="ckgrid" id="tpl-ds">'+bindable.map(function(x){ return '<label class="ckrow"><input type="checkbox" value="'+esc2(x.id)+'"'+(d.applies.datasets.indexOf(x.id)>=0?' checked':'')+'> '+esc2(x.name)+'</label>'; }).join('')+'</div></div>'
            + '<div class="field"><label>Applies to teams</label><div class="ckgrid" id="tpl-teams">'+TEAMS.map(function(tm){ return '<label class="ckrow"><input type="checkbox" value="'+esc2(tm[0])+'"'+(d.applies.teams.indexOf(tm[0])>=0?' checked':'')+'> '+esc2(tm[0])+'</label>'; }).join('')+'</div></div>'
            + '<div class="wz-note">A question matches on its datasets first, then on the asker\'s team. Bind nothing and the template is only ever chosen by hand.</div>'; },
        collect:function(d){ return { name: admVal('tpl-name'), owner: admVal('tpl-owner'), approver: admVal('tpl-approver'),
            applies: Object.assign({}, d.applies, { datasets: [].slice.call(document.querySelectorAll('#tpl-ds input:checked')).map(function(i){ return i.value; }),
                                                    teams: [].slice.call(document.querySelectorAll('#tpl-teams input:checked')).map(function(i){ return i.value; }) }) }; },
        validate:function(d){ if(!d.name) return 'Give the template a name'; if(!d.approver) return 'Name an approver — a template is signed off by someone other than its owner'; if(d.approver===d.owner) return 'The approver must be someone other than the owner'; if(!t && TEMPLATES.some(function(x){ return x.name.toLowerCase()===d.name.toLowerCase(); })) return 'A template called '+d.name+' already exists'; } },
      { name:'Shape', render:function(d){
            const on = function(b){ return d.blocks.indexOf(b)>=0; };
            return '<div class="field"><label>Blocks, in the order they appear</label><div class="tpl-order" id="tpl-order">'
              + d.blocks.map(function(b, i){ const B = tplBlock(b); return '<div class="tpl-row" data-b="'+b+'"><span class="tb'+(B.fixed?' fx':'')+'">'+esc2(B.label)+'</span><span class="mutedtext" style="font-size:12px;flex:1">'+esc2(B.desc)+'</span>'
                  + (B.fixed ? '<span class="bdg mut">always</span>' : '<button class="btn sm" title="Move up" onclick="tplMove(\''+b+'\',-1)">'+TPL_UP+'</button><button class="btn sm" title="Move down" onclick="tplMove(\''+b+'\',1)">'+I2.down+'</button><button class="btn sm" title="Remove" onclick="tplMove(\''+b+'\',0)">'+I2.x+'</button>')+'</div>'; }).join('')
              + '</div></div>'
              + '<div class="field"><label>Add a block</label><div class="rowflex">'+TPL_BLOCKS.filter(function(B){ return !on(B.id); }).map(function(B){ return '<button class="btn sm" onclick="tplAdd(\''+B.id+'\')">'+I2.plus+' '+esc2(B.label)+'</button>'; }).join('')+'</div></div>'
              + '<div class="g2">'
              + admSelect('tpl-chart','Chart', TPL_CHARTS.map(function(c){ return '<option'+(c===d.chart?' selected':'')+'>'+c+'</option>'; }).join(''))
              + admSelect('tpl-comm','Commentary', ['none','short','full'].map(function(c){ return '<option'+(c===d.commentary?' selected':'')+'>'+c+'</option>'; }).join(''))
              + '</div>'
              + '<div class="wz-note">Scope, as-at and the withheld notice are always present. A template can order them; it cannot remove them.</div>'; },
        collect:function(d){ return { chart: admVal('tpl-chart'), commentary: admVal('tpl-comm'), blocks: [].slice.call(document.querySelectorAll('#tpl-order .tpl-row')).map(function(r){ return r.dataset.b; }) }; },
        validate:function(d){ if(d.blocks.filter(function(b){ return b!=='notes'; }).length===0) return 'Keep at least one block besides the notes'; } },
      { name:'Formats', render:function(d){ return admInput('tpl-num','Numbers','e.g. Whole numbers · rates to one decimal', d.formats.numbers)
            + admInput('tpl-cur','Currency','e.g. NZ$ to the dollar', d.formats.currency)
            + admInput('tpl-per','Period label','e.g. "September 2026" — never "last month"', d.formats.period)
            + '<div class="g2">'
            + admSelect('tpl-neg','Negatives', ['Minus sign','Brackets','Minus sign · red delta'].map(function(c){ return '<option'+(c===d.formats.negatives?' selected':'')+'>'+c+'</option>'; }).join(''))
            + admSelect('tpl-head','Header', ['none','UBT'].map(function(c){ return '<option'+(c===d.header?' selected':'')+'>'+c+'</option>'; }).join(''))
            + '</div>'
            + '<div class="wz-note">Display only. A rounding rule that protects privacy lives at Apply rules and runs whatever this says.</div>'; },
        collect:function(d){ return { formats:{numbers:admVal('tpl-num'), currency:admVal('tpl-cur'), period:admVal('tpl-per'), negatives:admVal('tpl-neg')}, header:admVal('tpl-head') }; } },
      { name:'Review', render:function(d){ return '<div class="kvlist">'
            + '<div class="r"><span class="k">Name</span><span class="v">'+esc2(d.name)+' · owner '+esc2(d.owner)+' · approver '+esc2(d.approver)+'</span></div>'
            + '<div class="r"><span class="k">Applies to</span><span class="v">'+esc2(tplAppliesText(d))+'</span></div>'
            + '<div class="r"><span class="k">Shape</span><span class="v">'+tplBlocksHTML(d)+'</span></div>'
            + '<div class="r"><span class="k">Chart · commentary</span><span class="v">'+esc2(d.chart)+' · '+esc2(d.commentary)+'</span></div>'
            + '<div class="r"><span class="k">Formats</span><span class="v">'+esc2(d.formats.numbers)+' · '+esc2(d.formats.currency)+' · '+esc2(d.formats.period)+' · '+esc2(d.formats.negatives)+'</span></div>'
            + '</div>'
            + admInput('tpl-note','One line a stranger reads first','What this shape is for, and what it leaves out on purpose', d.note)
            + '<div class="wz-note">'+(t ? 'Saving makes version '+(t.version+1)+'. Answers already saved keep the version they were laid out with.' : 'It starts as a Draft. Send it for approval when it is ready; nobody is recommended a draft.')+'</div>'; },
        collect:function(d){ return { note: admVal('tpl-note') }; } }
    ],
    onFinish:function(d){
      if(t){ Object.assign(t, d, {version: t.version+1, agreed:'just now'}); toast(t.name+' saved as version '+t.version); }
      else { d.id = 'tpl-'+admSlug(d.name); d.status = 'Draft'; d.version = 1; d.agreed = '—'; TEMPLATES.unshift(d); toast('Template created as a draft — send it to '+d.approver.split(' ')[0]+' for approval when it is ready'); }
      if($('#view-templates') && $('#view-templates').classList.contains('on')) renderTemplates();
    }
  });
}
/* the Shape step edits the wizard's live data directly, then repaints the step */
function tplWz(){ return (typeof WIZ!=='undefined' && WIZ) ? WIZ : null; }
const TPL_UP = I2.down.replace('<svg', '<svg style="transform:rotate(180deg)"');
function tplMove(b, dir){
  const w = tplWz(); if(!w) return; const d = w.data, i = d.blocks.indexOf(b); if(i<0) return;
  if(dir===0){ d.blocks.splice(i,1); }
  else { const j = i+dir; if(j<0 || j>=d.blocks.length) return; d.blocks.splice(i,1); d.blocks.splice(j,0,b); }
  wizardPaint();
}
function tplAdd(b){ const w = tplWz(); if(!w) return; const d = w.data; const ni = d.blocks.indexOf('notes'); if(ni>=0) d.blocks.splice(ni,0,b); else d.blocks.push(b); wizardPaint(); }

function tplDuplicate(id){ const t = templateById(id); if(!t) return; const c = JSON.parse(JSON.stringify(t)); c.id='tpl-'+admSlug(t.name+'-copy'); c.name=t.name+' (copy)'; c.system=false; c.status='Draft'; c.version=1; c.agreed='—'; c.owner=ME.full; c.usedBy={answers:0,automations:0}; TEMPLATES.unshift(c); toast('Duplicated as a draft you own'); tplRepaint(); }
function tplRetireAsk(id){
  const t = templateById(id); if(!t) return;
  confirmAsk({title:'Retire '+esc2(t.name)+'?', sub:'Retired, not deleted. Its record and every version stay.',
    body:(t.usedBy.automations?t.usedBy.automations+' automation'+(t.usedBy.automations===1?'':'s')+' deliver in this shape today; from the next run they fall back to Spiff\'s default and their owners are told. ':'')+'Saved answers keep the version they were laid out with.',
    verb:'Retire', onConfirm:function(){ t.status='Retired'; toast(t.name+' retired'); tplRepaint(); }});
}

/* ---------- "Save as template" from an answer ---------- */
function tplFromAnswer(answerId){
  const a = ANSWERS[answerId]; if(!a) return;
  const ctx = tplCtx(answerId);
  const blocks = [];
  if(a.metrics) blocks.push('headline');
  if(a.chart) blocks.push('chart');
  if(a.table) blocks.push('table');
  if(a.lede) blocks.push('commentary');
  blocks.push('notes');
  tplModal(null, { name:'', applies:{datasets:ctx.datasets.slice(), teams: ctx.team?[ctx.team]:[], note:'Lifted from "'+a.q+'"'}, blocks:blocks, chart: a.chart ? (a.chart.type||'any') : 'none', commentary: a.lede ? 'full' : 'none', note:'Lifted from the answer "'+a.q+'" on '+FX.short+'.' });
}

/* ---------- the layout menu on an answer (the footer that preceded it is kept for reference), and Change layout ---------- */
function tplFooterHTML(answerId){
  const rec = tplFor(tplCtx(answerId)), t = tplApplied(answerId), chosen = TPL_STATE.choice[answerId] && TPL_STATE.choice[answerId]!==rec.chosen.id;
  return '<div class="tplfoot">'+I2.file
    + '<span>Laid out with <b>'+esc2(t.name)+'</b> <span class="mono">v'+t.version+'</span>'
    + (chosen ? ' · your choice' : (rec.reason ? ' · recommended: '+esc2(rec.reason) : ''))
    + (rec.ambiguous && !chosen ? ' · <span class="bdg warn">two fit equally — check</span>' : '')
    + '</span><span class="sp"></span>'
    + '<button class="btn sm" onclick="tplChangeLayout(\''+answerId+'\')">'+I2.grid+' Change layout</button>'
    + '<button class="btn sm" onclick="tplFromAnswer(\''+answerId+'\')">'+I2.plus+' Save as template</button>'
    + '</div>';
}
function tplChangeLayout(answerId){
  const rec = tplFor(tplCtx(answerId)), cur = tplApplied(answerId);
  const rows = rec.candidates.map(function(t){
    const isRec = t.id===rec.chosen.id;
    return '<div class="lrow'+(t.id===cur.id?' on':'')+'" onclick="tplChoose(\''+answerId+'\',\''+t.id+'\')"><div class="li">'+I2.file+'</div>'
      + '<div class="lm"><div class="lt">'+esc2(t.name)+' <span class="mono mutedtext" style="font-size:11.5px">v'+t.version+'</span>'+(isRec?' <span class="bdg ok">recommended</span>':'')+(t.id===cur.id?' <span class="bdg mut">in use</span>':'')+'</div>'
      + '<div class="ls">'+tplBlocksHTML(t)+'</div><div class="ls" style="margin-top:3px">'+esc2(isRec && rec.reason ? rec.reason : t.applies.note || '')+'</div></div>'
      + '<div class="lr">'+I2.chev+'</div></div>';
  }).join('');
  const m = $('#modal');
  m.innerHTML = '<div class="modal" style="max-width:600px"><h3>Change the layout</h3>'
    + '<div class="msub">The shape changes. The numbers do not — they come from the same rows, under the same rules, for you.</div>'
    + '<div class="stack" style="gap:6px">'+rows+'</div>'
    + '<div class="sharenote" style="margin-top:12px">Only approved templates and those in review are offered. Drafts are their owner\'s until marked approved.</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn" onclick="closeModal();go(\'templates\')">'+I2.chev+' All templates</button></div></div>';
  m.classList.add('on');
}
function tplChoose(answerId, tplId){
  TPL_STATE.choice[answerId] = tplId; closeModal();
  const t = templateById(tplId);
  toast('Laid out with '+t.name+' — the shape changed, the numbers did not');
  if(typeof AUDIT!=='undefined' && typeof AUDEV==='function' && typeof UND_SEQ!=='undefined'){
    AUDIT.unshift(AUDEV(++UND_SEQ, fxLocalISO(new Date()), "today "+fxTime(new Date()), "q.chart", ME.full, "LDM Coordinator — Cape Localities", tplCtx(answerId).datasets[0]||null, ANSWERS[answerId].q, "Layout changed to "+t.name+" v"+t.version+". The shape changed; the numbers did not.", {outcome:"ok", ms:40}));
  }
  if($('#view-answer') && $('#view-answer').classList.contains('on')) openAnswer(answerId, ANSWERS[answerId].q);
}

/* ---------- automations carry a template on their delivery step ---------- */
(function(){
  if(typeof CAPCFG==='undefined') return;
  const names = function(){ return tplLive().map(function(t){ return t.name; }); };
  ['brief','upload','mission'].forEach(function(k){
    const c = CAPCFG[k]; if(!c || c.fields.some(function(f){ return f.k==='layout'; })) return;
    c.fields.push({k:'layout', label:'Layout — template', type:'select', opts: names()});
  });
})();
</script>
