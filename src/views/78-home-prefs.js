<script>
/* =====================================================================
   Home — the watch card you configure, and the page you arrange
   15 Sep 2026. Two gaps from Thato's read of Home:
   · the watchlist had cards but nowhere a card was created — now any
     answer's Keep menu offers "Watch on Home", and a config tile asks
     what the card should show (title, which number, mini graph or trend
     line or number or timeline) and whether it carries a threshold;
   · Home felt heavy — now the person decides which sections show, and
     the choice is kept in their browser.
   ===================================================================== */

/* ---------- what each watched card shows ---------- */
const WATCH_CFG = {
  oak_trend: { title:"Attendance · Oakridge", visual:"spark", metric:0, threshold:{on:true, dir:"below", value:70, who:"me"} }
};
const WATCH_VISUALS = [
  {id:"spark",    label:"Mini graph",  desc:"Twelve bars, the latest one highlighted."},
  {id:"line",     label:"Trend line",  desc:"The same twelve points as a line."},
  {id:"number",   label:"Number only", desc:"The figure and its delta, nothing else."},
  {id:"timeline", label:"Timeline",    desc:"Recent moments along a line — for answers that have dates."}
];
function watchNum(v){ const n = parseFloat(String(v).replace(/[^0-9.\-]/g,"")); return isNaN(n) ? null : n; }
function watchThresholdState(w){
  const t = w.threshold; if(!t || !t.on) return null;
  const n = watchNum(w.v); if(n===null) return {cls:"mut", text:"threshold set"};
  const hit = t.dir==="below" ? n < t.value : n > t.value;
  return { hit:hit, cls: hit ? "crit" : "ok", text: (hit ? "Breached: " : "Within: ") + (t.dir==="below" ? "below " : "above ") + t.value + (String(w.v).indexOf("%")>=0 ? "%" : "") + (hit ? " — you were told" : "") };
}
/* the visuals */
function watchLine(arr){
  if(!arr||arr.length<2) return '';
  const mx=Math.max.apply(null,arr), mn=Math.min.apply(null,arr), w=120, h=26;
  const pts = arr.map(function(v,i){ return (i/(arr.length-1)*w).toFixed(1)+","+(h-((mx===mn?.5:(v-mn)/(mx-mn))*(h-4))-2).toFixed(1); });
  return '<svg class="wline" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><polyline points="'+pts.join(" ")+'"/><circle cx="'+pts[pts.length-1].split(",")[0]+'" cy="'+pts[pts.length-1].split(",")[1]+'" r="2.5"/></svg>';
}
function watchTimeline(id){
  const a = ANSWERS[id]||{}, ev = (a.timeline||[]).slice(0,5);
  if(!ev.length) return watchLine(homeSpark(id));
  return '<div class="wtl">'+ev.map(function(e){ return '<span class="wtl-i" title="'+esc(e[3]||'')+'"><i style="background:'+esc(e[2]||'var(--accent)')+'"></i><small>'+esc(e[0])+'</small></span>'; }).join('')+'</div>';
}
function watchVisualHTML(w){
  const v = w.visual || "spark";
  if(v==="number") return '';
  if(v==="line") return watchLine(w.sp);
  if(v==="timeline") return watchTimeline(w.id);
  return sparkline(w.sp);
}

/* ---------- the watchlist, with the person's configuration applied ---------- */
const homeWatchBase = homeWatch;   /* assigned, not declared, so this line still sees the original */
homeWatch = function(){
  const list = homeWatchBase();
  list.forEach(function(w){
    const c = WATCH_CFG[w.id]; if(!c) return;
    if(c.title) w.l = c.title;
    const a = ANSWERS[w.id]; if(a && a.metrics && a.metrics[c.metric||0] && HOME_EXTRA.indexOf(w.id)>=0){ const m=a.metrics[c.metric]; w.v=m.v; w.d=m.d||""; }
    w.visual = c.visual || "spark"; w.threshold = c.threshold || null;
  });
  return list;
}
function homeTile(w){
  const th = watchThresholdState(w);
  const sub = watchVisualHTML(w)
    + (th ? '<div style="margin-top:7px"><span class="bdg '+th.cls+'">'+I2.bolt+' '+esc(th.text)+'</span></div>' : '')
    + '<div style="margin-top:7px">Ran for you at '+esc(w.at)+' today · '+esc(w.note)+'</div>';
  return '<div class="clickable wtile'+(th&&th.hit?' breached':'')+'" title="Open the answer behind this number">'
    + kebabHTML([{label:'Open the answer', icon:'file', onclick:"openFromCard('"+w.id+"')"},
                 {label:'Edit this card', icon:'pencil', onclick:"homeWatchAdd('"+w.id+"')"},
                 {label:'Stop watching', icon:'x', danger:true, onclick:"homeStopWatchAsk('"+w.id+"')"}])
    + '<div onclick="openFromCard(\''+w.id+'\')">'+kpi(w.l, esc(w.v), sub, w.d)+'</div></div>';
}

