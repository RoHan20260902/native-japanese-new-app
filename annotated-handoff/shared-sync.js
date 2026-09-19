(function () {
  const SUPABASE_URL = 'https://ozscpffxdvpedufonihr.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_NNyWTnpdgx1VBs-SmkR3hw_6b9tJCZ0';
  const EDIT_KEY = 'native-japanese-handoff-user-edits';
  const TABLE_URL = SUPABASE_URL + '/rest/v1/handoff_documents';
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  };
  let applyingRemote = false;
  let lastSent = '';
  let reloadQueued = false;

  function localPayload() {
    try { return localStorage.getItem(EDIT_KEY) || ''; } catch { return ''; }
  }

  async function publish() {
    const payload = localPayload();
    if (!payload || payload === lastSent || applyingRemote) return;
    lastSent = payload;
    try {
      const response = await fetch(TABLE_URL, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ id: 'main', payload: JSON.parse(payload), updated_at: new Date().toISOString() })
      });
      if (!response.ok) throw new Error('shared sync ' + response.status);
      setStatus('已同步到共享版本');
    } catch (error) {
      console.warn('[handoff shared sync] publish failed', error);
      setStatus('本地已保存，共享同步稍后重试');
      lastSent = '';
    }
  }

  function setStatus(text) {
    const status = document.getElementById('status');
    if (status) status.textContent = text;
  }

  async function pull() {
    try {
      const response = await fetch(TABLE_URL + '?id=eq.main&select=payload,updated_at', { headers });
      if (!response.ok) throw new Error('shared sync ' + response.status);
      const rows = await response.json();
      const remote = rows[0]?.payload;
      if (!remote) { await publish(); return; }
      const remoteText = JSON.stringify(remote);
      const local = localPayload();
      if (local === remoteText || reloadQueued) return;
      applyingRemote = true;
      localStorage.setItem(EDIT_KEY, remoteText);
      applyingRemote = false;
      reloadQueued = true;
      setStatus('已收到共享版本，正在更新');
      const menu = document.getElementById('screenSelect');
      if (menu) sessionStorage.setItem('native-japanese-handoff-current-view', menu.value);
      window.setTimeout(() => window.location.reload(), 60);
    } catch (error) {
      console.warn('[handoff shared sync] pull failed', error);
      setStatus('共享同步暂不可用，本地编辑仍保留');
    }
  }

  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    nativeSetItem.call(this, key, value);
    if (this === localStorage && key === EDIT_KEY && !applyingRemote) {
      window.clearTimeout(window.__handoffSyncTimer);
      window.__handoffSyncTimer = window.setTimeout(publish, 250);
    }
  };

  window.setInterval(pull, 3000);
  window.setTimeout(pull, 400);
})();
