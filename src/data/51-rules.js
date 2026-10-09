<script>
/* =====================================================================
   SPIFF v2 — BUSINESS RULES
   A rule is a governed object: an owner, an approver, a status, a change
   history and a plain-English sentence. Not a setting in a preferences pane.
   The sentence is the primary representation — {{key:label}} marks the
   editable slots the rule editor renders as chips.
   ===================================================================== */

/* ---------- categories ---------- */
const RULE_CATEGORIES = [
  {id:"masking",   label:"Masking",           desc:"The row is returned, but a column is replaced with something safe.", icon:"lock",    color:"crit"},
  {id:"rowfilter", label:"Row filter",        desc:"Rows the viewer may not see never enter the answer.",               icon:"filter",  color:"info"},
  {id:"suppress",  label:"Suppression",       desc:"A cell is withheld because publishing it would identify someone.",  icon:"eyeoff",  color:"warn"},
  {id:"rounding",  label:"Rounding",          desc:"A number is deliberately made less precise before anyone sees it.", icon:"trend",   color:"teal"},
  {id:"retention", label:"Retention",         desc:"Data past its keeping period stops being queryable.",               icon:"archive", color:"mut"},
  {id:"metric",    label:"Metric definition", desc:"One agreed way to calculate a number, wherever it is asked for.",   icon:"book",    color:"purple"},
  {id:"consent",   label:"Consent",           desc:"A person's recorded choice decides whether their row is used.",     icon:"check",   color:"ok"},
  {id:"window",    label:"Time window",       desc:"Data is visible only for a period around the event it describes.",  icon:"clock",   color:"info"},
  {id:"exclusion", label:"Exclusion",         desc:"A field or table is kept out of Spiff altogether.",                 icon:"x",       color:"crit"}
];
const ruleCat = id => RULE_CATEGORIES.find(c=>c.id===id) || RULE_CATEGORIES[0];

/* ---------- masking methods — described by what the viewer actually sees ---------- */
const MASK_METHODS = [
  {id:"hash",     label:"Hashing",           sees:"The same scrambled string every time, so rows can still be grouped and counted — but nobody can read the value or turn it back."},
  {id:"null",     label:"NULL",              sees:"An empty cell. The column exists, the value does not."},
  {id:"constant", label:"Constant",          sees:"A fixed placeholder such as [withheld], so it is obvious something was removed rather than missing."},
  {id:"regex",    label:"Regex",             sees:"Part of the value kept, the rest replaced — an email shows as n****@ubteam.com."},
  {id:"round",    label:"Rounding",          sees:"A blunter number or date — an exact birth date becomes a birth year, a count of 12 becomes 10."},
  {id:"fpe",      label:"Format-preserving", sees:"Something that still looks like the real thing — MBR-408812 becomes MBR-771043 — so reports and joins keep working."},
  {id:"revers",   label:"Reversible",        sees:"A scrambled value that a named approver can unscramble, with the unscrambling itself written to the activity log."},
  {id:"cell",     label:"Cell-level",        sees:"One column masked only on the rows where another column says so — the same report shows some cells and hides others."}
];
const maskMethod = id => MASK_METHODS.find(m=>m.id===id);

/* ---------- what happens when two rules match the same thing ---------- */
const HIT_POLICIES = [
  {id:"unique",  label:"Unique",       desc:"Only one rule may match. If a second one does, the run stops and the rule owners are told — nothing is guessed."},
  {id:"first",   label:"First",        desc:"The first matching rule by precedence wins and the rest are skipped, even if they would have been stricter."},
  {id:"priority",label:"Priority",     desc:"Every matching rule is compared and the strictest outcome wins. A block beats a mask; a mask beats a warning."},
  {id:"collect", label:"Collect (all)",desc:"Every matching rule is applied in precedence order, one on top of the other — this is how filters stack with AND."}
];
const hitPolicy = id => HIT_POLICIES.find(h=>h.id===id);

/* ---------- sample rows used by the rule preview ---------- */
const RULE_SAMPLES = {
  member:{
    label:"Member records · 5 of 241 000 rows",
    cols:["Member","Locality","Country","Date of birth","Email","Age band"],
    rows:[
      ["Naledi Mokoena","Bellville","South Africa","14 Mar 1989","n.mokoena@ubteam.com","30–39"],
      ["Pieter Grobler","Bellville","South Africa","02 Sep 2010","p.grobler@ubteam.com","Under 18"],
      ["Thandiwe Zulu","Windhoek","Namibia","27 Jun 1954","t.zulu@ubteam.com","70–79"],
      ["Johan Nel","Polokwane","South Africa","11 Jan 1978","j.nel@ubteam.com","40–49"],
      ["Amahle Dube","Bellville","South Africa","30 Nov 1996","a.dube@ubteam.com","20–29"]
    ]
  },
  agg:{
    label:"Membership movement · 5 of 41 000 rows",
    cols:["Locality","Country","Members","Joins","Attendance rate"],
    rows:[
      ["Bellville","South Africa","482","12","94.2%"],
      ["Somerset West","South Africa","3","1","91.0%"],
      ["Windhoek","Namibia","217","4","88.6%"],
      ["Polokwane","South Africa","96","2","90.4%"],
      ["Kimberley","South Africa","4","0","82.1%"]
    ]
  },
  travel:{
    label:"Travel bookings · 5 of 1.2 M rows",
    cols:["Booking ref","Traveller","Travel date","Destination","Document no.","Cost"],
    rows:[
      ["ORB-88C412","Helena Bosman","12 Sep 2026","JNB","[not loaded]","NZ$ 428"],
      ["ORB-88C519","Colette Marais","04 Sep 2026","DUR","[not loaded]","NZ$ 291"],
      ["ORB-87A044","Siyabonga Nxumalo","19 Feb 2026","CPT","[not loaded]","NZ$ 564"],
      ["ORB-88D701","Gugu Pillay","24 Sep 2026","ELS","[not loaded]","NZ$ 312"],
      ["ORB-89A118","Warrick Meintjes","22 Dec 2026","JNB","[not loaded]","NZ$ 647"]
    ]
  },
  reg:{
    label:"Event registrations · 5 of 2.1 M rows",
    cols:["Registration","Event","Member","Dietary note","Accessibility note","Attended"],
    rows:[
      ["REG-771204","Regional Youth Gathering","MBR-408812","No nuts","Step-free access","1"],
      ["REG-771318","Regional Youth Gathering","MBR-411907","Halaal","—","1"],
      ["REG-770882","Care Training — Coastal","MBR-402215","—","Hearing loop","0"],
      ["REG-769014","Spring Conference 2025","MBR-408812","Gluten free","—","1"],
      ["REG-771402","Regional Youth Gathering","MBR-419338","—","—","1"]
    ]
  },
  fin:{
    label:"Cost centres & budgets · 5 of 28 000 rows",
    cols:["Cost centre","Month","Budget","Actual","Consumed"],
    rows:[
      ["GST-TRV-01 · Travel — Southern","Aug 2026","NZ$ 42,000","NZ$ 38,841","92.5%"],
      ["GST-EVT-02 · Events — Coastal","Aug 2026","NZ$ 61,500","NZ$ 50,288","81.8%"],
      ["GST-EST-01 · Estates — National","Aug 2026","NZ$ 124,000","NZ$ 119,942","96.7%"],
      ["GST-LDM-03 · LDM — Northern","Aug 2026","NZ$ 18,800","NZ$ 14,106","75.0%"],
      ["GST-ADM-01 · Administration","Aug 2026","NZ$ 31,000","NZ$ 27,694","89.3%"]
    ]
  },
  comms:{
    label:"Notices & delivery · 5 of 6.8 M rows",
    cols:["Notice type","Channel","Sent","Recipient","Consent","Delivered"],
    rows:[
      ["Meeting","Email","28 Aug 2026","MBR-408812","true","1"],
      ["Event","SMS","27 Aug 2026","MBR-411907","false","1"],
      ["Care","Email","26 Aug 2026","MBR-402215","true","0"],
      ["Administrative","Post","24 Aug 2026","MBR-419338","false","1"],
      ["Meeting","App","23 Aug 2026","MBR-408812","true","1"]
    ]
  }
};

