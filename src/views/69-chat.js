<script>
/* =====================================================================
   SPIFF v2 — PORTAL CHAT WORKSPACE
   Three panes: threads · conversation · canvas.
   Everything clicks. Nothing computes.
   ===================================================================== */

const CHAT_UI = {tid:"t-ldm", q:"", by:"time", canvas:true, ctab:"artifact",
  mode:"manual", depth:"quick", scope:"auto", ver:{}};
const CHAT_UP   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 21V10l5-7 1.4 1a3 3 0 011 3.1L13.6 10H19a2 2 0 012 2.4l-1.5 7A2 2 0 0117.5 21z"/><path d="M7 10H4v11h3"/></svg>';
const CHAT_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3v11l-5 7-1.4-1a3 3 0 01-1-3.1L10.4 14H5a2 2 0 01-2-2.4l1.5-7A2 2 0 016.5 3z"/><path d="M17 14h3V3h-3"/></svg>';
const CHAT_SPIN = '<span style="width:11px;height:11px;border-radius:50%;border:2px solid var(--warn);border-top-color:transparent;animation:spin .7s linear infinite;display:inline-block;flex:none"></span>';
const CHAT_LIMIT = 'Spiff never writes to a source system, never reads pastoral care notes, and will not estimate a number it cannot source — where your access stops, the answer stops and says so.';

/* ---------- root ---------- */
function renderChat(arg){
  if(arg && THREADS.some(function(x){return x.id===arg;})) CHAT_UI.tid = arg;
  const t = threadById(CHAT_UI.tid);
  $('#view-chat').innerHTML = '<div class="portal'+(CHAT_UI.canvas?' with-canvas':'')+'">'
    + chatRail(t) + chatCentre(t) + (CHAT_UI.canvas ? chatCanvas(t) : '') + '</div>';
  const ta = $('#chat-in');
  if(ta){
    ta.oninput = function(){ this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,150)+'px'; };
    ta.onkeydown = function(e){ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); chatSend(); } };
  }
  chatBottom();
}
V2ROUTES.chat = renderChat;

function openThread(id){ CHAT_UI.tid = id; CHAT_UI.ver = {}; go('chat', id); }
function chatBottom(){ const b=$('#chatscroll'); if(b) b.scrollTop = b.scrollHeight; }

/* ---------- A. thread rail ---------- */
function chatSnip(t){
  const m = t.msgs[t.msgs.length-1];
  return m ? String(m.text||'').replace(/<[^>]+>/g,'').slice(0,80) : 'Nothing asked yet';
}
function chatRailBody(cur){
  const q = CHAT_UI.q.toLowerCase();
  const list = THREADS.filter(function(x){
    return !q || (x.title+' '+x.project+' '+chatSnip(x)).toLowerCase().indexOf(q)>=0; });
  return listFrame("chats", {
    items: list, noun: "conversations", noun1: "conversation", size: 10,
    repaint: function(){ const el=$('.threadpane .tp-b'); if(el) el.innerHTML = chatRailBody(threadById(CHAT_UI.tid)); },
    sorts: [{key:"time",    label:"Recent",     grouped:true, get:function(t){ return (t.pinned?0:1)*100000 + THREADS.indexOf(t); }},
            {key:"project", label:"By project", grouped:true, get:function(t){ return t.project+' '+String(THREADS.indexOf(t)).padStart(6,'0'); }},
            {key:"az",      label:"A–Z",        get:function(t){ return t.title; }}],
    group: function(t, k){ return k==="project" ? {key:t.project, label:t.project} : {key:(t.pinned?"Pinned":t.group), label:(t.pinned?"Pinned":t.group)}; },
    groupPlain: true,
    row: function(t){ return chatTRow(t, cur); },
    emptyTitle: "No conversation matches", emptySub: "Try a locality, a measure, or a project name."
  });
}
function chatRailBodyLegacy(cur){
  const q = CHAT_UI.q.toLowerCase();
  const list = THREADS.filter(function(x){
    return !q || (x.title+' '+x.project+' '+chatSnip(x)).toLowerCase().indexOf(q)>=0; });
  let b = '';
  if(!list.length) b = '<div class="empty2" style="padding:34px 12px">'+I2.search+'<div class="et">No conversation matches</div><div>Try a locality, a measure, or a project name.</div></div>';
  else if(CHAT_UI.by==='project'){
    const projs = [];
    list.forEach(function(x){ if(projs.indexOf(x.project)<0) projs.push(x.project); });
    projs.forEach(function(p){
      const g = list.filter(function(x){return x.project===p;});
      b += '<div class="tgrp">'+esc(p)+' · '+g.length+'</div>' + g.map(function(x){return chatTRow(x,cur);}).join('');
    });
  } else {
    const pin = list.filter(function(x){return x.pinned;});
    if(pin.length) b += '<div class="tgrp">'+I2.star+' Pinned</div>' + pin.map(function(x){return chatTRow(x,cur);}).join('');
    ['Today','Yesterday','Last 7 days','Earlier'].forEach(function(g){
      const rows = list.filter(function(x){return x.group===g && !x.pinned;});
      if(rows.length) b += '<div class="tgrp">'+g+' · '+rows.length+'</div>' + rows.map(function(x){return chatTRow(x,cur);}).join('');
    });
  }
  return b;
}
function chatRail(cur){
  return '<aside class="threadpane">'
    + '<div class="tp-h">'
      + '<button class="btn pri" style="width:100%;justify-content:center" onclick="chatNew()">'+I2.plus+' New chat</button>'
      + '<div style="position:relative">'
        + '<span style="position:absolute;left:10px;top:9px;width:14px;height:14px;color:var(--muted);display:block">'+I2.search+'</span>'
        + '<input id="chat-q" value="'+esc(CHAT_UI.q)+'" oninput="chatFind(this.value)" placeholder="Search '+THREADS.length+' conversations" '
        + 'style="width:100%;border:1px solid var(--hair);background:var(--ground);border-radius:9px;padding:8px 10px 8px 32px;font:inherit;font-size:13px;color:var(--ink)">'
      + '</div>'

    + '</div><div class="tp-b">'+chatRailBody(cur)+'</div></aside>';
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
    + '</div></div>';
}
function chatFind(v){ CHAT_UI.q=v; const el=$('.threadpane .tp-b'); if(el) el.innerHTML = chatRailBody(threadById(CHAT_UI.tid)); }
function chatGroupBy(v){ CHAT_UI.by=v; renderChat(); }
function chatNew(){
  const id = 't-new-'+THREADS.length;
  THREADS.unshift(mkThread({id:id, title:"New conversation", group:"Today", project:"LDM Operations", when:"just now",
    context:mkCtx(["meetings","localities"],["Connect","Directory"])}));
  openThread(id);
}

