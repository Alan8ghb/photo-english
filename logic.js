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
g.PE={sentences,words,wordInfo,pickWrong,overlap};
if(typeof module!=='undefined')module.exports=g.PE;
})(typeof window!=='undefined'?window:globalThis);
