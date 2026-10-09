<script>
/* =====================================================================
   HOME — the front door.
   Beats the blank canvas: a greeting, one ask box, the things that need
   you, the numbers you follow, what you were doing, what your teams are
   opening, and three datasets worth knowing. Everything re-runs as the
   person looking at it.
   ===================================================================== */

let HOME_DONE  = [];              /* dismissed "needs you" ids */
let HOME_EXTRA = [];              /* metrics followed from the picker */
let HOME_HIDDEN = [];             /* watchlist tiles the person stopped watching */

/* how many people opened each shared answer this week — keyed answer|team */
const HOME_OPENS = {
  "ldm|LDM Operations":64, "ldm|Regional Leadership":52, "stale|LDM Operations":41,
  "growth|Membership Insights":38, "growth|Finance & Cost":31, "orbit_travel|Regional Leadership":29,
  "oak_trend|LDM Operations":23, "northern|Membership Insights":17, "profile|LDM Operations":14
};

/* ---------- who is looking, and what they can see ---------- */
function homeFirst(){ const v=viewer(); return String(v.full||v.name||"there").split(/\s+/)[0].replace(/\.$/,""); }
function homeScope(){ const v=viewer(); return v.scope || (v.locality ? v.locality+" only" : "your assigned areas"); }
function homeGreeting(){ const h=(typeof FX!=="undefined")?FX.hour:new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; }
function homeToday(){
  try{ return (typeof FX!=="undefined") ? FX.date : new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"}); }
  catch(e){ return "Today"; }
}
function homeReach(){
  const open = DATASETS.filter(d=>d.cert!=="blocked").length;
  return open+" of "+DATASETS.length;
}

/* ---------- section heading on the page ground ---------- */
function homeHead(title,sub,act){
  return '<div class="rowflex" style="margin:30px 0 12px">'
    + '<h2 style="font-size:17px">'+esc(title)+'</h2>'
    + (sub?'<span class="mutedtext">'+sub+'</span>':'')
    + '<div class="sp"></div>'+(act||'')+'</div>';
}

/* =====================================================================
   1 · greeting band
   ===================================================================== */
function homeBand(){
  const items = homeNeeds(), n = items.length;
  const appr = items.some(function(x){ return x.id==="approvals"; });
  const line = n
    ? '<b>3 answers you follow</b> refreshed overnight, and <b>'+n+' '+(n===1?"decision is":"decisions are")+' waiting for you</b>'
      + (appr ? ' — including '+homeApprovalsItem().n+' access request'+(homeApprovalsItem().n===1?'':'s')+' waiting for your decision.' : '.')
    : '<b>3 answers you follow</b> refreshed overnight. Nothing else needs you today.';
  return pageHead({
    eyebrow: homeToday(),
    title: esc(homeGreeting())+", "+esc(homeFirst()),
    desc: line+' Everything below re-runs as you, scoped to <b>'+esc(homeScope())+'</b>.',
    badges: bdg("Runs as you","ok","shield")+bdg(ORG.name,"mut","db")+bdg(ORG.activeThisWeek+" of "+ORG.users+" people asked something this week","mut","people"),
    acts: '<button class="btn" onclick="go(\'sim\')">'+I2.eye+' View as someone else</button>'
  });
}

/* =====================================================================
   2 · the ask box
   ===================================================================== */
const HOME_STOP = ["this","that","last","next","with","have","from","show","trace","many","them","been","into","your","their","were","which"];
function homeWords(s){
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g," ").split(" ")
    .filter(function(w){ return w.length>3 && HOME_STOP.indexOf(w)<0; });
}
function homeSameQuestion(a,b){
  const A = homeWords(a), B = homeWords(b);
  if(!A.length || !B.length) return false;
  let hit = 0;
  A.forEach(function(w){ if(B.indexOf(w)>-1) hit++; });
  return hit >= Math.min(3, Math.min(A.length, B.length));
}
function homeSuggestions(){
  const out = [];
  const fresh = function(q){ return !out.some(function(o){ return homeSameQuestion(o.q, q); }); };
  CHIPS.forEach(function(c){
    /* "ambig" is the deliberately under-specified question. It used to sit on the
       separate Ask screen; it is kept here because watching Spiff ask back rather
       than guess is the single most convincing thing on the front door.
       It is exempt from the near-duplicate check — being vague is the whole point,
       and the check reads vagueness as overlap with everything. */
    const isAmbig = c[0]==="ambig";
    if(out.length>=5 || (!isAmbig && !fresh(c[1]))) return;
    out.push({q:c[1], a:c[0], ambig:isAmbig});
  });
  DATASETS.slice().sort(function(a,b){ return b.users-a.users; }).forEach(function(d){
    if(out.length>=6 || d.cert==="blocked") return;
    const q = d.questions.filter(fresh)[0];
    if(q) out.push({q:q, ds:d.name});
  });
  return out;
}
function homeAskPanel(){
  const chips = homeSuggestions().map(function(s){
    return '<button class="chip-q'+(s.ambig?' ambig':'')+'" data-hq="'+esc(s.q)+'"'+(s.a?' data-ha="'+esc(s.a)+'"':'')+'>'
      + esc(s.q) + (s.ambig?'<span class="qmark" title="Deliberately vague — watch Spiff ask back instead of guessing">?</span>':'') + '</button>';
  }).join("");
  const body =
      '<div class="askbox">'
    +   '<textarea id="home-ask" rows="1" placeholder="Ask anything — attendance, members, travel, events, budgets…"></textarea>'
    +   '<button class="send" onclick="homeAsk()" title="Ask">'+I2.send+'</button>'
    + '</div>'
    + '<div class="rowflex" style="margin-top:11px;font-size:12.5px;color:var(--muted)">'
    +   '<span>Answers are built from <b>'+homeReach()+' datasets</b>, scoped to '+esc(homeScope())+'. '
    +   'One is withheld by policy — Spiff will say so rather than quietly return less.</span>'
    + '</div>'
    + '<div class="hairline" style="margin:16px 0 14px"></div>'
    + '<div class="rowflex" style="gap:9px">'+chips+'</div>'
    + '<div class="rowflex" style="margin-top:14px;gap:8px">'
    +   '<button class="btn sm" onclick="go(\'catalog\')">'+I2.db+' What can I ask about?</button>'
    +   '<button class="btn sm" onclick="go(\'myaccess\')">'+I2.eye+' Show me what I\'m allowed to see</button>'
    +   '<span class="mutedtext">Two questions that answer themselves.</span>'
    + '</div>';
  return panel("", body);
}
/* The separate "New question" screen was removed on 3 Sep 2026 — it and Home
   were the same front door written twice. Everything it had lives here now.
   Anything that still asks for it lands on Home with the ask box focused. */
