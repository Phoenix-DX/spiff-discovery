<script>
/* =====================================================================
   SPIFF v2 — VIEW: Data catalogue + Definitions
   Route A  catalog   — what Spiff can answer questions about, and what
                        this viewer is allowed to see of it.
   Route B  glossary  — the agreed definitions behind the numbers.
   Nothing here fetches. Everything re-reads viewer() on every paint.
   ===================================================================== */

const CATALOG_STATE = {
  q:"", view:"grid", sort:"used",
  domain:[], sys:[], cert:[], sens:[], access:[], fresh:[],
  gq:""
};

const CATALOG_FACETS = [
  {key:"domain", title:"Domain",        opts:DOMAINS.slice()},
  {key:"sys",    title:"Source system", opts:SYSTEMS.map(function(s){return s.id;})},
  {key:"cert",   title:"Trust",         opts:["verified","draft","warning","deprecated","blocked"]},
  {key:"sens",   title:"Sensitivity",   opts:["Public","Internal","Restricted","Personal"]},
  {key:"access", title:"My access",     opts:["full","partial","none","blocked"]},
  {key:"fresh",  title:"Freshness",     opts:["on-time","late","stale","n/a"]}
];

const CATALOG_ACCESS = {
  full:   {label:"Full",    cls:"ok",   ico:"unlock"},
  partial:{label:"Partial", cls:"warn", ico:"eyeoff"},
  none:   {label:"None",    cls:"mut",  ico:"lock"},
  blocked:{label:"Blocked", cls:"crit", ico:"lock"}
};

/* questions that already have a made-up answer behind them */
const CATALOG_ANSWER_MAP = {
  "How many LDM meetings ran in my subdivisions last quarter?":"ldm",
  "Show meeting counts per province":"assemble_regions",
  "Member growth by locality this year":"growth",
  "Orbit bookings by family — flights, cars, hotels":"orbit_travel",
  "Trace a member's planned activities next month":"steyn_journey",
  "Which localities missed two meetings in a row?":"stale"
};

const CATALOG_WHY = {
  meetings:"287 people in LDM Operations ask about this — more than any other dataset.",
  localities:"Your last 4 questions used it.",
  appointments:"Answers the March question every year — who is still appointed, and where.",
  growth:"Reneilwe D. and five others in your cluster opened this in the past week.",
  members:"Every membership question lands here first.",
  events:"Warrick M.'s team publishes nine answers a week off this one.",
  registrations:"Feeds the no-show reporting your subdivision asked for.",
  travel:"Colette M. opened this twice today.",
  properties:"Where room and capacity questions resolve.",
  families:"The household groupings behind travel and correspondence."
};

const CATALOG_CHANGES = {
  "Net movement":"Restricted to complete calendar months — the in-progress month no longer appears in any total.",
  "Active member":"Standing is now read as at period end, not at query time, so historic reports stop drifting.",
  "Meeting":"First agreed definition. Cancelled meetings keep their record but leave every count.",
  "Locality":"A locality now belongs to exactly one subdivision — the old dual-listing was silently double-counting.",
  "Attendance":"Duplicate check-ins inside four hours are collapsed to one.",
  "Locality":"First agreed definition."
};

