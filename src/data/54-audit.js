<script>
/* =====================================================================
   SPIFF v2 — ACTIVITY LOG
   The event taxonomy and a five-day slice of the log.
   Most reporting tools log the write and forget the read. Spiff logs the
   question, the query, the rows returned, the rows withheld and the
   reason — because "no data" and "not allowed to see the data" are not
   the same answer. Made-up data, no live systems.
   ===================================================================== */

/* ---------- when "now" is, for this mockup ---------- */
/* ---------- the clock ----------
   "Today" is the viewer's today, from their browser's local clock. The fixture was written
   around Friday 11 Sep 2026, 16:20; at load, every event slides forward by the difference so
   the newest event is always a couple of minutes ago and "today" means today. Only a snapshot
   (an answer or notice that names its own date) keeps a fixed date. */
const FX_FIXTURE_NOW = new Date(2026, 8, 11, 16, 20);
const FX_NOW = new Date();
const FX_SHIFT = FX_NOW - FX_FIXTURE_NOW;
const FX_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], FX_DAYS_LONG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const FX_MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], FX_MONS_LONG = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function fxPad(n){ return (n<10?"0":"")+n; }
function fxKey(d){ return d.getFullYear()+"-"+fxPad(d.getMonth()+1)+"-"+fxPad(d.getDate()); }
function fxTime(d){ return fxPad(d.getHours())+":"+fxPad(d.getMinutes()); }
function fxLocalISO(d){ return fxKey(d)+"T"+fxTime(d)+":00"; }
function fxShort(d){ return d.getDate()+" "+FX_MONS[d.getMonth()]+" "+d.getFullYear(); }
/* "today 16:18", "yesterday 09:12", else "Tue 8 Sep 14:02" — the same shape the fixture used */
function fxWhen(d){
  const dayDiff = Math.round((new Date(FX_NOW.getFullYear(),FX_NOW.getMonth(),FX_NOW.getDate()) - new Date(d.getFullYear(),d.getMonth(),d.getDate()))/86400000);
  return (dayDiff===0 ? "today" : dayDiff===1 ? "yesterday" : FX_DAYS[d.getDay()]+" "+d.getDate()+" "+FX_MONS[d.getMonth()])+" "+fxTime(d);
}
/* a fixture timestamp, written as if UTC were the wall clock, slid onto the viewer's clock */
function fxShiftTs(ts){ const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(ts); if(!m) return null; return new Date(new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]).getTime() + FX_SHIFT); }
/* a fixture day label — "Fri 11 Sep", "Mon 7 Sep 2026" — slid the same way */
function fxShiftLabel(str){
  return String(str).replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2}) (Sep|Aug)( 2026)?\b/g, function(_, dow, day, mon, yr){
    const d = new Date(new Date(2026, mon==="Sep"?8:7, +day, 12, 0).getTime() + FX_SHIFT);
    return FX_DAYS[d.getDay()]+" "+d.getDate()+" "+FX_MONS[d.getMonth()]+(yr?" "+d.getFullYear():"");
  });
}
const AUDIT_NOW = FX_NOW;
const FX = { now:FX_NOW, weekday:FX_DAYS_LONG[FX_NOW.getDay()], date:FX_DAYS_LONG[FX_NOW.getDay()]+" "+FX_NOW.getDate()+" "+FX_MONS_LONG[FX_NOW.getMonth()],
             short:fxShort(FX_NOW), time:fxTime(FX_NOW), hour:FX_NOW.getHours(), iso:fxKey(FX_NOW), month:FX_MONS_LONG[FX_NOW.getMonth()]+" "+FX_NOW.getFullYear(),
             dayOfMonth:FX_NOW.getDate(), daysInMonth:new Date(FX_NOW.getFullYear(), FX_NOW.getMonth()+1, 0).getDate() };
/* a dated fixture string — "28 Aug 2026", "17 September", "03 Sep", "Fri 11 Sep" — slid onto the viewer's calendar by whole days */
const FX_SHIFT_DAYS = Math.round((new Date(FX_NOW.getFullYear(),FX_NOW.getMonth(),FX_NOW.getDate()) - new Date(2026,8,11)) / 864e5);
function fxSlideStr(s){
  if(!FX_SHIFT_DAYS || typeof s !== "string" || !/\d/.test(s)) return s;
  /* one pass, one match per date, so nothing slides twice:
     [Fri ]11[–13] Sep[tember][ 2026]  → the same shape, moved by the shift */
  const RE = /(?:\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun) )?\b(\d{1,2})(?:([–-])(\d{1,2}))? (January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)( 20\d\d)?\b/g;
  return s.replace(RE, function(all, dow, d1, dash, d2, mon, yr){
    const long = mon.length > 3 && mon !== "May" ? true : (mon === "May" ? /May/.test(all) && false : false);
    const mi = FX_MONS_LONG.indexOf(mon) >= 0 && mon.length > 3 ? FX_MONS_LONG.indexOf(mon) : FX_MONS.indexOf(mon.slice(0,3));
    if(mi < 0) return all;
    const year = yr ? +yr.trim() : 2026;
    const a = new Date(year, mi, +d1 + FX_SHIFT_DAYS);
    const pad = function(n, like){ return (like.length===2 && n<10 ? "0" : "") + n; };
    const monthOut = (mon.length > 3) ? FX_MONS_LONG[a.getMonth()] : FX_MONS[a.getMonth()];
    let out = (dow ? FX_DAYS[a.getDay()]+" " : "") + pad(a.getDate(), d1);
    if(d2 != null){ const b = new Date(year, mi, +d2 + FX_SHIFT_DAYS); out += dash + pad(b.getDate(), d2); }
    out += " " + monthOut + (yr ? " " + a.getFullYear() : "");
    return out;
  });
}

/* ---------- event groups ---------- */
const AUDIT_GROUPS = [
  {id:"qa",    label:"Question & answer", desc:"What was asked, what came back, and what was done with it."},
  {id:"data",  label:"Data access",       desc:"Every query, every row returned, every row and column withheld."},
  {id:"gov",   label:"Governance",        desc:"Rules, certifications and agreed definitions changing."},
  {id:"iam",   label:"Identity & access", desc:"Requests, approvals, grants, expiries and reviews."},
  {id:"auto",  label:"Automation",        desc:"Scheduled runs, clones, subscriptions and thresholds."},
  {id:"conn",  label:"Connectors",        desc:"Tool calls into UBT systems, and the consent behind them."},
  {id:"admin", label:"Admin",             desc:"Quotas, retention, capabilities and policy."}
];
const auditGroup = id => AUDIT_GROUPS.find(g=>g.id===id) || AUDIT_GROUPS[0];

