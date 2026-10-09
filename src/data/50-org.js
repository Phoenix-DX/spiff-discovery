<script>
/* =====================================================================
   SPIFF v2 — SHARED DATA SPINE
   Org, people, groups, roles, systems, datasets, fields.
   Every v2 view reads from here. Made-up data, no live systems.
   ===================================================================== */

/* ---------------------------------------------------------------------
   Scope tiers. These are the real ones the UBT systems use, in order:
   Global · Region · Country · Locality · Subdivision.
   A person's Directory record pins them to one Locality (and Subdivision);
   role domains widen that to a set of localities, a set of countries, or
   the whole region. Nothing binds to an "area" — that is an Orbit travel
   grouping where one locality can sit in several areas at once, which is
   exactly why it cannot carry permissions.
   --------------------------------------------------------------------- */
const TIERS = ["Global","Region","Country","Locality","Subdivision"];
const TIER_NOTE = {
  Global:      "Every region. Five people hold this, and it is reviewed quarterly.",
  Region:      "One whole region — South Africa covers eight countries here.",
  Country:     "One or more countries inside the region.",
  Locality:    "A named set of localities. This is where most access sits.",
  Subdivision: "One congregation subdivision inside a locality. The finest grain, and the one masking turns on."
};

const ORG = {
  name: "UBT — GST Division",
  short: "GST",
  users: 428,
  activeThisWeek: 311,
  region: "South Africa",
  countries: ["South Africa","Namibia","Botswana","Zimbabwe","Zambia","Mozambique","Lesotho","Eswatini"],
  /* the localities that appear on people records and in filters. The division
     covers 312 in total; these are the ones this slice of 428 people sit in. */
  localities: ["Bellville","Parow","Somerset West","Durbanville","Gqeberha North","East London",
               "Mthatha Central","Bloemfontein Central","Welkom","Sandton","Pretoria East","Benoni",
               "Pinetown","Umhlanga","Ballito","Polokwane Central","Tzaneen","Nelspruit","Witbank",
               "Rustenburg","Klerksdorp","Kimberley","Upington","Windhoek","Gaborone","Harare"],
  localityCount: 312,
  divisions: ["LDM Operations","Membership & Care","Travel & Logistics","Events","Estates","Finance","Statistics"],
  tenant: "ubt-gst.spiff.internal"
};
/* which country each locality sits in — a person's country is derived, never typed */
const LOCALITY_COUNTRY = {
  "Windhoek":"Namibia", "Gaborone":"Botswana", "Harare":"Zimbabwe"
};
const countryOf = loc => LOCALITY_COUNTRY[loc] || "South Africa";

/* ---------- current user ---------- */
const ME = {
  id:"thato", name:"Thato S.", full:"Thato Sekhoto", initials:"TS",
  email:"thato.sekhoto@ubteam.com", title:"LDM Coordinator — Cape Localities",
  team:"LDM Operations", manager:"Reneilwe D.",
  locality:"Bellville",
  localities:["Bellville","Parow","Somerset West","Durbanville","Gqeberha North","East London",
              "Mthatha Central","Bloemfontein Central","Welkom","Pinetown","Umhlanga","Ballito"],
  tier:"Locality",
  groups:["ldm-coordinators","all-staff"],
  roles:["Locality Secretary","Report Author"],
  scope:"12 of 312 localities", joined:"Mar 2024", lastReview:"12 Jun 2026"
};

/* Directory knows who Thato is. It does not know what he does: no system of
   record holds a person's team (Oren, 16 Sep 2026). Spiff searches every system
   it is connected to and lists what each one says. A member can hold different
   roles in different systems; Spiff never merges them into one. ME.title and
   ME.team above are what Connect says, kept on ME because the rail and the
   profile show them. */
ME.searched = ["directory","connect","assemble","orbit"];
ME.found = [
  {sys:"directory", role:"Member",                            scope:"Ballito · Cape Localities",                 since:"Mar 2024", note:"Name, contact, household, locality. Nothing about your work."},
  {sys:"connect",   role:"LDM Coordinator — Cape Localities", scope:"Role domain: LDM Operations · 12 localities", since:"Jun 2024", note:"Where your title and team come from. Connect grants roles by domain."},
  {sys:"connect",   role:"Notice publisher",                  scope:"Cape Localities",                           since:"Feb 2025", note:"A second Connect role. Roles stack; each applies where it applies."},
  {sys:"assemble",  role:"Event organiser",                   scope:"Managed events · Cape Localities",          since:"Sep 2024", note:"You can create events and invite members in your localities."},
  {sys:"orbit",     role:"Traveller",                         scope:"Own bookings only",                         since:"Mar 2024", note:"No approval rights in Orbit, so travel answers come back at that level."}
];

/* ---------- systems of record ---------- */
/* Every system here is one that actually exists in the UBT estate. Estates,
   Finance and a "GST Warehouse" were removed on 3 Sep 2026 — a search of the
   repositories found no trace of any of them, and six datasets had been hung
   off systems that were invented. Connect replaced them: it is the largest
   real system, it holds the role and permission model every other screen
   describes, and it was missing entirely. */
const SYSTEMS = [
  {id:"directory", name:"Directory",  kind:"System of record", desc:"Members, localities, subdivisions, households and service appointments. Member and Locality are system-versioned, so history is queryable.", status:"healthy", latency:"120 ms", datasets:6, color:"#2E7CD6"},
  {id:"connect",   name:"Connect",    kind:"System of record", desc:"Access and role domains, notices and delivery, polls, sites, community businesses and the user activity log.", status:"healthy", latency:"160 ms", datasets:8, color:"#1F52A0"},
  {id:"assemble",  name:"Assemble",   kind:"System of record", desc:"Managed events, event types, invitations and recurrence patterns.", status:"healthy", latency:"210 ms", datasets:2, color:"#0E9AA6"},
  {id:"orbit",     name:"Orbit",      kind:"System of record", desc:"Travel bookings, itineraries and accommodation.",     status:"degraded",latency:"1.4 s",  datasets:2, color:"#8E44AD"},
  {id:"none",      name:"Not registered", kind:"No system",    desc:"Described so people know it exists and can ask for it. Nothing is connected and nothing is loaded.", status:"none", latency:"—", datasets:1, color:"#8A9199"}
];
const sysById = id => SYSTEMS.find(s=>s.id===id) || SYSTEMS[0];

/* ---------- role bundles (access is granted by bundle, never by table) ---------- */
const ROLES = [
  {id:"viewer",      name:"Reader",              members:214, tier:"Locality", desc:"Ask questions and open answers shared with them, inside their own locality. No export, no schedules.", privs:["Ask questions","Open shared answers","Save to my workspace"], risk:"low"},
  {id:"secretary",   name:"Locality Secretary",  members:96,  tier:"Locality", desc:"Everything a Reader can do, plus detail rows for their assigned localities and scheduled delivery.", privs:["Ask questions","Locality detail rows","Schedule delivery","Export summary"], risk:"low"},
  {id:"author",      name:"Report Author",       members:61,  tier:"Locality", desc:"Builds and publishes answers to a team library, and builds automations that run as them.", privs:["Publish to library","Build automations","Export detail","Pin dashboard tiles"], risk:"medium"},
  {id:"steward",     name:"Data Steward",        members:22,  tier:"Locality", desc:"Owns dataset definitions, formatting and business rules for a domain. Its reach is the domain, not the map.", privs:["Edit dataset metadata","Author business rules","Certify datasets","Approve access"], risk:"high"},
  {id:"regional",    name:"Country Coordinator", members:18,  tier:"Country",  desc:"Every locality in their assigned countries, and approves access for those countries.", privs:["Cross-locality detail","Approve access (country)","View activity log (country)"], risk:"high"},
  {id:"safeguard",   name:"Safeguarding Lead",   members:6,   tier:"Country",  desc:"Restricted personal detail where a safeguarding purpose is recorded. Every access is logged and reviewed.", privs:["Minor records","Care flags","Purpose-bound access"], risk:"critical"},
  {id:"admin",       name:"Platform Admin",      members:5,   tier:"Global",   desc:"Runs Spiff itself — connectors, blocks, quotas, retention.", privs:["Manage connectors","Manage automation blocks","Set quotas","Full activity log"], risk:"critical"},
  {id:"national",    name:"Regional Office",     members:6,   tier:"Region",   desc:"Aggregate access across the whole region for statutory statistics. Detail rows are still suppressed.", privs:["Whole region (aggregate)","Statutory exports","Metric definitions"], risk:"high"}
];
const roleById = id => ROLES.find(r=>r.id===id);

