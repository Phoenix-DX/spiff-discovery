<script>
/* =====================================================================
   Templates — 14 Sep 2026
   The third governed vocabulary. Definitions fix the words (Understand),
   business rules fix the rows (Apply rules), templates fix the SHAPE of
   an answer (Compose): which blocks, in what order, with what formats.
   A template never touches a number — the shape changes, the numbers do
   not. Checks ("totals must reconcile before display") are deliberately
   not here: Oren parked that half on 11 Sep; this is the format half.
   ===================================================================== */

/* the blocks a template is made of — a fixed set, so the spec is finite */
const TPL_BLOCKS = [
  {id:"headline",   label:"Headline numbers",  desc:"Up to three figures with a delta each."},
  {id:"chart",      label:"Chart",             desc:"One chart, of a permitted type."},
  {id:"table",      label:"Table",             desc:"The rows behind the figures, in the template's column order."},
  {id:"commentary", label:"Commentary",        desc:"What Spiff says about the numbers — short or full."},
  {id:"notes",      label:"Scope, as-at, withheld", desc:"Always present. A template cannot remove it.", fixed:true}
];
const TPL_CHARTS = ["any","bar","line","none"];
const TPL_STATUSES = ["Approved","In review","Draft","Retired"];
const TPL_STATUSCLS = {"Approved":"ok","In review":"warn","Draft":"mut","Retired":"mut"};

const TEMPLATES = [
  {id:"tpl-default", name:"Spiff default", system:true,
   applies:{datasets:[], teams:[], note:"Anything no other template claims."},
   blocks:["headline","chart","table","commentary","notes"], chart:"any", commentary:"full",
   formats:{numbers:"Thousands separators · one decimal on rates", currency:"NZ$ to the dollar", period:"Named — \"Q2 2026\", never \"last quarter\"", negatives:"Minus sign"},
   header:"none", owner:"Spiff", approver:null, status:"Approved", version:1, agreed:"01 Feb 2026",
   usedBy:{answers:41, automations:2},
   note:"The shape every answer has unless a template that fits better exists. Compose picks the chart type from the data."},
  {id:"tpl-ldm-brief", name:"LDM attendance brief",
   applies:{datasets:["meetings"], teams:["LDM Operations"], note:"Attendance questions asked by LDM coordinators."},
   blocks:["headline","chart","table","commentary","notes"], chart:"bar", commentary:"short",
   formats:{numbers:"Whole numbers · attendance as a percentage", currency:"—", period:"Named quarter or month", negatives:"Minus sign · red delta"},
   header:"none", owner:"Pavitra Govender", approver:"Reneilwe Dlomo", status:"Approved", version:4, agreed:"22 Aug 2026",
   usedBy:{answers:13, automations:3},
   note:"Three headline figures, a bar by subdivision, the table underneath, two sentences of commentary — the one to watch named."},
  {id:"tpl-stat-release", name:"Statutory release",
   applies:{datasets:["growth","members"], teams:["National Statistics"], note:"Anything that leaves the division as an official figure."},
   blocks:["headline","table","notes"], chart:"none", commentary:"none",
   formats:{numbers:"Rounded to the nearest 5 for display · no decimals", currency:"—", period:"\"Month YYYY\" · the release date stated", negatives:"Brackets"},
   header:"UBT", owner:"Rupert Mackenzie", approver:"Marcus Vilakazi", status:"Approved", version:3, agreed:"03 Sep 2026",
   usedBy:{answers:6, automations:2},
   note:"No chart and no commentary, on purpose: a statutory figure is a table with a header, and the words around it are the release note's job. Rounding here is display; the statutory rounding rule still runs at Apply rules."},
  {id:"tpl-finance-month", name:"Finance monthly pack",
   applies:{datasets:["budgets"], teams:["Finance & Cost"], note:"Budget against actual, by cost centre."},
   blocks:["headline","table","commentary","notes"], chart:"none", commentary:"short",
   formats:{numbers:"NZ$ to the dollar · variance as value and %", currency:"NZ$", period:"\"September 2026\" · month closed stated", negatives:"Brackets"},
   header:"UBT", owner:"Brendan Jooste", approver:"Ezra Haddad", status:"Approved", version:2, agreed:"09 Sep 2026",
   usedBy:{answers:0, automations:1},
   note:"Columns in this order: Cost centre · Budget · Actual · Variance · Variance %. Totals row last. Nothing is connected yet — this template waits for the finance source."},
  {id:"tpl-board", name:"Board one-pager",
   applies:{datasets:[], teams:["Regional Leadership"], note:"Anything a regional lead takes to a board."},
   blocks:["headline","chart","commentary","notes"], chart:"line", commentary:"full",
   formats:{numbers:"Rounded to thousands where over 10,000", currency:"NZ$", period:"Named · with the prior period alongside", negatives:"Minus sign"},
   header:"UBT", owner:"Murray Shepstone", approver:"Reneilwe Dlomo", status:"Draft", version:1, agreed:"—",
   usedBy:{answers:0, automations:0},
   note:"One page. Headline, one trend line, the commentary — no table; the table is a click away in the full answer."},
  {id:"tpl-digest", name:"Regional weekly digest",
   applies:{datasets:["meetings","events"], teams:["Regional Leadership"], note:"The Monday digest to regional coordinators."},
   blocks:["headline","table","notes"], chart:"none", commentary:"none",
   formats:{numbers:"Whole numbers", currency:"—", period:"\"Week to Sun 7 Sep\"", negatives:"Minus sign"},
   header:"none", owner:"Reneilwe Dlomo", approver:"Murray Shepstone", status:"In review", version:1, agreed:"—",
   usedBy:{answers:0, automations:1},
   note:"Lands in Teams; each recipient's copy is their own re-run. In review until Reneilwe and Murray agree the column order."}
];

