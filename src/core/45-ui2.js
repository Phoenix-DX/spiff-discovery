<script>
/* =====================================================================
   SPIFF v2 — shared UI kit + router extension
   Loaded AFTER the v1 app script, so $ / esc / toast / ICON / go all exist.
   ===================================================================== */

/* ---------- extra icons ---------- */
const I2 = {
  shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3.6V12c0 4.6-3.3 8.3-8 9-4.7-.7-8-4.4-8-9V6.6z"/><path d="M9.2 12.2l2 2 3.6-4"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>',
  unlock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 017.5-2"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  eyeoff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.9 17.9A10.6 10.6 0 0112 19c-7 0-11-7-11-7a19 19 0 015.1-5.9M9.9 4.2A10.9 10.9 0 0112 4c7 0 11 7 11 7a19 19 0 01-2.2 3.2M1 1l22 22"/></svg>',
  db:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12.5l5 5L20 6.5"/></svg>',
  x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4l9.5 16h-19z"/><path d="M12 10v4M12 17.2v.1"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8v.1"/></svg>',
  pencil:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20h4L20 8l-4-4L4 16z"/></svg>',
  archive:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8M10 12h4"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M15 11a3 3 0 100-6M3 20c0-2.8 2.7-5 6-5s6 2.2 6 5M15 15c2.8 0 6 1.5 6 4"/></svg>',
  plug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 7V5a3 3 0 016 0v2"/><rect x="4" y="7" width="16" height="6" rx="2"/><path d="M12 13v4M9 21h6"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/></svg>',
  log:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h5M9 8h3"/></svg>',
  spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/></svg>',
  flow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M10 6h4a3 3 0 013 3v5"/></svg>',
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v13M6.5 11.5L12 17l5.5-5.5M5 20h14"/></svg>',
  filter:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>',
  link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.5.5l2-2A5 5 0 1012.5 4.5l-1.2 1.2"/><path d="M14 11a5 5 0 00-7.5-.5l-2 2A5 5 0 1011.5 19.5l1.2-1.2"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M7 5l12 7-12 7z"/></svg>',
  star:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3.5l2.6 5.7 6.2.7-4.6 4.2 1.3 6.1L12 17.1l-5.5 3.1 1.3-6.1L3.2 9.9l6.2-.7z"/></svg>',
  file:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></svg>',
  copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8 8 0 10-1.6 5.6"/><path d="M20 5v6h-6"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12z"/></svg>',
  msg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-6.4A8 8 0 1121 12z"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.1M3.5 12h.1M3.5 18h.1"/></svg>',
  send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5L12 3l9 7.5V21H3z"/><path d="M9 21v-7h6v7"/></svg>',
  trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  more:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M6 7l1 13a2 2 0 002 2h6a2 2 0 002-2l1-13"/></svg>'
};

