/* MODULE: core/utils
   Small pure helpers: dates, escaping, phone/WhatsApp links, clipboard. */

function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function uniqueVals(arr, key){
  return [...new Set(arr.map(c=>c[key]).filter(Boolean))];
}

function daysUntilBirthday(dateStr){
  if(!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const bd = new Date(dateStr);
  const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if(next < today) next.setFullYear(today.getFullYear()+1);
  return Math.round((next - today)/86400000);
}

/* ---- Message Format: saved WhatsApp-ready message templates (title + full copy-paste-able note) ---- */
function escapeHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fallbackCopy(text, onDone){
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.focus(); ta.select();
  try{ document.execCommand('copy'); onDone(); } catch(err){ toast('Could not copy — select and copy manually'); }
  document.body.removeChild(ta);
}

function daysBetweenInclusive(fromIso, toIso){
  if(!fromIso || !toIso) return null;
  const f = new Date(fromIso+'T00:00:00');
  const t = new Date(toIso+'T00:00:00');
  if(isNaN(f) || isNaN(t) || t<f) return null;
  return Math.round((t-f)/86400000)+1;
}

function fmtDMY(iso){
  if(!iso) return '';
  const parts = iso.split('-');
  if(parts.length!==3) return iso;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/* ---- Click-to-Call / WhatsApp: turns a phone number into tel:/wa.me action links ---- */
function toWhatsAppDigits(raw){
  // wa.me needs the FULL international number, no leading 0, no +.
  // Our numbers are stored in local Pakistani format (e.g. "0300-6984722"), so without this
  // conversion wa.me/03006984722 is an invalid number and WhatsApp Web just shows a blank/error page.
  let d = (raw||'').replace(/[^\d+]/g,'');
  if(d.startsWith('+')) d = d.slice(1);
  if(d.startsWith('0092')) d = d.slice(2);       // 0092300... -> 92300...
  else if(d.startsWith('92')) { /* already has country code */ }
  else if(d.startsWith('0')) d = '92' + d.slice(1); // 0300...   -> 92300...
  return d;
}

function waIconSvg(size){
  size = size || 15;
  return `<svg width="${size}" height="${size}" viewBox="0 0 32 32" style="vertical-align:-3px;" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#25D366"/><path fill="#fff" d="M16 7c-5 0-9 4-9 9 0 1.6.4 3.1 1.2 4.4L7 25l4.8-1.3A9 9 0 1 0 16 7zm0 16.4c-1.5 0-3-.4-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.4 7.4 0 1 1 16 23.4zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.3-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.4.9 2.5c.1.2 1.7 2.6 4.1 3.6.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg>`;
}

function phoneActionLinks(type, value){
  const digits = (value||'').replace(/[^\d+]/g,'');
  if(!digits) return '';
  let html = `<a href="tel:${digits}" onclick="event.stopPropagation();" title="Call ${value}" style="text-decoration:none; margin-left:6px;">📞</a>`;
  const t = (type||'').toLowerCase();
  if(t==='mobile' || t==='whatsapp'){
    const waDigits = toWhatsAppDigits(value);
    html += `<a href="https://wa.me/${waDigits}" target="_blank" rel="noopener" onclick="event.stopPropagation();" title="WhatsApp ${value}" style="text-decoration:none; margin-left:4px;">${waIconSvg(15)}</a>`;
  }
  return html;
}

// Local Pakistani-style numbers are stored with a leading 0 (e.g. 0300-1234567). If someone
// types/pastes one without it, add it back — but leave "+92..." international numbers, and
// anything that isn't a plain digit/dash/space number (extensions, notes, etc), untouched.
function normalizePhoneNumber(v){
  const s = (v||'').trim();
  if(!s) return s;
  if(s.startsWith('+')) return s;
  if(!/^[0-9][0-9\-\s]*$/.test(s)) return s;
  return s[0]==='0' ? s : ('0'+s);
}
