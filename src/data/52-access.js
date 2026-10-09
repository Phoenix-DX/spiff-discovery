<script>
/* =====================================================================
   SPIFF v2 — ACCESS GOVERNANCE DATA
   Entitlements (group x dataset), access requests, review campaigns,
   time-bound grants and the recent-changes stream.

   Two invariants are baked into this data and must stay true:
     1. Nothing binds to an individual. Every standing grant is held by a
        group; individual exceptions exist only as time-bound entries in
        ACCESS_TIMEBOUND, and they all carry an expiry.
     2. Platform Admin is not a data role. The platform-admins row of the
        matrix is deliberately empty apart from reference geography.

   API:
     accessFor(groupId, datasetId) -> 'full' | 'part' | 'none' | 'block'
     myAccess(datasetId)           -> the current viewer's effective level as
                                      a plain string, honouring the simulator.
     myAccessLevel(datasetId)      -> alias of myAccess.
     myAccessDetail(datasetId)     -> the same resolution with its working
                                      shown: which groups grant it, which
                                      rules shape it, whose scope it is under.
   ===================================================================== */

const ACCESS_LEVELS = {
  full : {label:"Full",    cls:"ok",   short:"F", note:"Every field in the dataset, still subject to row scoping."},
  part : {label:"Partial", cls:"warn", short:"P", note:"Held, but one or more fields are masked or withheld."},
  none : {label:"None",    cls:"mut",  short:"—", note:"Not in a group that holds this dataset. Can be requested."},
  block: {label:"Blocked", cls:"crit", short:"x", note:"Excluded by policy. Not requestable and not overridable."}
};
const ACCESS_RANK = {none:0, part:1, full:2, block:3};

/* ---------- the policy matrix ----------
   Columns are datasets, in DATASETS order. F full · P partial · N none · B blocked.
   Read a row as a sentence: "everyone in this group holds this much of each dataset."   */
const ENT_COLS = ["meetings","members","localities","families","travel","itineraries","events",
                  "registrations","growth","appointments","properties","comms","budgets","checkins","care"];
const ENT_KEY  = {F:"full", P:"part", N:"none", B:"block"};
function ENTROW(codes){
  const o = {}, a = codes.trim().split(/\s+/);
  ENT_COLS.forEach(function(c,i){ o[c] = ENT_KEY[a[i]] || "none"; });
  return o;
}

const ENTITLEMENTS = {
  /*                        mee mem loc fam tra iti eve reg gro app pro com bud chk car */
  "all-staff":       ENTROW(" P   N   F   N   N   N   F   N   F   P   F   N   N   N   B "),
  "ldm-coordinators":ENTROW(" F   P   F   P   N   N   F   P   F   F   F   P   N   P   B "),
  "southern-cluster":ENTROW(" F   P   F   P   N   N   F   P   F   F   F   N   N   P   B "),
  "northern-cluster":ENTROW(" F   P   F   P   N   N   F   P   F   F   F   N   N   P   B "),
  "stewards":        ENTROW(" F   P   F   P   P   P   F   P   F   F   F   F   N   F   B "),
  "travel-office":   ENTROW(" N   P   F   P   F   F   P   P   N   N   P   N   N   N   B "),
  "event-ops":       ENTROW(" P   P   F   N   N   P   F   F   N   N   F   P   N   N   B "),
  "records-office":  ENTROW(" P   F   F   F   N   N   N   N   F   F   N   P   N   N   B "),
  "safeguarding":    ENTROW(" P   P   F   P   N   N   N   P   N   P   N   N   N   N   B "),
  "national-stats":  ENTROW(" P   P   F   P   N   N   F   P   F   F   F   P   P   N   B "),
  "finance-team":    ENTROW(" N   N   F   N   P   N   N   N   N   N   N   N   F   N   B "),
  "platform-admins": ENTROW(" N   N   F   N   N   N   N   N   N   N   N   N   N   N   B ")
};

