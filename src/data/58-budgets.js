<script>
/* =====================================================================
   Budgets and the AI provider — 11 Sep 2026
   Tokens are the engine. Nobody in the product sees one. Spiff meters
   tokens internally and shows New Zealand dollars, with a plain equivalent,
   derived from one rate card an admin owns. Budgets attach to scopes — the
   tenant, a team, a person — never to the model.

   Figures are estimates at magnitudes plausible for an organisation of
   ~430 people, and say so wherever they appear.
   ===================================================================== */

function NZD(v){
  if(v == null || isNaN(v)) return "—";
  const abs = Math.abs(v);
  const s = abs >= 1000 ? Math.round(abs).toLocaleString("en-NZ")
          : abs >= 100  ? Math.round(abs).toString()
          : abs >= 10   ? abs.toFixed(0)
          : abs.toFixed(2);
  return (v < 0 ? "−" : "") + "NZ$ " + s;
}

const BUDGET = {
  month:FX.month, dayOfMonth:FX.dayOfMonth, daysInMonth:FX.daysInMonth,
  tenant:{ cap:7500, used:2450, owner:"Platform Admins" },
  personDefault:40,
  me:{ used:6.40 },
  alerts:[ {at:80,  who:"the team manager"}, {at:100, who:"the team manager and every system admin"} ],
  /* what pauses first when a cap is reached — written down so it is never a surprise */
  /* raises wait for the Platform Admins in the Inbox; a raise never adds to the cap */
  raises:[ {id:"raise-1", team:"Regional Leadership", add:250, by:"Murray Shepstone", why:"Two new weekly packs for the cluster review, from next Monday", on:"today 08:10", status:"waiting"} ],
  cutOrder:["Scheduled refreshes pause, most frequent first", "Then metric triggers stop checking", "A person's own questions run until their own allowance is used", "Nothing ever runs on a cheaper model without saying so"],
  teams:{
    "LDM Operations":      {allowance:900, used:300, schedules:190, people:110, owner:"Reneilwe Dlomo"},
    "Membership Insights": {allowance:500, used:150, schedules:60,  people:90,  owner:"Cathleen Oberholzer"},
    "Regional Leadership": {allowance:400, used:391, schedules:262, people:129, owner:"Murray Shepstone"},
    "Finance & Cost":      {allowance:300, used:88,  schedules:41,  people:47,  owner:"Brendan Jooste"}
  }
};
/* a team created in Admin gets the default allowance until someone raises it */
function budgetFor(team){
  if(!BUDGET.teams[team]){
    const meta = (typeof TEAM_META !== "undefined" && TEAM_META[team]) || {};
    BUDGET.teams[team] = {allowance:300, used:0, schedules:0, people:0, owner:meta.manager || "—", isNew:true};
  }
  return BUDGET.teams[team];
}
function budgetForecast(used){ return used / BUDGET.dayOfMonth * BUDGET.daysInMonth; }
function budgetPct(used, cap){ return cap ? Math.min(999, Math.round(used / cap * 100)) : 0; }

/* the rate card: the one place a price lives. Every cost on every screen derives from it. */
const RATE_CARD = [
  {id:"sonnet", model:"Claude Sonnet 5",  inPer1k:0.0050, outPer1k:0.0250, use:"Answers, source reads, scheduled refreshes", note:"The default. Strong enough for cross-system questions, cheap enough to run on a clock."},
  {id:"haiku",  model:"Claude Haiku 4.5", inPer1k:0.0017, outPer1k:0.0085, use:"Summaries, classification, follow-up chips",  note:"About a third of the price. Used wherever the task is small."},
  {id:"opus",   model:"Claude Opus 5",    inPer1k:0.0250, outPer1k:0.1250, use:"Hard questions, when a team allows it",       note:"Five times the price. Off by default."}
];
const rateById = id => RATE_CARD.find(r => r.id === id);
const MODEL_ROUTES = [
  {id:"answer",  task:"Answering a question",                model:"sonnet", typical:"NZ$ 0.05 – 0.15"},
  {id:"read",    task:"Reading a source",                    model:"sonnet", typical:"NZ$ 60 – 150 a read"},
  {id:"refresh", task:"A scheduled refresh",                 model:"sonnet", typical:"NZ$ 0.06 a run"},
  {id:"small",   task:"Summaries and follow-up chips",       model:"haiku",  typical:"about NZ$ 0.01"},
  {id:"trace",   task:"A cross-system trace (the John Steyn case)", model:"opus", typical:"NZ$ 0.80 – 1.20", optional:true}
];

