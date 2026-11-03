/* MODULE: contacts/contacts-list
   Main contact table, stat cards, group/blood tiles, selection. */

const BLOOD_GROUPS = [
  {key:"A+ve", color:"#3B82F6", grad:"linear-gradient(135deg,#3B82F6,#60A5FA)"},
  {key:"A-ve", color:"#0EA5B7", grad:"linear-gradient(135deg,#0EA5B7,#22D3EE)"},
  {key:"B+ve", color:"#EF4444", grad:"linear-gradient(135deg,#EF4444,#F87171)"},
  {key:"B-ve", color:"#F97316", grad:"linear-gradient(135deg,#F97316,#FB923C)"},
  {key:"O+ve", color:"#10B981", grad:"linear-gradient(135deg,#10B981,#34D399)"},
  {key:"O-ve", color:"#84CC16", grad:"linear-gradient(135deg,#84CC16,#A3E635)"},
  {key:"AB+ve", color:"#8B5CF6", grad:"linear-gradient(135deg,#8B5CF6,#A78BFA)"},
  {key:"AB-ve", color:"#EC4899", grad:"linear-gradient(135deg,#EC4899,#F472B6)"}
];

const GROUP_COLORS = ["#2CB673","#3B7DED","#FF9F1C","#17A2B8","#8E2DE2","#E0374B","#6C757D","#0EA5B7"];

const APP_FIELDS = [
  {key:"firstName", label:"First Name"}, {key:"lastName", label:"Last Name"},
  {key:"employeeCode", label:"Employee Code"},
  {key:"designation", label:"Designation"}, {key:"department", label:"Department"},
  {key:"group", label:"Group"}, {key:"bloodGroup", label:"Blood Group"},
  {key:"mobile", label:"Mobile Number"}, {key:"phone", label:"Office Number"},
  {key:"home", label:"Home Number"}, {key:"whatsapp", label:"WhatsApp Number"},
  {key:"address", label:"Address"}, {key:"tehsil", label:"Tehsil"},
  {key:"officeAddress", label:"Office Address"}, {key:"birthday", label:"Birthday (YYYY-MM-DD)"},
  {key:"notes", label:"Notes"}, {key:"skip", label:"— Skip —"}
];

function render(){
  renderFilterOptions();
  renderStats();
  renderGroupTiles();
  renderBloodTiles();
  renderTable();
  renderBirthdayPanel();
  renderEventTiles();
  renderTicker();
  renderRecentEvents();
  renderMessages();
}

function renderFilterOptions(){
  const deptSel = document.getElementById('deptFilter');
  const tehsilSel = document.getElementById('tehsilFilter');
  const depts = [...new Set([...managedLists.department, ...uniqueVals(contacts, 'department')])];
  const tehsils = [...new Set([...managedLists.tehsil, ...uniqueVals(contacts, 'tehsil')])];
  const designations = [...new Set([...managedLists.designation, ...uniqueVals(contacts, 'designation')])];
  const curDept = deptSel.value, curTehsil = tehsilSel.value;
  deptSel.innerHTML = '<option value="">Department / All</option>' + depts.map(d=>`<option ${d===curDept?'selected':''}>${d}</option>`).join('');
  tehsilSel.innerHTML = '<option value="">Tehsil / All</option>' + tehsils.map(t=>`<option ${t===curTehsil?'selected':''}>${t}</option>`).join('');

  document.getElementById('deptList').innerHTML = depts.map(d=>`<option value="${d}">`).join('');
  document.getElementById('groupList').innerHTML = uniqueVals(contacts,'group').map(g=>`<option value="${g}">`).join('');
  document.getElementById('tehsilList').innerHTML = tehsils.map(t=>`<option value="${t}">`).join('');
  document.getElementById('designationList').innerHTML = designations.map(d=>`<option value="${d}">`).join('');
}

function renderStats(){
  document.getElementById('statContacts').textContent = contacts.length;
  document.getElementById('statGroups').textContent = uniqueVals(contacts,'group').length;
  document.getElementById('statDepts').textContent = uniqueVals(contacts,'department').length;
  let totalNums=0, extra=0;
  contacts.forEach(c=>{ const n=(c.numbers||[]).length; totalNums+=n; if(n>1) extra += n-1; });
  document.getElementById('statNumbers').textContent = totalNums;
  document.getElementById('statPrimary').textContent = contacts.length;
  document.getElementById('statExtra').textContent = extra;

  let upcoming=0, today=0;
  contacts.forEach(c=>{ const d=daysUntilBirthday(c.birthday); if(d===0) today++; if(d!==null && d<=2) upcoming++; });
  document.getElementById('statUpcoming').textContent = upcoming;
  document.getElementById('statUpcoming2').textContent = upcoming;
  document.getElementById('statToday').textContent = today;
  const bc = document.getElementById('bdayCount');
  if(upcoming>0){ bc.style.display='block'; bc.textContent = upcoming; } else bc.style.display='none';

  const thisMonth = todayStr().slice(0,7);
  const monthCount = (type) => events.filter(e=>!e.hidden && e.type===type && (e.date||'').slice(0,7)===thisMonth).length;
  const mShort = monthCount('Short Leave'), mDuty = monthCount('Duty Change'), mDayOff = monthCount('Day Off Change'), mSpecial = monthCount('Special Event');
  document.getElementById('statMonthShortLeave').textContent = mShort;
  document.getElementById('statMonthDutyChange').textContent = mDuty;
  document.getElementById('statMonthDayOff').textContent = mDayOff;
  document.getElementById('statMonthSpecial').textContent = mSpecial;
  document.getElementById('statMonthTotal').textContent = mShort+mDuty+mDayOff+mSpecial;

  const dupCount = findDuplicateContacts().length;
  const dupBtn = document.getElementById('dupBtn');
  if(dupBtn) dupBtn.textContent = dupCount>0 ? ('⚠ Duplicates ('+dupCount+')') : '⚠ Duplicates';
}