/* ---------- why each row looks the way it does, and who signed it ---------- */
const ENT_META = {
  "all-staff":       {by:"Ezra Haddad",     on:"08 Jan 2024", review:"Annual",    src:"Directory sync",
    why:"The floor everyone stands on. Reference geography, the aggregate growth mart and the event calendar. No personal record, ever."},
  "ldm-coordinators":{by:"Reneilwe Dlomo",     on:"12 Mar 2024", review:"Half-yearly",src:"Directory sync",
    why:"Runs the meeting cycle, so full attendance and appointments. Member detail stays partial — names and contact are masked outside their own locality."},
  "southern-cluster":{by:"Reneilwe Dlomo",     on:"21 May 2025", review:"Half-yearly",src:"Attribute rule",
    why:"Same shape as the Northern Cluster. The rule assigns it, so a country change in Directory moves someone in or out without anyone filing a ticket."},
  "northern-cluster":{by:"Tumelo Maseko",    on:"21 May 2025", review:"Half-yearly",src:"Attribute rule",
    why:"Same shape as the Southern Cluster. Different countries, identical policy — the bundle scales, a per-person grant would not."},
  "stewards":        {by:"Marcus Vilakazi",    on:"08 Jan 2024", review:"Quarterly",  src:"Manual",
    why:"Stewards own definitions, not identities. Wide coverage so they can fix data, but member and family detail is masked like everyone else's."},
  "travel-office":   {by:"Colette Marais",     on:"15 Sep 2024", review:"Half-yearly",src:"Directory sync",
    why:"Full travel and itineraries because they book them. Partial members so they can match a traveller to a record. No attendance, no finance."},
  "event-ops":       {by:"Warrick Meintjes",     on:"02 Jun 2024", review:"Half-yearly",src:"Directory sync",
    why:"Owns events and registrations end to end. Wellbeing notes on registrations stay masked unless an active event assignment is recorded."},
  "records-office":  {by:"Sindi Mthembu",     on:"08 Jan 2024", review:"Quarterly",  src:"Manual",
    why:"The only group with full member and family records — they are the system of record. It is nine people, reviewed every quarter."},
  "safeguarding":    {by:"Cathleen Oberholzer", on:"11 Nov 2024", review:"Monthly",    src:"Manual",
    why:"Partial on members and families, purpose-bound and logged on every read. Pastoral notes are blocked here too — no role unlocks them."},
  "national-stats":  {by:"Rupert Mackenzie",   on:"19 Feb 2024", review:"Half-yearly",src:"Manual",
    why:"Unscoped across the whole region for the statutory return, but aggregate only — small counts are suppressed and detail rows never resolve."},
  "finance-team":    {by:"Brendan Jooste",     on:"14 Feb 2026", review:"Half-yearly",src:"Directory sync",
    why:"Budgets in full, travel cost lines in part, geography for labelling. Nothing else. Finance does not need to know who attended anything."},
  "platform-admins": {by:"Ezra Haddad",     on:"08 Jan 2024", review:"Quarterly",  src:"Manual",
    why:"Runs Spiff, not the data in it. Admins manage connectors, quotas and retention and hold no member, meeting, travel or finance access at all."}
};

function accessFor(groupId, datasetId){
  if(datasetId === "care") return "block";
  const row = ENTITLEMENTS[groupId];
  return (row && row[datasetId]) || "none";
}

function accessGroupsOf(person){
  const g = ["all-staff"].concat((person && person.groups) || []);
  return g.filter(function(x,i){ return g.indexOf(x) === i; });
}

function myAccess(datasetId){
  const v  = (typeof viewer === "function") ? viewer() : ME;
  const gs = accessGroupsOf(v);
  let lv = "none";
  for(let i=0;i<gs.length;i++){
    const x = accessFor(gs[i], datasetId);
    if(x === "block") return "block";
    if(ACCESS_RANK[x] > ACCESS_RANK[lv]) lv = x;
  }
  return lv;
}
function myAccessLevel(datasetId){ return myAccess(datasetId); }

/* The same resolution with its working shown — what the person-detail and
   my-data-access screens need in order to explain themselves. */
function myAccessDetail(datasetId){
  const v = (typeof viewer === "function") ? viewer() : ME;
  const gs = accessGroupsOf(v), level = myAccess(datasetId);
  const d  = (typeof ds === "function") ? ds(datasetId) : null;
  const via = gs.filter(function(g){ const x = accessFor(g,datasetId); return x === "full" || x === "part"; });
  const L = ACCESS_LEVELS[level];
  return {
    level: level, label: L.label, cls: L.cls, note: L.note,
    dataset: datasetId, who: v.name,
    simulated: (typeof SIM !== "undefined") && !!SIM,
    viaIds: via,
    via: via.map(function(g){ const G = groupById(g); return G ? G.name : g; }),
    rules: (d && d.rules) || [],
    scope: (v.localities && v.localities.length ? v.localities.length + " of " + fmt(ORG.localityCount) + " localities" : "every locality")
  };
}

/* ---------- access requests ----------
   Approved and Completed are different states on purpose: provisioning is a
   real step and it can fail. Nothing here claims access the person does not
   yet hold.                                                                  */
function RQSTAGE(name, who, state, when){ return {name:name, who:who, state:state, when:when}; }

