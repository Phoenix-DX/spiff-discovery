<script>
/* =====================================================================
   SPIFF v2 — VIEW: Sources
   Route A  sources — everything Spiff has been pointed at, and how well
                      it understands each one.
   Route B  source  — one source: what it is, how it connects, what it
                      has been read for, and what came out.
   Registering a source is a governed act. It never grants access.
   ===================================================================== */

const SRCV = {q:"", kind:[], state:[], tab:"overview", id:null};

const SRCV_AUTH = {
  "run-as":          {label:"Runs as the asker",    cls:"ok",   ico:"shield",
    line:"Every read is issued under the identity of the person asking. Per-viewer scoping is proved by the source itself, not promised by Spiff.",
    conseq:"The source proves the scoping, so Spiff does not have to be taken on trust for it. Two people opening the same answer can get different rows, and the source's own log will say why."},
  "oauth-per-user":  {label:"Signed in per person", cls:"ok",   ico:"lock",
    line:"Each person authorises the source in their own name and Spiff holds their token, not a shared one. When a token expires, only that person's answers stop.",
    conseq:"The vendor's own audit trail names the individual, not Spiff. The cost is that everyone signs in once, and a lapsed sign-in stops that person's answers until they renew it."},
  "read-only-key":   {label:"Read-only key",        cls:"info", ico:"lock",
    line:"A read-only key scoped to one repository. It reads source code, never data — so there is no personal record for it to scope in the first place.",
    conseq:"There is no personal data on this connection at all, so there is nothing to scope. What it produces — rules and definitions — is then governed like everything else in the catalogue."},
  "service-account": {label:"Shared service account", cls:"crit", ico:"warn",
    line:"Spiff reads as one shared identity that can see everything. Per-viewer scoping cannot be proved here — Spiff re-applies it after the read, and the source's own logs show the service account, not the person who asked.",
    conseq:"Every dataset traced to this source carries the warning in the catalogue, and the exception is dated rather than open-ended. Spiff still re-checks permissions and still logs the person who asked — the source simply cannot corroborate it."}
};

const SRCV_GAP = {
  "assemble-db":  "Six tables added since June carry no comment and no code that reads them.",
  "connect-repo":"Two findings from the last read are still sitting with a person.",
  "directory-db": "Three schemas are denied at the connection, on purpose, and always will be.",
  "directory-repo":"A third of this repository is the pastoral module and is never opened.",
  "orbit-api":    "A spec describes shapes, not reasoning. There is no code and no dictionary on the UBT side of it.",
  "gst-docs":     "Six published documents read. Four more in the library are drafts and are skipped.",
  "stats-sheets": "Three workbooks will not open, and nothing from this source has been accepted yet.",
  "warehouse":    "Eleven marts have no description in schema.yml and no test to hold them to one.",
  "finance-erp":  "Nothing read at all. Two approvals outstanding."
};

/* datasets in the catalogue that no registered source explains */
const SRCV_ORPHANS = [
  ["properties","Loaded by hand in March 2024. Estates has never been registered, so nothing keeps it current."],
  ["budgets",   "Loaded by hand. Finance is the source awaiting approval below."],
  ["care",      "Never loaded, and never will be. Excluded from Spiff by policy."]
];

/* extra timeline events, beyond registration and scans */
const SRCV_TL = {
  "assemble-db":  [["18 Jun 2026","Scope widened","assemble.reporting views added by Pavitra Govender after the events rebuild.","ok"]],
  "connect-repo":[["29 Aug 2026","Two findings held","A meeting-type conflict and a low-confidence column comment were sent to Reneilwe Dlomo rather than accepted.","warn"],
                   ["14 Apr 2026","Definition published","Attendance v3 agreed by Rupert Mackenzie, sourced from this repository.","ok"]],
  "directory-db": [["02 Feb 2026","Exclusion locked","The three pastoral schemas were moved from a query filter to a connection-level deny by Cathleen Oberholzer. Fail-closed.","crit"]],
  "directory-repo":[["11 Sep 2026","Re-read triggered","The consent refactor merged to main at 09:07 and a scan started five minutes later.","info"]],
  "orbit-api":    [["24 Aug 2026","Token expired","Colette Marais's delegated Orbit token lapsed. Travel answers have been running on data from 11 August since.","warn"]],
  "gst-docs":     [["21 Aug 2026","Conflict raised","The dictionary's meeting-type wording was found to contradict the Connect code. Sent to the Data Stewards.","warn"]],
  "stats-sheets": [["29 Aug 2026","Read failed","Three of twelve workbooks could not be opened. Pavitra Govender was notified the same morning.","crit"]],
  "warehouse":    [["12 Aug 2026","Exception recorded","Platform Admins logged a time-bound exception for the shared service account, to be replaced with per-user key pairs by December.","warn"]],
  "finance-erp":  [["26 Aug 2026","Sent for approval","Brendan Jooste requested registration. Waiting on Adriaan de Villiers as Finance data owner and on a service-account exception.","mut"]]
};

/* ---------- small pieces ---------- */
function srcvVar(c){ return c === "mut" ? "var(--muted)" : "var(--" + c + ")"; }
function srcvBullets(arr, c){
  return '<div class="stack" style="gap:9px">' + arr.map(function(x){
    return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.5">'
      + '<i class="dotd" style="margin-top:7px;background:' + srcvVar(c) + '"></i><span>' + esc2(x) + '</span></div>';
  }).join("") + '</div>';
}
function srcvCovCls(n){ return n >= 85 ? "ok" : n >= 60 ? "" : n >= 40 ? "warn" : "crit"; }
function srcvStateBadge(s){ var st = SRC_STATE[s.state]; return '<span class="bdg ' + st.cls + '" title="' + esc2(st.note) + '"><i class="dotd"></i>' + esc2(st.label) + '</span>'; }
function srcvAuthBadge(s){ var a = SRCV_AUTH[s.auth.mode]; return '<span class="bdg ' + a.cls + '" title="' + esc2(s.auth.note) + '">' + (I2[a.ico] || '') + esc2(a.label) + '</span>'; }
function srcvKindBadge(s){ var k = srcKind(s.kind); return '<span class="bdg mut">' + (I2[k.icon] || '') + esc2(k.name) + '</span>'; }
function srcvYieldLine(s){
  var y = s.yield;
  if(!y.tables && !y.datasets && !y.rules && !y.definitions) return "Nothing read yet";
  var p = [];
  if(y.tables) p.push(fmt(y.tables) + " tables");
  if(y.datasets) p.push(y.datasets + " datasets");
  if(y.rules) p.push(y.rules + " rules");
  if(y.definitions) p.push(y.definitions + " definitions");
  return p.join(" · ");
}
function srcvScopeLine(s){
  var n = s.exclusions.length;
  return s.scope.length + " things in scope · " + n + " deliberately out" + (n ? " — " + s.exclusions[0].split(" — ")[0] : "");
}
function srcvIsAdmin(){ var r = viewer().roles || []; return r.indexOf("admin") >= 0 || r.indexOf("steward") >= 0; }
function srcvMayEdit(s){ return srcvIsAdmin() || viewer().name === s.owner; }
function srcvDenied(s, what){
  toast(what + " is for " + s.owner + " and the Platform Admins — a request has been sent to " + s.owner);
}
function srcvPendingCount(){ return FINDINGS.filter(function(f){ return f.status === "pending"; }).length; }

