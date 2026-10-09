<script>
/* =====================================================================
   SPIFF v2 — MCP CONNECTORS
   Connectors Spiff consumes, the tools Spiff exposes when an external AI
   client connects to it, the call log, and the org policy that governs both.
   Made-up data. No live systems.
   ===================================================================== */

/* ---------- capability vocabulary ---------- */
const MCP_CAPS = {
  reads: {label:"Reads data",           cls:"info", note:"Retrieves records. Never changes anything."},
  writes:{label:"Writes data",          cls:"warn", note:"Creates or changes records in the source system."},
  acts:  {label:"Acts on your behalf",  cls:"crit", note:"Sends, posts or books as you — other people see it come from you."}
};
const MCP_TRUST = {
  verified: {label:"Verified",  cls:"ok",   note:"Tested by UBT Group Technology for quality and compatibility. This is not a security audit."},
  community:{label:"Community", cls:"warn", note:"Screened, not reviewed in depth. Once connected it has the same reach as any connector you grant."},
  custom:   {label:"Custom",    cls:"mut",  note:"Added by someone in your org. Nobody outside your org has reviewed it."}
};
const MCP_STATES = {
  connected:{label:"Connected",         cls:"ok"},
  available:{label:"Not connected",     cls:"mut"},
  requested:{label:"Requested",         cls:"warn"},
  reauth:   {label:"Needs reauth",      cls:"warn"},
  error:    {label:"Error",             cls:"crit"},
  blocked:  {label:"Blocked by policy", cls:"crit"}
};

const MCP_ICON_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
const MCP_ICON_CLOUD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 18a4 4 0 010-8 5.5 5.5 0 0110.5-1.4A3.8 3.8 0 0118 18z"/><path d="M12 12v5M9.5 14.5L12 12l2.5 2.5"/></svg>';