/* ---------- groups (everything binds to groups, never to individuals) ---------- */
const GROUPS = [
  {id:"all-staff",         name:"All staff",              members:428, tier:"Region",   type:"Synced · Directory", roles:["viewer"], owner:"Platform Admin"},
  {id:"ldm-coordinators",  name:"LDM Coordinators",       members:34,  tier:"Locality", type:"Synced · Directory", roles:["secretary","author"], owner:"Reneilwe D."},
  {id:"southern-cluster",  name:"Southern Cluster",       members:88,  tier:"Country",  type:"Attribute rule",     roles:["secretary"], owner:"Reneilwe D.", rule:"country in (South Africa, Lesotho, Eswatini)"},
  {id:"northern-cluster",  name:"Northern Cluster",       members:71,  tier:"Country",  type:"Attribute rule",     roles:["regional"], owner:"Tumelo M.", rule:"country in (Namibia, Botswana, Zimbabwe, Zambia, Mozambique)"},
  {id:"stewards",          name:"Data Stewards",          members:22,  tier:"Region",   type:"Manual",             roles:["steward"], owner:"Marcus V."},
  {id:"travel-office",     name:"Travel Office",          members:14,  tier:"Region",   type:"Synced · Directory", roles:["author"], owner:"Colette M."},
  {id:"event-ops",         name:"Event Operations",       members:27,  tier:"Region",   type:"Synced · Directory", roles:["author"], owner:"Warrick M."},
  {id:"records-office",    name:"Records Office",         members:9,   tier:"Country",  type:"Manual",             roles:["steward"], owner:"Sindi M."},
  {id:"safeguarding",      name:"Safeguarding Leads",     members:6,   tier:"Country",  type:"Manual · reviewed monthly", roles:["safeguard"], owner:"Cathleen O."},
  {id:"national-stats",    name:"Regional Statistics",    members:6,   tier:"Region",   type:"Manual",             roles:["national"], owner:"Rupert M."},
  {id:"finance-team",      name:"Finance",                members:19,  tier:"Region",   type:"Synced · Directory", roles:["viewer"], owner:"Brendan J."},
  {id:"platform-admins",   name:"Platform Admins",        members:5,   tier:"Global",   type:"Manual · quarterly review", roles:["admin"], owner:"Ezra H."}
];
const groupById = id => GROUPS.find(g=>g.id===id);

/* ---------- people directory (a representative slice of 428) ---------- */
const AVCOLORS = ["#2E7CD6","#1F52A0","#0E9AA6","#8E44AD","#C77E12","#1E8449","#C0392B","#5B6B7C"];
function avColor(name){let h=0;for(const c of name)h=(h*31+c.charCodeAt(0))>>>0;return AVCOLORS[h%AVCOLORS.length];}
function initialsOf(name){return name.split(/\s+/).map(p=>p[0]).slice(0,2).join("").toUpperCase();}

/* a person's Directory record pins them to one locality; country is derived from it */
function P(name,title,team,locality,groups,roles,status,last,asked,extra){
  return Object.assign({id:name.toLowerCase().replace(/[^a-z]+/g,"-"),name,initials:initialsOf(name),title,team,
    locality,country:countryOf(locality),groups,roles,status,last,asked},extra||{});
}
const PEOPLE = [
  P("Thato Sekhoto","LDM Coordinator — Cape Localities","LDM Operations","Bellville",["ldm-coordinators"],["secretary","author"],"active","2 min ago",214,{me:true}),
  P("Reneilwe Dlomo","Delivery & Quality Manager","LDM Operations","Sandton",["ldm-coordinators","stewards"],["steward","author"],"active","18 min ago",341),
  P("Pavitra Govender","Statistics Analyst","Statistics","Pinetown",["national-stats","stewards"],["national","steward"],"active","1 h ago",506),
  P("Dawid Kruger","Locality Secretary","Membership & Care","Bloemfontein Central",["southern-cluster"],["secretary"],"active","3 h ago",88),
  P("Sindi Mthembu","Records Officer","Membership & Care","Pretoria East",["records-office"],["steward"],"active","20 min ago",129),
  P("Tumelo Maseko","Country Coordinator — Northern","LDM Operations","Windhoek",["northern-cluster","ldm-coordinators"],["regional"],"active","5 h ago",167),
  P("Amira Rasool","Event Operations Lead","Events","Parow",["event-ops"],["author"],"active","44 min ago",93),
  P("Colette Marais","Travel Office Manager","Travel & Logistics","Benoni",["travel-office"],["author"],"active","2 h ago",151),
  P("Marcus Vilakazi","Product Lead — Data","Statistics","Somerset West",["stewards","platform-admins"],["steward","admin"],"active","9 min ago",278),
  P("Cathleen Oberholzer","Safeguarding Lead","Membership & Care","Umhlanga",["safeguarding"],["safeguard"],"active","6 h ago",41),
  P("Rupert Mackenzie","Head of Statistics","Statistics","Sandton",["national-stats"],["national"],"active","1 d ago",62),
  P("Brendan Jooste","Finance Systems Lead","Finance","Durbanville",["finance-team"],["viewer"],"active","4 h ago",37),
  P("Warrick Meintjes","Events Director","Events","Pretoria East",["event-ops"],["author"],"active","2 d ago",58),
  P("Murray Shepstone","Divisional Manager","LDM Operations","Bellville",["ldm-coordinators"],["regional"],"active","30 min ago",112),
  P("Nokuthula Dladla","Locality Secretary","Membership & Care","Gaborone",["northern-cluster"],["secretary"],"active","7 h ago",44),
  P("Pierre Vermeulen","Locality Secretary","Membership & Care","Kimberley",["southern-cluster"],["secretary"],"dormant","94 d ago",3,{flag:"Dormant — granted 14 months ago, 3 questions asked"}),
  P("Lesedi Mofokeng","Data Steward — Membership","Membership & Care","Welkom",["stewards"],["steward"],"active","55 min ago",203),
  P("Johannes Swanepoel","Estates Officer","Estates","Gqeberha North",["southern-cluster"],["viewer"],"active","1 d ago",19),
  P("Farida Padayachee","Statistics Analyst","Statistics","Ballito",["national-stats"],["national"],"active","3 h ago",188),
  P("Siyabonga Nxumalo","Regional Coordinator — Southern","LDM Operations","East London",["southern-cluster","ldm-coordinators"],["regional"],"active","12 h ago",144),
  P("Helena Bosman","Travel Coordinator","Travel & Logistics","Parow",["travel-office"],["author"],"active","1 h ago",76),
  P("Elijah Mabena","Locality Secretary","Membership & Care","Harare",["northern-cluster"],["secretary"],"active","2 d ago",29),
  P("Gugu Pillay","Event Coordinator","Events","Pinetown",["event-ops"],["viewer"],"active","5 h ago",51),
  P("Adriaan de Villiers","Finance Analyst","Finance","Benoni",["finance-team"],["viewer"],"active","1 d ago",22),
  P("Zinhle Kunene","Care Coordinator","Membership & Care","Sandton",["safeguarding"],["safeguard"],"active","8 h ago",33),
  P("Ezra Haddad","Head of Software — GST","Statistics","Somerset West",["platform-admins","stewards"],["admin","steward"],"active","just now",97),
  P("Martinus Viljoen","Locality Secretary","Membership & Care","Durbanville",["southern-cluster"],["secretary"],"suspended","41 d ago",12,{flag:"Suspended — role change pending in Directory"}),
  P("Rethabile Sibanda","Statistics Analyst","Statistics","Harare",["northern-cluster"],["author"],"active","6 h ago",121),
  P("Kobus Prinsloo","Estates Manager","Estates","Bloemfontein Central",["southern-cluster"],["viewer"],"active","3 d ago",16),
  P("Londiwe Zwane","Regional Coordinator — Coastal","LDM Operations","Umhlanga",["southern-cluster","ldm-coordinators"],["regional"],"active","25 min ago",198),
  P("Bheki Ngcobo","Locality Secretary","Membership & Care","Windhoek",["northern-cluster"],["secretary"],"active","1 d ago",38),
  P("Rika Olivier","Records Officer","Membership & Care","Bellville",["records-office"],["steward"],"active","2 h ago",84)
];
const personByName = n => PEOPLE.find(p=>p.name===n||p.name.startsWith(n.replace(/\.$/,"")));
const PEOPLE_HIDDEN = ORG.users - PEOPLE.length;

