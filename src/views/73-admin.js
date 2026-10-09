<script>
/* =====================================================================
   Admin — 11 Sep 2026
   Everything that has to be created for it to exist, created in one place.
   Until now a team existed because the fixture said so; a Manual group and
   a bundle likewise; and the only way to become a system admin was to be
   born one. Each of those now has a popup here, and the things created
   elsewhere (a rule, a connector, a source, an automation, a definition)
   are listed with a link to where, so nobody has to guess.

   Nothing here is granted to a person directly. A team is a workspace and a
   distribution list; a group is what grants access; a bundle is what a
   group grants. Those distinctions are written on the screen.
   ===================================================================== */

const ADM = { tab:"teams", pick:{} };
const ADM_COLOURS = ["#1F52A0","#1E8449","#8E44AD","#C77E12","#0E7C86","#B0357A","#5B6B7C","#2E7CD6"];
const ADM_PRIVS = ["Ask questions","Open shared answers","Save to my workspace","Pin dashboard tiles","Schedule delivery",
  "Publish to library","Build automations","Export summary","Export detail","Locality detail rows","Cross-locality detail",
  "Approve access","Approve access (country)","Author business rules","Edit dataset metadata","Certify datasets",
  "Metric definitions","Minor records","Care flags","Purpose-bound access","Whole region (aggregate)","Statutory exports",
  "View activity log (country)","Full activity log","Manage connectors","Manage automation blocks","Set quotas"];

/* teams carry a manager and a member list now; the fixture only had counts */
const TEAM_META = {};
(function(){
  TEAMS.forEach(function(t){
    /* people records carry a short team name ("Finance"); the workspace carries the long one ("Finance & Cost") */
    const first = t[0].split(/[\s&]+/)[0].toLowerCase();
    const inTeam = function(p){ return p.team === t[0] || String(p.team||"").toLowerCase().split(/[\s&]+/)[0] === first; };
    const members = PEOPLE.filter(inTeam).map(function(p){ return p.name; });
    const mgr = PEOPLE.filter(function(p){ return inTeam(p) && /Manager|Lead|Head|Director/i.test(p.title); })[0];
    TEAM_META[t[0]] = { manager: mgr ? mgr.name : (members[0] || null), members: members, created:"Before Spiff", by:"Directory import" };
  });
})();
CRUMB.admin = "Admin";

