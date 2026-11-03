/* MODULE: contacts/contacts-filters
   Search box + filter actions. */

function toggleBloodFilter(key){ activeBlood = (activeBlood===key) ? null : key; render(); }

function toggleGroupFilter(g){ activeGroup = (activeGroup===g) ? null : g; render(); }

function clearAllFilters(){ activeBlood=null; activeGroup=null; document.getElementById('searchBox').value=''; document.getElementById('deptFilter').value=''; document.getElementById('tehsilFilter').value=''; updateSearchMode(); render(); }

function updateSearchMode(){
  // Any active search/filter (text, department, tehsil, blood group, group tile) => results-only view
  const active = !!(document.getElementById('searchBox').value.trim() || document.getElementById('deptFilter').value || document.getElementById('tehsilFilter').value || activeBlood || activeGroup);
  document.body.classList.toggle('search-active', active);
  const textActive = !!(document.getElementById('searchBox').value.trim());
  document.body.classList.toggle('tile-mode', active && !textActive);
}

document.getElementById('searchBox').addEventListener('input', function(){ updateSearchMode(); renderTable(); });

document.getElementById('searchBox').addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    this.value = '';
    updateSearchMode();
    renderTable();
    this.blur();
  }
});

document.getElementById('deptFilter').addEventListener('change', renderTable);

document.getElementById('tehsilFilter').addEventListener('change', renderTable);
