(function(global){"use strict";
/* Proofline V3 — offline rule-based grammar engine.
   Focus: high-confidence agreement, especially NUMBER/QUANTITY + VERB. */

const WORDS={
 be:{past:"was/were",third:"is",base:"be"},have:{past:"had",third:"has",base:"have"},do:{past:"did",third:"does",base:"do"},
 go:{past:"went",third:"goes",base:"go"},say:{past:"said",third:"says",base:"say"},make:{past:"made",third:"makes",base:"make"},see:{past:"saw",third:"sees",base:"see"},take:{past:"took",third:"takes",base:"take"},know:{past:"knew",third:"knows",base:"know"},think:{past:"thought",third:"thinks",base:"think"},come:{past:"came",third:"comes",base:"come"},give:{past:"gave",third:"gives",base:"give"},find:{past:"found",third:"finds",base:"find"},tell:{past:"told",third:"tells",base:"tell"},become:{past:"became",third:"becomes",base:"become"},write:{past:"wrote",third:"writes",base:"write"},eat:{past:"ate",third:"eats",base:"eat"},buy:{past:"bought",third:"buys",base:"buy"},run:{past:"ran",third:"runs",base:"run"},bring:{past:"brought",third:"brings",base:"bring"},read:{past:"read",third:"reads",base:"read"},teach:{past:"taught",third:"teaches",base:"teach"},study:{past:"studied",third:"studies",base:"study"},try:{past:"tried",third:"tries",base:"try"},carry:{past:"carried",third:"carries",base:"carry"},watch:{past:"watched",third:"watches",base:"watch"},fix:{past:"fixed",third:"fixes",base:"fix"},pass:{past:"passed",third:"passes",base:"pass"},attend:{third:"attends",base:"attend"},learn:{third:"learns",base:"learn"},work:{third:"works",base:"work"},play:{third:"plays",base:"play"},help:{third:"helps",base:"help"},use:{third:"uses",base:"use"},need:{third:"needs",base:"need"},want:{third:"wants",base:"want"},like:{third:"likes",base:"like"},live:{third:"lives",base:"live"},open:{third:"opens",base:"open"},close:{third:"closes",base:"close"},complete:{third:"completes",base:"complete"},create:{third:"creates",base:"create"},include:{third:"includes",base:"include"},provide:{third:"provides",base:"provide"},support:{third:"supports",base:"support"},improve:{third:"improves",base:"improve"},explain:{third:"explains",base:"explain"},show:{third:"shows",base:"show"},lead:{third:"leads",base:"lead"},move:{third:"moves",base:"move"},start:{third:"starts",base:"start"},continue:{third:"continues",base:"continue"},consider:{third:"considers",base:"consider"},develop:{third:"develops",base:"develop"},discuss:{third:"discusses",base:"discuss"},answer:{third:"answers",base:"answer"},ask:{third:"asks",base:"ask"},follow:{third:"follows",base:"follow"},prepare:{third:"prepares",base:"prepare"},remember:{third:"remembers",base:"remember"},require:{third:"requires",base:"require"},return:{third:"returns",base:"return"},seem:{third:"seems",base:"seem"},talk:{third:"talks",base:"talk"},understand:{third:"understands",base:"understand"},visit:{third:"visits",base:"visit"},wait:{third:"waits",base:"wait"},walk:{third:"walks",base:"walk"},believe:{third:"believes",base:"believe"},choose:{third:"chooses",base:"choose"},clean:{third:"cleans",base:"clean"},change:{third:"changes",base:"change"},check:{third:"checks",base:"check"},compare:{third:"compares",base:"compare"},decide:{third:"decides",base:"decide"},finish:{third:"finishes",base:"finish"},hope:{third:"hopes",base:"hope"},listen:{third:"listens",base:"listen"},look:{third:"looks",base:"look"},plan:{third:"plans",base:"plan"},save:{third:"saves",base:"save"},use:{third:"uses",base:"use"}
};
const singularPronouns=new Set(["he","she","it"]), pluralPronouns=new Set(["i","you","we","they"]);
const singularNouns=new Set(["student","teacher","child","learner","pupil","person","man","woman","book","lesson","class","school","program","project","research","study","result","problem","member","participant","employee","worker","parent","school","amount","number"]);
const pluralNouns=new Set(["students","teachers","children","learners","pupils","people","men","women","books","lessons","classes","schools","programs","projects","results","problems","members","participants","employees","workers","parents"]);
const uncountable=new Set(["advice","information","equipment","furniture","homework","research","knowledge","feedback","evidence","progress","traffic","luggage","money","water","rice","time","education"]);
const irregularPlural={child:"children",person:"people",man:"men",woman:"women",mouse:"mice",foot:"feet",tooth:"teeth",goose:"geese"};
const numberWords={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,hundred:100,thousand:1000,million:1000000,billion:1000000000};
const quantityPlural=new Set(["many","several","few","numerous","both","various","numerous"]);
const quantitySingular=new Set(["each","every","either","neither"]);
const determiners=new Set(["the","a","an","this","that","these","those","my","your","his","her","its","our","their"]);
const auxiliaries=new Set(["is","are","am","was","were","be","been","being","has","have","had","do","does","did"]);
const modals=new Set(["can","could","may","might","must","shall","should","will","would"]);
const spelling={accomodate:"accommodate",acheive:"achieve",acknowlege:"acknowledge",agressive:"aggressive",apparant:"apparent",arguement:"argument",begining:"beginning",beleive:"believe",calender:"calendar",definately:"definitely",dissapear:"disappear",embarass:"embarrass",enviroment:"environment",existance:"existence",experiance:"experience",finaly:"finally",goverment:"government",grammer:"grammar",happend:"happened",independant:"independent",knowlege:"knowledge",maintenence:"maintenance",necesary:"necessary",occassion:"occasion",occured:"occurred",oportunity:"opportunity",permanant:"permanent",persue:"pursue",possesion:"possession",prefered:"preferred",privelege:"privilege",recieve:"receive",recomend:"recommend",refered:"referred",relevent:"relevant",seperate:"separate",succesful:"successful",sucess:"success",tommorow:"tomorrow",truely:"truly",untill:"until",usefull:"useful",wierd:"weird",writting:"writing",adress:"address",becuase:"because",comming:"coming",completly:"completely",diffrent:"different",excercise:"exercise",familly:"family",freind:"friend",imediately:"immediately",occurence:"occurrence",succesfully:"successfully",thier:"their",teh:"the"};
function preserveCase(a,b){if(!b)return b;if(a===a.toUpperCase())return b.toUpperCase();if(/^[A-Z]/.test(a))return b.charAt(0).toUpperCase()+b.slice(1);return b}
function words(t){const r=[],re=/\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g;let m;while((m=re.exec(t)))r.push({w:m[0],low:m[0].toLowerCase(),start:m.index,end:m.index+m[0].length});return r}
function sentences(t){const out=[],re=/[^.!?\n]+[.!?]?/g;let m;while((m=re.exec(t))){const raw=m[0],trim=raw.trim();if(trim){const lead=raw.search(/\S/);out.push({text:trim,start:m.index+lead,end:m.index+raw.length})}}return out}
function make(category,title,start,end,original,replacement,message,severity="warning",confidence=.9,ruleId=title.toLowerCase().replace(/\s+/g,"-")){return {id:ruleId+":"+start+":"+end,ruleId,category,title,start,end,original,replacement,message,severity,confidence}}
function add(a,s){if(s&&s.start>=0)a.push(s)}
function third(w){if(WORDS[w]&&WORDS[w].third)return WORDS[w].third;if(/[^aeiou]y$/.test(w))return w.slice(0,-1)+"ies";if(/(s|x|z|ch|sh)$/.test(w))return w+"es";return w+"s"}
function base(w){for(const k in WORDS)if(WORDS[k].third===w)return k;if(/ies$/.test(w)&&w.length>3)return w.slice(0,-3)+"y";if(/(ches|shes|xes|zes|ses)$/.test(w))return w.slice(0,-2);if(/s$/.test(w)&&!/(ss|us|is)$/.test(w))return w.slice(0,-1);return w}
function isPluralNoun(w){w=w.toLowerCase();return pluralNouns.has(w)||irregularPlural[w]!==undefined||/[^aeiou]ies$/.test(w)||/(ches|shes|xes|zes|ses)$/.test(w)||/s$/.test(w)&&!/(ss|us|is)$/.test(w)}
function pluralize(w){const l=w.toLowerCase();if(irregularPlural[l])return preserveCase(w,irregularPlural[l]);if(/[^aeiou]y$/.test(l))return w.slice(0,-1)+"ies";if(/(s|x|z|ch|sh)$/.test(l))return w+"es";return w+"s"}
function parseNumberWordSequence(parts){let total=0,current=0,found=false;for(const p of parts){if(!(p in numberWords))continue;found=true;const n=numberWords[p];if(n===100||n===1000||n>=1000000){current=(current||1)*n;total+=current;current=0}else current+=n}return found?total+current:null}
function numericValue(raw){const x=raw.toLowerCase().replace(/,/g,"");if(/^\d+(?:\.\d+)?$/.test(x))return Number(x);return parseNumberWordSequence(x.split(/\s+/))}
function numberSubjectInfo(text,start,end,noun){const raw=text.slice(start,end);const n=numericValue(raw);if(n!==null)return {number:n,kind:n===1?"singular":"plural"};return {number:null,kind:isPluralNoun(noun)?"plural":"singular"}}

/* Strong number/quantity agreement parser. It intentionally handles only structures where
   the grammatical number is reasonably predictable, avoiding broad guesswork. */
function findNumberVerbAgreement(text) {
  const out = [];
  const addPair = (start,end,original,replacement,message,confidence) => add(out, make("Subject–Verb Agreement","Number–Verb Agreement",start,end,original,replacement,message,"error",confidence || .96,"number-verb-agreement"));

  let re = /\b(a|the)\s+number\s+of\s+(?:the\s+)?([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s+(is|are|was|were|has|have|does|do)\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const kind = m[1].toLowerCase();
    const v = m[3].toLowerCase();
    const expected = kind === "a"
      ? ({is:"are",was:"were",has:"have",does:"do"}[v])
      : ({are:"is",were:"was",have:"has",do:"does"}[v]);
    if (expected) {
      addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[3]+"\\b","i"),preserveCase(m[3],expected)),
        kind === "a" ? "“A number of + plural noun” takes a plural verb." : "“The number of + plural noun” takes a singular verb.", .99);
    }
  }

  re = /\b(?:(?:the|these|those|my|your|our|their|his|her)\s+)?((?:\d{1,3}(?:,\d{3})*(?:\.\d+)?|(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|hundred|thousand|million)(?:\s+(?:and\s+)?(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|hundred|thousand|million)){0,5}))\s+([A-Za-z]+)(?:\s+(?:in|from|of|with|for|at|on|under|over|inside|outside|who|that|which)\b[^.!?;:]{0,35}){0,6}?\s+(is|are|was|were|has|have|does|do)\b/gi;
  while ((m = re.exec(text))) {
    const val = numericValue(m[1]);
    if (val === null) continue;
    const noun = m[2], v = m[3].toLowerCase();
    if (/^percent(?:age)?$/i.test(noun)) continue;
    let expected = null;
    if (["is","are","was","were","has","have","does","do"].includes(v)) {
      expected = val === 1
        ? ({are:"is",were:"was",have:"has",do:"does"}[v])
        : ({is:"are",was:"were",has:"have",does:"do"}[v]);
    } else if (WORDS[base(v)]) {
      const b = base(v);
      expected = val === 1 ? third(b) : b;
    }
    if (expected && expected !== v) {
      addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[3]+"\\b","i"),preserveCase(m[3],expected)),
        `The numerical subject ${m[1]} ${noun} is ${val === 1 ? "singular" : "plural"}; use the matching verb form.`, .96);
    }
  }

  re = /\b(many|several|few|both|various|numerous)\s+([A-Za-z]+)(?:\s+[^.!?;:]{0,35})?\s+(is|are|was|were|has|have|does|do|[A-Za-z]+)\b/gi;
  while ((m = re.exec(text))) {
    const v = m[3].toLowerCase();
    let expected = null;
    if (["is","was","has","does"].includes(v)) expected = {is:"are",was:"were",has:"have",does:"do"}[v];
    else { const b = base(v); if (WORDS[b] && v === third(b)) expected = b; }
    if (expected && expected !== v) {
      addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[3]+"\\b","i"),preserveCase(m[3],expected)),
        `“${m[1]}” normally introduces a plural subject, so use the plural verb form.`, .95);
    }
  }

  re = /\b(each|every|either|neither)\s+([A-Za-z]+)\s+(is|are|was|were|has|have|does|do)\b/gi;
  while ((m = re.exec(text))) {
    const noun = m[2], v = m[3].toLowerCase();
    if (isPluralNoun(noun)) {
      const singular = noun.toLowerCase() === "children" ? "child" : noun.replace(/ies$/i,"y").replace(/s$/i,"");
      const ns = m.index + m[0].indexOf(noun);
      add(out, make("Grammar","Noun Number",ns,ns+noun.length,noun,preserveCase(noun,singular),`After “${m[1]}”, use a singular count noun.`,"error",.97,"number-singular-noun"));
    } else {
      const expected = {are:"is",was:"was",have:"has",do:"does"}[v];
      if (expected) addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[3]+"\\b","i"),preserveCase(m[3],expected)),`“${m[1]}” takes a singular verb.`,.98);
    }
  }

  re = /\b((?:\d+(?:\.\d+)?%|\d+(?:\.\d+)?\s+percent(?:s)?|(?:one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:half|halves|third|thirds|quarter|quarters))\s+of\s+(?:the\s+)?([A-Za-z]+))\s+(is|are|was|were|has|have|does|do)\b/gi;
  while ((m = re.exec(text))) {
    const noun = m[2].toLowerCase(), v = m[3].toLowerCase();
    const plural = isPluralNoun(noun) && !uncountable.has(noun);
    const expected = plural ? ({is:"are",was:"were",has:"have",does:"do"}[v]) : ({are:"is",were:"was",have:"has",do:"does"}[v]);
    if (expected) addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[3]+"\\b","i"),preserveCase(m[3],expected)),`The verb agrees with the noun after “of”: “${noun}” is ${plural ? "plural" : "singular/uncountable"}.`,.94);
  }
  // Existential there + singular/plural noun: the following noun controls the verb.
  re = /\bthere\s+(is|are|was|were|has|have)\s+(?:(?:a|an|the|these|those|some|many|several|few|two|three|four|five|six|seven|eight|nine|ten)\s+)?([A-Za-z]+)\b/gi;
  while ((m = re.exec(text))) {
    const v=m[1].toLowerCase(), n=m[2], nn=nounNumber(n);
    if(nn==="singular" || nn==="uncountable"){
      const expected={are:"is",were:"was",have:"has"}[v];
      if(expected) addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[1]+"\\b","i"),preserveCase(m[1],expected)),`“There” constructions agree with the noun that follows: “${n}” is singular.`,.97);
    } else if(nn==="plural"){
      const expected={is:"are",was:"were",has:"have"}[v];
      if(expected) addPair(m.index,m.index+m[0].length,m[0],m[0].replace(new RegExp("\\b"+m[1]+"\\b","i"),preserveCase(m[1],expected)),`“There” constructions agree with the noun that follows: “${n}” is plural.`,.97);
    }
  }
  return out;
}

