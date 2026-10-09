<script>
/* =====================================================================
   SPIFF v2 — PORTAL CHAT DATA
   Conversations, skills and the connectors live in a conversation.
   Every number is invented but consistent with data/50-org.js.
   ===================================================================== */

/* ---------- helpers ---------- */
function mkCtx(datasets,connectors,files,extra){
  return Object.assign({
    datasets: datasets||["meetings"],
    connectors: connectors||["Directory","Connect"],
    files: files||[],
    runAs: "Thato Sekhoto",
    identity: "LDM Coordinator — Cape Localities · 12 of 312 localities",
    approval: "Ask every step",
    depth: "Quick answer",
    memory: "Project instructions: LDM Operations — attendance always uses the governed definition v3."
  }, extra||{});
}
function mkThread(o){
  return Object.assign({group:"Earlier",project:"LDM Operations",when:"",pinned:false,running:false,
    msgs:[],tasks:[],artifacts:[],context:mkCtx()}, o);
}

/* ---------- skills: the "/" palette ---------- */
/* Skills were removed from the product on 15 Sep 2026; nothing here is reachable. */

/* ---------- connectors live in this conversation ---------- */
const CHAT_CONNECTORS = (function(){
  var base = [
    {name:"Directory",     kind:"System of record", state:"active"},
    {name:"Assemble",      kind:"System of record", state:"active"},
    {name:"Connect", kind:"System of record", state:"active"},
    {name:"Orbit",         kind:"System of record", state:"degraded"},
    {name:"Finance",       kind:"System of record", state:"no access"}
  ];
  try{
    if(typeof CONNECTORS!=="undefined" && Array.isArray(CONNECTORS) && CONNECTORS.length){
      return CONNECTORS.filter(function(c){return c && c.name;}).slice(0,6).map(function(c){
        return {name:c.name, kind:c.kind||c.type||"Data source", state:c.state||c.status||"active"};
      });
    }
  }catch(e){}
  return base;
})();

