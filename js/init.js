/* MODULE: init
   Start-up: runs last, after every module is loaded. */

if(!loadLocal()){ seedSampleData(); }

hydrateIcons();
document.getElementById('navLogo').src = 'data:image/jpeg;base64,' + RESCUE_LOGO_B64;

render();

restoreDarkModePreference();

tryAutoResumeSync();

if(cloudSyncUrl && cloudPin){
  // PIN already saved on this device: never show the PIN screen up front.
  // The app opens straight away (with cached data); the PIN is re-checked quietly in the background.
  // The PIN screen only comes back if Google says the PIN is actually wrong/changed
  // (lockWithPin clears cloudPin). Slow internet / server errors do NOT ask for the PIN again.
  document.getElementById('pinOverlay').style.display = 'none';
  loadFromCloud(false).then(function(){
    if(cloudPin) startCloudPolling();
  });
} else {
  document.getElementById('pinInput').focus();
}

// Keep the on-screen ticker / tiles / recent-events list in sync with the clock — this matters
// for a control-room display left open all day: today-only entries (Short Leave, Day Off Change,
// Duty Change, Handing Over Taking Over) must disappear on their own once midnight passes,
// without anyone needing to refresh the page.
setInterval(function(){ renderTicker(); renderRecentEvents(); renderEventTiles(); }, 30000);
