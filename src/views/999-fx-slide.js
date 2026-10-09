<script>
/* =====================================================================
   Every dated string in the fixture slides onto the viewer's calendar
   The fixture was written around Friday 11 Sep 2026. The activity log
   already slides (data/54-audit.js). This does the same for every other
   fixture date — "28 Aug 2026", "17 September", "03 Sep", "Fri 11 Sep" —
   so an access request that was 20 days old when written is 20 days
   old whenever the page is opened, and nothing reads overdue by
   accident. Relative words ("today 06:12", "yesterday", "2h ago") are
   already relative and are left alone. Loads last, after every fixture.
   ===================================================================== */
(function(){
  if(!FX_SHIFT_DAYS) return;
  const seen = new Set();
  function walk(o, depth){
    if(!o || typeof o !== "object" || depth > 8 || seen.has(o)) return; seen.add(o);
    if(Array.isArray(o)){ for(let i=0;i<o.length;i++){ if(typeof o[i]==="string") o[i]=fxSlideStr(o[i]); else walk(o[i], depth+1); } return; }
    Object.keys(o).forEach(function(k){ const v=o[k]; if(typeof v==="string") o[k]=fxSlideStr(v); else if(v && typeof v==="object") walk(v, depth+1); });
  }
  /* every fixture except the activity log and its traces, which slid already; consts are reached by name, not via window */
  const roots = [
    function(){ return REQUESTS; }, function(){ return REVIEWS; }, function(){ return CONNECTORS; }, function(){ return MCP_LOG; }, function(){ return MCP_POLICY; },
    function(){ return SOURCES_REG; }, function(){ return SCANS; }, function(){ return FINDINGS; }, function(){ return RULES; }, function(){ return DATASETS; },
    function(){ return GLOSSARY; }, function(){ return TEMPLATES; }, function(){ return PEOPLE; }, function(){ return ORG; }, function(){ return NOTICES; },
    function(){ return ANSWERS; }, function(){ return LIBRARY; }, function(){ return REPORTS; }, function(){ return SCHEDRUNS; }, function(){ return TRIGRULES; },
    function(){ return WORKFLOWS; }, function(){ return THREADS; }, function(){ return PROPOSALS; }, function(){ return GROUPS; }, function(){ return ROLES; },
    function(){ return TEAM_META; }, function(){ return BUDGET; }, function(){ return PROVIDER; }, function(){ return MODEL_ROUTES; },
    function(){ return ACCESS_EVENTS; }, function(){ return ACCESS_TIMEBOUND; }, function(){ return ENT_META; }
  ];
  roots.forEach(function(get){ try { const v = get(); if(v && typeof v==="object") walk(v, 0); } catch(e){} });
})();
</script>
