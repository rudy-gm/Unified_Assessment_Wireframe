// State
const answers={},notes={},openNotes={};
let hasScored=false,scanMode='simple',activeScenario='all';

// ═══════════════════════════════════════════

// SCENARIO SELECTOR
// ═══════════════════════════════════════════
function setScenario(s,btn){
  activeScenario=s;
  document.querySelectorAll('.scenario-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  // Clear all answers and reset scored UI
  Object.keys(answers).forEach(k=>delete answers[k]);
  hasScored=false;
  document.querySelectorAll('.question-card').forEach(card=>card.classList.remove('scored'));
  document.querySelectorAll('.score-btn').forEach(b=>b.className='score-btn');
  document.querySelectorAll('.micro-feedback').forEach(mf=>{mf.textContent='';mf.className='micro-feedback';});
  const rpResults=document.getElementById('rpResults');
  const rpInsights=document.getElementById('rpInsights');
  if(rpResults){rpResults.classList.remove('visible');rpResults.style.display='none';}
  if(rpInsights) rpInsights.style.display='';
  // Highlight/dim question cards based on scenario
  document.querySelectorAll('.question-card').forEach(card=>{
    const scenarios=card.dataset.scenarios?card.dataset.scenarios.split(','):['all'];
    const match=s==='all'||scenarios.includes(s);
    card.style.opacity=match?'1':'0.35';
    card.style.transition='opacity 0.3s';
    card.style.pointerEvents=match?'':'none';
  });
  refreshAll();
}

function qInScenario(q){
  if(activeScenario==='all') return true;
  const sc=q.scenarios||['all'];
  return sc.includes(activeScenario)||sc.includes('all');
}

// ═══════════════════════════════════════════
// RENDER QUESTIONS
// ═══════════════════════════════════════════
function renderQuestions(){
  const mount=document.getElementById('questionsMount');
  let h='';
  const totalQ=scanMode==='simple'?8:54;
  GL.forEach(g=>{
    const domainQs=g.domains.flatMap(d=>d.qs.filter(q=>scanMode==='simple'?q.simple:true));
    if(!domainQs.length) return;
    const total=domainQs.length;
    h+=`<div class="g-header" style="border-top:3px solid ${g.color}">
      <span class="g-badge" style="border-color:${g.color};color:${g.color}">OSFI ${g.code}</span>
      <div class="g-title-block"><div class="g-title">${g.title}</div><div class="g-eff">${g.eff}</div></div>
      <div class="g-prog"><span class="g-pill" id="gpill-${g.id}">0/${total}</span><div class="g-pbar"><div class="g-pbar-fill" id="gpbar-${g.id}" style="width:0%"></div></div></div>
    </div>`;
    g.domains.forEach((d,di)=>{
      const dqs=d.qs.filter(q=>scanMode==='simple'?q.simple:true);
      if(!dqs.length) return;
      h+=`<div class="domain-block"><div class="domain-row"><span class="d-num">${String(di+1).padStart(2,'0')}</span><span class="d-name">${d.title}</span></div>`;
      dqs.forEach(q=>{
        const sc=q.scenarios||['all'];
        h+=`<div class="question-card" id="qcard-${q.id}" data-scenarios="${sc.join(',')}">
          <div class="q-header">
            <span class="q-ref">${q.ref}</span>
            ${q.why?`<button class="q-why-btn" onclick="toggleWhy('${q.id}')">Why this matters</button>`:''}
          </div>
          ${q.why?`<div class="q-tooltip" id="qtip-${q.id}"><strong>Supervisory context:</strong> ${q.why}</div>`:''}
          <div class="q-text">${q.text}</div>
          <div class="score-row">${[1,2,3,4,5].map(n=>`
            <button class="score-btn" id="sb-${q.id}-${n}" onclick="score('${q.id}',${n})">
              <span class="snum">${n}</span><span class="slbl">${ML[n]}</span>
            </button>`).join('')}</div>
          <div class="micro-feedback" id="mf-${q.id}"></div>
          <button class="note-toggle" id="nt-${q.id}" onclick="toggleNote('${q.id}')">+ Add note</button>
          <textarea class="note-input" id="ni-${q.id}" style="display:none" placeholder="Observations, evidence, gaps, recommended actions..." oninput="notes['${q.id}']=this.value;refreshNarrative()"></textarea>
        </div>`;
      });
      h+=`</div>`;
    });
  });
  mount.innerHTML=h;
  updateNavProgress();
}

function toggleWhy(qid){
  const tip=document.getElementById('qtip-'+qid);
  if(tip) tip.classList.toggle('open');
}

// ═══════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════
function score(qid,val){
  const prev=answers[qid];
  answers[qid]=val;
  const card=document.getElementById('qcard-'+qid);
  card.classList.add('scored');
  [1,2,3,4,5].forEach(n=>{
    document.getElementById(`sb-${qid}-${n}`).className='score-btn'+(n===val?' s'+val:'');
  });
  // Micro-feedback
  const mf=document.getElementById('mf-'+qid);
  if(mf){
    const texts=MF_TEXT[val];
    mf.textContent=texts[Math.floor(Math.random()*texts.length)];
    mf.className=`micro-feedback mf${val} show`;
  }
  // Swap panels on first score
  if(!hasScored){
    hasScored=true;
    document.getElementById('rpInsights').style.display='none';
    const rp=document.getElementById('rpResults');
    rp.classList.add('visible');
    rp.style.display='flex';
  }
  refreshAll();
  refreshLiveSignal(qid,val);
}

function toggleNote(qid){
  openNotes[qid]=!openNotes[qid];
  document.getElementById('ni-'+qid).style.display=openNotes[qid]?'block':'none';
  document.getElementById('nt-'+qid).textContent=openNotes[qid]?'− Hide note':'+ Add note';
}

function onProfile(){ refreshCompositeHeader(); refreshNarrative(); }

// ═══════════════════════════════════════════
// LIVE SIGNAL
// ═══════════════════════════════════════════
function refreshLiveSignal(qid,val){
  const el=document.getElementById('liveSignal');
  if(!el) return;
  const cs=composite();
  if(!cs){el.className='live-signal';el.style.display='none';return;}
  let cls,msg;
  if(val<=1){cls='ls-high';msg=`⚠ High-priority gap identified — this domain requires immediate foundational design before your next supervisory review.`;}
  else if(val===2){cls='ls-medium';msg=`⚡ Developing posture — standardization and consistent enterprise enforcement should be a near-term priority.`;}
  else if(val===3){cls='ls-ok';msg=`↑ Defined level — strengthen measurement, monitoring integration, and cross-domain linkage to reach Managed maturity.`;}
  else if(val>=4){cls='ls-strong';msg=`✓ Strong control posture — focus on automation, proactive monitoring, and supervisory evidence generation.`;}
  el.className=`live-signal ${cls} show`;
  el.textContent=msg;
  el.style.display='block';
  setTimeout(()=>{el.style.display='none';},5000);
}

// ═══════════════════════════════════════════
// CALCULATIONS
// ═══════════════════════════════════════════
function activeQs(){
  return GL.flatMap(g=>g.domains.flatMap(d=>d.qs.filter(q=>(scanMode==='simple'?q.simple:true)&&qInScenario(q))));
}
function gScore(gid){
  const g=GL.find(x=>x.id===gid);
  const qs=g.domains.flatMap(d=>d.qs.filter(q=>(scanMode==='simple'?q.simple:true)&&qInScenario(q))).filter(q=>answers[q.id]);
  if(!qs.length) return null;
  return qs.reduce((a,q)=>a+answers[q.id],0)/qs.length;
}
function dScore(d){
  const qs=d.qs.filter(q=>(scanMode==='simple'?q.simple:true)&&qInScenario(q)&&answers[q.id]);
  if(!qs.length) return null;
  return qs.reduce((a,q)=>a+answers[q.id],0)/qs.length;
}
function composite(){
  const ss=GL.map(g=>gScore(g.id)).filter(s=>s!==null);
  if(!ss.length) return null;
  return ss.reduce((a,b)=>a+b,0)/ss.length;
}
function sc(s){if(!s) return 'var(--muted)';return SC[Math.round(s)]||'var(--muted)';}

// ═══════════════════════════════════════════
// REFRESH ALL
// ═══════════════════════════════════════════
function refreshAll(){
  refreshCompositeHeader();
  refreshGBars();
  refreshProgress();
  refreshRadar();
  refreshHeatmap();
  refreshGaps();
  refreshNarrative();
  refreshCompletion();
  updateNavProgress();
}

function refreshCompositeHeader(){
  const cs=composite();
  const num=document.getElementById('rNum');
  const badge=document.getElementById('rBadge');
  const iline=document.getElementById('rInstLine');
  if(!num) return;
  if(cs===null){
    num.textContent='—';num.style.color='var(--muted)';
    badge.textContent='Not yet assessed';
    badge.style.cssText='color:var(--muted);background:rgba(0,0,0,0.05);border:1px solid var(--line)';
  } else {
    const c=sc(cs),lvl=Math.round(cs);
    num.textContent=cs.toFixed(1);num.style.color=c;
    badge.textContent=ML[lvl];
    badge.style.cssText=`color:${c};background:${c}15;border:1px solid ${c}40`;
  }
  const inst=document.getElementById('pInstitution')?.value;
  const role=document.getElementById('pRole')?.value;
  const exam=document.getElementById('pExam')?.value;
  let line='';
  if(inst) line=inst;
  if(role) line+=(line?' · ':'')+role;
  if(exam) line+=(line?' · Exam: ':'Exam: ')+exam;
  iline.textContent=line||'Complete the profile to begin';
}

function refreshGBars(){
  GL.forEach(g=>{
    const s=gScore(g.id);
    const bar=document.getElementById('gb-'+g.id);
    const val=document.getElementById('gv-'+g.id);
    if(!bar||!val) return;
    bar.style.cssText=`width:${s?s/5*100:0}%;background:${s?sc(s):'var(--teal-mid)'}`;
    val.textContent=s?s.toFixed(1):'—';val.style.color=s?sc(s):'var(--muted)';
  });
}

function refreshProgress(){
  GL.forEach(g=>{
    const qs=g.domains.flatMap(d=>d.qs.filter(q=>(scanMode==='simple'?q.simple:true)&&qInScenario(q)));
    const total=qs.length,done=qs.filter(q=>answers[q.id]).length;
    const pill=document.getElementById('gpill-'+g.id);
    const bar=document.getElementById('gpbar-'+g.id);
    if(pill) pill.textContent=`${done}/${total}`;
    if(bar) bar.style.width=total?(done/total*100)+'%':'0%';
  });
}

function updateNavProgress(){
  const qs=activeQs();
  const total=qs.length,done=qs.filter(q=>answers[q.id]).length;
  const pText=document.getElementById('navProgressText');
  const pFill=document.getElementById('navProgressFill');
  if(pText) pText.textContent=`${done} / ${total}`;
  if(pFill) pFill.style.width=total?(done/total*100)+'%':'0%';
}

function refreshCompletion(){
  const qs=activeQs();
  const total=qs.length,done=qs.filter(q=>answers[q.id]).length;
  const ct=document.getElementById('completionText');
  const cf=document.getElementById('completionFill');
  if(ct) ct.textContent=`${done} / ${total} answered`;
  if(cf) cf.style.width=total?(done/total*100)+'%':'0%';
}

function refreshRadar(){
  const cx=100,cy=100,R=72,n=GL.length;
  let rings='',axes='',dotsH='',labelsH='';
  [1,2,3,4,5].forEach(ring=>{
    const pts=GL.map((_,i)=>{const a=(Math.PI*2*i/n)-Math.PI/2,r=(ring/5)*R;return`${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`;}).join(' ');
    rings+=`<polygon points="${pts}" fill="none" stroke="rgba(0,80,90,0.1)" stroke-width="0.7"/>`;
  });
  GL.forEach((_,i)=>{const a=(Math.PI*2*i/n)-Math.PI/2;axes+=`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*R}" y2="${cy+Math.sin(a)*R}" stroke="rgba(0,80,90,0.1)" stroke-width="0.7"/>`;});
  const shapePts=GL.map((g,i)=>{const s=gScore(g.id)||0,a=(Math.PI*2*i/n)-Math.PI/2,r=(s/5)*R;return`${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`;}).join(' ');
  GL.forEach((g,i)=>{
    const s=gScore(g.id),a=(Math.PI*2*i/n)-Math.PI/2;
    if(s){const r=(s/5)*R;dotsH+=`<circle cx="${cx+Math.cos(a)*r}" cy="${cy+Math.sin(a)*r}" r="3" fill="${g.color}" stroke="#fff" stroke-width="1.5"/>`;}
    const lr=R+18;
    labelsH+=`<text x="${cx+Math.cos(a)*lr}" y="${cy+Math.sin(a)*lr}" text-anchor="middle" dominant-baseline="middle" fill="${g.color}" font-size="9" font-family="DM Mono,monospace" font-weight="500">${g.code}</text>`;
  });
  const rs=document.getElementById('radarRings');
  const ra=document.getElementById('radarAxes');
  const rsh=document.getElementById('radarShape');
  const rd=document.getElementById('radarDots');
  const rl=document.getElementById('radarLabels');
  if(rs) rs.innerHTML=rings;
  if(ra) ra.innerHTML=axes;
  if(rsh) rsh.setAttribute('points',shapePts);
  if(rd) rd.innerHTML=dotsH;
  if(rl) rl.innerHTML=labelsH;
}

function refreshHeatmap(){
  const rows=document.getElementById('heatmapRows');
  if(!rows) return;
  let h='';let any=false;
  GL.forEach(g=>g.domains.forEach(d=>{
    const s=dScore(d);if(s===null) return;any=true;
    const lvl=Math.round(s);
    h+=`<div class="hm-row"><span class="hm-domain" title="${g.code} · ${d.title}">${g.code} · ${d.title}</span><span class="hm-cell hm-${lvl}">${s.toFixed(1)}</span></div>`;
  }));
  rows.innerHTML=any?h:'<p class="empty-note">Score questions to reveal domain heat map</p>';
}

function refreshGaps(){
  const list=document.getElementById('gapsList');
  if(!list) return;
  const gaps=[];
  GL.forEach(g=>g.domains.forEach(d=>d.qs.filter(q=>(scanMode==='simple'?q.simple:true)&&qInScenario(q)).forEach(q=>{const s=answers[q.id];if(s&&s<=3) gaps.push({g,q,s});})));
  gaps.sort((a,b)=>a.s-b.s);
  if(!gaps.length){list.innerHTML='<p class="empty-note">Priority gaps appear here as you score questions ≤ 3</p>';return;}
  list.innerHTML=gaps.slice(0,12).map(({g,q,s})=>{
    const dc=s===1?'gap-dot-h':s===2?'gap-dot-m':'gap-dot-l';
    const act=s===1?'Immediate: Design foundational control, assign ownership.':s===2?'Near-term: Standardize and enforce consistently.':'Enhancement: Improve measurement and cross-domain integration.';
    const txt=q.text.length>95?q.text.slice(0,95)+'…':q.text;
    return`<div class="gap-item"><div class="gap-dot ${dc}"></div><div class="gap-content"><div class="gap-ref" style="color:${g.color}">${g.code} · ${q.ref}</div><div class="gap-text">${txt}</div><div class="gap-action">${act}</div></div></div>`;
  }).join('');
}

function refreshNarrative(){
  const cs=composite();
  const el=document.getElementById('narrativeText');
  if(!el) return;
  if(!cs){el.innerHTML='<em style="color:var(--muted)">Narrative generates automatically as you complete the assessment.</em>';return;}
  const inst=document.getElementById('pInstitution')?.value||'The institution';
  const lvl=Math.round(cs),label=ML[lvl]||'';
  const highGaps=activeQs().filter(q=>answers[q.id]===1).length;
  const medGaps=activeQs().filter(q=>answers[q.id]===2).length;
  const gSc=GL.map(g=>{const s=gScore(g.id);return s?`${g.code} ${s.toFixed(1)}`:null;}).filter(Boolean).join(', ');
  const modeNote=scanMode==='simple'?` (Simple Diagnostic — 8 high-level questions)`:'';
  let posture='';
  if(cs<2.0) posture='The current posture reflects a fragmented compliance program with significant control design gaps. Foundational remediation should be prioritised before the next supervisory examination cycle. Enterprise integration is not yet present.';
  else if(cs<3.0) posture='Developing programs are inconsistently applied across the enterprise. Structural gaps in governance, integration, and measurement create examination exposure that isolated remediation workstreams will not resolve.';
  else if(cs<4.0) posture='Defined programs exist across most domains but lack the consistency, cross-domain integration, and measurement maturity OSFI now expects. Priority: framework integration, automation of evidence, and demonstrable enterprise coherence in board reporting.';
  else posture='The institution demonstrates a strong, well-managed compliance posture. Focus should shift toward continuous improvement, automation of monitoring, and industrializing evidence generation for examination cycles.';
  el.innerHTML=`<strong>${inst}</strong> achieves a composite maturity of <strong style="color:${sc(cs)}">${cs.toFixed(1)}/5.0 — ${label}</strong> across the integrated OSFI framework${modeNote}.${gSc?` By guideline: ${gSc}.`:''} The assessment identifies <strong>${highGaps} high-priority</strong> and <strong>${medGaps} medium-priority</strong> finding${(highGaps+medGaps)!==1?'s':''} requiring near-term remediation. ${posture}`;
}

// ═══════════════════════════════════════════
// OUTLOOK — opens Outlook directly
// ═══════════════════════════════════════════
function openOutlook(){
  const inst=document.getElementById('pInstitution')?.value||'';
  const role=document.getElementById('pRole')?.value||'';
  const type=document.getElementById('pType')?.value||'';
  const exam=document.getElementById('pExam')?.value||'';
  const eng=document.getElementById('cEngagement')?.value||'';
  const timeline=document.getElementById('cTimeline')?.value||'';
  const cs=composite();
  const lvl=cs?ML[Math.round(cs)]:'Incomplete';
  const mode=scanMode==='simple'?'Simple Diagnostic (8 questions)':'In-Depth Assessment (54 questions)';
  const scoreLns=GL.map(g=>{const s=gScore(g.id);return`  ${g.code}: ${s?s.toFixed(1)+'/5 ('+ML[Math.round(s)]+')':'Not rated'}`;}).join('\n');
  const gapLns=activeQs().filter(q=>answers[q.id]&&answers[q.id]<=2).map(q=>{const g=GL.find(x=>x.domains.some(d=>d.qs.includes(q)));return`  • [${g?.code}] ${q.ref} — ${answers[q.id]}/5`;}).slice(0,10).join('\n');
  const noteLns=Object.entries(notes).map(([qid,n])=>{if(!n)return null;const q=activeQs().find(x=>x.id===qid);return q?`  • ${q.ref}: ${n}`:null;}).filter(Boolean).join('\n');

  const to='advisory@yourfirm.ca';
  const subj=encodeURIComponent(`OSFI Convergence Readiness — ${inst||'Inquiry'} — ${eng||'Connect'}`);
  const body=encodeURIComponent(
`Hello,

${role?(role+(inst?' at '+inst:'')):(inst||'Our team')} is requesting a conversation regarding OSFI compliance readiness${eng?' — specifically: '+eng:''}.

═══════════════════════════════════════════
ASSESSMENT RESULTS
═══════════════════════════════════════════
Institution:      ${inst||'—'}
Type:             ${type||'—'}
Sponsor role:     ${role||'—'}
Exam timeline:    ${exam||'—'}
Mode:             ${mode}

Composite Score:  ${cs?cs.toFixed(1)+'/5.0 — '+lvl:'Incomplete'}

By Guideline:
${scoreLns}
${gapLns?'\nHigh/Medium Priority Gaps Identified:\n'+gapLns:''}
${noteLns?'\nAssessor Notes:\n'+noteLns:''}
═══════════════════════════════════════════
ENGAGEMENT REQUEST
═══════════════════════════════════════════
Engagement:       ${eng||'—'}
Timeline:         ${timeline||'—'}
Assessment date:  ${new Date().toLocaleDateString('en-CA')}
═══════════════════════════════════════════

We look forward to connecting.

${role?(role+(inst?'\n'+inst:'')):(inst||'')}
`);
  // Target Outlook specifically via ms-outlook protocol, fall back to mailto
  const outlookUrl=`ms-outlook://compose?to=${encodeURIComponent(to)}&subject=${subj}&body=${body}`;
  const mailtoUrl=`mailto:${to}?subject=${subj}&body=${body}`;
  // Try ms-outlook first (opens desktop Outlook), fall back to mailto
  const a=document.createElement('a');
  a.href=outlookUrl;
  a.click();
  // Fallback after short delay if ms-outlook not available
  setTimeout(()=>{window.location.href=mailtoUrl;},500);
}

// ═══════════════════════════════════════════