/* ---------- helper: field factory ----------
   label, tech, type, desc, example, sens, mask, usage, complete, format, synonyms   */
function F(label,tech,type,desc,example,o){
  return Object.assign({label,tech,type,desc,example,sens:"Internal",mask:null,usage:"As is",complete:100,distinct:"—",format:"—",synonyms:[],glossary:null},o||{});
}

/* ---------- datasets ---------- */
/* cert: verified | draft | warning | deprecated
   sens: Public | Internal | Restricted | Personal                       */
const DATASETS = [
  {
    id:"meetings", name:"Meetings & attendance", tech:"Connect.UserLogEvents (check-in events)", sys:"connect",
    domain:"LDM Operations", sens:"Internal", cert:"verified", certBy:"Pavitra Govender", certOn:"14 Jun 2026",
    purpose:"Every meeting held, who was expected, and who checked in — the backbone of every attendance question.",
    grain:"One row per member per meeting occurrence.",
    rows:"18.4 M", rowTrend:[81,84,86,85,89,92,95,97,99,101,104,108],
    refreshed:"today 06:10", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:97, completeness:99, validity:98, freshness:100, uniqueness:92}, incidents:0,
    coverage:"Jan 2019 → yesterday · all 312 localities", exclusions:"Cancelled meetings excluded. Visitor check-ins are counted separately and are not in this table.",
    population:"Members with an active Directory record at the time of the meeting.",
    owner:"Pavitra Govender", steward:"Lesedi Mofokeng", sme:"Reneilwe Dlomo", channel:"#gst-data-ldm",
    popularity:98, rank:1, users:287, questions:["How many LDM meetings ran in my subdivisions last quarter?","Attendance rate by locality, this year vs last","Which localities missed two meetings in a row?"],
    joins:["members","localities","properties"], access:"Full — 12 of 312 localities", accessNote:"Row filter: locality in your assigned localities",
    rules:["r-locality-scope","r-small-count","r-minor-detail","r-attendance-def"],
    fields:[
      F("Meeting date","meeting_dt","date","Calendar date the meeting was held, in local time.","2026-08-23",{format:"DD MMM YYYY",synonyms:["date","when"],glossary:"Meeting"}),
      F("Meeting type","meeting_type","attribute","Regular, Special, Youth, Care or Cancelled.","Regular",{distinct:"5",synonyms:["type","kind"],usage:"Filter"}),
      F("Locality","locality_nm","attribute","The locality that hosted the meeting.","Bellville",{distinct:"312",usage:"Aggregated",glossary:"Locality"}),
      F("Subdivision","subdivision_nm","attribute","The specific congregation subdivision within the locality.","Lorraine",{distinct:"6",usage:"Aggregated"}),
      F("Member ID","member_id","attribute","Directory identifier for the expected attendee.","MBR-408812",{sens:"Personal",mask:"Hashed outside your locality",complete:100,usage:"As is"}),
      F("Member name","member_nm","attribute","Full name as recorded in Directory.","—",{sens:"Personal",mask:"Withheld outside your locality",complete:100}),
      F("Age band","age_band","attribute","Ten-year band. Under-18 rows are suppressed for most roles.","30–39",{sens:"Personal",mask:"Under-18 suppressed",distinct:"9"}),
      F("Checked in","checked_in","measure","1 when a confirmed check-in exists, 0 otherwise.","1",{format:"0",usage:"Aggregated"}),
      F("Expected","expected","measure","1 when the member was on the expected list.","1",{format:"0",usage:"Aggregated"}),
      F("Attendance rate","attendance_rate","measure","Checked in ÷ expected, over the selected grain. Governed definition v3.","94.2%",{format:"0.0%",usage:"Aggregated",glossary:"Attendance"}),
      F("Duration (min)","duration_min","measure","Scheduled length of the meeting.","75",{format:"0",complete:96})
    ]
  },
  {
    id:"members", name:"Member records", tech:"directory.dim_member", sys:"directory",
    domain:"Membership & Care", sens:"Personal", cert:"verified", certBy:"Sindi Mthembu", certOn:"02 Jul 2026",
    purpose:"The person record: who someone is, where they belong, and their current standing.",
    grain:"One row per member, current state. History lives in Membership movement.",
    rows:"241 k", rowTrend:[229,231,232,234,235,236,237,238,239,240,240,241],
    refreshed:"today 06:04", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:94, completeness:97, validity:95, freshness:100, uniqueness:100}, incidents:1,
    coverage:"Current members and members deceased within 24 months.", exclusions:"Pastoral notes are excluded from Spiff entirely and do not appear in the field list.",
    population:"Anyone with an active or recently-closed Directory record.",
    owner:"Sindi Mthembu", steward:"Rika Olivier", sme:"Cathleen Oberholzer", channel:"#gst-data-directory",
    popularity:95, rank:2, users:264, questions:["Member growth by locality this year","How many households in my locality have no listed contact?","Age profile of my subdivision"],
    joins:["families","localities","meetings"], access:"Partial — name and contact masked outside your locality", accessNote:"3 masking rules apply to you",
    rules:["r-locality-scope","r-contact-mask","r-minor-detail","r-minor-dob","r-deceased-tail","r-consent"],
    fields:[
      F("Member ID","member_id","attribute","Stable Directory identifier.","MBR-408812",{sens:"Personal",usage:"As is"}),
      F("Full name","full_nm","attribute","Preferred full name.","—",{sens:"Personal",mask:"Withheld outside your locality"}),
      F("Locality","locality_nm","attribute","Home locality.","Bellville",{distinct:"312",glossary:"Locality"}),
      F("Date of birth","dob","date","Recorded date of birth.","—",{sens:"Personal",mask:"Rounded to year; withheld under 18",complete:98}),
      F("Age band","age_band","attribute","Derived ten-year band.","40–49",{sens:"Personal",distinct:"9"}),
      F("Household ID","household_id","attribute","Links a member to their family unit.","FAM-11902",{usage:"As is"}),
      F("Member since","joined_dt","date","First recorded membership date.","12 Mar 2011",{format:"DD MMM YYYY"}),
      F("Record valid to","ValidTo","date","Open while this is the member's current record; the date it was superseded otherwise. Member is system-versioned, so history is queryable.","(current)",{usage:"Filter"}),
      F("Deceased date","deceased_dt","date","Recorded date of death. Drives the 24-month retention tail.","—",{sens:"Restricted",mask:"Records Office only",complete:2}),
      F("Email","email","attribute","Primary contact email.","—",{sens:"Personal",mask:"Hashed outside your locality",complete:88}),
      F("Mobile","mobile","attribute","Primary contact number.","—",{sens:"Personal",mask:"Hashed outside your locality",complete:91}),
      F("Contact consent","contact_consent","attribute","Whether the member has consented to be contacted.","true",{sens:"Restricted",usage:"Filter",complete:100}),
      F("Members","member_count","measure","Distinct member count. Suppressed below 5.","1",{format:"#,##0",usage:"Aggregated"})
    ]
  },
  {
    id:"localities", name:"Localities & subdivisions", tech:"directory.dim_locality", sys:"directory",
    domain:"LDM Operations", sens:"Internal", cert:"verified", certBy:"Reneilwe Dlomo", certOn:"28 May 2026",
    purpose:"The geography of the division — every locality, the country it sits in, its subdivisions and current standing.",
    grain:"One row per locality, current state.",
    rows:"312", rowTrend:[303,304,305,306,307,308,309,310,311,311,312,312],
    refreshed:"today 06:02", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:99, completeness:100, validity:99, freshness:100, uniqueness:100}, incidents:0,
    coverage:"All 312 localities across 8 countries.", exclusions:"Dissolved localities are retained with a closed date.",
    population:"Every locality recognised by the division.",
    owner:"Reneilwe Dlomo", steward:"Lesedi Mofokeng", sme:"Siyabonga Nxumalo", channel:"#gst-data-ldm",
    popularity:82, rank:5, users:176, questions:["Which localities are overdue for a review?","Localities per subdivision","Which localities have no secretary appointed?"],
    joins:["meetings","members","properties"], access:"Full", accessNote:"No masking applies to you",
    rules:["r-locality-scope"],
    fields:[
      F("Locality","locality_nm","attribute","Locality name.","Bellville",{distinct:"312",glossary:"Locality"}),
      F("Locality code","locality_cd","attribute","Short code used across systems.","SBH-BEL",{distinct:"312"}),
      F("Subdivision","subdivision_nm","attribute","Congregation subdivision within the locality.","Lorraine",{distinct:"6"}),
      F("Country","country_nm","attribute","The country this locality sits in. Scope widens to country, never to an Orbit travel area.","South Africa",{distinct:"8",usage:"Filter",glossary:"Country"}),
      F("Secretary","secretary_nm","attribute","Appointed locality secretary.","Dawid Kruger",{sens:"Personal",complete:94}),
      F("Members","member_count","measure","Members currently attached to the locality.","482",{format:"#,##0",usage:"Aggregated"}),
      F("Last review","last_review_dt","date","Date of the most recent locality review.","04 Feb 2026",{format:"DD MMM YYYY",complete:97}),
      F("Review overdue","review_overdue","measure","1 when the last review is more than 12 months old.","0",{format:"0",usage:"Filter"}),
      F("Opened","opened_dt","date","Date the locality was recognised.","01 Jan 1998",{format:"DD MMM YYYY"}),
      F("Closed","closed_dt","date","Date the locality was dissolved, if any.","—",{complete:3})
    ]
  },
  {
    id:"families", name:"Family units", tech:"directory.dim_household", sys:"directory",
    domain:"Membership & Care", sens:"Personal", cert:"verified", certBy:"Sindi Mthembu", certOn:"02 Jul 2026",
    purpose:"Household groupings — used for travel, correspondence and pastoral planning.",
    grain:"One row per household, current state.",
    rows:"58 k", rowTrend:[55,55,56,56,56,57,57,57,58,58,58,58],
    refreshed:"today 06:05", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:92, completeness:94, validity:96, freshness:100, uniqueness:100}, incidents:0,
    coverage:"All current households.", exclusions:"Households with no active member are excluded after 12 months.",
    population:"Households with at least one active member.",
    owner:"Sindi Mthembu", steward:"Rika Olivier", sme:"Zinhle Kunene", channel:"#gst-data-directory",
    popularity:64, rank:9, users:88, questions:["Orbit bookings by family — flights, cars, hotels","Average household size by locality","Households with members in more than one locality"],
    joins:["members","travel"], access:"Partial — address masked outside your locality", accessNote:"2 masking rules apply to you",
    rules:["r-locality-scope","r-contact-mask","r-small-count"],
    fields:[
      F("Household ID","household_id","attribute","Stable identifier.","FAM-11902"),
      F("Family name","family_nm","attribute","Household name.","—",{sens:"Personal",mask:"Withheld outside your locality"}),
      F("Locality","locality_nm","attribute","Home locality.","Bellville",{distinct:"312"}),
      F("Address","address_line","attribute","Postal address.","—",{sens:"Personal",mask:"Withheld outside your locality",complete:96}),
      F("Household size","member_count","measure","Members in the household.","5",{format:"0",usage:"Aggregated"}),
      F("Children under 18","minor_count","measure","Count of members under 18. Suppressed below 5 in any breakdown.","—",{sens:"Personal",mask:"Suppressed below 5",format:"0"}),
      F("Households","household_count","measure","Distinct households.","1",{format:"#,##0",usage:"Aggregated"})
    ]
  },
  {
    id:"travel", name:"Travel bookings", tech:"orbit.fct_booking", sys:"orbit",
    domain:"Travel & Logistics", sens:"Restricted", cert:"warning", certBy:"Colette Marais", certOn:"11 Aug 2026",
    warning:"Supplier feed has been late three times this month. Counts after 20 Aug may be incomplete.",
    purpose:"Every flight, car and hotel booked through Orbit, with cost and traveller linkage.",
    grain:"One row per booking line (a leg, a night, or a rental day).",
    rows:"1.2 M", rowTrend:[88,91,94,90,97,101,99,104,108,111,109,96],
    refreshed:"today 04:40", next:"today 16:40", sla:"Every 12 h", freshness:"late",
    quality:{score:78, completeness:83, validity:90, freshness:52, uniqueness:99}, incidents:2,
    coverage:"Apr 2021 → yesterday.", exclusions:"Personal bookings made outside Orbit are not captured. Document numbers are never loaded.",
    population:"Bookings made through the Orbit travel desk.",
    owner:"Colette Marais", steward:"Helena Bosman", sme:"Colette Marais", channel:"#gst-data-travel",
    popularity:71, rank:7, users:104, questions:["Orbit bookings by family — flights, cars, hotels","Travel spend by locality this quarter","Which trips have no return leg booked?"],
    joins:["families","members","events"], access:"Your view — ±30 days of travel only", accessNote:"Time-window rule applies to you",
    rules:["r-travel-window","r-travel-docs","r-locality-scope"],
    fields:[
      F("Booking ref","booking_ref","attribute","Orbit booking reference.","ORB-88C412"),
      F("Booking type","booking_type","attribute","Flight, Car, Hotel or Rail.","Flight",{distinct:"4",usage:"Filter"}),
      F("Travel date","travel_dt","date","Departure or check-in date.","12 Sep 2026",{format:"DD MMM YYYY",usage:"Filter"}),
      F("Traveller","traveller_nm","attribute","Named traveller.","—",{sens:"Personal",mask:"Withheld outside travel window"}),
      F("Household ID","household_id","attribute","Family the traveller belongs to.","FAM-11902"),
      F("Origin","origin_cd","attribute","Departure airport or city.","CPT",{distinct:"64"}),
      F("Destination","destination_cd","attribute","Arrival airport or city.","JNB",{distinct:"71"}),
      F("Supplier","supplier_nm","attribute","Airline, hotel chain or rental company.","Airlink",{distinct:"48"}),
      F("Document number","document_no","attribute","Passport or ID number.","[not loaded]",{sens:"Restricted",mask:"Never loaded into Spiff",complete:0}),
      F("Cost","cost_nzd","measure","Booking cost in New Zealand dollars.","NZ$ 428",{format:"NZ$ #,##0",usage:"Aggregated"}),
      F("Bookings","booking_count","measure","Distinct booking lines.","1",{format:"#,##0",usage:"Aggregated"}),
      F("Nights","nights","measure","Hotel nights, where applicable.","3",{format:"0",complete:41})
    ]
  },
  {
    id:"itineraries", name:"Itineraries & journeys", tech:"orbit.fct_itinerary", sys:"orbit",
    domain:"Travel & Logistics", sens:"Restricted", cert:"draft",
    purpose:"Bookings stitched into end-to-end journeys, so a trip reads as one story rather than five rows.",
    grain:"One row per traveller per journey.",
    rows:"186 k", rowTrend:[14,15,15,16,16,17,17,18,18,18,19,19],
    refreshed:"today 04:44", next:"today 16:44", sla:"Every 12 h", freshness:"late",
    quality:{score:74, completeness:79, validity:88, freshness:52, uniqueness:97}, incidents:1,
    coverage:"Apr 2021 → yesterday.", exclusions:"Journeys with a single leg and no accommodation are not stitched.",
    population:"Travellers with two or more linked bookings.",
    owner:"Colette Marais", steward:"Helena Bosman", sme:"Helena Bosman", channel:"#gst-data-travel",
    popularity:38, rank:12, users:29, questions:["Trace a member's planned activities next month","Journeys with an overnight gap","Average journey length by locality"],
    joins:["travel","events","members"], access:"Your view — ±30 days of travel only", accessNote:"Draft dataset — definitions may change",
    rules:["r-travel-window","r-locality-scope"],
    fields:[
      F("Journey ID","journey_id","attribute","Stitched journey identifier.","JNY-4471"),
      F("Traveller","traveller_nm","attribute","Named traveller.","—",{sens:"Personal",mask:"Withheld outside travel window"}),
      F("Start date","start_dt","date","First departure.","12 Sep 2026",{format:"DD MMM YYYY"}),
      F("End date","end_dt","date","Last arrival.","18 Sep 2026",{format:"DD MMM YYYY"}),
      F("Purpose","purpose_cd","attribute","Event, Care, Operations or Personal.","Event",{distinct:"4",usage:"Filter"}),
      F("Legs","leg_count","measure","Number of booking lines in the journey.","6",{format:"0",usage:"Aggregated"}),
      F("Total cost","cost_nzd","measure","Sum of booking costs.","NZ$ 1,864",{format:"NZ$ #,##0",usage:"Aggregated"})
    ]
  },
  {
    id:"events", name:"Events & programmes", tech:"assemble.dim_event", sys:"assemble",
    domain:"Events", sens:"Internal", cert:"verified", certBy:"Warrick Meintjes", certOn:"19 Jul 2026",
    purpose:"Every organised event — what it was, where, when, and how big.",
    grain:"One row per event occurrence.",
    rows:"9.7 k", rowTrend:[7.9,8.1,8.3,8.5,8.7,8.9,9.0,9.2,9.4,9.5,9.6,9.7],
    refreshed:"today 06:12", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:96, completeness:98, validity:97, freshness:100, uniqueness:100}, incidents:0,
    coverage:"Jan 2020 → 12 months forward (planned events included).", exclusions:"Draft events not yet approved are excluded.",
    population:"Approved events in Assemble.",
    owner:"Warrick Meintjes", steward:"Amira Rasool", sme:"Gugu Pillay", channel:"#gst-data-events",
    popularity:77, rank:6, users:131, questions:["Show meeting counts per province","Events by month, planned vs held","Which events have registrations below capacity?"],
    joins:["registrations","properties","localities"], access:"Full", accessNote:"No masking applies to you",
    rules:["r-locality-scope"],
    fields:[
      F("Event name","event_nm","attribute","Event title.","Regional Youth Gathering",{distinct:"2 140"}),
      F("Event type","event_type","attribute","Conference, Youth, Care, Training or Service.","Youth",{distinct:"5",usage:"Filter"}),
      F("Start date","start_dt","date","First day of the event.","03 Oct 2026",{format:"DD MMM YYYY"}),
      F("Locality","locality_nm","attribute","Locality hosting the event.","Bellville",{distinct:"312",usage:"Filter",glossary:"Locality"}),
      F("Venue","venue_nm","attribute","Property or external venue.","Bellville Hall",{distinct:"418"}),
      F("Capacity","capacity","measure","Maximum registrations.","450",{format:"#,##0"}),
      F("Registered","registered","measure","Confirmed registrations.","386",{format:"#,##0",usage:"Aggregated"}),
      F("Fill rate","fill_rate","measure","Registered ÷ capacity.","85.8%",{format:"0.0%",usage:"Aggregated"}),
      F("Events","event_count","measure","Distinct events.","1",{format:"#,##0",usage:"Aggregated"})
    ]
  },
  {
    id:"registrations", name:"Event registrations", tech:"assemble.fct_registration", sys:"assemble",
    domain:"Events", sens:"Personal", cert:"verified", certBy:"Amira Rasool", certOn:"19 Jul 2026",
    purpose:"Who registered for what, and whether they turned up.",
    grain:"One row per person per event registration.",
    rows:"2.1 M", rowTrend:[17,18,18,19,19,20,20,20,21,21,21,21],
    refreshed:"today 06:14", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:91, completeness:93, validity:96, freshness:100, uniqueness:98}, incidents:0,
    coverage:"Jan 2020 → 13 months back from today (retention rule).", exclusions:"Registrations are purged 13 months after event close.",
    population:"Registered attendees, including guests.",
    owner:"Amira Rasool", steward:"Gugu Pillay", sme:"Warrick Meintjes", channel:"#gst-data-events",
    popularity:69, rank:8, users:97, questions:["No-show rate by event type","Registrations by locality for the October gathering","Which registrations have unmet accessibility needs?"],
    joins:["events","members","families"], access:"Partial — wellbeing notes withheld", accessNote:"2 rules apply to you",
    rules:["r-wellbeing","r-retention-reg","r-small-count","r-locality-scope"],
    fields:[
      F("Registration ID","registration_id","attribute","Assemble registration identifier.","REG-771204"),
      F("Event name","event_nm","attribute","Event registered for.","Regional Youth Gathering",{distinct:"2 140"}),
      F("Member ID","member_id","attribute","Directory identifier, where the registrant is a member.","MBR-408812",{sens:"Personal",mask:"Hashed outside your locality",complete:92}),
      F("Registered on","registered_dt","date","Date the registration was made.","14 Aug 2026",{format:"DD MMM YYYY"}),
      F("Attended","attended","measure","1 when a check-in exists.","1",{format:"0",usage:"Aggregated"}),
      F("Dietary note","dietary_note","attribute","Free-text dietary requirement.","[withheld]",{sens:"Restricted",mask:"Withheld — wellbeing rule",complete:34}),
      F("Accessibility note","access_note","attribute","Free-text accessibility requirement.","[withheld]",{sens:"Restricted",mask:"Withheld — wellbeing rule",complete:11}),
      F("Registrations","registration_count","measure","Distinct registrations.","1",{format:"#,##0",usage:"Aggregated"}),
      F("No-show rate","no_show_rate","measure","1 − attended ÷ registered.","6.4%",{format:"0.0%",usage:"Aggregated"})
    ]
  },
  {
    id:"growth", name:"Membership movement", tech:"Directory.Member_History", sys:"directory",
    domain:"Statistics", sens:"Internal", cert:"warning", certBy:"Rupert Mackenzie", certOn:"01 Aug 2026",
    warning:"Derived, not recorded. Member is a system-versioned table, so every change is kept — but the systems record a member's state, never the reason it changed. Joins, transfers and lapses below are inferred from version-to-version differences. Read the derivation before you quote these.",
    purpose:"Movement between periods, computed from the member history table rather than a warehouse — there is no warehouse.",
    grain:"One row per locality per month, computed from member versions.",
    rows:"41 k", rowTrend:[38,38,39,39,39,40,40,40,41,41,41,41],
    refreshed:"today 02:20", next:"tomorrow 02:00", sla:"Daily by 03:00", freshness:"on-time",
    quality:{score:99, completeness:100, validity:99, freshness:100, uniqueness:100}, incidents:0,
    coverage:"From the start of system versioning → last complete month.", exclusions:"The current, incomplete month is excluded by design. Anything before Member became system-versioned cannot be reconstructed and is absent rather than zero.",
    population:"All localities, including those with zero movement.",
    owner:"Rupert Mackenzie", steward:"Pavitra Govender", sme:"Farida Padayachee", channel:"#gst-data-stats",
    popularity:88, rank:3, users:203, questions:["Member growth by locality this year","Net movement by subdivision, 3-year trend","Which localities shrank two years running?"],
    joins:["localities","members"], access:"Full — aggregate only", accessNote:"Detail rows are not available in this dataset by design",
    rules:["r-small-count","r-round-base5","r-point-in-time"],
    fields:[
      F("Month","period_month","date","Reporting month. Derived from the ValidFrom / ValidTo period on each member version.","Jul 2026",{format:"MMM YYYY",usage:"Filter",derived:true}),
      F("Locality","LocalityId","attribute","Locality the member belonged to in that version.","Bellville",{distinct:"312",glossary:"Locality"}),
      F("Valid from","ValidFrom","date","Start of the member version. Written by SQL Server, not by an application.","01 Jul 2026 00:00",{format:"DD MMM YYYY HH:mm"}),
      F("Valid to","ValidTo","date","End of the member version. The open version ends 9999-12-31.","31 Dec 9999",{format:"DD MMM YYYY"}),
      F("Joins","joins","measure","A member id appearing for the first time in the period. Inferred.","12",{format:"#,##0",usage:"Aggregated",derived:true}),
      F("Transfers in","transfers_in","measure","LocalityId changed to this locality between versions. Inferred — the systems do not record a transfer as an event.","4",{format:"#,##0",usage:"Aggregated",derived:true}),
      F("Transfers out","transfers_out","measure","LocalityId changed away from this locality. Inferred, same caveat.","3",{format:"#,##0",usage:"Aggregated",derived:true}),
      F("Lapses","lapses","measure","Hidden set true without a DeceasedDate. Inferred, and the weakest of these — Hidden is used for more than lapsing.","1",{format:"#,##0",usage:"Aggregated",derived:true}),
      F("Deaths","deaths","measure","DeceasedDate set in the period. The only movement recorded directly.","0",{format:"#,##0",usage:"Aggregated"}),
      F("Net movement","net_movement","measure","Joins + transfers in − transfers out − lapses − deaths.","+12",{format:"+#,##0;−#,##0",usage:"Aggregated",glossary:"Net movement",derived:true}),
      F("Closing members","closing_members","measure","Members whose version is open at period end. Point-in-time, and exact — this one the temporal table answers directly.","482",{format:"#,##0",usage:"Aggregated"})
    ]
  },
  {
    id:"appointments", name:"Service appointments", tech:"directory.fct_appointment", sys:"directory",
    domain:"LDM Operations", sens:"Internal", cert:"verified", certBy:"Reneilwe Dlomo", certOn:"28 May 2026",
    purpose:"Who currently holds which service role, where, and since when.",
    grain:"One row per person per appointment period.",
    rows:"74 k", rowTrend:[70,70,71,71,72,72,72,73,73,74,74,74],
    refreshed:"today 06:06", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:95, completeness:96, validity:98, freshness:100, uniqueness:99}, incidents:0,
    coverage:"Jan 2010 → today.", exclusions:"Informal helpers without a recorded appointment are not included.",
    population:"Recorded appointments only.",
    owner:"Reneilwe Dlomo", steward:"Lesedi Mofokeng", sme:"Siyabonga Nxumalo", channel:"#gst-data-ldm",
    popularity:58, rank:10, users:74, questions:["Which localities have no secretary appointed?","Appointments ending in the next 90 days","Average tenure by role"],
    joins:["members","localities"], access:"Full", accessNote:"No masking applies to you",
    rules:["r-locality-scope"],
    fields:[
      F("Role","role_nm","attribute","Appointment title.","Locality Secretary",{distinct:"22",usage:"Filter"}),
      F("Member ID","member_id","attribute","Appointee.","MBR-408812",{sens:"Personal",mask:"Hashed outside your locality"}),
      F("Locality","locality_nm","attribute","Where the appointment applies.","Bellville",{distinct:"312"}),
      F("From","from_dt","date","Appointment start.","01 Feb 2024",{format:"DD MMM YYYY"}),
      F("To","to_dt","date","Appointment end, if set.","—",{complete:38}),
      F("Tenure (months)","tenure_months","measure","Months served.","30",{format:"0",usage:"Aggregated"}),
      F("Appointments","appointment_count","measure","Distinct appointments.","1",{format:"#,##0",usage:"Aggregated"})
    ]
  },
  {
    id:"properties", name:"Sites & places", tech:"Connect.Sites + Connect.PointsOfInterest", sys:"connect",
    domain:"LDM Operations", sens:"Internal", cert:"draft",
    purpose:"Named sites and points of interest with their contact details and location. This is what Connect actually holds — there is no rooms-and-capacity system.",
    grain:"One row per site or point of interest.",
    rows:"1 840", rowTrend:[1.79,1.79,1.80,1.80,1.81,1.81,1.82,1.82,1.83,1.83,1.84,1.84],
    refreshed:"today 05:50", next:"tomorrow 05:45", sla:"Daily by 06:30", freshness:"on-time",
    quality:{score:89, completeness:91, validity:94, freshness:100, uniqueness:100}, incidents:0,
    coverage:"All active sites and points of interest.", exclusions:"Inactive rows are retained. Capacity, condition and utilisation are not held anywhere — questions about them cannot be answered, and Spiff says so rather than estimating.",
    population:"Sites and points of interest across the division.",
    owner:"Reneilwe Dlomo", steward:"Johannes Swanepoel", sme:"Reneilwe Dlomo", channel:"#gst-data-connect",
    popularity:44, rank:11, users:52, questions:["Sites in my localities with no phone number","Points of interest added this year","Which localities have no registered site?"],
    joins:["localities"], access:"Full", accessNote:"No masking applies to you",
    rules:[],
    fields:[
      F("Name","Name","attribute","Site or point-of-interest name.","Bellville Hall",{distinct:"1 840"}),
      F("Description","Description","attribute","Free text describing the place.","Main meeting hall",{complete:71}),
      F("Locality","LocalityId","attribute","Locality the place sits in. Present on PointsOfInterest; Sites reach it through their parent.","Bellville",{distinct:"312",glossary:"Locality"}),
      F("Suburb","Suburb","attribute","Free-text suburb. The one place in the estate that uses the word — everywhere else the unit is Locality, and the two are not the same thing.","Boston",{complete:44,usage:"Filter"}),
      F("Postcode","Postcode","attribute","Postal code.","7530",{complete:63}),
      F("Phone","PhoneNumber","attribute","Contact number for the site.","021 000 0000",{complete:58}),
      F("Email","Email","attribute","Contact address for the site.","—",{complete:41}),
      F("Latitude","Latitude","measure","Decimal latitude.","-33.8903",{format:"0.0000"}),
      F("Longitude","Longtitude","measure","Decimal longitude. The column is misspelled in the source and Spiff does not silently correct it.","18.6292",{format:"0.0000"}),
      F("Active","Active","attribute","False means retired, not deleted.","true",{distinct:"2",usage:"Filter"})
    ]
  },
  {
    id:"comms", name:"Notices & delivery", tech:"Connect.MessageDeliveries + Connect.ConnectMessages", sys:"connect",
    domain:"Membership & Care", sens:"Internal", cert:"draft",
    purpose:"What was sent, to whom, through which channel, and whether it landed.",
    grain:"One row per notice per recipient.",
    rows:"6.8 M", rowTrend:[5.9,6.0,6.1,6.2,6.3,6.4,6.5,6.6,6.6,6.7,6.8,6.8],
    refreshed:"today 03:10", next:"tomorrow 03:00", sla:"Daily by 04:00", freshness:"on-time",
    quality:{score:81, completeness:85, validity:92, freshness:100, uniqueness:96}, incidents:1,
    coverage:"Jan 2023 → yesterday.", exclusions:"ConnectMessages.Body is excluded at the connection and never loaded — delivery metadata only. The exclusion fails closed: a query naming Body errors rather than returning nothing.",
    population:"Notices sent through approved channels.",
    owner:"Sindi Mthembu", steward:"Rika Olivier", sme:"Nokuthula Dladla", channel:"#gst-data-connect",
    popularity:31, rank:13, users:38, questions:["Delivery failure rate by channel","Which localities have the most bounced emails?","Notices sent last month by type"],
    joins:["members","localities"], access:"Partial — recipient identity hashed", accessNote:"Consent rule applies to you",
    rules:["r-consent","r-contact-mask","r-locality-scope"],
    fields:[
      F("Topic","Topic","attribute","Subject line of the notice.","Weekly notices",{usage:"Filter"}),
      F("Message type","MessageType","attribute","The type recorded on the message.","Notice",{usage:"Filter"}),
      F("Channels","Channels","attribute","Channels the message was addressed to. Stored as one delimited string, not a normalised list — counting by channel means parsing it.","Email;App",{usage:"Filter",derived:true}),
      F("Sent","SendTime","date","When the message was sent.","28 Aug 2026 07:02",{format:"DD MMM YYYY HH:mm"}),
      F("Recipient","UserId","attribute","Connect user the delivery row belongs to.","—",{sens:"Personal",mask:"Hashed for all viewers"}),
      F("Status","Status","attribute","Delivery status as the channel reported it.","Delivered",{usage:"Filter"}),
      F("Last updated","LastUpdated","date","When the delivery row last changed.","28 Aug 2026 07:04",{format:"DD MMM YYYY HH:mm"}),
      F("Delivery rate","delivery_rate","measure","Deliveries with a delivered status ÷ deliveries created.","96.1%",{format:"0.0%",usage:"Aggregated",derived:true})
    ]
  },
  {
    id:"budgets", name:"Cost centres & budgets", tech:"—", sys:"none",
    domain:"Finance", sens:"Restricted", cert:"blocked",
    warning:"No finance system is registered. This dataset is described so people know the gap exists and can ask for it to be filled — nothing is connected, and every question that needs it returns the gap rather than an estimate.",
    purpose:"Budget and actuals by cost centre. Listed as an absence, not a capability.",
    grain:"Would be one row per cost centre per month.",
    rows:"28 k", rowTrend:[26,26,26,27,27,27,27,28,28,28,28,28],
    refreshed:"today 02:40", next:"tomorrow 02:30", sla:"Daily by 04:00", freshness:"on-time",
    quality:{score:97, completeness:99, validity:98, freshness:100, uniqueness:100}, incidents:0,
    coverage:"None. Nothing is loaded.", exclusions:"Individual contributions are not in Spiff and never will be, whatever gets connected.",
    population:"None.",
    owner:"Brendan Jooste", steward:"—", sme:"Brendan Jooste", channel:"#gst-data-finance",
    popularity:52, rank:14, users:41, questions:["Travel spend against budget by locality","Cost centres over 90% consumed","Month-on-month variance"],
    joins:["travel","events"], access:"Not loaded — no system registered", accessNote:"Nobody can query this, including Platform Admins",
    rules:["r-finance-restrict"],
    fields:[
      F("Cost centre","cost_centre_cd","attribute","Finance cost centre code.","GST-TRV-01",{distinct:"186"}),
      F("Cost centre name","cost_centre_nm","attribute","Human name.","Travel — Southern",{distinct:"186"}),
      F("Month","period_month","date","Reporting month.","Aug 2026",{format:"MMM YYYY",usage:"Filter"}),
      F("Budget","budget_nzd","measure","Approved budget.","NZ$ 42,000",{format:"NZ$ #,##0",usage:"Aggregated"}),
      F("Actual","actual_nzd","measure","Recorded spend.","NZ$ 38,841",{format:"NZ$ #,##0",usage:"Aggregated"}),
      F("Variance","variance_nzd","measure","Budget − actual.","NZ$ 3,159",{format:"NZ$ #,##0",usage:"Aggregated"}),
      F("Consumed","consumed_pct","measure","Actual ÷ budget.","92.5%",{format:"0.0%",usage:"Aggregated"})
    ]
  },
  {
    id:"checkins", name:"User events (legacy)", tech:"Connect.OldUserEvents", sys:"connect",
    domain:"LDM Operations", sens:"Internal", cert:"deprecated",
    warning:"Superseded by the user activity log. The table is still present and still readable, which is exactly why it is listed — an unlisted legacy table is the one people quote by accident.",
    purpose:"The previous generation of user event rows, kept for continuity.",
    grain:"One row per recorded event.",
    rows:"31 M", rowTrend:[29,29,30,30,30,30,31,31,31,31,31,31],
    refreshed:"14 Jun 2026", next:"—", sla:"Retired", freshness:"stale",
    quality:{score:62, completeness:74, validity:70, freshness:0, uniqueness:41}, incidents:3,
    coverage:"Frozen. No new rows are written.", exclusions:"Nothing is excluded — the table is read as it stands, which is part of why it is deprecated.",
    population:"All legacy event rows, including test devices.",
    owner:"Pavitra Govender", steward:"Lesedi Mofokeng", sme:"Reneilwe Dlomo", channel:"#gst-data-connect",
    popularity:9, rank:16, users:6, questions:[], joins:["activity"], access:"Read-only — deprecated", accessNote:"Use the user activity log instead",
    rules:["r-locality-scope"],
    fields:[
      F("Event ID","Id","attribute","Row identifier.","99201884"),
      F("Recorded","Timestamp","date","When the event was recorded server-side.","23 Aug 2026 09:41",{format:"DD MMM YYYY HH:mm"}),
      F("User","UserName","attribute","The account the event belongs to.","—",{sens:"Personal",mask:"Hashed outside your locality"}),
      F("Event info","EventInfo","attribute","Free-text payload. Unstructured, and the reason this table is hard to trust.","meeting.open",{complete:82})
    ]
  },
  {
    id:"care", name:"Pastoral care notes", tech:"—", sys:"directory",
    domain:"Membership & Care", sens:"Personal", cert:"blocked",
    warning:"Excluded from Spiff by policy. Listed here so people stop looking for it.",
    purpose:"Pastoral and care notes. Not queryable, not maskable, not exportable — the fields are not loaded at all.",
    grain:"—", rows:"—", rowTrend:[],
    refreshed:"—", next:"—", sla:"—", freshness:"n/a",
    quality:{score:0, completeness:0, validity:0, freshness:0, uniqueness:0}, incidents:0,
    coverage:"—", exclusions:"Everything. No field of this dataset is available to any Spiff user, including Platform Admins.",
    population:"—",
    owner:"Cathleen Oberholzer", steward:"Zinhle Kunene", sme:"Cathleen Oberholzer", channel:"#gst-safeguarding",
    popularity:0, rank:17, users:0, questions:[], joins:[], access:"Blocked by policy", accessNote:"Rule r-pastoral-block — not overridable, not requestable",
    rules:["r-pastoral-block"],
    fields:[]
  },
  {
    id:"activity", name:"User activity log", tech:"Connect.UserLogEvents", sys:"connect",
    domain:"LDM Operations", sens:"Personal", cert:"verified", certBy:"Marcus Vilakazi", certOn:"22 Aug 2026",
    purpose:"What people did in Connect, event by event. The attendance functions the division already relies on are built on this table, not on Assemble.",
    grain:"One row per recorded event.",
    rows:"94 M", rowTrend:[81,83,84,86,87,89,90,91,92,93,94,94],
    refreshed:"today 06:40", next:"continuous", sla:"Near real-time", freshness:"on-time",
    quality:{score:86, completeness:88, validity:91, freshness:100, uniqueness:97}, incidents:0,
    coverage:"Rolling 24 months.", exclusions:"DeviceInfo is loaded but masked for everyone — it fingerprints a person's handset and no reporting question needs it.",
    population:"Every Connect user event.",
    owner:"Marcus Vilakazi", steward:"Lesedi Mofokeng", sme:"Reneilwe Dlomo", channel:"#gst-data-connect",
    popularity:64, rank:6, users:88,
    questions:["Members with no recorded activity in 90 days","Attendance signals by locality last quarter","Which event categories are most used?"],
    joins:["members","localities"], access:"Partial — identity hashed outside your localities", accessNote:"Row filter and contact masking both apply to you",
    rules:["r-locality-scope","r-contact-mask","r-small-count"],
    fields:[
      F("Event ID","Id","attribute","Row identifier.","41902884"),
      F("Correlation","CorrelationId","attribute","Groups events from one session or action.","a7f3…",{usage:"As is"}),
      F("Category","EventCategory","attribute","The kind of event recorded.","Attendance",{usage:"Filter"}),
      F("User","UserName","attribute","The account the event belongs to.","—",{sens:"Personal",mask:"Hashed outside your localities"}),
      F("Device","DeviceInfo","attribute","Handset and app details. Masked for everyone — it identifies a person's device.","[withheld]",{sens:"Personal",mask:"Withheld from all viewers"}),
      F("Event info","EventInfo","attribute","Free-text payload describing the event.","meeting.checkin",{complete:88}),
      F("Recorded (device)","mobileTimestamp","date","Timestamp from the handset. Camel-cased in the source where every neighbouring column is Pascal-cased, and it can run ahead of the server clock.","23 Aug 2026 09:41",{format:"DD MMM YYYY HH:mm",complete:74}),
      F("Recorded (server)","Timestamp","date","Server-side timestamp. Use this one for any period boundary.","23 Aug 2026 09:41",{format:"DD MMM YYYY HH:mm"})
    ]
  },
  {
    id:"access", name:"Access & role domains", tech:"Connect.RoleDomains + Connect.UserRolesDomains", sys:"connect",
    domain:"Statistics", sens:"Internal", cert:"verified", certBy:"Marcus Vilakazi", certOn:"28 Aug 2026",
    purpose:"Who holds which role, at which tier, over which country or locality. This is the table every access screen in Spiff describes, and it is queryable like anything else.",
    grain:"One row per user per role per domain.",
    rows:"3 140", rowTrend:[2.9,2.9,3.0,3.0,3.0,3.1,3.1,3.1,3.1,3.1,3.1,3.14],
    refreshed:"today 05:20", next:"tomorrow 05:00", sla:"Daily by 06:00", freshness:"on-time",
    quality:{score:98, completeness:100, validity:99, freshness:100, uniqueness:100}, incidents:0,
    coverage:"Every active user across the region.", exclusions:"Nothing. Access is not secret from the people it governs.",
    population:"All 428 users.",
    owner:"Marcus Vilakazi", steward:"Sindi Mthembu", sme:"Marcus Vilakazi", channel:"#gst-data-connect",
    popularity:57, rank:8, users:74,
    questions:["Who can see member detail in Bellville?","How many people hold a Country-tier domain?","Which grants have no end date?"],
    joins:["members","localities"], access:"Full — every locality", accessNote:"Deliberately unscoped. You can see who holds access anywhere, but not the data their access reaches.",
    rules:[],
    fields:[
      F("User","UserId","attribute","The Connect user the grant belongs to.","thato.sekhoto",{sens:"Personal"}),
      F("Role","RoleId","attribute","The bundle granted.","Locality Secretary",{distinct:"8",usage:"Filter",glossary:"Locality"}),
      F("Tier","RoleDomainType","attribute","Regional, Country, Locality or Global. Stored as an integer discriminator, 0 to 3.","Locality",{distinct:"4",usage:"Filter"}),
      F("Country","CountryCode","attribute","Set when the tier is Country. Null otherwise.","ZA",{distinct:"8",complete:34,glossary:"Country"}),
      F("Locality","LocalityId","attribute","Set when the tier is Locality. Null otherwise.","Bellville",{distinct:"312",complete:61,glossary:"Locality"}),
      F("Region","RegionId","attribute","Set when the tier is Regional. Null otherwise.","South Africa",{distinct:"9",complete:11,glossary:"Region"})
    ]
  },
  {
    id:"businesses", name:"Community businesses", tech:"CommunityBusiness.CommunityBusinesses", sys:"connect",
    domain:"Membership & Care", sens:"Internal", cert:"draft",
    purpose:"The register of community businesses, what they do, where they are and who administers them.",
    grain:"One row per business.",
    rows:"4 210", rowTrend:[3.9,3.9,4.0,4.0,4.0,4.1,4.1,4.1,4.2,4.2,4.2,4.21],
    refreshed:"today 04:30", next:"tomorrow 04:00", sla:"Daily by 05:00", freshness:"on-time",
    quality:{score:74, completeness:69, validity:88, freshness:100, uniqueness:99}, incidents:0,
    coverage:"All published businesses.", exclusions:"Unpublished rows are held back — isPublished is a deliberate editorial state, not a soft delete.",
    population:"Community businesses across the region.",
    owner:"Warrick Meintjes", steward:"Gugu Pillay", sme:"Warrick Meintjes", channel:"#gst-data-connect",
    popularity:29, rank:14, users:31,
    questions:["Businesses by type in my localities","Which localities have no registered business?","Businesses with no opening hours recorded"],
    joins:["localities"], access:"Full", accessNote:"No masking applies to you",
    rules:["r-locality-scope"],
    fields:[
      F("Business","Name","attribute","Trading name.","Bellville Joinery",{distinct:"4 210"}),
      F("Locality","LocalityID","attribute","Locality the business is registered in. Note the capitalised ID — the neighbouring tables use Id.","Bellville",{distinct:"312",glossary:"Locality"}),
      F("Country","CountryCode","attribute","Two-letter country code.","ZA",{distinct:"8",glossary:"Country"}),
      F("Type","Type","attribute","Business type, held as an integer pointing at CommunityBusinessTypes.","Trades",{distinct:"22",usage:"Filter"}),
      F("Website","Website","attribute","Public web address.","—",{complete:52}),
      F("Email","EmailAddress","attribute","Public contact address.","—",{complete:66}),
      F("Phone","PhoneNumber","attribute","Public contact number.","021 000 0000",{complete:81}),
      F("Published","isPublished","attribute","Whether the entry is visible in the directory. Lower-cased where its neighbours are not.","true",{distinct:"2",usage:"Filter"})
    ]
  },
  {
    id:"polls", name:"Polls & responses", tech:"Connect.ConnectPolls + Connect.ConnectPollOptions", sys:"connect",
    domain:"LDM Operations", sens:"Internal", cert:"draft",
    purpose:"Polls put to the division through Connect, their options and how people answered.",
    grain:"One row per poll option.",
    rows:"18 k", rowTrend:[15,15,16,16,16,17,17,17,18,18,18,18],
    refreshed:"today 06:00", next:"tomorrow 06:00", sla:"Daily by 07:00", freshness:"on-time",
    quality:{score:83, completeness:87, validity:94, freshness:100, uniqueness:99}, incidents:0,
    coverage:"All polls since Connect messaging launched.", exclusions:"Individual votes are not exposed — only counts per option. A poll with fewer than five responses returns no breakdown at all.",
    population:"Polls attached to Connect messages.",
    owner:"Reneilwe Dlomo", steward:"Gugu Pillay", sme:"Reneilwe Dlomo", channel:"#gst-data-connect",
    popularity:22, rank:15, users:26,
    questions:["Response rate on polls in my localities","Which polls closed with under five responses?","Polls open longer than 30 days"],
    joins:["comms","localities"], access:"Full — counts only", accessNote:"Individual responses are not in this dataset for anyone",
    rules:["r-small-count","r-locality-scope"],
    fields:[
      F("Poll","PollId","attribute","The poll the option belongs to.","POLL-4821",{usage:"As is"}),
      F("Message","MessageId","attribute","The Connect message the poll was attached to.","MSG-91044",{usage:"As is"}),
      F("Option","Description","attribute","The answer text people chose between.","Saturday morning",{distinct:"18 k"}),
      F("Responses","response_count","measure","How many people chose this option. Suppressed under five.","41",{format:"#,##0",usage:"Aggregated",derived:true})
    ]
  }
];
const ds = id => DATASETS.find(d=>d.id===id);
const DOMAINS = [...new Set(DATASETS.map(d=>d.domain))];

