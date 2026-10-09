<script>
/* =====================================================================
   Library as the one collection — team filters + list / dashboard layouts
   ---------------------------------------------------------------------
   Team spaces and Dashboards were separate rail entries answering the same
   question: "where do shared answers live?" They are now a FILTER and a
   LAYOUT on the Library. Same objects (LIBRARY, TEAMS, DASHBOARDS), fewer
   nouns. My workspace gets the same layout toggle for personal tiles.
   Old routes (teams, dashes) and old entry points (openTeam, openDash)
   still work — they land on the Library with the right filter/layout.
   ===================================================================== */

const LIB = { team:'all', layout:'list' };   /* Library filter + layout */
const WS  = { layout:'list' };               /* My workspace layout */

const GRID_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/></svg>';
const LIST_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

function teamByName(n){ return TEAMS.find(t=>t[0]===n); }
const nTiles = n => n===1 ? 'tile' : 'tiles';
function personalDash(){
  let d = DASHBOARDS.find(x=>x.type==='personal');
  if(!d){ d={name:'My dashboard',type:'personal',tiles:[]}; DASHBOARDS.unshift(d); }
  return d;
}
/* a team's dashboard starts as its shared answers laid out as tiles */
function ensureTeamDash(team){
  let d = DASHBOARDS.find(x=>x.type==='team'&&x.team===team);
  if(!d){
    const seen={}, tiles=[];
    LIBRARY.filter(l=>l.team===team).forEach(l=>{ if(!seen[l.id]){ seen[l.id]=1; tiles.push({id:l.id,refresh:'Daily · 02:00'}); } });
    d={name:team,type:'team',team:team,tiles:tiles}; DASHBOARDS.push(d);
  }
  return d;
}
function libItems(){
  const q = LIBQ.toLowerCase();
  return LIBRARY.filter(l=>(LIB.team==='all'||l.team===LIB.team)&&(!q||(ANSWERS[l.id].q+' '+l.team+' '+l.owner).toLowerCase().includes(q)));
}
/* ---------------------------------------------------------------------
   The tabs on a workspace page switch the LAYOUT, nothing else. My workspace
   and Team workspace are separate destinations reached from the rail, where
   Workspaces expands to the two of them — they are mutually exclusive, so
   putting them on the page as tabs as well was wrong and is gone.

   List and Dashboard used to sit next to the search box, which made a change
   of layout look like a change of filter. Both workspaces carry them as tabs
   at the top instead, because that is what they are: two views of one
   collection.
   --------------------------------------------------------------------- */
function wsTabBar(layout, layoutFn){
  const lay = (v, ico, label) =>
    '<button class="'+(layout===v?'on':'')+'" onclick="'+layoutFn+'(\''+v+'\')">'+ico+' '+label+'</button>';
  return '<div class="wstabs"><div class="tabs" title="Two views of one collection">'
    + lay('list', LIST_ICO, 'List')
    + lay('dashboard', GRID_ICO, 'Dashboard')
    + '</div></div>';
}

/* The rail group expands and collapses, and never collapses away the page you
   are actually on. */
function navToggleGroup(id){
  const btn = $('#navgrp-'+id), kids = $('#navkids-'+id);
  if(!btn || !kids) return;
  const open = btn.getAttribute('aria-expanded') !== 'true';
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  kids.classList.toggle('shut', !open);
}
function navSyncGroups(){
  ['ws','acc'].forEach(function(id){
    const kids = $('#navkids-'+id), btn = $('#navgrp-'+id);
    if(!kids || !btn) return;
    const holdsActive = !!kids.querySelector('a.active');
    btn.classList.toggle('haschild', holdsActive);
    if(holdsActive){ btn.setAttribute('aria-expanded','true'); kids.classList.remove('shut'); }
  });
}
(function(){
  const _g = window.go;
  window.go = function(view, arg){ const r = _g(view, arg); try{ navSyncGroups(); }catch(e){} return r; };
})();
function layoutSeg(cur, fn){
  return '<div class="seg2 layoutseg" title="How this collection is laid out">'
    + '<button class="'+(cur==='list'?'on':'')+'" onclick="'+fn+'(\'list\')">'+LIST_ICO+' List</button>'
    + '<button class="'+(cur==='dashboard'?'on':'')+'" onclick="'+fn+'(\'dashboard\')">'+GRID_ICO+' Dashboard</button></div>';
}
/* tiles for one dashboard, with working remove buttons */
function dashTilesHTML(d, key){
  if(!d.tiles.length) return '<div class="empty">No tiles here yet. Open an answer and choose <b>Pin as tile</b>.</div>';
  return '<div class="dgrid" data-dash="'+esc(key)+'">'+d.tiles.map((t,ti)=>tileHTML(t,ti)).join('')+'</div>';
}
function bindTileRemove(root, resolve, rerender){
  root.querySelectorAll('.dgrid[data-dash]').forEach(g=>{
    const d = resolve(g.dataset.dash); if(!d) return;
    g.querySelectorAll('.dt-rm').forEach(b=>b.onclick=e=>{ e.stopPropagation(); d.tiles.splice(+b.dataset.ti,1); rerender(); toast('Tile removed — the answer stays in the collection'); });
  });
}

