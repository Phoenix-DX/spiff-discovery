<script>
/* =====================================================================
   Triggers & schedules moves under Automations — 9 Sep 2026
   It was its own rail entry, which put the clocks that drive automations
   one screen away from the automations they drive. Same move as folding
   Capabilities into Connectors: the content is worth keeping, the separate
   destination was not.

   Two clocks live on that tab and keeping them apart is the point of the
   copy: how often an answer refreshes is one thing, when a metric fires an
   automation is another. Neither is the delivery schedule, which sits on
   the automation itself.
   ===================================================================== */

const AUTO_UI = { tab:"list" };

/* the automation list, on the one list frame */
function autoTag(cls, text){
  return '<span class="tag '+cls+'" style="margin-left:7px;font-size:10px;padding:1px 7px;vertical-align:middle">'+text+'</span>';
}
function autoRow(w){
  const i = WORKFLOWS.indexOf(w), mine = w.owner === "Thato S.";
  const own  = mine ? (w.shared ? 'Shared to '+esc(w.team||'team')+' · you own it' : 'Personal') : 'Shared by '+esc(w.owner);
  const subTag = autoSubEligible(w)
    ? autoTag('w', autoSubsFor(w).find(function(s){ return s.who === "Thato S."; }) ? 'Subscribed' : 'You are not a recipient')
    : '';
  const dead = w.steps.filter(function(st){ return blockState(st.cap) === "proposed"; }).length;
  return '<div class="rowflex" style="gap:8px;align-items:stretch">'
    + '<button class="team" style="flex:1" onclick="openFlow('+i+')">'
    +   '<div class="ti" style="background:'+(w.on?"#1E8449":"#8A9199")+'">'+ICON.flow+'</div>'
    +   '<div style="flex:1;min-width:0"><div class="tn">'+esc(w.name)+autoTag(mine && !w.shared ? '' : 'g', own)+subTag
    +     (dead ? autoTag('r', dead+' step'+(dead===1?'':'s')+' cannot run') : '')+'</div>'
    +   '<div class="td">Fires '+esc(trigSummary(w.trig,w.cfg))+' · '+w.steps.length+' steps · runs as '+(mine?'you':esc(w.owner))+'</div></div>'
    +   '<div class="tc">'+(w.on?"On":"Off")+'</div></button>'
    + '<div style="align-self:center">'+kebabHTML([
        {label:'Open', icon:'flow', onclick:'openFlow('+i+')'},
        {label:w.on?'Turn off':'Turn on', icon:'bolt', onclick:'autoToggle('+i+')'},
        {label:'Delete', icon:'trash', danger:true, onclick:'deleteWorkflowAsk('+i+')'}])+'</div>'
    + '</div>';
}
function autoToggle(i){ const w=WORKFLOWS[i]; if(!w) return; w.on=!w.on; toast(w.name+(w.on?' is on':' is off')); renderAutomations(); }
function autoListHTML(){
  return '<div class="teamrow">' + listFrame("autos", {
    items: WORKFLOWS, repaint: renderAutomations, noun: "automations", noun1: "automation",
    search: function(w){ return w.name+' '+w.owner+' '+(w.team||''); }, placeholder: "Search automations by name, owner or team…",
    sorts: [{key:"name", label:"Name", get:function(w){ return w.name; }},
            {key:"owner", label:"Owner", get:function(w){ return w.owner === "Thato S." ? "" : w.owner; }},
            {key:"state", label:"On first", get:function(w){ return w.on ? 0 : 1; }},
            {key:"steps", label:"Most steps", get:function(w){ return w.steps.length; }, desc:true}],
    row: autoRow,
    emptyTitle: "No automations yet", emptySub: "Open an answer and turn it into one.", emptyIcon: "flow"
  }) + '</div>';
}

