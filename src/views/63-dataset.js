<script>
/* =====================================================================
   Dataset profile — the deepest screen in Spiff.
   Everything here renders under the *current viewer*, not under a
   generic "admin" view. That is the whole argument of the page.
   ===================================================================== */

const DSP = { id:null, tab:"overview", q:"", onlyM:false, onlyP:false, onlyX:false, tech:false, stars:{} };

/* ---------- viewer helpers ---------- */
function dspArg(s){ return esc2(String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'")); }
function dspViewerName(){ const v=viewer(); return v.full||v.name; }
function dspLocalities(){ const v=viewer(); return v.localities?v.localities:(v.locality?[v.locality]:[]); }
function dspRoleNames(){
  const v=viewer();
  return (v.roles||[]).map((r)=>{ const o=(typeof roleById==="function")?roleById(r):null; return o?o.name:r; });
}
function dspHasRole(n){ return dspRoleNames().some(r=>r.toLowerCase().indexOf(n.toLowerCase())>=0); }
function dspInGroup(g){ const v=viewer(); return (v.groups||[]).indexOf(g)>=0; }
function dspTitleOf(n){ const p=personByName(n); return p?p.title:"UBT — GST Division"; }
function dspHumanRule(id){ return String(id).replace(/^r-/,"").replace(/-/g," ").replace(/^./,c=>c.toUpperCase()); }
function dspHash(s,i){ let h=0,t=String(s)+"|"+i; for(let k=0;k<t.length;k++) h=(h*31+t.charCodeAt(k))>>>0; return h; }
/* icons outside a sized container need their own dimensions */
function dspClip(s,n){ s=String(s); if(s.length<=n) return s; const c=s.slice(0,n); const k=c.lastIndexOf(" "); return (k>n*0.6?c.slice(0,k):c).replace(/[ ,.;]+$/,"")+"…"; }
function dspIco(n,px){ return String(I2[n]||"").replace("<svg",'<svg width="'+(px||15)+'" height="'+(px||15)+'"'); }

/* ---------- masking, resolved per viewer ---------- */
function dspRuleSentence(t){ return esc2(String(t)).replace(/\{\{\w+:([^}]*)\}\}/g,"<b>$1</b>"); }
function dspRuleFor(d,f){
  const m=(f.mask||"").toLowerCase(), r=d.rules||[];
  const pick=k=>r.filter(x=>x.indexOf(k)>=0)[0];
  if(/never loaded/.test(m))       return pick("docs")||pick("pastoral")||r[0];
  if(/wellbeing/.test(m))          return pick("wellbeing")||r[0];
  if(/travel window/.test(m))      return pick("travel-window")||r[0];
  if(/records office/.test(m))     return pick("deceased")||r[0];
  if(/rounded to year/.test(m))    return pick("minor-dob")||pick("minor")||r[0];
  if(/under-18|minor/.test(m))     return pick("minor")||r[0];
  if(/below 5|suppress/.test(m))   return pick("small-count")||r[0];
  if(/hash|withheld/.test(m))      return pick("contact")||pick("consent")||pick("locality")||r[0];
  return r[0]||null;
}
function dspMask(d,f){
  const m=f.mask;
  if(!m) return {state:"clear", you:"You see this in full.", cls:"ok"};
  const t=m.toLowerCase();
  const cross   = dspHasRole("Regional Coordinator")||dspHasRole("National Office")||dspHasRole("Platform Admin");
  const safe    = dspHasRole("Safeguarding Lead");
  const records = dspInGroup("records-office");
  const travel  = dspInGroup("travel-office");
  const events  = dspInGroup("event-ops");
  const rn = dspLocalities().join(", ")||"your locality";
  if(/never loaded/.test(t))          return {state:"never", you:"Nobody sees this. The column is not loaded into Spiff at all.", cls:"crit"};
  if(/hashed for all/.test(t))        return {state:"hashed", you:"You see this hashed — and so does everyone else, including admins.", cls:"warn"};
  if(/hashed outside your locality/.test(t))
    return cross ? {state:"clear", you:"You see this in full across "+rn+" — your role carries cross-locality detail.", cls:"ok"}
                 : {state:"hashed", you:"You see this hashed outside your own locality.", cls:"warn"};
  if(/withheld outside your locality/.test(t))
    return cross ? {state:"clear", you:"You see this inside "+rn+". Outside it, still withheld.", cls:"ok"} : {state:"withheld", you:"You do not see this outside your own locality.", cls:"crit"};
  if(/withheld outside travel window/.test(t))
    return travel ? {state:"clear", you:"You see this — the Travel Office is exempt from the ±30-day window.", cls:"ok"}
                  : {state:"withheld", you:"You see this only for travel within 30 days either side of today.", cls:"crit"};
  if(/wellbeing/.test(t))
    return events ? {state:"clear", you:"You see this — you hold an active Event Operations assignment.", cls:"ok"}
                  : {state:"withheld", you:"You do not see this. Dietary and accessibility notes are health-adjacent.", cls:"crit"};
  if(/records office only/.test(t))
    return records ? {state:"clear", you:"You see this — you are in the Records Office.", cls:"ok"} : {state:"withheld", you:"You do not see this. Records Office only.", cls:"crit"};
  if(/rounded to year/.test(t))
    return safe ? {state:"clear", you:"You see the full date — a safeguarding purpose is recorded against your role.", cls:"ok"}
                : {state:"rounded", you:"You see the year only, and nothing at all for anyone under 18.", cls:"warn"};
  if(/under-18|minor/.test(t))
    return safe ? {state:"clear", you:"You see under-18 rows — a safeguarding purpose is recorded against your role.", cls:"ok"}
                : {state:"suppressed", you:"Rows for members under 18 are removed before you see them.", cls:"warn"};
  if(/below 5|suppress/.test(t))     return {state:"suppressed", you:"You see “<5” wherever the real number is smaller than five.", cls:"warn"};
  return {state:"withheld", you:"You do not see this.", cls:"crit"};
}
function dspMaskBadge(mk){
  const map={clear:["Visible","ok"],hashed:["Hashed for you","warn"],withheld:["Withheld from you","crit"],
             suppressed:["Suppressed for you","warn"],rounded:["Rounded for you","warn"],never:["Not loaded","crit"]};
  const e=map[mk.state]||map.clear;
  return bdg(e[0],e[1],mk.state==="clear"?"eye":"eyeoff");
}

/* ---------- invented sample values ---------- */
const DSP_NAMES  = ["Thandiwe Mkhize","Johannes Barnard","Ayesha Adams","Sipho Radebe","Marlene Fourie","Kagiso Motaung","Farieda Isaacs","Deon Coetzee"];
const DSP_DATES  = ["23 Aug 2026","21 Aug 2026","16 Aug 2026","14 Aug 2026","09 Aug 2026","07 Aug 2026","02 Aug 2026","31 Jul 2026"];
const DSP_POOL = {
  meeting_type:["Regular","Regular","Special","Regular","Youth","Regular","Care","Regular"],
  age_band:["30–39","50–59","30–39","60–69","40–49","60–69","40–49","30–39"],
  ValidTo:["(current)","(current)","(current)","14 Mar 2026","(current)","02 Aug 2025","30 Nov 2025","(current)"],
  condition_cd:["Good","Good","Fair","Good","Attention needed","Fair","Good","Good"],
  booking_type:["Flight","Flight","Hotel","Car","Flight","Hotel","Rail","Flight"],
  purpose_cd:["Event","Operations","Event","Care","Event","Operations","Event","Care"],
  notice_type:["Meeting","Event","Meeting","Care","Administrative","Meeting","Event","Meeting"],
  channel_cd:["Email","SMS","Email","App","Email","Post","Email","SMS"],
  event_type:["Youth","Conference","Training","Service","Youth","Care","Conference","Service"],
  event_nm:["Regional Youth Gathering","Stellenbosch Conference","Secretary Training Day","Coastal Service Weekend","Youth Camp — Spring","Care Team Briefing","National Conference","Founders Service"],
  room_nm:["Main Hall","Upper Room","Annexe","Main Hall","Meeting Room 2","Main Hall","Youth Room","Main Hall"],
  supplier_nm:["Airlink","FlySafair","Protea Hotels","Avis","SAA","City Lodge","Shosholoza Meyl","Airlink"],
  origin_cd:["CPT","CPT","JNB","CPT","DUR","BFN","CPT","CPT"],
  destination_cd:["JNB","DUR","CPT","BFN","JNB","CPT","PLZ","JNB"],
  role_nm:["Locality Secretary","Locality Secretary","Care Visitor","Treasurer","Locality Secretary","Youth Leader","Steward","Locality Secretary"],
  cost_centre_cd:["GST-TRV-01","GST-TRV-02","GST-EVT-01","GST-LDM-04","GST-EST-02","GST-TRV-03","GST-EVT-02","GST-LDM-01"],
  cost_centre_nm:["Travel — Southern","Travel — Northern","Events — National","LDM — Coastal","Estates — Western","Travel — Coastal","Events — Regional","LDM — Southern"],
  period_month:["Jul 2026","Jun 2026","May 2026","Apr 2026","Mar 2026","Feb 2026","Jan 2026","Dec 2025"],
  device_id:["DEV-0142","DEV-0142","DEV-0219","DEV-0088","DEV-0142","DEV-0301","DEV-0219","DEV-0088"],
  contact_consent:["true","true","false","true","true","true","false","true"],
  dob:["12 Mar 1987","04 Nov 1974","28 Jun 1996","19 Jan 1965","02 Sep 1982","15 Dec 1958","07 May 1979","23 Oct 1991"],
  joined_dt:["08 Aug 2011","21 Feb 1998","03 Oct 2019","30 May 1984","17 Jan 2007","06 Jul 1976","24 Apr 2003","11 Nov 2021"],
  opened_dt:["01 Jan 1998","14 Apr 1976","09 Sep 2004","22 Feb 1988","30 Jun 1969","11 Nov 2012","03 Mar 1994","18 Aug 1981"],
  from_dt:["01 Feb 2024","14 Aug 2022","09 Jan 2025","22 Jun 2021","30 Mar 2023","11 Nov 2019","03 Apr 2024","18 Sep 2020"],
  to_dt:["—","—","31 Dec 2026","—","—","30 Jun 2024","—","—"],
  closed_dt:["—","—","—","—","14 Jul 2023","—","—","—"],
  deceased_dt:["—","—","—","—","—","09 Feb 2025","—","—"],
  survey_dt:["18 Nov 2025","02 Mar 2024","—","27 Jul 2025","11 Jan 2026","09 Sep 2023","—","14 Apr 2025"],
  last_review_dt:["04 Feb 2026","19 Nov 2025","28 Jun 2024","12 Mar 2026","07 Aug 2025","21 Jan 2023","30 May 2026","02 Dec 2025"],
  travel_dt:["12 Sep 2026","14 Sep 2026","18 Sep 2026","02 Oct 2026","09 Oct 2026","21 Oct 2026","03 Nov 2026","17 Nov 2026"],
  start_dt:["03 Oct 2026","10 Oct 2026","17 Oct 2026","24 Oct 2026","07 Nov 2026","14 Nov 2026","21 Nov 2026","05 Dec 2026"],
  end_dt:["05 Oct 2026","12 Oct 2026","18 Oct 2026","26 Oct 2026","08 Nov 2026","16 Nov 2026","23 Nov 2026","07 Dec 2026"],
  net_movement:["+12","+4","−3","+18","0","+7","−1","+9"],
  nights:["3","2","4","1","3","5","2","3"],
  leg_count:["6","4","2","8","5","3","7","4"],
  minor_count:["2","0","3","1","4","2","0","1"]
};
function dspVary(ex,i){
  const m=String(ex).match(/^([^0-9]*?)([0-9][0-9 ,]*(?:\.[0-9]+)?)(.*)$/);
  if(!m) return ex;
  const grouped=/[ ,]/.test(m[2]), dec=(m[2].split(".")[1]||"").length;
  const n=parseFloat(m[2].replace(/[ ,]/g,""));
  if(isNaN(n)) return ex;
  const mult=[1,0.94,1.11,0.87,1.18,0.97,1.24,0.91][i%8];
  let out=dec?(n*mult).toFixed(dec):String(Math.round(n*mult));
  if(grouped) out=out.replace(/\B(?=(\d{3})+(?!\d))/g," ");
  return m[1]+out+m[3];
}
/* geography follows the viewer's own scope — a sample row you are not entitled to
   would be a lie, and this table is the proof that scoping is real */
/* short codes used across the systems, keyed by locality */
const DSP_LOC_CD={
  "Bellville":"BEL","Parow":"PRW","Somerset West":"SMW","Durbanville":"DBV","Gqeberha North":"GQN",
  "East London":"ELN","Mthatha Central":"MTC","Bloemfontein Central":"BFC","Welkom":"WLK",
  "Sandton":"SAN","Pretoria East":"PTE","Benoni":"BEN","Pinetown":"PNT","Umhlanga":"UMH",
  "Ballito":"BAL","Polokwane Central":"PLC","Tzaneen":"TZN","Nelspruit":"NLS","Witbank":"WTB",
  "Rustenburg":"RUS","Klerksdorp":"KLK","Kimberley":"KIM","Upington":"UPT",
  "Windhoek":"WDH","Gaborone":"GBE","Harare":"HRE"
};
const DSP_CC={"South Africa":"ZA","Namibia":"NA","Botswana":"BW","Zimbabwe":"ZW",
              "Zambia":"ZM","Mozambique":"MZ","Lesotho":"LS","Eswatini":"SZ"};
const DSP_SUBDIVISIONS=["Lorraine","Bethel","Grace","Highfield","Riverside","Oakridge"];
/* sample rows come from the viewer's own localities — country is derived, never stored on the row's owner */
function dspRowScope(i){
  const ls=dspLocalities();
  const loc = ls.length ? ls[i%ls.length] : ORG.localities[i%ORG.localities.length];
  return {locality:loc, country:countryOf(loc)};
}
function dspValue(f,i){
  const sc=dspRowScope(i);
  if(f.tech==="country_nm")     return sc.country;
  if(f.tech==="locality_nm")    return sc.locality;
  if(f.tech==="subdivision_nm") return DSP_SUBDIVISIONS[dspHash(sc.locality,i)%DSP_SUBDIVISIONS.length];
  if(f.tech==="locality_cd")    return (DSP_CC[sc.country]||"ZA")+"-"+(DSP_LOC_CD[sc.locality]||sc.locality.replace(/[^A-Za-z]/g,"").slice(0,3).toUpperCase());
  if(f.tech==="venue_nm"||f.tech==="property_nm") return sc.locality+" Hall";
  if(DSP_POOL[f.tech]) return DSP_POOL[f.tech][i%8];
  if(/_nm$/.test(f.tech)&&/name|traveller|secretary|family/i.test(f.label)) return DSP_NAMES[i%8];
  if(f.type==="date") return (f.format==="MMM YYYY")?DSP_POOL.period_month[i%8]
    :(/HH:mm/.test(f.format||"")?DSP_DATES[i%8]+" 0"+(7+(i%3))+":"+("0"+((11+i*7)%60)).slice(-2):DSP_DATES[i%8]);
  if(f.type==="measure"){
    if(f.example==="1"&&f.format==="0") return ["1","1","0","1","1","0","1","1"][i%8];
    if(f.example==="1") return "1";
    return dspVary(f.example,i);
  }
  if(/\d/.test(String(f.example))) return String(f.example).replace(/(\d+)(?!.*\d)/,(dgt)=>{
    const n=String(parseInt(dgt,10)+dspHash(f.tech,i*7919+13)%900);
    return n.length<dgt.length?new Array(dgt.length-n.length+1).join("0")+n:n;
  });
  return f.example;
}
function dspCell(d,f,i){
  const mk=dspMask(d,f);
  const missing = (f.complete<60 && i%3===1) || (f.complete<95 && f.complete>=60 && i===5);
  if(mk.state==="never")     return {t:"[not loaded]", m:true, why:"Never loaded into Spiff. "+f.mask};
  if(mk.state==="withheld")  return {t:"[withheld]",   m:true, why:mk.you};
  if(mk.state==="hashed")    return {t:"••••"+("00000"+dspHash(f.tech,i*7919+7).toString(16)).slice(-5), m:true, why:mk.you};
  if(mk.state==="suppressed"&&f.type==="measure") return {t:"<5", m:true, why:mk.you};
  if(mk.state==="rounded")   return {t:String(dspValue(f,i)).slice(-4), m:true, why:mk.you};
  if(missing)                return {t:"—", m:false, why:"No value recorded for this row. That is missing data, not hidden data."};
  return {t:dspValue(f,i), m:false, why:""};
}

/* ---------- route ---------- */
function openDataset(id,tab){
  const d=ds(id); if(!d) return;
  const same=(id===DSP.id);
  DSP.id=id;
  DSP.tab=tab||(same?DSP.tab:"overview")||"overview";
  if(!same){ DSP.q=""; DSP.onlyM=DSP.onlyP=DSP.onlyX=false; }
  crumbTrail([["Data catalogue","go('catalog')"],[esc2(d.name),null]]);
  go("dataset",{id:id,tab:DSP.tab});
}
function renderDataset(arg){
  arg=arg||{};
  const d=ds(arg.id||DSP.id)||DATASETS[0];
  /* DSP.tab is the live tab — it survives a re-render from startSim() or a filter change */
  if(d.id!==DSP.id){ DSP.id=d.id; DSP.tab=arg.tab||"overview"; DSP.q=""; DSP.onlyM=DSP.onlyP=DSP.onlyX=false; }
  if(!DSP.tab) DSP.tab="overview";
  const blocked=d.cert==="blocked", dead=blocked||d.cert==="deprecated";
  const sys=sysById(d.sys), full=/^Full/.test(d.access);

  const acts='<button class="btn pri" onclick="dspAskAbout(\''+d.id+'\')">'+I2.spark+'Ask a question about this</button>'
    +'<button class="btn" onclick="dspStar(\''+d.id+'\',this)">'+I2.star+'<span>'+(DSP.stars[d.id]?"Starred":"Star")+'</span></button>'
    +'<button class="btn" onclick="toast(\'Link copied — it opens for anyone, but re-runs under their own permissions\')">'+I2.copy+'Copy link</button>'
    +'<button class="btn" onclick="whoCanSee(\''+d.id+'\')" title="Answers it here, without opening an access screen">'+I2.eye+'Who can see this?</button>'
    +'<button class="btn" onclick="dspShare(\''+d.id+'\')">'+I2.people+'Share</button>'
    +(!full&&!dead?'<button class="btn" onclick="requestAccessModal(\''+d.id+'\')">'+I2.unlock+'Request access</button>':'')
    +'<button class="btn ghost" onclick="dspReport(\''+d.id+'\')">'+I2.warn+'Report a problem</button>';

  let h = pageHead({
    eyebrow:"Dataset · "+esc2(d.domain),
    title:esc2(d.name)+' <span class="mono" style="font-size:14px;font-weight:400;color:var(--muted)">'+esc2(d.tech)+'</span>',
    desc:esc2(d.purpose),
    badges:certBadge(d)+sensBadge(d.sens)+bdg(d.domain,"info","grid")+bdg(sys.name+" · "+sys.kind,"purple","db")+(d.cert==="verified"?bdg("Signed off by "+d.certBy+" · "+d.certOn,"mut","check"):""),
    acts:acts, back:"go('catalog')"
  });

  if(d.warning) h += callout(blocked?"crit":"warn",'<b>'+(blocked?"Excluded from Spiff by policy":"Read this before you use it")+'</b><div style="margin-top:4px">'+esc2(d.warning)+'</div>'
    +(blocked?'<div style="margin-top:6px">It is not masked, not maskable and not requestable. No field of it reaches any question, for anyone — Platform Admins included.</div>':'')
    +(d.cert==="deprecated"?'<div style="margin-top:8px"><button class="btn sm" onclick="openDataset(\''+(DSP_REPLACES[d.id]||(d.joins||[])[0]||"meetings")+'\')">'+dspIco("chev")+'Use '+esc2((ds(DSP_REPLACES[d.id]||(d.joins||[])[0])||{}).name||"the replacement")+' instead</button></div>':''));
  if(DSP_EDITED[d.id]&&d.cert==="verified") h += callout("warn",'<b>Edited since it was verified.</b> '+esc2(d.certBy)+' signed this off on '+esc2(d.certOn)
    +', and the definition has changed since. The badge stands until a steward re-checks it.'
    +'<div style="margin-top:8px"><button class="btn sm" onclick="toast(\'Re-check requested from '+dspArg(d.certBy)+'\')">'+I2.refresh+'Ask for a re-check</button></div>',"warn");

  h += blocked ? dspBlockedStrip(d) : dspTrustStrip(d);
  h += dspStewardRow(d);

  const tabs=[["overview","Overview"]];
  if(!blocked){ tabs.push(["fields","Fields",d.fields.length]); tabs.push(["sample","Sample data"]); }
  tabs.push(["rules","Rules in force",(d.rules||[]).length]);
  if(!blocked){ tabs.push(["usage","Usage"]); tabs.push(["lineage","Lineage"]); }
  tabs.push(["activity","Activity"]); tabs.push(["access","Access"]);
  if(!tabs.some(t=>t[0]===DSP.tab)) DSP.tab="overview";

  h += '<div style="margin-top:22px">'+tabsHTML("dstabs",tabs,DSP.tab)+'</div>';
  h += pane("dstabs","overview",dspOverview(d),DSP.tab==="overview");
  if(!blocked){
    h += pane("dstabs","fields",dspFieldsPane(d),DSP.tab==="fields");
    h += pane("dstabs","sample",dspSamplePane(d),DSP.tab==="sample");
  }
  h += pane("dstabs","rules",dspRulesPane(d),DSP.tab==="rules");
  if(!blocked){
    h += pane("dstabs","usage",dspUsagePane(d),DSP.tab==="usage");
    h += pane("dstabs","lineage",'<div id="dsp-lineage">'+dspLineage(d)+'</div>',DSP.tab==="lineage");
  }
  h += pane("dstabs","activity",dspActivityPane(d),DSP.tab==="activity");
  h += pane("dstabs","access",dspAccessPane(d),DSP.tab==="access");

  $("#view-dataset").innerHTML=h;
  crumbTrail([["Data catalogue","go('catalog')"],[esc2(d.name),null]]);
  const box=$("#dsp-fsearch");
  if(box) box.addEventListener("input",e=>{ DSP.q=e.target.value; dspPaintFields(); });
  const tb=$('#view-dataset [data-tabs="dstabs"]');
  if(tb) tb.addEventListener("click",(e)=>{
    const b=e.target.closest?e.target.closest("button[data-tab]"):null;
    if(b) DSP.tab=b.getAttribute("data-tab");
  });
  if(!blocked) dspPaintFields();
}
V2ROUTES.dataset = renderDataset;

const DSP_REPLACES = {checkins:"meetings"};
const DSP_EDITED   = {members:true, registrations:true};

/* ---------- trust strip ---------- */
function dspTrustStrip(d){
  const q=d.quality, sc=scoreCls(q.score);
  const qt='<div class="kpi"><div class="kl">Quality score</div><div class="rowflex" style="margin-top:8px;gap:14px">'
    +ring(q.score,sc)+'<div style="flex:1;min-width:90px;font-size:11.5px;color:var(--muted);line-height:1.9">'
    +"Completeness "+q.completeness+"%<br>Validity "+q.validity+"%<br>Uniqueness "+q.uniqueness+"%</div></div></div>";
  return '<div class="g3" style="margin-bottom:14px">'+qt+kpi("Freshness",freshBadge(d.freshness),"SLA: "+esc2(d.sla))+kpi("Last refreshed",esc2(d.refreshed),"Next expected "+esc2(d.next))
    +kpi("Rows",esc2(d.rows),sparkline(d.rowTrend)+'<div style="margin-top:6px">12 months of row counts</div>')
    +kpi("Open incidents",String(d.incidents),d.incidents?'<a class="clickable" style="color:var(--crit)" onclick="switchTab(\'dstabs\',\'activity\')">See what broke</a>':"Nothing outstanding")
    +kpi("Popularity",'#'+d.rank+' <span style="font-size:14px;color:var(--muted)">of '+DATASETS.length+'</span>',esc2(String(d.users))+" people used it in the last 30 days")+'</div>';
}
function dspBlockedStrip(d){
  return panel("Why this is listed at all",
    '<p style="margin:0 0 10px">People kept searching for pastoral notes and finding nothing, so the dataset is listed with its answer attached. '
    +'It has no fields, no sample, no lineage into Spiff and no request path.</p>'+'<div class="kv"><dt>Held in</dt><dd>'+esc2(sysById(d.sys).name)+' — and it stays there</dd>'
    +'<dt>Loaded into Spiff</dt><dd>No columns, ever</dd>'+'<dt>Policy owner</dt><dd>'+esc2(d.owner)+'</dd>'
    +'<dt>Escalation</dt><dd>'+esc2(d.channel)+'</dd></div>',{icon:"lock",cls:"",sub:"Nothing to query"});
}

/* ---------- stewardship ---------- */
function dspSteward(role,name,what){
  return '<div class="kpi"><div class="kl">'+esc2(role)+'</div><div style="margin-top:10px" class="clickable" onclick="openPerson(\''+dspArg(name)+'\')">'
    +personChip(name,dspTitleOf(name))+'</div>'+'<div class="ks" style="margin-top:8px">'+esc2(what)+'</div>'
    +'<div style="margin-top:10px"><button class="btn sm" onclick="dspContact(\''+dspArg(name)+'\')">'+I2.msg+'Message</button></div></div>';
}
function dspStewardRow(d){
  return '<div class="g3" style="margin-bottom:6px">'+dspSteward("Owner — accountable",d.owner,"Answers for what this dataset means and who may see it.")
    +dspSteward("Steward — day to day",d.steward,"Keeps definitions, formats and field descriptions correct.")
    +dspSteward("Subject-matter expert",d.sme,"Knows the edge cases. Ask before you publish something surprising.")+'</div>'
    +'<div class="rowflex" style="margin:12px 0 4px;font-size:13px;color:var(--muted)">'+bdg(d.channel,"teal","msg")+'<span>Escalation channel — a person answers here, not a queue.</span>'
    +(d.cert==="verified"?'<span class="sp"></span>'+bdg("Approved "+d.certOn+" by "+d.certBy,"ok","shield"):"")+'</div>';
}

/* ---------- overview ---------- */
function dspOverview(d){
  const qs=(d.questions||[]).map((t)=>{
    const id=dspAnswerId(t);
    return '<div class="lrow" onclick="dspAsk(\''+dspArg(t)+'\')"><div class="li">'+I2.spark+'</div>'
      +'<div class="lm"><div class="lt">'+esc2(t)+'</div><div class="ls">'+(id?"A saved answer already exists — opens straight away":"Spiff will build this from scratch, scoped to you")+'</div></div>'
      +'<div class="lr">'+dspIco("chev")+'</div></div>';
  }).join("")||emptyState("No worked examples yet","Ask anything — the first question here becomes the example.","spark");

  const joins=(d.joins||[]).map((j)=>{
    const o=ds(j); if(!o) return "";
    const shared=d.fields.map(f=>f.tech).filter(t=>o.fields.some(g=>g.tech===t)).slice(0,2);
    return '<div class="lrow" onclick="openDataset(\''+o.id+'\')"><div class="li">'+I2.db+'</div>'+'<div class="lm"><div class="lt">'+esc2(o.name)+certBadge(o)+'</div>'
      +'<div class="ls">'+(shared.length?"Joins on "+shared.join(" and "):"Combined through the locality spine")+'</div></div>'+'<div class="lr">'+esc2(o.rows)+' rows'+dspIco("chev")+'</div></div>';
  }).join("")||'<div class="panel-b"><div class="mutedtext">Nothing is routinely combined with this one.</div></div>';

  const left=panel("What this is",
      '<p style="margin:0 0 12px;font-size:14.5px;line-height:1.65">'+esc2(d.purpose)+'</p>'
      +'<div class="defblock" style="margin-bottom:14px"><b>Grain.</b> '+esc2(d.grain)+'</div>'+'<div class="kv"><dt>Who is in it</dt><dd>'+esc2(d.population)+'</dd>'
      +'<dt>Coverage</dt><dd>'+esc2(d.coverage)+'</dd>'+'<dt>Refresh</dt><dd>'+esc2(d.sla)+' — last run '+esc2(d.refreshed)+'</dd></div>'+'<div class="hairline"></div>'
      +'<div style="font-size:13.5px;line-height:1.7"><b>Known exclusions.</b> '+esc2(d.exclusions)
      +' Anything excluded here is excluded for everyone, in every answer — it is not a permission you can be granted.</div>',{icon:"info"})
    + panel("What you can ask",qs,{icon:"spark",tight:true,sub:"Click one and it runs, scoped to "+esc2(dspViewerName().split(" ")[0]),foot:"Every question re-checks your permissions at the moment you ask."})
    + panel("Commonly combined with",joins,{icon:"link",tight:true});

  const q=d.quality;
  const dims=[["Completeness",q.completeness,"Fields populated where a value is expected"],["Validity",q.validity,"Values that pass their format and range checks"],
              ["Freshness",q.freshness,"Loads landing inside the SLA window"],["Uniqueness",q.uniqueness,"Rows that are genuinely distinct at the stated grain"]];
  const right=panel("Quality, dimension by dimension",
      dims.map(x=>'<div style="margin-bottom:13px"><div class="rowflex" style="justify-content:space-between;font-size:13px"><b>'+x[0]+'</b><span class="mono">'+x[1]+'%</span></div>'
        +meter(x[1],scoreCls(x[1]))+'<div style="font-size:11.5px;color:var(--muted);margin-top:4px">'+x[2]+'</div></div>').join(""),{icon:"shield"})+ panel("Your access",
      '<div class="rowflex" style="margin-bottom:10px">'+bdg(d.access,/^Full/.test(d.access)?"ok":/^No access|Blocked/.test(d.access)?"crit":"warn","shield")+'</div>'
      +'<div style="font-size:13.5px;line-height:1.65">'+esc2(d.accessNote)+'</div>'+'<div class="hairline"></div>'
      +'<div style="font-size:12.5px;color:var(--muted)">Read as '+esc2(dspViewerName())+' · '+esc2(dspLocalities().join(", ")||"no localities assigned")+'</div>',
      {icon:"lock",act:'<button class="btn sm" onclick="switchTab(\'dstabs\',\'access\')">Details</button>'})+ panel("Definitions used here",
      (d.fields.filter(f=>f.glossary).slice(0,4).map((f)=>{
        const g=(typeof GLOSSARY!=="undefined")?GLOSSARY.filter(x=>x.term===f.glossary)[0]:null;
        return '<div class="lrow" onclick="go(\'glossary\')"><div class="lm"><div class="lt">'+esc2(f.glossary)+(g?bdg("v"+g.version,"mut"):"")+'</div>'
          +'<div class="ls">'+esc2(g?g.def:"One agreed definition, owned by a named person.")+'</div></div></div>';
      }).join(""))||'<div class="mutedtext" style="padding:2px">No glossary terms are linked from this dataset yet.</div>',{icon:"book",tight:true});

  return '<div class="split">'+left+'<div>'+right+'</div></div>';
}
function dspAnswerId(text){
  if(typeof ANSWERS==="undefined") return null;
  const n=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const t=n(text), tw=t.split(" ");
  for(const k in ANSWERS){
    const a=n(ANSWERS[k].q);
    if(a===t||a.indexOf(t)===0||t.indexOf(a)===0) return k;
    const aw=a.split(" "), hit=tw.filter(w=>w.length>3&&aw.indexOf(w)>=0).length;
    if(hit>=Math.max(3,Math.ceil(tw.filter(w=>w.length>3).length*0.7))) return k;
  }
  return null;
}
function dspAsk(text){ const id=dspAnswerId(text); if(id) openFromCard(id); else askText(text); }
function dspAskAbout(id){ const d=ds(id); toast("Ask about "+d.name+" — it runs as you, under your permissions"); homeAskFocus(); }
function dspStar(id,btn){
  DSP.stars[id]=!DSP.stars[id];
  const b=btn||(window.event&&window.event.currentTarget);
  if(b&&b.lastChild) b.lastChild.textContent=DSP.stars[id]?"Starred":"Star";
  toast(DSP.stars[id]?"Starred — it shows first in your catalogue":"Removed from your starred datasets");
}
function dspContact(name){ toast("Message drafted to "+name+" in "+ (personByName(name)?"Teams":"Teams")); }
function dspShare(id){
  const d=ds(id);
  openModal('<h3>Share '+esc2(d.name)+'</h3><div class="msub">Sharing a dataset shares the <i>page</i>, never the rows. Whoever opens it sees it under their own permissions.</div>'
    +'<div class="field"><label>Link</label><div class="link"><span>ubt.spiff/d/'+esc2(d.id)+'</span><button onclick="toast(\'Link copied\')">Copy</button></div></div>'
    +'<div class="sharenote">'+dspIco("shield",17)+'<div>If they cannot see this data, the page tells them so and offers a request. It never shows them a row they are not entitled to.</div></div>'
    +modalFoot("Close","Send in Teams","closeModal();toast('Shared — the recipient opens it under their own scope')"));
}
function dspReport(id){
  const d=ds(id);
  openModal('<h3>Report a problem</h3><div class="msub">This goes to '+esc2(d.steward)+', the steward, and is visible on the Activity tab within the hour.</div>'
    +'<div class="field"><label>What is wrong</label><select id="dsp-prob"><option>A number looks wrong</option><option>A description is out of date</option>'
    +'<option>A field is missing</option><option>Data is stale or late</option><option>I can see something I should not</option><option>I cannot see something I should</option></select></div>'
    +'<div class="field"><label>Detail</label><div class="fcontrol"><textarea rows="3" placeholder="What did you expect, and what did you get?"></textarea></div></div>'
    +modalFoot("Cancel","Send to steward","closeModal();toast('Sent to "+dspArg(d.steward)+" — you will see it on the Activity tab')"));
}

/* ---------- fields ---------- */
function dspTypeTok(t){
  const c=t==="measure"?"m":t==="attribute"?"a":"f";
  return '<span class="tok '+c+'">'+esc2(t==="geo"?"geography":t)+'</span>';
}
function dspFieldsPane(d){
  return panel("Every field, and what you personally see of it",
    '<div class="rowflex" style="margin-bottom:14px">'
      +'<div class="bigsearch" style="flex:1;min-width:220px">'+I2.search+'<input id="dsp-fsearch" value="'+esc2(DSP.q||"")+'" placeholder="Search fields — try a business word like &quot;attendance&quot;" style="padding-left:44px;font-size:14px"></div></div>'
    +'<div class="chipbar" style="margin-bottom:14px">'+'<button class="fchip2'+(DSP.onlyM?" on":"")+'" onclick="dspFilt(\'onlyM\')">Only measures</button>'
      +'<button class="fchip2'+(DSP.onlyP?" on":"")+'" onclick="dspFilt(\'onlyP\')">Only personal data</button>'
      +'<button class="fchip2'+(DSP.onlyX?" on":"")+'" onclick="dspFilt(\'onlyX\')">Only what is masked for me</button></div>'
    +'<div id="dsp-fields">'+dspFieldsFrame(d)+'</div>',
    {icon:"list",sub:d.fields.length+" fields · click any row for the full property sheet",
     foot:"Masking is applied before the answer is written, not hidden in the display. A field withheld from you never enters the calculation."});
}
function dspFilt(k){
  DSP[k]=!DSP[k]; dspPaintFields();
  const b=document.querySelectorAll("#view-dataset .fchip2");
  if(b.length>=3){ b[0].classList.toggle("on",DSP.onlyM); b[1].classList.toggle("on",DSP.onlyP); b[2].classList.toggle("on",DSP.onlyX); }
}
function dspPaintFields(){ const d=ds(DSP.id); const el=$("#dsp-fields"); if(el&&d) el.innerHTML=dspFieldsFrame(d); }
function dspFieldsFrame(d){
  const q=(DSP.q||"").toLowerCase();
  const items=d.fields.filter(function(f){
    const mk=dspMask(d,f);
    if(DSP.onlyM&&f.type!=="measure") return false;
    if(DSP.onlyP&&f.sens!=="Personal"&&f.sens!=="Restricted") return false;
    if(DSP.onlyX&&mk.state==="clear") return false;
    if(q&&(f.label+" "+f.tech+" "+f.desc+" "+(f.synonyms||[]).join(" ")).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  const num=function(v){ return parseFloat(String(v==null?"":v).replace(/[^\d.]/g,""))||0; };
  return listFrame("dsp-fields-"+d.id, {
    items: items, repaint: dspPaintFields, noun: "fields", noun1: "field", size: 20,
    sorts: [{key:"order",    label:"Table order",         get:function(f){ return d.fields.indexOf(f); }},
            {key:"name",     label:"Name",                get:function(f){ return f.label; }},
            {key:"type",     label:"Type",                get:function(f){ return f.type; }},
            {key:"sens",     label:"Sensitivity",         get:function(f){ return f.sens; }},
            {key:"complete", label:"Least complete first",get:function(f){ return f.complete; }},
            {key:"distinct", label:"Most distinct values",get:function(f){ return num(f.distinct); }, desc:true}],
    cols: [{label:"Field", sort:"name", cell:function(f){
              return '<div style="font-weight:600">'+esc2(f.label)+'</div><div class="tech">'+esc2(f.tech)+'</div>'
                +((f.synonyms||[]).length?'<div class="tokrow" style="margin-top:5px">'+f.synonyms.map(s=>'<span class="tok f" style="font-size:11px;padding:1px 7px">'+esc2(s)+'</span>').join("")+'</div>':""); }},
           {label:"Type", sort:"type", cell:function(f){ return dspTypeTok(f.type); }},
           {label:"What it means", style:"max-width:280px", cell:function(f){ return esc2(f.desc)+(f.glossary?'<div style="margin-top:4px">'+bdg(f.glossary,"info","book")+'</div>':""); }},
           {label:"Example", cell:function(f){ return '<span class="tech">'+esc2(f.example)+'</span>'; }},
           {label:"What you see", sort:"sens", cell:function(f){ const mk=dspMask(d,f); return sensBadge(f.sens)+'<div style="font-size:11.5px;color:var(--muted);margin-top:4px;max-width:190px">'+esc2(mk.you)+'</div>'; }},
           {label:"Usage", cell:function(f){ return esc2(f.usage); }},
           {label:"Complete", sort:"complete", cell:function(f){ return '<div class="rowflex" style="gap:7px">'+meter(f.complete,scoreCls(f.complete))+'<span class="mono" style="font-size:11.5px">'+f.complete+'%</span></div>'; }},
           {label:"Distinct", sort:"distinct", num:true, cell:function(f){ return esc2(f.distinct); }},
           {label:"Format", cell:function(f){ return '<span class="tech">'+esc2(f.format)+'</span>'; }}],
    rowClick: function(f){ return "dspFieldModal('"+d.id+"',"+d.fields.indexOf(f)+")"; },
    notOurs: "Fields come from the source system — Spiff describes them, it does not edit them",
    emptyTitle: "No field matches that", emptySub: "Try a business word rather than a column name.", emptyIcon: "search"
  });
}
function dspAgg(f){
  if(f.type!=="measure") return "None — this is something you group by";
  if(/%/.test(f.format||"")||/rate|pct/.test(f.tech)) return "AVERAGE OF — never sum a rate";
  if(/count/.test(f.tech)) return "UNIQUE COUNT OF";
  return "TOTAL OF";
}
function dspFieldModal(dsid,i){
  const d=ds(dsid), f=d.fields[i], mk=dspMask(d,f), rid=dspRuleFor(d,f);
  const g=(typeof GLOSSARY!=="undefined"&&f.glossary)?GLOSSARY.filter(x=>x.term===f.glossary)[0]:null;
  const prio=1+dspHash(f.tech,0)%9;
  const ai = f.type==="measure"
    ? "When a question says “"+(f.synonyms[0]||f.label.toLowerCase())+"”, use this column and aggregate it with "+dspAgg(f).split(" —")[0]+". "+f.desc
    : "Group and filter by this; it is a label, not a number. Recognise it from: "+([f.label].concat(f.synonyms||[]).join(", "))+".";
  openModal('<h3>'+esc2(f.label)+'</h3><div class="msub"><span class="mono">'+esc2(f.tech)+'</span> · '+esc2(d.name)+'</div>'
    +'<div class="rowflex" style="margin-bottom:14px">'+dspTypeTok(f.type)+sensBadge(f.sens)+dspMaskBadge(mk)+(f.glossary?bdg(f.glossary,"info","book"):"")+'</div>'
    +'<div class="defblock" style="margin-bottom:14px">'+esc2(f.desc)+'</div>'+callout(mk.state==="clear"?"ok":"warn",'<b>What you see.</b> '+esc2(mk.you)
      +(f.mask?'<div style="margin-top:5px;font-size:12.5px">Rule in force: <span class="mono">'+esc2(rid||"—")+'</span>'
        +(rid?' <a class="clickable" style="color:var(--accent)" onclick="closeModal();openRule(\''+dspArg(rid)+'\')">open the rule</a>':"")+'</div>':""))
    +'<div class="hairline"></div>'+'<div class="kv"><dt>Example value</dt><dd class="mono">'+esc2(f.example)+'</dd>'+'<dt>Aggregation</dt><dd>'+esc2(dspAgg(f))+'</dd>'
    +'<dt>Format pattern</dt><dd class="mono">'+esc2(f.format)+'</dd>'+'<dt>Completeness</dt><dd>'+f.complete+'% of rows carry a value</dd>'
    +'<dt>Distinct values</dt><dd>'+esc2(f.distinct)+'</dd>'+'<dt>Usage</dt><dd>'+esc2(f.usage)+'</dd>'
    +'<dt>Search priority</dt><dd>'+prio+' of 10 — how hard Spiff reaches for this column when the wording is loose</dd>'
    +'<dt>Also called</dt><dd>'+((f.synonyms||[]).length?esc2(f.synonyms.join(", ")):"No synonyms recorded")+'</dd>'
    +(g?'<dt>Agreed definition</dt><dd>'+esc2(g.def)+' <span class="mutedtext">— '+esc2(g.owner)+', v'+g.version+'</span></dd>':"")+'</div><div class="hairline"></div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:.05em">AI context</div>'
    +'<div style="font-size:13.5px;line-height:1.6">'+esc2(ai)+'</div>'+modalFoot("Close","Ask about this field","closeModal();dspAsk('"+dspArg(f.label+" by locality, this year")+"')"),560);
}

/* ---------- sample data ---------- */
function dspSamplePane(d){
  const shown=d.fields.slice(0,8);
  const hidden=d.fields.map(f=>({f:f,mk:dspMask(d,f)})).filter(x=>x.mk.state!=="clear");
  const rows=[];
  for(let i=0;i<7;i++){
    rows.push('<tr>'+shown.map((f)=>{
      const c=dspCell(d,f,i);
      return '<td'+(f.type==="measure"?' class="num"':"")+(c.why?' title="'+esc2(c.why)+'"':"")+'>'+(c.m?'<span style="color:var(--crit);font-family:var(--mono);font-size:12px">'+esc2(c.t)+'</span>'
             :'<span'+(f.type==="measure"?' class="mono"':"")+'>'+esc2(c.t)+'</span>')+'</td>';
    }).join("")+'</tr>');
  }
  const banner = hidden.length
    ? callout("warn",'<b>'+hidden.length+' of '+d.fields.length+' fields are not shown to you in full.</b> This is the real table, run as '+esc2(dspViewerName())+'. Nothing below has been softened for a demo.'
        +'<ul style="margin:8px 0 0;padding-left:18px;line-height:1.75;font-size:13px">'
        +hidden.slice(0,6).map(x=>'<li><b>'+esc2(x.f.label)+'</b> — '+esc2(x.mk.you)+' <span class="mono" style="font-size:11.5px;color:var(--muted)">'+esc2(dspRuleFor(d,x.f)||"")+'</span></li>').join("")
        +(hidden.length>6?'<li>and '+(hidden.length-6)+' more — see the Fields tab.</li>':"")+'</ul>')
    : callout("ok",'<b>Nothing is hidden from you in this dataset.</b> Every field below is shown in full, because your role and locality entitle you to all of it. Someone else opening this page may see a different table.');

  const sim = SIM
    ? '<button class="btn" onclick="stopSim()">'+I2.eye+'Back to your own view</button>'
    : '<button class="btn" onclick="startSim(\'Tumelo Maseko\')">'+I2.eye+'Show me what a Regional Coordinator would see</button>';

  return panel("Sample rows, run as you",
      banner+'<div class="rowflex" style="margin:14px 0">'+sim+'<button class="btn" onclick="startSim(\'Dawid Kruger\')">'+I2.people+'…and what a Locality Secretary sees</button>'
      +'<span class="sp"></span><span class="legend"><span><i style="background:var(--crit)"></i>Hidden from you</span><span><i style="background:var(--hair)"></i>— means no value recorded</span></span></div>'
      +'<div class="dtbl-wrap cap"><table class="dtbl"><thead><tr>'+shown.map((f)=>{ const mk=dspMask(d,f); return '<th'+(f.type==="measure"?' class="num"':"")+'>'+esc2(f.label)
        +(mk.state!=="clear"?' <span title="'+esc2(mk.you)+'" style="color:var(--crit)">•</span>':"")+'</th>'; }).join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>'
      +(d.fields.length>8?'<div class="mutedtext" style="margin-top:10px">Showing the first 8 of '+d.fields.length+' fields. Hover any hidden cell to see which rule removed it.</div>':""),
    {icon:"eye",sub:"7 rows · "+esc2(dspLocalities().join(", ")||"your scope"),
     foot:"“No data” and “not allowed to see the data” look different on purpose. A dash is missing; a red marker is withheld."});
}

/* ---------- rules in force ---------- */
function dspRulesPane(d){
  const ids=d.rules||[];
  const live=typeof ruleById==="function";
  const body=ids.map((id)=>{
    const r=live?ruleById(id):null;
    const c=(r&&typeof ruleCat==="function")?ruleCat(r.category):null;
    const cat=c?c.label:(r&&(r.category||r.cat))||"Governance rule";
    const sev=r&&(r.severity||r.sev)||"";
    const sevCls=(typeof RULE_SEVCLS!=="undefined"&&RULE_SEVCLS[sev])||(/block/i.test(sev)?"crit":"warn");
    const stat=r&&r.status||"";
    const statCls=(typeof RULE_STATUSCLS!=="undefined"&&RULE_STATUSCLS[stat])||"mut";
    const say=r&&(r.statement||r.plain||r.sentence||r.desc||r.name)||"Opens in Business rules. The full sentence, owner and precedence live there.";
    return '<div class="lrow" onclick="openRule(\''+dspArg(id)+'\')"><div class="li">'+(c&&I2[c.icon]||I2.shield)+'</div>'
      +'<div class="lm"><div class="lt">'+esc2(r&&r.name?r.name:dspHumanRule(id))+bdg(cat,c?c.color:"info")
      +(sev?bdg(sev,sevCls):"")+(stat&&stat!=="Active"?bdg(stat,statCls):"")+'</div>'
      +'<div class="ls" style="white-space:normal">'+dspRuleSentence(say)+'</div>'
      +(r&&r.owner?'<div class="ls" style="margin-top:3px">Owned by '+esc2(r.owner)+(r.lastRun?' · last ran '+esc2(r.lastRun):"")+'</div>':"")+'</div>'
      +'<div class="lr"><span class="mono" style="font-size:11.5px">'+esc2(id)+'</span>'
      +(r&&r.precedence!=null?bdg("precedence "+r.precedence,"mut"):"")+dspIco("chev")+'</div></div>';
  }).join("")||'<div class="panel-b">'+emptyState("No rule binds to this dataset","Locality scoping still applies at the platform level to every question you ask.","shield")+'</div>';

  const owners=ids.map((id)=>{ const r=live?ruleById(id):null; return r&&r.owner?r.owner:null; }).filter(Boolean);
  const mine=d.fields.filter(f=>dspMask(d,f).state!=="clear");
  const groupedByReason={};
  mine.forEach((f)=>{ const k=dspMask(d,f).you; (groupedByReason[k]=groupedByReason[k]||[]).push(f.label); });

  return '<div class="split">'+ panel("Rules that run every time you ask",body,{icon:"shield",tight:true,
        sub:ids.length+" bound to this dataset",
        foot:live?("Owned by "+(owners.length?esc2([].concat(owners).filter((v,i,a)=>{return a.indexOf(v)===i;}).join(", ")):"named stewards")+". Rules are versioned; changing one shows up on the Activity tab."):
                  "Rule detail is served from the business-rules library. The ids above are the stable references you can quote in an audit."})+ '<div>'+ panel("What that adds up to, for you",
        Object.keys(groupedByReason).length
          ? Object.keys(groupedByReason).map(k=>'<div style="margin-bottom:13px"><div style="font-size:13.5px;font-weight:600">'+esc2(k)+'</div>'
              +'<div class="tokrow" style="margin-top:6px">'+groupedByReason[k].map(l=>'<span class="tok f">'+esc2(l)+'</span>').join("")+'</div></div>').join("")
          : '<div class="mutedtext">Nothing in this dataset is masked, filtered or suppressed for you. Another viewer may see less.</div>',
        {icon:"eyeoff"})+ panel("Precedence",
        '<div style="font-size:13.5px;line-height:1.7">Area scoping runs first and merges with AND against every other filter. '
        +'After that the rules apply in precedence order — the number on each row above — and each one can only remove or blur. '
        +'Two rules together can only ever make you see <i>less</i>: nothing in this list can widen what you see.</div>'
        +'<div class="hairline"></div>'+'<div class="rowflex"><button class="btn sm" onclick="go(\'rules\')">'+I2.book+'Open the rule library</button>'
        +'<button class="btn sm" onclick="switchTab(\'dstabs\',\'sample\')">'+I2.eye+'See it applied</button></div>',{icon:"filter"})+ '</div></div>';
}

/* ---------- usage ---------- */
function dspUsagePane(d){
  const seed=dspHash(d.id,3);
  const bars=[];for(let i=0;i<12;i++) bars.push(20+((seed>>(i%9))+i*13+d.popularity)%80);
  const teamFor={"LDM Operations":"LDM Operations","Membership & Care":"Membership & Care","Travel & Logistics":"Travel & Logistics",
                 "Events":"Events","Estates":"Estates","Finance":"Finance","Statistics":"Statistics"};
  const key=[d.owner,d.steward,d.sme];
  let top=PEOPLE.filter(p=>key.indexOf(p.name)>=0 || p.team===teamFor[d.domain]).sort((a,b)=>b.asked-a.asked);
  if(top.length<4) PEOPLE.slice().sort((a,b)=>b.asked-a.asked).forEach(p=>{ if(top.length<5&&top.indexOf(p)<0&&p.status==="active") top.push(p); });
  top=top.sort((a,b)=>b.asked-a.asked).slice(0,6);
  const like=PEOPLE.filter(p=>p.title===viewer().title && p.name!==dspViewerName()).length+ (d.domain===(viewer().team||"")?3:2);

  const asks=(d.questions||[]).map((t,i)=>{
    const c=[Math.round(d.users*0.42),Math.round(d.users*0.24),Math.round(d.users*0.13)][i]||4;
    return '<div class="lrow" onclick="dspAsk(\''+dspArg(t)+'\')"><div class="lm"><div class="lt">'+esc2(t)+'</div>'
      +'<div class="ls">'+c+' times in the last 30 days</div></div><div class="lr">'+dspIco("chev")+'</div></div>';
  }).join("")||'<div class="panel-b"><div class="mutedtext">Nobody has asked anything of this dataset in the last 30 days.</div></div>';

  const built=[
    {i:"file",t:(d.questions[0]||d.name+" — standing summary"),s:"Saved answer · "+d.owner+" · re-runs per viewer"},
    {i:"flow",t:"Weekly "+d.domain.toLowerCase()+" digest",s:"Automation · "+d.steward+" · runs as its owner, every Monday 07:00"},
    {i:"grid",t:d.domain+" overview",s:"Dashboard · 4 tiles read from this dataset"}
  ].map(x=>'<div class="lrow" onclick="toast(\'Opens the object that reads this dataset\')"><div class="li">'+I2[x.i]+'</div>'
      +'<div class="lm"><div class="lt">'+esc2(x.t)+'</div><div class="ls">'+esc2(x.s)+'</div></div><div class="lr">'+dspIco("chev")+'</div></div>').join("");

  return '<div class="split">'+ panel("How much it is used",
        '<div class="g3" style="margin-bottom:16px">'+kpi("Popularity",String(d.popularity),"Rank #"+d.rank+" of "+DATASETS.length+" datasets")
        +kpi("People",String(d.users),esc2(d.users)+" asked something of it in the last 30 days")+kpi("Questions",String(Math.round(d.users*2.4)),"Across saved answers, chats and automations")+'</div>'
        +'<div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">Questions per week, last 12 weeks</div>'+sparkline(bars)+'<div class="hairline"></div>'
        +callout("info",'<b>People like you.</b> '+(like===1?"1 other person":like+" other people")+' with your role ('+esc2(viewer().title||"colleague")+') '+(like===1?"uses":"use")+' this dataset at least weekly. '
          +'That is the fastest signal that you are looking at the right table.'),{icon:"trend"})+ panel("Most asked of it",asks,{icon:"spark",tight:true})
    + panel("Built on this dataset",built,{icon:"flow",tight:true,foot:"Changing a field description here changes the wording in all three."})+ '<div>'+ panel("Top users",
        top.map(p=>'<div class="lrow" onclick="openPerson(\''+dspArg(p.name)+'\')">'
          +'<div class="lm">'+personChip(p.name,p.title)+'</div><div class="lr"><span class="mono">'+p.asked+'</span></div></div>').join("")
        ||'<div class="panel-b"><div class="mutedtext">No named users yet.</div></div>',
        {icon:"people",tight:true,sub:"by questions asked",foot:"Counts, not content. Nobody can read anyone else's answers from here."})+ '</div></div>';
}

/* ---------- lineage ---------- */
function dspUpstream(d){
  const s=sysById(d.sys);
  if(s.id!=="warehouse") return [s];
  const out=[];
  (d.joins||[]).forEach((j)=>{ const o=ds(j); if(o){ const os=sysById(o.sys); if(os.id!=="warehouse"&&out.indexOf(os)<0) out.push(os); } });
  return out.length?out:[sysById("directory")];
}
function dspBox(title,sub,accent){
  return '<div style="border:'+(accent?"1.5px solid var(--accent)":"1px solid var(--hair)")+';background:var('+(accent?"--accent-soft":"--surface")
    +');border-radius:12px;padding:11px 13px;min-width:170px">'+'<div style="font-weight:600;font-size:13.5px'+(accent?";color:var(--accent)":"")+'">'+esc2(title)+'</div>'
    +'<div style="font-size:11.5px;color:var(--muted);margin-top:3px">'+esc2(sub)+'</div></div>';
}
function dspArrow(){
  return '<svg width="38" height="18" viewBox="0 0 38 18" fill="none" style="flex:none;align-self:center">'
    +'<path d="M2 9h28M25 4l6 5-6 5" stroke="var(--hair)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function dspLineage(d){
  const T=DSP.tech;
  const up=dspUpstream(d).map(s=>dspBox(T?s.id+".raw":s.name, T?s.kind:(s.desc.length>52?s.desc.slice(0,52)+"…":s.desc))).join("");
  const down=[["Answer",(d.questions[0]||("Questions about "+d.name)),"answer."+d.id+"_summary"],
              ["Dashboard",d.domain+" overview","dash."+d.id+"_overview"],
              ["Automation","Weekly "+d.domain.toLowerCase()+" digest","auto."+d.id+"_weekly"],
              ["Connector","Teams · "+d.channel,"mcp.teams"]].map(x=>dspBox(T?x[2]:x[1],x[0])).join("");
  return panel("Where it comes from, where it goes",
    '<div class="rowflex" style="justify-content:space-between;margin-bottom:16px">'
      +'<span class="mutedtext">Business names by default. Technical names are the same boxes, spelled the way the warehouse spells them.</span>'
      +'<span class="rowflex" style="gap:9px;font-size:13px">'+sw(DSP.tech,"dspToggleTech()","Show technical names")+'<span>Show technical names</span></span></div>'
    +'<div class="scrollx"><div style="display:flex;gap:6px;align-items:stretch;min-width:760px;padding-bottom:6px">'+'<div style="display:flex;flex-direction:column;gap:10px;justify-content:center">'
        +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Comes from</div>'+up+'</div>'+dspArrow()
      +'<div style="display:flex;flex-direction:column;gap:10px;justify-content:center">'
        +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">This dataset</div>'
        +dspBox(T?d.tech:d.name, T?d.sys+" · "+d.sla : d.grain.length>52?d.grain.slice(0,52)+"…":d.grain, true)
        +'<div style="font-size:11.5px;color:var(--muted)">'+esc2(d.rows)+' rows · '+esc2(d.sla)+'</div></div>'+dspArrow()+'<div style="display:flex;flex-direction:column;gap:10px;justify-content:center">'
        +'<div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700">Feeds</div>'+down+'</div>'+'</div></div>'
    +'<div class="hairline"></div>'+callout("info",'<b>Change here lands there.</b> Rename a field and the four objects on the right change wording with it. '
      +'Retire this dataset and Spiff names every dependent before it lets you.'),
    {icon:"flow"});
}
function dspToggleTech(){ DSP.tech=!DSP.tech; const el=$("#dsp-lineage"); if(el) el.innerHTML=dspLineage(ds(DSP.id)); }

/* ---------- activity ---------- */
const DSP_ACTDATES=["28 Aug 2026","21 Aug 2026","12 Aug 2026","04 Aug 2026","19 Jul 2026","02 Jul 2026","14 Jun 2026","28 May 2026","11 May 2026","07 Apr 2026","22 Mar 2026","19 Feb 2026"];
const DSP_ACTEXTRA={
  meetings:[["Attendance definition moved to v3","Pavitra Govender","Duplicate check-ins within four hours now collapse to one. Six saved answers re-ran automatically.","ok"],
            ["Field added — Duration (min)","Lesedi Mofokeng","Scheduled length, so room utilisation can be answered without Estates.","" ]],
  members:[["Description edited after verification","Rika Olivier","“Member since” now states that it is the first recorded membership date, not the baptism date.","warn"],
           ["Incident opened — duplicate household links","Sindi Mthembu","412 members pointed at two households. Resolved in the 06:04 load.","crit"]],
  travel:[["Supplier feed late for the third time this month","Colette Marais","Counts after 20 Aug flagged as incomplete on every answer that touches them.","crit"],
          ["Warning badge applied","Colette Marais","Trust badge moved from Approved to Warning while the feed is unreliable.","warn"]],
  registrations:[["Wellbeing masking extended to dietary notes","Amira Rasool","Dietary notes joined accessibility notes under the wellbeing rule.","warn"],
                 ["Retention shortened to 13 months","Gugu Pillay","Rows older than 13 months after event close now leave every query surface.","" ]],
  checkins:[["Marked deprecated","Pavitra Govender","Superseded by Meetings & attendance. Read-only until 31 Dec 2026.","crit"],
            ["Refresh stopped","Reneilwe Dlomo","Final load ran 14 Jun 2026. The table is frozen, not deleted.","warn"]],
  care:[["Excluded from Spiff by policy","Cathleen Oberholzer","No column of this dataset is loaded. The exclusion is not overridable by any role.","crit"],
        ["Listed in the catalogue deliberately","Marcus Vilakazi","People kept searching for it. Listing it with the reason stopped the searching.","" ]],
  growth:[["Rounding to base 5 applied at locality grain","Rupert Mackenzie","National Statistics is exempt; everyone else sees rounded counts.","warn"]],
  budgets:[["Access narrowed to Finance and National Statistics","Brendan Jooste","Two dormant grants removed in the June review.","warn"]]
};
function dspActivityPane(d){
  const ev=[];
  (DSP_ACTEXTRA[d.id]||[]).forEach((x)=>{ ev.push({t:x[0],who:x[1],s:x[2],c:x[3]}); });
  if(d.cert==="verified") ev.push({t:"Approved",who:d.certBy,s:"Checked against the source and signed off. The badge carries their name.",c:"ok",when:d.certOn});
  ev.push({t:"Purpose and grain rewritten in plain English",who:d.steward,s:"“"+d.grain+"”",c:""});
  ev.push({t:"Rule attached — "+dspHumanRule((d.rules||["r-locality-scope"])[0]),who:d.owner,s:"Applies to every question against this dataset, for every viewer.",c:"warn"});
  ev.push({t:"Refresh SLA set to "+d.sla,who:d.steward,s:"Late loads now raise a freshness warning on the answer itself, not just here.",c:""});
  ev.push({t:"Access granted — "+(d.domain==="Finance"?"Finance":d.domain==="Events"?"Event Operations":"LDM Coordinators"),who:d.owner,s:"Granted to the group, time-bound to 12 months, reviewed each quarter.",c:""});
  ev.push({t:"Field descriptions reviewed",who:d.sme,s:d.fields.length+" fields checked; "+Math.max(1,Math.round(d.fields.length/4))+" reworded for people who do not write SQL.",c:""});
  ev.push({t:"Ownership recorded",who:d.owner,s:"Accountable owner and day-to-day steward separated, so escalation has an address.",c:""});
  ev.push({t:"Added to the Spiff catalogue",who:"Marcus Vilakazi",s:"Imported from "+sysById(d.sys).name+" with its column comments intact.",c:"mut",when:"19 Feb 2026"});
  if(d.incidents) ev.push({t:d.incidents+" open incident"+(d.incidents>1?"s":""),who:d.steward,s:"Visible on every answer that reads this dataset until it clears.",c:"crit",when:"25 Aug 2026"});

  ev.forEach((e,i)=>{ if(!e.when) e.when=DSP_ACTDATES[i%12]; });
  ev.sort((a,b)=>{ return Date.parse(b.when)-Date.parse(a.when); });
  const body='<div class="tline">'+ev.slice(0,12).map((e)=>{
    return '<div class="tev"><div class="td3 '+(e.c||"")+'"></div>'+'<div class="rowflex" style="align-items:flex-start;gap:10px">'+avatar(e.who,"sm")
      +'<div style="flex:1;min-width:0"><div class="tt2">'+esc2(e.t)+'</div>'+'<div class="ts2" style="white-space:normal">'+esc2(e.s)+'</div>'
      +'<div class="tw" style="margin-top:4px">'+esc2(e.who)+' · '+esc2(e.when)+'</div></div></div></div>';
  }).join("")+'</div>';

  return '<div class="split">'+ panel("Changelog",body,{icon:"log",sub:"newest first",foot:"Every entry names a person. Nothing on this page was changed by “the system”."})
    + '<div>'+panel("What counts as a change",
        '<div style="font-size:13.5px;line-height:1.7">Schema changes, description edits, certification, rule changes, incidents and access grants all land here. '
        +'A load that ran normally does not — that is freshness, and it lives in the strip at the top.</div><div class="hairline"></div>'
        +'<button class="btn sm" onclick="go(\'audit\')">'+I2.log+'Platform-wide activity log</button>',{icon:"info"})+'</div></div>';
}

/* ---------- access ---------- */
function dspAccessGroups(d){
  const by={"LDM Operations":["ldm-coordinators","southern-cluster","northern-cluster"],
            "Membership & Care":["records-office","southern-cluster","northern-cluster","safeguarding"],
            "Travel & Logistics":["travel-office","ldm-coordinators"],
            "Events":["event-ops","ldm-coordinators"],
            "Statistics":["national-stats","stewards"],
            "Finance":["finance-team","national-stats"],
            "Estates":["southern-cluster","northern-cluster"]};
  const ids=(by[d.domain]||["all-staff"]).concat(["stewards"]);
  const seen={};
  return ids.filter((i)=>{ if(seen[i])return false; seen[i]=1; return !!groupById(i); }).map((i,n)=>{
    const g=groupById(i);
    const lvl=d.cert==="blocked"?"None":(i==="stewards"?"Full":(d.sens==="Personal"||d.sens==="Restricted")&&n>0?"Partial":"Full");
    return {g:g,lvl:lvl};
  });
}
function dspAccessPane(d){
  const full=/^Full/.test(d.access), blocked=d.cert==="blocked";
  const grps=dspAccessGroups(d);
  const total=grps.reduce((a,x)=>{ return a+(blocked?0:x.g.members); },0);
  const local=(typeof REQUESTS!=="undefined"&&Array.isArray(REQUESTS))
    ? REQUESTS.filter(r=>r&&(r.dataset===d.id||r.datasetId===d.id||r.ds===d.id)) : [];
  const hist=local.length
    ? local.map(r=>'<div class="lrow"><div class="lm"><div class="lt">'+esc2(r.purpose||r.reason||"Access request")+'</div>'
        +'<div class="ls">'+esc2(r.status||"Submitted")+' · '+esc2(r.on||r.date||"recently")+'</div></div></div>').join("")
    : (DSP_REQHIST[d.id]||[]).map(r=>'<div class="lrow" onclick="go(\'myaccess\')"><div class="li">'+I2.clock+'</div>'
        +'<div class="lm"><div class="lt">'+esc2(r[0])+bdg(r[1],r[1]==="Approved"?"ok":r[1]==="Pending"?"warn":"mut")+'</div>'
        +'<div class="ls">'+esc2(r[2])+'</div></div><div class="lr">'+dspIco("chev")+'</div></div>').join("")
      ||'<div class="panel-b"><div class="mutedtext">You have never requested access to this dataset.</div></div>';

  return '<div class="split">'+ panel("Your access, in one sentence",
        '<div class="rowflex" style="margin-bottom:12px">'+bdg(d.access,full?"ok":blocked||/^No access/.test(d.access)?"crit":"warn","shield")+'</div>'
        +'<p style="margin:0 0 12px;font-size:14.5px;line-height:1.65">'+esc2(d.accessNote)+'</p>'+'<div class="kv"><dt>Running as</dt><dd>'+esc2(dspViewerName())+' — '+esc2(viewer().title||"")+'</dd>'
        +'<dt>Localities</dt><dd>'+esc2(dspLocalities().join(", ")||"none assigned")+'</dd>'+'<dt>Role bundles</dt><dd>'+esc2(dspRoleNames().join(", ")||"Reader")+'</dd>'
        +'<dt>Checked</dt><dd>On every single run, not at login</dd></div>'+'<div class="hairline"></div>'+'<div class="rowflex">'
        +(!full&&!blocked&&d.cert!=="deprecated"?'<button class="btn pri" onclick="requestAccessModal(\''+d.id+'\')">'+I2.unlock+'Request access</button>':"")
        +'<button class="btn" onclick="switchTab(\'dstabs\',\'rules\')">'+I2.shield+'The rules behind this</button>'+'<button class="btn" onclick="go(\'myaccess\')">'+I2.list+'All my access</button></div>'
        +(blocked?callout("crit","<b>Not requestable.</b> There is no approval chain for this dataset, because there is no grant that would make it visible."):""),
        {icon:"lock"})+ panel("Your request history for this dataset",hist,{icon:"clock",tight:true})+ '<div>'+ panel("Who else has access",
        grps.map(x=>'<div class="lrow" onclick="go(\'people\')"><div class="lm"><div class="lt">'+esc2(x.g.name)
            +bdg(x.lvl,x.lvl==="Full"?"ok":x.lvl==="Partial"?"warn":"mut")+'</div>'+'<div class="ls">'+esc2(x.g.type)+' · owned by '+esc2(x.g.owner)+'</div></div>'
            +'<div class="lr"><span class="mono">'+x.g.members+'</span></div></div>').join(""),
        {icon:"people",tight:true,sub:blocked?"nobody":total+" people, by group",
         foot:"Counts by group, on purpose. Access is granted to groups and inherited; it is never granted to a person by name."})+ panel("How a grant ends",
        '<div style="font-size:13.5px;line-height:1.7">Every grant carries an end date. When someone changes locality or role in Directory, '
        +'their group membership changes on the next sync and their access follows — nobody has to remember to remove it.</div>'
        +'<div class="hairline"></div><div class="mutedtext">Next access review for this dataset: 30 Sep 2026, run by '+esc2(d.owner)+'.</div>',{icon:"clock"})+ '</div></div>';
}
const DSP_REQHIST={
  budgets:[["Travel spend against budget, Southern","Pending","Submitted 26 Aug 2026 · with Brendan Jooste · 2 of 3 approvals"],
           ["Cost centre totals for the LDM review","Declined","12 Mar 2026 · purpose did not require cost-centre detail"]],
  travel:[["Travel bookings for the October gathering","Approved","Granted 04 Aug 2026 · 90 days · expires 02 Nov 2026"]],
  members:[["Contact detail outside my locality","Declined","19 Feb 2026 · use the notice service instead of raw contact fields"]],
  registrations:[["Accessibility notes for venue planning","Approved","Granted 21 Jul 2026 · 60 days · expires 19 Sep 2026"]]
};

/* ---------- request access ---------- */
const DSP_PURPOSES=["Statutory reporting","Locality administration","Care and safeguarding","Event operations","Finance reconciliation","Other"];
function requestAccessModal(datasetId){
  const d=ds(datasetId); if(!d) return;
  if(d.cert==="blocked"){
    openModal('<h3>This one cannot be requested</h3><div class="msub">'+esc2(d.name)+' is excluded from Spiff by policy.</div>'
      +callout("crit","<b>There is no approval chain.</b> No field of this dataset is loaded, so there is nothing an approver could switch on. "
      +"If you have a safeguarding purpose, that conversation happens in "+esc2(d.channel)+", outside Spiff.")+modalFoot("Close","Open the policy","closeModal();openRule('r-pastoral-block')"));
    return;
  }
  const masked=d.fields.filter(f=>dspMask(d,f).state!=="clear").slice(0,6);
  const sens=masked.length?masked:d.fields.slice(0,6);
  const lead=masked.length?"Or only the fields you are currently missing:":"Or narrow it to just the fields you need — a smaller ask is approved faster:";
  openModal('<h3>Request access</h3><div class="msub">'+esc2(d.name)+' · <span class="mono">'+esc2(d.tech)+'</span></div>'
    +'<div class="steps"><div class="st done"><div class="sc">1</div><div class="sn2">You</div></div><div class="bar"></div>'
      +'<div class="st on"><div class="sc">2</div><div class="sn2">'+esc2((ME.manager||"Your manager"))+'</div></div><div class="bar"></div>'
      +'<div class="st"><div class="sc">3</div><div class="sn2">'+esc2(d.owner)+'</div></div><div class="bar"></div>'
      +'<div class="st"><div class="sc">4</div><div class="sn2">'+esc2(d.steward)+'</div></div></div>'+'<div class="field"><label>What you are asking for</label>'
      +'<div style="border:1px solid var(--hair);border-radius:9px;padding:10px 12px;background:var(--ground)">'
      +'<label class="ckrow"><input type="checkbox" checked> The whole dataset — '+esc2(d.name)+'</label>'
      +(sens.length?'<div style="font-size:11.5px;color:var(--muted);margin:8px 0 4px">'+esc2(lead)+'</div>'
        +sens.map(f=>'<label class="ckrow"><input type="checkbox"> '+esc2(f.label)+' <span class="mutedtext">— '+esc2(masked.length?dspMask(d,f).you:dspClip(f.desc,58))+'</span></label>').join(""):"")
      +'</div></div>'+'<div class="field"><label>Purpose — required</label><select id="dsp-purpose" onchange="dspPurposeChange()">'
      +'<option value="">Choose the reason you need it</option>'+DSP_PURPOSES.map(p=>'<option>'+esc2(p)+'</option>').join("")+'</select></div>'
    +'<div class="field" id="dsp-other" style="display:none"><label>Say what it is for</label>'
      +'<div class="fcontrol"><textarea rows="2" placeholder="One sentence. The approver reads this, not a ticket number."></textarea></div></div>'
    +'<div class="field"><label>How long you need it</label><select id="dsp-dur" onchange="dspDurChange()">'
      +'<option value="30">30 days</option><option value="90" selected>90 days</option><option value="180">180 days</option><option value="365">12 months</option></select>'
      +'<div class="mutedtext" style="margin-top:6px" id="dsp-until">Access ends 28 Nov 2026 and is removed automatically. Nobody has to remember.</div></div>'
    +'<label class="ckrow" style="margin:4px 0 2px"><input type="checkbox" id="dsp-attest"> I will use this data only for the purpose above, and I understand every query I run is logged against my name.</label>'
    +modalFoot("Cancel","Send request","dspSubmitRequest('"+dspArg(d.id)+"')"),560);
}
function dspPurposeChange(){ const s=$("#dsp-purpose"), o=$("#dsp-other"); if(s&&o) o.style.display=(s.value==="Other")?"block":"none"; }
function dspDurChange(){
  const s=$("#dsp-dur"), u=$("#dsp-until"); if(!s||!u) return;
  const map={"30":"29 Sep 2026","90":"28 Nov 2026","180":"26 Feb 2027","365":"30 Aug 2027"};
  u.textContent="Access ends "+(map[s.value]||"28 Nov 2026")+" and is removed automatically. Nobody has to remember.";
}
function dspSubmitRequest(id){
  const d=ds(id), p=$("#dsp-purpose"), a=$("#dsp-attest");
  if(p&&!p.value){ toast("Choose a purpose first — the approver decides on the purpose, not the person"); return; }
  if(a&&!a.checked){ toast("Tick the attestation to send the request"); return; }
  closeModal();
  toast("Request sent to "+ME.manager+", then "+d.owner+". Track it in My access.");
}
</script>
