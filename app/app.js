// KitFire Platform — thin client. Zero intelligence (S172 doctrine): every view
// renders server output; the loop compiler, specs, doctrine, and entitlement
// truth live behind the kitfire-platform edge fn. This file is UI state + the
// callPlatform() contract only.
//
// DEMO_MODE (S225 — LIVE wiring): demo only when there is no access code to
// authenticate with — i.e. the ?demo=1 tour, where the gate never stores
// one. A member who unlocked the gate has their code in sessionStorage
// (tab-session only, never persisted) and every view loads server truth
// from kitfire-platform. The demo dataset below stays as the tour's data
// AND the shape documentation for what the server returns.
//
// Connector rail (S225/FLEET-0056): list_connectors/connect_start/
// disconnect/request_connector call techive-platform's new connector
// tasks; a successful connect_start same-tab-redirects to the provider's
// consent page, which eventually 302s back here via the sibling
// techive-oauth callback fn as ?view=connections&connected=<id>. Every
// call degrades gracefully if the server hasn't been redeployed with the
// rail yet (ok:false, unknown task) — the same honest "Coming online
// soon" fallback either way, never an error splash. See
// product/techive/CONNECTOR_RUNBOOK.md for the operator deploy steps.

const ACCESS_CODE = sessionStorage.getItem('kf_access_code') || '';
const DEMO_MODE = !ACCESS_CODE;
// S225 separation ruling (Chris): TecHive and KitFire are separate
// companies — this app talks to techive-platform, TecHive's own fn.
const PLATFORM_ENDPOINT = 'https://obwjlqrzshdglrccsbtl.supabase.co/functions/v1/techive-platform';

// ---------- markdown (ported verbatim policy from sidepanel.js: escape FIRST) ----------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function renderInline(s) {
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function mdToHtml(raw) {
  const lines = escapeHtml(raw == null ? '' : raw).split(/\r?\n/);
  const out = [];
  let list = [];
  const flush = () => {
    if (list.length) { out.push('<ul>' + list.map((li) => `<li>${renderInline(li)}</li>`).join('') + '</ul>'); list = []; }
  };
  for (const line of lines) {
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) { list.push(ul[1]); continue; }
    flush();
    if (line.trim() === '') continue;
    out.push(`<p>${renderInline(line)}</p>`);
  }
  flush();
  return out.join('');
}

// ---------- demo data (mirrors platform_schema.sql shapes) ----------

const demo = {
  seat: { display_name: 'Dana (Demo)', plan: 'Starter · $99/mo founding rate', role: 'admin' },
  paused: false,
  // Curated connector shelf (MCP-backed — the catalog is the open MCP registry,
  // curated + pre-taught per agent; see FLEET-0054). state: connected|available|soon
  connections: [
    { id: 'gmail', cat: 'Inbox & comms', ico: '&#9993;', name: 'Gmail', desc: 'Your triage agent reads and sorts it around the clock.', state: 'available' },
    { id: 'markethive', cat: 'Inbox & comms', img: 'assets/markethive-icon.png', name: 'MarketHive', desc: 'Official connector in the works — group blogs, feed, capture pages, and your leads.', state: 'soon' },
    { id: 'outlook', cat: 'Inbox & comms', ico: '&#9993;', name: 'Outlook', desc: 'Inbox + calendar in one connector.', state: 'available' },
    { id: 'slack', cat: 'Inbox & comms', ico: '&#128172;', name: 'Slack', desc: 'Team chatter becomes team memory — decisions get caught, not lost.', state: 'available' },
    { id: 'phone', cat: 'Inbox & comms', ico: '&#9742;', name: 'Business phone', desc: 'Voicemail transcripts and missed-call follow-ups flow into triage.', state: 'available' },
    { id: 'quickbooks', cat: 'Money', ico: '&#128202;', name: 'QuickBooks', desc: 'Your Invoice Chaser knows what an aging report is on day one.', state: 'available' },
    { id: 'stripe', cat: 'Money', ico: '&#128179;', name: 'Stripe', desc: 'Payments, disputes, and failed charges — flagged before they fester.', state: 'available' },
    { id: 'square', cat: 'Money', ico: '&#128179;', name: 'Square', desc: 'Sales trends and slow days, read daily.', state: 'available' },
    { id: 'paypal', cat: 'Money', ico: '&#128179;', name: 'PayPal', desc: 'Disputes and payouts in the morning brief.', state: 'available' },
    { id: 'hubspot', cat: 'Customers & reviews', ico: '&#129309;', name: 'HubSpot', desc: 'Your Sales Follow-Up Agent works the pipeline you already have.', state: 'available' },
    { id: 'salesforce', cat: 'Customers & reviews', ico: '&#9729;', name: 'Salesforce', desc: 'Your pipeline, worked daily — stale deals nudged, call sheets prepped.', state: 'available' },
    { id: 'gbp', cat: 'Customers & reviews', ico: '&#11088;', name: 'Google Business Profile', desc: 'New reviews answered in your voice, flagged when they need you.', state: 'available' },
    { id: 'gcal', cat: 'Schedule', ico: '&#128197;', name: 'Google Calendar', desc: '"Prep me before this call" needs eyes on your week.', state: 'available' },
    { id: 'shopify', cat: 'Store & site', ico: '&#128722;', name: 'Shopify', desc: 'Orders, stock-outs, and abandoned carts — watched.', state: 'available' },
    { id: 'forms', cat: 'Store & site', ico: '&#128203;', name: 'Website forms', desc: 'New leads from your site land with your agents the second they arrive.', state: 'connected' },
    { id: 'gdrive', cat: 'Docs & files', ico: '&#128193;', name: 'Google Drive', desc: 'Your agents can read the files you point them at.', state: 'available' },
    { id: 'notion', cat: 'Docs & files', ico: '&#128221;', name: 'Notion', desc: 'SOPs and notes become working knowledge.', state: 'available' },
    { id: 'dropbox', cat: 'Docs & files', ico: '&#128230;', name: 'Dropbox', desc: 'Contracts and job files, readable on demand.', state: 'available' },
    { id: 'canva', cat: 'Docs & files', ico: '&#127912;', name: 'Canva', desc: 'Your Content Agent drafts designs where you already make them.', state: 'available' },
    { id: 'docusign', cat: 'Docs & files', ico: '&#9997;', name: 'DocuSign', desc: 'Who signed, who stalled — chased politely, automatically.', state: 'available' },
    { id: 'teams', cat: 'Inbox & comms', ico: '&#128172;', name: 'Microsoft Teams', desc: 'Same team-memory catch as Slack, Microsoft flavor.', state: 'available' },
    { id: 'zoom', cat: 'Inbox & comms', ico: '&#127909;', name: 'Zoom', desc: 'Meeting summaries land in team memory before you forget them.', state: 'available' },
    { id: 'xero', cat: 'Money', ico: '&#128202;', name: 'Xero', desc: 'The QuickBooks treatment, for Xero shops.', state: 'available' },
    { id: 'mailchimp', cat: 'Customers & reviews', ico: '&#128231;', name: 'Mailchimp', desc: 'Campaigns and list health, watched and reported.', state: 'available' },
    { id: 'meta', cat: 'Customers & reviews', ico: '&#128241;', name: 'Facebook & Instagram', desc: 'Comments and DMs from your business pages, triaged.', state: 'available' },
    { id: 'linkedin', cat: 'Customers & reviews', ico: '&#128188;', name: 'LinkedIn', desc: 'Company-page activity and inbound interest, flagged.', state: 'available' },
    { id: 'calendly', cat: 'Schedule', ico: '&#128337;', name: 'Calendly', desc: 'Bookings flow straight into prep sheets.', state: 'available' },
    { id: 'wordpress', cat: 'Store & site', ico: '&#127758;', name: 'WordPress', desc: 'Your Content Agent publishes to the blog you already own.', state: 'available' },
  ],
  teamSeats: [
    { name: 'Dana (Demo)', role: 'admin' },
    { name: 'Jordan (Demo)', role: 'member' },
  ],
  invoices: [
    { date: 'Jul 1, 2026', amount: '$99.00', status: 'Paid' },
    { date: 'Jun 1, 2026', amount: '$99.00', status: 'Paid' },
  ],
  referral: { link: 'kitfire.ai/start?ref=demo-dana', earnings: 0, count: 0 },
  // Campaigns (FLEET-0070/S230): empty on the KitFire skin — the feature
  // is TecHive-only (kitfire-platform.ts is untouched by that job). The
  // switcher hides itself whenever this array is empty (see
  // renderCampaignSwitcher). Each instance below optionally carries a
  // campaign_id ('camp-1' | null) once the TecHive skin override sets it.
  campaigns: [],
  // Settings (FLEET-0069/S230) demo-tour fields not already covered by
  // demo.seat (name/role/plan) or demo.referral.markethive_link. email is a
  // clearly-fake placeholder — never a real address in the tour.
  // email_pings_enabled (FLEET-0071/S230): the demo tour's local copy of
  // the pref — flipping it in the tour never calls the server (DEMO_MODE
  // stubs, see api.updateNotificationPrefs below) and the tour never sends
  // real email regardless of this value.
  settings: { email: 'dana@yourbusiness.com', voice_profile_on_file: false, email_pings_enabled: true },
  // Usage allotments (Anthropic-style): a rolling 5-hour session window and a
  // weekly window. Server-side truth: percentages computed from worker_usage
  // token sums vs the plan's allotment; the client only renders what the
  // server hands back (never computes limits locally).
  usage: {
    session: { pct: 34, resets_in: '2h 41m' },
    week: { pct: 58, resets_at: 'Wed 6:00am' },
  },
  catalog: [
    { id: 'triage', name: 'Triage Agent', dept: 'Ops · Inbox', owned: true,
      pitch: 'Watches your inbox and messages. Sorts what matters, drafts the replies, tells you what needs a decision — before your first coffee.', price: 'Included' },
    { id: 'ask', name: 'Ask KitFire', dept: 'General', owned: true,
      pitch: 'Your on-call brain. Reads pages and files, answers questions, remembers your business.', price: 'Included' },
    { id: 'sales', name: 'Sales Follow-Up Agent', dept: 'Sales', owned: false,
      pitch: 'Never lets a lead go cold. Tracks every conversation, nudges at the right moment, preps your call sheet.', price: 'Full Workforce' },
    { id: 'invoice', name: 'Invoice Chaser', dept: 'Finance ops', owned: false,
      pitch: 'Knows who owes you money and how they like to be reminded. Gentle with good customers, firm with late ones.', price: 'Full Workforce' },
    { id: 'reviews', name: 'Review & Reputation Agent', dept: 'Marketing', owned: false,
      pitch: 'Watches your reviews and mentions everywhere. Drafts the right response and flags the fires early.', price: 'Full Workforce' },
    { id: 'content', name: 'Content Agent', dept: 'Marketing', owned: false,
      pitch: 'Keeps your blog and socials alive in your voice — on a schedule, without you thinking about it.', price: 'Full Workforce' },
    { id: 'scheduler', name: 'Scheduling Agent', dept: 'Ops · Calendar', owned: false,
      pitch: 'Handles the back-and-forth of booking. Protects your focus time like a bouncer.', price: 'Full Workforce' },
  ],
  instances: [
    { id: 'inst-triage', catalog_id: 'triage', name: 'Triage Agent', dept: 'Ops · Inbox', tier: 1,
      mission: 'Watches the inbox each morning. Sorts customer messages and money matters to the top, drafts replies for approval, flags anything with a date this week.',
      actions: [
        { key: 'draft', name: 'Draft replies', state: 'auto' },
        { key: 'file', name: 'File & label', state: 'auto' },
        { key: 'send', name: 'Send replies', state: 'ask' },
        { key: 'schedule', name: 'Book calendar slots', state: 'ask' },
      ],
      streak: { action: 'Send replies', count: 17, threshold: 20 },
      runs: [
        { when: 'Today 6:00am', what: 'Scanned 34 messages · 3 need you · 2 drafts ready' },
        { when: 'Yesterday 6:00am', what: 'Scanned 41 messages · 1 needed you · 1 draft sent after approval' },
        { when: 'Mon 6:00am', what: 'Scanned 29 messages · quiet day, nothing urgent' },
      ] },
    { id: 'inst-ask', catalog_id: 'ask', name: 'Ask KitFire', dept: 'General', tier: 1,
      mission: 'General-purpose help: questions, page reads, file summaries, business memory.',
      actions: [ { key: 'answer', name: 'Answer questions', state: 'auto' } ],
      streak: null,
      runs: [ { when: 'Yesterday', what: 'Summarized the supplier contract PDF' } ] },
  ],
  approvals: [
    { id: 'ap1', agent: 'Triage Agent', time: '6:02am', title: 'Reply to Karen R. — reschedule her quote visit',
      preview: 'Hi Karen — no problem at all, we can move your quote visit. I have Thursday at 10am or Friday at 2pm open this week. Which works better for you?' },
    { id: 'ap2', agent: 'Triage Agent', time: '6:02am', title: 'Reminder to Miller Supply — invoice #1042 past due',
      preview: 'Hi — just a friendly note that invoice #1042 ($860, due July 15) is still open. Happy to resend the invoice if that helps. Thanks!' },
  ],
  activity: [
    { time: '6:02am', body: '<b>Triage Agent</b> queued 2 drafts for your approval' },
    { time: '6:00am', body: '<b>Triage Agent</b> ran the morning sweep — 34 messages scanned' },
    { time: 'Yesterday', body: 'You approved a reply to <b>J. Alvarez</b> — sent unchanged (streak: 17)' },
    { time: 'Yesterday', body: '<b>Ask KitFire</b> summarized <b>supplier-contract.pdf</b>' },
    { time: 'Mon', body: 'You corrected the Triage Agent: <b>"don\'t flag newsletters"</b> — remembered' },
  ],
  chat: {
    'inst-triage': [
      { role: 'user', text: 'What needs me this morning?' },
      { role: 'agent', text: '3 things need a decision. I drafted replies for the first two — approve and I\'ll send.\n- **Karen R.** wants to reschedule her quote visit — reply drafted with two open slots.\n- **Miller Supply invoice #1042** is past due — friendly reminder drafted.\n- **New lead from the website** asked about pricing — that one I\'d rather you see first.', meta: 'Auto-loop ran 6:00am · scanned inbox, calendar, voicemail' },
    ],
    'inst-ask': [
      { role: 'agent', text: 'Ask me anything — a question, a page, a file. I remember your business.' },
    ],
  },
};