/* ---------- the taxonomy ---------- */
const AUDIT_KINDS = [
  /* Question & answer */
  {id:"q.asked",        label:"Question asked",          group:"qa",   color:"info",   icon:"msg",     desc:"Someone put a question to Spiff in plain language."},
  {id:"q.answered",     label:"Answer returned",         group:"qa",   color:"ok",     icon:"spark",   desc:"An answer was assembled and shown, with its scope stated."},
  {id:"q.refined",      label:"Answer refined",          group:"qa",   color:"info",   icon:"pencil",  desc:"The asker changed a filter, a grain or a measure and re-ran it."},
  {id:"q.followup",     label:"Follow-up asked",         group:"qa",   color:"info",   icon:"msg",     desc:"A second question asked against the same answer."},
  {id:"q.chart",        label:"Chart changed",           group:"qa",   color:"mut",    icon:"trend",   desc:"The shape of the answer changed. The numbers did not."},
  {id:"q.saved",        label:"Answer saved",            group:"qa",   color:"ok",     icon:"star",    desc:"An answer was kept — saving stores the question, never the rows."},
  {id:"q.opened",       label:"Answer opened by viewer", group:"qa",   color:"info",   icon:"eye",     desc:"Someone opened a shared answer. It re-ran under their identity."},
  {id:"q.export",       label:"Export requested",        group:"qa",   color:"warn",   icon:"down",    desc:"Rows left Spiff. Format, row count and column count are recorded."},
  {id:"q.export_denied",label:"Export denied",           group:"qa",   color:"crit",   icon:"x",       desc:"An export was refused. Nothing left the building."},
  /* Data access */
  {id:"d.query",        label:"Dataset queried",         group:"data", color:"info",   icon:"db",      desc:"A dataset was read. The read is logged, not only the write."},
  {id:"d.rows",         label:"Rows returned",           group:"data", color:"ok",     icon:"list",    desc:"How many rows reached the person, against how many matched."},
  {id:"d.suppressed",   label:"Rows withheld",           group:"data", color:"warn",   icon:"eyeoff",  desc:"Rows existed and were withheld. The viewer was told so."},
  {id:"d.masked",       label:"Column masked",           group:"data", color:"warn",   icon:"lock",    desc:"A column came back hashed, rounded or blank rather than absent."},
  {id:"d.denied",       label:"Access denied",           group:"data", color:"crit",   icon:"x",       desc:"The dataset was not readable by this person. Nothing was returned."},
  {id:"d.sample",       label:"Sample viewed",           group:"data", color:"mut",    icon:"eye",     desc:"Sample rows were opened in the catalogue — masked exactly as a real answer."},
  /* Governance */
  {id:"g.rule_fired",   label:"Rule fired",              group:"gov",  color:"warn",   icon:"shield",  desc:"A business rule changed what a query returned."},
  {id:"g.rule_created", label:"Rule created",            group:"gov",  color:"info",   icon:"plus",    desc:"A new business rule was published."},
  {id:"g.rule_edited",  label:"Rule edited",             group:"gov",  color:"info",   icon:"pencil",  desc:"A live rule changed. Before and after are both kept."},
  {id:"g.rule_suspended",label:"Rule suspended",         group:"gov",  color:"crit",   icon:"warn",    desc:"A rule was switched off for a window. Every query inside it is on this log."},
  {id:"g.certified",    label:"Dataset certified",       group:"gov",  color:"ok",     icon:"shield",  desc:"A steward put their name to a dataset."},
  {id:"g.cert_broken",  label:"Certification broken",    group:"gov",  color:"crit",   icon:"warn",    desc:"A certified dataset stopped meeting its promise."},
  {id:"g.definition",   label:"Definition changed",      group:"gov",  color:"purple", icon:"book",    desc:"An agreed definition moved version. Answers using it are re-labelled."},
  /* Identity & access */
  {id:"a.requested",    label:"Access requested",        group:"iam",  color:"info",   icon:"lock",    desc:"Someone hit a wall and asked, with a reason on file."},
  {id:"a.approved",     label:"Access approved",         group:"iam",  color:"ok",     icon:"check",   desc:"A named approver said yes, for a stated period."},
  {id:"a.completed",    label:"Grant completed",         group:"iam",  color:"ok",     icon:"unlock",  desc:"The entitlement landed — always through a group, never on a person."},
  {id:"a.declined",     label:"Access declined",         group:"iam",  color:"crit",   icon:"x",       desc:"A named approver said no, with a reason the requester can read."},
  {id:"a.expired",      label:"Grant expired",           group:"iam",  color:"mut",    icon:"clock",   desc:"A time-boxed grant reached its end date and lapsed."},
  {id:"a.revoked",      label:"Access revoked",          group:"iam",  color:"crit",   icon:"x",       desc:"An entitlement was taken back, at review or on the spot."},
  {id:"a.group",        label:"Group membership changed",group:"iam",  color:"info",   icon:"people",  desc:"People joined or left a group — and their data access moved with them."},
  {id:"a.role",         label:"Bundle assigned",         group:"iam",  color:"info",   icon:"people",  desc:"A bundle was attached to a group."},
  {id:"a.review",       label:"Review signed off",       group:"iam",  color:"ok",     icon:"check",   desc:"An owner worked through their entitlements and signed."},
  {id:"a.sim",          label:"Simulation started",      group:"iam",  color:"purple", icon:"eye",     desc:"A preview of someone else's view. No rows are returned and nothing is shared."},
  /* Automation */
  {id:"au.created",     label:"Automation created",      group:"auto", color:"info",   icon:"flow",    desc:"A scheduled question was built. It runs as the person who owns it."},
  {id:"au.started",     label:"Run started",             group:"auto", color:"mut",    icon:"play",    desc:"A run began — after re-checking the owner's identity and permissions."},
  {id:"au.ok",          label:"Run succeeded",           group:"auto", color:"ok",     icon:"check",   desc:"The run finished and delivered, scoped per recipient."},
  {id:"au.fail",        label:"Run failed",              group:"auto", color:"crit",   icon:"warn",    desc:"The run stopped rather than deliver a wrong or unscoped number."},
  {id:"au.cloned",      label:"Automation cloned",       group:"auto", color:"purple", icon:"copy",    desc:"Sharing an automation copies it. Each copy runs as its own owner."},
  {id:"au.shared",      label:"Automation shared",       group:"auto", color:"info",   icon:"send",    desc:"An automation was offered to a group, who each get their own copy."},
  {id:"au.sub_add",     label:"Subscription added",      group:"auto", color:"info",   icon:"plus",    desc:"Someone chose to receive a run — scoped to them, not to the owner."},
  {id:"au.sub_rm",      label:"Subscription removed",    group:"auto", color:"mut",    icon:"x",       desc:"Someone stopped receiving a run. The automation kept going."},
  {id:"au.threshold",   label:"Threshold fired",         group:"auto", color:"warn",   icon:"bolt",    desc:"A watched number crossed its line and told its owner."},
  /* Connectors */
  {id:"c.connected",    label:"Connector connected",     group:"conn", color:"ok",     icon:"plug",    desc:"A UBT system was wired in, with a named set of tools."},
  {id:"c.tool",         label:"Tool called",             group:"conn", color:"info",   icon:"bolt",    desc:"Spiff called a tool in a connected system, as the person who asked."},
  {id:"c.tool_denied",  label:"Tool call denied",        group:"conn", color:"crit",   icon:"x",       desc:"A tool call was refused by policy before it left Spiff."},
  {id:"c.consent",      label:"Consent granted",         group:"conn", color:"ok",     icon:"check",   desc:"A person let Spiff act in a system on their behalf, for a period."},
  {id:"c.consent_rev",  label:"Consent revoked",         group:"conn", color:"warn",   icon:"x",       desc:"That permission was taken back. In-flight runs stop."},
  {id:"c.tools_changed",label:"Tools changed",           group:"conn", color:"warn",   icon:"refresh", desc:"The set of things Spiff may do in a system was edited."},
  /* Admin */
  {id:"x.quota",        label:"Quota changed",           group:"admin",color:"mut",    icon:"grid",    desc:"A limit on questions, rows or exports moved."},
  {id:"x.retention",    label:"Retention applied",       group:"admin",color:"mut",    icon:"archive", desc:"A retention rule ran and deleted what it said it would."},
  {id:"x.capability",   label:"Capability enabled",      group:"admin",color:"info",   icon:"spark",   desc:"Spiff was allowed to do something new, for a named group."},
  {id:"x.policy",       label:"Policy changed",          group:"admin",color:"warn",   icon:"shield",  desc:"A platform-wide rule of the road changed. Before and after are kept."}
];
const auditKind = id => AUDIT_KINDS.find(k=>k.id===id) || {id:id,label:id,group:"admin",color:"mut",icon:"log",desc:""};

/* ---------- outcomes, sources, rule labels ---------- */
const AUDIT_OUTCOMES = {
  ok:      {label:"Delivered", cls:"ok",   desc:"Everything the person is entitled to see was returned."},
  partial: {label:"Partial",   cls:"warn", desc:"An answer came back, with rows or columns withheld and the viewer told."},
  denied:  {label:"Denied",    cls:"crit", desc:"Refused before any data was read. Nothing was returned."},
  error:   {label:"Stopped",   cls:"crit", desc:"Spiff stopped rather than deliver a number it could not stand behind."}
};
const AUDIT_SOURCES = {
  chat:      {label:"Chat",      icon:"msg",   desc:"A person typing a question in Spiff."},
  schedule:  {label:"Schedule",  icon:"clock", desc:"An automation running on its cadence, as its owner."},
  connector: {label:"Connector", icon:"plug",  desc:"A tool call into a connected UBT system."},
  admin:     {label:"Admin",     icon:"shield",desc:"A change made in the admin surfaces."},
  api:       {label:"API",       icon:"link",  desc:"A programmatic call carrying a person's identity."},
  client:    {label:"External AI client", icon:"plug", desc:"Claude, Microsoft Copilot or ChatGPT asking Spiff as the signed-in person. Same gate, same rules, same log."}
};
const AUDIT_RULE_LABEL = {
  "r-locality-scope":"locality scope rule", "r-small-count":"small-count rule",
  "r-minor-detail":"under-18 detail rule", "r-minor-dob":"under-18 date-of-birth rule",
  "r-attendance-def":"attendance definition", "r-contact-mask":"contact masking rule",
  "r-deceased-tail":"deceased retention tail", "r-consent":"contact consent rule",
  "r-travel-window":"30-day travel window", "r-travel-docs":"travel document rule",
  "r-wellbeing":"wellbeing note rule", "r-retention-reg":"registration retention rule",
  "r-round-base5":"base-5 rounding rule", "r-point-in-time":"point-in-time rule",
  "r-finance-restrict":"finance restriction", "r-pastoral-block":"pastoral care block"
};
const auditRuleLabel = id => AUDIT_RULE_LABEL[id] || (id||"").replace(/^r-/,"").replace(/-/g," ");

