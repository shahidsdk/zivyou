/* MARKUP — Contacts — Add/Edit form, Manage Lists drawer, Duplicates, Data Health, Bulk Edit, Contact Detail panel.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Add/Edit Contact Modal -->
<div class="overlay" id="contactOverlay">
  <div class="modal">
    <div class="modal-head">
      <h2 id="modalTitle">➕ Add New Contact</h2>
      <button class="close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="section-title">Basic Info</div>
      <div class="row2">
        <div class="field"><label>First Name *</label><input id="f_firstName"></div>
        <div class="field"><label>Last Name</label><input id="f_lastName"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Designation</label><input id="f_designation" list="designationList" placeholder="Type or select"></div>
        <div class="field"><label>Blood Group</label>
          <input id="f_bloodGroup" list="bloodGroupList" placeholder="Type or select">
          <datalist id="bloodGroupList">
            <option>A+ve</option><option>A-ve</option><option>B+ve</option><option>B-ve</option>
            <option>O+ve</option><option>O-ve</option><option>AB+ve</option><option>AB-ve</option>
          </datalist>
        </div>
      </div>
      <div class="row2">
        <div class="field"><label>Employee Code</label><input id="f_employeeCode" placeholder="e.g. R-BWP-0006"></div>
        <div class="field"></div>
      </div>

      <div class="section-title">Contact Numbers</div>
      <div class="numbers-block" id="numbersBlock"></div>
      <button class="add-number-btn" onclick="addNumberRow()" style="margin-top:8px;">➕ Add another number</button>

      <div class="section-title">Address</div>
      <div class="field"><label>Address</label><input id="f_address"></div>
      <div class="row2">
        <div class="field"><label>Tehsil</label><input id="f_tehsil" list="tehsilList" placeholder="Type or select"></div>
        <div class="field"><label>Office Address</label><input id="f_officeAddress"></div>
      </div>
      <datalist id="tehsilList"></datalist>

      <div class="section-title">Work Info</div>
      <div class="row2">
        <div class="field"><label>Department</label><input id="f_department" list="deptList"></div>
        <div class="field"><label>Group</label><input id="f_group" list="groupList" placeholder="Type or select"></div>
      </div>
      <datalist id="deptList"></datalist>
      <datalist id="groupList"></datalist>
      <datalist id="designationList"></datalist>

      <div class="section-title">Other</div>
      <div class="field"><label>Birthday</label><input type="date" id="f_birthday"></div>
      <div class="field"><label>Notes</label><textarea id="f_notes"></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeModal()">Cancel</button>
      <button class="btn-save" onclick="saveContact()">✔ Save Contact</button>
    </div>
  </div>
</div>

<!-- Manage Lists Drawer -->
<div class="drawer-overlay" id="drawerOverlay" onclick="closeManageDrawer(event)">
  <div class="drawer" id="manageDrawer" onclick="event.stopPropagation()">
    <div class="drawer-head">
      <h2>⚙ Manage Lists</h2>
      <button class="close" onclick="closeManageDrawer()">✕</button>
    </div>
    <div class="drawer-tabs">
      <div class="drawer-tab active" id="tab_department" onclick="switchManageTab('department')">Department</div>
      <div class="drawer-tab" id="tab_designation" onclick="switchManageTab('designation')">Designation</div>
      <div class="drawer-tab" id="tab_tehsil" onclick="switchManageTab('tehsil')">Tehsil</div>
    </div>
    <div class="drawer-body">
      <div class="drawer-add-row">
        <input id="manageAddInput" placeholder="Add new...">
        <button onclick="addManageItem()">➕ Add</button>
      </div>
      <div id="manageListBody"></div>
    </div>
  </div>
</div>

<!-- Duplicate Contacts finder -->
<div class="overlay" id="duplicatesOverlay">
  <div class="modal" style="max-width:640px;">
    <div class="modal-head">
      <h2>⚠ Duplicate Contacts</h2>
      <button class="close" onclick="closeDuplicatesModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:12px;">
        Contacts that share the same Employee Code, or the exact same First + Last name, are grouped below. Review each group and delete whichever entry is the redundant copy — nothing is removed automatically.
      </p>
      <div id="dupSummary" style="font-size:12.5px; color:#8A94A3; margin-bottom:10px;"></div>
      <div id="dupList" style="max-height:420px; overflow-y:auto; display:flex; flex-direction:column; gap:12px;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeDuplicatesModal()">Close</button>
    </div>
  </div>
</div>

<!-- Data Health Check -->
<div class="overlay" id="healthCheckOverlay">
  <div class="modal" style="max-width:640px;">
    <div class="modal-head">
      <h2>🩺 Data Health Check</h2>
      <button class="close" onclick="closeHealthCheckModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:12px;">
        Contacts missing common details — nothing here is wrong by itself, but filling these in keeps records complete and searchable.
      </p>
      <div id="healthSummary" style="font-size:12.5px; color:#8A94A3; margin-bottom:10px;"></div>
      <div id="healthList" style="max-height:420px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeHealthCheckModal()">Close</button>
    </div>
  </div>
</div>

<!-- Bulk Edit (Department / Group) for selected contacts -->
<div class="overlay" id="bulkEditOverlay">
  <div class="modal" style="max-width:420px;">
    <div class="modal-head">
      <h2>✏ Bulk Edit</h2>
      <button class="close" onclick="closeBulkEditModal()">✕</button>
    </div>
    <div class="modal-body">
      <p id="bulkEditSummary" style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:12px;"></p>
      <div class="field">
        <label>New Department (leave blank to not change)</label>
        <input type="text" id="be_department" list="deptList" placeholder="e.g. Rescue 1122 Khanpur">
      </div>
      <div class="field">
        <label>New Group (leave blank to not change)</label>
        <input type="text" id="be_group" list="groupList" placeholder="e.g. EMT">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeBulkEditModal()">Cancel</button>
      <button class="btn-save" onclick="applyBulkEdit()">✔ Apply to Selected</button>
    </div>
  </div>
</div>

<!-- Contact Detail (half-page) panel — click any contact row to open -->
<div class="detail-overlay" id="detailOverlay" onclick="closeContactDetail(event)">
  <div class="detail-drawer" id="detailDrawer" onclick="event.stopPropagation()">
    <div class="detail-head">
      <div class="d-avatar" id="detailAvatar"></div>
      <div class="d-info">
        <h2 id="detailName"></h2>
        <div id="detailSub"></div>
      </div>
      <button class="close" onclick="closeContactDetail()">✕</button>
    </div>
    <div class="detail-body" id="detailBody"></div>
    <div class="detail-foot">
      <button class="btn-cancel" id="detailDelBtn">🗑 Delete</button>
      <button class="btn-save" id="detailEditBtn">✎ Edit Contact</button>
    </div>
  </div>
</div>
`);
