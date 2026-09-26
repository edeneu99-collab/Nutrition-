/* ===== state ===== */
const KEY='nutrition-hub-v1';
const dflt=()=>({v:1,examDate:null,done:{},custom:[],names:{},notes:{},tags:{},scores:{},mocks:{},open:{},theme:'auto'});
let S=dflt();
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(dflt(),JSON.parse(r));}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,r=Math.random){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const fmtDate=d=>d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'});
const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)};

/* ===== derived data ===== */
const ALLQ={};
CH.forEach(c=>c.sections.forEach(s=>s.q.forEach((r,k)=>{ALLQ[s.id+'#'+k]={id:s.id+'#'+k,q:r[0],right:r[1],wrong:r.slice(2,5),expl:r[5],sec:s.id,ch:c.id}})));
const chQs=c=>c.sections.flatMap(s=>s.q.map((_,k)=>s.id+'#'+k));
function chItems(ids){return ids.map(id=>{const x=ALLQ[id];const opts=shuffle([x.right,...x.wrong]);return{id,q:x.q,o:opts,a:opts.indexOf(x.right),expl:x.expl}})}
const USABLE=BANK.filter(b=>!b.bad);
function bankItem(b){const L='ABCDE';return{id:'b'+b.n,q:esc(b.q),o:b.o.map(esc),a:b.a,expl:'Bank answer: '+L[b.a]+'. '+(b.note?esc(b.note)+' ':'')+'<br><span class="muted">Bank Q'+b.n+' · not from the summary; check flag below if any.</span>',flag:BFLAG[b.n],letters:true}}
const MOCKQ=shuffle(USABLE,rng(12345));
const OPENO=shuffle(OPEN,rng(777));
function mockDef(i){return{id:'m'+(i+1),name:'Mock '+(i+1),bank:MOCKQ.slice(i*10,i*10+10),open:[OPENO[(2*i)%17],OPENO[(2*i+1)%17]]}}
const MOCKS=Array.from({length:9},(_,i)=>mockDef(i));

