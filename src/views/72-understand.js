<script>
/* =====================================================================
   SPIFF v2 — VIEW: Understanding run
   One run of Spiff reading a source's code, schema and documentation,
   and proposing what the data means — with the evidence attached.
   A run proposes. A named person decides. Nothing here is automatic.
   ===================================================================== */

const UNDV = {scanId:null, group:"type", status:[], types:[], bands:[], mine:false, sel:{}};
const UND_NOW = FX.time;
let UND_SEQ = 1200;

/* ---------- the nine kinds of finding ---------- */
const UND_TYPES = {
  entity:      {label:"Structure",     short:"structural",  icon:"grid",   line:"What a table actually is, and what it is not."},
  grain:       {label:"Grain",         short:"grain",       icon:"db",     line:"What one row means. Get this wrong and every count is wrong."},
  join:        {label:"Joins",         short:"join",        icon:"link",   line:"The supported route between two things, and the guard that travels with it."},
  rule:        {label:"Business rules",short:"rule",        icon:"shield", line:"A refusal, a filter or a calculation the code enforces on every read."},
  definition:  {label:"Definitions",   short:"definition",  icon:"book",   line:"The agreed wording of a term the division publishes."},
  field:       {label:"Field meanings",short:"field",       icon:"pencil", line:"What a column holds, how it is set, and where it lies."},
  sensitivity: {label:"Sensitivity",   short:"sensitivity", icon:"lock",   line:"Personal data, and what the code already does about it."},
  retention:   {label:"Retention",     short:"retention",   icon:"clock",  line:"When something is destroyed, and what survives it."},
  conflict:    {label:"Conflicts",     short:"conflict",    icon:"warn",   line:"Two authoritative sources disagreeing about a published number."}
};
const UND_STATUS = {
  pending:  {label:"Waiting on a person", cls:"warn"},
  accepted: {label:"Accepted",            cls:"ok"},
  edited:   {label:"Accepted with edits", cls:"info"},
  rejected: {label:"Rejected",            cls:"crit"}
};
const UND_RUNSTATE = {
  complete:      {label:"Complete",     cls:"ok",   line:"The run finished and every finding has been decided."},
  "needs-review":{label:"Needs review", cls:"warn", line:"The run finished. Some of what it found is still sitting with a person."},
  running:       {label:"Running now",  cls:"info", line:"Still reading. Findings reach the review queue when it finishes, not before."},
  failed:        {label:"Failed",       cls:"crit", line:"The run stopped part-way. What it did read is shown; what it did not is named."}
};
const UND_APPROVER = {
  "Head of Statistics":"Rupert Mackenzie",
  "Data Steward":"Lesedi Mofokeng",
  "Safeguarding Lead":"Cathleen Oberholzer"
};
const UND_EVKIND = {
  code:       {label:"Source code",     icon:"flow"},
  doc:        {label:"Document",        icon:"book"},
  comment:    {label:"Column comment",  icon:"pencil"},
  schema:     {label:"Database schema", icon:"db"},
  "query-log":{label:"Scan probe",      icon:"search"}
};

/* ---------- the honest gaps in each run's evidence base ---------- */
const UND_GAPS = {
  "scan-arepo-3":["No test covers legacy_flag. All 214 tests were read and not one of them touches the column, which is why that finding is weak and stays weak.",
                  "Commit messages and pull request text are out of scope, so the reasoning behind a change is only ever what the code itself says.",
                  "The data dictionary lives in a different source. It was compared against, never assumed — which is how the meeting-type conflict surfaced."],
  "scan-arepo-1":["Tests were not read on this first pass. Eight of the fourteen proposed joins had no corroboration and were left alone rather than guessed at.",
                  "One README was the only written description of this system that existed in January."],
  "scan-adb-4":  ["206 column comments were read and treated as weak evidence throughout. A comment is a claim somebody left behind, not a contract.",
                  "Six tables added since June carry no comment and no code that reads them, so nothing was proposed for them.",
                  "No code was read in this run. A schema says what a column is and never what it means."],
  "scan-drepo-2":["The pastoral module is roughly a third of this repository and is not opened at all — by design, and permanently.",
                  "About 38 service classes are still to read. Nothing from this run enters the review queue until it finishes.",
                  "Integration fixtures containing invented member names are skipped, so nothing in this run touched anything shaped like a person."],
  "scan-ddb-3":  ["Three schemas were denied at the connection and never opened: pastoral, care notes and safeguarding.",
                  "No code was read in this run, so the meaning behind a column had to come from the repository next door."],
  "scan-docs-2": ["Drafts are skipped. Four more documents in the library are unpublished and are not read, on purpose.",
                  "Six published documents were read against code in two repositories. That comparison is what produced the meeting-type conflict."],
  "scan-sheets-2":["Three of twelve workbooks did not open: two are password-protected and one has merged header cells Spiff will not guess at.",
                  "Nothing from this source has ever been accepted, so nothing in the catalogue depends on it today."],
  "scan-wh-3":   ["Eleven marts carry no description in schema.yml and no test to hold them to one.",
                  "This source is read as a shared service account — the one connection in the estate that cannot prove per-viewer scoping."],
  "scan-orbit-2":["120 sample responses were read for shape only. Values were discarded in the same pass and none were retained.",
                  "There is no code and no data dictionary on the UBT side of Orbit, so a published spec is all there is to read."]
};

/* ---------- mid-flight and stopped detail ---------- */
const UND_LIVE = {
  "scan-drepo-2":{
    now:"src/Directory.Api/Membership/StatusRules.cs",
    done:162, expected:200,
    trace:[["09:12:04","Opened directory-core at commit 8f2c11e. Read-only deploy key, this repository only."],
           ["09:12:31","Deny list applied — src/Directory.Pastoral will not be opened in this run or any other."],
           ["09:19:47","47 migrations read. The member table has no valid_from column, so history lives elsewhere."],
           ["09:31:02","29 validators read. ConsentFilter.cs returns two different empties; held as a candidate finding."],
           ["09:44:18","Reading service logic — 52 of about 90 classes."],
           ["09:52:36","StatusRules.cs:52 — a transferred member stays active for 30 days. This contradicts the handbook."]]
  }
};
const UND_STOP = {
  "scan-sheets-2":{
    at:"Monthly Returns 2026.xlsx — sheet LP (Polokwane)",
    why:"The workbook is password-protected. Spiff does not hold the password and will not ask a person for one — a credential typed into an agent is a credential nobody can audit.",
    lines:[["06:11:02","9 of 12 workbooks opened. 74 sheets and 412 formulas read."],
           ["06:11:40","Monthly Returns 2026.xlsx — sheet LP: password required. Stopped."],
           ["06:11:41","Monthly Returns 2026.xlsx — sheet NW: password required. Skipped."],
           ["06:12:07","Locality Reference.xlsx: merged header cells across B2:D2. Refused to guess the column names."],
           ["06:12:09","Run marked failed. Two findings from the nine readable workbooks were kept and sent for review."]]
  }
};