function homeAskFocus(){
  go("home");
  setTimeout(function(){
    const el = $("#home-ask");
    if(!el) return;
    el.focus();
    el.scrollIntoView({block:"center", behavior: (typeof REDUCE!=="undefined" && REDUCE) ? "auto" : "smooth"});
  }, 60);
}
(function(){
  const _g = window.go;
  window.go = function(view, arg){
    if(view === "ask"){ return homeAskFocus(); }
    return _g(view, arg);
  };
})();

/* the three promises, carried over from the retired Ask screen. They are the
   product's thesis and the front door is the only place they belong. */
function homePromises(){
  return '<div class="ask-foot" style="margin-top:4px">'
    + '<div class="pill3"><div class="k" style="color:var(--accent)">Ask</div><div class="t">Ask, don\'t build</div>'
    +   '<div class="s">A question returns a finished report — no ticket, no queue, no waiting.</div></div>'
    + '<div class="pill3"><div class="k" style="color:var(--warn)">Find</div><div class="t">Find, don\'t hunt</div>'
    +   '<div class="s">Every answer is saved to your workspace, and the ones worth keeping move to your team\'s.</div></div>'
    + '<div class="pill3"><div class="k" style="color:var(--good)">Trust</div><div class="t">Trust, don\'t guess</div>'
    +   '<div class="s">Your view, one agreed definition, provenance on every number.</div></div>'
    + '</div>';
}
function homeAsk(){
  const el = $("#home-ask"); if(!el) return;
  const v = (el.value||"").trim();
  if(!v){ el.focus(); return; }
  el.value = ""; askText(v);
}

/* =====================================================================
   3 · needs you
   ===================================================================== */
