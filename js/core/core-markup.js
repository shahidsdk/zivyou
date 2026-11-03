/* MARKUP — Core — past-date password prompt.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Past Date/Time Password Unlock -->
<div class="overlay" id="pastEntryPasswordOverlay">
  <div class="modal" style="max-width:380px;">
    <div class="modal-head">
      <h2>🔒 Password Required</h2>
      <button class="close" onclick="closePastEntryPasswordModal()">✕</button>
    </div>
    <div class="modal-body">
      <p id="pastEntryPasswordText" style="font-size:12.5px; color:#8A94A3; line-height:1.6; margin-bottom:12px;">
        This record is normally locked to today (and, for Short Leave, the current time onward). Enter the password to log a previous date/time instead.
      </p>
      <div class="field">
        <label>Password</label>
        <input type="password" id="pastEntryPasswordInput" placeholder="••••••••" autocomplete="off">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closePastEntryPasswordModal()">Cancel</button>
      <button class="btn-save" onclick="confirmPastEntryPassword()">✔ Unlock</button>
    </div>
  </div>
</div>
`);
