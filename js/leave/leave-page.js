/* MODULE: leave/leave-page
   Leave: the full-page view — opening/closing, tabs, the four number cards, chosen-file list.
   (Data rules live in leave-rules.js, the employee list in leave-summary.js, files in leave-batches.js.) */

let leaveActiveTab = 'employees';
let leavePageOpen = false;

function leavePageTab(tab){
  leaveActiveTab = tab;
  document.querySelectorAll('#leaveTabs button').forEach(b=> b.classList.toggle('on', b.getAttribute('data-tab')===tab));
  document.querySelectorAll('#leaveBody > section').forEach(s=> s.hidden = (s.getAttribute('data-panel')!==tab));
  if(tab==='employees') renderLeaveSummary();
  if(tab==='files') renderLeaveBatches();
  const body = document.getElementById('leaveBody'); if(body) body.scrollTop = 0;
}

function leavePageRefreshStats(){
  const el = document.getElementById('leaveStats');
  if(!el) return;
  const groups = leaveSummaryGroups();
  const counted = groups.reduce((s,g)=> s+g.totalDays, 0);
  const notCounted = groups.reduce((s,g)=> s+g.cancelledCount+g.deniedCount, 0);
  const low = groups.filter(g=> (g.casualBalances||[]).some(b=> b.remaining<=5)).length;
  const files = leaveBatchGroups().length;
  el.innerHTML =
    '<div class="lp-stat blue"><b>'+groups.length+'</b><span>Employees</span></div>'+
    '<div class="lp-stat green"><b>'+counted+'</b><span>Leave days counted</span></div>'+
    '<div class="lp-stat orange"><b>'+low+'</b><span>Low casual balance</span></div>'+
    '<div class="lp-stat red"><b>'+notCounted+'</b><span>Cancelled / Denied</span></div>';
  const badge = document.getElementById('leaveFilesBadge');
  if(badge){ badge.textContent = files; badge.style.display = files ? '' : 'none'; }
}

function openLeavePage(tab){
  const page = document.getElementById('leavePage');
  document.getElementById('leaveUploadFile').value = '';
  document.getElementById('leaveSummarySearch').value = '';
  leaveFilesChosen();
  page.classList.add('show');
  document.body.classList.add('lp-open');
  if(!leavePageOpen){ leavePageOpen = true; try{ history.pushState({leavePage:1}, ''); }catch(e){} }
  hydrateIcons(page);
  renderLeaveBatches();
  leavePageRefreshStats();
  leavePageTab(tab || 'employees');
}

function closeLeavePage(fromBrowserBack){
  const page = document.getElementById('leavePage');
  if(!page) return;
  page.classList.remove('show');
  document.body.classList.remove('lp-open');
  if(leavePageOpen){
    leavePageOpen = false;
    if(!fromBrowserBack){ try{ if(history.state && history.state.leavePage) history.back(); }catch(e){} }
  }
}

// Phone / browser Back button closes the Leave page instead of leaving the app.
window.addEventListener('popstate', function(){ if(leavePageOpen) closeLeavePage(true); });

// Shows the chosen file names under the upload box.
function leaveFilesChosen(){
  const input = document.getElementById('leaveUploadFile');
  const box = document.getElementById('leaveChosenFiles');
  if(!input || !box) return;
  const files = Array.from(input.files || []);
  box.innerHTML = files.map(f=> '<div class="chosen">'+icon('file-text',16)+'<span>'+escapeHtml(f.name)+'</span><small>'+Math.max(1,Math.round(f.size/1024))+' KB</small></div>').join('');
}
