<script>
/* =====================================================================
   Connectors — MCP in and MCP out.
   Directory · Connected · Spiff as a connector · Org policy · Activity
   ===================================================================== */
const MCPV = {tab:"directory", q:"", cat:"all", out:"all", conn:"all", acct:"me", view:"cards", bq:""};
const MCP_NOW = FX.now;
const MCP_CATS = ["Data","Comms","Travel","Files","Operations","Utilities"];
const MCP_SUGGEST = [
  ["sharepoint","You opened the LDM policy library six times this month. Spiff could read it in the conversation instead."],
  ["weather",   "Event Operations asked for this after two open-air gatherings were rained out."],
  ["finance-mcp","Three of your saved answers stop at “travel spend” because the budget side is missing."]
];
const MCP_CLIENTS = [
  {name:"Claude",             who:"Thato Sekhoto", on:"12 Aug 2026", expires:"10 Nov 2026", calls:284, state:"active"},
  {name:"Microsoft Copilot",  who:"Reneilwe Dlomo",   on:"04 Aug 2026", expires:"02 Nov 2026", calls:161, state:"active"},
  {name:"ChatGPT",            who:"Rethabile Sibanda", on:"—",           expires:"—",           calls:0,   state:"not authorised"}
];

/* ---------- small pieces ---------- */
function mcpAge(s){const t=Date.parse(s);return isNaN(t)?null:Math.round((MCP_NOW-t)/86400000);}
function mcpMark(c){
  const ic = /^<svg/.test(c.icon) ? c.icon : '<span style="font-family:var(--dsp);font-weight:700;font-size:14px">'+esc(c.icon)+'</span>';
  return '<div style="width:38px;height:38px;border-radius:11px;flex:none;display:grid;place-items:center;background:var('+c.tint+'-soft);color:var('+c.tint+')">'
    +'<span style="width:19px;height:19px;display:grid;place-items:center">'+ic+'</span></div>';
}
function mcpTrust(c){const t=MCP_TRUST[c.trust];return '<span class="bdg '+t.cls+'" title="'+esc(t.note)+'">'+(c.trust==="verified"?I2.shield:c.trust==="community"?I2.people:I2.pencil)+t.label+'</span>';}
function mcpState(c){const s=MCP_STATES[c.state];return '<span class="bdg '+s.cls+'"><i class="dotd"></i>'+s.label+'</span>';}
function mcpCaps(c){return c.capability.map(k=>'<span class="bdg '+MCP_CAPS[k].cls+'" title="'+esc(MCP_CAPS[k].note)+'">'+MCP_CAPS[k].label+'</span>').join("");}
function mcpPerm(v){
  const m={allow:["Always allow","ok"],ask:["Needs approval","warn"],block:["Blocked","crit"]};
  return '<span class="bdg '+m[v][1]+'">'+m[v][0]+'</span>';
}
function mcpKind(k){
  const m={read:["Reads","info"],write:["Writes","warn"],destructive:["Destructive","crit"]};
  return '<span class="bdg '+m[k][1]+'">'+m[k][0]+'</span>';
}
function mcpAct(c){
  if(c.state==="connected") return '<button class="btn sm" onclick="openConnector(\''+c.id+'\')">Manage</button>';
  if(c.state==="reauth")    return '<button class="btn sm pri" onclick="mcpConsent(\''+c.id+'\',1)">Reconnect</button>';
  if(c.state==="error")     return '<button class="btn sm" onclick="mcpRetry(\''+c.id+'\')">Retry</button>';
  if(c.state==="requested") return '<span class="bdg warn">'+I2.clock+'Requested '+esc(c.requestedOn||"")+'</span>';
  if(c.state==="blocked")   return '<button class="btn sm" onclick="mcpWhyBlocked(\''+c.id+'\')">Why is this blocked?</button>';
  return c.rights==="connect"
    ? '<button class="btn sm pri" onclick="mcpConsent(\''+c.id+'\',1)">Connect</button>'
    : '<button class="btn sm" onclick="mcpRequest(\''+c.id+'\')">Request</button>';
}
function mcpCard(c){
  const age = mcpAge(c.updated), stale = age!==null && age>=70;
  return '<div class="panel" style="display:flex;flex-direction:column">'
    +'<div class="panel-b" style="flex:1;display:flex;flex-direction:column;gap:10px">'
      +'<div class="rowflex" style="align-items:flex-start;flex-wrap:nowrap">'+mcpMark(c)
        +'<div style="flex:1;min-width:0"><div style="font-family:var(--dsp);font-weight:600;font-size:15px;cursor:pointer" onclick="openConnector(\''+c.id+'\')">'+esc(c.name)+'</div>'
        +'<div class="mutedtext" style="font-size:12px">'+esc(c.publisher)+'</div></div>'+mcpTrust(c)+'</div>'
      +'<div class="mutedtext" style="font-size:13px;line-height:1.5">'+esc(c.desc)+'</div>'
      +'<div class="rowflex" style="gap:6px">'+mcpCaps(c)+'</div>'
      +'<div style="flex:1"></div>'
      +'<div class="rowflex" style="gap:8px">'+mcpState(c)+'<div class="sp"></div>'+mcpAct(c)+'</div>'
    +'</div>'
    +'<div class="panel-f" style="font-size:11.5px;flex-wrap:wrap">'
      +(c.users?'<span>'+fmt(c.users)+' people in GST</span>':'<span>Nobody in GST uses this yet</span>')
      +'<span style="opacity:.4">·</span><span>Updated '+esc(c.updated)+'</span>'
      +(stale?'<span class="bdg warn" title="Staleness is a security signal — an unmaintained connector is a risk, not just an inconvenience.">Quiet for '+Math.round(age/30)+' months</span>':'')
    +'</div></div>';
}
function mcpMatch(c){
  const q=MCPV.q.trim().toLowerCase();
  if(MCPV.cat!=="all" && c.category!==MCPV.cat) return false;
  if(!q) return true;
  return (c.name+" "+c.publisher+" "+c.desc+" "+c.category+" "+c.tools.map(t=>t.name).join(" ")).toLowerCase().indexOf(q)>=0;
}