// ---------- TecHive skin: demo dataset override (S221) ----------
// Brand detection lives in brand.js (loaded first). Same platform, same
// rails, same schema shapes — only the persona and roster change. Roster
// of record: product/techive/techive_catalog_seed.sql (6 agents, Invoice
// Chaser ruled out). Income-claims law holds in demo copy too: activity
// shows WORK (touches, drafts, onboards) — never a dollar earned.
if (window.KF_BRAND && window.KF_BRAND.key === 'techive') {
  demo.seat = { display_name: 'Marcus (Demo)', plan: 'Duplicator Pro · $299/mo founding rate', role: 'admin' };
  demo.teamSeats = [{ name: 'Marcus (Demo)', role: 'admin' }];
  demo.referral = { link: 'techive.ai/start?ref=demo-marcus', earnings: '119.60', count: 5 };
  demo.settings = { email: 'marcus@yourbusiness.com', voice_profile_on_file: true, email_pings_enabled: true };
  // Demo org chart — the customer-visible projection of affiliate_profiles
  // (genealogy) + commission_ledger (money). Production: the
  // referral_overview platform task (contract in TECHIVE_ONEPAGER.md).
  // Dashboard shows the member's OWN real numbers — that surface is the
  // one place dollars are allowed (income-claims law: no projections).
  demo.referral.organization = [
    { level: 1, rate: '15%', accrued: '$89.70', members: [
      { name: 'Kayla M.', status: 'active', joined: 'Jul 20', month: '$44.85' },
      { name: 'Devon R.', status: 'active', joined: 'Jul 22', month: '$44.85' },
      { name: 'Priya S.', status: 'inactive', joined: 'Jul 18', month: '—' },
    ] },
    { level: 2, rate: '5%', accrued: '$29.90', members: [
      { name: 'Tasha B.', status: 'active', joined: 'Jul 21', month: '$14.95' },
      { name: 'Miguel A.', status: 'active', joined: 'Jul 22', month: '$14.95' },
    ] },
    { level: 3, rate: '15%', accrued: '$0.00', members: [] },
  ];
  // The same organization as a TREE for the drawn chart (S221 redesign):
  // root = the member, children = who each person sponsored. Production:
  // referral_overview returns this nested shape directly.
  demo.referral.tree = {
    name: 'Marcus (you)', status: 'active', children: [
      { name: 'Kayla M.', status: 'active', month: '$44.85', e1: true, children: [
        { name: 'Tasha B.', status: 'active', month: '$14.95', children: [] },
      ] },
      { name: 'Devon R.', status: 'active', month: '$44.85', e1: true, children: [
        { name: 'Miguel A.', status: 'active', month: '$14.95', children: [] },
      ] },
      { name: 'Priya S.', status: 'inactive', month: null, children: [] },
    ],
  };
  demo.connections = demo.connections.map((c) =>
    c.id === 'markethive'
      ? { ...c, desc: 'Your home base — group blogs, feed, capture pages, and your leads, all wired in.', state: 'connected' }
      : c
  );
  demo.catalog = [
    { id: 'followup_engine', name: 'Follow-Up Agent', dept: 'Sales', owned: true,
      pitch: 'Every prospect followed up until they decide — 7 touches, not 2. Drafted for your approval, never pushy, never forgets a name.', price: 'Included' },
    { id: 'content_engine', name: 'Content Agent', dept: 'Marketing', owned: true,
      pitch: 'Daily posts and blogs in YOUR voice — written, imaged, ready to approve. Three hours of content work becomes three minutes.', price: 'Included' },
    { id: 'lead_concierge', name: 'Lead Agent', dept: 'Sales', owned: true,
      pitch: 'Capture-page leads answered in minutes — qualified, warmed, and booked before they go cold.', price: 'Included' },
    { id: 'engagement_engine', name: 'Engagement Agent', dept: 'Marketing', owned: true,
      pitch: 'Comments and DMs answered around the clock. Your audience never feels ignored — and you get your phone back.', price: 'Included' },
    { id: 'team_builder', name: 'Duplication Agent', dept: 'Team', owned: true,
      pitch: 'Everyone you sponsor gets onboarded onto this same system — welcomed, set up, walked through their first steps. Duplication that actually duplicates.', price: 'Included' },
    { id: 'inbox_triage', name: 'Triage Agent', dept: 'Ops · Inbox', owned: true,
      pitch: 'Your inbox and notifications sorted every morning — prospect replies and money matters on top, noise summarized.', price: 'Included' },
  ];
  // Campaigns (FLEET-0070/S230): two labeled sample campaigns for the demo
  // tour (QA requirement) — 'camp-1' owns every company-layer instance
  // below (campaign_id set per instance, mirroring the roster split in
  // techive-platform.ts's PERSONAL_LAYER_CATALOG_IDS); 'camp-2' starts
  // empty, exactly like a real second campaign moments after creation
  // (before the next list_instances preload has populated it). The
  // switcher is entirely local in demo mode — no server calls.
  demo.campaigns = [
    { id: 'camp-1', name: 'My business', status: 'active' },
    { id: 'camp-2', name: 'Downline Co-op', status: 'active' },
  ];
  demo.instances = [
    { id: 'inst-followup', catalog_id: 'followup_engine', campaign_id: 'camp-1', name: 'Follow-Up Agent', dept: 'Sales', tier: 1,
      mission: 'Runs every prospect to seven meaningful touches. Drafts each message in your voice for approval, spaces them naturally, and never lets a name fall through.',
      actions: [
        { key: 'draft', name: 'Draft follow-ups', state: 'auto' },
        { key: 'log', name: 'Log & schedule touches', state: 'auto' },
        { key: 'send', name: 'Send follow-ups', state: 'ask' },
      ],
      streak: { action: 'Send follow-ups', count: 12, threshold: 20 },
      runs: [
        { when: 'Today 7:00am', what: '9 prospects worked · 3 drafts ready · 2 hit touch #5' },
        { when: 'Yesterday 7:00am', what: '11 prospects worked · 4 drafts approved and sent' },
        { when: 'Mon 7:00am', what: '8 prospects worked · 1 asked to join your team — flagged hot' },
      ] },
    { id: 'inst-content', catalog_id: 'content_engine', campaign_id: 'camp-1', name: 'Content Agent', dept: 'Marketing', tier: 1,
      mission: 'Keeps your feed and blog alive in your voice — daily post drafts with graphics, ready to approve each morning.',
      actions: [
        { key: 'draft_post', name: 'Draft posts & blogs', state: 'auto' },
        { key: 'image', name: 'Generate graphics', state: 'auto' },
        { key: 'publish', name: 'Publish', state: 'ask' },
      ],
      streak: { action: 'Publish', count: 6, threshold: 20 },
      runs: [
        { when: 'Today 6:30am', what: 'Tomorrow’s post drafted + graphic generated · awaiting approval' },
        { when: 'Yesterday', what: 'Post approved & published · engagement up, 4 comments handed to Engagement' },
      ] },
    { id: 'inst-lead', catalog_id: 'lead_concierge', campaign_id: 'camp-1', name: 'Lead Agent', dept: 'Sales', tier: 1,
      mission: 'Answers every capture-page lead within minutes — qualifies them, answers honest questions, and books the conversation before they go cold.',
      actions: [
        { key: 'reply', name: 'Draft lead replies', state: 'auto' },
        { key: 'qualify', name: 'Qualify & tag leads', state: 'auto' },
        { key: 'book', name: 'Propose meeting times', state: 'ask' },
      ],
      streak: { action: 'Propose meeting times', count: 9, threshold: 20 },
      runs: [
        { when: 'Today 8:14am', what: 'New lead from your capture page · replied in 4 min · booked Thursday' },
        { when: 'Yesterday', what: '2 leads worked · 1 qualified hot, handed to Follow-Up' },
      ] },
    { id: 'inst-engage', catalog_id: 'engagement_engine', campaign_id: 'camp-1', name: 'Engagement Agent', dept: 'Marketing', tier: 1,
      mission: 'Watches your comments and DMs around the clock. Drafts warm, human replies in your voice — you approve, your audience never feels ignored.',
      actions: [
        { key: 'comment', name: 'Draft comment replies', state: 'auto' },
        { key: 'dm', name: 'Draft DM replies', state: 'auto' },
        { key: 'send', name: 'Send replies', state: 'ask' },
      ],
      streak: { action: 'Send replies', count: 14, threshold: 20 },
      runs: [
        { when: 'Today 7:40am', what: '6 comments + 2 DMs · replies drafted · 1 buying question flagged hot' },
        { when: 'Yesterday', what: '11 replies approved & sent · zero left waiting overnight' },
      ] },
    { id: 'inst-team', catalog_id: 'team_builder', campaign_id: 'camp-1', name: 'Duplication Agent', dept: 'Team', tier: 1,
      mission: 'Onboards everyone you sponsor onto this same system — welcome, setup, first steps — and keeps care touches flowing to your existing team and customers.',
      actions: [
        { key: 'welcome', name: 'Draft welcomes & nudges', state: 'auto' },
        { key: 'track', name: 'Track first-steps checklists', state: 'auto' },
        { key: 'send', name: 'Send team messages', state: 'ask' },
      ],
      streak: { action: 'Send team messages', count: 4, threshold: 20 },
      runs: [
        { when: 'Yesterday', what: 'Kayla M. onboarded · welcome sent after your approval · checklist started' },
        { when: 'Mon', what: '3 team care touches drafted · 2 customers checked on' },
      ] },
    { id: 'inst-triage2', catalog_id: 'inbox_triage', campaign_id: null, name: 'Triage Agent', dept: 'Ops · Inbox', tier: 1,
      mission: 'Sorts your inbox and notifications every morning — prospect replies and money matters to the top, noise summarized, obvious replies drafted.',
      actions: [
        { key: 'sort', name: 'Sort & summarize', state: 'auto' },
        { key: 'draft', name: 'Draft obvious replies', state: 'auto' },
        { key: 'send', name: 'Send replies', state: 'ask' },
      ],
      streak: { action: 'Send replies', count: 11, threshold: 20 },
      runs: [
        { when: 'Today 6:00am', what: 'Scanned 27 messages · 2 prospect replies surfaced · 1 company notice flagged' },
        { when: 'Yesterday 6:00am', what: 'Scanned 31 messages · quiet day, nothing urgent' },
      ] },
    { id: 'inst-ask', catalog_id: 'ask', campaign_id: null, name: 'Ask TecHive', dept: 'General', tier: 1,
      mission: 'General-purpose help: questions, page reads, file summaries, business memory.',
      actions: [{ key: 'answer', name: 'Answer questions', state: 'auto' }],
      streak: null,
      runs: [{ when: 'Yesterday', what: 'Summarized your company’s new product PDF' }] },
  ];
  demo.approvals = [
    { id: 'ap1', agent: 'Follow-Up Agent', time: '7:02am', title: 'Touch #3 to Denise W. — she watched the video',
      preview: 'Hi Denise! Saw you got a chance to watch the overview. No pressure at all — most people have one or two questions right about now. What stood out to you?' },
    { id: 'ap2', agent: 'Content Agent', time: '6:30am', title: 'Tomorrow’s post — "the system works while you sleep" (graphic attached)',
      preview: 'Woke up to three conversations my follow-up system started while I was asleep. Not magic — just a system that never forgets anyone. DM me "SYSTEM" if you want to see how it runs.' },
  ];
  demo.activity = [
    { time: '7:02am', body: '<b>Follow-Up Agent</b> queued 3 touch drafts for your approval' },
    { time: '6:30am', body: '<b>Content Agent</b> drafted tomorrow’s post + generated the graphic' },
    { time: 'Yesterday', body: '<b>Duplication Agent</b> onboarded <b>Kayla M.</b> — first-steps checklist started' },
    { time: 'Yesterday', body: '<b>Lead Agent</b> answered a capture-page lead in 4 minutes — booked for Thursday' },
    { time: 'Mon', body: 'You corrected the Content Agent: <b>"never use hype words"</b> — remembered' },
  ];
  demo.chat = {
    'inst-followup': [
      { role: 'user', text: 'Who needs me this morning?' },
      { role: 'agent', text: '3 touches are drafted and waiting on you — approve and I’ll send.\n- **Denise W.** watched the overview video — touch #3 drafted, question-style.\n- **Rob T.** went quiet after touch #4 — a light check-in is drafted, no pressure.\n- **Kayla M.’s sister** asked about the product — that one I’d rather you see first.', meta: 'Auto-loop ran 7:00am · worked 9 prospects' },
    ],
    'inst-content': [
      { role: 'agent', text: 'Tomorrow’s post is drafted with a fresh graphic — it’s in Approvals. Want a different angle? Tell me in a sentence and I’ll redraft.' },
    ],
    'inst-lead': [
      { role: 'agent', text: 'A new lead hit your capture page at 8:10am — I replied in 4 minutes, answered her product question, and she’s booked for Thursday 2pm. Details are in Activity.' },
    ],
    'inst-engage': [
      { role: 'agent', text: '6 comments and 2 DMs came in overnight — replies are drafted in your voice. One DM asked how to order; I flagged it hot and handed it to your Follow-Up Agent.' },
    ],
    'inst-team': [
      { role: 'agent', text: 'Kayla M. finished step 2 of her first-steps checklist (capture page live). Step 3 is her first post — a nudge is drafted whenever you want to send it.' },
    ],
    'inst-triage2': [
      { role: 'agent', text: 'Morning sweep done — 27 messages scanned. 2 prospect replies are on top, one company notice about the fall promo is flagged, everything else is summarized below.' },
    ],
    'inst-ask': [
      { role: 'agent', text: 'Ask me anything — a question, a page, a file. I remember your business.' },
    ],
  };
}

