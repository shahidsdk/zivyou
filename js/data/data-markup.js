/* MARKUP — Data — Import column mapping, Backups.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Import Column Mapping Modal -->
<div class="overlay" id="mapOverlay">
  <div class="modal" style="max-width:560px;">
    <div class="modal-head">
      <h2>⇄ Map Excel Columns</h2>
      <button class="close" onclick="closeMapModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12.5px; color:#8A94A3; margin-bottom:14px;">Match each column from your file to a Contact Book field. Choose "Skip" if not needed.</p>
      <div id="mapRows"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeMapModal()">Cancel</button>
      <button class="btn-save" onclick="confirmImport()">✔ Import Now</button>
    </div>
  </div>
</div>

<!-- Backups (last 10 auto-saved snapshots) -->
<div class="overlay" id="backupsOverlay">
  <div class="modal" style="max-width:560px;">
    <div class="modal-head">
      <h2>🕐 Backups</h2>
      <button class="close" onclick="closeBackupsModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:12px;">
        A backup is saved automatically every time data is synced to the linked Excel file — the last 10 are kept. Restoring replaces current Contacts, Duty/Leave events, and Leave data with the selected version (the current state is backed up first, so you can undo a restore too).
      </p>
      <div id="backupsList" style="max-height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeBackupsModal()">Close</button>
    </div>
  </div>
</div>
`);