/* ---------- access, computed for whoever is viewing ---------- */
function catalogScope(){
  var v = viewer();
  return v.scope || (v.locality ? v.locality + " only" : "their assigned areas");
}
function catalogSimState(d){
  var r = (SIM.roles||[]), team = SIM.team;
  var has = function(x){ return r.indexOf(x) >= 0; };
  if(d.id === "budgets")   return (team === "Finance" || has("admin")) ? "full" : "none";
  if(d.sys === "orbit")    return (team === "Travel & Logistics" || has("admin")) ? "full"
                                : (has("regional") || has("author")) ? "partial" : "none";
  if(d.sens === "Personal")return (has("steward") || has("safeguard") || has("admin")) ? "full"
                                : (r.length === 1 && has("viewer")) ? "none" : "partial";
  if((d.rules||[]).indexOf("r-consent") >= 0) return "partial";
  return "full";
}
function catalogAccessState(d){
  if(d.cert === "blocked") return "blocked";
  if(SIM) return catalogSimState(d);
  var a = d.access || "";
  if(a.indexOf("No access") === 0) return "none";
  if(a.indexOf("Partial") === 0 || a.indexOf("Restricted") === 0) return "partial";
  return "full";
}
function catalogAccessDetail(d){
  var a = d.access || "", i = a.indexOf(" — ");
  var det = i > 0 ? a.slice(i + 3) : "";
  return (det === "deprecated" || det === "request required") ? "" : det;
}
function catalogAccessSay(d){
  var st = catalogAccessState(d);
  if(st === "blocked") return "Blocked for everyone, Platform Admins included. " + esc2(d.accessNote) + ".";
  if(!SIM){
    if(st === "none") return "You are not in a group that holds this. You would get an empty answer that says so — not a quiet gap.";
    var det = catalogAccessDetail(d);
    return (det ? esc2(det) + " · " : "") + esc2(d.accessNote) + ".";
  }
  var who = esc2(SIM.name);
  if(st === "none")    return who + " is not in a group that holds this. Their answer would come back empty and say why.";
  if(st === "partial") return who + " sees this with masking applied, inside " + esc2(catalogScope()) + ".";
  return who + " sees every row inside " + esc2(catalogScope()) + ".";
}

/* ---------- search ---------- */
function catalogWordHit(s, q){
  s = (s || "").toLowerCase();
  var i = -1;
  while((i = s.indexOf(q, i + 1)) >= 0){
    if(i === 0 || /[^a-z0-9]/.test(s.charAt(i - 1))) return true;
  }
  return false;
}
function catalogMatch(d, q){
  if(!q) return {hit:true, via:null};
  q = q.toLowerCase();
  var has = function(s){ return catalogWordHit(s, q); };
  if(has(d.name) || has(d.purpose) || has(d.domain) || has(d.tech) || has(d.grain)) return {hit:true, via:null};
  var f = (d.fields||[]).filter(function(x){
    return has(x.label) || has(x.tech) || has(x.glossary) || (x.synonyms||[]).some(has);
  })[0];
  if(f){
    var syn = (f.synonyms||[]).filter(has)[0];
    return {hit:true, via:{kind:"field", f:f, syn:(!has(f.label) && !has(f.tech)) ? syn : null}};
  }
  var qq = (d.questions||[]).filter(has)[0];
  if(qq) return {hit:true, via:{kind:"question", q:qq}};
  if(has(sysById(d.sys).name)) return {hit:true, via:{kind:"system"}};
  return {hit:false};
}

/* ---------- filter / sort ---------- */
function catalogValOf(key, d){
  if(key === "domain") return d.domain;
  if(key === "sys")    return d.sys;
  if(key === "cert")   return d.cert;
  if(key === "sens")   return d.sens;
  if(key === "access") return catalogAccessState(d);
  return d.freshness;
}
function catalogOptLabel(key, o){
  if(key === "sys")    return sysById(o).name;
  if(key === "cert")   return (CERT[o]||{}).label || o;
  if(key === "access") return CATALOG_ACCESS[o].label;
  if(key === "fresh")  return o === "n/a" ? "Never refreshed" : (FRESH[o]||{}).label || o;
  return o;
}
function catalogSearched(){
  var out = [];
  DATASETS.forEach(function(d){
    var m = catalogMatch(d, CATALOG_STATE.q.trim());
    if(m.hit) out.push({d:d, via:m.via});
  });
  return out;
}
function catalogFacetsOn(){
  return CATALOG_FACETS.some(function(f){ return CATALOG_STATE[f.key].length > 0; });
}
function catalogPassesFacets(d){
  return CATALOG_FACETS.every(function(f){
    var on = CATALOG_STATE[f.key];
    return !on.length || on.indexOf(catalogValOf(f.key, d)) >= 0;
  });
}
function catalogMonth(m){ return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m); }
function catalogDateKey(s){
  var m = /^(\d{1,2}) (\w{3}) (\d{4})$/.exec(s || "");
  return m ? (+m[3]) * 10000 + (catalogMonth(m[2]) + 1) * 100 + (+m[1]) : 0;
}
function catalogUpdatedKey(d){
  var m = /^today (\d{1,2}):(\d{2})$/.exec(d.refreshed || "");
  if(m) return 90000000 + (+m[1]) * 60 + (+m[2]);
  var k = catalogDateKey(d.refreshed);
  return k ? k : -1;
}
function catalogSorted(list){
  var s = CATALOG_STATE.sort, order = ["verified","draft","warning","deprecated","blocked"];
  return list.slice().sort(function(a, b){
    if(s === "az")    return a.d.name.localeCompare(b.d.name);
    if(s === "fresh") return catalogUpdatedKey(b.d) - catalogUpdatedKey(a.d);
    if(s === "trust") return (order.indexOf(a.d.cert) - order.indexOf(b.d.cert)) || (b.d.popularity - a.d.popularity);
    return b.d.popularity - a.d.popularity;
  });
}