// ---------- api (the contract; demo stubs now, kitfire-platform later) ----------

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const api = {
  async chat(instanceId, text) {
    if (DEMO_MODE) {
      await wait(900);
      return { ok: true, output: 'Got it. *(Demo mode — the live agent answers here once the platform server is deployed.)*\n\nWhen I\'m live, this message routes through your agent\'s memory and doctrine on the server — nothing runs in your browser.' };
    }
    return callPlatform('chat', { instance_id: instanceId, content: text });
  },
  async spawn(catalogId, goal) {
    if (DEMO_MODE) {
      await wait(1600);
      return { ok: true, plan: [
        'Every morning at 6am (and again at noon), read what came in.',
        'Anything from a customer or about money goes to the top of your list.',
        'Draft a reply for each one, in your tone — ready for one-tap approval.',
        'Anything with a date this week gets flagged the day before.',
        'If something looks urgent or unusual, I stop and ask instead of guessing.',
      ] };
    }
    return callPlatform('spawn_agent', { catalog_id: catalogId, content: goal });
  },
  async approve(id, verdict) {
    if (DEMO_MODE) { await wait(400); return { ok: true }; }
    return callPlatform('approval_action', { approval_id: id, verdict });
  },
  async setAutonomy(instanceId, actionKey, state) {
    if (DEMO_MODE) { await wait(250); return { ok: true }; }
    return callPlatform('set_autonomy', { instance_id: instanceId, action_key: actionKey, state });
  },
  async getUsage() {
    // Server computes everything (worker_usage sums vs plan_config allotments,
    // incl. per-seat tank bumps) — the client only renders percentages.
    if (DEMO_MODE) { await wait(150); return { ok: true, usage: demo.usage, plan: demo.seat.plan.split(' · ')[0] }; }
    return callPlatform('get_usage', {});
  },
  // ---- Connector rail (S225/FLEET-0056) ----
  async listConnectors() {
    if (DEMO_MODE) { await wait(150); return { ok: true, connectors: demo.connections.map((c) => ({ id: c.id, state: c.state, connected_at: null })) }; }
    return callPlatform('list_connectors', {});
  },
  async connectStart(connectorId) {
    // No demo stub needed — the demo-tour click handler flips state locally
    // and never calls this; real transport only.
    return callPlatform('connect_start', { connector_id: connectorId });
  },
  async disconnectConnector(connectorId) {
    return callPlatform('disconnect', { connector_id: connectorId });
  },
  async requestConnector(text) {
    return callPlatform('request_connector', { content: text });
  },
  // ---- Triage morning sweep (S225/FLEET-0057) ----
  async runTriage(instanceId) {
    if (DEMO_MODE) {
      await wait(1400);
      return {
        ok: true,
        output: 'Morning sweep done (demo) — 27 messages scanned. 2 prospect replies and 1 company notice are on top, ' +
          '3 messages from your bank are reserved for you (never opened), and everything else is quiet noise. ' +
          '2 replies are drafted and waiting in **Approvals**.\n\n---\nOn a live account, this reads your connected Gmail through the connector rail — nothing here is real yet.',
        drafts_queued: 2,
      };
    }
    return callPlatform('run_triage', { instance_id: instanceId });
  },
  // ---- Content Agent daily draft run (S232/FLEET-0072) ----
  // DEMO_MODE is a local-only sample (packet requirement): no server call —
  // pushes a brief + 2 sample drafts straight into demo.approvals, matching
  // the demo tour's existing texture (see demo.approvals' Content Agent
  // sample row above). Live mode calls the server exactly like runTriage.
  async runContent(instanceId) {
    if (DEMO_MODE) {
      await wait(1400);
      const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const stamp = Date.now();
      demo.approvals = [
        ...demo.approvals,
        { id: `ap-content-demo-${stamp}-1`, agent: 'Content Agent', time,
          title: 'Post — the system works while you sleep',
          preview: 'Woke up to three conversations my follow-up system started while I was asleep. Not magic — just a system that never forgets anyone. DM me "SYSTEM" if you want to see how it runs.' },
        { id: `ap-content-demo-${stamp}-2`, agent: 'Content Agent', time,
          title: 'Blog — What actually changes when follow-up never stops',
          preview: 'Most deals are lost to silence, not rejection. Here is what changed once every prospect got a real follow-up cadence instead of two tries and a shrug…' },
      ];
      return {
        ok: true,
        output: "Today's content is drafted (demo) — 3 posts across distinct angles (value, story, engagement) plus a short blog draft, " +
          'in your voice. 2 samples are waiting in **Approvals** for the tour; on a live account all 4 land there.\n\n---\n' +
          "On a live account, this is grounded only in your agent's goal, doctrine, and your voice profile — never invented product facts, and nothing here is real yet.",
        drafts_queued: 2,
      };
    }
    return callPlatform('run_content', { instance_id: instanceId });
  },
  // ---- Settings (S225/FLEET-0069) ----
  async getSettings() {
    if (DEMO_MODE) {
      await wait(150);
      return {
        ok: true,
        settings: {
          display_name: demo.seat.display_name,
          role: demo.seat.role,
          plan: demo.seat.plan.split(' · ')[0],
          markethive_link: demo.referral.markethive_link || '',
          voice_profile_on_file: demo.settings.voice_profile_on_file,
          email: demo.settings.email,
          email_pings_enabled: demo.settings.email_pings_enabled,
        },
      };
    }
    return callPlatform('get_settings', {});
  },
  // ---- Dispatch ping preference (S225/FLEET-0071) ----
  async updateNotificationPrefs(enabled) {
    if (DEMO_MODE) {
      await wait(200);
      demo.settings.email_pings_enabled = enabled;
      return { ok: true, email_pings_enabled: enabled };
    }
    return callPlatform('update_notification_prefs', { email_pings_enabled: enabled });
  },
  async updateSeatName(name) {
    if (DEMO_MODE) {
      await wait(250);
      demo.seat.display_name = name;
      demo.teamSeats = [{ name, role: demo.seat.role }];
      return { ok: true, display_name: name };
    }
    return callPlatform('update_seat_name', { display_name: name });
  },
  async rotateAccessCode() {
    if (DEMO_MODE) {
      await wait(700);
      return { ok: true, message: "Demo mode — on a live account we'd email your new code right now, and your old code would stop working." };
    }
    return callPlatform('rotate_access_code', {});
  },
  // ---- Campaigns (S225/FLEET-0070) ----
  // DEMO_MODE stubs never mutate demo.campaigns directly — the caller
  // (switchCampaign / the button handlers below) applies the result
  // uniformly for both demo and live, same pattern as updateSeatName.
  async listCampaigns() {
    if (DEMO_MODE) { await wait(150); return { ok: true, campaigns: demo.campaigns, allowed: demo.campaigns.length, used: demo.campaigns.length }; }
    return callPlatform('list_campaigns', {});
  },
  async createCampaign(name) {
    if (DEMO_MODE) {
      await wait(500);
      if (demo.campaigns.length >= 2) {
        return {
          ok: false,
          upgrade: true,
          used: demo.campaigns.length,
          allowed: 2,
          error: "You're using 2 of 2 campaigns on your plan. Add another campaign for $49/mo ($490/yr) to run a separate company with its own agents, fully separate from this one. *(Demo mode — sample cap for the tour.)*",
        };
      }
      return { ok: true, campaign: { id: 'camp-demo-' + (demo.campaigns.length + 1), name, status: 'active' } };
    }
    return callPlatform('create_campaign', { name });
  },
  async renameCampaign(campaignId, name) {
    if (DEMO_MODE) { await wait(250); return { ok: true, name }; }
    return callPlatform('rename_campaign', { campaign_id: campaignId, name });
  },
  async archiveCampaign(campaignId) {
    if (DEMO_MODE) { await wait(300); return { ok: true }; }
    return callPlatform('archive_campaign', { campaign_id: campaignId });
  },
};

async function callPlatform(task, payload) {
  // Real transport — same seat-auth envelope as kitfire-worker (SPEC_V1 pattern).
  const access_code = ACCESS_CODE;
  try {
    const res = await fetch(PLATFORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_code, task, ...payload }),
    });
    return await res.json();
  } catch (e) {
    console.error('KitFire Platform: request failed', task, e);
    return { ok: false, error: "Couldn't reach KitFire. Check your connection and try again." };
  }
}

// ---------- live boot (S225) ----------
// One pass over the read tasks; each ok result overwrites the matching
// demo.* slice, so every render function below works unchanged on live
// data. Any single failed slice degrades gracefully — never a blank app.

const PLAN_RATES = {
  'TecHive': '$299/mo founding rate',
  'Duplicator Pro': '$299/mo founding rate',
  'Starter': '$99/mo founding rate',
  'Full Workforce': '$299/mo founding rate',
};

// TecHive sells exactly ONE plan — Duplicator Pro, $299/mo (Chris ruling
// S232; there is no $99 starter on this skin). The server still labels the
// stubbed plan "Starter" (resolveClientPlan gap), so every plan label the
// TecHive skin renders normalizes here regardless of what the fn returns.
function brandPlanLabel(plan) {
  return window.KF_BRAND && window.KF_BRAND.key === 'techive' ? 'Duplicator Pro' : plan;
}

async function loadLiveState() {
  // Campaigns (FLEET-0070/S230): resolve the active campaign BEFORE the
  // scoped reads below — list_campaigns also ensures the client's default
  // "My business" campaign exists on a fresh account. Pre-deploy (campaigns
  // table not live yet) this resolves to an empty list, currentCampaignId
  // stays null, and every scoped call below is unscoped too — byte-for-
  // byte the pre-FLEET-0070 boot sequence, one extra network hop either way.
  const campResult = await api.listCampaigns();
  if (campResult && campResult.ok && Array.isArray(campResult.campaigns)) {
    demo.campaigns = campResult.campaigns;
    if (!currentCampaignId || !demo.campaigns.some((c) => c.id === currentCampaignId)) {
      currentCampaignId = demo.campaigns[0] ? demo.campaigns[0].id : null;
    }
  }
  const scoped = currentCampaignId ? { campaign_id: currentCampaignId } : {};

  const [inst, cat, appr, act, usage, refer, conn] = await Promise.all([
    callPlatform('list_instances', scoped),
    callPlatform('list_catalog', {}),
    callPlatform('list_approvals', scoped),
    callPlatform('list_activity', scoped),
    callPlatform('get_usage', {}),
    callPlatform('referral_overview', {}),
    callPlatform('list_connectors', {}),
  ]);
  if (inst && inst.ok) demo.instances = inst.instances;
  if (inst && inst.ok && Array.isArray(inst.campaigns) && inst.campaigns.length) demo.campaigns = inst.campaigns;
  if (cat && cat.ok && cat.catalog && cat.catalog.length) demo.catalog = cat.catalog;
  if (appr && appr.ok) demo.approvals = appr.approvals;
  if (act && act.ok) demo.activity = act.activity;
  if (usage && usage.ok) {
    demo.usage = usage.usage;
    const seatName = (usage.seat && usage.seat.name) || 'Member';
    const planLabel = brandPlanLabel(usage.plan);
    demo.seat = {
      display_name: seatName,
      plan: planLabel + ' · ' + (PLAN_RATES[planLabel] || 'founding rate'),
      role: (usage.seat && usage.seat.role) || 'member',
    };
    demo.teamSeats = [{ name: seatName, role: demo.seat.role }];
  }
  demo.invoices = []; // live invoices are in the Stripe portal ("Manage billing")
  // Connectors (S225/FLEET-0056): list_connectors is now the source of
  // truth per connector — the server computes real state (shelf status AND
  // oauth_kind actually wired AND its secrets pasted). Until
  // techive-platform is redeployed with the connector rail, `connect`
  // above resolves ok:false (unknown task) and the fallback below applies
  // — IDENTICAL to the pre-FLEET-0056 behavior, so the site degrades
  // gracefully with zero regression while the fn/SQL deploy is pending
  // (honesty rule either way: never show "Connected" without a real server
  // record, MarketHive always "in the works").
  if (conn && conn.ok && Array.isArray(conn.connectors)) {
    const stateById = new Map(conn.connectors.map((c) => [c.id, c.state]));
    demo.connections = demo.connections.map((c) =>
      stateById.has(c.id)
        ? { ...c, state: stateById.get(c.id) }
        : { ...c, state: c.id === 'markethive' ? 'soon' : 'available' }
    );
  } else {
    demo.connections = demo.connections.map((c) =>
      c.state === 'connected' ? { ...c, state: c.id === 'markethive' ? 'soon' : 'available' } : c
    );
  }
  if (refer && refer.ok && refer.referral) {
    demo.referral = refer.referral;
  }
  demo.chat = {}; // threads hydrate per-instance via chat_history
  currentInstance = demo.instances[0] || null;
}

// ---------- state ----------