/* ---------- event factory ----------
   id · ts · when · kind · actor · actorTitle · runAs · subject · dataset ·
   detail · outcome · rows · suppressed · masked · rule · ms · source · ip · trace   */
function AUDEV(n,ts,when,kind,actor,actorTitle,dataset,subject,detail,o){
  o = o || {};
  const src = o.source || "chat";
  return Object.assign({
    id:"ev-"+n, ts:ts, when:when, kind:kind,
    actor:actor, actorTitle:actorTitle, runAs:actor,
    subject:subject||null, dataset:dataset||null, detail:detail,
    outcome:"ok", rows:null, suppressed:0, masked:0, rule:null, ms:null,
    source:src,
    ip:(src==="schedule"||src==="api") ? "10.24.6.12" : "196.44."+(12+(n%5))+"."+(11+(n%180)),
    trace:"trc-"+n.toString(16)
  }, o);
}

/* =====================================================================
   THE LOG — five days, newest first.
   Threaded by trace id: trc-4a71 is Dawid's attendance story, start to
   finish; trc-9d41 is Londiwe opening the same saved answer as herself.
   ===================================================================== */
const AUDIT = [

/* ------------------------- Friday 11 Sep 2026 ------------------------- */
AUDEV(1193,"2026-09-11T16:19:30Z","today 16:19","q.answered","Rupert Mackenzie","Head of Statistics","growth","Net new members this quarter, by country","9 countries went back to Claude — the rows Rupert may see, nothing more. The client never held a key of its own.",{source:"client",outcome:"ok",rows:9,ms:1610,trace:"trc-c1a0"}),
AUDEV(1192,"2026-09-11T16:19:00Z","today 16:19","q.asked","Rupert Mackenzie","Head of Statistics","growth","Net new members this quarter, by country","Asked from Claude, signed in as Rupert. Identity checked him the same way it checks a question typed in Spiff.",{source:"client",ms:70,trace:"trc-c1a0"}),
AUDEV(1191,"2026-09-11T16:18:00Z","today 16:18","q.answered","Amira Rasool","Event Operations Lead","events","Which events have registrations below capacity?","63 events came back, all inside her localities.",{outcome:"ok",rows:63,ms:1490,trace:"trc-77c1"}),
AUDEV(1190,"2026-09-11T16:17:00Z","today 16:17","q.asked","Amira Rasool","Event Operations Lead","events","Which events have registrations below capacity?","Asked in chat, no filters set by hand.",{ms:60,trace:"trc-77c1"}),
AUDEV(1189,"2026-09-11T16:12:00Z","today 16:12","q.opened","Londiwe Zwane","Regional Coordinator — Coastal","meetings","Attendance by locality, this year vs last","Opened Dawid's saved answer. It re-ran as Londiwe and returned her rows, not his.",{outcome:"ok",rows:402,masked:1,rule:"r-contact-mask",ms:1420,trace:"trc-9d41"}),
AUDEV(1188,"2026-09-11T16:08:00Z","today 16:08","d.query","Londiwe Zwane","Regional Coordinator — Coastal","meetings","Attendance by locality, this year vs last","Read under Londiwe's scope: Pietermaritzburg and the Stellenbosch Cluster.",{outcome:"ok",rows:402,ms:980,trace:"trc-9d41"}),
AUDEV(1187,"2026-09-11T16:07:00Z","today 16:07","a.sim","Thato Sekhoto","LDM Coordinator — Cape Localities",null,"Dawid Kruger","Preview only. No rows were returned to anyone, nothing was shared, and Dawid was not signed in.",{outcome:"ok",rows:0,ms:420}),
AUDEV(1186,"2026-09-11T15:58:00Z","today 15:58","c.tool_denied","Tumelo Maseko","Regional Coordinator — Polokwane",null,"Microsoft 365 · mail.send","Blocked by the connector policy: Spiff may not send mail to addresses outside ubteam.com. The message was never sent.",{outcome:"denied",ms:210,source:"connector"}),
AUDEV(1185,"2026-09-11T15:56:00Z","today 15:56","c.tool","Tumelo Maseko","Regional Coordinator — Polokwane",null,"Microsoft 365 · calendar.find_slot","Called as Tumelo, against Tumelo's own calendar. Spiff holds no calendar and no mailbox of its own.",{outcome:"ok",ms:640,source:"connector"}),
AUDEV(1184,"2026-09-11T15:44:00Z","today 15:44","q.export","Pavitra Govender","Statistics Analyst","growth","Member growth by locality this year","CSV · 41 rows · 7 columns. Aggregate only — this dataset holds no detail rows by design.",{outcome:"ok",rows:41,ms:880}),
AUDEV(1183,"2026-09-11T15:41:00Z","today 15:41","q.saved","Pavitra Govender","Statistics Analyst","growth","Member growth by locality this year","Saved to the National Statistics library. Saving stores the question, not the rows.",{outcome:"ok",ms:120}),
AUDEV(1182,"2026-09-11T15:39:00Z","today 15:39","q.answered","Pavitra Govender","Statistics Analyst","growth","Member growth by locality this year","41 rows, rounded for statutory release.",{outcome:"ok",rows:41,ms:2210,trace:"trc-6b02"}),
AUDEV(1181,"2026-09-11T15:38:00Z","today 15:38","g.rule_fired","Pavitra Govender","Statistics Analyst","growth","Member growth by locality this year","Counts rounded to the nearest 5 before display, as the statutory release requires.",{outcome:"ok",rule:"r-round-base5",ms:40,trace:"trc-6b02"}),
AUDEV(1180,"2026-09-11T15:38:00Z","today 15:38","d.query","Pavitra Govender","Statistics Analyst","growth","Member growth by locality this year","Read across the whole region — Pavitra holds National Office, which is unscoped for aggregates.",{outcome:"ok",rows:41,ms:1180,trace:"trc-6b02"}),
AUDEV(1179,"2026-09-11T15:37:00Z","today 15:37","q.asked","Pavitra Govender","Statistics Analyst","growth","Member growth by locality this year","Asked in chat.",{ms:55,trace:"trc-6b02"}),
AUDEV(1195,"2026-09-11T15:06:00Z","today 15:06","q.answered","Tumelo Maseko","Regional Coordinator — Polokwane","meetings","Attendance in my localities this month","4 localities went back to Copilot, inside Tumelo's scope.",{source:"client",outcome:"ok",rows:4,ms:1380,trace:"trc-c1a1"}),
AUDEV(1194,"2026-09-11T15:05:00Z","today 15:05","q.asked","Tumelo Maseko","Regional Coordinator — Polokwane","meetings","Attendance in my localities this month","Asked from Microsoft Copilot as Tumelo.",{source:"client",ms:80,trace:"trc-c1a1"}),
AUDEV(1178,"2026-09-11T15:12:00Z","today 15:12","d.denied","Johannes Swanepoel","Estates Officer","budgets","Travel spend against budget by locality","Johannes is in no group that holds Cost centres & budgets. Nothing was read, and no partial figure was shown.",{outcome:"denied",rule:"r-finance-restrict",ms:90}),
AUDEV(1177,"2026-09-11T15:11:00Z","today 15:11","q.asked","Johannes Swanepoel","Estates Officer","budgets","Travel spend against budget by locality","Asked in chat. Spiff offered the request-access route instead of an empty chart.",{outcome:"denied",ms:70}),
AUDEV(1175,"2026-09-11T14:36:00Z","today 14:36","au.ok","Thato Sekhoto","LDM Coordinator — Cape Localities","meetings","Weekly LDM pack — Cape Localities","Delivered to 12 subscribers. Each copy re-ran under that person's identity; two came back empty and said so.",{outcome:"ok",rows:341,ms:18400,source:"schedule",trace:"trc-3f10"}),
AUDEV(1174,"2026-09-11T14:35:00Z","today 14:35","au.started","Thato Sekhoto","LDM Coordinator — Cape Localities","meetings","Weekly LDM pack — Cape Localities","Identity and permissions re-checked as Thato Sekhoto before a row was read. Scope: 12 of 312 localities.",{outcome:"ok",ms:310,source:"schedule",trace:"trc-3f10"}),
AUDEV(1173,"2026-09-11T14:20:00Z","today 14:20","a.review","Reneilwe Dlomo","Delivery & Quality Manager",null,"August access review — LDM Coordinators","34 entitlements kept with a reason on each, 2 revoked, 1 delegated. Signed off inside the window.",{outcome:"ok",ms:0,source:"admin"}),
AUDEV(1172,"2026-09-11T14:19:00Z","today 14:19","a.revoked","Reneilwe Dlomo","Delivery & Quality Manager","meetings","Pierre Vermeulen","Revoked at review: dormant 94 days, 3 questions asked in 14 months. Pieter keeps his Reader access.",{outcome:"ok",source:"admin"}),
AUDEV(1171,"2026-09-11T13:58:00Z","today 13:58","q.export_denied","Gugu Pillay","Event Coordinator","registrations","No-show rate by event type","Grace holds Reader, which does not include detail export. The summary export was offered and taken.",{outcome:"denied",rule:"r-wellbeing",ms:110,trace:"trc-5c88"}),
AUDEV(1170,"2026-09-11T13:41:00Z","today 13:41","d.masked","Gugu Pillay","Event Coordinator","registrations","No-show rate by event type","Dietary and accessibility notes came back blank, labelled withheld. The columns are shown so nobody wonders whether the data exists.",{outcome:"partial",rows:1204,masked:2,rule:"r-wellbeing",ms:210,trace:"trc-5c88"}),
AUDEV(1169,"2026-09-11T13:40:00Z","today 13:40","q.answered","Gugu Pillay","Event Coordinator","registrations","No-show rate by event type","1 204 registrations across 18 event types, two columns withheld.",{outcome:"partial",rows:1204,masked:2,rule:"r-wellbeing",ms:1760,trace:"trc-5c88"}),
AUDEV(1168,"2026-09-11T13:39:00Z","today 13:39","q.asked","Gugu Pillay","Event Coordinator","registrations","No-show rate by event type","Asked in chat.",{ms:60,trace:"trc-5c88"}),
AUDEV(1165,"2026-09-11T12:22:00Z","today 12:22","x.retention","Spiff platform","Retention job","registrations","Event registrations · 13-month rule","Purged 214 806 registration rows more than 13 months past event close. The rule that did it is on the dataset page.",{outcome:"ok",rows:214806,rule:"r-retention-reg",ms:96000,source:"admin"}),
AUDEV(1164,"2026-09-11T11:58:00Z","today 11:58","c.tool","Colette Marais","Travel Office Manager","travel","Orbit · search_bookings","Called as Colette. Orbit applied Colette's own booking permissions on its side as well.",{outcome:"ok",rows:284,ms:1980,source:"connector"}),
AUDEV(1163,"2026-09-11T11:57:00Z","today 11:57","c.consent","Colette Marais","Travel Office Manager",null,"Orbit connector","Consented for 30 days, read-only, revocable at any time from her own settings.",{outcome:"ok",ms:0,source:"connector"}),
AUDEV(1162,"2026-09-11T11:31:00Z","today 11:31","d.suppressed","Nokuthula Dladla","Locality Secretary","meetings","Which localities missed two meetings in a row?","Four localities had fewer than 5 members checked in. The rows exist and Nokuthula was told they exist — the counts are withheld.",{outcome:"partial",rows:62,suppressed:4,rule:"r-small-count",ms:180,trace:"trc-8e33"}),
AUDEV(1161,"2026-09-11T11:30:00Z","today 11:30","q.answered","Nokuthula Dladla","Locality Secretary","meetings","Which localities missed two meetings in a row?","62 localities returned, 4 counts withheld.",{outcome:"partial",rows:62,suppressed:4,rule:"r-small-count",ms:1640,trace:"trc-8e33"}),
AUDEV(1160,"2026-09-11T11:29:00Z","today 11:29","q.asked","Nokuthula Dladla","Locality Secretary","meetings","Which localities missed two meetings in a row?","Asked in chat.",{ms:60,trace:"trc-8e33"}),
AUDEV(1159,"2026-09-11T10:47:00Z","today 10:47","g.definition","Rupert Mackenzie","Head of Statistics","growth","Net movement · v2","Now excludes the current incomplete month, so a report run twice gives the same answer. 4 saved answers were re-labelled with the new version.",{outcome:"ok",source:"admin"}),
AUDEV(1158,"2026-09-11T10:46:00Z","today 10:46","g.cert_broken","Spiff platform","Freshness monitor","travel","Travel bookings","Third late supplier feed this month. The verified badge came off, the warning went on the dataset, and Colette Marais was told.",{outcome:"error",source:"admin"}),
AUDEV(1157,"2026-09-11T10:31:00Z","today 10:31","q.answered","Helena Bosman","Travel Coordinator","itineraries","Journeys with an overnight gap","19 journeys, traveller names withheld on 11 of them.",{outcome:"partial",rows:19,masked:1,rule:"r-travel-window",ms:2440,trace:"trc-1d55"}),
AUDEV(1156,"2026-09-11T10:30:00Z","today 10:30","q.asked","Helena Bosman","Travel Coordinator","itineraries","Journeys with an overnight gap","Asked in chat. Itineraries is a draft dataset and said so before answering.",{ms:60,trace:"trc-1d55"}),
AUDEV(1155,"2026-09-11T10:12:00Z","today 10:12","a.sim","Reneilwe Dlomo","Delivery & Quality Manager","meetings","Polokwane Cluster (group)","Preview only, while testing the edit above. No rows were returned to anyone and nothing left Spiff.",{outcome:"ok",rows:0,ms:510,source:"admin"}),
AUDEV(1154,"2026-09-11T10:10:00Z","today 10:10","g.rule_edited","Reneilwe Dlomo","Delivery & Quality Manager","meetings","r-locality-scope","Added an explicit null clause: members with no recorded locality are now excluded rather than shown to everyone. Before and after are both kept.",{outcome:"ok",rule:"r-locality-scope",source:"admin"}),
AUDEV(1153,"2026-09-11T09:41:00Z","today 09:41","q.opened","Farida Padayachee","Statistics Analyst","meetings","Attendance by locality, this year vs last","Farida holds National Office — aggregate only. She saw 8 country-level totals; all 118 locality rows were withheld, and the answer said so on its face.",{outcome:"partial",rows:9,suppressed:118,rule:"r-locality-scope",ms:1520}),
AUDEV(1152,"2026-09-11T09:22:00Z","today 09:22","au.threshold","Thato Sekhoto","LDM Coordinator — Cape Localities","meetings","Attendance watch — Stellenbosch Cluster","Two localities fell below 70% attendance for a second week. Only Thato was told; the watch runs as him.",{outcome:"ok",rows:2,ms:8200,source:"schedule"}),
AUDEV(1151,"2026-09-11T09:03:00Z","today 09:03","q.answered","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","121 localities, nothing withheld. Four more than the day he first asked — the two Kimberley localities and their comparatives.",{outcome:"ok",rows:121,masked:1,rule:"r-contact-mask",ms:1640,trace:"trc-4a71"}),
AUDEV(1150,"2026-09-11T09:02:00Z","today 09:02","d.query","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Read under Dawid's new scope. 121 rows matched, 121 returned.",{outcome:"ok",rows:121,ms:910,trace:"trc-4a71"}),
AUDEV(1149,"2026-09-11T09:02:00Z","today 09:02","g.rule_fired","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Locality scope re-evaluated at run time and now includes Kimberley. Nothing was withheld this time.",{outcome:"ok",rule:"r-locality-scope",ms:35,trace:"trc-4a71"}),
AUDEV(1148,"2026-09-11T09:01:00Z","today 09:01","q.asked","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Same question as Thursday, asked again after the grant landed.",{ms:55,trace:"trc-4a71"}),
AUDEV(1147,"2026-09-11T08:44:00Z","today 08:44","a.completed","Spiff platform","Entitlement service","meetings","Dawid Kruger","Grant applied through the Stellenbosch Cluster group, never to Dawid directly. Meetings & attendance · Kimberley · expires 29 Nov 2026.",{outcome:"ok",ms:1200,source:"admin",trace:"trc-4a71"}),
AUDEV(1146,"2026-09-11T08:41:00Z","today 08:41","a.approved","Thato Sekhoto","LDM Coordinator — Cape Localities","meetings","Dawid Kruger","Approved for 90 days with the reason on file. Thato can approve inside his own localities and nowhere else.",{outcome:"ok",source:"admin",trace:"trc-4a71"}),

/* ------------------------- Thursday 10 Sep 2026 ------------------------- */
AUDEV(1145,"2026-09-10T19:04:00Z","yesterday 19:04","x.policy","Ezra Haddad","Head of Software — GST",null,"Sharing policy","Restated and locked: Sharing organises, it never widens access. Every viewer re-runs it under their own identity.",{outcome:"ok",source:"admin"}),
AUDEV(1144,"2026-09-10T18:20:00Z","yesterday 18:20","a.expired","Spiff platform","Entitlement service","members","Martinus Viljoen","A 90-day grant reached its end date and was not renewed. Martinus was told a week before, and again today.",{outcome:"ok",source:"admin"}),
AUDEV(1143,"2026-09-10T16:40:00Z","yesterday 16:40","au.cloned","Amira Rasool","Event Operations Lead","events","Event fill-rate Monday brief","Sharing an automation clones it. Amira's copy runs as Amira and returns her rows — Warrick's copy is untouched.",{outcome:"ok",source:"admin"}),
AUDEV(1142,"2026-09-10T16:39:00Z","yesterday 16:39","au.shared","Warrick Meintjes","Events Director","events","Event fill-rate Monday brief","Offered to Event Operations. Nobody inherited Warrick's access — each person who takes it gets their own copy.",{outcome:"ok",source:"admin"}),
AUDEV(1141,"2026-09-10T15:02:00Z","yesterday 15:02","q.refined","Rethabile Sibanda","Statistics Analyst","growth","Member growth by locality this year","Excluded transfers so the number counts genuinely new members. The change is on the answer, in plain words.",{outcome:"ok",rows:38,ms:1310}),
AUDEV(1140,"2026-09-10T15:01:00Z","yesterday 15:01","q.chart","Rethabile Sibanda","Statistics Analyst","growth","Member growth by locality this year","Bars swapped for a three-year line. The shape changed; the numbers did not.",{outcome:"ok",ms:90}),
AUDEV(1139,"2026-09-10T14:33:00Z","yesterday 14:33","d.sample","Lesedi Mofokeng","Data Steward — Membership","members","Member records · sample","Twenty sample rows opened in the catalogue, masked exactly as a real answer would be. Sample viewing is a read, so it is logged.",{outcome:"ok",rows:20,masked:3,rule:"r-contact-mask",ms:430}),
AUDEV(1138,"2026-09-10T13:55:00Z","yesterday 13:55","g.certified","Lesedi Mofokeng","Data Steward — Membership","localities","Localities & subdivisions","Grain, coverage and the review-overdue measure checked line by line. Lesedi's name is now on it.",{outcome:"ok",source:"admin"}),
AUDEV(1137,"2026-09-10T12:10:00Z","yesterday 12:10","au.fail","Colette Marais","Travel Office Manager","travel","Travel spend weekly — Travel Office","Travel bookings missed its 04:40 refresh because Orbit's supplier feed was late. The run stopped rather than send a number that was quietly incomplete. Nine subscribers were told why.",{outcome:"error",ms:42100,source:"schedule",trace:"trc-0b7a"}),
AUDEV(1136,"2026-09-10T12:09:00Z","yesterday 12:09","au.started","Colette Marais","Travel Office Manager","travel","Travel spend weekly — Travel Office","Identity and permissions re-checked as Colette Marais before the run.",{outcome:"ok",ms:280,source:"schedule",trace:"trc-0b7a"}),
AUDEV(1135,"2026-09-10T11:20:00Z","yesterday 11:20","a.group","Sindi Mthembu","Records Officer",null,"Records Office","Three people joined. Their data access moved with the group — no dataset was granted to a person directly.",{outcome:"ok",rows:3,source:"admin"}),
AUDEV(1134,"2026-09-10T10:48:00Z","yesterday 10:48","d.denied","Zinhle Kunene","Care Coordinator","care","Which members have an open care note?","Pastoral care notes are not loaded into Spiff at all — not for Zinhle, not for Platform Admins. There is nothing to grant and nothing to request.",{outcome:"denied",rule:"r-pastoral-block",ms:40}),
AUDEV(1133,"2026-09-10T10:47:00Z","yesterday 10:47","q.asked","Zinhle Kunene","Care Coordinator","care","Which members have an open care note?","Asked in chat. Spiff answered with the policy, not with an empty table.",{outcome:"denied",ms:60}),
AUDEV(1132,"2026-09-10T09:30:00Z","yesterday 09:30","au.sub_add","Murray Shepstone","Divisional Manager","meetings","Weekly LDM pack — Cape Localities","Murray now gets his own copy every Monday, scoped to Murray. Thato's copy is unchanged.",{outcome:"ok",source:"admin"}),
AUDEV(1131,"2026-09-10T08:15:00Z","yesterday 08:15","x.quota","Ezra Haddad","Head of Software — GST",null,"Daily question quota · Statistics","Raised from 200 to 400 a day for the Statistics division, ahead of the statutory return.",{outcome:"ok",source:"admin"}),

/* ------------------------ Wednesday 9 Sep 2026 ------------------------ */
AUDEV(1130,"2026-09-09T18:02:00Z","Wed 9 Sep 18:02","q.opened","Tumelo Maseko","Regional Coordinator — Polokwane","meetings","Attendance by locality, this year vs last","Tumelo's localities are the Polokwane Cluster. The answer opened and was empty — Spiff said the rows exist and he cannot see them, rather than showing him a zero.",{outcome:"partial",rows:0,suppressed:121,rule:"r-locality-scope",ms:940}),
AUDEV(1129,"2026-09-09T14:41:00Z","Wed 9 Sep 14:41","c.tools_changed","Marcus Vilakazi","Product Lead — Data",null,"Assemble connector","Two write tools removed. Spiff can read registrations; it can no longer create or cancel them.",{outcome:"ok",source:"admin"}),
AUDEV(1128,"2026-09-09T11:20:00Z","Wed 9 Sep 11:20","c.connected","Marcus Vilakazi","Product Lead — Data","properties","Notifications Relay connector","Connected read-only with a single tool, sites.search. Every call will carry the asker's identity.",{outcome:"ok",source:"admin"}),
AUDEV(1127,"2026-09-09T09:00:00Z","Wed 9 Sep 09:00","au.ok","Thato Sekhoto","LDM Coordinator — Cape Localities","meetings","Weekly LDM pack — Cape Localities","Delivered to 12 subscribers, each copy re-run under that person's identity. One came back empty and said why rather than showing a zero.",{outcome:"ok",rows:338,ms:17200,source:"schedule"}),
AUDEV(1125,"2026-09-09T07:41:00Z","Wed 9 Sep 07:41","x.capability","Ezra Haddad","Head of Software — GST",null,"Schedule Orbit travel · Travel Office","Enabled for the Travel Office group, set to need approval on every run. Nothing runs unattended.",{outcome:"ok",source:"admin"}),
AUDEV(1124,"2026-09-09T06:02:00Z","Wed 9 Sep 06:02","au.fail","Tumelo Maseko","Regional Coordinator — Polokwane","meetings","Polokwane attendance brief","The owner's Directory record changed overnight and the permission re-check did not pass. The run stopped before reading a row, and Tumelo was told what to fix.",{outcome:"error",ms:1900,source:"schedule"}),

/* ------------------------- Tuesday 8 Sep 2026 ------------------------- */
AUDEV(1123,"2026-09-08T16:30:00Z","Tue 8 Sep 16:30","a.declined","Marcus Vilakazi","Product Lead — Data","travel","Adriaan de Villiers","Declined: no stated purpose that needs traveller-level detail. Adriaan was pointed at the aggregate travel-spend answer, which he can already open.",{outcome:"ok",source:"admin"}),
AUDEV(1122,"2026-09-08T16:12:00Z","Tue 8 Sep 16:12","a.requested","Adriaan de Villiers","Finance Analyst","travel","Travel bookings · traveller detail","Requested with a reason on file. Requests go to the dataset owner, not to a helpdesk.",{outcome:"ok",source:"admin"}),
AUDEV(1121,"2026-09-08T14:50:00Z","Tue 8 Sep 14:50","g.rule_created","Marcus Vilakazi","Product Lead — Data","travel","r-travel-window","Traveller names are visible only within 30 days of the travel date. Published with a plain-English sentence anyone can read.",{outcome:"ok",rule:"r-travel-window",source:"admin"}),
AUDEV(1120,"2026-09-08T13:20:00Z","Tue 8 Sep 13:20","q.export","Rupert Mackenzie","Head of Statistics","growth","Statutory membership return · Q3","CSV · 9 rows · 6 columns, aggregate only and rounded to base 5. Exports are counted against the division's monthly egress budget.",{outcome:"ok",rows:9,rule:"r-round-base5",ms:640}),
AUDEV(1119,"2026-09-08T11:41:00Z","Tue 8 Sep 11:41","d.masked","Helena Bosman","Travel Coordinator","travel","Which trips have no return leg booked?","Traveller names were withheld on trips outside the 30-day window. Document numbers were not masked — they are never loaded into Spiff at all.",{outcome:"partial",rows:74,masked:1,rule:"r-travel-window",ms:240,trace:"trc-9a02"}),
AUDEV(1118,"2026-09-08T11:40:00Z","Tue 8 Sep 11:40","q.answered","Helena Bosman","Travel Coordinator","travel","Which trips have no return leg booked?","74 bookings with no matching return leg.",{outcome:"partial",rows:74,masked:1,rule:"r-travel-window",ms:2610,trace:"trc-9a02"}),
AUDEV(1117,"2026-09-08T11:39:00Z","Tue 8 Sep 11:39","q.asked","Helena Bosman","Travel Coordinator","travel","Which trips have no return leg booked?","Asked in chat.",{ms:60,trace:"trc-9a02"}),
AUDEV(1116,"2026-09-08T10:22:00Z","Tue 8 Sep 10:22","a.role","Reneilwe Dlomo","Delivery & Quality Manager",null,"Report Author · Polokwane Cluster","The role went to the group, which Rethabile Sibanda belongs to. Roles never attach to a person.",{outcome:"ok",source:"admin"}),
AUDEV(1115,"2026-09-08T09:12:00Z","Tue 8 Sep 09:12","q.followup","Londiwe Zwane","Regional Coordinator — Coastal","meetings","Which two localities dropped most?","A follow-up on her attendance answer, carrying the same scope and the same definition of attendance.",{outcome:"ok",rows:24,ms:1180}),
AUDEV(1113,"2026-09-08T08:41:00Z","Tue 8 Sep 08:41","au.sub_rm","Brendan Jooste","Finance Systems Lead","travel","Travel spend weekly — Travel Office","Brendan stopped receiving his copy. The automation kept running for its other nine subscribers.",{outcome:"ok",source:"admin"}),
AUDEV(1112,"2026-09-08T07:55:00Z","Tue 8 Sep 07:55","x.policy","Ezra Haddad","Head of Software — GST",null,"Activity log retention","Identity and access decisions now kept for 7 years, up from 24 months. Reads and queries stay at 24 months.",{outcome:"ok",source:"admin"}),

AUDEV(1126,"2026-09-08T06:00:00Z","Tue 8 Sep 06:00","au.ok","Amira Rasool","Event Operations Lead","registrations","Registrations nightly digest — Event Operations","Ran as Amira and delivered to 6 subscribers. Two of them saw fewer events than she did, and their own copy said so.",{outcome:"ok",rows:412,ms:9600,source:"schedule"}),

/* ------------------------ Monday 7 Sep 2026 ------------------------ */
AUDEV(1111,"2026-09-07T16:44:00Z","Mon 7 Sep 16:44","q.opened","Rika Olivier","Records Officer","comms","Delivery failure rate by channel","Re-ran as Rika. Recipient identifiers are hashed for every viewer, including her.",{outcome:"partial",rows:88,masked:1,rule:"r-contact-mask",ms:1290}),
AUDEV(1110,"2026-09-07T14:09:00Z","Mon 7 Sep 14:09","a.requested","Dawid Kruger","Locality Secretary","meetings","Meetings & attendance · Kimberley","Reason on file: the Bloemfontein cluster review covers two Kimberley localities. Sent to Thato Sekhoto, who approves for the Stellenbosch Cluster.",{outcome:"ok",trace:"trc-4a71"}),
AUDEV(1109,"2026-09-07T14:04:00Z","Mon 7 Sep 14:04","q.saved","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Saved to his workspace. Saving stores the question and its scope, never the rows.",{outcome:"ok",ms:120,trace:"trc-4a71"}),
AUDEV(1108,"2026-09-07T14:03:00Z","Mon 7 Sep 14:03","q.answered","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","115 localities returned of 118 that matched. The three missing rows were named as withheld, not dropped in silence.",{outcome:"partial",rows:115,suppressed:3,masked:1,rule:"r-locality-scope",ms:2140,trace:"trc-4a71"}),
AUDEV(1107,"2026-09-07T14:03:00Z","Mon 7 Sep 14:03","d.masked","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Member names came back withheld outside Dawid's own locality. The column stayed on screen, labelled, so the absence is legible.",{outcome:"partial",rows:115,masked:1,rule:"r-contact-mask",ms:70,trace:"trc-4a71"}),
AUDEV(1106,"2026-09-07T14:03:00Z","Mon 7 Sep 14:03","d.suppressed","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Three Kimberley localities sat outside Dawid's assigned localities. He was told they exist and that he cannot see them — not that there is no data.",{outcome:"partial",rows:115,suppressed:3,rule:"r-locality-scope",ms:60,trace:"trc-4a71"}),
AUDEV(1105,"2026-09-07T14:02:00Z","Mon 7 Sep 14:02","d.rows","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","118 rows matched the question, 115 reached Dawid.",{outcome:"partial",rows:115,suppressed:3,ms:40,trace:"trc-4a71"}),
AUDEV(1104,"2026-09-07T14:02:00Z","Mon 7 Sep 14:02","g.rule_fired","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Locality scope evaluated at run time against Dawid's Directory record, not against a cached list.",{outcome:"partial",rule:"r-locality-scope",ms:35,trace:"trc-4a71"}),
AUDEV(1103,"2026-09-07T14:02:00Z","Mon 7 Sep 14:02","d.query","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Meetings & attendance joined to Localities on locality id. Read as Dawid.",{outcome:"partial",rows:118,ms:1120,trace:"trc-4a71"}),
AUDEV(1102,"2026-09-07T14:02:00Z","Mon 7 Sep 14:02","q.asked","Dawid Kruger","Locality Secretary","meetings","Attendance by locality, this year vs last","Asked in chat, ahead of the Bloemfontein cluster review.",{ms:60,trace:"trc-4a71"}),
AUDEV(1101,"2026-09-07T11:15:00Z","Mon 7 Sep 11:15","g.rule_suspended","Marcus Vilakazi","Product Lead — Data","growth","r-round-base5","Suspended for 40 minutes so the statutory return could be reconciled against raw counts. Every query inside that window is on this log, and Rupert Mackenzie countersigned.",{outcome:"ok",rule:"r-round-base5",ms:0,source:"admin"}),
AUDEV(1100,"2026-09-07T10:02:00Z","Mon 7 Sep 10:02","c.consent_rev","Colette Marais","Travel Office Manager",null,"Orbit connector","Consent revoked for a colleague who left the Travel Office. Any run holding that consent stopped at its next step.",{outcome:"ok",source:"connector"}),
AUDEV(1099,"2026-09-07T08:30:00Z","Mon 7 Sep 08:30","a.approved","Sindi Mthembu","Records Officer","members","Nokuthula Dladla","Approved for 12 months: locality detail on Member records for Nelspruit, where Nokuthula is secretary.",{outcome:"ok",source:"admin"}),
AUDEV(1098,"2026-09-07T08:10:00Z","Mon 7 Sep 08:10","au.created","Thato Sekhoto","LDM Coordinator — Cape Localities","meetings","Attendance watch — Stellenbosch Cluster","Built to run every Monday at 09:00 and say something only when two localities fall below 70% twice running. It runs as Thato and returns Thato's rows — nobody inherits his scope by subscribing.",{outcome:"ok",source:"admin"})
];
const auditById = id => AUDIT.find(e=>e.id===id);