function findPronounAgreement(text){const a=[];let m;const be=/\b(what|where|when|why|how|who)\s+(is|are|was|were)\s+(you|we|they|i|he|she|it)\b/gi;while((m=be.exec(text))){const q=m[1],v=m[2].toLowerCase(),s=m[3].toLowerCase();let c=v;if(pluralPronouns.has(s))c=v==="was"?"were":"are";else if(s==="i")c=v==="are"?"am":"was";else if(singularPronouns.has(s))c=v==="were"?"was":"is";if(c!==v)add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${q} ${preserveCase(m[2],c)} ${m[3]}`,"The verb should agree with the subject pronoun.","error",.99,"question-be-agreement"));}
 const be2=/\b(you|we|they|i)\s+(is|was)\b/gi;while((m=be2.exec(text))){const s=m[1].toLowerCase(),v=m[2].toLowerCase(),c=s==="i"?(v==="is"?"am":"was"):(v==="is"?"are":"were");if(c!==v)add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${preserveCase(m[2],c)}`,"The verb should agree with the subject pronoun.","error",.98,"be-pronoun-agreement"));}
 const be3=/\b(he|she|it)\s+(are|were)\b/gi;while((m=be3.exec(text)))add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${m[2].toLowerCase()==="are"?"is":"was"}`,"The verb should agree with the singular subject.","error",.98,"be-singular"));
 const aux=/\b(he|she|it|they|we|you|i)\s+(do|does|have|has)\b/gi;while((m=aux.exec(text))){const s=m[1].toLowerCase(),v=m[2].toLowerCase();let c=v;if(singularPronouns.has(s)&&v==="do")c="does";if(singularPronouns.has(s)&&v==="have")c="has";if(pluralPronouns.has(s)&&v==="does")c="do";if(pluralPronouns.has(s)&&v==="has")c="have";if(c!==v)add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${c}`,"The auxiliary verb should agree with the subject.","error",.98,"pronoun-aux-agreement"));}
 return a}