let currentView = 'chat';
let currentInstance = demo.instances[0];
let spawnTarget = null;
let referTab = 'overview'; // S221: refer & earn sub-view (TecHive contextual sidebar)
let orgMode = 'chart'; // S221: organization display — 'chart' (avatar tree) | 'sheet' (spreadsheet)
// Campaigns (FLEET-0070/S230): selected campaign filter. null = "no
// campaigns concept in play" — the KitFire skin, or a TecHive account
// whose schema hasn't been redeployed yet (demo.campaigns stays empty
// either way, and the switcher hides itself — see renderCampaignSwitcher).
let currentCampaignId = null;
let demoInstancesAll = null; // demo-tour only: unfiltered snapshot, captured once in boot()

const $ = (id) => document.getElementById(id);

// ---------- sidebar / nav ----------

function renderNav() {
  const nav = $('agentNav');
  nav.innerHTML = '';
  for (const inst of demo.instances) {
    const btn = document.createElement('button');
    btn.className = 'nav-item' + (currentView === 'chat' && inst.id === currentInstance.id ? ' active' : '');
    btn.innerHTML = `<span class="nav-ico">&#9679;</span> ${escapeHtml(inst.name)} <span class="agent-status"></span>`;
    btn.addEventListener('click', () => { selectInstance(inst.id); });
    nav.appendChild(btn);
  }
  document.querySelectorAll('.nav-item[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === currentView && currentView !== 'chat');
  });
  // S221 contextual sidebar: while Refer & earn is open on the TecHive
  // skin, the Workspace list swaps to the refer sub-menu — the sidebar
  // changes with the job instead of one view stacking cards forever.
  const referCtx = currentView === 'refer' && window.KF_BRAND && window.KF_BRAND.key === 'techive';
  const wsItems = $('workspaceItems');
  const referSub = $('referSubNav');
  const wsLabel = $('workspaceLabel');
  if (wsItems && referSub && wsLabel) {
    wsItems.classList.toggle('hidden', referCtx);
    referSub.classList.toggle('hidden', !referCtx);
    wsLabel.textContent = referCtx ? 'Refer & earn' : 'Workspace';
  }
  const badge = $('approvalBadge');
  badge.textContent = String(demo.approvals.length);
  badge.classList.toggle('hidden', demo.approvals.length === 0);
}

function renderChips() {
  const row = $('chipRow');
  row.innerHTML = '';
  for (const inst of demo.instances) {
    const c = document.createElement('button');
    c.className = 'chip' + (currentView === 'chat' && inst.id === currentInstance.id ? ' active' : '');
    c.textContent = inst.name;
    c.addEventListener('click', () => selectInstance(inst.id));
    row.appendChild(c);
  }
  const add = document.createElement('button');
  add.className = 'chip';
  add.textContent = '+ Add';
  add.addEventListener('click', () => showView('catalog'));
  row.appendChild(add);
}

// ---------- campaigns (FLEET-0070, S230) ----------
// Structure only, never earnings — campaign copy is the count of what a
// member can run, not what they make (income-claims law).

function isTecHiveSkin() {
  return Boolean(window.KF_BRAND && window.KF_BRAND.key === 'techive');
}

function closeCampaignMenu() {
  const menu = $('campaignMenu');
  const btn = $('campaignSwitcherBtn');
  if (menu) menu.classList.add('hidden');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function renderCampaignSwitcher() {
  const wrap = $('campaignSwitcher');
  if (!wrap) return;
  const show = isTecHiveSkin() && Array.isArray(demo.campaigns) && demo.campaigns.length > 0;
  wrap.classList.toggle('hidden', !show);
  if (!show) return;

  const current = demo.campaigns.find((c) => c.id === currentCampaignId) || demo.campaigns[0];
  currentCampaignId = current.id;
  $('campaignCurrentName').textContent = current.name;

  const list = $('campaignMenuList');
  list.innerHTML = '';
  for (const c of demo.campaigns) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'campaign-row' + (c.id === currentCampaignId ? ' active' : '');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'campaign-row-name';
    nameSpan.textContent = c.name;
    row.appendChild(nameSpan);
    if (c.id === currentCampaignId) {
      const check = document.createElement('span');
      check.className = 'campaign-row-check';
      check.innerHTML = '&#10003;';
      row.appendChild(check);
    }
    row.addEventListener('click', () => switchCampaign(c.id));
    list.appendChild(row);
  }

  const archiveBtn = $('campaignArchiveBtn');
  if (archiveBtn) archiveBtn.classList.toggle('hidden', demo.seat.role !== 'admin');
}

function filterInstancesForCampaign(all, campaignId) {
  if (!campaignId) return all;
  // Personal-layer instances (campaign_id null/undefined) always show —
  // "the personal layer always visible above the divider" (packet UI bullet).
  return all.filter((i) => !i.campaign_id || i.campaign_id === campaignId);
}

async function switchCampaign(campaignId) {
  if (campaignId === currentCampaignId) { closeCampaignMenu(); return; }
  currentCampaignId = campaignId;
  closeCampaignMenu();

  if (DEMO_MODE) {
    if (!demoInstancesAll) demoInstancesAll = demo.instances.slice();
    demo.instances = filterInstancesForCampaign(demoInstancesAll, currentCampaignId);
  } else {
    const scoped = currentCampaignId ? { campaign_id: currentCampaignId } : {};
    const [inst, appr, act] = await Promise.all([
      callPlatform('list_instances', scoped),
      callPlatform('list_approvals', scoped),
      callPlatform('list_activity', scoped),
    ]);
    if (inst && inst.ok) demo.instances = inst.instances;
    if (appr && appr.ok) demo.approvals = appr.approvals;
    if (act && act.ok) demo.activity = act.activity;
  }

  currentInstance = demo.instances.find((i) => currentInstance && i.id === currentInstance.id) || demo.instances[0] || null;
  renderCampaignSwitcher();
  renderNav();
  renderChips();
  if (currentView === 'chat') { if (currentInstance) { renderChat(); renderDetail(); } }
  if (currentView === 'approvals') renderApprovals();
  if (currentView === 'activity') renderActivity();
}

const campaignSwitcherBtnEl = $('campaignSwitcherBtn');
if (campaignSwitcherBtnEl) {
  campaignSwitcherBtnEl.addEventListener('click', () => {
    const menu = $('campaignMenu');
    const willOpen = menu.classList.contains('hidden');
    menu.classList.toggle('hidden', !willOpen);
    campaignSwitcherBtnEl.setAttribute('aria-expanded', String(willOpen));
  });
}
document.addEventListener('click', (e) => {
  const wrap = $('campaignSwitcher');
  if (wrap && !wrap.classList.contains('hidden') && !wrap.contains(e.target)) closeCampaignMenu();
});

const campaignAddBtnEl = $('campaignAddBtn');
if (campaignAddBtnEl) {
  campaignAddBtnEl.addEventListener('click', async () => {
    const name = ((typeof window.prompt === 'function' && window.prompt('Name this campaign (the company or downline it runs):')) || '').trim();
    if (!name) return;
    const res = await api.createCampaign(name);
    if (res && res.ok && res.campaign) {
      demo.campaigns.push(res.campaign);
      await switchCampaign(res.campaign.id);
    } else if (res && res.upgrade) {
      window.alert(res.error || "You're at your campaign limit — upgrade to add another.");
    } else {
      window.alert((res && res.error) || 'Could not create that campaign — try again in a moment.');
    }
  });
}

const campaignRenameBtnEl = $('campaignRenameBtn');
if (campaignRenameBtnEl) {
  campaignRenameBtnEl.addEventListener('click', async () => {
    const current = demo.campaigns.find((c) => c.id === currentCampaignId) || demo.campaigns[0];
    if (!current) return;
    const name = ((typeof window.prompt === 'function' && window.prompt('Rename this campaign:', current.name)) || '').trim();
    if (!name || name === current.name) { closeCampaignMenu(); return; }
    const res = await api.renameCampaign(current.id, name);
    closeCampaignMenu();
    if (res && res.ok) {
      current.name = res.name || name;
      renderCampaignSwitcher();
    } else {
      window.alert((res && res.error) || 'Could not rename that campaign — try again in a moment.');
    }
  });
}

const campaignArchiveBtnEl = $('campaignArchiveBtn');
if (campaignArchiveBtnEl) {
  campaignArchiveBtnEl.addEventListener('click', async () => {
    const current = demo.campaigns.find((c) => c.id === currentCampaignId) || demo.campaigns[0];
    if (!current) return;
    const confirmed = window.confirm(
      `Archive "${current.name}"? Its agents stop running and it drops off your switcher — nothing is deleted, and you can start a new campaign any time.`
    );
    closeCampaignMenu();
    if (!confirmed) return;
    const res = await api.archiveCampaign(current.id);
    if (res && res.ok) {
      demo.campaigns = demo.campaigns.filter((c) => c.id !== current.id);
      currentCampaignId = demo.campaigns[0] ? demo.campaigns[0].id : null;
      await switchCampaign(currentCampaignId);
    } else {
      window.alert((res && res.error) || 'Could not archive that campaign — try again in a moment.');
    }
  });
}

function showView(view) {
  currentView = view;
  for (const v of ['chat', 'catalog', 'approvals', 'activity', 'spawn', 'connections', 'billing', 'refer', 'voice', 'settings']) {
    $('view-' + v).classList.toggle('hidden', v !== view);
  }
  $('sidebar').classList.remove('open');
  $('scrim').classList.add('hidden');
  renderCampaignSwitcher();
  renderNav();
  renderChips();
  if (view === 'catalog') renderCatalog();
  if (view === 'approvals') renderApprovals();
  if (view === 'activity') renderActivity();
  if (view === 'connections') renderConnections();
  if (view === 'billing') renderBilling();
  if (view === 'refer') { referTab = 'overview'; renderRefer(); renderReferTabs(); }
  if (view === 'settings') renderSettings();
}

function selectInstance(id) {
  currentInstance = demo.instances.find((i) => i.id === id) || demo.instances[0];
  showView('chat');
  renderChat();
  renderDetail();
  // Live: hydrate this instance's thread once per tab-session so the
  // conversation survives reloads (server keeps it in instance_events).
  if (!DEMO_MODE && currentInstance && !demo.chat[currentInstance.id]) {
    const instId = currentInstance.id;
    callPlatform('chat_history', { instance_id: instId }).then((res) => {
      if (res && res.ok) {
        demo.chat[instId] = res.messages;
        if (currentInstance && currentInstance.id === instId && currentView === 'chat') renderChat();
      }
    });
  }
}

document.querySelectorAll('.nav-item[data-view]').forEach((b) => {
  b.addEventListener('click', () => showView(b.dataset.view));
});
$('menuBtn').addEventListener('click', () => {
  $('sidebar').classList.add('open');
  $('scrim').classList.remove('hidden');
});
$('scrim').addEventListener('click', () => {
  $('sidebar').classList.remove('open');
  $('scrim').classList.add('hidden');
});
// FLEET-0069/S230: Settings is reachable from a gear item in the sidebar
// Workspace list (wired by the generic data-view handler above) AND from
// clicking either the topbar avatar or the sidebar seat chip.
$('topbarAvatar').addEventListener('click', () => showView('settings'));
$('topbarAvatar').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView('settings'); } });
$('seatChip').addEventListener('click', () => showView('settings'));
$('seatChip').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView('settings'); } });

$('fullscreenBtn').addEventListener('click', () => {
  // In the packaged extension this calls chrome.tabs.create({url: 'index.html'})
  // via the background worker; in the hosted app it's already full screen.
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ type: 'open_full_screen' });
  } else if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen().catch(() => {});
  }
});

// ---------- chat ----------

function appendMsg(role, html, metaText) {
  const thread = $('thread');
  if (role === 'user') {
    const d = document.createElement('div');
    d.className = 'msg msg-user';
    d.textContent = html;
    thread.appendChild(d);
  } else {
    const d = document.createElement('div');
    d.className = 'msg msg-agent';
    d.innerHTML = `<div class="msg-agent-tag">${escapeHtml(currentInstance.name)}</div><div class="msg-body">${html}</div>`;
    thread.appendChild(d);
    if (metaText) {
      const m = document.createElement('div');
      m.className = 'msg-meta';
      m.innerHTML = `&#8635; ${escapeHtml(metaText)}`;
      thread.appendChild(m);
    }
  }
  thread.scrollTop = thread.scrollHeight;
  return thread.lastElementChild;
}

function greetingLine() {
  const h = new Date().getHours();
  const part = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  const first = demo.seat.display_name.split(' ')[0];
  const n = demo.approvals.length;
  const work = n > 0
    ? `${n} approval${n === 1 ? '' : 's'} waiting on you`
    : 'nothing waiting on you';
  const health = demo.paused ? 'agents are paused' : 'all agents healthy';
  return { head: `${part}, ${first}.`, sub: `${work} · ${health}.` };
}

// S225/FLEET-0057: the sweep affordance only makes sense for the Triage
// Agent (catalog_id 'inbox_triage' — real server value in live mode, and
// the same id in the TecHive demo dataset, so this check works unchanged
// in both modes).
function isTriageInstance(inst) {
  return Boolean(inst) && inst.catalog_id === 'inbox_triage';
}

// S232/FLEET-0072: the "Draft today's content" affordance only makes sense
// for the Content Agent (catalog_id 'content_engine' — real server value in
// live mode, same id in the TecHive demo dataset, so this check works
// unchanged in both modes; mirrors isTriageInstance above).
function isContentInstance(inst) {
  return Boolean(inst) && inst.catalog_id === 'content_engine';
}