/* ---------- B. conversation ---------- */
function chatCentre(t){
  const stream = t.msgs.length
    ? t.msgs.map(function(m,i){ return chatMsg(m,i,t); }).join('')
    : chatEmpty();
  return '<section class="chatpane">'
    + '<div class="chat-h">'
      + '<div style="min-width:0"><div style="font-family:var(--dsp);font-size:16px;font-weight:600;letter-spacing:-.01em" class="trunc">'+esc(t.title)+'</div>'
      + '<div class="rowflex" style="gap:7px;margin-top:4px">'
        + bdg(t.project,'mut','grid')
        + bdg('Runs as you · '+ME.scope,'ok','shield')
        + (t.running?bdg('Running','warn','clock'):'')
      + '</div></div>'
      + '<div class="sp"></div>'
      + '<button class="btn sm" onclick="chatShare()">'+I2.link+' Share</button>'
      + '<button class="btn sm'+(CHAT_UI.canvas?' pri':'')+'" onclick="chatToggleCanvas()">'+I2.grid+' Canvas</button>'
    + '</div>'
    + '<div class="chat-b" id="chatscroll"><div class="chat-w">'+stream
      + (t.tasks.length?chatTasks(t,true):'') + '</div></div>'
    + chatComposer(t) + '</section>';
}
function chatEmpty(){
  const st = ["How many LDM meetings ran in my subdivisions last quarter?",
              "Which localities haven't held a meeting in 60 days?",
              "Member growth by locality this year",
              "What columns can I use for attendance?"];
  return '<div class="empty2" style="padding:60px 20px">'+I2.spark
    + '<div class="et">Ask in your own words</div>'
    + '<div style="margin-bottom:18px">These starters are drawn from what you can actually reach. Spiff will not suggest a question your access cannot answer.</div>'
    + '<div class="chipbar" style="justify-content:center;max-width:560px;margin:0 auto">'
    + st.map(function(s){return '<button class="fchip2" onclick="chatStarter(this)">'+esc(s)+'</button>';}).join('')+'</div></div>';
}
function chatStarter(el){ const ta=$('#chat-in'); if(ta){ ta.value = el.textContent; ta.focus(); } }

function chatMsg(m,i,t){
  if(m.role==='me') return '<div class="msg me"><div class="mb">'+esc(m.text)+'</div></div>';
  const key = t.id+'-'+i;
  let h = '<div class="msg"><div class="mhead">'
    + '<span style="width:22px;height:22px;border-radius:7px;background:var(--accent);color:#fff;display:grid;place-items:center">'
    + '<span style="width:13px;height:13px;display:block">'+I2.spark+'</span></span>Spiff'
    + (m.plan?'<span style="opacity:.5">·</span> proposed a plan':'')
    + (m.trace?'<span style="opacity:.5">·</span> '+m.trace.length+' steps':'')
    + '</div>';
  if(m.tokens) h += chatTokens(m, i===1);
  if(m.plan)   h += chatPlan(m.plan);
  if(m.trace)  h += chatTrace(m.trace,key);
  h += '<div class="mb">'+m.text+'</div>';
  if(m.answer) h += chatAnswerCard(m.answer);
  if(m.result) h += chatResult(m.result);
  if(m.wall)   h += chatWall(m.wall);
  if(m.approve)h += chatApproveCard(m.approve);
  if(m.sources)h += chatProv(m);
  h += chatActs(key,m);
  return h + '</div>';
}

/* interpretation — the parsed question, colour-coded, changes ringed */
function chatTokens(m,legend){
  const chips = m.tokens.map(function(tk){
    return '<span class="tok '+tk.t+(tk.changed?' chg':'')+'"'+(tk.blocked?' style="opacity:.45;text-decoration:line-through"':'')
      +' onclick="chatEditToken(this)" title="Click to change how this was read">'+esc(tk.label)
      +(tk.blocked?' <span class="x">no access</span>':' <span class="x">&times;</span>')+'</span>';
  }).join('');
  return '<div style="background:var(--surface);border:1px solid var(--hair);border-radius:12px;padding:11px 13px;margin-bottom:13px">'
    + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:8px">Read as</div>'
    + '<div class="tokrow">'+chips+'</div>'
    + (m.diffNote?'<div style="margin-top:9px;font-size:12.5px;color:var(--accent);font-weight:600">'+esc(m.diffNote)+'</div>':'')
    + (legend?'<div class="toklegend" style="margin-top:10px"><span><i style="background:var(--measure)"></i>measure</span><span><i style="background:var(--attr)"></i>attribute</span><span><i style="background:var(--filt)"></i>filter</span><span>Correct a chip instead of retyping the question.</span></div>':'')
    + '</div>';
}
function chatEditToken(el){ toast('“'+el.textContent.replace(/×|no access/,'').trim()+'” — alternatives, remove, or insert a new term here'); }