/* ---------- tiny html helpers ---------- */
const esc2 = s => esc(s==null?"":s);
function cls(...a){return a.filter(Boolean).join(" ");}
function avatar(name,size){
  const c = avColor(name||"?"), i = initialsOf(name||"?");
  return '<div class="av2'+(size?' '+size:'')+'" style="background:'+c+'">'+esc2(i)+'</div>';
}
function personChip(name,sub){
  return '<div class="person">'+avatar(name)+'<div><div class="pn">'+esc2(name)+'</div>'+(sub?'<div class="pr">'+esc2(sub)+'</div>':'')+'</div></div>';
}
function bdg(text,c,icon){return '<span class="bdg '+(c||'mut')+'">'+(icon?I2[icon]||'':'')+esc2(text)+'</span>';}
function certBadge(d){const c=CERT[d.cert]||CERT.draft;return '<span class="bdg '+c.cls+'" title="'+esc2(c.note)+'">'+(I2[c.ico]||'')+esc2(c.label)+'</span>';}
function sensBadge(s){const c=(SENS[s]||{}).cls||'mut';return '<span class="bdg '+c+'">'+esc2(s)+'</span>';}
function freshBadge(f){const c=FRESH[f]||FRESH['n/a'];return '<span class="bdg '+c.cls+'">'+I2.clock+esc2(c.label)+'</span>';}
function meter(pct,c){return '<div class="meter '+(c||'')+'"><i style="width:'+Math.max(0,Math.min(100,pct))+'%"></i></div>';}
function ring(pct,c){return '<div class="ring '+(c||'')+'" style="--p:'+pct+'"><span>'+pct+'</span></div>';}
function scoreCls(n){return n>=95?'ok':n>=80?'':n>=60?'warn':'crit';}
function kpi(l,v,s,d){
  return '<div class="kpi"><div class="kl">'+esc2(l)+'</div><div class="kv2">'+v+'</div>'
    +(d?'<div class="kd '+(d[0]==='+'?'up':d[0]==='−'||d[0]==='-'?'down':'')+'">'+esc2(d)+'</div>':'')
    +(s?'<div class="ks">'+s+'</div>':'')+'</div>';
}
function sparkline(arr){
  if(!arr||!arr.length)return '';
  const mx=Math.max(...arr), mn=Math.min(...arr);
  return '<div class="spark">'+arr.map(v=>'<i style="height:'+(mx===mn?60:8+((v-mn)/(mx-mn))*92)+'%"></i>').join('')+'</div>';
}
function panel(title,body,opts){
  opts=opts||{};
  return '<div class="panel'+(opts.cls?' '+opts.cls:'')+'"'+(opts.id?' id="'+opts.id+'"':'')+'>'
    +(title?'<div class="panel-h">'+(opts.icon?I2[opts.icon]||'':'')+'<span>'+title+'</span>'+(opts.sub?'<span class="sub">'+opts.sub+'</span>':'')+'<div class="sp"></div>'+(opts.act||'')+'</div>':'')
    +'<div class="panel-b'+(opts.tight?' tight':'')+'">'+body+'</div>'
    +(opts.foot?'<div class="panel-f">'+opts.foot+'</div>':'')+'</div>';
}
function callout(kind,html,icon){return '<div class="callout '+kind+'">'+(I2[icon||(kind==='crit'||kind==='warn'?'warn':kind==='ok'?'shield':'info')]||'')+'<div>'+html+'</div></div>';}
function pageHead(o){
  return '<div class="v2head"><div class="ht">'
    +(o.eyebrow?'<div class="eyebrow2">'+esc2(o.eyebrow)+'</div>':'')
    +(o.back?'<button class="backlink" onclick="'+o.back+'">'+I2.back+' Back</button>':'')
    +'<h1>'+o.title+'</h1>'
    +(o.desc?'<div class="desc">'+o.desc+'</div>':'')
    +(o.badges?'<div class="rowflex" style="margin-top:11px">'+o.badges+'</div>':'')
    +'</div>'+(o.acts?'<div class="acts">'+o.acts+'</div>':'')+'</div>';
}
function tabsHTML(group,items,active){
  return '<div class="tabs" data-tabs="'+group+'">'+items.map(t=>
    '<button data-tab="'+t[0]+'" class="'+(t[0]===active?'on':'')+'" onclick="switchTab(\''+group+'\',\''+t[0]+'\')">'+esc2(t[1])+(t[2]!=null?'<span class="n">'+t[2]+'</span>':'')+'</button>').join('')+'</div>';
}
function switchTab(group,tab){
  document.querySelectorAll('[data-tabs="'+group+'"] button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  document.querySelectorAll('[data-pane="'+group+'"]').forEach(p=>p.classList.toggle('on',p.dataset.tabid===tab));
}
function pane(group,id,html,on){return '<div class="tabpane'+(on?' on':'')+'" data-pane="'+group+'" data-tabid="'+id+'">'+html+'</div>';}
function sw(on,onclick,label){return '<button class="sw'+(on?' on':'')+'" role="switch" aria-checked="'+(on?'true':'false')+'"'+(label?' aria-label="'+esc2(label)+'"':'')+' onclick="'+onclick+'"><i></i></button>';}
function tri(val,name){
  const opts=[["allow","Always allow"],["ask","Needs approval"],["block","Blocked"]];
  return '<div class="tri">'+opts.map(o=>'<button data-v="'+o[0]+'" class="'+(o[0]===val?'on':'')+'" onclick="setTri(this)">'+o[1]+'</button>').join('')+'</div>';
}
function setTri(btn){btn.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===btn));toast('Permission set to “'+btn.textContent+'”');}
function emptyState(title,sub,icon){
  return '<div class="empty2">'+(I2[icon||'search']||'')+'<div class="et">'+esc2(title)+'</div><div>'+esc2(sub||'')+'</div></div>';
}
function openModal(html,wide){
  const m=$('#modal');
  m.innerHTML='<div class="modal"'+(wide?' style="width:'+wide+'px;max-width:96vw"':'')+'>'+html+'</div>';
  m.classList.add('on');
  return m;
}
/* The one confirm dialog. Title is a question naming the thing; body is one
   sentence of consequence in the present tense; the button is the verb —
   Delete, Remove, Retire, Withdraw, Revoke — never OK. Every destructive
   action in the product goes through here. */
