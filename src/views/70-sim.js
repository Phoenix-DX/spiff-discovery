<script>
/* =====================================================================
   SPIFF v2 — VIEWER SIMULATOR
   Pick a question and two people. See exactly what each one gets,
   and exactly which rule made the difference.
   ===================================================================== */

const SIMX_STATE = { q:"ldm", a:"Thato Sekhoto", b:"Tumelo Maseko", steyn:false, runs:0 };

/* the two clusters are Country-tier groups — they name countries, not localities */
const SIMX_SOUTH = ["South Africa","Lesotho","Eswatini"];
const SIMX_NORTH = ["Namibia","Botswana","Zimbabwe","Zambia","Mozambique"];

/* ---------- rule metadata (local fallback; merged with RULES if that module loaded) ---------- */
const SIMX_RULEMETA = {
  "r-account-status":  {n:"Account standing is re-checked every run", c:"Identity", p:0, sev:"block", s:"Refuse every run where the Directory record is not active, whatever groups the account still holds. No exception clause."},
  "r-finance-restrict":{n:"Finance is group-held, not role-held",       c:"Access",   p:0, sev:"block", s:"Only show cost centres and budgets to members of the Finance group, for everyone except Platform Admins."},
  "r-locality-scope":    {n:"Locality scoping — default deny",              c:"Row filter", p:1, sev:"block", s:"Only show rows whose locality falls within one of the viewer's assigned localities, for everyone except National Office."},
  "r-travel-window":   {n:"Travel visible only within 30 days",         c:"Row filter", p:2, sev:"block", s:"Only show bookings where the travel date falls within 30 days either side of today, for everyone except the Travel Office."},
  "r-retention-reg":   {n:"Registrations purged after 13 months",       c:"Retention",  p:2, sev:"block", s:"Exclude registrations whose event closed more than 13 months ago, from every query surface, for everyone."},
  "r-deceased-tail":   {n:"Deceased members — 24-month tail",           c:"Retention",  p:2, sev:"block", s:"Only show deceased records where the recorded date of death is within the last 24 months, for everyone except the Records Office."},
  "r-minor-detail":    {n:"Minors are name and locality only",          c:"Masking",    p:3, sev:"block", s:"Withhold every detail column on a row where the member is under 18, leaving the locality and nothing else, for everyone except a Safeguarding Lead with a recorded purpose."},
  "r-minor-dob":       {n:"No date of birth for a minor, ever",         c:"Masking",    p:3, sev:"block", s:"Withhold date of birth where age is under 18, for everyone. No exception clause, not overridable."},
  "r-travel-docs":     {n:"Passport and ID numbers are never loaded",   c:"Masking",    p:3, sev:"note",  s:"Exclude every field tagged Identity.Document from Spiff at ingest, so there is nothing to mask at query time."},
  "r-contact-mask":    {n:"Names and contact masked outside your locality",c:"Masking",   p:4, sev:"part",  s:"Mask columns tagged Contact.Direct using a stable hash for everyone except viewers in the row's own locality, or holders of Regional Coordinator."},
  "r-consent":         {n:"Consent respected on outreach fields",       c:"Consent",    p:4, sev:"part",  s:"Only show a contact channel where the member has recorded consent to be contacted. No exception clause."},
  "r-wellbeing":       {n:"Dietary and accessibility notes are health-adjacent", c:"Masking", p:4, sev:"part", s:"Mask columns tagged Wellbeing with the constant [withheld] for everyone except Event Operations with an active event assignment."},
  "r-small-count":     {n:"Suppress any count below five",              c:"Suppression",p:6, sev:"part",  s:"Suppress any member cell whose count is under 5 and show <5 in its place, on every breakdown of member attributes."},
  "r-secondary-suppress":{n:"Secondary suppression against subtraction",c:"Suppression",p:7, sev:"part",  s:"Where a cell was suppressed, also suppress the next-smallest cell in the same column so the first value cannot be recovered by subtraction. Runs after the small-count rule, and only where three or more values remain."},
  "r-round-base5":     {n:"Round member counts to base 5",              c:"Suppression",p:8, sev:"part",  s:"Round member counts at locality grain and below to the nearest 5, for everyone except National Statistics."},
  "r-attendance-def":  {n:"Attendance has one agreed definition",       c:"Definition", p:9, sev:"note",  s:"Count a member as attending only on a confirmed check-in at a Regular or Special meeting. Version 3, agreed 12 Apr 2026."},
  "r-point-in-time":   {n:"Standing is evaluated at period end",        c:"Definition", p:9, sev:"note",  s:"Evaluate member standing as at the reporting period end, not as at query time, so historic answers do not drift."}
};
function simxRule(id){
  let r = null;                                     /* the rules module may not be loaded — never assume it is */
  try { if (typeof ruleById === "function") r = ruleById(id) || null; } catch(e) { r = null; }
  const m = SIMX_RULEMETA[id] || {};
  return { id:id, name:(r && (r.name || r.title)) || m.n || id, cat:(r && (r.category || r.cat)) || m.c || "Rule",
    sentence:(r && (r.statement || r.sentence || r.plain)) || m.s || "This rule has no plain-English statement recorded yet.",
    prec:(m.p == null ? 5 : m.p), sev:m.sev || "part" };
}

