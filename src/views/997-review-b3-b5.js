<script>
/* =====================================================================
   Review items B3, B4 and B5 (15 Sep 2026)

   B3 — the top bar had a search box and a New question button side by
        side, and new users typed their question into the search. The
        search now *finds*: it shows what it matched as you type — pages,
        datasets, people, answers — and its last row is always "Ask Spiff
        this", so asking is an explicit choice, never a silent fall-through.
        New question stays the one dominant control.
   B4 — six dialogs still carried the first generation's shape (Share,
        Schedule, Subscribe, Pin as tile, Subscribe to an automation, Share
        this conversation). They are rebuilt on the wizard: one question a
        step, a Review step that reads back what was chosen, the governance
        sentence where it belongs, and the verb on the last button.
   B5 — the same access requests wait in Inbox › Decisions and in
        People & access › Decisions. The second says so, and links to the
        first. One list, two doors.
   ===================================================================== */

/* ---------- B3: the search finds, then offers to ask ---------- */
const GS = { items:[], on:0, open:false };
function gsPop(){ let p = $('#gs-pop'); if(!p){ const box = document.querySelector('.topbar .search'); if(!box) return null; p = document.createElement('div'); p.id = 'gs-pop'; p.className = 'gs-pop'; box.appendChild(p); } return p; }
function gsNavPages(){
  return [].slice.call(document.querySelectorAll('#nav a[data-view]')).map(function(a){ return { view:a.dataset.view, label:(a.querySelector('.nl')||a).textContent.trim() }; });
}
function gsBuild(q){
  const s = q.toLowerCase(), has = function(t){ return String(t||'').toLowerCase().indexOf(s) >= 0; }, out = [];
  gsNavPages().filter(function(p){ return has(p.label); }).slice(0,3).forEach(function(p){ out.push({ kind:'Page', icon:'grid', t:p.label, s:'Open the page', go:function(){ go(p.view); } }); });
  (typeof DATASETS!=='undefined' ? DATASETS : []).filter(function(d){ return has(d.name) || has(d.domain); }).slice(0,3).forEach(function(d){ out.push({ kind:'Dataset', icon:'db', t:d.name, s:d.domain || '', go:function(){ openDataset(d.id); } }); });
  (typeof PEOPLE!=='undefined' ? PEOPLE : []).filter(function(p){ return has(p.name) || has(p.title); }).slice(0,3).forEach(function(p){ out.push({ kind:'Person', icon:'people', t:p.name, s:p.title || '', go:function(){ openPerson(p.name); } }); });
  if(typeof ANSWERS!=='undefined') Object.keys(ANSWERS).filter(function(id){ return has(ANSWERS[id].q); }).slice(0,3).forEach(function(id){ out.push({ kind:'Answer', icon:'spark', t:ANSWERS[id].q, s:'Re-runs as you when you open it', go:function(){ openAnswer(id); } }); });
  out.push({ kind:'Ask', icon:'msg', t:'Ask Spiff: “' + q + '”', s:'A new question, answered as you', ask:true, go:function(){ askText(q); } });
  return out;
}
function gsPaint(){
  const p = gsPop(); if(!p) return;
  if(!GS.open || !GS.items.length){ p.classList.remove('on'); p.innerHTML = ''; return; }
  let last = '';
  p.innerHTML = GS.items.map(function(it, i){
    const head = (it.kind !== last && !it.ask) ? '<div class="gs-h">' + esc2(it.kind + (it.kind==='Person' ? 's' : it.kind==='Answer' ? 's' : it.kind==='Dataset' ? 's' : 's')) + '</div>' : '';
    last = it.kind;
    return head + '<button class="gs-it' + (it.ask ? ' ask' : '') + (i===GS.on ? ' on' : '') + '" data-i="' + i + '" onmousedown="event.preventDefault()" onclick="gsPick(' + i + ')">'
      + (I2[it.icon]||'') + '<span class="gs-t"><span class="ell">' + esc2(it.t) + '</span><span class="gs-s ell">' + esc2(it.s) + '</span></span>'
      + (it.ask ? '<span class="gs-kbd">Enter</span>' : '') + '</button>';
  }).join('');
  p.classList.add('on');
}
function gsClose(){ GS.open = false; gsPaint(); }
function gsPick(i){ const it = GS.items[i]; if(!it) return; const gs = $('#gsearch'); if(gs) gs.value = ''; gsClose(); it.go(); }
(function(){
  const gs = $('#gsearch'); if(!gs) return;
  gs.placeholder = 'Find a page, dataset, person or answer…';
  gs.setAttribute('aria-label', 'Find');
  gs.addEventListener('input', function(){
    const q = gs.value.trim();
    if(q.length < 2){ GS.items = []; gsClose(); return; }
    GS.items = gsBuild(q); GS.on = GS.items.length > 1 ? 0 : 0; GS.open = true; gsPaint();
  });
  gs.addEventListener('focus', function(){ if(gs.value.trim().length >= 2){ GS.items = gsBuild(gs.value.trim()); GS.open = true; gsPaint(); } });
  /* this runs before the boot script's handler on the same element, so it decides first */
  gs.addEventListener('keydown', function(e){
    if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      if(!GS.open) return; e.preventDefault();
      GS.on = (GS.on + (e.key === 'ArrowDown' ? 1 : GS.items.length - 1)) % GS.items.length; gsPaint(); return;
    }
    if(e.key === 'Escape'){ if(GS.open){ e.stopImmediatePropagation(); gsClose(); } return; }
    if(e.key !== 'Enter') return;
    const q = gs.value.trim(); if(!q) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if(!GS.open || !GS.items.length){ GS.items = gsBuild(q); GS.on = GS.items.length - 1; }
    gsPick(GS.on);
  }, true);
  document.addEventListener('click', function(e){ if(!e.target.closest('.topbar .search')) gsClose(); });
})();