function renderGroupTiles(){
  const groups = uniqueVals(contacts, 'group');
  const wrap = document.getElementById('groupTiles');
  if(groups.length===0){ wrap.innerHTML = '<div style="color:#8A94A3;font-size:12.5px;">No groups yet — add a contact with a Group to see it here.</div>'; return; }
  wrap.innerHTML = groups.map((g,i)=>{
    const count = contacts.filter(c=>c.group===g).length;
    const color = GROUP_COLORS[i % GROUP_COLORS.length];
    const sel = activeGroup===g ? 'selected' : '';
    return `<div class="tile ${sel}" style="background:${color};" onclick="toggleGroupFilter('${g.replace(/'/g,"\\'")}')"><div class="lbl">${g}</div><div class="n">${count}</div></div>`;
  }).join('');
}

/* Real-world data has messy Blood Group spellings (e.g. "A+tve", "A +ve", "A+", "a+ve").
   Normalize before comparing so counts/filters aren't thrown off by formatting. */
function normalizeBloodGroup(v){
  if(!v) return '';
  let s = String(v).trim().toUpperCase().replace(/\s+/g,'');
  s = s.replace(/POSITIVE$/,'+VE').replace(/NEGATIVE$/,'-VE');
  s = s.replace(/TIVE$/,'VE');   // "+tive" -> "+ve"
  s = s.replace(/TVE$/,'VE');    // "+tve"  -> "+ve"
  if(/^(A|B|AB|O)[+-]$/.test(s)) s = s + 'VE'; // bare "A+" -> "A+VE"
  return s;
}

function renderBloodTiles(){
  const wrap = document.getElementById('bloodTiles');
  wrap.innerHTML = BLOOD_GROUPS.map(bg=>{
    const count = contacts.filter(c=>normalizeBloodGroup(c.bloodGroup)===normalizeBloodGroup(bg.key)).length;
    const sel = activeBlood===bg.key;
    return `<div class="blood-tile ${sel?'selected':''}" style="background:${bg.grad};" onclick="toggleBloodFilter('${bg.key}')">
      <div class="bg-name">${bg.key}</div>
      <div class="bg-count">${count}</div>
      <div class="bg-lbl">Total Person</div>
    </div>`;
  }).join('');
}

function getFilteredContacts(){
  const search = document.getElementById('searchBox').value.trim().toLowerCase();
  const dept = document.getElementById('deptFilter').value;
  const tehsil = document.getElementById('tehsilFilter').value;
  return contacts.filter(c=>{
    if(activeBlood && normalizeBloodGroup(c.bloodGroup) !== normalizeBloodGroup(activeBlood)) return false;
    if(activeGroup && c.group !== activeGroup) return false;
    if(dept && c.department !== dept) return false;
    if(tehsil && c.tehsil !== tehsil) return false;
    if(search){
      const hay = [c.firstName,c.lastName,c.employeeCode,c.designation,c.department,c.group,c.bloodGroup,c.tehsil,c.address,c.officeAddress,c.notes,
        ...(c.numbers||[]).map(n=>n.value)].join(' ').toLowerCase();
      if(!hay.includes(search)) return false;
    }
    return true;
  });
}