/* the clocks — the same two tables, on the frame, and now deletable */
function clockDeleteAsk(kind, i){
  const arr = kind === 'run' ? SCHEDRUNS : TRIGRULES, x = arr[i]; if(!x) return;
  confirmAsk({
    title: kind === 'run' ? 'Delete the refresh for “'+esc(x.name)+'”?' : 'Delete the trigger “'+esc(x.rule)+'”?',
    body: kind === 'run'
      ? 'The answer stops refreshing on a schedule. It still runs whenever someone opens it, and the automations that read it keep their own clocks.'
      : 'Nothing fires when this condition is met any more. The automation it ran — '+esc(x.wf)+' — is not deleted; it just loses this trigger.',
    verb: 'Delete', onConfirm: function(){ arr.splice(i,1); toast('Deleted'); AUTO_UI.tab = "clocks"; renderAutomations(); }
  });
}
function clockPill(kind, i, on){
  return '<button class="onpill '+(on?'on':'off')+'" data-t="'+kind+'" data-i="'+i+'" aria-pressed="'+(on?'true':'false')+'">'+(on?'On':'Off')+'</button>';
}
function autoClocksHTML(){
  const runs = listFrame("clocks-run", {
    items: SCHEDRUNS, repaint: renderAutomations, noun: "refreshes", noun1: "refresh", size: 10,
    search: function(s){ return s.name+' '+s.owner+' '+s.cadence; }, placeholder: "Search refreshes…",
    sorts: [{key:"name", label:"Answer", get:function(s){ return s.name; }},
            {key:"owner", label:"Owner", get:function(s){ return s.owner; }},
            {key:"state", label:"On first", get:function(s){ return s.on ? 0 : 1; }}],
    cols: [{label:"Answer", sort:"name", cell:function(s){ return esc(s.name); }},
           {label:"Refresh", cell:function(s){ return esc(s.cadence); }},
           {label:"Next", cell:function(s){ return esc(s.next); }},
           {label:"Owner", sort:"owner", cell:function(s){ return esc(s.owner); }},
           {label:"Est. cost/run", num:true, cell:function(s){ return esc(s.cost); }},
           {label:"Status", sort:"state", cell:function(s){ return clockPill('run', SCHEDRUNS.indexOf(s), s.on); }}],
    actions: function(s){ return [{label:'Delete refresh', icon:'trash', danger:true, onclick:'clockDeleteAsk(\'run\','+SCHEDRUNS.indexOf(s)+')'}]; },
    emptyTitle: "No scheduled refreshes", emptySub: "Answers still run when opened; a schedule only adds a heartbeat.", emptyIcon: "clock"
  });
  const trigs = listFrame("clocks-trig", {
    items: TRIGRULES, repaint: renderAutomations, noun: "triggers", noun1: "trigger", size: 10,
    search: function(t){ return t.rule+' '+t.src+' '+t.wf; }, placeholder: "Search triggers…",
    sorts: [{key:"rule", label:"Condition", get:function(t){ return t.rule; }},
            {key:"src", label:"From answer", get:function(t){ return t.src; }},
            {key:"wf", label:"Runs automation", get:function(t){ return t.wf; }},
            {key:"state", label:"On first", get:function(t){ return t.on ? 0 : 1; }}],
    cols: [{label:"When", sort:"rule", cell:function(t){ return esc(t.rule); }},
           {label:"From answer", sort:"src", cell:function(t){ return esc(t.src); }},
           {label:"Checked", cell:function(t){ return esc(t.cadence); }},
           {label:"Runs automation", sort:"wf", cell:function(t){ return esc(t.wf); }},
           {label:"Last fired", cell:function(t){ return esc(t.last); }},
           {label:"Status", sort:"state", cell:function(t){ return clockPill('trig', TRIGRULES.indexOf(t), t.on); }}],
    actions: function(t){ return [{label:'Delete trigger', icon:'trash', danger:true, onclick:'clockDeleteAsk(\'trig\','+TRIGRULES.indexOf(t)+')'}]; },
    emptyTitle: "No metric triggers", emptySub: "A trigger watches a number in an answer and fires an automation when it crosses a line.", emptyIcon: "bolt"
  });
  return callout("info","<b>Two clocks, and they are not the same one.</b> How often an answer refreshes is its heartbeat, "
      + "and it is most of what the running cost is made of. When a number fires an automation is a second clock. "
      + "Neither is the delivery schedule — that sits on the automation. Changing one never changes the others.")
    + '<div style="height:14px"></div>'
    + '<div class="govstrip">'
    +   '<div class="govcard"><div class="gk">Min refresh interval</div><div class="gv">15 minutes</div><div class="gs">Faster needs approval</div></div>'
    +   '<div class="govcard"><div class="gk">Tenant budget · '+esc(BUDGET.month)+'</div><div class="gv">'+NZD(BUDGET.tenant.used)+' <span style="font-size:13px;color:var(--muted);font-weight:500">of '+NZD(BUDGET.tenant.cap)+'</span></div>'
    +     '<div class="gs">'+budgetPct(BUDGET.tenant.used,BUDGET.tenant.cap)+'% used, day '+BUDGET.dayOfMonth+' of '+BUDGET.daysInMonth+' · <button class="lnk" onclick="ADM.tab=\'budgets\';go(\'admin\')">Budgets</button></div></div>'
    +   '<div class="govcard"><div class="gk">Who can create triggers</div><div class="gv">Owners + analysts</div><div class="gs">Writes need an approval step</div></div>'
    + '</div>'
    + '<div class="adm-sec">'+ICON.clock+' Answer refreshes — the heartbeat</div>' + runs
    + '<div class="adm-sec" style="margin-top:22px">'+ICON.bolt+' Metric triggers — when a number fires an automation</div>' + trigs
    + '<div class="flownote" style="margin-top:18px">'+ICON.shield+' Every triggered automation runs as its owner — '
    + 'a threshold only sees data that owner can, and the actions honour their permissions.</div>';
}