/* ===== topics / plan ===== */
function topics(){return CH.map(c=>({id:c.id,ch:c,name:S.names[c.id]||('Ch. '+c.n+' · '+c.title)})).concat(S.custom.map(t=>({id:t.id,name:S.names[t.id]||t.name,custom:true})))}
function daysLeft(){if(!S.examDate)return null;const t=new Date();t.setHours(0,0,0,0);const e=new Date(S.examDate+'T12:00:00');e.setHours(0,0,0,0);return Math.round((e-t)/864e5)}
function ready(t){if(!t.ch)return'<span class="chip">no material yet</span>';const c=t.ch;const g=c.sections.reduce((n,s)=>n+(s.gap?s.gap.length:0),0);return`<span class="chip ok">reading ✓</span> <span class="chip ok">${chQs(c).length} MCQs</span> <span class="chip ok">oral ✓</span>`+(g?` <span class="chip warn">${g} gap note${g>1?'s':''}</span>`:'')}
function schedule(rem){const dl=daysLeft();const D=Math.max(1,dl===null?0:dl);const out=[];let idx=0;const base=Math.floor(rem.length/D),extra=rem.length%D;for(let k=0;k<D;k++){const n=rem.length<D?(k<rem.length?1:0):base+(k<extra?1:0);const d=new Date();d.setDate(d.getDate()+k);out.push({d,items:rem.slice(idx,idx+n)});idx+=n}return out}
function renderPlan(){
  const T=topics(),rem=T.filter(t=>!S.done[t.id]);const dl=daysLeft();
  let h=`<h2>Plan</h2><div class="card"><div class="row"><label>Exam date <input type="date" id="exDate" value="${S.examDate||''}"></label><span class="muted">or days left</span><input type="number" id="exDays" min="0" placeholder="days" aria-label="Days until exam"><button class="btn sm" id="exApply">Set</button>${S.examDate?'<button class="btn sm" id="exClear">Clear</button>':''}</div>`;
  h+=dl===null?'<p class="muted">Enter the exam date or number of days left and I will spread the topics still to do across the days ahead.</p>':`<p class="muted">${dl>0?dl+' study day'+(dl>1?'s':'')+' from today, exam on '+fmtDate(new Date(S.examDate+'T12:00:00')):'Exam is today or already passed: everything left is placed on today.'}. The plan is rebuilt from today every time you tick a topic or change the date.</p>`;
  h+='</div>';
  h+=`<div class="card"><h3 style="margin-top:0">Plan from today</h3>`;
  if(dl===null){h+='<p class="muted">No date yet.</p>'}
  else if(!rem.length){h+='<p>All topics ticked. Use the days left for mock exams and the shuffled chapter reviews.</p>'}
  else schedule(rem).forEach(x=>{h+=`<div class="day"><b>${fmtDate(x.d)}</b><div>${x.items.length?x.items.map(t=>esc(t.name)).join(' · '):'<span class="muted">Review, mock exam, tagged questions</span>'}</div></div>`});
  h+='</div>';
  h+=`<div class="card"><h3 style="margin-top:0">Topics</h3><p class="muted">Tick a topic when it is covered. Rename topics or add your own (saved on this device; use Export to keep them).</p>`;
  T.forEach(t=>{h+=`<div class="topic ${S.done[t.id]?'done':''}"><input type="checkbox" data-done="${t.id}" ${S.done[t.id]?'checked':''} aria-label="Covered: ${esc(t.name)}"><div style="flex:1"><div class="tn"><b>${esc(t.name)}</b></div><div>${ready(t)}</div><div class="row" style="margin-top:.3rem">${t.ch?`<button class="btn sm" data-open="${t.id}">Open reading</button>`:''}<button class="btn sm" data-ren="${t.id}">Rename</button>${t.custom?`<button class="btn sm" data-del="${t.id}">Delete</button>`:''}</div></div></div>`});
  h+=`<div class="row" style="margin-top:.8rem"><input id="newT" placeholder="New topic" style="flex:1;min-width:10rem;background:var(--card);border:1px solid var(--line);border-radius:8px;padding:.4rem .6rem"><button class="btn" id="addT">Add topic</button></div></div>`;
  h+=gapsPanel();
  $('#app').innerHTML=h;
}
function gapsPanel(){
  let a='',b='';
  CH.forEach(c=>c.sections.forEach(s=>(s.gap||[]).forEach(g=>{a+=`<li><b>${esc(s.id)}</b> — ${g}</li>`})));
  OPEN.filter(o=>o.g).forEach(o=>{a+=`<li><b>Open question</b> “${esc(o.t)}” — ${o.g}</li>`});
  Object.keys(BFLAG).forEach(n=>{b+=`<li><b>Bank Q${n}</b> — ${BFLAG[n]}</li>`});
  return `<details class="card"><summary><b>Gaps, discrepancies and unanswerable questions</b> <span class="chip warn">${a.split('<li>').length-1} materials · ${Object.keys(BFLAG).length} bank items</span></summary><h4>Materials</h4><ul class="muted">${a}</ul><h4>Past MCQ bank</h4><ul class="muted">${b}</ul></details>`}