function renderTable(){
  updateSearchMode();
  const list = getFilteredContacts();
  const hasActiveFilter = !!(document.getElementById('searchBox').value.trim() || document.getElementById('deptFilter').value || document.getElementById('tehsilFilter').value || activeBlood || activeGroup);

  let displayList = list;
  let limited = false;
  if(!showAllContacts && !hasActiveFilter){
    displayList = [...list].sort((a,b)=> (b.updatedAt||b.createdAt||0) - (a.updatedAt||a.createdAt||0)).slice(0,5);
    limited = true;
  }

  document.getElementById('tableCount').textContent = limited ? `${displayList.length} of ${list.length} people` : `${list.length} people`;

  const viewAllBtn = document.getElementById('viewAllBtn');
  viewAllBtn.style.display = hasActiveFilter ? 'none' : 'inline-flex';
  viewAllBtn.textContent = showAllContacts ? '🕐 Show Recent Only' : '📋 View All Contacts';

  const banner = document.getElementById('filterBanner');
  if(activeBlood || activeGroup){
    banner.style.display='flex';
    let parts = [];
    if(activeBlood) parts.push(`Blood Group: ${activeBlood}`);
    if(activeGroup) parts.push(`Group: ${activeGroup}`);
    document.getElementById('filterBannerText').textContent = `Filter active (${parts.join(', ')}) — showing ${list.length} people`;
  } else {
    banner.style.display='none';
  }

  // Drop selections that scrolled out of the current contact set
  const liveIds = new Set(contacts.map(c=>c.id));
  [...selectedContactIds].forEach(id=>{ if(!liveIds.has(id)) selectedContactIds.delete(id); });
  updateBulkDeleteUI();

  const body = document.getElementById('contactsTableBody');
  if(displayList.length===0){
    body.innerHTML = `<tr><td colspan="8" class="empty-row">No contacts found. Try changing filters or add a new contact.</td></tr>`;
    document.getElementById('headCheck').checked = false;
    return;
  }
  body.innerHTML = displayList.map(c=>{
    const initials = ((c.firstName||'')[0]||'') + ((c.lastName||'')[0]||'');
    const nums = c.numbers||[];
    const numsHtml = nums.length ? nums.map(n=>`<div class="num-line">${n.value} <span class="tag">(${n.type})</span>${phoneActionLinks(n.type, n.value)}</div>`).join('') : '<span class="sub">—</span>';
    const subBits = [c.birthday, c.employeeCode ? `Code: ${c.employeeCode}` : ''].filter(Boolean).join(' · ');
    const checked = selectedContactIds.has(c.id) ? 'checked' : '';
    return `<tr class="crow" onclick="openContactDetail(${c.id})">
      <td class="c-check" onclick="event.stopPropagation();"><input type="checkbox" class="row-check" ${checked} onchange="toggleContactSelect(${c.id}, this.checked)"></td>
      <td class="c-name"><div class="name-cell"><div class="avatar" style="background:linear-gradient(135deg,#3B7DED,#8E2DE2);">${initials.toUpperCase()}</div>
        <div><b>${c.firstName||''} ${c.lastName||''}</b>${subBits?`<br><span class="sub">${subBits}</span>`:''}</div></div></td>
      <td class="c-desig">${c.designation||''}<br><span class="sub">${c.department||''}</span></td>
      <td class="c-nums">${numsHtml}</td>
      <td class="c-blood">${c.bloodGroup?`<span class="badge-blood">${c.bloodGroup}</span>`:''}</td>
      <td class="c-tehsil">${c.tehsil||''}</td>
      <td class="c-group">${c.group?`<span class="badge" style="background:#3B7DED;">${c.group}</span>`:''}</td>
      <td class="c-actions" style="white-space:nowrap;"><div class="row-actions">
        <button class="view" onclick="event.stopPropagation(); openContactDetail(${c.id})" title="View">${icon('eye',15)}</button>
        <button class="edit" onclick="event.stopPropagation(); openEditModal(${c.id})" title="Edit">${icon('edit',15)}</button>
        <button class="del" onclick="event.stopPropagation(); deleteContact(${c.id})" title="Delete">${icon('trash',15)}</button>
      </div></td>
    </tr>`;
  }).join('');
  document.getElementById('headCheck').checked = displayList.length>0 && displayList.every(c=>selectedContactIds.has(c.id));
}

function toggleShowAllContacts(){
  showAllContacts = !showAllContacts;
  renderTable();
}

function printContactsList(){
  // Print should show the full filtered list, not just the "recent 5" preview — switch to
  // full view first (if not already there) so nothing important is missing from the printout.
  if(!showAllContacts){
    showAllContacts = true;
    renderTable();
  }
  setTimeout(()=>window.print(), 150);
}

function toggleContactSelect(id, checked){
  if(checked) selectedContactIds.add(id); else selectedContactIds.delete(id);
  updateBulkDeleteUI();
  document.getElementById('headCheck').checked = false; // recompute lazily on next full render
}

function toggleSelectAllContacts(checked){
  const list = getFilteredContacts();
  const hasActiveFilter = !!(document.getElementById('searchBox').value.trim() || document.getElementById('deptFilter').value || document.getElementById('tehsilFilter').value || activeBlood || activeGroup);
  const visible = (!showAllContacts && !hasActiveFilter) ? [...list].sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0)).slice(0,5) : list;
  visible.forEach(c=>{ if(checked) selectedContactIds.add(c.id); else selectedContactIds.delete(c.id); });
  renderTable();
}

function updateBulkDeleteUI(){
  const btn = document.getElementById('bulkDelBtn');
  const editBtn = document.getElementById('bulkEditBtn');
  const n = selectedContactIds.size;
  document.getElementById('bulkDelCount').textContent = n;
  document.getElementById('bulkEditCount').textContent = n;
  btn.style.display = n>0 ? 'inline-flex' : 'none';
  editBtn.style.display = n>0 ? 'inline-flex' : 'none';
}