/* ---------- the question set: answers from ANSWERS, plus dataset-level questions ---------- */
const SIMX_QS = [
  { id:"ldm", ds:"meetings", src:"ldm",
    q:"How many LDM meetings ran in my subdivisions last quarter?",
    head:{kind:"sum", col:3, unit:"meetings"},
    cols:[["Subdivision","txt"],["Locality","reg"],["Secretary","person"],["Meetings","num"],["Members","num5"],["New members","cnt"],["Under 18","minor"]],
    rows:[
      ["Bellville","Bellville","Dawid Kruger",48,412,14,38],
      ["Grace Hill","Gqeberha North","Siyabonga Nxumalo",37,301,9,22],
      ["Riverbend","Pinetown","Londiwe Zwane",33,244,3,17],
      ["Oak Hollow","Bloemfontein Central","Martinus Viljoen",24,198,11,3],
      ["Northgate","Sandton","Tumelo Maseko",61,388,17,29],
      ["Marula Park","Polokwane Central","Bheki Ngcobo",44,276,4,12],
      ["Rustenburg West","Rustenburg","Elijah Mabena",39,241,8,9],
      ["Nelspruit Central","Nelspruit","Nokuthula Dladla",38,209,12,11],
      ["Upington","Kimberley","Pierre Vermeulen",21,96,2,6]],
    rules:["r-locality-scope","r-account-status","r-contact-mask","r-minor-detail","r-small-count","r-secondary-suppress","r-round-base5","r-attendance-def"] },

  { id:"growth", ds:"growth", src:"growth",
    q:"Member growth by locality this year",
    head:{kind:"sum", col:4, unit:"net members"},
    cols:[["Locality","reg"],["Joins","num5"],["Lapses","num5"],["Deaths","cnt"],["Net movement","num5"]],
    rows:[
      ["Gqeberha North",640,59,12,569],["Bloemfontein Central",310,40,4,266],
      ["Pinetown",920,79,17,824],["Bellville",1080,81,21,978],
      ["Sandton",1240,92,26,1122],["Polokwane Central",480,40,3,437],
      ["Nelspruit",395,30,9,356],["Rustenburg",340,44,7,289],
      ["Kimberley",96,6,2,88]],
    regCol:0, rules:["r-locality-scope","r-account-status","r-small-count","r-secondary-suppress","r-round-base5","r-point-in-time"] },

  { id:"orbit_travel", ds:"travel", src:"orbit_travel",
    q:"Orbit bookings by family — flights, cars and hotels this quarter",
    head:{kind:"sum", col:4, unit:"flights"}, window:true,
    cols:[["Family","txt"],["Locality","reg"],["Traveller","person"],["Travel date","txt"],["Flights","num"],["Hotel nights","num"],["Cost","money"],["Document no.","doc"]],
    rows:[
      ["Steyn","Gqeberha North","John Steyn","11 Sep 2026",12,19,48200,"",1],
      ["Mbeki","Sandton","Thandi Mbeki","04 Oct 2026",11,22,51400,"",0],
      ["Okafor","Pinetown","Chidi Okafor","18 Sep 2026",9,15,33900,"",1],
      ["Ferreira","Bellville","Anton Ferreira","02 Dec 2026",7,12,26100,"",0],
      ["Naidoo","Polokwane Central","Asha Naidoo","21 Sep 2026",6,9,19800,"",1],
      ["Botha","Rustenburg","Rina Botha","14 Nov 2026",5,7,14600,"",0]],
    winIdx:8, rules:["r-locality-scope","r-account-status","r-travel-window","r-travel-docs","r-contact-mask","r-small-count"] },

  { id:"q-members", ds:"members", src:null,
    q:"Members in my localities, with contact details and standing",
    head:{kind:"count", unit:"member rows"}, tail:true,
    cols:[["Member","person"],["Subdivision","txt"],["Locality","reg"],["Date of birth","dob"],["Age band","txt"],["Mobile","contact"],["Standing","stat"]],
    rows:[
      ["Dawid Kruger","Oak Hollow","Bloemfontein Central","04 Mar 1979","40–49","082 441 0192","Active",0,1,0],
      ["Siyabonga Nxumalo","Grace Hill","Gqeberha North","19 Jul 1968","50–59","083 220 7741","Active",0,0,0],
      ["Londiwe Zwane","Riverbend","Pinetown","02 Nov 1985","40–49","071 908 3312","Active",0,1,0],
      ["Household member MBR-408820","Riverbend","Pinetown","—","Under 18","—","Active",1,1,0],
      ["Thandi Mbeki","Northgate","Sandton","27 Jan 1991","30–39","084 117 2260","Active",0,1,0],
      ["Hendrik Fourie","Oak Hollow","Bloemfontein Central","11 Sep 1948","70–79","—","Deceased",0,1,9],
      ["Petrus Ngwenya","Marula Park","Polokwane Central","23 Apr 1951","70–79","—","Deceased",0,1,41]],
    regCol:2, minorIdx:7, consentIdx:8, deadIdx:9,
    rules:["r-locality-scope","r-account-status","r-contact-mask","r-consent","r-minor-detail","r-minor-dob","r-deceased-tail","r-small-count"] },

  { id:"q-regs", ds:"registrations", src:null,
    q:"Which registrations carry a dietary or accessibility need?",
    head:{kind:"count", unit:"events"}, retention:true,
    cols:[["Event","txt"],["Locality","reg"],["Registrations","cnt"],["Dietary note","note"],["Accessibility note","note"],["Registered on","txt"]],
    rows:[
      ["Regional Youth Gathering","Sandton",386,"Coeliac — gluten free","Step-free access required","14 Aug 2026",0],
      ["Southern Leadership Forum","Bellville",214,"Nut allergy","Hearing loop","02 Jul 2026",0],
      ["Coastal Care Day","Pinetown",3,"Diabetic meal","—","21 Aug 2026",0],
      ["Highveld Training Day","Nelspruit",92,"—","Wheelchair space ×2","11 Jun 2026",0],
      ["Cape Winter Assembly","Bellville",148,"Vegetarian","—","03 Mar 2025",1],
      ["Polokwane Youth Camp","Polokwane Central",4,"Lactose intolerant","Step-free access","09 Aug 2026",0]],
    oldIdx:6, rules:["r-locality-scope","r-account-status","r-wellbeing","r-retention-reg","r-small-count","r-secondary-suppress"] },

  { id:"q-budgets", ds:"budgets", src:null,
    q:"Travel spend against budget by locality",
    head:{kind:"money", col:3, unit:"actual spend"},
    cols:[["Cost centre","txt"],["Locality","reg"],["Budget","money"],["Actual","money"],["Consumed","txt"]],
    rows:[
      ["Travel — Southern","Bellville",420000,388410,"92.5%"],
      ["Travel — Northern","Sandton",510000,402180,"78.9%"],
      ["Events — Coastal","Pinetown",286000,271900,"95.1%"],
      ["Estates — Eastern","Gqeberha North",194000,121440,"62.6%"]],
    rules:["r-finance-restrict","r-locality-scope","r-account-status","r-round-base5"] }
];
const simxQ = id => SIMX_QS.find(x => x.id === id) || SIMX_QS[0];

