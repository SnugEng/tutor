function snugSetFmt(f){var names={cw:'Crossword',ws:'Word search',ss:'Sentence scramble',lv:'Level Up'};if(!names[f])throw Error('Invalid activity.');snugFmt=f;if(f==='cw'||f==='ws')snugCw.fmt=f;document.body.setAttribute('data-snugfmt',f);document.title='SnugKit · '+names[f];}
function snugSetLook(k){snugLook=SNUGLOOKS.some(function(x){return x[0]===k;})?k:'classic';snugApplyLook();}
var snugLoad=0;
function snugNotFound(){stopT();snugSound.musicStop();location.replace(new URL('404.html',location.href).href);}
async function snugOpenAssignment(){
  var req=++snugLoad;stopT();snugSound.musicStop();snugEngine().stop();show('snugmessage');
  try{
    var d=await decodeTask();if(req!==snugLoad)return;
    if(!d||typeof d!=='object'||Array.isArray(d))throw Error('Invalid assignment.');
    var k=d.k==='cw'?'cw':d.k==='ss'||(d.k===undefined&&Array.isArray(d.s))?'ss':['lv','snug','frog'].indexOf(d.k)>=0?'lv':null;
    if(!k)throw Error('Invalid activity.');
    var r=SNUGENG[k].load(d);snugApplyTheme(d.theme||'');snugLook='classic';if(r.look)snugSetLook(r.look);
    snugLock();snugSetFmt(r.fmt);snugEngine().start();
  }catch(e){if(req===snugLoad)snugNotFound();}
}
snugSound.sync();window.addEventListener('hashchange',snugOpenAssignment);snugOpenAssignment();