/* ---------- the config tile: Keep › Watch on Home ---------- */
let WATCH_DRAFT = null;
function homeWatchAdd(id){
  const a = ANSWERS[id]; if(!a) return;
  const existing = WATCH_CFG[id] || {};
  const metrics = a.metrics && a.metrics.length ? a.metrics : [{v:"—", l:a.q}];
  WATCH_DRAFT = { id:id, title: existing.title || metrics[existing.metric||0].l, metric: existing.metric||0, visual: existing.visual || (a.timeline ? "timeline" : "spark"),
    threshold: Object.assign({on:false, dir:"below", value: watchNum(metrics[0].v)||0, who:"me"}, existing.threshold||{}) };
  homeWatchPaint();
}
function homeWatchPaint(){
  const d = WATCH_DRAFT, a = ANSWERS[d.id], metrics = a.metrics && a.metrics.length ? a.metrics : [{v:"—", l:a.q}], m = metrics[d.metric];
  const preview = { id:d.id, l:d.title, v:m.v, d:m.d||"", sp:homeSpark(d.id), at:FX.time, note:homeScope(), visual:d.visual, threshold:d.threshold };
  const unit = String(m.v).indexOf("%")>=0 ? "%" : "";
  openModal(
      '<h3>'+(WATCH_CFG[d.id] ? 'Edit this card' : 'Watch on Home')+'</h3>'
    + '<div class="msub">A card on your Home that re-runs this answer as you every morning. Choose what it shows; the numbers come from the answer, not from here.</div>'
    + '<div class="wcfg">'
    +   '<div class="wcfg-form">'
    +     '<div class="field"><label>Card title</label><input class="txt" id="wc-title" value="'+esc(d.title)+'" oninput="WATCH_DRAFT.title=this.value;homeWatchPreview()"></div>'
    +     (metrics.length>1 ? '<div class="field"><label>Which number</label><select class="txt" onchange="WATCH_DRAFT.metric=+this.value;WATCH_DRAFT.threshold.value=watchNum(ANSWERS[WATCH_DRAFT.id].metrics[+this.value].v)||0;homeWatchPaint()">'+metrics.map(function(x,i){ return '<option value="'+i+'"'+(i===d.metric?' selected':'')+'>'+esc(x.l)+' — '+esc(x.v)+'</option>'; }).join('')+'</select></div>' : '')
    +     '<div class="field"><label>Show it as</label><div class="wcfg-vis">'+WATCH_VISUALS.filter(function(v){ return v.id!=="timeline" || a.timeline; }).map(function(v){ return '<label class="ckrow"><input type="radio" name="wc-vis" value="'+v.id+'"'+(v.id===d.visual?' checked':'')+' onchange="WATCH_DRAFT.visual=this.value;homeWatchPreview()"> <b>'+esc(v.label)+'</b> <span class="mutedtext" style="font-size:11.5px">· '+esc(v.desc)+'</span></label>'; }).join('')+'</div></div>'
    +     '<div class="field"><label>Threshold</label>'
    +       '<label class="ckrow"><input type="checkbox" id="wc-th"'+(d.threshold.on?' checked':'')+' onchange="WATCH_DRAFT.threshold.on=this.checked;homeWatchPaint()"> Tell me when this number crosses a line</label>'
    +       (d.threshold.on ? '<div class="rowflex" style="margin-top:8px;gap:8px;flex-wrap:wrap"><select class="txt" style="width:auto" onchange="WATCH_DRAFT.threshold.dir=this.value;homeWatchPreview()"><option value="below"'+(d.threshold.dir==="below"?' selected':'')+'>Falls below</option><option value="above"'+(d.threshold.dir==="above"?' selected':'')+'>Rises above</option></select>'
    +         '<input class="txt" style="width:120px" type="number" value="'+d.threshold.value+'" oninput="WATCH_DRAFT.threshold.value=+this.value;homeWatchPreview()"><span class="mutedtext">'+unit+'</span>'
    +         '<select class="txt" style="width:auto" onchange="WATCH_DRAFT.threshold.who=this.value"><option value="me"'+(d.threshold.who==="me"?' selected':'')+'>Tell me, in my Inbox</option><option value="team"'+(d.threshold.who==="team"?' selected':'')+'>Tell me and my team</option></select></div>'
    +         '<div class="wz-note">Checked each morning when the card re-runs. A notice lands in the Inbox; nothing is sent outside Spiff without an automation.</div>' : '')
    +     '</div>'
    +   '</div>'
    +   '<div class="wcfg-preview"><div class="lbl2">Preview</div><div id="wc-preview">'+homeTile(preview)+'</div><div class="mutedtext" style="font-size:12px;margin-top:8px">Re-runs as you at 06:00 · shows what you are allowed to see, never what the author saw.</div></div>'
    + '</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="homeWatchSave()">'+(WATCH_CFG[d.id]?'Save card':'Add to Home')+'</button></div>', 760);
}
function homeWatchPreview(){
  const d = WATCH_DRAFT, a = ANSWERS[d.id], metrics = a.metrics && a.metrics.length ? a.metrics : [{v:"—", l:a.q}], m = metrics[d.metric];
  const el = $('#wc-preview'); if(!el) return;
  el.innerHTML = homeTile({ id:d.id, l:d.title, v:m.v, d:m.d||"", sp:homeSpark(d.id), at:FX.time, note:homeScope(), visual:d.visual, threshold:d.threshold });
}
function homeWatchSave(){
  const d = WATCH_DRAFT; if(!d) return;
  WATCH_CFG[d.id] = { title:d.title, metric:d.metric, visual:d.visual, threshold:d.threshold.on ? d.threshold : null };
  const base = ["ldm","oak_trend","growth","orbit_travel"];
  if(base.indexOf(d.id)<0 && HOME_EXTRA.indexOf(d.id)<0) HOME_EXTRA.push(d.id);
  HOME_HIDDEN = HOME_HIDDEN.filter(function(x){ return x!==d.id; });
  closeModal();
  toast(d.threshold.on ? 'On your Home — you will be told when it crosses '+d.threshold.value : 'On your Home — it re-runs as you every morning');
  if(typeof AUDIT!=="undefined" && typeof AUDEV==="function" && typeof UND_SEQ!=="undefined")
    AUDIT.unshift(AUDEV(++UND_SEQ, fxLocalISO(new Date()), "today "+fxTime(new Date()), "q.saved", ME.full, "LDM Coordinator — Cape Localities", tplCtx(d.id).datasets[0]||null, ANSWERS[d.id].q, "Watched on Home as “"+d.title+"”"+(d.threshold.on?" with a threshold at "+d.threshold.value:"")+".", {outcome:"ok", ms:30}));
  if($('#view-home') && $('#view-home').classList.contains('on')) renderHome();
}