const SIMX_PRESETS = [
  ["Coordinator vs Regional","Thato Sekhoto","Tumelo Maseko"],
  ["Coordinator vs National","Thato Sekhoto","Pavitra Govender"],
  ["Coordinator vs Safeguarding","Thato Sekhoto","Cathleen Oberholzer"],
  ["Active vs dormant","Thato Sekhoto","Pierre Vermeulen"],
  ["Locality vs Finance","Thato Sekhoto","Brendan Jooste"]
];

/* ---------- viewer profile: everything derived from groups and roles, never from a person ---------- */
/* resolve a person to the localities they can actually see, the way the real
   systems do: Global and Region see everything, a Country-tier group resolves
   to every locality in those countries, and everyone else gets their own
   home locality plus whatever their locality-tier group adds. */
const simxLocalitiesIn = cs => ORG.localities.filter(l => cs.indexOf(countryOf(l)) >= 0);
function simxVp(name){
  const p = personByName(name) || PEOPLE[0];
  const has = (a, id) => (a || []).indexOf(id) >= 0;
  const nat = has(p.roles, "national") || has(p.roles, "admin");
  let locs = [], countries = [], tier = "Locality";
  if (nat) { locs = ORG.localities.slice(); tier = has(p.roles, "admin") ? "Global" : "Region"; }
  else {
    if (has(p.groups, "southern-cluster")) countries = countries.concat(SIMX_SOUTH);
    if (has(p.groups, "northern-cluster")) countries = countries.concat(SIMX_NORTH);
    if (countries.length) { tier = "Country"; locs = simxLocalitiesIn(countries); }
    else if (p.me) { locs = ME.localities.slice(); }   /* the PEOPLE row flags the current user */
    if (locs.indexOf(p.locality) < 0) locs.push(p.locality);
    locs = ORG.localities.filter(l => locs.indexOf(l) >= 0);
  }
  const scope = tier === "Global" ? "Every region"
    : tier === "Region"  ? "All " + fmt(ORG.localityCount) + " localities in " + ORG.region + ", aggregate only"
    : tier === "Country" ? locs.length + " localities across " + countries.length + " countries · " + countries.join(", ")
    : locs.length + " of " + fmt(ORG.localityCount) + " localities · " + locs.join(", ");
  return { p:p, name:p.name, first:p.name.split(" ")[0], localities:locs, countries:countries, tier:tier,
    nat:nat, active:p.status === "active",
    reg:has(p.roles, "regional"), admin:has(p.roles, "admin"), safe:has(p.roles, "safeguard"),
    records:has(p.groups, "records-office"), travel:has(p.groups, "travel-office"), events:has(p.groups, "event-ops"),
    fin:has(p.groups, "finance-team") || has(p.roles, "admin"),
    scope: scope };
}
const simxRound5 = n => Math.round(n / 5) * 5;
const simxNum = n => n.toLocaleString("en-GB");
const simxMoney = n => "R " + n.toLocaleString("en-GB").replace(/,/g, " ");
function simxHash(s){ let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(16).slice(0, 4) + "••••"; }

