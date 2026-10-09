<script>
/* ---------- v1 actions: delete from workspace/library, name-on-create, subscribe to an automation ---------- */

/* the two removals below used to act on click. They confirm now, like every
   other destructive action. */
function deleteReport(idx){const r=REPORTS[idx];if(!r)return;
  const subs=subsFor(r.id).length;
  confirmAsk({title:'Remove “'+esc(r.name)+'” from My workspace?',
    body:(subs?fmt(subs)+' subscriber'+(subs===1?' keeps':'s keep')+' their own copy. ':'')+'Your saved copy and its schedule go now. The answer itself is not deleted — ask it again any time.',
    verb:'Remove', onConfirm:function(){ deleteReportGo(idx); }});}
function deleteReportGo(idx){const r=REPORTS[idx];if(!r)return;
  const hadSubs=subsFor(r.id).length>0;
  REPORTS.splice(idx,1);
  const el=$('#ws-count');if(el)el.textContent=REPORTS.length;
  renderWorkspace();
  toast(hadSubs?'Removed from My workspace — subscribers keep their own copy':'Removed from My workspace');}
function deleteLibraryItem(idx){const l=LIBRARY[idx];if(!l)return;const a=ANSWERS[l.id]||{};
  confirmAsk({title:'Remove “'+esc(a.q||l.id)+'” from the team workspace?',
    body:'It leaves '+esc(l.team||'the team')+'\'s list now. People it was shared with keep their own copy, and the answer itself is not deleted.',
    verb:'Remove', onConfirm:function(){ deleteLibraryItemGo(idx); }});}
function deleteLibraryItemGo(idx){const l=LIBRARY[idx];if(!l)return;const team=l.team;
  LIBRARY.splice(idx,1);
  const el=$('#lib-count');if(el)el.textContent=LIBRARY.length;
  toast('Removed from the team workspace — other teams and people it\'s shared with keep their own copy');
  if($('#view-library').classList.contains('on'))renderLibrary();
  else if($('#view-team')&&$('#view-team').classList.contains('on'))openTeam(team);}
function reportRow(r){const a=ANSWERS[r.id];const idx=REPORTS.indexOf(r);
  return '<div class="row2" onclick="openFromCard(\''+r.id+'\')"><div class="ri">'+iconFor(a)+'</div><div class="rmain"><div class="rt">'+esc(r.name)+'</div><div class="rsub">'+esc(a.q)+'</div></div><div class="rmeta">'+(r.sched?'<span class="sbadge">'+ICON.clock+' '+esc(r.sched)+'</span>':'')+'<span class="when">'+r.saved+'</span>'+kebabHTML([{label:'Open', icon:'file', onclick:"openFromCard('"+r.id+"')"},{label:'Remove from My workspace', icon:'x', danger:true, onclick:'deleteReport('+idx+')'}])+'</div></div>';}
function libRow(l){const a=ANSWERS[l.id];const idx=LIBRARY.indexOf(l);
  return '<div class="row2" onclick="openFromCard(\''+l.id+'\')"><div class="ri">'+iconFor(a)+'</div><div class="rmain"><div class="rt">'+esc(a.q)+'</div><div class="rsub">'+l.owner+' · '+l.team+'</div></div><div class="rmeta">'+(l.tag[0]?'<span class="tag '+l.tag[1]+'">'+l.tag[0]+'</span>':'')+'<span class="sbadge" style="background:var(--accent-soft);color:var(--accent)">● live</span><span class="when">'+l.refreshed+'</span>'+kebabHTML([{label:'Open', icon:'file', onclick:"openFromCard('"+l.id+"')"},{label:'Remove from the team workspace', icon:'x', danger:true, onclick:'deleteLibraryItem('+idx+')'}])+'</div></div>';}

/* name a new automation up front, instead of a placeholder title */
function newFlowModal(){
  const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Name this automation</h3><div class="msub">Give it a clear name — you can rename it later from the automation header.</div>'
    +'<div class="field"><label>Automation name</label><input id="nf-name" placeholder="e.g. Weekly attendance alert" maxlength="80"></div>'
    +'<div class="field"><label>Starts when…</label><select id="nf-trig">'+TRIGTYPES.map(t=>'<option value="'+t.id+'">'+esc(t.n)+'</option>').join('')+'</select></div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" id="nf-create">Create automation</button></div></div>';
  m.classList.add('on');
  const inp=$('#nf-name');setTimeout(()=>inp&&inp.focus(),10);
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#nf-create').click();}});
  $('#nf-create').onclick=()=>{const name=(inp.value||'').trim()||'New automation';const trig=$('#nf-trig').value;closeModal();openFlow(null,trig,name);};}