/* ---------- filtering ---------- */
function srcvMatch(s, q){
  if(!q) return true;
  q = q.toLowerCase();
  var hay = [s.name, s.location, s.vendor, s.owner, s.notes, srcKind(s.kind).name].join(" ").toLowerCase()
    + " " + s.scope.join(" ").toLowerCase() + " " + s.exclusions.join(" ").toLowerCase();
  return hay.indexOf(q) >= 0;
}
function srcvList(){
  return SOURCES_REG.filter(function(s){
    if(SRCV.kind.length && SRCV.kind.indexOf(s.kind) < 0) return false;
    if(SRCV.state.length && SRCV.state.indexOf(s.state) < 0) return false;
    return srcvMatch(s, SRCV.q.trim());
  });
}
function srcvToggle(key, val){
  var arr = SRCV[key], i = arr.indexOf(val);
  if(i < 0) arr.push(val); else arr.splice(i, 1);
  srcvPaint();
}
function srcvClear(){ SRCV.kind = []; SRCV.state = []; SRCV.q = ""; var b = $("#srcv-q"); if(b) b.value = ""; srcvPaint(); }
function srcvSearch(v){ SRCV.q = v; srcvPaint(); }

/* ---------- the list row ---------- */
function srcvRow(s){
  var k = srcKind(s.kind), st = SRC_STATE[s.state];
  var tint = st.cls === "ok" ? "" : ' style="background:var(--' + (st.cls === "mut" ? "hair2" : st.cls + "-soft") + ');color:' + srcvVar(st.cls) + '"';
  return '<div class="lrow" onclick="openSource(\'' + s.id + '\')">'
    + '<div class="li"' + tint + '>' + (I2[k.icon] || '') + '</div>'
    + '<div class="lm">'
      + '<div class="lt">' + esc2(s.name) + srcvStateBadge(s) + srcvAuthBadge(s) + '</div>'
      + '<div class="mono" style="font-size:11.5px;color:var(--muted);margin-top:4px">' + esc2(s.location) + '</div>'
      + '<div style="font-size:12.5px;color:var(--muted);margin-top:4px">' + esc2(k.name) + ' · ' + esc2(srcvScopeLine(s)) + '</div>'
      + (s.stateNote ? '<div style="font-size:12.5px;color:' + srcvVar(st.cls) + ';margin-top:6px;line-height:1.5">' + esc2(s.stateNote) + '</div>' : '')
    + '</div>'
    + '<div class="lr" style="flex-direction:column;align-items:flex-end;gap:6px;min-width:200px">'
      + '<div style="font-weight:600;color:var(--ink);font-size:12.5px">' + esc2(srcvYieldLine(s)) + '</div>'
      + '<div class="rowflex" style="gap:8px;flex-wrap:nowrap"><span class="mono" style="font-size:11.5px">' + s.coverage + '%</span>'
        + '<div style="width:96px">' + meter(s.coverage, srcvCovCls(s.coverage)) + '</div></div>'
      + '<div style="font-size:11.5px">Last read ' + esc2(s.lastScan) + '</div>'
    + '</div></div>';
}

/* ---------- side panels ---------- */
function srcvCoveragePanel(){
  var list = SOURCES_REG.slice().sort(function(a, b){ return a.coverage - b.coverage; });
  var body = list.map(function(s){
    return '<div class="clickable" onclick="openSource(\'' + s.id + '\')" style="padding:11px 16px;border-bottom:1px solid var(--hair2)">'
      + '<div class="rowflex" style="gap:8px;flex-wrap:nowrap"><div style="flex:1;min-width:0;font-size:13px;font-weight:600" class="trunc">' + esc2(s.name) + '</div>'
      + '<span class="mono" style="font-size:11.5px;color:var(--muted)">' + s.coverage + '%</span></div>'
      + '<div style="margin:6px 0 5px">' + meter(s.coverage, srcvCovCls(s.coverage)) + '</div>'
      + '<div style="font-size:12px;color:var(--muted);line-height:1.45">' + esc2(SRCV_GAP[s.id] || "") + '</div></div>';
  }).join("");
  return panel("What Spiff does not know yet", body, {
    icon:"eyeoff", tight:true,
    foot:"Worst first. Coverage is how much of what a source holds Spiff can explain — not how much it can read. A deliberate exclusion lowers it, and should."
  });
}
function srcvOrphanPanel(){
  var body = SRCV_ORPHANS.map(function(o){
    var d = ds(o[0]);
    return '<div class="lrow" onclick="openDataset(\'' + o[0] + '\')"><div class="li" style="background:var(--hair2);color:var(--muted)">' + I2.db + '</div>'
      + '<div class="lm"><div class="lt" style="font-size:13.5px">' + esc2(d ? d.name : o[0]) + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:3px;line-height:1.45">' + esc2(o[1]) + '</div></div></div>';
  }).join("");
  return panel("Not from any source", body, {icon:"warn", tight:true, sub:"3 of 15 datasets"});
}

/* ---------- route A ---------- */
function srcvPaint(){
  var list = srcvList(), any = SRCV.kind.length || SRCV.state.length || SRCV.q.trim();
  $("#srcv-chips").innerHTML =
    '<div class="chipbar">' + SRC_KINDS.map(function(k){
      var n = SOURCES_REG.filter(function(s){ return s.kind === k.id; }).length;
      return '<button class="fchip2' + (SRCV.kind.indexOf(k.id) >= 0 ? ' on' : '') + '" onclick="srcvToggle(\'kind\',\'' + k.id + '\')">'
        + (I2[k.icon] || '') + esc2(k.name) + ' <span class="mono">' + n + '</span></button>';
    }).join("")
    + '<span style="width:14px"></span>'
    + Object.keys(SRC_STATE).map(function(id){
      var n = SOURCES_REG.filter(function(s){ return s.state === id; }).length;
      if(!n) return "";
      return '<button class="fchip2' + (SRCV.state.indexOf(id) >= 0 ? ' on' : '') + '" onclick="srcvToggle(\'state\',\'' + id + '\')">'
        + esc2(SRC_STATE[id].label) + ' <span class="mono">' + n + '</span></button>';
    }).join("")
    + (any ? '<button class="fchip2" onclick="srcvClear()">' + I2.x + 'Clear</button>' : '')
    + '</div>';

  $("#srcv-count").innerHTML = '<b>' + list.length + '</b> of ' + SOURCES_REG.length + ' sources'
    + (SRCV.q.trim() ? ' matching “' + esc2(SRCV.q.trim()) + '”' : '')
    + ' · ' + srcvPendingCount() + ' findings across the estate are still waiting on a person';

  $("#srcv-list").innerHTML = list.length
    ? panel("Registered sources", listFrame("sources", {
          items: list, repaint: srcvPaint, noun: "sources", noun1: "source", size: 10,
          sorts: [{key:"name",   label:"Name",                 get:function(s){ return s.name; }},
                  {key:"health", label:"Needs attention first", get:function(s){ var r={"error":0,"needs-reauth":1,"pending-approval":2,"scanning":3,"connected":4}; return r[s.state]==null?9:r[s.state]; }},
                  {key:"cov",    label:"Best understood first", get:function(s){ return s.coverage||0; }, desc:true},
                  {key:"scan",   label:"Most recently read",    get:function(s){ return catalogDateKey(s.lastScan||""); }, desc:true},
                  {key:"kind",   label:"Kind",                 get:function(s){ return s.kind; }}],
          row: srcvRow
        }), {icon:"grid", tight:true})
    : panel("", emptyState("Nothing matches that", "Try a system name, a vendor, or a word from the scope — “pastoral”, “migrations”, “Snowflake”.", "search")
        + '<div class="rowflex" style="justify-content:center"><button class="btn" onclick="srcvClear()">' + I2.refresh + 'Clear filters</button></div>', {});
}