/* ---------- the engine: run one question as one viewer ---------- */
function simxRunOne(q, vp){
  const R = { rows:[], hidden:[], maskedCols:{}, supp:0, supp2:0, withheld:0, rounded:0, fired:{}, exempt:{}, blocked:null, head:null, shown:0 };
  const fire = (id, what, n) => { const f = R.fired[id] || (R.fired[id] = { n:0, m:{} }); f.n += (n || 0); f.m[what] = 1; f.what = Object.keys(f.m).join(" · "); };
  /* named exceptions — the rule was in scope and deliberately did not apply to this viewer */
  [[vp.nat,"r-locality-scope","National Office is the named exception to locality scoping"],
   [vp.nat,"r-round-base5","National Statistics reads the exact figure, not the rounded one"],
   [vp.reg||vp.admin,"r-contact-mask","Regional Coordinators are the named exception — cross-locality detail is theirs"],
   [vp.travel,"r-travel-window","the Travel Office is the named exception to the 30-day window"],
   [vp.events,"r-wellbeing","Event Operations hold wellbeing notes for the events they run"],
   [vp.safe,"r-minor-detail","a Safeguarding Lead with a recorded purpose is the named exception"],
   [vp.records,"r-deceased-tail","the Records Office holds the full deceased register"],
   [vp.fin,"r-finance-restrict","this viewer is in the group that holds the dataset"]
  ].forEach(e => { if (e[0]) R.exempt[e[1]] = e[2]; });

  if (!vp.active){
    R.blocked = { rule:"r-account-status", msg: esc(vp.name) + "'s Directory record is <b>" + esc(vp.p.status) + "</b>. The group grants are all still in place — the run is refused on identity, before any rule about data is even reached." };
    fire("r-account-status", "refused the run before any data rule was evaluated", 1);
    return R;
  }
  fire("r-account-status", "checked at the start of the run — the Directory record is active", 0);
  if (q.ds === "budgets" && !vp.fin){
    R.blocked = { rule:"r-finance-restrict", msg: esc(vp.name) + " is not in the Finance group, so Cost centres &amp; budgets returns nothing at all. This is not an empty result — it is a refusal, and it says so." };
    fire("r-finance-restrict", "refused the dataset outright", 1);
    return R;
  }

  const regCol = q.regCol == null ? 1 : q.regCol, keep = [];
  let outRegion = 0, outWindow = 0, outRetention = 0, outTail = 0;
  q.rows.forEach(row => {
    if (!vp.nat && vp.localities.indexOf(row[regCol]) < 0){ outRegion++; return; }
    if (q.window && !row[q.winIdx] && !vp.travel){ outWindow++; return; }
    if (q.retention && row[q.oldIdx]){ outRetention++; return; }
    if (q.tail && row[q.deadIdx] > 24 && !vp.records){ outTail++; return; }
    keep.push(row);
  });
  if (outRegion){ R.hidden.push({ n:outRegion, rule:"r-locality-scope", why:"outside " + vp.first + "'s assigned localities" }); fire("r-locality-scope", "filtered " + outRegion + " row" + (outRegion > 1 ? "s" : "") + " out of scope", outRegion); }
  else if (!vp.nat) fire("r-locality-scope", "evaluated; every row was already inside scope", 0);
  if (outWindow){ R.hidden.push({ n:outWindow, rule:"r-travel-window", why:"travel date more than 30 days from today" }); fire("r-travel-window", "filtered " + outWindow + " booking" + (outWindow > 1 ? "s" : "") + " outside the ±30-day window", outWindow); }
  if (outRetention){ R.hidden.push({ n:outRetention, rule:"r-retention-reg", why:"event closed more than 13 months ago" }); fire("r-retention-reg", "purged " + outRetention + " row" + (outRetention > 1 ? "s" : "") + " past retention", outRetention); }
  if (outTail){ R.hidden.push({ n:outTail, rule:"r-deceased-tail", why:"recorded date of death is outside the 24-month tail" }); fire("r-deceased-tail", "excluded " + outTail + " record" + (outTail > 1 ? "s" : "") + " past the 24-month tail", outTail); }

  const seeName = loc => vp.reg || vp.admin || loc === vp.p.locality;
  keep.forEach(row => {
    const cells = q.cols.map((c, i) => {
      const kind = c[1], v = row[i];
      const minorRow = q.minorIdx != null && row[q.minorIdx] === 1;
      if (minorRow && !vp.safe && kind !== "txt" && kind !== "reg" && kind !== "dob"){
        R.withheld++; R.maskedCols[i] = 1; fire("r-minor-detail", "withheld every detail column on 1 under-18 row", 1);
        return { t:"[withheld]", k:"crit", ttl:"r-minor-detail — minors are name and locality only" };
      }
      if (kind === "person"){
        if (!seeName(row[regCol])){ R.maskedCols[i] = 1; fire("r-contact-mask", "masked the name column on rows outside their own locality", 1); return { t:"••••", k:"mut", ttl:"r-contact-mask — cross-locality detail is masked; the aggregate is not" }; }
        return { t:esc(String(v)), k:"" };
      }
      if (kind === "contact"){
        if (q.consentIdx != null && !row[q.consentIdx]){ R.maskedCols[i] = 1; fire("r-consent", "blanked the contact column where consent is not recorded", 1); return { t:"[no consent]", k:"warn", ttl:"r-consent — this member has not consented to be contacted" }; }
        if (!seeName(row[regCol])){ R.maskedCols[i] = 1; fire("r-contact-mask", "hashed contact details outside their own locality", 1); return { t:simxHash(String(v)), k:"mut", ttl:"r-contact-mask — hashed with a stable value, so the same person matches across answers" }; }
        return { t:esc(String(v)), k:"" };
      }
      if (kind === "dob"){
        if (minorRow){ R.withheld++; R.maskedCols[i] = 1; fire("r-minor-dob", "withheld the date of birth on 1 under-18 row — no exception clause", 1); return { t:"[withheld]", k:"crit", ttl:"r-minor-dob — no date of birth for a minor, for anyone, ever" }; }
        R.maskedCols[i] = 1; R.rounded++; fire("r-minor-dob", "rounded every date of birth to the year", 1);
        return { t:esc(String(v).slice(-4)), k:"mut", ttl:"r-minor-dob — dates of birth are rounded to the year for every viewer" };
      }
      if (kind === "note"){
        if (!vp.events){ R.withheld++; R.maskedCols[i] = 1; fire("r-wellbeing", "withheld the dietary and accessibility columns", 1); return { t:"[withheld]", k:"crit", ttl:"r-wellbeing — dietary and accessibility notes are health-adjacent" }; }
        return { t:esc(String(v)), k:"" };
      }
      if (kind === "doc"){ fire("r-travel-docs", "nothing to mask — the column was never loaded", 0); return { t:"[not loaded]", k:"mut", ttl:"r-travel-docs — passport and ID numbers never enter Spiff" }; }
      if (kind === "num5"){
        if (vp.nat) return { t:simxNum(v), k:"n" };
        R.rounded++; fire("r-round-base5", "rounded member counts to base 5", 1);
        return { t:simxNum(simxRound5(v)), k:"n mut", ttl:"r-round-base5 — rounded to the nearest 5; exact figure is " + v };
      }
      if (kind === "cnt") return { t:simxNum(v), k:"n", raw:v, col:i };
      if (kind === "minor"){
        if (!vp.safe){ R.withheld++; R.maskedCols[i] = 1; fire("r-minor-detail", "withheld the under-18 column", 1); return { t:"[withheld]", k:"crit", ttl:"r-minor-detail — under-18 detail is for Safeguarding Leads with a recorded purpose" }; }
        return { t:simxNum(v), k:"n", raw:v, col:i };
      }
      if (kind === "money") return { t:simxMoney(v), k:"n" };
      if (kind === "num") return { t:simxNum(v), k:"n" };
      if (kind === "stat"){ const dm = row[q.deadIdx];
        return { t:esc(String(v)) + (dm > 24 ? " · past the 24-month tail, retained for the Records Office" : dm > 0 ? " · within the 24-month tail" : ""), k: dm > 0 ? "mut" : "", ttl: dm > 0 ? "r-deceased-tail — recorded " + dm + " months ago" : "" }; }
      return { t:esc(String(v)), k:"" };
    });
    R.rows.push(cells);
  });

  /* suppression: primary below 5, then secondary against derivation by subtraction */
  const cntCols = {};
  R.rows.forEach(cells => cells.forEach((c, i) => { if (c.raw != null) (cntCols[i] || (cntCols[i] = [])).push(c); }));
  Object.keys(cntCols).forEach(i => {
    const list = cntCols[i], hits = list.filter(c => c.raw < 5);
    hits.forEach(c => { c.t = "&lt;5"; c.k = "n warn"; c.ttl = "r-small-count — fewer than 5 members; the number is suppressed, not missing"; R.supp++; R.maskedCols[i] = 1; });
    if (hits.length && list.length >= 3){
      const rest = list.filter(c => c.raw >= 5).sort((x, y) => x.raw - y.raw);
      if (rest.length){ rest[0].t = "&lt;5"; rest[0].k = "n warn"; rest[0].ttl = "r-secondary-suppress — suppressed so the cell above cannot be recovered by subtraction"; R.supp2++; }
    }
  });
  if (R.supp) fire("r-small-count", "suppressed " + R.supp + " cell" + (R.supp > 1 ? "s" : "") + " below the threshold of 5", R.supp);
  if (R.supp2) fire("r-secondary-suppress", "suppressed " + R.supp2 + " further cell" + (R.supp2 > 1 ? "s" : "") + " to block derivation by subtraction", R.supp2);
  if (q.rules.indexOf("r-attendance-def") >= 0) fire("r-attendance-def", "applied the agreed definition, version 3", 0);
  if (q.rules.indexOf("r-point-in-time") >= 0) fire("r-point-in-time", "evaluated standing at period end, not at query time", 0);

  R.shown = R.rows.length;
  if (q.head.kind === "count") R.head = R.shown;
  else {
    let t = 0;
    R.rows.forEach(cells => { const c = cells[q.head.col]; const n = parseInt(String(c.t).replace(/[^0-9]/g, ""), 10); if (!isNaN(n) && String(c.t).indexOf("&lt;") < 0) t += n; });
    R.head = t;
  }
  return R;
}