/* counted from the same list the Approvals tab shows, so the two never disagree */
function homeApprovalsItem(){
  const apps = (typeof macApps==="function") ? macApps() : [];
  const n = apps.length;
  const first = apps.slice(0,2).map(function(r){ return r.who; });
  const names = n > 2 ? first.join(", ")+" and "+(n-2)+" more" : first.join(" and ");
  return {id:"approvals", sev:"warn", icon:"people", n:n,
     t: n+" access request"+(n===1?" is":"s are")+" waiting for your decision",
     s: names+" asked for access. You own the approval for their localities, and nothing moves until you decide.",
     a:"Review requests", js:"go('people');switchTab('ppl','app')"};
}
function homeNeeds(){
  const t = ds("travel");
  return [
    {id:"travel-warn", sev:"crit", icon:"warn",
     t:"Travel bookings is flagged, and you follow an answer built on it",
     s:(t?t.warning:"The supplier feed is late.")+" Your “Orbit bookings by family” tile is showing it.",
     a:"Open the dataset", js:"openDataset('travel')"},
    homeApprovalsItem(),
    {id:"failedrun", sev:"crit", icon:"flow",
     t:"“Weekly attendance alert” failed its 06:00 run",
     s:"It runs as you and could not reach Travel bookings. Nothing was sent — no one received half an answer.",
     a:"Open the automation", js:"go('autos')"},
    {id:"reauth", sev:"warn", icon:"plug",
     t:"The Orbit connector needs reauthorising",
     s:"Its token expired at 04:40 today. Travel answers still run, on data from before then, and label themselves as stale.",
     a:"Reconnect", js:"go('mcp')"},
    {id:"review", sev:"info", icon:"shield",
     t:"Your quarterly access review is due in 6 days",
     s:"9 grants to confirm or drop. Anything you do not confirm expires on 6 September — silence removes access, it never keeps it.",
     a:"Start the review", js:"go('myaccess')"}
  ].filter(function(x){ return HOME_DONE.indexOf(x.id)<0; });
}
function homeNeedsRow(x){
  const col  = "var(--"+x.sev+")", soft = "var(--"+x.sev+"-soft)";
  return '<div class="lrow" onclick="'+x.js+'">'
    + '<div class="li" style="background:'+soft+';color:'+col+'">'+(I2[x.icon]||I2.info)+'</div>'
    + '<div class="lm">'
    +   '<div class="lt"><span class="dotd" style="color:'+col+'"></span>'+esc(x.t)+'</div>'
    +   '<div class="ls" title="'+esc(x.s)+'">'+esc(x.s)+'</div>'
    + '</div>'
    + '<div class="lr">'
    +   '<button class="btn sm" onclick="event.stopPropagation();'+x.js+'">'+esc(x.a)+'</button>'
    +   '<button class="btn sm ghost" title="Dismiss" onclick="event.stopPropagation();homeDismiss(\''+x.id+'\')">'+I2.x+'</button>'
    + '</div></div>';
}
function homeDismiss(id){
  if(HOME_DONE.indexOf(id)<0) HOME_DONE.push(id);
  toast("Dismissed. It stays in your activity log.");
  renderHome();
}
function homeNeedsPanel(){
  const items = homeNeeds();
  const body = items.length
    ? items.map(homeNeedsRow).join("")
    : emptyState("Nothing needs you","Approvals, failed runs, expiring access and data warnings land here. You are clear for today.","check");
  return panel("Needs you", body, {
    icon:"bolt", tight:true,
    sub: items.length ? items.length+" open · short list, real consequences" : "all clear",
    foot:"Everything here is yours because of a role you hold, not because someone copied you in."
  });
}

/* =====================================================================
   4 · your watchlist
   ===================================================================== */