/* ---------- glossary: one agreed definition ---------- */
const GLOSSARY = [
  {term:"Attendance", def:"A member with a confirmed check-in at a meeting of type Regular or Special. Excludes cancelled meetings and duplicate check-ins within four hours.", owner:"Rupert Mackenzie", version:3, agreed:"12 Apr 2026", used:9},
  {term:"Locality", def:"A recognised local congregation with an appointed secretary. A locality sits in exactly one country and contains one or more subdivisions. It is the unit every permission is granted against.", owner:"Reneilwe Dlomo", version:3, agreed:"03 Sep 2026", used:12},
  {term:"Subdivision", def:"A congregation subdivision inside a locality. The finest grain the systems hold, and the level at which personal fields stop being masked for you.", owner:"Reneilwe Dlomo", version:1, agreed:"03 Sep 2026", used:5},
  {term:"Country", def:"A country inside a region. The tier a coordinator's access widens to when their work genuinely spans more than a set of named localities.", owner:"Marcus Vilakazi", version:1, agreed:"03 Sep 2026", used:3},
  {term:"Region", def:"The widest tier below global — South Africa is one of nine, and covers eight countries. Not to be confused with an Orbit travel area, which groups localities for logistics and grants nothing.", owner:"Marcus Vilakazi", version:1, agreed:"03 Sep 2026", used:2},
    {term:"Net movement", def:"Joins plus transfers in, less transfers out, lapses and deaths, over a complete calendar month.", owner:"Rupert Mackenzie", version:2, agreed:"01 Aug 2026", used:4},
  {term:"Meeting", def:"A scheduled gathering recorded in Connect with a start time, a venue and an expected list. Cancelled meetings retain their record but are excluded from all counts.", owner:"Pavitra Govender", version:1, agreed:"14 Jun 2026", used:7},
  {term:"Active member", def:"A member whose record is current as at the reporting period end (the row's ValidTo is open at that date) — not as at query time, so historic reports do not drift.", owner:"Sindi Mthembu", version:4, agreed:"02 Jul 2026", used:11}
];

/* ---------- shared formatting helpers ---------- */
const CERT = {
  verified:  {label:"Approved",   cls:"ok",   ico:"shield", note:"Checked and signed off by a named steward."},
  draft:     {label:"Draft",      cls:"mut",  ico:"pencil", note:"Usable, but definitions may still change."},
  warning:   {label:"Warning",    cls:"warn", ico:"warn",   note:"Something is wrong right now. Read the note before using."},
  deprecated:{label:"Deprecated", cls:"crit", ico:"archive",note:"Retired. A replacement exists."},
  blocked:   {label:"Blocked",    cls:"crit", ico:"lock",   note:"Excluded from Spiff by policy."}
};
const SENS = {
  "Public":    {cls:"ok"},
  "Internal":  {cls:"mut"},
  "Restricted":{cls:"warn"},
  "Personal":  {cls:"crit"}
};
const FRESH = {
  "on-time":{label:"On time", cls:"ok"},
  "late":   {label:"Late",    cls:"warn"},
  "stale":  {label:"Stale",   cls:"crit"},
  "n/a":    {label:"—",       cls:"mut"}
};
</script>