/* where answers are generated, and whose key pays for them */
const PROVIDER = {
  mode:"spiff",                       /* "spiff" — Spiff's own credential, on the tenant cap · "byo" — the organisation's own */
  provider:"Anthropic",
  host:"Microsoft Foundry — Australia East",
  hosts:["Microsoft Foundry — Australia East", "Amazon Bedrock — Sydney (ap-southeast-2)", "Google Vertex AI — Sydney (australia-southeast1)", "Anthropic API — direct"],
  billing:"UBT's Azure subscription, through the Azure Marketplace",
  retention:"none",                   /* zero-retention terms in place: prompts and answers are not kept or trained on */
  allowOpus:false,
  /* Spiff-managed means Spiff's own identity — no key to paste, rotate or leak. Entra ID grants the identity the Azure AI User role on the Foundry project. */
  key:{ kind:"entra", mask:"Entra ID · managed identity spiff-prod", by:"Ezra Haddad", on:"02 Sep 2026", verified:"today 06:12", calls30d:41260 },
  /* a team may bring its own credential: its usage is still metered and shown against its allowance, but billed to that team's own contract, not the tenant cap */
  teamKeys:[ {team:"Finance & Cost", kind:"key", mask:"Foundry project fin-cost-ai · key ••••••••k8Zr", by:"Brendan Jooste", on:"05 Sep 2026", verified:"today 06:12"} ]
};
/* what a credential looks like at each host — the wizard and Test connection read this, so changing host changes the form */
const PROVIDER_CRED = {
  "Microsoft Foundry":{ label:"Project key", endpointLabel:"Project endpoint", endpointPlaceholder:"https://<project>.services.ai.azure.com", placeholder:"32-character key from Keys and endpoint",
    note:"Or leave the key blank and grant Spiff's managed identity the Azure AI User role on the project — Entra ID, nothing to paste.", test:function(k){ return k==="" || /^[A-Za-z0-9]{32,}$/.test(k); }, mask:function(t){ return t ? "Foundry key ••••••••"+t : "Entra ID · managed identity spiff-prod"; }, bad:"A Foundry key is 32 characters or more, or blank for Entra ID" },
  "Amazon Bedrock":{ label:"IAM access key", endpointLabel:null, placeholder:"AKIA…", note:"Or an IAM role Spiff may assume; the secret is asked for on the next step.", test:function(k){ return /^AKIA[A-Z0-9]{16}$/.test(k); }, mask:function(t){ return "Bedrock key ••••••••"+t; }, bad:"An IAM access key starts with AKIA and is 20 characters" },
  "Google Vertex AI":{ label:"Service account key (JSON)", endpointLabel:null, placeholder:"{ \"type\": \"service_account\", … }", note:"The service account needs the Vertex AI User role.", test:function(k){ return /^\s*\{/.test(k); }, mask:function(t){ return "Vertex service account ••••••••"+t; }, bad:"That does not look like a service account key" },
  "Anthropic API":{ label:"API key", endpointLabel:null, placeholder:"sk-ant-api03-…", note:"Anthropic keys start with sk-ant-.", test:function(k){ return /^sk-ant-/.test(k) && k.length >= 20; }, mask:function(t){ return "sk-ant-api03-••••••••••••"+t; }, bad:"That does not look like an Anthropic key" }
};
function providerCred(){ const k = Object.keys(PROVIDER_CRED).filter(function(h){ return PROVIDER.host.indexOf(h) === 0; })[0]; return PROVIDER_CRED[k] || PROVIDER_CRED["Anthropic API"]; }
function providerWho(){ return PROVIDER.mode === "byo" ? "your organisation's own credential" : (PROVIDER.key.kind === "entra" ? "Spiff's managed identity" : "Spiff-managed key"); }
</script>