/* ---------- pieces ---------- */
function simxIdentity(vp, side){
  const p = vp.p, roles = (p.roles || []).map(r => { const o = roleById(r); return bdg(o ? o.name : r, "info"); }).join(""),
    groups = (p.groups || []).map(g => { const o = groupById(g); return bdg(o ? o.name : g, "mut"); }).join("");
  return '<div class="rowflex" style="align-items:flex-start;gap:12px">' + avatar(p.name, "lg")
    + '<div style="flex:1;min-width:0">'
    + '<div style="font-weight:700;font-size:15px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
    + '<span class="clickable" onclick="openPerson(\'' + esc(p.name) + '\')">' + esc(p.name) + '</span>'
    + bdg("Viewer " + side, side === "A" ? "teal" : "purple")
    + (vp.active ? "" : bdg(p.status, "crit", "warn")) + '</div>'
    + '<div class="mutedtext" style="margin-top:2px">' + esc(p.title) + ' · ' + esc(p.locality) + '</div>'
    + '<div class="rowflex" style="margin-top:8px;gap:5px">' + roles + groups + '</div>'
    + '<div class="mutedtext" style="margin-top:7px">' + I2.eye + ' ' + esc(vp.scope) + '</div>'
    + '</div></div>';
}

function simxTable(q, R, vp){
  if (R.blocked){
    const r = simxRule(R.blocked.rule);
    return callout("crit", '<b>Nothing is returned.</b><br>' + R.blocked.msg
      + '<div style="margin-top:9px"><button class="btn sm" onclick="openRule(\'' + r.id + '\')">' + esc(r.name) + '</button></div>');
  }
  const th = q.cols.map(c => '<th' + (["num","num5","cnt","minor","money"].indexOf(c[1]) >= 0 ? ' class="num"' : '') + '>' + esc(c[0]) + '</th>').join("");
  const body = R.rows.map(cells => '<tr>' + cells.map(c => {
    const numeric = c.k.indexOf("n") === 0;
    const col = c.k.indexOf("crit") >= 0 ? "var(--crit)" : c.k.indexOf("warn") >= 0 ? "var(--warn)" : c.k.indexOf("mut") >= 0 ? "var(--muted)" : "";
    return '<td' + (numeric ? ' class="num"' : '') + (c.ttl ? ' title="' + esc(c.ttl) + '"' : '') + (col ? ' style="color:' + col + '"' : '') + '>' + c.t + '</td>';
  }).join("") + '</tr>').join("");
  const ph = R.hidden.map(h => '<tr><td colspan="' + q.cols.length + '" style="background:var(--hair2);color:var(--muted);font-size:12.5px">'
    + I2.eyeoff + ' <b>' + h.n + ' row' + (h.n > 1 ? "s" : "") + ' not visible to ' + esc(vp.first) + '</b> — ' + esc(h.why)
    + ' · <span class="clickable" style="text-decoration:underline" onclick="openRule(\'' + h.rule + '\')">' + esc(h.rule) + '</span></td></tr>').join("");
  const empty = R.rows.length ? "" : '<tr><td colspan="' + q.cols.length + '" style="color:var(--muted);text-align:center;padding:22px">Every row was filtered out. This is a scoped result, not an empty dataset.</td></tr>';
  return '<div class="dtbl-wrap scrollx"><table class="dtbl"><thead><tr>' + th + '</tr></thead><tbody>' + body + empty + ph + '</tbody></table></div>';
}

function simxFoot(q, R, vp){
  if (R.blocked) return '<div class="mutedtext">0 rows returned · run refused on ' + esc(R.blocked.rule) + ' · logged as ACCESS_DENIED</div>';
  const kv = (k, v) => '<div class="r"><span class="k">' + k + '</span><span class="v" style="text-align:right;max-width:62%">' + v + '</span></div>';
  return '<div class="kvlist" style="font-size:12.5px">'
    + kv("Rows returned", R.shown + " of " + q.rows.length)
    + kv("Rows filtered out", R.hidden.reduce((a, h) => a + h.n, 0))
    + kv("Columns masked", Object.keys(R.maskedCols).length + " of " + q.cols.length)
    + kv("Cells suppressed", (R.supp + R.supp2) + (R.supp2 ? " (" + R.supp + " primary, " + R.supp2 + " secondary)" : ""))
    + kv("Cells rounded", R.rounded) + kv("Scope", esc(vp.scope)) + '</div>';
}

const simxPl = (n, w) => n === 1 ? w.replace(/s$/, "") : w;
function simxHeadline(q, R){
  if (R.blocked) return '<div class="count-lg" style="color:var(--crit)">Refused</div><div class="mutedtext" style="margin-top:5px">' + esc(simxRule(R.blocked.rule).cat) + ' rule · nothing returned</div>';
  const v = q.head.kind === "money" ? simxMoney(R.head) : simxNum(R.head);
  return '<div class="count-lg">' + v + '</div><div class="mutedtext" style="margin-top:5px">' + esc(simxPl(R.head, q.head.unit)) + ' · ' + R.shown + ' ' + simxPl(R.shown, "rows") + '</div>';
}

