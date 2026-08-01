// ============================================================
// Brand layer — one platform, two skins (S221; reskinned S246).
// KitFire (default) and KitCrew by KitFire — the network-marketing/
// duplication lane, renamed from TecHive per Chris's final CEO ruling
// (S246-DRL-02). Loaded BEFORE app.js: sets window.KF_BRAND, then
// skins the DOM.
//
// Selection: ?brand=techive (demo/preview, legacy param kept so old
// links keep working) or a techive.* / kitcrew.* / itsgreatbusiness.*
// hostname. Everything server-side is shared — the skin changes the
// wordmark, accent (KitCrew teal/indigo, matching kitcrew.ai), product
// strings, demo persona pricing panel, and referral link. The build
// stays KitFire's; the lane brand is a coat of paint (Chris ruling).
//
// NOTE: key stays 'techive' — it is the internal lane id that app.js
// and the techive-platform edge fn contract on. Customer-facing strings
// say KitCrew everywhere; the key is plumbing, not copy.
// ============================================================

(function () {
  const qs = new URLSearchParams(location.search);
  // Lane hostnames: itsgreatbusiness.com (current live home until the
  // 301), kitcrew.ai (the S246 brand home), techive.* (legacy).
  const isLane = qs.get('brand') === 'techive' ||
    /(^|\.)techive\.|(^|\.)kitcrew\.|(^|\.)itsgreatbusiness\./i.test(location.hostname);

  window.KF_BRAND = isLane
    ? {
        key: 'techive',
        product: 'KitCrew',
        wordmark: ['Kit', 'Crew'],
        title: 'KitCrew — your AI crew back office',
        // KitCrew teal + indigo, the kitcrew.ai site system (S246).
        accent: '#22d3c7',
        accentSoft: 'rgba(34, 211, 199, 0.13)',
        accentLine: 'rgba(34, 211, 199, 0.42)',
        indigo: '#6366f1',
        referral: 'kitcrew.ai/start?ref=demo-marcus',
      }
    : { key: 'kitfire', product: 'KitFire', wordmark: ['Kit', 'Fire'] };

  if (!isLane) return; // KitFire needs no skinning — it IS the base

  // data-brand='techive' stays: app.css gates lane-only sections on it
  // (.techive-only). data-skin='kitcrew' scopes the S246 visual system.
  document.documentElement.setAttribute('data-brand', 'techive');
  document.documentElement.setAttribute('data-skin', 'kitcrew');
  const rs = document.documentElement.style;
  rs.setProperty('--ember', window.KF_BRAND.accent);
  rs.setProperty('--ember-soft', window.KF_BRAND.accentSoft);
  rs.setProperty('--ember-line', window.KF_BRAND.accentLine);
  rs.setProperty('--kc-indigo', window.KF_BRAND.indigo);

  // CRITICAL: only ASSIGN when the text actually contains the brand name.
  // An unconditional `n.nodeValue = ...` fires a characterData mutation on
  // every node the observer touches — each assignment re-triggers the
  // observer, which assigns again: infinite loop, page unresponsive
  // (S221 live bug). The includes() guard makes every rewrite terminal:
  // once replaced, the node never matches again.
  // S246: [data-noskin] guard — "by KitFire" attributions must SURVIVE the
  // walk (brand law: "KitCrew, by KitFire"); mark any element whose KitFire
  // text is the parent company, not the product.
  // Swaps BOTH KitFire (base-skin strings) and TecHive (legacy strings the
  // server catalog may still return until the SQL rename runs) to KitCrew.
  function skinTextNode(n) {
    if (!n.nodeValue) return;
    if (!n.nodeValue.includes('KitFire') && !n.nodeValue.includes('TecHive')) return;
    const p = n.parentElement;
    if (p && p.closest('[data-noskin]')) return;
    n.nodeValue = n.nodeValue.split('KitFire').join('KitCrew').split('TecHive').join('KitCrew');
  }
  function walk(root) {
    if (!root) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = it.nextNode())) skinTextNode(n);
    if (root.querySelectorAll) {
      root.querySelectorAll('[placeholder]').forEach((el) => {
        if (el.placeholder.includes('KitFire')) el.placeholder = el.placeholder.split('KitFire').join('KitCrew');
      });
      root.querySelectorAll('[title]').forEach((el) => {
        if (el.title.includes('KitFire') && !el.closest('[data-noskin]')) el.title = el.title.split('KitFire').join('KitCrew');
      });
    }
  }

  // The KitCrew mark — same code-drawn SVG as kitcrew.ai (S227 carve-out:
  // marks are vectors, never generated images).
  const KC_MARK =
    '<svg class="kc-mark" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="kc-g-bo" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#22d3c7"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>' +
    '<rect width="32" height="32" rx="9" fill="url(#kc-g-bo)"/>' +
    '<g stroke="#f5f7ff" stroke-width="1.6" stroke-linecap="round" opacity="0.85">' +
    '<line x1="16" y1="10" x2="10.5" y2="20"/><line x1="16" y1="10" x2="21.5" y2="20"/>' +
    '<line x1="10.5" y1="20" x2="21.5" y2="20"/></g>' +
    '<circle cx="16" cy="10" r="3.1" fill="#ffffff"/>' +
    '<circle cx="10.5" cy="20" r="2.5" fill="#f5f7ff" opacity="0.92"/>' +
    '<circle cx="21.5" cy="20" r="2.5" fill="#f5f7ff" opacity="0.92"/></svg>';

  function applyDom() {
    document.title = window.KF_BRAND.title;
    const kit = document.querySelector('.brand-kit');
    const fire = document.querySelector('.brand-fire');
    if (kit) kit.textContent = window.KF_BRAND.wordmark[0];
    if (fire) fire.textContent = window.KF_BRAND.wordmark[1];

    // Sidebar wordmark becomes mark + "KitCrew" + "by KitFire" (data-noskin
    // keeps the walk from rewriting the parent attribution).
    const brandEl = document.querySelector('#sidebar .brand');
    if (brandEl && !brandEl.querySelector('.kc-mark')) {
      brandEl.insertAdjacentHTML('afterbegin', KC_MARK);
      const by = document.createElement('span');
      by.className = 'kc-by';
      by.setAttribute('data-noskin', '');
      by.textContent = 'by KitFire';
      const dot = brandEl.querySelector('.brand-dot');
      brandEl.insertBefore(by, dot || null);
    }

    // Pre-boot placeholders ship "Starter" (the KitFire base skin) — on
    // this lane there is no Starter, ever (S232: one plan, Duplicator Pro
    // $299/mo). Overwrite before live data lands so the label never
    // flashes wrong.
    const seatPlanEl = document.getElementById('seatPlan');
    if (seatPlanEl) seatPlanEl.textContent = 'Duplicator Pro · $299/mo founding rate';
    const usagePlanEl = document.getElementById('usagePlanTag');
    if (usagePlanEl) usagePlanEl.textContent = 'Duplicator Pro';

    // Pricing panel: one plan — hide Starter, re-letter the featured card
    // as the customer's own Duplicator Pro plan. (Plan NAME under the
    // KitCrew brand is Tom's execution item — 'Duplicator Pro' stands
    // until he rules; S246.)
    const starter = document.querySelector('.price-card.current');
    const featured = document.querySelector('.price-card.featured');
    if (starter) starter.style.display = 'none';
    if (featured) {
      const set = (sel, text) => {
        const el = featured.querySelector(sel);
        if (el) el.textContent = text;
      };
      set('.price-tier', 'Duplicator Pro');
      set('.price-flag', 'Founding rate');
      set('.price-note', 'Every KitCrew agent · the referral program built in');
      const bullets = [
        'All six KitCrew agents — Follow-Up through Duplication',
        '1 seat — the whole crew works for you',
        'Full trust ladder: graduate any action to auto',
        'Referral dashboard: your link, your three levels, your ledger',
      ];
      featured.querySelectorAll('.price-feats li').forEach((li, i) => {
        if (bullets[i]) li.textContent = bullets[i];
      });
      const up = featured.querySelector('#upgradeBtn');
      if (up) {
        up.outerHTML = '<span class="price-current-tag">&#10003; Your plan</span>';
      }
    }

    // Seats: $299/mo for ONE seat, period — the $25/mo extra seat is
    // strictly KitFire-for-businesses (Chris ruling S232). Kill the
    // add-seat rail and the extra-seat tank copy on this skin.
    const addSeat = document.getElementById('addSeatBtn');
    if (addSeat) addSeat.style.display = 'none';
    const roleHint = document.querySelector('.role-hint');
    if (roleHint) roleHint.textContent = 'Only admins can change billing.';
    const priceFoot = document.querySelector('.price-foot');
    if (priceFoot) {
      priceFoot.textContent =
        'Your founding rate locks for as long as you stay subscribed. KitCrew never moves money or holds your credentials — at any tier.';
    }

    const refer = document.getElementById('referLink');
    if (refer) refer.textContent = window.KF_BRAND.referral;

    // Refer & earn copy: this lane's comp is 3-level perpetual — the
    // KitFire 12-month single-level text is the wrong program. Structure
    // only, never projections (income-claims law binds demo copy too).
    const referHead = document.querySelector('#view-refer .view-head p');
    if (referHead) {
      referHead.textContent =
        'Share your link. Your referrals run three levels deep — 15% · 5% · 15% of what they spend, for as long as they stay. Your dashboard shows your real numbers.';
    }
    const steps = document.querySelectorAll('#view-refer .refer-step');
    if (steps.length === 3) {
      steps[2].innerHTML = '<b>3.</b> You earn on three levels — 15% / 5% / 15% — every month they stay';
    }
    const example = document.getElementById('referExample');
    if (example) {
      example.textContent =
        'Commissions accrue only from collected payments and appear in your ledger. Payouts run through Stripe after your payout account is set up — your dashboard always shows real numbers, never projections.';
    }

    walk(document.body);
  }

  // app.js renders views after load — keep skinning whatever it adds.
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') skinTextNode(m.target);
      m.addedNodes && m.addedNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) skinTextNode(n);
        else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
      });
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    applyDom();
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