/* ===== quiz engine ===== */
function quiz(host,items,setId,title,onExit){
  let i=0,score=0,wrong=[],locked=false;
  const tagBtns=id=>['review','hard'].map(t=>`<button class="btn sm" data-tag="${t}" aria-pressed="${(S.tags[id]||[]).includes(t)}">${(S.tags[id]||[]).includes(t)?'★ ':'☆ '}${t}</button>`).join(' ');
  function draw(){
    if(i>=items.length){
      const p=Math.round(100*score/items.length);const prev=S.scores[setId];
      S.scores[setId]={last:score,total:items.length,best:Math.max(score,prev?prev.best:0),date:iso(new Date())};save();
      host.innerHTML=`<div class="card"><h3 style="margin-top:0">${esc(title)} — finished</h3><div class="score">${score} / ${items.length}</div><p class="muted">${p}% · best ${S.scores[setId].best}/${items.length}</p>${wrong.length?'<h4>Missed</h4><ol>'+wrong.map(x=>`<li>${x.q}<br><span class="muted">Answer: ${x.o[x.a]}</span></li>`).join('')+'</ol>':'<p>No mistakes.</p>'}<div class="row"><button class="btn pri" data-act="again">Restart set</button>${wrong.length?'<button class="btn" data-act="redo">Redo missed</button>':''}</div></div>`;
      host.querySelector('[data-act=again]').onclick=()=>{items=items.map(x=>x.letters?x:Object.assign({},x));i=0;score=0;wrong=[];draw()};
      const r=host.querySelector('[data-act=redo]');if(r)r.onclick=()=>{items=wrong.slice();i=0;score=0;wrong=[];draw()};
      refreshSide();return}
    const x=items[i];locked=false;
    host.innerHTML=`<div class="card"><div class="row"><b>${esc(title)}</b><span class="muted">Question ${i+1} of ${items.length}</span></div><div class="bar"><div style="width:${100*i/items.length}%"></div></div><div class="q">${x.q}</div><div id="opts">${x.o.map((o,k)=>`<button class="opt" data-k="${k}">${x.letters?'<b>'+'ABCDE'[k]+'.</b> ':''}${o}</button>`).join('')}</div><div id="fb"></div></div>`;
    host.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(locked)return;locked=true;const k=+b.dataset.k;const ok=k===x.a;if(ok)score++;else wrong.push(x);
      host.querySelectorAll('.opt').forEach((e,j)=>{e.disabled=true;if(j===x.a)e.classList.add('ok');else if(j===k)e.classList.add('no')});
      $('#fb',host).innerHTML=`<div class="expl"><b>${ok?'Correct.':'Not quite.'}</b> ${x.expl||''}</div>${x.flag?`<div class="gap">${x.flag}</div>`:''}<div class="row">${tagBtns(x.id)}<span style="flex:1"></span><button class="btn pri" id="nx">${i+1<items.length?'Next':'See score'}</button></div>`;
      $('#nx',host).focus();$('#nx',host).onclick=()=>{i++;draw()};
      host.querySelectorAll('[data-tag]').forEach(tb=>tb.onclick=()=>{const t=tb.dataset.tag;const a=S.tags[x.id]||[];S.tags[x.id]=a.includes(t)?a.filter(y=>y!==t):a.concat(t);if(!S.tags[x.id].length)delete S.tags[x.id];save();tb.setAttribute('aria-pressed',(S.tags[x.id]||[]).includes(t));tb.textContent=((S.tags[x.id]||[]).includes(t)?'★ ':'☆ ')+t})});
  }
  draw();
}

/* ===== read tab ===== */
let R={ch:0,sec:'0',tab:'plan'};
function secKey(c,s){return c.id+'|'+s.id}
function refreshSide(){const s=$('#side');if(s)s.innerHTML=sideHtml()}
function sideHtml(){
  const sc=id=>S.scores[id]?`<span class="chip ok">${S.scores[id].best}/${S.scores[id].total}</span>`:'';
  let h='';
  CH.forEach((c,ci)=>{h+=`<details ${ci===R.ch?'open':''}><summary>${c.n}. ${esc(c.title)}</summary>`;
    c.sections.forEach((s,si)=>{h+=`<a tabindex="0" role="link" data-go="${ci}|${si}" ${R.ch===ci&&R.sec==String(si)?'aria-current="true"':''}><span>${esc(s.id)} ${esc(s.t.replace(/^[\d.]+[a-c]?\s*/,'').replace(/^Chapter \d+ (opening|\(no subchapters\))[:\s]*/,'Opening: ').slice(0,44))}</span>${sc('sec:'+s.id)}</a>`});
    h+=`<a tabindex="0" role="link" data-go="${ci}|rev" ${R.ch===ci&&R.sec==='rev'?'aria-current="true"':''}><span>★ Chapter review + oral</span>${sc('rev:'+c.id)}</a></details>`});
  h+=`<div style="border-top:1px solid var(--line);padding-top:.5rem"><button class="btn sm" id="tagRev">Quiz my tagged questions (${Object.keys(S.tags).filter(k=>ALLQ[k]).length})</button></div>`;
  return h}
