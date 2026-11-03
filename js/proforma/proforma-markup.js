/* MARKUP — Proforma — printable leave application.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Generate a printable leave proforma (Casual Leave — Control / Operational, or Short Leave) -->
<div class="overlay" id="proformaOverlay">
  <div class="modal" style="max-width:460px;">
    <div class="modal-head">
      <h2 id="proformaModalTitle">📄 Generate Proforma</h2>
      <button class="close" onclick="closeProformaModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:12px;">
        Optionally pick an employee to pre-fill their Employee Code, Name, and Designation on the form. Everything else (father's name, reliever details, dates, signatures) is left blank to fill in by hand after printing.
      </p>
      <div class="field">
        <label>Employee Name (optional)</label>
        <div class="emp-combo">
          <input type="text" id="pf_employee_search" placeholder="Type a name to search..." autocomplete="off">
          <input type="hidden" id="pf_employee">
          <div class="emp-combo-list" id="pf_employee_list"></div>
        </div>
      </div>
      <div class="field">
        <label>Employee Code (optional)</label>
        <input type="text" id="pf_code" placeholder="e.g. 1122-045">
      </div>

      <div id="pf_leaveFields" style="display:none;">
        <div class="field">
          <label>Father's Name</label>
          <input type="text" id="pf_fatherName" placeholder="e.g. Muhammad Bilal">
        </div>
        <div class="field">
          <label>Employee Status</label>
          <select id="pf_status">
            <option value="">-- Select --</option>
            <option value="Permanent">Permanent</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
        <div class="row2">
          <div class="field">
            <label>Leave From Date</label>
            <input type="date" id="pf_dateFrom">
          </div>
          <div class="field">
            <label>Leave To Date</label>
            <input type="date" id="pf_dateTo">
          </div>
        </div>
        <div style="font-size:11.5px; color:#8A94A3; margin:-6px 0 10px;" id="pf_daysPreview"></div>
        <div class="field">
          <label>Reason of Leave</label>
          <input type="text" id="pf_reason" placeholder="e.g. Family function">
        </div>
        <div class="field">
          <label>Address if to Proceed Outside the City</label>
          <input type="text" id="pf_address" placeholder="e.g. Multan">
        </div>
      </div>

      <div id="pf_shortFields" style="display:none;">
        <div class="field">
          <label>Father's Name</label>
          <input type="text" id="pf_short_fatherName" placeholder="e.g. Muhammad Bilal">
        </div>
        <div class="field">
          <label>Date</label>
          <input type="date" id="pf_short_date">
        </div>
        <div class="row2">
          <div class="field">
            <label>Time From</label>
            <input type="time" id="pf_short_timeFrom">
          </div>
          <div class="field">
            <label>Time To</label>
            <input type="time" id="pf_short_timeTo">
          </div>
        </div>
        <div class="field">
          <label>Reason of Short Leave</label>
          <input type="text" id="pf_short_reason" placeholder="e.g. Medical appointment">
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeProformaModal()">Cancel</button>
      <button class="btn-save" onclick="generateProforma()">🖨 Generate &amp; Print</button>
    </div>
  </div>
</div>
`);