function simxDiff(q, RA, RB, va, vb){
  const only = (x, y) => x.localities.filter(r => y.localities.indexOf(r) < 0);
  const bOnly = only(vb, va), aOnly = only(va, vb);
  let line;
  if (RA.blocked && !RB.blocked) line = va.first + " gets nothing at all; " + vb.first + " gets a full scoped answer. The difference is identity, not data.";
  else if (RB.blocked && !RA.blocked) line = vb.first + " gets nothing at all; " + va.first + " gets a full scoped answer. The difference is identity, not data.";
  else if (RA.blocked && RB.blocked) line = "Neither viewer is entitled to this question. Both runs are refused and both refusals are logged.";
  else {
    const u = q.head.unit, av = q.head.kind === "money" ? simxMoney(RA.head) : simxNum(RA.head), bv = q.head.kind === "money" ? simxMoney(RB.head) : simxNum(RB.head);
    const shared = va.localities.length - aOnly.length;
    line = va.first + " sees " + av + " " + simxPl(RA.head, u) + " · " + vb.first + " sees " + bv + " " + simxPl(RB.head, u) + " — ";
    if (bOnly.length && aOnly.length) line += (shared ? "they share " + shared + " locality" + (shared === 1 ? "" : "s") + ", and " : "they share no locality at all: ")
      + vb.first + " covers " + bOnly.length + " that " + va.first + " cannot see, " + va.first + " covers " + aOnly.length + " that " + vb.first + " cannot.";
    else if (bOnly.length) line += vb.first + " covers " + bOnly.length + " more locality" + (bOnly.length > 1 ? "s" : "") + " (" + bOnly.join(", ") + ").";
    else if (aOnly.length) line += va.first + " covers " + aOnly.length + " more locality" + (aOnly.length > 1 ? "s" : "") + " (" + aOnly.join(", ") + ").";
    else line += "same localities, but not the same columns — the masking rules resolve differently for each of them.";
  }
  return callout("info", '<b>Same question, two answers.</b> ' + esc(line));
}

function simxTrace(q, RA, RB, va, vb){
  const ids = {};
  [RA, RB].forEach(R => { Object.keys(R.fired).forEach(k => ids[k] = 1); Object.keys(R.exempt).forEach(k => { if (q.rules.indexOf(k) >= 0) ids[k] = 1; }); });
  const list = Object.keys(ids).map(simxRule).sort((a, b) => a.prec - b.prec);
  if (!list.length) return callout("mut", "No rule changed this answer for either viewer.");
  let n = 0;
  const line = (R, v) => R.fired[R._id] ? esc(v.first) + ": " + esc(R.fired[R._id].what)
    : R.blocked ? esc(v.first) + ": never reached — the run was already refused on " + esc(R.blocked.rule)
    : R.exempt[R._id] ? esc(v.first) + ": did not apply — " + esc(R.exempt[R._id])
    : esc(v.first) + ": in scope, nothing met the condition";
  const items = list.map(r => {
    n++; RA._id = r.id; RB._id = r.id;
    const fa = RA.fired[r.id], fb = RB.fired[r.id];
    const who = fa && fb ? "Both viewers" : fa ? va.name : fb ? vb.name : "Neither";
    const what = fa && fb && fa.what === fb.what ? esc(fa.what)
      : '<span style="display:block">' + line(RA, va) + '</span><span style="display:block">' + line(RB, vb) + '</span>';
    return '<div class="tev"><div class="td3 ' + (r.sev === "block" ? "crit" : r.sev === "note" ? "mut" : "warn") + '"></div>'
      + '<div class="rowflex" style="gap:8px"><span class="tw">' + n + '</span><span class="tt2">' + esc(r.name) + '</span>'
      + bdg(r.cat, "mut") + bdg("Precedence " + r.prec, "info") + bdg(who, fa && fb ? "purple" : "teal") + '</div>'
      + '<div class="ts2" style="margin-top:5px">' + esc(r.sentence) + '</div>'
      + '<div class="ts2" style="margin-top:5px;color:var(--ink)">' + what + '</div>'
      + '<div style="margin-top:7px"><button class="btn sm ghost" onclick="openRule(\'' + r.id + '\')">' + I2.link + 'Open ' + esc(r.id) + '</button></div></div>';
  }).join("");
  const sum = R => R.blocked ? "refused on " + R.blocked.rule + ", nothing returned"
    : R.shown + " " + simxPl(R.shown, "rows") + ", " + Object.keys(R.maskedCols).length + " " + simxPl(Object.keys(R.maskedCols).length, "columns") + " masked, "
      + (R.supp + R.supp2) + " " + simxPl(R.supp + R.supp2, "cells") + " suppressed";
  const res = '<div class="hairline"></div>' + callout(RA.blocked || RB.blocked ? "crit" : "ok",
    '<b>Resolved outcome.</b> ' + esc(va.name) + ' — ' + esc(sum(RA)) + '. ' + esc(vb.name) + ' — ' + esc(sum(RB))
    + '. Row filters merge with AND; masking conflicts resolve by precedence, lowest number first.');
  return '<div class="tline">' + items + '</div>' + res;
}

function simxMatrix(q, RA, RB, va, vb){
  const cell = (R, r) => {
    if (R.blocked) return R.blocked.rule === r.id
      ? ['block', 'Refused', R.fired[r.id] ? R.fired[r.id].what : 'refused the run']
      : ['none', 'n/a', 'Never reached — the run was already refused on ' + R.blocked.rule];
    const f = R.fired[r.id];
    if (f) return r.sev === "note" ? ['part', 'Applied', f.what]
      : f.n ? [r.sev === "block" ? 'block' : 'part', 'Fired', f.what] : ['full', 'Clear', f.what];
    if (R.exempt[r.id]) return ['full', 'Exempt', 'Did not apply — ' + R.exempt[r.id]];
    return ['full', 'No', 'In scope, but nothing in this answer met the condition'];
  };
  const rows = q.rules.map(simxRule).sort((a, b) => a.prec - b.prec).map(r => {
    const ca = cell(RA, r), cb = cell(RB, r);
    return '<tr><th class="rowh"><span class="clickable" onclick="openRule(\'' + r.id + '\')">' + esc(r.name) + '</span>'
      + '<div class="mutedtext" style="font-weight:400;font-size:11px">' + esc(r.cat) + ' · precedence ' + r.prec + '</div></th>'
      + '<td><div class="cell ' + ca[0] + '" title="' + esc(ca[2]) + '">' + ca[1] + '</div></td>'
      + '<td><div class="cell ' + cb[0] + '" title="' + esc(cb[2]) + '">' + cb[1] + '</div></td></tr>';
  }).join("");
  return '<div class="scrollx"><table class="matrix"><thead><tr><th class="rowh">Rule in scope for this question</th>'
    + '<th>' + esc(va.first) + '</th><th>' + esc(vb.first) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    + '<div class="legend" style="margin-top:12px"><span><i style="background:var(--crit-soft)"></i>Fired — removed data</span>'
    + '<span><i style="background:var(--warn-soft)"></i>Fired — masked, suppressed or rounded</span>'
    + '<span><i style="background:var(--ok-soft)"></i>Clear or exempt — nothing withheld</span>'
    + '<span><i style="background:var(--hair2)"></i>Never reached — refused earlier</span></div>';
}