/* ---------- Home preferences: which sections show ---------- */
const HOME_SECTIONS = [
  {id:"ask",        label:"Ask box",                   desc:"The question box and suggested questions.", core:true},
  {id:"promises",   label:"Ask · Find · Trust",        desc:"The three cards that say what Spiff is for."},
  {id:"needs",      label:"Needs you",                 desc:"The five decisions due soonest, from your Inbox."},
  {id:"watch",      label:"Your watchlist",            desc:"The cards you follow, re-run for you each morning."},
  {id:"recent",     label:"Continue where you left off", desc:"Your recent answers."},
  {id:"trend",      label:"What people are asking",    desc:"Questions trending across the division."},
  {id:"datasets",   label:"Datasets worth knowing",    desc:"Three datasets picked for you."},
  {id:"governance", label:"How Spiff keeps this honest", desc:"The three rules, spelled out."}
];
const HOME_PRESETS = {
  everything: {label:"Everything", on:HOME_SECTIONS.map(function(s){ return s.id; })},
  lean:       {label:"Lean — ask, decisions, watchlist", on:["ask","needs","watch"]},
  numbers:    {label:"Just my numbers", on:["ask","watch"]}
};
function homePrefs(){
  try { const raw = localStorage.getItem('spiff.home'); if(raw){ const p = JSON.parse(raw); if(p && Array.isArray(p.on)) return p; } } catch(e){}
  return { on: HOME_PRESETS.everything.on.slice() };
}
function homePrefsSave(p){ try { localStorage.setItem('spiff.home', JSON.stringify(p)); } catch(e){} }
function homeShows(id){ return homePrefs().on.indexOf(id) >= 0; }
function homePrefsToggle(id, on){
  const p = homePrefs(); const i = p.on.indexOf(id);
  if(on && i<0) p.on.push(id); if(!on && i>=0) p.on.splice(i,1);
  homePrefsSave(p); homePrefsModal(); renderHome();
}
function homePrefsPreset(k){ const pr = HOME_PRESETS[k]; if(!pr) return; homePrefsSave({on:pr.on.slice()}); homePrefsModal(); renderHome(); toast('Home: '+pr.label); }
function homePrefsModal(){
  const p = homePrefs();
  const rows = HOME_SECTIONS.map(function(s){
    const on = p.on.indexOf(s.id)>=0;
    return '<div class="lrow" style="cursor:default"><div class="lm"><div class="lt">'+esc(s.label)+(s.core?' <span class="bdg mut">always</span>':'')+'</div><div class="ls">'+esc(s.desc)+'</div></div>'
      + '<div class="lr">'+(s.core ? '' : sw(on, "homePrefsToggle('"+s.id+"',"+(!on)+")", s.label))+'</div></div>';
  }).join('');
  const presets = Object.keys(HOME_PRESETS).map(function(k){ const pr=HOME_PRESETS[k]; const active = pr.on.length===p.on.length && pr.on.every(function(x){ return p.on.indexOf(x)>=0; }); return '<button class="fchip2'+(active?' on':'')+'" onclick="homePrefsPreset(\''+k+'\')">'+esc(pr.label)+'</button>'; }).join('');
  openModal(
      '<h3>Your Home</h3>'
    + '<div class="msub">Choose what this page shows. It is yours: the choice is kept in this browser and changes nothing for anyone else.</div>'
    + '<div class="chipbar" style="margin-bottom:12px">'+presets+'</div>'
    + panel("", rows, {tight:true})
    + '<div class="mutedtext" style="font-size:12px;margin-top:10px">Nothing here changes what you are allowed to see. Hidden sections are one click away in the rail.</div>'
    + modalFoot("Done"), 560);
}