/* ---------- pieces ---------- */
function catalogSysChip(d){
  var s = sysById(d.sys);
  return '<span class="bdg mut" title="' + esc2(s.kind + " · " + s.desc) + '">'
    + '<i class="dotd" style="background:' + s.color + '"></i>' + esc2(s.name) + '</span>';
}
function catalogWhyHTML(d, via){
  if(!via) return "";
  if(via.kind === "field")
    return '<div class="callout info" style="padding:8px 11px;font-size:12.5px;margin-bottom:2px">' + I2.search
      + '<div>Matched a field — <b>' + esc2(via.f.label) + '</b> <span class="mono" style="font-size:11.5px">'
      + esc2(via.f.tech) + '</span>' + (via.syn ? ', also called “' + esc2(via.syn) + '”' : '') + '</div></div>';
  if(via.kind === "question")
    return '<div class="callout info" style="padding:8px 11px;font-size:12.5px;margin-bottom:2px">' + I2.msg
      + '<div>Someone already asked: “' + esc2(via.q) + '”</div></div>';
  return '<div class="callout info" style="padding:8px 11px;font-size:12.5px;margin-bottom:2px">' + I2.plug
    + '<div>Comes from ' + esc2(sysById(d.sys).name) + '</div></div>';
}
function catalogQuestionPills(d){
  var qs = (d.questions||[]).slice(0, 2);
  if(d.cert === "blocked") return "";
  if(!qs.length) return '<div class="mutedtext" style="font-size:12px">No saved questions. '
    + (d.cert === "deprecated" ? "Ask them of the dataset that replaced this one." : "Be the first to ask one.") + '</div>';
  return '<div class="chipbar">' + qs.map(function(q, i){
    return '<button class="fchip2" onclick="event.stopPropagation();catalogAsk(\'' + d.id + '\',' + i + ')">'
      + I2.spark + esc2(q) + '</button>';
  }).join("") + '</div>';
}
function catalogPeopleLine(d){
  if(!d.users) return "Nobody has asked about this in 90 days.";
  return fmt(d.users) + " people ask about this";
}
function catalogAccessLabel(d, st){
  return (st === "full" && d.cert === "deprecated") ? "Read-only" : CATALOG_ACCESS[st].label;
}
function catalogCard(item){
  var d = item.d, st = catalogAccessState(d), a = CATALOG_ACCESS[st];
  var locked = st === "none" || st === "blocked";
  var ico = locked ? (st === "blocked" ? "lock" : "unlock") : "db";
  return '<div class="card" onclick="openDataset(\'' + d.id + '\')"'
    + (st === "blocked" ? ' style="border-color:var(--crit)"' : '') + '>'
    + '<div class="top">'
      + '<div class="ci"' + (locked ? ' style="background:var(--' + (st === "blocked" ? "crit" : "warn") + '-soft);color:var(--' + (st === "blocked" ? "crit" : "warn") + ')"' : '') + '>' + I2[ico] + '</div>'
      + '<div style="flex:1;min-width:0"><h3>' + esc2(d.name) + '</h3>'
      + '<div class="mono trunc" style="font-size:11.5px;color:var(--muted);margin-top:2px">' + esc2(d.tech) + '</div></div>'
    + '</div>'
    + catalogWhyHTML(d, item.via)
    + '<div class="rowflex" style="gap:6px">' + certBadge(d) + sensBadge(d.sens) + catalogSysChip(d) + '</div>'
    + '<div class="snip">' + esc2(d.purpose) + '</div>'
    + (d.warning ? '<div class="callout warn" style="padding:8px 11px;font-size:12.5px">' + I2.warn + '<div>' + esc2(d.warning) + '</div></div>' : '')
    + (d.cert === "blocked"
        ? '<div class="mutedtext" style="font-size:12px">Nothing is refreshed, because nothing is loaded. Not ranked, not counted, not searchable.</div>'
        : '<div class="rowflex" style="gap:8px;font-size:12px;color:var(--muted)">' + freshBadge(d.freshness)
          + '<span>Refreshed ' + esc2(d.refreshed) + '</span></div>'
        + '<div><div class="rowflex" style="justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px">'
          + '<span>' + esc2(catalogPeopleLine(d)) + '</span><span class="mono">#' + d.rank + ' most asked</span></div>'
          + meter(d.popularity) + '</div>')
    + '<div class="callout ' + (st === "full" ? "ok" : st === "partial" ? "warn" : st === "none" ? "mut" : "crit")
      + '" style="padding:9px 11px;font-size:12.5px">' + I2[a.ico] + '<div><b>' + catalogAccessLabel(d, st) + '</b> — ' + catalogAccessSay(d) + '</div></div>'
    + catalogQuestionPills(d)
    + (st === "none"
        ? '<button class="btn sm" style="align-self:flex-start" onclick="event.stopPropagation();requestAccessModal(\'' + d.id + '\')">' + I2.unlock + ' Request access</button>'
        : st === "blocked"
        ? '<div class="mutedtext" style="font-size:12px">There is nothing to request. No field of this dataset is loaded into Spiff.</div>'
        : '')
    + '</div>';
}
function catalogTableRow(item){
  var d = item.d, st = catalogAccessState(d), a = CATALOG_ACCESS[st];
  return '<tr class="clk" onclick="openDataset(\'' + d.id + '\')">'
    + '<td><div style="font-weight:600">' + esc2(d.name) + '</div>'
      + '<div class="tech">' + esc2(d.tech) + '</div>'
      + (item.via && item.via.kind === "field" ? '<div style="font-size:11.5px;color:var(--accent);margin-top:3px">field: ' + esc2(item.via.f.label) + '</div>' : '') + '</td>'
    + '<td>' + esc2(d.domain) + '</td>'
    + '<td>' + catalogSysChip(d) + '</td>'
    + '<td>' + certBadge(d) + '</td>'
    + '<td>' + sensBadge(d.sens) + '</td>'
    + '<td>' + bdg(catalogAccessLabel(d, st), a.cls, a.ico)
      + (st === "none" ? ' <button class="btn sm" onclick="event.stopPropagation();requestAccessModal(\'' + d.id + '\')">Request</button>' : '') + '</td>'
    + '<td>' + esc2(d.refreshed) + '</td>'
    + '<td class="num">' + fmt(d.users) + '</td>'
    + '<td class="num">#' + d.rank + '</td></tr>';
}

