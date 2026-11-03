/* MARKUP — Day Off Check — upload form, per-employee detail.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Day Off Check Upload Modal -->
<div class="overlay" id="dayOffUploadOverlay">
  <div class="modal" style="max-width:520px;">
    <div class="modal-head">
      <h2>📤 Day Off Check — Upload Monthly Data</h2>
      <button class="close" onclick="closeDayOffUploadModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:14px;">
        Choose one or more monthly Day Off Check files (CSV or Excel): Name, Employee Number, Station Name, then one column per date in that month with each day's code (M, e, n, admin, OFF, On Leave, etc).
        Cells marked <b>OFF</b> are counted as that employee's day off for the month. The rows get added to the end of the existing Day Off Check records — nothing already saved is removed.
      </p>

      <div style="position:sticky; top:0; z-index:2; background:#fff; padding-top:2px; padding-bottom:6px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; gap:8px; flex-wrap:wrap;">
          <label style="margin:0; font-weight:600;">Day Off Summary — by employee</label>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button onclick="generateHighDayOffShortReportPDF()" style="background:#EFF3FF; color:#3B7DED; border:1px solid #C9D8FB; border-radius:7px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer;" title="One line per employee: total Day Offs + month-by-month breakdown">📄 Day Off Short Report (≥50)</button>
            <button onclick="generateHighDayOffDetailReportPDF()" style="background:#EFF3FF; color:#3B7DED; border:1px solid #C9D8FB; border-radius:7px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer;" title="Month-by-month record for every employee with 50 or more Day Offs">📄 Day Off Detail Report (≥50)</button>
            <button onclick="clearAllDayOffRecords()" style="background:#FFF1F2; color:#E0374B; border:1px solid #F3C2C8; border-radius:7px; padding:6px 10px; font-size:12px; font-weight:600; cursor:pointer;">🗑 All Clear</button>
          </div>
        </div>
        <div class="field" style="margin-bottom:0;">
          <input type="text" id="dayOffSummarySearch" placeholder="Search by name or employee code..." oninput="renderDayOffSummary()" autofocus>
        </div>
      </div>
      <div id="dayOffSummaryList" style="max-height:260px; overflow-y:auto; display:flex; flex-direction:column; gap:6px; margin-top:10px;"></div>

      <hr style="margin:18px 0 14px; border:none; border-top:1px solid #E5E9F0;">
      <div class="field">
        <label>Day Off Check File(s) (.csv / .xlsx) *</label>
        <input type="file" id="dayOffUploadFile" accept=".csv,.xlsx,.xls" multiple>
      </div>

      <div id="dayOffBatchesSection" style="margin-bottom:4px;">
        <label style="margin:0 0 8px; font-weight:600; display:block;">📁 Uploaded Files</label>
        <div id="dayOffBatchesList" style="max-height:160px; overflow-y:auto; display:flex; flex-direction:column; gap:6px; margin-bottom:10px;"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeDayOffUploadModal()">Close</button>
      <button class="btn-save" onclick="uploadDayOffFile()">✔ Upload &amp; Add</button>
    </div>
  </div>
</div>

<!-- Day Off Check Summary Detail (one employee's month-by-month history) -->
<div class="overlay" id="dayOffDetailOverlay">
  <div class="modal" style="max-width:460px;">
    <div class="modal-head">
      <h2 id="dayOffDetailTitle">Employee</h2>
      <button class="close" onclick="closeDayOffDetailModal()">✕</button>
    </div>
    <div class="modal-body">
      <div id="dayOffDetailTotal" style="font-size:14px; font-weight:600; margin-bottom:12px; color:#22262E;"></div>
      <div id="dayOffDetailRows" style="display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeDayOffDetailModal()">Close</button>
    </div>
  </div>
</div>
`);