/* ---------- what in this snippet supports the claim ---------- */
const UND_GLOSS = {
"src/Connect.UserLogEvents.Api/Attendance/AttendanceService.cs:112":"Two filters and a grouping do all the work. The first drops check-ins whose meeting was cancelled; the grouping divides the scan time into four-hour buckets and keeps only the earliest row in each, so a second scan by the same member inside that window disappears. Everything the statement claims is in these five lines.",
"tests/Attendance/DedupeTests.cs:41":"A test is an assertion the team is prepared to break a build over. This one scans the same member twice, two and a half hours apart, and demands the count is one. It pins the four-hour window as intended behaviour rather than an accident of the query.",
"db/migrations/0042_add_checkin.sql":"A unique index is the strongest statement of grain a database can make. This one says a member may appear once per occurrence, and the filtered clause exempts voided rows. The grain is declared here, not inferred from the data.",
"src/Connect.UserLogEvents.Api/CheckIn/CheckInController.cs:64":"Two endpoints, one flag. The device route sets CheckedIn; the manual register route calls Expect and never touches it. That asymmetry is the entire finding — a locality without a scanner cannot produce a true value, however diligent its secretary is.",
"src/Connect.UserLogEvents.Api/Meetings/MeetingTypeMap.cs:18":"One boolean decides a number the division publishes every month. It returns true for Youth as well as Regular, which rolls the two together. The stale note beside it is the honest part: whoever wrote it was not certain either.",
"GST Data Dictionary v7, p.14 — Meeting type":"The dictionary is unambiguous and says the opposite of the code. It is the agreed wording, signed off, and unchanged since. Two authoritative sources, one published number, and no way to satisfy both.",
"src/Connect.UserLogEvents.Api/Attendance/OccurrenceQuery.cs:37":"The join on occurrence is the obvious half. The locality comparison on the next line is the half people forget — without it, a joint meeting at a shared venue pulls in another locality's check-ins and both localities report them.",
"jobs/retention.yml":"A scheduled hard delete, weekly, on rows more than thirteen months past the event close. The keeps line matters as much as the delete: the derived attendance count survives, so a count exists for a period whose underlying rows do not.",
"GST Retention Schedule v4, p.11":"The written schedule and the job agree, to the month. When code and policy say the same thing, a finding stops being an observation and becomes a rule Spiff can enforce and defend.",
"src/Assemble.Api/Members/MemberProjection.cs:88":"The field is set to null — not rounded, not masked. Nothing downstream can infer a date from a placeholder that is not there. The suppression is logged with a reason, which is what makes it auditable rather than merely safe.",
"UBT Safeguarding Policy 2026, s.4.2, p.14":"The policy admits no exception: no role, no purpose. That is why this is a rule rather than a default, and why no request-access route can ever unlock it.",
"dbo.MeetingOccurrence — column comment":"This is the whole evidence base — one comment from 2019, a set of initials, no reader in 88 service classes, no test in 214, no dictionary entry. Spiff is showing you what it does not have as plainly as what it does.",
"db/migrations/0019_split_series.sql":"Two tables where a reader might expect one. The series carries the recurring pattern; the occurrence carries its own start time and status. A nullable series_id makes a one-off occurrence legal, which settles that the occurrence is the countable thing.",
"config/spiff-source.yml":"The deny list sits in the connection, above the query layer, and on_deny is fail-closed. A query naming a pastoral schema errors instead of quietly returning nothing — the difference between a mistake you find and one you never do.",
"src/Directory.Api/Guards/ContactGuard.cs:29":"The guard returns a hash rather than withholding the row. Two records for the same person still collide on the same hash, so counting and de-duplication survive; the address itself does not leave the locality.",
"reporting/fn_active_member.sql":"The function takes a date and reads the status history between valid_from and valid_to. It never looks at the current status column, which is what stops a report about March saying something different when it is re-run in September.",
"src/Directory.Api/Membership/StatusRules.cs:52":"IsActive returns true for a transferred member for thirty more days. The comment gives the reason — notices in flight — and it is a good operational reason with a bad reporting consequence, which is exactly why a person has to weigh it.",
"Membership Handbook 2026, s.2.4":"The handbook leaves no room: membership ends the day the transfer is recorded, and there is no period in which a member belongs to both. It is the published rule the division gives its localities.",
"src/Directory.Api/Contact/ConsentFilter.cs:17":"Two returns, two different empties. NoContactOnFile means nothing was ever recorded; NoUsableContact means something was recorded and may not be used. A report that treats them as the same overstates how reachable a locality is.",
"db/migrations/0007_member_current.sql":"One primary key, no valid_from, no valid_to. The table is overwritten in place, so it holds today and nothing else — and the comment points at where the history actually lives.",
"dbo.UserLogEvents_Staging":"The comment states the intent plainly: duplicates are kept so a disputed scan can be traced back to a device. The absence of any unique constraint confirms it. This is a raw feed, and counting it directly overstates attendance.",
"scan probe · dbo.MeetingOccurrence":"This is a counting query, not a sample. It reads the shape of one column — how many rows, how many nulls — and returns two numbers. No member record was read to produce it, and none was retained.",
"directory.member — column classification":"Nine columns carry personal data and are labelled as such. The last line is the more useful finding: there is no identity-number column in this database, so nothing has to be written to protect one.",
"directory — foreign keys":"The foreign keys form a single chain from member to locality to subdivision to locality. There is no second route, which is why any locality-looking column on a member row is stale denormalisation and is kept out of the catalogue.",
"GST Publication Standard v4, p.9":"Two instructions, and the second is the one people get wrong. Percentages are calculated before rounding. Compute them from rounded counts instead and two teams produce two different rates from one dataset.",
"GST Data Dictionary v7, p.4 — Locality":"The agreed wording, with a date on it. Dual listing was withdrawn in March 2024, which is what turns one subdivision from a convention into something the join chain can enforce.",
"GST Disclosure Control v4, p.6":"Primary suppression is the first sentence, secondary the second. With a published total, one hidden cell can be recovered by subtraction — so a second cell that looks perfectly safe on its own is suppressed as well.",
"Monthly Returns 2026.xlsx — sheet WC, rows 1-4":"Read exactly as it sits, merged header and all. Locality and month live above the table, one row per locality below. An em dash means a return was not submitted, which is not the same as an attendance of zero and must never be read as one.",
"comparison probe · July 2026 · Stellenbosch":"Two totals for one month and one locality, with the gap named rather than smoothed. The localities driving it are the ones without a door scanner, which makes it a cause and not a coincidence.",
"models/marts/mart_member_growth.yml":"The formula sits in the model's own description, where it runs, and a test enforces the complete-month rule beneath it. A description that is tested is a description that cannot quietly drift away from the SQL.",
"models/marts/mart_member_growth.sql:31":"One WHERE clause, applied inside the model. The in-progress month never leaves the mart, so no question has to remember to exclude it and no answer can accidentally include it.",
"orbit/mappers/booking.ts:14":"An allow-list first, then explicit deletes. Spiff receives only the six named fields, so passport and identity numbers are not masked at the far end — they never arrive at all, which is a far stronger guarantee than masking."
};

