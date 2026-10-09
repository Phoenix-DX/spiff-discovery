<script>
/* =====================================================================
   The long pages, shortened (15 Sep 2026) — review item B2
   Three pages scrolled for a week at 1366 × 768: My access (5,498px),
   the Activity log (4,153px) and Definitions (3,127px). Same content,
   less height: Definitions become compact rows with the definition
   clamped to two lines; My access becomes four collapsible bands of
   one-line rows; the Activity log pages its stream and its table,
   twenty events at a time. Anything clipped shows itself in full on
   hover, the same bubble the Inbox and the catalogue use.
   ===================================================================== */

/* ---------- Definitions: a row, not a panel ---------- */
function catalogGlossCard(g){
  const used = catalogTermDatasets(g.term);
  const menu = [{label:'Propose a change', icon:'pencil', onclick:"catalogProposeModal('" + esc2(g.term) + "')"}];
  if(!g.retired) menu.push({label:'Retire definition', icon:'archive', danger:true, onclick:"catalogRetireAsk('" + esc2(g.term) + "')"});
  return '<div class="grow' + (g.retired ? ' retired' : '') + '">'
    + '<div class="grow-h"><div class="grow-t">' + I2.book + '<b>' + esc2(g.term) + '</b>' + (g.retired ? bdg("Retired","mut") : '') + '</div>'
    +   '<div class="grow-meta">' + bdg("v" + g.version, "info") + bdg("Agreed " + g.agreed, "mut", "check") + bdg(g.used + " places", "mut", "link") + '</div>'
    +   kebabHTML(menu) + '</div>'
    + '<div class="grow-def ell2">' + esc2(g.def) + '</div>'
    + '<div class="grow-f">' + personChip(g.owner, "Owns this definition")
    +   '<span class="sp"></span>'
    +   (used.length ? used.slice(0,4).map(function(d){ return '<button class="fchip2" onclick="openDataset(\'' + d.id + '\')">' + I2.db + esc2(d.name) + '</button>'; }).join('') + (used.length > 4 ? '<span class="mutedtext" style="font-size:12px">+' + (used.length-4) + ' more</span>' : '')
                   : '<span class="mutedtext" style="font-size:12px">answers and automations only</span>')
    + '</div></div>';
}

/* ---------- My access: four bands, collapsible, one-line rows ---------- */
MYACC_STATE.open = MYACC_STATE.open || {full:true, part:true, none:false, block:false};
function macBandToggle(l){ MYACC_STATE.open[l] = !MYACC_STATE.open[l]; macRenderSee(); }
function macRow(d){
  const lvl = macLevel(d.id), say = macSay(d.id), gid = macGrantGroup(d.id), meta = MYACC_LVL[lvl];
  const right = (lvl==='full'||lvl==='part')
    ? '<span class="ell mac-right" title="Granted through a group">' + esc2(gid ? macGroupName(gid) : '—') + ' · ' + esc2(gid ? macExpiry(gid) : '') + '</span>'
    : '<span class="ell mac-right mutedtext">' + (lvl==='block' ? 'Nothing to grant' : 'No group of yours holds it') + '</span>';
  return '<div class="mac-row clickable" onclick="openDataset(\'' + d.id + '\')">'
    + '<div class="li">' + (I2[meta.ico]||I2.db) + '</div>'
    + '<div class="mac-main"><div class="mac-name ell"><b>' + esc2(d.name) + '</b> ' + sensBadge(d.sens) + '</div>'
    +   '<div class="mac-say ell" style="color:var(--' + (lvl==='full'?'ok':lvl==='part'?'warn':lvl==='block'?'crit':'muted') + ')">' + esc2(say[0]) + ' <span class="mutedtext">— ' + esc2(say[1]) + '</span></div></div>'
    + right
    + kebabHTML([{label:'Open the dataset', icon:'db', onclick:"openDataset('" + d.id + "')"},
                 {label:'Ask a question', icon:'msg', onclick:"macAsk('" + d.id + "')"},
                 {label:"Why can't I see more?", icon:'info', onclick:"macWhy('" + d.id + "')"}])
    + '</div>';
}
function macRenderSee(){
  const el = $('#mac-see-body'); if(!el) return;
  const q = MYACC_STATE.q.trim().toLowerCase();
  const order = ['full','part','none','block']; let out = '';
  order.forEach(function(l){
    if(MYACC_STATE.lvl!=='all' && MYACC_STATE.lvl!==l) return;
    const rows = DATASETS.filter(function(d){
      if(macLevel(d.id)!==l) return false;
      if(!q) return true;
      return (d.name+' '+d.domain+' '+macSay(d.id).join(' ')).toLowerCase().indexOf(q)>=0;
    });
    if(!rows.length) return;
    const m = MYACC_LVL[l], open = !!q || MYACC_STATE.lvl!=='all' || MYACC_STATE.open[l];
    out += '<div class="panel mac-band' + (open ? ' open' : '') + '">'
      + '<button class="panel-h mac-band-h" onclick="macBandToggle(\'' + l + '\')" aria-expanded="' + (open?'true':'false') + '">' + (I2[m.ico]||'') + '<span>' + esc2(m.label) + '</span>'
      +   '<span class="sub">' + esc2(m.blurb) + '</span><div class="sp"></div>' + bdg(rows.length + (rows.length===1 ? ' dataset' : ' datasets'), m.cls) + '<span class="chev">' + I2.chev + '</span></button>'
      + (open ? '<div class="panel-b tight">' + rows.map(macRow).join('') + '</div>' : '')
      + '</div>';
  });
  el.innerHTML = out || emptyState('Nothing matches','Try a different word, or clear the filter.','search');
}