/* ---------- conversations ---------- */
const THREADS = [

/* === 1. straightforward question, then a follow-up that diffs the tokens === */
mkThread({id:"t-ldm", title:"LDM meetings in my subdivisions, last quarter", group:"Today", project:"LDM Operations",
  when:"09:14", pinned:true,
  context:mkCtx(["meetings","localities","appointments"],["Connect","Directory"],[],
    {approval:"Ask before writes — a read-only run", depth:"Quick answer"}),
  artifacts:[{id:"a-ldm", name:"LDM meetings by subdivision — Q3 2026", kind:"Answer", version:"v2",
    versions:[["v2","today 09:15","Suppression note added after two localities fell below 5"],["v1","today 09:14","First run"]],
    updated:"today 09:15", rows:"6 subdivisions", note:"Re-runs per viewer. Someone in the Polokwane Cluster opening this sees their own four subdivisions, not yours."}],
  msgs:[
    {role:"me", text:"How many LDM meetings ran in my subdivisions last quarter?"},
    {role:"spiff",
      text:"Your subdivisions held <b>142 LDM meetings</b> last quarter, up 11% on the quarter before. Lorraine and Bethel carried the volume. <b>Oakridge</b> is the one to watch — down 18%, with attendance under 70% for the first time this year.",
      tokens:[{t:"m",label:"Meetings"},{t:"a",label:"by Subdivision"},{t:"f",label:"Last quarter · Jul–Sep 2026"},{t:"f",label:"My subdivisions"}],
      trace:[
        {tool:"catalog.resolve", target:"Meetings & attendance", detail:"Matched \"LDM meetings\" to Connect.UserLogEvents — verified, refreshed 06:10", ms:180, state:"done"},
        {tool:"definition.load", target:"Attendance v3", detail:"Governed definition: confirmed check-in, Regular or Special, duplicates inside four hours dropped", ms:40, state:"done"},
        {tool:"access.check", target:"thato.sekhoto@ubteam.com", detail:"Rule r-locality-scope · 12 of 312 localities · re-checked at run time", ms:60, state:"done"},
        {tool:"connect.query", target:"Connect.UserLogEvents", detail:"1.42 M rows scanned, grouped to 6 subdivisions", ms:2140, state:"done"},
        {tool:"rules.apply", target:"r-small-count", detail:"Two localities under 5 members folded into their subdivision totals", ms:40, state:"done"},
        {tool:"verify.controls", target:"ldm_meeting v3", detail:"142 reconciles with the LDM control total for the quarter", ms:310, state:"done"}
      ],
      answer:"ldm",
      sources:[{dataset:"meetings", rows:"1.42 M scanned", suppressed:"2 localities under 5"},{dataset:"localities", rows:"138 read", suppressed:"none"}],
      confidence:"High — one certified dataset, one governed definition, control total matched.",
      scope:"Your view · 12 of 312 localities",
      feedback:"up"},
    {role:"me", text:"Compare that against the same quarter last year"},
    {role:"spiff",
      text:"Up <b>23% year on year</b> — 142 meetings against 115 in Q3 2025. Every subdivision grew except <b>Oakridge</b>, which is 9% down on last year as well as on last quarter. That makes it a trend, not a bad quarter.",
      tokens:[{t:"m",label:"Meetings"},{t:"a",label:"by Subdivision"},{t:"f",label:"Q3 2026 vs Q3 2025",changed:true},{t:"f",label:"My subdivisions"}],
      diffNote:"One thing changed: the timeframe. Same measure, same grouping, same scope.",
      trace:[
        {tool:"reuse.plan", target:"previous turn", detail:"Measure, grouping and scope carried forward unchanged", ms:20, state:"done"},
        {tool:"connect.query", target:"Connect.UserLogEvents", detail:"Second window Jul–Sep 2025 · 1.31 M rows scanned", ms:1980, state:"done"},
        {tool:"verify.controls", target:"ldm_meeting v3", detail:"Both windows reconcile; no definition change between them", ms:290, state:"done"}
      ],
      answer:"ldm_yoy",
      sources:[{dataset:"meetings", rows:"2.73 M scanned across both windows", suppressed:"2 localities under 5"}],
      confidence:"High — the definition of a meeting did not change between the two windows.",
      scope:"Your view · 12 of 312 localities"}
  ]}),

/* === 2. long agentic run: plan, trace, tasks, artifact, pending approval === */
mkThread({id:"t-pack", title:"Build the quarterly attendance pack for Stellenbosch Cluster", group:"Today", project:"LDM Operations",
  when:"08:40",
  context:mkCtx(["meetings","localities","appointments","growth"],["Connect","Directory"],
    [{name:"Q2-attendance-pack.xlsx", size:"84 KB", when:"uploaded 08:41", note:"used as the shape to match"}],
    {approval:"Ask every step — this run publishes", depth:"Thorough answer"}),
  tasks:[
    {n:1, label:"Read the Q2 pack and copy its shape",        activeForm:"Reading the Q2 pack",              state:"done"},
    {n:2, label:"Pull attendance for all 138 localities",     activeForm:"Pulling attendance",               state:"done"},
    {n:3, label:"Flag localities under the 70% threshold",    activeForm:"Flagging localities",              state:"done"},
    {n:4, label:"Check every flag against the meeting log",   activeForm:"Checking flags",                   state:"done"},
    {n:5, label:"Reconcile totals with the LDM control total",activeForm:"Reconciling totals",               state:"done"},
    {n:6, label:"Write the pack and the covering note",       activeForm:"Writing the pack",                 state:"done"},
    {n:7, label:"Publish to the LDM Operations library",      activeForm:"Waiting for your approval",        state:"pending"}
  ],
  artifacts:[{id:"a-pack", name:"Stellenbosch Cluster attendance pack — Q3 2026", kind:"Live report", version:"v3",
    versions:[["v3","today 08:57","Threshold note reworded; two suppressed localities called out by name of rule"],["v2","today 08:52","Added the movement column"],["v1","today 08:47","First draft, shape copied from Q2"]],
    updated:"today 08:57", rows:"138 localities · 3 countries", note:"Publishing this shares the pack, not the numbers. Every viewer's copy re-runs against their own access — a Polokwane Cluster reader opening it sees an empty Stellenbosch section, not your rows."}],
  msgs:[
    {role:"me", text:"Build the quarterly attendance pack for Stellenbosch Cluster, same shape as Q2. Flag anything under 70% and tell me why."},
    {role:"spiff",
      text:"Here is what I intend to do. Read it before I start — this run ends in a publish, so I will stop and ask before that step.",
      plan:[
        {label:"Read the Q2 pack you uploaded and copy its section order", note:"Shape only. I will not reuse its numbers."},
        {label:"Pull attendance for all 138 localities you cover", note:"Meetings & attendance, governed definition v3"},
        {label:"Flag every locality under 70% for the quarter", note:"Threshold from the Q2 pack, not invented"},
        {label:"Check each flag against the meeting log before it goes in", note:"A locality that held no meeting is a different problem from one with poor turnout"},
        {label:"Reconcile the totals against the LDM control total", note:"If they disagree I stop and tell you"},
        {label:"Write the pack and a covering note", note:"Plain English, one page"},
        {label:"Publish to the LDM Operations library", note:"Needs your approval — it is the only step that writes anything"}
      ],
      scope:"Your view · 12 of 312 localities"},
    {role:"me", text:"Go ahead."},
    {role:"spiff",
      text:"Pack built. <b>138 localities</b>, <b>19 flagged</b> under 70%. Eleven of the nineteen are genuine turnout problems. Six held fewer meetings than scheduled, so the rate is thin rather than low. Two are suppressed — they have fewer than five expected members and the small-count rule holds them back, so I have counted them in the totals but not named them.",
      tokens:[{t:"m",label:"Attendance rate"},{t:"a",label:"by Locality"},{t:"f",label:"Q3 2026"},{t:"f",label:"Stellenbosch Cluster"},{t:"f",label:"Under 70%"}],
      trace:[
        {tool:"file.read", target:"Q2-attendance-pack.xlsx", detail:"Seven sections, four columns each, 70% threshold read from the header note", ms:420, state:"done"},
        {tool:"catalog.resolve", target:"Meetings & attendance", detail:"Verified by Pavitra Govender, 14 Jun 2026", ms:150, state:"done"},
        {tool:"access.check", target:"thato.sekhoto@ubteam.com", detail:"12 of 312 localities · Locality Secretary + Report Author", ms:60, state:"done"},
        {tool:"connect.query", target:"Connect.UserLogEvents", detail:"3.1 M rows scanned across 138 localities", ms:4820, state:"done"},
        {tool:"connect.query", target:"directory.fct_appointment", detail:"Secretary appointments joined to explain six of the flags", ms:1240, state:"done"},
        {tool:"rules.apply", target:"r-small-count", detail:"Elmsdale and Marlow held back — under 5 expected members", ms:70, state:"done"},
        {tool:"verify.controls", target:"attendance_rate v3", detail:"Cluster total 76.4% reconciles to 0.1 pt of the control total", ms:640, state:"done"},
        {tool:"artifact.write", target:"Stellenbosch Cluster attendance pack — Q3 2026", detail:"v3 written to your workspace. Not shared with anyone yet.", ms:310, state:"done"},
        {tool:"library.publish", target:"Team library · LDM Operations", detail:"Held — waiting for your approval", ms:0, state:"denied"}
      ],
      result:{stats:[{v:"138",l:"Localities"},{v:"19",l:"Under 70%",d:"+4 vs Q2"},{v:"76.4%",l:"Cluster attendance",d:"−1.2 pts"},{v:"2",l:"Suppressed"}],
        table:{cols:["Locality","Locality","Attendance","Meetings held","Why"],
          rows:[["Oakridge","Stellenbosch","68%","12 of 15","Two host families relocated in June"],
                ["Kingsford","Bloemfontein","64%","9 of 15","No secretary appointed since March"],
                ["Marlow","Makhanda","66%","14 of 15","Venue change mid-quarter"],
                ["Dunmore","Pietermaritzburg","69%","15 of 15","Genuine turnout decline, no structural cause found"],
                ["Fairview","Stellenbosch","61%","7 of 15","Meetings not held — this is a scheduling problem, not attendance"]]}},
      sources:[{dataset:"meetings", rows:"3.1 M scanned", suppressed:"2 localities under 5"},{dataset:"appointments", rows:"74 k read", suppressed:"none"},{dataset:"localities", rows:"138 read", suppressed:"none"}],
      confidence:"High on the counts. Medium on the causes — six of them come from the appointment log, five are my reading of the meeting pattern and are worth checking with the secretary.",
      scope:"Your view · 12 of 312 localities",
      approve:{tool:"library.publish", intent:"Publish the pack to the LDM Operations team library",
        args:{"Output":"Stellenbosch Cluster attendance pack — Q3 2026 (v3)",
              "Destination":"Team library · LDM Operations",
              "Audience":"LDM Coordinators — 34 people",
              "Refresh":"Weekly, Monday 07:00",
              "Runs as":"Thato Sekhoto",
              "Each viewer sees":"their own localities only — the pack re-runs per viewer"},
        target:"Team library · LDM Operations", runAs:"Thato Sekhoto",
        note:"This is the only step in the run that writes anything. Nothing is shared until you allow it."}}
  ]}),

/* === 3. the permission wall === */
mkThread({id:"t-budget", title:"Travel spend against budget by locality", group:"Today", project:"Travel & Logistics",
  when:"10:02",
  context:mkCtx(["travel","budgets","localities"],["Orbit","Connect"],[],
    {approval:"Auto — read only", depth:"Quick answer",
     note:"Finance is connected to Spiff but not to you. It appears here because the question needs it, greyed because you cannot reach it."}),
  msgs:[
    {role:"me", text:"How does travel spend compare against budget by locality this quarter?"},
    {role:"spiff",
      text:"I can give you half of this. <b>Travel spend I can see</b> — NZ$ 241,000 across your localities this quarter. <b>Budget I cannot</b>, so there is no comparison in this answer and I have not estimated one.",
      tokens:[{t:"m",label:"Travel spend"},{t:"m",label:"Budget",blocked:true},{t:"a",label:"by Locality"},{t:"f",label:"Q3 2026"}],
      trace:[
        {tool:"catalog.resolve", target:"Travel bookings", detail:"orbit.fct_booking — warning: supplier feed late three times this month", ms:170, state:"done"},
        {tool:"catalog.resolve", target:"Cost centres & budgets", detail:"finance.mart_budget — resolved, then refused", ms:90, state:"done"},
        {tool:"access.check", target:"thato.sekhoto@ubteam.com", detail:"Not a member of any group holding finance.mart_budget", ms:60, state:"denied"},
        {tool:"connect.query", target:"orbit.fct_booking", detail:"312 k rows scanned, grouped to 12 localities", ms:2610, state:"done"}
      ],
      result:{stats:[{v:"NZ$ 241,000",l:"Travel spend, Q3"},{v:"4",l:"Localities shown"},{v:"—",l:"Budget",d:"no access"}],
        table:{cols:["Locality","Flights","Hotel nights","Spend","Budget"],
          rows:[["Stellenbosch","412","688","NZ$ 81,240","Not available to you"],
                ["Pietermaritzburg","368","602","NZ$ 70,490","Not available to you"],
                ["Makhanda","241","410","NZ$ 49,610","Not available to you"],
                ["Bloemfontein","198","331","NZ$ 39,660","Not available to you"]]}},
      wall:{rule:"r-finance-restrict", ruleName:"Finance data is held by the Finance group only",
        dataset:"budgets", datasetName:"Cost centres & budgets",
        says:"Budget and actuals are restricted to the Finance group. Access is granted by group, never per person, and never per question.",
        approver:"Brendan Jooste — Finance Systems Lead",
        alt:"Colette Marais in the Travel Office already holds this dataset. If the comparison is for a travel review, asking her is faster than a grant."},
      sources:[{dataset:"travel", rows:"312 k scanned", suppressed:"traveller names outside your ±30 day window"},{dataset:"budgets", rows:"0 — access denied", suppressed:"the whole dataset"}],
      confidence:"Medium on the spend. The Orbit supplier feed has been late three times this month, so bookings after 20 Aug may be incomplete.",
      scope:"Your view · 12 of 312 localities"}
  ]}),

/* === 4. mid-run === */
mkThread({id:"t-travel", title:"Reconcile Orbit bookings against the September gathering", group:"Today", project:"Travel & Logistics",
  when:"running now", running:true,
  context:mkCtx(["travel","itineraries","registrations","events"],["Orbit","Assemble","Directory"],[],
    {approval:"Ask every step", depth:"Thorough answer"}),
  tasks:[
    {n:1, label:"List everyone registered for the October gathering", activeForm:"Listing registrations", state:"done"},
    {n:2, label:"Match each registration to an Orbit booking",        activeForm:"Matching bookings",      state:"done"},
    {n:3, label:"Find registrations with no travel booked",           activeForm:"Finding gaps",           state:"running"},
    {n:4, label:"Find bookings with no return leg",                   activeForm:"Checking return legs",   state:"pending"},
    {n:5, label:"Write the exception list",                           activeForm:"Writing the list",       state:"pending"}
  ],
  artifacts:[{id:"a-travel", name:"October gathering — travel exceptions", kind:"Live report", version:"draft",
    versions:[["draft","building now","First pass, not finished"]],
    updated:"building now", rows:"partial", note:"Still being written. Nothing has been shared."}],
  msgs:[
    {role:"me", text:"Reconcile Orbit bookings against the October gathering registrations. I want a list of who is coming but has nothing booked."},
    {role:"spiff",
      text:"Working through it now. Three of five steps done. <b>386 registrations</b> matched so far; <b>41</b> have no booking against them, but I have not finished checking whether some of those are local and do not need travel.",
      tokens:[{t:"m",label:"Registrations"},{t:"m",label:"Bookings"},{t:"a",label:"by Member"},{t:"f",label:"Regional Youth Gathering · Oct 2026"}],
      trace:[
        {tool:"catalog.resolve", target:"Event registrations", detail:"assemble.fct_registration — verified 19 Jul 2026", ms:160, state:"done"},
        {tool:"connect.query", target:"assemble.fct_registration", detail:"386 registrations for event EVT-2140", ms:1420, state:"done"},
        {tool:"connect.query", target:"orbit.fct_booking", detail:"345 bookings matched on member id", ms:3110, state:"done"},
        {tool:"rules.apply", target:"r-travel-window", detail:"Traveller names withheld for 118 bookings outside your ±30 day window", ms:80, state:"done"},
        {tool:"connect.query", target:"directory.dim_member", detail:"Checking home locality for the 41 unmatched registrations", ms:0, state:"running"}
      ],
      scope:"Your view · 12 of 312 localities · running since 10:11"}
  ]}),

/* === the rest: shorter conversations === */
mkThread({id:"t-quiet", title:"Which localities haven't held a meeting in 60 days?", group:"Today", project:"LDM Operations", when:"07:55",
  context:mkCtx(["meetings","localities"],["Connect","Directory"]),
  artifacts:[{id:"a-quiet", name:"Quiet localities — 60 day watchlist", kind:"Answer", version:"v1",
    versions:[["v1","today 07:55","First run"]], updated:"today 07:55", rows:"9 localities", note:"Re-runs per viewer."}],
  msgs:[
    {role:"me", text:"Which localities haven't held a meeting in 60 days?"},
    {role:"spiff", text:"<b>Nine localities</b> in your localities have no recorded meeting in over 60 days. Three are past 90 — <b>Elmsdale</b>, <b>Kingsford</b> and <b>Marlow</b>. Between them that is 612 members with nothing on the calendar.",
      tokens:[{t:"m",label:"Days since last meeting"},{t:"a",label:"by Locality"},{t:"f",label:"Over 60 days"},{t:"f",label:"My localities"}],
      trace:[
        {tool:"catalog.resolve", target:"Meetings & attendance", detail:"Latest meeting date per locality", ms:150, state:"done"},
        {tool:"access.check", target:"thato.sekhoto@ubteam.com", detail:"Rule r-locality-scope · 12 of 312 localities", ms:50, state:"done"},
        {tool:"connect.query", target:"Connect.UserLogEvents", detail:"138 localities checked, 9 over threshold", ms:1740, state:"done"}
      ],
      answer:"stale",
      sources:[{dataset:"meetings", rows:"1.4 M scanned", suppressed:"none"},{dataset:"localities", rows:"138 read", suppressed:"none"}],
      confidence:"High — this is a date comparison on a certified dataset.",
      scope:"Your view · 12 of 312 localities"}
  ]}),

mkThread({id:"t-defn", title:"What exactly counts as attendance?", group:"Today", project:"LDM Operations", when:"07:20",
  context:mkCtx(["meetings"],["Connect"],[],{depth:"Quick answer"}),
  msgs:[
    {role:"me", text:"What exactly counts as attendance? Two of my secretaries are counting it differently."},
    {role:"spiff", text:"There is one agreed definition and it is version 3, signed off by <b>Rupert Mackenzie</b> on 12 April 2026. Attendance is a member with a confirmed check-in at a meeting of type Regular or Special. Cancelled meetings are excluded. Duplicate check-ins inside four hours count once. Nine answers in your library use this definition, so if your secretaries disagree, one of them is counting visitors — those are recorded separately and are not in this number.",
      tokens:[{t:"a",label:"Attendance"},{t:"f",label:"Definition v3"}],
      trace:[{tool:"definition.load", target:"Attendance v3", detail:"Owner Rupert Mackenzie · agreed 12 Apr 2026 · used by 9 answers", ms:60, state:"done"}],
      sources:[{dataset:"meetings", rows:"definition only, no rows read", suppressed:"none"}],
      confidence:"High — this is the signed-off wording, not my paraphrase.",
      scope:"Definitions are the same for everyone. This one is not scoped."}
  ]}),

mkThread({id:"t-growth", title:"Member growth by locality this year", group:"Yesterday", project:"Statistics", when:"Yesterday 16:30",
  context:mkCtx(["growth","members","localities"],["Directory","Connect"]),
  artifacts:[{id:"a-growth", name:"Member growth by locality — YTD 2026", kind:"Answer", version:"v1",
    versions:[["v1","yesterday 16:30","First run"]], updated:"yesterday 16:30", rows:"5 localities", note:"Aggregate only. This dataset has no detail rows by design."}],
  msgs:[
    {role:"me", text:"Member growth by locality this year"},
    {role:"spiff", text:"Net membership grew <b>+3,240</b> across your localities this year, a lift of <b>4.2%</b>. Stellenbosch and Pretoria drove most of it. Polokwane is flat at +0.4% and worth a proper look.",
      tokens:[{t:"m",label:"Net movement"},{t:"a",label:"by Locality"},{t:"f",label:"YTD 2026"}],
      trace:[
        {tool:"catalog.resolve", target:"Membership movement", detail:"warehouse.mart_member_growth — aggregate only by design", ms:140, state:"done"},
        {tool:"rules.apply", target:"r-round-base5", detail:"Locality figures rounded to base 5 before aggregation", ms:40, state:"done"},
        {tool:"connect.query", target:"warehouse.mart_member_growth", detail:"41 k rows read, grouped to 5 localities", ms:980, state:"done"}
      ],
      answer:"growth",
      sources:[{dataset:"growth", rows:"41 k read", suppressed:"current incomplete month excluded by design"}],
      confidence:"High — the statutory mart, reconciled monthly.",
      scope:"Your view · 12 of 312 localities",
      feedback:"up"}
  ]}),

mkThread({id:"t-shrink", title:"Which localities shrank two years running?", group:"Yesterday", project:"Statistics", when:"Yesterday 15:05",
  context:mkCtx(["growth","localities"],["Connect"]),
  msgs:[
    {role:"me", text:"Which localities shrank two years running?"},
    {role:"spiff", text:"<b>Seven localities</b> in your localities have negative net movement in both 2025 and 2026 to date. Kingsford is the steepest at −6.1% over the two years. Three of the seven also appear on your 60-day quiet list, which is probably the same story told twice.",
      tokens:[{t:"m",label:"Net movement"},{t:"a",label:"by Locality"},{t:"f",label:"Negative in 2025 and 2026"},{t:"f",label:"My localities"}],
      trace:[
        {tool:"connect.query", target:"warehouse.mart_member_growth", detail:"Two complete-year windows compared per locality", ms:1610, state:"done"},
        {tool:"rules.apply", target:"r-small-count", detail:"One locality under 5 held back", ms:40, state:"done"}
      ],
      result:{stats:[{v:"7",l:"Localities"},{v:"−6.1%",l:"Steepest — Kingsford",d:"two years"},{v:"3",l:"Also quiet 60+ days"}],
        table:{cols:["Locality","Locality","2025","2026 YTD","Two-year"],
          rows:[["Kingsford","Bloemfontein","−3.4%","−2.7%","−6.1%"],["Elmsdale","Makhanda","−2.9%","−1.8%","−4.7%"],["Marlow","Makhanda","−2.1%","−2.0%","−4.1%"],["Dunmore","Pietermaritzburg","−1.6%","−0.9%","−2.5%"],["Fairview","Stellenbosch","−1.2%","−0.8%","−2.0%"]]}},
      sources:[{dataset:"growth", rows:"41 k read", suppressed:"1 locality under 5"}],
      confidence:"High on the movement. The link to the quiet list is my observation, not a governed metric.",
      scope:"Your view · 12 of 312 localities"}
  ]}),

mkThread({id:"t-events", title:"Registrations below capacity for October", group:"Yesterday", project:"Events", when:"Yesterday 11:48",
  context:mkCtx(["events","registrations"],["Assemble"]),
  msgs:[
    {role:"me", text:"Which October events are registered below capacity?"},
    {role:"spiff", text:"<b>Eleven of nineteen</b> October events are under capacity. Two are badly under — the Youth Gathering in Pretoria at 46% and the Care training in Polokwane at 38%. Both are outside your localities, so I can show you the fill rate but not the registrant detail.",
      tokens:[{t:"m",label:"Fill rate"},{t:"a",label:"by Event"},{t:"f",label:"October 2026"},{t:"f",label:"Under capacity"}],
      trace:[
        {tool:"connect.query", target:"assemble.dim_event", detail:"19 approved October events", ms:620, state:"done"},
        {tool:"rules.apply", target:"r-locality-scope", detail:"Registrant detail withheld for 6 events outside your localities; counts still shown", ms:60, state:"done"}
      ],
      result:{stats:[{v:"19",l:"October events"},{v:"11",l:"Under capacity"},{v:"38%",l:"Lowest fill",d:"Care training"}],
        table:{cols:["Event","Locality","Capacity","Registered","Fill"],
          rows:[["Regional Youth Gathering","Pretoria","450","208","46%"],["Care training","Polokwane","120","46","38%"],["Stellenbosch planning day","Stellenbosch","180","141","78%"],["Coastal service","Pietermaritzburg","300","264","88%"]]}},
      sources:[{dataset:"events", rows:"9.7 k read", suppressed:"none"},{dataset:"registrations", rows:"2.1 M scanned", suppressed:"registrant detail for 6 events outside your localities"}],
      confidence:"High — counts are certified. Fill rate depends on capacity being kept current, which it is for 17 of the 19.",
      scope:"Your view · counts national, detail 12 of 312 localities"}
  ]}),

mkThread({id:"t-noshow", title:"No-show rate by event type", group:"Yesterday", project:"Events", when:"Yesterday 09:12",
  context:mkCtx(["registrations","events"],["Assemble"]),
  msgs:[
    {role:"me", text:"No-show rate by event type"},
    {role:"spiff", text:"Across the last four quarters the overall no-show rate is <b>6.4%</b>. Training events are the outlier at 14.1% — nearly three times the rate for services. Worth noting that registrations are purged 13 months after an event closes, so anything before Jul 2025 is not in this number.",
      tokens:[{t:"m",label:"No-show rate"},{t:"a",label:"by Event type"},{t:"f",label:"Last 4 quarters"}],
      trace:[
        {tool:"connect.query", target:"assemble.fct_registration", detail:"1.1 M registrations in window, grouped to 5 types", ms:2210, state:"done"},
        {tool:"rules.apply", target:"r-retention-reg", detail:"Window truncated at 13 months — retention rule, not missing data", ms:50, state:"done"}
      ],
      result:{stats:[{v:"6.4%",l:"Overall no-show"},{v:"14.1%",l:"Training",d:"worst"},{v:"4.9%",l:"Service",d:"best"}],
        table:{cols:["Event type","Registered","Attended","No-show"],
          rows:[["Training","18,400","15,806","14.1%"],["Youth","41,200","38,364","6.9%"],["Conference","22,900","21,502","6.1%"],["Care","9,800","9,222","5.9%"],["Service","64,100","60,959","4.9%"]]}},
      sources:[{dataset:"registrations", rows:"1.1 M scanned", suppressed:"none"}],
      confidence:"High within the window. The 13-month retention rule means this is not a long-run trend and should not be read as one.",
      scope:"Your view · 12 of 312 localities",
      feedback:"down"}
  ]}),

mkThread({id:"t-assemble", title:"Meeting counts per province", group:"Last 7 days", project:"Statistics", when:"Tue 14:20", pinned:true,
  context:mkCtx(["meetings","localities"],["Connect","Directory"]),
  artifacts:[{id:"a-assemble", name:"Meetings by province — Q3 2026", kind:"Answer", version:"v2",
    versions:[["v2","Tue 14:24","Map added"],["v1","Tue 14:20","First run"]], updated:"Tue 14:24", rows:"9 provinces", note:"Counts are national; detail rows stay scoped per viewer."}],
  msgs:[
    {role:"me", text:"Show meeting counts per province"},
    {role:"spiff", text:"<b>930 meetings</b> ran nationally this quarter. Pretoria and the Stellenbosch carry the volume; Kimberley is the quietest province by a wide margin at 33.",
      tokens:[{t:"m",label:"Meetings"},{t:"a",label:"by Province"},{t:"f",label:"Q3 2026"}],
      trace:[
        {tool:"connect.query", target:"Connect.UserLogEvents", detail:"Aggregated to 9 provinces", ms:1880, state:"done"},
        {tool:"rules.apply", target:"r-locality-scope", detail:"Counts are aggregate and unscoped. Detail rows would be scoped to your 12 localities.", ms:50, state:"done"}
      ],
      answer:"assemble_regions",
      sources:[{dataset:"meetings", rows:"1.42 M scanned", suppressed:"none at this grain"}],
      confidence:"High — aggregate counts on a certified dataset.",
      scope:"Aggregate counts, all provinces · detail would be 12 of 312 localities"}
  ]}),

mkThread({id:"t-steyn", title:"Trace John Steyn's planned activities next month", group:"Last 7 days", project:"Travel & Logistics", when:"Tue 09:40",
  context:mkCtx(["members","travel","itineraries","events"],["Directory","Orbit","Assemble"],[],{approval:"Ask every step"}),
  msgs:[
    {role:"me", text:"Can you trace John Steyn's planned activities for next month?"},
    {role:"spiff", text:"Next month John Steyn travels to <b>Northgate</b> for a Stellenbosch divisional event. I traced the whole journey across four systems — the invitation, the flight, car and hotel in Orbit, and the meeting check-in in Connect — all correlated on his member id. He is inside your locality, which is why his name is showing.",
      tokens:[{t:"m",label:"Activities"},{t:"a",label:"John Steyn"},{t:"f",label:"Sep 2026"},{t:"f",label:"Within ±30 days"}],
      trace:[
        {tool:"access.check", target:"MBR-40118", detail:"Same locality as you — name shown. Outside it the traveller name is withheld.", ms:70, state:"done"},
        {tool:"rules.apply", target:"r-travel-window", detail:"Travel is inside your ±30 day window, so booking detail is available", ms:50, state:"done"},
        {tool:"connect.query", target:"orbit.fct_itinerary", detail:"One journey, six booking lines", ms:1960, state:"done"},
        {tool:"connect.query", target:"Connect.UserLogEvents", detail:"Two linked meetings found", ms:840, state:"done"}
      ],
      answer:"steyn_journey",
      sources:[{dataset:"members", rows:"1 read", suppressed:"none — same locality"},{dataset:"itineraries", rows:"1 journey", suppressed:"none in window"},{dataset:"travel", rows:"6 lines", suppressed:"document numbers never loaded"}],
      confidence:"Medium — Orbit is running late and one hotel line was written after the last load.",
      scope:"Your view · same-locality detail"}
  ]}),

mkThread({id:"t-secretary", title:"Localities with no secretary appointed", group:"Last 7 days", project:"LDM Operations", when:"Mon 16:02",
  context:mkCtx(["appointments","localities"],["Directory"]),
  msgs:[
    {role:"me", text:"Which localities have no secretary appointed?"},
    {role:"spiff", text:"<b>Six localities</b> in your localities have no current Locality Secretary. Kingsford has been vacant longest at 174 days, and it is also the worst attendance in your cluster — those two facts are almost certainly the same fact.",
      tokens:[{t:"m",label:"Appointments"},{t:"a",label:"by Locality"},{t:"f",label:"No current secretary"},{t:"f",label:"My localities"}],
      trace:[
        {tool:"connect.query", target:"directory.fct_appointment", detail:"138 localities checked against current appointments", ms:1120, state:"done"},
        {tool:"rules.apply", target:"r-locality-scope", detail:"12 of 312 localities", ms:40, state:"done"}
      ],
      result:{stats:[{v:"6",l:"Vacant"},{v:"174 d",l:"Longest — Kingsford"},{v:"2,140",l:"Members affected"}],
        table:{cols:["Locality","Locality","Vacant since","Days","Members"],
          rows:[["Kingsford","Bloemfontein","10 Mar 2026","174","412"],["Elmsdale","Makhanda","02 May 2026","121","288"],["Marlow","Makhanda","19 Jun 2026","73","341"],["Dunmore","Pietermaritzburg","04 Jul 2026","58","502"]]}},
      sources:[{dataset:"appointments", rows:"74 k read", suppressed:"none"},{dataset:"localities", rows:"138 read", suppressed:"none"}],
      confidence:"High — the appointment log is the record, and it is current to this morning.",
      scope:"Your view · 12 of 312 localities"}
  ]}),

mkThread({id:"t-bounce", title:"Localities with the most bounced emails", group:"Last 7 days", project:"Membership & Care", when:"Mon 10:15",
  context:mkCtx(["comms","members","localities"],["Connect","Directory"]),
  msgs:[
    {role:"me", text:"Which localities have the most bounced emails?"},
    {role:"spiff", text:"Overall delivery is <b>96.1%</b>, so bounces are not a systemic problem. Three localities sit well below that — <b>Fairview</b> at 82%, <b>Marlow</b> at 86%, <b>Elmsdale</b> at 88%. Recipient identity is hashed for everyone including me, so I can tell you where, not who.",
      tokens:[{t:"m",label:"Delivery rate"},{t:"a",label:"by Locality"},{t:"f",label:"Email"},{t:"f",label:"Last 90 days"}],
      trace:[
        {tool:"catalog.resolve", target:"Notices & delivery", detail:"warehouse.fct_notice_delivery — draft dataset, definitions may still change", ms:150, state:"done"},
        {tool:"rules.apply", target:"r-contact-mask", detail:"Recipient identity hashed for all viewers, by design", ms:50, state:"done"},
        {tool:"connect.query", target:"warehouse.fct_notice_delivery", detail:"412 k notices in window", ms:2040, state:"done"}
      ],
      result:{stats:[{v:"96.1%",l:"Delivery rate"},{v:"3",l:"Localities below 90%"},{v:"hashed",l:"Recipient identity"}],
        table:{cols:["Locality","Sent","Delivered","Bounced","Rate"],
          rows:[["Fairview","2,410","1,976","434","82.0%"],["Marlow","1,880","1,617","263","86.0%"],["Elmsdale","3,102","2,730","372","88.0%"],["Bellville","8,940","8,681","259","97.1%"]]}},
      sources:[{dataset:"comms", rows:"412 k scanned", suppressed:"recipient identity hashed for all viewers"}],
      confidence:"Medium — this dataset is still draft, and its completeness score is 85%.",
      scope:"Your view · 12 of 312 localities"}
  ]}),

mkThread({id:"t-weekly", title:"Weekly LDM summary — automation draft", group:"Earlier", project:"LDM Operations", when:"21 Aug",
  context:mkCtx(["meetings","localities","appointments"],["Connect","Directory"],[],{approval:"Ask every step"}),
  artifacts:[{id:"a-weekly", name:"Weekly LDM summary", kind:"Automation", version:"v4",
    versions:[["v4","21 Aug 08:00","Threshold moved to 70%"],["v3","07 Aug 08:00","Added the vacancy section"],["v2","24 Jul 08:00","Trimmed to one page"],["v1","10 Jul 08:00","First version"]],
    updated:"runs Mondays 07:00", rows:"138 localities", note:"This automation runs as you. If you share it, the recipient gets their own copy that runs as them — it is a clone, not a viewer seat."}],
  msgs:[
    {role:"me", text:"Turn this into something that lands in my inbox every Monday morning."},
    {role:"spiff", text:"Built. <b>Weekly LDM summary</b> runs Mondays at 07:00 and belongs to you. It runs as you, re-checks your access each time, and if your localities change the summary changes with them without anyone editing it.<br><br>If you share it with another coordinator they get their own copy, owned by them and scoped to their localities. Nothing about your access travels with it.",
      tokens:[{t:"m",label:"Meetings"},{t:"m",label:"Attendance rate"},{t:"a",label:"by Locality"},{t:"f",label:"Last 7 days"},{t:"f",label:"Under 70%"}],
      trace:[
        {tool:"automation.create", target:"Weekly LDM summary", detail:"Owner Thato Sekhoto · Mondays 07:00 · runs as owner", ms:220, state:"done"},
        {tool:"access.bind", target:"thato.sekhoto@ubteam.com", detail:"Access re-checked at every run, not frozen at build time", ms:60, state:"done"}
      ],
      sources:[{dataset:"meetings", rows:"re-run weekly", suppressed:"applied at each run, not at build"}],
      confidence:"High — this is a schedule, not an estimate.",
      scope:"Runs as you · 12 of 312 localities at each run"}
  ]}),

mkThread({id:"t-orbit", title:"Orbit bookings by family this quarter", group:"Earlier", project:"Travel & Logistics", when:"18 Aug",
  context:mkCtx(["travel","families","members"],["Orbit","Directory"]),
  msgs:[
    {role:"me", text:"Orbit bookings by family — flights, cars and hotels this quarter"},
    {role:"spiff", text:"Across your localities, <b>218 trips</b> were booked through Orbit this quarter — 194 flights, 156 car rentals and 421 hotel nights. The Steyn and Mbeki families travelled most, largely for divisional events.",
      tokens:[{t:"m",label:"Bookings"},{t:"a",label:"by Family"},{t:"f",label:"Q3 2026"},{t:"f",label:"My localities"}],
      trace:[
        {tool:"connect.query", target:"orbit.fct_booking", detail:"312 k rows scanned, grouped to 88 families", ms:2740, state:"done"},
        {tool:"rules.apply", target:"r-travel-docs", detail:"Passport and ID numbers are never loaded into Spiff", ms:40, state:"done"}
      ],
      answer:"orbit_travel",
      sources:[{dataset:"travel", rows:"312 k scanned", suppressed:"document numbers never loaded"},{dataset:"families", rows:"88 read", suppressed:"addresses outside your locality"}],
      confidence:"Medium — Orbit's supplier feed was late twice in the window.",
      scope:"Your view · 12 of 312 localities"}
  ]})
];

const threadById = id => THREADS.find(t=>t.id===id) || THREADS[0];
</script>