/* ---------- suggested ---------- */
function catalogSuggested(){
  var v = viewer(), team = v.team || ME.team;
  var mine = DATASETS.filter(function(d){ return d.domain === team && d.cert !== "blocked" && d.cert !== "deprecated"; });
  var rest = DATASETS.filter(function(d){ return mine.indexOf(d) < 0 && d.cert === "verified"; });
  var by = function(a, b){ return b.popularity - a.popularity; };
  return mine.sort(by).concat(rest.sort(by)).slice(0, 3);
}
function catalogSuggestHTML(){
  var v = viewer();
  return '<div class="g3">' + catalogSuggested().map(function(d){
    return '<div class="pickcard" onclick="openDataset(\'' + d.id + '\')">'
      + '<div class="pi">' + I2.spark + '</div>'
      + '<div style="min-width:0"><div class="pn2">' + esc2(d.name) + '</div>'
      + '<div class="pd2">' + esc2(CATALOG_WHY[d.id] || (fmt(d.users) + " people in " + d.domain + " use this.")) + '</div>'
      + '<div class="rowflex" style="gap:6px;margin-top:9px">' + certBadge(d) + bdg(CATALOG_ACCESS[catalogAccessState(d)].label, CATALOG_ACCESS[catalogAccessState(d)].cls) + '</div></div></div>';
  }).join("") + '</div>'
  + '<div class="mutedtext" style="margin-top:12px;font-size:12.5px">Picked from what ' + esc2(v.team || ME.team)
  + ' asks about, and from what ' + (SIM ? esc2(SIM.name.split(" ")[0]) : "you") + ' opened last. Nothing here widens access — every card still opens under ' + (SIM ? "their" : "your") + ' own permissions.</div>';
}

