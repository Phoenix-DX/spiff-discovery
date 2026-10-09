<script>
/* =====================================================================
   SPIFF v2 — SOURCES
   The raw material Spiff learns from: databases, code, documents,
   spreadsheets, APIs — plus the scans that read them and the findings
   those scans put in front of a human.
   Registering a source never grants anyone access to it. It only lets
   Spiff read the source to work out what it means.
   Made-up data. Nothing here connects to anything.
   ===================================================================== */

/* ---------- the five kinds of raw material ---------- */
const SRC_KINDS = [
  {
    id:"database", name:"Database", icon:"db",
    desc:"A live schema Spiff can read the shape of — tables, keys, constraints and the comments people left behind.",
    reads:"Table and column definitions, primary and foreign keys, indexes, check constraints, views, stored procedures and column comments.",
    examples:["Azure SQL","SQL Server","PostgreSQL","Snowflake","MySQL"]
  },
  {
    id:"code", name:"Code repository", icon:"flow",
    desc:"Where the rules actually live. A schema says what a column is; the code says what it means and when it counts.",
    reads:"Migrations, ORM models, validators, service logic, tests, README and inline comments.",
    examples:["GitHub","Azure DevOps","GitLab","Bitbucket"]
  },
  {
    id:"docs", name:"Document library", icon:"book",
    desc:"The written agreements — data dictionaries, policies, retention schedules. The place a rule is supposed to be recorded.",
    reads:"Data dictionaries, policy documents, retention schedules, handbooks, and the tables inside them.",
    examples:["SharePoint","Confluence","A folder of PDFs"]
  },
  {
    id:"files", name:"Spreadsheets & files",  icon:"file",
    desc:"The workbooks a team keeps by hand. Rarely tidy, often the only place a number exists.",
    reads:"Sheet and column headers, formulas, named ranges, data types, and whatever notes people left in the margins.",
    examples:["Excel on OneDrive","CSV drops","Google Sheets","Scanned PDFs"]
  },
  {
    id:"api", name:"API", icon:"plug",
    desc:"A system that will only talk through its own front door. Spiff learns the shape from the contract, not the tables.",
    reads:"The OpenAPI or GraphQL spec, endpoint shapes, field types, enumerations, error contracts and rate limits.",
    examples:["REST + OpenAPI","GraphQL","SOAP","A vendor SDK"]
  }
];