const REQUESTS = [
  {id:"REQ-1041", who:"Dawid Kruger", whoTitle:"Locality Secretary · Bloemfontein", dataset:"members",
   fields:"Email, Mobile", purpose:"Locality contact list",
   justification:"I run the Bloemfontein visiting rota for 140 members and copy contact details out of Directory by hand every week. I only need my own locality.",
   requested:"28 Aug 2026", duration:"90 days — would expire 26 Nov 2026", stage:"Data steward", status:"Pending", risk:"medium",
   stages:[RQSTAGE("Manager","Reneilwe Dlomo","done","28 Aug, 11:40"), RQSTAGE("Data steward","Sindi Mthembu","current","waiting 3 days"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","waiting","—"), RQSTAGE("Provisioning","Automatic","waiting","—")]},

  {id:"REQ-1040", who:"Gugu Pillay", whoTitle:"Event Coordinator · Pietermaritzburg", dataset:"registrations",
   fields:"Dietary notes, Accessibility notes", purpose:"Catering and access planning, KZN youth weekend",
   justification:"The caterer needs counts by dietary requirement. I do not need names — counts by category would be enough if that is easier to grant.",
   requested:"26 Aug 2026", duration:"Until 14 Oct 2026 — event close plus 14 days", stage:"Privacy review", status:"Pending", risk:"high",
   stages:[RQSTAGE("Manager","Warrick Meintjes","done","26 Aug, 09:05"), RQSTAGE("Data steward","Amira Rasool","done","27 Aug, 14:22"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","current","waiting 4 days"), RQSTAGE("Provisioning","Automatic","waiting","—")]},

  {id:"REQ-1039", who:"Adriaan de Villiers", whoTitle:"Finance Analyst · Pretoria", dataset:"travel",
   fields:"Cost centre, Ticket cost, Booking reference", purpose:"Reconcile Q3 travel spend to the ledger",
   justification:"Three cost centres do not tie out. I need booking-level cost lines, not traveller names.",
   requested:"21 Aug 2026", duration:"180 days — expires 17 Feb 2027", stage:"Provisioning", status:"Approved", risk:"medium",
   outcome:"Approved 24 Aug. Provisioning runs on the next Directory sync — until it completes, this person holds nothing new.",
   stages:[RQSTAGE("Manager","Brendan Jooste","done","21 Aug, 16:10"), RQSTAGE("Data steward","Colette Marais","done","24 Aug, 08:40"),
           RQSTAGE("Privacy review","—","skipped","No personal fields requested"), RQSTAGE("Provisioning","Automatic","current","queued for tonight")]},

  {id:"REQ-1038", who:"Rethabile Sibanda", whoTitle:"Statistics Analyst · Rustenburg", dataset:"growth",
   fields:"All fields", purpose:"National movement series for the annual return",
   justification:"The annual return needs net movement by locality for the last 36 months. Aggregate only.",
   requested:"12 Aug 2026", duration:"12 months — expires 12 Aug 2027", stage:"Provisioned", status:"Completed", risk:"low",
   outcome:"Live since 13 Aug. Used 41 times so far.",
   stages:[RQSTAGE("Manager","Tumelo Maseko","done","12 Aug, 10:02"), RQSTAGE("Data steward","Rupert Mackenzie","done","12 Aug, 15:31"),
           RQSTAGE("Privacy review","—","skipped","Aggregate mart, no detail rows"), RQSTAGE("Provisioning","Automatic","done","13 Aug, 06:12")]},

  {id:"REQ-1037", who:"Pierre Vermeulen", whoTitle:"Locality Secretary · Kimberley", dataset:"members",
   fields:"Full name, Date of birth (under 18)", purpose:"Youth register",
   justification:"I would like the full youth register for my locality including dates of birth so I can plan the age groups.",
   requested:"04 Aug 2026", duration:"Requested indefinite", stage:"Declined", status:"Declined", risk:"high",
   outcome:"Declined by Cathleen Oberholzer on 06 Aug. Under-18 dates of birth are masked for everyone by rule r-minor-dob, which has no exception clause. A youth count by age band is already available without any request.",
   stages:[RQSTAGE("Manager","Siyabonga Nxumalo","done","04 Aug, 13:18"), RQSTAGE("Data steward","Sindi Mthembu","done","05 Aug, 09:44"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","done","Declined 06 Aug, 11:02"), RQSTAGE("Provisioning","Automatic","skipped","—")]},

  {id:"REQ-1036", who:"Johannes Swanepoel", whoTitle:"Estates Officer · Makhanda", dataset:"properties",
   fields:"Room capacity, Booking status", purpose:"Venue planning for the Makhanda circuit",
   justification:"Matching meeting sizes to rooms. I currently phone each property.",
   requested:"29 Jul 2026", duration:"12 months — expires 29 Jul 2027", stage:"Provisioned", status:"Completed", risk:"low",
   outcome:"Live since 30 Jul.",
   stages:[RQSTAGE("Manager","Kobus Prinsloo","done","29 Jul, 08:55"), RQSTAGE("Data steward","Lesedi Mofokeng","done","29 Jul, 16:20"),
           RQSTAGE("Privacy review","—","skipped","No personal fields"), RQSTAGE("Provisioning","Automatic","done","30 Jul, 06:08")]},

  {id:"REQ-1035", who:"Helena Bosman", whoTitle:"Travel Coordinator · Stellenbosch", dataset:"itineraries",
   fields:"All fields", purpose:"Build the December pilgrimage journey plan",
   justification:"Itineraries is where connections and layovers live. Travel bookings alone does not show the journey.",
   requested:"29 Aug 2026", duration:"120 days — would expire 27 Dec 2026", stage:"Manager", status:"Pending", risk:"medium",
   stages:[RQSTAGE("Manager","Colette Marais","current","waiting 2 days"), RQSTAGE("Data steward","Lesedi Mofokeng","waiting","—"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","waiting","—"), RQSTAGE("Provisioning","Automatic","waiting","—")]},

  {id:"REQ-1034", who:"Martinus Viljoen", whoTitle:"Locality Secretary · Stellenbosch", dataset:"meetings",
   fields:"Member name", purpose:"Follow up on members who missed two meetings",
   justification:"I can see the counts but not who to visit.",
   requested:"22 Jul 2026", duration:"60 days", stage:"Expired", status:"Expired", risk:"low",
   outcome:"No approver acted within 14 days, so the request expired on 05 Aug. Nothing escalated and nothing was granted by default — the failure mode is closed, not open.",
   stages:[RQSTAGE("Manager","Murray Shepstone","done","22 Jul, 07:30"), RQSTAGE("Data steward","Sindi Mthembu","current","expired unanswered"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","skipped","—"), RQSTAGE("Provisioning","Automatic","skipped","—")]},

  {id:"REQ-1033", who:"Zinhle Kunene", whoTitle:"Care Coordinator · Pretoria", dataset:"care",
   fields:"All fields", purpose:"Care follow-up list",
   justification:"I hold the Safeguarding Lead role and would like the care notes in Spiff so I can search them.",
   requested:"18 Aug 2026", duration:"—", stage:"Declined", status:"Declined", risk:"critical",
   outcome:"Declined at the policy check, before it reached a person. Pastoral care notes are excluded from Spiff by rule r-pastoral-block. No one can grant this — not a steward, not a Safeguarding Lead, not a Platform Admin. The fields are never loaded.",
   stages:[RQSTAGE("Policy check","Automatic","done","Declined 18 Aug, 09:03"), RQSTAGE("Manager","Cathleen Oberholzer","skipped","Not reachable"),
           RQSTAGE("Privacy review","—","skipped","—"), RQSTAGE("Provisioning","Automatic","skipped","—")]},

  {id:"REQ-1032", who:"Bheki Ngcobo", whoTitle:"Locality Secretary · Polokwane", dataset:"comms",
   fields:"Delivery status, Channel", purpose:"Check notice delivery across Polokwane localities",
   justification:"Several members say they never received the July notice. I want to see what was delivered.",
   requested:"25 Aug 2026", duration:"90 days — expires 23 Nov 2026", stage:"Provisioning", status:"Approved", risk:"low",
   outcome:"Approved 27 Aug. Recipient identity stays hashed — the grant is delivery status, not who was written to.",
   stages:[RQSTAGE("Manager","Tumelo Maseko","done","25 Aug, 12:44"), RQSTAGE("Data steward","Rika Olivier","done","27 Aug, 10:05"),
           RQSTAGE("Privacy review","—","skipped","Recipient identity already hashed"), RQSTAGE("Provisioning","Automatic","current","queued for tonight")]},

  {id:"REQ-1031", who:"Farida Padayachee", whoTitle:"Statistics Analyst · Pietermaritzburg", dataset:"budgets",
   fields:"Cost centre, Budget, Actual", purpose:"Cost per member series for the national return",
   justification:"The return asks for cost per member by locality. I have the member counts and none of the cost.",
   requested:"27 Aug 2026", duration:"180 days — would expire 23 Feb 2027", stage:"Data steward", status:"Pending", risk:"high",
   stages:[RQSTAGE("Manager","Rupert Mackenzie","done","27 Aug, 09:18"), RQSTAGE("Data steward","Brendan Jooste","current","waiting 4 days"),
           RQSTAGE("Privacy review","—","skipped","No personal fields"), RQSTAGE("Provisioning","Automatic","waiting","—")]},

  {id:"REQ-1030", who:"Nokuthula Dladla", whoTitle:"Locality Secretary · Nelspruit", dataset:"families",
   fields:"Household composition", purpose:"Visiting rota by household",
   justification:"Visiting by household rather than by individual halves the number of trips.",
   requested:"05 Aug 2026", duration:"90 days — expires 03 Nov 2026", stage:"Provisioned", status:"Completed", risk:"medium",
   outcome:"Live since 07 Aug. Address stays masked outside her own locality.",
   stages:[RQSTAGE("Manager","Tumelo Maseko","done","05 Aug, 08:12"), RQSTAGE("Data steward","Sindi Mthembu","done","06 Aug, 13:40"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","done","07 Aug, 09:15"), RQSTAGE("Provisioning","Automatic","done","07 Aug, 18:02")]},

  {id:"REQ-1029", who:"Elijah Mabena", whoTitle:"Locality Secretary · Rustenburg", dataset:"appointments",
   fields:"Appointment type, Holder", purpose:"Find localities with no secretary appointed",
   justification:"Planning the next round of appointments.",
   requested:"14 Jul 2026", duration:"—", stage:"Expired", status:"Expired", risk:"low",
   outcome:"Expired 28 Jul, unanswered. Since then this access arrived anyway through the Northern Cluster rule — the request was never needed.",
   stages:[RQSTAGE("Manager","Tumelo Maseko","current","expired unanswered"), RQSTAGE("Data steward","Reneilwe Dlomo","skipped","—"),
           RQSTAGE("Privacy review","—","skipped","—"), RQSTAGE("Provisioning","Automatic","skipped","—")]},

  {id:"REQ-1028", who:"Amira Rasool", whoTitle:"Event Operations Lead · Stellenbosch", dataset:"registrations",
   fields:"All fields except wellbeing notes", purpose:"Run the event operations dashboard",
   justification:"Standing access for the role. Wellbeing notes deliberately excluded.",
   requested:"02 Jun 2026", duration:"12 months — expires 02 Jun 2027", stage:"Provisioned", status:"Completed", risk:"medium",
   outcome:"Live since 03 Jun. Renews with the Event Operations half-yearly review.",
   stages:[RQSTAGE("Manager","Warrick Meintjes","done","02 Jun, 10:30"), RQSTAGE("Data steward","Amira Rasool","done","02 Jun, 15:00"),
           RQSTAGE("Privacy review","Cathleen Oberholzer","done","03 Jun, 08:20"), RQSTAGE("Provisioning","Automatic","done","03 Jun, 18:04")]}
];

/* The dataset profile's Requests tab reads `on`; keep it in step with `requested`. */
REQUESTS.forEach(function(r){ r.on = r.requested; });

/* ---------- review campaigns ----------
   Items are pre-sorted the way a reviewer wants them: unusual first, dormant
   second, standard-for-role last. The diff, not the list, is the unit of work. */
function REVITEM(who, dataset, access, since, lastUsed, normal, flag){
  const p = (typeof personByName === "function") ? personByName(who) : null;
  const gid = p && p.groups && p.groups.length ? p.groups[0] : "all-staff";
  const g = (typeof groupById === "function") ? groupById(gid) : null;
  return {who:who, whoTitle:(p ? p.title : ""), group:(g ? g.name : "All staff"),
          dataset:dataset, access:access, since:since, lastUsed:lastUsed, normal:normal, flag:flag || null};
}

const REVIEWS = [
  {id:"rev-personal-q3", name:"Personal data — Q3 2026",
   scope:"Every grant on Member records, Family units and Event registrations, across all 428 people.",
   owner:"Sindi Mthembu", due:"30 Sep 2026", state:"in-progress", progress:47, total:30, decided:14,
   note:"Sign-off is blocked until all 30 items are decided. Keep needs a justification; Revoke needs a reason.",
   items:[
    REVITEM("Brendan Jooste","members","Partial — contact masked","14 Feb 2026","3 d ago","0 of 19 in Finance hold this","Unusual"),
    REVITEM("Gugu Pillay","registrations","Full","11 Mar 2026","5 h ago","12 of 27 in Event Operations hold Full","Unusual"),
    REVITEM("Johannes Swanepoel","families","Partial — address masked","02 Nov 2025","61 d ago","1 of 6 in Estates holds this","Unusual"),
    REVITEM("Martinus Viljoen","members","Partial — contact masked","19 Jan 2025","41 d ago","88 of 88 in Southern Cluster","Leaver"),
    REVITEM("Pierre Vermeulen","members","Partial — contact masked","22 Jun 2025","94 d ago","88 of 88 in Southern Cluster","Dormant"),
    REVITEM("Adriaan de Villiers","registrations","Partial — wellbeing withheld","08 Aug 2025","77 d ago","0 of 19 in Finance hold this","Dormant"),
    REVITEM("Kobus Prinsloo","members","Partial — contact masked","30 Sep 2025","56 d ago","1 of 6 in Estates holds this","Dormant"),
    REVITEM("Elijah Mabena","families","Partial — address masked","14 Apr 2026","48 d ago","71 of 71 in Northern Cluster","Dormant"),
    REVITEM("Thato Sekhoto","members","Partial — contact masked","12 Mar 2024","2 min ago","34 of 34 LDM Coordinators"),
    REVITEM("Reneilwe Dlomo","members","Partial — contact masked","04 Jan 2024","18 min ago","22 of 22 Data Stewards"),
    REVITEM("Pavitra Govender","members","Partial — aggregate only","19 Feb 2024","1 h ago","6 of 6 National Statistics"),
    REVITEM("Dawid Kruger","families","Partial — address masked","21 May 2025","3 h ago","88 of 88 Southern Cluster"),
    REVITEM("Sindi Mthembu","members","Full","08 Jan 2024","20 min ago","9 of 9 Records Office"),
    REVITEM("Tumelo Maseko","members","Partial — contact masked","17 Mar 2024","5 h ago","34 of 34 LDM Coordinators"),
    REVITEM("Amira Rasool","registrations","Full","02 Jun 2024","44 min ago","27 of 27 Event Operations"),
    REVITEM("Colette Marais","members","Partial — traveller match only","15 Sep 2024","2 h ago","14 of 14 Travel Office"),
    REVITEM("Marcus Vilakazi","members","Partial — contact masked","08 Jan 2024","9 min ago","22 of 22 Data Stewards"),
    REVITEM("Cathleen Oberholzer","members","Partial — purpose-bound","11 Nov 2024","6 h ago","6 of 6 Safeguarding Leads"),
    REVITEM("Rupert Mackenzie","families","Partial — aggregate only","19 Feb 2024","1 d ago","6 of 6 National Statistics"),
    REVITEM("Warrick Meintjes","registrations","Full","02 Jun 2024","2 d ago","27 of 27 Event Operations"),
    REVITEM("Murray Shepstone","members","Partial — contact masked","17 Mar 2024","30 min ago","34 of 34 LDM Coordinators"),
    REVITEM("Nokuthula Dladla","families","Partial — address masked","14 Apr 2026","7 h ago","71 of 71 Northern Cluster"),
    REVITEM("Lesedi Mofokeng","members","Partial — contact masked","08 Jan 2024","55 min ago","22 of 22 Data Stewards"),
    REVITEM("Farida Padayachee","members","Partial — aggregate only","19 Feb 2024","3 h ago","6 of 6 National Statistics"),
    REVITEM("Siyabonga Nxumalo","families","Partial — address masked","21 May 2025","12 h ago","88 of 88 Southern Cluster"),
    REVITEM("Helena Bosman","members","Partial — traveller match only","15 Sep 2024","1 h ago","14 of 14 Travel Office"),
    REVITEM("Zinhle Kunene","members","Partial — purpose-bound","11 Nov 2024","8 h ago","6 of 6 Safeguarding Leads"),
    REVITEM("Rethabile Sibanda","registrations","Partial — wellbeing withheld","14 Apr 2026","6 h ago","71 of 71 Northern Cluster"),
    REVITEM("Londiwe Zwane","members","Partial — contact masked","17 Mar 2024","25 min ago","34 of 34 LDM Coordinators"),
    REVITEM("Rika Olivier","members","Full","08 Jan 2024","2 h ago","9 of 9 Records Office")
   ]},

  {id:"rev-travel-h2", name:"Travel & Logistics — half year",
   scope:"Travel bookings and Itineraries, every group that holds either.",
   owner:"Colette Marais", due:"31 Oct 2026", state:"not-started", progress:0, total:8, decided:0,
   note:"Opens 01 Oct. Travel carries passport and document fields, so this campaign always runs with a privacy reviewer attached.",
   items:[
    REVITEM("Colette Marais","travel","Full","15 Sep 2024","2 h ago","14 of 14 Travel Office"),
    REVITEM("Helena Bosman","travel","Full","15 Sep 2024","1 h ago","14 of 14 Travel Office"),
    REVITEM("Adriaan de Villiers","travel","Partial — cost lines only","21 Aug 2026","3 d ago","19 of 19 Finance"),
    REVITEM("Brendan Jooste","travel","Partial — cost lines only","14 Feb 2026","4 h ago","19 of 19 Finance"),
    REVITEM("Marcus Vilakazi","travel","Partial — documents masked","08 Jan 2024","9 min ago","22 of 22 Data Stewards"),
    REVITEM("Lesedi Mofokeng","travel","Partial — documents masked","08 Jan 2024","55 min ago","22 of 22 Data Stewards"),
    REVITEM("Reneilwe Dlomo","itineraries","Partial — draft dataset","04 Jan 2024","18 min ago","22 of 22 Data Stewards"),
    REVITEM("Amira Rasool","itineraries","Partial — event legs only","02 Jun 2024","44 min ago","27 of 27 Event Operations")
   ]},

  {id:"rev-admin-q2", name:"Platform Admin — Q2 2026",
   scope:"All five Platform Admins: the privileges they hold and any data access attached to them.",
   owner:"Ezra Haddad", due:"30 Jun 2026", state:"signed-off", progress:100, total:5, decided:5,
   signedOff:"22 Jul 2026 by Ezra Haddad",
   note:"Outcome: five admins kept, zero data grants found. Platform Admin manages Spiff and holds no member, meeting, travel or finance access.",
   items:[
    REVITEM("Ezra Haddad","localities","Full — reference only","08 Jan 2024","just now","5 of 5 Platform Admins"),
    REVITEM("Marcus Vilakazi","localities","Full — reference only","08 Jan 2024","9 min ago","5 of 5 Platform Admins"),
    REVITEM("Pavitra Govender","localities","Full — reference only","19 Feb 2024","1 h ago","5 of 5 Platform Admins"),
    REVITEM("Reneilwe Dlomo","localities","Full — reference only","04 Jan 2024","18 min ago","5 of 5 Platform Admins"),
    REVITEM("Sindi Mthembu","localities","Full — reference only","08 Jan 2024","20 min ago","5 of 5 Platform Admins")
   ]}
];

/* ---------- individual exceptions: every one of them expires ---------- */
const ACCESS_TIMEBOUND = [
  {who:"Thato Sekhoto", dataset:"members",       level:"part", granted:"12 Jun 2026", expires:"12 Dec 2026", days:103, by:"Sindi Mthembu",     reason:"Contact fields for the Southern Cluster visiting rota."},
  {who:"Thato Sekhoto", dataset:"budgets",       level:"part", granted:"01 Aug 2026", expires:"29 Sep 2026", days:29,  by:"Brendan Jooste",     reason:"Cost centre labels for the cluster meeting-cost review."},
  {who:"Adriaan de Villiers", dataset:"travel",        level:"part", granted:"24 Aug 2026", expires:"17 Feb 2027", days:170, by:"Colette Marais",     reason:"REQ-1039 — Q3 travel reconciliation."},
  {who:"Bheki Ngcobo",   dataset:"comms",         level:"part", granted:"27 Aug 2026", expires:"23 Nov 2026", days:84,  by:"Rika Olivier",   reason:"REQ-1032 — Polokwane notice delivery check."},
  {who:"Nokuthula Dladla",   dataset:"families",      level:"part", granted:"07 Aug 2026", expires:"03 Nov 2026", days:64,  by:"Sindi Mthembu",     reason:"REQ-1030 — visiting rota by household."},
  {who:"Rethabile Sibanda", dataset:"growth",        level:"full", granted:"13 Aug 2026", expires:"12 Aug 2027", days:346, by:"Rupert Mackenzie",   reason:"REQ-1038 — national movement series."},
  {who:"Johannes Swanepoel",     dataset:"properties",    level:"full", granted:"30 Jul 2026", expires:"29 Jul 2027", days:332, by:"Lesedi Mofokeng",     reason:"REQ-1036 — Makhanda venue planning."},
  {who:"Amira Rasool",    dataset:"registrations", level:"full", granted:"03 Jun 2026", expires:"02 Jun 2027", days:275, by:"Cathleen Oberholzer", reason:"REQ-1028 — event operations dashboard."},
  {who:"Gugu Pillay",    dataset:"registrations", level:"full", granted:"11 Mar 2026", expires:"22 Sep 2026", days:11,  by:"Warrick Meintjes",     reason:"Standing exception for the KZN youth programme. Flagged unusual in the Q3 review."},
  {who:"Brendan Jooste",   dataset:"members",       level:"part", granted:"14 Feb 2026", expires:"14 Sep 2026", days:14,  by:"Sindi Mthembu",     reason:"Payroll reconciliation. Flagged unusual — no other Finance person holds this."},
  {who:"Zinhle Kunene",  dataset:"registrations", level:"part", granted:"11 Nov 2025", expires:"11 Nov 2026", days:72,  by:"Cathleen Oberholzer", reason:"Safeguarding follow-up on youth events. Purpose-bound, every read logged."},
  {who:"Farida Padayachee",    dataset:"appointments",  level:"full", granted:"19 Feb 2026", expires:"19 Feb 2027", days:172, by:"Reneilwe Dlomo",     reason:"Appointment coverage series for the statutory return."}
];

/* ---------- recent changes ---------- */
const ACCESS_EVENTS = [
  {kind:"sync",   who:"Directory sync",     what:"Northern Cluster refreshed — 3 people in, 1 out",  detail:"Attribute rule matched on country. Nobody approved anything; the rule did it.", when:"today 05:40",  cls:"mut"},
  {kind:"grant",  who:"Rika Olivier",    what:"Bheki Ngcobo granted Partial on Notices & delivery", detail:"REQ-1032 · expires 23 Nov 2026",  when:"today 05:41",  cls:"ok"},
  {kind:"role",   who:"Reneilwe Dlomo",      what:"Londiwe Zwane added to LDM Coordinators",           detail:"Grants Locality Secretary and Report Author",                                   when:"yesterday 16:22", cls:"ok"},
  {kind:"revoke", who:"Sindi Mthembu",      what:"Martinus Viljoen suspended — all grants held",        detail:"Role change pending in Directory. Access is frozen, not deleted.",              when:"yesterday 11:05", cls:"crit"},
  {kind:"deny",   who:"Policy",             what:"Zinhle Kunene denied Pastoral care notes",        detail:"REQ-1033 · rule r-pastoral-block · not overridable by anyone",                  when:"18 Aug 09:03", cls:"crit"},
  {kind:"grant",  who:"Colette Marais",      what:"Adriaan de Villiers approved for Travel bookings",     detail:"REQ-1039 · cost lines only · provisioning queued",                              when:"24 Aug 08:40", cls:"ok"},
  {kind:"review", who:"Sindi Mthembu",      what:"Personal data — Q3 2026 opened",                   detail:"30 items across 30 people · due 30 Sep",                                        when:"20 Aug 08:00", cls:"warn"},
  {kind:"revoke", who:"Reneilwe Dlomo",      what:"Pierre Vermeulen flagged dormant",                   detail:"Granted 14 months ago, 3 questions asked, last used 94 days ago",               when:"19 Aug 14:30", cls:"warn"},
  {kind:"role",   who:"Marcus Vilakazi",     what:"Data Stewards gained Full on Check-ins (raw)",     detail:"Deprecated dataset — stewards need it to finish the migration off it",         when:"15 Aug 10:12", cls:"mut"},
  {kind:"grant",  who:"Rupert Mackenzie",    what:"Rethabile Sibanda granted Full on Membership movement", detail:"REQ-1038 · expires 12 Aug 2027",                                             when:"13 Aug 06:12", cls:"ok"},
  {kind:"deny",   who:"Cathleen Oberholzer",  what:"Pierre Vermeulen declined for Member records",       detail:"REQ-1037 · under-18 dates of birth are masked for everyone",                    when:"06 Aug 11:02", cls:"crit"},
  {kind:"grant",  who:"Sindi Mthembu",      what:"Nokuthula Dladla granted Partial on Family units",    detail:"REQ-1030 · expires 03 Nov 2026",                                                when:"07 Aug 18:02", cls:"ok"},
  {kind:"expire", who:"Automatic",          what:"REQ-1034 expired unanswered",                      detail:"Martinus Viljoen · Meetings & attendance · nothing granted by default",            when:"05 Aug 00:01", cls:"warn"},
  {kind:"sync",   who:"Directory sync",     what:"Finance refreshed — 19 members, no change",        detail:"Group membership matches Directory exactly",                                    when:"today 05:40",  cls:"mut"},
  {kind:"review", who:"Ezra Haddad",      what:"Platform Admin — Q2 2026 signed off",              detail:"5 admins kept, zero data grants found",                                         when:"22 Jul 2026",  cls:"ok"},
  {kind:"expire", who:"Automatic",          what:"REQ-1029 expired unanswered",                      detail:"Elijah Mabena · Service appointments · later granted by the cluster rule",       when:"28 Jul 00:01", cls:"warn"}
];

/* ---------- headline numbers ---------- */
const ACCESS_STATS = {
  users: ORG.users, listed: PEOPLE.length, hidden: PEOPLE_HIDDEN, activeThisWeek: ORG.activeThisWeek,
  groups: GROUPS.length, roles: ROLES.length, datasets: DATASETS.length,
  grants: 1846, groupBound: 1846, individualGrants: 0,
  timeBound: ACCESS_TIMEBOUND.length, expiringSoon: 3,
  dormant: 37, dormantPct: 9, suspended: 1,
  pending: 4, awaitingProvisioning: 2, declined90d: 2, expired90d: 2,
  medianDecision: "1.4 days", reviewProgress: 47, reviewDue: "30 Sep 2026",
  blockedDatasets: 1, adminsWithData: 0, lastSync: "today 05:40",
  cells: GROUPS.length * DATASETS.length
};
</script>