function homeSpark(id){
  const a = ANSWERS[id]||{};
  if(a.chart && a.chart.data) return a.chart.data.map(function(r){ return typeof r[1]==="number"?r[1]:0; });
  if(a.table && a.table.rows) return a.table.rows.map(function(r,i){ return 38+((i*29)%58); });
  return [42,50,47,58,55,63,69,66];
}
function homeWatch(){
  const sc = homeScope(), tv = ds("travel");
  const base = [
    {id:"ldm", l:"LDM meetings · last quarter", v:"142", d:"+11% vs Q2",
     sp:[96,103,99,111,108,117,121,119,126,131,136,142], at:"06:12", note:sc},
    {id:"oak_trend", l:"Attendance · Oakridge", v:"68%", d:"−8 pts since June",
     sp:[79,78,80,77,79,76,75,74,76,72,70,68], at:"06:12", note:"Oakridge subdivision · below the 70% line"},
    {id:"growth", l:"Net new members · this year", v:"+3,240", d:"+4.2%",
     sp:[380,410,640,420,395,405,300,290], at:"06:14", note:sc},
    {id:"orbit_travel", l:"Orbit trips · this quarter", v:"218", d:"+16% vs Q2",
     sp:(tv?tv.rowTrend:[88,91,94,90,97,101,99,104,108,111,109,96]), at:"06:14",
     note:(tv?tv.access:"Restricted")+" · source late"}
  ];
  HOME_EXTRA.forEach(function(id){
    const a = ANSWERS[id]; if(!a) return;
    const m = (a.metrics&&a.metrics[0]) || {v:"—",l:"Metric"};
    base.push({id:id, l:m.l, v:m.v, d:m.d||"", sp:homeSpark(id), at:"06:20", note:sc});
  });
  return base.filter(function(w){ return HOME_HIDDEN.indexOf(w.id) < 0; });
}
/* stopping a watch removes the tile, nothing else — the answer behind it is untouched */
function homeStopWatchAsk(id){
  const w = homeWatch().filter(function(x){ return x.id===id; })[0]; if(!w) return;
  confirmAsk({title:'Stop watching “'+esc(w.l)+'”?',
    body:'The tile leaves your Home. The answer behind it is not deleted and keeps refreshing for anyone else who watches it; you can watch it again from the answer.',
    verb:'Stop watching', onConfirm:function(){
      HOME_EXTRA = HOME_EXTRA.filter(function(x){ return x!==id; });
      if(HOME_HIDDEN.indexOf(id)<0) HOME_HIDDEN.push(id);
      toast('Stopped watching'); renderHome();
    }});
}
/* homeTile lives in views/99-housekeeping.js */
function homeWatchGrid(watch){
  const ghost =
      '<div class="kpi" style="grid-column:1/-1;background:none;box-shadow:none;border-style:dashed;display:flex;align-items:center;gap:16px;flex-wrap:wrap">'
    +   '<div style="flex:1;min-width:240px">'
    +     '<div class="kl">Follow a metric</div>'
    +     '<div class="mutedtext" style="margin-top:5px">Any number in any answer can live here. It re-runs as you each morning — so what lands on this page is what you are allowed to see, not what the person who built it sees.</div>'
    +   '</div>'
    +   '<button class="btn" onclick="homeFollowMetric()">'+I2.plus+' Follow a metric</button>'
    + '</div>';
  return '<div class="g4">'+(watch||homeWatch()).map(homeTile).join("")+ghost+'</div>';
}
function homeFollowMetric(){
  const ids = ["stale","assemble_regions","growth_trend","steyn_history","ldm_yoy","northern"];
  const rows = ids.filter(function(id){ return ANSWERS[id] && HOME_EXTRA.indexOf(id)<0; }).map(function(id){
    const a = ANSWERS[id], m = (a.metrics&&a.metrics[0])||{v:"—",l:"Metric"};
    return '<div class="lrow" onclick="homePickMetric(\''+id+'\')">'
      + '<div class="li">'+I2.trend+'</div>'
      + '<div class="lm"><div class="lt">'+esc(m.l)+' — <span class="mono">'+esc(m.v)+'</span></div>'
      + '<div class="ls">'+esc(a.q)+'</div></div>'
      + '<div class="lr"><span class="bdg mut">Follow</span></div></div>';
  }).join("");
  openModal(
      '<h3>Follow a metric</h3>'
    + '<div class="msub">Pick a number to watch. It joins your home page and re-runs under your permissions every morning — not under the permissions of whoever first asked the question.</div>'
    + (rows ? panel("", rows, {tight:true}) : emptyState("You already follow all of these","Open any answer and follow a number from there.","star"))
    + modalFoot("Close"), 520);
}
function homePickMetric(id){
  closeModal();
  if(HOME_EXTRA.indexOf(id)<0) HOME_EXTRA.push(id);
  toast("Following — it re-runs as you every morning.");
  renderHome();
}

