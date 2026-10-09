<script>
/* =====================================================================
   Data catalogue — dense cards, filters in a bar (15 Sep 2026)
   Oren, on seeing the page: "half of the left screen is menus and
   filters and the list on the right side are columns... change the
   column style to cards — consider you might have hundreds of items."
   So: the filter panel becomes one bar of dropdowns above the results,
   the three tall columns become a grid of compact cards of a fixed
   shape, the page size is 24 with a pager and a per-page control, and
   any text that does not fit ends in … and shows itself in full on
   hover. Everything a card used to say is still one click away on the
   dataset's own page.
   ===================================================================== */
CATALOG_STATE.size = CATALOG_STATE.size || 24;
CATALOG_STATE.openFacet = null;

function catalogSize(n){ CATALOG_STATE.size = +n; CATALOG_STATE.page = 0; catalogPaint(); }
function catalogFacetOpen(key){ CATALOG_STATE.openFacet = CATALOG_STATE.openFacet === key ? null : key; catalogPaintBar(); }
function catalogFacetOff(key, opt){ const a = CATALOG_STATE[key]; const i = a.indexOf(opt); if(i >= 0) a.splice(i, 1); catalogPaint(); }
document.addEventListener('click', function(e){
  if(!CATALOG_STATE.openFacet) return;
  /* the bar repaints on every click, so the clicked node may already be detached: test the node's own ancestry, not the page's */
  if(e.target.closest && (e.target.closest('.cbar-menu') || e.target.closest('.facet-pop'))) return;
  CATALOG_STATE.openFacet = null; catalogPaintBar();
});

/* the bar: one dropdown per facet, the chosen options as removable chips */
function catalogPaintBar(){
  const bar = $('#catalog-bar'); if(!bar) return;
  const base = catalogSearched();
  const menus = CATALOG_FACETS.map(function(f, fi){
    const title = f.key === "access" && SIM ? "Access for " + SIM.name.split(" ")[0] : f.title;
    const sel = CATALOG_STATE[f.key], open = CATALOG_STATE.openFacet === f.key;
    return '<div class="rmenu cbar-menu"><button class="fchip2 cbar-btn' + (sel.length ? ' on' : '') + (open ? ' open' : '') + '" onclick="event.stopPropagation();catalogFacetOpen(\'' + f.key + '\')">' + esc2(title)
      + (sel.length ? '<span class="cbar-n">' + sel.length + '</span>' : '') + ' <span class="caret">▾</span></button>'
      + '<div class="rpop facet-pop' + (open ? ' on' : '') + '">' + f.opts.map(function(o, oi){
          const n = base.filter(function(x){ return catalogValOf(f.key, x.d) === o; }).length;
          const on = sel.indexOf(o) >= 0;
          return '<label class="fp-row' + (n ? '' : ' off') + '"><input type="checkbox"' + (on ? ' checked' : '') + (n ? '' : ' disabled') + ' onchange="catalogFacet(' + fi + ',' + oi + ',this.checked)"><span>' + esc2(catalogOptLabel(f.key, o)) + '</span><span class="cnt">' + n + '</span></label>';
        }).join('') + '</div></div>';
  }).join('');
  const chips = CATALOG_FACETS.map(function(f){ return CATALOG_STATE[f.key].map(function(o){
    return '<button class="fchip2 on cbar-chip" onclick="catalogFacetOff(\'' + f.key + '\',\'' + esc2(o) + '\')" title="Remove">' + esc2(catalogOptLabel(f.key, o)) + ' <span class="x">×</span></button>'; }).join(''); }).join('');
  const any = catalogFacetsOn() || !!CATALOG_STATE.q.trim();
  bar.innerHTML = '<div class="cbar"><span class="cbar-lbl">' + I2.filter + ' Narrow</span>' + menus
    + (chips ? '<span class="cbar-sep"></span>' + chips : '')
    + (any ? '<button class="btn sm ghost" onclick="catalogClear()">' + I2.x + ' Clear all</button>' : '') + '</div>';
}

