// Client-side keyless translation (en->zh-CN). Returns null for failures; never invents.
(function(){
const B='https://translate.googleapis.com/translate_a/';
const ok=(x,c)=>x&&x.trim()&&x.trim().toLowerCase()!==c.trim().toLowerCase()?x:null;
async function single(t){const r=await fetch(B+'single?client=gtx&sl=en&tl=zh-CN&dt=t&q='+encodeURIComponent(t));if(!r.ok)throw 0;const j=await r.json();return (j[0]||[]).map(s=>s[0]||'').join('')||null}
async function batchT(chunk){const r=await fetch(B+'t?client=gtx&sl=en&tl=zh-CN',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:chunk.map(t=>'q='+encodeURIComponent(t)).join('&')});if(!r.ok)throw 0;let j=await r.json();if(chunk.length===1&&typeof j==='string')j=[j];j=j.map(x=>typeof x==='string'?x:(x&&x[0])||null);if(j.length!==chunk.length)throw 0;return j}
async function translateAll(texts){texts=texts.map(t=>String(t).slice(0,500));const out=new Array(texts.length).fill(null);
 for(let i=0;i<texts.length;i+=40){const c=texts.slice(i,i+40);try{(await batchT(c)).forEach((x,k)=>out[i+k]=ok(x,c[k]))}catch(_){}}
 const miss=out.map((x,i)=>x?null:i).filter(i=>i!==null);let p=0;
 async function worker(){while(p<miss.length){const i=miss[p++];try{out[i]=ok(await single(texts[i]),texts[i])}catch(_){}}}
 await Promise.all(Array.from({length:4},worker));return out}
window.PETranslate=translateAll;})();