function renderSources(){
  var connected = SOURCES_REG.filter(function(s){ return s.state === "connected"; }).length;
  var live = SOURCES_REG.filter(function(s){ return s.state !== "pending-approval"; });
  var avg = Math.round(live.reduce(function(a, s){ return a + s.coverage; }, 0) / live.length);
  var attention = SOURCES_REG.filter(function(s){ return s.state === "error" || s.state === "needs-reauth" || s.state === "pending-approval"; }).length;
  var tot = function(k){ return SOURCES_REG.reduce(function(a, s){ return a + s.yield[k]; }, 0); };

  $("#view-sources").innerHTML =
    pageHead({
      eyebrow:"Data",
      title:"Sources",
      desc:"Spiff only knows what it has been pointed at. This is everything it has been pointed at, and how well it understands each one.",
      acts:'<button class="btn pri" onclick="registerSourceWizard()">' + I2.plus + 'Register a source</button>'
        + '<button class="btn" onclick="go(\'catalog\')">' + I2.db + 'Data catalogue</button>'
    })
    + '<div class="g4" style="margin-bottom:18px">'
      + kpi("Sources connected", connected + ' <span style="font-size:15px;color:var(--muted)">of ' + SOURCES_REG.length + '</span>',
          "1 scanning · 1 needs re-authorising · 1 failing · 1 awaiting approval")
      + kpi("Datasets described", tot("datasets") + ' <span style="font-size:15px;color:var(--muted)">datasets</span>',
          fmt(tot("tables")) + " tables · " + fmt(tot("fields")) + " fields · " + tot("rules") + " rule traces · " + tot("definitions") + " definition traces")
      + kpi("Coverage", avg + '%',
          meter(avg, srcvCovCls(avg)) + '<div style="margin-top:5px">Across the eight sources that are actually connected.</div>')
      + kpi("Needs attention", attention + " sources",
          srcvPendingCount() + " findings are waiting on a named person before they can enter the catalogue")
    + '</div>'
    + '<div class="bigsearch" style="margin-bottom:14px">' + I2.search
      + '<input id="srcv-q" value="' + esc2(SRCV.q) + '" placeholder="Search sources, vendors, hosts, repositories and what is in or out of scope…"></div>'
    + '<div id="srcv-chips" style="margin-bottom:14px"></div>'
    + '<div class="split">'
      + '<div><div id="srcv-count" style="font-size:13px;color:var(--muted);margin-bottom:12px"></div><div id="srcv-list"></div></div>'
      + '<div>' + srcvCoveragePanel() + srcvOrphanPanel() + '</div>'
    + '</div>'
    + '<div style="margin-top:22px">'
    + callout("info", "<b>Registering a source grants nobody anything.</b> It lets Spiff read the source to work out what the data means — the tables, the rules in the code, the definitions in the documents. Whether a particular person may see a particular row is decided every time they ask, by their own permissions and by the rules in force. A source can be fully understood and still return nothing at all to someone who is not entitled to it.", "shield")
    + '</div>'
    + '<div class="mutedtext" style="margin-top:12px;font-size:12px">'
    + SOURCES_REG.length + ' sources across ' + SRC_KINDS.length + ' kinds · '
    + SCANS.length + ' understanding runs on record · '
    + '<span class="clickable" style="color:var(--accent)" onclick="go(\'rules\')">the rules they produced</span> · '
    + '<span class="clickable" style="color:var(--accent)" onclick="go(\'glossary\')">the definitions they produced</span></div>';

  var box = $("#srcv-q");
  box.addEventListener("input", function(){ srcvSearch(this.value); });
  box.addEventListener("keydown", function(e){ if(e.key === "Escape") srcvClear(); });
  srcvPaint();
  crumbTrail([["Sources", null]]);
}
V2ROUTES.sources = renderSources;

/* ---------- route B: one source ---------- */
function openSource(id, tab){ go("source", {id:id, tab:tab}); }

function srcvScanNow(id){
  var s = srcById(id);
  if(s.state === "pending-approval") return toast("Nothing can be read until " + s.owner + " approves the registration");
  if(s.state === "needs-reauth") return toast("Reconnect first — the sign-in behind " + s.name + " expired on 24 Aug");
  var sc = scansFor(id)[0];
  if(V2ROUTES.understand && sc) return go("understand", {scanId:sc.id});
  toast("A read of " + s.name + " is queued. Findings go to the review queue, not into the catalogue");
}
function srcvOpenScan(scanId){
  if(V2ROUTES.understand) return go("understand", {scanId:scanId});
  var sc = SCANS.filter(function(x){ return x.id === scanId; })[0];
  var f = findingsFor(scanId);
  toast(sc.label + " — " + f.length + " findings, " + f.filter(function(x){ return x.status === "pending"; }).length + " still waiting on a person");
}