let CONFIRM_FN = null;
function confirmAsk(o){
  CONFIRM_FN = o.onConfirm;
  openModal('<h3>'+o.title+'</h3>'
    + (o.sub ? '<div class="msub">'+o.sub+'</div>' : '')
    + (o.body ? callout(o.tone||'warn', o.body) : '')
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">'+esc2(o.cancel||'Cancel')+'</button>'
    + '<button class="btn pri'+(o.safe?'':' danger')+'" onclick="confirmGo()">'+esc2(o.verb||'Confirm')+'</button></div>', o.width||480);
}
function confirmGo(){ const f = CONFIRM_FN; CONFIRM_FN = null; closeModal(); if(typeof f === 'function') f(); }

/* The wizard. A create that needs more than a screenful goes step by step:
   one question per step, a fixed-height body so nothing on the popup moves
   as you go, Back always present, the verb on the last step. Each step
   renders from the data collected so far and collects back into it, so
   Back never loses what was typed. */
let WIZ = null;
function wizardOpen(o){ WIZ = { o:o, step:0, data:o.data || {} }; wizardPaint(true); }
function wizardPaint(fresh){
  const w = WIZ, o = w.o, n = o.steps.length, st = o.steps[w.step];
  const steps = o.steps.map(function(s, i){
    return '<span class="wz-dot'+(i < w.step ? ' done' : i === w.step ? ' on' : '')+'">'+(i < w.step ? I2.check : (i+1))+'</span>'
      + '<span class="wz-lbl'+(i === w.step ? ' on' : '')+'">'+esc2(s.name)+'</span>';
  }).join('<span class="wz-sep"></span>');
  const html = '<h3>'+o.title+'</h3>'
    + (o.intro ? '<div class="msub">'+o.intro+'</div>' : '')
    + '<div class="wz-steps">'+steps+'</div>'
    + '<div class="wz-body" id="wz-body">'+st.render(w.data)+'</div>'
    + '<div class="mfoot wz-foot"><span class="wz-count">Step '+(w.step+1)+' of '+n+'</span><div class="sp"></div>'
    + '<button class="btn" onclick="closeModal()">Cancel</button>'
    + '<button class="btn"'+(w.step === 0 ? ' disabled' : '')+' onclick="wizardBack()">'+I2.back+' Back</button>'
    + '<button class="btn pri" onclick="wizardNext()">'+(w.step === n-1 ? esc2(o.finish || 'Create') : 'Next '+I2.chev)+'</button></div>';
  const box = $('#modal .modal');
  if(!fresh && box && $('#modal').classList.contains('on')) box.innerHTML = html;
  else openModal(html, o.width || 560);
  const first = $('#wz-body input:not([type=checkbox]), #wz-body select, #wz-body textarea'); if(first) first.focus();
}
function wizardCollect(){ const st = WIZ.o.steps[WIZ.step]; if(st.collect) Object.assign(WIZ.data, st.collect(WIZ.data)); }
function wizardNext(){
  const st = WIZ.o.steps[WIZ.step]; wizardCollect();
  if(st.validate){ const err = st.validate(WIZ.data); if(err){ toast(err); return; } }
  if(WIZ.step < WIZ.o.steps.length - 1){ WIZ.step++; wizardPaint(); }
  else { const w = WIZ; WIZ = null; closeModal(); w.o.onFinish(w.data); }
}
function wizardBack(){ if(WIZ && WIZ.step > 0){ wizardCollect(); WIZ.step--; wizardPaint(); } }