function nounNumber(w){
  const l=w.toLowerCase();
  if(uncountable.has(l)) return "uncountable";
  if(["news","mathematics","physics","economics","politics","measles"].includes(l)) return "singular";
  if(singularNouns.has(l)) return "singular";
  if(pluralNouns.has(l) || irregularPlural[l]) return "plural";
  if(/(children|people|men|women|mice|feet|teeth|geese)$/.test(l)) return "plural";
  if(/[^aeiou]ies$/.test(l) || /(ches|shes|xes|zes|ses)$/.test(l)) return "plural";
  if(/s$/.test(l) && !/(ss|us|is)$/.test(l)) return "plural";
  return "singular";
}
function singularize(w){
  const l=w.toLowerCase();
  const rev=Object.entries(irregularPlural).find(([k,v])=>v===l);
  if(rev) return preserveCase(w,rev[0]);
  if(l.endsWith("ies")) return preserveCase(w,l.slice(0,-3)+"y");
  if(l.endsWith("ches")||l.endsWith("shes")||l.endsWith("xes")||l.endsWith("zes")||l.endsWith("ses")) return preserveCase(w,l.slice(0,-2));
  if(l.endsWith("s") && !/(ss|us|is)$/.test(l)) return preserveCase(w,l.slice(0,-1));
  return w;
}
function isLikelyNoun(w){
  const l=w.toLowerCase();
  return /^[A-Za-z]+$/.test(w) && !auxiliaries.has(l) && !modals.has(l) && !determiners.has(l) && !["and","or","but","because","if","when","while","than","as","not","to"].includes(l);
}
function findNounAgreement(text){
  const a=[]; let m;
  // Determiner + noun: this/that/a/an -> singular; these/those -> plural.
  const detRe=/\b(this|that|these|those|a|an)\s+([A-Za-z]+)\b/gi;
  while((m=detRe.exec(text))){
    const d=m[1].toLowerCase(), n=m[2], nn=nounNumber(n);
    const singularDet=["this","that","a","an"].includes(d);
    const pluralDet=["these","those"].includes(d);
    if(singularDet && (nn==="plural" || nn==="uncountable" && ["a","an"].includes(d))){
      if(nn==="plural") add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${singularize(n)}`,`“${m[1]}” requires a singular noun. Use the singular form “${singularize(n)}”.`,"error",.98,"determiner-singular-noun"));
    } else if(pluralDet && nn==="singular"){
      add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${pluralize(n)}`,`“${m[1]}” requires a plural noun. Use the plural form “${pluralize(n)}”.`,"error",.98,"determiner-plural-noun"));
    }
  }
  // Possessive determiner + noun: normally count-noun number is determined by meaning,
  // so only flag clear subject/verb agreement below; do not force "my teacher(s)".

  // each/every/either/neither + noun -> singular; many/few/several/both + noun -> plural.
  const qRe=/\b(each|every|either|neither|many|several|few|both|various|numerous)\s+([A-Za-z]+)\b/gi;
  while((m=qRe.exec(text))){
    const q=m[1].toLowerCase(), n=m[2], nn=nounNumber(n);
    if(["each","every","either","neither"].includes(q) && nn==="plural") add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${singularize(n)}`,`“${m[1]}” normally takes a singular count noun.`,"error",.98,"quantifier-singular-noun"));
    if(["many","several","few","both","various","numerous"].includes(q) && nn==="singular" && !uncountable.has(n.toLowerCase())) add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${pluralize(n)}`,`“${m[1]}” normally takes a plural count noun.`,"error",.96,"quantifier-plural-noun"));
  }

  // Explicit number + noun. Keep 1 singular and 0/2+ plural; don't treat dates or measurements as nouns.
  const numRe=/\b(\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million)\s+([A-Za-z]+)\b/gi;
  while((m=numRe.exec(text))){
    const raw=m[1], n=m[2], val=numericValue(raw), nn=nounNumber(n);
    if(val===null || /^(percent|percentage|am|pm|year|month|day|hour|minute|second)$/i.test(n)) continue;
    const required=val===1?"singular":"plural";
    if(required==="singular" && nn==="plural") add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${singularize(n)}`,`The number “${m[1]}” requires a singular count noun.`,"error",.98,"number-singular-noun"));
    if(required==="plural" && nn==="singular" && !uncountable.has(n.toLowerCase())) add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${pluralize(n)}`,`The number “${m[1]}” requires a plural count noun.`,"error",.98,"number-plural-noun"));
  }

  // A/an + count noun must be singular; one of + plural noun.
  const oneOf=/\bone\s+of\s+(?:the|these|those|my|your|our|their|his|her)?\s*([A-Za-z]+)\b/gi;
  while((m=oneOf.exec(text))){ if(nounNumber(m[1])!=="plural") add(a,make("Grammar","Singular/Plural Noun Agreement",m.index,m.index+m[0].length,m[0],m[0].replace(m[1],pluralize(m[1])),`“One of” identifies one member of a group, so the noun after it is normally plural.`,"error",.98,"one-of-plural")); }

  return a;
}

