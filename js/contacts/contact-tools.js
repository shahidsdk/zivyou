/* MODULE: contacts/contact-tools
   Duplicate finder and Data Health Check. */

/* ---- Duplicate Contacts finder: same Employee Code, or same First+Last name ---- */
function findDuplicateContacts(){
  const byCode = new Map();
  const byName = new Map();
  contacts.forEach(c=>{
    const code = (c.employeeCode||'').trim().toLowerCase();
    if(code){
      if(!byCode.has(code)) byCode.set(code, []);
      byCode.get(code).push(c);
    }
    const fullName = ((c.firstName||'')+' '+(c.lastName||'')).trim().toLowerCase();
    if(fullName){
      if(!byName.has(fullName)) byName.set(fullName, []);
      byName.get(fullName).push(c);
    }
  });
  const groups = [];
  const seenIds = new Set();
  byCode.forEach((list, code)=>{
    if(list.length>1){ groups.push({reason:'Same Employee Code ('+list[0].employeeCode+')', contacts:list}); list.forEach(c=>seenIds.add(c.id)); }
  });
  byName.forEach((list, name)=>{
    // Skip if these exact same contacts were already grouped by code (avoid showing the same pair twice)
    const alreadyCovered = list.length>1 && list.every(c=>seenIds.has(c.id));
    if(list.length>1 && !alreadyCovered){ groups.push({reason:'Same Name ('+list[0].firstName+' '+(list[0].lastName||'')+')', contacts:list}); }
  });
  return groups;
}

function openDuplicatesModal(){
  renderDuplicatesList();
  document.getElementById('duplicatesOverlay').classList.add('show');
}

function closeDuplicatesModal(){ document.getElementById('duplicatesOverlay').classList.remove('show'); }

function renderDuplicatesList(){
  const groups = findDuplicateContacts();
  document.getElementById('dupSummary').textContent = groups.length===0 ? 'No duplicates found.' : groups.length+' duplicate group'+(groups.length===1?'':'s')+' found.';
  const listEl = document.getElementById('dupList');
  if(groups.length===0){
    listEl.innerHTML = '<div style="font-size:12.5px; color:#2CB673; padding:8px 2px;">✓ No duplicate contacts found.</div>';
    return;
  }
  listEl.innerHTML = groups.map(g=>`
    <div style="border:1px solid #F3C2C8; border-radius:9px; background:#FFF6F7; padding:10px 12px;">
      <div style="font-size:12.5px; font-weight:700; color:#E0374B; margin-bottom:8px;">${g.reason}</div>
      ${g.contacts.map(c=>`
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:#fff; border:1px solid #E5E9F0; border-radius:7px; padding:8px 10px; margin-bottom:6px;">
          <div style="min-width:0;">
            <div style="font-size:13px; font-weight:600; color:#22262E;">${(c.firstName||'')+' '+(c.lastName||'')}</div>
            <div style="font-size:11.5px; color:#8A94A3;">${[c.employeeCode, c.designation, c.department].filter(Boolean).join(' · ')||'(no extra details)'}</div>
          </div>
          <div style="display:flex; gap:6px; flex-shrink:0;">
            <button onclick="openContactDetail(${c.id}); closeDuplicatesModal();" style="background:#EFF3FF; color:#3B7DED; border:1px solid #C9D8FB; border-radius:6px; padding:5px 9px; font-size:11.5px; font-weight:600; cursor:pointer;">View</button>
            <button onclick="deleteContactFromDuplicates(${c.id})" style="background:#FFF1F2; color:#E0374B; border:1px solid #F3C2C8; border-radius:6px; padding:5px 9px; font-size:11.5px; font-weight:600; cursor:pointer;">Delete</button>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

/* ---- Data Health Check: flags contacts missing a phone number, designation, or department ---- */
function findHealthIssues(){
  const issues = { noPhone: [], noDesignation: [], noDepartment: [] };
  contacts.forEach(c=>{
    const hasPhone = (c.numbers||[]).some(n=>n.value && n.value.trim());
    if(!hasPhone) issues.noPhone.push(c);
    if(!(c.designation||'').trim()) issues.noDesignation.push(c);
    if(!(c.department||'').trim()) issues.noDepartment.push(c);
  });
  return issues;
}

function openHealthCheckModal(){
  renderHealthCheckList();
  document.getElementById('healthCheckOverlay').classList.add('show');
}

function closeHealthCheckModal(){ document.getElementById('healthCheckOverlay').classList.remove('show'); }

function renderHealthCheckList(){
  const issues = findHealthIssues();
  const total = issues.noPhone.length + issues.noDesignation.length + issues.noDepartment.length;
  document.getElementById('healthSummary').textContent = total===0
    ? 'No issues found — all contacts look complete.'
    : issues.noPhone.length+' missing phone · '+issues.noDesignation.length+' missing designation · '+issues.noDepartment.length+' missing department';
  const sections = [
    {label:'📵 No phone number', list: issues.noPhone},
    {label:'🏷 No designation', list: issues.noDesignation},
    {label:'🏢 No department', list: issues.noDepartment}
  ].filter(s=>s.list.length>0);
  const listEl = document.getElementById('healthList');
  if(sections.length===0){
    listEl.innerHTML = '<div style="font-size:12.5px; color:#2CB673; padding:8px 2px;">✓ No issues found.</div>';
    return;
  }
  listEl.innerHTML = sections.map(s=>`
    <div>
      <div style="font-size:12.5px; font-weight:700; color:#B45309; margin-bottom:6px;">${s.label} (${s.list.length})</div>
      ${s.list.slice(0,50).map(c=>`
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; background:#FFFBEB; border:1px solid #FDE68A; border-radius:7px; padding:7px 10px; margin-bottom:5px;">
          <div style="font-size:12.5px; font-weight:600; color:#22262E;">${(c.firstName||'')+' '+(c.lastName||'')}${c.employeeCode?(' · '+c.employeeCode):''}</div>
          <button onclick="openContactDetail(${c.id}); closeHealthCheckModal();" style="background:#EFF3FF; color:#3B7DED; border:1px solid #C9D8FB; border-radius:6px; padding:4px 9px; font-size:11.5px; font-weight:600; cursor:pointer;">Open</button>
        </div>`).join('')}
      ${s.list.length>50?`<div style="font-size:11px; color:#8A94A3; margin-bottom:8px;">+ ${s.list.length-50} more…</div>`:''}
    </div>`).join('');
}