function openFlow(idx,seedTrig,presetName){
  if(typeof idx==='number'){const w=WORKFLOWS[idx];FLOW={idx,name:w.name,trig:w.trig,cfg:Object.assign({},w.cfg),steps:w.steps.map(s=>({cap:s.cap,cfg:JSON.parse(JSON.stringify(s.cfg||{}))})),on:w.on,owner:w.owner||"Thato S.",shared:!!w.shared,team:w.team};}
  else{const SEEDS={assemble_event:{trig:'event',cfg:{source:'Assemble events feed'}},event:{trig:'event',cfg:{source:'Assemble events feed'}},schedule:{trig:'schedule',cfg:{cadence:'Daily · 02:00'}},metric:{trig:'metric',cfg:{}},manual:{trig:'manual',cfg:{}}};
    const seed=SEEDS[seedTrig]||SEEDS.event;FLOW={idx:null,name:presetName||"New automation",trig:seed.trig,cfg:seed.cfg,steps:[],on:false,owner:"Thato S.",shared:false};}
  showOnly('flow');navActive('autos');$('#crumb').innerHTML='Automations <span style="opacity:.5">/</span> <b>'+esc(FLOW.name)+'</b>';renderFlow();}

/* subscribe to an automation that sends comms but doesn't already include you as a recipient */
const AUTOSUBS={};
const autoSubsFor=w=>(AUTOSUBS[w.name]||(AUTOSUBS[w.name]=[]));
const COMMS_CATS=['Notify','Curate'];
function workflowSendsComms(w){return w.steps.some(st=>{const c=capById(st.cap);return c&&COMMS_CATS.includes(c.cat);});}
function workflowIncludesMe(w){return w.steps.some(st=>{
  const c=capById(st.cap);if(!c||!COMMS_CATS.includes(c.cat))return false;
  const rf=capFields(st.cap).find(f=>f.type==='recipients');if(!rf)return false;
  const v=(st.cfg||{})[rf.k];if(!v||!v.mode)return false;
  if(v.mode==='me')return true;
  if(v.mode==='people')return (v.val||[]).includes('Thato S.');
  return false;});}
function autoSubEligible(w){return workflowSendsComms(w)&&!workflowIncludesMe(w);}
function subscribeAutoModal(idx){const w=WORKFLOWS[idx];if(!w)return;
  const subs=autoSubsFor(w),mine=subs.find(s=>s.who==="Thato S.");
  const list=subs.length?'<div class="sublist">'+subs.map(s=>'<div class="subrow"><span class="ava">'+esc(s.who.split(' ').map(x=>x[0]).join(''))+'</span><div style="flex:1;min-width:0"><div class="srn">'+esc(s.who)+(s.who==="Thato S."?' <span style="color:var(--muted);font-weight:500">(you)</span>':'')+'</div><div class="srd">'+esc(s.ch)+'</div></div></div>').join('')+'</div>':'<div class="msub" style="margin:2px 0 12px">Nobody has subscribed as a bystander yet.</div>';
  const m=$('#modal');
  m.innerHTML='<div class="modal"><h3>Subscribe to this automation</h3><div class="msub">This automation sends alerts, but its configured recipients don\'t include you. Subscribing adds you as a recipient of what it sends — it doesn\'t make you an owner, and you still can\'t edit or turn it off.</div>'
    +'<div class="field"><label>Currently subscribed</label>'+list+'</div>'
    +'<div class="field"><label>Notify me via</label><select id="asub-ch"><option>Email</option><option>In-app</option><option>SMS</option></select></div>'
    +'<div class="sharenote" style="background:var(--good-soft);color:var(--good)">'+ICON.shield+' You only receive what it already sends — nothing new is exposed in order to add you.</div>'
    +'<div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn pri" id="asub-save">'+(mine?'Update':'Subscribe me')+'</button></div></div>';
  m.classList.add('on');
  $('#asub-save').onclick=()=>{const ch=$('#asub-ch').value;
    if(mine)mine.ch=ch;else subs.push({who:"Thato S.",ch});
    closeModal();
    if($('#view-autos').classList.contains('on'))renderAutomations();
    if(FLOW&&FLOW.idx===idx)renderFlow();
    toast(mine?'Subscription updated · '+ch.toLowerCase():'Subscribed · you\'ll get this via '+ch.toLowerCase());};}


/* the palette groups by the connector that provides each block — a block IS a
   connector tool, so the palette says where each one comes from. Blocks with
   nothing registered behind them are shown, marked, and cannot be dragged. */