/* ---------- Library ---------- */
function setLibTeam(t){ LIB.team=t; renderLibrary(); }
function setLibLayout(l){ LIB.layout=l; renderLibrary(); }
function renderLibrary(){
  const items = libItems(), t = LIB.team!=='all' ? teamByName(LIB.team) : null;
  const countFor = name => LIBRARY.filter(l=>name==='all'||l.team===name).length;
  const chips = '<div class="libteams">'
    + '<button class="fchip2'+(LIB.team==='all'?' on':'')+'" onclick="setLibTeam(\'all\')">All teams <span class="n">'+countFor('all')+'</span></button>'
    + TEAMS.map(x=>'<button class="fchip2'+(LIB.team===x[0]?' on':'')+'" onclick="setLibTeam(\''+esc(x[0])+'\')"><span class="tdot" style="background:'+x[1]+'"></span>'+esc(x[0])+' <span class="n">'+countFor(x[0])+'</span></button>').join('')
    + '</div>';
  const teamHead = t ? '<div class="teamhero sm"><div class="ti" style="background:'+t[1]+'">'+t[2]+'</div><div><h1>'+esc(t[0])+'</h1><div class="th-d">'+esc(t[5])+'</div><div style="margin-top:6px;display:flex;gap:9px;align-items:center;font-size:12.5px;color:var(--muted);flex-wrap:wrap">'+esc(t[4])+' <span class="scopechip">Context: '+esc(t[6])+'</span></div></div></div>' : '';
  let body = '';
  if(LIB.layout==='list'){
    body = listFrame("lib", {
      items: items, repaint: renderLibrary, noun: "shared answers", noun1: "shared answer", size: 10,
      sorts: [{key:"theme",   label:"By theme",  grouped:true, get:function(l){ return themeOf(l.id)[0]+' '+(ANSWERS[l.id]||{}).q; }},
              {key:"q",       label:"Question",  get:function(l){ return (ANSWERS[l.id]||{}).q||''; }},
              {key:"owner",   label:"Owner",     get:function(l){ return l.owner; }},
              {key:"team",    label:"Team",      get:function(l){ return l.team; }}],
      group: function(l){ const t=themeOf(l.id); return {key:t[0], label:t[0], color:t[1]}; },
      row: libRow,
      emptyTitle: LIBQ ? 'Nothing matches' : 'No shared answers here yet', emptySub: LIBQ ? '' : 'Share an answer to a team and it lands here for everyone in it.', emptyIcon:'people'
    });
  } else if(t){
    body = dashTilesHTML(ensureTeamDash(t[0]), t[0]);
  } else {
    const teams = TEAMS.filter(x=>LIBRARY.some(l=>l.team===x[0]));
    body = teams.map(x=>'<div class="section-h"><span class="tdot" style="background:'+x[1]+'"></span>'+esc(x[0])+' <span class="n">'+ensureTeamDash(x[0]).tiles.length+' '+nTiles(ensureTeamDash(x[0]).tiles.length)+'</span></div>'+dashTilesHTML(ensureTeamDash(x[0]), x[0])).join('')
      || '<div class="empty">No shared answers yet.</div>';
  }
  $('#view-library').innerHTML = '<div class="pagehead"><div><div class="eyebrow">Workspaces</div><h1>Team workspaces</h1><div class="desc">The answers your teams keep. Filter by team, and read any team as a list or laid out as a dashboard. Every answer re-runs scoped to whoever is looking, so sharing one never widens what anybody can see.</div></div></div>'
    + wsTabBar(LIB.layout, 'setLibLayout')
    + '<div class="wsbar"><div class="wsearch"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="lib-search" placeholder="Search the team workspace…" value="'+esc(LIBQ)+'"></div>'
    + (LIB.layout==='list'&&items.length?collapseBtn('#view-library'):'') + '</div>'
    + chips + teamHead + body;
  $('#crumb').innerHTML = t ? 'Team workspaces <span style="opacity:.5">/</span> <b>'+esc(t[0])+'</b>' : '<b>Team workspaces</b>';
  bindTileRemove($('#view-library'), key=>DASHBOARDS.find(x=>x.type==='team'&&x.team===key), renderLibrary);
  const si=$('#lib-search'); si.oninput=e=>{ LIBQ=e.target.value; renderLibrary(); };
  if(LIBQ){ si.focus(); si.setSelectionRange(si.value.length,si.value.length); }
}