/* ---------- the estate, as registered ---------- */
const SOURCES_REG = [
{
  id:"assemble-db", name:"Assemble — events database", kind:"database", system:"assemble",
  vendor:"Azure SQL", location:"gst-sql-prod.ubt.internal/Assemble",
  auth:{
    mode:"run-as", who:"Whoever is asking",
    note:"Every query is issued under the asking person's own database identity through the Assemble gateway. If they cannot see a row in Assemble, Spiff cannot see it for them either.",
    risk:"low"
  },
  scope:["assemble.dbo — managed events, event types, invitations, recurrence patterns","assemble.ref — event types, statuses, venues","Views in assemble.reporting"],
  exclusions:["assemble.audit — Spiff has its own log and does not need Assemble's","Payment tables in assemble.fin — nothing in Spiff needs them","Free-text event notes"],
  state:"connected", stateNote:"",
  added:"14 Jan 2026", addedBy:"Marcus Vilakazi", lastScan:"27 Aug 2026", nextScan:"Sunday 02:00",
  yield:{tables:64, fields:812, datasets:4, rules:2, definitions:0},
  coverage:91,
  health:{uptime:"99.94%", errRate:"0.1%", latency:"210 ms"},
  owner:"Pavitra Govender",
  notes:"The oldest and best-understood source in the estate. Four catalogue datasets trace to it. What it does not explain is why a number is what it is — that came from the repository next door."
},
{
  id:"connect-repo", name:"connect-userlogevents", kind:"code", system:"connect",
  vendor:"GitHub Enterprise Cloud", location:"github.com/UBT-global-software/connect-userlogevents",
  auth:{
    mode:"read-only-key", who:"spiff-read (deploy key, this repository only)",
    note:"A read-only deploy key scoped to one repository. It reads source code and never touches Connect's data — no member record passes through this connection.",
    risk:"low"
  },
  scope:["src/Connect.UserLogEvents.Api — service logic and validators","db/migrations — every schema change since Sept 2018","tests/ — the behaviour the team asserts is true","README.md and docs/"],
  exclusions:[".github/workflows — build config, no business meaning","Anything under vendor/ or node_modules/","Commit messages and pull request text"],
  state:"connected", stateNote:"",
  added:"22 Jan 2026", addedBy:"Ezra Haddad", lastScan:"29 Aug 2026", nextScan:"On the next merge to main",
  yield:{tables:6, fields:41, datasets:0, rules:6, definitions:2},
  coverage:88,
  health:{uptime:"100%", errRate:"0%", latency:"1.9 s"},
  owner:"Reneilwe Dlomo",
  notes:"This is the source that taught Spiff what attendance means. The four-hour de-duplication window, the cancelled-meeting exclusion and the visitor split were all read out of AttendanceService.cs — none of them were written down anywhere else. Six tables and forty-one derived fields exist only in this code and never appear in the database schema."
},
{
  id:"directory-db", name:"Directory — member database", kind:"database", system:"directory",
  vendor:"Microsoft SQL Server 2022", location:"gst-sql-prod.ubt.internal/Directory",
  auth:{
    mode:"run-as", who:"Whoever is asking",
    note:"Queries run under the asking person's Directory identity. Row-level security in Directory itself is the first line; Spiff's own rules are the second.",
    risk:"low"
  },
  scope:["directory.dbo — members, households, localities, appointments","directory.ref — statuses, localities, subdivisions","reporting.* — point-in-time functions"],
  exclusions:["directory.pastoral — pastoral notes, denied at the connection","directory.care_note — care records, denied at the connection","directory.safeguarding — denied at the connection","id_number: the column does not exist in this database"],
  state:"connected", stateNote:"",
  added:"14 Jan 2026", addedBy:"Marcus Vilakazi", lastScan:"24 Aug 2026", nextScan:"Sunday 02:00",
  yield:{tables:71, fields:934, datasets:4, rules:2, definitions:0},
  coverage:84,
  health:{uptime:"99.98%", errRate:"0.2%", latency:"120 ms"},
  owner:"Sindi Mthembu",
  notes:"The three pastoral schemas are excluded in the connection string, not in the query — Spiff cannot reach them even by mistake, and a query that names one fails closed. That exclusion is why coverage sits at 84 and not higher, and it is meant to."
},
{
  id:"directory-repo", name:"directory-core", kind:"code", system:"directory",
  vendor:"GitHub Enterprise Cloud", location:"github.com/UBT-global-software/directory-core",
  auth:{
    mode:"read-only-key", who:"spiff-read (deploy key, this repository only)",
    note:"Read-only, one repository, code only. It cannot read Directory's data and it cannot write anything back.",
    risk:"low"
  },
  scope:["src/Directory.Api — projections, guards and consent filters","db/migrations","reporting/ — the point-in-time SQL functions","docs/membership-handbook.md"],
  exclusions:["src/Directory.Pastoral — the pastoral module is not read at all","Integration test fixtures containing invented member names"],
  state:"scanning",
  stateNote:"A full re-read started at 09:12 this morning after the consent refactor merged — findings will reach the review queue when it finishes.",
  added:"05 Feb 2026", addedBy:"Ezra Haddad", lastScan:"in progress — started 09:12 today", nextScan:"On the next merge to main",
  yield:{tables:4, fields:29, datasets:0, rules:4, definitions:1},
  coverage:62,
  health:{uptime:"100%", errRate:"0%", latency:"2.6 s"},
  owner:"Sindi Mthembu",
  notes:"Coverage is the lowest of the four well-connected sources because a third of this repository is the pastoral module, which is deliberately never opened. The rest is where the masking and consent rules come from."
},
{
  id:"orbit-api", name:"Orbit Travel API", kind:"api", system:"orbit",
  vendor:"Orbit Travel Systems (Pty) Ltd", location:"https://api.orbit-travel.co.za/v2",
  auth:{
    mode:"oauth-per-user", who:"Each person, in their own name",
    note:"Every person authorises Orbit themselves and Spiff holds their token, not a shared one. Orbit's own logs show the individual. When a token expires, that person's answers stop — nobody else's do.",
    risk:"medium"
  },
  scope:["/bookings — flights, cars, accommodation","/itineraries — stitched journeys","/suppliers — airlines and hotel chains on contract","The published OpenAPI spec, v2026-07-28"],
  exclusions:["Passport and identity document numbers — dropped in Orbit's own mapper before the response leaves","Payment instruments and card tokens","Anything outside the ±30 day travel window"],
  state:"needs-reauth",
  stateNote:"The delegated token expired on 24 Aug. Nothing has been read since, and the two travel datasets are quietly ageing.",
  added:"03 Mar 2026", addedBy:"Colette Marais", lastScan:"11 Aug 2026", nextScan:"Held — reconnect first",
  yield:{tables:12, fields:186, datasets:2, rules:2, definitions:0},
  coverage:47,
  health:{uptime:"97.2%", errRate:"3.4%", latency:"1.4 s"},
  owner:"Colette Marais",
  notes:"The lowest coverage of any live source, and the reason is honest: an API tells you the shape of a response and nothing about the reasoning behind it. There is no code and no data dictionary on the UBT side of this one."
},
{
  id:"gst-docs", name:"GST Data Governance library", kind:"docs", system:null,
  vendor:"SharePoint Online", location:"ubtgst.sharepoint.com/sites/gst-data/GST Data Governance",
  auth:{
    mode:"run-as", who:"Whoever is asking",
    note:"Read through Microsoft Graph as the person asking. A document somebody cannot open in SharePoint is a document Spiff will not quote to them.",
    risk:"low"
  },
  scope:["GST Data Dictionary v7 (PDF, 84 pages)","Publication Standard v4","Disclosure Control v4","Retention Schedule v4","UBT Safeguarding Policy 2026","Membership Handbook 2026"],
  exclusions:["Drafts folder — nothing unpublished is read","Meeting minutes","Anything marked Confidential — HR by label"],
  state:"connected", stateNote:"",
  added:"19 Feb 2026", addedBy:"Reneilwe Dlomo", lastScan:"21 Aug 2026", nextScan:"15 Sep 2026",
  yield:{tables:0, fields:0, datasets:0, rules:5, definitions:2},
  coverage:71,
  health:{uptime:"99.9%", errRate:"0.4%", latency:"640 ms"},
  owner:"Marcus Vilakazi",
  notes:"Five published rules and three agreed definitions trace back to a paragraph in one of these documents. It is also the source that most often disagrees with the code — which is exactly what makes it worth reading."
},
{
  id:"stats-sheets", name:"Statistics — monthly returns", kind:"files", system:null,
  vendor:"OneDrive for Business", location:"Statistics Team/Monthly Returns/",
  auth:{
    mode:"run-as", who:"Whoever is asking",
    note:"Read as the person asking. Most of the division cannot open this folder, and for them these workbooks simply are not there.",
    risk:"low"
  },
  scope:["Monthly Returns 2026.xlsx — one sheet per locality","Monthly Returns 2025.xlsx","Locality Reference.xlsx","Twelve regional submission workbooks"],
  exclusions:["Anything in the Working folder — half-finished by definition","Personal copies with a name in the filename"],
  state:"error",
  stateNote:"Three of the twelve workbooks failed to read on 29 Aug: two are password-protected and one has merged header cells Spiff will not guess at.",
  added:"07 Jul 2026", addedBy:"Pavitra Govender", lastScan:"29 Aug 2026 — failed", nextScan:"Held — fix the three workbooks first",
  yield:{tables:12, fields:97, datasets:0, rules:0, definitions:0},
  coverage:23,
  health:{uptime:"—", errRate:"25%", latency:"4.8 s"},
  owner:"Pavitra Govender",
  notes:"The messiest source in the estate and the most valuable. Numbers exist here that exist nowhere else — and one of them disagrees with the figure the systems produce by 3.1%. Nothing from this source has been accepted into the catalogue yet, which is why coverage is 23."
},
{
  id:"warehouse", name:"Connect database", kind:"database", system:"connect",
  vendor:"Azure SQL", location:"connect-prod.ubteam.com/Connect",
  auth:{
    mode:"service-account", who:"SPIFF_CONNECT_RO",
    note:"Spiff reads Connect as one shared read-only account that can see every row. Per-viewer scoping cannot be proved here — Spiff re-applies it after the read rather than the database enforcing it, and the server's own logs show the service account, not the person who asked. Spiff's activity log still names the person, but that is Spiff's word for it, not the database's.",
    risk:"high"
  },
  scope:["dbo.RoleDomains, dbo.UserRolesDomains, dbo.Roles — the access model","dbo.ConnectMessages, dbo.MessageDeliveries — notices and delivery","dbo.ConnectPolls, dbo.ConnectPollOptions — polls","dbo.Sites, dbo.PointsOfInterest — places","dbo.UserLogEvents, dbo.OldUserEvents — activity"],
  exclusions:["dbo.ConnectMessages.Body — message content is never read, only delivery metadata","dbo.RefreshTokens, dbo.UserLogins, dbo.UserDevices — credentials and device records","dbo.MyDetailsChangeRequests — in-flight personal data changes","dbo.Audits, dbo.Log — Connect's own internal logs"],
  state:"connected", stateNote:"",
  added:"28 Jan 2026", addedBy:"Marcus Vilakazi", lastScan:"26 Aug 2026", nextScan:"Sunday 03:00",
  yield:{tables:38, fields:503, datasets:5, rules:3, definitions:2},
  coverage:79,
  health:{uptime:"99.7%", errRate:"0.6%", latency:"90 ms"},
  owner:"Marcus Vilakazi",
  notes:"Connect is ninety tables, and only a fraction of them are reporting material — the rest are credentials, device records and the application's own logs, and those are excluded at the connection rather than filtered in the query. The shared read-only account is the one honest weak point in the estate, and there is an open action to replace it with per-user credentials."
},
{
  id:"finance-erp", name:"Finance — not established", kind:"database", system:"none",
  vendor:"—", location:"—",
  auth:{
    mode:"service-account", who:"Proposed: SPIFF_FIN_RO",
    note:"No finance system has been identified yet, so there is nothing to authenticate against. The request is open on the assumption that one will be named. Until it is, this is a placeholder for a gap rather than a source waiting on a switch.",
    risk:"high"
  },
  scope:["Requested: cost centres, budget lines, commitments","Requested: supplier reference data"],
  exclusions:["Contributions and donations — not requested, and would be refused","Payroll — out of scope for Spiff entirely","Bank details and payment runs"],
  state:"pending-approval",
  stateNote:"Requested by Brendan Jooste on 26 Aug. Waiting on Adriaan de Villiers as Finance data owner, and on a service-account exception from the Platform Admins.",
  added:"26 Aug 2026 (requested)", addedBy:"Brendan Jooste", lastScan:"Never", nextScan:"—",
  yield:{tables:0, fields:0, datasets:0, rules:0, definitions:0},
  coverage:0,
  health:{uptime:"—", errRate:"—", latency:"—"},
  owner:"Adriaan de Villiers",
  notes:"Nothing has been read. Nothing will be read until two named people say yes. Registering a source is itself a governed act — this is what that looks like when the answer is not yet."
}
];