/* ---------- the John Steyn case ---------- */
const SIMX_STEYN = [
  ["Thato Sekhoto","Scoped","teal","Sees 5 of the 8 linked activities. The invitation, the outbound flight and the home-side bookings sit in the Makhanda and come back in full. The Northgate meeting and its two Pretoria bookings are outside his four localities and never enter the result — he is told three activities exist and that he cannot see them.","r-locality-scope"],
  ["Colette Marais","Redacted","purple","Sees all four Orbit bookings end to end — supplier, dates, cost — because the Travel Office is the named exception to the ±30-day window. The member identifier comes back hashed, and the passport field is not masked but absent: it was never loaded into Spiff at all.","r-travel-docs"],
  ["Tumelo Maseko","Substituted","info","Northgate is in his locality, so he gets the meeting, the venue and the attendee count. The traveller is not named — he sees a stable pseudonym, Member #40118, the same token in every answer, so he can follow one person through a journey without learning who they are.","r-contact-mask"],
  ["Cathleen Oberholzer","Annotated","warn","A recorded safeguarding purpose opens the household detail she needs. One household member is under 18: that row returns a locality and nothing else, and the date of birth is withheld from her too — that rule is the only one on this page with no exception clause. A second household record is annotated as deceased within the 24-month tail rather than returned as a live detail row.","r-minor-dob"]
];
function simxSteynPanel(){
  if (!SIMX_STATE.steyn){
    return panel("The John Steyn case", callout("mut",
      '<b>A deliberately hard example.</b> Tracing one named person&rsquo;s planned activities crosses four systems, two retention rules and a minor in the household. It is the question that breaks most reporting tools&rsquo; permission models. Load it to see the same request resolve four different ways.')
      + '<div style="margin-top:13px"><button class="btn pri" onclick="simxToggleSteyn()">' + I2.play + 'Load the case</button></div>',
      { icon:"spark", sub:"Preset" });
  }
  const cards = SIMX_STEYN.map(c => {
    const vp = simxVp(c[0]), r = simxRule(c[4]);
    return '<div class="pickcard" style="flex-direction:column;cursor:default">'
      + '<div class="rowflex" style="gap:10px;width:100%">' + avatar(c[0]) + '<div style="flex:1;min-width:0">'
      + '<div class="pn2">' + esc(c[0]) + '</div><div class="mutedtext" style="font-size:11.5px">' + esc(vp.p.title) + '</div></div>'
      + bdg(c[1], c[2]) + '</div>'
      + '<div class="pd2" style="margin-top:4px">' + esc(c[3]) + '</div>'
      + '<div class="rowflex" style="margin-top:auto;padding-top:10px;gap:7px">'
      + '<button class="btn sm ghost" onclick="openRule(\'' + r.id + '\')">' + esc(r.name) + '</button>'
      + '<button class="btn sm ghost" onclick="startSim(\'' + esc(c[0]) + '\')">' + I2.eye + 'View as ' + esc(vp.first) + '</button></div></div>';
  }).join("");
  return panel("The John Steyn case", '<div class="g2">' + cards + '</div>'
    + '<div style="margin-top:14px">' + callout("warn",
      '<b>Two things are true for all four.</b> The under-18 detail is withheld from every one of them, the Safeguarding Lead included — <b>r-minor-dob</b> has no exception clause and cannot be overridden by any role. And the deceased record is present only because it falls inside the 24-month retention tail; a month past that, it stops existing for everybody except the Records Office. Nobody had to ask an administrator what they were allowed to see.') + '</div>',
    { icon:"spark", sub:"Four viewers, one question", act:'<button class="btn sm" onclick="simxToggleSteyn()">Hide</button>' });
}

/* ---------- interactions ---------- */
function simxSet(side, val){ SIMX_STATE[side] = val; renderSim(); }
function simxSetQ(val){ SIMX_STATE.q = val; renderSim(); }
function simxSwap(){ const t = SIMX_STATE.a; SIMX_STATE.a = SIMX_STATE.b; SIMX_STATE.b = t; renderSim(); }
function simxPreset(a, b){ SIMX_STATE.a = a; SIMX_STATE.b = b; renderSim(); toast("Loaded " + a.split(" ")[0] + " against " + b.split(" ")[0]); }
function simxToggleSteyn(){ SIMX_STATE.steyn = !SIMX_STATE.steyn; renderSim(); }
function simxRerun(){ SIMX_STATE.runs++; renderSim(); toast("Re-ran both viewers — two identity checks, nothing delivered"); }
function simxCopy(){ toast("Comparison copied — the numbers travel, the entitlement does not"); }

