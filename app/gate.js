/* KitCrew login/recovery. No credentials in URLs, logs or persistent storage. */
(() => {
  const base = 'https://obwjlqrzshdglrccsbtl.supabase.co/functions/v1/';
  const $ = id => document.getElementById(id);
  let ready;
  window.KC_GATE_READY = new Promise(resolve => { ready = resolve; });
  function unlock(demo) {
    $('memberGate').hidden = true;
    $('memberGate').classList.add('hidden');
    $('memberWorkspace').hidden = false;
    $('memberWorkspace').inert = false;
    const chip = document.createElement('div');
    chip.className = 'mode-chip';
    chip.textContent = demo ? 'DEMO — sample data, no live actions' : 'LIVE — your account';
    document.body.append(chip);
    ready();
  }
  window.KC_SHOW_LOAD_ERROR = () => {
    $('memberWorkspace').hidden = true;
    $('memberWorkspace').inert = true;
    $('memberGate').hidden = false;
    $('memberGate').classList.remove('hidden');
    $('gateErr').textContent = 'Your account could not load completely. Reload to retry, or sign in again. Sample data has not been substituted.';
    document.querySelector('.mode-chip')?.remove();
  };
  async function post(path, body) {
    const response = await fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000), cache: 'no-store'
    });
    if (!response.ok) throw new Error('Service unavailable');
    return response.json();
  }
  const query = new URLSearchParams(location.search);
  $('recoveryToggle').addEventListener('click', () => {
    const open = $('recoveryPanel').hidden;
    $('recoveryPanel').hidden = !open;
    $('recoveryToggle').setAttribute('aria-expanded', String(open));
    if (open) $('recoveryEmail').focus();
  });
  $('gateForm').addEventListener('submit', async e => {
    e.preventDefault();
    const code = $('gateCode').value.trim();
    if (!code) return;
    $('gateBtn').disabled = true;
    $('gateErr').textContent = 'Checking your account…';
    try {
      const result = await post('techive-platform', { task: 'get_usage', access_code: code });
      if (!result.ok) { $('gateErr').textContent = 'That code could not sign you in. Try again or use “Forgot your access code?”.'; return; }
      sessionStorage.setItem('kf_access_code', code);
      location.replace(location.pathname);
    } catch { $('gateErr').textContent = 'Could not reach KitCrew. Please try again.'; }
    finally { $('gateBtn').disabled = false; }
  });
  $('recoveryRequestForm').addEventListener('submit', async e => {
    e.preventDefault();
    $('recoveryRequestBtn').disabled = true;
    $('recoveryStatus').textContent = 'Requesting recovery instructions…';
    try {
      const result = await post('kitcrew-recovery', { task: 'request', email: $('recoveryEmail').value.trim() });
      if (!result.ok) throw new Error('Unavailable');
      $('recoveryStatus').textContent = result.message;
      $('recoveryCompletePanel').open = true;
    } catch { $('recoveryStatus').textContent = 'Recovery is unavailable right now. Please retry later or contact support. Your current code has not changed.'; }
    finally { $('recoveryRequestBtn').disabled = false; }
  });
  $('recoveryCompleteForm').addEventListener('submit', async e => {
    e.preventDefault();
    const newCode = $('recoveryNewCode').value;
    if (newCode !== $('recoveryConfirmCode').value) {
      $('recoveryStatus').textContent = 'The new access codes do not match.';
      $('recoveryConfirmCode').focus(); return;
    }
    $('recoveryCompleteBtn').disabled = true;
    try {
      const result = await post('kitcrew-recovery', {
        task: 'complete', recovery_code: $('recoveryProof').value.trim(), new_code: newCode
      });
      $('recoveryStatus').textContent = result.message || result.error || 'Could not reset access. Request a fresh recovery code.';
      if (result.ok) {
        sessionStorage.removeItem('kf_access_code');
        $('recoveryCompleteForm').reset();
        $('recoveryCompletePanel').open = false;
        $('gateCode').focus();
      }
    } catch { $('recoveryStatus').textContent = 'Could not confirm the reset. Try signing in with your new code before requesting another recovery email.'; }
    finally { $('recoveryCompleteBtn').disabled = false; }
  });
  if (query.get('demo') === '1') { unlock(true); return; }
  if (query.get('recover') === '1') { $('recoveryToggle').click(); return; }
  const saved = sessionStorage.getItem('kf_access_code');
  if (saved) {
    $('gateErr').textContent = 'Checking your saved sign-in…';
    post('techive-platform', { task: 'get_usage', access_code: saved }).then(result => {
      if (result.ok) unlock(false);
      else {
        sessionStorage.removeItem('kf_access_code');
        $('gateErr').textContent = 'Your sign-in is no longer valid. Sign in again or recover access.';
      }
    }).catch(() => { $('gateErr').textContent = 'Could not check your sign-in. Reload to retry.'; });
  }
})();