/* ---------- what each state means ---------- */
const SRC_STATE = {
  "connected":        {label:"Connected",           cls:"ok",   note:"Reachable, authorised and scanning on schedule."},
  "needs-reauth":     {label:"Needs re-authorising",cls:"warn", note:"The sign-in behind it has expired. Nothing is read until a person signs in again."},
  "error":            {label:"Failing",             cls:"crit", note:"The last read did not finish. What Spiff knows from it is going stale."},
  "scanning":         {label:"Scanning now",        cls:"info", note:"A read is running. Findings reach the review queue when it finishes."},
  "pending-approval": {label:"Awaiting approval",   cls:"mut",  note:"Registered but not connected. A named data owner has to say yes first."}
};

/* ---------- understanding runs ---------- */
const SCANS = [
{
  id:"scan-arepo-3", sourceId:"connect-repo", label:"Full re-read after the check-in rewrite",
  startedAt:"29 Aug 2026 07:04", finishedAt:"29 Aug 2026 07:19", by:"Scheduled — merge to main",
  status:"needs-review", trigger:"Code change detected",
  read:[
    {kind:"Migrations",   count:62, note:"Every schema change since Sept 2018."},
    {kind:"ORM models",   count:41, note:"Entity classes and their configuration."},
    {kind:"Validators",   count:23, note:"Where the refusals live."},
    {kind:"Service logic",count:88, note:"The classes that decide what counts."},
    {kind:"Tests",        count:214,note:"Asserted behaviour, read as evidence."},
    {kind:"Docs & comments",count:19,note:"README, docs/ and inline comments."}
  ],
  proposed:{datasets:2, fields:41, joins:9, rules:6, definitions:4},
  accepted:5, edited:1, rejected:0, pending:2,
  duration:"15 min", cost:"NZ$ 95"
},
{
  id:"scan-arepo-1", sourceId:"connect-repo", label:"First read on registration",
  startedAt:"22 Jan 2026 11:30", finishedAt:"22 Jan 2026 12:02", by:"Ezra Haddad",
  status:"complete", trigger:"On registration",
  read:[
    {kind:"Migrations",   count:54, note:"The schema as it stood in January."},
    {kind:"ORM models",   count:38, note:"Entity classes and their configuration."},
    {kind:"Service logic",count:71, note:"Read end to end, first pass."},
    {kind:"README",       count:1,  note:"The only written description that existed."}
  ],
  proposed:{datasets:4, fields:96, joins:14, rules:8, definitions:3},
  accepted:1, edited:0, rejected:0, pending:0,
  duration:"32 min", cost:"NZ$ 140"
},
{
  id:"scan-adb-4", sourceId:"assemble-db", label:"Weekly structure scan",
  startedAt:"27 Aug 2026 02:00", finishedAt:"27 Aug 2026 02:06", by:"Scheduled",
  status:"complete", trigger:"Scheduled",
  read:[
    {kind:"Tables",   count:64,  note:"Including six added since the last scan."},
    {kind:"Columns",  count:812, note:"Types, nullability and defaults."},
    {kind:"Keys & indexes", count:147, note:"Where the grain is actually declared."},
    {kind:"Views",    count:11,  note:"Reporting views in assemble.reporting."},
    {kind:"Column comments", count:206, note:"Weak evidence, treated as such."}
  ],
  proposed:{datasets:0, fields:18, joins:6, rules:1, definitions:0},
  accepted:2, edited:0, rejected:1, pending:0,
  duration:"6 min", cost:"NZ$ 18"
},
{
  id:"scan-drepo-2", sourceId:"directory-repo", label:"Re-read after the consent refactor",
  startedAt:"31 Aug 2026 09:12", finishedAt:"—", by:"Scheduled — merge to main",
  status:"running", trigger:"Code change detected",
  read:[
    {kind:"Migrations",   count:47, note:"Read."},
    {kind:"ORM models",   count:33, note:"Read."},
    {kind:"Validators",   count:29, note:"Read — this is where consent is decided."},
    {kind:"Service logic",count:52, note:"In progress, 52 of about 90."},
    {kind:"Handbook",     count:1,  note:"docs/membership-handbook.md."}
  ],
  proposed:{datasets:1, fields:29, joins:7, rules:4, definitions:2},
  accepted:1, edited:0, rejected:0, pending:5,
  duration:"running — 41 min so far", cost:"NZ$ 130 so far"
},
{
  id:"scan-ddb-3", sourceId:"directory-db", label:"Weekly structure scan",
  startedAt:"24 Aug 2026 02:00", finishedAt:"24 Aug 2026 02:09", by:"Scheduled",
  status:"complete", trigger:"Scheduled",
  read:[
    {kind:"Tables",   count:71,  note:"Three excluded schemas were not opened."},
    {kind:"Columns",  count:934, note:"Types, nullability and sensitivity labels."},
    {kind:"Keys & indexes", count:198, note:"Foreign keys give the join paths."},
    {kind:"Functions",count:14,  note:"reporting.fn_* point-in-time functions."}
  ],
  proposed:{datasets:0, fields:22, joins:11, rules:2, definitions:0},
  accepted:2, edited:0, rejected:0, pending:0,
  duration:"9 min", cost:"NZ$ 24"
},
{
  id:"scan-docs-2", sourceId:"gst-docs", label:"Governance library re-read",
  startedAt:"21 Aug 2026 04:00", finishedAt:"21 Aug 2026 04:26", by:"Scheduled",
  status:"needs-review", trigger:"Scheduled",
  read:[
    {kind:"PDF pages",  count:311, note:"Six published documents."},
    {kind:"Tables in documents", count:44, note:"Extracted and read as data."},
    {kind:"Definitions", count:63, note:"Candidate terms found in the dictionary."}
  ],
  proposed:{datasets:0, fields:0, joins:0, rules:5, definitions:6},
  accepted:3, edited:0, rejected:0, pending:0,
  duration:"26 min", cost:"NZ$ 110"
},
{
  id:"scan-sheets-2", sourceId:"stats-sheets", label:"Monthly returns read",
  startedAt:"29 Aug 2026 06:00", finishedAt:"29 Aug 2026 06:12", by:"Scheduled",
  status:"failed", trigger:"Scheduled",
  read:[
    {kind:"Workbooks opened", count:9, note:"Of twelve. Two are password-protected, one has merged headers."},
    {kind:"Sheets",   count:74, note:"One per locality per year, plus reference sheets."},
    {kind:"Formulas", count:412,note:"Read to work out which columns are derived."},
    {kind:"Margin notes", count:31, note:"Free text in cells beside the numbers."}
  ],
  proposed:{datasets:1, fields:97, joins:2, rules:1, definitions:0},
  accepted:0, edited:0, rejected:0, pending:2,
  duration:"12 min, then failed", cost:"NZ$ 36"
},
{
  id:"scan-wh-3", sourceId:"warehouse", label:"Connect database scan",
  startedAt:"26 Aug 2026 03:00", finishedAt:"26 Aug 2026 03:14", by:"Scheduled",
  status:"complete", trigger:"Scheduled",
  read:[
    {kind:"Models",   count:38,  note:"dbt models in marts and ref."},
    {kind:"Columns",  count:503, note:"With the descriptions from schema.yml."},
    {kind:"dbt tests",count:126, note:"A passing test is an assertion about meaning."},
    {kind:"Model SQL",count:38,  note:"Read for filters that change what a number is."}
  ],
  proposed:{datasets:2, fields:44, joins:8, rules:3, definitions:3},
  accepted:2, edited:0, rejected:0, pending:0,
  duration:"14 min", cost:"NZ$ 62"
},
{
  id:"scan-orbit-2", sourceId:"orbit-api", label:"Spec and sample-shape read",
  startedAt:"11 Aug 2026 05:00", finishedAt:"11 Aug 2026 05:04", by:"Scheduled",
  status:"complete", trigger:"Scheduled",
  read:[
    {kind:"Spec paths", count:34, note:"OpenAPI 2026-07-28."},
    {kind:"Schemas",    count:52, note:"Response shapes and enumerations."},
    {kind:"Sample responses", count:120, note:"Shape only, values discarded immediately."}
  ],
  proposed:{datasets:0, fields:12, joins:3, rules:2, definitions:0},
  accepted:1, edited:0, rejected:0, pending:0,
  duration:"4 min", cost:"NZ$ 12"
}
];

