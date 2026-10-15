(function(g){
const STOP=new Set('the a an and or but of to in on at for with by from is are was were be been am it its this that these those as he she we they you i me my your his her our their them us not no do does did so if then than too very can will just'.split(' '));
function clean(t){return t.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/-\n(\w)/g,'$1').replace(/\s*\n\s*/g,' ').replace(/[|_~^`]+/g,' ').replace(/\s+/g,' ').trim();}
function sentences(text){const parts=text.split(/\n\s*\n/).flatMap(b=>clean(b).match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g)||[]);const seen=new Set(),out=[];
 for(let s of parts){s=s.trim();const w=s.match(/[A-Za-z]+/g)||[];if(w.length<3)continue;const letters=(s.match(/[A-Za-z]/g)||[]).length;if(letters/s.length<0.6)continue;const k=s.toLowerCase();if(!seen.has(k)){seen.add(k);out.push(s);}}return out;}
// wordInfo: keeps original case. Dedupe case-insensitively; lowercase form wins if ever seen lowercase.
function wordInfo(text,skipStop=true){const m={},order=[];const t=clean(text);const re=/[A-Za-z]+(?:'[A-Za-z]+)?/g;let x;
 while((x=re.exec(t))){const w=x[0];let lw=w.toLowerCase();if(lw.length===1&&lw!=='a'&&lw!=='i')continue;if(lw.includes("'"))continue;if(skipStop&&STOP.has(lw))continue;
  const before=t.slice(0,x.index).replace(/["'(\[\s]+$/,'');const initial=!before||/[.!?:]$/.test(before);
  const cap=/^[A-Z]/.test(w);let e=m[lw];if(!e){e=m[lw]={lower:false,capMid:false,capInit:false,form:w};order.push(lw)}
  if(!cap)e.lower=true;else if(initial)e.capInit=true;else{e.capMid=true;if(!/^[A-Z]/.test(e.form)||e.form===e.form.toUpperCase()&&w!==w.toUpperCase())e.form=w}}
 return order.map(lw=>{const e=m[lw];if(lw==='i')return{en:'I',proper:false};
  if(e.lower)return{en:lw,proper:false};
  let en=e.form;if(en.length>1&&en===en.toUpperCase()&&!e.capMid)en=en[0]+en.slice(1).toLowerCase();
  return{en,proper:e.capMid||!STOP.has(lw)&&e.capInit&&!COMMON.has(lw)}})}
// common words that are often sentence-initial but not names
const COMMON=new Set('what when where why how who there here today yesterday tomorrow please yes hello hi now some many all every one two after before while because although once there'.split(' '));
function words(text,skipStop=true){return wordInfo(text,skipStop).map(w=>w.en)}
function chars(s){return new Set([...s.replace(/[\s，。！？、,.!?；;：:“”"'（）()的了是]/g,'')]);}
function overlap(a,b){const A=chars(a),B=chars(b);if(!A.size||!B.size)return 1;let n=0;for(const c of A)if(B.has(c))n++;return n/Math.min(A.size,B.size);}
function stem(e){return e.toLowerCase().replace(/(ing|ed|es|s|ly)$/,'');}
function pickWrong(item,pool){ // pool: items with zh
 let ok=pool.filter(p=>p.zh&&p.en.toLowerCase()!==item.en.toLowerCase()&&p.zh!==item.zh&&!p.zh.includes(item.zh)&&!item.zh.includes(p.zh)&&stem(p.en)!==stem(item.en)&&overlap(p.zh,item.zh)<(item.type==='word'?0.01:0.35));
 if(item.proper){const np=ok.filter(p=>!p.proper);if(np.length)ok=np}
 if(!ok.length)return null;return ok[Math.floor(Math.random()*ok.length)];}

// ---- OCR junk filtering ----
const SHORT=new Set('i a an am is at on in to of it he me my we us up no go do so or by be if as oh ok hi mr mrs dr ms'.split(' '));
const NOVOWEL_OK=new Set('by my mr mrs dr ms why shy sky fly try dry cry gym hymn rhythm'.split(' '));
let DICT=null;function setDict(list){DICT=new Set((Array.isArray(list)?list:String(list).split(/\s+/)).map(w=>w.trim().toLowerCase()).filter(Boolean))}
function wordOK(raw,conf){const w=raw.replace(/^[^A-Za-z]+|[^A-Za-z']+$/g,'');if(!/^[A-Za-z]+(?:'[A-Za-z]+)?$/.test(w))return null;const lw=w.toLowerCase().replace(/'.*$/,'');
 if(conf<70)return null;
 if(lw.length<=2)return SHORT.has(lw)?w:null;
 if(!/[aeiouy]/.test(lw)&&!NOVOWEL_OK.has(lw))return null;
 if(/^[A-Z]{2,4}$/.test(w)&&conf<=85&&!(DICT&&DICT.has(lw)))return null;
 if(/(.)\1\1/.test(lw))return null;
 if(DICT&&!DICT.has(lw)){const base=lw.replace(/(ies|es|s|ed|ing|ly|er|est)$/,'');
  if(!(DICT.has(base)||DICT.has(base+'e')||DICT.has(base+'y'))){ // keep Capitalized proper nouns with high conf only
   if(!(/^[A-Z][a-zA-Z]*$/.test(w)&&conf>=85&&lw.length>=3))return null}}
 return w}
// data: tesseract result.data. Returns {text, good, total, meanConf}
function filterOCR(data){const out=[];let good=0,total=0,cs=0;
 const paras=(data.paragraphs&&data.paragraphs.length)?data.paragraphs:[{lines:data.lines||[{words:data.words||[]}]}];
 for(const p of paras){const pl=[];for(const ln of (p.lines||[])){const ws=(ln.words||[]).filter(x=>/[A-Za-z]/.test(x.text));if(!ws.length)continue;
   const kept=[];for(const x of ws){total++;cs+=x.confidence||0;const k=wordOK(x.text,x.confidence||0);if(k){if(k.length>=3)good++;kept.push(k)}}
   // keep any line that has at least one solid word; drop lines that are mostly junk for sentence extraction
   if(kept.length&&(kept.length>=2||kept.some(w=>w.length>=4)))pl.push(kept.join(' '))}
  if(pl.length)out.push(pl.join('\n'))}
 // also collect orphan high-conf words if structure missing
 if(!out.length&&data.words){const kept=[];for(const x of data.words){total++;cs+=x.confidence||0;const k=wordOK(x.text,x.confidence||0);if(k&&k.length>=3){good++;kept.push(k)}}if(kept.length)out.push(kept.join(' '))}
 return{text:out.join('\n\n'),good,total,meanConf:total?cs/total:0}}
function orientScore(data){const f=filterOCR(data);return f.good*100+f.meanConf+(f.text.match(/[A-Za-z]{4,}/g)||[]).length*5}
// Auto-orientation. rotate(img,deg)->img; recognize(img)->data; small(img)->downscaled img
async function autoOCR(img,{rotate,recognize,small,progress=()=>{}}){const sm=small(img);let best={deg:0,score:-1};
 for(const deg of [0,90,270,180]){progress('正在判断方向… '+deg+'°');const d=await recognize(deg?rotate(sm,deg):sm);const sc=orientScore(d);
  if(sc>best.score)best={deg,score:sc,data:d};if(deg===0&&filterOCR(d).good>=5)break}
 progress('正在识别文字…');const full=best.deg?rotate(img,best.deg):img;const data=await recognize(full,true);return{deg:best.deg,img:full,data,...filterOCR(data)}}
g.PE={sentences,words,wordInfo,pickWrong,overlap,setDict,wordOK,filterOCR,autoOCR};
if(typeof module!=='undefined')module.exports=g.PE;
})(typeof window!=='undefined'?window:globalThis);
