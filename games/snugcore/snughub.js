var SNUGFMTS={
  cw:{name:'Crossword',tin:'cwtin',label:'Words and clues',hint:'word | clue',help:'One word per line: word | clue. From 2 to 40 words.',opts:'cw'},
  ws:{name:'Word search',tin:'cwtin',label:'Words and clues',hint:'word | clue',help:'One word per line: word | clue. Students find the words from the definitions.',opts:'cw'},
  ss:{name:'Sentence scramble',tin:'sstin',label:'Sentences',hint:'one per line',help:'One sentence per line. Students click the words into the right order.',opts:'ss'},
  lv:{name:'Level Up',tin:'lvtin',label:'Questions',hint:'question | right | wrong',help:'One question per line: the right answer first, then 1–3 wrong ones.',opts:'lv'}
};
function snugSetFmt(f){
  if(!SNUGFMTS[f])f='cw';
  var M=SNUGFMTS[f];snugFmt=f;snugStore('snugfmt',f);
  if(f==='cw'||f==='ws')snugCw.fmt=f;
  document.body.setAttribute('data-snugfmt',f);
  document.querySelectorAll('.snugfmt').forEach(function(b){var on=b.dataset.f===f;b.classList.toggle('is-on',on);b.setAttribute('aria-pressed',String(on));});
  ['cwtin','sstin','lvtin'].forEach(function(id){$(id).hidden=id!==M.tin;});
  $('snugtinlabel').textContent=M.label;$('snugtinlabel').setAttribute('for',M.tin);$('snugtinhint').textContent=M.hint;$('snughelptext').textContent=M.help;
  ['cw','ss','lv'].forEach(function(k){$(k+'opts').hidden=k!==M.opts;});
  $('cwhints').hidden=M.opts!=='cw';$('sshints').hidden=M.opts!=='ss';
  document.querySelector('.snugpill[data-e="cw"][data-k="ic"]').hidden=f==='ws';
  $('snuglooks').hidden=f==='lv';$('world-row').hidden=f!=='lv';$('snuglooklabel').textContent=f==='lv'?'Hero':'Look';
  $('snugtoptitle').textContent=M.name;document.title='SnugKit · '+M.name;
  $('snugsharepanel').hidden=true;
  snugEngine().check();
}
function snugSetLook(k){
  if(!SNUGLOOKS.some(function(x){return x[0]===k;}))return;
  var changed=k!==snugLook;snugLook=k;if(!snugLocked)snugStore('snuglook',k);
  snugRenderLooks();snugRenderTiles();snugApplyLook();if(changed)snugSound.restyle();
}

function snugMiniCw(k){return '<span class="cwprev" data-snuglook="'+k+'"><span class="cwwrap"><span class="cwgrid" style="--cwcols:3;--cwcs:20px"><span class="cwc is-ok"><span class="cwl">C</span></span><span class="cwc is-cur"><span class="cwl">A</span></span><span class="cwc in-word"><span class="cwl">T</span></span></span></span></span>';}
function snugRenderLooks(){
  var g=$('snuglooks');g.innerHTML='';
  SNUGLOOKS.forEach(function(st){
    var b=document.createElement('button');b.type='button';b.className='snuglook'+(st[0]===snugLook?' is-on':'');
    b.setAttribute('role','radio');b.setAttribute('aria-checked',String(st[0]===snugLook));
    b.innerHTML=snugMiniCw(st[0])+'<b>'+st[1]+'</b>';
    b.addEventListener('click',function(){snugSetLook(st[0]);});g.appendChild(b);
  });
}
function snugRenderTiles(){
  var L=snugLook,c=function(ch,cls){return '<span class="cwc'+(cls?' '+cls:'')+'"><span class="cwl">'+ch+'</span></span>';},x='<span class="cwx"></span>';
  $('snugprevcw').setAttribute('data-snuglook',L);
  $('snugprevcw').innerHTML='<span class="cwprev"><span class="cwwrap"><span class="cwgrid" style="--cwcols:4;--cwcs:21px">'+x+c('B','in-word')+x+x+c('C','is-ok')+c('A','is-cur')+c('T','is-ok')+x+x+c('G','in-word')+x+x+'</span></span></span>';
  $('snugprevws').setAttribute('data-snuglook',L);
  var letters='SUNKCATOPENRDOGL'.split(''),found={4:1,5:1,6:1},sel={0:1,1:1,2:1},h='';
  letters.forEach(function(ch,i){h+='<span class="cwc wsc'+(found[i]?' is-found':'')+(sel[i]?' is-sel':'')+'" style="--wsbg:hsl(160,62%,82%);--wsbd:hsl(160,62%,40%);--wstx:hsl(160,62%,18%)"><span class="cwl">'+ch+'</span></span>';});
  $('snugprevws').innerHTML='<span class="cwprev"><span class="cwwrap"><span class="cwgrid is-ws" style="--cwcols:4;--cwcs:16px">'+h+'</span></span></span>';
  $('snugprevss').setAttribute('data-snuglook',L);
  $('snugprevss').innerHTML='<span class="ssmini"><span class="sschip is-placed">The</span><span class="sschip is-placed">cat</span></span><span class="ssmini"><span class="sschip">sleeps</span><span class="sschip">on</span></span>';
  var lv=$('snugprevlv');lv.innerHTML='';lv.appendChild(snugLv.tile());
}

