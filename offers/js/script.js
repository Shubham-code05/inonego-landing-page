/* =========================================================
   AdsTube · Diwali Offer Landing Page 2026 — script.js
   ---------------------------------------------------------
   EDIT BEFORE LAUNCH: everything in CONFIG below.
   ========================================================= */
const CONFIG = {
  // Offer window (IST). Countdown: "Starts in" → "Ends in" → "Offer ended".
  offerStart: '2026-11-04T00:00:00+05:30',
  offerEnd:   '2026-11-06T23:59:59+05:30',

  // Form endpoints — Google Apps Script web app (lead_type in the payload tells them apart). Leave '' to skip sending (demo mode).
  leadEndpoint:  'https://script.google.com/macros/s/AKfycbynCiU2qKEIkTVrq5s2ktEWfyzefPrdGRBNjt1vUKk_b6CbW77K92KaxWvd5lxp49s11A/exec',
  queryEndpoint: 'https://script.google.com/macros/s/AKfycbynCiU2qKEIkTVrq5s2ktEWfyzefPrdGRBNjt1vUKk_b6CbW77K92KaxWvd5lxp49s11A/exec',

  // Where the lead form redirects after a successful submit
  thankYouUrl: '/offers/thank-you.html',

  // Contact
  phone: '+918756655744',
  whatsapp: '917266024422', // default for floating / generic WhatsApp buttons; data-wa="91…" overrides per link
  whatsappText: "Hi AdsTube, I'd like to know more about the Diwali offer.",

  // Google Tag Manager container ID (GA4, Google Ads & Meta Pixel are configured inside GTM).
  // IDs to add in GTM: G-XXXXXXXXXX · AW-XXXXXXXXX · Meta PIXEL_ID
  gtmId: 'GTM-XXXXXXX',

  // "Select plan" options for each service (all forms)
  plans: {
    'YouTube Views': [
      '5,000 views — ₹499', '10,000 views — ₹999', '20,000 views — ₹1,899', '50,000 views — ₹2,999',
      '1,00,000 views — ₹4,999', '5,00,000 views — ₹11,999', '10,00,000 views — ₹21,999'
    ],
    'YouTube Subscribers': [
      '100 subscribers — ₹349', '200 subscribers — ₹699', '500 subscribers — ₹1,499', '1,000 subscribers — ₹2,999'
    ],
    'YouTube Monetization': [
      '2,000 hours + 2.5–3 lakh views — ₹18,999', '3,000 hours + 4.5–5 lakh views — ₹27,999', '4,000 hours + 5–6 lakh views — ₹37,999'
    ],
    'YouTube Monetization without views': [
      '2,000 hours — ₹6,999', '3,000 hours — ₹9,999', '4,000 hours — ₹12,999'
    ],
    'Revenue Services': [
      'Test — ₹1,999', 'Lite — ₹3,999', 'Grow — ₹6,999', 'Amplify — ₹12,999', 'Pro — ₹24,999'
    ]
  },

  // Regular (pre-Diwali) prices, shown struck through on the plan cards. Keyed by plan title.
  originalPrices: {
    '5,000 views': 750, '10,000 views': 1500, '20,000 views': 2600, '50,000 views': 5500,
    '1,00,000 views': 10000, '5,00,000 views': 40000, '10,00,000 views': 80000,
    '100 subscribers': 500, '200 subscribers': 1000, '500 subscribers': 2000, '1,000 subscribers': 4000,
    '2,000 hours + 2.5–3 lakh views': 26000, '3,000 hours + 4.5–5 lakh views': 36000, '4,000 hours + 5–6 lakh views': 45000,
    '2,000 hours': 8000, '3,000 hours': 12000, '4,000 hours': 15000,
    'Test': 2500, 'Lite': 5000, 'Grow': 9000, 'Amplify': 16000, 'Pro': 30000
  },

  // Pop-up form opens after this many seconds on every page load (0 = straight away)
  popupDelay: 0,

  // CAPTCHA: 'checkbox' is a placeholder. For production, swap in reCAPTCHA / Turnstile
  // and return its token from getCaptchaToken() below.
  captcha: 'checkbox'
};

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
document.documentElement.classList.add('js');
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = n => String(n).padStart(2, '0');