function srcvOverview(s){
  var k = srcKind(s.kind), y = s.yield;
  return '<div class="split" style="margin-top:18px">'
    + '<div>'
      + panel("What this is", '<div style="font-size:14px;line-height:1.65">' + esc2(s.notes) + '</div>'
          + '<div class="hairline"></div>'
          + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700;margin-bottom:7px">What Spiff reads from a ' + esc2(k.name.toLowerCase()) + '</div>'
          + '<div class="defblock">' + esc2(k.reads) + '</div>', {icon:k.icon})
      + '<div class="g2" style="margin-top:14px">'
        + '<div>' + panel("In scope", srcvBullets(s.scope, "ok"), {icon:"check", sub:s.scope.length + ""}) + '</div>'
        + '<div>' + panel("Deliberately excluded", srcvBullets(s.exclusions, "crit"), {icon:"eyeoff", sub:s.exclusions.length + ""}) + '</div>'
      + '</div>'
    + '</div>'
    + '<div>'
      + panel("What it yielded", '<div class="kvlist">'
          + '<div class="r"><span class="k">Tables and views</span><span class="v mono">' + fmt(y.tables) + '</span></div>'
          + '<div class="r"><span class="k">Fields described</span><span class="v mono">' + fmt(y.fields) + '</span></div>'
          + '<div class="r"><span class="k">Datasets in the catalogue</span><span class="v mono">' + y.datasets + '</span></div>'
          + '<div class="r"><span class="k">Business rules traced here</span><span class="v mono">' + y.rules + '</span></div>'
          + '<div class="r"><span class="k">Agreed definitions</span><span class="v mono">' + y.definitions + '</span></div>'
          + '</div><div class="hairline"></div>'
          + '<div class="rowflex" style="gap:14px">' + ring(s.coverage, srcvCovCls(s.coverage))
          + '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px">Understood</div>'
          + '<div style="font-size:12.5px;color:var(--muted);line-height:1.45;margin-top:3px">' + esc2(SRCV_GAP[s.id] || "") + '</div></div></div>', {icon:"trend"})
      + panel("Ownership", '<div class="kvlist">'
          + '<div class="r"><span class="k">Source owner</span><span class="v">' + esc2(s.owner) + '</span></div>'
          + '<div class="r"><span class="k">Registered by</span><span class="v">' + esc2(s.addedBy) + '</span></div>'
          + '<div class="r"><span class="k">Registered on</span><span class="v">' + esc2(s.added) + '</span></div>'
          + '<div class="r"><span class="k">Next read</span><span class="v">' + esc2(s.nextScan) + '</span></div>'
          + '</div>', {icon:"people"})
    + '</div></div>';
}

function srcvConnection(s){
  var a = SRCV_AUTH[s.auth.mode], sys = s.system ? sysById(s.system) : null;
  var riskKind = s.auth.risk === "high" ? "crit" : s.auth.risk === "medium" ? "warn" : "ok";
  return '<div class="split" style="margin-top:18px">'
    + '<div>'
      + panel("Identity — who Spiff is when it reads this",
          '<div class="rowflex" style="gap:9px;margin-bottom:12px">' + srcvAuthBadge(s)
            + bdg(s.auth.risk === "high" ? "High risk" : s.auth.risk === "medium" ? "Medium risk" : "Low risk", riskKind, s.auth.risk === "low" ? "check" : "warn") + '</div>'
          + '<div class="kvlist" style="margin-bottom:13px"><div class="r"><span class="k">Reads as</span><span class="v">' + esc2(s.auth.who) + '</span></div></div>'
          + '<div style="font-size:14px;line-height:1.65">' + esc2(s.auth.note) + '</div>'
          + '<div style="margin-top:13px">' + callout(riskKind === "crit" ? "crit" : "ok", '<b>What this means in practice.</b> ' + esc2(a.conseq)) + '</div>'
          + (srcvMayEdit(s) ? '' : '<div class="mutedtext" style="margin-top:11px;font-size:12.5px">You are looking at this as '
              + esc2(viewer().name) + ', who is neither the source owner nor a Platform Admin. Everything here is readable; nothing here is editable by you.</div>'),
          {icon:"lock"})
      + panel("Where it is", '<div class="kvlist">'
          + '<div class="r"><span class="k">Vendor</span><span class="v">' + esc2(s.vendor) + '</span></div>'
          + '<div class="r"><span class="k">Host or repository</span><span class="v mono" style="font-size:12px">' + esc2(s.location) + '</span></div>'
          + '<div class="r"><span class="k">System of record</span><span class="v">' + (sys
              ? '<span class="bdg mut"><i class="dotd" style="background:' + sys.color + '"></i>' + esc2(sys.name) + '</span>'
              : '<span class="mutedtext">Not a system of record</span>') + '</span></div>'
          + '<div class="r"><span class="k">Kind</span><span class="v">' + esc2(srcKind(s.kind).name) + '</span></div>'
          + '</div>', {icon:"plug"})
    + '</div>'
    + '<div>'
      + panel("Health", '<div class="kvlist">'
          + '<div class="r"><span class="k">Uptime, 30 days</span><span class="v mono">' + esc2(s.health.uptime) + '</span></div>'
          + '<div class="r"><span class="k">Error rate</span><span class="v mono">' + esc2(s.health.errRate) + '</span></div>'
          + '<div class="r"><span class="k">Typical latency</span><span class="v mono">' + esc2(s.health.latency) + '</span></div>'
          + '<div class="r"><span class="k">Last read</span><span class="v">' + esc2(s.lastScan) + '</span></div>'
          + '</div>'
          + (s.stateNote ? '<div style="margin-top:12px">' + callout(SRC_STATE[s.state].cls === "mut" ? "mut" : SRC_STATE[s.state].cls, '<b>' + esc2(SRC_STATE[s.state].label) + '.</b> ' + esc2(s.stateNote)) + '</div>' : '')
          + '<div class="rowflex" style="margin-top:13px">'
          + '<button class="btn' + (s.state === "needs-reauth" ? " pri" : "") + '" onclick="' + (srcvMayEdit(s)
              ? 'toast(\'Reconnecting — the person who owns the sign-in has to complete it\')'
              : 'srcvDenied(srcById(\'' + s.id + '\'),\'Reconnecting\')') + '">' + I2.refresh + 'Reconnect</button>'
          + '<button class="btn ghost" onclick="toast(\'Connection test queued — it reads nothing, it only checks the door opens\')">' + I2.bolt + 'Test connection</button>'
          + '</div>', {icon:"trend"})
      + panel("What Spiff will never do with this source",
          srcvBullets(["Write to it, in any circumstance","Copy it wholesale into another store","Read anything on the exclusion list","Answer for a person from a cache instead of re-checking their permissions"], "crit"),
          {icon:"shield"})
    + '</div></div>';
}

