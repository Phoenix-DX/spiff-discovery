<script>
/* =====================================================================
   "Who can see this?" — 9 Sep 2026
   The real question behind all three access surfaces. It used to require
   knowing which of them to open: People & access, My data access, or the
   Access & role domains dataset. Now it is an action on the thing itself.

   It answers from the same resolution a live query uses — the union of a
   person's groups, minus every rule that applies — so it cannot drift from
   what the product would actually do.
   ===================================================================== */

const WCS_CAP = 8;
const WCS = { q:"", level:"all", ds:null, from:null };

function wcsLevels(dsId){
  const out = {full:[], part:[], none:[], block:[]};
  PEOPLE.forEach(function(p){ out[pplAccess(p, dsId).level].push(p); });
  return out;
}
function wcsRows(dsId){
  const q = (WCS.q||"").trim().toLowerCase();
  const lv = wcsLevels(dsId);
  const order = ["full","part","none","block"];
  const pick = WCS.level === "all" ? order : [WCS.level];
  const rows = [];
  pick.forEach(function(k){
    lv[k].forEach(function(p){
      if(q && (p.name+" "+p.title+" "+p.team+" "+p.locality).toLowerCase().indexOf(q) < 0) return;
      rows.push({p:p, level:k});
    });
  });
  return rows;
}
function wcsSetQ(v){ WCS.q = v; wcsPaint(); }
function wcsSetLevel(v){ WCS.level = v; wcsPaint(); }
function wcsPaint(){
  const box = $("#wcs-body"); if(box) box.innerHTML = wcsBodyHTML(WCS.ds);
}
function wcsBodyHTML(dsId){
  const rows = wcsRows(dsId);
  if(!rows.length){
    return '<div class="mutedtext" style="padding:14px 2px">Nobody matches that.</div>';
  }
  return '<div class="wcslist">'
    + cappedList(rows, WCS_CAP, function(r){
        const a = pplAccess(r.p, dsId), L = ACCESS_LEVELS[r.level];
        const why = a.via.length ? 'via '+a.via.map(esc2).join(", ")
          : r.level === "block" ? 'Blocked by policy — no group can grant it'
          : 'No group of theirs holds it';
        return '<div class="wcsrow '+r.level+'">'
          + '<div class="clickable" style="flex:1;min-width:0" onclick="closeModal();openPerson(\''+pplQ(r.p.name)+'\')">'
          +   personChip(r.p.name, r.p.title)
          + '</div>'
          + '<div class="wcsside">'+bdg(L.label, L.cls)
          +   '<div class="wcswhy">'+why+'</div></div></div>';
      }, "people")
    + '</div>';
}
/* the headline: how many people, and the tier that decides it */
function wcsSummary(dsId){
  const lv = wcsLevels(dsId), d = ds(dsId);
  const n = k => lv[k].length;
  const seg = (k, label, cls) => n(k)
    ? '<div class="wcsseg '+k+'"><b>'+fmt(n(k))+'</b><span>'+label+'</span></div>' : '';
  const rules = (d.rules||[]);
  return '<div class="wcssegs">'
    +   seg("full","see everything")
    +   seg("part","see it masked")
    +   seg("none","cannot see it")
    +   seg("block","blocked by policy")
    + '</div>'
    + '<div class="mutedtext" style="font-size:12.5px;margin-top:10px;line-height:1.55">'
    +   'Counted from the same resolution a live question uses: the union of each person\'s groups, '
    +   'minus every rule that applies. '
    +   (rules.length
        ? esc2(rules.length)+' rule'+(rules.length===1?' shapes':'s shape')+' this dataset — '
          + rules.map(function(r){ return '<button class="lnk" onclick="closeModal();openRule(\''+pplQ(r)+'\')">'+esc2(pplRuleName(r))+'</button>'; }).join(', ')+'.'
        : 'No rule narrows this dataset further.')
    + '</div>';
}
/* When the question came from an answer rather than a dataset, say so in the
   modal instead of a toast that vanishes: which datasets the answer reads, and
   which of them is the one doing the limiting. */
function wcsFromLine(){
  const f = WCS.from; if(!f) return '';
  const others = f.reads.filter(function(id){ return id !== f.narrowest; });
  return callout('info',
      '<b>' + esc2(f.answer) + '</b> reads '
    + f.reads.map(function(id){ return '<button class="lnk" onclick="closeModal();whoCanSee(\''+pplQ(id)+'\')">'+esc2(ds(id).name)+'</button>'; }).join(', ')
    + '. An answer is only as visible as its narrowest dataset, and here that is <b>'
    + esc2(ds(f.narrowest).name) + '</b>'
    + (others.length ? ' — so it governs, whatever the others allow.' : '.'))
    + '<div style="height:12px"></div>';
}
function whoCanSee(dsId, from){
  const d = ds(dsId); if(!d) return;
  WCS.ds = dsId; WCS.q = ""; WCS.level = "all"; WCS.from = from || null;
  const seg = (v, label) => '<button class="'+(WCS.level===v?'on':'')+'" onclick="wcsSetLevel(\''+v+'\')">'+label+'</button>';
  openModal('<h3>Who can see ' + esc2(d.name) + '?</h3>'
    + '<div class="msub">' + esc2(d.tech) + ' · ' + sensBadge(d.sens) + ' · ' + esc2(d.sys==="none" ? "not registered" : sysById(d.sys).name) + '</div>'
    + wcsFromLine()
    + wcsSummary(dsId)
    + '<div class="hairline"></div>'
    + '<div class="rowflex" style="gap:10px;margin-bottom:10px;align-items:center">'
    +   '<div class="seg2" id="wcs-seg">'+seg("all","Everyone")+seg("full","Full")+seg("part","Masked")+seg("none","No access")+'</div>'
    +   '<div class="sp"></div>'
    + '</div>'
    + '<div class="bigsearch" style="margin-bottom:10px">'+I2.search
    +   '<input oninput="wcsSetQ(this.value)" placeholder="Find a person, team or locality…"></div>'
    + '<div id="wcs-body">'+wcsBodyHTML(dsId)+'</div>'
    + '<div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>'
    +   '<button class="btn" onclick="closeModal();go(\'people\')">'+I2.people+' Open administration</button>'
    +   '<button class="btn pri" onclick="closeModal();openDataset(\''+pplQ(dsId)+'\')">'+I2.db+' Open the dataset</button></div>', 680);
}

/* the same question, asked of an answer rather than a dataset. An answer reads
   one or more datasets, so it resolves to the narrowest of them. */
function whoCanSeeAnswer(answerId){
  const a = ANSWERS[answerId]; if(!a) return;
  /* A blocked dataset is nobody's narrowest — it is not in the answer at all.
     Leaving it in the pool made every Directory-sourced answer resolve to
     Pastoral care notes, which is loaded by nothing and read by no one. */
  const usable = DATASETS.filter(function(d){ return d.cert !== "blocked" && d.sys !== "none"; });
  const named = (a.sources||[]).map(function(s){ return String(s[0]||"").toLowerCase(); });
  const hit = usable.filter(function(d){
    return named.some(function(n){ return sysById(d.sys).name.toLowerCase() === n; });
  });
  const pool = hit.length ? hit : usable;
  /* the narrowest dataset governs what the answer can show */
  const narrowest = pool.slice().sort(function(x,y){
    return wcsLevels(x.id).full.length - wcsLevels(y.id).full.length;
  })[0];
  if(!narrowest) return;
  whoCanSee(narrowest.id, {
    answer: a.q,
    reads: pool.slice(0, 4).map(function(d){ return d.id; }),
    narrowest: narrowest.id
  });
}
</script>