function snugOptsSync(){
  document.querySelectorAll('.snugpill').forEach(function(p){var on=!!SNUGENG[p.dataset.e].pills[p.dataset.k];p.classList.toggle('is-on',on);p.setAttribute('aria-pressed',String(on));});
  document.querySelectorAll('.snugtimer').forEach(function(t){
    var E=SNUGENG[t.dataset.e];t.classList.toggle('is-on',!!E.pills.tm);
    t.querySelector('.snugtimerval').textContent=snugTimeLabel(E.tsecs);
    t.querySelectorAll('.snugtimeropt').forEach(function(o){o.classList.toggle('is-on',+o.dataset.v===E.tsecs);});
  });
  [['#cwhintseg',snugCw],['#sshintseg',snugSs]].forEach(function(p){document.querySelectorAll(p[0]+' button').forEach(function(b){var on=+b.dataset.h===p[1].hlim;b.classList.toggle('is-on',on);b.setAttribute('aria-checked',String(on));});});
}
function snugTimeLabel(v){return v>=60?(v/60)+' min':v+' s';}
function snugBuildTimers(){
  document.querySelectorAll('.snugtimer').forEach(function(t){
    var E=SNUGENG[t.dataset.e];
    t.innerHTML='<button type="button" class="snugtimerbtn" aria-haspopup="listbox"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg><span class="snugtimerval"></span><span class="snugarr">&#9660;</span></button><div class="snugtimerdrop" role="listbox">'+E.times.map(function(v){return '<button type="button" class="snugtimeropt" data-v="'+v+'">'+snugTimeLabel(v)+'</button>';}).join('')+'</div>';
  });
}
document.addEventListener('click',function(e){
  var p=e.target.closest('.snugpill');
  if(p){var E=SNUGENG[p.dataset.e];E.pills[p.dataset.k]=!E.pills[p.dataset.k];snugOptsSync();return;}
  var tb=e.target.closest('.snugtimerbtn'),open=document.querySelectorAll('.snugtimer.is-open');
  if(tb){var tw=tb.parentNode,was=tw.classList.contains('is-open');open.forEach(function(o){o.classList.remove('is-open');});tw.classList.toggle('is-open',!was);return;}
  var to=e.target.closest('.snugtimeropt');
  if(to){SNUGENG[to.closest('.snugtimer').dataset.e].tsecs=+to.dataset.v;open.forEach(function(o){o.classList.remove('is-open');});snugOptsSync();return;}
  open.forEach(function(o){o.classList.remove('is-open');});
  var hb=e.target.closest('#cwhintseg button');
  if(hb){snugCw.hlim=+hb.dataset.h;snugOptsSync();}
  var sb=e.target.closest('#sshintseg button');
  if(sb){snugSs.hlim=+sb.dataset.h;snugOptsSync();}
});

function snugStart(){$('snugsharepanel').hidden=true;snugEngine().start();}
function snugCopyTemplate(){
  var b=$('snugtpl'),done=function(t){b.textContent=t;setTimeout(function(){b.textContent='Copy template';},1600);};
  try{navigator.clipboard.writeText(snugEngine().template).then(function(){done('Copied');},function(){done('Copy failed');});}catch{done('Copy failed');}
}
async function snugShare(){
  var status=$('snugsharestatus'),f=$('snugshareurl');$('snugsharepanel').hidden=false;f.value='';status.textContent='Creating link…';
  try{var r=snugEngine().share();f.value=await encodeTask(r.payload);status.textContent=r.note+' Link ready — copy it and send it to your students.';}
  catch(e){f.value='';status.textContent=e.message;}
}
async function snugCopyLink(){
  var f=$('snugshareurl');if(!f.value)return;f.select();
  try{await navigator.clipboard.writeText(f.value);$('snugsharestatus').textContent='Link copied.';}
  catch{$('snugsharestatus').textContent='Select the link above and copy it manually.';}
}
async function snugOpenShared(){
  try{
    var d=await decodeTask();if(!d)return;
    var k=d.k==='cw'?'cw':d.k==='ss'||(d.k===undefined&&Array.isArray(d.s))?'ss':['lv','snug','frog'].indexOf(d.k)>=0?'lv':null;
    if(!k)throw Error('Invalid assignment data.');
    var r=SNUGENG[k].load(d);
    snugApplyTheme(d.theme||'');
    snugLock();
    if(r.look)snugSetLook(r.look);
    snugSetFmt(r.fmt);snugOptsSync();snugStart();
  }catch(e){alert('Could not open assignment: '+e.message);}
}

(function snugInit(){
  var lk=snugStore('snuglook')||snugStore('snugcwset');if(lk==='papercraft')lk='kids';if(lk==='chalk')lk='vintage';
  if(SNUGLOOKS.some(function(x){return x[0]===lk;}))snugLook=lk;
  snugSetMode(snugStore('snugmode')==='dark'?'dark':'light',true);
  snugSound.sync();
  
  document.querySelectorAll('.snugfmt').forEach(function(b){b.addEventListener('click',function(){snugSetFmt(b.dataset.f);});});
  document.querySelectorAll('#snugmodeseg button').forEach(function(b){b.addEventListener('click',function(){snugSetMode(b.dataset.m);});});
  snugBuildTimers();snugRenderLooks();snugRenderTiles();snugOptsSync();
  snugSetFmt(snugStore('snugfmt')||'cw');
  show('snughub');
  snugOpenShared();
})();