function renderChat() {
  if (!currentInstance) return; // live account, no agents spawned yet
  $('chatAgentName').textContent = currentInstance.name;
  $('chatAgentSub').textContent = currentInstance.mission;
  $('tierChip').textContent = tierLabel(currentInstance);
  const sweepBtn = $('sweepBtn');
  if (sweepBtn) sweepBtn.classList.toggle('hidden', !isTriageInstance(currentInstance));
  const contentBtn = $('contentBtn');
  if (contentBtn) contentBtn.classList.toggle('hidden', !isContentInstance(currentInstance));
  $('thread').innerHTML = '';
  // Canvas greeting (Chris ruling S219: personalize the work, not the chrome —
  // the name lives in the first thing the agent says, not next to the brand).
  const g = greetingLine();
  const gEl = document.createElement('div');
  gEl.className = 'greeting';
  gEl.innerHTML = `${escapeHtml(g.head)}<div class="greeting-sub">${escapeHtml(g.sub)}</div>`;
  $('thread').appendChild(gEl);
  for (const m of (demo.chat[currentInstance.id] || [])) {
    appendMsg(m.role, m.role === 'user' ? m.text : mdToHtml(m.text), m.meta);
  }
}

function tierLabel(inst) {
  const autos = inst.actions.filter((a) => a.state === 'auto').length;
  if (autos === inst.actions.length) return 'Full auto';
  if (inst.actions.some((a) => a.state === 'auto' && ['send', 'schedule'].includes(a.key))) return 'Tunable';
  return 'Approve-first';
}

async function sendMessage() {
  if (!currentInstance) return;
  const input = $('composerInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  appendMsg('user', text);
  (demo.chat[currentInstance.id] = demo.chat[currentInstance.id] || []).push({ role: 'user', text });

  const typing = appendMsg('agent', '<div class="typing"><span></span><span></span><span></span></div>');
  const res = await api.chat(currentInstance.id, text);
  typing.querySelector('.msg-body').innerHTML = res.ok ? mdToHtml(res.output) : mdToHtml('**Hmm.** ' + (res.error || 'Something went wrong — try again.'));
  demo.chat[currentInstance.id].push({ role: 'agent', text: res.ok ? res.output : res.error });
  $('thread').scrollTop = $('thread').scrollHeight;
}

$('sendBtn').addEventListener('click', sendMessage);
$('composerInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
$('composerInput').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 140) + 'px';
});
$('customizeBtn').addEventListener('click', () => {
  $('composerInput').value = 'I want to change how you handle ';
  $('composerInput').focus();
});

// ---------- morning sweep (S225/FLEET-0057) ----------
// "Run my morning sweep" reads like a chat turn (same appendMsg/typing
// pattern as sendMessage) but calls run_triage instead of chat, then
// resyncs approvals/activity/recent-runs since a sweep can queue drafts
// and write a run record server-side. Degrades gracefully: until
// techive-platform is redeployed with run_triage, the server's isTask()
// gate rejects it as an unknown task — shown here as a calm "isn't live
// yet" note, never a raw error or a splash (S225 honesty rule, same
// posture as the connector rail's pre-deploy fallback).
async function runTriageSweep() {
  if (!currentInstance) return;
  const btn = $('sweepBtn');
  if (btn) btn.disabled = true;
  appendMsg('user', 'Run my morning sweep');
  (demo.chat[currentInstance.id] = demo.chat[currentInstance.id] || []).push({ role: 'user', text: 'Run my morning sweep' });

  const typing = appendMsg('agent', '<div class="typing"><span></span><span></span><span></span></div>');
  const res = await api.runTriage(currentInstance.id);
  let displayText;
  if (res && res.ok) {
    displayText = res.output;
  } else if (res && typeof res.error === 'string' && /unknown task/i.test(res.error)) {
    displayText = "**Morning sweep isn't live yet** — check back soon.";
  } else {
    displayText = '**Hmm.** ' + ((res && res.error) || 'Something went wrong — try again.');
  }
  typing.querySelector('.msg-body').innerHTML = mdToHtml(displayText);
  demo.chat[currentInstance.id].push({ role: 'agent', text: displayText });
  $('thread').scrollTop = $('thread').scrollHeight;
  if (btn) btn.disabled = false;

  if (res && res.ok && !DEMO_MODE) {
    // Server truth resync — a sweep can queue approvals, write activity,
    // and add a loop_runs row for "Recent runs" (same pattern as
    // resolveApproval's post-action resync below).
    const [apprRes, actRes, instRes] = await Promise.all([
      callPlatform('list_approvals', {}),
      callPlatform('list_activity', {}),
      callPlatform('list_instances', {}),
    ]);
    if (apprRes && apprRes.ok) { demo.approvals = apprRes.approvals; renderNav(); if (currentView === 'approvals') renderApprovals(); }
    if (actRes && actRes.ok) { demo.activity = actRes.activity; if (currentView === 'activity') renderActivity(); }
    if (instRes && instRes.ok && instRes.instances.length) {
      const keepId = currentInstance && currentInstance.id;
      demo.instances = instRes.instances;
      currentInstance = demo.instances.find((i) => i.id === keepId) || demo.instances[0];
      renderDetail();
    }
  }
}
$('sweepBtn') && $('sweepBtn').addEventListener('click', runTriageSweep);

// ---------- content draft run (S232/FLEET-0072) ----------
// "Draft today's content" reads like a chat turn (same appendMsg/typing
// pattern as sendMessage/runTriageSweep above) but calls run_content
// instead, then resyncs approvals/activity/recent-runs since a run can
// queue drafts and write a run record server-side. v1: no topic UI — the
// button always runs topicless; a member can type a topic to the agent in
// chat instead. Degrades gracefully: until techive-platform is redeployed
// with run_content, the server's isTask() gate rejects it as an unknown
// task — shown here as the same calm "isn't live yet" note as the sweep
// button (S225 honesty rule, same posture as the connector rail's
// pre-deploy fallback).
async function runContentDraft() {
  if (!currentInstance) return;
  const btn = $('contentBtn');
  if (btn) btn.disabled = true;
  appendMsg('user', "Draft today's content");
  (demo.chat[currentInstance.id] = demo.chat[currentInstance.id] || []).push({ role: 'user', text: "Draft today's content" });

  const typing = appendMsg('agent', '<div class="typing"><span></span><span></span><span></span></div>');
  const res = await api.runContent(currentInstance.id);
  let displayText;
  if (res && res.ok) {
    displayText = res.output;
  } else if (res && typeof res.error === 'string' && /unknown task/i.test(res.error)) {
    displayText = "**Today's content run isn't live yet** — check back soon.";
  } else {
    displayText = '**Hmm.** ' + ((res && res.error) || 'Something went wrong — try again.');
  }
  typing.querySelector('.msg-body').innerHTML = mdToHtml(displayText);
  demo.chat[currentInstance.id].push({ role: 'agent', text: displayText });
  $('thread').scrollTop = $('thread').scrollHeight;
  if (btn) btn.disabled = false;

  if (res && res.ok) {
    if (DEMO_MODE) {
      // api.runContent already pushed the local sample drafts into
      // demo.approvals directly (packet: local-only sample, no server
      // call) — just re-render off the already-updated demo state.
      renderNav();
      if (currentView === 'approvals') renderApprovals();
    } else {
      // Server truth resync — a run can queue approvals, write activity,
      // and add a loop_runs row for "Recent runs" (same pattern as
      // runTriageSweep's resync above).
      const [apprRes, actRes, instRes] = await Promise.all([
        callPlatform('list_approvals', {}),
        callPlatform('list_activity', {}),
        callPlatform('list_instances', {}),
      ]);
      if (apprRes && apprRes.ok) { demo.approvals = apprRes.approvals; renderNav(); if (currentView === 'approvals') renderApprovals(); }
      if (actRes && actRes.ok) { demo.activity = actRes.activity; if (currentView === 'activity') renderActivity(); }
      if (instRes && instRes.ok && instRes.instances.length) {
        const keepId = currentInstance && currentInstance.id;
        demo.instances = instRes.instances;
        currentInstance = demo.instances.find((i) => i.id === keepId) || demo.instances[0];
        renderDetail();
      }
    }
  }
}
$('contentBtn') && $('contentBtn').addEventListener('click', runContentDraft);

// ---------- catalog ----------

function renderCatalog() {
  const grid = $('catalogGrid');
  grid.innerHTML = '';
  for (const c of demo.catalog) {
    const card = document.createElement('div');
    card.className = 'cat-card' + (c.owned ? ' owned' : '');
    card.innerHTML = `
      <div class="cat-top">
        <span class="cat-dept">${escapeHtml(c.dept)}</span>
        ${c.owned ? '' : '<span class="cat-lock">&#128274;</span><span class="cat-unlock-tag">&#128275; Unlocks</span>'}
      </div>
      <div class="cat-name">${escapeHtml(c.name)}</div>
      <div class="cat-pitch">${escapeHtml(c.pitch)}</div>
      <div class="cat-foot">
        ${c.owned ? '<span class="cat-owned-tag">&#10003; Yours</span>' : `<span class="cat-price">${escapeHtml(c.price)}</span>`}
        ${c.owned
          ? `<button class="mini-btn line" data-open="${c.id}">Open</button>`
          : `<button class="mini-btn fire" data-unlock="${c.id}">Unlock</button>`}
      </div>`;
    grid.appendChild(card);
  }
  grid.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    const inst = demo.instances.find((i) => i.catalog_id === b.dataset.open);
    if (inst) selectInstance(inst.id);
    else startSpawn(b.dataset.open);
  }));
  grid.querySelectorAll('[data-unlock]').forEach((b) => b.addEventListener('click', () => {
    // Real flow: Stripe checkout via the seat-billing rail → seat_agent_grants
    // row → server unlocks. Demo just shows the spawn wizard.
    startSpawn(b.dataset.unlock);
  }));
  // Keep the upgrade preview alive across re-renders (sticky click state).
  if (typeof unlockPreviewSticky !== 'undefined' && unlockPreviewSticky) applyUnlockPreview(true);
}

// ---------- spawn wizard ----------

function startSpawn(catalogId) {
  spawnTarget = demo.catalog.find((c) => c.id === catalogId);
  $('spawnTitle').textContent = 'Set up your ' + spawnTarget.name;
  $('spawnGoal').value = '';
  $('spawnResult').classList.add('hidden');
  $('spawnBuildBtn').disabled = false;
  showView('spawn');
  $('spawnGoal').focus();
}

$('spawnBuildBtn').addEventListener('click', async () => {
  const goal = $('spawnGoal').value.trim();
  if (!goal) { $('spawnGoal').focus(); return; }
  const btn = $('spawnBuildBtn');
  btn.disabled = true;
  btn.textContent = 'Building…';
  const res = await api.spawn(spawnTarget.id, goal);
  btn.textContent = 'Build my agent';
  btn.disabled = false;
  if (!res.ok) return;
  const ul = $('spawnPlan');
  ul.innerHTML = '';
  for (const step of res.plan) {
    const li = document.createElement('li');
    li.textContent = step;
    ul.appendChild(li);
  }
  $('spawnResult').classList.remove('hidden');
  $('spawnResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

$('spawnConfirmBtn').addEventListener('click', async () => {
  if (!DEMO_MODE) {
    // Live: spawn_agent already created the instance server-side at "Build
    // my agent" (the compiler ran before anything was stored). Confirm =
    // re-list and open the newest instance of this agent.
    const res = await callPlatform('list_instances', {});
    if (res && res.ok) {
      demo.instances = res.instances;
      const mine = demo.instances.filter((i) => i.catalog_id === spawnTarget.id);
      const inst = mine[mine.length - 1];
      renderNav();
      renderChips();
      if (inst) selectInstance(inst.id);
      else showView('catalog');
    }
    return;
  }
  const inst = {
    id: 'inst-' + spawnTarget.id,
    catalog_id: spawnTarget.id,
    name: spawnTarget.name,
    dept: spawnTarget.dept,
    tier: 1,
    mission: $('spawnGoal').value.trim(),
    actions: [
      { key: 'prepare', name: 'Prepare & draft', state: 'auto' },
      { key: 'file', name: 'File & organize', state: 'auto' },
      { key: 'send', name: 'Send / act outward', state: 'ask' },
    ],
    streak: { action: 'Send / act outward', count: 0, threshold: 20 },
    runs: [],
  };
  demo.instances.push(inst);
  demo.catalog.find((c) => c.id === spawnTarget.id).owned = true;
  demo.chat[inst.id] = [{ role: 'agent', text: 'I\'m on it. First run is queued — you\'ll see everything I prepare in **Approvals** before it goes anywhere. Correct me any time, in plain words, right here.' }];
  selectInstance(inst.id);
});

$('spawnReviseBtn').addEventListener('click', () => {
  $('spawnResult').classList.add('hidden');
  $('spawnGoal').focus();
});
$('spawnCancelBtn').addEventListener('click', () => showView('catalog'));

// ---------- approvals ----------

function renderApprovals() {
  const list = $('approvalList');
  list.innerHTML = '';
  if (demo.approvals.length === 0) {
    list.innerHTML = '<div class="empty-note">Nothing waiting on you. Your agents will queue anything outbound here.</div>';
    return;
  }
  for (const a of demo.approvals) {
    const card = document.createElement('div');
    card.className = 'appr-card';
    card.innerHTML = `
      <div class="appr-head">
        <span class="appr-agent">${escapeHtml(a.agent)}</span>
        <span class="appr-time">${escapeHtml(a.time)}</span>
      </div>
      <div class="appr-title">${escapeHtml(a.title)}</div>
      <div class="appr-preview">${escapeHtml(a.preview)}</div>
      <div class="appr-actions">
        <button class="mini-btn fire" data-approve="${a.id}">Approve &amp; send</button>
        <button class="mini-btn line" data-edit="${a.id}">Edit first</button>
        <button class="mini-btn line" data-reject="${a.id}">Reject</button>
      </div>
      <div class="appr-claim">First approver wins — the moment a teammate acts on this, it locks for everyone else.</div>`;
    list.appendChild(card);
  }
  list.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => resolveApproval(b.dataset.approve, 'approved')));
  list.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => resolveApproval(b.dataset.reject, 'rejected')));
  list.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => {
    const a = demo.approvals.find((x) => x.id === b.dataset.edit);
    selectInstance('inst-triage');
    $('composerInput').value = 'Edit the draft to ' + (a ? a.title.toLowerCase() : '') + ': ';
    $('composerInput').focus();
  }));
}

