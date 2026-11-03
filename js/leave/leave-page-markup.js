/* MARKUP — the full-page Leave section: header, summary numbers, tabs
   (Employees · Upload · Files · Reports · Proforma). Opened from the Leave tile. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<div class="lp" id="leavePage" role="dialog" aria-label="Leave management">
  <div class="lp-top">
    <button class="lp-back" onclick="closeLeaveUploadModal()" title="Back"><i class="ic" data-ic="arrow-left" data-size="20"></i></button>
    <div class="lp-heading">
      <div class="lp-title">Leave Management</div>
      <div class="lp-sub">Rescue 1122 · Rahim Yar Khan</div>
    </div>
    <button class="lp-primary" onclick="leavePageTab('upload')"><i class="ic" data-ic="upload-cloud" data-size="18"></i><span>Upload File</span></button>
  </div>

  <div class="lp-stats" id="leaveStats"></div>

  <nav class="lp-tabs" id="leaveTabs">
    <button class="on" data-tab="employees" onclick="leavePageTab('employees')"><i class="ic" data-ic="users" data-size="18"></i><span>Employees</span></button>
    <button data-tab="upload" onclick="leavePageTab('upload')"><i class="ic" data-ic="upload-cloud" data-size="18"></i><span>Upload</span></button>
    <button data-tab="files" onclick="leavePageTab('files')"><i class="ic" data-ic="folder" data-size="18"></i><span>Files</span><b id="leaveFilesBadge" style="display:none;">0</b></button>
    <button data-tab="reports" onclick="leavePageTab('reports')"><i class="ic" data-ic="bar-chart" data-size="18"></i><span>Reports</span></button>
    <button data-tab="proforma" onclick="leavePageTab('proforma')"><i class="ic" data-ic="file-text" data-size="18"></i><span>Proforma</span></button>
  </nav>

  <div class="lp-body" id="leaveBody">

    <section data-panel="employees">
      <div class="lp-search"><i class="ic" data-ic="search"></i><input type="text" id="leaveSummarySearch" placeholder="Search by name or employee code..." oninput="renderLeaveSummary()"></div>
      <div class="lp-list" id="leaveSummaryList"></div>
    </section>

    <section data-panel="upload" hidden>
      <div class="lp-card">
        <h3>Upload monthly Leave file</h3>
        <p>Choose one or more Leave files (CSV or Excel). New rows are added at the end of the existing records — nothing already saved is removed, and a leave that is already on file is skipped.</p>
        <label class="lp-drop" for="leaveUploadFile">
          <i class="ic" data-ic="upload-cloud" data-size="34"></i>
          <span>Tap to choose file(s)</span>
          <small>.csv  ·  .xlsx  ·  .xls — you can select more than one</small>
        </label>
        <input type="file" id="leaveUploadFile" accept=".csv,.xlsx,.xls" multiple onchange="leaveFilesChosen()">
        <div id="leaveChosenFiles"></div>
        <button class="lp-btn" onclick="uploadLeaveFile()"><i class="ic" data-ic="check" data-size="18"></i>Upload &amp; Add</button>
      </div>
      <div class="lp-card">
        <h3>Columns the file should have</h3>
        <div class="lp-cols"><span>Name</span><span>Employee ID</span><span>Designation</span><span>Station</span><span>District</span><span>Leave Type</span><span>Date Range</span><span>Days</span><span>Remarks</span><span>Created At</span><span>Status</span></div>
        <p style="margin-top:10px;">Leaves with status <b>Cancelled</b> or <b>Denied</b> are kept but not counted in totals or in the Casual Leave balance.</p>
      </div>
    </section>

    <section data-panel="files" hidden>
      <div class="lp-list" id="leaveBatchesList"></div>
    </section>

    <section data-panel="reports" hidden>
      <div class="lp-actions">
        <div class="lp-action" style="--c:#E0374B;">
          <span class="ai"><i class="ic" data-ic="bar-chart" data-size="24"></i></span>
          <h4>Low Leave Balance — Short</h4>
          <p>One-page list of employees whose Casual Leave balance is running low.</p>
          <button class="lp-btn" onclick="generateLowLeaveBalanceShortReportPDF()"><i class="ic" data-ic="printer" data-size="17"></i>Create PDF</button>
        </div>
        <div class="lp-action" style="--c:#3B7DED;">
          <span class="ai"><i class="ic" data-ic="file-text" data-size="24"></i></span>
          <h4>Low Leave Balance — Detail</h4>
          <p>Detailed report with every employee's leaves, month by month.</p>
          <button class="lp-btn" onclick="generateLowLeaveBalanceReportPDF()"><i class="ic" data-ic="printer" data-size="17"></i>Create PDF</button>
        </div>
      </div>
    </section>

    <section data-panel="proforma" hidden>
      <div class="lp-actions">
        <div class="lp-action" style="--c:#0E7C4A;">
          <span class="ai"><i class="ic" data-ic="file-text" data-size="24"></i></span>
          <h4>Casual Leave — Control Format</h4>
          <p>Printable Casual Leave application (Control Room format).</p>
          <button class="lp-btn" onclick="openProformaModal('control')">Open Proforma</button>
        </div>
        <div class="lp-action" style="--c:#8E2DE2;">
          <span class="ai"><i class="ic" data-ic="file-text" data-size="24"></i></span>
          <h4>Casual Leave — Operational Format</h4>
          <p>Printable Casual Leave application (Operational format).</p>
          <button class="lp-btn" onclick="openProformaModal('operational')">Open Proforma</button>
        </div>
      </div>
    </section>

  </div>
</div>
`);