/* ---------- connectors ---------- */
const CONNECTORS = [
{
  id:"directory", name:"UBT Directory", publisher:"UBT Group Technology",
  legalName:"United Brethren Technology (Pty) Ltd", domain:"directory.ubteam.com",
  support:"servicedesk@ubteam.com", privacy:"ubteam.com/legal/privacy-notice",
  category:"Data", icon:"UD", tint:"--info",
  desc:"People, families, localities and service appointments — the system of record for who belongs where.",
  longDesc:"Directory is the register the whole division works from. This connector lets Spiff look up a member, a household, a locality or an appointment while you are in a conversation, instead of you leaving to search Directory yourself. It reads. It never writes back — member records are changed in Directory, by the Records Office, and nowhere else.",
  trust:"verified", state:"connected", rights:"request", capability:["reads"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"14 Feb 2026", users:402, updated:"22 Aug 2026", calls30d:4118,
  endpoint:"https://mcp.ubteam.com/directory/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Requests stay inside the UBT tenant. Directory returns only rows your own Directory account can see, and the connector keeps nothing after the call returns.",
  examples:["Who is the appointed secretary for Bellville?","How many households in my locality have no listed contact?","Which localities in my cluster have no secretary?"],
  tools:[
    {name:"search_members",     desc:"Find members by name, locality or membership number.",         kind:"read",  perm:"allow", calls30d:1642},
    {name:"get_member",         desc:"Open one member record — standing, locality, appointments.",   kind:"read",  perm:"allow", calls30d:1180},
    {name:"list_localities",    desc:"List localities in a subdivision or locality.",                  kind:"read",  perm:"allow", calls30d:706},
    {name:"list_appointments",  desc:"Who currently holds which service role, and since when.",      kind:"read",  perm:"allow", calls30d:404},
    {name:"get_household",      desc:"A family unit and its members.",                               kind:"read",  perm:"ask",   calls30d:186}
  ],
  scopes:[
    {label:"Read member records you can already see", scope:"directory.members.read", kind:"read", why:"Every member lookup runs against your own Directory permissions. Members outside your localities come back masked, not hidden without explanation."},
    {label:"Read localities and subdivisions",        scope:"directory.geography.read", kind:"read", why:"So Spiff can resolve “my cluster” into the twelve localities it actually means."},
    {label:"Read service appointments",               scope:"directory.appointments.read", kind:"read", why:"Needed for any question about who holds a role."}
  ],
  resources:["ubt://directory/localities","ubt://directory/appointments","ubt://directory/localities"],
  prompts:["Who serves this locality?","Household summary for a member"],
  health:{uptime:"99.98%", errorRate:"0.1%", p95:"180 ms", lastCall:"4 min ago"},
  changed:[],
  changelog:[{v:"4.2", on:"22 Aug 2026", note:"get_household now returns household size without naming members outside your locality."},{v:"4.1", on:"09 Jun 2026", note:"Added list_appointments."}]
},
{
  id:"orbit", name:"Orbit Travel", publisher:"Orbit Travel Systems",
  legalName:"Orbit Travel Systems (Pty) Ltd", domain:"orbit-travel.co.za",
  support:"support@orbit-travel.co.za", privacy:"orbit-travel.co.za/privacy",
  category:"Travel", icon:"OR", tint:"--purple",
  desc:"Flights, cars, hotels and stitched itineraries from the Orbit travel desk.",
  longDesc:"Orbit is where the division books travel. This connector reads bookings and journeys, and can place a 24-hour hold on a fare so a coordinator does not lose it while approval is sought. It cannot confirm, pay for or cancel a confirmed booking — those stay with the travel desk.",
  trust:"verified", state:"connected", rights:"request", capability:["reads","writes"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"03 Mar 2026", users:96, updated:"11 Aug 2026", calls30d:812,
  endpoint:"https://mcp.orbit-travel.co.za/v2/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Requests leave the UBT tenant for Orbit's South African region. Traveller names are sent only when your own travel-window rule already allows you to see them. Passport and ID numbers are never sent and never returned.",
  examples:["Orbit bookings by family for the October gathering","Which trips next month have no return leg booked?","Hold the 06:15 CPT–JNB fare for Helena until Friday"],
  tools:[
    {name:"search_bookings",    desc:"Find bookings by traveller, date or destination.",              kind:"read",       perm:"allow", calls30d:388},
    {name:"get_itinerary",      desc:"One traveller's journey, end to end.",                          kind:"read",       perm:"allow", calls30d:241},
    {name:"list_suppliers",     desc:"Airlines, hotel chains and rental firms on contract.",          kind:"read",       perm:"allow", calls30d:64},
    {name:"quote_fare",         desc:"Price a route without booking anything.",                       kind:"read",       perm:"allow", calls30d:97},
    {name:"hold_booking",       desc:"Place a 24-hour hold on a fare. No payment, no confirmation.",  kind:"write",      perm:"ask",   calls30d:19},
    {name:"release_hold",       desc:"Drop a hold you placed. Cannot touch a confirmed booking.",     kind:"destructive",perm:"ask",   calls30d:3}
  ],
  scopes:[
    {label:"Read travel bookings within your window", scope:"orbit.bookings.read", kind:"read", why:"The ±30 day travel-window rule still applies. Outside it, traveller names come back withheld."},
    {label:"Read stitched itineraries",               scope:"orbit.itineraries.read", kind:"read", why:"So a trip reads as one story rather than five booking lines."},
    {label:"Place and release fare holds",            scope:"orbit.holds.write", kind:"write", why:"Lets a coordinator keep a fare alive while approval is sought. Every hold expires in 24 hours on its own."}
  ],
  resources:["orbit://bookings/{ref}","orbit://itineraries/{id}"],
  prompts:["Trace a member's travel next month","Travel spend against budget"],
  health:{uptime:"97.2%", errorRate:"3.4%", p95:"1.4 s", lastCall:"12 min ago"},
  changed:[],
  changelog:[{v:"2.6", on:"11 Aug 2026", note:"quote_fare added. Supplier feed latency raised to 12 hours."}]
},
{
  id:"assemble", name:"Assemble", publisher:"UBT Group Technology",
  legalName:"United Brethren Technology (Pty) Ltd", domain:"assemble.ubteam.com",
  support:"servicedesk@ubteam.com", privacy:"ubteam.com/legal/privacy-notice",
  category:"Data", icon:"AS", tint:"--teal",
  desc:"Events, invitations and registrations across all 312 localities.",
  longDesc:"Assemble records the events the division plans and who was invited. The connector reads event and registration data at the grain the warehouse publishes it. Attendance is not here: check-ins are a Connect concept and come through the UBT Connect connector.",
  trust:"verified", state:"connected", rights:"request", capability:["reads"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"14 Feb 2026", users:361, updated:"19 Jul 2026", calls30d:3204,
  endpoint:"https://mcp.ubteam.com/assemble/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Inside the UBT tenant. Locality scoping is applied by Assemble before the rows reach Spiff, so a call you are not entitled to make returns a refusal, not a silent empty list.",
  examples:["How many LDM meetings ran in my subdivisions last quarter?","Attendance rate by locality, this year vs last","Which events are below 60% of capacity?"],
  tools:[
    {name:"list_events",        desc:"Events and programmes, planned and held.",                      kind:"read", perm:"allow", calls30d:512},
    {name:"get_registrations",  desc:"Registrations for an event. Wellbeing notes are never returned.",kind:"read", perm:"allow", calls30d:275}
  ],
  scopes:[
    {label:"Read events and registrations", scope:"assemble.events.read", kind:"read", why:"The core of most event questions. Wellbeing notes are never returned."},
    {label:"Read events and registrations", scope:"assemble.events.read", kind:"read", why:"Dietary and accessibility notes are excluded at source and cannot be requested."}
  ],
  resources:["assemble://events/{id}","assemble://invitations/{id}"],
  prompts:["Attendance by locality","Events below capacity"],
  health:{uptime:"99.94%", errorRate:"0.3%", p95:"240 ms", lastCall:"1 min ago"},
  changed:[],
  changelog:[{v:"3.1", on:"19 Jul 2026", note:"get_registrations stopped returning free-text wellbeing fields entirely."}]
},
{
  id:"warehouse", name:"UBT Connect", publisher:"UBT Group Technology",
  legalName:"United Brethren Technology (Pty) Ltd", domain:"connect.ubteam.com",
  support:"servicedesk@ubteam.com", privacy:"ubteam.com/legal/privacy-notice",
  category:"Data", icon:"CN", tint:"--accent",
  desc:"Access and role domains, meetings and attendance check-ins, notices and delivery, polls, sites and the user activity log.",
  longDesc:"Connect is the system every other screen in Spiff describes without naming. It holds the role domains that decide who sees what, the notices the division sends, the polls it runs and the activity log that records what people did. This connector exposes named, reviewed queries — not a SQL prompt. There is deliberately no tool here that takes arbitrary SQL: an agent that can write its own query can write its way around a row filter.",
  trust:"verified", state:"connected", rights:"request", capability:["reads"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"14 Feb 2026", users:288, updated:"01 Aug 2026", calls30d:2760,
  endpoint:"https://mcp.ubteam.com/connect/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Never leaves the UBT tenant. Connect resolves your role domains before the query runs and compiles the row filter into it, so a scope cannot be widened by how the question is phrased.",
  examples:["Who can see member detail in Bellville?","Delivery failure rate by channel last month","Members with no recorded activity in 90 days"],
  tools:[
    {name:"list_datasets",      desc:"The Connect datasets you are entitled to query.",               kind:"read", perm:"allow", calls30d:604},
    {name:"describe_dataset",   desc:"Grain, fields, definitions, certification and owner.",          kind:"read", perm:"allow", calls30d:731},
    {name:"run_certified_query",desc:"Run one of 41 named, reviewed queries. Arbitrary SQL is not accepted.", kind:"read", perm:"allow", calls30d:1188},
    {name:"get_role_domains",   desc:"Which roles a person holds, at which tier, over which country or locality.", kind:"read", perm:"allow", calls30d:237},
    {name:"list_meetings",      desc:"Meetings held in a period, by locality or subdivision.",        kind:"read", perm:"allow", calls30d:1411},
    {name:"get_attendance",     desc:"Expected versus checked in, at your permitted grain.",          kind:"read", perm:"allow", calls30d:1006}
  ],
  scopes:[
    {label:"Read Connect datasets",   scope:"connect.datasets.read", kind:"read", why:"Restricted to the datasets your groups already hold. Message bodies are excluded from every one of them."},
    {label:"Run named queries",       scope:"connect.query.named", kind:"read", why:"Named queries only. There is deliberately no scope for free-form SQL."},
    {label:"Read role domains",       scope:"connect.access.read", kind:"read", why:"Lets you see who holds access where. It does not let you see the data that access reaches, and it cannot grant anything."}
  ],
  resources:["spiff://datasets/access","spiff://datasets/comms","spiff://datasets/activity"],
  prompts:["Explain this number","Who can see this?"],
  health:{uptime:"99.99%", errorRate:"0.0%", p95:"90 ms", lastCall:"just now"},
  changed:[],
  changelog:[{v:"5.0", on:"01 Aug 2026", note:"Free-form SQL tool removed. Replaced by 41 named certified queries."}]
},
{
  id:"teams", name:"Microsoft Teams", publisher:"Microsoft Corporation",
  legalName:"Microsoft Corporation", domain:"microsoft.com",
  support:"support.microsoft.com", privacy:"privacy.microsoft.com/privacystatement",
  category:"Comms", icon:"MT", tint:"--purple",
  desc:"Chats, channels and meetings — so an answer can land where the conversation already is.",
  longDesc:"Teams is where the division talks. This connector lets Spiff read the channels you are in and post an answer into one. Anything it posts appears under your name, not Spiff's, which is why every posting tool defaults to needing your approval.",
  trust:"verified", state:"connected", rights:"connect", capability:["reads","writes","acts"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"21 Apr 2026", users:274, updated:"26 Aug 2026", calls30d:1493,
  endpoint:"https://mcp.microsoft.com/teams/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Message content leaves the Spiff tenant for Microsoft 365, which UBT already operates under its existing data agreement. Spiff stores the fact a message was posted, never the message body.",
  examples:["Post the weekly attendance summary to #gst-ldm","What did the travel office say about October?","Book a 30-minute review with Reneilwe next week"],
  tools:[
    {name:"list_channels",      desc:"Teams and channels you belong to.",                             kind:"read",  perm:"allow", calls30d:402},
    {name:"search_messages",    desc:"Search messages you can already read.",                         kind:"read",  perm:"allow", calls30d:611},
    {name:"post_message",       desc:"Post into a chat as you.",                                      kind:"write", perm:"ask",   calls30d:188},
    {name:"create_meeting",     desc:"Put a meeting in the calendar and invite people.",              kind:"write", perm:"ask",   calls30d:96},
    {name:"post_to_channel",    desc:"Post into a shared channel as you — visible to the whole team.",kind:"write", perm:"ask",   calls30d:141, isNew:true},
    {name:"add_member_to_chat", desc:"Add someone to an existing chat, giving them its history.",     kind:"destructive", perm:"block", calls30d:0, isNew:true},
    {name:"schedule_recurring_meeting", desc:"Create a repeating meeting series.",                    kind:"write", perm:"ask",   calls30d:55, isNew:true}
  ],
  scopes:[
    {label:"Read channels and messages you can see", scope:"teams.messages.read", kind:"read", why:"Spiff never sees a channel you are not in. Membership is re-checked on every call."},
    {label:"Post as you",                            scope:"teams.messages.send", kind:"write", why:"Colleagues will see the post under your name. This is why it needs approval each time."},
    {label:"Create meetings",                        scope:"teams.calendar.write", kind:"write", why:"Only used when you ask for a meeting to be set up."}
  ],
  resources:["teams://channels/{id}"],
  prompts:["Post this answer to a channel","Summarise a channel this week"],
  health:{uptime:"99.91%", errorRate:"0.6%", p95:"420 ms", lastCall:"7 min ago"},
  changed:[
    {on:"26 Aug 2026", kind:"added", tool:"post_to_channel",           note:"Posts to a whole team, not one chat. Wider audience than the tool you approved."},
    {on:"26 Aug 2026", kind:"added", tool:"add_member_to_chat",        note:"Grants a person the chat's full history. Blocked by default until you decide."},
    {on:"26 Aug 2026", kind:"added", tool:"schedule_recurring_meeting",note:"Creates a repeating series rather than one meeting."}
  ],
  changelog:[{v:"6.4", on:"26 Aug 2026", note:"Three tools added. Existing consents were not re-gated by Microsoft — Spiff gates them here."}]
},
{
  id:"outlook", name:"Outlook & Calendar", publisher:"Microsoft Corporation",
  legalName:"Microsoft Corporation", domain:"microsoft.com",
  support:"support.microsoft.com", privacy:"privacy.microsoft.com/privacystatement",
  category:"Comms", icon:MCP_ICON_CAL, tint:"--info",
  desc:"Mail and calendar, so a scheduled answer can arrive as an email people already read.",
  longDesc:"Outlook is how most delivery actually happens. This connector reads your calendar to find a free slot and sends the mail your automations produce. It sends as you — recipients see your address, not a robot's.",
  trust:"verified", state:"reauth", rights:"connect", capability:["reads","writes","acts"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"21 Apr 2026", users:243, updated:"04 Aug 2026", calls30d:648,
  endpoint:"https://mcp.microsoft.com/outlook/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  errorText:"Your Microsoft sign-in expired on 28 Aug at 04:00. Two automations that deliver through Outlook have paused rather than sending as anyone else.",
  dataFlow:"Mail bodies leave for Microsoft 365 under UBT's existing agreement. Spiff logs that a message was sent, to how many recipients, and nothing of its contents.",
  examples:["Email me the weekly summary every Monday at 07:00","When is Reneilwe free on Thursday?","Send this answer to the Southern Cluster secretaries"],
  tools:[
    {name:"list_events",        desc:"Your calendar for a date range.",                               kind:"read",  perm:"allow", calls30d:212},
    {name:"find_free_time",     desc:"Find a slot that works for a set of people.",                   kind:"read",  perm:"allow", calls30d:141},
    {name:"search_mail",        desc:"Search your own mailbox.",                                      kind:"read",  perm:"ask",   calls30d:88},
    {name:"send_mail",          desc:"Send a message as you.",                                        kind:"write", perm:"ask",   calls30d:174},
    {name:"create_event",       desc:"Add an event to your calendar.",                                kind:"write", perm:"ask",   calls30d:33}
  ],
  scopes:[
    {label:"Read your calendar",  scope:"outlook.calendar.read", kind:"read", why:"To answer “when am I free” without you leaving the conversation."},
    {label:"Read your mailbox",   scope:"outlook.mail.read", kind:"read", why:"Only your own mailbox. Shared and delegated mailboxes are excluded from this grant."},
    {label:"Send mail as you",    scope:"outlook.mail.send", kind:"write", why:"Scheduled answers are delivered from your address so recipients know who to reply to."}
  ],
  resources:["outlook://calendar/{id}"],
  prompts:["Find a slot","Send this to my cluster"],
  health:{uptime:"99.89%", errorRate:"—", p95:"—", lastCall:"28 Aug 04:02"},
  changed:[],
  changelog:[{v:"6.4", on:"04 Aug 2026", note:"Token lifetime shortened to 90 days by Microsoft."}]
},
{
  id:"sharepoint", name:"SharePoint", publisher:"Microsoft Corporation",
  legalName:"Microsoft Corporation", domain:"microsoft.com",
  support:"support.microsoft.com", privacy:"privacy.microsoft.com/privacystatement",
  category:"Files", icon:"SP", tint:"--teal",
  desc:"Documents and shared libraries — for reading a policy, or filing an answer where the team keeps things.",
  longDesc:"SharePoint holds the division's documents. Connect it and Spiff can read the sites you already have access to, and — with your approval — file a finished report into a library rather than mailing it round as an attachment.",
  trust:"verified", state:"available", rights:"connect", capability:["reads","writes"],
  connectedAs:null, connectedOn:null, users:118, updated:"15 Aug 2026", calls30d:0,
  endpoint:"https://mcp.microsoft.com/sharepoint/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Files stay in Microsoft 365. Spiff reads a document's text to answer a question and does not keep a copy.",
  examples:["What does the travel policy say about advance booking?","File this quarter's summary in the LDM library","Which documents in the Estates site changed this month?"],
  tools:[
    {name:"search_files",       desc:"Search sites and libraries you can already open.",              kind:"read",       perm:"allow", calls30d:0},
    {name:"get_file",           desc:"Read one document's contents.",                                 kind:"read",       perm:"allow", calls30d:0},
    {name:"list_sites",         desc:"Sites you are a member of.",                                    kind:"read",       perm:"allow", calls30d:0},
    {name:"upload_file",        desc:"Add a file to a library you can write to.",                     kind:"write",      perm:"ask",   calls30d:0},
    {name:"create_folder",      desc:"Create a folder in a library.",                                 kind:"write",      perm:"ask",   calls30d:0},
    {name:"delete_item",        desc:"Move a file or folder to the site recycle bin.",                kind:"destructive",perm:"block", calls30d:0}
  ],
  scopes:[
    {label:"Read sites and files you can open", scope:"sharepoint.files.read", kind:"read", why:"Exactly the sites you already belong to. Connecting does not add you to anything."},
    {label:"Write to shared folders",           scope:"sharepoint.files.write", kind:"write", why:"Needed only when you ask Spiff to file a report. Requested separately, when it is first needed."}
  ],
  resources:["sharepoint://sites/{id}"],
  prompts:["Find a policy document","File this report"],
  health:{uptime:"99.95%", errorRate:"0.2%", p95:"380 ms", lastCall:"—"},
  changed:[],
  changelog:[{v:"5.1", on:"15 Aug 2026", note:"delete_item now moves to the recycle bin instead of purging."}]
},
{
  id:"gsheets", name:"Google Sheets", publisher:"Google LLC",
  legalName:"Google LLC", domain:"google.com",
  support:"support.google.com", privacy:"policies.google.com/privacy",
  category:"Files", icon:"GS", tint:"--ok",
  desc:"Read and write spreadsheets — for the handful of trackers that still live outside the warehouse.",
  longDesc:"Some working trackers are still spreadsheets and will be for a while. This connector reads them so a question can include them, and can append a row when a process genuinely ends in a sheet.",
  trust:"verified", state:"requested", rights:"request", capability:["reads","writes"],
  connectedAs:null, connectedOn:null, users:41, updated:"07 Aug 2026", calls30d:0,
  requestedBy:"Thato Sekhoto", requestedOn:"27 Aug 2026",
  requestNote:"The Events team keeps the venue readiness tracker in Sheets. I want the Monday summary to include it instead of me pasting it in by hand.",
  endpoint:"https://mcp.google.com/sheets/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Sheet contents leave the UBT tenant for Google Workspace. UBT has no data agreement covering Google Workspace, which is why this one needs an admin decision rather than a personal connect.",
  examples:["Include the venue readiness tracker in the Monday summary","Append this week's numbers to the events sheet","Which rows in the tracker are blank?"],
  tools:[
    {name:"list_sheets",        desc:"Spreadsheets shared with you.",                                 kind:"read",  perm:"allow", calls30d:0},
    {name:"read_range",         desc:"Read a range of cells.",                                        kind:"read",  perm:"allow", calls30d:0},
    {name:"append_row",         desc:"Add a row to the bottom of a sheet.",                           kind:"write", perm:"ask",   calls30d:0},
    {name:"update_range",       desc:"Overwrite existing cells.",                                     kind:"destructive", perm:"block", calls30d:0}
  ],
  scopes:[
    {label:"Read spreadsheets shared with you", scope:"sheets.spreadsheets.readonly", kind:"read", why:"Only files already shared with your account."},
    {label:"Append rows",                       scope:"sheets.spreadsheets.append", kind:"write", why:"Appending is additive. Overwriting cells is a separate, blocked tool."}
  ],
  resources:["sheets://spreadsheets/{id}"],
  prompts:["Read a tracker","Append this week's row"],
  health:{uptime:"99.97%", errorRate:"0.1%", p95:"310 ms", lastCall:"—"},
  changed:[],
  changelog:[{v:"3.3", on:"07 Aug 2026", note:"update_range split out from append_row so the two can be governed separately."}]
},
{
  id:"slack", name:"Slack", publisher:"Slack Technologies, LLC",
  legalName:"Slack Technologies, LLC (a Salesforce company)", domain:"slack.com",
  support:"slack.com/help", privacy:"slack.com/trust/privacy",
  category:"Comms", icon:"SL", tint:"--pink",
  desc:"Channels and messages. Not available in this org.",
  longDesc:"Slack is a capable connector and it is blocked here on purpose. GST standardised on Teams so that one retention policy, one legal hold and one export path cover every division conversation. Nothing about Slack itself is the problem.",
  trust:"verified", state:"blocked", rights:"request", capability:["reads","writes","acts"],
  connectedAs:null, connectedOn:null, users:0, updated:"29 Jul 2026", calls30d:0,
  blockedBy:"Approved comms channels — Teams only",
  blockedNote:"Set by Marcus Vilakazi on 12 Mar 2026. Raise it with Platform Admins if the events programme genuinely needs a second channel.",
  endpoint:"https://mcp.slack.com/mcp", transport:"Streamable HTTP", apiVersion:"2026-07-28",
  auth:"OAuth per user",
  dataFlow:"Would send message content outside the UBT tenant to Slack. No agreement covers it.",
  examples:["Post to a Slack channel","Search Slack history"],
  tools:[
    {name:"list_channels",  desc:"Channels you belong to.",           kind:"read",  perm:"block", calls30d:0},
    {name:"search_messages",desc:"Search message history.",           kind:"read",  perm:"block", calls30d:0},
    {name:"post_message",   desc:"Post into a channel as you.",       kind:"write", perm:"block", calls30d:0}
  ],
  scopes:[
    {label:"Read channels and messages", scope:"slack.channels.read", kind:"read", why:"Blocked before consent is ever requested."},
    {label:"Post as you",                scope:"slack.chat.write", kind:"write", why:"Blocked before consent is ever requested."}
  ],
  resources:[], prompts:[],
  health:{uptime:"—", errorRate:"—", p95:"—", lastCall:"never"},
  changed:[],
  changelog:[{v:"4.0", on:"29 Jul 2026", note:"Publisher listing updated. Still blocked by GST policy."}]
},
{
  id:"weather", name:"Weather", publisher:"Meteo Community Labs",
  legalName:"Meteo Community Labs e.V.", domain:"meteolabs.org",
  support:"github.com/meteolabs/mcp-weather/issues", privacy:"meteolabs.org/privacy",
  category:"Utilities", icon:MCP_ICON_CLOUD, tint:"--warn",
  desc:"Forecasts and severe-weather warnings by place — useful for outdoor events and long drives.",
  longDesc:"A small community connector that answers weather questions for a place and a date. Event Operations asked for it after two open-air gatherings were caught out. It sends a place name and a date to a public service and nothing else — but it is community-published, so read the honest note about what that label does and does not mean.",
  trust:"community", state:"available", rights:"connect", capability:["reads"],
  connectedAs:null, connectedOn:null, users:23, updated:"02 Jun 2026", calls30d:0,
  endpoint:"https://mcp.meteolabs.org/mcp", transport:"Streamable HTTP", apiVersion:"2026-03-26",
  auth:"None",
  dataFlow:"A place name and a date leave the tenant for a public forecasting service. No member data, no identifiers, nothing about who asked. The connector operator is a German non-profit, not UBT.",
  examples:["What is the forecast for Bloemfontein on 3 October?","Any severe weather warnings for the Makhanda this weekend?","Is rain likely for the outdoor gathering?"],
  tools:[
    {name:"get_forecast",   desc:"Forecast for a place and date range.",     kind:"read", perm:"allow", calls30d:0},
    {name:"get_warnings",   desc:"Active severe-weather warnings for a locality.", kind:"read", perm:"allow", calls30d:0}
  ],
  scopes:[
    {label:"No account access", scope:"—", kind:"read", why:"This connector has no sign-in. It cannot see anything of yours, because it is never given anything of yours."}
  ],
  resources:[], prompts:["Forecast for an event"],
  health:{uptime:"99.4%", errorRate:"0.9%", p95:"640 ms", lastCall:"—"},
  changed:[],
  changelog:[{v:"1.4", on:"02 Jun 2026", note:"Added severe-weather warnings for South African provinces."}]
},
{
  id:"estates-mcp", name:"Notifications Relay", publisher:"UBT GST — LDM Operations",
  legalName:"United Brethren Technology (Pty) Ltd", domain:"notify.ubt-gst.internal",
  support:"Reneilwe Dlomo · #gst-data-connect", privacy:"Internal — covered by the UBT staff privacy notice",
  category:"Comms", icon:"NR", tint:"--crit",
  desc:"A shortcut into the Notifications service, written in-house by LDM Operations.",
  longDesc:"A connector LDM Operations wrote themselves against the Notifications service, to save re-keying recipients. It is genuinely useful and it is genuinely unreviewed — nobody outside that team has looked at what it does with a recipient list, and it can send. It has been failing since Saturday morning, which is the only reason anyone noticed it existed.",
  trust:"custom", state:"error", rights:"connect", capability:["reads","writes"],
  connectedAs:"thato.sekhoto@ubteam.com", connectedOn:"18 Jun 2026", users:31, updated:"18 Jun 2026", calls30d:212,
  endpoint:"https://notify.ubt-gst.internal:8443/mcp", transport:"Streamable HTTP", apiVersion:"2026-03-26",
  auth:"Shared key",
  errorText:"Server unreachable since 29 Aug 06:12 — three consecutive connection timeouts. The last successful call was Friday at 17:40.",
  dataFlow:"Stays on the internal network. It authenticates with one shared key for all 31 users, which is why every call in the log reads as the same identity — the org policy against shared credentials would block this connector if it were added today.",
  examples:["Which halls are free on Sunday morning?","Book the Bellville main hall for the youth evening","Rooms over 80% utilised on Sundays"],
  tools:[
    {name:"list_properties",     desc:"Halls and rooms, with capacity and condition.",     kind:"read",  perm:"allow", calls30d:128},
    {name:"get_room_availability",desc:"Free and booked slots for a room.",                kind:"read",  perm:"allow", calls30d:71},
    {name:"book_room",           desc:"Reserve a room. No approval step behind it.",   kind:"write", perm:"ask",   calls30d:13}
  ],
  scopes:[
    {label:"Read properties and availability", scope:"estates.rooms.read", kind:"read", why:"Capacity and condition for planning."},
    {label:"Create room bookings",             scope:"estates.bookings.write", kind:"write", why:"Books immediately with no second approval, which is why it asks every time."}
  ],
  resources:["estates://rooms/{id}"], prompts:["Free halls this Sunday"],
  health:{uptime:"91.6%", errorRate:"8.4%", p95:"2.9 s", lastCall:"28 Aug 17:40"},
  changed:[],
  changelog:[{v:"0.9", on:"18 Jun 2026", note:"First version. No changelog is maintained for this connector."}]
},
{
  id:"finance-mcp", name:"Finance Ledger", publisher:"Not established",
  legalName:"United Brethren Technology (Pty) Ltd", domain:"finance.ubteam.com",
  support:"Brendan Jooste · #gst-data-finance", privacy:"ubteam.com/legal/privacy-notice",
  category:"Data", icon:"FL", tint:"--ok",
  desc:"Cost centres, budgets and actuals — the money view behind operations.",
  longDesc:"Requested in June, and still not approvable. There is no finance system registered as a source, so there is nothing for this connector to read and no owner who can vouch for it. It is listed because three saved answers stop at travel spend for want of the budget side, and pretending the gap does not exist would not close it.",
  trust:"custom", state:"blocked", rights:"request", capability:["reads"],
  blockedBy:"no registered source", blockedNote:"There is no finance system registered with Spiff, so there is nothing behind this connector to read and nobody who can vouch for it. It stays listed because the gap is real and three saved answers stop short because of it.",
  connectedAs:null, connectedOn:null, users:19, updated:"30 Jun 2026", calls30d:0,
  endpoint:"—", transport:"—", apiVersion:"—",
  auth:"—",
  dataFlow:"Inside the UBT tenant. Scoped to the cost centres your Finance role names — not to your locality.",
  examples:["Travel spend against budget by locality","Cost centres over 90% consumed","Month-on-month variance for my cluster"],
  tools:[
    {name:"list_cost_centres",  desc:"Cost centres you are entitled to see.",             kind:"read", perm:"allow", calls30d:0},
    {name:"get_budget",         desc:"Budget, actual and variance for a period.",         kind:"read", perm:"allow", calls30d:0},
    {name:"get_variance",       desc:"Month-on-month variance for a cost centre.",        kind:"read", perm:"allow", calls30d:0}
  ],
  scopes:[
    {label:"Read budgets for your cost centres", scope:"finance.budgets.read", kind:"read", why:"Granted per cost centre by the Finance steward, not by locality."}
  ],
  resources:["spiff://datasets/budgets"], prompts:["Spend against budget"],
  health:{uptime:"99.96%", errorRate:"0.1%", p95:"340 ms", lastCall:"—"},
  changed:[],
  changelog:[{v:"2.2", on:"30 Jun 2026", note:"Individual contribution fields permanently removed from the schema."}]
}
];
const connectorById = id => CONNECTORS.find(c=>c.id===id) || CONNECTORS[0];

/* ---------- Spiff as an MCP server: the tools Spiff exposes outward ---------- */
const SPIFF_TOOLS = [
  {name:"list_reports", kind:"read", perm:"allow",
   desc:"The reports the calling person can see — name, owner, what it answers, when it last ran.",
   args:[{n:"folder", t:"string", d:"Optional. Limit to one team's workspace."},{n:"q", t:"string", d:"Optional. Free-text match on name and description."}],
   returns:"A list of reports, already filtered to what this identity is allowed to open. Reports they cannot see are absent, not hidden with a count."},
  {name:"describe_report", kind:"read", perm:"allow",
   desc:"What a report actually measures — fields, filters, agreed definitions, freshness, owner and certification.",
   args:[{n:"report_id", t:"string", d:"Required."}],
   returns:"Schema, the governed definition of every measure, the datasets behind it, and the certification badge with the steward's name."},
  {name:"run_report", kind:"read", perm:"allow",
   desc:"Run a defined report as the calling person and return the rows they are entitled to.",
   args:[{n:"report_id", t:"string", d:"Required."},{n:"filters", t:"object", d:"Optional. Only filters the report already declares."},{n:"limit", t:"integer", d:"Optional. Caps rows returned. Detail rows may be suppressed regardless."}],
   returns:"Rows plus a scope banner naming the identity, the localities and the row filters applied. Suppressed cells say why they are suppressed."},
  {name:"search_metrics", kind:"read", perm:"allow",
   desc:"Find a governed metric and read its one agreed business meaning.",
   args:[{n:"q", t:"string", d:"Required. A term like “attendance” or “net movement”."}],
   returns:"Matching metrics with the agreed definition, its version, who owns it and when it was agreed."},
  {name:"explain_answer", kind:"read", perm:"allow",
   desc:"The lineage of a number — where it came from, what was filtered, and whose permissions produced it.",
   args:[{n:"answer_id", t:"string", d:"Required."}],
   returns:"Source datasets, transformations in order, the filters applied, and the run-as identity at the moment it ran."},
  {name:"list_datasets", kind:"read", perm:"allow",
   desc:"The datasets this identity can query, with sensitivity, certification and the row filters that apply to them.",
   args:[{n:"domain", t:"string", d:"Optional. Narrow to one domain."}],
   returns:"Datasets already filtered to the caller's entitlements, each with its masking and row-filter note."},
  {name:"create_automation", kind:"write", perm:"ask",
   desc:"Schedule a report to run and deliver on a cadence.",
   args:[{n:"report_id", t:"string", d:"Required."},{n:"cadence", t:"string", d:"Required. Daily, weekly, monthly or a cron-style rule."},{n:"recipients", t:"array", d:"Required. People or groups."},{n:"channel", t:"string", d:"Email, Teams or in-Spiff."}],
   returns:"The automation, which runs as the person who created it. The approval card shows the cadence, the recipients and the run-as identity before anything is created."},
  {name:"share_report", kind:"write", perm:"ask",
   desc:"Give named people or a group a copy of a report in their own workspace.",
   args:[{n:"report_id", t:"string", d:"Required."},{n:"audience", t:"array", d:"Required. People or groups."},{n:"note", t:"string", d:"Optional message shown to the recipient."}],
   returns:"Confirmation. Sharing organises, it never widens access. Each recipient's copy re-runs scoped to them, and a person who cannot see the data sees an empty, explained result."},
  {name:"clone_automation", kind:"write", perm:"ask",
   desc:"Copy an automation to another person so they get their own version of it.",
   args:[{n:"automation_id", t:"string", d:"Required."},{n:"new_owner", t:"string", d:"Required."}],
   returns:"A new automation owned by the new owner and running as them. The original is untouched, and the clone's results are theirs, not yours."},
  {name:"subscribe", kind:"write", perm:"ask",
   desc:"Subscribe the calling person to an existing report's delivery.",
   args:[{n:"report_id", t:"string", d:"Required."},{n:"cadence", t:"string", d:"Required."}],
   returns:"A subscription for the caller only. It cannot be created on someone else's behalf — that is what share_report is for."}
];

/* ---------- call log ---------- */
function MCPL(when,who,connector,tool,args,outcome,ms,rows,identity){
  return {when,who,connector,tool,args,outcome,ms,rows,identity};
}
const MCP_LOG = [
  MCPL("today 09:41","Thato Sekhoto","warehouse","run_certified_query","attendance_by_locality · Q3 2026 · Southern Cluster","ok",412,1284,"Thato Sekhoto · 12 of 312 localities"),
  MCPL("today 09:40","Thato Sekhoto","warehouse","list_meetings","subdivision=Southern Cluster · 01 Jul–30 Sep","ok",238,312,"Thato Sekhoto · 12 of 312 localities"),
  MCPL("today 09:22","Pavitra Govender","warehouse","run_certified_query","member_growth_national · 2026 YTD","ok",690,9108,"Pavitra Govender · whole region, aggregate only"),
  MCPL("today 09:04","Colette Marais","orbit","search_bookings","travel_dt 01 Oct–14 Oct · locality=Pretoria","partial",1840,486,"Colette Marais · travel window ±30 days"),
  MCPL("today 08:58","Dawid Kruger","directory","get_household","household_id=FAM-11902","denied",44,0,"Dawid Kruger · Bloemfontein only"),
  MCPL("today 08:51","Thato Sekhoto","teams","post_to_channel","channel=#gst-ldm · “Weekly attendance summary”","ok",520,0,"Thato Sekhoto"),
  MCPL("today 08:44","Amira Rasool","assemble","get_registrations","event=Regional Youth Gathering","partial",310,386,"Amira Rasool · Stellenbosch"),
  MCPL("today 08:31","Tumelo Maseko","warehouse","describe_mart","mart=fct_meeting_attendance","ok",96,1,"Tumelo Maseko · Northern Cluster"),
  MCPL("today 08:12","Siyabonga Nxumalo","estates-mcp","get_room_availability","room=Bellville Main Hall · 06 Sep","error",30000,0,"Estates shared key (31 users)"),
  MCPL("today 07:59","Londiwe Zwane","directory","search_members","q=“secretary” · locality=Pietermaritzburg","ok",164,47,"Londiwe Zwane · Pietermaritzburg"),
  MCPL("today 07:47","Thato Sekhoto","outlook","send_mail","to=Southern Cluster secretaries (14) · “Monday summary”","error",118,0,"Thato Sekhoto · token expired"),
  MCPL("today 07:30","Automation · Weekly GST summary","warehouse","run_certified_query","weekly_gst_summary · week 35","ok",1120,2044,"Runs as Reneilwe Dlomo"),
  MCPL("today 07:30","Automation · Weekly GST summary","outlook","send_mail","to=LDM Coordinators (34)","ok",640,0,"Runs as Reneilwe Dlomo"),
  MCPL("yesterday 16:22","Martinus Viljoen","warehouse","get_attendance","locality=Bellville · Aug 2026","denied",38,0,"Martinus Viljoen · account suspended"),
  MCPL("yesterday 15:51","Helena Bosman","orbit","hold_booking","CPT→JNB 06:15 · 12 Sep · 1 traveller","ok",980,1,"Helena Bosman · Travel Office"),
  MCPL("yesterday 15:04","Farida Padayachee","warehouse","run_certified_query","net_movement_by_subdivision · 3y","ok",1460,3312,"Farida Padayachee · whole region, aggregate only"),
  MCPL("yesterday 14:38","Gugu Pillay","assemble","get_registrations","event=Coastal Care Day · dietary_note","denied",41,0,"Gugu Pillay · wellbeing rule"),
  MCPL("yesterday 13:20","Thato Sekhoto","directory","list_appointments","subdivision=Southern Cluster","ok",188,96,"Thato Sekhoto · 12 of 312 localities"),
  MCPL("yesterday 11:47","Marcus Vilakazi","teams","add_member_to_chat","chat=GST Data Stewards · add Rethabile Sibanda","denied",22,0,"Marcus Vilakazi · tool blocked by default"),
  MCPL("yesterday 11:12","Warrick Meintjes","assemble","list_events","locality=Pretoria · Oct 2026","ok",204,58,"Warrick Meintjes · Events"),
  MCPL("yesterday 10:36","Colette Marais","orbit","get_itinerary","journey=JNY-4471","ok",1210,7,"Colette Marais · travel window ±30 days"),
  MCPL("yesterday 09:58","Adriaan de Villiers","finance-mcp","get_budget","cost_centre=GST-TRV-01 · Aug 2026","denied",26,0,"Adriaan de Villiers · connector not enabled"),
  MCPL("yesterday 09:14","Rika Olivier","directory","get_member","member_id=MBR-408812","ok",132,1,"Rika Olivier · Records Office"),
  MCPL("yesterday 08:40","Siyabonga Nxumalo","estates-mcp","list_properties","locality=Makhanda","ok",2740,164,"Estates shared key (31 users)"),
  MCPL("2 days ago 16:05","Rethabile Sibanda","warehouse","run_certified_query","attendance_by_area · Aug 2026","partial",860,912,"Rethabile Sibanda · Rustenburg"),
  MCPL("2 days ago 15:22","Nokuthula Dladla","warehouse","get_attendance","locality=Nelspruit · age_band","partial",290,74,"Nokuthula Dladla · under-18 suppressed"),
  MCPL("2 days ago 14:11","Thato Sekhoto","teams","create_meeting","“LDM review” · Thu 03 Sep 10:00 · 4 invitees","ok",710,0,"Thato Sekhoto"),
  MCPL("2 days ago 11:48","Brendan Jooste","warehouse","list_marts","—","ok",78,14,"Brendan Jooste · Finance"),
  MCPL("2 days ago 10:03","Pierre Vermeulen","directory","search_members","q=“Botha” · locality=Kimberley","ok",176,12,"Pierre Vermeulen · Kimberley"),
  MCPL("2 days ago 09:30","Zinhle Kunene","assemble","get_registrations","event=Care Day · access_note","denied",34,0,"Zinhle Kunene · purpose not recorded")
];

/* ---------- org policy ---------- */
const MCP_POLICY = {
  verifiedOnly:true,
  blockCustom:false,
  forbidSharedCredentials:true,
  requireAdminApproval:true,
  writesNeedApproval:true,
  logArguments:true,
  exposeSpiffAsServer:true,
  allowExternalClients:true,
  reconsentDays:90,
  reviewChangedTools:true,
  descriptions:{
    verifiedOnly:"Only Verified connectors can be enabled. Community and Custom connectors appear in the directory but cannot be turned on without an exception.",
    blockCustom:"Nobody outside Platform Admins can add a connector by URL. Turning this on would retire Estates Facilities.",
    forbidSharedCredentials:"Refuse any connector that authenticates with one key for everybody. Estates Facilities predates this rule and is flagged, not blocked.",
    requireAdminApproval:"Members request org connectors; a Platform Admin decides. Personal connectors like Outlook stay a personal choice.",
    writesNeedApproval:"Every write and destructive tool starts at Needs approval, in every connector, for everybody. A person can relax it for themselves; nobody can relax it for others.",
    logArguments:"Record the actual arguments of every call, not just the tool name. “Spiff ran a tool” is not an audit trail.",
    exposeSpiffAsServer:"Spiff answers as an MCP server, so Claude, Copilot and ChatGPT can ask it questions.",
    allowExternalClients:"External AI clients may connect. Each one still runs as the person who authorised it and sees only what that person sees.",
    reviewChangedTools:"When a connector adds or changes a tool after consent, re-gate it and raise a banner rather than inheriting the old approval."
  },
  allowList:[
    {domain:"ubteam.com",         note:"UBT Group Technology — all first-party connectors", by:"Standing rule"},
    {domain:"ubt-gst.internal",   note:"GST-operated internal services",                    by:"Standing rule"},
    {domain:"microsoft.com",      note:"Microsoft 365 — covered by the UBT data agreement", by:"Marcus Vilakazi · 21 Apr 2026"},
    {domain:"orbit-travel.co.za", note:"Contracted travel supplier",                        by:"Marcus Vilakazi · 03 Mar 2026"},
    {domain:"meteolabs.org",      note:"Exception — community, read-only, no identifiers sent", by:"Ezra Haddad · 02 Jun 2026"}
  ],
  requests:[
    {id:"req-gsheets",  connector:"gsheets",     who:"Thato Sekhoto",  on:"27 Aug 2026", note:"The Events team keeps the venue readiness tracker in Sheets. I want the Monday summary to include it instead of pasting it in by hand.", status:"open"},
    {id:"req-finance",  connector:"finance-mcp", who:"Adriaan de Villiers",  on:"26 Aug 2026", note:"Travel spend against budget by locality, for the quarterly pack. Read-only, my own cost centres.", status:"open"},
    {id:"req-sharepoint",connector:"sharepoint", who:"Amira Rasool",     on:"24 Aug 2026", note:"Filing the event readiness reports in the Events library instead of mailing attachments round.", status:"open"},
    {id:"req-slack",    connector:"slack",       who:"Gugu Pillay",     on:"19 Aug 2026", note:"Two external event suppliers work in Slack and will not move to Teams.", status:"declined", decision:"Declined by Marcus Vilakazi on 20 Aug — one retention policy across all division conversation. Suppliers can be guested into Teams instead."}
  ]
};

/* ---------------------------------------------------------------------
   Automation blocks — the same thing as connector tools.
   A block you drag into an automation is a tool a connector exposes.
   These used to live on a separate "Capabilities" screen; that screen was
   removed because it described connectors in different words. This map is
   what makes the two one thing, and it is deliberately honest about the
   blocks that no registered connector can actually deliver yet.
   connector:"spiff" = Spiff itself does it, no external system involved.
   connector:null    = proposed. Nothing behind it. It cannot be run.
   --------------------------------------------------------------------- */
const MCP_BLOCKS = {
  orbit_sched: {connector:"orbit",      tool:"hold_booking",     note:"Places 24-hour holds through the Orbit travel desk. It cannot confirm or pay."},
  orbit_flight:{connector:"orbit",      tool:"quote_fare",       note:"Prices and holds a fare. Confirmation stays with the travel desk."},
  orbit_hotel: {connector:"orbit",      tool:"hold_booking",     note:"Same hold mechanism as flights, against a hotel rate."},
  email:       {connector:"outlook",    tool:"send_mail",        note:"Sends as you, from your own mailbox. It appears in your Sent items."},
  push:        {connector:"teams",      tool:"post_to_channel",  note:"Posts to a Teams channel or chat you are already a member of."},
  upload:      {connector:"sharepoint", tool:"upload_file",      note:"Writes to a SharePoint library you can already write to."},
  pdf:         {connector:"spiff",      tool:"—",                note:"Spiff renders the document itself. Nothing leaves the tenant."},
  brief:       {connector:"spiff",      tool:"—",                note:"Spiff runs your saved answers on a clock and assembles the digest."},
  mission:     {connector:"spiff",      tool:"—",                note:"Same engine as the morning brief, addressed to a team."},
  approve:     {connector:"spiff",      tool:"—",                note:"Spiff pauses the automation and waits for a named person."},
  sms:         {connector:null,         tool:"—",                note:"No SMS gateway is registered as a connector. Nothing can send this yet."},
  wallet:      {connector:null,         tool:"—",                note:"No Google Wallet connector is registered, and no request for one is open."}
};
const blockOf   = id => MCP_BLOCKS[id] || {connector:null, tool:"—", note:"No connector is registered for this block."};
const blockState = id => {
  const b = blockOf(id);
  if(b.connector === "spiff") return "builtin";
  if(!b.connector) return "proposed";
  const c = CONNECTORS.find(x => x.id === b.connector);
  if(!c) return "proposed";
  return ["connected","reauth","error"].indexOf(c.state) >= 0 ? "available" : "needs-connector";
};
const BLOCK_STATE = {
  available:        {label:"Available",        cls:"ok",   note:"The connector behind it is connected, so this block runs."},
  builtin:          {label:"Built into Spiff", cls:"info", note:"Spiff does this itself. No external system is involved."},
  "needs-connector":{label:"Needs connecting", cls:"warn", note:"A connector exists for this, but it is not connected yet."},
  proposed:         {label:"Proposed",         cls:"crit", note:"Nothing is registered that could deliver this. It is an idea, not a capability."}
};
/* which blocks a given connector provides */
const blocksForConnector = cid => CAPS.filter(c => blockOf(c.id).connector === cid);
</script>