/* ---------- the screen ---------- */
/* both viewer pickers type to filter — 428 people is a scroll, not a choice */
function simxPeopleOpts(){ return PEOPLE.map(p => [p.name, p.name + " — " + p.title]); }
function simxSetA(v){ simxSet("a", v); }
function simxSetB(v){ simxSet("b", v); }
function renderSim(){
  const q = simxQ(SIMX_STATE.q), va = simxVp(SIMX_STATE.a), vb = simxVp(SIMX_STATE.b), d = ds(q.ds);
  const RA = simxRunOne(q, va), RB = simxRunOne(q, vb);
  const opt = (sel, v, label) => '<option value="' + esc(v) + '"' + (v === sel ? " selected" : "") + ">" + esc(label) + "</option>";
  const people = sel => PEOPLE.map(p => opt(sel, p.name, p.name + " — " + p.title)).join("");   /* kept for the Steyn preset row */
  const evt = "EVT-" + (48210 + SIMX_STATE.runs);

  const setup = panel("Set up the comparison",
    '<div class="g3">'
    + '<div class="field" style="margin-bottom:0"><label>Question</label><select onchange="simxSetQ(this.value)">'
    + SIMX_QS.map(x => opt(SIMX_STATE.q, x.id, x.q)).join("") + '</select></div>'
    + '<div class="field" style="margin-bottom:0">' + pickList("Viewer A", simxPeopleOpts(), SIMX_STATE.a, "simxSetA", {noAll:true}) + '</div>'
    + '<div class="field" style="margin-bottom:0">' + pickList("Viewer B", simxPeopleOpts(), SIMX_STATE.b, "simxSetB", {noAll:true}) + '</div>'
    + '</div>'
    + '<div class="rowflex" style="margin-top:14px">'
    + '<button class="btn" onclick="simxSwap()">' + I2.refresh + 'Swap</button>'
    + '<button class="btn pri" onclick="simxRerun()">' + I2.play + 'Run</button>'
    + '<span class="mutedtext">Reading <span class="clickable" style="text-decoration:underline" onclick="openDataset(\'' + q.ds + '\')">' + esc(d ? d.name : q.ds) + '</span>'
    + (d ? " · " + esc(d.tech) : "") + '</span><div class="sp"></div>'
    + SIMX_PRESETS.map(p => '<button class="fchip2' + (p[1] === SIMX_STATE.a && p[2] === SIMX_STATE.b ? " on" : "") + '" onclick="simxPreset(\'' + esc(p[1]) + '\',\'' + esc(p[2]) + '\')">' + esc(p[0]) + '</button>').join("")
    + '</div>'
    + '<div class="hairline"></div><div class="g2">' + simxIdentity(va, "A") + simxIdentity(vb, "B") + '</div>',
    { icon:"people" });

  const col = (vp, R, side) => panel(esc(vp.name),
    simxHeadline(q, R) + '<div style="margin-top:14px">' + simxTable(q, R, vp) + '</div>',
    { icon: side === "A" ? "eye" : "people", sub: esc(vp.p.title), foot: simxFoot(q, R, vp) });

  const compare = '<div class="g2" style="align-items:start">' + col(va, RA, "A") + col(vb, RB, "B") + '</div>';

  const walk = panel("Walk this into the product",
    '<div class="rowflex">'
    + '<button class="btn" onclick="startSim(\'' + esc(va.name) + '\')">' + I2.eye + 'Open the whole app as ' + esc(va.first) + '</button>'
    + '<button class="btn" onclick="startSim(\'' + esc(vb.name) + '\')">' + I2.eye + 'Open the whole app as ' + esc(vb.first) + '</button>'
    + '<button class="btn ghost" onclick="stopSim()">' + I2.x + 'Back to my own view</button>'
    + '<div class="sp"></div>'
    + '<button class="btn" onclick="simxCopy()">' + I2.copy + 'Copy this comparison</button></div>'
    + '<div class="mutedtext" style="margin-top:11px">An amber bar stays across the top of every screen for as long as you are simulating, and every number under it is theirs, not yours. The <b>Back to my own view</b> button ends it.</div>'
    + '<div style="margin-top:13px">' + callout("mut",
      '<b>Log entry created.</b> <span class="mono">' + evt + ' · IMPERSONATION_STARTED · actor ' + esc(ME.full) + ' · subject ' + esc(va.name) + ' and ' + esc(vb.name) + ' · question ' + esc(q.id) + ' · 0 rows delivered · 0 exports</span> — <span class="clickable" style="text-decoration:underline" onclick="go(\'audit\')">open the activity log</span>', "log") + '</div>',
    { icon:"bolt" });

  $("#view-sim").innerHTML =
    pageHead({
      eyebrow:"Govern",
      title:"Viewer simulator",
      desc:"A shared answer re-runs for whoever opens it, scoped to that person — so here is exactly what that looks like. Pick a question and two people, and read the two results side by side with the rule that separated them.",
      badges: bdg("Runs as its owner", "ok", "shield") + bdg("Re-scoped per viewer", "info", "eye") + bdg(SIMX_QS.length + " questions", "mut") + bdg(PEOPLE.length + " people", "mut"),
      acts:'<button class="btn" onclick="go(\'rules\')">' + I2.shield + 'Business rules</button><button class="btn" onclick="go(\'people\')">' + I2.people + 'People &amp; access</button>'
    })
    + '<div style="margin-bottom:18px">' + callout("ok",
      '<b>Simulating returns nothing to anyone.</b> No answer is delivered, no file is written, no notification is sent, and neither person is told. The preview lives and dies in your browser — and the simulation itself is written to the activity log, with you as the actor and them as the subject, so the audit reads honestly either way.') + '</div>'
    + setup
    + '<div style="margin:18px 0">' + simxDiff(q, RA, RB, va, vb) + '</div>'
    + compare
    + '<div class="split wide" style="margin-top:18px">'
    + panel("Why the two differ", simxTrace(q, RA, RB, va, vb), { icon:"log", sub:"Evaluated in precedence order" })
    + '<div>'
    + panel("Rules that could fire", simxMatrix(q, RA, RB, va, vb), { icon:"filter", sub:"For this question" })
    + panel("Read this honestly", callout("warn",
      '<b>&ldquo;No data&rdquo; and &ldquo;not allowed to see the data&rdquo; are different answers,</b> and this screen never lets them look the same. A filtered row is named and counted. A masked cell shows <span class="mono">••••</span>. A suppressed cell shows <span class="mono">&lt;5</span>. A withheld column says <span class="mono">[withheld]</span>. Hover any of them and the rule that did it says so.')
      + '<div style="margin-top:12px">' + callout("mut", '<b>Nothing here widens access.</b> Sharing this comparison shares the picture, not the entitlement. If someone opens the answer behind it, it runs again as them.') + '</div>', { icon:"info" })
    + '</div></div>'
    + '<div style="margin-top:18px">' + simxSteynPanel() + '</div>'
    + '<div style="margin-top:18px">' + walk + '</div>';
}
V2ROUTES.sim = renderSim;
</script>