/* ---------- findings: one plain sentence a non-engineer can judge ---------- */
const FINDINGS = [

/* ===== assemble-repo · full re-read (the big one) ===== */
{
  id:"f-att-def", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"rule",
  statement:"Attendance excludes cancelled meetings and any second check-in within four hours.",
  detail:"The counting code drops every check-in whose meeting was cancelled, and collapses repeat scans by the same member inside a four-hour window to the first one. This is why a raw count of check-ins is always higher than the published attendance figure, and it is the difference people argue about most.",
  confidence:96, status:"accepted", creates:{kind:"definition", target:"Attendance"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"code", ref:"src/Connect.UserLogEvents.Api/Attendance/AttendanceService.cs:112", label:"The counting query", lang:"csharp", snippet:
"private const long FourHours = TimeSpan.TicksPerHour * 4;\n\npublic IQueryable<CheckIn> Countable(IQueryable<CheckIn> src) =>\n    src.Where(c => c.Meeting.Status != MeetingStatus.Cancelled)\n       .Where(c => c.Kind == CheckInKind.Member)\n       .GroupBy(c => new { c.MemberId, c.OccurrenceId,\n                           Window = c.ScannedAtUtc.Ticks / FourHours })\n       .Select(g => g.OrderBy(c => c.ScannedAtUtc).First());"},
    {kind:"code", ref:"tests/Attendance/DedupeTests.cs:41", label:"The test that pins the window", lang:"csharp", snippet:
"[Fact]\npublic void Second_scan_inside_four_hours_is_the_same_arrival()\n{\n    Scan(member: 4088, at: \"18:02\");\n    Scan(member: 4088, at: \"20:31\");\n    Count().Should().Be(1);\n}"}
  ]
},
{
  id:"f-meet-grain", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"grain",
  statement:"One row per member per meeting occurrence.",
  detail:"A unique index on member and occurrence, filtered to non-void rows, makes the grain explicit in the database rather than implied by convention. Anything that counts rows without collapsing to this grain will double-count a member who was scanned twice.",
  confidence:98, status:"accepted", creates:{kind:"dataset", target:"meetings"},
  needs:"Dataset owner",
  evidence:[
    {kind:"code", ref:"db/migrations/0042_add_checkin.sql", label:"The unique index that declares the grain", lang:"sql", snippet:
"CREATE UNIQUE INDEX ux_attendance_member_occurrence\n    ON dbo.UserLogEvents (member_id, occurrence_id)\n    WHERE is_void = 0;\n\nALTER TABLE dbo.UserLogEvents\n    ADD CONSTRAINT ck_attendance_flag CHECK (checked_in IN (0,1));"}
  ]
},
{
  id:"f-checkin-src", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"field",
  statement:"checked_in is set by the door scanner, never by a secretary marking a register.",
  detail:"Only the device endpoint can set the flag; the manual endpoint writes an expectation, not an attendance. Localities without a scanner therefore look like zero attendance rather than missing data, which is a real reporting trap and needs to be said out loud on the field.",
  confidence:89, status:"edited", creates:{kind:"field", target:"meetings.checked_in"},
  needs:"Dataset owner",
  evidence:[
    {kind:"code", ref:"src/Connect.UserLogEvents.Api/CheckIn/CheckInController.cs:64", label:"Only the device path sets the flag", lang:"csharp", snippet:
"[HttpPost(\"device/{deviceId}/scan\")]              // the door scanner\npublic async Task<IActionResult> Scan(string deviceId, ScanDto dto)\n{\n    var c = await _svc.Record(dto, source: CheckInSource.Device);\n    c.CheckedIn = true;              // set here and nowhere else\n    return Ok(c);\n}\n\n[HttpPost(\"register/{occurrenceId}\")]              // manual register\npublic Task<IActionResult> Expect(int o, ExpectDto d) => _svc.Expect(o, d);"}
  ]
},
{
  id:"f-youth-conflict", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"conflict",
  statement:"The code counts a Youth meeting as a Regular meeting. The data dictionary says Youth is counted separately.",
  detail:"Two sources of truth disagree about a number people publish every month. Spiff will not pick a winner: until a steward decides, questions about meeting counts carry a note saying the two figures differ and by how much.",
  confidence:61, status:"pending", creates:{kind:"rule", target:"Meeting type roll-up"},
  needs:"Data Steward",
  conflict:"Conflicts with GST Data Dictionary v7 p.14, which states Youth meetings are never rolled into the Regular count. On July's figures the two readings differ by 1,842 meetings.",
  evidence:[
    {kind:"code", ref:"src/Connect.UserLogEvents.Api/Meetings/MeetingTypeMap.cs:18", label:"What the code does", lang:"csharp", snippet:
"public static bool CountsAsRegular(MeetingType t) =>\n    t == MeetingType.Regular || t == MeetingType.Youth;\n    // TODO(rh 2024-11): stats asked for this, check with Pavitra"},
    {kind:"doc", ref:"GST Data Dictionary v7, p.14 — Meeting type", label:"What the dictionary says", lang:"text", snippet:
"Regular, Special, Youth, Care and Cancelled are counted\nseparately. A Youth meeting is never rolled into the Regular\ncount; the two have different expected lists and different\nreporting lines."}
  ]
},
{
  id:"f-checkin-join", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"join",
  statement:"A check-in joins a meeting through occurrence_id, and only ever inside the same locality.",
  detail:"Every query in the service applies a locality guard alongside the join. Joining on occurrence alone would silently pull in check-ins recorded at a shared venue by a different locality, which happens at joint meetings four or five times a year.",
  confidence:92, status:"accepted", creates:{kind:"join", target:"checkins → meetings"},
  needs:"Dataset owner",
  evidence:[
    {kind:"code", ref:"src/Connect.UserLogEvents.Api/Attendance/OccurrenceQuery.cs:37", label:"The guard travels with the join", lang:"csharp", snippet:
"from c in db.CheckIns\njoin o in db.Occurrences on c.OccurrenceId equals o.Id\nwhere o.LocalityId == c.LocalityId          // joint meetings\nselect new { c, o };"}
  ]
},
{
  id:"f-reg-retention", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"retention",
  statement:"Event registrations are purged 13 months after the event closes.",
  detail:"A scheduled job hard-deletes registration rows thirteen months after an event closes, and the retention schedule says the same thing in writing. Any question about registrations more than thirteen months old will come back empty — and Spiff should say the data was destroyed, not that nobody registered.",
  confidence:93, status:"accepted", creates:{kind:"rule", target:"r-retention-reg"},
  needs:"Data Steward",
  evidence:[
    {kind:"code", ref:"jobs/retention.yml", label:"The scheduled job", lang:"yaml", snippet:
"- name: purge-registrations\n  schedule: \"0 2 * * 0\"\n  target: assemble.registration\n  where: \"event_closed_at < dateadd(month, -13, getutcdate())\"\n  action: hard-delete\n  approved_by: Data Steward\n  keeps: [attendance_count]      # the derived count survives"},
    {kind:"doc", ref:"GST Retention Schedule v4, p.11", label:"The written schedule agrees", lang:"text", snippet:
"Event registration records, including dietary and accessibility\nnotes, are destroyed thirteen months after the event closes.\nThe attendance count derived from them is kept indefinitely."}
  ]
},
{
  id:"f-minor-dob", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"sensitivity",
  statement:"member.date_of_birth is personal data and is never returned for anyone under 18.",
  detail:"The projection removes the field entirely rather than masking it, so nothing downstream can infer it from a placeholder. The safeguarding policy requires exactly this, for every role and every purpose, which makes it a rule rather than a preference.",
  confidence:97, status:"accepted", creates:{kind:"rule", target:"r-minor-dob"},
  needs:"Safeguarding Lead",
  evidence:[
    {kind:"code", ref:"src/Assemble.Api/Members/MemberProjection.cs:88", label:"Absent, not masked", lang:"csharp", snippet:
"if (member.Age < 18)\n{\n    dto.DateOfBirth = null;      // absent, not rounded, not masked\n    dto.AgeBand     = null;\n    _audit.Suppressed(member.Id, reason: \"minor\");\n}"},
    {kind:"doc", ref:"UBT Safeguarding Policy 2026, s.4.2, p.14", label:"The policy that requires it", lang:"text", snippet:
"No system operated by the division may return the exact date of\nbirth of a person under eighteen, to any role, for any purpose.\nWhere age is genuinely needed, a band of ten years is used."}
  ]
},
{
  id:"f-legacy-flag", scanId:"scan-arepo-3", sourceId:"connect-repo", type:"field",
  statement:"legacy_flag appears to mark meetings imported from the 2018 system, but nothing confirms it.",
  detail:"The only evidence is a seven-year-old column comment left by someone who has since left. No code reads the column, no test covers it, and no document mentions it. Spiff is reporting this so a human can decide, not proposing it as a fact.",
  confidence:41, status:"pending", creates:{kind:"field", target:"meetings.legacy_flag"},
  needs:"Dataset owner",
  evidence:[
    {kind:"comment", ref:"dbo.MeetingOccurrence — column comment", label:"Weak evidence: a comment, and nothing else", lang:"sql", snippet:
"legacy_flag  bit  NULL\n  -- 'set by the 2018 import, leave alone' (jm, 2019-04-02)\n\n-- no reader found in 88 service classes\n-- no test found in 214 tests\n-- not mentioned in the data dictionary"}
  ]
},