function findComplexNounVerbAgreement(text){
  const a=[]; const toks=words(text);
  const finite=new Set(["is","are","was","were","has","have","does","do","goes","go","attends","attend","studies","study","plays","play","works","work","teaches","teach","writes","write","reads","read","needs","need","wants","want","likes","like","helps","help","uses","use","provides","provide","supports","support","requires","require","prepares","prepare","completes","complete","creates","create","explains","explain","shows","show","leads","lead","moves","move","starts","start","continues","continue","develops","develop","discusses","discuss","answers","answer","asks","ask","follows","follow","remembers","remember","returns","return","seems","seem","talks","talk","understands","understand","visits","visit","waits","wait","walks","walk","believes","believe","chooses","choose","cleans","clean","changes","change","checks","check","compares","compare","decides","decide","finishes","finish","hopes","hope","listens","listen","looks","look","plans","plan","saves","save"]);
  const prep=new Set(["of","in","from","with","for","at","on","under","over","inside","outside","among","between","near","beside","behind","during","after","before","without","within"]);
  const det=new Set(["the","a","an","this","that","these","those","my","your","his","her","our","their"]);
  const isNounToken=w=>isLikelyNoun(w) && !finite.has(w) && !prep.has(w) && !det.has(w) && !modals.has(w) && !auxiliaries.has(w);
  const expectedVerb=(kind,v)=>{
    const l=v.toLowerCase();
    if(kind==="singular") return {are:"is",were:"was",have:"has",do:"does"}[l] || (WORDS[base(l)] && l===base(l)?third(base(l)):null);
    if(kind==="plural") return {is:"are",was:"were",has:"have",does:"do"}[l] || (WORDS[base(l)] && l===third(base(l))?base(l):null);
    return null;
  };
  for(let i=1;i<toks.length;i++){
    const v=toks[i].low;
    if(!finite.has(v)) continue;
    // Skip auxiliary + participle constructions; agreement belongs to the auxiliary.
    if(i+1<toks.length && /^(ing|ed)$/i.test(toks[i+1].low.slice(-2)) && ["is","are","was","were","has","have","had"].includes(v)) continue;
    let j=i-1, head=null, compound=false, sawPrep=false, steps=0;
    while(j>=0 && steps<12){
      const w=toks[j].low;
      if(/[.!?]/.test(text.slice(toks[j].end,toks[i].start))) break;
      if(w==="and" || w==="," ){ if(head) compound=true; j--; steps++; continue; }
      if(prep.has(w)){sawPrep=true; head=null; j--; steps++; continue;}
      if(det.has(w)){ j--; steps++; continue; }
      if(isNounToken(w)){
        // A noun after a preposition belongs to a modifier/object (e.g. books in
        // “the box of books”), so keep searching for the true subject head.
        if(!head) head=toks[j];
        else if(!sawPrep && head) { /* possible compound subject */ }
        j--; steps++; continue;
      }
      if(["very","really","just","also","only","even","still","already","usually","often","sometimes","always","never","not","currently","then","today","yesterday","hardworking","hard-working","qualified","experienced","young","old","new","old","good","bad","strong","weak","active","effective","important","different","many","several","few"].includes(w) || /(?:ing|ed|ful|less|ous|ive|able|al|ic)$/.test(w)){j--;steps++;continue;}
      break;
    }
    if(!head) continue;
    // If there is an explicit numeric/quantifier phrase immediately before the head,
    // let the dedicated number engine handle it.
    const prior=toks.slice(Math.max(0,j+1),i).map(x=>x.low);
    if(prior.some(x=>numberWords[x]!==undefined || /^\d/.test(x) || quantityPlural.has(x) || quantitySingular.has(x))) continue;
    let kind=nounNumber(head.low);
    if(kind==="uncountable") kind="singular";
    if(compound) kind="plural";
    // Proper plural demonstratives are handled by noun agreement; this prevents duplicate suggestions.
    const exp=expectedVerb(kind,v);
    if(exp && exp!==v){
      const start=toks[i].start, end=toks[i].end;
      add(a,make("Subject–Verb Agreement","Singular/Plural Subject–Verb Agreement",start,end,toks[i].w,preserveCase(toks[i].w,exp),
        `The subject “${head.w}” is ${kind}; use the matching verb form “${exp}”.`,"error",.95,"complex-subject-verb-agreement"));
    }
  }
  return a;
}

