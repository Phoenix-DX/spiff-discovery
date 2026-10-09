<script>
/* =====================================================================
   The list — 10 Sep 2026
   Oren's second and third rules: every list sorts and pages; every list of
   things we created lets you delete a line. Thirty lists were doing this
   thirty ways, or not at all. This is the one frame they all use now, so a
   builder learns one list, not seventy.

   Header: search · sort · count.   Body: rows, or a table with sortable
   headers that stay in step with the sort control.   Footer: "Showing
   1–40 of 312" · per page · pager, and — for lists of things that are not
   ours — a note saying who owns them, so the absence of delete reads as a
   fact rather than an omission.

   State lives here, keyed by list id, so a re-render of the whole view (the
   way every screen repaints) does not lose the page you were on.
   ===================================================================== */

const LISTS = {};

function listState(id, o){
  if(!LISTS[id]){
    LISTS[id] = { q:"", sort:(o.sorts && o.sorts[0]) ? o.sorts[0].key : null, dir:1, page:0, size:o.size || 20 };
  }
  LISTS[id].o = o;
  return LISTS[id];
}

/* every control funnels through here, then asks the view to repaint */
function listCtl(id, key, val){
  const s = LISTS[id]; if(!s) return;
  if(key === "sort"){
    if(s.sort === val) s.dir = -s.dir; else { s.sort = val; s.dir = 1; }
    s.page = 0;
  }
  else if(key === "q"){ s.q = val; s.page = 0; }
  else if(key === "size"){ s.size = +val; s.page = 0; }
  else if(key === "page"){ s.page = +val; }
  if(typeof s.o.repaint === "function") s.o.repaint();
}

function listApply(id, o){
  const s = listState(id, o);
  let rows = o.items.slice();
  const q = (s.q || "").trim().toLowerCase();
  if(q && o.search) rows = rows.filter(function(it){ return String(o.search(it) || "").toLowerCase().indexOf(q) >= 0; });
  const srt = (o.sorts || []).filter(function(x){ return x.key === s.sort; })[0];
  if(srt){
    rows.sort(function(a, b){
      const va = srt.get(a), vb = srt.get(b);
      const c = (typeof va === "number" && typeof vb === "number")
        ? va - vb
        : String(va == null ? "" : va).localeCompare(String(vb == null ? "" : vb), undefined, {numeric:true, sensitivity:"base"});
      return c * s.dir * (srt.desc ? -1 : 1);
    });
  }
  const total = rows.length, pages = Math.max(1, Math.ceil(total / s.size));
  if(s.page > pages - 1) s.page = pages - 1;
  if(s.page < 0) s.page = 0;
  return { rows: rows.slice(s.page * s.size, (s.page + 1) * s.size), total, pages, s, srt };
}

/* o = { items, repaint, noun, noun1?, search(it)->string, placeholder,
         sorts:[{key,label,get(it),desc?}], size,
         cols:[{label, cell(it), sort?, num?}]  — table mode
         row(it,i)->html, bodyClass                — rows mode
         actions(it)->[{label, onclick, danger, icon}], rowClick(it)->js,
         notOurs, emptyTitle, emptySub, emptyIcon } */
function listFrame(id, o){
  const r = listApply(id, o), s = r.s;
  const q = "'" + id + "'";
  const head = '<div class="lf-head">'
    + (o.search
        ? '<div class="bigsearch lf-search">' + I2.search
          + '<input value="' + esc2(s.q) + '" placeholder="' + esc2(o.placeholder || "Search…") + '" oninput="listCtl(' + q + ',\'q\',this.value)" aria-label="Search this list"></div>'
        : '')
    + ((o.sorts || []).length
        ? '<label class="lf-sort">Sort by <select onchange="listCtl(' + q + ',\'sort\',this.value)">'
          + o.sorts.map(function(x){ return '<option value="' + esc2(x.key) + '"' + (x.key === s.sort ? ' selected' : '') + '>' + esc2(x.label) + '</option>'; }).join('')
          + '</select><button class="btn sm ghost" title="' + (s.dir > 0 ? 'Ascending — click for descending' : 'Descending — click for ascending') + '" aria-label="Reverse sort order" onclick="listCtl(' + q + ',\'sort\',\'' + esc2(s.sort) + '\')">' + (s.dir > 0 ? '↑' : '↓') + '</button></label>'
        : '')
    + '<div class="sp"></div>'
    + '<div class="lf-count">' + fmt(r.total) + ' ' + esc2(r.total === 1 ? (o.noun1 || o.noun || 'item') : (o.noun || 'items'))
    + (o.items.length !== r.total ? ' of ' + fmt(o.items.length) : '') + '</div>'
    + '</div>';

  let body;
  if(!r.total){
    body = emptyState(
      o.emptyTitle || ('No ' + (o.noun || 'items') + (s.q ? ' match that' : ' yet')),
      o.emptySub || (s.q ? 'Try fewer words, or clear the search.' : ''),
      o.emptyIcon || 'search');
  }
  else if(o.cols) body = listTable(id, o, r);
  else body = '<div class="lf-rows ' + (o.bodyClass || '') + '">' + listRows(o, r) + '</div>';

  const from = r.total ? s.page * s.size + 1 : 0, to = Math.min(r.total, (s.page + 1) * s.size);
  const foot = '<div class="lf-foot">'
    + '<span>Showing ' + fmt(from) + '–' + fmt(to) + ' of ' + fmt(r.total) + '</span>'
    + (r.total > 10
        ? '<label class="lf-size">Per page <select onchange="listCtl(' + q + ',\'size\',this.value)">'
          + [10, 20, 40, 100].map(function(n){ return '<option' + (n === s.size ? ' selected' : '') + '>' + n + '</option>'; }).join('')
          + '</select></label>'
        : '')
    + (o.notOurs ? '<span class="lf-notours">' + I2.lock + esc2(o.notOurs) + '</span>' : '')
    + '<div class="sp"></div>'
    + pagerHTML(s.page, r.pages, "listCtl.bind(null," + q + ",'page')")
    + '</div>';

  return '<div class="lf" id="lf-' + id + '">' + head + body + foot + '</div>';
}