/* ===== assemble-repo · first read ===== */
{
  id:"f-occurrence", scanId:"scan-arepo-1", sourceId:"connect-repo", type:"entity",
  statement:"A meeting occurrence is not the same thing as a meeting series.",
  detail:"The series holds the pattern — Tuesdays at 19:00 at Bellville. The occurrence is the one that happened, with its own status, venue and expected list. Counting series where you meant occurrences understates a year by roughly fifty to one.",
  confidence:95, status:"accepted", creates:{kind:"definition", target:"Meeting"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"code", ref:"db/migrations/0019_split_series.sql", label:"The migration that split them", lang:"sql", snippet:
"CREATE TABLE dbo.MeetingSeries (\n    series_id   int IDENTITY PRIMARY KEY,\n    locality_id int NOT NULL,\n    pattern     varchar(64) NOT NULL);\n\nCREATE TABLE dbo.MeetingOccurrence (\n    occurrence_id int IDENTITY PRIMARY KEY,\n    series_id     int NULL,      -- null for a one-off\n    starts_at_utc datetime2(3) NOT NULL,\n    status_cd     char(3) NOT NULL);"}
  ]
},

/* ===== directory-repo · consent refactor re-read ===== */
{
  id:"f-pastoral-deny", scanId:"scan-drepo-2", sourceId:"directory-repo", type:"sensitivity",
  statement:"Pastoral note tables are refused at the connection, not filtered in the query.",
  detail:"The three pastoral schemas are on a deny list applied when the connection is opened, and the setting is fail-closed. A query that names one of them errors rather than returning nothing, so a mistake is loud instead of silent.",
  confidence:99, status:"accepted", creates:{kind:"rule", target:"r-pastoral-block"},
  needs:"Safeguarding Lead",
  evidence:[
    {kind:"code", ref:"config/spiff-source.yml", label:"Denied at the connection", lang:"yaml", snippet:
"schemas:\n  include: [directory.dbo, directory.ref, reporting]\n  deny:                       # applied when the connection opens\n    - directory.pastoral\n    - directory.care_note\n    - directory.safeguarding\non_deny: fail-closed          # error, never an empty result"}
  ]
},
{
  id:"f-contact-mask", scanId:"scan-drepo-2", sourceId:"directory-repo", type:"rule",
  statement:"Email and mobile are hashed for anyone outside the member's own locality.",
  detail:"The guard returns a stable hash rather than the value, so two rows for the same person still match each other without exposing an address. Counting and de-duplication keep working; contacting the person from outside their locality does not.",
  confidence:94, status:"pending", creates:{kind:"rule", target:"r-contact-mask"},
  needs:"Data Steward",
  evidence:[
    {kind:"code", ref:"src/Directory.Api/Guards/ContactGuard.cs:29", label:"Hash, not withhold", lang:"csharp", snippet:
"public string Email(Member m, Principal who) =>\n    who.LocalityId == m.LocalityId\n        ? m.Email\n        : Hash(m.Email);     // same person, same hash, no address\n\npublic string Mobile(Member m, Principal who) =>\n    who.LocalityId == m.LocalityId ? m.Mobile : Hash(m.Mobile);"}
  ]
},
{
  id:"f-active-pit", scanId:"scan-drepo-2", sourceId:"directory-repo", type:"definition",
  statement:"Active member is read as at the end of the reporting period, not as at the moment the question is asked.",
  detail:"A table-valued function reads the status history for a given date rather than the current status column. This is what stops a report about March drifting every time somebody re-runs it in September, and it is why the current-state table alone must never be used for historic questions.",
  confidence:91, status:"pending", creates:{kind:"definition", target:"Active member"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"code", ref:"reporting/fn_active_member.sql", label:"Point-in-time by construction", lang:"sql", snippet:
"CREATE FUNCTION reporting.fn_active_member (@as_of date)\nRETURNS TABLE AS RETURN\n  SELECT member_id\n  FROM   dbo.Member_History\n  WHERE  @as_of >= valid_from\n    AND  @as_of <  ISNULL(valid_to, '9999-12-31')\n    AND  status_cd = 'ACT';"}
  ]
},
{
  id:"f-transfer-conflict", scanId:"scan-drepo-2", sourceId:"directory-repo", type:"conflict",
  statement:"The code treats a transferred member as active for 30 more days. The membership handbook says membership ends the day the transfer is recorded.",
  detail:"The grace period exists so a member in transit still receives notices, which is a good operational reason and a bad reporting one. Left alone it inflates every regional headcount for a month. Spiff will not choose between them.",
  confidence:58, status:"pending", creates:{kind:"rule", target:"Transfer grace period"},
  needs:"Data Steward",
  conflict:"Conflicts with Membership Handbook 2026 s.2.4. On July's figures the grace period counts 1,206 members in two localities at once.",
  evidence:[
    {kind:"code", ref:"src/Directory.Api/Membership/StatusRules.cs:52", label:"A 30-day grace period", lang:"csharp", snippet:
"// grace period so a transfer in flight still receives notices\npublic bool IsActive(Member m, DateOnly on) =>\n    m.Status == Status.Active ||\n    (m.Status == Status.Transferred &&\n     m.TransferredOn.AddDays(30) >= on);"},
    {kind:"doc", ref:"Membership Handbook 2026, s.2.4", label:"The handbook is unambiguous", lang:"text", snippet:
"Membership of a locality ends on the day a transfer is recorded.\nThe receiving locality's record begins the same day. There is no\nperiod in which a member belongs to both."}
  ]
},
{
  id:"f-consent-gate", scanId:"scan-drepo-2", sourceId:"directory-repo", type:"field",
  statement:"consent_contact decides whether a contact row may be used at all, and withdrawal is permanent until re-given.",
  detail:"The filter drops rows where consent was never given or has been withdrawn, and returns a distinct result meaning no usable contact. That is not the same as no contact on file, and reports that blur the two overstate how reachable a locality is.",
  confidence:88, status:"pending", creates:{kind:"rule", target:"r-consent"},
  needs:"Data Steward",
  evidence:[
    {kind:"code", ref:"src/Directory.Api/Contact/ConsentFilter.cs:17", label:"Two different empties", lang:"csharp", snippet:
"var usable = contacts.Where(c => c.ConsentContact == ConsentState.Given\n                              && c.ConsentWithdrawnOn == null);\n\nif (!contacts.Any())  return ContactResult.NoContactOnFile;\nif (!usable.Any())    return ContactResult.NoUsableContact;   // different"}
  ]
},
{
  id:"f-member-grain", scanId:"scan-drepo-2", sourceId:"directory-repo", type:"grain",
  statement:"One row per member, current state only — every change lives in a separate history table.",
  detail:"The member table is overwritten in place, so it carries no history at all. Anything asking what was true in the past has to go through the history table or the point-in-time function, and a query that does not will quietly answer with today.",
  confidence:96, status:"pending", creates:{kind:"dataset", target:"members"},
  needs:"Dataset owner",
  evidence:[
    {kind:"code", ref:"db/migrations/0007_member_current.sql", label:"Current state, overwritten in place", lang:"sql", snippet:
"CREATE TABLE directory.member (\n    member_id   int          NOT NULL PRIMARY KEY,\n    locality_id int          NOT NULL,\n    ValidFrom   datetime2    NOT NULL,\n    ValidTo     datetime2    NOT NULL,\n    updated_at  datetime2(3) NOT NULL\n);\n-- every change is also appended to member_status_history"}
  ]
},