function blockProvider(id){
  const b=blockOf(id);
  if(b.connector==="spiff") return "Spiff — built in";
  if(!b.connector) return "Proposed — nothing registered";
  const c=CONNECTORS.find(x=>x.id===b.connector);
  return c?c.name:"Proposed — nothing registered";
}
function renderFlow(){
  /* connectors first, then Spiff's own, then the ones with nothing behind them */
  const rank=p=>/^Proposed/.test(p)?2:/^Spiff/.test(p)?1:0;
  const provs=[...new Set(CAPS.map(c=>blockProvider(c.id)))].sort((a,b)=>rank(a)-rank(b));
  const palette=provs.map(p=>{
    const items=CAPS.filter(c=>blockProvider(c.id)===p);
    const dead=/^Proposed/.test(p);
    return '<div class="pcat">'+esc(p)+(dead?' <span class="bdg crit" style="font-size:9.5px;padding:0 5px;margin-left:4px">no connector</span>':'')+'</div>'
      +items.map(c=>{const st=blockState(c.id), off=st==="proposed";
        return '<div class="capblock'+(off?' proposed':'')+'"'+(off?'':' draggable="true"')+' data-id="'+c.id+'"'
          +' title="'+esc(c.n+' — '+blockOf(c.id).note)+'">'+ICON[c.ik]+'<span>'+esc(c.n)+'</span>'
          +(st==="needs-connector"?'<span class="bdg warn" style="font-size:9.5px;padding:0 5px;margin-left:auto">connect</span>':'')
          +(off?'<span class="bdg crit" style="font-size:9.5px;padding:0 5px;margin-left:auto">proposed</span>':'')+'</div>';}).join('');
  }).join('');
  const steps=FLOW.steps.map((st,i)=>{const c=capById(st.cap),s=stepStatus(st),bs=blockState(st.cap);
    const warn = bs==="proposed"
      ? '<span class="needpill crit" title="'+esc(blockOf(st.cap).note)+'">No connector — this step cannot run</span>'
      : bs==="needs-connector"
      ? '<span class="needpill">Connect '+esc(blockProvider(st.cap))+' to run this</span>' : '';
    return '<div class="connector"></div><div class="stepcard'+(s.ready&&!warn?'':' unset')+'"><div class="snum">'+(i+1)+'</div><div class="sic">'+ICON[c.ik]+'</div><div class="smain"><div class="sname">'+esc(c.n)+'</div><div class="scfg">'+(warn||(s.ready?esc(s.summary):'<span class="needpill">Needs setup</span>'))+'</div></div><button class="sgear" data-i="'+i+'" title="Configure">'+ICON.gear+'</button><button class="srm" data-i="'+i+'" title="Remove">×</button></div>';}).join('');
  const dead=FLOW.steps.filter(st=>blockState(st.cap)==="proposed");
  const savedWf=FLOW.idx!==null?WORKFLOWS[FLOW.idx]:null;
  const subEligible=savedWf&&autoSubEligible(savedWf);
  const subMine=subEligible&&autoSubsFor(savedWf).find(s=>s.who==="Thato S.");
  $('#view-flow').innerHTML='<button class="backlink" onclick="go(\'autos\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg> All automations</button>'
    +'<div class="flowhead"><div class="fnamewrap"><label class="fnlabel">Automation name</label><input class="fname" id="flow-name" value="'+esc(FLOW.name)+'" placeholder="Name this automation"'+(FLOW.owner==="Thato S."?'':' readonly')+'></div><div class="sp"></div>'
    +'<span class="scopechip">'+ICON.shield+' Runs as '+(FLOW.owner==="Thato S."?'you':esc(FLOW.owner))+'</span>'
    +(subEligible?'<button class="btn" id="flow-subscribe">'+ICON.people+' '+(subMine?'Subscribed · '+esc(subMine.ch):'Subscribe to alerts')+'</button>':'')
    +(FLOW.owner==="Thato S."
        ? (FLOW.shared?'<span class="scopechip" style="color:var(--good);background:var(--good-soft)">'+ICON.people+' Shared &middot; clone</span>':'<button class="btn" id="flow-share">'+ICON.people+' Share to team</button>')
          +'<div class="toggle'+(FLOW.on?' on':'')+'" id="flow-toggle"><span class="tk"></span>'+(FLOW.on?"On":"Off")+'</div>'
          +'<button class="btn pri" id="flow-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-4-7 4V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg> Save automation</button>'
        : '<span class="scopechip">'+ICON.people+' '+esc(FLOW.team||'Team')+'</span><button class="btn pri" id="flow-clone">'+ICON.flow+' Add my copy</button>')
    +'</div>'
    +(subEligible?'<div class="flownote" style="margin-top:-8px;margin-bottom:14px">'+ICON.shield+' Its configured recipients don\'t include you — subscribing adds you to what it sends without giving you edit or ownership.</div>':'')
    +(dead.length?'<div class="callout crit" style="margin-bottom:14px">'+I2.lock+'<div><b>'+dead.length+' step'+(dead.length===1?'':'s')+' cannot run.</b> '
      +dead.map(st=>esc(capById(st.cap).n)).join(' and ')+' '+(dead.length===1?'has':'have')+' no connector registered behind '+(dead.length===1?'it':'them')+'. '
      +'The rest of this automation still runs — the step is skipped and the skip is written to the activity log, so nobody assumes a message went out. '
      +'<button class="lnk" onclick="go(\'mcp\')">See what is registered</button></div></div>':'')
    +'<div class="flowbody'+(palShut()?' pal-shut':'')+'"><div class="palette">'+palHeadHTML()+'<div class="phs">Drag onto the flow, or click to add. Each block is a tool a connector exposes, grouped by where it comes from — <button class="lnk" onclick="go(\'mcp\')">see them in Connectors</button>.</div>'+palette+'</div>'
    +'<div class="canvas" id="flow-canvas"><div class="trigger-card"><div class="tl">'+ICON.bolt+' Trigger — when this happens</div><select id="trig-type">'+TRIGTYPES.map(t=>'<option value="'+t.id+'"'+(t.id===FLOW.trig?' selected':'')+'>'+esc(t.n)+'</option>').join('')+'</select><div class="trig-cfg" id="trig-cfg">'+trigCfgHTML()+'</div></div>'
    +'<div id="flow-steps">'+steps+'</div>'
    +'<div class="connector"></div><div class="dropzone" id="flow-drop">Drag a capability here to add a step</div>'
    +'<div class="flownote">'+ICON.shield+' Every step runs as '+(FLOW.owner==="Thato S."?'you':esc(FLOW.owner))+' — an automation can never do what its owner couldn\'t. Sharing to a team doesn\'t widen access: each colleague adds their own copy that runs as them, scoped to their data.</div></div></div>';
  $('#flow-name').oninput=e=>{FLOW.name=e.target.value;$('#crumb').innerHTML='Automations <span style="opacity:.5">/</span> <b>'+esc(FLOW.name)+'</b>';};
  $('#trig-type').onchange=e=>{FLOW.trig=e.target.value;renderFlow();};
  $('#trig-cfg').querySelectorAll('[data-k]').forEach(el=>{el.onchange=el.oninput=()=>{FLOW.cfg[el.dataset.k]=el.value;};});
  const _tog=$('#flow-toggle');if(_tog)_tog.onclick=()=>{FLOW.on=!FLOW.on;renderFlow();};
  const _sv=$('#flow-save');if(_sv)_sv.onclick=()=>{const rec={name:FLOW.name,trig:FLOW.trig,cfg:Object.assign({},FLOW.cfg),steps:JSON.parse(JSON.stringify(FLOW.steps)),on:FLOW.on,owner:FLOW.owner,shared:!!FLOW.shared,team:FLOW.team};if(FLOW.idx!==null)WORKFLOWS[FLOW.idx]=rec;else{WORKFLOWS.unshift(rec);FLOW.idx=0;}toast("Automation saved"+(FLOW.on?" · now running":""));go('autos');};
  const _sh=$('#flow-share');if(_sh)_sh.onclick=shareFlow;
  const _cl=$('#flow-clone');if(_cl)_cl.onclick=cloneFlow;
  const _sub=$('#flow-subscribe');if(_sub)_sub.onclick=()=>subscribeAutoModal(FLOW.idx);
  $('#view-flow').querySelectorAll('.capblock').forEach(b=>{
    if(b.classList.contains('proposed')){
      b.onclick=()=>toast('“'+capById(b.dataset.id).n+'” is proposed — no connector is registered that could run it');
      return;
    }
    b.onclick=()=>addStep(b.dataset.id);
    b.ondragstart=e=>e.dataTransfer.setData('text',b.dataset.id);});
  $('#view-flow').querySelectorAll('.srm').forEach(b=>b.onclick=()=>{FLOW.steps.splice(+b.dataset.i,1);renderFlow();});
  $('#view-flow').querySelectorAll('.sgear').forEach(b=>b.onclick=()=>configModal(+b.dataset.i));
  const dz=$('#flow-drop'),canvas=$('#flow-canvas');
  [dz,canvas].forEach(el=>{el.ondragover=e=>{e.preventDefault();dz.classList.add('over');};el.ondragleave=()=>dz.classList.remove('over');el.ondrop=e=>{e.preventDefault();dz.classList.remove('over');const id=e.dataTransfer.getData('text');if(id)addStep(id);};});}
</script>