/* =====================================================================
   KPI STRIP — counted from the log above, not invented separately.
   ===================================================================== */
/* slide the fixture onto the viewer's clock */
AUDIT.forEach(function(e){ const d = fxShiftTs(e.ts); if(d){ e.ts = fxLocalISO(d); e.when = fxWhen(d); } });
const AUDIT_STATS = (function(){
  const isToday = e => e.ts.slice(0,10) === FX.iso;
  const today = AUDIT.filter(isToday);
  const cnt = (a,f) => a.filter(f).length;
  const sum = (a,f,k) => a.filter(f).reduce((t,e)=>t+(e[k]||0),0);
  const s = {
    total: AUDIT.length,
    windowDays: 5,
    eventsToday:     today.length,
    questionsToday:  cnt(today,e=>e.kind==="q.asked"||e.kind==="q.followup"),
    /* counted once per viewer, on the event that told them */
    suppressedToday: sum(today,e=>e.kind==="d.suppressed"||e.kind==="q.opened","suppressed"),
    maskedToday:     sum(today,e=>e.kind==="d.masked","masked"),
    deniedWeek:      cnt(AUDIT,e=>e.outcome==="denied"),
    partialWeek:     cnt(AUDIT,e=>e.outcome==="partial"),
    runsWeek:        cnt(AUDIT,e=>e.kind==="au.ok"||e.kind==="au.fail"),
    runsFailedWeek:  cnt(AUDIT,e=>e.kind==="au.fail"),
    callsWeek:       cnt(AUDIT,e=>e.kind==="c.tool"||e.kind==="c.tool_denied"),
    callsDeniedWeek: cnt(AUDIT,e=>e.kind==="c.tool_denied"),
    readsWeek:       cnt(AUDIT,e=>e.kind==="d.query"||e.kind==="d.sample"||e.kind==="q.opened"),
    exportsWeek:     cnt(AUDIT,e=>e.kind==="q.export"),
    simsWeek:        cnt(AUDIT,e=>e.kind==="a.sim")
  };
  const askers = new Set(today.filter(e=>e.kind==="q.asked"||e.kind==="q.followup").map(e=>e.actor)).size;
  s.askersToday = askers;
  s.tiles = [
    {id:"events",     label:"Events today",     value:s.eventsToday,     sub:"Every one of them readable by the person it is about", delta:"+18% on last "+FX.weekday, spark:[22,26,19,31,28,24,35,29,33,27,36,s.eventsToday]},
    {id:"questions",  label:"Questions asked",  value:s.questionsToday,  sub:"Today, from "+askers+" different people",                                delta:"+3 on last "+FX.weekday,  spark:[6,8,5,9,7,6,11,8,10,7,9,s.questionsToday]},
    {id:"suppressed", label:"Rows withheld",   value:s.suppressedToday, sub:"Today — small counts and out-of-scope rows, named to the viewer, never dropped in silence",  delta:null,                  spark:[41,66,38,92,74,55,110,68,84,59,97,s.suppressedToday]},
    {id:"denied",     label:"Access denials",   value:s.deniedWeek,      sub:"Last 5 days · each one told the person why",            delta:null,                  spark:[2,1,3,2,4,1,2,3,1,2,3,s.deniedWeek]},
    {id:"runs",       label:"Automation runs",  value:s.runsWeek,        sub:"Last 5 days · "+s.runsFailedWeek+" stopped themselves rather than send a wrong number", delta:null, spark:[3,4,3,5,4,4,6,3,5,4,5,s.runsWeek]},
    {id:"calls",      label:"Connector calls",  value:s.callsWeek,       sub:"Last 5 days · "+s.callsDeniedWeek+" refused by policy", delta:null,                  spark:[2,3,1,4,2,3,5,2,4,3,4,s.callsWeek]}
  ];
  return s;
})();

