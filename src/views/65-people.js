<script>
/* =====================================================================
   PEOPLE & ACCESS  —  the screen that has to work at 428 people, not 32.
   Directory · Groups · Roles · Entitlement matrix · Activity, plus the
   person profile with "View Spiff as this person".
   ===================================================================== */

const PPL_STATE = {q:"", team:"all", locality:"all", role:"all", status:"all", sort:"name", dormant:false, sel:[]};

const PPL_MGR = {"LDM Operations":"Reneilwe Dlomo","Membership & Care":"Sindi Mthembu","Travel & Logistics":"Colette Marais",
                 "Events":"Warrick Meintjes","Estates":"Kobus Prinsloo","Finance":"Brendan Jooste","Statistics":"Rupert Mackenzie"};
const PPL_SHORT = {meetings:"Meetings", members:"Members", localities:"Localities", families:"Families", travel:"Travel",
                   itineraries:"Itineraries", events:"Events", registrations:"Registr.", growth:"Growth",
                   appointments:"Appts", properties:"Properties", comms:"Notices", budgets:"Budgets",
                   checkins:"Check-ins", care:"Care"};
const PPL_AUTO_TPL = [
  ["Weekly attendance pack","Every Monday 07:00","Runs as owner, scoped to their localities"],
  ["Localities missing a secretary","Every Friday 16:00","Runs as owner, scoped to their localities"],
  ["Month-end movement summary","1st of the month, 06:30","Aggregate only — no detail rows"],
  ["Travel spend against budget","Every Tuesday 08:00","Cost lines only, traveller names never resolve"],
  ["Registrations still unconfirmed","Daily 18:00","Wellbeing notes withheld"],
  ["Dormant-access watch","Every Monday 06:00","Reads the access log, not the data"]
];
const PPL_KIND_ICON = {grant:"unlock", revoke:"lock", deny:"x", role:"people", sync:"refresh", review:"shield", expire:"clock"};