/* ===== assemble-db · weekly structure scan ===== */
{
  id:"f-stg-checkin", scanId:"scan-wh-3", sourceId:"warehouse", type:"entity",
  statement:"stg_checkin is a staging table that keeps duplicates on purpose, and must never be counted directly.",
  detail:"The comment on the table says the turnstile can fire twice and both rows are kept so a dispute can be traced. It is the raw feed behind attendance, not a reporting table, and the catalogue entry carries that warning.",
  confidence:93, status:"accepted", creates:{kind:"dataset", target:"checkins"},
  needs:"Dataset owner",
  evidence:[
    {kind:"schema", ref:"dbo.UserLogEvents_Staging", label:"Duplicates by design", lang:"sql", snippet:
"-- deliberately un-deduplicated: the turnstile can fire twice and\n-- both rows are kept so a dispute can be traced back to a device\nCREATE TABLE dbo.UserLogEvents_Staging (\n    checkin_id    bigint IDENTITY PRIMARY KEY,\n    member_id     int    NOT NULL,\n    occurrence_id int    NOT NULL,\n    scanned_at    datetime2(3) NOT NULL,\n    device_id     varchar(24)  NULL\n);"}
  ]
},
{
  id:"f-duration-null", scanId:"scan-adb-4", sourceId:"assemble-db", type:"field",
  statement:"duration_min is missing for 4% of meetings held before March 2021.",
  detail:"The column was added part-way through the 2021 season and was never backfilled. Averages over multi-year ranges are computed on the rows that have it, which biases early years slightly long — worth stating on the field rather than leaving people to find it.",
  confidence:97, status:"accepted", creates:{kind:"field", target:"meetings.duration_min"},
  needs:"Dataset owner",
  evidence:[
    {kind:"query-log", ref:"scan probe · dbo.MeetingOccurrence", label:"Counted, not guessed", lang:"sql", snippet:
"SELECT COUNT(*) AS total,\n       SUM(CASE WHEN duration_min IS NULL THEN 1 ELSE 0 END) AS missing\nFROM   dbo.MeetingOccurrence\nWHERE  meeting_dt < '2021-03-01';\n\n-- total 1,204,118 | missing 48,166  (4.0%)"}
  ]
},

