/* MODULE: events/events-form
   Save/delete an event, monthly-limit warning and rules. */

function checkNearLimitWarning(){
  const warnEl = document.getElementById('eventNearLimitWarn');
  if(!warnEl || !activeEventType) return;
  const cfg = EVENT_TYPES.find(t=>t.key===activeEventType);
  if(!cfg || !cfg.monthlyLimit){ warnEl.style.display='none'; return; }
  const codeInput = document.getElementById('ev_code');
  const code = codeInput ? codeInput.value.trim().toLowerCase() : '';
  if(!code){ warnEl.style.display='none'; return; }
  const dateInput = document.getElementById('ev_date');
  const dateVal = (dateInput && dateInput.value) || todayStr();
  const month = dateVal.slice(0,7);
  const count = events.filter(e=> e.type===activeEventType && (e.date||'').slice(0,7)===month && (e.employeeCode||'').trim().toLowerCase()===code).length;
  if(count>=cfg.monthlyLimit){
    warnEl.style.display = '';
    warnEl.textContent = '⚠ This employee already has '+count+'/'+cfg.monthlyLimit+' '+activeEventType+' records this month — the limit is reached, a password will be required to save another one.';
  } else if(count===cfg.monthlyLimit-1){
    warnEl.style.display = '';
    warnEl.textContent = '⚠ This employee has '+count+'/'+cfg.monthlyLimit+' '+activeEventType+' records this month — only 1 more is allowed.';
  } else {
    warnEl.style.display = 'none';
  }
}

function saveEvent(){
  const cfg = EVENT_TYPES.find(t=>t.key===activeEventType);
  const date = document.getElementById('ev_date').value;
  if(!date){ toast('Date is required'); return; }

  // Short Leave / Handing Over Taking Over must be booked for today only — unless unlocked with the password
  if(cfg.sameDayOnly && date!==todayStr() && !dateTimeOverride){
    toast(activeEventType+' can only be booked for today\'s date (use the password option to log a previous date)');
    return;
  }

  const note = document.getElementById('ev_note').value.trim();
  if(cfg.noteRequired && !note){ toast('Note is required for '+activeEventType); return; }

  let code = '', code2 = '';
  if(cfg.needsCode){
    code = document.getElementById('ev_code').value.trim();
    if(!code){ toast('Employee Code is required'); return; }
  }
  if(cfg.needsCode2){
    code2 = document.getElementById('ev_code2').value.trim();
    if(!code2){ toast('Employee Code of the other employee is required'); return; }
  }

  let employeeId = '', employeeName = '';
  if(!cfg.noEmployee){
    const sel = document.getElementById('ev_employee');
    if(!sel.value){ toast('Pick an employee'); return; }
    const c = contacts.find(x=>String(x.id)===String(sel.value));
    employeeId = sel.value;
    employeeName = c ? (c.firstName+' '+(c.lastName||'')).trim() : '';

    // Business rule: max cfg.monthlyLimit records per employee per month, for any type that sets it
    // (currently Short Leave, Day Off Change, Duty Change — all limited to 2/month).
    // Matched by Employee Code (stable across reloads) and counts hidden/soft-deleted
    // records too. Reaching the limit no longer hard-blocks — it asks for the password, and a
    // correct entry allows this one record through (monthlyLimitOverride resets on next modal open).
    if(cfg.monthlyLimit && !monthlyLimitOverride){
      const month = date.slice(0,7);
      const codeNorm = code.trim().toLowerCase();
      const countThisMonth = events.filter(e=> e.type===activeEventType && (e.date||'').slice(0,7)===month && (e.employeeCode||'').trim().toLowerCase()===codeNorm).length;
      if(countThisMonth>=cfg.monthlyLimit){
        openPasswordPrompt(
          employeeName+' ('+code+') already has '+countThisMonth+' '+activeEventType+' records this month (limit is '+cfg.monthlyLimit+'). Enter the password to add one more anyway.',
          function(){
            monthlyLimitOverride = true;
            toast('Password accepted — saving this extra record');
            saveEvent();
          }
        );
        return;
      }
    }

    // Business rule: an employee can't have the SAME entry (same type, same date) logged twice —
    // e.g. a second "Short Leave" for the same person on a date that already has one is rejected.
    // Checked against ALL records (including hidden/soft-deleted) so delete-and-re-add can't bypass it.
    // Shares the SAME password override as the monthly limit above — once unlocked for this record,
    // it stays unlocked for both checks, so the password isn't asked for twice in a row.
    if(cfg.noDuplicateSameDay && !monthlyLimitOverride){
      const codeNorm = code.trim().toLowerCase();
      const dup = events.find(e=> e.type===activeEventType && e.date===date && (e.employeeCode||'').trim().toLowerCase()===codeNorm);
      if(dup){
        openPasswordPrompt(
          employeeName+' ('+code+') already has a '+activeEventType+' entry logged for '+date+'. Enter the password to add another one on the same date anyway.',
          function(){
            monthlyLimitOverride = true;
            toast('Password accepted — saving this extra record');
            saveEvent();
          }
        );
        return;
      }
    }
  }

  let timeFrom = cfg.needsTime ? document.getElementById('ev_timeFrom').value : '';
  let timeTo = cfg.needsTime ? document.getElementById('ev_timeTo').value : '';

  if(cfg.needsTime){
    if(!timeFrom || !timeTo){ toast('Time From and Time To are required'); return; }
    if(timeTo <= timeFrom){ toast('Time To must be after Time From'); return; }
    if(cfg.sameDayOnly && !dateTimeOverride){
      const now = new Date();
      const nowHM = String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
      if(timeFrom < nowHM){ toast('Short Leave start time must be the current time or later (use the password option to log a previous time)'); return; }
    }
  }

  events.push({
    id: nextEventId++, type: activeEventType, employeeId, employeeName, employeeCode: code, employeeCode2: code2,
    employeeName2: (function(){
      if(!code2) return '';
      const c2 = contacts.find(x=> (x.employeeCode||'').trim().toLowerCase()===code2.trim().toLowerCase());
      return c2 ? (c2.firstName+' '+(c2.lastName||'')).trim() : '';
    })(),
    date, timeFrom, timeTo, note, hidden:false, createdAt: new Date().toISOString()
  });
  closeEventModal();
  render();
  persistAll();
  toast(activeEventType+' saved');
}

function deleteEvent(id){
  // Soft delete: hide from the screen, but keep the record safely stored in the Excel sheet
  if(!confirm('Remove this event from the screen? (it stays saved in the Excel sheet)')) return;
  const ev = events.find(e=>e.id===id);
  if(ev) ev.hidden = true;
  render();
  persistAll();
  toast('Removed from screen — still saved in Excel');
}
