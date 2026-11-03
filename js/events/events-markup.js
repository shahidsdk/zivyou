/* MARKUP — Events — Duty/Leave event form, Record Search.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Duty / Leave Event Modal -->
<div class="overlay" id="eventOverlay">
  <div class="modal" style="max-width:520px;">
    <div class="modal-head">
      <h2 id="eventModalTitle">Short Leave</h2>
      <button class="close" onclick="closeEventModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="field" id="eventEmployeeField">
        <label>Employee *</label>
        <div class="emp-combo">
          <input type="text" id="ev_employee_search" placeholder="Type a name to search..." autocomplete="off">
          <input type="hidden" id="ev_employee">
          <div class="emp-combo-list" id="ev_employee_list"></div>
        </div>
      </div>
      <div class="field" id="eventCodeField">
        <label id="eventCodeLabel">Employee Code *</label>
        <input type="text" id="ev_code" placeholder="e.g. 1122-045">
      </div>
      <div id="eventNearLimitWarn" style="display:none; font-size:12px; color:#B45309; background:#FFFBEB; border:1px solid #FDE68A; border-radius:6px; padding:6px 9px; margin:-6px 0 10px;"></div>
      <div class="field" id="eventCode2Field" style="display:none;">
        <label id="eventCode2NameLabel">Employee Name (exchanged with)</label>
        <div class="emp-combo">
          <input type="text" id="ev_employee2_search" placeholder="Type a name to search..." autocomplete="off">
          <input type="hidden" id="ev_employee2">
          <div class="emp-combo-list" id="ev_employee2_list"></div>
        </div>
        <label id="eventCode2Label" style="margin-top:10px;">Employee Code (exchanged with) *</label>
        <input type="text" id="ev_code2" placeholder="e.g. 1122-078">
      </div>
      <div class="row2">
        <div class="field"><label id="eventDateLabel">Date *</label><input type="date" id="ev_date"></div>
        <div class="field" id="eventTimeFromField" style="display:none;"><label>Time From *</label><input type="time" id="ev_timeFrom"></div>
      </div>
      <div class="field" id="eventTimeToField" style="display:none;"><label>Time To *</label><input type="time" id="ev_timeTo"></div>
      <div class="field" id="eventShortLeaveHint" style="display:none;">
        <span id="eventShortLeaveHintText" style="font-size:12px; color:#8A94A3;">Short Leave can only be booked for today, starting from the current time onward. Max 2 per month.</span>
      </div>
      <div class="field" id="eventPastEntryUnlock" style="display:none;">
        <button type="button" onclick="unlockPastEntry()" style="background:#F5F1FF; color:#6C3EF2; border:1px solid #DCD0FB; border-radius:7px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer;">🔒 Need to log a previous date/time? (password required)</button>
      </div>
      <div class="field" id="eventNoteField">
        <label id="eventNoteLabel">Note</label>
        <textarea id="ev_note" placeholder=""></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeEventModal()">Cancel</button>
      <button class="btn-save" onclick="saveEvent()">✔ Save</button>
    </div>
  </div>
</div>

<!-- Record Search (Short Leave / Day Off Change / Duty Change) — filter by date range + name/code/designation -->
<div class="overlay" id="recordSearchOverlay">
  <div class="modal" style="max-width:560px;">
    <div class="modal-head">
      <h2 id="recordSearchTitle">Search Records</h2>
      <button class="close" onclick="closeRecordSearchModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="row2">
        <div class="field"><label>From Date</label><input type="date" id="rs_fromDate" onchange="renderRecordSearchResults()"></div>
        <div class="field"><label>To Date</label><input type="date" id="rs_toDate" onchange="renderRecordSearchResults()"></div>
      </div>
      <div class="field">
        <label>Search by Name / Employee Code / Designation</label>
        <input type="text" id="rs_query" placeholder="Type to search..." oninput="renderRecordSearchResults()">
      </div>
      <div id="rs_summary" style="font-size:12px; color:#8A94A3; margin-bottom:8px;"></div>
      <div id="rs_results" style="max-height:340px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeRecordSearchModal()">Close</button>
      <button class="btn btn-outline" onclick="exportRecordSearchResults()">⬇ Export to Excel</button>
    </div>
  </div>
</div>
`);