const admQ = function(s){ return esc2(String(s==null?"":s).replace(/\\/g,"\\\\").replace(/'/g,"\\'")); };
function admInitials(name){ return name.split(/\s+/).map(function(w){ return w[0]||""; }).join("").slice(0,2).toUpperCase(); }
function admSlug(name){ return name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function admPeopleOptions(sel){
  return PEOPLE.slice().sort(function(a,b){ return a.name.localeCompare(b.name); }).map(function(p){
    return '<option value="'+esc2(p.name)+'"'+(p.name===sel?' selected':'')+'>'+esc2(p.name)+' — '+esc2(p.title)+'</option>'; }).join('');
}
function admRepaint(tab){ if(tab) ADM.tab = tab; renderAdmin(); }
function admInput(id, label, placeholder, value){
  return '<div class="field"><label>'+esc2(label)+'</label><input class="txt" id="'+id+'" placeholder="'+esc2(placeholder||"")+'" value="'+esc2(value||"")+'"></div>';
}
function admSelect(id, label, optionsHTML){
  return '<div class="field"><label>'+esc2(label)+'</label><select class="txt" id="'+id+'">'+optionsHTML+'</select></div>';
}
function admVal(id){ const el=$('#'+id); return el ? String(el.value||"").trim() : ""; }

/* ---------- the people picker: search a pre-populated list, tick who belongs ---------- */
function admPickState(id){ if(!ADM.pick[id]) ADM.pick[id] = {q:"", sel:[]}; return ADM.pick[id]; }
function admPickQ(id, v){ admPickState(id).q = v; admPickPaint(id); }
function admPickToggle(id, name, on){
  const s = admPickState(id);
  if(on && s.sel.indexOf(name) < 0) s.sel.push(name);
  if(!on) s.sel = s.sel.filter(function(x){ return x !== name; });
  admPickPaint(id);
}
function admPickPaint(id){ const el = $('#adm-pick-'+id); if(el) el.innerHTML = admPickerInner(id); }
function admPickerInner(id){
  const s = admPickState(id), q = s.q.trim().toLowerCase();
  const list = PEOPLE.filter(function(p){ return !q || (p.name+' '+p.title+' '+p.team+' '+p.locality).toLowerCase().indexOf(q) >= 0; })
    .sort(function(a,b){ return a.name.localeCompare(b.name); });
  const shown = list.slice(0, 10), more = list.length - shown.length;
  return '<div class="pp-sel">'+(s.sel.length
      ? s.sel.map(function(n){ return '<span class="bdg info">'+esc2(n)+'<button type="button" class="pp-x" aria-label="Remove '+esc2(n)+'" onclick="admPickToggle(\''+id+'\',\''+admQ(n)+'\',false)">×</button></span>'; }).join('')
      : '<span class="mutedtext" style="font-size:12.5px">Nobody picked yet</span>')+'</div>'
    + '<div class="pp-q">'+I2.search+'<input value="'+esc2(s.q)+'" placeholder="Find a person by name, title, team or locality…" oninput="admPickQ(\''+id+'\',this.value)"></div>'
    + '<div class="pp-list">'
    + shown.map(function(p){
        const on = s.sel.indexOf(p.name) >= 0;
        return '<label class="pp-row"><input type="checkbox"'+(on?' checked':'')+' onchange="admPickToggle(\''+id+'\',\''+admQ(p.name)+'\',this.checked)">'
          + avatar(p.name,"sm")+'<span class="pp-n">'+esc2(p.name)+'</span><span class="pp-t">'+esc2(p.title)+' · '+esc2(p.locality)+'</span></label>';
      }).join('')
    + (more > 0 ? '<div class="pp-more">and '+fmt(more)+' more — refine the search</div>' : '')
    + (!list.length ? '<div class="pp-more">Nobody matches that.</div>' : '')
    + '</div>';
}
function admPicker(id, label, preset){
  const s = admPickState(id); s.q = ""; s.sel = (preset||[]).slice();
  return '<div class="field"><label>'+esc2(label)+' <span class="mutedtext" style="font-weight:400;text-transform:none;letter-spacing:0">— from the '+fmt(PEOPLE.length)+' people Directory knows</span></label>'
    + '<div class="pickpeople" id="adm-pick-'+id+'">'+admPickerInner(id)+'</div></div>';
}

/* =====================================================================
   Teams
   ===================================================================== */
function admTeamModal(name){
  const editing = !!name, t = editing ? teamByName(name) : null, m = editing ? TEAM_META[name] : null;
  wizardOpen({
    title: editing ? 'Edit '+esc2(name) : 'Create a team',
    intro: 'A team is a shared workspace and a distribution list. It grants nobody any data — every answer in it re-runs for whoever opens it.',
    finish: editing ? 'Save changes' : 'Create team', width: 600,
    data: { existing: editing ? name : '', name: editing ? name : '', purpose: editing ? t[5] : '', manager: m ? m.manager : '', members: m ? m.members.slice() : [] },
    steps: [
      { name:'Name', render:function(d){ return admInput('adm-t-name','Team name','e.g. Events Operations',d.name) + admInput('adm-t-purpose','What it is for','One line the team would recognise',d.purpose)
            + '<div class="wz-note">The name is what members see on Team workspace and on an automation\'s recipients. Keep it the way people already say it.</div>'; },
        collect:function(){ return { name: admVal('adm-t-name'), purpose: admVal('adm-t-purpose') }; },
        validate:function(d){ if(!d.name) return 'Give the team a name'; if(!d.existing && teamByName(d.name)) return 'A team called '+d.name+' already exists'; } },
      { name:'Manager', render:function(d){ return admSelect('adm-t-mgr','Team manager',admPeopleOptions(d.manager||null))
            + '<div class="wz-note">The manager owns the team\'s shared list: what is in it, who is on it. They are a member automatically. Being manager grants no data — that still comes from their groups.</div>'; },
        collect:function(){ return { manager: admVal('adm-t-mgr') }; } },
      { name:'Members', render:function(d){ return admPicker('team','Members',d.members); },
        collect:function(){ return { members: admPickState('team').sel.slice() }; } }
    ],
    onFinish: admTeamSave
  });
}
function admTeamSave(d){
  const existing = d.existing, name = d.name, purpose = d.purpose, mgr = d.manager, members = d.members.slice();
  if(mgr && members.indexOf(mgr) < 0) members.unshift(mgr);
  if(existing){
    const t = teamByName(existing); t[0] = name; t[5] = purpose || t[5]; t[3] = members.length; t[4] = "You + "+Math.max(0,members.length-1)+" members";
    LIBRARY.forEach(function(l){ if(l.team === existing) l.team = name; });
    const meta = TEAM_META[existing]; delete TEAM_META[existing]; TEAM_META[name] = Object.assign(meta, {manager:mgr, members:members});
    toast('Saved '+name);
  } else {
    TEAMS.push([name, ADM_COLOURS[TEAMS.length % ADM_COLOURS.length], admInitials(name), members.length, "You + "+Math.max(0,members.length-1)+" members", purpose || "No purpose written yet.", "—"]);
    TEAM_META[name] = {manager:mgr, members:members, created:"just now", by:ME.full||"you"};
    toast('Created '+name+' — it is on Team workspace now');
  }
  admRepaint('teams');
}
function admTeamDeleteAsk(name){
  const t = teamByName(name); if(!t) return;
  const shared = LIBRARY.filter(function(l){ return l.team === name; }).length;
  confirmAsk({title:'Delete the team “'+esc2(name)+'”?',
    body:(shared ? fmt(shared)+' shared answer'+(shared===1?'':'s')+' leave the team workspace; the people who own them keep them in My workspace. ' : 'It has no shared answers. ')
      + 'Members lose nothing else — a team grants no data.',
    verb:'Delete', onConfirm:function(){
      const i = TEAMS.indexOf(t); if(i>=0) TEAMS.splice(i,1);
      for(let k=LIBRARY.length-1;k>=0;k--){ if(LIBRARY[k].team===name) LIBRARY.splice(k,1); }
      if(typeof DASHBOARDS!=="undefined"){ for(let k=DASHBOARDS.length-1;k>=0;k--){ if(DASHBOARDS[k].type==="team"&&DASHBOARDS[k].team===name) DASHBOARDS.splice(k,1); } }
      delete TEAM_META[name]; const c=$('#lib-count'); if(c) c.textContent=LIBRARY.length;
      toast('Deleted '+name); admRepaint('teams');
    }});
}
function admTeamCard(t){
  const m = TEAM_META[t[0]] || {manager:"—", members:[]};
  const shared = LIBRARY.filter(function(l){ return l.team === t[0]; }).length;
  return '<div><div class="panel">'
    + '<div class="panel-h"><span class="ti" style="width:26px;height:26px;border-radius:8px;background:'+t[1]+';color:#fff;display:grid;place-items:center;font-size:11px;font-weight:700;flex:none">'+esc2(t[2])+'</span>'
    +   '<span>'+esc2(t[0])+'</span><div class="sp"></div>'+bdg(fmt(m.members.length)+' members','mut','people')
    +   kebabHTML([{label:'Open the team workspace', icon:'grid', onclick:"setLibTeam('"+admQ(t[0])+"');go('library')"},
                   {label:'Edit team and members', icon:'pencil', onclick:"admTeamModal('"+admQ(t[0])+"')"},
                   {label:'Delete team', icon:'trash', danger:true, onclick:"admTeamDeleteAsk('"+admQ(t[0])+"')"}])+'</div>'
    + '<div class="panel-b">'
    +   '<div style="font-size:13.5px;line-height:1.55;margin-bottom:12px">'+esc2(t[5])+'</div>'
    +   '<div class="kvlist"><div class="r"><span class="k">Manager</span><span class="v">'+(m.manager ? personChip(m.manager,'') : '<span class="mutedtext">Not set — edit the team</span>')+'</span></div>'
    +   '<div class="r"><span class="k">Members</span><span class="v"><div class="avstack">'+m.members.slice(0,6).map(function(n){ return avatar(n,"sm"); }).join('')
    +     (m.members.length>6?'<div class="av2 sm more">+'+(m.members.length-6)+'</div>':'')+'</div></span></div>'
    +   '<div class="r"><span class="k">Shared answers</span><span class="v">'+fmt(shared)+'</span></div>'
    +   '<div class="r"><span class="k">Created</span><span class="v">'+esc2(m.created||"—")+(m.by?' · '+esc2(m.by):'')+'</span></div></div>'
    + '</div></div></div>';
}
function admTeamsPane(){
  return callout("info","<b>A team is a workspace and a distribution list.</b> It decides who sees the shared list and who is on an automation's recipients. It grants nobody a single row — access comes from groups, on the next tab.")
    + '<div style="height:14px"></div>'
    + listFrame("adm-teams", {
        items: TEAMS, repaint: function(){ admRepaint('teams'); }, noun: "teams", noun1: "team", size: 10,
        search: function(t){ return t[0]+' '+t[5]+' '+(TEAM_META[t[0]]||{}).manager; }, placeholder: "Search teams by name, purpose or manager…",
        sorts: [{key:"name", label:"Name", get:function(t){ return t[0]; }},
                {key:"members", label:"Most members", get:function(t){ return (TEAM_META[t[0]]||{members:[]}).members.length; }, desc:true},
                {key:"shared", label:"Most shared answers", get:function(t){ return LIBRARY.filter(function(l){ return l.team===t[0]; }).length; }, desc:true}],
        row: admTeamCard, bodyClass: "g2",
        emptyTitle: "No teams yet", emptySub: "Create one and it appears on Team workspace for its members.", emptyIcon: "people"
      });
}

/* =====================================================================
   Groups (Manual) and bundles
   ===================================================================== */
function admGroupModal(){
  wizardOpen({
    title: 'Create a group',
    intro: 'A group is the only thing Spiff grants access to. People join it; it carries bundles; the bundles decide what its members can see. Nothing is ever granted to a person directly.',
    finish: 'Create group', width: 600,
    data: { name:'', tier:'Locality', review:'Quarterly', owner: ME.full, roles:[], members:[] },
    steps: [
      { name:'Name', render:function(d){ return admInput('adm-g-name','Group name','e.g. Northern Cluster secretaries',d.name)
            + '<div class="g2">'
            + admSelect('adm-g-tier','Tier it works at',TIERS.map(function(t){ return '<option'+(t===d.tier?' selected':'')+'>'+t+'</option>'; }).join(''))
            + admSelect('adm-g-review','Reviewed',['Quarterly','Monthly','Annually'].map(function(t){ return '<option'+(t===d.review?' selected':'')+'>'+t+'</option>'; }).join(''))
            + '</div>'
            + '<div class="wz-note">The tier is the widest scope any bundle in this group can reach. A Locality group can never see beyond its members\' localities, whatever it carries.</div>'; },
        collect:function(){ return { name: admVal('adm-g-name'), tier: admVal('adm-g-tier'), review: admVal('adm-g-review') }; },
        validate:function(d){ if(!d.name) return 'Give the group a name'; if(groupById(admSlug(d.name))) return 'A group called '+d.name+' already exists'; } },
      { name:'Grants', render:function(d){ return admSelect('adm-g-owner','Owner — accountable for who is in it',admPeopleOptions(d.owner))
            + '<div class="field"><label>Bundles it grants</label><div class="ckgrid">'
            + ROLES.map(function(r){ return '<label class="ckrow"><input type="checkbox" value="'+esc2(r.id)+'"'+(d.roles.indexOf(r.id)>=0?' checked':'')+'> '+esc2(r.name)+' <span class="mutedtext" style="font-size:11.5px">· '+esc2(r.risk)+' risk</span></label>'; }).join('')
            + '</div></div>'; },
        collect:function(){ return { owner: admVal('adm-g-owner'), roles: [].slice.call(document.querySelectorAll('#wz-body .ckgrid input:checked')).map(function(i){ return i.value; }) }; },
        validate:function(d){ if(!d.roles.length) return 'Pick at least one bundle — a group that grants nothing is a mailing list'; } },
      { name:'Members', render:function(d){ return admPicker('group','Members',d.members); },
        collect:function(){ return { members: admPickState('group').sel.slice() }; } }
    ],
    onFinish: admGroupSave
  });
}
function admGroupSave(d){
  const id = admSlug(d.name);
  GROUPS.push({id:id, name:d.name, members:d.members.length, tier:d.tier, type:"Manual", roles:d.roles, owner:d.owner});
  if(typeof ENT_META!=="undefined") ENT_META[id] = {review:d.review, why:"Created in Admin by "+(ME.full||"you")+"."};
  d.members.forEach(function(n){ const p=personByName(n); if(p){ p.groups=(p.groups||[]).slice(); if(p.groups.indexOf(id)<0) p.groups.push(id); } });
  toast('Created '+d.name+' — '+d.members.length+' member'+(d.members.length===1?'':'s')+', '+d.roles.length+' bundle'+(d.roles.length===1?'':'s'));
  admRepaint('groups');
}
function admGroupsPane(){
  const synced = GROUPS.filter(function(g){ return !/Manual/.test(g.type); }).length;
  return callout("info","<b>Manual groups are created here.</b> "+fmt(synced)+" other groups are synced from Directory or built from a rule on the country field — those are created and changed in Directory, and Spiff only reads them. Every group, either kind, is listed on <button class=\"lnk\" onclick=\"go('people');switchTab('ppl','grp')\">Access administration</button>.")
    + '<div style="height:14px"></div>'
    + listFrame("adm-groups", {
        items: GROUPS.filter(function(g){ return /Manual/.test(g.type); }), repaint: function(){ admRepaint('groups'); }, noun: "manual groups", noun1: "manual group", size: 10,
        search: function(g){ return g.name+' '+g.owner+' '+g.tier; }, placeholder: "Search groups by name, owner or tier…",
        sorts: [{key:"name", label:"Name", get:function(g){ return g.name; }},
                {key:"members", label:"Most members", get:function(g){ return g.members; }, desc:true},
                {key:"tier", label:"Tier", get:function(g){ return TIERS.indexOf(g.tier); }}],
        row: pplGroupCard, bodyClass: "g2",
        emptyTitle: "No manual groups yet", emptyIcon: "people"
      });
}
function admBundleModal(){
  wizardOpen({
    title: 'Create a bundle',
    intro: 'A bundle is a named set of privileges — a sentence a coordinator can read, like <i>Locality Secretary</i>. Groups grant bundles; people never hold one directly.',
    finish: 'Create bundle', width: 600,
    data: { name:'', tier:'Locality', risk:'low', desc:'', privs:[] },
    steps: [
      { name:'Name', render:function(d){ return admInput('adm-b-name','Bundle name','e.g. Event Host',d.name)
            + '<div class="g2">'
            + admSelect('adm-b-tier','Widest tier it can reach',TIERS.map(function(t){ return '<option'+(t===d.tier?' selected':'')+'>'+t+'</option>'; }).join(''))
            + admSelect('adm-b-risk','Risk',['low','medium','high','critical'].map(function(t){ return '<option'+(t===d.risk?' selected':'')+'>'+t+'</option>'; }).join(''))
            + '</div>'
            + admInput('adm-b-desc','What it is for','One sentence a stranger would understand',d.desc)
            + '<div class="wz-note">Risk decides how often the bundle comes up for review: low yearly, medium half-yearly, high quarterly, critical monthly.</div>'; },
        collect:function(){ return { name: admVal('adm-b-name'), tier: admVal('adm-b-tier'), risk: admVal('adm-b-risk'), desc: admVal('adm-b-desc') }; },
        validate:function(d){ if(!d.name) return 'Give the bundle a name'; if(roleById(admSlug(d.name))) return 'A bundle called '+d.name+' already exists'; } },
      { name:'Privileges', render:function(d){ return '<div class="field"><label>Privileges in the bundle</label><div class="ckgrid" style="max-height:290px">'
            + ADM_PRIVS.map(function(p){ return '<label class="ckrow"><input type="checkbox" value="'+esc2(p)+'"'+(d.privs.indexOf(p)>=0?' checked':'')+'> '+esc2(p)+'</label>'; }).join('')
            + '</div></div>'; },
        collect:function(){ return { privs: [].slice.call(document.querySelectorAll('#wz-body .ckgrid input:checked')).map(function(i){ return i.value; }) }; },
        validate:function(d){ if(!d.privs.length) return 'Pick at least one privilege'; } }
    ],
    onFinish: admBundleSave
  });
}
function admBundleSave(d){
  ROLES.push({id:admSlug(d.name), name:d.name, members:0, tier:d.tier, desc:d.desc || "No description written yet.", privs:d.privs, risk:d.risk});
  toast('Created '+d.name+' — grant it through a group to put it to work');
  admRepaint('bundles');
}
function admBundlesPane(){
  return callout("info","<b>Bundles are what groups grant.</b> Creating one changes nothing until a group carries it. The risk you set decides how often it comes up for review.")
    + '<div style="height:14px"></div>'
    + listFrame("adm-bundles", {
        items: ROLES, repaint: function(){ admRepaint('bundles'); }, noun: "bundles", noun1: "bundle", size: 10,
        search: function(r){ return r.name+' '+r.desc+' '+r.privs.join(' '); }, placeholder: "Search bundles by name or privilege…",
        sorts: [{key:"risk", label:"Highest risk first", get:function(r){ return PPL_RISK_RANK[r.risk]==null?9:PPL_RISK_RANK[r.risk]; }},
                {key:"name", label:"Name", get:function(r){ return r.name; }},
                {key:"members", label:"Most holders", get:function(r){ return r.members; }, desc:true}],
        row: pplRoleCard, bodyClass: "g2",
        emptyTitle: "No bundles yet", emptyIcon: "shield"
      });
}

/* =====================================================================
   System admins
   ===================================================================== */
function admIsAdmin(p){ return (p.roles||[]).indexOf("admin") >= 0 || (p.groups||[]).indexOf("platform-admins") >= 0; }
function admAdmins(){ return PEOPLE.filter(admIsAdmin); }
function admAddAdminModal(){
  const candidates = PEOPLE.filter(function(p){ return !admIsAdmin(p); }).sort(function(a,b){ return a.name.localeCompare(b.name); });
  openModal('<h3>Add a system admin</h3>'
    + '<div class="msub">A system admin runs Spiff itself — connectors, blocks, quotas, retention, the full activity log. It is the one bundle that reaches every screen, so it is granted sparingly, with an end date, and every other admin is told.</div>'
    + admSelect('adm-a-who', 'Who', candidates.map(function(p){ return '<option value="'+esc2(p.name)+'">'+esc2(p.name)+' — '+esc2(p.title)+'</option>'; }).join(''))
    + admSelect('adm-a-until', 'Until', ['90 days','180 days','12 months','No end date (needs a second admin to agree)'].map(function(t){ return '<option>'+t+'</option>'; }).join(''))
    + '<div class="field"><label>Why — written to the activity log</label><textarea class="txt" id="adm-a-why" rows="3" placeholder="e.g. Covering Ezra while he is on leave until 20 Dec"></textarea></div>'
    + callout("warn","Adding an admin is itself an admin action. It is logged against you, and the other "+fmt(admAdmins().length)+" admins are notified before it takes effect.")
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" onclick="admAddAdminSave()">Add admin</button></div>', 560);
}
function admAddAdminSave(){
  const who = admVal('adm-a-who'), until = admVal('adm-a-until'), why = admVal('adm-a-why');
  if(!why){ toast('Write the reason — it goes on the log'); return; }
  const p = personByName(who); if(!p) return;
  p.roles = (p.roles||[]).slice(); if(p.roles.indexOf("admin")<0) p.roles.push("admin");
  p.groups = (p.groups||[]).slice(); if(p.groups.indexOf("platform-admins")<0) p.groups.push("platform-admins");
  p.adminSince = "just now"; p.adminUntil = until; p.adminWhy = why;
  const g = groupById("platform-admins"); if(g) g.members++;
  const r = roleById("admin"); if(r) r.members++;
  closeModal(); toast(who+' is a system admin until '+until.toLowerCase()); admRepaint('admins');
}
function admRemoveAdminAsk(name){
  const p = personByName(name); if(!p) return;
  const left = admAdmins().length - 1;
  if(left < 2){ toast('Spiff keeps at least two system admins. Add another before removing '+name); return; }
  confirmAsk({title:'Remove '+esc2(name)+' as a system admin?',
    body:'They keep their other groups and everything those grant. The admin bundle goes at their next run, and the change is logged with your name on it.',
    verb:'Remove', onConfirm:function(){
      p.roles = (p.roles||[]).filter(function(x){ return x!=="admin"; });
      p.groups = (p.groups||[]).filter(function(x){ return x!=="platform-admins"; });
      const g = groupById("platform-admins"); if(g && g.members>0) g.members--;
      const r = roleById("admin"); if(r && r.members>0) r.members--;
      toast('Removed'); admRepaint('admins');
    }});
}
function admAdminsPane(){
  const admin = roleById("admin");
  return callout("warn","<b>What a system admin can change.</b> "+(admin?admin.privs.map(esc2).join(" · "):"")+". Not data — an admin sees rows through their own groups like anyone else. "
      + "Spiff keeps at least two admins at all times, and every change made on this page is written to the activity log against the admin who made it.")
    + '<div style="height:14px"></div>'
    + listFrame("adm-admins", {
        items: admAdmins(), repaint: function(){ admRepaint('admins'); }, noun: "system admins", noun1: "system admin", size: 10,
        sorts: [{key:"name", label:"Name", get:function(p){ return p.name; }},
                {key:"last", label:"Most recently active", get:function(p){ return pplRecency(p.last); }},
                {key:"asked", label:"Most questions asked", get:function(p){ return p.asked; }, desc:true}],
        cols: [{label:"Person", sort:"name", cell:function(p){ return '<div class="person">'+avatar(p.name)+'<div><div class="pn">'+esc2(p.name)+(p.me?' '+bdg("You","info"):'')+'</div><div class="pr">'+esc2(p.title)+'</div></div></div>'; }},
               {label:"Locality", cell:function(p){ return esc2(p.locality); }},
               {label:"Granted through", cell:function(p){ return (p.groups||[]).indexOf("platform-admins")>=0 ? bdg("Platform Admins","info","people") : bdg("Directly — an exception","warn","warn"); }},
               {label:"Since · until", cell:function(p){ return esc2(p.adminSince||"Before Spiff")+' · '+esc2(p.adminUntil||"no end date"); }},
               {label:"Last active", sort:"last", cell:function(p){ return esc2(p.last); }},
               {label:"Asked", sort:"asked", num:true, cell:function(p){ return fmt(p.asked); }}],
        rowClick: function(p){ return "openPerson('"+admQ(p.name)+"')"; },
        actions: function(p){ return [{label:'Open their profile', icon:'people', onclick:"openPerson('"+admQ(p.name)+"')"},
                                      {label:'Remove as system admin', icon:'x', danger:true, onclick:"admRemoveAdminAsk('"+admQ(p.name)+"')"}]; },
        emptyTitle: "No system admins", emptyIcon: "shield"
      });
}

/* =====================================================================
   Created elsewhere — and never created by hand
   ===================================================================== */
function admElsewherePane(){
  const row = function(icon, what, where, how, js){
    return '<div class="lrow" onclick="'+js+'"><div class="li">'+(I2[icon]||I2.grid)+'</div>'
      + '<div class="lm"><div class="lt">'+esc2(what)+'</div><div class="ls">'+esc2(how)+'</div></div>'
      + '<div class="lr"><span class="bdg mut">'+esc2(where)+'</span>'+I2.chev+'</div></div>';
  };
  return '<div class="g2">'
    + panel("Created on their own screens", ''
        + row("shield","Business rule","Business rules","New rule — written as a sentence, with an owner, an approver and a status.","go('rules');setTimeout(function(){ if(typeof rulesNew==='function') rulesNew(); },50)")
        + row("plug","Connector","Connectors","Add a connector — from the directory, or a custom one your org registers.","go('mcp')")
        + row("db","Source","Sources","Register a source — Spiff reads it to learn what the data means. Registering grants nobody anything.","go('sources')")
        + row("flow","Automation","Automations","New automation — a trigger, then blocks. It runs as its owner.","go('autos');setTimeout(function(){ if(typeof newFlowModal==='function') newFlowModal(); },50)")
        + row("book","Definition","Definitions","Propose a change or a new term — the owner agrees, the version increments.","go('glossary')")
        + row("file","Template","Templates — or any Answer","New template from scratch, or Save as template on an answer you like. Shape only: blocks, order, formats. Never the numbers.","go('templates')")
        + row("file","Saved answer","any Answer","Save on an answer puts it in My workspace; Share to team puts it in the team workspace.","go('home')")
        + row("grid","Dashboard tile","any Answer","Add to dashboard on an answer — a tile re-runs for whoever is looking.","go('workspace')")
        + row("check","Access review","Access administration","Start a review — a campaign over a set of grants, with a due date and a sign-off.","go('people');switchTab('ppl','rev')"),
        {icon:"plus", tight:true, sub:"Each is created where it lives; this page only points the way"})
    + panel("Never created by hand", '<div class="stack" style="gap:10px;font-size:13.5px;line-height:1.55">'
        + '<div><b>People, localities, countries, subdivisions.</b> They come from Directory, the system of record. Spiff reads them; nothing here can add or rename one.</div>'
        + '<div><b>Datasets and fields.</b> They come from a source read — Spiff opens the source, proposes what it found, and a named person accepts it into the catalogue.</div>'
        + '<div><b>Synced and rule-based groups.</b> Directory owns membership; Spiff only reads it. Manual groups are the exception, and they are created on the Groups tab.</div>'
        + '<div><b>The activity log.</b> Append-only. Nothing is created, edited or removed in it by anyone.</div>'
        + '</div>', {icon:"lock", sub:"So a builder does not add a create button where none belongs"})
    + '</div>';
}

/* =====================================================================
   the page
   ===================================================================== */
function renderAdmin(){
  const manual = GROUPS.filter(function(g){ return /Manual/.test(g.type); }).length;
  const acts = {
    teams:   '<button class="btn pri" onclick="admTeamModal()">'+I2.plus+' Create a team</button>',
    groups:  '<button class="btn pri" onclick="admGroupModal()">'+I2.plus+' Create a group</button>',
    bundles: '<button class="btn pri" onclick="admBundleModal()">'+I2.plus+' Create a bundle</button>',
    admins:  '<button class="btn pri" onclick="admAddAdminModal()">'+I2.plus+' Add a system admin</button>',
    budgets: '<button class="btn" onclick="toast(\'Exported September to CSV — the export is logged\')">'+I2.down+' Export this month</button>',
    provider: '<button class="btn pri" onclick="admKeyWizard()">'+I2.plus+' Bring your own key</button>',
    elsewhere: ''
  };
  $('#view-admin').innerHTML =
      pageHead({eyebrow:"Govern", title:"Set-up",
        desc:"Everything that has to be created for it to exist is created here, step by step, by a system admin. Teams, groups and bundles are made on this page; budgets and the AI provider are set here; everything else is made where it lives, and the last tab says where.",
        badges: bdg(fmt(TEAMS.length)+" teams","mut","people") + bdg(fmt(manual)+" manual groups","mut","lock")
              + bdg(fmt(ROLES.length)+" bundles","mut","shield") + bdg(fmt(admAdmins().length)+" system admins","info","shield")
              + bdg(NZD(BUDGET.tenant.used)+" of "+NZD(BUDGET.tenant.cap)+" this month", budgetPct(BUDGET.tenant.used,BUDGET.tenant.cap)>=80?"warn":"ok","trend"),
        acts: acts[ADM.tab] || ''})
    + tabsHTML("adm", [["teams","Teams",TEAMS.length],["groups","Groups",manual],["bundles","Bundles",ROLES.length],
                       ["admins","System admins",admAdmins().length],["budgets","Budgets",TEAMS.length],["provider","AI provider"],["elsewhere","Where things are made"]], ADM.tab)
    + pane("adm","teams",     admTeamsPane(),     ADM.tab==="teams")
    + pane("adm","groups",    admGroupsPane(),    ADM.tab==="groups")
    + pane("adm","bundles",   admBundlesPane(),   ADM.tab==="bundles")
    + pane("adm","admins",    admAdminsPane(),    ADM.tab==="admins")
    + pane("adm","budgets",   admBudgetsPane(),   ADM.tab==="budgets")
    + pane("adm","provider",  admProviderPane(),  ADM.tab==="provider")
    + pane("adm","elsewhere", admElsewherePane(), ADM.tab==="elsewhere");
  document.querySelectorAll('[data-tabs="adm"] button').forEach(function(b){
    b.addEventListener("click", function(){ ADM.tab = b.dataset.tab; renderAdmin(); });
  });
}
V2ROUTES.admin = renderAdmin;
</script>