function modalFoot(cancel,confirmLabel,onConfirm){
  return '<div class="mfoot"><button class="btn" onclick="closeModal()">'+(cancel||'Cancel')+'</button>'
    +(confirmLabel?'<button class="btn pri" onclick="'+onConfirm+'">'+confirmLabel+'</button>':'')+'</div>';
}
/* =====================================================================
   Scale helpers. Added 3 Sep 2026 after the usability-at-scale review.
   Every list surface in the product will meet volumes the fixtures never
   showed; these are the three controls that stop that hurting.
   ===================================================================== */

/* A pager that shows first, last and the current page ± 2, instead of one
   button per page. A catalogue of 3 000 items produced a pager taller than
   the content it paged. `fn` is the name of the go-to-page function. */
function pagerHTML(page, pages, fn){
  if(pages <= 1) return '';
  const btn = (i) => '<button class="btn sm'+(i===page?' pri':'')+'" onclick="'+fn+'('+i+')">'+(i+1)+'</button>';
  const gap = '<span class="pagegap">…</span>';
  const win = [];
  for(let i = Math.max(0, page-2); i <= Math.min(pages-1, page+2); i++) win.push(i);
  let nums = '';
  if(win[0] > 0){ nums += btn(0); if(win[0] > 1) nums += gap; }
  win.forEach(i => { nums += btn(i); });
  if(win[win.length-1] < pages-1){ if(win[win.length-1] < pages-2) nums += gap; nums += btn(pages-1); }
  return '<div class="rowflex pager" style="justify-content:center;gap:6px;margin-top:16px;flex-wrap:wrap">'
    + '<button class="btn sm"'+(page<=0?' disabled':'')+' onclick="'+fn+'('+(page-1)+')">'+I2.back+' Prev</button>'
    + nums
    + '<button class="btn sm"'+(page>=pages-1?' disabled':'')+' onclick="'+fn+'('+(page+1)+')">Next '+I2.chev+'</button>'
    + '<span class="mutedtext" style="margin-left:8px;font-size:12.5px">Page '+(page+1)+' of '+fmt(pages)+'</span>'
    + '</div>';
}

/* A picker that types to filter. A native select is fine at 20 options and a
   scroll at 300, so anything longer becomes an input backed by a datalist —
   native filtering, native keyboard handling, no bespoke combobox. `onpick`
   is called with the chosen value, and only when it matches an option or is
   the reset value. */
let PICK_SEQ = 0;
function pickList(label, options, current, onpick, opts){
  opts = opts || {};
  const all = opts.allLabel || "All";
  const list = options.map(o => (typeof o === "string" ? [o,o] : o));
  const id = "pick-" + (++PICK_SEQ);
  /* short lists stay a plain select — a datalist would be worse, not better */
  if(list.length <= (opts.threshold || 20)){
    return '<label class="fieldlbl">'+esc2(label)+'</label>'
      + '<select class="pickinput" onchange="'+onpick+'(this.value)">'
      + (opts.noAll ? '' : '<option value="all"'+(current==="all"?' selected':'')+'>'+esc2(all)+'</option>')
      + list.map(o => '<option value="'+esc2(o[0])+'"'+(o[0]===current?' selected':'')+'>'+esc2(o[1])+'</option>').join('')
      + '</select>';
  }
  const cur = current === "all" ? "" : current;
  return '<label class="fieldlbl">'+esc2(label)
    + ' <span class="mutedtext" style="font-weight:400;text-transform:none;letter-spacing:0">'+fmt(list.length)+' — type to filter</span></label>'
    + '<div class="pickwrap">'
    +   '<input class="pickinput" list="'+id+'" value="'+esc2(cur)+'" placeholder="'+esc2(all)+'"'
    +     ' oninput="pickPicked(this,\''+onpick+'\')" onchange="pickPicked(this,\''+onpick+'\')">'
    +   '<datalist id="'+id+'">'+list.map(o => '<option value="'+esc2(o[0])+'">'+(o[1]!==o[0]?esc2(o[1]):'')+'</option>').join('')+'</datalist>'
    +   (cur ? '<button class="pickclear" title="Clear" onclick="this.previousElementSibling.previousElementSibling.value=\'\';'+onpick+'(\'all\')">×</button>' : '')
    + '</div>';
}
/* only fires on an exact match, so half-typed text never filters the list to nothing */
function pickPicked(el, fn){
  const v = (el.value||"").trim();
  const dl = document.getElementById(el.getAttribute("list"));
  if(!v) return window[fn]("all");
  if(dl && [].some.call(dl.options, o => o.value === v)) return window[fn](v);
}