/* =====================================================================
   5 · continue where you left off
   ===================================================================== */
function homeRecentRow(r){
  const a = ANSWERS[r.id]; if(!a) return "";
  const th = themeOf(r.id);
  return '<div class="lrow" onclick="openFromCard(\''+r.id+'\')">'
    + '<div class="li" style="color:'+th[1]+'">'+iconFor(a)+'</div>'
    + '<div class="lm">'
    +   '<div class="lt">'+esc(r.name||a.q)+(r.sched?bdg(r.sched,"info","clock"):"")+'</div>'
    +   '<div class="ls"><span class="dotd" style="background:'+th[1]+';display:inline-block;margin-right:6px"></span>'+esc(th[0])+' · '+esc(r.when)+'</div>'
    + '</div>'
    + '<div class="lr">'+bdg(r.kind,"mut")+'</div></div>';
}
function homeRecentPanel(){
  const seen = {}, rows = [];
  CHATS.forEach(function(c){
    if(rows.length>=3 || seen[c.id] || !ANSWERS[c.id]) return;
    seen[c.id]=1; rows.push({id:c.id, when:c.when, kind:"Chat"});
  });
  [REPORTS[0], REPORTS[3]].forEach(function(r){
    if(!r || !ANSWERS[r.id]) return;
    rows.push({id:r.id, name:r.name, when:"saved "+r.saved, sched:r.sched, kind:"Saved"});
  });
  return panel("Continue where you left off", rows.map(homeRecentRow).join(""), {
    icon:"clock", tight:true, sub:"your last few",
    act:'<button class="btn sm" onclick="go(\'chat\')">All '+CHATS.length+' chats</button>',
    foot:"Reopening a chat re-runs the question — you get today's numbers, not a screenshot of last week's."
  });
}

/* =====================================================================
   6 · trending in your teams
   ===================================================================== */
function homeTrend(){
  const seen = {}, out = [];
  LIBRARY.map(function(l){
      return {l:l, n:HOME_OPENS[l.id+"|"+l.team]||8};
    })
    .sort(function(a,b){ return b.n-a.n; })
    .forEach(function(x){
      if(out.length>=4 || seen[x.l.id] || !ANSWERS[x.l.id]) return;
      seen[x.l.id]=1; out.push(x);
    });
  return out;
}
function homeTrendRow(x){
  const l = x.l, a = ANSWERS[l.id];
  return '<div class="lrow" onclick="openFromCard(\''+l.id+'\')">'
    + avatar(l.owner)
    + '<div class="lm">'
    +   '<div class="lt">'+esc(a.q)+(l.tag[0]?bdg(l.tag[0], l.tag[1]==="w"?"warn":l.tag[1]==="g"?"ok":"mut"):"")+'</div>'
    +   '<div class="ls">'+esc(l.team)+' · published by '+esc(l.owner)+' · <b>'+x.n+' people</b> in your teams opened it this week</div>'
    + '</div>'
    + '<div class="lr">'+bdg("Live","ok","refresh")+'<span>'+esc(l.refreshed)+'</span></div></div>';
}
function homeTrendPanel(){
  const t = homeTrend();
  const total = t.reduce(function(s,x){ return s+x.n; },0);
  return panel("Trending in your teams", t.map(homeTrendRow).join(""), {
    icon:"trend", tight:true, sub:total+" opens this week",
    act:'<button class="btn sm" onclick="go(\'library\')">Browse the library</button>',
    foot:"Opening one of these runs it again, as you — your scope, "+esc(homeScope())+", never the publisher's."
  });
}

/* =====================================================================
   7 · datasets worth knowing
   ===================================================================== */