/* plan — shown before anything runs */
function chatPlan(plan){
  return '<div style="border:1px solid var(--accent);background:var(--accent-soft);border-radius:12px;padding:14px 16px;margin-bottom:13px">'
    + '<div style="font-weight:700;font-size:13.5px;color:var(--accent);display:flex;align-items:center;gap:8px;margin-bottom:10px">'
    + '<span style="width:15px;height:15px;display:block">'+I2.list+'</span>Plan — nothing has run yet</div>'
    + '<ol style="margin:0;padding-left:20px;font-size:13.5px;line-height:1.6">'
    + plan.map(function(p){ return '<li style="margin-bottom:7px">'+esc(p.label)
        + (p.note?'<div style="font-size:12.5px;color:var(--muted);margin-top:1px">'+esc(p.note)+'</div>':'')+'</li>'; }).join('')
    + '</ol><div class="rowflex" style="margin-top:12px">'
    + '<button class="btn pri sm" onclick="toast(\'Plan approved — Spiff runs it as you\')">Run this plan</button>'
    + '<button class="btn sm" onclick="chatSteer()">Change a step</button></div></div>';
}

/* trace — collapsed by default, elapsed times visible */
function chatTrace(tr,key){
  const total = tr.reduce(function(a,s){return a+(s.ms||0);},0);
  const ico = {done:I2.check, running:CHAT_SPIN, denied:I2.lock};
  return '<details class="trace" id="tr-'+key+'"><summary>'+I2.log
    + '<span>Show work — '+tr.length+' steps, '+(total/1000).toFixed(1)+'s</span><div class="sp"></div>'
    + (tr.some(function(s){return s.state==='denied';})?bdg('1 step held','warn','lock'):'')
    + '<span style="opacity:.5">'+I2.chev+'</span></summary><div class="tb">'
    + tr.map(function(s){
        return '<div class="tstep2"><span class="ti2"'+(s.state==='denied'?' style="color:var(--warn)"':s.state==='running'?' style="color:var(--warn)"':'')+'>'+(ico[s.state]||I2.check)+'</span>'
          + '<div style="flex:1"><div><code>'+esc(s.tool)+'</code> <span class="tn2">'+esc(s.target)+'</span></div>'
          + '<div class="tn2" style="margin-top:2px">'+esc(s.detail)+'</div></div>'
          + '<span class="tn2 mono" style="font-family:var(--mono)">'+(s.state==='running'?'running':s.ms?s.ms+' ms':'held')+'</span></div>';
      }).join('')
    + '<div class="hairline" style="margin:10px 0"></div>'
    + '<div class="mutedtext" style="font-size:12px">Every step above is an audit row. It is also in the '
    + '<a style="color:var(--accent);cursor:pointer" onclick="go(\'audit\')">activity log</a>, whether or not you open this.</div>'
    + '</div></details>';
}