/* a compact card: the same facts, a fixed shape */
function catalogDenseCard(item){
  const d = item.d, st = catalogAccessState(d), a = CATALOG_ACCESS[st];
  const locked = st === "none" || st === "blocked";
  const ico = locked ? (st === "blocked" ? "lock" : "unlock") : "db";
  return '<div class="dcard ' + st + '" onclick="openDataset(\'' + d.id + '\')" title="Open ' + esc2(d.name) + '">'
    + '<div class="dc-top"><div class="ci">' + I2[ico] + '</div>'
    +   '<div class="dc-t"><div class="dc-name ell">' + esc2(d.name) + '</div><div class="dc-tech mono ell">' + esc2(d.tech) + '</div></div>'
    +   '<span class="bdg ' + a.cls + ' dc-acc" title="' + esc2(catalogAccessLabel(d, st)) + '">' + I2[a.ico] + esc2(a.label) + '</span></div>'
    + '<div class="dc-badges">' + certBadge(d) + sensBadge(d.sens) + catalogSysChip(d) + '</div>'
    + '<div class="dc-snip">' + esc2(d.purpose) + '</div>'
    + '<div class="dc-foot">'
    +   (d.cert === "blocked" ? '<span class="mutedtext">nothing loaded</span>' : freshBadge(d.freshness) + '<span class="ell">' + esc2(d.refreshed) + '</span>')
    +   (d.warning ? '<span class="dc-warn" title="' + esc2(d.warning) + '">' + I2.warn + '</span>' : '')
    +   '<span class="sp"></span><span class="mono dc-rank" title="' + esc2(catalogPeopleLine(d)) + '">#' + d.rank + '</span>'
    + '</div></div>';
}

/* the paint: counts, bar, results, pager */
function catalogPaint(){
  const base = catalogSearched();
  const list = catalogSorted(base.filter(function(x){ return catalogPassesFacets(x.d); }));
  const q = CATALOG_STATE.q.trim(), fieldHits = list.filter(function(x){ return x.via && x.via.kind === "field"; }).length;
  const size = CATALOG_STATE.size || 24;
  const sig = catalogSig() + '|' + size;
  if(CATALOG_STATE._sig !== sig){ CATALOG_STATE._sig = sig; CATALOG_STATE.page = 0; }
  const pages = Math.max(1, Math.ceil(list.length / size));
  if(CATALOG_STATE.page > pages-1) CATALOG_STATE.page = pages-1;
  if(CATALOG_STATE.page < 0) CATALOG_STATE.page = 0;
  const pageList = list.slice(CATALOG_STATE.page*size, (CATALOG_STATE.page+1)*size);

  catalogPaintBar();
  const any = catalogFacetsOn() || !!q;
  const cnt = $('#catalog-count'); if(cnt) cnt.innerHTML = '<b>' + list.length + '</b> of ' + DATASETS.length + ' datasets'
    + (q ? ' matching “' + esc2(q) + '”' : '')
    + (fieldHits ? ' · <span style="color:var(--accent)">' + fieldHits + ' matched on a field name</span>' : '')
    + (pages>1 ? ' · page ' + (CATALOG_STATE.page+1) + ' of ' + pages : '')
    + ' · access for <b>' + esc2(viewer().name) + '</b>, ' + esc2(catalogScope());
  const sug = $('#catalog-sug'); if(sug) sug.style.display = any ? 'none' : '';

  let out;
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
      + pageList.map(catalogTableRow).join("") + '</tbody></table></div></div>';
  } else {
    out = '<div class="dgrid">' + pageList.map(catalogDenseCard).join("") + '</div>';
  }
  out += '<div class="cfoot"><span class="mutedtext" style="font-size:12.5px">' + (list.length ? 'Showing ' + (CATALOG_STATE.page*size+1) + '–' + Math.min(list.length, (CATALOG_STATE.page+1)*size) + ' of ' + list.length : '') + '</span>'
    + '<div class="sp"></div>' + catalogPagerHTML(CATALOG_STATE.page, pages)
    + '<label class="lf-size" style="margin-left:12px">Per page <select onchange="catalogSize(this.value)">' + [12,24,48,96].map(function(n){ return '<option' + (n===size?' selected':'') + '>' + n + '</option>'; }).join('') + '</select></label></div>';
  $('#catalog-results').innerHTML = out;
}