function srcvUnderstanding(s){
  var scans = scansFor(s.id);
  var stat = {complete:["Complete","ok"], running:["Running","info"], "needs-review":["Needs review","warn"], failed:["Failed","crit"]};
  var rows = scans.map(function(sc){
    var f = findingsFor(sc.id), pend = f.filter(function(x){ return x.status === "pending"; }).length;
    return '<tr class="clk" onclick="srcvOpenScan(\'' + sc.id + '\')">'
      + '<td><div style="font-weight:600;white-space:normal;max-width:260px">' + esc2(sc.label) + '</div><div class="tech" style="white-space:normal">' + esc2(sc.trigger) + ' · ' + esc2(sc.by) + '</div></td>'
      + '<td>' + esc2(sc.startedAt) + '</td>'
      + '<td><div style="max-width:300px;white-space:normal;font-size:12.5px;line-height:1.5">' + esc2(sc.read.map(function(r){ return r.kind + " " + fmt(r.count); }).join(" · ")) + '</div></td>'
      + '<td class="num">' + (sc.proposed.datasets + sc.proposed.rules + sc.proposed.definitions + sc.proposed.joins) + '</td>'
      + '<td class="num">' + sc.accepted + '</td>'
      + '<td class="num">' + (pend ? '<span style="color:var(--warn);font-weight:700">' + pend + '</span>' : "0") + '</td>'
      + '<td>' + bdg(stat[sc.status][0], stat[sc.status][1]) + '</td>'
      + '<td class="num">' + esc2(sc.duration) + '</td></tr>';
  }).join("");
  return '<div style="margin-top:18px">'
    + panel("Understanding runs", scans.length
        ? '<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Run</th><th>Started</th><th>What it opened</th>'
          + '<th class="num">Proposed</th><th class="num">Accepted</th><th class="num">Pending</th><th>Status</th><th class="num">Took</th></tr></thead><tbody>'
          + rows + '</tbody></table></div>'
        : emptyState("This source has never been read", "Nothing has been proposed from it, and nothing traces to it in the catalogue.", "clock"),
        {icon:"spark", tight:!!scans.length, sub:scans.length ? scans.length + " on record" : "",
         act:'<button class="btn sm pri" onclick="srcvScanNow(\'' + s.id + '\')">' + I2.play + 'Scan now</button>'})
    + '<div style="margin-top:14px">'
    + callout("warn", "<b>A run proposes. A person decides.</b> Everything an understanding run finds — a grain, a join, a rule, a definition — lands in a review queue with its evidence attached. Nothing enters the catalogue until a named human accepts it, and whoever accepted it is recorded against it for as long as it stands.", "shield")
    + '</div></div>';
}

function srcvCollect(s){
  var got = FINDINGS.filter(function(f){ return f.sourceId === s.id && (f.status === "accepted" || f.status === "edited"); });
  var seen = {}, dsRows = [], ruleRows = [], defRows = [], openRows = [];
  if(s.yield.datasets && s.system){
    DATASETS.filter(function(d){ return d.sys === s.system && d.cert !== "blocked"; }).forEach(function(d){
      if(seen["d" + d.id]) return; seen["d" + d.id] = 1;
      dsRows.push('<div class="lrow" onclick="openDataset(\'' + d.id + '\')"><div class="li">' + I2.db + '</div>'
        + '<div class="lm"><div class="lt" style="font-size:13.5px">' + esc2(d.name) + certBadge(d) + '</div>'
        + '<div class="ls mono">' + esc2(d.tech) + '</div></div><div class="lr">' + I2.chev + '</div></div>');
    });
  }
  got.forEach(function(f){
    if(f.creates.kind === "rule"){
      var r = typeof ruleById === "function" ? ruleById(f.creates.target) : null;
      if(r && !seen["r" + r.id]){
        seen["r" + r.id] = 1;
        ruleRows.push('<div class="lrow" onclick="openRule(\'' + r.id + '\')"><div class="li">' + I2.shield + '</div>'
          + '<div class="lm"><div class="lt" style="font-size:13.5px">' + esc2(r.name) + '</div>'
          + '<div class="ls">Traced to ' + esc2(f.evidence[0].ref) + '</div></div><div class="lr">' + I2.chev + '</div></div>');
      } else if(!r){ openRows.push([f.creates.target, f.statement]); }
    } else if(f.creates.kind === "definition"){
      var g = GLOSSARY.filter(function(x){ return x.term === f.creates.target; })[0];
      if(g && !seen["g" + g.term]){
        seen["g" + g.term] = 1;
        defRows.push('<div class="lrow" onclick="go(\'glossary\')"><div class="li">' + I2.book + '</div>'
          + '<div class="lm"><div class="lt" style="font-size:13.5px">' + esc2(g.term) + bdg("v" + g.version, "mut") + '</div>'
          + '<div class="ls">' + esc2(g.def) + '</div></div><div class="lr">' + I2.chev + '</div></div>');
      } else if(!g){ openRows.push([f.creates.target, f.statement]); }
    } else if(f.creates.kind === "dataset"){
      var d2 = ds(f.creates.target);
      if(d2 && !seen["d" + d2.id]){
        seen["d" + d2.id] = 1;
        dsRows.push('<div class="lrow" onclick="openDataset(\'' + d2.id + '\')"><div class="li">' + I2.db + '</div>'
          + '<div class="lm"><div class="lt" style="font-size:13.5px">' + esc2(d2.name) + certBadge(d2) + '</div>'
          + '<div class="ls">' + esc2(f.statement) + '</div></div><div class="lr">' + I2.chev + '</div></div>');
      } else if(!d2){ openRows.push([f.creates.target, f.statement]); }
    }
  });
  var pend = FINDINGS.filter(function(f){ return f.sourceId === s.id && f.status === "pending"; });
  return {dsRows:dsRows, ruleRows:ruleRows, defRows:defRows, openRows:openRows, pend:pend};
}
function srcvProducedCount(s){
  var c = srcvCollect(s);
  return c.dsRows.length + c.ruleRows.length + c.defRows.length;
}
function srcvProduced(s){
  var c = srcvCollect(s), dsRows = c.dsRows, ruleRows = c.ruleRows, defRows = c.defRows, openRows = c.openRows, pend = c.pend;
  return '<div style="margin-top:18px">'
    + (dsRows.length || ruleRows.length || defRows.length
      ? '<div class="g3">'
        + '<div>' + panel("Datasets", dsRows.join("") || '<div class="mutedtext" style="padding:14px">None. This source explains other people’s tables rather than owning any.</div>', {icon:"db", tight:!!dsRows.length, sub:dsRows.length + ""}) + '</div>'
        + '<div>' + panel("Business rules", ruleRows.join("") || '<div class="mutedtext" style="padding:14px">None accepted from this source yet.</div>', {icon:"shield", tight:!!ruleRows.length, sub:ruleRows.length + ""}) + '</div>'
        + '<div>' + panel("Definitions", defRows.join("") || '<div class="mutedtext" style="padding:14px">None accepted from this source yet.</div>', {icon:"book", tight:!!defRows.length, sub:defRows.length + ""}) + '</div>'
        + '</div>'
      : panel("", emptyState("Nothing from this source is in the catalogue", "Either it has not been read, or everything it proposed is still with a person.", "clock"), {}))
    + (openRows.length ? '<div style="margin-top:14px">' + panel("Proposed, not yet in the catalogue",
        '<div class="kvlist">' + openRows.map(function(o){
          return '<div class="r" style="align-items:flex-start"><span class="k" style="flex:1;text-align:left;line-height:1.5"><b style="color:var(--ink)">' + esc2(o[0]) + '</b> — ' + esc2(o[1]) + '</span></div>';
        }).join("") + '</div>', {icon:"pencil"}) + '</div>' : '')
    + (pend.length ? '<div style="margin-top:14px">' + callout("warn", '<b>' + pend.length + ' findings from this source are waiting on a person.</b> '
        + esc2(srcvAnd(pend.map(function(f){ return f.needs; }).filter(function(v, i, a){ return a.indexOf(v) === i; })))
        + ' must decide before any of it can be used in an answer.') + '</div>' : '')
    + '<div style="margin-top:14px">'
    + callout("mut", "Every item above carries a link back to the exact file, migration or page it came from. If somebody disputes a number, the argument is about the evidence, not about what the agent felt like doing that day.", "link")
    + '</div></div>';
}

