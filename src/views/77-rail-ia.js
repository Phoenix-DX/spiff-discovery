<script>
/* =====================================================================
   The rail, after the UX review (15 Sep 2026)
   Ten-ish entries, none nested. Pages that used to be rail entries of
   their own become tabs of a parent: Sources and Definitions under the
   Data catalogue; Team workspaces under Workspaces; My access under
   People & access. The rail highlights the parent; a strip under the
   page head moves between the siblings. Landscape leaves the rail for
   the "New here?" flyout — it explains, it does not govern.
   ===================================================================== */

/* which rail entry lights up for a view that is not itself on the rail */
const RAIL_ALIAS = {
  sources:"catalog", glossary:"catalog", dataset:"catalog", source:"catalog", understand:"catalog",
  library:"workspace", dashes:"workspace", dash:"workspace", team:"workspace", teams:"workspace",
  myaccess:"people", person:"people", sim:"people",
  connector:"mcp", flow:"autos", answer:null, landscape:null
};
function navActive(view){
  const v = RAIL_ALIAS.hasOwnProperty(view) ? RAIL_ALIAS[view] : view;
  document.querySelectorAll('#nav a').forEach(function(a){ a.classList.toggle('active', !!v && a.dataset.view===v); });
}

/* the strip of siblings under a page head */
const IA_STRIPS = {
  data:   [["catalog","Datasets"], ["sources","Sources"], ["glossary","Definitions"]],
  work:   [["workspace","My workspace"], ["library","Team workspaces"]],
  access: [["myaccess","My access"], ["people","Everyone's access"]]
};
const IA_HINT = {
  data:   "Datasets are what Spiff can answer about. Sources are what it has read to learn their shape. Definitions are the agreed words behind the numbers.",
  work:   "Yours, and your teams'. Every saved answer re-runs as whoever opens it.",
  access: "What you can see, and — if you administer access — what everyone else can, and why."
};
function iaStripHTML(group, active){
  return '<div class="ia-strip" role="tablist">'
    + IA_STRIPS[group].map(function(t){ return '<button role="tab" aria-selected="'+(t[0]===active?'true':'false')+'" class="'+(t[0]===active?'on':'')+'" onclick="go(\''+t[0]+'\')">'+esc2(t[1])+'</button>'; }).join('')
    + '<span class="ia-hint">'+esc2(IA_HINT[group])+'</span></div>';
}
function iaInsert(view, group){
  const el = $('#view-'+view); if(!el || el.querySelector('.ia-strip')) return;
  const head = el.querySelector('.v2head');
  if(head) head.insertAdjacentHTML('afterend', iaStripHTML(group, view));
  else el.insertAdjacentHTML('afterbegin', iaStripHTML(group, view));
}
/* wrap each sibling page so the strip appears after every paint */
(function(){
  const wrapRoute = function(view, group){
    const orig = V2ROUTES[view]; if(typeof orig !== 'function') return;
    V2ROUTES[view] = function(arg){ const r = orig(arg); if(!arg) iaInsert(view, group); return r; };
  };
  wrapRoute('catalog','data'); wrapRoute('sources','data'); wrapRoute('glossary','data');
  wrapRoute('people','access'); wrapRoute('myaccess','access');
  /* the two workspace pages are painted by v1's go() */
  if(typeof renderWorkspace === 'function'){ const rw = renderWorkspace; renderWorkspace = function(){ const r = rw.apply(this, arguments); iaInsert('workspace','work'); return r; }; }
  if(typeof renderLibrary === 'function'){ const rl = renderLibrary; renderLibrary = function(){ const r = rl.apply(this, arguments); iaInsert('library','work'); return r; }; }
  /* the direct painters some screens call */
  if(typeof renderCatalog === 'function'){ const rc = renderCatalog; renderCatalog = function(arg){ const r = rc.apply(this, arguments); if(!arg) iaInsert('catalog','data'); return r; }; }
  if(typeof renderGlossary === 'function'){ const rg = renderGlossary; renderGlossary = function(){ const r = rg.apply(this, arguments); iaInsert('glossary','data'); return r; }; }
  if(typeof renderSources === 'function'){ const rs = renderSources; renderSources = function(arg){ const r = rs.apply(this, arguments); if(!arg) iaInsert('sources','data'); return r; }; }
})();

/* names */
CRUMB2.people = "People & access"; CRUMB.people = "People & access";
CRUMB2.admin = "Set-up"; CRUMB.admin = "Set-up";
CRUMB.workspace = "Workspaces"; CRUMB.library = "Team workspaces"; CRUMB.teams = "Team workspaces";

/* Landscape lives in the "New here?" flyout now */
(function(){
  const card = document.querySelector('.railtour .rt-card'); if(!card || card.querySelector('.rt-map')) return;
  const acts = card.querySelector('.rt-acts');
  const row = document.createElement('div'); row.className = 'rt-map';
  row.innerHTML = '<button class="btn sm" onclick="railTourClose();go(\'landscape\')">'+I2.grid+' How Spiff works — one map</button>';
  if(acts) acts.insertAdjacentElement('afterend', row); else card.appendChild(row);
})();
</script>
