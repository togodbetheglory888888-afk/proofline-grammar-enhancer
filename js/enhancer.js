(function(global){"use strict";
const SYN={
good:["effective","strong","beneficial","positive","excellent"],
bad:["poor","weak","problematic","unfavorable","inadequate"],
important:["significant","essential","crucial","critical","notable"],
show:["demonstrate","illustrate","indicate","present","reveal"],
help:["assist","support","facilitate","guide","aid"],
use:["apply","employ","utilize","implement","adopt"],
make:["create","develop","produce","construct","form"],
get:["obtain","receive","achieve","acquire","secure"],
start:["begin","initiate","commence","launch","introduce"],
end:["conclude","finish","complete","terminate","close"],
many:["numerous","several","various","multiple","a large number of"],
students:["learners","pupils","schoolchildren","students","learners"],
teachers:["educators","instructors","teachers","faculty","teaching staff"],
problem:["issue","challenge","concern","difficulty","obstacle"],
idea:["concept","approach","notion","proposal","view"],
result:["outcome","finding","effect","consequence","result"],
change:["modify","alter","transform","adjust","revise"],
improve:["enhance","strengthen","develop","advance","refine"],
clear:["evident","explicit","straightforward","apparent","unambiguous"],
different:["distinct","varied","diverse","alternative","contrasting"],
need:["require","necessitate","demand","call for","depend on"],
helpful:["useful","beneficial","valuable","practical","supportive"],
important:["significant","essential","crucial","critical","notable"],
large:["substantial","considerable","extensive","significant","sizable"],
small:["limited","minor","modest","compact","slight"],
good:["effective","strong","beneficial","positive","excellent"],
bad:["poor","weak","problematic","unfavorable","inadequate"],
show:["demonstrate","illustrate","indicate","present","reveal"],
think:["consider","believe","reason","suppose","maintain"],
say:["state","mention","explain","express","remark"],
give:["provide","offer","supply","present","grant"],
find:["identify","discover","determine","observe","establish"],
useful:["helpful","valuable","practical","beneficial","effective"],
easy:["simple","straightforward","manageable","accessible","effortless"],
hard:["difficult","challenging","demanding","complex","rigorous"],
fast:["rapid","quick","swift","efficient","prompt"],
slow:["gradual","delayed","unhurried","measured","leisurely"],
smart:["intelligent","effective","capable","skilled","knowledgeable"],
clearer:["more evident","more explicit","more direct","more precise","more understandable"]
};
const PHRASES={"a lot of":"many","in order to":"to","due to the fact that":"because","at this point in time":"currently","make a decision":"decide","take into consideration":"consider","is able to":"can","for the purpose of":"to"};
function preserve(a,b){if(a===a.toUpperCase())return b.toUpperCase();if(/^[A-Z]/.test(a))return b[0].toUpperCase()+b.slice(1);return b}
function enhance(text,mode){let out=text,changes=[];Object.keys(PHRASES).sort((a,b)=>b.length-a.length).forEach(p=>{const re=new RegExp("\\b"+p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\b","gi");out=out.replace(re,m=>{const r=PHRASES[p];changes.push({from:m,to:r,reason:"More concise wording"});return r})});if(mode!=="simple")Object.keys(SYN).forEach(w=>{const re=new RegExp("\\b"+w+"\\b","gi");out=out.replace(re,m=>{const choices=SYN[w];const r=mode==="academic"||mode==="professional"?choices[0]:choices[0];if(m.toLowerCase()===r.toLowerCase())return m;changes.push({from:m,to:preserve(m,r),reason:"Vocabulary alternative"});return preserve(m,r)})});if(mode==="concise")out=out.replace(/\bvery\s+/gi,"").replace(/\breally\s+/gi,"");if(mode==="formal")out=out.replace(/\bcan't\b/gi,"cannot").replace(/\bdon't\b/gi,"do not").replace(/\bdoesn't\b/gi,"does not");return {text:out,changes:changes.slice(0,150)} }
function alternativesFor(word){
  const key=String(word||"").toLowerCase().replace(/[^a-z-]/g,"");
  return (SYN[key]||[]).filter((v,i,a)=>a.indexOf(v)===i).slice(0,5);
}
global.EnhancerEngine={enhance,alternativesFor,lexicon:SYN};})(typeof window!=="undefined"?window:globalThis);