function srcvDateKey(str){
  var m = /(\d{1,2}) (\w{3}) (\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(str || "");
  if(!m) return 9e15;
  var mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[2]);
  return Date.UTC(+m[3], mo < 0 ? 0 : mo, +m[1], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
}
function srcvAnd(a){
  return a.length < 2 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];
}
function srcvActivity(s){
  var ev = [];
  ev.push([s.added, "Registered", esc2(s.addedBy) + " registered this source. " + esc2(SRCV_AUTH[s.auth.mode].label)
    + " · " + s.scope.length + " things in scope, " + s.exclusions.length + " excluded.", "ok"]);
  scansFor(s.id).forEach(function(sc){
    var f = findingsFor(sc.id);
    ev.push([sc.startedAt, "Understanding run — " + esc2(sc.label),
      esc2(sc.trigger) + " · opened " + sc.read.reduce(function(a, r){ return a + r.count; }, 0) + " things · proposed "
      + (sc.proposed.datasets + sc.proposed.rules + sc.proposed.definitions + sc.proposed.joins) + " · " + sc.accepted + " accepted, " + f.filter(function(x){ return x.status === "pending"; }).length + " still open · " + esc2(sc.cost),
      sc.status === "failed" ? "crit" : sc.status === "running" ? "info" : sc.status === "needs-review" ? "warn" : "ok"]);
  });
  (SRCV_TL[s.id] || []).forEach(function(t){ ev.push([t[0], esc2(t[1]), esc2(t[2]), t[3]]); });
  ev.sort(function(a, b){ return srcvDateKey(b[0]) - srcvDateKey(a[0]); });
  var body = '<div class="tline">' + ev.map(function(e){
    return '<div class="tev"><div class="td3 ' + e[3] + '"></div>'
      + '<div class="tw">' + esc2(e[0]) + '</div>'
      + '<div class="tt2">' + e[1] + '</div>'
      + '<div class="ts2">' + e[2] + '</div></div>';
  }).join("") + '</div>';
  return '<div style="margin-top:18px">' + panel("Everything that has happened to this source", body, {
    icon:"log",
    foot:"Registration, approvals, reads, scope changes and failures. Who asked a question of the data lives in the activity log, not here."
  }) + '</div>';
}

function renderSource(arg){
  arg = arg || {};
  var s = srcById(arg.id || SRCV.id) || SOURCES_REG[0];
  if(s.id !== SRCV.id){ SRCV.id = s.id; SRCV.tab = arg.tab || "overview"; }
  if(arg.tab) SRCV.tab = arg.tab;
  if(!SRCV.tab) SRCV.tab = "overview";
  var k = srcKind(s.kind), st = SRC_STATE[s.state], scans = scansFor(s.id);

  var acts = (s.state === "pending-approval"
      ? (srcvMayEdit(s)
          ? '<button class="btn pri" onclick="toast(\'Approved — a first read starts now, and every finding still goes to a person before the catalogue\')">' + I2.check + 'Approve registration</button>'
          : '<button class="btn pri" onclick="toast(\'Nudged ' + dspArg(s.owner) + ' — it has been with them since ' + dspArg(s.added.replace(" (requested)", "")) + '\')">' + I2.msg + 'Chase the approval</button>')
      : '<button class="btn pri" onclick="srcvScanNow(\'' + s.id + '\')">' + I2.play + 'Scan now</button>')
    + '<button class="btn" onclick="' + (srcvMayEdit(s) ? 'toast(\'Scope editor opens here — changes take effect on the next read, never retrospectively\')' : 'srcvDenied(srcById(\'' + s.id + '\'),\'Editing scope\')') + '">' + I2.filter + 'Edit scope</button>'
    + (s.state === "needs-reauth" ? '<button class="btn" onclick="toast(\'' + dspArg(s.owner) + ' has to complete the sign-in — Spiff cannot do it on their behalf\')">' + I2.refresh + 'Reconnect</button>' : '')
    + '<button class="btn danger" onclick="' + (srcvMayEdit(s) ? 'toast(\'Removing a source does not remove what it taught Spiff — the datasets and rules stay, and start going stale\')' : 'srcvDenied(srcById(\'' + s.id + '\'),\'Removing a source\')') + '">' + I2.x + 'Remove</button>';

  var h = pageHead({
    eyebrow:"Source · " + k.name,
    title:esc2(s.name) + ' <span class="mono" style="font-size:14px;font-weight:400;color:var(--muted)">' + esc2(s.location) + '</span>',
    desc:esc2(k.desc),
    badges:srcvStateBadge(s) + srcvKindBadge(s) + srcvAuthBadge(s) + bdg(s.vendor, "purple", "plug") + bdg("Owned by " + s.owner, "mut", "people"),
    acts:acts, back:"go('sources')"
  });

  if(s.stateNote) h += callout(st.cls === "mut" ? "mut" : st.cls, '<b>' + esc2(st.label) + '.</b> ' + esc2(s.stateNote), st.cls === "ok" ? "shield" : "warn");
  if(s.auth.risk === "high" && s.state !== "pending-approval")
    h += '<div style="margin-top:12px">' + callout("crit", "<b>This source is read as a shared identity.</b> " + esc2(SRCV_AUTH[s.auth.mode].line) + " Answers built on it are still scoped by Spiff's own rules and still logged against the person who asked — but the source cannot corroborate that, and an auditor should know it.", "warn") + '</div>';

  var tabs = [["overview", "Overview"], ["connection", "Connection"], ["understanding", "Understanding", scans.length],
              ["produced", "What it produced", srcvProducedCount(s)], ["activity", "Activity"]];
  if(!tabs.some(function(t){ return t[0] === SRCV.tab; })) SRCV.tab = "overview";

  h += '<div style="margin-top:22px">' + tabsHTML("srctabs", tabs, SRCV.tab) + '</div>';
  h += pane("srctabs", "overview", srcvOverview(s), SRCV.tab === "overview");
  h += pane("srctabs", "connection", srcvConnection(s), SRCV.tab === "connection");
  h += pane("srctabs", "understanding", srcvUnderstanding(s), SRCV.tab === "understanding");
  h += pane("srctabs", "produced", srcvProduced(s), SRCV.tab === "produced");
  h += pane("srctabs", "activity", srcvActivity(s), SRCV.tab === "activity");

  $("#view-source").innerHTML = h;
  crumbTrail([["Sources", "go('sources')"], [esc2(s.name), null]]);
}
V2ROUTES.source = renderSource;