async function resolveApproval(id, verdict) {
  await api.approve(id, verdict);
  const a = demo.approvals.find((x) => x.id === id);
  demo.approvals = demo.approvals.filter((x) => x.id !== id);
  if (a) {
    // Attribution: who acted, on the record (approval coordination doctrine).
    const first = demo.seat.display_name.split(' ')[0];
    demo.activity.unshift({
      time: 'Just now',
      body: `<b>${escapeHtml(first)}</b> ${verdict} <b>${escapeHtml(a.title)}</b> — locked for teammates`,
    });
    // Graduation math: an unedited approve advances the streak (server-side
    // truth in the real build; mirrored here for the demo).
    const inst = demo.instances.find((i) => i.name === a.agent);
    if (inst && inst.streak && verdict === 'approved') {
      inst.streak.count += 1;
      if (inst.streak.count >= inst.streak.threshold) maybeOfferGraduation(inst);
    }
  }
  renderApprovals();
  renderNav();
  renderDetail();
  // Live: the server's activity feed and streak math are the truth —
  // resync in the background after the local optimistic update.
  if (!DEMO_MODE) {
    callPlatform('list_activity', {}).then((r) => {
      if (r && r.ok) {
        demo.activity = r.activity;
        if (currentView === 'activity') renderActivity();
      }
    });
    callPlatform('list_instances', {}).then((r) => {
      if (r && r.ok && r.instances.length) {
        const keepId = currentInstance && currentInstance.id;
        demo.instances = r.instances;
        currentInstance = demo.instances.find((i) => i.id === keepId) || demo.instances[0];
        renderDetail();
      }
    });
  }
}

function maybeOfferGraduation(inst) {
  (demo.chat[inst.id] = demo.chat[inst.id] || []).push({
    role: 'agent',
    text: `I've gotten **${inst.streak.action}** right ${inst.streak.count} times running with no edits. Want me to start doing that myself? You can take it back any time with one tap.`,
  });
  if (currentInstance.id === inst.id && currentView === 'chat') renderChat();
}

// ---------- activity ----------

function renderActivity() {
  const list = $('activityList');
  list.innerHTML = '';
  for (const a of demo.activity) {
    const row = document.createElement('div');
    row.className = 'act-row';
    row.innerHTML = `<div class="act-time">${escapeHtml(a.time)}</div><div class="act-body">${a.body}</div>`;
    list.appendChild(row);
  }
}

// ---------- detail rail ----------

function renderDetail() {
  const inst = currentInstance;
  if (!inst) return; // live account, no agents spawned yet
  $('detailAgentName').textContent = inst.name;
  $('detailAgentDept').textContent = inst.dept;
  $('detailMission').textContent = inst.mission;

  const ladder = $('ladder');
  ladder.innerHTML = '';
  for (const a of inst.actions) {
    const row = document.createElement('div');
    row.className = 'ladder-action';
    row.innerHTML = `
      <div class="ladder-row">
        <span class="ladder-name">${escapeHtml(a.name)}</span>
        <button class="ladder-state ${a.state}" data-key="${a.key}">
          ${a.state === 'auto' ? '&#10003; auto' : '&#9995; ask me first'}
        </button>
      </div>`;
    ladder.appendChild(row);
  }
  ladder.querySelectorAll('.ladder-state').forEach((b) => b.addEventListener('click', async () => {
    const a = inst.actions.find((x) => x.key === b.dataset.key);
    a.state = a.state === 'auto' ? 'ask' : 'auto';
    await api.setAutonomy(inst.id, a.key, a.state);
    renderDetail();
    $('tierChip').textContent = tierLabel(inst);
  }));

  const grad = $('graduationSection');
  if (inst.streak) {
    grad.classList.remove('hidden');
    const pct = Math.min(100, Math.round((inst.streak.count / inst.streak.threshold) * 100));
    $('graduationBody').innerHTML = `
      <div>"${escapeHtml(inst.streak.action)}" — approved unchanged <b>${inst.streak.count}</b> times running.</div>
      <div class="grad-bar"><div class="grad-fill" style="width:${pct}%"></div></div>
      <div class="grad-count">${inst.streak.count} of ${inst.streak.threshold} — at ${inst.streak.threshold} it'll ask if you'd like it on auto.</div>`;
  } else {
    grad.classList.add('hidden');
  }

  const runs = $('recentRuns');
  runs.innerHTML = inst.runs.length ? '' : '<div class="run-row"><div class="run-what">No runs yet — first one is queued.</div></div>';
  for (const r of inst.runs) {
    const row = document.createElement('div');
    row.className = 'run-row';
    row.innerHTML = `<div class="run-when">${escapeHtml(r.when)}</div><div class="run-what">${escapeHtml(r.what)}</div>`;
    runs.appendChild(row);
  }
}

// ---------- usage meter (Anthropic-style: 5-hour session + weekly) ----------

async function renderUsage() {
  // One meter style platform-wide (Chris ruling S219): ember fill, same bar
  // as the graduation streak — no threshold recoloring. Data comes from
  // api.getUsage (server-computed vs plan_config); never computed client-side.
  const res = await api.getUsage();
  if (!res.ok) return;
  const u = res.usage;
  $('sessPct').textContent = u.session.pct + '%';
  $('sessFill').style.width = u.session.pct + '%';
  $('sessReset').textContent = 'Resets in ' + u.session.resets_in;
  $('weekPct').textContent = u.week.pct + '%';
  $('weekFill').style.width = u.week.pct + '%';
  $('weekReset').textContent = 'Resets ' + u.week.resets_at;
  $('usagePlanTag').textContent = demo.seat.plan.split(' · ')[0];
}

// ---------- pricing band (two tiers + annual prepay) ----------

const PRICES = {
  monthly: { starter: '$99', full: '$299', per: '/mo' },
  annual:  { starter: '$990', full: '$2,990', per: '/yr' },
};
let billing = 'monthly';

function renderPricing() {
  const p = PRICES[billing];
  $('starterPrice').textContent = p.starter;
  $('fullPrice').textContent = p.full;
  $('starterPer').textContent = p.per;
  $('fullPer').textContent = p.per;
  $('billMonthly').classList.toggle('active', billing === 'monthly');
  $('billAnnual').classList.toggle('active', billing === 'annual');
}

$('billMonthly').addEventListener('click', () => { billing = 'monthly'; renderPricing(); });
$('billAnnual').addEventListener('click', () => { billing = 'annual'; renderPricing(); });

// ---- upgrade preview: the Full Workforce card lights up the locked pads ----

let unlockPreviewSticky = false;

function applyUnlockPreview(on) {
  document.querySelectorAll('.cat-card:not(.owned)').forEach((card) => {
    card.classList.toggle('would-unlock', on);
  });
  document.querySelector('.price-card.featured').classList.toggle('selected', on);
}

(function wireUnlockPreview() {
  const featured = document.querySelector('.price-card.featured');
  featured.addEventListener('mouseenter', () => applyUnlockPreview(true));
  featured.addEventListener('mouseleave', () => { if (!unlockPreviewSticky) applyUnlockPreview(false); });
  featured.addEventListener('click', (e) => {
    if (e.target.id === 'upgradeBtn') return; // the buy button is its own action
    unlockPreviewSticky = !unlockPreviewSticky;
    applyUnlockPreview(unlockPreviewSticky);
  });
})();

$('upgradeBtn').addEventListener('click', () => {
  // Real flow: Stripe checkout (seat-billing rail) → seat_agent_grants for
  // every catalog agent → server re-lists. Demo: flip the whole store open.
  demo.seat.plan = 'Full Workforce · ' + PRICES[billing].full + PRICES[billing].per + ' founding rate';
  demo.catalog.forEach((c) => { c.owned = true; });
  $('seatPlan').textContent = demo.seat.plan;
  renderUsage();
  renderCatalog();
  document.querySelector('.price-card.featured .price-cta-row').innerHTML =
    '<span class="price-current-tag">&#10003; Your plan</span>';
  document.querySelector('.price-card.current .price-cta-row').innerHTML = '';
});

// ---------- connections ----------

function connStatusHtml(c) {
  if (c.state === 'connected') return '<div class="conn-status on">&#10003; Connected</div>';
  if (c.state === 'soon') return '<div class="conn-status soon">In the works</div>';
  return '<div class="conn-status off">Not connected</div>';
}

function connButtonHtml(c) {
  if (c.state === 'connected') return `<button class="mini-btn line" data-conn="${c.id}">Disconnect</button>`;
  if (c.state === 'soon') return `<button class="mini-btn line" data-vote="${c.id}">Tell me when it's live</button>`;
  return `<button class="mini-btn fire" data-conn="${c.id}">Connect</button>`;
}

const CONN_CAT_ORDER = ['Inbox & comms', 'Money', 'Customers & reviews', 'Schedule', 'Store & site', 'Docs & files', 'Networks'];

// S225 Chris ruling: the shelf leads with what's REAL — your connected
// hookups first, then what's one click from connecting, then the roadmap.
const CONN_STATE_RANK = { connected: 0, available: 1, soon: 2 };
const CONN_BAND_LABELS = ['Connected', 'Ready to connect', 'In the works'];

function renderConnections() {
  const grid = $('connGrid');
  const q = ($('connSearch').value || '').trim().toLowerCase();
  const rank = (c) => (CONN_STATE_RANK[c.state] !== undefined ? CONN_STATE_RANK[c.state] : 2);
  const list = demo.connections
    .filter((c) =>
      !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q))
    .sort((a, b) =>
      (rank(a) - rank(b)) ||
      (CONN_CAT_ORDER.indexOf(a.cat) - CONN_CAT_ORDER.indexOf(b.cat)));
  grid.innerHTML = '';
  let lastBand = null;
  for (const c of list) {
    const band = CONN_BAND_LABELS[rank(c)];
    if (band !== lastBand) {
      lastBand = band;
      const label = document.createElement('div');
      label.className = 'conn-cat-label';
      label.textContent = band;
      grid.appendChild(label);
    }
    const card = document.createElement('div');
    card.className = 'conn-card';
    card.innerHTML = `
      ${c.img ? `<img class="conn-img" src="${c.img}" alt="${escapeHtml(c.name)} logo" />` : `<span class="conn-ico">${c.ico}</span>`}
      <div class="conn-name">${escapeHtml(c.name)}</div>
      <div class="conn-desc">${escapeHtml(c.desc)}</div>
      ${connStatusHtml(c)}
      ${connButtonHtml(c)}`;
    grid.appendChild(card);
  }
  // Request-a-connector: because the shelf is MCP-backed, fulfilling a request
  // is usually a registry entry + doctrine, not an integration build.
  const req = document.createElement('div');
  req.className = 'conn-card request';
  req.innerHTML = `
    <span class="conn-ico">&#10133;</span>
    <div class="conn-name">Don't see yours?</div>
    <div class="conn-desc">Tell us what your business runs on — most requests go live fast.</div>
    <button class="mini-btn line" id="connRequestBtn">Request a connector</button>`;
  grid.appendChild(req);

  grid.querySelectorAll('[data-conn]').forEach((b) => b.addEventListener('click', async () => {
    const id = b.dataset.conn;
    const c = demo.connections.find((x) => x.id === id);
    if (!c) return;

    if (DEMO_MODE) {
      c.state = c.state === 'connected' ? 'available' : 'connected';
      renderConnections();
      return;
    }

    // LIVE flow (S225/FLEET-0056): real provider OAuth on the provider's
    // own consent page -> revocable, server-side token. connect_start only
    // returns a real URL when the connector is actually wired AND
    // configured server-side; anything else (not yet built, secrets not
    // pasted, or the task itself not deployed yet) fails cleanly and this
    // falls back to the same honest "Coming online soon" text as before —
    // never a fake "Connected", never an error splash (S225 honesty rule).
    b.disabled = true;
    const original = b.textContent;
    if (c.state === 'connected') {
      b.textContent = 'Disconnecting…';
      const res = await api.disconnectConnector(id);
      if (res && res.ok) {
        c.state = 'available';
        renderConnections();
      } else {
        b.textContent = original;
        b.disabled = false;
      }
      return;
    }
    b.textContent = 'Connecting…';
    const res = await api.connectStart(id);
    if (res && res.ok && res.url) {
      location.href = res.url; // same-tab redirect to the provider's own consent page
      return;
    }
    b.textContent = "Coming online soon — we'll email you";
    // stays disabled — same fallback the button always had for a
    // not-yet-live connector, now driven by the server's real answer
    // instead of an unconditional client-side stub.
  }));
  grid.querySelectorAll('[data-vote]').forEach((b) => b.addEventListener('click', () => {
    b.textContent = "We'll email you at launch";
    b.disabled = true;
  }));
  const reqBtn = document.getElementById('connRequestBtn');
  reqBtn.addEventListener('click', async () => {
    if (DEMO_MODE) {
      reqBtn.textContent = 'Request logged';
      reqBtn.disabled = true;
      return;
    }
    const text = ((typeof window.prompt === 'function' && window.prompt('What should we add? Tell us what your business runs on.')) || '').trim();
    if (!text) return;
    const original = reqBtn.textContent;
    reqBtn.disabled = true;
    const res = await api.requestConnector(text);
    if (res && res.ok) {
      reqBtn.textContent = 'Request logged';
    } else {
      // Graceful degrade (task not deployed yet, or a transient error) —
      // never an error splash, just let them try again.
      reqBtn.textContent = original;
      reqBtn.disabled = false;
    }
  });
}