/* ---------- interaction ---------- */
function catalogSearch(v){ CATALOG_STATE.q = v; catalogPaint(); }
function catalogFacet(fi, oi, on){
  var f = CATALOG_FACETS[fi], val = f.opts[oi], arr = CATALOG_STATE[f.key], i = arr.indexOf(val);
  if(on && i < 0) arr.push(val);
  if(!on && i >= 0) arr.splice(i, 1);
  catalogPaint();
}
function catalogClear(){
  CATALOG_FACETS.forEach(function(f){ CATALOG_STATE[f.key] = []; });
  CATALOG_STATE.q = "";
  var box = $('#catalog-q'); if(box) box.value = "";
  catalogPaint(); toast("Filters cleared");
}
function catalogSort(v){ CATALOG_STATE.sort = v; catalogPaint(); }
function catalogView(v){
  CATALOG_STATE.view = v;
  document.querySelectorAll('#catalog-viewtog button').forEach(function(b){ b.classList.toggle('on', b.dataset.v === v); });
  catalogPaint();
}
function catalogAsk(id, i){
  var d = ds(id); if(!d) return;
  var q = (d.questions || [])[i]; if(!q) return;
  var a = CATALOG_ANSWER_MAP[q];
  if(a && typeof ANSWERS !== "undefined" && ANSWERS[a]) openFromCard(a); else askText(q);
}
function catalogRequestPicker(){
  var list = DATASETS.filter(function(d){ return catalogAccessState(d) !== "full"; });
  var rows = list.map(function(d){
    var st = catalogAccessState(d), a = CATALOG_ACCESS[st], blocked = st === "blocked";
    return '<div class="lrow"' + (blocked ? ' style="cursor:default"' : ' onclick="closeModal();requestAccessModal(\'' + d.id + '\')"') + '>'
      + '<div class="li">' + I2[a.ico] + '</div>'
      + '<div class="lm"><div class="lt">' + esc2(d.name) + ' ' + bdg(a.label, a.cls) + '</div>'
      + '<div class="ls">' + esc2(d.accessNote) + '</div></div>'
      + '<div class="lr">' + (blocked ? '<span class="bdg crit">Not requestable</span>' : '<span class="btn sm">Request</span>') + '</div></div>';
  }).join("");
  openModal('<h3>Request access</h3><div class="msub">Access is granted to a group, never to one person — so a grant survives you changing job and disappears when you leave it. Your request goes to the dataset owner, and where the data is personal, to a privacy reviewer as well.</div>'
    + '<div class="panel"><div class="panel-b tight">' + (rows || emptyState("You already hold everything", "There is nothing left to request.", "check")) + '</div></div>'
    + modalFoot("Close"), 640);
}

/* ---------- paint ---------- */
function catalogPaint(){
  var base = catalogSearched();
  var list = catalogSorted(base.filter(function(x){ return catalogPassesFacets(x.d); }));
  var q = CATALOG_STATE.q.trim(), fieldHits = list.filter(function(x){ return x.via && x.via.kind === "field"; }).length;

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
      + list.map(catalogTableRow).join("") + '</tbody></table></div></div>';
  } else {
    out = '<div class="g3">' + list.map(catalogCard).join("") + '</div>';
  }
  $('#catalog-results').innerHTML = out;
}