/* ---------- small helpers ---------- */
function undQ(s){ return esc2(String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")); }
function undMe(){ return viewer().full || viewer().name; }
function undScan(id){ return SCANS.filter(function(s){ return s.id === id; })[0] || null; }
function undFind(id){ return FINDINGS.filter(function(f){ return f.id === id; })[0] || null; }
function undBand(n){ return n >= 90 ? {key:"strong", label:"Strong", cls:"ok"} : n >= 70 ? {key:"probable", label:"Probable", cls:"info"} : {key:"weak", label:"Weak", cls:"crit"}; }
function undTypeInfo(t){ return UND_TYPES[t] || {label:t, icon:"grid", line:""}; }
function undDefaultScan(){
  var best = null, bestN = -1;
  SCANS.forEach(function(s){
    if(s.status === "running") return;
    var f = findingsFor(s.id);
    var n = f.length * 10 + f.filter(function(x){ return x.status === "pending"; }).length * 5
          + (f.some(function(x){ return x.type === "conflict"; }) ? 7 : 0);
    if(n > bestN){ bestN = n; best = s; }
  });
  return (best || SCANS[0]).id;
}
function undDataset(f){
  var t = f.creates.target;
  if(f.creates.kind === "dataset") return ds(t);
  if(f.creates.kind === "field")   return ds(String(t).split(".")[0]);
  if(f.creates.kind === "join")    return ds(String(t).split(" ")[0]);
  return null;
}
function undApprover(f){
  if(UND_APPROVER[f.needs]) return UND_APPROVER[f.needs];
  var d = undDataset(f);
  if(d) return d.owner;
  var s = srcById(f.sourceId);
  return s ? s.owner : "the source owner";
}
function undSignedBy(f){ return f.by || undApprover(f); }
function undSignedOn(f){
  if(f.on) return f.on;
  var sc = undScan(f.scanId);
  var d = sc ? (sc.finishedAt !== "—" ? sc.finishedAt : sc.startedAt) : "";
  return d.replace(/\s+\d{1,2}:\d{2}.*$/, "");
}
function undIsProse(ev){ return ev.kind === "doc" && ev.snippet.indexOf("|") < 0; }

/* ---------- what accepting a finding actually does ---------- */
function undCreates(f){
  var k = f.creates.kind, t = f.creates.target;
  if(k === "definition"){
    var g = GLOSSARY.filter(function(x){ return x.term === t; })[0];
    return g
      ? {line:"Accepting this writes the agreed definition of " + t + ", which " + g.used + " saved answers already use. Every one of them re-runs against the new wording.",
         link:"go('glossary')", label:"Open the definition"}
      : {line:"Accepting this opens a new agreed definition of " + t + ". Nothing uses it yet, and every future answer that names the term will carry it.", link:null};
  }
  if(k === "dataset"){
    var d = ds(t);
    return d
      ? {line:"Accepting this publishes " + d.name + " to the catalogue at the grain stated above, where " + d.users + " people can already find it.",
         link:"openDataset('" + undQ(d.id) + "')", label:"Open " + d.name}
      : {line:"Accepting this creates a new dataset in the catalogue — " + t + ". Nothing traces to it today, and the Statistics team keeps the only copy.", link:null};
  }
  if(k === "rule"){
    var r = (typeof ruleById === "function") ? ruleById(t) : null;
    var nds = r ? r.scope.datasets.length : 0;
    return r
      ? {line:"Accepting this activates the rule “" + r.name + "” — which then runs on every answer touching "
           + nds + (nds === 1 ? " dataset, " : " datasets, ") + fmt(r.evalsToday) + " evaluations today alone.",
         link:"openRule('" + undQ(r.id) + "')", label:"Open the rule"}
      : {line:"Accepting this opens a new business rule for drafting — " + t + ". It changes no answer until a steward publishes it.", link:null};
  }
  if(k === "field"){
    var parts = String(t).split("."), d2 = ds(parts[0]);
    var has = d2 && d2.fields.some(function(x){ return x.tech === parts[1]; });
    return {line:"Accepting this writes the meaning of " + parts[1] + " onto " + (d2 ? d2.name : parts[0])
        + (has ? ", where it shows beside the column on every answer that uses it." : " — a column the catalogue does not carry today."),
      link:d2 ? "openDataset('" + undQ(d2.id) + "','fields')" : null, label:"Open the field list"};
  }
  var sides = String(t).split(" ");
  var left = ds(sides[0]);
  return {line:"Accepting this records " + t + " as the supported join path. A query that reaches across another way is refused when the answer is built, not after it is published.",
    link:left ? "openDataset('" + undQ(left.id) + "','joins')" : null, label:"Open the dataset"};
}

/* ---------- mutation ---------- */
function undLog(f, verb){
  try{
    if(typeof AUDEV !== "function" || typeof AUDIT === "undefined") return;
    var kind = f.creates.kind === "definition" ? "g.definition" : f.creates.kind === "rule" ? "g.rule_created" : "g.certified";
    var d = undDataset(f);
    AUDIT.unshift(AUDEV(++UND_SEQ, fxLocalISO(new Date()), "today " + fxTime(new Date()), kind, undMe(), viewer().title,
      d ? d.id : null, f.statement,
      "Understanding run finding " + verb + " by " + undMe() + ". Evidence: " + f.evidence[0].ref + ".",
      {outcome:verb === "rejected" ? "denied" : "ok", ms:0, source:"admin"}));
  }catch(e){ /* the log is a nicety here, never a blocker */ }
}
function undAccept(id){
  var f = undFind(id); if(!f) return;
  if(f.status === "accepted" || f.status === "edited") return toast("Already accepted, by " + undSignedBy(f) + " on " + undSignedOn(f));
  var again = f.status === "rejected";
  f.status = "accepted"; f.by = undMe(); f.on = "today " + UND_NOW; delete f.reason;
  delete UNDV.sel[id];
  undLog(f, again ? "reconsidered and accepted" : "accepted");
  undRepaint();
  toast("Accepted and recorded against " + undMe() + " — " + undCreates(f).line.replace(/^Accepting this /, "this "));
}
function undGate(){
  var t = $("#und-reason"), b = $("#und-reject-go"); if(!t || !b) return;
  var ok = t.value.trim().length > 3; b.disabled = !ok; b.style.opacity = ok ? "1" : ".45";
}
function undRejectAsk(id){
  var f = undFind(id); if(!f) return;
  var presets = ["The code is right, the wording is not", "Out of date — the behaviour changed after this run", "Already covered by a published rule", "Not a rule, just how one team happens to work"];
  openModal('<h3>Reject this finding</h3>'
    + '<div class="msub">A rejection needs a reason. It is kept with the finding so the next run of this source does not propose the same thing again blind, and so the next person can see why the answer was no.</div>'
    + '<div class="defblock" style="margin-bottom:14px">' + esc2(f.statement) + '</div>'
    + '<div class="chipbar" style="margin-bottom:10px">' + presets.map(function(p){
        return '<button class="fchip2" onclick="undReason(\'' + undQ(p) + '\')">' + esc2(p) + '</button>';
      }).join("") + '</div>'
    + '<div class="field"><label>Reason, in your own words — required, and kept with the finding</label><div class="fcontrol">'
    + '<textarea id="und-reason" rows="3" placeholder="What is wrong with this, and what should happen instead?" oninput="undGate()"></textarea></div></div>'
    + '<div class="mutedtext" style="font-size:12.5px">Recorded against ' + esc2(undMe()) + ' in the activity log. '
    + esc2(undApprover(f)) + ' is notified either way.</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>'
    + '<button class="btn danger" id="und-reject-go" disabled style="opacity:.45" onclick="undRejectDo(\'' + undQ(id) + '\')">Reject with this reason</button></div>', 620);
}
function undReason(t){ var el = $("#und-reason"); if(el){ el.value = t; el.focus(); undGate(); } }
function undRejectDo(id){
  var f = undFind(id); if(!f) return;
  var el = $("#und-reason"), reason = el ? el.value.trim() : "";
  if(!reason) return toast("A rejection needs a reason — it travels with the finding for as long as the source is registered");
  f.status = "rejected"; f.reason = reason; f.by = undMe(); f.on = "today " + UND_NOW;
  delete UNDV.sel[id];
  undLog(f, "rejected");
  closeModal(); undRepaint();
  toast("Rejected by " + undMe() + ". The reason is kept with the finding and shown on the next run");
}
function undEditAsk(id){
  var f = undFind(id); if(!f) return;
  openModal('<h3>Edit before accepting</h3>'
    + '<div class="msub">Change the wording, not the evidence. What you accept is what enters the catalogue, and the original proposal is kept alongside it so the two can be compared.</div>'
    + '<div class="field"><label>Plain-English statement — a non-engineer has to be able to judge it</label>'
    + '<div class="fcontrol"><textarea id="und-stmt" rows="3">' + esc2(f.statement) + '</textarea></div></div>'
    + '<div class="field"><label>Detail</label><div class="fcontrol"><textarea id="und-det" rows="4">' + esc2(f.detail) + '</textarea></div></div>'
    + '<div class="mutedtext" style="font-size:12.5px">Accepted with edits by ' + esc2(undMe()) + ', recorded as an edit rather than a plain acceptance. The evidence beneath it does not change.</div>'
    + modalFoot("Cancel", "Accept with edits", "undEditDo('" + undQ(id) + "')"), 700);
}
function undEditDo(id){
  var f = undFind(id); if(!f) return;
  var s = $("#und-stmt"), d = $("#und-det");
  if(s && s.value.trim()) f.statement = s.value.trim();
  if(d && d.value.trim()) f.detail = d.value.trim();
  f.status = "edited"; f.by = undMe(); f.on = "today " + UND_NOW;
  delete UNDV.sel[id];
  undLog(f, "accepted with edits");
  closeModal(); undRepaint();
  toast("Accepted with edits by " + undMe() + " — the original proposal is kept beside it");
}

/* ---------- selection and bulk ---------- */
function undSel(id){
  if(UNDV.sel[id]) delete UNDV.sel[id]; else UNDV.sel[id] = 1;
  undRepaint();
}
function undSelClear(){ UNDV.sel = {}; undRepaint(); }
function undSelected(){ return findingsFor(UNDV.scanId).filter(function(f){ return UNDV.sel[f.id]; }); }
function undBulkLabel(){
  var sel = undSelected(); if(!sel.length) return "";
  var bands = {}, types = {};
  sel.forEach(function(f){ bands[undBand(f.confidence).label] = 1; types[undTypeInfo(f.type).short] = 1; });
  var b = Object.keys(bands), t = Object.keys(types);
  return "Accept " + sel.length + (b.length === 1 ? " " + b[0].toLowerCase() : "")
    + (t.length === 1 ? " " + t[0] : "") + (sel.length === 1 ? " finding" : " findings");
}
function undBulkAccept(){
  var sel = undSelected().filter(function(f){ return f.status === "pending"; });
  var skipped = undSelected().length - sel.length;
  if(!sel.length){ UNDV.sel = {}; undRepaint(); return toast("Nothing selected is still pending — those were decided already"); }
  sel.forEach(function(f){ f.status = "accepted"; f.by = undMe(); f.on = "today " + UND_NOW; undLog(f, "accepted in bulk"); });
  UNDV.sel = {}; undRepaint();
  toast(sel.length + " findings accepted, each one recorded against " + undMe() + " separately"
    + (skipped ? " — " + skipped + " were already decided and left alone" : ""));
}

/* ---------- filtering ---------- */
function undToggle(key, val){
  var a = UNDV[key], i = a.indexOf(val);
  if(i < 0) a.push(val); else a.splice(i, 1);
  undRepaint();
}
function undMine(){ UNDV.mine = !UNDV.mine; undRepaint(); }
function undGroup(g){ UNDV.group = g; if(LISTS.und){ LISTS.und.sort = g; LISTS.und.dir = 1; LISTS.und.page = 0; } undRepaint(); }
/* the findings, grouped by kind or by confidence, or flat by what matters most */
function undFindingsFrame(list){
  var typeOrder = Object.keys(UND_TYPES), bandRank = {strong:0, probable:1, weak:2}, stRank = {pending:0, edited:1, accepted:2, rejected:3};
  return listFrame("und", {
    items: list, repaint: undRepaint, noun: "findings", noun1: "finding", size: 10,
    sorts: [{key:"type",   label:"By kind",                  grouped:true, get:function(f){ return typeOrder.indexOf(f.type)*1000 + (100-f.confidence); }},
            {key:"band",   label:"By confidence",            grouped:true, get:function(f){ return bandRank[undBand(f.confidence).key]*1000 + (100-f.confidence); }},
            {key:"conf",   label:"Highest confidence first", get:function(f){ return f.confidence; }, desc:true},
            {key:"status", label:"Waiting on a person first",get:function(f){ var k=stRank[f.status]; return k==null?9:k; }}],
    group: function(f, k){ if(k==="band"){ var b=undBand(f.confidence); return {key:b.key, label:b.label}; } var t=undTypeInfo(f.type); return {key:f.type, label:t.label}; },
    row: undCard,
    notOurs: "A run proposes. A person decides — Accept, Edit or Reject on each finding"
  });
}
function undClear(){ UNDV.status = []; UNDV.types = []; UNDV.bands = []; UNDV.mine = false; undRepaint(); }
function undFiltered(){
  return findingsFor(UNDV.scanId).filter(function(f){
    if(UNDV.status.length && UNDV.status.indexOf(f.status) < 0) return false;
    if(UNDV.types.length && UNDV.types.indexOf(f.type) < 0) return false;
    if(UNDV.bands.length && UNDV.bands.indexOf(undBand(f.confidence).key) < 0) return false;
    if(UNDV.mine && undApprover(f) !== undMe()) return false;
    return true;
  });
}

/* ---------- evidence drawer ---------- */
function showEvidence(findingId, i){
  var f = undFind(findingId); if(!f) return;
  i = Math.max(0, Math.min(f.evidence.length - 1, i || 0));
  var ev = f.evidence[i], ek = UND_EVKIND[ev.kind] || UND_EVKIND.code, band = undBand(f.confidence);
  var body = '<div class="eyebrow2">Evidence ' + (i + 1) + ' of ' + f.evidence.length + ' · ' + esc2(undTypeInfo(f.type).label) + '</div>'
    + '<h3 style="line-height:1.35;margin:4px 0 8px">' + esc2(f.statement) + '</h3>'
    + '<div class="rowflex" style="margin-bottom:14px">' + bdg(band.label + " · " + f.confidence + "%", band.cls, band.key === "weak" ? "warn" : "check")
    + bdg(ek.label, "mut", ek.icon) + bdg(ev.lang, "purple") + bdg(UND_STATUS[f.status].label, UND_STATUS[f.status].cls) + '</div>'
    + '<div style="font-weight:600;font-size:13.5px;margin-bottom:6px">' + esc2(ev.label) + '</div>'
    + (undIsProse(ev)
        ? '<div class="defblock" style="white-space:pre-wrap;font-size:14px">' + esc2(ev.snippet) + '</div>'
        : '<div class="codeblock">' + esc2(ev.snippet) + '</div>')
    + '<div class="mono" style="font-size:11.5px;color:var(--muted);margin-top:7px">' + esc2(ev.ref) + (undIsProse(ev) ? "" : " · " + esc2(ev.lang)) + '</div>'
    + '<div style="margin-top:15px">' + callout("info", "<b>What this supports.</b> " + esc2(UND_GLOSS[ev.ref] || "Read in full and kept with the finding."), "spark") + '</div>'
    + (ev.kind === "query-log"
        ? '<div style="margin-top:11px">' + callout("warn", "<b>This one probe touched the source's own data.</b> It counted rows and nulls and returned two numbers. No record was read, none was retained, and every probe of this kind is written to the activity log with the query it ran.", "eye") + '</div>'
        : '')
    + '<div class="hairline"></div>'
    + '<div class="rowflex">'
      + (f.evidence.length > 1
          ? '<button class="btn sm"' + (i === 0 ? ' disabled style="opacity:.45"' : '') + ' onclick="showEvidence(\'' + undQ(f.id) + '\',' + (i - 1) + ')">' + I2.back + 'Previous</button>'
            + '<button class="btn sm"' + (i === f.evidence.length - 1 ? ' disabled style="opacity:.45"' : '') + ' onclick="showEvidence(\'' + undQ(f.id) + '\',' + (i + 1) + ')">Next' + I2.chev + '</button>'
          : '')
      + '<div class="sp"></div>'
      + '<button class="btn sm" onclick="toast(\'Copied the reference. It is the same string that appears on the dataset, on the rule and in the activity log\')">' + I2.copy + 'Copy reference</button>'
      + '<button class="btn sm" onclick="closeModal();openSource(\'' + undQ(f.sourceId) + '\')">' + I2.plug + 'Open the source</button>'
    + '</div>'
    + modalFoot("Close", "", "");
  openModal(body, 780);
}

/* ---------- part 1: what it read ---------- */
function undReadIcon(k){
  k = k.toLowerCase();
  if(/test/.test(k)) return "check";
  if(/valid|guard/.test(k)) return "shield";
  if(/doc|readme|handbook|pdf|definition/.test(k)) return "book";
  if(/workbook|sheet|formula|note|sample/.test(k)) return "file";
  if(/model|service|logic|sql|spec|schema/.test(k)) return "flow";
  return "db";
}
function undManifest(sc, k){
  var total = sc.read.reduce(function(a, r){ return a + r.count; }, 0);
  var live = UND_LIVE[sc.id], stop = UND_STOP[sc.id];
  var rows = sc.read.map(function(r){
    var pct = Math.round(r.count / total * 100);
    return '<div style="display:flex;gap:12px;align-items:flex-start;padding:11px 16px;border-bottom:1px solid var(--hair2)">'
      + '<div class="li" style="width:30px;height:30px;border-radius:8px;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;flex:none">' + (I2[undReadIcon(r.kind)] || "") + '</div>'
      + '<div style="flex:1;min-width:0"><div class="rowflex" style="gap:8px;flex-wrap:nowrap">'
        + '<div style="font-weight:600;font-size:13.5px;flex:1;min-width:0">' + esc2(r.kind) + '</div>'
        + '<span class="mono" style="font-size:12.5px;font-weight:700">' + fmt(r.count) + '</span></div>'
      + '<div style="margin:5px 0 4px;max-width:180px">' + meter(pct, pct > 30 ? "ok" : "") + '</div>'
      + '<div style="font-size:12px;color:var(--muted);line-height:1.45">' + esc2(r.note) + '</div></div></div>';
  }).join("");
  var head = "";
  if(live){
    var pc = Math.round(live.done / live.expected * 100);
    head = callout("info", "<b>Reading now — " + pc + "% through.</b> Currently open: <span class=\"mono\">" + esc2(live.now)
      + "</span>. Nothing from this run reaches the review queue until it finishes, and a run that is interrupted proposes nothing at all.", "clock")
      + '<div class="codeblock" style="margin-top:12px">' + live.trace.map(function(t){ return esc2(t[0]) + "  " + esc2(t[1]); }).join("\n") + '</div>';
  } else if(stop){
    head = callout("crit", "<b>Stopped at " + esc2(stop.at) + ".</b> " + esc2(stop.why), "warn")
      + '<div class="codeblock" style="margin-top:12px">' + stop.lines.map(function(t){ return esc2(t[0]) + "  " + esc2(t[1]); }).join("\n") + '</div>';
  }
  var gaps = (UND_GAPS[sc.id] || []).map(function(g){
    return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.55;margin-bottom:9px">'
      + '<i class="dotd" style="margin-top:7px;background:var(--warn)"></i><span>' + esc2(g) + '</span></div>';
  }).join("");
  return panel("What it opened", (head ? '<div style="padding:16px 16px 4px">' + head + '</div>' : "") + rows
      + '<div style="padding:15px 16px;background:var(--surface)">'
      + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700;margin-bottom:9px">What it did not read, and why</div>'
      + gaps + '</div>', {
    icon:"file", tight:true, sub:fmt(total) + " things read",
    foot:"An evidence base, not a progress bar. From a " + esc2(k.name.toLowerCase()) + " Spiff reads "
      + esc2(k.reads.charAt(0).toLowerCase() + k.reads.slice(1)) + " It does not read the rows."
  });
}

/* ---------- part 2: a finding card ---------- */
function undConf(n){
  var b = undBand(n);
  return '<span class="bdg ' + b.cls + '" title="' + esc2(b.key === "strong" ? "Corroborated by code and, where it exists, a written document."
      : b.key === "probable" ? "Supported, but from a single kind of evidence." : "Thin evidence. Reported so a person can decide, not proposed as fact.") + '">'
    + (b.key === "weak" ? I2.warn : I2.check) + esc2(b.label) + '</span>'
    + '<span class="mono" style="font-size:12px;font-weight:700;color:var(--' + b.cls + ')">' + n + '%</span>'
    + '<div style="width:64px">' + meter(n, b.cls) + '</div>';
}
function undEvChips(f){
  return f.evidence.map(function(ev, i){
    var ek = UND_EVKIND[ev.kind] || UND_EVKIND.code;
    return '<button class="fchip2" title="' + esc2(ev.label) + '" onclick="showEvidence(\'' + undQ(f.id) + '\',' + i + ')">'
      + (I2[ek.icon] || "") + '<span class="mono" style="font-size:11px">' + esc2(ev.ref) + '</span></button>';
  }).join("");
}
function undConflictBlock(f){
  var side = function(i, c){
    var ev = f.evidence[i], ek = UND_EVKIND[ev.kind] || UND_EVKIND.code;
    return '<div style="border:1.5px solid var(--' + c + ');border-radius:var(--r-sm);padding:13px 14px;background:var(--' + c + '-soft)">'
      + '<div class="rowflex" style="gap:7px;margin-bottom:7px">' + bdg(ek.label, c, ek.icon)
      + '<span style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;font-weight:700;color:var(--' + c + ')">Claim ' + (i + 1) + '</span></div>'
      + '<div style="font-size:13.5px;line-height:1.55;font-weight:600;margin-bottom:8px">' + esc2(ev.label) + '</div>'
      + '<div class="mono" style="font-size:11px;color:var(--muted);margin-bottom:9px">' + esc2(ev.ref) + '</div>'
      + '<button class="btn sm ghost" onclick="showEvidence(\'' + undQ(f.id) + '\',' + i + ')">' + I2.eye + 'Read the evidence</button></div>';
  };
  return '<div class="' + (f.evidence.length > 1 ? "g2" : "stack") + '" style="margin:12px 0">'
      + side(0, "info") + (f.evidence.length > 1 ? side(1, "warn") : "") + '</div>'
    + callout("crit", "<b>Spiff will not choose.</b> " + esc2(f.conflict || "")
      + " A finding with two authoritative sources behind it is a decision, not a calculation — " + esc2(undApprover(f))
      + " decides it. Until then, every answer that touches this number carries the gap and names both figures.", "warn");
}
function undCard(f){
  var b = undBand(f.confidence), st = UND_STATUS[f.status], ti = undTypeInfo(f.type);
  var weak = b.key === "weak", decided = f.status !== "pending", c = undCreates(f);
  var mine = undApprover(f) === undMe();
  var edge = f.status === "rejected" ? "crit" : decided ? "ok" : weak ? "warn" : "accent";
  return '<div class="panel" style="margin-bottom:14px;border-left:3px ' + (weak && !decided ? "dashed" : "solid") + ' var(--' + edge + ')'
      + (weak && !decided ? ";background:var(--surface)" : "") + '">'
    + '<div class="panel-b">'
    + '<div class="rowflex" style="gap:9px;margin-bottom:10px">'
      + (decided ? "" : '<button class="fchip2' + (UNDV.sel[f.id] ? " on" : "") + '" onclick="undSel(\'' + undQ(f.id) + '\')">'
          + (UNDV.sel[f.id] ? I2.check : I2.plus) + (UNDV.sel[f.id] ? "Selected" : "Select") + '</button>')
      + bdg(ti.label, "mut", ti.icon) + undConf(f.confidence)
      + (f.evidence.some(function(e){ return e.kind === "query-log"; })
          ? bdg("A probe touched the data", "warn", "eye") : "")
      + '<div class="sp"></div>' + bdg(st.label, st.cls, f.status === "rejected" ? "x" : decided ? "check" : "clock")
    + '</div>'
    + '<div style="font-family:var(--dsp);font-size:17px;font-weight:600;line-height:1.4;margin-bottom:7px">' + esc2(f.statement) + '</div>'
    + '<div style="font-size:13.5px;color:var(--muted);line-height:1.6">' + esc2(f.detail) + '</div>'
    + (f.type === "conflict" ? undConflictBlock(f) : "")
    + (weak && !decided && f.type !== "conflict" ? '<div style="margin-top:12px">' + callout("warn", "<b>Weak, and shown as weak.</b> This is reported so a person can decide, not proposed as a fact. Spiff would rather hand you a thin finding honestly labelled than a confident one it cannot support.", "warn") + '</div>' : "")
    + '<div style="margin-top:13px;padding:12px 14px;background:var(--accent-soft);border-radius:var(--r-sm);font-size:13.5px;line-height:1.6">'
      + (I2.spark || "") + ' <b>What accepting it ' + (decided && f.status !== "rejected" ? "did" : "does") + '.</b> ' + esc2(c.line) + '</div>'
    + (f.reason ? '<div style="margin-top:11px">' + callout("crit", "<b>Rejected — " + esc2(f.by || "") + ".</b> " + esc2(f.reason), "x") + '</div>' : "")
    + '<div class="hairline"></div>'
    + '<div class="rowflex" style="gap:7px;margin-bottom:11px">'
      + '<span style="font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700">Evidence</span>'
      + undEvChips(f) + '</div>'
    + '<div class="rowflex" style="gap:8px">'
      + (decided
          ? '<span style="font-size:13px">' + (f.status === "rejected" ? "Rejected by " : f.status === "edited" ? "Accepted with edits by " : "Accepted by ")
            + '<b>' + esc2(undSignedBy(f)) + '</b> on ' + esc2(undSignedOn(f)) + '</span>'
            + (c.link && f.status !== "rejected" ? '<button class="btn sm" onclick="' + c.link + '">' + I2.link + esc2(c.label || "Open what it created") + '</button>' : "")
            + '<div class="sp"></div>'
            + (f.status === "rejected" ? '<button class="btn sm ghost" onclick="undAccept(\'' + undQ(f.id) + '\')">' + I2.refresh + 'Reconsider</button>' : "")
          : '<button class="btn pri sm" onclick="undAccept(\'' + undQ(f.id) + '\')">' + I2.check + 'Accept</button>'
            + '<button class="btn sm" onclick="undEditAsk(\'' + undQ(f.id) + '\')">' + I2.pencil + 'Edit</button>'
            + '<button class="btn danger sm" onclick="undRejectAsk(\'' + undQ(f.id) + '\')">' + I2.x + 'Reject</button>'
            + '<div class="sp"></div>')
      + '<span class="mutedtext" style="font-size:12.5px">' + (mine ? "Yours to decide as " + esc2(f.needs) : esc2(f.needs) + " · " + esc2(undApprover(f)))
      + (decided ? "" : " · recorded against " + esc2(undMe()) + " either way") + '</span>'
    + '</div></div></div>';
}

/* ---------- part 2: the list, grouped ---------- */
function undGroups(list){
  var keys = [], bag = {};
  list.forEach(function(f){
    var k = UNDV.group === "type" ? f.type : undBand(f.confidence).key;
    if(!bag[k]){ bag[k] = []; keys.push(k); }
    bag[k].push(f);
  });
  var order = UNDV.group === "type" ? Object.keys(UND_TYPES) : ["strong", "probable", "weak"];
  keys.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });
  return keys.map(function(k){
    var g = bag[k];
    var label = UNDV.group === "type" ? undTypeInfo(k).label : undBand(k === "strong" ? 95 : k === "probable" ? 80 : 50).label;
    var line = UNDV.group === "type" ? undTypeInfo(k).line
      : k === "strong" ? "Corroborated by code and, where one exists, a written document. 90% and above."
      : k === "probable" ? "Supported, but by one kind of evidence only. 70 to 89%."
      : "Thin. Reported so a person can decide, not proposed as fact. Below 70%.";
    var open = g.filter(function(f){ return f.status === "pending"; }).length;
    return '<div style="margin:20px 0 12px">'
      + '<div class="rowflex" style="gap:9px"><span style="font-family:var(--dsp);font-size:15.5px;font-weight:600">' + esc2(label) + '</span>'
      + '<span class="bdg mut"><span class="mono">' + g.length + '</span></span>'
      + (open ? bdg(open + " waiting", "warn", "clock") : bdg("all decided", "ok", "check")) + '</div>'
      + '<div class="mutedtext" style="margin-top:3px;font-size:12.5px">' + esc2(line) + '</div></div>'
      + g.map(undCard).join("");
  }).join("");
}