$('connSearch').addEventListener('input', () => { if (currentView === 'connections') renderConnections(); });

// ---------- billing ----------

function renderBilling() {
  const planName = demo.seat.plan.split(' · ')[0];
  $('planCard').innerHTML = `
    <div class="bill-card-title">Your plan</div>
    <div class="plan-line"><span>Plan</span><b>${escapeHtml(planName)}</b></div>
    <div class="plan-line"><span>Rate</span><b>${escapeHtml(demo.seat.plan.split(' · ')[1] || '')}</b></div>
    <div class="plan-line"><span>Renews</span><b>${DEMO_MODE ? 'Aug 1, 2026' : 'Monthly · managed in Stripe'}</b></div>
    <div class="plan-line"><span>Usage this week</span><b>${demo.usage.week.pct}% of tank</b></div>${
    // TecHive: one plan, Duplicator Pro — there is no Full Workforce to
    // upgrade to (S232), so the upgrade CTA is KitFire-skin only.
    window.KF_BRAND && window.KF_BRAND.key === 'techive'
      ? ''
      : '<button class="btn-primary" id="billingUpgradeBtn" style="margin-top:10px">See Full Workforce</button>'}`;
  const upBtn = $('billingUpgradeBtn');
  if (upBtn) upBtn.addEventListener('click', () => showView('catalog'));

  // TecHive: one seat, no adds (S232) — KitFire keeps Starter 2 / FW 3.
  const seatsIncluded = window.KF_BRAND && window.KF_BRAND.key === 'techive'
    ? 1
    : (demo.seat.plan.startsWith('Full') ? 3 : 2);
  $('seatCount').textContent = `${demo.teamSeats.length} of ${seatsIncluded} included`;
  const list = $('seatList');
  list.innerHTML = '';
  for (const s of demo.teamSeats) {
    const row = document.createElement('div');
    row.className = 'seat-row';
    row.innerHTML = `
      <span class="seat-mini-avatar">${escapeHtml(s.name.charAt(0))}</span>
      <span>${escapeHtml(s.name)}</span>
      <span class="seat-role-tag">${escapeHtml(s.role)}</span>`;
    list.appendChild(row);
  }

  const inv = $('invoiceList');
  inv.innerHTML = '';
  if (demo.invoices.length === 0) {
    inv.innerHTML = '<div class="bill-hint">Your invoices are in the Stripe portal — open "Manage billing" below.</div>';
  }
  for (const i of demo.invoices) {
    const row = document.createElement('div');
    row.className = 'inv-row';
    row.innerHTML = `<span>${escapeHtml(i.date)}</span><span>${escapeHtml(i.amount)}</span><b>${escapeHtml(i.status)}</b>`;
    inv.appendChild(row);
  }
}

$('addSeatBtn') && $('addSeatBtn').addEventListener('click', () => {
  // Real flow: Stripe subscription quantity +1 via the portal (0052 lane).
  demo.teamSeats.push({ name: 'New seat', role: 'member' });
  renderBilling();
});
$('portalBtn') && $('portalBtn').addEventListener('click', () => {
  // Real flow: kitfire-platform mints a Stripe customer-portal session URL.
  $('portalBtn').textContent = 'Opens Stripe portal (live build)';
  setTimeout(() => { $('portalBtn').textContent = 'Manage billing'; }, 1600);
});

// ---------- refer & earn ----------

function renderRefer() {
  $('referLink').textContent = demo.referral.link;
  $('referEarnings').textContent = '$' + demo.referral.earnings;
  $('referTally').textContent = `${demo.referral.count} referrals so far · payouts land after their payment clears`;
  // TecHive skin: the member's own MarketHive referral link (S221). Demo
  // persists to localStorage; the real platform saves it to
  // affiliate_profiles.markethive_link via a platform task, and referred
  // signups see their SPONSOR's link on the MarketHive CTA so MH's own
  // airdrop program credits the right member. TecHive never touches the
  // airdrop itself — it's MarketHive's program on MarketHive's platform.
  const mhInput = $('mhLinkInput');
  if (mhInput) {
    mhInput.value = DEMO_MODE
      ? (localStorage.getItem('techive_mh_link') || '')
      : (demo.referral.markethive_link || '');
  }
}

// S221 redesign: refer & earn sub-views (contextual sidebar picks the
// tab) + the org chart drawn as a TREE — root = the member, branches
// three levels down, compression visible (inactive = dashed, grayed,
// "position held").
function renderReferTabs() {
  for (const t of ['overview', 'organization', 'markethive']) {
    const el = $('refer-' + t);
    if (el) el.classList.toggle('hidden', t !== referTab);
  }
  document.querySelectorAll('[data-refertab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.refertab === referTab);
  });
  if (referTab === 'organization') renderOrgPanel();
}

document.querySelectorAll('[data-refertab]').forEach((b) => {
  b.addEventListener('click', () => { referTab = b.dataset.refertab; renderReferTabs(); });
});
$('referBackBtn') && $('referBackBtn').addEventListener('click', () => selectInstance(currentInstance.id));

// S221 organization panel — TWO displays, toggled (Chris's reference
// image, family-tree style): 'chart' = avatar tree (person icons, names
// in small caps beneath, soft connectors, gold starburst seal on members
// who sponsored someone this month, money on hover only) · 'sheet' =
// the spreadsheet with per-level subtotals and the tallying total.
function renderOrgPanel() {
  const chart = orgMode === 'chart';
  const canvas = $('orgCanvas');
  const table = $('orgTable');
  if (canvas) canvas.classList.toggle('hidden', !chart);
  if (table) table.classList.toggle('hidden', chart);
  document.querySelectorAll('.org-mode').forEach((b) => {
    b.classList.toggle('active', b.dataset.orgmode === orgMode);
  });
  if (chart) renderOrgChartCanvas();
  else renderOrgTable();
}

document.querySelectorAll('.org-mode').forEach((b) => {
  b.addEventListener('click', () => { orgMode = b.dataset.orgmode; renderOrgPanel(); });
});

// Stylized person avatar (reference-image look): hair + face + shirt,
// two alternating colorways. Pure inline SVG — no assets, no requests.
function orgAvatarSvg(i) {
  const shirt = i % 2 === 0 ? '#5fc0ba' : '#8d8a84';
  const hair = i % 2 === 0 ? '#e0793d' : '#6b5340';
  // width/height attributes are deliberate: the avatar can NEVER render
  // oversized even if the stylesheet is stale-cached (S221 live lesson —
  // unsized inline SVG defaults to huge).
  return `<svg viewBox="0 0 40 40" width="46" height="46" aria-hidden="true">` +
    `<circle cx="20" cy="12.5" r="7.5" fill="${hair}"/>` +
    `<circle cx="20" cy="15" r="6.2" fill="#eed3b0"/>` +
    `<path d="M7 38c0-8 6-12 13-12s13 4 13 12z" fill="${shirt}"/>` +
    `</svg>`;
}

// Gold starburst seal = the member holds MarketHive Entrepreneur One
// (S221 Chris ruling; production signal = affiliate_profiles.
// markethive_link on file). Active members render full color; inactive
// members gray out (position held).
function starburstSvg() {
  const spikes = 24, R = 31, r = 27, cx = 32, cy = 32;
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (Math.PI * i) / spikes;
    const rr = i % 2 === 0 ? R : r;
    pts.push((cx + rr * Math.cos(rad)).toFixed(1) + ',' + (cy + rr * Math.sin(rad)).toFixed(1));
  }
  return `<svg class="org-seal" viewBox="0 0 64 64" width="68" height="68" aria-hidden="true"><polygon points="${pts.join(' ')}" fill="#e9c46a"/></svg>`;
}

function buildOrgPerson(n, depth, counter) {
  const li = document.createElement('li');
  const wrap = document.createElement('div');
  wrap.className = 'org-person' + (n.status === 'inactive' ? ' inactive' : '');
  wrap.title = depth === 0 ? '' : (n.status === 'inactive' ? 'Position held — not earning' : `${n.month || ''} this month`);
  const av = document.createElement('span');
  av.className = 'org-avatar';
  av.innerHTML = (n.e1 ? starburstSvg() : '') + orgAvatarSvg(counter.i++);
  const label = document.createElement('span');
  label.className = 'org-name';
  label.textContent = n.name;
  wrap.appendChild(av);
  wrap.appendChild(label);
  li.appendChild(wrap);
  if (n.children && n.children.length && depth < 3) {
    const ul = document.createElement('ul');
    for (const c of n.children) ul.appendChild(buildOrgPerson(c, depth + 1, counter));
    li.appendChild(ul);
  }
  return li;
}

function renderOrgChartCanvas() {
  const el = $('orgCanvas');
  if (!el) return;
  const tree = demo.referral.tree;
  el.innerHTML = '';
  if (!tree) return;
  const root = document.createElement('ul');
  root.className = 'tree tree-people';
  root.appendChild(buildOrgPerson(tree, 0, { i: 0 }));
  el.appendChild(root);
}

// The 'sheet' display: Level | Name | Status | Joined | This month,
// grouped by level with subtotal rows and the tallying grand total.
function renderOrgTable() {
  const el = $('orgTable');
  if (!el) return;
  const org = demo.referral.organization;
  el.innerHTML = '';
  if (!org) return;
  const rows = [];
  rows.push(
    '<table class="org-sheet"><thead><tr>' +
    '<th>Level</th><th>Name</th><th>Status</th><th>Joined</th><th class="num">This month</th>' +
    '</tr></thead><tbody>'
  );
  for (const lvl of org) {
    if (lvl.members.length === 0) {
      rows.push(
        `<tr class="org-row-empty"><td>${lvl.level} · ${escapeHtml(lvl.rate)}</td>` +
        `<td colspan="3">${lvl.level === 3 ? 'Opens when your level-2 members sponsor their first person' : 'No members yet — share your link'}</td>` +
        `<td class="num">—</td></tr>`
      );
      continue;
    }
    lvl.members.forEach((m, i) => {
      const inactive = m.status === 'inactive';
      rows.push(
        `<tr class="${inactive ? 'org-row-inactive' : ''}">` +
        `<td>${i === 0 ? `${lvl.level} · ${escapeHtml(lvl.rate)}` : ''}</td>` +
        `<td>${escapeHtml(m.name)}</td>` +
        `<td>${inactive ? 'Position held' : 'Active'}</td>` +
        `<td>${escapeHtml(m.joined)}</td>` +
        `<td class="num">${inactive ? '—' : escapeHtml(m.month)}</td></tr>`
      );
    });
    rows.push(
      `<tr class="org-row-subtotal"><td></td>` +
      `<td colspan="3">Level ${lvl.level} subtotal · ${lvl.members.length} member${lvl.members.length === 1 ? '' : 's'}</td>` +
      `<td class="num">${escapeHtml(lvl.accrued)}</td></tr>`
    );
  }
  const count = org.reduce((n, l) => n + l.members.length, 0);
  rows.push(
    `<tr class="org-row-total"><td></td>` +
    `<td colspan="3">Total · ${count} members</td>` +
    `<td class="num">$${escapeHtml(String(demo.referral.earnings))}</td></tr>`
  );
  rows.push('</tbody></table>');
  el.innerHTML = rows.join('');
}

$('mhLinkSaveBtn') && $('mhLinkSaveBtn').addEventListener('click', async () => {
  const btn = $('mhLinkSaveBtn');
  const v = ($('mhLinkInput').value || '').trim();
  if (DEMO_MODE) {
    localStorage.setItem('techive_mh_link', v);
    btn.textContent = 'Saved';
    setTimeout(() => { btn.textContent = 'Save'; }, 1200);
    return;
  }
  btn.textContent = 'Saving…';
  const res = await callPlatform('save_mh_link', { mh_link: v });
  if (res && res.ok) {
    demo.referral.markethive_link = v;
    btn.textContent = 'Saved';
  } else {
    btn.textContent = (res && res.error) ? res.error : 'Try again';
  }
  setTimeout(() => { btn.textContent = 'Save'; }, 2600);
});

$('copyReferBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('https://' + demo.referral.link);
    $('copyReferBtn').textContent = 'Copied';
    setTimeout(() => { $('copyReferBtn').textContent = 'Copy'; }, 1200);
  } catch (e) { console.error('copy failed', e); }
});

// ---------- voice input (S225 — Chris directive: click and speak, every agent) ----------
// Browser-native Web Speech API. Click the mic, talk, and the words stream
// into the box (interim results live, like dictation); click again or go
// quiet to stop, then review and hit send. Recognition runs entirely in
// the member's browser — no audio ever reaches TecHive servers. Supported
// in Chrome/Edge/Safari; the button hides itself where the API is absent
// (e.g. Firefox), so nothing breaks. The chat composer is SHARED by every
// agent, so one mic there covers the whole roster; the spawn wizard gets
// its own so members can speak their agent's mission.
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

function attachMic(btnId, inputId) {
  const btn = $(btnId);
  const input = $(inputId);
  if (!btn || !input) return;
  if (!SpeechRec) { btn.style.display = 'none'; return; }
  let rec = null;
  let baseText = '';

  btn.addEventListener('click', () => {
    if (rec) { rec.stop(); return; } // second click = stop listening
    rec = new SpeechRec();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    baseText = input.value ? input.value.replace(/\s+$/, '') + ' ' : '';
    btn.classList.add('listening');
    btn.title = 'Stop listening';

    rec.onresult = (e) => {
      let finals = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finals += t + ' ';
        else interim += t;
      }
      input.value = baseText + finals + interim;
      // Fire the composer's autosize handler so the box grows with speech.
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        btn.title = 'Microphone blocked — allow mic access for this site in your browser settings';
      }
    };
    rec.onend = () => {
      rec = null;
      btn.classList.remove('listening');
      btn.title = 'Speak instead of typing';
      input.focus();
    };
    try {
      rec.start();
    } catch (err) {
      console.error('voice input failed to start', err);
      rec = null;
      btn.classList.remove('listening');
    }
  });
}