/* rows, optionally grouped: a sort marked grouped:true asks o.group(item, sortKey)
   for {key,label,color} and wraps each run of rows in a collapsible group, so
   "by theme" and "by project" keep their headings without a second code path */
function listRows(o, r){
  const grouped = r.srt && r.srt.grouped && typeof o.group === "function";
  if(!grouped) return r.rows.map(function(it, i){ return o.row(it, i); }).join('');
  let html = '', cur = null, buf = [];
  const flush = function(){
    if(cur === null) return;
    if(o.groupPlain) html += '<div class="tgrp">' + esc2(cur.label) + ' · ' + buf.length + '</div>' + buf.join('');
    else html += '<details class="tgroup" open><summary><span class="tdot" style="background:' + (cur.color || 'var(--muted)') + '"></span>'
      + esc2(cur.label) + '<span class="ct2">' + buf.length + '</span>'
      + '<svg class="cx" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg></summary>'
      + '<div class="rows">' + buf.join('') + '</div></details>';
    buf = [];
  };
  r.rows.forEach(function(it, i){
    const g = o.group(it, r.s.sort) || {key:'', label:''};
    if(!cur || g.key !== cur.key){ flush(); cur = g; }
    buf.push(o.row(it, i));
  });
  flush();
  return html;
}

function listTable(id, o, r){
  const s = r.s, q = "'" + id + "'";
  const th = o.cols.map(function(c){
    const on = c.sort && s.sort === c.sort;
    return '<th class="' + (c.num ? 'num ' : '') + (c.sort ? 'sortable' : '') + (on ? ' on' : '') + '"'
      + (c.sort ? ' onclick="listCtl(' + q + ',\'sort\',\'' + esc2(c.sort) + '\')"' : '')
      + (c.style ? ' style="' + c.style + '"' : '') + '>'
      + esc2(c.label)
      + (c.sort ? '<span class="sortmark">' + (on ? (s.dir > 0 ? '↑' : '↓') : '↕') + '</span>' : '')
      + '</th>';
  }).join('') + (o.actions ? '<th class="lf-act"></th>' : '');
  const rows = r.rows.map(function(it){
    return '<tr' + (o.rowClick ? ' class="clk" onclick="' + o.rowClick(it) + '"' : '') + (o.rowStyle ? ' style="' + o.rowStyle(it) + '"' : '') + '>'
      + o.cols.map(function(c){ return '<td class="' + (c.num ? 'num' : '') + '">' + c.cell(it) + '</td>'; }).join('')
      + (o.actions ? '<td class="lf-act" onclick="event.stopPropagation()">' + kebabHTML(o.actions(it)) + '</td>' : '')
      + '</tr>';
  }).join('');
  return '<div class="dtbl-wrap scrollx"><table class="dtbl lf-tbl"><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

/* Row actions live behind one kebab, as words. Delete, Remove, Retire and
   Withdraw always go through confirmAsk — the kebab never acts on its own. */
function kebabHTML(actions){
  if(!actions || !actions.length) return '';
  return '<span class="kwrap" onclick="event.stopPropagation()">'
    + '<button class="kebab" title="More actions" aria-label="More actions" aria-haspopup="menu" onclick="kebabOpen(this)">' + I2.more + '</button>'
    + '<div class="rpop kmenu" role="menu">'
    + actions.map(function(a){
        return '<button role="menuitem" class="' + (a.danger ? 'danger' : '') + '" onclick="kebabClose();' + a.onclick + '">'
          + (a.icon ? (I2[a.icon] || '') : '') + esc2(a.label) + '</button>';
      }).join('')
    + '</div></span>';
}
function kebabOpen(btn){
  const pop = btn.nextElementSibling, open = pop.classList.contains('on');
  document.querySelectorAll('.rpop.on').forEach(function(p){ p.classList.remove('on'); });
  if(!open) pop.classList.add('on');
}
function kebabClose(){ document.querySelectorAll('.rpop.on').forEach(function(p){ p.classList.remove('on'); }); }
</script>
