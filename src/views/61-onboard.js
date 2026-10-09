<script>
/* =====================================================================
   SPIFF v2 — registration & first-run onboarding
   A full-screen overlay above the app (#onboard), not a routed view.
   Seven screens: sign in · confirm identity · role · localities · datasets ·
   first question · follow one thing. Every choice is remembered in ONB
   and changes what the later screens say.

   Scope is a set of LOCALITIES, matching the real systems: your Directory
   record pins you to one home locality, and role domains widen that to the
   localities you actually cover.
   ===================================================================== */

let ONB = {
  on:false, step:0, signedIn:false, explain:false,
  role:null, localities:ME.localities.slice(), locality:ME.locality,
  q:"", asked:null, stage:0, free:"", freeDs:"meetings",
  follows:["att"], cadence:"Every Monday, 07:00", channel:"Email",
  seq:0
};

const ONB_STEPS = ["Sign in","Who you are","Your role","Your localities","Your data","First question","Follow"];

/* subdivisions and members per locality — the division has 312 localities in
   total; these are the ones a person can be assigned in this mockup. */
const ONB_LOC = {
  "Bellville":[6,1106], "Parow":[4,842], "Somerset West":[5,913], "Durbanville":[4,777],
  "Gqeberha North":[7,1284], "East London":[5,968], "Mthatha Central":[6,1042],
  "Bloemfontein Central":[5,889], "Welkom":[3,604], "Sandton":[8,1461], "Pretoria East":[7,1298],
  "Benoni":[5,932], "Pinetown":[6,1077], "Umhlanga":[4,801], "Ballito":[3,588],
  "Polokwane Central":[5,874], "Tzaneen":[4,713], "Nelspruit":[5,906], "Witbank":[4,769],
  "Rustenburg":[5,881], "Klerksdorp":[4,736], "Kimberley":[4,692], "Upington":[3,547],
  "Windhoek":[6,1018], "Gaborone":[5,864], "Harare":[6,1131]
};

/* which datasets each role bundle already holds. Everything else is requestable;
   "care" is blocked for everyone; "checkins" is retired and counted separately. */
const ONB_HOLDS = {
  viewer:    ["meetings","localities","events","growth","appointments","properties"],
  secretary: ["meetings","members","localities","families","events","registrations","growth","appointments","properties"],
  author:    ["meetings","members","localities","families","events","registrations","growth","appointments","properties","comms"],
  steward:   ["meetings","members","localities","families","events","registrations","growth","appointments","properties","comms","budgets"],
  regional:  ["meetings","members","localities","families","events","registrations","growth","appointments","properties","travel","itineraries"]
};
const ONB_ROLE_IDS = ["viewer","secretary","author","steward","regional"];
const ONB_ROLE_ICON = {viewer:"eye", secretary:"file", author:"pencil", steward:"shield", regional:"people"};

/* the suggested first questions — a small pool, three offered per role */
const ONB_ASKS = [
  {q:"Attendance rate by locality, this year vs last", shape:"chart", ds:"meetings", tk:[["m","Attendance rate"],["a","by locality"],["f","this year vs last"]],
   res:{big:"78.4%", sub:"across 154 localities, up 2.1 points on last year", trend:[71,72,74,73,75,76,74,77,78,77,79,78],
        rows:[["Stellenbosch","81.2%"],["Pietermaritzburg","79.0%"],["Makhanda","74.6%"]]}},
  {q:"Member growth by locality this year", shape:"chart", ds:"growth", tk:[["m","Net movement"],["a","by locality"],["f","2026 to date"]],
   res:{big:"+3 180", sub:"net members added across your localities", trend:[210,260,240,300,290,340,310,360,330,380,400,370],
        rows:[["Stellenbosch","+1 240"],["Pietermaritzburg","+980"],["Pretoria","excluded — not your locality"]]}},
  {q:"Which localities have no secretary appointed?", shape:"table", ds:"appointments", tk:[["a","Localities"],["f","no active secretary"],["f","your localities"]],
   res:{big:"7", sub:"localities with a vacant secretary post",
        rows:[["Kokstad · Pietermaritzburg","vacant 41 days"],["Graaff-Reinet · Makhanda","vacant 22 days"],["Bethlehem · Bloemfontein","vacant 9 days"]]}},
  {q:"Which localities are overdue for a review?", shape:"table", ds:"localities", tk:[["a","Localities"],["m","Days since review"],["f","over 365"]],
   res:{big:"12", sub:"localities past their review date",
        rows:[["Mthatha · Makhanda","488 days"],["Welkom · Bloemfontein","402 days"],["Vredenburg · Stellenbosch","379 days"]]}},
  {q:"No-show rate by event type", shape:"chart", ds:"registrations", tk:[["m","No-show rate"],["a","by event type"],["f","last 6 months"]],
   res:{big:"11.3%", sub:"of registrations did not check in", trend:[14,13,13,12,12,11,12,11,11,10,11,11],
        rows:[["Youth programme","16.8%"],["Divisional gathering","9.1%"],["Locality meeting","7.4%"]]}},
  {q:"Show me the profile of my own locality", shape:"profile", ds:"members", tk:[["a","Locality"],["f","Rondebosch"],["m","Members, households, meetings"]],
   res:{big:"1 106", sub:"members in Rondebosch · Stellenbosch",
        rows:[["Households","318"],["Meetings held this year","46"],["Average attendance","81.7%"],["Secretary","Martinus Viljoen (suspended)"]]}},
  {q:"Travel spend by locality this quarter", shape:"chart", ds:"travel", tk:[["m","Travel spend"],["a","by locality"],["f","this quarter"]],
   res:{big:"NZ$ 418,000", sub:"booked through Orbit, within your localities", trend:[280,310,290,340,360,330,380,410,390,420,405,418],
        rows:[["Stellenbosch","NZ$ 161,000"],["Pietermaritzburg","NZ$ 114,000"],["Pretoria","excluded — not your locality"]]}},
  {q:"Which datasets I own failed a quality check this week?", shape:"table", ds:"meetings", tk:[["a","Datasets I own"],["m","Quality score"],["f","failed this week"]],
   res:{big:"2", sub:"of the 6 datasets you steward",
        rows:[["Travel bookings","Supplier feed late 3×"],["Notices & delivery","Completeness 91.4%"],["Meetings & attendance","Passed"]]}},
  {q:"Which localities missed two meetings in a row?", shape:"table", ds:"meetings", tk:[["a","Localities"],["f","2 consecutive misses"],["f","last 90 days"]],
   res:{big:"5", sub:"localities with a two-meeting gap",
        rows:[["Ladysmith · Pietermaritzburg","14 & 21 Jul"],["Knysna · Stellenbosch","4 & 11 Aug"],["Springbok · Kimberley","not your locality"]]}}
];
const ONB_ASK_FOR = {viewer:[0,1,3], secretary:[0,2,5], author:[1,4,8], steward:[7,3,0], regional:[0,6,8]};