/* ---------- route A ---------- */
function renderCatalog(){
  var st = CATALOG_STATE;
  $('#view-catalog').innerHTML =
    pageHead({
      eyebrow:"Data",
      title:"Data catalogue",
      desc:"Everything Spiff can answer questions about, and exactly what you are allowed to see of it.",
      acts:'<button class="btn pri" onclick="go(\'ask\')">' + I2.spark + ' Ask a question</button>'
        + '<button class="btn" onclick="catalogRequestPicker()">' + I2.unlock + ' Request access</button>'
        + '<div class="seg2" id="catalog-viewtog">'
        + '<button data-v="grid" class="' + (st.view === "grid" ? "on" : "") + '" onclick="catalogView(\'grid\')">' + I2.grid + ' Grid</button>'
        + '<button data-v="list" class="' + (st.view === "list" ? "on" : "") + '" onclick="catalogView(\'list\')">' + I2.list + ' List</button></div>'
    })
    + '<div class="bigsearch" style="margin-bottom:18px">' + I2.search
    + '<input id="catalog-q" value="' + esc2(st.q) + '" placeholder="Search datasets, fields and the words people actually use — “attendance”, “age”, “bookings”, “locality”…">'
    + '</div>'
    + '<div id="catalog-sug" style="margin-bottom:22px">'
    + panel("Suggested for you", catalogSuggestHTML(), {icon:"star", sub:esc2(viewer().title || ME.title)})
    + '</div>'
    + '<div class="split left">'
      + '<div id="catalog-facets"></div>'
      + '<div><div class="rowflex" style="margin-bottom:14px">'
        + '<div id="catalog-count" style="font-size:13px;color:var(--muted)"></div><div class="sp"></div>'
        + '<label style="font-size:12px;color:var(--muted)">Sort</label>'
        + '<select onchange="catalogSort(this.value)" style="border:1px solid var(--hair);background:var(--surface);border-radius:9px;padding:6px 10px;font:inherit;font-size:13px;color:var(--ink)">'
        + '<option value="used"' + (st.sort === "used" ? " selected" : "") + '>Most used</option>'
        + '<option value="fresh"' + (st.sort === "fresh" ? " selected" : "") + '>Recently updated</option>'
        + '<option value="az"' + (st.sort === "az" ? " selected" : "") + '>A–Z</option>'
        + '<option value="trust"' + (st.sort === "trust" ? " selected" : "") + '>Trust</option>'
        + '</select></div>'
        + '<div id="catalog-results"></div></div>'
    + '</div>'
    + '<div style="margin-top:24px">'
    + callout("info", "<b>This page lists definitions, not data.</b> Every card above is a description of what exists — the counts, owners and freshness are the same for everyone. Open one and Spiff re-checks who you are, re-applies every rule, and shows only your slice. Two people can open the same dataset from the same link and see different rows. That is working as designed.", "shield")
    + '</div>'
    + '<div class="mutedtext" style="margin-top:12px;font-size:12px">'
    + DATASETS.length + ' datasets across ' + DOMAINS.length + ' domains and ' + SYSTEMS.length + ' source systems · '
    + '<span class="clickable" style="color:var(--accent)" onclick="go(\'glossary\')">See the agreed definitions</span> · '
    + '<span class="clickable" style="color:var(--accent)" onclick="go(\'myaccess\')">See everything you can reach</span></div>';

  var box = $('#catalog-q');
  box.addEventListener('input', function(){ catalogSearch(this.value); });
  box.addEventListener('keydown', function(e){ if(e.key === 'Escape') catalogClear(); });
  catalogPaint();
}
V2ROUTES.catalog = renderCatalog;

/* =====================================================================
   ROUTE B — Definitions
   ===================================================================== */
