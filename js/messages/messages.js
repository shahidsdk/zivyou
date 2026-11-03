/* MODULE: messages/messages
   Message Format: saved WhatsApp-ready templates. */

function whatsappPreviewHtml(text){
  // Renders *word* / *a few words* as <b>bold</b> for on-screen preview only — the raw text
  // (with the asterisks intact) is what actually gets copied, so pasting into WhatsApp still works.
  const escaped = escapeHtml(text);
  return escaped.replace(/\*([^\n*]+)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
}

function openMessagesModal(){
  const search = document.getElementById('msg_search');
  if(search) search.value = '';
  renderMessages();
  document.getElementById('messagesModalOverlay').classList.add('show');
}

function closeMessagesModal(){ document.getElementById('messagesModalOverlay').classList.remove('show'); }

let editingMessageId = null;

function openMessageModal(id){
  editingMessageId = id || null;
  const m = id ? messages.find(x=>x.id===id) : null;
  document.getElementById('messageModalTitle').innerHTML = (m ? waIconSvg(18)+' Edit Message' : waIconSvg(18)+' Add Message');
  document.getElementById('msg_title').value = m ? m.title : '';
  document.getElementById('msg_text').value = m ? m.text : '';
  document.getElementById('messageOverlay').classList.add('show');
}

function closeMessageModal(){ document.getElementById('messageOverlay').classList.remove('show'); }

function saveMessageEntry(){
  const title = document.getElementById('msg_title').value.trim();
  const text = document.getElementById('msg_text').value; // preserved exactly (incl. leading/trailing spacing) for accurate copy-paste
  if(!title){ toast('Message title is required'); return; }
  if(!text.trim()){ toast('Message note cannot be empty'); return; }
  if(editingMessageId){
    const m = messages.find(x=>x.id===editingMessageId);
    if(m){ m.title = title; m.text = text; }
    toast('Message updated');
  } else {
    messages.push({id: nextMessageId++, title, text, hidden:false, createdAt: new Date().toISOString()});
    toast('Message added');
  }
  closeMessageModal();
  render();
  persistAll();
}

function renderMessages(){
  const body = document.getElementById('messagesBody');
  if(!body) return;
  const searchEl = document.getElementById('msg_search');
  const q = (searchEl ? searchEl.value : '').trim().toLowerCase();
  let visible = messages.filter(m=>!m.hidden);
  if(q){ visible = visible.filter(m=> (m.title||'').toLowerCase().includes(q) || (m.text||'').toLowerCase().includes(q)); }
  visible = visible.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  if(visible.length===0){
    body.innerHTML = '<div class="empty-row">'+(q ? 'No messages match your search.' : 'No saved messages yet — click "Add Message" to create your first template.')+'</div>';
    return;
  }
  body.innerHTML = visible.map(m=>`
    <div style="border:1px solid #E5E9F0; border-radius:9px; padding:10px 14px; margin-bottom:10px; background:#F9FAFC;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px;">
        <div style="font-size:13.5px; font-weight:700; color:#22262E;">${escapeHtml(m.title)}</div>
        <div style="display:flex; gap:6px; flex-shrink:0;">
          <button onclick="copyMessageText(${m.id})" style="background:#EFF3FF; color:#3B7DED; border:1px solid #C9D8FB; border-radius:6px; padding:5px 10px; font-size:11.5px; font-weight:700; cursor:pointer;">📋 Copy</button>
          <button onclick="openMessageModal(${m.id})" style="background:#F5F1FF; color:#6C3EF2; border:1px solid #DCD0FB; border-radius:6px; padding:5px 10px; font-size:11.5px; font-weight:600; cursor:pointer;">✎ Edit</button>
          <button onclick="deleteMessage(${m.id})" style="background:#FFF1F2; color:#E0374B; border:1px solid #F3C2C8; border-radius:6px; padding:5px 10px; font-size:11.5px; font-weight:600; cursor:pointer;">🗑</button>
        </div>
      </div>
      <div style="font-size:12.5px; color:#3A4A5B; line-height:1.6; max-height:140px; overflow-y:auto; white-space:pre-wrap; background:#fff; border:1px solid #EEF1F5; border-radius:7px; padding:8px 10px;">${whatsappPreviewHtml(m.text)}</div>
    </div>`).join('');
}

function copyMessageText(id){
  const m = messages.find(x=>x.id===id);
  if(!m) return;
  const finish = ()=> toast('Copied — paste directly into WhatsApp');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(m.text).then(finish).catch(()=>fallbackCopy(m.text, finish));
  } else {
    fallbackCopy(m.text, finish);
  }
}

function deleteMessage(id){
  const idx = messages.findIndex(m=>m.id===id);
  if(idx===-1) return;
  const removed = messages[idx];
  messages.splice(idx,1);
  render();
  persistAll();
  toastWithUndo('Message deleted', ()=>{
    messages.splice(idx,0,removed);
    render();
    persistAll();
    toast('Delete undone');
  });
}
