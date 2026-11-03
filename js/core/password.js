/* MODULE: core/password
   Password prompt used to unlock past dates / monthly-limit overrides. */

let passwordModalOnSuccess = null;

function openPasswordPrompt(message, onSuccess){
  passwordModalOnSuccess = onSuccess;
  document.getElementById('pastEntryPasswordText').textContent = message;
  const pwdInput = document.getElementById('pastEntryPasswordInput');
  pwdInput.value = '';
  document.getElementById('pastEntryPasswordOverlay').classList.add('show');
  setTimeout(()=>pwdInput.focus(), 50);
  pwdInput.onkeydown = (e)=>{ if(e.key==='Enter'){ e.preventDefault(); confirmPastEntryPassword(); } };
}

function unlockPastEntry(){
  openPasswordPrompt(
    'This record is normally locked to today (and, for Short Leave, the current time onward). Enter the password to log a previous date/time instead.',
    function(){
      dateTimeOverride = true;
      const dateInput = document.getElementById('ev_date');
      dateInput.readOnly = false;
      dateInput.removeAttribute('min');
      dateInput.removeAttribute('max');
      document.getElementById('ev_timeFrom').removeAttribute('min');
      document.getElementById('eventDateLabel').textContent = 'Date * (previous date/time unlocked)';
      toast('Password accepted — you can now pick a previous date/time for this record');
    }
  );
}

function closePastEntryPasswordModal(){
  document.getElementById('pastEntryPasswordOverlay').classList.remove('show');
  passwordModalOnSuccess = null;
}

function confirmPastEntryPassword(){
  const pwd = document.getElementById('pastEntryPasswordInput').value;
  if(pwd.trim()!=='7631541'){ toast('Incorrect password'); return; }
  const onSuccess = passwordModalOnSuccess;
  document.getElementById('pastEntryPasswordOverlay').classList.remove('show');
  passwordModalOnSuccess = null;
  if(onSuccess) onSuccess();
}
