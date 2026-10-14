(function(g){
const STOP=new Set('the a an and or but of to in on at for with by from is are was were be been am it its this that these those as he she we they you i me my your his her our their them us not no do does did so if then than too very can will just'.split(' '));
function clean(t){return t.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/-\n(\w)/g,'$1').replace(/\s*\n\s*/g,' ').replace(/[|_~^`]+/g,' ').replace(/\s+/g,' ').trim();}
function sentences(text){const parts=text.split(/\n\s*\n/).flatMap(b=>clean(b).match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g)||[]);const seen=new Set(),out=[];
 for(let s of parts){s=s.trim();const w=s.match(/[A-Za-z]+/g)||[];if(w.length<3)continue;const letters=(s.match(/[A-Za-z]/g)||[]).length;if(letters/s.length<0.6)continue;const k=s.toLowerCase();if(!seen.has(k)){seen.add(k);out.push(s);}}return out;}
function words(text,skipStop=true){const seen=new Set(),out=[];for(let w of clean(text).match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)||[]){
 let lw=w.toLowerCase();if(lw.length===1&&lw!=='a'&&lw!=='i')continue;if(lw.includes("'"))continue;if(skipStop&&STOP.has(lw))continue;if(lw==='i')lw='I';if(!seen.has(lw)){seen.add(lw);out.push(lw);}}return out;}
function chars(s){return new Set([...s.replace(/[\s，。！？、,.!?；;：:“”"'（）()的了是]/g,'')]);}
function overlap(a,b){const A=chars(a),B=chars(b);if(!A.size||!B.size)return 1;let n=0;for(const c of A)if(B.has(c))n++;return n/Math.min(A.size,B.size);}
function stem(e){return e.toLowerCase().replace(/(ing|ed|es|s|ly)$/,'');}
function pickWrong(item,pool){ // pool: items with zh
 const ok=pool.filter(p=>p.zh&&p.en.toLowerCase()!==item.en.toLowerCase()&&p.zh!==item.zh&&!p.zh.includes(item.zh)&&!item.zh.includes(p.zh)&&stem(p.en)!==stem(item.en)&&overlap(p.zh,item.zh)<(item.type==='word'?0.01:0.35));
 if(!ok.length)return null;return ok[Math.floor(Math.random()*ok.length)];}
g.PE={sentences,words,pickWrong,overlap};
if(typeof module!=='undefined')module.exports=g.PE;
})(typeof window!=='undefined'?window:globalThis);