function homeDsCard(d){
  return '<div class="panel clickable" onclick="openDataset(\''+d.id+'\')">'
    + '<div class="panel-b">'
    +   '<div class="rowflex" style="margin-bottom:9px;gap:6px">'+certBadge(d)+sensBadge(d.sens)+'</div>'
    +   '<div style="font-family:var(--dsp);font-size:15.5px;font-weight:600">'+esc(d.name)+'</div>'
    +   '<div class="mutedtext" style="margin-top:6px;line-height:1.5">'+esc(d.purpose)+'</div>'
    +   '<div class="hairline" style="margin:13px 0 11px"></div>'
    +   '<div class="rowflex" style="font-size:12.5px;color:var(--muted)">'
    +     I2.people.replace("<svg","<svg style=\"width:14px;height:14px\"")
    +     '<span><b>'+d.users+' people</b> in your division ask about this</span></div>'
    + '</div></div>';
}
function homeDatasets(){
  return DATASETS
    .filter(function(d){ return d.cert==="verified"; })
    .sort(function(a,b){ return b.users-a.users; })
    .slice(0,3).map(homeDsCard).join("");
}

/* =====================================================================
   9 · new here?
   ===================================================================== */
/* "New here?" lives in the rail now, under the paw (20-shell.html + core/44-rail.js) */

/* =====================================================================
   8 · governance reassurance
   ===================================================================== */
function homeGovernance(){
  const cards =
      panel("Everything runs as you",
        '<div class="mutedtext" style="line-height:1.55">Spiff re-checks who you are and what you are entitled to on <b>every single run</b> — not once at login. Change teams on Tuesday and Wednesday\'s numbers change with you.</div>',
        {icon:"shield"})
    + panel("A shared answer re-runs for whoever opens it",
        '<div class="mutedtext" style="line-height:1.55">Pavitra can send you her attendance answer. It rebuilds under <b>your</b> permissions, so you see your own scope — '+esc(homeScope())+' — and never hers. Sharing organises, it never widens access.</div>',
        {icon:"eye"})
    + panel("Sharing an automation clones it",
        '<div class="mutedtext" style="line-height:1.55">You get your own copy, running as you, on your data, on your schedule. If your access changes, your copy changes. Theirs does not, and yours never runs on their behalf.</div>',
        {icon:"copy"});
  return '<div class="g3">'+cards+'</div>'
    + '<div style="margin-top:14px">'
    + callout("info",
        '<b>See exactly what someone else would see.</b> Pick a colleague and the whole product re-renders under their permissions — nothing is shared, nothing is sent, and they are never notified. It is the fastest way to answer “can they see this?” before you press share. '
        + '<button class="btn sm" style="margin-left:8px" onclick="go(\'sim\')">Open the viewer simulator</button>', "eye")
    + '</div>';
}

/* =====================================================================
   render
   ===================================================================== */
function renderHome(){
  const watch = homeWatch();
  const h =
      homeBand()
    + homeAskPanel()
    + homePromises()
    + '<div style="margin-top:24px">'+homeNeedsPanel()+'</div>'
    + homeHead("Your watchlist", watch.length+" metrics you follow · each one re-ran for you this morning",
        '<button class="btn sm ghost" onclick="homeFollowMetric()">'+I2.plus+' Add</button>')
    + homeWatchGrid(watch)
    + '<div class="split" style="margin-top:30px">'
    +   '<div>'+homeRecentPanel()+homeTrendPanel()+'</div>'
    +   '<div>'
    +     '<div class="eyebrow2">Datasets worth knowing</div>'
    +     homeDatasets()
    +     '<div style="margin-top:14px"><button class="btn" onclick="go(\'catalog\')">'+I2.db+' All '+DATASETS.length+' datasets</button></div>'

    +   '</div>'
    + '</div>'
    + homeHead("How Spiff keeps this honest","three rules, no exceptions")
    + homeGovernance();

  $("#view-home").innerHTML = h;

  /* ---- wiring after innerHTML ---- */
  const ta = $("#home-ask");
  if(ta){
    ta.addEventListener("keydown", function(e){
      if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); homeAsk(); }
    });
    ta.addEventListener("input", function(e){
      e.target.style.height = "auto";
      e.target.style.height = Math.min(120, e.target.scrollHeight)+"px";
    });
  }
  document.querySelectorAll("#view-home [data-hq]").forEach(function(b){
    b.onclick = function(){
      const a = b.getAttribute("data-ha");
      if(a && ANSWERS[a]) openFromCard(a); else askText(b.getAttribute("data-hq"));
    };
  });
}
V2ROUTES.home = renderHome;
</script>