/* ---------- B4: the six dialogs, on the wizard ---------- */
const GOV_SHARE = 'Sharing organises, it never widens access. Each viewer opens this and it re-runs as them: their localities, their fields, their numbers.';
const GOV_RUN   = 'Runs as you, re-checked every run. If your access changes, the next run changes with it.';
function wzKV(rows){ return '<div class="kvlist wz-kv">' + rows.map(function(r){ return '<div class="r"><span class="k">' + esc2(r[0]) + '</span><span class="v">' + r[1] + '</span></div>'; }).join('') + '</div>'; }
function wzOpts(list, sel){ return list.map(function(o){ return '<option' + (o===sel ? ' selected' : '') + '>' + esc2(o) + '</option>'; }).join(''); }
function wzSubList(subs, chan){
  return subs.length
    ? '<div class="sublist">' + subs.map(function(s){ return '<div class="subrow"><span class="ava">' + esc2(s.who.split(' ').map(function(w){ return w[0]; }).join('')) + '</span><div style="flex:1;min-width:0"><div class="srn">' + esc2(s.who) + (s.who==='Thato S.' ? ' <span style="color:var(--muted);font-weight:500">(you)</span>' : '') + '</div><div class="srd">' + esc2(s.ch) + (s.cad ? ' · ' + esc2(s.cad) : '') + '</div></div></div>'; }).join('') + '</div>'
    : '<div class="mutedtext" style="font-size:13px">' + esc2(chan) + '</div>';
}

/* Share this answer */
function shareModal(id){
  const a = ANSWERS[id] || {q:id}, link = 'ubt.spiff/a/' + id + '-' + Math.random().toString(36).slice(2,7);
  const teamNames = TEAMS.map(function(t){ return t[0]; });
  wizardOpen({
    title:'Share this answer', intro: esc2(a.q), finish:'Share', width:540,
    data:{ mode:'team', to: teamNames[0], link: link },
    steps:[
      { name:'Who', render:function(d){
          return '<div class="field"><label>Share with</label><select id="sh-mode" onchange="WIZ.data.mode=this.value;wizardPaint()"><option value="team"' + (d.mode==='team'?' selected':'') + '>A team</option><option value="person"' + (d.mode==='person'?' selected':'') + '>A person</option></select></div>'
            + '<div class="field"><label>' + (d.mode==='team' ? 'Team' : 'Person') + '</label><select id="sh-to">' + wzOpts(d.mode==='team' ? teamNames : others, d.to) + '</select></div>'
            + '<div class="wz-note">' + (d.mode==='team' ? 'Sharing to a team puts the answer in that team\'s workspace, where anyone in the team can open it.' : 'Sharing to a person puts the answer in their Inbox as a notice, with the link.') + '</div>'; },
        collect:function(){ return { mode: admVal('sh-mode'), to: admVal('sh-to') }; } },
      { name:'Review', render:function(d){
          return wzKV([['Answer', esc2(a.q)], ['Shared with', esc2(d.to) + ' <span class="mutedtext">(' + (d.mode==='team' ? 'team' : 'person') + ')</span>'], ['Link', '<span class="mono" style="font-size:12.5px">' + esc2(d.link) + '</span> <button class="btn sm" onclick="toast(\'Link copied\')">Copy</button>']])
            + '<div style="margin-top:14px">' + callout('ok', '<b>It stays live.</b> ' + GOV_SHARE, 'shield') + '</div>'; } }
    ],
    onFinish:function(d){
      if(d.mode==='team'){ LIBRARY.unshift({id:id, team:d.to, owner:'Thato S.', oi:'TS', refreshed:'just now', tag:['New','']}); setCount('lib-count', LIBRARY.length); }
      toast(d.mode==='team' ? 'Shared to ' + d.to : 'Shared with ' + d.to);
    }
  });
}