/* =====================================================================
   TRACE A NUMBER — the chain behind three saved answers.
   ===================================================================== */
const AUDIT_TRACES = [
  {
    id:"sa-attend",
    title:"Attendance by locality, this year vs last",
    number:"88.4%", numberLabel:"Attendance rate · Bloemfontein · year to date",
    owner:"Dawid Kruger", ownerTitle:"Locality Secretary · Bloemfontein",
    saved:"Mon 7 Sep 2026, 14:04", trace:"trc-4a71",
    question:"Attendance by locality, this year vs last",
    definition:"Attendance", definitionNote:"Governed definition v3, agreed 12 Apr 2026 by Rupert Mackenzie.",
    datasets:["meetings","localities"],
    rules:["r-locality-scope","r-contact-mask","r-attendance-def"],
    scanned:118, rows:115, suppressed:3, masked:1, ms:2140,
    events:["ev-1102","ev-1103","ev-1104","ev-1105","ev-1106","ev-1107","ev-1108","ev-1109","ev-1110","ev-1146","ev-1147","ev-1148","ev-1151"],
    story:"Dawid asked it before a cluster review, three localities came back withheld, he asked for them, Thato approved inside his own locality, and the same question answered differently four days later. Nothing about the answer changed — only who Dawid is.",
    viewers:[
      {name:"Dawid Kruger", when:"Fri 11 Sep, 09:03", rows:121, suppressed:0, masked:1, outcome:"ok",      note:"His own copy, after the Kimberley grant landed. Four more localities than the day he saved it."},
      {name:"Londiwe Zwane",     when:"Fri 11 Sep, 16:12", rows:402, suppressed:0, masked:1, outcome:"ok",      note:"Regional Coordinator — Coastal. Her scope is wider, so her copy is bigger than the owner's."},
      {name:"Farida Padayachee",     when:"Fri 11 Sep, 09:41", rows:9,   suppressed:118, masked:1, outcome:"partial", note:"National Office is aggregate-only. Eight country-level totals; every locality row withheld and labelled."},
      {name:"Tumelo Maseko",   when:"Wed 9 Sep, 18:02", rows:0,   suppressed:121, masked:1, outcome:"partial", note:"Polokwane Cluster. The answer opened empty, and said the rows exist and he cannot see them."}
    ]
  },
  {
    id:"sa-growth",
    title:"Member growth by locality this year",
    number:"+2 140", numberLabel:"Net movement · all localities · Jan–Jul 2026",
    owner:"Pavitra Govender", ownerTitle:"Statistics Analyst · National Statistics",
    saved:"Fri 11 Sep 2026, 15:41", trace:"trc-6b02",
    question:"Member growth by locality this year",
    definition:"Net movement", definitionNote:"Moved to v2 today — the current incomplete month is now excluded, so this number no longer drifts between runs.",
    datasets:["growth","localities"],
    rules:["r-round-base5","r-small-count","r-point-in-time"],
    scanned:41, rows:41, suppressed:0, masked:0, ms:2210,
    events:["ev-1179","ev-1180","ev-1181","ev-1182","ev-1183","ev-1184","ev-1159"],
    story:"A statutory number, so every count is rounded to base 5 before anyone sees it and no detail row exists in the dataset at all. The definition changed underneath it this morning; the answer carries the new version number on its face.",
    viewers:[
      {name:"Rupert Mackenzie",  when:"Fri 11 Sep, 15:52", rows:41, suppressed:0, masked:0, outcome:"ok", note:"Head of Statistics. Same 41 rows — this dataset is unscoped for aggregates by design."},
      {name:"Farida Padayachee",     when:"Fri 11 Sep, 15:49", rows:41, suppressed:0, masked:0, outcome:"ok", note:"National Office. Identical figures, which is the point of a statutory mart."},
      {name:"Rethabile Sibanda",  when:"Thu 10 Sep, 15:02", rows:38, suppressed:3, masked:0, outcome:"partial", note:"Refined it to exclude transfers, and three localities fell under the small-count line."},
      {name:"Thato Sekhoto",  when:"Thu 10 Sep, 08:10", rows:18, suppressed:23, masked:0, outcome:"partial", note:"Four of nine localities. He sees his own localities' movement and is told the rest exists."}
    ]
  },
  {
    id:"sa-travel",
    title:"Travel spend by locality this quarter",
    number:"NZ$ 384,000", numberLabel:"Booked travel · all localities · Q3 2026",
    owner:"Colette Marais", ownerTitle:"Travel Office Manager · Pretoria",
    saved:"Tue 8 Sep 2026, 10:05", trace:"trc-9a02",
    question:"Travel spend by locality this quarter",
    definition:"Booking cost", definitionNote:"Sum of booking-line cost in rand. Personal bookings made outside Orbit are not captured and never have been.",
    datasets:["travel","budgets"],
    rules:["r-travel-window","r-travel-docs","r-finance-restrict"],
    scanned:1284, rows:1284, suppressed:0, masked:2, ms:3820,
    warning:"Travel bookings lost its certification today at 10:46 — the supplier feed has been late three times this month. This number is under review and every viewer is told so before they read it.",
    events:["ev-1117","ev-1118","ev-1119","ev-1158","ev-1122","ev-1123"],
    story:"The money question, and the clearest case for logging the read. Two people can open the same saved answer, agree on the total, and still be looking at different underlying rows — one with traveller names, one without, one with the budget column and one with a locked chip where it would be.",
    viewers:[
      {name:"Colette Marais",   when:"Fri 11 Sep, 11:58", rows:1284, suppressed:0, masked:0, outcome:"ok",      note:"The owner. Travel Office holds traveller detail inside the 30-day window."},
      {name:"Helena Bosman",    when:"Tue 8 Sep, 11:41", rows:1284, suppressed:0, masked:1, outcome:"partial", note:"Traveller names withheld on trips outside the window. The totals match Colette's exactly."},
      {name:"Adriaan de Villiers", when:"Tue 8 Sep, 16:08", rows:1284, suppressed:0, masked:2, outcome:"partial", note:"Same total, no traveller names and no budget column — his request for detail was declined that afternoon."},
      {name:"Brendan Jooste",   when:"Tue 8 Sep, 09:14", rows:1284, suppressed:0, masked:1, outcome:"partial", note:"Finance holds the budget column, so his copy carries variance against budget as well."}
    ]
  }
];
const auditTrace = id => AUDIT_TRACES.find(t=>t.id===id) || AUDIT_TRACES[0];