/* ---------- Home, assembled from the sections the person keeps ---------- */
function renderHome(){
  const watch = homeWatch(), on = homeShows;
  const h =
      homeBand()
    + (on("ask") ? homeAskPanel() : '')
    + (on("promises") ? homePromises() : '')
    + (on("needs") ? '<div style="margin-top:24px">'+homeNeedsPanel()+'</div>' : '')
    + (on("watch") ? homeHead("Your watchlist", watch.length+" cards you follow · each one re-ran for you this morning",
        '<button class="btn sm ghost" onclick="homeFollowMetric()">'+I2.plus+' Add</button>') + homeWatchGrid(watch) : '')
    + ((on("recent")||on("trend")||on("datasets")) ? '<div class="split" style="margin-top:30px">'
    +   '<div>'+(on("recent")?homeRecentPanel():'')+(on("trend")?homeTrendPanel():'')+'</div>'
    +   '<div>'+(on("datasets") ? '<div class="eyebrow2">Datasets worth knowing</div>'+homeDatasets()
    +     '<div style="margin-top:14px"><button class="btn" onclick="go(\'catalog\')">'+I2.db+' All '+DATASETS.length+' datasets</button></div>' : '')+'</div>'
    + '</div>' : '')
    + (on("governance") ? homeHead("How Spiff keeps this honest","three rules, no exceptions") + homeGovernance() : '')
    + '<div class="rowflex" style="margin-top:28px;justify-content:center"><button class="btn sm ghost" onclick="homePrefsModal()">'+I2.grid+' Customise this page</button></div>';
  $("#view-home").innerHTML = h;
  const ta = $("#home-ask");
  if(ta){
    ta.addEventListener("keydown", function(e){ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); homeAsk(); } });
    ta.addEventListener("input", function(e){ e.target.style.height = "auto"; e.target.style.height = Math.min(120, e.target.scrollHeight)+"px"; });
  }
  document.querySelectorAll("#view-home [data-hq]").forEach(function(b){
    b.onclick = function(){ const a = b.getAttribute("data-ha"); if(a && ANSWERS[a]) openFromCard(a); else askText(b.getAttribute("data-hq")); };
  });
}
V2ROUTES.home = renderHome;
</script>