/* ===== directory-db · weekly structure scan ===== */
{
  id:"f-personal-cols", scanId:"scan-ddb-3", sourceId:"directory-db", type:"sensitivity",
  statement:"Nine columns in Directory hold personal data, and an identity number is not one of them because it is not stored.",
  detail:"The scan labelled every column against the sensitivity classes and found nine personal ones. It also confirmed a negative worth writing down: there is no identity-number column in this database, so no rule is needed to protect one.",
  confidence:95, status:"accepted", creates:{kind:"rule", target:"r-contact-mask"},
  needs:"Data Steward",
  evidence:[
    {kind:"schema", ref:"directory.member — column classification", label:"Nine personal columns, and one absence", lang:"sql", snippet:
"full_nm    nvarchar(200)   -- Personal\ndob        date            -- Personal\nemail      nvarchar(320)   -- Personal\nmobile     varchar(24)     -- Personal\n-- + 5 more in household and appointment\n\n-- id_number: no such column in this database"}
  ]
},
{
  id:"f-locality-join", scanId:"scan-ddb-3", sourceId:"directory-db", type:"join",
  statement:"A member's scope is their locality. Subdivision hangs below it, country above it, and there is no other supported route.",
  detail:"The member row carries a locality and a subdivision, and nothing else geographic. Subdivision points back up at locality, so subdivision is the finer grain, not a tier above. Country comes from the locality. There is no area column on a member anywhere — Orbit groups localities into areas for travel, and because one locality can sit in several areas at once, that grouping can never carry a permission.",
  confidence:97, status:"accepted", creates:{kind:"join", target:"members → localities"},
  needs:"Dataset owner",
  evidence:[
    {kind:"schema", ref:"directory — foreign keys", label:"The only chain that exists", lang:"sql", snippet:
"ALTER TABLE directory.member\n  ADD CONSTRAINT fk_member_locality\n  FOREIGN KEY (locality_id) REFERENCES directory.locality (locality_id);\n\n-- subdivision.locality_id -> locality.locality_id   (subdivision sits BELOW locality)\n-- locality.country_code   -> country.country_code\n-- no area_id on member, locality or subdivision"},
    {kind:"code", ref:"Directory.UserAccess — IRecordUserAccess", label:"The scope vocabulary the shared library exposes", lang:"csharp", snippet:
"CountryCode  LocalityId  SubdivisionId  RegionId\nHiddenLocalityId  HiddenCountryCode\nHasFreeAccessTo(...)  HasRegionalAccessTo(...)\n\n// there is no AreaId, and no HasAreaAccessTo"}
  ]
},

/* ===== gst-docs · governance library ===== */
{
  id:"f-round5", scanId:"scan-docs-2", sourceId:"gst-docs", type:"rule",
  statement:"Attendance counts published outside the division are rounded to the nearest five.",
  detail:"The publication standard sets the rounding and, importantly, says percentages are calculated before rounding rather than from the rounded figures. Getting that order wrong is how two teams produce different rates from the same data.",
  confidence:86, status:"accepted", creates:{kind:"rule", target:"r-round-base5"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"doc", ref:"GST Publication Standard v4, p.9", label:"Rounding, and the order of operations", lang:"text", snippet:
"Attendance counts published outside the division are rounded to\nthe nearest five. Percentages are given to one decimal place and\nare calculated before rounding, never after."}
  ]
},
{
  id:"f-locality-def", scanId:"scan-docs-2", sourceId:"gst-docs", type:"definition",
  statement:"A locality belongs to exactly one country, and contains one or more subdivisions.",
  detail:"Dual listing was withdrawn in 2024. Before that, a handful of localities appeared under two parents and were quietly double-counted in cluster totals. The definition now says one country per locality, and the join chain in Directory enforces it. Orbit's travel areas are deliberately excluded from this definition: a locality may appear in several of them, which is fine for logistics and fatal for counting.",
  confidence:92, status:"accepted", creates:{kind:"definition", target:"Locality"},
  needs:"Data Steward",
  evidence:[
    {kind:"doc", ref:"GST Data Dictionary v7, p.4 — Locality", label:"The agreed wording", lang:"text", snippet:
"A locality is a recognised local congregation with an appointed\nsecretary. A locality belongs to exactly one subdivision and one\narea. Dual listing was withdrawn in March 2024."}
  ]
},
{
  id:"f-small-count", scanId:"scan-docs-2", sourceId:"gst-docs", type:"rule",
  statement:"No breakdown is published where a cell falls below five, and a second cell is suppressed if the total would give the first away.",
  detail:"Primary suppression alone is not enough: with a published total, one suppressed cell can be recovered by subtraction. The standard requires secondary suppression, which is why an answer sometimes hides a cell that looks perfectly safe on its own.",
  confidence:90, status:"accepted", creates:{kind:"rule", target:"r-small-count"},
  needs:"Data Steward",
  evidence:[
    {kind:"doc", ref:"GST Disclosure Control v4, p.6", label:"Primary and secondary suppression", lang:"text", snippet:
"No breakdown may be published where the cell count is below five.\nWhere suppressing one cell would allow it to be recovered from\nthe published total, a second cell is suppressed as well."}
  ]
},