/* =====================================================================
   RETENTION — how long each category is kept, and who may read it.
   ===================================================================== */
const AUDIT_RETENTION = [
  {group:"qa",    keep:"24 months", why:"Long enough to answer “where did this number come from?” a year after it was quoted."},
  {group:"data",  keep:"24 months", why:"Reads, queries and exports. The category most products never write at all."},
  {group:"gov",   keep:"7 years",   why:"Rule and definition changes outlive the people who made them."},
  {group:"iam",   keep:"7 years",   why:"Every access decision, with its approver and its reason."},
  {group:"auto",  keep:"13 months", why:"A full year of runs, plus the month you are comparing against."},
  {group:"conn",  keep:"24 months", why:"Tool calls into UBT systems, matched to the consent behind them."},
  {group:"admin", keep:"7 years",   why:"Quotas, capabilities, retention and policy, with before and after."}
];
const AUDIT_READERS = [
  {who:"Everyone",              scope:"Their own activity",              note:"Always. A person can read every event about themselves without asking anyone.", cls:"ok"},
  {who:"Regional Coordinators", scope:"Their assigned countries",          note:"The same countries that scope their data. 18 people.", cls:"info"},
  {who:"Data Stewards",         scope:"Their own datasets",              note:"Every read of a dataset they own, including the ones they were not expecting. 22 people.", cls:"info"},
  {who:"Safeguarding Leads",    scope:"Purpose-bound, reviewed monthly", note:"Access to restricted detail is logged and re-read by a second lead. 6 people.", cls:"warn"},
  {who:"Platform Admins",       scope:"Everything",                      note:"5 people, quarterly review. Their reads of this log appear in this log.", cls:"crit"}
];