/* ---------------------------------------------------------
   Tracking: everything lands in the dataLayer
   --------------------------------------------------------- */
window.dataLayer = window.dataLayer || [];
function track(event, params = {}) {
  window.dataLayer.push(Object.assign({ event }, params));
}

(function loadGTM() {
  const id = CONFIG.gtmId;
  if (!id || /X{4,}/.test(id)) return; // placeholder — not loaded
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
})();
const gtmLoaded = () => !!(window.google_tag_manager && window.google_tag_manager[CONFIG.gtmId]);

/* Attribution: save UTM, gclid, fbclid for the session */
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
function captureAttribution() {
  const qs = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('adstube_attr') || '{}'); } catch (e) {}
  ATTR_KEYS.forEach(k => { if (qs.get(k)) saved[k] = qs.get(k); });
  if (!saved.landing_page) saved.landing_page = location.href;
  if (!saved.referrer && document.referrer) saved.referrer = document.referrer;
  try { sessionStorage.setItem('adstube_attr', JSON.stringify(saved)); } catch (e) {}
  return saved;
}
const attribution = captureAttribution();

/* ---------------------------------------------------------
   Theme: dark (default) / light — remembered per visitor
   --------------------------------------------------------- */
const Theme = {
  get() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; },
  init() {
    const btns = $$('[data-theme-toggle]');
    this.render(btns);
    btns.forEach(btn => btn.addEventListener('click', () => {
      const next = this.get() === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('adstube_theme', next); } catch (e) {}
      this.render(btns);
      track('theme_toggle', { theme: next });
      document.dispatchEvent(new CustomEvent('themechange', { detail: next }));
    }));
  },
  render(btns) {
    const light = this.get() === 'light';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#FFF9F2' : '#0A0A0B');
    btns.forEach(btn => {
      btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('title', light ? 'Dark mode' : 'Light mode');
      $('[data-theme-icon] use', btn).setAttribute('href', light ? '#i-moon' : '#i-sun');
    });
  }
};

/* ---------------------------------------------------------
   Contact links (tel / WhatsApp) + CTA tracking
   --------------------------------------------------------- */
function initLinks() {
  $$('[data-wa]').forEach(a => { a.href = 'https://wa.me/' + (a.dataset.wa || CONFIG.whatsapp) + '?text=' + encodeURIComponent(CONFIG.whatsappText); a.target = '_blank'; a.rel = 'noopener'; });

  document.addEventListener('click', e => {
    const a = e.target.closest('a, button');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('tel:')) track('click_to_call', { link_location: a.dataset.cta || a.className });
    if (href.includes('wa.me') || href.includes('whatsapp')) track('whatsapp_click', { link_location: a.dataset.cta || a.className });
    if (a.dataset.cta && a.dataset.cta !== 'form_submit') {
      track('cta_click', { cta_id: a.dataset.cta, cta_text: a.textContent.trim() });
    }
  });
}

/* ---------------------------------------------------------
   Countdown: "Starts in" → "Ends in" → "Offer ended"
   --------------------------------------------------------- */
const START = new Date(CONFIG.offerStart).getTime();
const END   = new Date(CONFIG.offerEnd).getTime();
let ended = false;

function offerPhase(now = Date.now()) {
  if (now < START) return { phase: 'before', target: START };
  if (now <= END)  return { phase: 'live',   target: END };
  return { phase: 'ended', target: END };
}

function tickCountdown() {
  const { phase, target } = offerPhase();
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
        m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;

  const inline = $('[data-countdown-inline]');
  if (inline) inline.textContent = phase === 'ended' ? 'Offer ended'
    : (phase === 'before' ? 'Starts in ' : 'Ends in ') + `${d}d ${h}h ${pad(m)}m`;

  $$('[data-countdown-boxes]').forEach(box => {
    $('[data-d]', box).textContent = pad(d);
    $('[data-h]', box).textContent = pad(h);
    $('[data-m]', box).textContent = pad(m);
    $('[data-s]', box).textContent = pad(s);
  });
  const lbl = $('[data-countdown-label]');
  if (lbl) lbl.textContent = phase === 'before' ? 'Offer starts in' : 'Offer ends in';

  if (phase === 'ended' && !ended) setEndedState();
}