const TPL_STATE = { q:"", status:"all", choice:{} };   /* choice: answer id → template id, when a person changed the layout */

function templateById(id){ return TEMPLATES.filter(function(t){ return t.id===id; })[0] || null; }
function tplBlock(id){ return TPL_BLOCKS.filter(function(b){ return b.id===id; })[0] || {id:id, label:id}; }
function tplLive(){ return TEMPLATES.filter(function(t){ return t.status==="Approved" || t.status==="In review"; }); }

/* which datasets and team an answer is about — the same facts Understand resolves */
const TPL_ANSWER_CTX = {
  ldm:      {datasets:["meetings"],            team:"LDM Operations"},
  oakridge: {datasets:["meetings"],            team:"LDM Operations"},
  stale:    {datasets:["meetings"],            team:"LDM Operations"},
  northern: {datasets:["meetings","members"],  team:"Regional Leadership"},
  growth:   {datasets:["growth","members"],    team:"National Statistics"},
  profile:  {datasets:["members","travel","events"], team:"Regional Leadership"}
};
function tplCtx(answerId){ return TPL_ANSWER_CTX[answerId] || {datasets:[], team:null}; }

/* the recommendation: score every live template against the question's datasets and team */
function tplFor(ctx){
  const scored = tplLive().filter(function(t){ return !t.system; }).map(function(t){
    let score = 0; const why = [];
    const hit = (ctx.datasets||[]).filter(function(d){ return t.applies.datasets.indexOf(d)>=0; });
    if(hit.length){ score += 2*hit.length; why.push("bound to "+hit.map(function(d){ const x = (typeof ds==="function") ? ds(d) : null; return x ? x.name : d; }).join(" and ")); }
    if(ctx.team && t.applies.teams.indexOf(ctx.team)>=0){ score += 1; why.push("your team's"); }
    if(t.status==="In review") score -= 0.5;
    return {t:t, score:score, why:why.join(" · ")};
  }).filter(function(x){ return x.score>0; }).sort(function(a,b){ return b.score-a.score; });
  const def = templateById("tpl-default");
  const chosen = scored.length ? scored[0] : {t:def, score:0, why:"nothing else claims this question"};
  const ambiguous = scored.length>1 && scored[0].score===scored[1].score;
  return { chosen: chosen.t, reason: chosen.why, candidates: scored.map(function(x){ return x.t; }).concat(scored.some(function(x){ return x.t.id===def.id; }) ? [] : [def]), ambiguous: ambiguous };
}
/* the template actually in force on an answer: the person's choice if they made one, else the recommendation */
function tplApplied(answerId){
  const pick = TPL_STATE.choice[answerId]; if(pick && templateById(pick)) return templateById(pick);
  return tplFor(tplCtx(answerId)).chosen;
}
</script>