/* =====================================================================
   FILTERING — one function, used by the stream, the table and the trace.
   ===================================================================== */
/* auditFor scans the whole log. One render of the Activity screen used to call
   it fifteen times — once for the results and once per facet chip just to show
   a count — so the cost was fifteen full passes over every event ever recorded.
   Results are memoised by filter signature, and invalidated when the log grows.
   See auditGroupCounts below for the chips, which no longer scan at all. */
const AUDIT_MEMO = new Map();
function auditKey(f){
  f = f || {};
  return [f.q||"", (f.groups||[]).join("+"), (f.kinds||[]).join("+"), f.actor||"", f.dataset||"",
          f.outcome||"", f.source||"", f.trace||"", f.range||"all"].join("|");
}
function auditFor(f){
  const key = AUDIT.length + "#" + auditKey(f);
  const hit = AUDIT_MEMO.get(key);
  if(hit) return hit;
  const out = auditForRaw(f);
  if(AUDIT_MEMO.size > 200) AUDIT_MEMO.clear();
  AUDIT_MEMO.set(key, out);
  return out;
}
/* one pass, every group counted at once — replaces one full scan per chip */
const AUDIT_GC = new Map();
function auditGroupCounts(range){
  const key = AUDIT.length + "#" + (range||"all");
  const hit = AUDIT_GC.get(key);
  if(hit) return hit;
  const counts = {};
  auditForRaw({range:range}).forEach(function(e){
    const g = auditKind(e.kind).group;
    counts[g] = (counts[g]||0) + 1;
  });
  AUDIT_GC.set(key, counts);
  return counts;
}
function auditForRaw(f){
  f = f || {};
  const q       = String(f.q||"").trim().toLowerCase();
  const groups  = (f.groups && f.groups.length) ? f.groups : null;
  const kinds   = (f.kinds && f.kinds.length) ? f.kinds : null;
  const actor   = (f.actor   && f.actor  !=="all") ? f.actor   : null;
  const dataset = (f.dataset && f.dataset!=="all") ? f.dataset : null;
  const outcome = (f.outcome && f.outcome!=="all") ? f.outcome : null;
  const source  = (f.source  && f.source !=="all") ? f.source  : null;
  const trace   = f.trace || null;
  const range   = f.range || "all";
  const todayKey = AUDIT_NOW.toISOString().slice(0,10);

  return AUDIT.filter(function(e){
    const k = auditKind(e.kind);
    if(groups  && groups.indexOf(k.group)  === -1) return false;
    if(kinds   && kinds.indexOf(e.kind)    === -1) return false;
    if(actor   && e.actor   !== actor)   return false;
    if(dataset && e.dataset !== dataset) return false;
    if(outcome && e.outcome !== outcome) return false;
    if(source  && e.source  !== source)  return false;
    if(trace   && e.trace   !== trace)   return false;
    if(range !== "all"){
      const hrs = (AUDIT_NOW - new Date(e.ts)) / 36e5;
      if(range === "1h"    && hrs > 1)   return false;
      if(range === "today" && e.ts.slice(0,10) !== todayKey) return false;
      if(range === "7d"    && hrs > 24*7)  return false;
      if(range === "30d"   && hrs > 24*30) return false;
    }
    if(q){
      const d = e.dataset ? ds(e.dataset) : null;
      const hay = [e.actor, e.actorTitle, e.runAs, e.subject, e.detail, e.id, e.trace,
                   k.label, auditGroup(k.group).label, e.outcome, e.source,
                   e.rule ? auditRuleLabel(e.rule) : "", e.rule || "",
                   d ? d.name : "", d ? d.tech : ""].join(" ").toLowerCase();
      if(hay.indexOf(q) === -1) return false;
    }
    return true;
  }).sort(function(a,b){ return a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : (a.id < b.id ? 1 : -1); });
}
/* the traces name their days; slide those labels as well */
(function walk(o){ if(!o || typeof o!=="object") return; Object.keys(o).forEach(function(k){ const v=o[k]; if(typeof v==="string") o[k]=fxShiftLabel(v); else if(v && typeof v==="object") walk(v); }); })(AUDIT_TRACES);
</script>