/* the page: head, search, suggestions, then one bar and the results at full width */
function renderCatalog(){
  const st = CATALOG_STATE;
  $('#view-catalog').innerHTML =
    pageHead({
      eyebrow:"Data",
      title:"Data catalogue",
      desc:"Everything Spiff can answer questions about, and exactly what you are allowed to see of it.",
      acts:'<button class="btn pri" onclick="go(\'ask\')">' + I2.spark + ' Ask a question</button>'
        + '<button class="btn" onclick="catalogRequestPicker()">' + I2.unlock + ' Request access</button>'
    })
    + '<div class="bigsearch" style="margin-bottom:14px">' + I2.search
    + '<input id="catalog-q" value="' + esc2(st.q) + '" placeholder="Search datasets, fields and the words people actually use — “attendance”, “age”, “bookings”, “locality”…">'
    + '</div>'
    + '<div id="catalog-sug" style="margin-bottom:16px">' + panel("Suggested for you", catalogSuggestHTML(), {icon:"star", sub:esc2(viewer().title || ME.title)}) + '</div>'
    + '<div id="catalog-bar"></div>'
    + '<div class="rowflex" style="margin:12px 0 10px">'
    +   '<div id="catalog-count" style="font-size:13px;color:var(--muted)"></div><div class="sp"></div>'
    +   '<label style="font-size:12px;color:var(--muted)">Sort</label>'
    +   '<select onchange="catalogSort(this.value)" style="border:1px solid var(--hair);background:var(--surface);border-radius:9px;padding:6px 10px;font:inherit;font-size:13px;color:var(--ink)">'
    +   '<option value="used"' + (st.sort === "used" ? " selected" : "") + '>Most used</option>'
    +   '<option value="fresh"' + (st.sort === "fresh" ? " selected" : "") + '>Recently updated</option>'
    +   '<option value="az"' + (st.sort === "az" ? " selected" : "") + '>A–Z</option>'
    +   '<option value="trust"' + (st.sort === "trust" ? " selected" : "") + '>Trust</option></select>'
    +   '<div class="seg2" id="catalog-viewtog" style="margin-left:8px">'
    +   '<button data-v="grid" class="' + (st.view === "grid" ? "on" : "") + '" onclick="catalogView(\'grid\')">' + I2.grid + ' Cards</button>'
    +   '<button data-v="list" class="' + (st.view === "list" ? "on" : "") + '" onclick="catalogView(\'list\')">' + I2.list + ' List</button></div>'
    + '</div>'
    + '<div id="catalog-results"></div>'
    + '<div style="margin-top:24px">'
    + callout("info", "<b>This page lists definitions, not data.</b> Every card is a description of what exists — the counts, owners and freshness are the same for everyone. Open one and Spiff re-checks who you are, re-applies every rule, and shows only your slice.")
    + '</div>'
    + '<div class="mutedtext" style="margin-top:12px;font-size:12px">'
    + DATASETS.length + ' datasets across ' + DOMAINS.length + ' domains and ' + SYSTEMS.length + ' source systems · '
    + '<span class="clickable" style="color:var(--accent)" onclick="go(\'glossary\')">See the agreed definitions</span> · '
    + '<span class="clickable" style="color:var(--accent)" onclick="go(\'myaccess\')">See everything you can reach</span></div>';
  const box = $('#catalog-q');
  box.addEventListener('input', function(){ catalogSearch(this.value); });
  box.addEventListener('keydown', function(e){ if(e.key === 'Escape') catalogClear(); });
  catalogPaint();
  if(typeof iaInsert === 'function') iaInsert('catalog', 'data');
}
V2ROUTES.catalog = renderCatalog;
</script>