/* After the deadline the page says so and switches CTAs to "Enquire Now" */
function setEndedState() {
  ended = true;
  document.body.classList.add('offer-ended');
  $$('[data-cta-label]').forEach(el => { el.textContent = 'Enquire Now'; });
  const ann = $('[data-announce-text]');
  if (ann) ann.innerHTML = '🪔 <strong>The AdsTube Diwali offer has ended</strong> · Enquire for current packages';
  const ft = $('[data-final-title]'); if (ft) ft.textContent = 'The Diwali offer has closed';
  const fs = $('[data-final-sub]');   if (fs) fs.textContent = 'The offer closed at 11:59 PM IST on 6 November 2026. Enquire now for current packages.';
  const fk = $('[data-final-kicker]'); if (fk) fk.textContent = 'Offer ended';
  const ft2 = $('.form-card__title', $('[data-lead-form]') || document);
  if (ft2 && $('[data-lead-form]')) ft2.textContent = 'Enquire Now';
}

/* ---------------------------------------------------------
   Festive light string under the header
   --------------------------------------------------------- */
function initLights() {
  const wrap = $('[data-lights]'); if (!wrap) return;
  const colors = ['var(--gold)', 'var(--red)', 'var(--bulb)'];
  const build = () => {
    const n = Math.ceil(window.innerWidth / 56) + 1;
    wrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--c', colors[i % 3]);
      s.style.setProperty('--d', (Math.random() * 2.4).toFixed(2) + 's');
      wrap.appendChild(s);
    }
  };
  build();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 200); });
}

/* ---------------------------------------------------------
   Headline rises word by word
   --------------------------------------------------------- */
function splitHeadline() {
  const h = $('[data-split]'); if (!h || reducedMotion) return;
  let i = 0;
  const wrapWords = node => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'word';
          const inner = document.createElement('span'); inner.textContent = part;
          inner.style.setProperty('--i', i++);
          w.appendChild(inner); frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) {
        // keep styled spans (e.g. red "Diwali") as one word
        const w = document.createElement('span'); w.className = 'word';
        const inner = document.createElement('span'); inner.style.setProperty('--i', i++);
        child.replaceWith(w); inner.appendChild(child); w.appendChild(inner);
      }
    });
  };
  h.setAttribute('aria-label', h.textContent.trim());
  wrapWords(h);
  $$('.word', h).forEach(w => w.setAttribute('aria-hidden', 'true'));
}

/* ---------------------------------------------------------
   Scroll reveals: headings slide in, cards stagger, stats count up
   --------------------------------------------------------- */
function initReveal() {
  $$('.stagger').forEach(g => Array.from(g.children).forEach((c, i) => c.style.setProperty('--si', i)));
  const targets = $$('.slide-in, .stagger');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(t => io.observe(t));
}