/* Schedule this answer */
function scheduleModal(id){
  const a = ANSWERS[id] || {q:id};
  const FREQ = ['Every day','Every weekday','Every week · Mon','Every month · 1st'], TIME = ['02:00','06:00','07:00','18:00'];
  wizardOpen({
    title:'Schedule this answer', intro: esc2(a.q), finish:'Schedule it', width:540,
    data:{ freq:'Every weekday', time:'06:00', to:'Me' },
    steps:[
      { name:'When', render:function(d){
          return '<div class="g2">' + admSelect('sc-freq','How often', wzOpts(FREQ, d.freq)) + admSelect('sc-time','At', wzOpts(TIME, d.time)) + '</div>'
            + '<div class="wz-note">Times are New Zealand time. The run lands before the working day starts, so the answer is there when you are.</div>'; },
        collect:function(){ return { freq: admVal('sc-freq'), time: admVal('sc-time') }; } },
      { name:'Deliver to', render:function(d){
          return admSelect('sc-to','Deliver to', wzOpts(['Me'].concat(others), d.to))
            + '<div class="wz-note">Each recipient gets their own run. Nobody receives a number they could not have asked for themselves.</div>'; },
        collect:function(){ return { to: admVal('sc-to') }; } },
      { name:'Review', render:function(d){
          return wzKV([['Answer', esc2(a.q)], ['Runs', esc2(d.freq.toLowerCase()) + ' at ' + esc2(d.time)], ['Delivered to', esc2(d.to)], ['Appears in', 'My workspace, under Scheduled']])
            + '<div style="margin-top:14px">' + callout('info', '<b>On a schedule, not on request.</b> ' + GOV_RUN, 'clock') + '</div>'; } }
    ],
    onFinish:function(d){
      const sched = d.freq.replace('Every ','').replace(/^(.)/, function(c){ return c.toUpperCase(); }) + ' · ' + d.time, ex = REPORTS.find(function(r){ return r.id===id; });
      if(ex) ex.sched = sched; else REPORTS.unshift({id:id, name:a.q, saved:'just now', sched:sched});
      setCount('ws-count', REPORTS.length); toast('Scheduled · ' + d.freq.toLowerCase() + ' at ' + d.time);
    }
  });
}

