<script>
/* =====================================================================
   Admin › Budgets and Admin › AI provider — 11 Sep 2026
   Budgets: each team's allowance for the month and how far through it
   they are, the tenant cap above them, what pauses first at the cap, and
   the rate card every cost derives from. Nobody sees a token.

   AI provider: where answers are generated, whose key pays, which model
   does which job. Spiff-managed by default; an organisation — or one
   team — can bring its own key. A key is pasted once, verified, and
   never shown again.
   ===================================================================== */

/* ---------- budgets ---------- */
function admTeamSpend(team){
  const b = budgetFor(team), meta = (typeof TEAM_META !== "undefined" && TEAM_META[team]) || {members:[]};
  /* a deterministic spread of the team's people spend across its members, so the lookup is stable */
  const members = meta.members || [];
  const weights = members.map(function(n, i){ return 1 + ((n.length * 7 + i * 13) % 9); });
  const tot = weights.reduce(function(a, w){ return a + w; }, 0) || 1;
  const people = members.map(function(n, i){ return {name:n, spend: b.people * weights[i] / tot}; })
    .sort(function(a, c){ return c.spend - a.spend; });
  const owners = members.length ? members : [];
  const runs = SCHEDRUNS.filter(function(s){ return owners.some(function(n){ return n.split(" ")[0] === s.owner.split(" ")[0]; }); })
    .map(function(s){
      const perDay = /30 min/.test(s.cadence) ? 48 : /Real-time/.test(s.cadence) ? 160 : /Hourly/.test(s.cadence) ? 24 : /Daily/.test(s.cadence) ? 1 : /Weekly/.test(s.cadence) ? 1/7 : 1;
      const unit = parseFloat(String(s.cost).replace(/[^\d.]/g, "")) || 0.05;
      return {name:s.name, cadence:s.cadence, month: unit * perDay * 30, on:s.on};
    }).sort(function(a, c){ return c.month - a.month; });
  return {people:people, runs:runs};
}
function admSpendModal(team){
  const b = budgetFor(team), sp = admTeamSpend(team);
  openModal('<h3>What '+esc2(team)+' is spending on</h3>'
    + '<div class="msub">'+NZD(b.used)+' of '+NZD(b.allowance)+' this month · '+NZD(b.schedules)+' on schedules, '+NZD(b.people)+' on people\'s questions. Estimates from the rate card.</div>'
    + '<div class="g2">'
    + panel("Scheduled refreshes", sp.runs.length ? '<div class="kvlist">'+sp.runs.slice(0,6).map(function(r){
          return '<div class="r"><span class="k">'+esc2(r.name)+'<div class="mutedtext" style="font-size:11.5px">'+esc2(r.cadence)+(r.on?'':' · off')+'</div></span><span class="v mono">'+NZD(r.month)+' / mo</span></div>'; }).join('')+'</div>'
        : '<div class="mutedtext">No schedules owned by this team.</div>', {icon:"clock", sub:"the cost driver"})
    + panel("People", sp.people.length ? '<div class="kvlist">'+sp.people.slice(0,6).map(function(p){
          return '<div class="r"><span class="k">'+personChip(p.name,'')+'</span><span class="v mono">'+NZD(p.spend)+'</span></div>'; }).join('')
          + (sp.people.length > 6 ? '<div class="mutedtext" style="font-size:12px">and '+(sp.people.length-6)+' more</div>' : '')+'</div>'
        : '<div class="mutedtext">No members yet.</div>', {icon:"people", sub:"questions asked this month"})
    + '</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    + '<button class="btn pri" onclick="closeModal();admRaiseModal(\''+admQ(team)+'\')">Raise the allowance</button></div>', 720);
}
function admRaiseModal(team){
  const b = budgetFor(team);
  wizardOpen({
    title:'Raise the allowance for '+esc2(team),
    intro:'Today: '+NZD(b.allowance)+' a month, '+NZD(b.used)+' used, on track for '+NZD(budgetForecast(b.used))+'. A raise moves money inside the tenant cap of '+NZD(BUDGET.tenant.cap)+'; it does not add to it.',
    finish:'Ask the Platform Admins', width:560,
    data:{ add:250, why:'' },
    steps:[
      { name:'How much', render:function(d){ return admSelect('adm-r-add','Add to the monthly allowance',[100,250,500,1000].map(function(v){ return '<option value="'+v+'"'+(v===d.add?' selected':'')+'>'+NZD(v)+' → new allowance '+NZD(b.allowance+v)+'</option>'; }).join(''))
            + '<div class="wz-note">Left in the tenant cap after this: '+NZD(BUDGET.tenant.cap - Object.keys(BUDGET.teams).reduce(function(a,k){ return a + BUDGET.teams[k].allowance; },0) - d.add)+'. The cap itself is the Platform Admins\' to change.</div>'; },
        collect:function(){ return { add: +admVal('adm-r-add') }; } },
      { name:'Why', render:function(d){ return '<div class="field"><label>Why — written to the activity log</label><textarea class="txt" id="adm-r-why" rows="3" placeholder="e.g. Two new weekly packs for the cluster review">'+esc2(d.why)+'</textarea></div>'; },
        collect:function(){ return { why: admVal('adm-r-why') }; },
        validate:function(d){ if(!d.why) return 'Write the reason — it goes on the log'; } }
    ],
    onFinish:function(d){ (BUDGET.raises=BUDGET.raises||[]).unshift({id:'raise-'+Date.now(), team:team, add:d.add, by:ME.full, why:d.why, on:'today '+FX.time, status:'waiting'}); if(typeof inboxAfterDecision==='function') inboxAfterDecision(); toast('Sent to the Platform Admins — it is in their Inbox; '+team+' keeps '+NZD(b.allowance)+' until they decide'); admRepaint('budgets'); }
  });
}
function admPauseAsk(team){
  const b = budgetFor(team);
  confirmAsk({title:'Pause '+esc2(team)+'\'s scheduled refreshes?',
    body:'Their answers stop refreshing on a clock until someone turns them back on; they still run whenever a person opens them. This saves about '+NZD(b.schedules / BUDGET.dayOfMonth * (BUDGET.daysInMonth - BUDGET.dayOfMonth))+' for the rest of the month.',
    verb:'Pause', onConfirm:function(){ b.paused = true; toast('Paused — '+team+'\'s schedules'); admRepaint('budgets'); }});
}
function admBudgetRow(team){
  const b = budgetFor(team), pct = budgetPct(b.used, b.allowance), fc = budgetForecast(b.used), over = fc > b.allowance;
  return { team:team, b:b, pct:pct, fc:fc, over:over };
}
function admBudgetsPane(){
  const t = BUDGET.tenant, tp = budgetPct(t.used, t.cap), tf = budgetForecast(t.used), tOver = tf > t.cap;
  const teams = TEAMS.map(function(x){ return x[0]; });
  const allocated = teams.reduce(function(a, k){ return a + budgetFor(k).allowance; }, 0);
  const head = '<div class="g3" style="margin-bottom:16px">'
    + kpi("This month, whole tenant", NZD(t.used)+' <span style="font-size:15px;color:var(--muted)">of '+NZD(t.cap)+'</span>',
        meter(tp, tp>=100?'crit':tp>=80?'warn':'ok')+'<div style="margin-top:6px">Day '+BUDGET.dayOfMonth+' of '+BUDGET.daysInMonth+' · '+tp+'% used · cap owned by '+esc2(t.owner)+'</div>')
    + kpi("At this rate", NZD(tf), (tOver ? bdg(NZD(tf - t.cap)+' over the cap by month end','warn','warn') : bdg(NZD(t.cap - tf)+' under the cap','ok','check'))
        + '<div style="margin-top:6px">A straight line from '+BUDGET.dayOfMonth+' days. Schedules pause first if the cap is reached.</div>')
    + kpi("Allocated to teams", NZD(allocated)+' <span style="font-size:15px;color:var(--muted)">of '+NZD(t.cap)+'</span>',
        '<div>'+NZD(t.cap - allocated)+' unallocated · every person also has a fair-use default of '+NZD(BUDGET.personDefault)+' a month — you have used '+NZD(BUDGET.me.used)+'</div>')
    + '</div>';
  const list = listFrame("adm-budgets", {
    items: teams.map(admBudgetRow), repaint:function(){ admRepaint('budgets'); }, noun:"teams", noun1:"team", size:10,
    search:function(r){ return r.team+' '+r.b.owner; }, placeholder:"Search teams by name or owner…",
    sorts:[{key:"pct",   label:"Most used first",       get:function(r){ return r.pct; }, desc:true},
           {key:"over",  label:"Over forecast first",   get:function(r){ return r.over ? 0 : 1; }},
           {key:"name",  label:"Name",                  get:function(r){ return r.team; }},
           {key:"alloc", label:"Largest allowance",     get:function(r){ return r.b.allowance; }, desc:true}],
    cols:[{label:"Team", sort:"name", cell:function(r){ return '<div style="font-weight:600">'+esc2(r.team)+'</div><div class="mutedtext" style="font-size:11.5px">'+esc2(r.b.owner)+(r.b.paused?' · <span style="color:var(--warn)">schedules paused</span>':'')+(r.b.isNew?' · new team, default allowance':'')+'</div>'; }},
          {label:"Allowance", sort:"alloc", num:true, cell:function(r){ return NZD(r.b.allowance); }},
          {label:"Used so far", sort:"pct", style:"min-width:220px", cell:function(r){ return '<div class="rowflex" style="gap:8px;flex-wrap:nowrap">'+meter(r.pct, r.pct>=100?'crit':r.pct>=80?'warn':'ok')+'<span class="mono" style="font-size:12px;white-space:nowrap">'+NZD(r.b.used)+' · '+r.pct+'%</span></div>'; }},
          {label:"At this rate", sort:"over", cell:function(r){ return r.over ? bdg(NZD(r.fc)+' — over by '+NZD(r.fc - r.b.allowance),'warn','warn') : bdg(NZD(r.fc)+' — inside','ok','check'); }},
          {label:"Schedules · people", cell:function(r){ return '<span class="mono" style="font-size:12px">'+NZD(r.b.schedules)+' · '+NZD(r.b.people)+'</span>'; }}],
    actions:function(r){ return [
      {label:'What is spending', icon:'search', onclick:"admSpendModal('"+admQ(r.team)+"')"},
      {label:'Raise the allowance', icon:'trend', onclick:"admRaiseModal('"+admQ(r.team)+"')"},
      {label:r.b.paused?'Resume schedules':'Pause schedules', icon:'clock', danger:!r.b.paused, onclick:r.b.paused?"budgetFor('"+admQ(r.team)+"').paused=false;toast('Resumed');admRepaint('budgets')":"admPauseAsk('"+admQ(r.team)+"')"}]; },
    emptyTitle:"No teams yet", emptyIcon:"people"
  });
  const rate = panel("The rate card — NZ$ per 1,000 tokens", '<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Model</th><th class="num">In</th><th class="num">Out</th><th>Used for</th></tr></thead><tbody>'
    + RATE_CARD.map(function(r){ return '<tr><td><div style="font-weight:600">'+esc2(r.model)+'</div><div class="mutedtext" style="font-size:11.5px">'+esc2(r.note)+'</div></td><td class="num">'+r.inPer1k.toFixed(4)+'</td><td class="num">'+r.outPer1k.toFixed(4)+'</td><td style="font-size:12.5px">'+esc2(r.use)+'</td></tr>'; }).join('')
    + '</tbody></table></div>', {icon:"db", tight:true, sub:"the one place a price lives", act:'<button class="btn sm" onclick="toast(\'Re-pricing is logged and takes effect at midnight\')">'+I2.pencil+' Re-price</button>',
      foot:"Every cost on every screen — a run, a read, a question — is tokens × this card. Nobody sees a token; they see the dollars."});
  const rules = panel("How the cap works", '<ol style="margin:0;padding-left:18px;font-size:13.5px;line-height:1.7">'
    + BUDGET.cutOrder.map(function(l){ return '<li>'+esc2(l)+'</li>'; }).join('') + '</ol>'
    + '<div class="hairline" style="margin:12px 0"></div>'
    + '<div style="font-size:13px;line-height:1.6"><b>Alerts.</b> '+BUDGET.alerts.map(function(a){ return 'At '+a.at+'% — '+esc2(a.who); }).join('. ')+'. Each one is an inbox item, not only a toast. '
    + 'A team that runs out can ask for more from its own Budgets row; the request goes to '+esc2(BUDGET.tenant.owner)+'.</div>', {icon:"shield"});
  return callout("info","<b>Budgets are in dollars, not tokens.</b> Spiff meters tokens and shows New Zealand dollars from the rate card below. A budget belongs to a scope — the tenant, a team, a person — never to the model. Figures are estimates and say so.")
    + '<div style="height:14px"></div>' + head + list
    + '<div class="g2" style="margin-top:16px">' + rate + rules + '</div>';
}

/* ---------- AI provider ---------- */
function admTestConnection(){ const as_ = PROVIDER.key.kind==='entra' ? "Spiff's managed identity" : 'the credential ending '+PROVIDER.key.mask.slice(-4); toast('Verified — one call to '+PROVIDER.host.split(' — ')[0]+', 212 ms, as '+as_); }
function admProviderSet(k, v){
  PROVIDER[k] = v;
  if(k === 'mode') toast(v === 'byo' ? 'Answers now run on your organisation\'s own credential — usage is still metered and shown' : 'Answers run as Spiff\'s managed identity, inside the tenant cap');
  else if(k === 'host') toast('Answers are generated at '+v+' from the next question');
  else if(k === 'allowOpus') toast(v ? 'Teams may allow Opus for hard questions — five times the price, and it says so' : 'Opus is off everywhere');
  admRepaint('provider');
}
function admRouteSet(id, model){ const r = MODEL_ROUTES.find(function(x){ return x.id === id; }); if(r){ r.model = model; toast(r.task+' now uses '+rateById(model).model); admRepaint('provider'); } }
function admKeyWizard(team){
  wizardOpen({
    title: team ? 'Add a credential for '+esc2(team) : 'Replace the organisation\'s credential',
    intro: 'For '+esc2(PROVIDER.host)+'. Pasted once, verified with a single call, stored encrypted, never displayed again — only its last four characters.',
    finish:'Activate', width:560,
    data:{ team:team||'', key:'', endpoint:'', verified:false, tail:'' },
    steps:[
      { name:'Paste', render:function(d){ return (team ? '' : admSelect('adm-k-team','For', '<option value="">The whole organisation</option>'+TEAMS.map(function(t){ return '<option value="'+esc2(t[0])+'">'+esc2(t[0])+' only</option>'; }).join('')))
            + (providerCred().endpointLabel ? '<div class="field"><label>'+esc2(providerCred().endpointLabel)+'</label><input class="txt" id="adm-k-ep" autocomplete="off" placeholder="'+esc2(providerCred().endpointPlaceholder)+'" value="'+esc2(d.endpoint)+'"></div>' : '')
            + '<div class="field"><label>'+esc2(providerCred().label)+'</label><input class="txt" id="adm-k-key" type="password" autocomplete="off" placeholder="'+esc2(providerCred().placeholder)+'" value="'+esc2(d.key)+'"></div>'
            + '<div class="wz-note">'+esc2(providerCred().note)+' Sent once, to verify; never written to the activity log.</div>'; },
        collect:function(d){ return { key: admVal('adm-k-key').trim(), endpoint: providerCred().endpointLabel ? admVal('adm-k-ep').trim() : '', team: team || admVal('adm-k-team') }; },
        validate:function(d){ if(providerCred().endpointLabel && !/^https:\/\/[a-z0-9-]+\./i.test(d.endpoint)) return 'The endpoint should be an https address'; if(!providerCred().test(d.key)) return providerCred().bad; } },
      { name:'Verify', render:function(d){ d.tail = d.key.slice(-4); return callout('ok','<b>Verified.</b> One call to '+esc2(d.endpoint || PROVIDER.host)+' — Claude Sonnet 5 reachable in 212 ms. '+(d.tail ? 'Credential ends <span class="mono">'+esc2(d.tail)+'</span>.' : 'Signed in as Spiff\'s managed identity — no key.'))
            + '<div class="wz-note">'+(d.team ? 'Usage on this key is billed to '+esc2(d.team)+'\'s own contract. It still counts against their allowance here, so the meter stays honest.' : 'Usage on this key is billed to your organisation\'s own contract, not to Spiff. The tenant cap becomes a visibility limit, not a bill.')+'</div>'; } },
      { name:'Activate', render:function(d){ return '<div style="font-size:14px;line-height:1.7">From the next question, '+(d.team ? '<b>'+esc2(d.team)+'</b>' : '<b>everyone</b>')+' runs on '+(d.tail ? 'the credential ending <span class="mono">'+esc2(d.tail)+'</span>' : 'Spiff\'s managed identity')+'.'
            + (d.team ? '' : ' The current credential is retired at midnight, so nothing in flight fails.')+'<br>Every other system admin is told.</div>'; } }
    ],
    onFinish:function(d){
      const rec = {kind: d.tail ? 'key' : 'entra', mask: providerCred().mask(d.tail), by:ME.full||'you', on:'just now', verified:'just now'};
      if(d.team){ PROVIDER.teamKeys = PROVIDER.teamKeys.filter(function(k){ return k.team !== d.team; }); PROVIDER.teamKeys.push(Object.assign({team:d.team}, rec)); }
      else { PROVIDER.key = Object.assign({calls30d:0}, rec); PROVIDER.mode = 'byo'; }
      toast(d.tail ? 'Credential activated — ends '+d.tail : 'Activated — Spiff\'s managed identity'); admRepaint('provider');
    }
  });
}
function admKeyRemoveAsk(team){
  confirmAsk({title: team ? 'Remove '+esc2(team)+'\'s credential?' : 'Remove the organisation\'s credential?',
    body: team ? 'From the next question '+esc2(team)+' runs on the organisation\'s credential and counts against the tenant cap again.' : 'Spiff falls back to its own managed identity from the next question, inside the tenant cap. Nothing in flight fails.',
    verb:'Remove', onConfirm:function(){
      if(team) PROVIDER.teamKeys = PROVIDER.teamKeys.filter(function(k){ return k.team !== team; });
      else { PROVIDER.mode = 'spiff'; PROVIDER.key = {kind:'entra', mask:'Entra ID · managed identity spiff-prod', by:'Spiff', on:'—', verified:'today 06:12', calls30d:PROVIDER.key.calls30d}; }
      toast('Removed'); admRepaint('provider'); }});
}
function admProviderPane(){
  const byo = PROVIDER.mode === 'byo';
  const where = panel("Where answers are generated", ''
    + '<div class="g2">'
    +   admSelect('adm-p-prov','Model family','<option>Anthropic — Claude</option><option disabled>Another model family — ask a system admin</option>')
    +   '<div class="field"><label>Hosted at</label><select class="txt" onchange="admProviderSet(\'host\',this.value)">'+PROVIDER.hosts.map(function(h){ return '<option'+(h===PROVIDER.host?' selected':'')+'>'+esc2(h)+'</option>'; }).join('')+'</select></div>'
    + '</div>'
    + '<div class="field"><label>Whose credential pays</label>'
    +   '<label class="ckrow"><input type="radio" name="adm-mode" '+(byo?'':'checked')+' onchange="admProviderSet(\'mode\',\'spiff\')"> <b>Spiff-managed</b> — Spiff\'s own identity at the host, billed to '+esc2(PROVIDER.billing)+', inside the tenant cap of '+NZD(BUDGET.tenant.cap)+' a month</label>'
    +   '<label class="ckrow"><input type="radio" name="adm-mode" '+(byo?'checked':'')+' onchange="admProviderSet(\'mode\',\'byo\')"> <b>Bring your own</b> — your organisation\'s own project and contract at the host; usage is still metered and shown here</label>'
    + '</div>'
    + '<div class="kvlist" style="margin-top:6px">'
    +   '<div class="r"><span class="k">Credential</span><span class="v mono">'+esc2(PROVIDER.key.mask)+'</span></div>'
    +   '<div class="r"><span class="k">Billed to</span><span class="v">'+esc2(byo ? 'your organisation\'s own contract' : PROVIDER.billing)+'</span></div>'
    +   '<div class="r"><span class="k">Added</span><span class="v">'+esc2(PROVIDER.key.by)+' · '+esc2(PROVIDER.key.on)+'</span></div>'
    +   '<div class="r"><span class="k">Last verified</span><span class="v">'+esc2(PROVIDER.key.verified)+' · '+fmt(PROVIDER.key.calls30d)+' calls in 30 days</span></div>'
    +   '<div class="r"><span class="k">Retention</span><span class="v">'+(PROVIDER.retention==='none' ? bdg('None — zero-retention terms in place','ok','shield') : bdg('Provider default','warn','warn'))+'</span></div>'
    + '</div>',
    {icon:"plug", foot:'<button class="btn sm" onclick="admTestConnection()">'+I2.check+' Test connection</button>'
      + '<button class="btn sm" onclick="admKeyWizard()">'+I2.pencil+' '+(byo?'Replace credential':'Bring your own')+'</button>'
      + (byo ? '<button class="btn sm danger" onclick="admKeyRemoveAsk()">'+I2.x+' Remove credential</button>' : '')});
  const routes = panel("Which model does what", '<div class="dtbl-wrap"><table class="dtbl"><thead><tr><th>Task</th><th>Model</th><th>Typical cost</th></tr></thead><tbody>'
    + MODEL_ROUTES.map(function(r){
        const off = r.optional && !PROVIDER.allowOpus;
        return '<tr'+(off?' style="opacity:.6"':'')+'><td style="font-weight:600">'+esc2(r.task)+(r.optional?'<div class="mutedtext" style="font-size:11.5px;font-weight:400">'+(PROVIDER.allowOpus?'allowed by a team that opts in':'off — Opus is not allowed')+'</div>':'')+'</td>'
          + '<td><select class="txt" style="width:auto;padding:5px 8px;font-size:13px" onchange="admRouteSet(\''+r.id+'\',this.value)">'+RATE_CARD.filter(function(m){ return m.id!=='opus' || PROVIDER.allowOpus || r.model==='opus'; }).map(function(m){ return '<option value="'+m.id+'"'+(m.id===r.model?' selected':'')+'>'+esc2(m.model)+'</option>'; }).join('')+'</select></td>'
          + '<td class="mono" style="font-size:12.5px">'+esc2(r.typical)+'</td></tr>'; }).join('')
    + '</tbody></table></div>',
    {icon:"spark", tight:true, sub:"one model per kind of work",
     foot:'<span class="rowflex" style="gap:9px;font-size:13px">'+sw(PROVIDER.allowOpus,"admProviderSet('allowOpus',!PROVIDER.allowOpus)","Allow Opus for hard questions")+'<span>Allow Opus for hard questions — five times the price, and every answer that used it says so</span></span>'});
  const keys = panel("Team keys", listFrame("adm-teamkeys", {
      items: PROVIDER.teamKeys, repaint:function(){ admRepaint('provider'); }, noun:"team credentials", noun1:"team credential", size:10,
      sorts:[{key:"team", label:"Team", get:function(k){ return k.team; }}, {key:"on", label:"Most recently added", get:function(k){ return k.on; }, desc:true}],
      cols:[{label:"Team", sort:"team", cell:function(k){ return '<div style="font-weight:600">'+esc2(k.team)+'</div>'; }},
            {label:"Credential", cell:function(k){ return '<span class="mono" style="font-size:12.5px">'+esc2(k.mask)+'</span>'; }},
            {label:"Added", cell:function(k){ return esc2(k.by)+' · '+esc2(k.on); }},
            {label:"Verified", cell:function(k){ return esc2(k.verified); }},
            {label:"This month", num:true, cell:function(k){ return NZD(budgetFor(k.team).used); }}],
      actions:function(k){ return [{label:'Replace credential', icon:'pencil', onclick:"admKeyWizard('"+admQ(k.team)+"')"}, {label:'Remove credential', icon:'x', danger:true, onclick:"admKeyRemoveAsk('"+admQ(k.team)+"')"}]; },
      emptyTitle:"No team credentials", emptySub:"Every team runs on the organisation's credential.", emptyIcon:"lock"
    }), {icon:"lock", tight:true, sub:"a team on its own contract", act:'<button class="btn sm pri" onclick="admKeyWizard()">'+I2.plus+' Add a team credential</button>',
        foot:"A team credential is billed to that team's own contract, not the tenant cap. Its usage is still metered and shown against the team's allowance, so the Budgets tab stays honest."});
  return callout("info","<b>What leaves the tenant.</b> The question, the rows this person is allowed to see, and the agreed definitions — sent to the provider at the host below. Never the key. Never a row outside their scope. Nothing is retained by the provider under the terms in place.")
    + '<div style="height:14px"></div>' + where
    + '<div style="height:14px"></div>' + routes
    + '<div style="height:14px"></div>' + keys;
}
</script>
