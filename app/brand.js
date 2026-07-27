// ============================================================
// Brand layer — one platform, two skins (S221).
// KitFire (default) and TecHive by KitFire (the MLM/duplication lane).
// Loaded BEFORE app.js: sets window.KF_BRAND, then skins the DOM.
//
// Selection: ?brand=techive (demo/preview) or a techive.* hostname
// (app.techive.ai in production). Everything server-side is shared —
// the skin changes the wordmark, accent (hive amber vs ember red),
// product strings, demo persona pricing panel, and referral link.
// The build stays KitFire's; TecHive is a coat of paint (Chris ruling).
// ============================================================

(function () {
  const qs = new URLSearchParams(location.search);
  // TecHive hostnames: techive.* (the eventual home) and
  // itsgreatbusiness.com (S221 — Chris's GoDaddy domain hosting the live
  // TecHive preview until Tom hands over techive.ai).
  const isTecHive = qs.get('brand') === 'techive' ||
    /(^|\.)techive\.|(^|\.)itsgreatbusiness\./i.test(location.hostname);

  window.KF_BRAND = isTecHive
    ? {
        key: 'techive',
        product: 'TecHive',
        wordmark: ['Tec', 'Hive'],
        title: 'TecHive — your AI duplication workforce',
        // Hive amber. PLACEHOLDER palette pending Chris's approval —
        // one variable swap when the real TecHive brand kit lands.
        accent: '#f59e0b',
        accentSoft: 'rgba(245, 158, 11, 0.14)',
        accentLine: 'rgba(245, 158, 11, 0.42)',
        referral: 'techive.ai/start?ref=demo-marcus',
      }
    : { key: 'kitfire', product: 'KitFire', wordmark: ['Kit', 'Fire'] };

  if (!isTecHive) return; // KitFire needs no skinning — it IS the base

  document.documentElement.setAttribute('data-brand', 'techive');
  const rs = document.documentElement.style;
  rs.setProperty('--ember', window.KF_BRAND.accent);
  rs.setProperty('--ember-soft', window.KF_BRAND.accentSoft);
  rs.setProperty('--ember-line', window.KF_BRAND.accentLine);

  // CRITICAL: only ASSIGN when the text actually contains the brand name.
  // An unconditional `n.nodeValue = ...` fires a characterData mutation on
  // every node the observer touches — each assignment re-triggers the
  // observer, which assigns again: infinite loop, page unresponsive
  // (S221 live bug). The includes() guard makes every rewrite terminal:
  // once replaced, the node never matches again.
  function skinTextNode(n) {
    if (n.nodeValue && n.nodeValue.includes('KitFire')) {
      n.nodeValue = n.nodeValue.split('KitFire').join('TecHive');
    }
  }
  function walk(root) {
    if (!root) return;
    const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = it.nextNode())) skinTextNode(n);
    if (root.querySelectorAll) {
      root.querySelectorAll('[placeholder]').forEach((el) => {
        if (el.placeholder.includes('KitFire')) el.placeholder = el.placeholder.split('KitFire').join('TecHive');
      });
      root.querySelectorAll('[title]').forEach((el) => {
        if (el.title.includes('KitFire')) el.title = el.title.split('KitFire').join('TecHive');
      });
    }
  }

  function applyDom() {
    document.title = window.KF_BRAND.title;
    const kit = document.querySelector('.brand-kit');
    const fire = document.querySelector('.brand-fire');
    if (kit) kit.textContent = window.KF_BRAND.wordmark[0];
    if (fire) fire.textContent = window.KF_BRAND.wordmark[1];

    // Pre-boot placeholders ship "Starter" (the KitFire base skin) — on
    // TecHive there is no Starter, ever (S232: one plan, Duplicator Pro
    // $299/mo). Overwrite before live data lands so the label never
    // flashes wrong.
    const seatPlanEl = document.getElementById('seatPlan');
    if (seatPlanEl) seatPlanEl.textContent = 'Duplicator Pro · $299/mo founding rate';
    const usagePlanEl = document.getElementById('usagePlanTag');
    if (usagePlanEl) usagePlanEl.textContent = 'Duplicator Pro';

    // Pricing panel: TecHive is ONE plan — hide Starter, re-letter the
    // featured card as the customer's own Duplicator Pro plan.
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
      set('.price-note', 'Every TecHive agent · the referral program built in');
      const bullets = [
        'All six TecHive agents — Follow-Up through Duplication',
        '1 seat included · extra seats $25/mo',
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

    const refer = document.getElementById('referLink');
    if (refer) refer.textContent = window.KF_BRAND.referral;

    // Refer & earn copy: TecHive's comp is 3-level perpetual — the KitFire
    // 12-month single-level text is the wrong program. Structure only,
    // never projections (income-claims law binds demo copy too).
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