attachMic('micBtn', 'composerInput');
attachMic('spawnMicBtn', 'spawnGoal');
attachMic('voiceMicBtn', 'voiceSamples');

// ---------- teach it your voice (S225) ----------
// Live: samples go to the learn_voice task — one model pass distills a
// style-only profile, stored server-side and folded into every draft.
// Demo: explains what would happen, stores nothing.

$('voiceBtn') && $('voiceBtn').addEventListener('click', () => showView('voice'));
$('voiceCancelBtn') && $('voiceCancelBtn').addEventListener('click', () => {
  if (currentInstance) selectInstance(currentInstance.id); else showView('catalog');
});
$('voiceSaveBtn') && $('voiceSaveBtn').addEventListener('click', async () => {
  const btn = $('voiceSaveBtn');
  const out = $('voiceResult');
  const samples = ($('voiceSamples').value || '').trim();
  if (samples.length < 120) {
    out.classList.remove('hidden');
    out.textContent = 'Give it a bit more to study — paste at least a few full sentences you actually wrote.';
    return;
  }
  if (DEMO_MODE) {
    out.classList.remove('hidden');
    out.textContent = 'Demo mode — on a live account, your agents would study this and every draft from here on would sound like you.';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Studying your writing…';
  const res = await callPlatform('learn_voice', { content: samples });
  btn.disabled = false;
  btn.textContent = 'Save my voice';
  out.classList.remove('hidden');
  if (res && res.ok) {
    out.innerHTML = mdToHtml(res.output);
  } else {
    out.textContent = (res && res.error) || 'Something went wrong — try again in a moment.';
  }
});

// ---------- settings (FLEET-0069/S230) ----------
// "I can't change my password, can't look at it — we have no settings
// feature" (Chris, S230). Same degrade-gracefully posture as the connector
// rail and morning sweep above: this view's own tasks (get_settings,
// update_seat_name, rotate_access_code) may not be redeployed on
// techive-platform yet — every call here checks for that specific "unknown
// task" shape and shows a calm note instead of a raw error, same as
// runTriageSweep's fallback. DEMO_MODE never calls the server at all —
// actions are stubbed locally and the view carries a visible demo note.

function settingsTaskNotLive(res) {
  return Boolean(res) && typeof res.error === 'string' && /unknown task/i.test(res.error);
}

async function renderSettings() {
  // Prime the shell from what's already known locally (demo.seat is real
  // live data too once loadLiveState's get_usage call has run — get_usage
  // is long-deployed, so name/role/plan render correctly even before
  // get_settings itself is redeployed) — only email / MarketHive link /
  // voice-taught status truly depend on the new task.
  $('settingsNameInput').value = demo.seat.display_name;
  $('settingsPlan').textContent = demo.seat.plan.split(' · ')[0];
  $('settingsEmail').textContent = DEMO_MODE ? demo.settings.email : '—';
  $('rotateCodeBtn').classList.toggle('hidden', demo.seat.role !== 'admin');
  $('rotateCodeMemberNote').classList.toggle('hidden', demo.seat.role === 'admin');
  $('settingsVoiceStatus').textContent = '';
  $('settingsMhStatus').textContent = '';
  $('settingsCodeNote').classList.add('hidden');
  $('settingsDemoNote').classList.toggle('hidden', !DEMO_MODE);
  $('settingsNotLive').classList.add('hidden');
  // FLEET-0071: default ON (matches the server's own no-row-yet default in
  // techive-platform.ts) until get_settings says otherwise below.
  $('settingsPingToggle').checked = DEMO_MODE ? demo.settings.email_pings_enabled !== false : true;
  $('settingsPingNote').classList.add('hidden');
  renderA2hsHint();

  const res = await api.getSettings();
  if (res && res.ok && res.settings) {
    const s = res.settings;
    $('settingsNameInput').value = s.display_name || demo.seat.display_name;
    $('settingsEmail').textContent = s.email || '—';
    $('settingsPlan').textContent = s.plan ? brandPlanLabel(s.plan) : demo.seat.plan.split(' · ')[0];
    $('rotateCodeBtn').classList.toggle('hidden', s.role !== 'admin');
    $('rotateCodeMemberNote').classList.toggle('hidden', s.role === 'admin');
    $('settingsVoiceStatus').textContent = s.voice_profile_on_file
      ? 'Taught — your agents already draft in your voice.'
      : "Not taught yet — teach it below and every draft matches how you write.";
    $('settingsMhStatus').textContent = s.markethive_link ? 'On file: ' + s.markethive_link : 'Not set yet.';
    $('settingsPingToggle').checked = s.email_pings_enabled !== false;
  } else if (!DEMO_MODE) {
    const note = $('settingsNotLive');
    note.classList.remove('hidden');
    note.textContent = settingsTaskNotLive(res)
      ? "Some of this page isn't live yet — check back soon. You can still sign out below."
      : ((res && res.error) || "Couldn't load the rest of your settings — try again in a moment.");
  }
}

// ---------- Add to Home Screen hint (FLEET-0071, S230) ----------
// Dismissal persists in localStorage (survives tab close/reopen, unlike
// sessionStorage-scoped auth) — never shown again once dismissed on this
// device. Also skipped when the app is ALREADY running installed
// (display-mode: standalone) — the hint's whole job is done at that point.
const A2HS_DISMISS_KEY = 'kf_a2hs_dismissed';
function renderA2hsHint() {
  const card = $('settingsA2hsCard');
  if (!card) return;
  const alreadyInstalled = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const dismissed = localStorage.getItem(A2HS_DISMISS_KEY) === '1';
  card.classList.toggle('hidden', alreadyInstalled || dismissed);
}
const a2hsDismissBtn = $('settingsA2hsDismissBtn');
if (a2hsDismissBtn) {
  a2hsDismissBtn.addEventListener('click', () => {
    localStorage.setItem(A2HS_DISMISS_KEY, '1');
    renderA2hsHint();
  });
}

$('settingsPingToggle').addEventListener('change', async () => {
  const toggle = $('settingsPingToggle');
  const note = $('settingsPingNote');
  const next = toggle.checked;
  toggle.disabled = true;
  const res = await api.updateNotificationPrefs(next);
  toggle.disabled = false;
  note.classList.remove('hidden');
  if (res && res.ok) {
    note.textContent = next ? "You'll get an email when drafts are ready." : "Email pings are off.";
    setTimeout(() => note.classList.add('hidden'), 2400);
  } else {
    toggle.checked = !next; // revert — the save didn't take, don't lie about the state
    note.textContent = (!DEMO_MODE && settingsTaskNotLive(res))
      ? "This preference isn't live yet — check back soon."
      : ((res && res.error) || "Couldn't save that — try again in a moment.");
  }
});

$('settingsNameSaveBtn').addEventListener('click', async () => {
  const btn = $('settingsNameSaveBtn');
  const v = ($('settingsNameInput').value || '').trim();
  if (!v) { $('settingsNameInput').focus(); return; }
  btn.disabled = true;
  btn.textContent = 'Saving…';
  const res = await api.updateSeatName(v);
  btn.disabled = false;
  if (res && res.ok) {
    btn.textContent = 'Saved';
    demo.seat.display_name = res.display_name || v;
    $('seatName').textContent = demo.seat.display_name;
    $('seatAvatar').textContent = demo.seat.display_name.charAt(0);
    $('topbarAvatar').textContent = demo.seat.display_name.charAt(0);
    $('topbarAvatar').title = demo.seat.display_name + ' · Settings';
    renderNav();
  } else if (!DEMO_MODE && settingsTaskNotLive(res)) {
    btn.textContent = "Not live yet";
  } else {
    btn.textContent = (res && res.error) || 'Try again';
  }
  setTimeout(() => { btn.textContent = 'Save'; }, 2400);
});

$('rotateCodeBtn').addEventListener('click', async () => {
  const confirmed = window.confirm(
    "Send yourself a new access code?\n\nYour CURRENT code stops working the moment the new one goes out — you'll need the new code from your email to sign back in."
  );
  if (!confirmed) return;
  const btn = $('rotateCodeBtn');
  const note = $('settingsCodeNote');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  const res = await api.rotateAccessCode();
  btn.disabled = false;
  btn.textContent = 'Send me a new access code';
  note.classList.remove('hidden');
  if (res && res.ok) {
    note.textContent = res.message || "We emailed your new code — the old one just stopped working.";
  } else if (!DEMO_MODE && settingsTaskNotLive(res)) {
    note.textContent = "Access-code rotation isn't live yet — check back soon.";
  } else {
    note.textContent = (res && res.error) || "Couldn't rotate your code — try again in a moment.";
  }
});

$('settingsVoiceBtn').addEventListener('click', () => showView('voice'));

$('settingsMhBtn').addEventListener('click', () => {
  // Reuses the existing Refer & earn / MarketHive tab — never a duplicate
  // save flow (packet: "reuse existing views/tasks, don't duplicate").
  showView('refer');
  referTab = 'markethive';
  renderReferTabs();
});

$('signOutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('kf_access_code');
  // Strip any query string (?demo=1, ?view=..., OAuth return params) so the
  // reload lands cleanly back on the member gate rather than re-opening
  // whatever mode/view was in the URL.
  location.href = location.pathname;
});

// ---------- pause all / health strip ----------

function renderHealth() {
  $('healthDot').classList.toggle('paused', demo.paused);
  $('healthText').textContent = demo.paused
    ? 'Agents paused — resume any time'
    : 'All agents ran on time';
  $('pauseAllBtn').classList.toggle('on', demo.paused);
  $('pauseAllBtn').innerHTML = demo.paused ? '&#9654;' : '&#10074;&#10074;';
  $('pauseAllBtn').title = demo.paused ? 'Resume all agents' : 'Pause all agents';
  document.querySelectorAll('#agentNav .agent-status').forEach((d) => d.classList.toggle('paused', demo.paused));
}

$('pauseAllBtn').addEventListener('click', () => {
  demo.paused = !demo.paused;
  demo.activity.unshift({
    time: 'Just now',
    body: demo.paused ? 'All agents <b>paused</b> — scheduled runs hold until resume' : 'All agents <b>resumed</b>',
  });
  renderHealth();
  if (currentView === 'chat') renderChat();
});

// ---------- init ----------

async function boot() {
  if (!DEMO_MODE) {
    await loadLiveState();
  } else if (isTecHiveSkin() && demo.campaigns.length) {
    // Demo tour (FLEET-0070): default to the first sample campaign and
    // apply the same client-side filter switchCampaign() uses later — a
    // no-op today since every company-layer demo instance already belongs
    // to 'camp-1', but it keeps first paint and post-switch behavior
    // identical in shape.
    currentCampaignId = demo.campaigns[0].id;
    demoInstancesAll = demo.instances.slice();
    demo.instances = filterInstancesForCampaign(demoInstancesAll, currentCampaignId);
  }

  $('seatName').textContent = demo.seat.display_name;
  $('seatPlan').textContent = demo.seat.plan;
  $('seatAvatar').textContent = demo.seat.display_name.charAt(0);
  $('topbarAvatar').textContent = demo.seat.display_name.charAt(0);
  $('topbarAvatar').title = demo.seat.display_name;
  renderCampaignSwitcher();
  renderNav();
  renderChips();
  if (currentInstance) {
    selectInstance(currentInstance.id); // also hydrates the live thread
  } else {
    renderChat();
    renderDetail();
  }
  renderUsage();
  renderPricing();
  renderHealth();

  // Deep link (S221): ?view=refer&tab=organization opens straight to a
  // workspace view — used by tests/screenshots and shareable links alike.
  const params = new URLSearchParams(location.search);
  const bootView = params.get('view');
  if (bootView && $('view-' + bootView)) {
    showView(bootView);
    const bootTab = params.get('tab');
    if (bootView === 'refer' && bootTab && ['overview', 'organization', 'markethive'].includes(bootTab)) {
      referTab = bootTab;
      renderReferTabs();
    }
    // OAuth callback return (S225/FLEET-0056): techive-oauth 302s back here
    // as ?view=connections&connected=<id> on success, or &connect_error=
    // <reason> on a clean deny/failure. Trust "connected" ONLY once
    // list_connectors (already loaded above via loadLiveState) independently
    // confirms that state — never render success off the URL param alone.
    if (bootView === 'connections') {
      const connectedId = params.get('connected');
      const connectError = params.get('connect_error');
      if (connectedId || connectError) {
        const c = connectedId ? demo.connections.find((x) => x.id === connectedId) : null;
        const ok = Boolean(c && c.state === 'connected');
        const notice = document.createElement('div');
        notice.style.cssText = 'margin:0 0 16px;padding:10px 14px;border-radius:10px;font-size:13px;' +
          (ok
            ? 'background:rgba(52,199,89,0.14);border:1px solid rgba(52,199,89,0.4);color:#34c759;'
            : 'background:rgba(255,107,94,0.14);border:1px solid rgba(255,107,94,0.4);color:#ff6b5e;');
        notice.textContent = ok ? `${c.name || connectedId} connected.` : "That didn't finish connecting — try again.";
        const grid = $('connGrid');
        if (grid && grid.parentNode) grid.parentNode.insertBefore(notice, grid);
        history.replaceState(null, '', location.pathname + '?view=connections');
      }
    }
  } else if (!DEMO_MODE && demo.instances.length === 0) {
    // A live member with no agents spawned yet lands on the catalog —
    // the first thing to do is set one up.
    showView('catalog');
  }
}
boot();
