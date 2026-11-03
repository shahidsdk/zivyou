/* MODULE: contacts/contact-detail
   Half-page contact detail drawer + birthday panel. */

function openContactDetail(id){
  const c = contacts.find(x=>x.id===id);
  if(!c) return;
  const initials = ((c.firstName||'')[0]||'') + ((c.lastName||'')[0]||'');
  document.getElementById('detailAvatar').textContent = initials.toUpperCase();
  document.getElementById('detailName').textContent = ((c.firstName||'')+' '+(c.lastName||'')).trim();
  document.getElementById('detailSub').textContent = [c.designation, c.department].filter(Boolean).join(' · ') || '—';

  const nums = c.numbers||[];
  const numsHtml = nums.length
    ? nums.map(n=>`<div class="detail-row"><span class="dl">${n.type}</span><span class="dv">${n.value}${phoneActionLinks(n.type, n.value)}</span></div>`).join('')
    : '<div class="detail-empty">No numbers on file</div>';

  document.getElementById('detailBody').innerHTML = `
    <div class="detail-title">Overview</div>
    <div class="detail-row"><span class="dl">Employee Code</span><span class="dv">${c.employeeCode||'—'}</span></div>
    <div class="detail-row"><span class="dl">Group</span><span class="dv">${c.group||'—'}</span></div>
    <div class="detail-row"><span class="dl">Blood Group</span><span class="dv">${c.bloodGroup||'—'}</span></div>
    <div class="detail-row"><span class="dl">Tehsil</span><span class="dv">${c.tehsil||'—'}</span></div>
    <div class="detail-row"><span class="dl">Birthday</span><span class="dv">${c.birthday||'—'}</span></div>
    <div class="detail-title">Numbers</div>
    ${numsHtml}
    <div class="detail-title">Addresses</div>
    <div class="detail-row"><span class="dl">Address</span><span class="dv">${c.address||'—'}</span></div>
    <div class="detail-row"><span class="dl">Office Address</span><span class="dv">${c.officeAddress||'—'}</span></div>
    ${c.notes ? `<div class="detail-title">Notes</div><div class="detail-note">${c.notes}</div>` : ''}
  `;

  document.getElementById('detailEditBtn').onclick = ()=>{ closeContactDetail(); openEditModal(c.id); };
  document.getElementById('detailDelBtn').onclick = ()=>{ deleteContact(c.id); closeContactDetail(); };

  document.getElementById('detailOverlay').classList.add('show');
  document.getElementById('detailDrawer').classList.add('show');
}

function closeContactDetail(e){
  if(e) e.stopPropagation();
  document.getElementById('detailOverlay').classList.remove('show');
  document.getElementById('detailDrawer').classList.remove('show');
}

function renderBirthdayPanel(){
  const upcoming = contacts.filter(c=>{ const d=daysUntilBirthday(c.birthday); return d!==null && d<=2; })
    .sort((a,b)=>daysUntilBirthday(a.birthday)-daysUntilBirthday(b.birthday));
  const list = document.getElementById('bdayList');
  if(upcoming.length===0){ list.innerHTML = '<div class="dp-empty">No birthdays in the next 2 days.</div>'; return; }
  list.innerHTML = upcoming.map(c=>{
    const d = daysUntilBirthday(c.birthday);
    const when = d===0 ? 'Today 🎉' : (d===1 ? 'Tomorrow' : `In ${d} days`);
    const subBits = [c.designation, c.department].filter(Boolean).join(' · ');
    const nums = (c.numbers||[]).filter(n=>n.value);
    const numsHtml = nums.length
      ? nums.map(n=>`<div style="font-size:12px; color:#3A4A5B; margin-top:2px;">${n.value} <span style="color:#8A94A3;">(${n.type})</span>${phoneActionLinks(n.type, n.value)}</div>`).join('')
      : '<div style="font-size:11.5px; color:#8A94A3; margin-top:2px;">No phone number on file</div>';
    return `<div class="dp-item">
      <b>${c.firstName} ${c.lastName||''}</b><span style="float:right; font-weight:700; color:${d===0?'#2CB673':'#FF9F1C'};">${when}</span>
      ${subBits?`<div style="font-size:11.5px; color:#8A94A3; margin-top:2px;">${subBits}${c.employeeCode?(' · Code: '+c.employeeCode):''}</div>`:''}
      <div style="font-size:11.5px; color:#8A94A3; margin-top:2px;">🎂 ${c.birthday}</div>
      ${numsHtml}
    </div>`;
  }).join('');
}