const ONB_FOLLOWS = [
  {id:"att",   n:"Attendance rate in my localities",       s:"Tell me when it moves more than 2 points"},
  {id:"vac",   n:"Localities with no secretary",        s:"Tell me when a post falls vacant or is filled"},
  {id:"growth",n:"Net member movement, month on month", s:"Tell me the number every month, whatever it is"}
];

/* ---------- small helpers ---------- */
function onbIco(n,px){ const s=I2[n]||I2.info; return s.replace('<svg ','<svg width="'+(px||16)+'" height="'+(px||16)+'" '); }
function onbRole(){ return ONB.role || "secretary"; }
function onbRoleObj(){ return roleById(onbRole()) || ROLES[1]; }
function onbLocalityStats(){
  let sub=0, mem=0;
  ONB.localities.forEach(r=>{ const x=ONB_LOC[r]; if(x){ sub+=x[0]; mem+=x[1]; } });
  return {sub:sub, mem:mem};
}
function onbCountries(){
  const seen=[];
  ONB.localities.forEach(l=>{ const c=countryOf(l); if(seen.indexOf(c)<0) seen.push(c); });
  return seen;
}
function onbScopeSentence(){
  if(!ONB.localities.length) return '<b>No localities selected.</b> Spiff would have nothing to show you — pick at least one.';
  const st = onbLocalityStats(), cs = onbCountries();
  return 'You’ll see meetings, members and events for <b>'+ONB.localities.length+' of '+fmt(ORG.localityCount)+' localities</b> — '
    + st.sub+' subdivisions, about '+fmt(Math.round(st.mem/100)*100)+' members'
    + (cs.length>1 ? ' across '+cs.length+' countries' : ' in '+esc(cs[0]))+'.';
}
function onbState(d){
  if(d.cert==='blocked') return 'blocked';
  if(d.cert==='deprecated') return 'retired';
  return (ONB_HOLDS[onbRole()]||[]).indexOf(d.id)>=0 ? 'ready' : 'request';
}
function onbCounts(){
  const c={ready:0,request:0,blocked:0,retired:0,personal:0};
  DATASETS.forEach(d=>{ const s=onbState(d); c[s]++; if(s==='ready'&&d.sens==='Personal') c.personal++; });
  return c;
}
function onbLevel(d){
  const s = onbState(d), r = onbRole();
  if(s==='blocked')  return 'Not loaded into Spiff at all. Nobody can query it, and it cannot be requested.';
  if(s==='retired')  return 'Retired on 14 Jun 2026. Read-only until 31 Dec — ask ' + esc(ds('meetings').name) + ' instead.';
  if(s==='request')  return 'Not in the ' + esc(onbRoleObj().name) + ' bundle. ' + esc(d.owner) + ' owns it and decides.';
  if(d.sens==='Personal' && (r==='viewer'||r==='secretary')) return 'Rows for your localities. Names and contact details masked outside your own subdivision.';
  if(d.sens==='Personal') return 'Rows for your localities, with names visible inside them. Every read is logged.';
  if(d.sens==='Restricted') return 'Rows for your localities, within 30 days either side of travel.';
  if(d.id==='growth') return 'Aggregate rows only. This dataset holds no person-level detail by design.';
  return 'Every row for your ' + ONB.localities.length + ' localities. No masking applies to you.';
}

/* ---------- overlay lifecycle ---------- */
function startOnboarding(step){
  ONB.on = true;
  ONB.step = Math.max(0, Math.min(6, step==null ? 0 : step));
  if(ONB.step >= 2 && !ONB.role) ONB.role = 'secretary';
  const m=$('#modal'), t=$('#toast');
  if(m) m.style.zIndex = 120;                       /* modals and toasts must clear the overlay */
  if(t) t.style.zIndex = 130;
  $('#onboard').classList.add('on');
  onboardRender();
}
function closeOnboarding(){
  ONB.on = false; ONB.seq++;
  $('#onboard').classList.remove('on');
  $('#onboard').innerHTML = '';
}
function onboardNext(){
  if(ONB.step===2 && !ONB.role){ toast('Pick what you do first — it decides everything after this'); return; }
  if(ONB.step===3 && !ONB.localities.length){ toast('Pick at least one area'); return; }
  if(ONB.step>=6){ onbFinish(); return; }
  ONB.step++; ONB.asked=null; ONB.stage=0; onboardRender();
  $('#onboard').scrollTop = 0;
}
function onboardBack(){ if(ONB.step>0){ ONB.step--; onboardRender(); $('#onboard').scrollTop=0; } }
function onboardSkip(){
  closeOnboarding();
  toast('Set-up skipped. Spiff still runs as you — pick it up from Home whenever you like.');
  go('home');
}
function onboardEsc(e){
  if(e.key!=='Escape') return;
  const m=$('#modal');
  if(m && m.classList.contains('on')){ closeModal(); return; }
  if(ONB.on){ closeOnboarding(); toast('Set-up closed. Nothing was lost — reopen it from Home.'); }
}
document.addEventListener('keydown', onboardEsc);

