/* MARKUP — Message Format — list + add/edit.
   The HTML of this module's pop-ups lives here, next to its code, and is added to the page when this file loads. */
document.body.insertAdjacentHTML('beforeend', String.raw`
<!-- Message Format: list of saved messages, with search + Add -->
<div class="overlay" id="messagesModalOverlay">
  <div class="modal" style="max-width:640px;">
    <div class="modal-head">
      <h2><svg width="18" height="18" viewBox="0 0 32 32" style="vertical-align:-3px;" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#25D366"/><path fill="#fff" d="M16 7c-5 0-9 4-9 9 0 1.6.4 3.1 1.2 4.4L7 25l4.8-1.3A9 9 0 1 0 16 7zm0 16.4c-1.5 0-3-.4-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.4 7.4 0 1 1 16 23.4zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.3-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.4.9 2.5c.1.2 1.7 2.6 4.1 3.6.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg> Message Format</h2>
      <button class="close" onclick="closeMessagesModal()">✕</button>
    </div>
    <div class="modal-body">
      <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:12px;">
        <div class="field" style="flex:1; margin-bottom:0;">
          <input type="text" id="msg_search" placeholder="Search by title or message content..." oninput="renderMessages()">
        </div>
        <button class="btn btn-primary" style="padding:9px 14px; font-size:12.5px; white-space:nowrap;" onclick="openMessageModal()">➕ Add Message</button>
      </div>
      <div id="messagesBody" style="max-height:440px; overflow-y:auto;"></div>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeMessagesModal()">Close</button>
    </div>
  </div>
</div>

<!-- Message Format: add/edit a saved WhatsApp-ready message template -->
<div class="overlay" id="messageOverlay">
  <div class="modal" style="max-width:600px;">
    <div class="modal-head">
      <h2 id="messageModalTitle"><svg width="18" height="18" viewBox="0 0 32 32" style="vertical-align:-3px;" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="16" fill="#25D366"/><path fill="#fff" d="M16 7c-5 0-9 4-9 9 0 1.6.4 3.1 1.2 4.4L7 25l4.8-1.3A9 9 0 1 0 16 7zm0 16.4c-1.5 0-3-.4-4.2-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.4 7.4 0 1 1 16 23.4zm4.1-5.5c-.2-.1-1.3-.7-1.5-.7-.2-.1-.3-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.4.9 2.5c.1.2 1.7 2.6 4.1 3.6.6.2 1 .4 1.4.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"/></svg> Add Message</h2>
      <button class="close" onclick="closeMessageModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Message Title *</label>
        <input type="text" id="msg_title" placeholder="e.g. Major Incident Report Format">
      </div>
      <div class="field">
        <label>Note (full message — exactly as it should be pasted into WhatsApp) *</label>
        <textarea id="msg_text" rows="14" style="font-family:inherit; white-space:pre-wrap; resize:vertical;" placeholder="Type or paste the full message here, including *bold* markers, line breaks, and Urdu text exactly as it should appear in WhatsApp..."></textarea>
      </div>
      <p style="font-size:11.5px; color:#8A94A3; line-height:1.6;">Tip: wrap a word in single asterisks like *this* to make it bold when pasted in WhatsApp — that formatting is kept exactly as typed.</p>
    </div>
    <div class="modal-foot">
      <button class="btn-cancel" onclick="closeMessageModal()">Cancel</button>
      <button class="btn-save" onclick="saveMessageEntry()">✔ Save Message</button>
    </div>
  </div>
</div>
`);