function findMainVerbAgreement(text){
 const a=[];let m;
 // Pronoun subjects.
 const re=/\b(he|she|it|they|we|you|i)\s+([A-Za-z]+)\b/gi;
 while((m=re.exec(text))){const subj=m[1].toLowerCase(),v=m[2].toLowerCase();if(auxiliaries.has(v)||modals.has(v)||["not","to","a","an","the"].includes(v))continue;const b=base(v);if(singularPronouns.has(subj)&&WORDS[b]&&v===b)add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${preserveCase(m[2],third(b))}`,"A singular subject normally takes the third-person singular verb form.","error",.94,"pronoun-main-verb"));else if(pluralPronouns.has(subj)&&WORDS[b]&&v===third(b))add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]} ${preserveCase(m[2],b)}`,"A plural subject or “I/you” normally takes the base verb form.","error",.94,"pronoun-main-verb-plural"));}
 // Common noun subjects. Include ordinary nouns not in the small vocabulary, but avoid “of X verb”.
 const nr=/\b((?:the|a|an|this|that|these|those|my|your|his|her|our|their)\s+)?([A-Za-z]+)\s+([A-Za-z]+)\b/gi;
 while((m=nr.exec(text))){const noun=m[2].toLowerCase(),v=m[3].toLowerCase();if(auxiliaries.has(v)||modals.has(v)||determiners.has(v)||["not","to","and","or","but","than","as"].includes(v))continue;const before=text.slice(Math.max(0,m.index-24),m.index).toLowerCase();if(/\b(?:of|in|from|with|for|at|on|under|over|inside|outside)\s+(?:the|a|an|this|that|these|those|my|your|his|her|our|their)?\s*$/.test(before))continue;if(!WORDS[base(v)])continue;const plural=pluralNouns.has(noun)||isPluralNoun(noun);const singular=singularNouns.has(noun)||(!plural&&/^[A-Za-z]+$/.test(noun));if(plural&&v===third(base(v)))add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]||""}${m[2]} ${preserveCase(m[3],base(v))}`,"A plural subject normally takes the base verb form.","error",.9,"noun-main-verb-plural"));else if(singular&&v===base(v))add(a,make("Subject–Verb Agreement","Subject–Verb Agreement",m.index,m.index+m[0].length,m[0],`${m[1]||""}${m[2]} ${preserveCase(m[3],third(base(v)))}`,"A singular subject normally takes the third-person singular verb form.","error",.9,"noun-main-verb-singular"));}
 return a;
}

function findEachEvery(text){const a=[];let m;const re=/\b(each|every)\s+([A-Za-z]+)\b/gi;while((m=re.exec(text))){const n=m[2].toLowerCase();if(isPluralNoun(n)){const singular=n==="children"?"child":n.replace(/ies$/,"y").replace(/s$/,"");add(a,make("Grammar","Noun Number",m.index+m[1].length+1,m.index+m[0].length,m[2],preserveCase(m[2],singular),`After “${m[1]}”, use a singular noun.`,"error",.96,"each-every-noun"))}}return a}
function findOneOf(text){const a=[];let m;const re=/\bone of the\s+([A-Za-z]+)\b/gi;while((m=re.exec(text))){if(!isPluralNoun(m[1]))add(a,make("Grammar","Noun Number",m.index,m.index+m[0].length,m[0],`one of the ${pluralize(m[1])}`,"“One of the” is normally followed by a plural noun.","warning",.94,"one-of-plural"))}return a}
function findUncountable(text){const a=[];let m;const re=new RegExp("\\b("+Array.from(uncountable).join("|")+"s)\\b","gi");while((m=re.exec(text)))add(a,make("Grammar","Uncountable Noun",m.index,m.index+m[0].length,m[0],m[1].slice(0,-1),`“${m[1].slice(0,-1)}” is normally uncountable in standard academic English.`,"warning",.94,"uncountable"));return a}
function findArticles(text){const a=[];let m;const re=/\b(a|an)\s+([A-Za-z]+)\b/gi;while((m=re.exec(text))){const w=m[2].toLowerCase();const silentH=/^(hour|honest|honor|heir)/.test(w);const consonantSound=/^(uni|use|user|euro|one)/.test(w);const needsAn=silentH||(!consonantSound&&/^[aeiou]/.test(w));const expected=needsAn?"an":"a";if(m[1].toLowerCase()!==expected)add(a,make("Grammar","Article",m.index,m.index+m[0].length,m[0],`${preserveCase(m[1],expected)} ${m[2]}`,`Use “${expected}” according to the sound at the beginning of the next word.`,"warning",.9,"article"))}return a}
function findModals(text){const a=[];let m;const re=/\b(can|could|may|might|must|shall|should|will|would)\s+([A-Za-z]+(?:s|ed))\b/gi;while((m=re.exec(text))){const b=base(m[2].toLowerCase());if(b!==m[2].toLowerCase())add(a,make("Grammar","Verb Form",m.index,m.index+m[0].length,m[0],`${m[1]} ${b}`,"A modal verb is followed by the base form of the verb.","error",.96,"modal-base"))}return a}
function findDoForms(text){const a=[];let m;const re=/\b(do|does|did|don't|doesn't|didn't)\s+([A-Za-z]+)\b/gi;while((m=re.exec(text))){const b=base(m[2].toLowerCase());if(b!==m[2].toLowerCase()&&m[2].toLowerCase()!=="not")add(a,make("Grammar","Verb Form",m.index,m.index+m[0].length,m[0],`${m[1]} ${b}`,"Use the base verb after do, does, or did.","error",.95,"do-base"))}return a}
function findPOS(text){const a=[];let m;const r1=/\b(he|she|it|they|we|you|i)\s+(is|are|was|were)\s+(beautifully|quickly|carefully|successfully)\b/gi;while((m=r1.exec(text)))add(a,make("Grammar","Parts of Speech",m.index,m.index+m[0].length,m[0],null,"After a linking verb, an adjective is often needed rather than an adverb.","suggestion",.84,"pos-linking-adverb"));const r2=/\b(a|an|the)\s+(quickly|slowly|beautifully|carefully)\s+([A-Za-z]+)\b/gi;while((m=r2.exec(text)))add(a,make("Grammar","Parts of Speech",m.index,m.index+m[0].length,m[0],null,"Check whether an adjective, not an adverb, is needed before the noun.","suggestion",.82,"pos-adverb-noun"));const r3=/\benjoy\s+to\s+([A-Za-z]+)\b/gi;while((m=r3.exec(text)))add(a,make("Grammar","Verb Form",m.index,m.index+m[0].length,m[0],`enjoy ${m[1]}ing`,"“Enjoy” is normally followed by a gerund (-ing form).","error",.92,"enjoy-gerund"));const r4=/\bwant\s+([A-Za-z]+ing)\b/gi;while((m=r4.exec(text)))add(a,make("Grammar","Verb Form",m.index,m.index+m[0].length,m[0],`want to ${m[1].replace(/ing$/i,"")}`,"“Want” is normally followed by “to” + base verb.","error",.9,"want-infinitive"));return a}
function findCommon(text){const a=[];const rs=[[/\bI am agree\b/gi,"I agree","Use “agree” directly rather than “am agree”."],[/\bdiscuss about\b/gi,"discuss","“Discuss” normally takes its object directly without “about”."],[/\breturn back\b/gi,"return","“Return” already expresses going back."],[/\bmore better\b/gi,"better","Do not use “more” with the comparative “better”."],[/\bmore worse\b/gi,"worse","Do not use “more” with the comparative “worse”."],[/\bmost best\b/gi,"best","Do not use “most” with the superlative “best”."],[/\binformations\b/gi,"information","Use “information” as an uncountable noun."],[/\badvices\b/gi,"advice","Use “advice” as an uncountable noun."],[/\bequipments\b/gi,"equipment","Use “equipment” as an uncountable noun."]];for(const r of rs){let m;while((m=r[0].exec(text)))add(a,make("Grammar","Common Usage",m.index,m.index+m[0].length,m[0],r[1],r[2],"error",.97,"common-usage"))}return a}
function findConfused(text){const a=[];let m;const patterns=[[/\bshould of\b/gi,"should have"],[/\bcould of\b/gi,"could have"],[/\bwould of\b/gi,"would have"],[/\bbetween you and i\b/gi,"between you and me"]];for(const r of patterns){while((m=r[0].exec(text)))add(a,make("Grammar","Word Usage",m.index,m.index+m[0].length,m[0],r[1],"Use the standard grammatical construction.","error",.96,"word-usage"))}return a}
function findSpelling(text){const a=[];for(const x of words(text)){const hit=spelling[x.low];if(hit)add(a,make("Spelling","Spelling",x.start,x.end,x.w,preserveCase(x.w,hit),`Possible spelling error: “${x.w}”.`,"error",.99,"spelling"))}return a}
function findCapitalization(text){const a=[];let m;const cap=/(^|[.!?]\s+)([a-z])/g;while((m=cap.exec(text))){const p=m.index+m[1].length;add(a,make("Grammar","Capitalization",p,p+1,m[2],m[2].toUpperCase(),"Begin a sentence with a capital letter.","error",.97,"capitalization"))}const ir=/\bi\b/g;while((m=ir.exec(text)))add(a,make("Grammar","Capitalization",m.index,m.index+1,"i","I","The pronoun “I” is capitalized.","error",.99,"capital-i"));return a}
function findStyle(text){const a=[];let m;const rs=[[/\ba lot of\b/gi,"many","A more concise alternative is “many”."],[/\bin order to\b/gi,"to","“To” is usually sufficient here."],[/\bdue to the fact that\b/gi,"because","“Because” is more concise."],[/\bat this point in time\b/gi,"currently","Use a more direct time expression."],[/\bmake a decision\b/gi,"decide","Use the direct verb “decide”."]];for(const r of rs){while((m=r[0].exec(text)))add(a,make("Vocabulary","Clarity",m.index,m.index+m[0].length,m[0],r[1],r[2],"suggestion",.9,"wordiness"))}return a}
function findPunctuation(text){const a=[];let m;const rs=[[/ {2,}/g," ","Use one space between words.","Spacing"],[/\s+([,.!?;:])/g,null,"Do not place a space before punctuation.","Punctuation"],[/([,.!?;:])([A-Za-z])/g,null,"Add a space after punctuation when another word follows.","Punctuation"]];for(const r of rs){while((m=r[0].exec(text))){let rep=r[1];if(rep===null)rep=m[1]+(r[0].source.includes("\\)\\([A-Za-z]")?" "+m[2]:"");add(a,make("Punctuation",r[3],m.index,m.index+m[0].length,m[0],rep,r[2],"warning",.97,"punctuation"))}}return a}
function analyze(t){const a=[];if(!t||!t.trim())return a;[findSpelling,findCapitalization,findNumberVerbAgreement,findPronounAgreement,findNounAgreement,findComplexNounVerbAgreement,findMainVerbAgreement,findEachEvery,findOneOf,findUncountable,findArticles,findModals,findDoForms,findPOS,findCommon,findConfused,findStyle,findPunctuation].forEach(fn=>a.push(...fn(t)));return finalize(a)}
function finalize(a){const seen=new Set(),out=[];for(const s of a){const key=[s.start,s.end,s.original,s.replacement,s.ruleId].join("|");if(seen.has(key))continue;seen.add(key);out.push(s)}out.sort((x,y)=>x.start-y.start||y.confidence-x.confidence);const kept=[];for(const s of out){const overlap=kept.find(k=>s.start<k.end&&s.end>k.start);if(!overlap){kept.push(s);continue}if(s.confidence>overlap.confidence+.04){kept[kept.indexOf(overlap)]=s}}return kept.sort((x,y)=>x.start-y.start)}
function analyzePOS(t){const result=[];for(const w of words(t)){let pos="word";if(modals.has(w.low))pos="modal";else if(auxiliaries.has(w.low))pos="auxiliary";else if(/ly$/.test(w.low))pos="adverb";else if(/ing$|ed$/.test(w.low))pos="verb/participle";else if(/ous$|ful$|less$|able$|ive$|al$/.test(w.low))pos="adjective";else if(determiners.has(w.low))pos=(w.low==="a"||w.low==="an"||w.low==="the")?"article":"determiner";else if(/^(he|she|it|they|we|you|i|me|him|her|us|them)$/.test(w.low))pos="pronoun";else if(/^(in|on|at|by|for|from|with|to|of|about|under|over|between|into|through)$/.test(w.low))pos="preposition";else if(/^(and|but|or|nor|for|so|yet|because|although|while|if|when)$/.test(w.low))pos="conjunction";result.push({word:w.w,pos,start:w.start,end:w.end})}return result}
function analyzeDocument(t){const suggestions=analyze(t),wc=words(t).length,sc=sentences(t).length,paras=t.split(/\n\s*\n/).filter(x=>x.trim()).length,errors=suggestions.filter(x=>x.severity==="error").length,warnings=suggestions.filter(x=>x.severity==="warning").length;const score=Math.max(0,Math.min(100,Math.round(100-(errors*4+warnings*1.7+suggestions.filter(x=>x.severity==="suggestion").length*.6)/Math.max(1,wc)*25)));return {suggestions,score,words:wc,sentences:sc,paragraphs:paras,readingTime:Math.max(0,Math.ceil(wc/200*60)),errorCount:errors,warningCount:warnings,pos:analyzePOS(t)}}
global.GrammarEngine={analyze,analyzeDocument,analyzePOS,baseForm:base,thirdPerson:third,findNumberVerbAgreement};
})(typeof window!=="undefined"?window:globalThis);