function onboardRender(){
  const el=$('#onboard'); if(!el) return;
  const steps=[onbStep0,onbStep1,onbStep2,onbStep3,onbStep4,onbStep5,onbStep6];
  el.innerHTML = '<div class="ovl-in">'+onbProgress()+steps[ONB.step]()+'</div>';
}
function onbProgress(){
  return '<div class="steps">'+ONB_STEPS.map((s,i)=>
      '<div class="st '+(i<ONB.step?'done':i===ONB.step?'on':'')+'"><div class="sc">'+(i+1)+'</div><div class="sn2">'+esc(s)+'</div></div>'
    + (i<ONB_STEPS.length-1?'<div class="bar"></div>':'')).join('')+'</div>';
}
function onbNav(label, ok, extra){
  return '<div class="hairline"></div><div class="rowflex">'
    + (ONB.step>0 ? '<button class="btn" onclick="onboardBack()">'+onbIco('back',15)+' Back</button>'
                  : '<button class="btn ghost" onclick="closeOnboarding()">Close</button>')
    + (extra||'') + '<div class="sp"></div>'
    + '<button class="btn ghost" onclick="onboardSkip()">Skip set-up</button>'
    + '<button class="btn pri"'+(ok?'':' disabled style="opacity:.42;cursor:not-allowed"')+' onclick="onboardNext()">'+esc(label)+' '+onbIco('chev',15)+'</button>'
    + '</div>';
}

/* ---------- 0 · welcome and sign in ---------- */
function onbStep0(){
  return '<div class="hero-mark">'+I2.spark+'</div>'
    + '<h1 style="font-size:34px;margin-bottom:10px">Welcome to Spiff</h1>'
    + '<div style="font-size:16.5px;color:var(--muted);line-height:1.6;max-width:60ch">Spiff answers questions about '+esc(ORG.name)+' — meetings, members, events, travel — in plain language, and only ever within what you are already allowed to see.</div>'
    + '<div style="font-family:var(--dsp);font-size:20px;font-weight:600;margin:22px 0 18px">You won’t build a report. You’ll ask a question.</div>'
    + '<button class="btn pri" style="padding:12px 20px;font-size:15px" onclick="onbSignIn()">'+onbIco('shield',17)+' Sign in with your UBT account</button>'
    + '<div class="mutedtext" style="margin:14px 0 22px;max-width:62ch">Single sign-on, no password field. Spiff never holds a credential of its own — it borrows your UBT identity, and checks it again every time you ask something. Revoke your account and Spiff goes with it, in the same second.</div>'
    + callout('mut','<b>'+ORG.users+' people across GST use Spiff.</b> '+ORG.activeThisWeek+' of them asked something this week.','people')
    + '<div class="hairline"></div>'
    + '<div class="rowflex"><button class="btn ghost" onclick="onboardSkip()">Just let me look around</button><div class="sp"></div>'
    + '<button class="btn" onclick="onbSignIn()">Continue '+onbIco('chev',15)+'</button></div>';
}
function onbSignIn(){
  ONB.signedIn = true;
  toast('Signed in as '+ME.full+' — Spiff is now running as you');
  ONB.step = 1; onboardRender();
}

/* ---------- 1 · confirm who you are, and what every system says you do ---------- */
/* Oren, 16 Sep 2026: Directory will not know which team a member is allocated
   to. Spiff has to search the member in every system we have; a member can
   hold different roles in different systems. So the step has two cards: who
   you are (Directory, read-only) and what you do (one row per system that
   knows you). Spiff never merges the roles into one. */