/* ---------- part 3: the evidence index ---------- */
function undEvidenceIndex(sc){
  var all = findingsFor(sc.id), bag = {}, n = 0;
  all.forEach(function(f){ f.evidence.forEach(function(ev, i){
    (bag[ev.kind] = bag[ev.kind] || []).push([f, ev, i]); n++;
  }); });
  var body = Object.keys(bag).map(function(k){
    var ek = UND_EVKIND[k] || UND_EVKIND.code;
    return '<div style="padding:12px 16px;border-bottom:1px solid var(--hair2)">'
      + '<div class="rowflex" style="gap:8px;margin-bottom:8px">' + bdg(ek.label, "mut", ek.icon)
      + '<span class="mutedtext" style="font-size:12px">' + bag[k].length + (bag[k].length === 1 ? " item" : " items") + '</span></div>'
      + '<div class="chipbar">' + bag[k].map(function(t){
          return '<button class="fchip2" title="' + esc2(t[0].statement) + '" onclick="showEvidence(\'' + undQ(t[0].id) + '\',' + t[2] + ')">'
            + '<span class="mono" style="font-size:11px">' + esc2(t[1].ref) + '</span></button>';
        }).join("") + '</div></div>';
  }).join("");
  return panel("The proof", body || '<div class="mutedtext" style="padding:16px">This run produced no findings, so there is nothing to prove.</div>', {
    icon:"link", tight:true, sub:n + " items",
    foot:"Every finding above is anchored to a file, a migration or a page. If someone disputes a number, the argument is about this evidence — not about what an agent felt like doing that day."
  });
}