function renderRead(){
  $('#app').innerHTML=`<div class="layout"><aside class="side" id="side">${sideHtml()}</aside><section id="content"></section></div>`;
  showSection();
}
function wrapTables(el){el.querySelectorAll('.read table').forEach(t=>{if(t.parentNode.className!=='tw'){const w=document.createElement('div');w.className='tw';t.parentNode.insertBefore(w,t);w.appendChild(t)}})}
function showSection(){
  const c=CH[R.ch];const host=$('#content');
  if(R.sec==='tagged'){host.innerHTML='<div id="qz"></div>';const ids=Object.keys(S.tags).filter(k=>ALLQ[k]);if(!ids.length){host.innerHTML='<div class="card">No tagged questions yet. Tag ★ review or ★ hard after answering a question.</div>';return}quiz($('#qz'),chItems(shuffle(ids)),'tagged','Tagged questions');return}
  if(R.sec==='rev'){
    host.innerHTML=`<h2>${c.n}. ${esc(c.title)} — review</h2><p class="muted">All ${chQs(c).length} questions of the chapter, shuffled, then one oral-style prompt.</p><div id="qz"><button class="btn pri" id="startRev">Start shuffled review</button></div><h3>Oral-style prompt</h3><div class="card read"><p><b>${esc(c.oral.q)}</b></p><details class="rev"><summary>Reveal model answer</summary>${c.oral.a}<p class="muted"><b>Source:</b> ${esc(c.oral.s)}</p></details></div>`;
    wrapTables(host);$('#startRev').onclick=()=>quiz($('#qz'),chItems(shuffle(chQs(c))),'rev:'+c.id,'Chapter '+c.n+' review');return}
  const s=c.sections[+R.sec];
  host.innerHTML=`<h2>${esc(s.t)}</h2><p class="muted">Source: summary ${esc(s.p)}. Condensed and restructured from your summary; nothing added from outside.</p><div class="read">${s.html}</div>${(s.gap||[]).map(g=>`<div class="gap"><b>Gap / discrepancy:</b> ${g}</div>`).join('')}<h4>My notes</h4><textarea id="note" aria-label="Notes for this section" placeholder="Your notes (saved on this device)">${esc(S.notes[secKey(c,s)]||'')}</textarea><h3>Check: ${s.q.length} questions</h3><div id="qz"><button class="btn pri" id="startQ">Start quiz</button> ${S.scores['sec:'+s.id]?`<span class="muted">Best ${S.scores['sec:'+s.id].best}/${S.scores['sec:'+s.id].total}</span>`:''}</div>`;
  wrapTables(host);
  $('#note').oninput=e=>{S.notes[secKey(c,s)]=e.target.value;save()};
  $('#startQ').onclick=()=>quiz($('#qz'),chItems(shuffle(s.q.map((_,k)=>s.id+'#'+k))),'sec:'+s.id,s.id+' check');
  window.scrollTo(0,0);
}