function onbStep1(){
  const facts=[["Name",ME.full],["Email",ME.email],
               ["Home area",ME.localities[ME.localities.length-1]],["Manager",ME.manager],["In Directory since",ME.joined]];
  const searched = ME.searched.map(sysById), found = ME.found;
  const rows = found.map(function(f){
    const s = sysById(f.sys);
    return '<div class="fnd-row"><span class="fnd-dot" style="background:'+s.color+'"></span>'
      + '<div class="fnd-sys">'+esc(s.name)+'</div>'
      + '<div class="fnd-main"><div class="fnd-role">'+esc(f.role)+'</div><div class="fnd-scope">'+esc(f.scope)+'</div></div>'
      + '<div class="fnd-note">'+esc(f.note)+'</div>'
      + '<div class="fnd-since mono">since '+esc(f.since)+'</div></div>';
  }).join('');
  const notIn = searched.filter(function(s){ return !found.some(function(f){ return f.sys===s.id; }); });
  return '<h1 style="font-size:28px;margin-bottom:8px">This is you</h1>'
    + '<div class="mutedtext" style="margin-bottom:20px;max-width:66ch">Directory knows <b>who</b> you are. It does not know <b>what you do</b>: no single system holds a person\'s team. So Spiff looked for you in every system it is connected to, and below is what each one says. It keeps no copy; it looks again on every question you ask.</div>'
    + panel('From Directory','<div class="kvlist">'+facts.map(f=>'<div class="r"><div class="k">'+esc(f[0])+'</div><div class="v">'+esc(f[1])+'</div></div>').join('')+'</div>',
        {icon:'people', sub:'who you are · read-only', act:'<button class="btn sm ghost" onclick="onbNotYou()">Not you?</button>'})
    + panel('Found in '+searched.length+' systems',
        '<div class="fnd-list">'+rows+'</div>'
        + (notIn.length ? '<div class="mutedtext" style="font-size:12.5px;margin-top:10px">'+esc(notIn.map(function(s){ return s.name; }).join(', '))+(notIn.length===1?' has':' have')+' never heard of you. Spiff shows nothing from '+(notIn.length===1?'it':'them')+'.</div>' : '')
        + '<div style="margin-top:12px">'+callout('mut','<b>A member can hold different roles in different systems.</b> Spiff keeps them apart: a travel question runs with your Orbit role, an event question with your Assemble role, a member question with what Directory and Connect allow. Nothing here is granted by Spiff. A role you are missing is granted in that system, and Spiff sees it the next time it looks.','info')+'</div>',
        {icon:'search', sub:'what you do · searched just now · '+found.length+' roles', act:'<button class="btn sm ghost" onclick="toast(\'Searched again: '+searched.length+' systems, '+found.length+' roles — nothing changed\')">'+onbIco('refresh',14)+' Search again</button>'})
    + callout('ok','<b>Spiff will run every question as you.</b> It can never see more than your UBT account can in each of these systems — not for you, not for anyone you share an answer with.','shield')
    + '<button class="btn sm ghost" style="margin:10px 0 0" onclick="onbExplain()">'+onbIco('info',15)+' What does that mean?</button>'
    + (ONB.explain ? '<div style="margin-top:10px">'+callout('mut',
        'Spiff holds no data of its own. When you ask something, it opens Directory, Connect, Assemble and Orbit using your identity, so the same row filters and masking rules that apply to you in those systems apply here.<br><br>'
      + 'When you share an answer, the person opening it runs the query again as themselves. They see their numbers, not yours — sharing organises, it never widens access.<br><br>'
      + 'When you share an automation, they get their own copy, running as them. If your access changes on Monday, every answer you own changes on Monday too.','info')+'</div>' : '')
    + onbNav('Yes, that’s me', true);
}
function onbNotYou(){ toast('Directory owns this record — HR corrects it there, and Spiff picks it up the next morning'); }
function onbExplain(){ ONB.explain = !ONB.explain; onboardRender(); }

/* ---------- 2 · what do you do ---------- */
function onbStep2(){
  const cards = ONB_ROLE_IDS.map(id=>{
    const r = roleById(id);
    return '<div class="pickcard'+(ONB.role===id?' on':'')+'" onclick="onbPickRole(\''+id+'\')">'
      + '<div class="pi">'+onbIco(ONB_ROLE_ICON[id],18)+'</div><div style="min-width:0">'
      + '<div class="pn2">'+esc(r.name)+'</div><div class="pd2">'+esc(r.desc)+'</div>'
      + '<div class="rowflex" style="margin-top:9px;gap:5px">'+r.privs.map(p=>bdg(p,'mut')).join('')+'</div>'
      + '<div class="pd2" style="margin-top:8px">'+r.members+' people hold this today · risk '+esc(r.risk)+'</div></div></div>';
  }).join('');
  return '<h1 style="font-size:28px;margin-bottom:8px">What do you do?</h1>'
    + '<div class="mutedtext" style="margin-bottom:20px;max-width:62ch">Pick the one that matches your work. Access at UBT is granted in bundles, never table by table — so this single choice decides which datasets you can ask about, and what detail comes back.</div>'
    + '<div class="g2">'+cards+'</div>'
    + '<div style="margin-top:18px">'+callout('warn','<b>This is a request, not a switch.</b> '+esc(ME.manager)+' confirms it before it takes effect, and sees exactly what it would unlock. Until then you have Reader access, which is enough to look around.','info')+'</div>'
    + onbNav('Continue', !!ONB.role);
}
function onbPickRole(id){
  ONB.role = id; ONB.asked = null;
  onboardRender();
  toast('Requested: '+ (roleById(id)||{}).name + ' — ' + onbCounts().ready + ' datasets would open up');
}

/* ---------- 3 · where do you work ---------- */
/* At 312 localities this was a wall of tiles on a new joiner's first screen.
   The picker now filters, and shows the ones already chosen plus the first
   handful — never the whole estate at once. */