function countUp(el) {
  if (el.dataset.done) return; el.dataset.done = '1';
  const end = +el.dataset.count, suffix = el.dataset.suffix || '';
  const t0 = performance.now(), dur = 1600;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(end * e) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------------------------------------------------
   Rising sparks canvas (pauses off-screen / hidden tab)
   --------------------------------------------------------- */
function initSparks() {
  const canvas = $('[data-sparks]'), hero = $('[data-hero]');
  if (!canvas || !hero || reducedMotion) return;
  const ctx = canvas.getContext('2d');
  const colors = ['245,184,65', '232,0,15', '255,140,40', '255,255,255'];
  // White sparks vanish on the light theme, so swap them for deep red
  const palette = () => Theme.get() === 'light' ? ['217,154,30', '232,0,15', '255,120,30', '138,0,8'] : colors;
  let w, h, dpr, parts = [], running = false, visible = true, raf;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.clientWidth; h = hero.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(70, w / 18));
    parts = Array.from({ length: count }, () => spawn(true));
  };
  const spawn = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + .6,
    vy: Math.random() * .6 + .25,
    vx: (Math.random() - .5) * .25,
    a: Math.random() * .6 + .3,
    tw: Math.random() * Math.PI * 2,
    c: (pal => pal[Math.floor(Math.random() * pal.length)])(palette())
  });
  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    parts.forEach((p, i) => {
      p.y -= p.vy; p.x += p.vx + Math.sin(p.tw) * .15; p.tw += .04;
      const fade = Math.min(1, p.y / (h * .5));
      const alpha = p.a * fade * (.6 + .4 * Math.sin(p.tw * 2));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.c},${Math.max(0, alpha)})`;
      ctx.shadowBlur = 8; ctx.shadowColor = `rgba(${p.c},.8)`;
      ctx.fill();
      if (p.y < -10) parts[i] = spawn(false);
    });
    raf = requestAnimationFrame(frame);
  };
  const start = () => { if (!running && visible && !document.hidden) { running = true; raf = requestAnimationFrame(frame); } };
  const stop  = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  window.addEventListener('resize', () => { resize(); });
  document.addEventListener('themechange', resize);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  start();
}

/* ---------------------------------------------------------
   FAQ accordion
   --------------------------------------------------------- */
function initFAQ() {
  $$('.faq__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item'), panel = document.getElementById(btn.getAttribute('aria-controls'));
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      item.classList.toggle('is-open', !open);
      if (!open) track('faq_open', { faq_question: btn.textContent.trim() });
    });
  });
}

/* ---------------------------------------------------------
   Form validation helpers
   --------------------------------------------------------- */
const RULES = {
  name:     v => v.trim().length >= 2 || 'Please enter your name.',
  phone:    v => /^[6-9]\d{9}$/.test(v.replace(/\D/g, '')) || 'Enter a valid 10-digit Indian mobile number.',
  service:  v => !!v || 'Please select a service.',
  plan:     v => !!v || 'Please select a plan.',
  video_url: v => {
    if (!v.trim()) return true;
    try { const u = new URL(v.trim()); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') || 'Enter a valid YouTube or web link.'; }
    catch (e) { return 'Enter a valid YouTube or web link (starting with https://).'; }
  }
};

function setError(field, msg) {
  const wrap = field.closest('.field'), err = wrap && $('.field__err', wrap);
  if (!wrap) return;
  wrap.classList.toggle('is-invalid', !!msg);
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) err.textContent = msg || '';
}

function validateForm(form, names) {
  const errors = [];
  names.forEach(n => {
    const el = form.elements[n]; if (!el) return;
    const res = RULES[n] ? RULES[n](el.value) : true;
    const msg = res === true ? '' : res;
    setError(el, msg);
    if (msg) errors.push(el);
  });
  return errors;
}

function bindLiveValidation(form, names, formName) {
  let started = false;
  form.addEventListener('focusin', () => {
    if (!started) { started = true; track('form_start', { form_name: formName }); }
  });
  names.forEach(n => {
    const el = form.elements[n]; if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'blur';
    el.addEventListener(evt, () => { if (el.closest('.field').classList.contains('is-invalid') || el.value) validateForm(form, [n]); });
    if (n === 'phone') el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 10); });
  });
}

// Plan list follows the service picked
function bindPlans(form) {
  const service = form.elements.service, plan = form.elements.plan;
  if (!service || !plan) return;
  service.addEventListener('change', () => {
    const list = CONFIG.plans[service.value] || [];
    plan.innerHTML = '';
    plan.appendChild(new Option(list.length ? 'Select a plan' : 'Select a service first', ''));
    list.forEach(p => plan.appendChild(new Option(p, p)));
    plan.disabled = !list.length;
    setError(plan, '');
  });
}
function collect(form) {
  const data = {};
  new FormData(form).forEach((v, k) => { if (k !== 'website') data[k] = String(v).trim(); });
  if (data.phone) data.phone = '+91' + data.phone.replace(/\D/g, '');
  return Object.assign(data, attribution, {
    page_url: location.href,
    offer: 'diwali_2026',
    offer_phase: offerPhase().phase,
    submitted_at: new Date().toISOString()
  });
}

async function postJSON(url, payload) {
  if (!url) { console.info('[AdsTube] No endpoint set in CONFIG — payload:', payload); return true; }
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    // text/plain avoids a CORS preflight, which Apps Script can't answer; the body is still JSON
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ctrl.signal, keepalive: true });
    // Apps Script always answers 200, so a failed save only shows up in the body
    return res.ok && (await res.json()).ok === true;
  } catch (e) { return false; }
  finally { clearTimeout(t); }
}

/* ---------------------------------------------------------
   8 · Lead form → CRM → thank-you page
   --------------------------------------------------------- */
function initLeadForm() {
  $$('[data-lead-form]').forEach(setupLeadForm);
}
// Shared by the page form and the pop-up
function setupLeadForm(form) {
  const formName = form.dataset.formName || 'lead_form';
  const fields = ['name', 'phone', 'video_url', 'service', 'plan'].filter(n => form.elements[n]);
  const status = $('[data-status]', form), btn = $('button[type="submit"]', form);
  bindLiveValidation(form, fields, formName);
  bindPlans(form);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    const errors = validateForm(form, fields);
    if (errors.length) {
      errors[0].focus();
      track('form_error', { form_name: formName, error_fields: errors.map(f => f.name).join(',') });
      return;
    }
    const service = form.elements.service.value;
    const go = () => { location.href = CONFIG.thankYouUrl + '?service=' + encodeURIComponent(service); };
    try { sessionStorage.setItem('adstube_service', service); } catch (err) {}

    // Spam honeypot: bots fill it — pretend success, send nothing
    if (form.elements.website.value) { go(); return; }

    const label = $('[data-cta-label]', btn), original = label.textContent;
    btn.disabled = true; label.textContent = 'Sending…';

    const payload = Object.assign(collect(form), { lead_type: 'lead' });
    const ok = await postJSON(CONFIG.leadEndpoint, payload);
    if (!ok) {
      btn.disabled = false; label.textContent = original;
      status.textContent = "Sorry, we couldn't send your enquiry. Please try again, or call / WhatsApp us.";
      track('form_error', { form_name: formName, error_fields: 'network' });
      return;
    }

    // Lead event waits for GTM before redirecting, so the conversion is not lost
    let done = false; const once = () => { if (!done) { done = true; go(); } };
    track('generate_lead', {
      form_name: formName, lead_type: 'lead', service, plan: form.elements.plan ? form.elements.plan.value : '',
      eventCallback: once, eventTimeout: 2000
    });
    setTimeout(once, gtmLoaded() ? 2200 : 400);
  });
}

/* ---------------------------------------------------------
   10 · Query (quote) form → inline thanks, no redirect
   --------------------------------------------------------- */
function getCaptchaToken(form) {
  // Placeholder checkbox. Replace with: return grecaptcha.getResponse() / turnstile.getResponse()
  return form.elements.captcha.checked ? 'checkbox-placeholder' : '';
}

function initQueryForm() {
  const form = $('[data-query-form]'); if (!form) return;
  const fields = ['name', 'phone', 'video_url', 'service', 'plan'];
  const service = form.elements.service, plan = form.elements.plan;
  const status = $('[data-status]', form), btn = $('button[type="submit"]', form);
  bindLiveValidation(form, fields, 'query_form');
  bindPlans(form);


  const cap = form.elements.captcha;
  cap.addEventListener('change', () => { if (cap.checked) setError(cap, ''); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.textContent = '';
    const errors = validateForm(form, fields);
    const token = getCaptchaToken(form);
    if (!token) { setError(cap, 'Please confirm you are not a robot.'); errors.push(cap); }
    else setError(cap, '');
    if (errors.length) {
      errors[0].focus();
      track('form_error', { form_name: 'query_form', error_fields: errors.map(f => f.name).join(',') });
      return;
    }
    const success = $('[data-success]', form);
    if (form.elements.website.value) { success.hidden = false; return; } // honeypot

    btn.disabled = true; btn.textContent = 'Sending…';
    const payload = Object.assign(collect(form), { lead_type: 'query', captcha_token: token });
    delete payload.captcha;
    const ok = await postJSON(CONFIG.queryEndpoint, payload);
    btn.disabled = false; btn.textContent = 'Get Quote';
    if (!ok) {
      status.textContent = "Sorry, we couldn't send your request. Please try again, or call / WhatsApp us.";
      track('form_error', { form_name: 'query_form', error_fields: 'network' });
      return;
    }
    track('query_submit', { form_name: 'query_form', lead_type: 'query', service: service.value, plan: plan.value });
    success.hidden = false;
    success.setAttribute('tabindex', '-1'); success.focus();
  });
}

/* ---------------------------------------------------------
   Mobile sticky bar hides while a form is on screen
   --------------------------------------------------------- */
function initMobileBar() {
  const bar = $('[data-mbar]'); if (!bar || !('IntersectionObserver' in window)) return;
  const zones = new Set();
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting ? zones.add(en.target) : zones.delete(en.target));
    const hide = zones.size > 0;
    bar.classList.toggle('is-hidden', hide);
    document.body.classList.toggle('mbar-hidden', hide); // footer padding drops back down
  }, { threshold: .2 });
  $$('[data-form-zone] form').forEach(f => io.observe(f));
}

/* ---------------------------------------------------------
   Pop-up form: opens on every page load
   --------------------------------------------------------- */
function initPopup() {
  const pop = $('[data-pop]'); if (!pop || typeof pop.showModal !== 'function') return;
  $$('[data-pop-close]', pop).forEach(b => b.addEventListener('click', () => pop.close('dismiss')));
  pop.addEventListener('click', e => { if (e.target === pop) pop.close('dismiss'); }); // backdrop
  pop.addEventListener('close', () => track('popup_close'));

  // Every "Claim Diwali Offer" link opens the pop-up instead of scrolling to the form
  $$('a[href="#claim"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (!pop.open) {
      pop.showModal();
      document.dispatchEvent(new Event('popupopen'));
    }
    track('popup_open', { trigger: a.dataset.cta || 'claim_link' });
    $('#pop-form').elements.name.focus();
  }));

  if (offerPhase().phase === 'ended') return;

  // Opens on every page load (after CONFIG.popupDelay seconds)
  setTimeout(() => {
    if (pop.open || document.querySelector('dialog[open]')) return;
    pop.showModal();
    document.dispatchEvent(new Event('popupopen')); // keeps the fireworks above the pop-up
    track('popup_open', { trigger: 'page_load' });
  }, CONFIG.popupDelay * 1000);
}

/* ---------------------------------------------------------
   Opening fireworks: cracker blasts + rockets on every page load
   --------------------------------------------------------- */
function initFireworks() {
  if (reducedMotion) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'fx';
  canvas.setAttribute('aria-hidden', 'true');
  // As a popover the canvas sits in the top layer, above the pop-up form
  const topLayer = typeof canvas.showPopover === 'function';
  if (topLayer) canvas.setAttribute('popover', 'manual');
  document.body.appendChild(canvas);
  const raise = () => {
    if (!topLayer || !canvas.isConnected) return;
    try { if (canvas.matches(':popover-open')) canvas.hidePopover(); canvas.showPopover(); } catch (e) {}
  };
  raise();
  document.addEventListener('popupopen', raise);

  const ctx = canvas.getContext('2d');
  const COLORS = ['#E8000F', '#F5B841', '#FF7A00', '#FF2D7A', '#FFD34D', '#B4005A', '#FF9F1C'];
  let w, h, dpr;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const small = w < 680;
  const rockets = [], sparks = [];

  // Cracker blast: a ring of sparks plus a quick flash
  const burst = (x, y, big) => {
    const n = (big ? 90 : 60) * (small ? .6 : 1);
    const c1 = pick(COLORS), c2 = pick(COLORS);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-.05, .05);
      const sp = rand(2, big ? 7 : 5.5);
      sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, decay: rand(.010, .018), r: rand(1.6, 2.8), c: i % 2 ? c1 : c2, trail: true });
    }
    sparks.push({ x, y, vx: 0, vy: 0, life: 1, decay: .06, r: big ? 70 : 48, c: '#FFE7A3', flash: true });
  };

  // Rockets start low on the screen (bottom or lower sides) and fly to a burst point
  const launch = () => {
    const side = Math.random();
    const sx = side < .2 ? -10 : side > .8 ? w + 10 : rand(w * .1, w * .9);
    const sy = side < .2 || side > .8 ? rand(h * .55, h * .9) : h + 10;
    const tx = rand(w * .12, w * .88), ty = rand(h * .12, h * .45);
    const frames = rand(55, 80);
    rockets.push({ x: sx, y: sy, vx: (tx - sx) / frames, vy: (ty - sy) / frames, t: 0, frames, c: pick(COLORS) });
  };

  const drawRocket = (r) => {
    const ang = Math.atan2(r.vy, r.vx);
    ctx.save();
    ctx.translate(r.x, r.y); ctx.rotate(ang);
    // flame
    ctx.fillStyle = 'rgba(255,170,40,.9)';
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-18 - Math.random() * 8, -3); ctx.lineTo(-18 - Math.random() * 8, 3); ctx.closePath(); ctx.fill();
    // body + gold nose
    ctx.fillStyle = r.c; ctx.fillRect(-9, -3, 14, 6);
    ctx.fillStyle = '#F5B841';
    ctx.beginPath(); ctx.moveTo(5, -3); ctx.lineTo(11, 0); ctx.lineTo(5, 3); ctx.closePath(); ctx.fill();
    ctx.restore();
    // sparkly trail
    sparks.push({ x: r.x - r.vx * 2, y: r.y - r.vy * 2, vx: rand(-.4, .4), vy: rand(.2, .8), life: .8, decay: .045, r: rand(1, 2), c: '#FFB627' });
  };

  // Schedule: two instant blasts, then rockets from here and there
  const t0 = performance.now();
  const schedule = [
    { at: 0,   fn: () => burst(w * rand(.25, .4), h * rand(.22, .35), true) },
    { at: 180, fn: () => burst(w * rand(.6, .78), h * rand(.18, .32), true) }
  ];
  const count = small ? 6 : 10;
  for (let i = 0; i < count; i++) schedule.push({ at: 350 + i * rand(220, 330), fn: launch });
  const DURATION = 6500;

  let raf;
  const frame = (now) => {
    const el = now - t0;
    while (schedule.length && schedule[0].at <= el) schedule.shift().fn();
    ctx.clearRect(0, 0, w, h);

    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.t++;
      drawRocket(r);
      if (r.t >= r.frames) { burst(r.x, r.y, Math.random() > .5); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= p.decay;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      if (p.flash) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(255,240,190,.9)'); g.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      } else {
        const ox = p.x, oy = p.y;
        p.vx *= .985; p.vy = p.vy * .985 + .06; // air drag + gravity
        p.x += p.vx; p.y += p.vy;
        if (p.trail) {
          ctx.strokeStyle = p.c; ctx.lineWidth = p.r; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(ox - p.vx * 2, oy - p.vy * 2); ctx.lineTo(p.x, p.y); ctx.stroke();
        } else {
          ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    if (el < DURATION || rockets.length || sparks.length) raf = requestAnimationFrame(frame);
    else cleanup();
  };
  const cleanup = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    document.removeEventListener('popupopen', raise);
    canvas.remove();
  };
  raf = requestAnimationFrame(frame);
  setTimeout(cleanup, DURATION + 3000); // hard stop, even on slow devices
  track('fireworks_play');
}

/* ---------------------------------------------------------
   Diwali plan creatives: tabs per service, "Buy now" fills the pop-up
   --------------------------------------------------------- */
const PLAN_ICONS = {
  'YouTube Views': 'i-youtube', 'YouTube Subscribers': 'i-users', 'YouTube Monetization': 'i-rupee',
  'YouTube Monetization without views': 'i-rupee', 'Revenue Services': 'i-chart'
};
function initPlans() {
  const tabs = $('[data-plan-tabs]'), grid = $('[data-plan-grid]');
  if (!tabs || !grid) return;
  const services = Object.keys(CONFIG.plans);

  const render = (svc) => {
    $$('button', tabs).forEach(b => b.setAttribute('aria-selected', String(b.dataset.svc === svc)));
    grid.innerHTML = '';
    CONFIG.plans[svc].forEach((label, i) => {
      const [title, price] = label.split(' — ');
      // "5,000 views" → big "5,000" + "views"; named plans ("Lite") stay whole
      const m = title.match(/^([\d,.]+)\s+(.*)$/);
      const card = document.createElement('article');
      card.className = 'plan';
      card.style.setProperty('--i', i);
      card.innerHTML = `
        <span class="plan__badge">🪔 Diwali Special</span>
        <svg class="plan__icon" aria-hidden="true"><use href="#${PLAN_ICONS[svc] || 'i-youtube'}"/></svg>
        <p class="plan__svc"></p>
        <p class="plan__qty"></p>
        <p class="plan__unit"></p>
        <p class="plan__was" hidden><s></s> <span class="plan__off"></span></p>
        <p class="plan__price"></p>
        <button type="button" class="btn btn--white btn--block plan__buy">Buy now <svg class="ic"><use href="#i-arrow"/></svg></button>
        <span class="plan__diya diya" aria-hidden="true"><span class="diya__flame"></span><span class="diya__bowl"></span></span>`;
      $('.plan__svc', card).textContent = svc;
      $('.plan__qty', card).textContent = m ? m[1] : title;
      $('.plan__unit', card).textContent = m ? m[2] : 'plan';
      $('.plan__price', card).textContent = price;
      const was = CONFIG.originalPrices[title];
      const now = Number(price.replace(/[^\d]/g, ''));
      if (was && now && was > now) {
        const wasEl = $('.plan__was', card);
        $('s', wasEl).textContent = '₹' + was.toLocaleString('en-IN');
        $('s', wasEl).setAttribute('aria-label', `Regular price ₹${was.toLocaleString('en-IN')}`);
        $('.plan__off', card).textContent = `${Math.round((1 - now / was) * 100)}% off`;
        wasEl.hidden = false;
        card.classList.add('plan--has-was');
      }
      $('.plan__buy', card).setAttribute('aria-label', `Buy ${title} for ${price}` + (was && was > now ? ` (regular ₹${was.toLocaleString('en-IN')})` : ''));
      $('.plan__buy', card).addEventListener('click', () => buyPlan(svc, label));
      grid.appendChild(card);
    });
  };

  services.forEach(svc => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'plans__tab'; b.dataset.svc = svc;
    b.setAttribute('role', 'tab');
    b.textContent = svc.replace(/^YouTube /, '');
    b.addEventListener('click', () => { render(svc); track('plan_tab', { service: svc }); });
    tabs.appendChild(b);
  });
  render(services[0]);
}
function buyPlan(service, plan) {
  const pop = $('[data-pop]'), form = $('#pop-form');
  track('plan_buy_click', { service, plan });
  if (!pop || !form || typeof pop.showModal !== 'function') { location.hash = '#claim'; return; }
  form.elements.service.value = service;
  form.elements.service.dispatchEvent(new Event('change'));
  form.elements.plan.value = plan;
  setError(form.elements.service, ''); setError(form.elements.plan, '');
  if (!pop.open) pop.showModal();
  track('popup_open', { trigger: 'buy_now' });
  form.elements.name.focus();
}

/* ---------------------------------------------------------
   Thank-you page
   --------------------------------------------------------- */
function initThankYou() {
  const el = $('[data-ty-service]'); if (!el) return;
  let service = new URLSearchParams(location.search).get('service');
  if (!service) { try { service = sessionStorage.getItem('adstube_service'); } catch (e) {} }
  el.textContent = service || 'your campaign';
  track('thank_you_view', { service: service || '' });
}

/* ---------------------------------------------------------
   Hero video: thumbnail first, YouTube loads only on click
   --------------------------------------------------------- */
function initVideo() {
  $$('[data-video]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const frame = document.createElement('iframe');
      frame.src = 'https://www.youtube-nocookie.com/embed/' + link.dataset.video + '?autoplay=1&rel=0';
      frame.title = 'AdsTube Diwali offer video';
      frame.allow = 'autoplay; encrypted-media; picture-in-picture';
      frame.allowFullscreen = true;
      const screen = document.createElement('div');
      screen.className = 'player__screen';
      screen.appendChild(frame);
      link.closest('.player').classList.add('is-playing');
      link.replaceWith(screen);
    });
  });
}

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  initLinks();
  initLights();
  splitHeadline();
  initReveal();
  initSparks();
  initFAQ();
  initVideo();
  initLeadForm();
  initQueryForm();
  initMobileBar();
  initPlans();
  initFireworks();
  initPopup();
  initThankYou();
  if ($('[data-countdown-inline], [data-countdown-boxes]')) {
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }
});