/* ---------- the rules ---------- */
const RULES = [
{
  id:"r-locality-scope", name:"Locality scoping — default deny",
  sentence:"Only show {{scope:rows whose locality is one of your assigned localities}} for everyone except {{except:National Office}}, and merge the result with every other row filter using {{join:AND}}",
  category:"rowfilter", dimension:"Privacy · Scope",
  scope:{datasets:["meetings","members","localities","families","travel","itineraries","events","registrations","appointments","comms","checkins"], fields:["locality_nm"], tags:["Scope.Locality"]},
  condition:"locality_nm IN viewer.assigned_localities",
  exception:"National Office (aggregate only)",
  action:"Filter rows", method:null,
  severity:"Redact with notice", precedence:1, hitPolicy:"collect",
  owner:"Reneilwe Dlomo",
  approvers:[{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"14 Jan 2026"},{name:"Rupert Mackenzie",role:"Head of Statistics",on:"16 Jan 2026"}],
  status:"Active", effectiveFrom:"14 Jan 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §11 — Lawful processing", doc:"UBT-DP-02 Access Standard", sec:"§3.1 Locality scoping"},
  lastRun:"4 seconds ago", evalsToday:18412, rowsAffected:2940118, passRate:100,
  exempt:{roles:["national","admin"],groups:["national-stats"]},
  tests:[
    {name:"Locality Secretary, Bloemfontein",expect:"Sees 1 locality",status:"pass"},
    {name:"LDM Coordinator, Cape Localities",expect:"Sees 12 of 312 localities",status:"pass"},
    {name:"National Office analyst",expect:"Sees the whole region, aggregate only",status:"pass"},
    {name:"Dormant account, no localities",expect:"Sees nothing, told why",status:"pass"}
  ],
  preview:{sample:"member", hide:[2,3], note:"Two of the five rows sit outside the viewer's localities, so they never reach the answer."},
  history:[
    {when:"14 Jan 2026",who:"Reneilwe Dlomo",what:"Rule created and approved. Replaces the old per-report locality parameter."},
    {when:"03 Mar 2026",who:"Marcus Vilakazi",what:"Hit policy changed from First to Collect so locality scoping stacks with other privacy rules instead of short-circuiting them."},
    {when:"22 Jun 2026",who:"Reneilwe Dlomo",what:"Added Itineraries & journeys to scope when Orbit stitching went live."}
  ],
  incidents:0
},
{
  id:"r-contact-mask", name:"Mask member email and mobile outside own locality",
  sentence:"Mask {{fields:columns tagged Contact.Direct}} using {{method:Hashing}} for everyone except {{except:viewers in the row's own locality, Regional Coordinators}}",
  category:"masking", dimension:"Privacy · Personal data",
  scope:{datasets:["members","families","comms"], fields:["email","mobile","address_line"], tags:["Contact.Direct"]},
  condition:"row.locality_nm != viewer.locality_nm",
  exception:"Same locality, or Regional Coordinator for the row's locality",
  action:"Mask column", method:"hash",
  severity:"Redact with notice", precedence:20, hitPolicy:"priority",
  owner:"Sindi Mthembu",
  approvers:[{name:"Cathleen Oberholzer",role:"Safeguarding Lead",on:"09 Feb 2026"},{name:"Reneilwe Dlomo",role:"Delivery & Quality Manager",on:"11 Feb 2026"}],
  status:"Active", effectiveFrom:"12 Feb 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §19 — Security safeguards", doc:"UBT-DP-04 Data Protection Standard", sec:"§4.2 Contact data"},
  lastRun:"2 minutes ago", evalsToday:9106, rowsAffected:184420, passRate:99.8,
  exempt:{roles:["regional","safeguard","steward"],groups:["records-office"]},
  tests:[
    {name:"Locality Secretary, own locality",expect:"Reads both columns in full",status:"pass"},
    {name:"Locality Secretary, next locality",expect:"Sees a stable hash, can still count distinct",status:"pass"},
    {name:"Regional Coordinator, own locality",expect:"Reads both columns in full",status:"pass"},
    {name:"Reader with no locality set",expect:"Sees a hash everywhere",status:"warn"}
  ],
  preview:{sample:"member", affect:[{col:4,as:"a3f9c1d0e7…",why:"Hashed — outside your locality"}], rows:[2,3], note:"Rows in the viewer's own locality stay readable. The rest are hashed rather than blanked, so distinct-contact counts still work."},
  history:[
    {when:"12 Feb 2026",who:"Sindi Mthembu",what:"Rule created. Method set to Hashing rather than NULL so distinct-contact counts survive masking."},
    {when:"14 May 2026",who:"Lesedi Mofokeng",what:"Regional Coordinators added to the exception after the Northern Cluster access review."},
    {when:"02 Jul 2026",who:"Sindi Mthembu",what:"Postal address added to the tag. Families dataset brought into scope."}
  ],
  incidents:1
},
{
  id:"r-minor-detail", name:"Minors are name and locality only",
  sentence:"Only show {{fields:columns tagged Member.Detail}} where {{condition:the member is 18 or older}} for everyone except {{except:Safeguarding Leads with a recorded purpose}}. Under-18 rows return {{keep:name and locality only}}",
  category:"exclusion", dimension:"Safeguarding",
  scope:{datasets:["meetings","members","registrations"], fields:["dob","email","mobile","household_id","age_band"], tags:["Member.Detail"]},
  condition:"age(dob) >= 18",
  exception:"Safeguarding Lead, purpose recorded at the point of asking",
  action:"Withhold columns", method:"null",
  severity:"Block", precedence:3, hitPolicy:"priority",
  owner:"Cathleen Oberholzer",
  approvers:[{name:"Sindi Mthembu",role:"Records Officer",on:"05 Jun 2026"},{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"06 Jun 2026"},{name:"Ezra Haddad",role:"Head of Software — GST",on:"12 Jun 2026"}],
  status:"Active", effectiveFrom:"14 Jun 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"Children's Act 38 of 2005 §13", doc:"UBT-SG-01 Safeguarding Standard", sec:"§2 Minors in reporting"},
  lastRun:"6 minutes ago", evalsToday:7318, rowsAffected:11904, passRate:100,
  exempt:{roles:["safeguard"],groups:["safeguarding"]},
  tests:[
    {name:"Locality Secretary asks for a youth list",expect:"Names and localities only",status:"pass"},
    {name:"Safeguarding Lead, purpose recorded",expect:"Full detail, access written to the log",status:"pass"},
    {name:"Safeguarding Lead, no purpose given",expect:"Blocked, asked for a purpose",status:"pass"},
    {name:"Member with no date of birth on file",expect:"Treated as a minor until proven otherwise",status:"pass"}
  ],
  preview:{sample:"member", affect:[{col:3,as:"[withheld]",why:"Under 18"},{col:4,as:"[withheld]",why:"Under 18"}], rows:[1], note:"Row 2 is a 15-year-old. Name and locality survive; everything else is withheld, and the answer says so."},
  history:[
    {when:"14 Jun 2026",who:"Cathleen Oberholzer",what:"Rule created, superseding r-legacy-minor. Three approvals required before activation."},
    {when:"18 Jul 2026",who:"Cathleen Oberholzer",what:"Event registrations added to scope after a youth gathering export went further than intended."}
  ],
  incidents:1
},
{
  id:"r-minor-dob", name:"No exact date of birth for a minor, ever",
  sentence:"Mask {{fields:Date of birth}} using {{method:Rounding to year}} where {{condition:the member is under 18}} for {{except:everyone, with no exception}}",
  category:"masking", dimension:"Safeguarding",
  scope:{datasets:["members"], fields:["dob"], tags:["Member.Detail","Minor"]},
  condition:"age(dob) < 18",
  exception:"None. This rule has no exception clause and cannot be given one.",
  action:"Mask column", method:"round",
  severity:"Block", precedence:2, hitPolicy:"priority",
  owner:"Cathleen Oberholzer",
  approvers:[{name:"Ezra Haddad",role:"Head of Software — GST",on:"12 Jun 2026"},{name:"Sindi Mthembu",role:"Records Officer",on:"12 Jun 2026"}],
  status:"Active", effectiveFrom:"14 Jun 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"Children's Act 38 of 2005 §13", doc:"UBT-SG-01 Safeguarding Standard", sec:"§2.4 Dates of birth"},
  lastRun:"6 minutes ago", evalsToday:7318, rowsAffected:11904, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Safeguarding Lead",expect:"Still sees the year only",status:"pass"},
    {name:"Platform Admin",expect:"Still sees the year only",status:"pass"},
    {name:"Age exactly 18 today",expect:"Full date returned",status:"pass"}
  ],
  preview:{sample:"member", affect:[{col:3,as:"2010",why:"Rounded to year — under 18"}], rows:[1], note:"Nobody is exempt from this one, including the person reading this screen."},
  history:[
    {when:"14 Jun 2026",who:"Cathleen Oberholzer",what:"Rule created with the exception clause deliberately left empty and locked."},
    {when:"29 Jul 2026",who:"Marcus Vilakazi",what:"Attempt to add a Platform Admin exception refused at review. Recorded here so the question is not asked a third time."}
  ],
  incidents:0
},
{
  id:"r-deceased-tail", name:"Deceased members: a 24-month tail, then archive",
  sentence:"Only show rows where {{condition:the deceased date is empty or falls within the last 24 months}} for everyone except {{except:Records Office}}",
  category:"retention", dimension:"Retention · Dignity",
  scope:{datasets:["members","families"], fields:["deceased_dt"], tags:["Lifecycle.Deceased"]},
  condition:"deceased_dt IS NULL OR deceased_dt > today − 24 months",
  exception:"Records Office, for statutory and genealogical requests",
  action:"Filter rows", method:null,
  severity:"Redact silently", precedence:12, hitPolicy:"collect",
  owner:"Sindi Mthembu",
  approvers:[{name:"Rika Olivier",role:"Records Officer",on:"28 Feb 2026"},{name:"Rupert Mackenzie",role:"Head of Statistics",on:"02 Mar 2026"}],
  status:"Active", effectiveFrom:"01 Mar 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §14 — Retention of records", doc:"UBT-DP-06 Retention Schedule", sec:"§5 Member records"},
  lastRun:"11 minutes ago", evalsToday:4188, rowsAffected:38617, passRate:100,
  exempt:{roles:["steward"],groups:["records-office"]},
  tests:[
    {name:"Statistics analyst, 5-year trend",expect:"Older deaths counted in history, not listed as rows",status:"pass"},
    {name:"Records Officer",expect:"Full tail visible",status:"pass"},
    {name:"Locality Secretary, memorial list",expect:"Last 24 months only",status:"pass"}
  ],
  preview:{sample:"member", hide:[2], note:"Redacted silently by design — a memorial list should not announce which names were removed."},
  history:[
    {when:"01 Mar 2026",who:"Sindi Mthembu",what:"Rule created at 24 months on the Records Office recommendation."},
    {when:"12 Jun 2026",who:"Rika Olivier",what:"Severity moved from Redact with notice to Redact silently after feedback from two localities."}
  ],
  incidents:0
},
{
  id:"r-consent", name:"Consent decides whether a contact row is used",
  sentence:"Only show rows where {{condition:contact consent is true}} whenever a question groups by or filters on {{fields:contact channel}}, for {{except:everyone, with no exception}}",
  category:"consent", dimension:"Privacy · Consent",
  scope:{datasets:["members","comms"], fields:["contact_consent","channel_cd","email","mobile"], tags:["Contact.Direct","Consent"]},
  condition:"contact_consent = true",
  exception:"None. Consent is the person's decision, not the viewer's.",
  action:"Filter rows", method:null,
  severity:"Block", precedence:24, hitPolicy:"collect",
  owner:"Sindi Mthembu",
  approvers:[{name:"Cathleen Oberholzer",role:"Safeguarding Lead",on:"18 Mar 2026"},{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"19 Mar 2026"}],
  status:"Active", effectiveFrom:"20 Mar 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §69 — Direct marketing", doc:"UBT-DP-04 Data Protection Standard", sec:"§6 Consent"},
  lastRun:"27 minutes ago", evalsToday:2604, rowsAffected:29140, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Delivery rate by channel",expect:"Non-consented rows excluded, count of exclusions shown",status:"pass"},
    {name:"Total member count",expect:"Unaffected — the rule only bites on contact questions",status:"pass"},
    {name:"Consent withdrawn this morning",expect:"Row gone on the next run, same day",status:"pass"}
  ],
  preview:{sample:"comms", hide:[1,3], note:"Two recipients have not consented to contact. Their rows are not in the answer, and the answer says two were removed."},
  history:[
    {when:"20 Mar 2026",who:"Sindi Mthembu",what:"Rule created after the March notices review."},
    {when:"04 Aug 2026",who:"Rika Olivier",what:"Scope narrowed to contact-channel questions so ordinary member counts stopped being distorted."}
  ],
  incidents:0
},
{
  id:"r-small-count", name:"Small-count suppression on any member breakdown",
  sentence:"Suppress {{scope:any cell that counts people}} where {{condition:the count is under 5}} and show {{value:“<5”}} instead, for everyone except {{except:National Statistics}}",
  category:"suppress", dimension:"Privacy · Disclosure control",
  scope:{datasets:["meetings","members","families","registrations","growth"], fields:["member_count","household_count","registration_count","minor_count"], tags:["Measure.PersonCount"]},
  condition:"cell_value < 5 AND measure counts people",
  exception:"National Statistics, for the statutory return only",
  action:"Suppress cell", method:"constant",
  severity:"Redact with notice", precedence:30, hitPolicy:"collect",
  owner:"Rupert Mackenzie",
  approvers:[{name:"Pavitra Govender",role:"Statistics Analyst",on:"08 Apr 2026"},{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"10 Apr 2026"}],
  status:"Active", effectiveFrom:"12 Apr 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"GSS disclosure control guidance", doc:"UBT-ST-02 Statistical Disclosure Standard", sec:"§3 Primary suppression"},
  lastRun:"1 minute ago", evalsToday:12880, rowsAffected:41207, passRate:100,
  exempt:{roles:["national"],groups:["national-stats"]},
  tests:[
    {name:"Locality with 3 members",expect:"Shows <5 with a hover saying why",status:"pass"},
    {name:"Locality total of 4 810",expect:"Unchanged",status:"pass"},
    {name:"Cross-tab of age band by locality",expect:"14 cells suppressed, count declared",status:"pass"},
    {name:"National Statistics, statutory return",expect:"Exact counts, export written to the log",status:"pass"}
  ],
  preview:{sample:"agg", affect:[{col:2,as:"<5",why:"Count under 5"}], rows:[1,4], note:"Suppression is always explained. A missing number and a hidden number must never look the same."},
  history:[
    {when:"12 Apr 2026",who:"Rupert Mackenzie",what:"Rule created at a threshold of 5, matching the GSS convention."},
    {when:"19 May 2026",who:"Pavitra Govender",what:"Children under 18 measure added to scope after the household report."},
    {when:"01 Aug 2026",who:"Rupert Mackenzie",what:"Paired with r-secondary-suppress, which is still in review."}
  ],
  incidents:0
},
{
  id:"r-secondary-suppress", name:"Secondary suppression so totals cannot give it away",
  sentence:"After {{after:small-count suppression}} has run, also suppress {{scope:the next-smallest cell in the same row and column}} so that {{why:the hidden number cannot be worked out by subtraction}}, for everyone except {{except:National Statistics}}",
  category:"suppress", dimension:"Privacy · Disclosure control",
  scope:{datasets:["members","families","growth","registrations"], fields:["member_count","household_count","registration_count"], tags:["Measure.PersonCount"]},
  condition:"a primary suppression exists in this row or column",
  exception:"National Statistics, for the statutory return only",
  action:"Suppress cell", method:"constant",
  severity:"Redact with notice", precedence:31, hitPolicy:"collect",
  owner:"Pavitra Govender",
  approvers:[{name:"Rupert Mackenzie",role:"Head of Statistics",on:"24 Aug 2026"}],
  status:"In review", effectiveFrom:"15 Sep 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"GSS disclosure control guidance", doc:"UBT-ST-02 Statistical Disclosure Standard", sec:"§4 Secondary suppression"},
  lastRun:"not yet — runs in shadow mode", evalsToday:0, rowsAffected:0, passRate:96.4,
  exempt:{roles:["national"],groups:["national-stats"]},
  tests:[
    {name:"One suppressed cell in a row of four",expect:"A second cell suppressed alongside it",status:"pass"},
    {name:"Row where every cell is over 5",expect:"Nothing suppressed",status:"pass"},
    {name:"Row with a published total",expect:"Total also suppressed — currently failing",status:"fail"}
  ],
  preview:{sample:"agg", affect:[{col:2,as:"<5",why:"Primary suppression"},{col:3,as:"—",why:"Secondary — protects the cell above"}], rows:[1,4], note:"Shadow mode: this is what the rule would do. It is not applied to live answers until it is approved."},
  history:[
    {when:"01 Aug 2026",who:"Pavitra Govender",what:"Drafted alongside r-small-count."},
    {when:"24 Aug 2026",who:"Rupert Mackenzie",what:"Approved for shadow running. One test still failing on published totals — must pass before activation."}
  ],
  incidents:0
},
{
  id:"r-round-base5", name:"Round locality attendance counts to base 5",
  sentence:"Round {{fields:attendance and member counts}} using {{method:Rounding to base 5}} at {{grain:locality grain and below}} for everyone except {{except:National Statistics}}",
  category:"rounding", dimension:"Privacy · Disclosure control",
  scope:{datasets:["meetings","growth"], fields:["checked_in","expected","member_count","closing_members"], tags:["Measure.PersonCount"]},
  condition:"grain is locality or finer",
  exception:"National Statistics, for the statutory return only",
  action:"Round value", method:"round",
  severity:"Log only", precedence:34, hitPolicy:"collect",
  owner:"Rupert Mackenzie",
  approvers:[{name:"Pavitra Govender",role:"Statistics Analyst",on:"08 Apr 2026"}],
  status:"Suspended", effectiveFrom:"12 Apr 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"GSS disclosure control guidance", doc:"UBT-ST-02 Statistical Disclosure Standard", sec:"§5 Rounding to a base"},
  lastRun:"18 Aug 2026 — suspended since", evalsToday:0, rowsAffected:0, passRate:100,
  exempt:{roles:["national"],groups:["national-stats"]},
  tests:[
    {name:"Locality attendance of 482",expect:"Shows 480",status:"pass"},
    {name:"Locality attendance of 12 411",expect:"Unchanged — above locality grain",status:"pass"},
    {name:"Rounded values summed to a locality total",expect:"Total drifts by up to 2% — the reason it is suspended",status:"fail"}
  ],
  preview:{sample:"agg", affect:[{col:2,as:"480",why:"Rounded to base 5"}], rows:[0], note:"Suspended on 18 Aug. While it is suspended, locality counts show their exact value and every viewer sees the same number."},
  history:[
    {when:"12 Apr 2026",who:"Rupert Mackenzie",what:"Rule created to blunt locality-level counts."},
    {when:"18 Aug 2026",who:"Pavitra Govender",what:"Suspended. Rounded locality figures were being summed into regional totals that no longer matched the statutory return."},
    {when:"26 Aug 2026",who:"Rupert Mackenzie",what:"Fix agreed: round at presentation, not at aggregation. Re-approval needed before it goes back on."}
  ],
  incidents:2
},
{
  id:"r-cross-locality", name:"Cross-locality aggregate yes, cross-locality detail no",
  sentence:"Allow {{allow:counts, rates and totals}} for any locality, but only show {{deny:member-level rows}} where {{condition:the locality is one of yours}}, for everyone except {{except:Regional Coordinators and Data Stewards}}",
  category:"rowfilter", dimension:"Privacy · Scope",
  scope:{datasets:["members","meetings","families","registrations"], fields:["locality_nm","member_id","full_nm"], tags:["Scope.Locality"]},
  condition:"grain is member-level AND row.locality_nm NOT IN viewer.localities",
  exception:"Regional Coordinator for the locality, or Data Steward for the domain",
  action:"Filter rows", method:null,
  severity:"Redact with notice", precedence:6, hitPolicy:"collect",
  owner:"Londiwe Zwane",
  approvers:[],
  status:"Draft", effectiveFrom:"01 Oct 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §11 — Lawful processing", doc:"UBT-DP-02 Access Standard", sec:"§3.4 Locality detail"},
  lastRun:"never — draft", evalsToday:0, rowsAffected:0, passRate:98.1,
  exempt:{roles:["regional","steward"],groups:["stewards"]},
  tests:[
    {name:"Secretary asks for a neighbouring locality's attendance rate",expect:"Rate returned",status:"pass"},
    {name:"Secretary asks who attended in that locality",expect:"Blocked, offered the rate instead",status:"pass"},
    {name:"Regional Coordinator, same question",expect:"Names returned",status:"pass"}
  ],
  preview:{sample:"member", hide:[2,3], note:"Draft. This is what the rule would do if it were switched on — nothing on this screen is live yet."},
  history:[
    {when:"19 Aug 2026",who:"Londiwe Zwane",what:"Drafted after three Coastal secretaries asked for the same thing in the same week."},
    {when:"28 Aug 2026",who:"Londiwe Zwane",what:"Aggregate exception written out explicitly rather than left implied, on Marcus's review note."}
  ],
  incidents:0
},
{
  id:"r-travel-window", name:"Travel is visible within 30 days of the journey",
  sentence:"Only show data by {{window:travel date within 30 days either side of today}} for everyone except {{except:Travel Office}}",
  category:"window", dimension:"Privacy · Proportionality",
  scope:{datasets:["travel","itineraries"], fields:["travel_dt","start_dt","end_dt","traveller_nm"], tags:["Travel.Booking"]},
  condition:"travel_dt BETWEEN today − 30 days AND today + 30 days",
  exception:"Travel Office, for booking and reconciliation",
  action:"Filter rows", method:null,
  severity:"Redact with notice", precedence:15, hitPolicy:"collect",
  owner:"Colette Marais",
  approvers:[{name:"Helena Bosman",role:"Travel Coordinator",on:"03 Apr 2026"},{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"05 Apr 2026"}],
  status:"Active", effectiveFrom:"06 Apr 2026", effectiveTo:"30 Sep 2026", expiresIn:19,
  basis:{law:"POPIA §10 — Minimality", doc:"UBT-TR-01 Travel Data Standard", sec:"§2 Visibility window"},
  lastRun:"14 minutes ago", evalsToday:1844, rowsAffected:917340, passRate:100,
  exempt:{roles:[],groups:["travel-office"]},
  tests:[
    {name:"Event lead, gathering in 3 weeks",expect:"Sees the arriving party",status:"pass"},
    {name:"Same lead, same question in January",expect:"Sees nothing, told the window is closed",status:"pass"},
    {name:"Travel Office, full year",expect:"Sees everything",status:"pass"}
  ],
  preview:{sample:"travel", hide:[2,4], note:"Two bookings fall outside the window — one in February, one in December. The viewer is told two rows were withheld, not that none exist."},
  history:[
    {when:"06 Apr 2026",who:"Colette Marais",what:"Rule created at ±30 days after the Orbit connector went live."},
    {when:"11 Aug 2026",who:"Helena Bosman",what:"End date set to 30 Sep 2026 so the window is re-argued rather than inherited."}
  ],
  incidents:0
},
{
  id:"r-travel-docs", name:"Passport and identity document numbers are never loaded",
  sentence:"Mask {{fields:columns tagged Identity.Document}} using {{method:NULL}} for {{except:everyone, with no exception}} — these columns are never loaded into Spiff in the first place",
  category:"masking", dimension:"Privacy · Identity",
  scope:{datasets:["travel","itineraries"], fields:["document_no"], tags:["Identity.Document"]},
  condition:"column tagged Identity.Document",
  exception:"None. The column is excluded at the connector, before Spiff sees it.",
  action:"Never load", method:"null",
  severity:"Block", precedence:4, hitPolicy:"priority",
  owner:"Colette Marais",
  approvers:[{name:"Ezra Haddad",role:"Head of Software — GST",on:"02 Apr 2026"},{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"03 Apr 2026"}],
  status:"Active", effectiveFrom:"06 Apr 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §26 — Special personal information", doc:"UBT-TR-01 Travel Data Standard", sec:"§4 Identity documents"},
  lastRun:"14 minutes ago", evalsToday:1844, rowsAffected:1204118, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Travel Office asks for document numbers",expect:"Column is empty for them too",status:"pass"},
    {name:"Platform Admin queries the raw table",expect:"Column does not exist in the extract",status:"pass"}
  ],
  preview:{sample:"travel", affect:[{col:4,as:"[not loaded]",why:"Excluded at the connector"}], note:"There is nothing to unmask. The column never leaves Orbit."},
  history:[
    {when:"06 Apr 2026",who:"Colette Marais",what:"Rule created as a connector-level exclusion rather than a mask, so the value never enters Spiff."},
    {when:"11 Aug 2026",who:"Marcus Vilakazi",what:"Confirmed at the August connector review that the field is still absent from the extract."}
  ],
  incidents:0
},
{
  id:"r-wellbeing", name:"Dietary and accessibility notes are health-adjacent",
  sentence:"Mask {{fields:columns tagged Wellbeing}} using {{method:Constant “[withheld]”}} for everyone except {{except:Event Operations with an active event assignment}}",
  category:"masking", dimension:"Privacy · Health-adjacent",
  scope:{datasets:["registrations"], fields:["dietary_note","access_note"], tags:["Wellbeing"]},
  condition:"column tagged Wellbeing",
  exception:"Event Operations, and only for events they are currently assigned to",
  action:"Mask column", method:"constant",
  severity:"Redact with notice", precedence:22, hitPolicy:"priority",
  owner:"Amira Rasool",
  approvers:[{name:"Cathleen Oberholzer",role:"Safeguarding Lead",on:"16 Jul 2026"},{name:"Warrick Meintjes",role:"Events Director",on:"17 Jul 2026"}],
  status:"Active", effectiveFrom:"19 Jul 2026", effectiveTo:"15 Sep 2026", expiresIn:4,
  basis:{law:"POPIA §26 — Special personal information", doc:"UBT-EV-02 Event Data Standard", sec:"§3 Wellbeing notes"},
  lastRun:"38 minutes ago", evalsToday:1106, rowsAffected:88420, passRate:99.9,
  exempt:{roles:[],groups:["event-ops"]},
  tests:[
    {name:"Event Coordinator, assigned event",expect:"Reads the notes, access logged",status:"pass"},
    {name:"Event Coordinator, unassigned event",expect:"Sees [withheld]",status:"pass"},
    {name:"Statistics analyst counting dietary needs",expect:"Counts work, text withheld",status:"pass"}
  ],
  preview:{sample:"reg", affect:[{col:3,as:"[withheld]",why:"Wellbeing"},{col:4,as:"[withheld]",why:"Wellbeing"}], note:"Constant, not NULL — so a caterer can still see that 41 people recorded a requirement without reading any of them."},
  history:[
    {when:"19 Jul 2026",who:"Amira Rasool",what:"Rule created after the July gathering exported a dietary list to a shared drive."},
    {when:"12 Aug 2026",who:"Warrick Meintjes",what:"Exception narrowed from all of Event Operations to assigned events only."}
  ],
  incidents:1
},
{
  id:"r-retention-reg", name:"Registrations are purged 13 months after the event closes",
  sentence:"Exclude rows where {{condition:the event closed more than 13 months ago}} from {{scope:every query surface}}, for {{except:everyone, with no exception}}",
  category:"retention", dimension:"Retention",
  scope:{datasets:["registrations"], fields:["registered_dt","event_nm"], tags:["Lifecycle.Retention"]},
  condition:"event_end_dt < today − 13 months",
  exception:"None. Purged data cannot be shown to anyone, at any level.",
  action:"Exclude rows", method:null,
  severity:"Block", precedence:10, hitPolicy:"collect",
  owner:"Amira Rasool",
  approvers:[{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"20 Dec 2025"},{name:"Sindi Mthembu",role:"Records Officer",on:"22 Dec 2025"}],
  status:"Active", effectiveFrom:"01 Jan 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"POPIA §14 — Retention of records", doc:"UBT-DP-06 Retention Schedule", sec:"§8 Event registrations"},
  lastRun:"38 minutes ago", evalsToday:1106, rowsAffected:412880, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Three-year event attendance trend",expect:"Returns 13 months and says so",status:"pass"},
    {name:"Event that closed 12 months ago",expect:"Still queryable",status:"pass"},
    {name:"Aggregate counts for older events",expect:"Held in Membership movement, not here",status:"pass"}
  ],
  preview:{sample:"reg", hide:[3], note:"Spring Conference 2025 closed more than 13 months ago. Its registrations are gone, not hidden — there is nothing to restore."},
  history:[
    {when:"01 Jan 2026",who:"Amira Rasool",what:"Rule created as part of the January retention programme."},
    {when:"03 Feb 2026",who:"Gugu Pillay",what:"First purge ran. 1.4 M rows removed, headline counts preserved in Membership movement."}
  ],
  incidents:0
},
{
  id:"r-attendance-def", name:"Attendance has one definition",
  sentence:"Count {{measure:Attendance}} as {{definition:a member with a confirmed check-in at a Regular or Special meeting}}, excluding {{exclude:cancelled meetings and duplicate check-ins within four hours}}",
  category:"metric", dimension:"Accuracy · Consistency",
  scope:{datasets:["meetings","checkins","growth"], fields:["attendance_rate","checked_in","expected"], tags:["Metric.Governed"]},
  condition:"meeting_type IN (Regular, Special) AND check-in confirmed",
  exception:"None. A second definition is a second number, and there is only one.",
  action:"Define metric", method:null,
  severity:"Warn", precedence:40, hitPolicy:"unique",
  owner:"Rupert Mackenzie",
  approvers:[{name:"Pavitra Govender",role:"Statistics Analyst",on:"10 Apr 2026"},{name:"Reneilwe Dlomo",role:"Delivery & Quality Manager",on:"11 Apr 2026"}],
  status:"Active", effectiveFrom:"12 Apr 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"—", doc:"UBT-ST-01 Metric Definitions", sec:"Attendance, version 3"},
  glossary:"Attendance",
  lastRun:"4 seconds ago", evalsToday:14206, rowsAffected:0, passRate:99.4,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Two check-ins 90 minutes apart",expect:"Counted once",status:"pass"},
    {name:"Youth meeting",expect:"Not counted — type is neither Regular nor Special",status:"pass"},
    {name:"Cancelled meeting with check-ins",expect:"Excluded from numerator and denominator",status:"pass"},
    {name:"Answer that ignores the definition",expect:"Warned, with a link to the glossary entry",status:"pass"}
  ],
  preview:{sample:"agg", affect:[{col:4,as:"94.2%",why:"Governed definition v3"}], rows:[0], note:"Asked without the rule, the same question returns 96.8% — duplicate check-ins counted twice. This is the number the division agreed on."},
  history:[
    {when:"14 Jan 2026",who:"Pavitra Govender",what:"Version 1 agreed. Duplicate window set at 2 hours."},
    {when:"12 Apr 2026",who:"Rupert Mackenzie",what:"Version 3 agreed. Duplicate window widened to 4 hours; Youth meetings moved out of scope."},
    {when:"14 Jun 2026",who:"Pavitra Govender",what:"Bound to the replacement Meetings & attendance dataset."}
  ],
  incidents:0
},
{
  id:"r-point-in-time", name:"Active member is measured at period end, not query time",
  sentence:"Evaluate {{measure:Active member}} as at {{when:the end of the reporting period}}, never as at {{not:query time}}, so that {{why:a report run twice returns the same number twice}}",
  category:"metric", dimension:"Accuracy · Consistency",
  scope:{datasets:["growth","members","meetings"], fields:["ValidTo","closing_members"], tags:["Metric.Governed"]},
  condition:"status evaluated at period_end",
  exception:"None.",
  action:"Define metric", method:null,
  severity:"Warn", precedence:41, hitPolicy:"unique",
  owner:"Sindi Mthembu",
  approvers:[{name:"Rupert Mackenzie",role:"Head of Statistics",on:"30 Jun 2026"}],
  status:"Active", effectiveFrom:"02 Jul 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"—", doc:"UBT-ST-01 Metric Definitions", sec:"Active member, version 4"},
  glossary:"Active member",
  lastRun:"9 minutes ago", evalsToday:6402, rowsAffected:0, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"March report re-run in August",expect:"Same figure as in March",status:"pass"},
    {name:"Member lapsed in May",expect:"Counted as active in the March report",status:"pass"},
    {name:"Current-month question",expect:"Uses yesterday's close, and says so",status:"pass"}
  ],
  preview:{sample:"agg", affect:[{col:2,as:"482",why:"As at 31 Jul 2026"}], rows:[0], note:"Run this report next March and it still says 482. Point-in-time is why historic answers do not quietly change."},
  history:[
    {when:"14 Jan 2026",who:"Sindi Mthembu",what:"Version 1 agreed after two boards received different numbers for the same month."},
    {when:"02 Jul 2026",who:"Sindi Mthembu",what:"Version 4 agreed. Transfers now resolve at period end rather than on the transfer date."}
  ],
  incidents:0
},
{
  id:"r-net-movement", name:"Net movement is calculated one way",
  sentence:"Calculate {{measure:Net movement}} as {{definition:joins plus transfers in, less transfers out, lapses and deaths}} over {{period:a complete calendar month}}",
  category:"metric", dimension:"Accuracy · Consistency",
  scope:{datasets:["growth"], fields:["net_movement","joins","transfers_in","transfers_out","lapses","deaths"], tags:["Metric.Governed"]},
  condition:"period is a complete calendar month",
  exception:"None. The current, incomplete month is excluded by design.",
  action:"Define metric", method:null,
  severity:"Warn", precedence:42, hitPolicy:"unique",
  owner:"Rupert Mackenzie",
  approvers:[{name:"Farida Padayachee",role:"Statistics Analyst",on:"27 Aug 2026"}],
  status:"In review", effectiveFrom:"01 Oct 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"—", doc:"UBT-ST-01 Metric Definitions", sec:"Net movement, version 2"},
  glossary:"Net movement",
  lastRun:"not yet — runs in shadow mode", evalsToday:0, rowsAffected:0, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Month with 12 joins and 3 lapses",expect:"Net +13 including 4 in, 0 out",status:"pass"},
    {name:"Question asked mid-month",expect:"Returns last complete month, and says which",status:"pass"},
    {name:"Locality that opened this month",expect:"No net movement row until the month closes",status:"pass"}
  ],
  preview:{sample:"agg", affect:[{col:3,as:"+13",why:"Net movement, version 2"}], rows:[0], note:"Version 2 pulls transfers into the calculation. Version 1 left them out, which is why two localities disagreed in July."},
  history:[
    {when:"01 Aug 2026",who:"Rupert Mackenzie",what:"Version 2 drafted to bring transfers into the calculation."},
    {when:"27 Aug 2026",who:"Farida Padayachee",what:"Approved by Statistics. Awaiting the National Office sign-off before it replaces version 1."}
  ],
  incidents:0
},
{
  id:"r-finance-restrict", name:"Budget data is Finance only, contributions are nobody's",
  sentence:"Only show {{scope:cost centre and budget rows}} to {{who:the Finance group and Platform Admins}}, and block {{deny:individual contribution data}} for {{except:everyone, with no exception}}",
  category:"exclusion", dimension:"Confidentiality",
  scope:{datasets:["budgets"], fields:["budget_nzd","actual_nzd","variance_nzd","consumed_pct"], tags:["Finance.Restricted"]},
  condition:"viewer IN (Finance, Platform Admins)",
  exception:"Access can be requested for a named cost centre and a stated purpose, time-boxed to 90 days",
  action:"Block dataset", method:null,
  severity:"Block", precedence:8, hitPolicy:"priority",
  owner:"Brendan Jooste",
  approvers:[{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"27 Jun 2026"},{name:"Ezra Haddad",role:"Head of Software — GST",on:"29 Jun 2026"}],
  status:"Active", effectiveFrom:"30 Jun 2026", effectiveTo:null, expiresIn:null,
  basis:{law:"—", doc:"UBT-FN-03 Financial Information Standard", sec:"§2 Access to budget data"},
  lastRun:"2 hours ago", evalsToday:288, rowsAffected:28140, passRate:100,
  exempt:{roles:["admin"],groups:["finance-team","platform-admins"]},
  tests:[
    {name:"Finance Analyst",expect:"Full access",status:"pass"},
    {name:"Travel Office asks about travel spend",expect:"Blocked, shown how to request",status:"pass"},
    {name:"Anyone asks about a member's contributions",expect:"Not in Spiff, and never will be",status:"pass"}
  ],
  preview:{sample:"fin", hide:[0,1,2,3,4], note:"Not allowed to see the data is a different answer from no data. This screen says which one it is, and how to ask."},
  history:[
    {when:"30 Jun 2026",who:"Brendan Jooste",what:"Rule created when the Finance mart was connected."},
    {when:"14 Aug 2026",who:"Adriaan de Villiers",what:"Request route added: a named cost centre, a stated purpose, 90 days, approved by the Finance Systems Lead."}
  ],
  incidents:0
},
{
  id:"r-pastoral-block", name:"Pastoral notes are never queryable",
  sentence:"Exclude {{fields:every field tagged Pastoral.Confidential}} from {{scope:Spiff entirely}} — not masked, not listed, not requestable — for {{except:everyone, including Platform Admins}}",
  category:"exclusion", dimension:"Safeguarding · Confidentiality",
  scope:{datasets:["care","members"], fields:["pastoral_note","care_flag","visit_note"], tags:["Pastoral.Confidential"]},
  condition:"field tagged Pastoral.Confidential",
  exception:"None, and none can be added. This rule is not overridable and not requestable.",
  action:"Never load", method:null,
  severity:"Block", precedence:0, hitPolicy:"priority",
  owner:"Cathleen Oberholzer",
  approvers:[{name:"Ezra Haddad",role:"Head of Software — GST",on:"08 Jan 2026"},{name:"Marcus Vilakazi",role:"Product Lead — Data",on:"08 Jan 2026"},{name:"Sindi Mthembu",role:"Records Officer",on:"09 Jan 2026"}],
  status:"Active", effectiveFrom:"10 Jan 2026", effectiveTo:null, expiresIn:null,
  locked:true,
  basis:{law:"POPIA §26 — Special personal information", doc:"UBT-SG-01 Safeguarding Standard", sec:"§1 Pastoral confidentiality"},
  lastRun:"continuous — enforced at the connector", evalsToday:0, rowsAffected:0, passRate:100,
  exempt:{roles:[],groups:[]},
  tests:[
    {name:"Platform Admin queries the field",expect:"The field is not in any schema Spiff can see",status:"pass"},
    {name:"Safeguarding Lead queries the field",expect:"Same — Spiff is not the tool for this",status:"pass"},
    {name:"Someone requests access",expect:"There is no request route to offer",status:"pass"}
  ],
  preview:{sample:"member", note:"The columns are not loaded, so there is nothing to show in either state."},
  history:[
    {when:"10 Jan 2026",who:"Cathleen Oberholzer",what:"Rule created before the Directory connector was switched on, so the fields were never ingested."},
    {when:"17 Apr 2026",who:"Ezra Haddad",what:"Editing locked at the platform level. Changing this rule needs a signed change to UBT-SG-01, not a click in this screen."},
    {when:"02 Jul 2026",who:"Sindi Mthembu",what:"Pastoral care notes listed in the catalogue as Blocked, so people stop searching for it."}
  ],
  incidents:0
},
{
  id:"r-legacy-minor", name:"Legacy under-18 row suppression",
  sentence:"Suppress {{scope:rows where the age band is Under 18}} for everyone except {{except:Safeguarding Leads}}",
  category:"exclusion", dimension:"Safeguarding",
  scope:{datasets:["meetings"], fields:["age_band"], tags:["Minor"]},
  condition:"age_band = 'Under 18'",
  exception:"Safeguarding Lead",
  action:"Filter rows", method:null,
  severity:"Redact silently", precedence:5, hitPolicy:"first",
  owner:"Cathleen Oberholzer",
  approvers:[{name:"Sindi Mthembu",role:"Records Officer",on:"12 Feb 2025"}],
  status:"Retired", effectiveFrom:"01 Mar 2025", effectiveTo:"14 Jun 2026", expiresIn:null,
  basis:{law:"Children's Act 38 of 2005 §13", doc:"UBT-SG-01 Safeguarding Standard", sec:"§2 Minors in reporting (superseded)"},
  lastRun:"14 Jun 2026", evalsToday:0, rowsAffected:0, passRate:100,
  exempt:{roles:["safeguard"],groups:["safeguarding"]},
  tests:[
    {name:"Youth attendance question",expect:"Rows removed entirely — the reason it was replaced",status:"pass"}
  ],
  preview:{sample:"member", hide:[1], note:"Retired on 14 Jun 2026. Kept here because an answer produced before that date was governed by this rule, not by its replacement."},
  history:[
    {when:"01 Mar 2025",who:"Cathleen Oberholzer",what:"Rule created. Removed under-18 rows outright."},
    {when:"22 May 2026",who:"Reneilwe Dlomo",what:"Flagged at review: dropping the rows made youth meetings look unattended rather than protected."},
    {when:"14 Jun 2026",who:"Cathleen Oberholzer",what:"Retired and superseded by r-minor-detail, which keeps the row and withholds the detail."}
  ],
  incidents:0
}
];

const ruleById = id => RULES.find(r=>r.id===id) || null;
const RULE_STATUSES = ["Draft","In review","Active","Suspended","Retired"];
const RULE_SEVERITIES = ["Block","Redact silently","Redact with notice","Warn","Log only"];
const RULE_SEVCLS = {"Block":"crit","Redact silently":"warn","Redact with notice":"warn","Warn":"info","Log only":"mut"};
const RULE_STATUSCLS = {"Active":"ok","In review":"info","Draft":"mut","Suspended":"warn","Retired":"mut"};
</script>