/* Subscribe to this answer */
function subscribeModal(id, turn){
  _subTurn = turn || null;
  const a = ANSWERS[id] || {q:id}, subs = subsFor(id), mine = subs.find(function(s){ return s.who==='Thato S.'; });
  const CH = ['Email','In-app','Dashboard'], CAD = ['Daily · 07:00','Every 30 min','Hourly','Weekly · Mon 07:00'];
  wizardOpen({
    title: mine ? 'Change my subscription' : 'Subscribe to this answer', intro: esc2(a.q), finish: mine ? 'Update my subscription' : 'Subscribe me', width:540,
    data:{ ch: mine ? mine.ch : 'Email', cad: mine ? mine.cad : 'Daily · 07:00' },
    steps:[
      { name:'How', render:function(d){
          return '<div class="field"><label>Who is subscribed</label>' + wzSubList(subs, 'Nobody yet. You would be the first.') + '</div>'
            + '<div class="g2">' + admSelect('su-ch','Deliver to me via', wzOpts(CH, d.ch)) + admSelect('su-cad','How often', wzOpts(CAD, d.cad)) + '</div>'; },
        collect:function(){ return { ch: admVal('su-ch'), cad: admVal('su-cad') }; } },
      { name:'Review', render:function(d){
          return wzKV([['Answer', esc2(a.q)], ['You receive it', 'via ' + esc2(d.ch.toLowerCase()) + ', ' + esc2(d.cad.toLowerCase())], ['Subscribers after this', String(subs.length + (mine ? 0 : 1))]])
            + '<div style="margin-top:14px">' + callout('ok', '<b>Your copy runs as you.</b> Same question, your numbers. It never inherits the author\'s access.', 'shield') + '</div>'; } }
    ],
    onFinish:function(d){
      if(mine){ mine.ch = d.ch; mine.cad = d.cad; } else subs.push({who:'Thato S.', ch:d.ch, cad:d.cad});
      if(_subTurn){ const meta = _subTurn.querySelector('.meta'); if(meta){ const n = subs.length, html = ICON.people + ' ' + n + ' subscribed'; let b = meta.querySelector('[data-subs]'); if(b) b.innerHTML = html; else { const el = document.createElement('span'); el.className = 'badge'; el.setAttribute('data-subs', id); el.title = 'People subscribed — each gets their own re-run, scoped to them'; el.innerHTML = html; meta.insertBefore(el, meta.querySelector('.sp')); } } }
      toast(mine ? 'Subscription updated · ' + d.cad.toLowerCase() : 'Subscribed · ' + d.ch.toLowerCase() + ' ' + d.cad.toLowerCase());
    }
  });
}

/* Pin as a tile */
function dashModal(id){
  const a = ANSWERS[id] || {q:id}, teamNames = TEAMS.map(function(t){ return t[0]; });
  wizardOpen({
    title:'Pin as a tile', intro: esc2(a.q), finish:'Pin tile', width:540,
    data:{ where:'me', refresh:'Every 30 min' },
    steps:[
      { name:'Where', render:function(d){
          return '<div class="field"><label>Pin to</label><select id="pt-where"><option value="me"' + (d.where==='me'?' selected':'') + '>My workspace (personal)</option>' + teamNames.map(function(t){ return '<option value="' + esc2(t) + '"' + (d.where===t?' selected':'') + '>' + esc2(t) + ' (team)</option>'; }).join('') + '</select></div>'
            + admSelect('pt-refresh','Refresh every', wzOpts(CADENCES, d.refresh))
            + '<div class="wz-note">A tile is this answer laid out on a dashboard. Pinning to a team also shares the answer to that team\'s workspace.</div>'; },
        collect:function(){ return { where: admVal('pt-where'), refresh: admVal('pt-refresh') }; } },
      { name:'Review', render:function(d){
          return wzKV([['Answer', esc2(a.q)], ['Pinned to', d.where==='me' ? 'My workspace' : esc2(d.where) + ' <span class="mutedtext">(team dashboard)</span>'], ['Refreshes', esc2(d.refresh.toLowerCase())]])
            + '<div style="margin-top:14px">' + callout('info', '<b>Re-runs scoped to each viewer.</b> ' + GOV_SHARE, 'refresh') + '</div>'; } }
    ],
    onFinish:function(d){
      let dash, where;
      if(d.where==='me'){ dash = personalDash(); where = 'My workspace'; }
      else { dash = ensureTeamDash(d.where); where = d.where; if(!LIBRARY.find(function(l){ return l.id===id && l.team===d.where; })){ LIBRARY.unshift({id:id, team:d.where, owner:'Thato S.', oi:'TS', refreshed:'just now', tag:['New','']}); setCount('lib-count', LIBRARY.length); } }
      const ex = dash.tiles.find(function(t){ return t.id===id; }); if(ex) ex.refresh = d.refresh; else dash.tiles.push({id:id, refresh:d.refresh});
      toast('Pinned to ' + where + ' · refreshes ' + d.refresh.toLowerCase());
    }
  });
}