function catalogHay(d){
  return [d.name, d.tech, d.purpose, d.grain, d.population, d.coverage, d.exclusions, d.domain]
    .concat((d.fields||[]).map(function(f){ return f.label + " " + f.desc + " " + (f.glossary || ""); }))
    .join(" ").toLowerCase();
}
function catalogTermDatasets(term){
  var words = term.toLowerCase().split(/\s+/);
  return DATASETS.filter(function(d){
    if(d.cert === "blocked") return false;
    if((d.fields||[]).some(function(f){ return f.glossary === term; })) return true;
    var h = catalogHay(d);
    return words.every(function(w){ return h.indexOf(w) >= 0; });
  });
}
function catalogGlossSearch(v){ CATALOG_STATE.gq = v; catalogGlossPaint(); }
function catalogProposeModal(term){
  var g = GLOSSARY.filter(function(x){ return x.term === term; })[0] || GLOSSARY[0];
  openModal('<h3>Propose a change · ' + esc2(g.term) + '</h3>'
    + '<div class="msub">One definition, one owner. Anyone can propose; only ' + esc2(g.owner) + ' can agree it. Until they do, every answer keeps using version ' + g.version + '.</div>'
    + '<div class="defblock" style="margin-bottom:16px">' + esc2(g.def) + '</div>'
    + '<div class="field"><label>Proposed wording</label><div class="fcontrol"><textarea id="gl-wording" rows="4" placeholder="Write the definition as you believe it should read.">' + esc2(g.def) + '</textarea></div></div>'
    + '<div class="field"><label>Why it needs to change</label><div class="fcontrol"><textarea id="gl-why" rows="3" placeholder="e.g. Two localities are counting cancelled meetings differently, and the totals disagree by 4%."></textarea></div></div>'
    + callout("warn", "Changing this definition changes <b>" + g.used + " places</b> at once — every dataset, saved answer and automation that uses it. " + esc2(g.owner) + " sees the impact list in their Inbox before signing off, and the version number moves to " + (g.version + 1) + ".", "warn")
    + modalFoot("Cancel", "Send to " + g.owner.split(" ")[0], "catalogProposeSend('" + esc2(g.term).replace(/'/g, "\\'") + "')"), 620);
}
function catalogGlossPaint(){
  var q = (CATALOG_STATE.gq || "").trim().toLowerCase();
  var list = GLOSSARY.filter(function(g){
    return !q || g.term.toLowerCase().indexOf(q) >= 0 || g.def.toLowerCase().indexOf(q) >= 0 || g.owner.toLowerCase().indexOf(q) >= 0;
  });
  if(!list.length){
    $('#gloss-list').innerHTML = '<div class="panel"><div class="panel-b">'
      + emptyState("No definition for that yet", "If your team argues about a word often enough, it belongs here. Propose it and a steward will take it.", "book")
      + '<div class="rowflex" style="justify-content:center"><button class="btn pri" onclick="catalogProposeModal(\'' + esc2(GLOSSARY[0].term) + '\')">' + I2.plus + ' Propose a definition</button></div></div></div>';
    return;
  }
  $('#gloss-list').innerHTML = listFrame("gloss", {
    items: list, repaint: catalogGlossPaint, noun: "definitions", noun1: "definition", size: 10,
    sorts: [{key:"term",   label:"A–Z",             get:function(g){ return g.term; }},
            {key:"agreed", label:"Recently agreed",  get:function(g){ return catalogDateKey(g.agreed); }, desc:true},
            {key:"used",   label:"Most used",        get:function(g){ return g.used; }, desc:true},
            {key:"owner",  label:"Owner",            get:function(g){ return g.owner; }}],
    row: catalogGlossCard,
    emptyTitle: "No definition for that yet", emptyIcon: "book"
  });
}
/* a definition retires. Everything already published under its version keeps
   saying that version — retiring changes nothing that has already been said. */
function catalogRetireAsk(term){
  var g = GLOSSARY.filter(function(x){ return x.term === term; })[0]; if(!g) return;
  confirmAsk({title:'Retire the definition “'+esc2(g.term)+'”?',
    body:'It stops being offered for new answers. The '+g.used+' places that quote version '+g.version+' keep saying version '+g.version+' — nothing already published changes.',
    verb:'Retire', onConfirm:function(){ g.retired = true; toast('Retired — '+g.term); catalogGlossPaint(); }});
}
function catalogGlossCard(g){
    var used = catalogTermDatasets(g.term);
    var body = '<div class="defblock" style="margin-bottom:15px">' + esc2(g.def) + '</div>'
      + '<div class="rowflex" style="gap:18px;margin-bottom:15px">' + personChip(g.owner, "Owns this definition")
      + '<div class="sp"></div>' + bdg("Version " + g.version, "info")
      + bdg("Agreed " + g.agreed, "mut", "check") + bdg("In use in " + g.used + " places", "mut", "link") + '</div>'
      + '<div class="fh" style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:9px">'
      + 'Where it is used · ' + used.length + ' dataset' + (used.length === 1 ? '' : 's') + '</div>'
      + (used.length
        ? '<div class="chipbar">' + used.map(function(d){
            return '<button class="fchip2" onclick="openDataset(\'' + d.id + '\')">' + I2.db + esc2(d.name) + '</button>';
          }).join("") + '</div>'
        : '<div class="mutedtext" style="font-size:12.5px">No dataset carries this term yet — it is used in saved answers and automations only.</div>')
      + '<div class="mutedtext" style="font-size:12px;margin-top:12px">The remaining '
      + Math.max(0, g.used - used.length) + ' are saved answers, automations and dashboards that quote it.</div>';
    var menu = [{label:'Propose a change', icon:'pencil', onclick:"catalogProposeModal('" + esc2(g.term) + "')"}];
    if(!g.retired) menu.push({label:'Retire definition', icon:'archive', danger:true, onclick:"catalogRetireAsk('" + esc2(g.term) + "')"});
    return panel(esc2(g.term) + (g.retired ? ' ' + bdg("Retired", "mut") : ''), body, {
      icon:"book",
      act:'<button class="btn sm" onclick="catalogProposeModal(\'' + esc2(g.term) + '\')">' + I2.pencil + ' Propose a change</button>' + kebabHTML(menu)
    });
}
function renderGlossary(){
  var recent = GLOSSARY.slice().sort(function(a, b){ return catalogDateKey(b.agreed) - catalogDateKey(a.agreed); }).slice(0, 3);
  $('#view-glossary').innerHTML =
    pageHead({
      eyebrow:"Data",
      title:"Definitions",
      desc:"The words behind the numbers. One definition per term, one named owner, one version — so two people asking the same question in two localities get the same arithmetic.",
      acts:'<button class="btn pri" onclick="catalogProposeModal(\'' + esc2(GLOSSARY[0].term) + '\')">' + I2.plus + ' Propose a change</button>'
        + '<button class="btn" onclick="go(\'catalog\')">' + I2.db + ' Data catalogue</button>'
    })
    + callout("info", "<b>Most reporting arguments are vocabulary arguments.</b> Someone counts a cancelled meeting, someone else does not, and the two reports disagree by four percent for a year. Every term below is agreed once, owned by a person, versioned, and used by every answer Spiff gives — so the disagreement happens here, in the open, and then stops.", "book")
    + '<div class="split" style="margin-top:20px">'
      + '<div>'
        + '<div class="bigsearch" style="margin-bottom:16px">' + I2.search
        + '<input id="gloss-q" value="' + esc2(CATALOG_STATE.gq) + '" placeholder="Search a term, a definition, or an owner…"></div>'
        + '<div id="gloss-list" class="stack"></div>'
      + '</div>'
      + '<div class="stack">'
        + panel("Recent changes", '<div class="tline">' + recent.map(function(g){
            return '<div class="tev"><div class="td3 ok"></div>'
              + '<div class="tt2">' + esc2(g.term) + ' · version ' + g.version + '</div>'
              + '<div class="ts2">' + esc2(CATALOG_CHANGES[g.term] || "Definition agreed and published.") + '</div>'
              + '<div class="tw">' + esc2(g.agreed) + ' · ' + esc2(g.owner) + '</div></div>';
          }).join("") + '</div>', {icon:"clock", sub:"last 3"})
        + panel("How a change lands", '<div class="kvlist">'
            + '<div class="r"><span class="k">1 · Anyone proposes</span><span class="v">no approval needed</span></div>'
            + '<div class="r"><span class="k">2 · Owner sees the impact</span><span class="v">every place it is used</span></div>'
            + '<div class="r"><span class="k">3 · Owner agrees or declines</span><span class="v">named, dated</span></div>'
            + '<div class="r"><span class="k">4 · Version increments</span><span class="v">old answers keep their version</span></div>'
            + '</div>'
            + '<div class="mutedtext" style="margin-top:12px;font-size:12.5px">An answer published under version 2 says so on its face. It does not silently become version 3 because someone edited a sentence six months later.</div>',
            {icon:"flow"})
        + panel("Owners", GLOSSARY.map(function(g){ return g.owner; }).filter(function(v, i, a){ return a.indexOf(v) === i; }).map(function(o){
            var n = GLOSSARY.filter(function(g){ return g.owner === o; }).length;
            return '<div class="lrow" onclick="openPerson(\'' + esc2(o) + '\')"><div class="lm">' + personChip(o, n + " definition" + (n === 1 ? "" : "s")) + '</div>'
              + '<div class="lr">' + I2.chev + '</div></div>';
          }).join(""), {icon:"people", tight:true})
      + '</div>'
    + '</div>';

  var gb = $('#gloss-q');
  gb.addEventListener('input', function(){ catalogGlossSearch(this.value); });
  catalogGlossPaint();
}
V2ROUTES.glossary = renderGlossary;
</script>