/* inline answer card — a real v1 answer, opened in full on demand */
function chatAnswerCard(id){
  const a = (typeof ANSWERS!=='undefined') ? ANSWERS[id] : null;
  if(!a) return '';
  return '<div style="border:1px solid var(--hair);border-radius:14px;background:var(--surface);overflow:hidden;margin:13px 0">'
    + '<div style="padding:14px 16px 0"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Answer</div>'
    + '<div style="font-family:var(--dsp);font-size:15.5px;font-weight:600;margin:4px 0 9px">'+esc(a.q)+'</div>'
    + (a.metrics?'<div class="rowflex" style="gap:22px;margin-bottom:12px">'+a.metrics.map(function(x){
        return '<div><div class="count-lg" style="font-size:24px">'+esc(x.v)+'</div>'
          + '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">'+esc(x.l)+(x.d?' · '+esc(x.d):'')+'</div></div>';
      }).join('')+'</div>':'')
    + (a.chart && typeof miniChart==='function' ? miniChart(a.chart) : '')
    + '</div>'
    + (a.table?'<div class="dtbl-wrap" style="margin-top:12px"><table class="dtbl"><thead><tr>'
        + a.table.cols.map(function(c,i){return '<th'+(i?' class="num"':'')+'>'+esc(c)+'</th>';}).join('')+'</tr></thead><tbody>'
        + a.table.rows.slice(0,4).map(function(r){return '<tr>'+r.map(function(c,i){return '<td'+(i?' class="num"':'')+'>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')
        + '</tbody></table></div>'
        + (a.table.rows.length>4?'<div class="mutedtext" style="padding:8px 16px;font-size:12px">'+(a.table.rows.length-4)+' more rows in the full answer.</div>':'')
      :'')
    + '<div class="panel-f" style="display:flex;gap:9px;align-items:center;padding:11px 16px;border-top:1px solid var(--hair2)">'
    + '<button class="btn sm pri" onclick="openFromCard(\''+id+'\')">Open full answer</button>'
    + '<button class="btn sm" onclick="saveReport(\''+id+'\')">Save to workspace</button>'
    + '<div class="sp"></div><span class="mutedtext" style="font-size:12px">'+((typeof tplApplied==='function')?'Laid out with '+esc(tplApplied(id).name)+' · ':'')+(a.snapshot ? 'snapshot · '+esc(a.snapshot) : 'today '+FX.time)+'</span></div></div>';
}

/* inline result — stat row plus a compact table */
function chatResult(r){
  let h = '<div style="border:1px solid var(--hair);border-radius:14px;background:var(--surface);overflow:hidden;margin:13px 0">';
  if(r.stats) h += '<div class="rowflex" style="gap:24px;padding:15px 16px'+(r.table?';border-bottom:1px solid var(--hair2)':'')+'">'
    + r.stats.map(function(x){ return '<div><div class="count-lg" style="font-size:23px">'+esc(x.v)+'</div>'
      + '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">'+esc(x.l)+(x.d?' · '+esc(x.d):'')+'</div></div>'; }).join('')+'</div>';
  if(r.table) h += '<div class="dtbl-wrap"><table class="dtbl"><thead><tr>'
    + r.table.cols.map(function(c,i){return '<th'+(i>1?' class="num"':'')+'>'+esc(c)+'</th>';}).join('')+'</tr></thead><tbody>'
    + r.table.rows.map(function(row){return '<tr>'+row.map(function(c,i){return '<td'+(i>1?' class="num"':'')+'>'+esc(c)+'</td>';}).join('')+'</tr>';}).join('')
    + '</tbody></table></div>';
  return h+'</div>';
}

/* the permission wall — a partial answer that names the rule */
function chatWall(w){
  return '<div class="callout warn" style="margin:13px 0;align-items:flex-start">'+I2.lock+'<div>'
    + '<div style="font-weight:700;margin-bottom:5px">Half of this answer is missing, and it is not missing by accident</div>'
    + '<div style="font-size:13.5px;line-height:1.6">Rule <code style="font-family:var(--mono)">'+esc(w.rule)+'</code> — '+esc(w.ruleName)+'. '+esc(w.says)+'</div>'
    + '<div style="font-size:13px;color:var(--muted);margin-top:7px">Blank cells above mean <b>not allowed</b>, not <b>no data</b>. '+esc(w.alt)+'</div>'
    + '<div class="rowflex" style="margin-top:11px">'
    + '<button class="btn sm pri" onclick="requestAccessModal(\''+esc(w.dataset)+'\')">Request access to '+esc(w.datasetName)+'</button>'
    + '<button class="btn sm" onclick="openDataset(\''+esc(w.dataset)+'\')">See what it holds</button>'
    + '<span class="mutedtext" style="font-size:12px">Approver: '+esc(w.approver)+'</span></div></div></div>';
}

/* tool approval — the actual arguments, readably */
function chatApproveCard(a){
  if(a.decided) return '<div class="callout '+(a.decided==='deny'?'crit':'ok')+'" style="margin:13px 0">'
    + (a.decided==='deny'?I2.x:I2.check)+'<div><b>'+(a.decided==='deny'?'Denied':a.decided==='always'?'Allowed — and always allowed from now on':'Allowed once')+'.</b> '
    + esc(a.tool)+' on '+esc(a.target)+'. Recorded in the activity log against '+esc(a.runAs)+'.</div></div>';
  const rows = Object.keys(a.args).map(function(k){
    return '<div style="display:grid;grid-template-columns:150px 1fr;gap:10px"><span style="color:var(--muted)">'+esc(k)+'</span><span>'+esc(a.args[k])+'</span></div>'; }).join('');
  return '<div class="approve">'
    + '<div class="ah">'+I2.warn+'Spiff wants to publish. Read the arguments before you decide.</div>'
    + '<div style="font-size:13.5px;margin-bottom:10px">'+esc(a.intent)+'</div>'
    + '<div class="args">'+rows+'</div>'
    + '<div class="rowflex">'
      + '<button class="btn pri sm" onclick="chatDecide(\'once\')">Allow once</button>'
      + '<button class="btn sm" onclick="chatDecide(\'always\')">Always allow '+esc(a.tool)+'</button>'
      + '<button class="btn sm danger" onclick="chatDecide(\'deny\')">Deny</button>'
      + '<div class="sp"></div><span class="mutedtext" style="font-size:12px">Runs as '+esc(a.runAs)+'</span></div>'
    + (a.note?'<div class="mutedtext" style="font-size:12px;margin-top:9px">'+esc(a.note)+'</div>':'')+'</div>';
}
function chatDecide(kind){
  const t = threadById(CHAT_UI.tid);
  t.msgs.forEach(function(m){ if(m.approve && !m.approve.decided) m.approve.decided = kind; });
  if(kind!=='deny'){
    t.tasks.forEach(function(k){ if(k.state==='pending') k.state='done'; });
    toast(kind==='always' ? 'Allowed. library.publish will not ask again in this conversation.' : 'Published. Every recipient gets their own re-run, scoped to them.');
  } else {
    t.tasks.forEach(function(k){ if(k.state==='pending') k.state='denied'; });
    toast('Denied. The pack stays in your workspace and nobody else can see it.');
  }
  renderChat();
}

/* provenance + scope, the two lines that make an answer accountable */
function chatProv(m){
  return '<div style="border-top:1px solid var(--hair2);margin-top:13px;padding-top:11px;font-size:12.5px;color:var(--muted);line-height:1.65">'
    + '<div>' + I2.db.replace('<svg','<svg style="width:13px;height:13px;vertical-align:-2px;margin-right:5px"')
    + 'Sourced from ' + m.sources.map(function(s){
        const d = (typeof ds==='function') ? ds(s.dataset) : null;
        return '<a style="color:var(--accent);cursor:pointer;font-weight:600" onclick="openDataset(\''+esc(s.dataset)+'\')">'+esc(d?d.name:s.dataset)+'</a>'
             + ' <span style="opacity:.8">('+esc(s.rows)+(s.suppressed && s.suppressed!=='none'?', withheld: '+esc(s.suppressed):'')+')</span>'; }).join(' · ')
    + '</div>'
    + (m.confidence?'<div style="margin-top:4px">'+I2.info.replace('<svg','<svg style="width:13px;height:13px;vertical-align:-2px;margin-right:5px"')+'Confidence: '+esc(m.confidence)+'</div>':'')
    + (m.scope?'<div style="margin-top:4px;color:var(--accent);font-weight:600">'+I2.shield.replace('<svg','<svg style="width:13px;height:13px;vertical-align:-2px;margin-right:5px"')+esc(m.scope)+'</div>':'')
    + '</div>';
}

/* message actions */
function chatActs(key,m){
  return '<div class="ctools" style="margin-top:11px">'
    + '<button class="ctool" onclick="toast(\'Answer copied — the numbers travel, your access does not\')">'+I2.copy+' Copy</button>'
    + '<button class="ctool" onclick="toast(\'Saved to My workspace\')">'+I2.star+' Save</button>'
    + '<button class="ctool" onclick="chatShare()">'+I2.link+' Share</button>'
    + '<button class="ctool" onclick="toast(\'Re-running against your access as it stands right now\')">'+I2.refresh+' Retry</button>'
    + (m.trace?'<button class="ctool" onclick="chatShowWork(\''+key+'\')">'+I2.log+' Show work</button>':'')
    + '<div class="sp"></div>'
    + '<button class="ctool'+(m.feedback==='up'?' on':'')+'" onclick="chatVote(this,\'up\')" title="Useful">'+CHAT_UP+'</button>'
    + '<button class="ctool'+(m.feedback==='down'?' on':'')+'" onclick="chatVote(this,\'down\')" title="Wrong">'+CHAT_DOWN+'</button>'
    + '</div>';
}
function chatShowWork(key){ const d=document.getElementById('tr-'+key); if(d){ d.open=!d.open; if(d.open) d.scrollIntoView({block:'nearest'}); } }
function chatVote(el,dir){
  el.parentNode.querySelectorAll('.ctool.on').forEach(function(b){ if(b!==el) b.classList.remove('on'); });
  el.classList.toggle('on');
  toast(dir==='up' ? 'Noted. This answer is now a reference for its definition.'
                   : 'Noted. Tell the steward what was wrong and it becomes a coaching note, not a silent downvote.');
}

/* task / progress list */
function chatTasks(t,inline){
  const done = t.tasks.filter(function(k){return k.state==='done';}).length;
  const rows = t.tasks.map(function(k){
    const on = k.state==='running', dn = k.state==='done', no = k.state==='denied';
    return '<div class="tstep2" style="align-items:center'+(on?';background:var(--accent-soft);border-radius:8px;padding:7px 9px;margin:0 -9px':'')+'">'
      + '<span class="ti2"'+(on?' style="color:var(--warn)"':no?' style="color:var(--crit)"':dn?'':' style="color:var(--hair)"')+'>'
      + (dn?I2.check:on?CHAT_SPIN:no?I2.x:'<span style="display:inline-block;width:11px;height:11px;border:2px solid var(--hair);border-radius:50%"></span>')+'</span>'
      + '<span style="flex:1'+(dn?';text-decoration:line-through;color:var(--muted)':'')+(on?';font-weight:700':'')+'">'
      + '<span style="font-family:var(--mono);color:var(--muted);margin-right:7px">'+k.n+'</span>'
      + esc(on ? k.activeForm : k.label)+'</span>'
      + '<span class="tn2" style="font-family:var(--mono);font-size:11px">'+(dn?'done':on?'now':no?'stopped':'waiting')+'</span></div>';
  }).join('');
  const body = rows + '<div class="hairline" style="margin:11px 0"></div>'
    + '<div class="rowflex">'
    + (t.running?'<button class="btn sm danger" onclick="chatStop()">'+I2.x+' Stop</button>':'')
    + '<button class="btn sm" onclick="chatSteer()">'+I2.pencil+' Steer</button>'
    + '<div class="sp"></div><span class="mutedtext" style="font-size:12px">'+done+' of '+t.tasks.length+' complete</span></div>';
  if(!inline) return body;
  return '<div style="margin-bottom:22px">'+panel('Progress — what Spiff will do', body,
    {icon:'list', sub:done+'/'+t.tasks.length, tight:false})+'</div>';
}
function chatStop(){
  const t = threadById(CHAT_UI.tid);
  t.running = false;
  t.tasks.forEach(function(k){ if(k.state==='running'||k.state==='pending') k.state='denied'; });
  t.msgs.forEach(function(m){ if(m.trace) m.trace.forEach(function(s){ if(s.state==='running') s.state='denied'; }); });
  toast('Stopped. Nothing was written, and the partial result stays yours alone.');
  renderChat();
}
function chatSteer(){
  openModal('<h3 style="font-family:var(--dsp);margin:0 0 6px">Steer the run</h3>'
    + '<div class="mutedtext" style="margin-bottom:14px">Add an instruction. Spiff applies it to the steps that have not run yet — finished steps are not re-done.</div>'
    + '<div class="field"><label>Instruction</label><textarea rows="3" style="width:100%;border:1px solid var(--hair);background:var(--ground);border-radius:9px;padding:9px 12px;font:inherit;font-size:14px;color:var(--ink)" '
    + 'placeholder="Skip localities with fewer than 20 members"></textarea></div>'
    + modalFoot('Cancel','Apply to remaining steps','closeModal();toast(\'Applied to the remaining steps\')'), 520);
}

/* ---------- composer ---------- */
function chatComposer(t){
  const modes = [['manual','Ask every step'],['auto','Ask before writes'],['skip','Never ask']];
  const dsn = CHAT_UI.scope==='auto' ? 'Spiff chooses' : ((typeof ds==='function' && ds(CHAT_UI.scope)) ? ds(CHAT_UI.scope).name : CHAT_UI.scope);
  return '<div class="composer2"><div class="cw">'
    + (CHAT_UI.mode==='skip'?'<div class="callout crit" style="margin-bottom:10px;padding:9px 13px;font-size:12.5px">'+I2.warn
        +'<div>Never ask means Spiff acts without pausing — including steps that publish or write. Your name is on every one of them. A system admin can remove this option entirely.</div></div>':'')
    + '<div class="cbox">'
      + '<textarea id="chat-in" rows="1" placeholder="Ask a follow-up, or start something new."></textarea>'
      + '<div class="ctools">'
        + '<button class="ctool" onclick="chatAttach()">'+I2.plus+' Attach</button>'
        + '<button class="ctool'+(CHAT_UI.scope!=='auto'?' on':'')+'" onclick="chatScopePick()" title="Which datasets Spiff may read for this question">'+I2.db+' Datasets: '+esc(dsn)+'</button>'
        + '<span class="ctool-lbl" title="When Spiff pauses for your say-so">Pause</span><div class="seg2" title="When Spiff pauses for your say-so">'+modes.map(function(m){
            return '<button class="'+(CHAT_UI.mode===m[0]?'on':'')+'" onclick="chatMode(\''+m[0]+'\')">'+m[1]+'</button>'; }).join('')+'</div>'
        + '<button class="ctool'+(CHAT_UI.depth==='deep'?' on':'')+'" onclick="chatDepth()">'+I2.bolt+' '
          + (CHAT_UI.depth==='deep'?'Thorough answer':'Quick answer')+'</button>'
        + (t.running
            ? '<button class="csend" style="background:var(--crit)" onclick="chatStop()" title="Stop"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button>'
            : '<button class="csend" onclick="chatSend()" title="Send">'+I2.send+'</button>')
      + '</div></div>'
    + '<div class="limit">'+esc(CHAT_LIMIT)+'</div></div></div>';
}
function chatMode(m){
  CHAT_UI.mode=m;
  toast(m==='manual'?'Ask every step — Spiff pauses before each step, read or write, and shows you what it is about to do.'
       :m==='auto'?'Ask before writes — reads run on their own; anything that writes or publishes stops for you.'
       :'Never ask — nothing pauses. Your name is on every step. Use it only for a run you have already read.');
  renderChat();
}
function chatDepth(){
  CHAT_UI.depth = CHAT_UI.depth==='quick'?'deep':'quick';
  toast(CHAT_UI.depth==='deep'?'Thorough answer — Spiff tests alternative explanations and reconciles against control totals. About a minute.'
                              :'Quick answer — one pass, a few seconds.');
  renderChat();
}
function chatAttach(){
  openModal('<h3 style="font-family:var(--dsp);margin:0 0 6px">Attach a file</h3>'
    + '<div class="mutedtext" style="margin-bottom:14px">Files stay in this conversation. They are never written back to Directory, Assemble or Orbit, and they are not shared when you share the answer.</div>'
    + '<div class="dropzone" style="border:1.5px dashed var(--hair);border-radius:12px;padding:28px;text-align:center;color:var(--muted)">'
    + I2.file+'<div style="margin-top:8px">Drop a spreadsheet or a previous pack to copy its shape</div></div>'
    + modalFoot('Cancel','Attach','closeModal();toast(\'Attached to this conversation only\')'), 500);
}
function chatSend(){
  const ta = $('#chat-in'); if(!ta) return;
  const v = (ta.value||'').trim();
  if(!v){ toast('Type a question first'); return; }
  const t = threadById(CHAT_UI.tid);
  const prev = t.msgs.filter(function(m){return m.role==='spiff' && m.tokens;}).pop();
  if(t.title==='New conversation') t.title = v.slice(0,58);
  t.msgs.push({role:'me', text:v});
  t.msgs.push({role:'spiff',
    text:'Here is how I read that. Correct a chip if I have it wrong — it is cheaper than retyping the question, and I will remember the correction for the rest of this conversation.',
    tokens: chatGuess(v, prev),
    plan:[
      {label:'Resolve the terms above to certified datasets', note:'Only verified datasets. Draft ones are named as draft when I use them.'},
      {label:'Re-check your access at run time', note:'Rule r-locality-scope · 12 of 312 localities · checked now, not when this conversation started'},
      {label:'Run the query and reconcile against the control total', note:'If they disagree I stop and say so rather than showing you a number I cannot defend'},
      {label:'Apply suppression before anything renders', note:'Anything under five members is withheld and counted in the totals only'}
    ],
    scope:'Your view · 12 of 312 localities · nothing has run yet'});
  renderChat();
  toast('Read as ' + t.msgs[t.msgs.length-1].tokens.map(function(k){return k.label;}).join(' · '));
}
function chatGuess(v,prev){
  const s = v.toLowerCase(), out = [];
  const M = [['attendance','Attendance rate'],['meeting','Meetings'],['growth','Net movement'],['member','Members'],
             ['spend','Spend'],['cost','Spend'],['booking','Bookings'],['travel','Bookings'],['registration','Registrations'],['no-show','No-show rate']];
  const A = [['locality','by Locality'],['locality','by Locality'],['localities','by Locality'],['subdivision','by Subdivision'],
             ['family','by Family'],['families','by Family'],['event','by Event'],['month','by Month'],['type','by Type']];
  const F = [['last quarter','Last quarter · Jul–Sep 2026'],['this quarter','Q3 2026'],['this year','YTD 2026'],
             ['last year','2025'],['last month','Aug 2026'],['60 day','Over 60 days'],['october','October 2026'],['september','September 2026']];
  let m=null,a=null,f=null;
  M.forEach(function(p){ if(!m && s.indexOf(p[0])>=0) m=p[1]; });
  A.forEach(function(p){ if(!a && s.indexOf(p[0])>=0) a=p[1]; });
  F.forEach(function(p){ if(!f && s.indexOf(p[0])>=0) f=p[1]; });
  out.push({t:'m',label:m||'Meetings'});
  out.push({t:'a',label:a||'by Locality'});
  out.push({t:'f',label:f||'Last 90 days'});
  out.push({t:'f',label:'My areas'});
  if(prev){
    const had = prev.tokens.map(function(k){return k.label;});
    out.forEach(function(k){ if(had.indexOf(k.label)<0) k.changed = true; });
  }
  return out;
}

/* skills palette */
function chatUseSkill(cmd){
  closeModal();
  const ta = $('#chat-in');
  if(ta){ ta.value = cmd+' '; ta.focus(); }
  toast(cmd+' ready — add what you want it to run over, then send');
}

/* data scope picker */
function chatScopePick(){
  const t = threadById(CHAT_UI.tid);
  const all = (typeof DATASETS!=='undefined') ? DATASETS : [];
  const rows = all.map(function(d){
    const inScope = t.context.datasets.indexOf(d.id)>=0;
    const no = /No access|Blocked/.test(d.access||'');
    return '<div class="lrow"'+(no?' style="opacity:.5"':' onclick="chatSetScope(\''+d.id+'\')"')+'>'
      + '<div class="li">'+(no?I2.lock:I2.db)+'</div><div class="lm"><div class="lt">'+esc(d.name)
      + (inScope?bdg('In this conversation','ok','check'):'')+'</div>'
      + '<div class="ls">'+esc(d.access||'')+' · '+esc(d.rows)+' rows</div></div>'
      + '<div class="lr">'+(typeof certBadge==='function'?certBadge(d):'')+'</div></div>'; }).join('');
  openModal('<h3 style="font-family:var(--dsp);margin:0 0 4px">Data this conversation may use</h3>'
    + '<div class="mutedtext" style="margin-bottom:12px">Narrowing the scope makes answers faster and easier to defend. It never widens what you can see — that is set by your groups, not here.</div>'
    + '<div class="pickcard'+(CHAT_UI.scope==='auto'?' on':'')+'" style="margin-bottom:10px" onclick="chatSetScope(\'auto\')">'
    + '<div class="pi">'+I2.spark+'</div><div><div class="pn2">Auto</div><div class="pd2">Spiff picks the certified dataset that fits the question and names it in the answer.</div></div></div>'
    + '<div style="max-height:44vh;overflow:auto;border:1px solid var(--hair);border-radius:12px">'+rows+'</div>'
    + modalFoot('Close'), 640);
}
function chatSetScope(id){ CHAT_UI.scope=id; closeModal(); renderChat();
  toast(id==='auto' ? 'Auto — Spiff chooses and names the dataset' : 'Scoped to '+((typeof ds==='function'&&ds(id))?ds(id).name:id)); }

/* share — the governance promise, stated */
function chatShare(){
  const t = threadById(CHAT_UI.tid);
  openModal('<h3 style="font-family:var(--dsp);margin:0 0 4px">Share this conversation</h3>'
    + '<div class="mutedtext" style="margin-bottom:14px">'+esc(t.title)+'</div>'
    + callout('ok','<b>Recipients see this re-run against their own permissions.</b> They get the question, the interpretation and the plan. The numbers are computed again for them — a coordinator in the Northern Cluster opens this and sees their four areas, not yours. Sharing organises, it never widens access.','shield')
    + '<div class="field" style="margin-top:14px"><label>Who</label><select><option>LDM Coordinators — 34 people</option><option>Southern Cluster — 88 people</option><option>Reneilwe Dlomo only</option><option>Anyone with the link, inside UBT</option></select></div>'
    + '<div class="field"><label>Preview what someone else would get</label><select id="chat-simpick">'
    + PEOPLE.slice(0,8).map(function(p){return '<option value="'+esc(p.name)+'">'+esc(p.name)+' — '+esc(p.title)+'</option>';}).join('')
    + '</select></div>'
    + '<div class="rowflex"><button class="btn sm" onclick="startSim($(\'#chat-simpick\').value);closeModal()">'+I2.eye+' Preview as them</button></div>'
    + modalFoot('Cancel','Share &amp; copy link','closeModal();toast(\'Link copied. Each recipient\\\'s copy runs as them.\')'), 560);
}

/* ---------- C. canvas ---------- */
function chatToggleCanvas(){ CHAT_UI.canvas = !CHAT_UI.canvas; renderChat(); }
function chatCanvasTab(tab){ CHAT_UI.ctab = tab;
  document.querySelectorAll('[data-tabs="chatc"] button').forEach(function(b){ b.classList.toggle('on', b.dataset.tab===tab); });
  document.querySelectorAll('[data-pane="chatc"]').forEach(function(p){ p.classList.toggle('on', p.dataset.tabid===tab); });
}
function chatCanvas(t){
  const tabs = [['artifact','Output',t.artifacts.length||null],['context','What Spiff used',t.context.datasets.length],['tasks','Steps',t.tasks.length||null]];
  return '<aside class="canvaspane">'
    + '<div class="canvas-h"><div class="tabs" data-tabs="chatc" style="margin:0;border:none">'
    + tabs.map(function(x){ return '<button data-tab="'+x[0]+'" class="'+(CHAT_UI.ctab===x[0]?'on':'')+'" onclick="chatCanvasTab(\''+x[0]+'\')">'
        + x[1] + (x[2]!=null?'<span class="n">'+x[2]+'</span>':'') + '</button>'; }).join('')
    + '</div><div class="sp"></div><button class="btn ghost sm" onclick="chatToggleCanvas()" title="Hide canvas">'+I2.x+'</button></div>'
    + '<div class="canvas-b" style="padding-top:0">'
      + pane('chatc','artifact', chatArtifact(t), CHAT_UI.ctab==='artifact')
      + pane('chatc','context',  chatContext(t),  CHAT_UI.ctab==='context')
      + pane('chatc','tasks',    chatTaskPane(t), CHAT_UI.ctab==='tasks')
    + '</div></aside>';
}
function chatArtifact(t){
  const a = t.artifacts[0];
  if(!a) return emptyState('Nothing produced yet','An output appears here when Spiff makes something you can keep — a pack, a live answer, an automation.','file');
  const last = t.msgs.filter(function(m){return m.role==='spiff' && (m.result||m.answer);}).pop();
  return '<div class="stack">'
    + '<div><div style="font-family:var(--dsp);font-size:15.5px;font-weight:600;line-height:1.3">'+esc(a.name)+'</div>'
    + '<div class="rowflex" style="gap:7px;margin-top:7px">'+bdg(a.kind,'mut','file')+bdg(a.version,'ok')+bdg(a.rows,'mut')+'</div></div>'
    + '<div class="field" style="margin:0"><label>Version</label><select onchange="chatVersion(this)">'
      + a.versions.map(function(v){return '<option value="'+esc(v[0])+'">'+esc(v[0])+' — '+esc(v[1])+' · '+esc(v[2])+'</option>';}).join('')
    + '</select></div>'
    + '<div class="ctools" style="margin:0">'
      + '<button class="ctool" onclick="toast(\'Refreshed against your access as it stands now — 09:41\')">'+I2.refresh+' Refresh</button>'
      + '<button class="ctool" onclick="toast(\'The query behind this output, in full — every filter, every rule\')">'+I2.log+' View query</button>'
      + '<button class="ctool" onclick="toast(\'Downloaded. The file is a snapshot of your view and carries your name.\')">'+I2.down+' Download</button>'
      + '<button class="ctool" onclick="chatShare()">'+I2.link+' Share &amp; copy link</button></div>'
    + callout('ok','<b>Viewers use their own access, not yours.</b> '+esc(a.note),'shield')
    + '<div class="hairline" style="margin:2px 0"></div>'
    + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Preview</div>'
    + (last ? (last.result ? chatResult(last.result) : chatAnswerCard(last.answer))
            : '<div class="mutedtext">Still being written.</div>')
    + '<div class="mutedtext" style="font-size:12px">Updated '+esc(a.updated)+' · owned by '+esc(t.context.runAs)+'</div>'
    + '</div>';
}
function chatVersion(sel){ toast('Showing '+sel.value+'. Restoring it answers “what did we tell the coordinators last month?”'); }

function chatContext(t){
  const dsets = t.context.datasets.map(function(id){
    const d = (typeof ds==='function') ? ds(id) : null;
    const no = d && /No access|Blocked/.test(d.access||'');
    return '<div class="lrow" onclick="openDataset(\''+esc(id)+'\')">'
      + '<div class="li"'+(no?' style="background:var(--warn-soft);color:var(--warn)"':'')+'>'+(no?I2.lock:I2.db)+'</div>'
      + '<div class="lm"><div class="lt">'+esc(d?d.name:id)+'</div><div class="ls">'+esc(d?d.access:'')+'</div></div></div>'; }).join('');
  const conns = CHAT_CONNECTORS.map(function(c){
    const cl = c.state==='active'?'ok':c.state==='degraded'?'warn':'crit';
    return '<div class="lrow" onclick="openConnector(\''+esc(String(c.name).toLowerCase().replace(/[^a-z0-9]+/g,'-'))+'\')">'
      + '<div class="li">'+I2.plug+'</div><div class="lm"><div class="lt">'+esc(c.name)+'</div><div class="ls">'+esc(c.kind)+'</div></div>'
      + '<div class="lr">'+bdg(c.state,cl)+'</div></div>'; }).join('');
  const files = t.context.files.length
    ? t.context.files.map(function(f){ return '<div class="lrow"><div class="li">'+I2.file+'</div><div class="lm">'
        + '<div class="lt">'+esc(f.name)+'</div><div class="ls">'+esc(f.size)+' · '+esc(f.when)+(f.note?' · '+esc(f.note):'')+'</div></div></div>'; }).join('')
    : '<div class="mutedtext" style="padding:13px 16px">Nothing uploaded to this conversation.</div>';
  return '<div class="stack">'
    + callout('info','This tab answers <b>what Spiff can reach</b> in this conversation. What it actually did is a different question — that is in <b>Show work</b> on each answer, and in the activity log.','info')
    + panel('Identity — everything runs as', personChip(t.context.runAs, t.context.identity)
        + '<div class="mutedtext" style="font-size:12.5px;margin-top:9px">Re-checked at the start of every run, not cached from when this conversation opened. If your groups change today, the next answer changes with them.</div>'
        + '<div class="rowflex" style="margin-top:10px"><button class="btn sm" onclick="go(\'myaccess\')">See my data access</button></div>', {icon:'shield'})
    + panel('Datasets in scope', dsets, {icon:'db', sub:t.context.datasets.length+'', tight:true,
        foot:'<button class="btn sm" onclick="chatScopePick()">Change scope</button>'})
    + panel('Connectors live right now', conns, {icon:'plug', tight:true,
        foot:'<span class="mutedtext" style="font-size:12px">Only what is live for you. Installed-but-unreachable connectors are not listed — an empty row would be more honest than a hopeful one.</span>'})
    + panel('Files in this conversation', files, {icon:'file', tight:true})
    + panel('Project instructions', '<div class="defblock" style="font-size:13px;line-height:1.6">'+esc(t.context.memory)+'</div>'
        + '<div class="mutedtext" style="font-size:12px;margin-top:9px">Written by a steward and strictly enforced. This is not something Spiff learned — it is something someone signed.</div>', {icon:'book'})
    + '</div>';
}
function chatTaskPane(t){
  if(!t.tasks.length) return emptyState('No plan on this one','Short questions do not get a task list. Spiff builds one when a request needs three or more distinct steps.','list');
  return '<div class="stack">'
    + callout('info','This tab answers <b>what Spiff will do</b>. You can read it before it runs, and stop it part way.','list')
    + panel('Plan', chatTasks(t,false), {icon:'list'})
    + '</div>';
}
</script>