/* ===== mock tab ===== */
function renderMock(){
  let h='<h2>Mock exams</h2><p class="muted">Format: 10 MCQ (+2 correct, −0.5 wrong, blank 0) + 2 open questions (5 points each, self-graded against the model answer) = 30 points. MCQs come from your past-MCQ bank in its original wording; open questions from your list of 17, with model answers written from the summary.</p><div class="card"><div class="row">';
  MOCKS.forEach(m=>{const r=S.mocks[m.id];h+=`<button class="btn" data-mock="${m.id}">${m.name}${r?` · ${r.total}/30`:''}</button>`});
  h+=`<button class="btn pri" data-mock="rand">New random mock</button></div></div><div id="mk"></div>`;
  h+='<h3>All open questions with model answers</h3>';
  OPEN.forEach(o=>{h+=`<details class="rev"><summary>${esc(o.t)} <span class="chip">${esc(o.topic)}</span>${o.g?' <span class="chip warn">gap</span>':''}</summary><div class="read">${o.a}<p class="muted"><b>Source:</b> ${esc(o.s)}</p>${o.g?`<div class="gap">${o.g}</div>`:''}</div><h4>My version</h4><textarea data-oa="${o.id}" aria-label="My answer: ${esc(o.t)}">${esc(S.open[o.id]||'')}</textarea></details>`});
  $('#app').innerHTML=h;wrapTables($('#app'));
  $('#app').querySelectorAll('[data-oa]').forEach(t=>t.oninput=e=>{S.open[t.dataset.oa]=e.target.value;save()});
}
function runMock(def){
  const host=$('#mk');const sel=Array(def.bank.length).fill(null);
  const items=def.bank.map(bankItem);
  let h=`<div class="card"><h3 style="margin-top:0">${def.name}</h3><h4>Part A · MCQ</h4>`;
  items.forEach((x,i)=>{h+=`<div class="mq"><div class="q"><b>${i+1}.</b> ${x.q}</div>${x.o.map((o,k)=>`<button class="opt" data-q="${i}" data-k="${k}"><b>${'ABCDE'[k]}.</b> ${o}</button>`).join('')}<div id="mf${i}"></div></div>`});
  h+=`<h4>Part B · Open questions</h4>`;
  def.open.forEach((o,j)=>{h+=`<div class="mq"><div class="q"><b>Q${j+1}.</b> ${esc(o.t)} <span class="muted">(5 points)</span></div><textarea data-oa="${o.id}" aria-label="Answer ${esc(o.t)}" placeholder="Write your answer">${esc(S.open[o.id]||'')}</textarea><details class="rev"><summary>Reveal model answer</summary><div class="read">${o.a}<p class="muted"><b>Source:</b> ${esc(o.s)}</p>${o.g?`<div class="gap">${o.g}</div>`:''}</div></details><label>Your self-grade (0–5) <input type="number" min="0" max="5" step="0.5" data-gr="${j}"></label></div>`});
  h+=`<div class="row"><button class="btn pri" id="fin">Finish and score</button></div><div id="res"></div></div>`;
  host.innerHTML=h;wrapTables(host);
  host.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const i=+b.dataset.q,k=+b.dataset.k;if(host.dataset.done)return;sel[i]=sel[i]===k?null:k;host.querySelectorAll(`.opt[data-q="${i}"]`).forEach(e=>e.classList.toggle('sel',+e.dataset.k===sel[i]))});
  host.querySelectorAll('[data-oa]').forEach(t=>t.oninput=e=>{S.open[t.dataset.oa]=e.target.value;save()});
  $('#fin').onclick=()=>{
    host.dataset.done='1';let right=0,bad=0,blank=0;
    items.forEach((x,i)=>{host.querySelectorAll(`.opt[data-q="${i}"]`).forEach((e,k)=>{e.disabled=true;if(k===x.a)e.classList.add('ok');else if(k===sel[i])e.classList.add('no')});
      if(sel[i]===null)blank++;else if(sel[i]===x.a)right++;else bad++;
      $('#mf'+i).innerHTML=`<div class="expl">${x.expl}</div>${x.flag?`<div class="gap">${x.flag}</div>`:''}`});
    const mcq=right*2-bad*0.5;let op=0;host.querySelectorAll('[data-gr]').forEach(g=>{op+=Math.min(5,Math.max(0,parseFloat(g.value)||0))});
    const total=mcq+op;if(S.mocks[def.id]||def.id.startsWith('m')){S.mocks[def.id]={date:iso(new Date()),mcq,open:op,total};save()}
    $('#res').innerHTML=`<div class="card"><div class="score">${total} / 30</div><p class="muted">MCQ ${mcq}/20 (${right} correct, ${bad} wrong, ${blank} blank) · open ${op}/10 (self-graded). Reveal the model answers above, then update the self-grades and press Finish again.</p></div>`;
    host.dataset.done='';
  };
}

/* ===== export / import ===== */
function dlg(html){$('#dlgBody').innerHTML=html;const d=$('#dlg');if(!d.open)d.showModal();$('#dlgBody').querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close())}
function doExport(){
  const json=JSON.stringify(S,null,2);const fname='nutrition-hub-export-'+iso(new Date())+'.json';
  try{
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=fname;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1000);
  }catch(e){
    dlg(`<h3 style="margin-top:0">Export</h3><p class="muted">Direct download didn't work here. Copy this text into a file named ${fname} and keep it.</p><textarea id="ex" readonly style="min-height:10rem">${esc(json)}</textarea><div class="row" style="margin-top:.6rem"><button class="btn pri" id="cp">Copy</button><button class="btn" data-close>Close</button></div>`);
    $('#cp').onclick=()=>{const t=$('#ex');t.select();try{navigator.clipboard.writeText(t.value)}catch(e2){document.execCommand&&document.execCommand('copy')}};
  }
}
function applyImport(txt){
  try{const o=JSON.parse(txt);if(!o||typeof o!=='object'||o.v!==1)throw new Error('Not a hub export');S=Object.assign(dflt(),o);save();$('#dlg').close();/* ===== PWA: service worker + install prompt ===== */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{})});
}
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredInstall=e;const b=$('#btnInstall');if(b)b.hidden=false});
window.addEventListener('appinstalled',()=>{deferredInstall=null;const b=$('#btnInstall');if(b)b.hidden=true});
const btnInstall=$('#btnInstall');
if(btnInstall)btnInstall.onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;btnInstall.hidden=true};