/* ---------- Activity log: twenty events a page ---------- */
const AUDIT_PAGE = 20;
AUDIT_UI.page = AUDIT_UI.page || 0;
function auditSig(){ const u = AUDIT_UI; return [u.q,u.range,u.mode,u.actor,u.dataset,u.trace,u.traceFilter,JSON.stringify(u.groups||u.group||''),u.sort,u.dir].join('|'); }
function auditGoPage(n){ AUDIT_UI.page = n; auditPaint(); const el = $('#view-audit .audit-pageanchor'); if(el) el.scrollIntoView({block:'start', behavior: (typeof REDUCE!=='undefined' && REDUCE) ? 'auto' : 'smooth'}); }
const auditResultsFull = auditResultsHTML;
auditResultsHTML = function(list){
  if(!list.length) return auditResultsFull(list);
  const sig = auditSig(); if(AUDIT_UI._sig !== sig){ AUDIT_UI._sig = sig; AUDIT_UI.page = 0; }
  const pages = Math.max(1, Math.ceil(list.length / AUDIT_PAGE));
  if(AUDIT_UI.page > pages-1) AUDIT_UI.page = pages-1; if(AUDIT_UI.page < 0) AUDIT_UI.page = 0;
  const slice = list.slice(AUDIT_UI.page*AUDIT_PAGE, (AUDIT_UI.page+1)*AUDIT_PAGE);
  let body;
  if(AUDIT_UI.mode === "table") body = auditTableHTML(auditSorted(slice));
  else {
    let out = "", day = null;
    slice.forEach(function(ev){
      const key = ev.ts.slice(0,10);
      if(key !== day){ day = key; const n = list.filter(function(x){ return x.ts.slice(0,10)===key; }).length;
        out += '<div style="margin:'+(out?'6px':'0')+' 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);font-weight:700">' + esc2(auditDayLabel(key)) + ' <span class="mono" style="opacity:.55;letter-spacing:0">' + n + ' that day</span></div>'; }
      out += auditEventHTML(ev);
    });
    body = '<div style="padding:20px 18px 8px"><div class="tline">' + out + '</div></div>';
  }
  const foot = '<div class="cfoot" style="padding:0 18px 14px"><span class="mutedtext" style="font-size:12.5px">Showing ' + (AUDIT_UI.page*AUDIT_PAGE+1) + '–' + Math.min(list.length,(AUDIT_UI.page+1)*AUDIT_PAGE) + ' of ' + list.length + ' events</span><div class="sp"></div>' + pagerHTML(AUDIT_UI.page, pages, "auditGoPage") + '</div>';
  return '<span class="audit-pageanchor"></span>' + body + foot;
};

/* ---------- Activity log: the two reference panels below the log fold shut until asked ---------- */
function auditFoldRefs(){
  const wrap = $('#audit-trace-panel'); if(!wrap) return;
  AUDIT_UI.foldOpen = AUDIT_UI.foldOpen || {};
  wrap.querySelectorAll(':scope > .panel').forEach(function(p){
    const h = p.querySelector(':scope > .panel-h'); if(!h || h.querySelector('.fold-btn')) return;
    const key = (h.querySelector('span') || h).innerText.trim(), open = !!AUDIT_UI.foldOpen[key];
    p.classList.toggle('folded', !open);
    h.insertAdjacentHTML('beforeend', '<button class="btn sm ghost fold-btn" onclick="auditFold(this)" aria-expanded="' + (open?'true':'false') + '">' + (open ? 'Hide' : 'Show') + '</button>');
  });
}
function auditFold(btn, force){
  const p = btn.closest('.panel'); if(!p) return;
  const open = force != null ? force : p.classList.contains('folded');
  p.classList.toggle('folded', !open); btn.textContent = open ? 'Hide' : 'Show'; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  const key = (p.querySelector('.panel-h span') || p.querySelector('.panel-h')).innerText.trim(); AUDIT_UI.foldOpen[key] = open;
}
(function(){
  const orig = V2ROUTES.audit;
  if(typeof orig === 'function') V2ROUTES.audit = function(arg){ const r = orig(arg); auditFoldRefs(); return r; };
  if(typeof auditJump === 'function'){ const aj = auditJump; auditJump = function(id){ const el = $('#'+id); const p = el ? (el.classList.contains('panel') ? el : (el.closest('.panel') || el.querySelector('.panel'))) : null; const b = p && p.querySelector('.fold-btn'); if(b && p.classList.contains('folded')) auditFold(b, true); return aj(id); }; }
  if(typeof auditPickTrace === 'function'){ const ap = auditPickTrace; auditPickTrace = function(id){ const r = ap(id); const el = $('#audit-trace'); const p = el && el.closest('.panel'); const b = p && p.querySelector('.fold-btn'); if(b && p.classList.contains('folded')) auditFold(b, true); return r; }; }
})();
</script>