/* ---------- small helpers ---------- */
function pplQ(s){ return esc(String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'")); }
function pplHash(s){ let h=0; for(const c of String(s)) h=(h*31+c.charCodeAt(0))>>>0; return h; }
function pplGroupsOf(p){ return accessGroupsOf(p); }
function pplLevel(gids, dsId){
  let lv="none";
  for(let i=0;i<gids.length;i++){ const x=accessFor(gids[i],dsId); if(x==="block") return "block";
    if(ACCESS_RANK[x]>ACCESS_RANK[lv]) lv=x; }
  return lv;
}
function pplAccess(p, dsId){
  const gids = pplGroupsOf(p), lv = pplLevel(gids, dsId);
  const via = gids.filter(function(g){ const x=accessFor(g,dsId); return x==="full"||x==="part"; })
                  .map(function(g){ const G=groupById(g); return G?G.name:g; });
  return {level:lv, via:via};
}
function pplCounts(p){
  const gids = pplGroupsOf(p), c = {full:0, part:0, none:0, block:0};
  DATASETS.forEach(function(d){ c[pplLevel(gids, d.id)]++; });
  return c;
}
function pplBreadth(p){ const c=pplCounts(p); return c.full*2 + c.part; }
function pplRecency(s){
  s = s || "";
  if(/just now/.test(s)) return 0;
  const m = /([\d.]+)\s*(min|h|d)/.exec(s);
  if(!m) return 999999;
  const n = parseFloat(m[1]);
  return m[2]==="min" ? n : m[2]==="h" ? n*60 : n*1440;
}
function pplManager(p){
  const m = PPL_MGR[p.team] || "Reneilwe Dlomo";
  return m === p.name ? "Ezra Haddad" : m;
}
function pplRuleName(id){
  if(typeof ruleById === "function"){ const r = ruleById(id); if(r && r.name) return r.name; }
  return id;
}
function pplRuleChips(ids){
  if(!ids || !ids.length) return '<span class="mutedtext">No rule shapes this one.</span>';
  return ids.map(function(r){
    return '<button class="bdg mut" style="border:none;cursor:pointer" onclick="openRule(\''+pplQ(r)+'\')">'+esc2(pplRuleName(r))+'</button>';
  }).join(" ");
}
function pplRoleSource(p, roleId){
  const src = pplGroupsOf(p).filter(function(g){ const G=groupById(g); return G && G.roles.indexOf(roleId)>=0; });
  return src.map(function(g){ return groupById(g).name; });
}
function pplDirectRoles(p){ return (p.roles||[]).filter(function(r){ return pplRoleSource(p,r).length===0; }); }
function pplDirectTotal(){ let n=0; PEOPLE.forEach(function(p){ n += pplDirectRoles(p).length; }); return n; }
function pplGrantSource(p, gid){
  const G = groupById(gid); if(!G) return "";
  if(/^Synced/.test(G.type))         return "Synced from Directory. Membership follows the HR record — nobody approves it.";
  if(/^Attribute/.test(G.type))      return "Attribute rule: " + G.rule + ". A change to that attribute in Directory moves them in or out on the next sync — nobody files a ticket.";
  return "Added by hand by " + G.owner + ". Reviewed " + ((ENT_META[gid]||{}).review || "annually").toLowerCase() + ".";
}
/* Group membership was a full scan of PEOPLE, and the groups pane calls it once
   per group while rendering — so the cost was groups × people on every paint.
   Indexed once instead. The rendered lists were already capped at 5 and 8, so
   the DOM was never the problem; the repeated scan was. */
let PPL_MEMBER_IX = null;
function pplMemberIndex(){
  if(PPL_MEMBER_IX) return PPL_MEMBER_IX;
  const ix = {};
  PEOPLE.forEach(function(p){
    pplGroupsOf(p).forEach(function(gid){ (ix[gid] || (ix[gid] = [])).push(p); });
  });
  PPL_MEMBER_IX = ix;
  return ix;
}
function pplMembersOf(gid){ return pplMemberIndex()[gid] || []; }

/* Seeing 8 of 428 is fine until you need one particular person. */
const PPL_GROUP_FIND = {};
function pplGroupFind(gid, v){
  PPL_GROUP_FIND[gid] = v;
  const box = $('#grp-members');
  if(box) box.innerHTML = pplGroupMembersHTML(gid, box.dataset.manual === "1");
}
function pplGroupMembersHTML(gid, manual){
  const q = (PPL_GROUP_FIND[gid]||"").trim().toLowerCase();
  const all = pplMembersOf(gid);
  const hits = q ? all.filter(function(p){ return (p.name+" "+p.title+" "+p.team+" "+p.locality).toLowerCase().indexOf(q)>=0; }) : all;
  if(!hits.length) return '<div class="mutedtext" style="padding:8px 2px">Nobody in this group matches “'+esc2(q)+'”.</div>';
  return '<div class="g2" style="gap:8px">'
    + cappedList(hits, 8, function(p){
        return '<div class="rowflex" style="gap:4px">'
          + '<div class="clickable" style="flex:1;min-width:0" onclick="closeModal();openPerson(\''+pplQ(p.name)+'\')">'+personChip(p.name,p.title)+'</div>'
          + (manual ? '<button class="kebab" title="Remove from group" onclick="pplRemoveFromGroupAsk(\''+pplQ(gid)+'\',\''+pplQ(p.name)+'\')">'+I2.trash+'</button>' : '')
          + '</div>';
      }, q ? "matches" : "members")
    + '</div>';
}
function pplStatusBadge(p){
  return p.status==="active"    ? bdg("Active","ok","check")
       : p.status==="dormant"   ? bdg("Dormant","warn","clock")
       : p.status==="suspended" ? bdg("Suspended","crit","lock") : bdg(p.status,"mut");
}
function pplReviewFlag(name){
  for(let i=0;i<REVIEWS.length;i++){
    const it = REVIEWS[i].items.filter(function(x){ return x.who===name && x.flag; });
    if(it.length) return it[0].flag;
  }
  return null;
}
function pplFlagged(p){
  return !!(p.flag || p.status!=="active" || pplRecency(p.last)>43200 || pplReviewFlag(p.name));
}
function pplReviewItem(name){
  for(let i=0;i<REVIEWS.length;i++){
    const it = REVIEWS[i].items.filter(function(x){ return x.who===name; });
    if(it.length) return {campaign:REVIEWS[i], item:it[0]};
  }
  return null;
}

/* ---------- scope tier ----------
   A person's reach is the widest tier any of their groups grants. Their own
   Directory locality is the floor; a Country-tier group widens it to every
   locality in those countries; Region and Global widen it further. */
const PPL_TIER_RANK = {Subdivision:0, Locality:1, Country:2, Region:3, Global:4};
function pplTier(p){
  let best = "Locality";
  (p.groups||[]).forEach(function(gid){
    const g = groupById(gid);
    if(g && g.tier && PPL_TIER_RANK[g.tier] > PPL_TIER_RANK[best]) best = g.tier;
  });
  (p.roles||[]).forEach(function(rid){
    const r = roleById(rid);
    if(r && r.tier && PPL_TIER_RANK[r.tier] > PPL_TIER_RANK[best]) best = r.tier;
  });
  return best;
}
function pplCountries(p){
  const cs = [];
  (p.groups||[]).forEach(function(gid){
    const g = groupById(gid);
    if(!g || g.tier !== "Country" || !g.rule) return;
    const m = /\(([^)]*)\)/.exec(g.rule);
    if(m) m[1].split(",").forEach(function(c){ c = c.trim(); if(c && cs.indexOf(c)<0) cs.push(c); });
  });
  return cs;
}
function pplTierScope(p){
  const t = pplTier(p);
  if(t === "Global") return "Every region";
  if(t === "Region") return "The whole region, aggregate only";
  if(t === "Country"){
    const cs = pplCountries(p);
    const n = ORG.localities.filter(function(l){ return cs.indexOf(countryOf(l))>=0; }).length;
    return n + " localities across " + cs.length + " countries";
  }
  return (p.me ? ME.localities.length : 1) + " of " + fmt(ORG.localityCount) + " localities";
}

/* ---------- filtering & sorting ---------- */
function pplMatches(p){
  const S = PPL_STATE, q = S.q.trim().toLowerCase();
  if(q && (p.name+" "+p.title+" "+p.team+" "+p.locality).toLowerCase().indexOf(q)<0) return false;
  if(S.team!=="all"   && p.team!==S.team)     return false;
  if(S.locality!=="all" && p.locality!==S.locality) return false;
  if(S.status!=="all" && p.status!==S.status) return false;
  if(S.role!=="all"   && (p.roles||[]).indexOf(S.role)<0) return false;
  if(S.dormant && !pplFlagged(p)) return false;
  return true;
}
function pplSorted(){
  const rows = PEOPLE.filter(pplMatches).slice();
  const s = PPL_STATE.sort;
  rows.sort(function(a,b){
    if(s==="last")    return pplRecency(a.last)-pplRecency(b.last);
    if(s==="asked")   return b.asked-a.asked;
    if(s==="access")  return pplBreadth(b)-pplBreadth(a);
    if(s==="team")    return a.team.localeCompare(b.team) || a.name.localeCompare(b.name);
    if(s==="locality")return a.locality.localeCompare(b.locality) || a.name.localeCompare(b.name);
    return a.name.localeCompare(b.name);
  });
  return rows;
}
function pplSetQ(v){ PPL_STATE.q=v; pplRefresh(); }
function pplPickLocality(v){ pplSetFilter("locality", v); }
function pplSetFilter(k,v){ PPL_STATE[k]=v; pplRefresh(); }
function pplToggleDormant(){ PPL_STATE.dormant=!PPL_STATE.dormant; pplRefresh(); }
function pplClearFilters(){
  PPL_STATE.q=""; PPL_STATE.team="all"; PPL_STATE.locality="all"; PPL_STATE.role="all"; PPL_STATE.status="all";
  PPL_STATE.dormant=false; PPL_STATE.sort="name";
  const box=$('#ppl-q'); if(box) box.value="";
  ["team","locality","role","status"].forEach(function(k){ const el=$('#ppl-f-'+k); if(el) el.value="all"; });
  const so=$('#ppl-f-sort'); if(so) so.value="name";
  pplRefresh();
}

/* ---------- selection & bulk ---------- */
function pplToggleSel(box,id){
  const i = PPL_STATE.sel.indexOf(id);
  if(box.checked && i<0) PPL_STATE.sel.push(id); else if(!box.checked && i>=0) PPL_STATE.sel.splice(i,1);
  pplPaintBulk();
}
function pplSelectAll(on){
  const ids = pplSorted().map(function(p){ return p.id; });
  PPL_STATE.sel = on ? ids : [];
  pplRefresh();
}
function pplClearSel(){ PPL_STATE.sel=[]; pplRefresh(); }
function pplSelPeople(){ return PEOPLE.filter(function(p){ return PPL_STATE.sel.indexOf(p.id)>=0; }); }
function pplPaintBulk(){ const el=$('#ppl-bulk'); if(el) el.innerHTML = pplBulkHTML(); }
function pplBulkHTML(){
  const n = PPL_STATE.sel.length;
  if(!n) return '';
  return '<div class="panel" style="margin-bottom:12px"><div class="panel-b" style="padding:11px 15px"><div class="rowflex">'
    + '<b>'+n+' selected</b>'
    + '<span class="mutedtext">Selection survives filtering and sorting.</span>'
    + '<div class="sp"></div>'
    + '<button class="btn sm" onclick="pplBulk(\'group\')">'+I2.people+' Add to group</button>'
    + '<button class="btn sm" onclick="pplBulk(\'role\')">'+I2.shield+' Assign role</button>'
    + '<button class="btn sm" onclick="pplBulk(\'review\')">'+I2.check+' Start access review</button>'
    + '<button class="btn sm danger" onclick="pplBulk(\'suspend\')">'+I2.lock+' Suspend</button>'
    + '<button class="btn sm ghost" onclick="pplClearSel()">Clear</button>'
    + '</div></div></div>';
}
function pplRadiusText(action, pick){
  const sel = pplSelPeople(), n = sel.length;
  if(action==="group"){
    const g = groupById(pick) || GROUPS[0];
    const already = sel.filter(function(p){ return pplGroupsOf(p).indexOf(g.id)>=0; }).length;
    const gains = g.roles.map(function(r){ return (roleById(r)||{}).name; }).join(" and ") || "no new role";
    let full=0, part=0; const ent = ENTITLEMENTS[g.id] || {};
    DATASETS.forEach(function(d){ if(ent[d.id]==="full") full++; else if(ent[d.id]==="part") part++; });
    return "Adds <b>"+(n-already)+"</b> people to <b>"+esc2(g.name)+"</b> ("+already+" already members). "
      + "They gain "+esc2(gains)+", and with it "+full+" datasets in full and "+part+" in part. "
      + "It takes effect on their very next question — group membership is re-checked on every run, never cached.";
  }
  if(action==="role"){
    const r = roleById(pick) || ROLES[0];
    return "Assigns <b>"+esc2(r.name)+"</b> ("+r.privs.length+" privileges, "+esc2(r.risk)+" risk) to "+n+" people. "
      + "Roles bind to groups, not to people, so this creates <b>"+n+" individual exceptions</b> and every one of them "
      + "lands on the next review campaign. If these people share a group, change the group instead.";
  }
  if(action==="review"){
    let grants=0; sel.forEach(function(p){ const c=pplCounts(p); grants += c.full + c.part; });
    return "Creates a campaign covering "+n+" people and <b>"+grants+" grants</b>. You own it and you sign it off, "
      + "and sign-off stays blocked until every item is decided.";
  }
  return "Suspends "+n+" people immediately. Their automations stop on the next run and their shared answers stop "
    + "resolving for them. Grants are <b>held, not deleted</b> — if this reverses, nothing has to be rebuilt.";
}
function pplBulkRadius(action){
  const pick = $('#ppl-pick'), box = $('#ppl-radius');
  if(box) box.innerHTML = pplRadiusText(action, pick ? pick.value : null);
}
function pplBulk(action){
  const sel = pplSelPeople(), n = sel.length;
  if(!n){ toast("Select some people first"); return; }
  const names = sel.slice(0,6).map(function(p){ return p.name; }).join(", ") + (n>6 ? " and "+(n-6)+" more" : "");
  let title = "", picker = "", first = null;
  if(action==="group"){
    first = GROUPS[1].id;
    title = "Add "+n+" "+(n===1?"person":"people")+" to a group";
    picker = '<div class="field"><label>Group</label><select id="ppl-pick" onchange="pplBulkRadius(\'group\')">'
      + GROUPS.slice(1).map(function(x){ return '<option value="'+x.id+'">'+esc2(x.name)+' — '+esc2(x.type)+'</option>'; }).join("")
      + '</select><div class="mutedtext" style="margin-top:6px">All staff is not on this list. Everyone is in it automatically and nobody can be taken out.</div></div>';
  } else if(action==="role"){
    first = ROLES[0].id;
    title = "Assign a role to "+n+" "+(n===1?"person":"people");
    picker = '<div class="field"><label>Role bundle</label><select id="ppl-pick" onchange="pplBulkRadius(\'role\')">'
      + ROLES.map(function(r){ return '<option value="'+r.id+'">'+esc2(r.name)+' — '+r.privs.length+' privileges · '+esc2(r.risk)+' risk</option>'; }).join("")
      + '</select></div>';
  } else if(action==="review"){
    title = "Start an access review for "+n+" "+(n===1?"person":"people");
    picker = '<div class="field"><label>Scope</label><select id="ppl-pick"><option>Personal datasets only</option>'
      + '<option>Every dataset they hold</option><option>Only what changed since the last review</option></select></div>';
  } else {
    title = "Suspend "+n+" "+(n===1?"person":"people");
  }
  openModal('<h3>'+esc2(title)+'</h3>'
    + '<div class="msub">'+esc2(names)+'</div>'
    + '<div class="callout '+(action==="suspend"?"crit":"warn")+'">'+I2.warn
    + '<div id="ppl-radius">'+pplRadiusText(action, first)+'</div></div>'
    + '<div style="height:14px"></div>'
    + picker
    + '<div class="field"><label>Reason — recorded against your name</label><div class="fcontrol">'
    + '<textarea id="ppl-reason" rows="3" placeholder="Why is this change being made? Auditors read this field."></textarea></div></div>'
    + modalFoot("Cancel", action==="suspend"?"Suspend":"Apply", "pplBulkConfirm(\'"+action+"\')"), 620);
}
function pplBulkConfirm(action){
  const box = $('#ppl-reason'), reason = box ? box.value.trim() : "";
  if(reason.length < 6){ toast("Add a reason. Every bulk change is recorded against your name."); if(box) box.focus(); return; }
  const n = PPL_STATE.sel.length;
  closeModal();
  toast(action==="group"   ? n+" people queued for the group — provisioning runs on tonight's sync"
      : action==="role"    ? n+" individual role exceptions created and added to the Q3 review"
      : action==="review"  ? "Review campaign created for "+n+" people — you sign it off"
      : n+" people suspended. Grants held, nothing deleted.");
  PPL_STATE.sel = [];
  pplRefresh();
}

/* ---------- directory pane ---------- */
function pplTableHTML(){
  const rows = pplSorted(), sel = PPL_STATE.sel;
  if(!rows.length) return emptyState("Nobody matches that","Try a wider filter, or clear them all.","search");
  return '<div class="dtbl-wrap"><table class="dtbl"><thead><tr>'
    + '<th style="width:36px"><input type="checkbox" onclick="pplSelectAll(this.checked)"'+(sel.length&&sel.length===rows.length?" checked":"")+'></th>'
    + '<th>Person</th><th>Team</th><th>Locality</th><th>Roles</th><th class="num">Groups</th>'
    + '<th>Last active</th><th class="num">Asked</th><th>What they can see</th></tr></thead><tbody>'
    + rows.map(function(p){
        const c = pplCounts(p), gids = pplGroupsOf(p);
        return '<tr class="clk" onclick="openPerson(\''+pplQ(p.name)+'\')">'
          + '<td onclick="event.stopPropagation()"><input type="checkbox" onclick="pplToggleSel(this,\''+pplQ(p.id)+'\')"'+(sel.indexOf(p.id)>=0?" checked":"")+'></td>'
          + '<td><div class="person">'+avatar(p.name)+'<div><div class="pn">'+esc2(p.name)+(p.me?' '+bdg("You","info"):'')+'</div>'
          +      '<div class="pr">'+esc2(p.title)+'</div></div></div></td>'
          + '<td>'+esc2(p.team)+'</td><td>'+esc2(p.locality)+'</td>'
          + '<td>'+(p.roles||[]).map(function(r){ const R=roleById(r); if(!R) return '';
                return bdg(R.name, R.risk==="critical"?"crit":R.risk==="high"?"warn":"mut"); }).join(" ")+'</td>'
          + '<td class="num">'+gids.length+'</td>'
          + '<td>'+esc2(p.last)+(p.status!=="active"?' '+pplStatusBadge(p):'')
          +      (pplReviewFlag(p.name)?' '+bdg(pplReviewFlag(p.name),"warn","warn"):'')+'</td>'
          + '<td class="num">'+fmt(p.asked)+'</td>'
          + '<td><span class="mutedtext">'+(c.full?'<b>'+c.full+'</b> full':'')+(c.full&&c.part?' · ':'')
          +      (c.part?'<b>'+c.part+'</b> partial':'')+(!c.full&&!c.part?'nothing beyond reference data':'')
          +      ' of '+DATASETS.length+'</span></td>'
          + '</tr>';
      }).join("")
    + '</tbody></table></div>';
}
function pplCountHTML(){
  const shown = pplSorted().length;
  const filtered = shown !== PEOPLE.length;
  return '<div class="rowflex" style="margin:2px 0 12px">'
    + '<span class="mutedtext">Showing <b>'+shown+'</b> of <b>'+PEOPLE.length+'</b> listed'
    + (filtered ? ' (filtered)' : '')
    + ' · <b>'+fmt(ORG.users)+'</b> people in this tenant</span>'
    + (filtered ? ' <button class="btn sm ghost" onclick="pplClearFilters()">Clear filters</button>' : '')
    + '</div>';
}
function pplRefresh(){
  const list=$('#ppl-list'); if(!list) return;
  list.innerHTML = pplTableHTML();
  const cnt=$('#ppl-count'); if(cnt) cnt.innerHTML = pplCountHTML();
  const chip=$('#ppl-dormant'); if(chip) chip.className = "fchip2" + (PPL_STATE.dormant ? " on" : "");
  pplPaintBulk();
}
function pplDirPane(){
  const sel = function(id,label,opts,cur,noAll){
    return '<div class="field" style="margin:0;min-width:150px"><label>'+label+'</label>'
      + '<select id="ppl-f-'+id+'" onchange="pplSetFilter(\''+id+'\',this.value)">'
      + (noAll ? '' : '<option value="all">All</option>')
      + opts.map(function(o){ return '<option value="'+esc2(o[0])+'"'+(cur===o[0]?" selected":"")+'>'+esc2(o[1])+'</option>'; }).join("")
      + '</select></div>';
  };
  const dormantN = PEOPLE.filter(pplFlagged).length;
  return '<div class="bigsearch" style="margin-bottom:14px">'+I2.search
      + '<input id="ppl-q" placeholder="Search 428 people by name, title, team or locality" oninput="pplSetQ(this.value)"></div>'
    + '<div class="rowflex" style="align-items:flex-end;margin-bottom:14px">'
      + sel("team","Team", ORG.divisions.map(function(t){return [t,t];}), PPL_STATE.team)
      + '<div class="field" style="margin-bottom:0;min-width:190px">'+pickList("Locality", ORG.localities, PPL_STATE.locality, "pplPickLocality")+'</div>'
      + sel("role","Role", ROLES.map(function(r){return [r.id,r.name];}), PPL_STATE.role)
      + sel("status","Status", [["active","Active"],["dormant","Dormant"],["suspended","Suspended"]], PPL_STATE.status)
      + sel("sort","Sort by", [["name","Name"],["last","Last active"],["asked","Questions asked"],["access","Access breadth"],["team","Team"]], PPL_STATE.sort, true)
      + '<div class="sp"></div>'
      + '<button id="ppl-dormant" class="fchip2'+(PPL_STATE.dormant?" on":"")+'" onclick="pplToggleDormant()">'+I2.clock+' Dormant access <b>'+dormantN+'</b></button>'
    + '</div>'
    + '<div id="ppl-bulk">'+pplBulkHTML()+'</div>'
    + '<div id="ppl-count">'+pplCountHTML()+'</div>'
    + '<div id="ppl-list">'+pplTableHTML()+'</div>'
    + '<div class="callout mut" style="margin-top:14px">'+I2.info+'<div>This mockup lists <b>'+PEOPLE.length+'</b> real-looking people. '
      + 'The other <b>'+fmt(PEOPLE_HIDDEN)+'</b> in the tenant are counted everywhere but not listed — the screen is built for '
      + fmt(ORG.users)+', not for a demo of 32.</div></div>';
}

/* ---------- groups pane ---------- */
function pplRepaint(tab){ renderPeople(); switchTab('ppl', tab); }

/* a Manual group is ours to delete; a synced one is Directory's, and says so */
function pplGroupDeleteAsk(gid){
  const g = groupById(gid); if(!g) return;
  const grants = g.roles.map(function(r){ const R=roleById(r); return R ? R.name : r; }).join(', ');
  confirmAsk({title:'Delete the group “'+esc2(g.name)+'”?',
    body:fmt(g.members)+' people lose what it grants at their next run — '+esc2(grants)+'. Their other groups are untouched, and the activity log keeps every grant this group ever made.',
    verb:'Delete', onConfirm:function(){
      const i = GROUPS.indexOf(g); if(i>=0) GROUPS.splice(i,1);
      PEOPLE.forEach(function(p){ p.groups = (p.groups||[]).filter(function(x){ return x!==gid; }); });
      toast('Deleted '+g.name); pplRepaint('grp');
    }});
}
function pplGroupCard(g){
  const m = ENT_META[g.id] || {}, ent = ENTITLEMENTS[g.id] || {};
  let full=0, part=0; DATASETS.forEach(function(d){ const l=ent[d.id]; if(l==="full")full++; else if(l==="part")part++; });
  const listed = pplMembersOf(g.id), synced = /Synced/.test(g.type);
  const menu = [{label:'Open', icon:'people', onclick:"pplOpenGroup('"+pplQ(g.id)+"')"}];
  if(synced) menu.push({label:'Managed in Directory', icon:'lock', onclick:"toast('Membership of "+pplQ(g.name)+" is synced from Directory and cannot be edited here')"});
  else menu.push({label:'Delete group', icon:'trash', danger:true, onclick:"pplGroupDeleteAsk('"+pplQ(g.id)+"')"});
  return '<div><div class="panel clickable" onclick="pplOpenGroup(\''+pplQ(g.id)+'\')">'
    + '<div class="panel-h">'+I2.people+'<span>'+esc2(g.name)+'</span><div class="sp"></div>'
    + bdg(g.type, synced?"info":/Attribute/.test(g.type)?"purple":"mut")+kebabHTML(menu)+'</div>'
    + '<div class="panel-b">'
    + '<div class="rowflex" style="margin-bottom:11px"><span class="count-lg">'+fmt(g.members)+'</span>'
    + '<span class="mutedtext">members</span><div class="sp"></div>'
    + '<div class="avstack">'+listed.slice(0,5).map(function(p){ return avatar(p.name,"sm"); }).join("")
    + (g.members>listed.slice(0,5).length ? '<div class="av2 sm more">+'+(g.members-Math.min(5,listed.length))+'</div>' : '')+'</div></div>'
    + '<div class="rowflex" style="margin-bottom:11px">'+g.roles.map(function(r){ const R=roleById(r); return R?bdg(R.name,"mut","shield"):""; }).join("")+'</div>'
    + (g.rule ? '<div class="defblock" style="margin-bottom:11px"><b>Rule</b> · '+esc2(g.rule)+'</div>' : '')
    + '<div class="kvlist"><div class="r"><span class="k">Owner</span><span class="v">'+esc2(g.owner)+'</span></div>'
    + '<div class="r"><span class="k">Holds</span><span class="v">'+full+' full · '+part+' partial</span></div>'
    + '<div class="r"><span class="k">Reviewed</span><span class="v">'+esc2(m.review||"Annually")+'</span></div></div>'
    + '</div></div></div>';
}
function pplGroupsPane(){
  return callout("info","Everything binds to a group. No dataset in Spiff is granted to a person — that is the single decision "
      + "that makes 428 people manageable, and it is why the matrix has 12 rows instead of 428.")
    + '<div style="height:14px"></div>'
    + listFrame("ppl-groups", {
        items: GROUPS, repaint: function(){ pplRepaint('grp'); }, noun: "groups", noun1: "group", size: 10,
        search: function(g){ return g.name+' '+g.type+' '+g.owner; }, placeholder: "Search groups by name, type or owner…",
        sorts: [{key:"name",    label:"Name",         get:function(g){ return g.name; }},
                {key:"members", label:"Most members", get:function(g){ return g.members; }, desc:true},
                {key:"type",    label:"Type",         get:function(g){ return g.type; }},
                {key:"owner",   label:"Owner",        get:function(g){ return g.owner; }}],
        row: pplGroupCard, bodyClass: "g2",
        emptyTitle: "No group matches that", emptyIcon: "people"
      });
}
function pplOpenGroup(gid){
  const g = groupById(gid); if(!g) return;
  const m = ENT_META[gid] || {}, listed = pplMembersOf(gid), ent = ENTITLEMENTS[gid] || {};
  openModal('<h3>'+esc2(g.name)+'</h3>'
    + '<div class="msub">'+esc2(g.type)+' · '+fmt(g.members)+' members · owned by '+esc2(g.owner)+'</div>'
    + (m.why ? '<div class="defblock" style="margin-bottom:14px">'+esc2(m.why)+'</div>' : '')
    + (g.rule ? callout("mut","<b>Attribute rule</b> — "+esc2(g.rule)+". Nobody approves membership; Directory does.")+'<div style="height:14px"></div>' : '')
    + '<div class="rowflex" style="margin-bottom:14px"><span class="mutedtext">Grants</span>'
    + g.roles.map(function(r){ const R=roleById(r); return R?'<button class="bdg mut" style="border:none;cursor:pointer" onclick="pplOpenRole(\''+pplQ(r)+'\')">'+I2.shield+esc2(R.name)+'</button>':""; }).join("")+'</div>'
    + '<div class="rowflex" style="margin-bottom:8px;align-items:baseline">'
    +   '<span style="font-weight:600">Members</span>'
    +   '<span class="mutedtext" style="font-size:12.5px">'+fmt(listed.length)+' listed of '+fmt(g.members)+'</span></div>'
    + (listed.length > 8
        ? '<div class="bigsearch" style="margin-bottom:10px">'+I2.search
          + '<input value="'+esc2(PPL_GROUP_FIND[gid]||"")+'" oninput="pplGroupFind(\''+pplQ(gid)+'\',this.value)"'
          + ' placeholder="Find someone in '+esc2(g.name)+'…"></div>'
        : '')
    + '<div id="grp-members" style="margin-bottom:16px">'+pplGroupMembersHTML(gid)+'</div>'
    + '<div style="font-weight:600;margin-bottom:8px">What this group can see</div>'
    + '<div class="dtbl-wrap cap"><table class="dtbl"><thead><tr><th>Dataset</th><th>Sensitivity</th><th>Access</th></tr></thead><tbody>'
    + DATASETS.map(function(d){
        const L = ACCESS_LEVELS[ent[d.id] || "none"];
        return '<tr><td>'+esc2(d.name)+'</td><td>'+sensBadge(d.sens)+'</td><td>'+bdg(L.label,L.cls)+'</td></tr>';
      }).join("")
    + '</tbody></table></div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    + (listed.length ? '<button class="btn" onclick="closeModal();startSim(\''+pplQ(listed[0].name)+'\')">'+I2.eye+' Simulate a member</button>' : '')
    + '<button class="btn pri" onclick="closeModal();toast(\'Review campaign drafted for '+pplQ(g.name)+'\')">Start a review</button></div>', 720);
}

/* ---------- roles pane ---------- */
/* a bundle retires. Its holders lose what it grants at their next run; the
   groups that carried it stay. */
function pplRoleRetireAsk(rid){
  const r = roleById(rid); if(!r) return;
  const via = GROUPS.filter(function(g){ return g.roles.indexOf(rid)>=0; });
  confirmAsk({title:'Retire the bundle “'+esc2(r.name)+'”?',
    body:fmt(r.members)+' people hold it'+(via.length?' through '+via.map(function(g){ return esc2(g.name); }).join(', '):'')+'. They lose what it grants at their next run; the groups themselves stay. A retired bundle is kept in the history, not deleted.',
    verb:'Retire', onConfirm:function(){
      const i = ROLES.indexOf(r); if(i>=0) ROLES.splice(i,1);
      GROUPS.forEach(function(g){ g.roles = g.roles.filter(function(x){ return x!==rid; }); });
      toast('Retired '+r.name); pplRepaint('rol');
    }});
}
const PPL_RISK_RANK = {critical:0, high:1, medium:2, low:3};
function pplRoleCard(r){
  const holders = PEOPLE.filter(function(p){ return (p.roles||[]).indexOf(r.id)>=0; });
  const via = GROUPS.filter(function(g){ return g.roles.indexOf(r.id)>=0; });
  const menu = [{label:'Who has it', icon:'people', onclick:"pplOpenRole('"+pplQ(r.id)+"')"},
                {label:'Retire bundle', icon:'archive', danger:true, onclick:"pplRoleRetireAsk('"+pplQ(r.id)+"')"}];
  return '<div><div class="panel">'
    + '<div class="panel-h">'+I2.shield+'<span>'+esc2(r.name)+'</span><div class="sp"></div>'
    + bdg(r.risk+" risk", r.risk==="critical"?"crit":r.risk==="high"?"warn":r.risk==="medium"?"info":"mut")+kebabHTML(menu)+'</div>'
    + '<div class="panel-b">'
    + '<div class="rowflex" style="margin-bottom:11px"><span class="count-lg">'+fmt(r.members)+'</span><span class="mutedtext">people hold it</span></div>'
    + '<div style="font-size:13.5px;line-height:1.6;margin-bottom:12px">'+esc2(r.desc)+'</div>'
    + '<div class="rowflex" style="margin-bottom:12px">'+r.privs.map(function(pv){ return bdg(pv,"mut"); }).join("")+'</div>'
    + '<div class="kvlist"><div class="r"><span class="k">Granted through</span><span class="v">'
    + (via.length ? via.map(function(g){ return esc2(g.name); }).join(", ") : '<span style="color:var(--warn)">No group — individual assignments only</span>')+'</span></div></div>'
    + '</div>'
    + '<div class="panel-f"><div class="avstack">'+holders.slice(0,6).map(function(p){ return avatar(p.name,"sm"); }).join("")
    + (r.members>6 ? '<div class="av2 sm more">+'+(r.members-6)+'</div>' : '')+'</div>'
    + '<div class="sp"></div><button class="btn sm ghost" onclick="pplOpenRole(\''+pplQ(r.id)+'\')">Who has it</button></div>'
    + '</div></div>';
}
function pplRolesPane(){
  return callout("ok","Access is granted by named bundle — Locality Secretary, Safeguarding Lead, Regional Office — never table by table. "
      + "A bundle is a sentence a coordinator can read. A permission matrix is not, and it does not survive a thousand people.")
    + '<div style="height:14px"></div>'
    + listFrame("ppl-roles", {
        items: ROLES, repaint: function(){ pplRepaint('rol'); }, noun: "bundles", noun1: "bundle", size: 10,
        search: function(r){ return r.name+' '+r.desc+' '+r.privs.join(' '); }, placeholder: "Search bundles by name or privilege…",
        sorts: [{key:"risk",    label:"Highest risk first", get:function(r){ return PPL_RISK_RANK[r.risk]==null ? 9 : PPL_RISK_RANK[r.risk]; }},
                {key:"name",    label:"Name",               get:function(r){ return r.name; }},
                {key:"members", label:"Most holders",       get:function(r){ return r.members; }, desc:true}],
        row: pplRoleCard, bodyClass: "g2",
        emptyTitle: "No bundle matches that", emptyIcon: "shield"
      });
}
function pplOpenRole(rid){
  const r = roleById(rid); if(!r) return;
  const holders = PEOPLE.filter(function(p){ return (p.roles||[]).indexOf(rid)>=0; });
  const via = GROUPS.filter(function(g){ return g.roles.indexOf(rid)>=0; });
  const direct = holders.filter(function(p){ return pplRoleSource(p,rid).length===0; });
  openModal('<h3>'+esc2(r.name)+'</h3>'
    + '<div class="msub">'+fmt(r.members)+' people · '+esc2(r.risk)+' risk · '+r.privs.length+' privileges</div>'
    + '<div class="defblock" style="margin-bottom:14px">'+esc2(r.desc)+'</div>'
    + '<div style="font-weight:600;margin-bottom:8px">Privileges in this bundle</div>'
    + '<div class="rowflex" style="margin-bottom:16px">'+r.privs.map(function(pv){ return bdg(pv,"mut","check"); }).join("")+'</div>'
    + '<div style="font-weight:600;margin-bottom:8px">Granted through</div>'
    + '<div class="rowflex" style="margin-bottom:16px">'+(via.length ? via.map(function(g){ return bdg(g.name,"info","people"); }).join("") : '<span class="mutedtext">No group grants this bundle.</span>')+'</div>'
    + (direct.length ? callout("warn","<b>"+direct.length+" people hold this directly</b>, outside any group — "
        + direct.map(function(p){ return esc2(p.name); }).join(", ")
        + ". Individual assignments are exceptions. Every one of them lands on the next review campaign.")+'<div style="height:14px"></div>' : '')
    + '<div style="font-weight:600;margin-bottom:8px">Who has it, in this mockup</div>'
    + '<div class="g2" style="gap:8px">'
    + holders.slice(0,10).map(function(p){ return '<div class="clickable" onclick="closeModal();openPerson(\''+pplQ(p.name)+'\')">'+personChip(p.name,p.title+" · "+p.locality)+'</div>'; }).join("")
    + '</div>'
    + modalFoot("Close"), 680);
}

/* ---------- entitlement matrix ---------- */
function pplMatrixPane(){
  const legend = '<div class="legend" style="margin-top:12px">'
    + ["full","part","none","block"].map(function(k){
        const L=ACCESS_LEVELS[k];
        return '<span><i style="background:var(--'+(k==="full"?"ok-soft":k==="part"?"warn-soft":k==="none"?"hair2":"crit-soft")+')"></i>'+esc2(L.label)+' — '+esc2(L.note)+'</span>';
      }).join("")
    + '</div>';
  const body = '<div class="scrollx"><table class="matrix"><thead><tr><th class="rowh">Group</th>'
    + DATASETS.map(function(d){ return '<th>'+esc2(PPL_SHORT[d.id]||d.name)+'</th>'; }).join("")
    + '</tr></thead><tbody>'
    + GROUPS.map(function(g){
        return '<tr><th class="rowh">'+esc2(g.name)+'<div class="mutedtext" style="font-weight:400">'+fmt(g.members)+' people</div></th>'
          + DATASETS.map(function(d){
              const lv = accessFor(g.id,d.id), L = ACCESS_LEVELS[lv];
              return '<td><div class="cell '+lv+'" title="'+esc2(g.name+' · '+d.name+' — '+L.label)+'" onclick="pplCell(\''+pplQ(g.id)+'\',\''+pplQ(d.id)+'\')">'+L.short+'</div></td>';
            }).join("")
          + '</tr>';
      }).join("")
    + '</tbody></table></div>' + legend;
  return callout("warn","This matrix is for <b>scanning, not editing</b>. It is the fastest way to spot a row that looks wrong — "
      + "Platform Admins holding nothing, Finance holding only budgets, Care blocked all the way down. To change anything, open the group. "
      + "Bulk-editing "+ACCESS_STATS.cells+" cells is how mistakes happen at this scale.")
    + '<div style="height:14px"></div>'
    + panel("Groups &times; datasets", body, {icon:"grid", sub:GROUPS.length+" groups · "+DATASETS.length+" datasets · click any cell"});
}
function pplCell(gid, dsid){
  const g = groupById(gid), d = ds(dsid); if(!g||!d) return;
  const lv = accessFor(gid,dsid), L = ACCESS_LEVELS[lv], m = ENT_META[gid] || {};
  const listed = pplMembersOf(gid);
  openModal('<h3>'+esc2(g.name)+' &middot; '+esc2(d.name)+'</h3>'
    + '<div class="msub">'+esc2(d.tech)+'</div>'
    + '<div class="rowflex" style="margin-bottom:14px">'+bdg(L.label,L.cls,"lock")+sensBadge(d.sens)+certBadge(d)+'</div>'
    + callout(lv==="block"?"crit":lv==="none"?"mut":lv==="full"?"ok":"warn", esc2(L.note))
    + '<div style="height:14px"></div>'
    + (lv==="block"
        ? '<div class="defblock" style="margin-bottom:14px">'+esc2(d.exclusions)+'</div>'
        : '<div class="defblock" style="margin-bottom:14px">'+esc2(m.why||"")+'</div>')
    + '<div style="font-weight:600;margin-bottom:8px">Rules that shape this grant</div>'
    + '<div class="rowflex" style="margin-bottom:16px">'+pplRuleChips(d.rules)+'</div>'
    + '<div class="kvlist" style="margin-bottom:16px">'
    + '<div class="r"><span class="k">People affected</span><span class="v">'+fmt(g.members)+' — everyone in this group, nobody outside it</span></div>'
    + '<div class="r"><span class="k">Granted by</span><span class="v">'+esc2(m.by||"Platform Admin")+' on '+esc2(m.on||"08 Jan 2024")+'</span></div>'
    + '<div class="r"><span class="k">Source</span><span class="v">'+esc2(m.src||g.type)+'</span></div>'
    + '<div class="r"><span class="k">Reviewed</span><span class="v">'+esc2(m.review||"Annually")+'</span></div>'
    + '</div>'
    + (lv==="none" && dsid!=="care"
        ? callout("info","Nobody in this group holds it, and that is a normal state — not an error. Anyone here can ask for it, and the request goes to "+esc2(d.owner)+".")
        : '')
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    + '<button class="btn" onclick="closeModal();openDataset(\''+pplQ(d.id)+'\')">Open dataset</button>'
    + (listed.length ? '<button class="btn pri" onclick="closeModal();startSim(\''+pplQ(listed[0].name)+'\')">'+I2.eye+' Simulate a member</button>' : '')
    + '</div>', 640);
}

/* ---------- activity pane ---------- */
function pplActivityRow(e){
  return '<div class="lrow" onclick="go(\'audit\')"><div class="li">'+(I2[PPL_KIND_ICON[e.kind]]||I2.log)+'</div>'
    + '<div class="lm"><div class="lt">'+esc2(e.what)+' '+bdg(e.kind, e.cls)+'</div>'
    + '<div class="ls">'+esc2(e.detail)+'</div></div>'
    + '<div class="lr">'+esc2(e.who)+' · '+esc2(e.when)+'</div></div>';
}
function pplActivityPane(){
  return panel("Recent changes to who can see what",
    listFrame("ppl-act", {
      items: ACCESS_EVENTS, repaint: function(){ pplRepaint('act'); }, noun: "changes", noun1: "change", size: 10,
      search: function(e){ return e.what+' '+e.detail+' '+e.who+' '+e.kind; }, placeholder: "Search changes by person, dataset or kind…",
      sorts: [{key:"newest", label:"Newest first", get:function(e){ return ACCESS_EVENTS.indexOf(e); }},
              {key:"kind",   label:"Kind",         get:function(e){ return e.kind; }},
              {key:"who",    label:"Who did it",   get:function(e){ return e.who; }}],
      row: pplActivityRow,
      notOurs: "Append-only — the full record is in the Activity log"
    }),
    {icon:"log", tight:true,
     foot:"Group syncs, grants, revocations, denials and expiries all land here. The full log — including reads and exports — is in the activity log."});
}

/* ---------- the page ---------- */
function renderPeople(){
  const rev = REVIEWS[0];
  const kpis = '<div class="g4" style="margin-bottom:18px">'
    + kpi("People", fmt(ORG.users), fmt(ORG.activeThisWeek)+" asked something this week")
    + kpi("Groups and bundles", GROUPS.length+" / "+ROLES.length, "A bundle is a set of permissions; a group carries bundles; every grant hangs off one of these")
    + kpi("Grants bound to a person", "0", fmt(ACCESS_STATS.grants)+" grants, all of them held by a group")
    + kpi("Dormant access", ACCESS_STATS.dormant, ACCESS_STATS.dormantPct+"% of people, granted and barely used")
    + '</div>';
  const revbar = '<div class="panel" style="margin-bottom:18px"><div class="panel-b"><div class="rowflex">'
    + I2.shield + '<b>'+esc2(rev.name)+'</b>'
    + '<span class="mutedtext">'+rev.decided+' of '+rev.total+' decided · owned by '+esc2(rev.owner)+' · due '+esc2(rev.due)+'</span>'
    + '<div class="sp"></div><div style="width:180px">'+meter(rev.progress, rev.progress>=80?"ok":"warn")+'</div>'
    + '<b class="mono">'+rev.progress+'%</b>'
    + '<button class="btn sm" onclick="toast(\'Sign-off is blocked until all 30 items are decided\')">Sign off</button>'
    + '</div><div class="mutedtext" style="margin-top:9px">'+esc2(rev.note)+'</div></div></div>';

  $('#view-people').innerHTML =
      pageHead({eyebrow:"Govern", title:"People & access",
        desc:"Who is here, what they are allowed to see, and how each of those permissions got there. "
           + "Every answer Spiff gives runs as its owner and re-checks this page on every single run.",
        badges: bdg(ORG.tenant,"mut","db") + bdg("Directory sync "+ACCESS_STATS.lastSync,"info","refresh") + bdg("Reviewed quarterly","ok","shield"),
        acts: '<button class="btn" onclick="pplSimPicker()">'+I2.eye+' View as someone else</button>'
            + '<button class="btn" onclick="go(\'myaccess\')">'+I2.lock+' My access</button>'
            + '<button class="btn pri" onclick="pplBulk(\'review\')">'+I2.check+' Start a review</button>'})
    + kpis + revbar
    + tabsHTML("ppl", [["dir","People",PEOPLE.length],["grp","Groups",GROUPS.length],["rol","Bundles",ROLES.length],
                       ["mtx","Who can see what",ACCESS_STATS.cells],
                       ["app","Decisions",(typeof macApps==="function"?macApps().length:0)],
                       ["rev","Access reviews",(typeof macRevs==="function"?macRevs().length:0)],
                       ["act","Activity",ACCESS_EVENTS.length]], "dir")
    + pane("ppl","dir", pplDirPane(), true)
    + pane("ppl","grp", pplGroupsPane())
    + pane("ppl","rol", pplRolesPane())
    + pane("ppl","mtx", pplMatrixPane())
    + pane("ppl","app", '<div id="mac-app-body"></div>')
    + pane("ppl","rev", '<div id="mac-rev-body"></div>')
    + pane("ppl","act", pplActivityPane());
  /* the two queues that moved here from My access on 9 Sep 2026 */
  try{ if(typeof macRenderApp==="function") macRenderApp(); if(typeof macRenderRev==="function") macRenderRev(); }catch(e){}
  const box=$('#ppl-q'); if(box) box.value = PPL_STATE.q;
}
V2ROUTES.people = renderPeople;

function pplSimPicker(){
  openModal('<h3>View as someone else</h3>'
    + '<div class="msub">A preview, scoped to them. Nothing is shared, nothing is sent, and the switch is written to the activity log under your name.</div>'
    + '<div class="g2" style="gap:8px;max-height:52vh;overflow-y:auto">'
    + PEOPLE.filter(function(p){ return !p.me; }).slice(0,16).map(function(p){
        return '<div class="clickable" onclick="closeModal();startSim(\''+pplQ(p.name)+'\')">'+personChip(p.name, p.title)+'</div>';
      }).join("")
    + '</div>' + modalFoot("Cancel"), 660);
}

/* ---------- person profile ---------- */
function openPerson(name){ go("person", name); }

function pplQuestionsFor(p){
  const gids = pplGroupsOf(p);
  const open = DATASETS.filter(function(d){ const l=pplLevel(gids,d.id); return (l==="full"||l==="part") && d.questions.length; });
  const h = pplHash(p.name), when = ["earlier today","yesterday","2 days ago","last week"];
  return open.slice(0,3).map(function(d,i){
    return {q: d.questions[(h+i) % d.questions.length], ds:d, when: when[(h+i) % when.length]};
  });
}
function pplAutosFor(p){
  const h = pplHash(p.name), n = 1 + (h % 3), out = [];
  for(let i=0;i<n;i++){ const t = PPL_AUTO_TPL[(h+i*3) % PPL_AUTO_TPL.length];
    out.push({name:t[0], cadence:t[1], scope:t[2], recips:2+((h+i)%9), last:["this morning 07:02","yesterday 16:00","3 days ago"][(h+i)%3],
              cloned: i===1 ? "Copied from Reneilwe's cluster pack, 3 Mar" : null}); }
  return out;
}
function pplHistory(p){
  const ev = ACCESS_EVENTS.filter(function(e){ return e.what.indexOf(p.name)>=0 || e.who===p.name; });
  const g0 = groupById(pplGroupsOf(p)[1] || "all-staff");
  const base = [
    {what:"Added to "+(g0?g0.name:"All staff"), detail:pplGrantSource(p, g0?g0.id:"all-staff"), when:(ENT_META[g0?g0.id:"all-staff"]||{}).on || "08 Jan 2024", cls:"ok"},
    {what:"Account created", detail:"Synced from Directory. Spiff has never created a user by hand.", when:"08 Jan 2024", cls:"mut"}
  ];
  return ev.concat(base);
}
function pplLastReview(p){
  const hit = pplReviewItem(p.name);
  const h = pplHash(p.name);
  const dates = ["12 Jun 2026","28 May 2026","02 Jul 2026","19 Apr 2026"];
  const who = ["Sindi Mthembu","Reneilwe Dlomo","Cathleen Oberholzer","Rupert Mackenzie"];
  return {on: dates[h%4], by: who[(h>>2)%4], campaign: hit ? hit.campaign : null, item: hit ? hit.item : null};
}

/* ---------- individual access, grouped by system ----------
   This was one flat table of every dataset. Grouping it by the system that
   holds the data matches how access is actually granted and revoked, and it
   is the only shape that survives a catalogue several times this size —
   finding 3.6 of the scale review. Two tiles to a row. */
function pplSeeCard(p, sysId, list){
  const S = sysById(sysId) || {name:sysId, color:"#5B6B7C"};
  const cnt = {full:0, part:0, none:0, block:0};
  list.forEach(function(d){ cnt[pplAccess(p, d.id).level]++; });
  const reach = cnt.full + cnt.part;

  /* what they can reach first, what they can never reach last. ACCESS_RANK is
     not the right order here — it ranks "block" highest because block wins when
     resolving a grant, which is the opposite of reading order. */
  const SEE_ORDER = {full:0, part:1, none:2, block:3};
  const rows = list.slice().sort(function(a,b){
    const x = SEE_ORDER[pplAccess(p,a.id).level], y = SEE_ORDER[pplAccess(p,b.id).level];
    return x !== y ? x - y : (a.name < b.name ? -1 : 1);
  }).map(function(d){
    const a = pplAccess(p, d.id), L = ACCESS_LEVELS[a.level];
    const via = a.via.length ? 'via '+a.via.map(esc2).join(", ")
      : a.level === "block" ? 'Policy — no group can grant it'
      : 'No group of theirs holds it';
    return '<div class="accrow '+a.level+'">'
      + '<div class="accmain">'
      +   '<div class="accnm clickable" onclick="openDataset(\''+pplQ(d.id)+'\')">'+esc2(d.name)+'</div>'
      +   '<div class="accvia'+(a.level==="block"?" crit":"")+'">'+via+'</div>'
      + '</div>'
      + '<div class="accside">'+bdg(L.label, L.cls)
      +   (d.sens !== "Internal" ? '<span class="accsens" title="'+esc2(d.sens)+' data">'+esc2(d.sens)+'</span>' : '')
      +   (a.level === "none" && d.id !== "care"
            ? '<button class="btn sm ghost" onclick="requestAccessModal(\''+pplQ(d.id)+'\')">Request</button>' : '')
      + '</div></div>';
  }).join("");

  return '<div class="panel acctile">'
    + '<div class="panel-h"><span class="accdot" style="background:'+S.color+'"></span>'
    +   '<span>'+esc2(S.name)+'</span><div class="sp"></div>'
    +   '<span class="mutedtext" style="font-size:12px">'+reach+' of '+list.length+' reachable</span></div>'
    + '<div class="panel-b" style="padding-top:10px">'
    +   '<div class="accbar" title="'+cnt.full+' full, '+cnt.part+' partial, '+cnt.none+' none, '+cnt.block+' blocked">'
    +     (cnt.full  ? '<i class="full"  style="flex:'+cnt.full+'"></i>'  : '')
    +     (cnt.part  ? '<i class="part"  style="flex:'+cnt.part+'"></i>'  : '')
    +     (cnt.none  ? '<i class="none"  style="flex:'+cnt.none+'"></i>'  : '')
    +     (cnt.block ? '<i class="block" style="flex:'+cnt.block+'"></i>' : '')
    +   '</div>'
    +   rows
    + '</div></div>';
}
function pplSeeTiles(p){
  const order = SYSTEMS.map(function(s){ return s.id; });
  const bySys = {};
  DATASETS.forEach(function(d){ (bySys[d.sys] || (bySys[d.sys] = [])).push(d); });
  /* any system not in SYSTEMS still gets a tile rather than vanishing */
  Object.keys(bySys).forEach(function(k){ if(order.indexOf(k) < 0) order.push(k); });
  const cards = order.filter(function(k){ return bySys[k] && bySys[k].length; })
                     .map(function(k){ return pplSeeCard(p, k, bySys[k]); }).join("");
  return '<div class="g2 acctiles">'+cards+'</div>';
}

function renderPerson(name){
  const p = personByName(name || ME.full) || PEOPLE[0];
  const gids = pplGroupsOf(p), c = pplCounts(p), rv = pplLastReview(p);
  const tb = ACCESS_TIMEBOUND.filter(function(t){ return t.who===p.name; });
  const direct = pplDirectRoles(p);
  crumbTrail([["Access administration","go('people')"], [esc2(p.name), null]]);

  const main =
      panel("What "+esc2(p.name.split(" ")[0])+" can see",
        pplSeeTiles(p),
        {icon:"db", tight:true, sub:c.full+" full · "+c.part+" partial · "+c.none+" none · "+c.block+" blocked",
         foot:"Grouped by the system that holds the data, because that is how access is granted and how it is revoked. Resolved the same way a live question resolves it: the union of their groups, minus every rule that applies. Nothing here is cached."})

    + panel("Recent questions",
        (pplQuestionsFor(p).length
          ? pplQuestionsFor(p).map(function(q){
              return '<div class="lrow" onclick="openDataset(\''+pplQ(q.ds.id)+'\')"><div class="li">'+I2.msg+'</div>'
                + '<div class="lm"><div class="lt">'+esc2(q.q)+'</div><div class="ls">'+esc2(q.ds.name)+'</div></div>'
                + '<div class="lr">'+esc2(q.when)+'</div></div>';
            }).join("")
          : emptyState("No questions yet","This person has access but has not used it — which is exactly what the dormant filter looks for.","msg")),
        {icon:"msg", tight:true, sub:fmt(p.asked)+" asked in total"})

    + panel("Automations",
        pplAutosFor(p).map(function(a){
          return '<div class="lrow" onclick="go(\'autos\')"><div class="li">'+I2.bolt+'</div>'
            + '<div class="lm"><div class="lt">'+esc2(a.name)+' '+bdg("Runs as "+p.name.split(" ")[0],"info","play")
            + (a.cloned ? ' '+bdg(a.cloned,"purple","copy") : '')+'</div>'
            + '<div class="ls">'+esc2(a.cadence)+' · '+esc2(a.scope)+' · '+a.recips+' recipients</div></div>'
            + '<div class="lr">'+esc2(a.last)+'</div></div>';
        }).join(""),
        {icon:"bolt", tight:true,
         foot:"Each of these runs as "+esc2(p.name)+" and re-checks their permissions every run. If someone shares one, it is cloned — the copy runs as its new owner and sees only what that person sees."})

    + panel("Access history",
        '<div class="tline">'+pplHistory(p).map(function(e){
          return '<div class="tev"><div class="td3 '+(e.cls||"mut")+'"></div>'
            + '<div class="tt2">'+esc2(e.what)+'</div><div class="ts2">'+esc2(e.detail)+'</div>'
            + '<div class="tw">'+esc2(e.when)+'</div></div>';
        }).join("")+'</div>', {icon:"log"});

  const side =
      panel("Profile",
        '<div class="kvlist">'
        + '<div class="r"><span class="k">Team <span class="mutedtext" style="font-size:11px" title="No system of record holds a team. Spiff reads it from the role Connect gives this person.">· from Connect</span></span><span class="v">'+esc2(p.team)+'</span></div>'
        + '<div class="r"><span class="k">Locality</span><span class="v">'+esc2(p.locality)+'</span></div>'
        + '<div class="r"><span class="k">Country</span><span class="v">'+esc2(p.country)+'</span></div>'
        + '<div class="r"><span class="k">Scope tier</span><span class="v">'+bdg(pplTier(p),"info")+'<span class="mutedtext" style="margin-left:7px;font-size:12px">'+esc2(TIER_NOTE[pplTier(p)]||"")+'</span></span></div>'
        + '<div class="r"><span class="k">Manager</span><span class="v clickable" onclick="openPerson(\''+pplQ(pplManager(p))+'\')">'+esc2(pplManager(p))+'</span></div>'
        + '<div class="r"><span class="k">Status</span><span class="v">'+pplStatusBadge(p)+'</span></div>'
        + '<div class="r"><span class="k">Last active</span><span class="v">'+esc2(p.last)+'</span></div>'
        + '<div class="r"><span class="k">Questions asked</span><span class="v mono">'+fmt(p.asked)+'</span></div>'
        + '<div class="r"><span class="k">Scope</span><span class="v">'+(p.roles.indexOf("national")>=0 ? "The whole region, aggregate only" : pplTierScope(p))+'</span></div>'
        + '</div>'
        + (p.flag ? '<div style="height:12px"></div>'+callout("warn",esc2(p.flag)) : ''),
        {icon:"people"})

    + panel("Roles and groups",
        (p.roles||[]).map(function(r){
          const R = roleById(r); if(!R) return "";
          const src = pplRoleSource(p,r);
          return '<div class="swrow"><div class="sl"><div class="sn">'+esc2(R.name)+' '
            + bdg(R.risk+" risk", R.risk==="critical"?"crit":R.risk==="high"?"warn":"mut")+'</div>'
            + '<div class="sd">'+(src.length ? "Through "+src.map(function(s){return esc2(s);}).join(" and ")
                : '<span style="color:var(--warn)">Held directly, outside any group. Exceptions like this land on the next review.</span>')+'</div></div></div>';
        }).join("")
        + gids.map(function(g){
            const G = groupById(g); if(!G) return "";
            return '<div class="swrow"><div class="sl"><div class="sn clickable" onclick="pplOpenGroup(\''+pplQ(g)+'\')">'+esc2(G.name)+' '
              + bdg(G.type, /Synced/.test(G.type)?"info":/Attribute/.test(G.type)?"purple":"mut")+'</div>'
              + '<div class="sd">'+esc2(pplGrantSource(p,g))+'</div></div></div>';
          }).join(""),
        {icon:"shield", sub:(p.roles||[]).length+" roles · "+gids.length+" groups",
         foot: direct.length ? direct.length+" role"+(direct.length>1?"s":"")+" held outside a group" : "Every role here comes from a group"})

    + panel("Time-bound access",
        (tb.length
          ? tb.map(function(t){
              const d = ds(t.dataset), L = ACCESS_LEVELS[t.level];
              return '<div class="swrow"><div class="sl"><div class="sn">'+esc2(d?d.name:t.dataset)+' '+bdg(L.label,L.cls)+'</div>'
                + '<div class="sd">'+esc2(t.reason)+'<br>Granted '+esc2(t.granted)+' by '+esc2(t.by)+' · expires <b>'+esc2(t.expires)+'</b> ('+t.days+' days)</div></div>'
                + '<button class="btn sm'+(t.days<=30?" danger":"")+'" onclick="pplRenew(\''+pplQ(t.who)+'\',\''+pplQ(t.dataset)+'\')">Renew</button></div>';
            }).join("")
          : '<div class="mutedtext">No individual exceptions. Everything '+esc2(p.name.split(" ")[0])+' holds comes from a group and lasts exactly as long as that membership does.</div>'),
        {icon:"clock", sub: tb.length ? tb.length+" grants with an end date" : "Clean",
         foot:"Every grant made outside a group carries an expiry. Renewal is a smaller conversation than revocation."})

    + panel("Access review",
        '<div class="kvlist">'
        + '<div class="r"><span class="k">Last reviewed</span><span class="v">'+esc2(rv.on)+'</span></div>'
        + '<div class="r"><span class="k">By</span><span class="v">'+esc2(rv.by)+'</span></div>'
        + '<div class="r"><span class="k">Outcome</span><span class="v">'
        +   (rv.item && rv.item.flag ? bdg(rv.item.flag,"warn","warn")
             : rv.campaign && rv.campaign.state !== "signed-off" ? bdg("Awaiting decision","info","clock")
             : bdg("Kept — standard for role","ok","check"))+'</span></div>'
        + '</div>'
        + (rv.campaign ? '<div style="height:12px"></div>'+callout(rv.item && rv.item.flag ? "warn" : "mut",
            "On the <b>"+esc2(rv.campaign.name)+"</b> campaign, due "+esc2(rv.campaign.due)+", owned by "+esc2(rv.campaign.owner)+". "
            + (rv.item ? "Normality check: "+esc2(rv.item.normal)+". Last used "+esc2(rv.item.lastUsed)+"." : "")) : ''),
        {icon:"check"});

  $('#view-person').innerHTML =
      pageHead({eyebrow:"Person", title:esc2(p.name), back:"go('people')",
        desc: esc2(p.title)+" · "+esc2(p.team)+" · "+esc2(p.locality),
        badges: pplStatusBadge(p) + bdg("Manager: "+pplManager(p),"mut","people") + bdg("Last active "+p.last,"mut","clock")
              + bdg(c.full+" full · "+c.part+" partial of "+DATASETS.length+" datasets","info","db"),
        acts: '<button class="btn pri" onclick="startSim(\''+pplQ(p.name)+'\')">'+I2.eye+' View Spiff as this person</button>'
            + '<button class="btn" onclick="pplPersonReview(\''+pplQ(p.name)+'\')">'+I2.check+' Review their access</button>'})
    + callout("info","Nothing on this page is a stored copy. Every line resolves live from "+esc2(p.name.split(" ")[0])
        + "&rsquo;s groups and the rules that apply to them — the same resolution a question of theirs would trigger. "
        + "Use <b>View Spiff as this person</b> to see it from their side.")
    + '<div style="height:18px"></div>'
    + '<div class="split">'
      + '<div>'+main+'</div>'
      + '<div>'+side+'</div>'
    + '</div>';
}
V2ROUTES.person = renderPerson;

function pplRenew(who, dsid){
  const d = ds(dsid);
  openModal('<h3>Renew time-bound access</h3>'
    + '<div class="msub">'+esc2(who)+' · '+esc2(d?d.name:dsid)+'</div>'
    + callout("info","Renewing extends the same grant. It does not widen it — the level, the masking and the row scope all stay exactly as they are.")
    + '<div style="height:14px"></div>'
    + '<div class="field"><label>New end date</label><select id="ppl-pick"><option>90 days — 29 Nov 2026</option><option>180 days — 27 Feb 2027</option><option>12 months — 31 Aug 2027</option></select></div>'
    + '<div class="field"><label>Reason — recorded against your name</label><div class="fcontrol">'
    + '<textarea id="ppl-reason" rows="3" placeholder="Why does this still need to be open?"></textarea></div></div>'
    + modalFoot("Cancel","Renew","pplRenewGo()"), 560);
}
function pplRenewGo(){
  const box=$('#ppl-reason'), reason = box ? box.value.trim() : "";
  if(reason.length < 6){ toast("Add a reason. Renewals are reviewed like grants."); if(box) box.focus(); return; }
  closeModal(); toast("Renewed. The new end date is on the grant and on the next review.");
}
function pplPersonReview(name){
  const p = personByName(name); if(!p) return;
  const c = pplCounts(p);
  openModal('<h3>Review access for '+esc2(p.name)+'</h3>'
    + '<div class="msub">'+esc2(p.title)+' · '+esc2(p.locality)+'</div>'
    + callout("warn","<b>"+(c.full+c.part)+" grants</b> to decide — "+c.full+" full and "+c.part+" partial. "
      + "Keep needs a justification. Revoke takes effect on their next question, not overnight.")
    + '<div style="height:14px"></div>'
    + '<div class="field"><label>Decision</label><select id="ppl-pick"><option>Keep everything — standard for role</option><option>Keep, but shorten to 90 days</option><option>Revoke the dormant grants only</option><option>Revoke everything and suspend</option></select></div>'
    + '<div class="field"><label>Justification — recorded against your name</label><div class="fcontrol">'
    + '<textarea id="ppl-reason" rows="3" placeholder="Auditors read this field."></textarea></div></div>'
    + modalFoot("Cancel","Record decision","pplBulkConfirm(\'review\')"), 580);
}
</script>