/* "and 400 more" — a capped list with the overflow stated rather than drawn.
   `moreFn` is optional; when given it becomes a button that reveals the rest. */
function cappedList(items, cap, renderFn, noun, moreFn){
  const shown = items.slice(0, cap), rest = items.length - shown.length;
  let h = shown.map(renderFn).join("");
  if(rest > 0){
    h += '<div class="capmore">'
      + (moreFn ? '<button class="btn sm ghost" onclick="'+moreFn+'">Show all '+fmt(items.length)+'</button>' : '')
      + '<span class="mutedtext">and '+fmt(rest)+' more '+esc2(noun||"")+'</span></div>';
  }
  return h;
}

function relTime(s){return s;}
function fmt(n){return typeof n==='number'?n.toLocaleString('en-GB'):n;}

/* ---------- viewer simulator (the governance showpiece) ---------- */
let SIM = null;
function startSim(personName){
  SIM = PEOPLE.find(p=>p.name===personName) || null;
  $('#simbar').classList.toggle('on', !!SIM);
  if(SIM){
    $('#simbar-txt').innerHTML = 'Simulating <b>'+esc2(SIM.name)+'</b> — '+esc2(SIM.title)+' · '+esc2(SIM.locality)+'. Everything on screen is scoped to them, not to you.';
    $('#userchip').querySelector('.av').textContent = SIM.initials;
    $('#userchip').querySelector('.who').textContent = SIM.name;
    $('#userchip').querySelector('.scope').textContent = 'Simulated · '+SIM.locality;
    $('#topscope').innerHTML = I2.eye+' Scoped to '+esc2(SIM.name.split(' ')[0]);
    toast('Now simulating '+SIM.name+' — nothing is shared, this is a preview');
  }
  refreshView();
}
function stopSim(){
  SIM=null;$('#simbar').classList.remove('on');
  $('#userchip').querySelector('.av').textContent = ME.initials;
  $('#userchip').querySelector('.who').textContent = ME.name;
  $('#userchip').querySelector('.scope').textContent = 'Your view · '+ME.scope;
  $('#topscope').innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3.6V12c0 4.6-3.3 8.3-8 9-4.7-.7-8-4.4-8-9V6.6z"/></svg> Your view';
  toast('Back to your own view');
  refreshView();
}
const viewer = () => SIM || ME;

/* ---------- router extension ---------- */
const V2ROUTES = {};              /* view id -> render(arg) */
const CRUMB2 = {
  home:"Home", chat:"Chats", catalog:"Data catalogue", dataset:"Dataset",
  rules:"Business rules", people:"Access administration", person:"Person",
  myaccess:"My access", mcp:"Connectors", connector:"Connector",
  audit:"Activity log", glossary:"Definitions", sim:"Viewer simulator",
  sources:"Sources", source:"Source", understand:"Understanding run"
};
Object.assign(CRUMB, CRUMB2);

let CURRENT_VIEW='ask', CURRENT_ARG=null;
const _v1go = window.go;
window.go = function(view, arg){
  CURRENT_VIEW=view; CURRENT_ARG=arg;
  const full = view==='chat';
  $('.scroll').classList.toggle('noscroll', full);
  document.body.classList.toggle('hide-chandle', full);
  if(V2ROUTES[view]){
    showOnly(view); navActive(view);
    $('#crumb').innerHTML='<b>'+(CRUMB[view]||view)+'</b>';
    try{ V2ROUTES[view](arg); }catch(e){ console.error('view '+view+' failed',e); $('#view-'+view).innerHTML=emptyState('This screen hit a snag',''+e.message,'warn'); }
    return;
  }
  return _v1go(view);
};
function refreshView(){ if(V2ROUTES[CURRENT_VIEW]) go(CURRENT_VIEW, CURRENT_ARG); }
function crumbTrail(parts){
  $('#crumb').innerHTML = parts.map((p,i)=> i===parts.length-1
    ? '<b>'+p[0]+'</b>'
    : '<span style="opacity:.6;cursor:pointer" onclick="'+p[1]+'">'+p[0]+'</span> <span style="opacity:.35">/</span> ').join('');
}
</script>
