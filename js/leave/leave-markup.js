/* MARKUP — Leave — per-employee detail pop-up (the full Leave page is in leave-page-markup.js).
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Leave Summary Detail (one employee's full leave history) -->
<div class="overlay" id="leaveDetailOverlay">
  <div class="modal" style="max-width:460px;">
    <div class="modal-head">
      <h2 id="leaveDetailTitle">Employee</h2>
      <button class="close" onclick="closeLeaveDetailModal()">✕</button>
    </div>
    <div class="modal-body">
      <div id="leaveDetailTotal" style="font-size:14px; font-weight:600; margin-bottom:12px; color:#22262E;"></div>
      <div id="leaveDetailRows" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeLeaveDetailModal()">Close</button>
    </div>
  </div>
</div>
`);