/* =====================================================================
   Register a source — five steps, all clickable
   ===================================================================== */
const SRCV_WIZ = {step:0, kind:"database", identity:"run-as", readonly:true, propose:true, scope:{}, reads:{}};
const SRCV_WIZ_STEPS = ["Kind", "Connect", "Scope", "Identity", "Understanding"];
const SRCV_WIZ_SCOPE = {
  database:["Tables and views","Primary and foreign keys","Check constraints and defaults","Stored procedures and functions","Column comments"],
  code:["Migrations","ORM models and entities","Validators and guards","Service logic","Tests","README and docs"],
  docs:["Published PDFs","Word documents","Tables inside documents","Page and section headings"],
  files:["Sheet and column headers","Cell values","Formulas and named ranges","Margin notes"],
  api:["The OpenAPI or GraphQL spec","Endpoint shapes","Enumerations and error contracts","Sample response shapes"]
};
const SRCV_WIZ_READS = ["Schema","Migrations","ORM models","Validators","Service logic","Tests","Documentation","Inline comments","Query logs"];
const SRCV_WIZ_NEVER = ["Write anything back to it","Copy it wholesale into another store","Read anything on the exclusion list","Send it to a model outside the UBT tenant","Answer from a cache without re-checking who is asking"];

function registerSourceWizard(){
  SRCV_WIZ.step = 0; SRCV_WIZ.kind = "database"; SRCV_WIZ.identity = "run-as";
  SRCV_WIZ.readonly = true; SRCV_WIZ.propose = true; SRCV_WIZ.scope = {}; SRCV_WIZ.reads = {};
  ["Schema", "Migrations", "ORM models", "Validators", "Service logic", "Documentation"].forEach(function(r){ SRCV_WIZ.reads[r] = true; });
  srcvWizOpen();
}
function srcvWizOpen(){ openModal(srcvWizHTML(), 720); }
function srcvWizGo(n){
  if(n < 0 || n > 4) return;
  SRCV_WIZ.step = n; srcvWizOpen();
}
function srcvWizPick(kind){ SRCV_WIZ.kind = kind; SRCV_WIZ.scope = {}; SRCV_WIZ.step = 1; srcvWizOpen(); }
function srcvWizIdentity(v){ SRCV_WIZ.identity = v; srcvWizOpen(); }
function srcvWizSet(bag, key, on){ SRCV_WIZ[bag][key] = on; }
function srcvWizFlag(k, on){ SRCV_WIZ[k] = on; srcvWizOpen(); }
function srcvWizFinish(){
  closeModal();
  toast("Registered — a first read starts now. Nothing enters the catalogue until a named person accepts it");
}

