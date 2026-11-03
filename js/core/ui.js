/* MODULE: core/ui
   Toasts, dropdown panels, dark mode. */

function toast(msg){
  const t = document.getElementById('toast');
  t.innerHTML = ''; t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2600);
}

let undoToastTimer = null;

function toastWithUndo(msg, undoFn){
  const t = document.getElementById('toast');
  if(undoToastTimer) clearTimeout(undoToastTimer);
  t.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = msg + '  ';
  const btn = document.createElement('button');
  btn.textContent = 'Undo';
  btn.style.cssText = 'margin-left:8px; background:#3B7DED; color:#fff; border:none; border-radius:5px; padding:4px 10px; font-size:12px; font-weight:700; cursor:pointer;';
  btn.onclick = ()=>{ t.classList.remove('show'); if(undoToastTimer) clearTimeout(undoToastTimer); undoFn(); };
  t.appendChild(span); t.appendChild(btn);
  t.classList.add('show');
  undoToastTimer = setTimeout(()=>t.classList.remove('show'), 5000);
}

function toggleBdayPanel(){ document.getElementById('syncPanel').classList.remove('show'); document.getElementById('bdayPanel').classList.toggle('show'); }

function toggleSyncPanel(){ document.getElementById('bdayPanel').classList.remove('show'); document.getElementById('syncPanel').classList.toggle('show'); }

document.addEventListener('click', function(e){
  if(!e.target.closest('#bdayPanel') && !e.target.closest('#bdayBtn')) document.getElementById('bdayPanel').classList.remove('show');
  if(!e.target.closest('#syncPanel') && !e.target.closest('#syncBtn')) document.getElementById('syncPanel').classList.remove('show');
});

function toggleDarkMode(){
  const isDark = document.body.classList.toggle('dark-mode');
  document.getElementById('darkModeBtn').innerHTML = icon(isDark ? 'sun' : 'moon', 20);
  localStorage.setItem('crbDarkMode', isDark ? '1' : '0');
}

function restoreDarkModePreference(){
  if(localStorage.getItem('crbDarkMode')==='1'){
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').innerHTML = icon('sun', 20);
  }
}
