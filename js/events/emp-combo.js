/* MODULE: events/emp-combo
   Searchable employee dropdown used in event forms. */

/* ---- Searchable employee combobox (used by the event modal) ---- */
function resetEmpCombo(){
  document.getElementById('ev_employee').value = '';
  document.getElementById('ev_employee_search').value = '';
  renderEmpComboList('', '');
  hideEmpComboList('');
  document.getElementById('ev_employee2').value = '';
  document.getElementById('ev_employee2_search').value = '';
  renderEmpComboList('', '2');
  hideEmpComboList('2');
}

function empComboLabel(c){ return (c.firstName+' '+(c.lastName||'')).trim(); }

function renderEmpComboList(query, suffix){
  suffix = suffix || '';
  const list = document.getElementById('ev_employee'+suffix+'_list');
  if(!list) return;
  const q = query.trim().toLowerCase();
  const matches = contacts.filter(c=>{
    if(!q) return true;
    const hay = (empComboLabel(c)+' '+(c.designation||'')+' '+(c.department||'')).toLowerCase();
    return hay.includes(q);
  }).slice(0,50);
  if(matches.length===0){
    list.innerHTML = '<div class="emp-combo-empty">No matching employee</div>';
    return;
  }
  list.innerHTML = matches.map(c=>`<div class="emp-combo-item" onclick="selectEmpCombo('${c.id}','${suffix}')"><b>${empComboLabel(c)}</b>${(c.designation||c.department)?`<div class="ec-sub">${[c.designation,c.department].filter(Boolean).join(' · ')}</div>`:''}</div>`).join('');
}

function showEmpComboList(suffix){ suffix = suffix || ''; const el=document.getElementById('ev_employee'+suffix+'_list'); if(el) el.classList.add('show'); }

function hideEmpComboList(suffix){ suffix = suffix || ''; const el=document.getElementById('ev_employee'+suffix+'_list'); if(el) el.classList.remove('show'); }

function hideAllEmpComboLists(){ hideEmpComboList(''); hideEmpComboList('2'); const pfList=document.getElementById('pf_employee_list'); if(pfList) pfList.classList.remove('show'); }

function selectEmpCombo(id, suffix){
  suffix = suffix || '';
  const c = contacts.find(x=>String(x.id)===String(id));
  if(!c) return;
  document.getElementById('ev_employee'+suffix).value = c.id;
  document.getElementById('ev_employee'+suffix+'_search').value = empComboLabel(c);
  hideEmpComboList(suffix);
  // Name picked -> auto-fill the matching Employee Code field underneath (if this form has one)
  const codeField = document.getElementById(suffix==='2' ? 'ev_code2' : 'ev_code');
  if(codeField && c.employeeCode){ codeField.value = c.employeeCode; }
}

document.addEventListener('DOMContentLoaded', function(){
  // Wire up both the main Employee field and the Exchange (code2) field the same way —
  // name search fills the code, and typing the code fills the name, in both directions.
  [
    {searchId:'ev_employee_search', codeId:'ev_code', suffix:''},
    {searchId:'ev_employee2_search', codeId:'ev_code2', suffix:'2'}
  ].forEach(cfg=>{
    const search = document.getElementById(cfg.searchId);
    if(search){
      search.addEventListener('input', ()=>{
        document.getElementById('ev_employee'+cfg.suffix).value = ''; // typing invalidates previous pick
        renderEmpComboList(search.value, cfg.suffix);
        showEmpComboList(cfg.suffix);
      });
      search.addEventListener('focus', ()=>{
        renderEmpComboList(search.value, cfg.suffix);
        showEmpComboList(cfg.suffix);
      });
    }
    // Reverse direction: typing the Employee Code fills the Name field above it.
    // Matches as soon as what's typed uniquely identifies one contact's code (exact match, or a
    // prefix that only one employee's code starts with) — so it fills in while typing, not just at the end.
    const codeInput = document.getElementById(cfg.codeId);
    if(codeInput){
      codeInput.addEventListener('input', ()=>{
        const typed = codeInput.value.trim().toLowerCase();
        if(cfg.suffix==='') checkNearLimitWarning();
        if(!typed) return;
        const exact = contacts.filter(c=> (c.employeeCode||'').trim().toLowerCase()===typed);
        const prefixMatches = contacts.filter(c=> (c.employeeCode||'').trim().toLowerCase().startsWith(typed));
        const match = exact[0] || (prefixMatches.length===1 ? prefixMatches[0] : null);
        if(match){
          const searchEl = document.getElementById(cfg.searchId);
          if(searchEl){
            document.getElementById('ev_employee'+cfg.suffix).value = match.id;
            searchEl.value = empComboLabel(match);
          }
        }
      });
    }
  });
  const dateInputForWarn = document.getElementById('ev_date');
  if(dateInputForWarn) dateInputForWarn.addEventListener('change', checkNearLimitWarning);
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.emp-combo')) hideAllEmpComboLists();
  });
});

function closeEventModal(){ document.getElementById('eventOverlay').classList.remove('show'); }