/* Subscribe to an automation */
function subscribeAutoModal(idx){
  const w = WORKFLOWS[idx]; if(!w) return;
  const subs = autoSubsFor(w), mine = subs.find(function(s){ return s.who==='Thato S.'; });
  wizardOpen({
    title: mine ? 'Change my subscription' : 'Subscribe to this automation', intro: esc2(w.name || 'This automation'), finish: mine ? 'Update' : 'Subscribe me', width:540,
    data:{ ch: mine ? mine.ch : 'Email' },
    steps:[
      { name:'How', render:function(d){
          return callout('info', 'This automation sends alerts, and its recipients do not include you. Subscribing adds you as a recipient of what it already sends. It does not make you an owner: you still cannot edit it or turn it off.')
            + '<div class="field" style="margin-top:14px"><label>Currently subscribed</label>' + wzSubList(subs, 'Nobody has subscribed as a bystander yet.') + '</div>'
            + admSelect('as-ch','Notify me via', wzOpts(['Email','In-app','SMS'], d.ch)); },
        collect:function(){ return { ch: admVal('as-ch') }; } },
      { name:'Review', render:function(d){
          return wzKV([['Automation', esc2(w.name || '')], ['You receive', 'what it already sends, via ' + esc2(d.ch.toLowerCase())], ['You can', 'read what it sends. Not edit it, not stop it.']])
            + '<div style="margin-top:14px">' + callout('ok', '<b>Nothing new is exposed to add you.</b> You only receive what it already sends.', 'shield') + '</div>'; } }
    ],
    onFinish:function(d){
      if(mine) mine.ch = d.ch; else subs.push({who:'Thato S.', ch:d.ch});
      if($('#view-autos').classList.contains('on')) renderAutomations();
      if(typeof FLOW!=='undefined' && FLOW && FLOW.idx===idx) renderFlow();
      toast(mine ? 'Subscription updated · ' + d.ch.toLowerCase() : 'Subscribed · you\'ll get this via ' + d.ch.toLowerCase());
    }
  });
}

/* Share this conversation */
function chatShare(){
  const t = threadById(CHAT_UI.tid);
  const WHO = ['LDM Coordinators — 34 people','Southern Cluster — 88 people','Reneilwe Dlomo only','Anyone with the link, inside UBT'];
  wizardOpen({
    title:'Share this conversation', intro: esc2(t.title), finish:'Share & copy link', width:560,
    data:{ who: WHO[0], sim: PEOPLE[0] ? PEOPLE[0].name : '' },
    steps:[
      { name:'Who', render:function(d){
          return admSelect('cs-who','Who', wzOpts(WHO, d.who))
            + '<div class="field"><label>Preview what someone else would get</label><div class="rowflex" style="gap:8px"><select id="cs-sim" style="flex:1">' + PEOPLE.slice(0,8).map(function(p){ return '<option value="' + esc2(p.name) + '"' + (p.name===d.sim?' selected':'') + '>' + esc2(p.name) + ' — ' + esc2(p.title) + '</option>'; }).join('') + '</select>'
            + '<button class="btn" onclick="startSim($(\'#cs-sim\').value);closeModal()">' + I2.eye + ' Preview as them</button></div></div>'
            + '<div class="wz-note">They get the question, the interpretation and the plan. The numbers are computed again for them.</div>'; },
        collect:function(){ return { who: admVal('cs-who'), sim: admVal('cs-sim') }; } },
      { name:'Review', render:function(d){
          return wzKV([['Conversation', esc2(t.title)], ['Shared with', esc2(d.who)], ['They see', 'the thread, re-run against their own permissions']])
            + '<div style="margin-top:14px">' + callout('ok', '<b>Recipients see this re-run as themselves.</b> A coordinator in the Northern Cluster opens it and sees their four areas, not yours. ' + GOV_SHARE, 'shield') + '</div>'; } }
    ],
    onFinish:function(d){ toast('Link copied. Each recipient\'s copy runs as them.'); }
  });
}

/* ---------- B5: one list, two doors ---------- */
(function(){
  const orig = macRenderApp;
  macRenderApp = function(){
    orig();
    const el = $('#mac-app-body'); if(!el || el.querySelector('.same-queue')) return;
    const n = (typeof macApps==='function') ? macApps().length : 0;
    el.insertAdjacentHTML('afterbegin',
      '<div class="callout info same-queue" style="margin-bottom:14px">' + I2.people
      + '<div><b>These are the same ' + (n===1 ? 'request' : n + ' requests') + ' that wait in your Inbox › Decisions.</b> One list, two doors: decide here or there and both update. The Inbox also carries the other kinds of decision (templates, definitions, rules, budgets); this tab is access only.</div>'
      + '<button class="btn sm" style="flex:none" onclick="INBOX.tab=\'decisions\';INBOX.kind=\'access\';go(\'inbox\')">Open in Inbox</button></div>');
  };
})();
</script>