/* ===== stats-sheets · monthly returns ===== */
{
  id:"f-returns-shape", scanId:"scan-sheets-2", sourceId:"stats-sheets", type:"entity",
  statement:"The monthly returns workbook holds one sheet per locality and one row per locality per month.",
  detail:"The shape is consistent across the nine sheets that opened, which makes the workbook readable as a table even though nobody designed it as one. The three that failed cannot be confirmed, so the shape is proposed rather than established.",
  confidence:74, status:"pending", creates:{kind:"dataset", target:"Monthly returns (Statistics)"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"doc", ref:"Monthly Returns 2026.xlsx — sheet WC, rows 1-4", label:"Read as it is, merged cells and all", lang:"text", snippet:
"Locality: Stellenbosch        Month: 2026-07\n\nLocality    | Expected | Attended | Notes\nBellville   |      412 |      388 | two meetings merged, storm\nDurbanville |      207 |      201 |\nParow       |      318 |      —   | return not submitted"}
  ]
},
{
  id:"f-returns-conflict", scanId:"scan-sheets-2", sourceId:"stats-sheets", type:"conflict",
  statement:"The Statistics team's hand-kept attendance total for July is 3.1% higher than the figure computed from the systems for the same month.",
  detail:"Both numbers are defensible. The workbook counts what secretaries reported; the systems count what was recorded against each member, after de-duplication and after cancelled meetings are dropped. Until somebody decides which one is the published figure, Spiff will show both and name the difference.",
  confidence:68, status:"pending", creates:{kind:"definition", target:"Attendance"},
  needs:"Head of Statistics",
  conflict:"Conflicts with the accepted Attendance definition from the Connect code. The gap is 651 members in Stellenbosch alone and is largest in localities without a door scanner.",
  evidence:[
    {kind:"query-log", ref:"comparison probe · July 2026 · Stellenbosch", label:"The two figures, side by side", lang:"text", snippet:
"Computed from Connect          Jul 2026  WC  attended = 21,004\nMonthly Returns 2026.xlsx      Jul 2026  WC  attended = 21,655\n\ndifference 651  (3.1%)\nlargest gaps: Parow, Kraaifontein, Malmesbury — no scanner"}
  ]
},

/* ===== warehouse + dbt ===== */
{
  id:"f-net-movement", scanId:"scan-wh-3", sourceId:"warehouse", type:"definition",
  statement:"Net movement is joins plus transfers in, less transfers out, lapses and deaths, over a complete calendar month.",
  detail:"The dbt model carries the formula in its description and a test enforces the complete-month rule. This is the definition the National Office publishes, and it is the reason a mid-month figure never appears in a Spiff answer.",
  confidence:95, status:"accepted", creates:{kind:"definition", target:"Net movement"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"code", ref:"models/marts/mart_member_growth.yml", label:"The formula, written down where it runs", lang:"yaml", snippet:
"models:\n  - name: mart_member_growth\n    description: >\n      Net movement = joins + transfers_in - transfers_out\n                   - lapses - deaths, per complete calendar month.\n    tests:\n      - complete_months_only\n      - not_null: [month_end, locality_id]"}
  ]
},
{
  id:"f-complete-months", scanId:"scan-wh-3", sourceId:"warehouse", type:"rule",
  statement:"The in-progress month is filtered out of the growth mart and never reaches an answer.",
  detail:"A partial month reads as a collapse in growth, and it is not one. The model excludes it in SQL rather than relying on the person asking to know. It also means the most recent number available is always last month, which the catalogue says plainly.",
  confidence:97, status:"accepted", creates:{kind:"rule", target:"r-net-movement"},
  needs:"Head of Statistics",
  evidence:[
    {kind:"code", ref:"models/marts/mart_member_growth.sql:31", label:"Excluded in the model, not in the question", lang:"sql", snippet:
"WHERE month_end < DATE_TRUNC('month', CURRENT_DATE())\n  -- a partial month reads as a collapse in growth and is not one;\n  -- the mart simply never emits it"}
  ]
},

/* ===== orbit api ===== */
{
  id:"f-travel-docs", scanId:"scan-orbit-2", sourceId:"orbit-api", type:"sensitivity",
  statement:"Passport and identity document numbers exist in Orbit and are dropped before anything reaches Spiff.",
  detail:"Orbit's own mapper picks an allow-list of safe fields and deletes the document numbers on the way out. Spiff never receives them, so there is nothing to mask, nothing to leak and nothing to retain — which is a stronger guarantee than a masking rule.",
  confidence:99, status:"accepted", creates:{kind:"rule", target:"r-travel-docs"},
  needs:"Data Steward",
  evidence:[
    {kind:"code", ref:"orbit/mappers/booking.ts:14", label:"Allow-list, then delete", lang:"typescript", snippet:
"const SAFE_FIELDS = ['ref','travellerName','origin',\n                     'destination','departsAt','supplier'];\n\nexport function toSpiff(raw: OrbitBooking): SpiffBooking {\n  const out = pick(raw, SAFE_FIELDS);\n  delete (raw as any).passportNumber;   // never leaves this function\n  delete (raw as any).idNumber;\n  return out;\n}"}
  ]
}
];

/* ---------- helpers ---------- */
const srcById   = id => SOURCES_REG.find(s => s.id === id) || null;
const srcKind   = id => SRC_KINDS.find(k => k.id === id) || SRC_KINDS[0];
const scansFor  = sourceId => SCANS.filter(s => s.sourceId === sourceId);
const findingsFor = scanId => FINDINGS.filter(f => f.scanId === scanId);
</script>
