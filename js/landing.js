// ═══════════ LANDING INTERACTIONS ═══════════

// Pressure cards in hero
function togglePressure(el, idx) {
  document.querySelectorAll('.hero-pressure').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

// Guideline cards
function toggleGL(card, id) {
  const body = document.getElementById('glb-' + id);
  const chev = card.querySelector('.chev');
  const isOpen = body.classList.contains('open');
  // Close all
  document.querySelectorAll('.gl-body').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.gl-toggle .chev').forEach(c => c.classList.remove('open'));
  document.querySelectorAll('.gl-card').forEach(c => c.classList.remove('expanded'));
  if (!isOpen) {
    body.classList.add('open');
    chev.classList.add('open');
    card.classList.add('expanded');
  }
}

// State toggle
function setState(state, btn) {
  document.querySelectorAll('.state-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.state-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('sp-' + state).classList.add('active');
}

// Consequence items
function toggleConsequence(el) {
  const detail = el.querySelector('.ci-detail');
  const isOpen = detail.classList.contains('show');
  document.querySelectorAll('.ci-detail').forEach(d => d.classList.remove('show'));
  if (!isOpen) detail.classList.add('show');
}

// Execution wheel
const SPOKE_DATA = [
  { num:'PRESSURE 01', title:'Deliver regulatory demands while running BAU', body:'Regulatory programs compete directly with transformation initiatives, technology upgrades, and day-to-day operational stability. The expectation is full compliance delivery without additional headcount or delivery capacity.' },
  { num:'PRESSURE 02', title:'Manage delivery risk, budget constraints & competing priorities', body:'Each guideline arrives with its own timeline, scope, and resourcing ask — without a coordinated cross-domain plan, delivery risk accumulates across the portfolio and budget constraints force triage decisions.' },
  { num:'PRESSURE 03', title:'Address audit findings and supervisory scrutiny', body:'Supervisory letters generate remediation obligations that must be addressed in parallel with new guideline compliance — creating compounding delivery pressure and consuming team capacity that was allocated to new initiatives.' },
  { num:'PRESSURE 04', title:'Translate regulatory expectations into operational controls', body:'Regulatory language must be converted into measurable controls, governance mechanisms, and operational tolerances — without destabilizing existing frameworks or creating conflicting obligations between guidelines.' },
  { num:'PRESSURE 05 — Operating Model', title:'Protect operating model stability throughout', body:'The core tension: the challenge is not understanding the regulation — it is executing it without destabilizing the operating model. Incremental compliance, managed in isolation across four guidelines, will not hold under integrated supervisory scrutiny.' },
];
function selectSpoke(idx, el) {
  document.querySelectorAll('.wheel-spoke').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  const d = SPOKE_DATA[idx];
  const det = document.getElementById('wheelDetail');
  det.innerHTML = `<div class="wheel-detail-num">${d.num}</div><div class="wheel-detail-title">${d.title}</div><p class="wheel-detail-body">${d.body}</p>`;
}

// Execution requirements
function toggleReq(el) {
  document.querySelectorAll('.exec-req').forEach(r => r.classList.remove('active'));
  el.classList.add('active');
}

// Value tabs
function selectValueTab(idx, btn) {
  document.querySelectorAll('.vt-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.value-panel').forEach(p => p.classList.remove('active'));
  const tabs = document.querySelectorAll('.vt-tab');
  if (tabs[idx]) tabs[idx].classList.add('active');
  const panel = document.getElementById('vp-' + idx);
  if (panel) panel.classList.add('active');
}

// Role selector
function selectRole(role, btn) {
  document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('rp-' + role);
  if (panel) panel.classList.add('active');
}

// Use case tabs
function selectUC(idx, btn) {
  document.querySelectorAll('.uc-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.uc-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('ucp-' + idx);
  if (panel) panel.classList.add('active');
}

// Scan selector
let selectedScan = null;
function selectScan(mode, card) {
  selectedScan = mode;
  document.querySelectorAll('.scan-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  const btn = document.getElementById('startBtn');
  const hint = document.getElementById('scanHint');
  btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
  btn.textContent = mode === 'simple' ? 'Begin Simple Diagnostic (8 questions) →' : 'Begin In-Depth Assessment (54 questions) →';
  hint.textContent = mode === 'simple' ? '~3–5 minutes · Executive summary + priority gap signals' : '~25–40 minutes · Full maturity scoring, heat map & radar chart';
}

function goToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function startAssessment() {
  if (!selectedScan) return;
  scanMode = selectedScan;
  showView('viewAssessment');
  document.getElementById('assessModeBadge').textContent = scanMode === 'simple' ? 'Simple Diagnostic — 8 Questions' : 'In-Depth Assessment — 54 Questions';
  renderQuestions();
  refreshAll();
  window.scrollTo(0, 0);
}

function backToLanding() {
  showView('viewLanding');
  window.scrollTo(0, 0);
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => { v.style.display = 'none'; v.classList.remove('active'); });
  const el = document.getElementById(id);
  el.style.display = 'block'; el.classList.add('active');
}

// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 20);
});

// Active nav link + narrative section tracker on scroll
const STORY_SECTIONS = [
  { id:'challenge-section', label:'The Challenge' },
  { id:'siloed-section', label:'Siloed Risk' },
  { id:'reality-section', label:'Execution Reality' },
  { id:'usecase-section', label:'Use Cases' },
  { id:'approach-section', label:'Our Approach' },
  { id:'scan-section', label:'Start Assessment' },
];

function refreshStoryTracker() {
  let currentIdx = -1;
  STORY_SECTIONS.forEach((section, idx) => {
    const el = document.getElementById(section.id);
    if (el && el.getBoundingClientRect().top <= 100) currentIdx = idx;
  });
  const bottomReached = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 2);
  if (bottomReached) currentIdx = STORY_SECTIONS.length - 1;

  const currentId = currentIdx >= 0 ? STORY_SECTIONS[currentIdx].id : '';
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
  });

  const stepEl = document.getElementById('navSectionStep');
  const labelEl = document.getElementById('navSectionLabel');
  const fillEl = document.getElementById('navStoryProgressFill');
  if (stepEl && labelEl && fillEl) {
    if (currentIdx < 0) {
      stepEl.textContent = `0/${STORY_SECTIONS.length}`;
      labelEl.textContent = 'Introduction';
      fillEl.style.width = '0%';
    } else {
      stepEl.textContent = `${currentIdx + 1}/${STORY_SECTIONS.length}`;
      labelEl.textContent = STORY_SECTIONS[currentIdx].label;
      fillEl.style.width = `${((currentIdx + 1) / STORY_SECTIONS.length) * 100}%`;
    }
  }
}

window.addEventListener('scroll', refreshStoryTracker);
window.addEventListener('resize', refreshStoryTracker);
window.addEventListener('load', refreshStoryTracker);

// Reveal on scroll
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