function srcvWizSteps(){
  return '<div class="steps">' + SRCV_WIZ_STEPS.map(function(n, i){
    return (i ? '<div class="bar" style="flex:1;min-width:12px"></div>' : '')
      + '<div class="st ' + (i === SRCV_WIZ.step ? "on" : i < SRCV_WIZ.step ? "done" : "") + '" style="flex:none">'
      + '<div class="sc">' + (i < SRCV_WIZ.step ? "✓" : (i + 1)) + '</div><div class="sn2">' + esc2(n) + '</div></div>';
  }).join("") + '</div>';
}
function srcvWizField(label, ph, val){
  return '<div class="field"><label>' + esc2(label) + '</label><div class="fcontrol">'
    + '<input placeholder="' + esc2(ph) + '" value="' + esc2(val || "") + '"></div></div>';
}
function srcvWizChecks(bag, items, note){
  return '<div class="facets"><div class="facet">' + items.map(function(x){
    var cur = SRCV_WIZ[bag][x];
    var on = bag === "scope" ? cur !== false : cur === true;
    return '<label><input type="checkbox"' + (on ? " checked" : "") + ' onchange="srcvWizSet(\'' + bag + '\',\'' + x.replace(/['"\\]/g, "") + '\',this.checked)"><span>' + esc2(x) + '</span></label>';
  }).join("") + '</div></div>' + (note ? '<div class="mutedtext" style="margin-top:10px;font-size:12.5px">' + esc2(note) + '</div>' : '');
}

function srcvWizBody(){
  var k = srcKind(SRCV_WIZ.kind);
  if(SRCV_WIZ.step === 0){
    return '<div class="msub">Pick what kind of thing this is. It changes what Spiff will open when it tries to understand it.</div>'
      + '<div class="stack">' + SRC_KINDS.map(function(x){
        return '<div class="pickcard' + (x.id === SRCV_WIZ.kind ? " on" : "") + '" onclick="srcvWizPick(\'' + x.id + '\')">'
          + '<div class="pi">' + (I2[x.icon] || '') + '</div><div style="min-width:0">'
          + '<div class="pn2">' + esc2(x.name) + '</div>'
          + '<div class="pd2">' + esc2(x.desc) + '</div>'
          + '<div class="pd2" style="margin-top:7px"><b>Spiff reads:</b> ' + esc2(x.reads) + '</div>'
          + '<div class="rowflex" style="gap:6px;margin-top:9px">' + x.examples.map(function(e){ return bdg(e, "mut"); }).join("") + '</div>'
          + '</div></div>';
      }).join("") + '</div>';
  }
  if(SRCV_WIZ.step === 1){
    var form;
    if(SRCV_WIZ.kind === "database")
      form = srcvWizField("Host", "gst-sql-prod.ubt.internal", "") + '<div class="g2">' + srcvWizField("Port", "1433", "1433") + srcvWizField("Database", "Assemble", "") + '</div>' + srcvWizField("Schemas", "dbo, ref, reporting", "");
    else if(SRCV_WIZ.kind === "code")
      form = srcvWizField("Repository URL", "github.com/UBT-global-software/assemble-api", "") + '<div class="g2">' + srcvWizField("Branch", "main", "main") + srcvWizField("Path filter", "src/**, db/migrations/**", "") + '</div>' + srcvWizField("Ignore", "vendor/**, node_modules/**, .github/**", "vendor/**, node_modules/**");
    else if(SRCV_WIZ.kind === "docs")
      form = srcvWizField("Site", "ubtgst.sharepoint.com/sites/gst-data", "") + srcvWizField("Library", "GST Data Governance", "") + srcvWizField("Only documents labelled", "Published", "Published");
    else if(SRCV_WIZ.kind === "files")
      form = '<div class="field"><label>Files</label>'
        + '<div class="pickcard" style="border-style:dashed;justify-content:center;text-align:center" onclick="toast(\'A file picker opens here — nothing is uploaded in this mockup\')">'
        + '<div class="pi">' + I2.down + '</div><div><div class="pn2">Drop workbooks and PDFs here</div>'
        + '<div class="pd2">Or point Spiff at a folder and it will re-read it on a schedule.</div></div></div></div>'
        + '<div class="kvlist" style="margin-top:12px">'
        + [["Monthly Returns 2026.xlsx", "1.8 MB · 9 sheets"], ["Monthly Returns 2025.xlsx", "1.7 MB · 9 sheets"], ["Locality Reference.xlsx", "212 KB · 2 sheets"]].map(function(f){
            return '<div class="r"><span class="k">' + I2.file + ' ' + esc2(f[0]) + '</span><span class="v mono" style="font-weight:400;color:var(--muted);font-size:12px">' + esc2(f[1]) + '</span></div>';
          }).join("") + '</div>';
    else
      form = srcvWizField("Base URL", "https://api.orbit-travel.co.za/v2", "") + srcvWizField("Specification", "https://api.orbit-travel.co.za/v2/openapi.json", "") + srcvWizField("Rate limit to respect", "60 requests a minute", "60 requests a minute");
    return '<div class="msub">Where does it live? Spiff needs to reach it before it can read it — and it will only ever read.</div>' + form
      + callout("mut", "Credentials are held in the UBT tenant's own secret store. Spiff never sees them in a prompt and never writes them into an answer.", "lock");
  }
  if(SRCV_WIZ.step === 2){
    return '<div class="msub">What is Spiff allowed to look at inside this source? Everything not ticked is never opened.</div>'
      + srcvWizChecks("scope", SRCV_WIZ_SCOPE[SRCV_WIZ.kind], "")
      + '<div class="field" style="margin-top:18px"><label>Never read these, whatever else changes</label><div class="fcontrol">'
      + '<textarea rows="4">pastoral, care_note, safeguarding, counselling\npayment, card, bank_account\nfree-text notes on a person</textarea></div></div>'
      + callout("crit", "<b>Pastoral and safeguarding material is excluded by default.</b> These exclusions are applied at the connection, not in the query, so a mistake fails loudly instead of quietly returning something it should not. Removing one is a decision the Safeguarding Lead has to sign.", "lock");
  }
  if(SRCV_WIZ.step === 3){
    var runas = SRCV_WIZ.identity === "run-as";
    return '<div class="msub">Who is Spiff when it reads this source? This is the most consequential choice on the form.</div>'
      + '<div class="stack">'
      + '<div class="pickcard' + (runas ? " on" : "") + '" onclick="srcvWizIdentity(\'run-as\')"><div class="pi">' + I2.shield + '</div><div>'
        + '<div class="pn2">Read as the person asking</div>'
        + '<div class="pd2">Every query carries the identity of whoever asked. If they cannot see a row in the source, Spiff cannot see it for them. The source itself proves the scoping and its own logs name the person.</div>'
        + '<div class="pd2" style="margin-top:7px"><b>The cost:</b> the source has to support delegated identity, and each person signs in once.</div></div></div>'
      + '<div class="pickcard' + (!runas ? " on" : "") + '" onclick="srcvWizIdentity(\'service-account\')"><div class="pi">' + I2.warn + '</div><div>'
        + '<div class="pn2">Read as one shared service account</div>'
        + '<div class="pd2">Spiff connects once, as itself, and can see everything. Scoping is then re-applied by Spiff after the read rather than proved by the source, and the source’s logs show the service account instead of the person.</div>'
        + '<div class="pd2" style="margin-top:7px"><b>The cost:</b> you are trusting Spiff’s word for who saw what. Needs a Platform Admin exception and a review date.</div></div></div>'
      + '</div>'
      + '<div class="swrow" style="margin-top:16px"><div class="sl"><div class="sn">Read-only, asserted</div>'
      + '<div class="sd">The credential is read-only and Spiff refuses to start if it turns out to have write rights.</div></div>'
      + sw(SRCV_WIZ.readonly, "srcvWizFlag('readonly'," + (!SRCV_WIZ.readonly) + ")") + '</div>'
      + '<div style="margin-top:14px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700;margin-bottom:8px">What Spiff will never do with this source</div>'
      + srcvBullets(SRCV_WIZ_NEVER, "crit") + '</div>'
      + (runas ? "" : '<div style="margin-top:14px">' + callout("crit", "<b>Per-viewer scoping cannot be proved for a shared account.</b> Spiff will still re-check permissions and still log the person who asked — but the source cannot corroborate it. Say so on every dataset that comes from here.", "warn") + '</div>');
  }
  return '<div class="msub">What should the first read open, and how far should it go?</div>'
    + srcvWizChecks("reads", SRCV_WIZ_READS, "A schema tells you what a column is. The code tells you what it means. Reading both is what turns a table into something a person can ask a question of.")
    + '<div class="stack" style="margin-top:16px">'
    + '<div class="pickcard' + (SRCV_WIZ.propose ? " on" : "") + '" onclick="srcvWizFlag(\'propose\',true)"><div class="pi">' + I2.spark + '</div><div>'
      + '<div class="pn2">Propose datasets, rules and definitions</div>'
      + '<div class="pd2">Spiff reads for meaning: the grain, the joins, the rules hidden in service logic, the definitions written in the documents. Each one arrives as one plain sentence with its evidence attached.</div></div></div>'
    + '<div class="pickcard' + (!SRCV_WIZ.propose ? " on" : "") + '" onclick="srcvWizFlag(\'propose\',false)"><div class="pi">' + I2.grid + '</div><div>'
      + '<div class="pn2">Map the structure only</div>'
      + '<div class="pd2">Tables, columns, types and keys. Nothing about meaning, nothing proposed, nothing to review. Useful when you are registering something you already understand.</div></div></div>'
    + '</div>'
    + '<div style="margin-top:16px">' + callout("info", "<b>What happens when you finish.</b><div style=\"margin-top:6px\">1 — A read starts now and takes a few minutes.<br>2 — Everything it works out goes to a review queue as one plain sentence with the file, migration or page it came from.<br>3 — Nothing enters the catalogue, and nothing can be used in an answer, until a named person accepts it. Their name stays on it.</div>", "shield") + '</div>';
}

function srcvWizHTML(){
  var last = SRCV_WIZ.step === 4;
  return '<h3>Register a source</h3>'
    + srcvWizSteps()
    + '<div style="max-height:56vh;overflow-y:auto;margin:0 -4px;padding:0 4px">' + srcvWizBody() + '</div>'
    + '<div class="mfoot">'
    + (SRCV_WIZ.step > 0 ? '<button class="btn" onclick="srcvWizGo(' + (SRCV_WIZ.step - 1) + ')">' + I2.back + 'Back</button>' : '<button class="btn" onclick="closeModal()">Cancel</button>')
    + '<button class="btn pri" onclick="' + (last ? "srcvWizFinish()" : "srcvWizGo(" + (SRCV_WIZ.step + 1) + ")") + '">'
    + (last ? I2.check + 'Register and read it' : 'Continue' + I2.chev) + '</button></div>';
}
</script>