applyTheme();render();}
  catch(e){const m=$('#impmsg');if(m)m.textContent='Could not read that file: '+e.message}
}
function doImport(){
  dlg(`<h3 style="margin-top:0">Import</h3><p class="muted">Choose a JSON export or paste its text. This replaces the data saved on this device.</p><div class="row"><button class="btn" id="pick">Choose file…</button></div><textarea id="imp" style="margin-top:.6rem" placeholder="…or paste JSON here"></textarea><p id="impmsg" class="muted"></p><div class="row"><button class="btn pri" id="go">Import pasted text</button><button class="btn" data-close>Cancel</button></div>`);
  $('#pick').onclick=()=>$('#file').click();$('#go').onclick=()=>applyImport($('#imp').value);
}
$('#file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>applyImport(r.result);r.readAsText(f);e.target.value=''};

/* ===== theme, tabs, events ===== */
function applyTheme(){const h=document.documentElement;if(S.theme==='auto')h.removeAttribute('data-theme');else h.setAttribute('data-theme',S.theme);$('#btnTheme').textContent='Theme: '+S.theme}
$('#btnTheme').onclick=()=>{S.theme={auto:'light',light:'dark',dark:'auto'}[S.theme]||'auto';save();applyTheme()};
$('#btnExport').onclick=doExport;$('#btnImport').onclick=doImport;
function render(){
  document.querySelectorAll('.tab').forEach(t=>t.setAttribute('aria-selected',t.dataset.tab===R.tab));
  if(R.tab==='plan')renderPlan();else if(R.tab==='read')renderRead();else renderMock();
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{R.tab=t.dataset.tab;render();window.scrollTo(0,0)});
$('#app').addEventListener('click',e=>{
  const t=e.target.closest('[data-go],[data-done],[data-open],[data-ren],[data-del],[data-mock],#exApply,#exClear,#addT,#tagRev');if(!t)return;
  if(t.dataset.go){const[a,b]=t.dataset.go.split('|');R.ch=+a;R.sec=b;renderRead()}
  else if(t.id==='tagRev'){R.sec='tagged';showSection();refreshSide()}
  else if(t.dataset.open){R.ch=CH.findIndex(c=>c.id===t.dataset.open);R.sec='0';R.tab='read';render()}
  else if(t.dataset.ren){const n=prompt('Topic name',(topics().find(x=>x.id===t.dataset.ren)||{}).name||'');if(n){S.names[t.dataset.ren]=n;save();renderPlan()}}
  else if(t.dataset.del){S.custom=S.custom.filter(x=>x.id!==t.dataset.del);delete S.done[t.dataset.del];save();renderPlan()}
  else if(t.dataset.mock){const id=t.dataset.mock;const def=id==='rand'?{id:'rand',name:'Random mock',bank:shuffle(USABLE).slice(0,10),open:shuffle(OPEN).slice(0,2)}:MOCKS.find(m=>m.id===id);runMock(def);$('#mk').scrollIntoView({behavior:'smooth'})}
  else if(t.id==='exApply'){const d=$('#exDate').value,n=$('#exDays').value;if(n!==''){const x=new Date();x.setDate(x.getDate()+parseInt(n,10));S.examDate=iso(x)}else if(d)S.examDate=d;save();renderPlan()}
  else if(t.id==='exClear'){S.examDate=null;save();renderPlan()}
  else if(t.id==='addT'){const v=$('#newT').value.trim();if(v){S.custom.push({id:'x'+Date.now(),name:v});save();renderPlan()}}
});
$('#app').addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.done){S.done[t.dataset.done]=t.checked;save();renderPlan()}});
$('#app').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-go]')){e.preventDefault();e.target.click()}});
/* ===== PWA: service worker + install prompt ===== */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{})});
}
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredInstall=e;const b=$('#btnInstall');if(b)b.hidden=false});
window.addEventListener('appinstalled',()=>{deferredInstall=null;const b=$('#btnInstall');if(b)b.hidden=true});
const btnInstall=$('#btnInstall');
if(btnInstall)btnInstall.onclick=async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;btnInstall.hidden=true};

applyTheme();render();