/* ---------- side rail ---------- */
function undRunsRail(sc){
  var body = SCANS.map(function(s){
    var src = srcById(s.sourceId), rs = UND_RUNSTATE[s.status], f = findingsFor(s.id);
    var open = f.filter(function(x){ return x.status === "pending"; }).length;
    var on = s.id === sc.id;
    return '<div class="clickable" onclick="openScan(\'' + undQ(s.id) + '\')" style="padding:11px 15px;border-bottom:1px solid var(--hair2)'
      + (on ? ';background:var(--accent-soft);border-left:3px solid var(--accent)' : '') + '">'
      + '<div class="rowflex" style="gap:7px;flex-wrap:nowrap"><i class="dotd" style="background:var(--' + rs.cls + ')"></i>'
      + '<div class="trunc" style="flex:1;min-width:0;font-size:12.5px;font-weight:600">' + esc2(src ? src.name : s.sourceId) + '</div>'
      + (open ? '<span class="bdg warn"><span class="mono">' + open + '</span></span>' : '') + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:3px;line-height:1.4">' + esc2(s.label) + '</div>'
      + '<div class="mono" style="font-size:11px;color:var(--muted);margin-top:3px">' + esc2(s.startedAt) + ' · ' + f.length + (f.length === 1 ? ' finding' : ' findings') + '</div></div>';
  }).join("");
  return panel("Other runs", body, {icon:"clock", tight:true, sub:SCANS.length + " on record",
    foot:"Every read of every source, kept. A run is never overwritten — the previous reading of a rule stays visible next to the one that replaced it."});
}
function undProgress(sc){
  var f = findingsFor(sc.id);
  var acc = f.filter(function(x){ return x.status === "accepted"; }).length;
  var ed  = f.filter(function(x){ return x.status === "edited"; }).length;
  var rej = f.filter(function(x){ return x.status === "rejected"; }).length;
  var pend = f.filter(function(x){ return x.status === "pending"; }).length;
  var done = f.length - pend, pct = f.length ? Math.round(done / f.length * 100) : 0;
  var p = sc.proposed;
  var stepc = function(on, doneS){ return "st" + (doneS ? " done" : on ? " on" : ""); };
  return panel("This run", '<div class="steps" style="margin-bottom:16px">'
      + '<div class="' + stepc(false, true) + '"><div class="sc">1</div><div class="sn2">Proposed</div></div><div class="bar"></div>'
      + '<div class="' + stepc(pend > 0, pend === 0) + '"><div class="sc">2</div><div class="sn2">Decided</div></div><div class="bar"></div>'
      + '<div class="' + stepc(pend === 0, false) + '"><div class="sc">3</div><div class="sn2">Signed off</div></div></div>'
    + '<div style="font-size:13.5px;line-height:1.6;margin-bottom:12px">It proposed <b>' + p.datasets + '</b> datasets, <b>' + fmt(p.fields)
      + '</b> field meanings, <b>' + p.joins + '</b> joins, <b>' + p.rules + '</b> rules and <b>' + p.definitions
      + '</b> definitions — put to a person as <b>' + f.length + '</b> findings.</div>'
    + '<div class="rowflex" style="gap:9px;flex-wrap:nowrap;margin-bottom:12px"><span class="mono" style="font-size:12.5px;font-weight:700">' + pct + '%</span>'
      + '<div style="flex:1">' + meter(pct, pct === 100 ? "ok" : "") + '</div></div>'
    + '<div class="kvlist" style="margin-bottom:13px">'
      + '<div class="r"><span class="k">Accepted</span><span class="v mono">' + acc + '</span></div>'
      + '<div class="r"><span class="k">Accepted with edits</span><span class="v mono">' + ed + '</span></div>'
      + '<div class="r"><span class="k">Rejected</span><span class="v mono">' + rej + '</span></div>'
      + '<div class="r"><span class="k">Still waiting on a person</span><span class="v mono" style="color:var(--' + (pend ? "warn" : "ok") + ')">' + pend + '</span></div>'
      + '</div>'
    + '<button class="btn ' + (pend ? "" : "pri") + '" style="width:100%;justify-content:center' + (pend ? ";opacity:.55" : "") + '" onclick="undSignOff()">'
      + I2.shield + (pend ? "Sign-off blocked" : "Sign this run off") + '</button>'
    + '<div class="mutedtext" style="margin-top:9px;font-size:12px;line-height:1.5">'
      + (pend ? esc2(pend + (pend === 1 ? " finding is" : " findings are") + " still open. A run cannot be signed off with anything undecided — leaving one open is itself a decision, and an unrecorded one.")
              : "Nothing is open. Signing off closes the run and names you on it, the way an access review is closed.") + '</div>', {icon:"trend"});
}
function undSignOff(){
  var f = findingsFor(UNDV.scanId), pend = f.filter(function(x){ return x.status === "pending"; });
  if(pend.length) return toast(pend.length + " findings are still waiting — " + undApprover(pend[0]) + " and others have to decide first");
  toast("Run signed off by " + undMe() + " — " + f.length + " findings, each with the name of whoever decided it");
}

