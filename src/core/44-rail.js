<script>
/* =====================================================================
   The rail — 10 Sep 2026
   Oren's first rule: a side panel collapses, and collapsed it shows an
   icon per area, with the name back on expand. Two states, remembered per
   person, expanded by default. Below 860px the rail used to disappear
   altogether — the one thing in the product that fully blocked a user.
   Now it collapses instead; nothing is ever unreachable.

   Collapsed, the two expander groups (Workspaces, Access) flatten: their
   children show as icons in the run of the rail. Fewer clicks than a
   flyout, and every destination stays one click away.
   ===================================================================== */

const RAIL_KEY = "spiff.rail";

function railSaved(){
  try { return localStorage.getItem(RAIL_KEY); } catch(e){ return null; }
}
function railSet(shut, remember){
  document.body.classList.toggle("rail-shut", !!shut);
  const t = $("#railtog");
  if(t){
    t.setAttribute("aria-expanded", shut ? "false" : "true");
    t.setAttribute("aria-label", shut ? "Expand menu" : "Collapse menu");
    t.setAttribute("title", shut ? "Expand menu" : "Collapse menu");
  }
  railTitles(!!shut);
  if(remember){ try { localStorage.setItem(RAIL_KEY, shut ? "shut" : "open"); } catch(e){} }
}
function railToggle(){ railSet(!document.body.classList.contains("rail-shut"), true); }

/* The one sanctioned use of a tooltip as the primary label: the collapsed
   icon, because the expanded label is one click away. Titles come off again
   on expand so nothing is said twice. */
function railTitles(shut){
  document.querySelectorAll("#nav a, #nav .navgroup").forEach(function(el){
    const l = el.querySelector(".nl");
    if(shut && l) el.setAttribute("title", l.textContent.trim());
    else el.removeAttribute("title");
  });
}

(function(){
  const mq = window.matchMedia("(max-width:860px)");
  function apply(){
    if(mq.matches){ document.body.classList.add("rail-forced"); railSet(true, false); }
    else { document.body.classList.remove("rail-forced"); railSet(railSaved() === "shut", false); }
  }
  if(mq.addEventListener) mq.addEventListener("change", apply); else mq.addListener(apply);
  apply();
})();

/* ---------- "New here?" lives under the paw: hover expands it, click pins it (touch) ---------- */
function railTourToggle(e){
  if(e && e.target.closest && e.target.closest(".railtour-pop")) return;   /* clicks inside the card are the card's */
  const t = $("#railtour"); if(!t) return;
  const open = !t.classList.contains("open");
  t.classList.toggle("open", open); t.setAttribute("aria-expanded", open ? "true" : "false");
}
function railTourClose(){ const t = $("#railtour"); if(t){ t.classList.remove("open"); t.setAttribute("aria-expanded","false"); } }
document.addEventListener("click", function(e){ if(!e.target.closest || !e.target.closest("#railtour")) railTourClose(); });
document.addEventListener("keydown", function(e){ if(e.key === "Escape") railTourClose(); });

/* ---------- the automation builder's block palette: same rule ---------- */
const PAL_KEY = "spiff.palette";
function palShut(){ try { return localStorage.getItem(PAL_KEY) === "shut"; } catch(e){ return false; } }
function palToggle(){
  const fb = $(".flowbody"); if(!fb) return;
  const shut = !fb.classList.contains("pal-shut");
  fb.classList.toggle("pal-shut", shut);
  const t = fb.querySelector(".paltog");
  if(t){ t.setAttribute("aria-expanded", shut ? "false" : "true"); t.title = shut ? "Expand the block palette" : "Collapse the block palette"; }
  try { localStorage.setItem(PAL_KEY, shut ? "shut" : "open"); } catch(e){}
}
function palHeadHTML(){
  const shut = palShut();
  return '<div class="palhead"><div class="ph">Blocks</div><div class="sp"></div>'
    + '<button class="paltog" aria-expanded="'+(shut?'false':'true')+'" title="'+(shut?'Expand':'Collapse')+' the block palette" onclick="palToggle()">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg></button></div>';
}
</script>