const ONB_CHIP_CAP = 12;
function onbLocFilter(v){ ONB.locQ = v; onbSyncLocalities(); }
function onbVisibleLocalities(){
  const q = (ONB.locQ||"").trim().toLowerCase();
  const chosen = ORG.localities.filter(l => ONB.localities.indexOf(l) >= 0);
  const rest   = ORG.localities.filter(l => ONB.localities.indexOf(l) < 0);
  if(q) return ORG.localities.filter(l => l.toLowerCase().indexOf(q) >= 0);
  return chosen.concat(rest.slice(0, Math.max(0, ONB_CHIP_CAP - chosen.length)));
}
function onbChipsHTML(){
  const vis = onbVisibleLocalities();
  const q = (ONB.locQ||"").trim();
  if(!vis.length) return '<div class="mutedtext" style="padding:6px 2px">No locality matches “'+esc(q)+'”.</div>';
  const hidden = ORG.localities.length - vis.length;
  return vis.map(r=>{
    const i = ORG.localities.indexOf(r), x = ONB_LOC[r] || [0,0];
    return '<button class="fchip2'+(ONB.localities.indexOf(r)>=0?' on':'')+'" data-i="'+i+'" onclick="onbToggleLocality('+i+')">'
      + esc(r)+' <span class="mono" style="opacity:.65">'+x[0]+'</span></button>';
  }).join('')
  + (hidden>0 ? '<span class="mutedtext" style="align-self:center;font-size:12.5px">and '+fmt(hidden)+' more — type to find one</span>' : '');
}
function onbStep3(){
  const chips = onbChipsHTML();
  return '<h1 style="font-size:28px;margin-bottom:8px">Where do you work?</h1>'
    + '<div class="mutedtext" style="margin-bottom:20px;max-width:62ch">Pre-filled from your Directory record. Widen it if your work genuinely spans more — every locality you add is one your approver has to justify. If it spans whole countries, ask for a Country Coordinator bundle instead of listing localities one by one.</div>'
    + panel('Localities you cover',
        '<div class="bigsearch" style="margin-bottom:12px">'+I2.search
      +   '<input value="'+esc(ONB.locQ||"")+'" oninput="onbLocFilter(this.value)"'
      +   ' placeholder="Find a locality among '+fmt(ORG.localityCount)+'…"></div>'
      + '<div class="chipbar" id="onb-localities">'+chips+'</div>'
        + '<div class="rowflex" style="margin-top:12px"><button class="btn sm ghost" onclick="onbAllLocalities()">Select all</button>'
        + '<button class="btn sm ghost" onclick="onbMyLocalities()">Reset to Directory</button></div>',
        {icon:'grid', sub:'multi-select · number shown is subdivisions in that locality'})
    + panel('Home locality','<div class="field" style="margin:0"><label>Your own locality — the one your Directory record pins you to</label>'
        + '<select onchange="onbSetLocality(this.value)">'+ONB.localities.map(l=>'<option'+(l===ONB.locality?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select></div>'
        + '<div class="mutedtext" style="margin-top:10px">Personal fields resolve in full inside your own subdivision here. Everywhere else, including the rest of your localities, they come back masked.</div>',{icon:'home'})
    + '<div id="onb-sum">'+callout('info',onbScopeSentence(),'eye')+'</div>'
    + onbNav('Continue', ONB.localities.length>0);
}
function onbToggleLocality(i){
  const r = ORG.localities[i], at = ONB.localities.indexOf(r);
  if(at>=0) ONB.localities.splice(at,1); else ONB.localities.push(r);
  onbSyncLocalities();
}
function onbAllLocalities(){ ONB.localities = ORG.localities.slice(); onbSyncLocalities(); toast('Every locality in the picker — your approver will ask why'); }
function onbMyLocalities(){ ONB.localities = ME.localities.slice(); onbSyncLocalities(); }
function onbSetLocality(v){ ONB.locality = v; toast('Full detail in '+v+', masked everywhere else'); }
function onbSyncLocalities(){
  const wrap=$('#onb-localities'); if(!wrap) return;
  wrap.innerHTML = onbChipsHTML();            /* the visible set depends on what is chosen */
  $('#onb-sum').innerHTML = callout('info', onbScopeSentence(), 'eye');
}

/* ---------- 4 · what you can ask about ---------- */
function onbStep4(){
  return '<h1 style="font-size:28px;margin-bottom:8px">What you can ask about</h1>'
    + '<div class="mutedtext" style="margin-bottom:18px;max-width:62ch">These are the datasets a '+esc(onbRoleObj().name)+' in your localities can reach. You do not need to remember them — Spiff picks the right one from your question. This is here so you know what exists, and what does not.</div>'
    + '<div class="bigsearch" style="margin-bottom:12px">'+I2.search
      + '<input id="onb-q" value="'+esc(ONB.q)+'" oninput="onbFilterData(this.value)" placeholder="Search datasets — try travel, attendance, members…"></div>'
    + '<div id="onb-count">'+onbCountLine()+'</div>'
    + '<div id="onb-ds" style="margin-top:14px">'+onbDsList()+'</div>'
    + '<div class="hairline"></div>'
    + '<div class="rowflex"><button class="btn sm ghost" onclick="onbToCatalog()">'+onbIco('db',15)+' Browse the full catalogue</button>'
    + '<span class="mutedtext">Definitions, owners, quality and lineage for all '+DATASETS.length+' datasets.</span></div>'
    + onbNav('Continue', true);
}
function onbCountLine(){
  const c = onbCounts();
  const showing = ONB.q ? ' <span class="mutedtext">· showing '+onbMatches().length+' for “'+esc(ONB.q)+'”</span>' : '';
  return '<div class="rowflex" style="gap:8px">'+bdg(c.ready+' datasets ready','ok','check')
    + bdg(c.request+' you can request','warn','unlock')
    + bdg(c.blocked+' blocked for everyone','crit','lock')
    + bdg(c.retired+' retired','mut','archive')+showing+'</div>';
}
function onbMatches(){
  const q = ONB.q.trim().toLowerCase();
  if(!q) return DATASETS;
  return DATASETS.filter(d=>(d.name+' '+d.purpose+' '+d.domain+' '+d.questions.join(' ')).toLowerCase().indexOf(q)>=0);
}
function onbFilterData(v){
  ONB.q = v;
  $('#onb-ds').innerHTML = onbDsList();
  $('#onb-count').innerHTML = onbCountLine();
}
function onbDsList(){
  const rank = {ready:0, request:1, retired:2, blocked:3};
  const list = onbMatches().slice().sort((a,b)=> (rank[onbState(a)]-rank[onbState(b)]) || (b.popularity-a.popularity));
  if(!list.length) return emptyState('Nothing matches “'+ONB.q+'”','Try a plainer word — Spiff searches purposes and example questions too, not just names.');
  return '<div class="stack">'+list.map(onbDsCard).join('')+'</div>';
}
function onbDsCard(d){
  const s = onbState(d), ok = s==='ready';
  const head = '<div class="rowflex" style="gap:9px">'
    + '<span style="font-family:var(--dsp);font-weight:600;font-size:15px'+(ok?'':';color:var(--muted)')+'">'+esc(d.name)+'</span>'
    + (ok ? bdg('Ready','ok','check') : s==='request' ? bdg('Request it','warn','lock') : s==='blocked' ? bdg('Blocked','crit','lock') : bdg('Retired','mut','archive'))
    + sensBadge(d.sens) + '<div class="sp"></div><span class="mutedtext mono">'+esc(d.rows)+' rows</span></div>';
  const body = '<div class="mutedtext" style="margin:7px 0 9px">'+esc(d.purpose)+'</div>'
    + '<div style="font-size:12.5px;margin-bottom:'+(ok?'10px':'0')+'"><b>What you get:</b> '+onbLevel(d)+'</div>'
    + (ok && d.questions.length
        ? '<div class="stack" style="gap:5px">'+d.questions.slice(0,2).map((q,i)=>
            '<div class="lrow" style="padding:7px 0;border:none" onclick="onbAskFromCatalog(\''+d.id+'\','+i+')"><div class="li">'+onbIco('msg',15)+'</div>'
            + '<div class="lm"><div class="lt" style="font-weight:500">'+esc(q)+'</div></div>'
            + '<div class="lr">'+onbIco('chev',14)+'</div></div>').join('')+'</div>'
        : '')
    + (s==='request' ? '<div class="rowflex" style="margin-top:10px"><button class="btn sm" onclick="onbRequest(\''+d.id+'\')">'+onbIco('unlock',14)+' Request when you need it</button>'
        + '<span class="mutedtext">'+esc(d.owner)+' answers these, usually within two working days.</span></div>' : '')
    + (s==='blocked' ? '<div style="margin-top:10px">'+callout('crit','Blocked by policy, rule <span class="mono">r-pastoral-block</span>. Not overridable, not requestable, and not loaded — there is nothing behind this card to release.','lock')+'</div>' : '')
    + (d.warning ? '<div style="margin-top:10px">'+callout('warn',esc(d.warning),'warn')+'</div>' : '');
  return '<div class="panel"><div class="panel-b'+(ok?'':' tight')+'" style="'+(ok?'':'opacity:.78')+'">'+head+body+'</div></div>';
}
function onbRequest(id){
  const d = ds(id);
  if(typeof requestAccessModal === 'function'){ requestAccessModal(id); return; }
  toast('Request sent to '+d.owner+' — '+d.name+'. You will be told either way.');
}
function onbAskFromCatalog(id,i){
  const d = ds(id);
  ONB.step=5; ONB.asked=-1; ONB.free=d.questions[i]; ONB.freeDs=id; ONB.stage=0;
  onboardRender(); onbTick();
  toast('Carried over from '+d.name+' — watch it run as you');
}
function onbToCatalog(){
  closeOnboarding();
  toast('Your set-up is saved — pick it up again from Home');
  go('catalog');
}

/* ---------- 5 · ask your first question ---------- */
function onbStep5(){
  const idx = ONB_ASK_FOR[onbRole()] || ONB_ASK_FOR.secretary;
  const cards = idx.map((n,i)=>{
    const a = ONB_ASKS[n];
    return '<div class="pickcard'+(ONB.asked===n?' on':'')+'" onclick="onbAsk('+n+')">'
      + '<div class="pi">'+onbIco(a.shape==='chart'?'trend':a.shape==='table'?'list':'people',18)+'</div><div style="min-width:0">'
      + '<div class="pn2">'+esc(a.q)+'</div>'
      + '<div class="pd2">Comes back as a '+(a.shape==='chart'?'chart with a trend line':a.shape==='table'?'short table you can open row by row':'profile card')
      + ' · reads '+esc(ds(a.ds).name)+'</div></div></div>';
  }).join('');
  return '<h1 style="font-size:28px;margin-bottom:8px">Ask your first question</h1>'
    + '<div class="mutedtext" style="margin-bottom:18px;max-width:62ch">Three that suit a '+esc(onbRoleObj().name)+'. Pick one and watch what happens — or type your own, which is the whole point.</div>'
    + '<div class="stack">'+cards+'</div>'
    + '<div class="cbox" style="margin-top:16px"><textarea id="onb-free" rows="2" placeholder="Or ask anything — in your own words, the way you’d ask a colleague…"></textarea>'
    + '<div class="ctools"><span class="ctool">'+onbIco('shield',13)+' Runs as '+esc(ME.name)+'</span>'
    + '<span class="ctool">'+onbIco('eye',13)+' '+ONB.localities.length+' localities</span>'
    + '<button class="csend" onclick="onbAskFree()">'+I2.send+'</button></div></div>'
    + '<div id="onb-run" style="margin-top:18px">'+onbRunHTML()+'</div>'
    + onbNav(ONB.asked===null ? 'Skip for now' : 'Continue', true);
}
function onbAsk(n){ ONB.asked=n; ONB.stage=0; onbTick(); }
function onbAskFree(){
  const t = $('#onb-free'), v = t ? t.value.trim() : '';
  if(!v){ toast('Type a question first — anything at all'); return; }
  ONB.asked = -1; ONB.free = v; ONB.freeDs = 'meetings'; ONB.stage = 0; onbTick();
}
function onbTick(){
  const seq = ++ONB.seq;
  const paint = ()=>{ if(!ONB.on || ONB.seq!==seq || ONB.step!==5) return; const el=$('#onb-run'); if(el) el.innerHTML=onbRunHTML(); };
  paint();
  setTimeout(()=>{ if(ONB.seq===seq){ ONB.stage=1; paint(); } }, 420);
  setTimeout(()=>{ if(ONB.seq===seq){ ONB.stage=2; paint(); } }, 1150);
  setTimeout(()=>{ if(ONB.seq===seq){ ONB.stage=3; paint(); onboardRender(); } }, 2000);
}
function onbRunHTML(){
  if(ONB.asked===null) return callout('mut','Nothing has run yet. Nothing will, until you ask.','info');
  const custom = ONB.asked===-1, fd = ds(ONB.freeDs) || ds('meetings');
  const a = custom ? {q:ONB.free, shape:'table', ds:fd.id, tk:[["a","Your own words"],["m","Interpreted live"],["f",ONB.localities.length+" localities"]],
        res:{big:'—', sub:'a mockup, so the shape is real and the numbers are illustrative',
             rows:[['Dataset chosen',fd.name],['Rows behind it',fd.rows],['Scoped to',ONB.localities.length+' localities, '+onbLocalityStats().sub+' subdivisions'],['Masking applied',fd.sens==='Internal'?'none':fd.accessNote]]}} : ONB_ASKS[ONB.asked];
  const d = ds(a.ds);
  let h = '<div class="panel"><div class="panel-h">'+onbIco('spark',15)+'<span>'+esc(a.q)+'</span><div class="sp"></div>'
        + (ONB.stage>=3 ? bdg('Answered','ok','check') : bdg('Working…','mut','clock'))+'</div><div class="panel-b">';
  h += '<div class="tokrow" style="margin-bottom:12px">'+a.tk.map(t=>'<span class="tok '+t[0]+'">'+esc(t[1])+'</span>').join('')+'</div>';
  if(ONB.stage>=1){
    const plan = [
      'Check who is asking — '+ME.full+', '+onbRoleObj().name+', '+ONB.localities.length+' localities',
      'Read '+d.name+' as you, '+d.rows+' rows behind a row filter you cannot turn off',
      'Apply the agreed business rules, then build the '+(a.shape==='chart'?'chart':a.shape==='table'?'table':'profile')
    ];
    h += '<div class="tline">'+plan.map((p,i)=>'<div class="tev"><div class="td3'+(ONB.stage>=2||i<2?' ok':'')+'"></div>'
      + '<div class="tt2">'+esc(p)+'</div></div>').join('')+'</div>';
  }
  if(ONB.stage>=2) h += onbResult(a);
  if(ONB.stage>=3){
    h += '<div class="hairline"></div><div style="font-family:var(--dsp);font-size:17px;font-weight:600">That’s it. No ticket, no queue.</div>'
      + '<div class="mutedtext" style="margin-top:5px">That question took eleven seconds and asked nobody’s permission, because it never needed to — it ran inside yours.</div>';
  }
  return h + '</div></div>';
}
function onbResult(a){
  const r = a.res;
  let body = '';
  if(a.shape==='chart'){
    body = '<div class="rowflex" style="align-items:flex-end;gap:18px"><div><div class="count-lg">'+esc(r.big)+'</div>'
      + '<div class="mutedtext" style="margin-top:5px">'+esc(r.sub)+'</div></div><div class="sp"></div>'
      + '<div style="width:220px;max-width:45%">'+sparkline(r.trend)+'</div></div>'
      + '<div class="kvlist" style="margin-top:12px">'+r.rows.map(x=>'<div class="r"><div class="k">'+esc(x[0])+'</div><div class="v">'+esc(x[1])+'</div></div>').join('')+'</div>';
  } else if(a.shape==='table'){
    body = '<div class="rowflex" style="margin-bottom:10px"><div class="count-lg">'+esc(r.big)+'</div><span class="mutedtext">'+esc(r.sub)+'</span></div>'
      + '<div class="dtbl-wrap"><table class="dtbl"><tbody>'+r.rows.map(x=>'<tr><td>'+esc(x[0])+'</td><td class="num">'+esc(x[1])+'</td></tr>').join('')+'</tbody></table></div>';
  } else {
    body = personChip(ME.full, ONB.locality+' · '+ME.localities[ME.localities.length-1])
      + '<div class="rowflex" style="margin:12px 0"><div class="count-lg">'+esc(r.big)+'</div><span class="mutedtext">'+esc(r.sub)+'</span></div>'
      + '<div class="kvlist">'+r.rows.map(x=>'<div class="r"><div class="k">'+esc(x[0])+'</div><div class="v">'+esc(x[1])+'</div></div>').join('')+'</div>';
  }
  return '<div class="defblock" style="margin-top:6px">'+body
    + '<div class="mutedtext" style="margin-top:12px;font-size:12px">Your view. Anyone you send this to runs it again as themselves and sees their own numbers.</div></div>';
}

/* ---------- 6 · follow something, and finish ---------- */
function onbStep6(){
  const rows = ONB_FOLLOWS.map(f=>'<div class="swrow"><div class="sl"><div class="sn">'+esc(f.n)+'</div><div class="sd">'+esc(f.s)+'</div></div>'
      + sw(ONB.follows.indexOf(f.id)>=0, 'onbToggleFollow(\''+f.id+'\')')+'</div>').join('');
  const cad = ["Every Monday, 07:00","Every morning, 06:30","Only when it changes"].map(c=>
      '<button class="'+(ONB.cadence===c?'on':'')+'" onclick="onbSetCadence(\''+c+'\')">'+esc(c)+'</button>').join('');
  const ch = ["Email","Teams","In Spiff only"].map(c=>
      '<button class="'+(ONB.channel===c?'on':'')+'" onclick="onbSetChannel(\''+c+'\')">'+esc(c)+'</button>').join('');
  const c = onbCounts(), st = onbLocalityStats();
  const summary = '<div class="kvlist">'
    + '<div class="r"><div class="k">You are</div><div class="v">'+esc(ME.full)+', '+esc(onbRoleObj().name)+' — pending '+esc(ME.manager)+'</div></div>'
    + '<div class="r"><div class="k">You cover</div><div class="v">'+ONB.localities.length+' localities, '+st.sub+' subdivisions, about '+fmt(Math.round(st.mem/100)*100)+' members</div></div>'
    + '<div class="r"><div class="k">You can ask about</div><div class="v">'+c.ready+' datasets, '+c.request+' more on request</div></div>'
    + '<div class="r"><div class="k">You follow</div><div class="v">'+(ONB.follows.length?ONB.follows.length+' — '+esc(ONB.cadence.toLowerCase())+', by '+esc(ONB.channel.toLowerCase()):'nothing yet')+'</div></div>'
    + '<div class="r"><div class="k">Everything runs as</div><div class="v">'+esc(ME.email)+'</div></div></div>';
  return '<h1 style="font-size:28px;margin-bottom:8px">Follow one thing</h1>'
    + '<div class="mutedtext" style="margin-bottom:18px;max-width:62ch">The people who get value from Spiff are the ones who stopped coming to look. Pick something you actually care about and let it come to you — you can change or drop it any time.</div>'
    + panel('What should Spiff watch?', rows, {icon:'star'})
    + '<div class="g2">'
    + panel('How often should Spiff tell you?','<div class="seg2" style="flex-wrap:wrap">'+cad+'</div>',{icon:'clock',tight:true})
    + panel('Where?','<div class="seg2" style="flex-wrap:wrap">'+ch+'</div>',{icon:'send',tight:true})
    + '</div>'
    + panel('You’re set up', summary, {icon:'check', sub:'in your words, not ours',
        foot:'<span class="mutedtext">Nothing here is permanent. Change your localities, drop a follow, or ask for a different role — the approval runs again each time.</span>'})
    + '<div style="margin-top:12px">'+callout('info','Curious what your approver sees before any of this takes effect? <button class="btn sm ghost" onclick="newUserRequestModal()">Open the approval they get</button>','shield')+'</div>'
    + '<div class="hairline"></div>'
    + '<div class="rowflex"><button class="btn" onclick="onboardBack()">'+onbIco('back',15)+' Back</button><div class="sp"></div>'
    + '<button class="btn" onclick="onbToCatalog()">Take me to the catalogue</button>'
    + '<button class="btn pri" onclick="onbFinish()">Go to Home '+onbIco('chev',15)+'</button></div>';
}
function onbToggleFollow(id){
  const at = ONB.follows.indexOf(id);
  if(at>=0) ONB.follows.splice(at,1); else ONB.follows.push(id);
  onboardRender();
  toast(at>=0 ? 'Unfollowed' : 'Following — it runs as you, and only tells you what you may see');
}
function onbSetCadence(c){ ONB.cadence=c; onboardRender(); }
function onbSetChannel(c){ ONB.channel=c; onboardRender(); }
function onbFinish(){
  closeOnboarding();
  toast('Welcome to Spiff, '+ME.full.split(' ')[0]+' — ask anything');
  go('home');
}

/* ---------- entry point so the flow is discoverable from the mockup ---------- */
function renderRegisterPreview(){
  return '<div class="pickcard" onclick="startOnboarding(0)">'
    + '<div class="pi">'+onbIco('spark',18)+'</div><div>'
    + '<div class="pn2">See the sign-up flow</div>'
    + '<div class="pd2">How a new person registers, confirms who they are, and finds their first dataset — seven screens, end to end.</div></div></div>';
}

/* ---------- the approver’s side of the same registration ---------- */
function newUserRequestModal(){
  const c = onbCounts(), st = onbLocalityStats(), r = onbRoleObj();
  const unlocked = DATASETS.filter(d=>onbState(d)==='ready');
  const facts = [["Person",ME.full+' · '+ME.email],["Title",ME.title],["Team",ME.team],
                 ["Asked for",r.name],["Localities",ONB.localities.length?ONB.localities.join(', '):'none selected'],
                 ["Home locality",ONB.locality],["Requested","today, 08:14"]];
  const html = '<div class="rowflex" style="margin-bottom:14px">'+avatar(ME.full,'lg')
    + '<div><h3 style="font-size:19px">A new person is waiting on you</h3>'
    + '<div class="mutedtext" style="font-size:13px">You approve access for '+esc(ONB.localities[0]||ORG.localities[0])+' and '+Math.max(0,ONB.localities.length-1)+' other localities</div></div></div>'
    + '<div class="kvlist" style="margin-bottom:14px">'+facts.map(f=>'<div class="r"><div class="k">'+esc(f[0])+'</div><div class="v">'+esc(f[1])+'</div></div>').join('')+'</div>'
    + callout('warn','<b>Blast radius.</b> Approving this grants '+c.ready+' datasets across '+ONB.localities.length+' localities — '
        + st.sub+' subdivisions, about '+fmt(Math.round(st.mem/100)*100)+' members. <b>'+c.personal+' of those datasets contain personal data</b>, masked outside their own subdivision in '+esc(ONB.locality)+'. '
        + 'It grants no export of detail rows and no access to '+esc(ds('care').name)+', which stays blocked for everyone.','warn')
    + '<div class="dtbl-wrap cap" style="margin:14px 0"><table class="dtbl"><thead><tr><th>Would unlock</th><th>Sensitivity</th><th>What they would see</th></tr></thead><tbody>'
    + unlocked.slice(0,6).map(d=>'<tr><td>'+esc(d.name)+'</td><td>'+sensBadge(d.sens)+'</td><td class="mutedtext" style="font-size:12px">'+onbLevel(d)+'</td></tr>').join('')
    + (unlocked.length>6 ? '<tr><td colspan="3" class="mutedtext">and '+(unlocked.length-6)+' more</td></tr>' : '')
    + '</tbody></table></div>'
    + callout('mut','Whatever you decide is recorded against your name in the activity log, with the reason. Access granted here is reviewed again in 90 days, and dropped automatically if unused for six months.','log')
    + '<div class="mfoot"><button class="btn danger" onclick="onbDecide(\'declined\')">Decline</button>'
    + '<button class="btn" onclick="onbDecide(\'adjusted\')">Adjust…</button>'
    + '<button class="btn pri" onclick="onbDecide(\'approved\')">Approve as requested</button></div>';
  openModal(html, 660);
}
function onbDecide(what){
  closeModal();
  if(what==='approved') toast('Approved — '+ME.full+' is live now, and re-checked on every question');
  else if(what==='adjusted') toast('Adjust: drop an area or a dataset, and the request goes back with your note');
  else toast('Declined — they are told who declined and why, not just that it failed');
}
</script>