/* ---------- the route ---------- */
function openScan(scanId){ go("understand", {scanId:scanId}); }
function undRepaint(){ renderUnderstand({scanId:UNDV.scanId}); }
function undRerun(sc){
  var s = srcById(sc.sourceId);
  if(s && s.state === "needs-reauth") return toast("Reconnect " + s.name + " first — nothing has been read since the sign-in expired on 24 Aug");
  toast("A fresh read of " + (s ? s.name : "this source") + " is queued. It proposes; it does not publish");
}
function undExport(sc){
  var f = findingsFor(sc.id);
  toast(f.length + " findings exported — statement, type, confidence, status, who decided it and the exact file each one came from");
}

function renderUnderstand(arg){
  if(typeof arg === "string") arg = {scanId:arg};
  arg = arg || {};
  var id = arg.scanId || UNDV.scanId || undDefaultScan();
  if(!undScan(id)) id = undDefaultScan();
  if(id !== UNDV.scanId){ UNDV.scanId = id; UNDV.sel = {}; UNDV.status = []; UNDV.types = []; UNDV.bands = []; UNDV.mine = false; }
  var sc = undScan(id), src = srcById(sc.sourceId), k = srcKind(src ? src.kind : "code"), rs = UND_RUNSTATE[sc.status];
  var all = findingsFor(sc.id), list = undFiltered(), pend = all.filter(function(f){ return f.status === "pending"; });
  var mineN = all.filter(function(f){ return undApprover(f) === undMe(); }).length;
  var anyFilter = UNDV.status.length || UNDV.types.length || UNDV.bands.length || UNDV.mine;
  var sel = undSelected();

  var authShort = {"run-as":"Read as the asker", "read-only-key":"Read-only key, code only",
    "oauth-per-user":"Signed in per person", "service-account":"Shared service account"};
  var h = pageHead({
    eyebrow:"Understanding run · " + esc2(src ? src.name : sc.sourceId),
    title:esc2(sc.label),
    desc:"What Spiff opened in " + esc2(src ? src.name : sc.sourceId) + ", what it concluded the data means, and the exact file behind every claim. "
      + "Everything here is a proposal — none of it reaches the catalogue until a named person accepts it.",
    badges:bdg(rs.label, rs.cls, sc.status === "failed" ? "warn" : sc.status === "running" ? "clock" : "check")
      + bdg(k.name, "mut", k.icon) + bdg(sc.trigger, "purple", "bolt")
      + bdg(authShort[src ? src.auth.mode : "run-as"] || "Read-only", src && src.auth.risk === "high" ? "crit" : "info", "lock")
      + bdg(all.length + " findings", "mut", "spark") + (pend.length ? bdg(pend.length + " waiting on a person", "warn", "clock") : bdg("all decided", "ok", "check")),
    acts:'<button class="btn pri" onclick="undRerun(undScan(\'' + undQ(sc.id) + '\'))">' + I2.refresh + 'Re-run this read</button>'
      + '<button class="btn" onclick="undExport(undScan(\'' + undQ(sc.id) + '\'))">' + I2.down + 'Export findings</button>'
      + '<button class="btn" onclick="openSource(\'' + undQ(sc.sourceId) + '\')">' + I2.plug + 'Open the source</button>',
    back:"go('sources')"
  });

  h += '<div class="panel" style="margin-bottom:14px"><div class="panel-b tight" style="padding:14px 18px"><div class="rowflex" style="gap:26px">'
    + [["Started", sc.startedAt], ["Finished", sc.finishedAt === "—" ? "still running" : sc.finishedAt], ["Triggered by", sc.by],
       ["Took", sc.duration], ["Cost", sc.cost], ["Read", fmt(sc.read.reduce(function(a, r){ return a + r.count; }, 0)) + " things"]]
      .map(function(p){
        return '<div><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);font-weight:700">' + esc2(p[0]) + '</div>'
          + '<div class="mono" style="font-size:13px;font-weight:600;margin-top:3px">' + esc2(p[1]) + '</div></div>';
      }).join("") + '</div></div></div>';

  if(sc.status !== "complete") h += callout(rs.cls, "<b>" + esc2(rs.label) + ".</b> " + esc2(rs.line), sc.status === "running" ? "clock" : "warn");

  h += '<div class="g3" style="margin:14px 0 20px">'
    + ['<b>Nothing enters the catalogue on its own.</b> A run proposes. Every finding below sits with a named person until they accept, edit or reject it — and the name stays on it for as long as it stands.',
       '<b>Spiff reads structure and logic, never the data.</b> Schemas, migrations, models, validators, tests and documents. The only exception is a scan probe against a query log, and where one ran it is labelled on the evidence itself.',
       '<b>Every decision is written to the activity log.</b> Accepted, edited or rejected, in bulk or one at a time, it is recorded against the person who made it, with the evidence reference beside it.']
      .map(function(t, i){
        return '<div class="panel"><div class="panel-b" style="display:flex;gap:12px;align-items:flex-start">'
          + '<div class="li" style="width:28px;height:28px;border-radius:8px;background:var(--accent);color:var(--card);display:grid;place-items:center;flex:none;font-family:var(--mono);font-size:12.5px;font-weight:700">' + (i + 1) + '</div>'
          + '<div style="font-size:13px;line-height:1.6">' + t + '</div></div></div>';
      }).join("") + '</div>';

  var chips = '<div class="chipbar">'
    + Object.keys(UND_STATUS).map(function(s){
        var n = all.filter(function(f){ return f.status === s; }).length;
        if(!n) return "";
        return '<button class="fchip2' + (UNDV.status.indexOf(s) >= 0 ? " on" : "") + '" onclick="undToggle(\'status\',\'' + s + '\')">'
          + esc2(UND_STATUS[s].label) + ' <span class="mono">' + n + '</span></button>';
      }).join("")
    + '<span style="width:12px"></span>'
    + ["strong", "probable", "weak"].map(function(b){
        var n = all.filter(function(f){ return undBand(f.confidence).key === b; }).length;
        if(!n) return "";
        return '<button class="fchip2' + (UNDV.bands.indexOf(b) >= 0 ? " on" : "") + '" onclick="undToggle(\'bands\',\'' + b + '\')">'
          + esc2(b.charAt(0).toUpperCase() + b.slice(1)) + ' <span class="mono">' + n + '</span></button>';
      }).join("")
    + '<span style="width:12px"></span>'
    + '<button class="fchip2' + (UNDV.mine ? " on" : "") + '" onclick="undMine()">' + I2.people + 'Only the ones that need me <span class="mono">' + mineN + '</span></button>'
    + (anyFilter ? '<button class="fchip2" onclick="undClear()">' + I2.x + 'Clear</button>' : "")
    + '</div>'
    + '<div class="chipbar" style="margin-top:8px">' + Object.keys(UND_TYPES).map(function(t){
        var n = all.filter(function(f){ return f.type === t; }).length;
        if(!n) return "";
        return '<button class="fchip2' + (UNDV.types.indexOf(t) >= 0 ? " on" : "") + '" onclick="undToggle(\'types\',\'' + t + '\')">'
          + (I2[UND_TYPES[t].icon] || "") + esc2(UND_TYPES[t].label) + ' <span class="mono">' + n + '</span></button>';
      }).join("") + '</div>';

  var bulk = sel.length
    ? '<div class="stickytop" style="top:0;z-index:6"><div class="panel" style="border:1.5px solid var(--accent);margin-bottom:0">'
      + '<div class="panel-b" style="padding:13px 16px"><div class="rowflex" style="gap:10px">'
      + '<b style="font-size:14px">' + sel.length + ' selected</b><div class="sp"></div>'
      + '<button class="btn pri sm" onclick="undBulkAccept()">' + I2.check + esc2(undBulkLabel()) + '</button>'
      + '<button class="btn sm ghost" onclick="undSelClear()">' + I2.x + 'Clear selection</button></div>'
      + '<div class="mutedtext" style="margin-top:8px;font-size:12.5px">Bulk-accepting is not a shortcut past the record. Each finding is written to the activity log separately, against '
      + esc2(undMe()) + ', with its own evidence reference. ' + esc2(undApprover(sel[0])) + ' is notified for each one.</div>'
      + '</div></div></div>'
    : "";

  var findings = sc.status === "running"
    ? callout("info", "<b>This run is still reading.</b> " + all.length + " findings are held from an earlier pass and are shown below, but the run will not close and cannot be signed off until it finishes. Findings from the part still being read reach the queue at the end, together.", "clock") + undGroups(list)
    : list.length ? undFindingsFrame(list)
    : emptyState("Nothing matches those filters", anyFilter ? "Clear a filter, or widen the confidence band." : "This run produced no findings.", "filter")
      + (anyFilter ? '<div class="rowflex" style="justify-content:center"><button class="btn" onclick="undClear()">' + I2.refresh + 'Clear filters</button></div>' : "");

  if(UNDV.mine && !list.length && mineN === 0){
    findings = callout("mut", "<b>None of these are yours to decide.</b> " + esc2(undMe()) + " is not the named approver on anything in this run. "
      + esc2(all.map(function(f){ return undApprover(f); }).filter(function(v, i, a){ return a.indexOf(v) === i; }).join(", "))
      + " hold them. You can read every finding and every piece of evidence behind it — that part is not restricted, and it should not be.", "people")
      + '<div class="rowflex" style="justify-content:center;margin-top:12px"><button class="btn" onclick="undMine()">' + I2.refresh + 'Show all findings</button></div>';
  }

  h += '<div class="split left">'
    + '<div>' + undRunsRail(sc) + undProgress(sc) + '</div>'
    + '<div>'
      + '<div class="eyebrow2" style="margin-bottom:8px">1 · What it opened</div>' + undManifest(sc, k)
      + '<div class="eyebrow2" style="margin:24px 0 8px">2 · What it concluded</div>'
      + '<div class="rowflex" style="margin-bottom:12px">'
      + '<span class="mutedtext" style="font-size:12.5px"><b>' + list.length + '</b> of ' + all.length
        + ' findings' + (pend.length ? ' · ' + pend.length + ' still waiting on a person' : ' · all decided') + '</span></div>'
      + chips + bulk + findings
      + '<div class="eyebrow2" style="margin:24px 0 8px">3 · The proof</div>' + undEvidenceIndex(sc)
    + '</div></div>';

  h += '<div style="margin-top:20px">'
    + callout("mut", "This run cost " + esc2(sc.cost) + " and took " + esc2(sc.duration) + ". Reading a source is cheap; being wrong about what it means is not. "
      + "Spiff would rather spend fifteen minutes reading eighty-eight service classes than infer a definition from a column name — and rather hand you a weak finding labelled weak than a confident one it cannot show you the evidence for.", "spark")
    + '</div>';

  $("#view-understand").innerHTML = h;
  crumbTrail([["Sources", "go('sources')"], [esc2(src ? src.name : sc.sourceId), "openSource('" + undQ(sc.sourceId) + "')"], [esc2(sc.label), null]]);
}
V2ROUTES.understand = renderUnderstand;
</script>