/* the On/Off pills mutate the fixture and re-render, so the tab has to be
   remembered across the re-render or a toggle would throw you back to the list */
function autoWireClocks(){
  const root = $('#view-autos'); if(!root) return;
  root.querySelectorAll('.onpill').forEach(function(p){
    p.onclick = function(){
      const arr = p.dataset.t === 'run' ? SCHEDRUNS : TRIGRULES;
      arr[+p.dataset.i].on = !arr[+p.dataset.i].on;
      AUTO_UI.tab = "clocks";
      renderAutomations();
    };
  });
}

function renderAutomations(){
  const dead = WORKFLOWS.filter(function(w){
    return w.steps.some(function(st){ return blockState(st.cap) === "proposed"; });
  }).length;
  const clocks = SCHEDRUNS.length + TRIGRULES.length;
  const live = SCHEDRUNS.filter(function(s){ return s.on; }).length
             + TRIGRULES.filter(function(t){ return t.on; }).length;

  $('#view-autos').innerHTML =
      pageHead({eyebrow:"Automate", title:"Automations",
        desc:"Turn an answer into an automation — a trigger, then blocks you drag together. Every step runs as you, and can never do what you could not. The clocks that drive them are the second tab.",
        badges: bdg(WORKFLOWS.length+" automations","mut","flow")
              + bdg(live+" of "+clocks+" clocks running","ok","clock")
              + (dead ? bdg(dead+" with a step that cannot run","crit","warn") : ""),
        acts:'<button class="btn pri" onclick="newFlowModal()">'+I2.plus+'New automation</button>'})
    + tabsHTML("autos", [["list","Automations",WORKFLOWS.length],
                         ["clocks","Schedules",clocks]], AUTO_UI.tab)
    + pane("autos","list",   autoListHTML(),   AUTO_UI.tab === "list")
    + pane("autos","clocks", autoClocksHTML(), AUTO_UI.tab === "clocks");

  document.querySelectorAll('[data-tabs="autos"] button').forEach(function(b){
    b.addEventListener("click", function(){ AUTO_UI.tab = b.dataset.tab; });
  });
  autoWireClocks();
}

/* The old Triggers & schedules screen is gone; its content is the clocks tab above.
   The "admin" view id now belongs to the Admin page (views/73-admin.js). */
</script>
