<script>
/* =====================================================================
   SPIFF v2 — boot. Runs last: wires counts, scope chips and the landing view.
   ===================================================================== */
(function(){
  const n = (sel, v) => { const el = $(sel); if (el && v != null) el.textContent = v; };

  /* rail counts, driven by the real data */
  try { railAttn('#mcp-count', mcpAttentionCount()); } catch(e){}
  try { inboxAfterDecision(); } catch(e){}   /* the inbox count in the rail */
  try { $('#chandle').querySelector('.chcount').textContent = THREADS.length; } catch(e){}



  /* the rail identity chip opens the person you actually are */
  try {
    $('#userchip').addEventListener('click', e => {
      if (e.target.closest('#thm')) return;
      if (typeof openPerson === 'function') openPerson(viewer().name);
    });
  } catch(e){}

  /* global search: datasets and people first, then fall through to asking */
  try {
    const gs = $('#gsearch');
    /* one handler owns this. It used to clear the box before deciding whether to
       act, so anything that was not a dataset or a person name reached the
       fall-through with an empty string and silently did nothing. */
    gs.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const q = (e.target.value || '').trim(); if (!q) return;
      const d = DATASETS.find(x => x.name.toLowerCase().includes(q.toLowerCase()));
      const p = PEOPLE.find(x => x.name.toLowerCase().includes(q.toLowerCase()));
      e.stopImmediatePropagation();
      e.target.value = '';
      if (d && typeof openDataset === 'function') return openDataset(d.id);
      if (p && typeof openPerson === 'function')  return openPerson(p.name);
      if (typeof askText === 'function')          return askText(q);
    }, true);
  } catch(e){}

  /* keyboard: / focuses search, Escape closes an open modal */
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test((document.activeElement||{}).tagName||'')) {
      e.preventDefault(); const gs = $('#gsearch'); if (gs) gs.focus();
    }
    if (e.key === 'Escape') { const m = $('#modal'); if (m && m.classList.contains('on')) closeModal(); }
  });

  /* land on Home */
  try { go('home'); } catch(e){ console.error('home failed', e); }
})();
</script>