/* ---------- My workspace: same layout toggle, personal tiles ---------- */
function setWsLayout(l){ WS.layout=l; renderWorkspace(); }
function renderWorkspace(){
  const q=WSQ.toLowerCase();
  const reps=REPORTS.filter(r=>!q||(r.name+' '+ANSWERS[r.id].q).toLowerCase().includes(q));
  let body;
  if(WS.layout==='list'){
    body = '<div class="section-h">Saved &amp; scheduled answers</div>'
      + listFrame("ws", {
          items: reps, repaint: renderWorkspace, noun: "saved answers", noun1: "saved answer", size: 10,
          sorts: [{key:"theme", label:"By theme",        grouped:true, get:function(r){ return themeOf(r.id)[0]+' '+r.name; }},
                  {key:"name",  label:"Name",            get:function(r){ return r.name; }},
                  {key:"sched", label:"Scheduled first", get:function(r){ return r.sched ? 0 : 1; }}],
          group: function(r){ const t=themeOf(r.id); return {key:t[0], label:t[0], color:t[1]}; },
          row: reportRow,
          emptyTitle: WSQ ? 'No saved answer matches' : 'Nothing saved yet', emptySub: WSQ ? '' : 'Save an answer and it lands here, with its schedule if it has one.', emptyIcon:'file'
        });
  } else {
    const d = personalDash();
    body = '<div class="section-h">My dashboard <span class="n">'+d.tiles.length+' '+nTiles(d.tiles.length)+'</span></div>' + dashTilesHTML(d,'me');
  }
  $('#view-workspace').innerHTML='<div class="pagehead"><div><div class="eyebrow">Workspaces</div><h1>My workspace</h1><div class="desc">The answers you keep — saved and scheduled, grouped by theme, or laid out as your own dashboard. Your chat history lives in the drawer on the right.</div></div></div>'
    + wsTabBar(WS.layout, 'setWsLayout')
    +'<div class="wsbar"><div class="wsearch"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input id="ws-search" placeholder="Search your saved answers…" value="'+esc(WSQ)+'"></div>'
    + (WS.layout==='list'&&reps.length?collapseBtn('#view-workspace'):'') + '</div>'
    + body;
  $('#crumb').innerHTML = '<b>My workspace</b>';
  bindTileRemove($('#view-workspace'), ()=>personalDash(), renderWorkspace);
  const si=$('#ws-search'); si.oninput=e=>{ WSQ=e.target.value; renderWorkspace(); };
  if(WSQ){ si.focus(); si.setSelectionRange(si.value.length,si.value.length); }
}

/* ---------- Pin as tile (replaces "Add to a dashboard") ---------- */
function dashModal(id){
  const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Pin as a tile</h3><div class="msub">A tile is this answer laid out on a dashboard — it refreshes on a cadence and re-runs scoped to each viewer.</div>'
    +'<div class="field"><label>Pin to</label><select id="dash-sel"><option value="me">My workspace (personal)</option>'+TEAMS.map(t=>'<option value="'+esc(t[0])+'">'+esc(t[0])+' (team)</option>').join('')+'</select></div>'
    +'<div class="field"><label>Refresh every</label><select id="dash-refresh">'+CADENCES.map(c=>'<option'+(c==='Every 30 min'?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select></div>'
    +'<div class="sharenote" style="background:var(--accent-soft);color:var(--accent)">↻ Pinning to a team also shares the answer to that team\'s collection. Sharing organises, it never widens access.</div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="doAddDash(\''+id+'\')">Pin tile</button></div></div>';
  m.classList.add('on');
}
function doAddDash(id){
  const sel=$('#dash-sel').value, refresh=$('#dash-refresh').value;
  let d, where;
  if(sel==='me'){ d=personalDash(); where='My workspace'; }
  else{
    d=ensureTeamDash(sel); where=sel;
    if(!LIBRARY.find(l=>l.id===id&&l.team===sel)){ LIBRARY.unshift({id,team:sel,owner:"Thato S.",oi:"TS",refreshed:"just now",tag:["New",""]}); const c=$('#lib-count'); if(c)c.textContent=LIBRARY.length; }
  }
  const ex=d.tiles.find(t=>t.id===id); if(ex) ex.refresh=refresh; else d.tiles.push({id,refresh});
  closeModal(); toast('Pinned to '+where+' · refreshes '+refresh.toLowerCase());
}

/* ---------- compatibility: old screens land on the collection ---------- */
function openTeam(name){ LIB.team = teamByName(name)?name:'all'; LIB.layout='list'; go('library'); }
function openDash(idx){
  const d=DASHBOARDS[idx]; if(!d) return go('library');
  if(d.type==='personal'){ WS.layout='dashboard'; go('workspace'); }
  else { LIB.team=d.team; LIB.layout='dashboard'; go('library'); }
}
function renderTeams(){ LIB.layout='list'; go('library'); }
function renderDashes(){ LIB.layout='dashboard'; go('library'); }
(function(){
  const _go = window.go;
  window.go = function(view, arg){
    if(view==='teams'){ LIB.layout='list'; view='library'; }
    else if(view==='dashes'){ LIB.layout='dashboard'; view='library'; }
    return _go(view, arg);
  };
})();
</script>