/* ---------- tab 1: directory — cards or table ---------- */
const MCP_CARD_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>';
const MCP_TABLE_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 9v11"/></svg>';
function mcpSetView(v){MCPV.view=v;mcpRepaint();document.querySelectorAll("#mcp-viewseg button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));}
function mcpViewSeg(){
  return '<div class="seg2 layoutseg" id="mcp-viewseg" title="How the directory is laid out">'
    +'<button class="'+(MCPV.view==="cards"?"on":"")+'" data-v="cards" onclick="mcpSetView(\'cards\')">'+MCP_CARD_ICO+' Cards</button>'
    +'<button class="'+(MCPV.view==="table"?"on":"")+'" data-v="table" onclick="mcpSetView(\'table\')">'+MCP_TABLE_ICO+' Table</button></div>';
}
/* the directory, cards or table, on the one list frame — the sort state is
   shared, so switching layout keeps your order */
function mcpDirFrame(list){
  const stRank = {connected:0, reauth:1, error:2, requested:3, available:4, blocked:5};
  const o = {
    items: list, repaint: mcpRepaint, noun: "connectors", noun1: "connector", size: 12,
    sorts: [{key:"name",  label:"Name",       get:function(c){ return c.name; }},
            {key:"cat",   label:"Category",   get:function(c){ return c.category; }},
            {key:"state", label:"Status",     get:function(c){ return stRank[c.state]==null ? 9 : stRank[c.state]; }},
            {key:"users", label:"Most used",  get:function(c){ return c.users||0; }, desc:true},
            {key:"tools", label:"Most tools", get:function(c){ return c.tools.length; }, desc:true}],
    emptyTitle: "Nothing matches “"+MCPV.q+"”", emptySub: "Try a publisher, a category, or the name of a tool like “send_mail”.", emptyIcon: "search"
  };
  if(MCPV.view === "table"){
    o.cols = [
      {label:"Connector", sort:"name", cell:function(c){
        return '<div class="rowflex" style="flex-wrap:nowrap;gap:10px">'+mcpMark(c)
          + '<div style="min-width:0"><div style="font-weight:600">'+esc(c.name)+'</div>'
          + '<div class="mutedtext" style="font-size:11.5px">'+esc(c.publisher)+'</div></div></div>'; }},
      {label:"Category", sort:"cat", cell:function(c){ return esc(c.category); }},
      {label:"What it does", cell:function(c){ return '<div class="mutedtext" style="font-size:12.5px;line-height:1.45">'+esc(c.desc)+'</div>'; }},
      {label:"Trust", cell:function(c){ return mcpTrust(c); }},
      {label:"Reach", cell:function(c){ return '<div class="rowflex" style="gap:5px">'+mcpCaps(c)+'</div>'; }},
      {label:"Tools", sort:"tools", num:true, cell:function(c){
        const b = blocksForConnector(c.id).length;
        return c.tools.length+(b?'<div class="mutedtext nw" style="font-size:11px">'+b+' block'+(b===1?'':'s')+'</div>':''); }},
      {label:"People", sort:"users", num:true, cell:function(c){ return c.users ? fmt(c.users) : '—'; }},
      {label:"Status", sort:"state", cell:function(c){
        const age = mcpAge(c.updated), stale = age!==null && age>=70;
        return mcpState(c)+(stale?'<div class="mutedtext nw" style="font-size:11px;margin-top:3px">quiet '+Math.round(age/30)+' mo</div>':''); }},
      {label:"", cell:function(c){ return '<span onclick="event.stopPropagation()">'+mcpAct(c)+'</span>'; }}];
    o.rowClick = function(c){ return "openConnector('"+c.id+"')"; };
  } else { o.row = mcpCard; o.bodyClass = "g3"; }
  return listFrame("mcp-dir", o);
}
function mcpGridHTML(){ return mcpDirFrame(CONNECTORS.filter(mcpMatch)); }
function mcpRepaint(){const g=$("#mcp-grid");if(g)g.innerHTML=mcpGridHTML();const n=$("#mcp-count-shown");if(n)n.textContent=CONNECTORS.filter(mcpMatch).length;}
function mcpSearch(v){MCPV.q=v;mcpRepaint();}
function mcpCat(v){MCPV.cat=v;document.querySelectorAll("#mcp-cats .fchip2").forEach(b=>b.classList.toggle("on",b.dataset.cat===v));mcpRepaint();}
function mcpDirectoryHTML(){
  const sug = MCP_SUGGEST.map(s=>{const c=connectorById(s[0]);
    return '<div class="pickcard" onclick="openConnector(\''+c.id+'\')">'+mcpMark(c)
      +'<div><div class="pn2">'+esc(c.name)+' <span class="mutedtext" style="font-weight:400">· '+esc(c.publisher)+'</span></div>'
      +'<div class="pd2">'+esc(s[1])+'</div></div></div>';}).join("");
  return '<div class="stack">'
    +'<div class="bigsearch">'+I2.search+'<input id="mcp-q" placeholder="Search connectors, publishers or tool names…" value="'+esc(MCPV.q)+'" oninput="mcpSearch(this.value)"></div>'
    +'<div class="rowflex"><div class="chipbar" id="mcp-cats">'
      +'<button class="fchip2'+(MCPV.cat==="all"?" on":"")+'" data-cat="all" onclick="mcpCat(\'all\')">All</button>'
      +MCP_CATS.map(k=>'<button class="fchip2'+(MCPV.cat===k?" on":"")+'" data-cat="'+k+'" onclick="mcpCat(\''+k+'\')">'+k+'</button>').join("")
      +'</div><div class="sp"></div><div class="mutedtext"><b id="mcp-count-shown">'+CONNECTORS.filter(mcpMatch).length+'</b> of '+CONNECTORS.length+' shown</div>'+mcpViewSeg()+'</div>'
    +panel("Suggested for you",'<div class="g3">'+sug+'</div>',{icon:"spark",sub:"Because of what you ask, not because someone paid for placement"})
    +'<div id="mcp-grid">'+mcpGridHTML()+'</div>'
    +callout("mut","<b>Trust labels are honest here.</b> Verified means UBT Group Technology tested it for quality and compatibility — it is not a security audit. Once you connect a connector, its label makes no difference to what it can reach.")
    +'</div>';
}

/* ---------- tab 2: connected ---------- */
function mcpConnRow(c){
  const s=MCP_STATES[c.state];
  return '<tr class="clk" onclick="openConnector(\''+c.id+'\')"><td><div class="rowflex" style="flex-wrap:nowrap">'
    +'<i class="dotd" style="color:var(--'+(c.state==="connected"?"ok":c.state==="reauth"?"warn":"crit")+')"></i>'
    +'<div><div style="font-weight:600">'+esc(c.name)+'</div><div class="mutedtext" style="font-size:11.5px">'+esc(c.publisher)+'</div></div></div></td>'
    +'<td><div class="tech">'+esc(c.connectedAs||"—")+'</div><div class="mutedtext" style="font-size:11.5px">'+esc(c.auth)+'</div></td>'
    +'<td>'+esc(c.connectedOn||"—")+'</td>'
    +'<td class="num">'+c.tools.length+'</td><td class="num">'+fmt(c.calls30d)+'</td>'
    +'<td><div class="tech" style="font-size:11.5px">'+esc(c.health.uptime)+' up · '+esc(c.health.errorRate)+' err · '+esc(c.health.p95)+'</div>'
    +'<div class="mutedtext" style="font-size:11.5px">Last call '+esc(c.health.lastCall)+'</div></td>'
    +'<td><span class="bdg '+s.cls+'">'+s.label+'</span></td>'
    +'<td onclick="event.stopPropagation()"><div class="rowflex" style="gap:5px;flex-wrap:nowrap">'
      +(c.state==="connected"?'':'<button class="btn sm" onclick="mcpConsent(\''+c.id+'\',1)">Reconnect</button>')
      +'<button class="btn sm ghost" onclick="mcpEdit(\''+c.id+'\')">Edit</button>'
      +'<button class="btn sm ghost danger" onclick="mcpRemove(\''+c.id+'\')">Remove</button></div></td></tr>';
}
function mcpConnectedHTML(){
  const live = CONNECTORS.filter(c=>["connected","reauth","error"].indexOf(c.state)>=0);
  const tools = live.reduce((a,c)=>a+c.tools.length,0);
  const calls = live.reduce((a,c)=>a+c.calls30d,0);
  const attn  = live.filter(c=>c.state!=="connected"||c.changed.length).length;
  const drift = CONNECTORS.filter(c=>c.changed.length);
  const banner = drift.map(c=>callout("warn","<b>"+esc(c.name)+" added "+c.changed.length+" tools since you consented.</b> "
    +esc(c.changed.map(x=>x.tool).join(", "))+" appeared on "+esc(c.changed[0].on)+". Tools can change after a connector is reviewed, so Spiff holds the new ones at their safest setting until a person looks at them. "
    +'<button class="btn sm" style="margin-top:9px" onclick="mcpReviewChanges(\''+c.id+'\')">Review the three new tools</button>')).join("");
  const broken = live.filter(c=>c.errorText).map(c=>callout(c.state==="error"?"crit":"warn","<b>"+esc(c.name)+" — "+MCP_STATES[c.state].label+".</b> "+esc(c.errorText)
    +' <button class="btn sm" style="margin-left:6px" onclick="'+(c.state==="error"?'mcpRetry(\''+c.id+'\')':'mcpConsent(\''+c.id+'\',1)')+'">'+(c.state==="error"?"Retry":"Reconnect")+'</button>')).join("");
  return '<div class="stack">'
    +'<div class="g4">'+kpi("Connectors live",live.length,"of "+CONNECTORS.length+" in the directory")
      +kpi("Tools available",tools,"across every connected system")
      +kpi("Calls in 30 days",fmt(calls),"logged against a named person")
      +kpi("Needing attention",attn,attn?"reauth, error or changed tools":"all healthy")+'</div>'
    +banner+broken
    +panel("Connected systems",'<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Connector</th><th>Connected as</th><th>Connected on</th><th class="num">Tools</th><th class="num">30-day calls</th><th>Health</th><th>Status</th><th></th></tr></thead><tbody>'
      +live.map(mcpConnRow).join("")+'</tbody></table></div>',
      {icon:"plug",sub:"Each connection authenticates as the person using it — there is no shared Spiff account",tight:true,
       foot:"Auth settings cannot be edited after a connector is added. To change them, remove it and add it again — everyone who uses it reconnects."})
    +callout("info","<b>Every row here runs as its owner.</b> When one of your automations calls Orbit at 07:00, it calls as you, with your travel window, not with a service account that can see everything.")
    +'</div>';
}

/* ---------- tab: automation blocks (was the Capabilities screen) ---------- */
function mcpBlockState(id){const s=BLOCK_STATE[blockState(id)];return '<span class="bdg '+s.cls+'" title="'+esc(s.note)+'">'+s.label+'</span>';}
function mcpBlockFrom(id){
  const b=blockOf(id);
  if(b.connector==="spiff") return '<span class="mutedtext">Spiff itself</span>';
  if(!b.connector) return '<span class="mutedtext">Nothing registered</span>';
  const c=CONNECTORS.find(x=>x.id===b.connector);
  if(!c) return '<span class="mutedtext">Nothing registered</span>';
  return '<a href="javascript:void 0" onclick="event.stopPropagation();openConnector(\''+c.id+'\')" style="font-weight:600;color:var(--accent)">'+esc(c.name)+'</a>'
    + (b.tool!=="—" ? '<div class="tech" style="font-size:11.5px">'+esc(b.tool)+'</div>' : '');
}
function mcpBlockMatch(c){
  const q=MCPV.bq.trim().toLowerCase(); if(!q) return true;
  const b=blockOf(c.id), cn=b.connector?(CONNECTORS.find(x=>x.id===b.connector)||{}).name||"":"";
  return (c.n+" "+c.cat+" "+cn+" "+b.tool+" "+b.note).toLowerCase().indexOf(q)>=0;
}
function mcpBlockSearch(v){ MCPV.bq=v; mcpBlocksRepaint(); }
function mcpBlocksRepaint(){ const el=$("#mcp-blocks-frame"); if(el) el.innerHTML=mcpBlocksFrame(); const n=$("#mcp-blockn"); if(n) n.textContent=CAPS.filter(mcpBlockMatch).length; }
function mcpBlocksFrame(){
  const stRank={available:0, builtin:1, "needs-connector":2, proposed:3};
  return listFrame("mcp-blocks", {
    items: CAPS.filter(mcpBlockMatch), repaint: mcpBlocksRepaint, noun: "blocks", noun1: "block", size: 12,
    sorts: [{key:"name",  label:"Name",        get:function(c){ return c.n; }},
            {key:"from",  label:"Comes from",  get:function(c){ return blockProvider(c.id); }},
            {key:"state", label:"Status",      get:function(c){ const k=stRank[blockState(c.id)]; return k==null?9:k; }},
            {key:"cat",   label:"Category",    get:function(c){ return c.cat; }}],
    cols: [{label:"Block", sort:"name", cell:function(c){
              return '<div class="rowflex" style="gap:9px;flex-wrap:nowrap"><span style="width:17px;height:17px;flex:none;display:grid;place-items:center;color:var(--muted)">'+(ICON[c.ik]||"")+'</span>'
                + '<div><div style="font-weight:600">'+esc(c.n)+'</div><div class="mutedtext" style="font-size:11.5px">'+esc(c.cat)+'</div></div></div>'; }},
           {label:"Comes from", sort:"from", cell:function(c){ return mcpBlockFrom(c.id); }},
           {label:"What it actually does", cell:function(c){ return '<div class="mutedtext" style="font-size:12.5px;line-height:1.45">'+esc(blockOf(c.id).note)+'</div>'; }},
           {label:"What it needs from you", cell:function(c){ const needs=capFields(c.id).map(f=>f.label).join(", ")||"Nothing — it just runs"; return '<div style="font-size:12.5px">'+esc(needs)+'</div>'; }},
           {label:"Who can use it", cell:function(c){ return esc(capWho(c.id)); }},
           {label:"Status", sort:"state", cell:function(c){ return mcpBlockState(c.id); }}],
    rowStyle: function(c){ return blockState(c.id)==="proposed" ? "opacity:.72" : ""; },
    emptyTitle: "Nothing matches “"+MCPV.bq+"”", emptyIcon: "search"
  });
}
function mcpBlocksHTML(){
  const tally=k=>CAPS.filter(c=>blockState(c.id)===k).length;
  const proposed=CAPS.filter(c=>blockState(c.id)==="proposed");
  return '<div class="stack">'
    +callout("info","<b>An automation block is a connector tool.</b> These are the blocks you drag into an automation, and every one of them is a tool a connector exposes — or something Spiff does itself. They used to have their own screen, which described the same things in different words. Connect a connector and its blocks become usable; there is no second place to publish them.")
    +'<div class="rowflex" style="gap:8px;flex-wrap:wrap">'
      +bdg(tally("available")+" available","ok")+bdg(tally("builtin")+" built into Spiff","info")
      +bdg(tally("needs-connector")+" need connecting","warn")+bdg(tally("proposed")+" proposed","crit")+'</div>'
    +'<div class="bigsearch">'+I2.search+'<input placeholder="Search blocks, connectors or tool names…" value="'+esc(MCPV.bq)+'" oninput="mcpBlockSearch(this.value)"></div>'
    +panel('Blocks <span class="bdg mut" style="margin-left:6px"><b id="mcp-blockn">'+CAPS.filter(mcpBlockMatch).length+'</b>&nbsp;of '+CAPS.length+'</span>',
       '<div id="mcp-blocks-frame">'+mcpBlocksFrame()+'</div>',
       {icon:"bolt",sub:"Publish once — it appears in the automation palette and as something people can ask for"})
    +(proposed.length?callout("warn","<b>"+proposed.length+" of these are proposed, not built.</b> "+proposed.map(c=>esc(c.n)).join(" and ")+" appear in the palette so the shape of the idea is visible, but nothing is registered that could run them. They are marked in the palette too, so nobody builds an automation that quietly does nothing."):"")
    +'</div>';
}

/* ---------- tab 3: Spiff as a connector ---------- */
function mcpToolRow(t){
  return '<div style="display:flex;gap:14px;align-items:flex-start;padding:13px 0;border-bottom:1px solid var(--hair2)">'
    +'<div style="flex:1;min-width:0"><div class="rowflex" style="gap:8px"><span class="mono" style="font-weight:600;font-size:13.5px">'+esc(t.name)+'</span>'+mcpKind(t.kind)+'</div>'
    +'<div class="mutedtext" style="font-size:13px;margin-top:4px;line-height:1.5">'+esc(t.desc)+'</div>'
    +'<div class="mutedtext" style="font-size:12px;margin-top:6px"><b>Takes</b> '+t.args.map(a=>'<span class="mono">'+esc(a.n)+'</span>').join(", ")+'</div>'
    +'<div class="mutedtext" style="font-size:12px;margin-top:3px"><b>Returns</b> '+esc(t.returns)+'</div></div>'
    +'<div style="flex:none">'+tri(t.perm)+'</div></div>';
}
function mcpServerHTML(){
  const reads=SPIFF_TOOLS.filter(t=>t.kind==="read"), writes=SPIFF_TOOLS.filter(t=>t.kind==="write");
  const inScope = DATASETS.filter(d=>d.access.indexOf("No access")<0 && d.cert!=="blocked");
  const outScope= DATASETS.filter(d=>d.access.indexOf("No access")===0 || d.cert==="blocked");
  const endpoint = "Endpoint    https://ubt-gst.spiff.internal/mcp\n"
    +"Transport   Streamable HTTP\n"+"Protocol    2026-07-28\n"
    +"Auth        OAuth 2.1 + PKCE — one sign-in per person\n"+"Tenant      "+ORG.tenant;
  const tryReq = "Claude → Spiff    tools/call\n{\n  \"name\": \"run_report\",\n  \"arguments\": {\n    \"report_id\": \"gst-weekly-attendance\",\n    \"filters\": { \"period\": \"Q3 2026\" }\n  }\n}";
  const tryRes = "Spiff → Claude    result\n{\n  \"ran_as\":     \"Thato Sekhoto · LDM Coordinator\",\n  \"scope\":      \"Makhanda, Bloemfontein, Pietermaritzburg, Stellenbosch — 4 of 6 areas\",\n  \"rows\":       1284,\n  \"suppressed\": \"3 localities below the minimum count of 5\",\n  \"definition\": \"Attendance v3 — a confirmed check-in at a Regular or Special meeting\",\n  \"audit_id\":   \"MCP-2026-08-30-0941\"\n}";
  const cannot = ["Widen who can see a report. Sharing organises, it never widens access.",
    "Change anybody's permissions, groups or roles.",
    "Query outside the semantic model — there is no tool that accepts SQL.",
    "Return a raw table extract. Results come back at the grain the report defines.",
    "See a dataset you cannot see. Blocked datasets are absent from list_datasets, not merely empty.",
    "Act as anyone but you. There is no impersonation parameter on any tool.",
    "Keep working after your access changes. Permissions are re-read on every call, not at sign-in.",
    "Reach pastoral care notes. Those fields are not loaded into Spiff at all, for anyone."];
  return '<div class="stack">'
    +callout("info","<b>This is the outward-facing side.</b> Claude, Copilot or ChatGPT connect to Spiff and ask it questions. Spiff answers as the person who authorised the client — same scope, same definitions, same audit trail as if they had asked in Spiff itself.")
    +'<div class="split">'
      +'<div class="stack" style="min-width:0">'
        +panel("Connection details",'<div class="codeblock">'+esc(endpoint)+'</div>'
          +'<div class="mutedtext" style="font-size:13px;line-height:1.6;margin-top:12px">Each person signs in once with their own UBT account. Spiff never accepts a token issued for something else, and there is no shared key — a client that cannot name a person cannot connect.</div>',{icon:"link"})
        +panel("Clients connected to Spiff",'<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Client</th><th>Authorised by</th><th>On</th><th>Consent expires</th><th class="num">Calls</th></tr></thead><tbody>'
          +MCP_CLIENTS.map(c=>'<tr><td><b>'+esc(c.name)+'</b>'+(c.state!=="active"?' <span class="bdg mut">not authorised</span>':'')+'</td>'
            +'<td>'+esc(c.who)+'</td><td>'+esc(c.on)+'</td><td>'+esc(c.expires)+'</td><td class="num">'+fmt(c.calls)+'</td></tr>').join("")
          +'</tbody></table></div>',{icon:"grid",tight:true})
      +'</div>'
      +'<div class="stack" style="min-width:0">'
        +panel("Running as",'<div class="stack">'+personChip(ME.full,ME.title)
          +'<dl class="kv"><dt>Tenant</dt><dd>'+esc(ORG.tenant)+'</dd><dt>Scope</dt><dd>'+esc(ME.scope)+'</dd>'
          +'<dt>Groups</dt><dd>'+ME.groups.map(g=>esc((groupById(g)||{name:g}).name)).join(", ")+'</dd>'
          +'<dt>Reviewed</dt><dd>'+esc(ME.lastReview)+'</dd></dl>'
          +callout("ok","Identity and permissions are re-checked at the moment each call runs — not when the client connected. If your access changes at 09:00, the 09:01 call reflects it.")+'</div>',{icon:"shield"})
        +panel("Consent &amp; revocation",'<div class="kvlist">'
          +'<div class="r"><span class="k">Granted</span><span class="v">12 Aug 2026</span></div>'
          +'<div class="r"><span class="k">Expires</span><span class="v">10 Nov 2026</span></div>'
          +'<div class="r"><span class="k">Re-consent every</span><span class="v">'+MCP_POLICY.reconsentDays+' days</span></div></div>'
          +'<div style="margin-top:12px">'+meter(58)+'</div>'
          +'<div class="mutedtext" style="font-size:12px;margin-top:6px">72 days left. You will be asked again, in full, rather than rolled over quietly.</div>'
          +'<button class="btn danger" style="width:100%;justify-content:center;margin-top:13px" onclick="mcpRevoke()">Revoke access for all clients</button>',{icon:"lock"})
      +'</div>'
    +'</div>'
    +panel("Tools Spiff exposes",'<div class="rowflex" style="margin-bottom:4px">'+bdg("Reads · "+reads.length,"info")+bdg("Writes · "+writes.length,"warn")
      +'<div class="sp"></div><span class="mutedtext" style="font-size:12.5px">Writes start at Needs approval and stay there until a person moves them</span></div>'
      +'<div class="hairline"></div><div style="font-family:var(--dsp);font-weight:600;font-size:14px;margin-bottom:4px">Read tools — default Always allow</div>'
      +reads.map(mcpToolRow).join("")
      +'<div style="font-family:var(--dsp);font-weight:600;font-size:14px;margin:20px 0 4px">Write tools — default Needs approval</div>'
      +writes.map(mcpToolRow).join(""),{icon:"bolt",sub:"There is no run_sql. That is the point."})
    +'<div class="g2">'
      +panel("What the client receives",'<ul style="margin:0;padding-left:19px;font-size:13.5px;line-height:1.85">'
        +'<li>Rows at the grain the report defines, already filtered to you.</li>'
        +'<li>A scope banner naming the identity and the row filters applied.</li>'
        +'<li>The agreed definition behind every measure, with its version.</li>'
        +'<li>An explicit note wherever a cell was suppressed, and why.</li>'
        +'<li>An audit reference it can quote back.</li></ul>'
        +'<div class="hairline"></div><div class="mutedtext" style="font-size:13px;line-height:1.6">Results reach the client you authorised and go no further. Nothing is retained by Spiff beyond the log line.</div>',{icon:"down"})
      +panel("What it cannot do",'<div class="callout crit" style="margin-bottom:12px">'+I2.lock+'<div><b>The ceiling, stated plainly.</b> No prompt, no argument and no clever phrasing gets past this list.</div></div>'
        +'<ul style="margin:0;padding-left:19px;font-size:13.5px;line-height:1.85">'+cannot.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>',{icon:"lock"})
    +'</div>'
    +panel("Data scope this identity resolves to",
      '<div class="mutedtext" style="font-size:13px;margin-bottom:12px">Not a role name — the actual datasets and row filters an external client inherits when it runs as you.</div>'
      +'<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Dataset</th><th>Sensitivity</th><th>What you get</th><th>Row filter</th></tr></thead><tbody>'
      +inScope.map(d=>'<tr class="clk" onclick="openDataset(\''+d.id+'\')"><td><b>'+esc(d.name)+'</b><div class="tech">'+esc(d.tech)+'</div></td>'
        +'<td>'+sensBadge(d.sens)+'</td><td>'+esc(d.access)+'</td><td class="mutedtext">'+esc(d.accessNote)+'</td></tr>').join("")
      +outScope.map(d=>'<tr class="clk" onclick="openDataset(\''+d.id+'\')" style="background:var(--crit-soft)"><td><b>'+esc(d.name)+'</b><div class="tech">'+esc(d.tech)+'</div></td>'
        +'<td>'+sensBadge(d.sens)+'</td><td><span class="bdg crit">Not in scope</span></td><td class="mutedtext">'+esc(d.accessNote)+'</td></tr>').join("")
      +'</tbody></table></div>',{icon:"db",tight:false,
      foot:"A dataset you are not entitled to is absent from list_datasets — the client is told it does not exist for this identity, never handed an empty table that looks like a real answer."})
    +panel("Try it",'<div class="g2"><div><div class="mutedtext" style="font-size:12px;margin-bottom:7px">The call Claude makes</div><div class="codeblock">'+esc(tryReq)+'</div></div>'
      +'<div><div class="mutedtext" style="font-size:12px;margin-bottom:7px">What comes back</div><div class="codeblock">'+esc(tryRes)+'</div></div></div>'
      +'<div class="hairline"></div>'
      +callout("ok","<b>The same call from Reneilwe's Claude returns 2 044 rows and a different scope banner.</b> Same tool, same arguments, different answer — because it is a different person. That is the whole design in one exchange.")
      +'<div class="rowflex" style="margin-top:12px"><button class="btn" onclick="mcpTry()">'+I2.play+'Run this example</button>'
      +'<button class="btn ghost" onclick="go(\'audit\')">See it in the activity log</button></div>',{icon:"spark"})
    +callout("mut","<b>Every call is logged against the person it ran as</b> — tool, arguments, outcome, duration and rows, kept for 24 months. Nothing an AI client does through Spiff is invisible to the person it did it as.")
    +'</div>';
}

/* ---------- tab 4: org policy ---------- */
function mcpPolicyToggle(k,label){MCP_POLICY[k]=!MCP_POLICY[k];toast("“"+label+"” is now "+(MCP_POLICY[k]?"on":"off")+" — recorded in the activity log against your name");mcpRender();}
function mcpPolicyRow(k,label){
  return '<div class="swrow"><div class="sl"><div class="sn">'+esc(label)+'</div><div class="sd">'+esc(MCP_POLICY.descriptions[k])+'</div></div>'+sw(MCP_POLICY[k],"mcpPolicyToggle('"+k+"','"+label+"')",label)+'</div>';
}
function mcpPolicyHTML(){
  const open = MCP_POLICY.requests.filter(r=>r.status==="open");
  const done = MCP_POLICY.requests.filter(r=>r.status!=="open");
  const reqRow = r=>{const c=connectorById(r.connector);
    return '<div style="padding:15px 0;border-bottom:1px solid var(--hair2)"><div class="rowflex" style="align-items:flex-start">'+mcpMark(c)
      +'<div style="flex:1;min-width:0"><div class="rowflex" style="gap:8px"><b>'+esc(c.name)+'</b>'+mcpTrust(c)+'<span class="mutedtext" style="font-size:12px">'+esc(r.on)+'</span></div>'
      +'<div style="margin-top:7px">'+personChip(r.who,(personByName(r.who)||{}).title||"")+'</div>'
      +'<div class="defblock" style="margin-top:10px">'+esc(r.note)+'</div>'
      +(r.decision?'<div class="mutedtext" style="font-size:12.5px;margin-top:9px">'+esc(r.decision)+'</div>':'')
      +'</div>'
      +(r.status==="open"?'<div class="rowflex" style="gap:6px;flex:none"><button class="btn sm pri" onclick="mcpDecide(\''+r.id+'\',\'approve\')">Approve</button>'
        +'<button class="btn sm" onclick="mcpDecide(\''+r.id+'\',\'decline\')">Decline</button></div>':'<span class="bdg crit">Declined</span>')
      +'</div></div>';};
  return '<div class="stack">'
    +callout("mut","<b>Platform Admins set this page</b> — Marcus Vilakazi and Ezra Haddad. Everyone else can read it, because a rule you cannot read is a rule you cannot follow. Every change is written to the activity log with who made it.")
    +panel("Policy",[["verifiedOnly","Verified connectors only"],["blockCustom","Block custom connectors"],["forbidSharedCredentials","Forbid shared credentials"],
        ["requireAdminApproval","Org connectors need admin approval"],["writesNeedApproval","Write tools start at Needs approval"],["logArguments","Log the actual arguments"],
        ["reviewChangedTools","Re-gate tools that change after consent"],["exposeSpiffAsServer","Expose Spiff as an MCP server"],["allowExternalClients","Allow external AI clients"]]
      .map(p=>mcpPolicyRow(p[0],p[1])).join("")
      +'<div class="swrow"><div class="sl"><div class="sn">Re-consent every '+MCP_POLICY.reconsentDays+' days</div><div class="sd">Consent expires and is asked again in full. Nothing rolls over quietly.</div></div>'
      +'<div class="seg2"><button class="'+(MCP_POLICY.reconsentDays===30?"on":"")+'" onclick="mcpReconsent(30)">30</button><button class="'+(MCP_POLICY.reconsentDays===90?"on":"")+'" onclick="mcpReconsent(90)">90</button><button class="'+(MCP_POLICY.reconsentDays===180?"on":"")+'" onclick="mcpReconsent(180)">180</button></div></div>',{icon:"shield"})
    +panel('Requests <span class="bdg warn" style="margin-left:6px">'+open.length+' waiting</span>',
      (open.length?open.map(reqRow).join(""):emptyState("Nothing waiting","Requests from members land here with the reason they gave.","check"))
      +(done.length?'<div style="margin-top:18px"><div class="mutedtext" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:6px">Decided</div>'+done.map(reqRow).join("")+'</div>':''),
      {icon:"msg",sub:"A refusal that explains itself is routing, not a dead end",
       foot:"The requester is told the outcome and the reason — in Spiff and by email."})
    +panel("Allow-list",'<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Domain</th><th>Why it is allowed</th><th>Added by</th></tr></thead><tbody>'
      +MCP_POLICY.allowList.map(a=>'<tr><td class="tech">'+esc(a.domain)+'</td><td>'+esc(a.note)+'</td><td class="mutedtext">'+esc(a.by)+'</td></tr>').join("")
      +'</tbody></table></div>',{icon:"link",tight:true,
       foot:"A connector on a domain that is not listed cannot be enabled, whatever its trust label says."})
    +'</div>';
}
function mcpReconsent(d){MCP_POLICY.reconsentDays=d;toast("Consent now expires every "+d+" days");mcpRender();}
function mcpDecide(id,verdict){
  const r=MCP_POLICY.requests.find(x=>x.id===id), c=connectorById(r.connector);
  openModal('<h3>'+(verdict==="approve"?"Approve":"Decline")+' '+esc(c.name)+'</h3>'
    +'<div class="msub">'+esc(r.who)+' asked on '+esc(r.on)+'. They will see your note.</div>'
    +'<div class="defblock" style="margin-bottom:14px">'+esc(r.note)+'</div>'
    +'<div class="field"><label>Note back to '+esc(r.who.split(" ")[0])+'</label><textarea class="txt" rows="3" placeholder="'
    +(verdict==="approve"?"Enabled for the Events team. Read-only to start — ask again if you need to write.":"Not this one. Here is what to do instead…")+'"></textarea></div>'
    +modalFoot("Cancel",verdict==="approve"?"Approve and enable":"Decline","mcpDecided('"+id+"','"+verdict+"')"),520);
}
function mcpDecided(id,verdict){
  const r=MCP_POLICY.requests.find(x=>x.id===id), c=connectorById(r.connector);
  r.status = verdict==="approve"?"approved":"declined";
  r.decision = (verdict==="approve"?"Approved":"Declined")+" by "+ME.full+" on 30 Aug 2026.";
  if(verdict==="approve"){c.state="available"; c.rights="connect";}
  closeModal();toast(c.name+(verdict==="approve"?" enabled for GST — "+r.who.split(" ")[0]+" can now connect it as themselves":" declined, with your note"));mcpRender();
}

/* ---------- tab 5: activity ---------- */
function mcpLogFilter(k,v){ MCPV[k]=v; mcpLogRepaint(); }
function mcpLogRepaint(){ const el=$("#mcp-log-frame"); if(el) el.innerHTML=mcpLogFrame(); const n=$("#mcp-logn"); if(n) n.textContent=mcpLogList().length; }
function mcpLogList(){return MCP_LOG.filter(l=>(MCPV.out==="all"||l.outcome===MCPV.out)&&(MCPV.conn==="all"||l.connector===MCPV.conn));}
function mcpLogFrame(){
  const OUT={ok:["Completed","ok"],denied:["Denied","crit"],error:["Error","warn"],partial:["Partial","warn"]};
  const outRank={denied:0,error:1,partial:2,ok:3};
  return listFrame("mcp-log", {
    items: mcpLogList(), repaint: mcpLogRepaint, noun: "calls", noun1: "call", size: 15,
    sorts: [{key:"time",  label:"Newest first", get:function(l){ return MCP_LOG.indexOf(l); }},
            {key:"who",   label:"Person",       get:function(l){ return l.who; }},
            {key:"conn",  label:"Connector",    get:function(l){ return (connectorById(l.connector)||{}).name||l.connector; }},
            {key:"out",   label:"Outcome — denied first", get:function(l){ const k=outRank[l.outcome]; return k==null?9:k; }},
            {key:"took",  label:"Slowest first", get:function(l){ return l.ms; }, desc:true},
            {key:"rows",  label:"Most rows",     get:function(l){ return l.rows||0; }, desc:true}],
    cols: [{label:"Time", sort:"time", cell:function(l){ return '<span class="mutedtext nw">'+esc(l.when)+'</span>'; }},
           {label:"Person", sort:"who", cell:function(l){ const p=personByName(l.who); return p?'<span class="clickable" style="font-weight:600" onclick="openPerson(\''+esc(p.name)+'\')">'+esc(l.who)+'</span>':'<span class="mutedtext">'+esc(l.who)+'</span>'; }},
           {label:"Connector", sort:"conn", cell:function(l){ const c=connectorById(l.connector); return '<span class="clickable" onclick="openConnector(\''+c.id+'\')">'+esc(c.name)+'</span>'; }},
           {label:"Tool", cell:function(l){ return '<span class="tech">'+esc(l.tool)+'</span>'; }},
           {label:"Arguments", cell:function(l){ return '<span class="tech trunc" style="max-width:210px;display:inline-block" title="'+esc(l.args)+'">'+esc(l.args)+'</span>'; }},
           {label:"Outcome", sort:"out", cell:function(l){ return '<span class="bdg '+OUT[l.outcome][1]+'">'+OUT[l.outcome][0]+'</span>'; }},
           {label:"Took", sort:"took", num:true, cell:function(l){ return l.ms>=1000?(l.ms/1000).toFixed(1)+" s":l.ms+" ms"; }},
           {label:"Rows", sort:"rows", num:true, cell:function(l){
              return l.outcome==="denied" ? '<span class="bdg crit">not permitted</span>' : l.outcome==="error" ? '<span class="bdg warn">never ran</span>' : l.rows>0 ? fmt(l.rows) : '<span class="mutedtext">0 rows</span>'; }},
           {label:"Ran as", cell:function(l){ return '<span class="mutedtext" style="font-size:12px">'+esc(l.identity)+'</span>'; }}],
    rowStyle: function(l){ return l.outcome==="denied"?"background:var(--crit-soft)":l.outcome==="error"?"background:var(--warn-soft)":""; },
    notOurs: "Append-only — every call is kept against the person it ran as",
    emptyTitle: "No calls match this filter", emptySub: "Widen the outcome or pick another connector.", emptyIcon: "filter"
  });
}
function mcpActivityHTML(){
  const n=k=>MCP_LOG.filter(l=>l.outcome===k).length;
  return '<div class="stack">'
    +'<div class="g4">'+kpi("Calls logged",MCP_LOG.length,"last 3 days")
      +kpi("Denied",n("denied"),"permission refused, before any data moved")
      +kpi("Errors",n("error"),"the connector failed, not the person")
      +kpi("Partial",n("partial"),"answered, with a stated omission")+'</div>'
    +panel("Every call, against a named person",
      '<div class="rowflex" style="margin-bottom:14px">'
      +'<div class="field" style="margin:0;min-width:170px"><label>Outcome</label><select onchange="mcpLogFilter(\'out\',this.value)">'
        +['all','ok','denied','error','partial'].map(o=>'<option value="'+o+'"'+(MCPV.out===o?' selected':'')+'>'+(o==="all"?"All outcomes":o==="ok"?"Completed":o==="denied"?"Denied":o==="error"?"Error":"Partial")+'</option>').join("")+'</select></div>'
      +'<div class="field" style="margin:0;min-width:200px"><label>Connector</label><select onchange="mcpLogFilter(\'conn\',this.value)">'
        +'<option value="all"'+(MCPV.conn==="all"?' selected':'')+'>All connectors</option>'+CONNECTORS.map(c=>'<option value="'+c.id+'"'+(MCPV.conn===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join("")+'</select></div>'
      +'<div class="sp"></div><div class="mutedtext"><b id="mcp-logn">'+mcpLogList().length+'</b> calls</div>'
      +'<button class="btn sm" onclick="mcpExport()">'+I2.down+'Export</button></div>'
      +'<div class="legend" style="margin-bottom:12px"><span><i style="background:var(--ok)"></i>Completed — rows returned</span>'
      +'<span><i style="background:var(--warn)"></i>Partial — answered, something omitted, and the log says what</span>'
      +'<span><i style="background:var(--crit)"></i>Denied — refused on permissions, no data moved</span>'
      +'<span><i style="background:var(--warn)"></i>Error — the connector failed; the person did nothing wrong</span></div>'
      +'<div id="mcp-log-frame">'+mcpLogFrame()+'</div>',{icon:"log",tight:false,
       foot:"“0 rows” and “not permitted” are different things and are shown differently. An empty answer that was really a refusal is the fastest way to lose trust in a scoped tool."})
    +'</div>';
}
function mcpExport(){toast("Exporting "+mcpLogList().length+" calls to CSV — the export itself is logged");}
function mcpTry(){toast("Ran run_report as Thato Sekhoto — 1 284 rows, 3 localities suppressed");}
function mcpRevoke(){openModal('<h3>Revoke access for all clients</h3><div class="msub">Claude and Copilot lose their connection to Spiff immediately.</div>'
  +callout("warn","Two automations deliver through Copilot. They will pause rather than run as anyone else — Spiff never silently substitutes an identity.")
  +modalFoot("Keep access","Revoke everything","closeModal();toast('Access revoked — every client must sign in again')"),480);}

/* ---------- main render ---------- */
function mcpRender(){renderMcp();}
/* a connection exists in all three of these states — it may need re-authorising
   or be failing, but it is connected. The rail count and the page count both
   come from here, so they cannot disagree again. */
function mcpLiveCount(){ return CONNECTORS.filter(c=>["connected","reauth","error"].indexOf(c.state)>=0).length; }
/* the rail's number: connectors a person must do something about — an expired sign-in, an unreachable system */
function mcpAttentionCount(){ return CONNECTORS.filter(c=>c.state==="reauth"||c.state==="error").length; }
function railAttn(sel,n){ const el=$(sel); if(!el) return; el.textContent=n; el.style.display=n?'':'none'; }
function renderMcp(){
  const live=mcpLiveCount();
  const open=MCP_POLICY.requests.filter(r=>r.status==="open").length;
  railAttn("#mcp-count", mcpAttentionCount());
  $("#view-mcp").innerHTML =
    pageHead({eyebrow:"Govern",title:"Connectors",
      desc:"The systems Spiff can reach on your behalf, and the tools Spiff hands to Claude, Copilot and ChatGPT when they ask it questions. Everything here runs as a named person — there is no shared account anywhere in this screen. Connectors reach the live systems as you; <a class=\"clickable\" onclick=\"go('sources')\">Sources</a> are what Spiff has read to learn the shape of the data.",
      badges:bdg(live+" connected","ok")+bdg(CONNECTORS.length+" in the directory","mut")+bdg(open+" requests waiting","warn")+bdg("Spiff exposed as a server","info"),
      acts:'<button class="btn" onclick="go(\'audit\')">'+I2.log+'Activity log</button><button class="btn pri" onclick="mcpAddCustom()">'+I2.plus+'Add a connector</button>'})
    +tabsHTML("mcp",[["directory","Available",CONNECTORS.length],["connected","Connected",live],["blocks","Automation blocks",CAPS.length],["server","Spiff as a connector"],["policy","Org policy",open],["activity","Activity",MCP_LOG.length]],MCPV.tab)
    +pane("mcp","directory",mcpDirectoryHTML(),MCPV.tab==="directory")
    +pane("mcp","connected",mcpConnectedHTML(),MCPV.tab==="connected")
    +pane("mcp","blocks",mcpBlocksHTML(),MCPV.tab==="blocks")
    +pane("mcp","server",mcpServerHTML(),MCPV.tab==="server")
    +pane("mcp","policy",mcpPolicyHTML(),MCPV.tab==="policy")
    +pane("mcp","activity",mcpActivityHTML(),MCPV.tab==="activity");
  document.querySelectorAll('[data-tabs="mcp"] button').forEach(b=>b.addEventListener("click",()=>{MCPV.tab=b.dataset.tab;}));
}
V2ROUTES.mcp = renderMcp;
/* the Capabilities screen was folded into this one — old links land on the blocks tab */
(function(){
  const _g = window.go;
  window.go = function(view, arg){
    if(view === "caps"){ MCPV.tab = "blocks"; view = "mcp"; }
    return _g(view, arg);
  };
})();

/* ---------- connector detail ---------- */
function openConnector(id){ go("connector", id); }
function mcpStateGallery(){
  const S=[["Not connected","mut","Connect to use this. Nothing has been shared with it yet.","Connect"],
    ["Sign-in expired","warn","Your sign-in expired on 28 Aug at 04:00. Two automations paused rather than running as anyone else.","Reconnect"],
    ["Missing one permission","warn","This needs <b>Write to shared folders</b>, which you have not granted. Everything else still works.","Grant that one permission"],
    ["Turned off by an admin","mut","A Platform Admin disabled this for GST on 12 Mar 2026. Your access is intact; the connector is not.","Request access"],
    ["Server unreachable","crit","Three connection timeouts since 06:12 today. Last successful call: Friday 17:40.","Retry · Status page"],
    ["Blocked by policy","crit","Approved comms channels — Teams only. Set by Marcus Vilakazi on 12 Mar 2026.","Read the policy"],
    ["Rate limited","warn","Orbit is limiting us after 500 calls this hour. Try again after 14:20.","Wait, then retry"],
    ["Partial result","warn","486 of 512 bookings returned. 26 fell outside your ±30 day travel window and were withheld.","See what was withheld"],
    ["Nothing found","mut","No bookings matched. You had permission to see all of them — there simply are none.","Change the question"]];
  return '<div class="g3">'+S.map(s=>'<div style="border:1px solid var(--hair);border-radius:12px;padding:14px;background:var(--surface)">'
    +'<div class="rowflex" style="margin-bottom:8px"><span class="bdg '+s[1]+'"><i class="dotd"></i>'+esc(s[0])+'</span></div>'
    +'<div style="font-size:13px;line-height:1.55;color:var(--muted)">'+s[2]+'</div>'
    +'<div style="margin-top:11px"><button class="btn sm" onclick="toast(\''+esc(s[0])+' — this is a state gallery, not a live connector\')">'+esc(s[3])+'</button></div></div>').join("")+'</div>';
}
function renderConnector(id){
  const c = connectorById(id);
  crumbTrail([["Connectors","go('mcp')"],[esc(c.name),null]]);
  const t=MCP_TRUST[c.trust];
  const connected = c.state==="connected";
  const acts = (c.state==="blocked"?'<button class="btn" onclick="mcpWhyBlocked(\''+c.id+'\')">Why is this blocked?</button>'
      :c.state==="requested"?'<span class="bdg warn">'+I2.clock+'Requested '+esc(c.requestedOn)+'</span>'
      :connected?'<button class="btn" onclick="mcpEdit(\''+c.id+'\')">Edit</button><button class="btn danger" onclick="mcpRemove(\''+c.id+'\')">Remove</button>'
      :c.rights==="connect"?'<button class="btn pri" onclick="mcpConsent(\''+c.id+'\',1)">Connect</button>'
      :'<button class="btn pri" onclick="mcpRequest(\''+c.id+'\')">Request</button>')
    +'<button class="btn ghost" onclick="mcpStepUp()">See a step-up prompt</button>';
  const toolTable = '<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Tool</th><th>What it does, in plain English</th><th>Kind</th><th>'+(connected?"Your setting":"Default on connect")+'</th>'+(connected?'<th class="num">30-day calls</th>':'')+'</tr></thead><tbody>'
    +c.tools.map(tl=>'<tr'+(tl.isNew?' style="background:var(--warn-soft)"':'')+'><td class="tech">'+esc(tl.name)+(tl.isNew?' <span class="bdg warn">new</span>':'')+'</td><td>'+esc(tl.desc)+'</td><td>'+mcpKind(tl.kind)+'</td>'
      +'<td>'+(connected?tri(tl.perm):mcpPerm(tl.perm))+'</td>'+(connected?'<td class="num">'+fmt(tl.calls30d)+'</td>':'')+'</tr>').join("")+'</tbody></table></div>';
  $("#view-connector").innerHTML =
    pageHead({eyebrow:"Connector",title:esc(c.name),back:"go('mcp')",desc:esc(c.desc),
      badges:mcpTrust(c)+mcpState(c)+mcpCaps(c)+bdg(c.category,"mut"),acts:acts})
    +(c.errorText?callout(c.state==="error"?"crit":"warn","<b>"+MCP_STATES[c.state].label+".</b> "+esc(c.errorText)):"")
    +(c.state==="blocked"?callout("crit","<b>Blocked by policy — "+esc(c.blockedBy)+".</b> "+esc(c.blockedNote)):"")
    +'<div class="split wide"><div class="stack" style="min-width:0">'
      +panel("What it does",'<div style="font-size:14px;line-height:1.65">'+esc(c.longDesc)+'</div>'
        +'<div class="hairline"></div><div class="mutedtext" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:9px">Try asking</div>'
        +'<div class="chipbar">'+c.examples.map(e=>'<button class="fchip2" onclick="askText(\''+esc(e).replace(/'/g,"\u2019")+'\')">'+esc(e)+'</button>').join("")+'</div>',{icon:"info"})
      +panel("Tools — "+c.tools.length+" of them",
        callout("info","<b>This list is the permission surface.</b> Not the scope strings, not the terms — this table. Whatever a tool here can do, the connector can do once you connect it. Read it before you connect, not after.")
        +'<div style="height:14px"></div>'+toolTable,{icon:"bolt",
        foot:"Writes and destructive tools start at Needs approval or Blocked. You can relax that for yourself; you cannot relax it for anyone else."})
      +(blocksForConnector(c.id).length?panel("Automation blocks it provides",
        '<div class="mutedtext" style="font-size:13px;line-height:1.6;margin-bottom:12px">These are the blocks people can drag into an automation because this connector is registered. Remove the connector and they stop being available — there is no separate place to publish them.</div>'
        +'<div class="dtbl-wrap"><table class="dtbl condensed">'
        +'<colgroup><col style="width:30%"><col style="width:22%"><col style="width:30%"><col style="width:18%"></colgroup>'
        +'<thead><tr><th>Block</th><th>Tool behind it</th><th>What it needs from you</th><th>Status</th></tr></thead><tbody>'
        +blocksForConnector(c.id).map(b=>{const m=blockOf(b.id);
          return '<tr><td><div class="rowflex" style="gap:9px;flex-wrap:nowrap"><span style="width:16px;height:16px;flex:none;display:grid;place-items:center;color:var(--muted)">'+(ICON[b.ik]||"")+'</span><span style="font-weight:600">'+esc(b.n)+'</span></div></td>'
            +'<td class="tech">'+esc(m.tool)+'</td>'
            +'<td><div style="font-size:12.5px">'+esc(capFields(b.id).map(f=>f.label).join(", ")||"Nothing — it just runs")+'</div></td>'
            +'<td>'+mcpBlockState(b.id)+'</td></tr>';}).join("")
        +'</tbody></table></div>',{icon:"flow",sub:"Same thing as the tools above, named the way the automation builder names them"}):"")
      +panel("Where your data goes",'<div class="defblock" style="font-size:14px;line-height:1.65">'+esc(c.dataFlow)+'</div>'
        +'<div class="hairline"></div><div class="rowflex" style="font-size:13px;gap:8px;flex-wrap:wrap">'
        +'<span class="tok a">You</span><span class="mutedtext">→</span><span class="tok f">Spiff · '+esc(ORG.tenant)+'</span><span class="mutedtext">→</span><span class="tok m">'+esc(c.domain)+'</span>'
        +'</div><div class="mutedtext" style="font-size:12.5px;margin-top:9px">Operated by '+esc(c.legalName)+'. Authentication: '+esc(c.auth)+'.</div>',{icon:"flow"})
      +panel("Technical",'<div class="codeblock">'+esc("Endpoint    "+c.endpoint+"\nTransport   "+c.transport+"\nProtocol    "+c.apiVersion+"\nAuth        "+c.auth)+'</div>'
        +(c.resources.length?'<div style="margin-top:14px"><div class="mutedtext" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px">Resources it exposes</div>'
          +'<div class="rowflex">'+c.resources.map(r=>'<span class="bdg mut mono">'+esc(r)+'</span>').join("")+'</div></div>':'')
        +'<div style="margin-top:16px"><div class="mutedtext" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:7px">Changelog</div>'
        +'<div class="tline">'+c.changelog.map(x=>'<div class="tev"><div class="td3 mut"></div><div class="tt2">v'+esc(x.v)+' · '+esc(x.on)+'</div><div class="ts2">'+esc(x.note)+'</div></div>').join("")+'</div></div>',{icon:"file"})
      +panel("Every state this connector can be in",
        '<div class="mutedtext" style="font-size:13px;margin-bottom:14px">Nine different things can go wrong, and they are nine different messages. An authentication failure never renders as an empty result.</div>'
        +mcpStateGallery(),{icon:"warn"})
    +'</div><div class="stack" style="min-width:0">'
      +panel("Publisher",'<dl class="kv"><dt>Legal name</dt><dd>'+esc(c.legalName)+'</dd><dt>Domain</dt><dd class="tech">'+esc(c.domain)+'</dd>'
        +'<dt>Support</dt><dd>'+esc(c.support)+'</dd><dt>Privacy</dt><dd class="tech">'+esc(c.privacy)+'</dd></dl>'
        +'<div class="hairline"></div><div class="rowflex" style="margin-bottom:9px">'+mcpTrust(c)+'</div>'
        +'<div class="mutedtext" style="font-size:12.5px;line-height:1.6">'+esc(t.note)+'</div>',{icon:"shield"})
      +panel("Status",'<div class="kvlist">'
        +'<div class="r"><span class="k">State</span><span class="v">'+mcpState(c)+'</span></div>'
        +(c.connectedAs?'<div class="r"><span class="k">Connected as</span><span class="v tech" style="font-size:12px">'+esc(c.connectedAs)+'</span></div>':'')
        +(c.connectedOn?'<div class="r"><span class="k">Connected on</span><span class="v">'+esc(c.connectedOn)+'</span></div>':'')
        +'<div class="r"><span class="k">People in GST</span><span class="v">'+fmt(c.users)+'</span></div>'
        +'<div class="r"><span class="k">Updated</span><span class="v">'+esc(c.updated)+'</span></div>'
        +'<div class="r"><span class="k">Uptime</span><span class="v">'+esc(c.health.uptime)+'</span></div>'
        +'<div class="r"><span class="k">Error rate</span><span class="v">'+esc(c.health.errorRate)+'</span></div>'
        +'<div class="r"><span class="k">p95 latency</span><span class="v">'+esc(c.health.p95)+'</span></div>'
        +'<div class="r"><span class="k">Last call</span><span class="v">'+esc(c.health.lastCall)+'</span></div></div>',{icon:"clock"})
      +(c.rights==="request"&&!connected?callout("mut","<b>You would request this, not connect it.</b> Org connectors are enabled once, for everybody, by a Platform Admin. Your request goes to them with the reason you give."):"")
      +panel("Governance",'<div style="font-size:13px;line-height:1.65">Whatever you approve here applies to <b>you</b>. It does not connect this for your team, and it does not widen what you can see — a connector can only reach data you were already entitled to.</div>'
        +'<div class="hairline"></div><div class="mutedtext" style="font-size:12.5px;line-height:1.6">Every call made through this connector is logged against your name, with the arguments, for 24 months.</div>'
        +'<button class="btn sm" style="margin-top:11px" onclick="go(\'audit\')">See the log</button>',{icon:"lock"})
    +'</div></div>';
}
V2ROUTES.connector = renderConnector;

/* ---------- consent flow ---------- */
function mcpAcct(v){
  MCPV.acct=v;
  const w=$("#mcp-acctwarn");
  w.innerHTML = v==="me" ? callout("ok","Good. An answer that runs as a person is an answer someone is accountable for.")
    : callout("crit","<b>Refused.</b> Org policy forbids shared credentials. An answer that runs as a service account is an answer nobody is accountable for — and the log would name the account, not the person who asked.");
  const b=$("#mcp-next1"); if(b){b.disabled = v!=="me"; b.style.opacity = v==="me"?1:.45;}
}
function mcpAgree(el){const b=$("#mcp-allow");b.disabled=!el.checked;b.style.opacity=el.checked?1:.45;}
function mcpConsent(id,step){
  const c=connectorById(id), reconnect=c.state==="reauth";
  const stepNames=["Identity","Permissions","Tool defaults","Confirm"];
  const wiz='<div class="steps">'+stepNames.map((n,i)=>{const k=i+1;
    return '<div class="st'+(k===step?" on":k<step?" done":"")+'" style="flex:none"><div class="sc">'+(k<step?"✓":k)+'</div><div class="sn2">'+n+'</div></div>'
      +(i<3?'<div class="bar"></div>':'');}).join("")+'</div>';
  let body="", foot="";
  if(step===1){
    body = '<div class="mutedtext" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">Spiff will reach '+esc(c.name)+' as one identity, and that identity decides what comes back. Pick the wrong one and the governance story ends here.</div>'
      +'<div class="field"><label>Connect as</label><select onchange="mcpAcct(this.value)">'
      +'<option value="me">'+esc(ME.full)+' — '+esc(ME.email)+' (you)</option>'
      +'<option value="svc">GST Reporting Service — svc-gst-reporting@ubteam.com</option>'
      +'<option value="shared">Southern Cluster shared mailbox — southern@ubteam.com</option></select></div>'
      +'<div id="mcp-acctwarn">'+callout("ok","Good. An answer that runs as a person is an answer someone is accountable for.")+'</div>'
      +'<div class="hairline"></div>'
      +'<div class="mutedtext" style="font-size:12.5px;line-height:1.6">Whichever you pick, Spiff re-checks this identity and its permissions <b>every time a tool runs</b> — not once, now, at sign-in.</div>';
    foot='<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" id="mcp-next1" onclick="mcpConsent(\''+id+'\',2)">Continue</button></div>';
  } else if(step===2){
    body = '<div class="mutedtext" style="font-size:13.5px;line-height:1.6;margin-bottom:14px">'+c.scopes.length+' permission'+(c.scopes.length===1?"":"s")+', and only these. Anything else asks you again later, when it is actually needed.</div>'
      +c.scopes.map(s=>'<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--hair2)">'
        +'<div style="flex:none;margin-top:2px">'+(s.kind==="read"?'<span class="bdg info">'+I2.eye+'Read</span>':'<span class="bdg warn">'+I2.pencil+'Write</span>')+'</div>'
        +'<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px">'+esc(s.label)+'</div>'
        +'<div class="tech" style="font-size:11.5px;margin-top:3px">'+esc(s.scope)+'</div>'
        +'<div class="mutedtext" style="font-size:12.5px;margin-top:6px;line-height:1.55">'+esc(s.why)+'</div></div></div>').join("")
      +'<div class="callout mut" style="margin-top:14px">'+I2.link+'<div>You will be sent to <b>'+esc(c.domain)+'</b> to sign in. Spiff never sees your password.<div class="tech" style="font-size:11.5px;margin-top:5px">'+esc("https://"+c.domain+"/oauth2/authorize → https://ubt-gst.spiff.internal/oauth/callback")+'</div></div></div>';
    foot='<div class="mfoot"><button class="btn" onclick="mcpConsent(\''+id+'\',1)">Back</button><button class="btn pri" onclick="mcpConsent(\''+id+'\',3)">Continue</button></div>';
  } else if(step===3){
    body = '<div class="mutedtext" style="font-size:13.5px;line-height:1.6;margin-bottom:12px">Every tool, with a starting setting. Writes begin at <b>Needs approval</b> and destructive tools begin <b>Blocked</b> — change them now or leave them and change them later.</div>'
      +c.tools.map(tl=>'<div style="display:flex;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid var(--hair2)">'
        +'<div style="flex:1;min-width:0"><div class="rowflex" style="gap:7px"><span class="mono" style="font-weight:600;font-size:13px">'+esc(tl.name)+'</span>'+mcpKind(tl.kind)+'</div>'
        +'<div class="mutedtext" style="font-size:12.5px;margin-top:3px">'+esc(tl.desc)+'</div></div>'
        +'<div style="flex:none">'+tri(tl.perm)+'</div></div>').join("");
    foot='<div class="mfoot"><button class="btn" onclick="mcpConsent(\''+id+'\',2)">Back</button><button class="btn pri" onclick="mcpConsent(\''+id+'\',4)">Continue</button></div>';
  } else {
    const w=c.tools.filter(t=>t.kind!=="read").length;
    body = '<div class="kvlist" style="margin-bottom:14px">'
      +'<div class="r"><span class="k">Connector</span><span class="v">'+esc(c.name)+' · '+esc(c.publisher)+'</span></div>'
      +'<div class="r"><span class="k">Connecting as</span><span class="v">'+esc(ME.full)+'</span></div>'
      +'<div class="r"><span class="k">Permissions</span><span class="v">'+c.scopes.length+'</span></div>'
      +'<div class="r"><span class="k">Tools</span><span class="v">'+c.tools.length+' · '+w+' need approval each time</span></div>'
      +'<div class="r"><span class="k">Consent expires</span><span class="v">28 Nov 2026</span></div></div>'
      +callout("info","This connects "+esc(c.name)+" <b>for you</b>. It does not enable it for your team, and it cannot show you anything you were not already entitled to see.")
      +'<label style="display:flex;gap:10px;align-items:flex-start;margin-top:16px;font-size:13.5px;line-height:1.55;cursor:pointer">'
      +'<input type="checkbox" style="margin-top:2px;width:16px;height:16px;accent-color:var(--accent)" onchange="mcpAgree(this)">'
      +'<span>I have read what '+esc(c.name)+' can do and I am connecting it as myself.</span></label>';
    foot='<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>'
      +'<button class="btn pri" id="mcp-allow" disabled style="opacity:.45" onclick="mcpAllow(\''+id+'\')">Allow</button></div>';
  }
  openModal('<h3>'+(reconnect?"Reconnect ":"Connect ")+esc(c.name)+'</h3>'
    +'<div class="msub">'+(reconnect?"Your sign-in expired. Nothing ran as anyone else while it was gone.":"Four steps. Nothing is ticked for you.")+'</div>'
    +wiz+body+foot,600);
}
function mcpAllow(id){
  const c=connectorById(id);
  c.state="connected"; c.connectedAs=ME.email; c.connectedOn="30 Aug 2026"; c.errorText=null;
  closeModal(); toast(c.name+" connected as "+ME.full+" — every call will be logged against you");
  if(CURRENT_VIEW==="connector") renderConnector(id); else mcpRender();
}
function mcpStepUp(){
  openModal('<h3>Spiff needs one more permission</h3>'
    +'<div class="msub">One permission, named, at the moment it is needed — not bundled into the first consent screen you saw.</div>'
    +'<div class="defblock" style="margin-bottom:14px"><b>To finish:</b> file “LDM attendance — August 2026” in the Events library on SharePoint.</div>'
    +'<div style="display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--hair2);border-bottom:1px solid var(--hair2)">'
    +'<div style="flex:none;margin-top:2px"><span class="bdg warn">'+I2.pencil+'Write</span></div>'
    +'<div><div style="font-weight:600;font-size:13.5px">Write to shared folders</div>'
    +'<div class="tech" style="font-size:11.5px;margin-top:3px">sharepoint.files.write</div>'
    +'<div class="mutedtext" style="font-size:12.5px;margin-top:6px;line-height:1.55">Only libraries you can already write to. Granting this does not add you to a single site.</div></div></div>'
    +callout("mut","Everything else Spiff already has keeps working either way. Say no and the report is still yours — it just stays in Spiff.")
    +'<div class="mfoot"><button class="btn" onclick="closeModal();toast(\'Left as it was — the report stayed in Spiff\')">Not now</button>'
    +'<button class="btn pri" onclick="closeModal();toast(\'Granted — filing the report in the Events library\')">Grant this one permission</button></div>',540);
}

/* ---------- small actions ---------- */
function mcpRequest(id){
  const c=connectorById(id);
  openModal('<h3>Request '+esc(c.name)+'</h3><div class="msub">Goes to Platform Admins — Marcus Vilakazi and Ezra Haddad. They see your reason and reply either way.</div>'
    +'<div class="field"><label>Why you need it</label><textarea rows="3" placeholder="What you would ask Spiff, once this is connected."></textarea></div>'
    +callout("mut","A request is routing, not refusal. You will be told the outcome and the reason, in Spiff and by email.")
    +modalFoot("Cancel","Send request","mcpRequested('"+id+"')"),520);
}
function mcpRequested(id){
  const c=connectorById(id);
  c.state="requested"; c.requestedBy=ME.full; c.requestedOn="30 Aug 2026";
  if(!MCP_POLICY.requests.some(r=>r.connector===id&&r.status==="open"))
    MCP_POLICY.requests.unshift({id:"req-"+id,connector:id,who:ME.full,on:"30 Aug 2026",note:"Requested from the connector directory.",status:"open"});
  closeModal(); toast("Requested — Platform Admins have it, with your reason");
  if(CURRENT_VIEW==="connector") renderConnector(id); else mcpRender();
}
function mcpWhyBlocked(id){
  const c=connectorById(id);
  openModal('<h3>'+esc(c.name)+' is blocked</h3><div class="msub">Not because of what it is. Because of a rule this org chose.</div>'
    +callout("crit","<b>"+esc(c.blockedBy)+"</b><br>"+esc(c.blockedNote))
    +'<div class="hairline"></div><div style="font-size:13.5px;line-height:1.65">'+esc(c.longDesc)+'</div>'
    +modalFoot("Close","Ask for an exception","closeModal();toast('Sent to Platform Admins — they will reply either way')"),540);
}
function mcpRetry(id){
  const c=connectorById(id);
  toast(c.name+" — still unreachable. Estates was told at 06:20; nothing you can do from here.");
}
function mcpEdit(id){
  const c=connectorById(id);
  openModal('<h3>Edit '+esc(c.name)+'</h3><div class="msub">Some of this cannot be changed, and pretending otherwise would be dishonest.</div>'
    +'<div class="field"><label>Display name</label><select><option>'+esc(c.name)+'</option></select></div>'
    +'<div class="field"><label>Tool access</label><select><option>Auto — Spiff picks the tool it needs</option><option>On demand — only when you name it</option></select></div>'
    +callout("warn","<b>Authentication cannot be edited after a connector is added.</b> To change how it signs in, remove it and add it again — and everyone who uses it reconnects.")
    +modalFoot("Cancel","Save","closeModal();toast('Saved')"),520);
}
function mcpRemove(id){
  const c=connectorById(id);
  confirmAsk({title:'Remove '+esc(c.name)+'?', sub:fmt(c.users)+' people in GST use it.',
    body:'Automations that call it pause rather than run without it. Every person reconnects from scratch — consent is not restored by adding it back.',
    cancel:'Keep it', verb:'Remove', onConfirm:function(){ mcpRemoved(id); }});
}
function mcpRemoved(id){
  const c=connectorById(id);
  c.state="available"; c.connectedAs=null; c.connectedOn=null; c.changed=[];
  closeModal(); toast(c.name+" removed — 2 automations paused");
  if(CURRENT_VIEW==="connector") renderConnector(id); else mcpRender();
}
function mcpReviewChanges(id){
  const c=connectorById(id);
  openModal('<h3>'+esc(c.name)+' changed after you consented</h3>'
    +'<div class="msub">'+c.changed.length+' tools appeared on '+esc(c.changed[0].on)+'. You approved a tool list; this is a different tool list.</div>'
    +c.changed.map(ch=>{const tl=c.tools.find(t=>t.name===ch.tool)||{perm:"ask",kind:"write"};
      return '<div style="padding:12px 0;border-bottom:1px solid var(--hair2)"><div class="rowflex" style="gap:7px"><span class="mono" style="font-weight:600;font-size:13px">'+esc(ch.tool)+'</span>'+mcpKind(tl.kind)+'<span class="bdg warn">new</span></div>'
      +'<div class="mutedtext" style="font-size:12.5px;margin:6px 0 9px;line-height:1.55">'+esc(ch.note)+'</div>'+tri(tl.perm)+'</div>';}).join("")
    +callout("mut","Until you decide, all three stay at their safest setting. Spiff does not inherit an old approval for a new capability.")
    +modalFoot("Decide later","Save these settings","mcpReviewed('"+id+"')"),580);
}
function mcpReviewed(id){
  const c=connectorById(id); c.changed=[]; c.tools.forEach(t=>{delete t.isNew;});
  closeModal(); toast("Reviewed — the three new tools are governed by your settings now"); mcpRender();
}
function mcpAddCustom(){
  openModal('<h3>Add a connector</h3><div class="msub">A remote MCP server, by URL. Nobody outside your org has reviewed it — that is what Custom means.</div>'
    +'<div class="field"><label>Name</label><select><option>New connector</option></select></div>'
    +'<div class="field"><label>Remote MCP server URL</label><div class="link"><span>https://</span><button onclick="toast(\'Probing the server for its auth method…\')">Detect</button></div></div>'
    +'<div class="field"><label>Authentication</label><select><option>Always required</option><option>Required when the server asks</option><option disabled>None — blocked by org policy</option></select></div>'
    +callout("warn","<b>Org policy: Verified connectors only.</b> A custom connector can be added here but cannot be enabled for the division without an exception from a Platform Admin.")
    +modalFoot("Cancel","Add","closeModal();toast('Added as Custom — pending a Platform Admin exception')"),540);
}
</script>
