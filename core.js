export const SKILLS = ['listening','reading','writing','speaking'];
export const LABELS = {listening:'听力',reading:'阅读',writing:'写作',speaking:'口语'};
export const MINUTE_OPTIONS = [60,90,120,150,180,240,360,480];
export const PLAN_DAYS = 21;
export const PHASES = [
 {start:1,end:7,title:'摸底与建习惯',sub:'做基线练习，找到最明显的失分点'},
 {start:8,end:14,title:'专项补短板',sub:'围绕弱项限时练习，并记录模考成绩'},
 {start:15,end:18,title:'整合与全真模考',sub:'练完整考试节奏，确认最后优先项'},
 {start:19,end:21,title:'考前收束',sub:'回看错题，保持语感，留足休息'}
];
export const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false; const d=new Date(s+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
export function dayDiff(a,b){return Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/86400000)}
export function addDays(s,n){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export function period(state,today=todayISO()){const raw=dayDiff(state.settings.start,today)+1;return {raw,day:Math.max(1,Math.min(PLAN_DAYS,raw)),remaining:Math.max(0,Math.min(PLAN_DAYS,PLAN_DAYS+1-raw)),status:raw<1?'before':raw>PLAN_DAYS?'after':'active'}}
export function initialState(){return {schema:1,settings:{start:todayISO(),minutes:480,hoursPresetVersion:2},checks:{},notes:{},scores:[],plan:null}}
export function migrateState(s){if(s.settings.hoursPresetVersion!==2){s.settings.minutes=480;s.settings.hoursPresetVersion=2;s.plan=null}return s}
const baselineWeights=state=>state.settings.minutes>=360?[.25,.25,.25,.25]:[.25,.25,.28,.22];
export function overall(s){return Math.round(SKILLS.reduce((n,k)=>n+s[k],0)/4*2)/2}
export function recentScores(state,today=todayISO()){return [...state.scores].filter(s=>s.date<=today).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).slice(0,3)}
export function recommend(state,today=todayISO()){
 const p=period(state,today), recent=recentScores(state,today), base=baselineWeights(state);
 let averages=null,focus=['writing','speaking'],weights=[...base];
 if(recent.length){const factors=[.6,.3,.1].slice(0,recent.length),sum=factors.reduce((a,b)=>a+b,0);averages=Object.fromEntries(SKILLS.map(k=>[k,recent.reduce((n,s,i)=>n+s[k]*factors[i],0)/sum]));
 const ordered=[...SKILLS].sort((a,b)=>averages[a]-averages[b]); focus=ordered.filter(k=>averages[k]<6.5).slice(0,2);
 if(focus.length){weights=SKILLS.map(k=>.16+Math.max(0,6.5-averages[k])*.12);focus.forEach((k,i)=>weights[SKILLS.indexOf(k)]+=(i===0?.15:.08));}else{weights=[.25,.25,.25,.25]}
 }
 const mode=p.status==='after'?'复盘与再规划':p.remaining<=3?'复盘稳态':p.remaining<=7?'限时查漏':p.remaining<=12?'整合提速':'专项提升';
 if(p.remaining<=7&&focus.length){weights[SKILLS.indexOf(focus[0])]+=.08}
 const sum=weights.reduce((a,b)=>a+b,0);weights=weights.map(w=>w/sum);
 const reason=!recent.length?(state.settings.minutes>=360?'尚无模考记录：先安排四科均衡摸底，写作与口语额外关注输出质量。四级水平不直接换算为雅思分数。':'尚无模考记录：先安排四科摸底，略向写作与口语倾斜。四级水平不直接换算为雅思分数。'):focus.length?`最近 ${recent.length} 次成绩中，${focus.map(k=>LABELS[k]).join('、')}距离单科参考线 6.5 更远，优先安排纠错与重练。`:'最近成绩的四科加权均分均达到 6.5，保持均衡训练，检查稳定性。';
 const timing=p.status==='after'?'21天计划已结束；先复盘记录，再修改开始日期安排新一轮。':p.remaining<=3?'最后3天以旧错题、熟悉表达和考前准备为主；保留所选时长，可按精力提前结束。':p.remaining<=7?'最后7天减少新题，优先限时练习和错因复盘。':`剩余 ${p.remaining} 天，先补短板，再用阶段模考验证。`;
 return {weights,focus,averages,mode,reason,timing,remaining:p.remaining,sampleCount:recent.length,generatedAt:Date.now()};
}
export function activePlan(state,today=todayISO()){return state.plan||recommend({...state,scores:[]},today)}
export function allocate(total,weights){const raw=weights.map(w=>w*total/5),units=raw.map(Math.floor);let remain=total/5-units.reduce((a,b)=>a+b,0);const order=raw.map((v,i)=>({i,r:v-units[i]})).sort((a,b)=>b.r-a.r);for(let i=0;i<remain;i++)units[order[i%order.length].i]++;return units.map(n=>n*5)}
const L=[
 ['认识题型，完成初次摸底','选一套官方样题的 Section 1，不暂停做题；对答案，按“没听懂 / 拼写 / 定位”标注错因。'],
 ['数字与拼写','练一组电话、日期和地址填空；错句听写3遍，再跟读；整理5个易拼错词。'],
 ['抓住同义替换','做一组填空题，圈出题干关键词；精听错题前后句，写出5组题干与原文替换。'],
 ['听懂转折与改口','练 Section 2；标出 but、actually、instead 后的答案变化；重听并解释3道错题。'],
 ['跟上多人讨论','练 Section 3 一组选择题，先读选项差异；只精听错题，记下说话人的立场。'],
 ['学术段落笔记','练 Section 4 填空；听前预测词性，听后整理5个信号词；跟读一个短段。']
];
const R=[
 ['摸清阅读失分点','限时20分钟做一篇官方学术阅读样题；对答案，为每道错题划出原文依据。'],
 ['先定位，再读句子','限时做一组填空题；先圈专名、数字和关键词，再回到原句；记录5组同义替换。'],
 ['区分 False 与 Not Given','做一组判断题；每题写“矛盾证据 / 信息缺失”；把推测当事实的题重做。'],
 ['抓段落主旨','做一组段落标题题；每段只写一句中心意思，再比较选项；解释两个干扰项。'],
 ['拆解长难句','限时做一组配对题；挑3个影响理解的长句，划出主语、谓语与修饰部分。'],
 ['阅读时间分配','限时20分钟完成一篇未做过的文章；卡题先标记；对答案后总结最费时的题型。']
];
const W=[
 ['写一段，建立写作基线','用官方 Task 2 题目，列出立场和两点理由，写一段80–100词的主体段；检查是否解释了“为什么”。'],
 ['把观点说清楚','选一个教育类 Task 2 题，写两条“观点→原因→例子”；完成一个主体段，删掉无关内容。'],
 ['Task 1：找到总体趋势','选官方图表题；写2句概述，再挑2组关键数据作比较；检查时态与单位。'],
 ['完成一篇 Task 2','先列提纲，再写至少250词；若时间不足，今天先完成两段，明天优先续写；标记跑题句。'],
 ['Task 1：比较与分组','选一张图表，按相同趋势分组；写一段比较描述；检查数字、比较级与主谓一致。'],
 ['修改比重写更重要','重读最近一篇作文；按任务回应、连贯、词汇、语法逐项检查；重写最弱的一段并对照。']
];
const S=[
 ['留下第一段口语录音','用手机回答 study、hometown、hobbies 各2题，每题20–30秒；回听标记长停顿，不背逐字稿。'],
 ['Part 1：答案多走一步','练6道熟悉话题题；每题给“回答 + 原因 + 小例子”；录音回听，修正一个高频语法错误。'],
 ['Part 2：把故事讲完整','自选一次难忘经历，准备1分钟、录音讲1–2分钟；按人物、经过、感受补全，不硬塞难词。'],
 ['Part 3：解释与比较','围绕教育回答4个 why / compare 问题；用观点、解释、例子展开；回听是否真正回答问题。'],
 ['减少停顿与重复','重录昨天最卡的一题；用关键词提纲表达相同意思；对比两段录音，记录一个改善。'],
 ['切换不同话题','练工作、科技、环境各2题；遇到不会的词先用简单词解释；结束后补充5个常用表达。']
];
const extra={listening:'加练：对最常错的一段逐句听写，核对后再盲听。',reading:'加练：重做最弱题型，每题写出原文证据。',writing:'加练：按评分标准检查一段，再重写；尽量请老师反馈。',speaking:'加练：重录最卡的一题，用更简单的表达说顺。'};
function trainingBlocks(skill,minutes,mock,review){
 if(!minutes)return [];
 const index=SKILLS.indexOf(skill),examMinutes=[40,60,60,15][index];
 if(mock&&minutes>=examMinutes){const remainder=minutes-examMinutes,parts=allocate(remainder,[.625,.375]);return [{title:['完整听力与作答准备','完整阅读限时作答','完整写作限时作答','完整口语模拟录音'][index],minutes:examMinutes},...parts.map((n,i)=>({title:i===0?'核对答案或标准，逐题查错':'重做、重写或重录薄弱部分',minutes:n})).filter(x=>x.minutes)]}
 const names=review?{
 listening:['回听旧错题，复述失分原因','精听和跟读熟悉材料','核对拼写清单，回听重练'],
 reading:['重做旧题，标出原文证据','复习长句和同义替换清单','回顾时间分配，整理考前提醒'],
 writing:['对照评分标准复盘已有作文','修改典型错误，重写薄弱段落','复习熟悉表达，检查考试准备'],
 speaking:['用熟悉话题录音，保持语感','回听修正停顿与语法，轻量重录','回顾关键词提纲，整理考前提醒']
 }:{
 listening:['完成今日题型；充足时再做一组新题','逐句精听、听写并核对错题','跟读复述，再盲听并整理错因'],
 reading:['限时完成今日文章或题型；练习先定位','逐题找原文证据，分析干扰选项','拆解长句，整理并回测同义替换'],
 writing:['审题列提纲，完成今日作文或段落','按四项标准检查，重写薄弱段落','补练另一类写作题，整理常见错误'],
 speaking:['按今日话题练 Part 1–2 并录音','扩展 Part 3，回听找停顿与语法问题','用关键词提纲重录，回顾常用表达']
 };
 return allocate(minutes,[.375,.375,.25]).map((n,i)=>({title:names[skill][i],minutes:n})).filter(b=>b.minutes);
}
export function tasksFor(state,day,today=todayISO()){
 const p=period(state,today), plan=activePlan(state,today), date=addDays(state.settings.start,day-1);
 const minutes=state.settings.minutes,weights=day>=p.day?plan.weights:baselineWeights(state),times=allocate(minutes,weights);
 const pending=SKILLS.map((k,i)=>({k,i})).filter(({k})=>!state.checks[`${day}:${k}`]);
 const fixed=SKILLS.reduce((n,k)=>n+(state.checks[`${day}:${k}`]?.snapshot?.minutes||0),0);
 if(pending.length<4&&pending.length){const sum=pending.reduce((n,{i})=>n+weights[i],0),remainingTimes=allocate(Math.max(0,minutes-fixed),pending.map(({i})=>weights[i]/sum));pending.forEach(({i},j)=>times[i]=remainingTimes[j])}
 const mock=[7,14,18].includes(day), final=day===21;
 return SKILLS.map((k,i)=>{let [title,detail]=[L,R,W,S][i][(day-1)%6];
 if(day===1&&i>0){[title,detail]=[R,W,S][i-1][0]}
 if(day>=8&&day<=17&&!mock){detail+=(day>=15?' 本轮加入限时，先独立完成，再复盘。':' 换一组未做过的题，避免记住答案。')}
 if(mock){title=['阶段模考：听力','阶段模考：阅读','阶段模考：写作','阶段模考：口语'][i];detail=['完整做一套未做过的听力，按原音频连续作答；用该套答案与分数说明换算。','完整学术阅读限时60分钟，独立做完；用该套答案与分数说明换算。','用完整60分钟完成 Task 1（约20分钟）与 Task 2（约40分钟）；请老师评分或标为自估。','按 Part 1–3 连续模拟11–14分钟并录音；依据官方标准自评或请老师反馈。'][i]+' 模考结束后在“模考记录”录入四科分数。'}
 if(day>=19){title=['精听旧错题，稳定手感','回看证据，少做新题','复盘熟悉表达与结构','和口语陪练做轻量对话'][i];detail=['重听5道旧错题；说出漏听或误判的原因；复习拼写清单。','重看5道错题的原文依据；整理定位和同义替换，不开新套题。','回看两篇已修改的作文；只修任务回应和常见语法错误，不背整篇范文。','打开“口语陪练”选择熟悉话题，与 ChatGPT 进行一问一答；回顾表达并保持语感。'][i]}
 if(final)detail+=' 结束后确认考试信息、证件与路线，按时休息。';
 const focus=plan.focus.includes(k)&&day>=p.day&&!mock&&day<19;if(focus)detail+=' '+extra[k];
 const checked=state.checks[`${day}:${k}`],snapshot=checked?.snapshot;return {key:`${day}:${k}`,skill:k,title:snapshot?snapshot.title:title,detail:snapshot?snapshot.detail:detail,date,minutes:snapshot?snapshot.minutes:times[i],blocks:snapshot?(snapshot.blocks||[]):trainingBlocks(k,times[i],mock,day>=19),focus:snapshot?!!snapshot.focus:focus,done:!!checked};
 });
}
export function progress(state){let count=0,minutes=0,days=0;const bySkill=Object.fromEntries(SKILLS.map(k=>[k,0]));for(let d=1;d<=PLAN_DAYS;d++){let n=0;for(const k of SKILLS){const c=state.checks[`${d}:${k}`];if(c){count++;n++;bySkill[k]++;minutes+=c.snapshot?.minutes||0}}if(n===4)days++}return {count,minutes,days,bySkill,percent:Math.round(count/(PLAN_DAYS*4)*100)}}
export function validateState(s){
 if(!s||s.schema!==1||!s.settings||!validDate(s.settings.start)||!MINUTE_OPTIONS.includes(s.settings.minutes)||!Array.isArray(s.scores)||s.scores.length>500||!s.checks||Array.isArray(s.checks)||typeof s.checks!=='object'||!s.notes||typeof s.notes!=='object'||Array.isArray(s.notes))throw new Error('备份格式不正确');
 const ids=new Set();s.scores.forEach(r=>{if(!r||typeof r.id!=='string'||ids.has(r.id)||!validDate(r.date)||r.date>todayISO()||!Number.isFinite(r.createdAt)||!['self','teacher','official'].includes(r.source)||typeof r.note!=='string'||r.note.length>1000||SKILLS.some(k=>typeof r[k]!=='number'||r[k]<0||r[k]>9||r[k]*2%1!==0))throw new Error('备份中有无效成绩');ids.add(r.id)});
 Object.entries(s.checks).forEach(([k,c])=>{if(!/^(?:[1-9]|[12]\d|30):(listening|reading|writing|speaking)$/.test(k)||!c||typeof c!=='object'||!c.snapshot||!Number.isFinite(c.snapshot.minutes)||c.snapshot.minutes<0||c.snapshot.minutes>480||typeof c.snapshot.title!=='string'||typeof c.snapshot.detail!=='string')throw new Error('备份中有无效打卡');if(c.snapshot.blocks&&(!Array.isArray(c.snapshot.blocks)||c.snapshot.blocks.length>10||c.snapshot.blocks.some(b=>!b||typeof b.title!=='string'||!Number.isFinite(b.minutes)||b.minutes<0||b.minutes>480)||c.snapshot.blocks.reduce((n,b)=>n+b.minutes,0)!==c.snapshot.minutes))throw new Error('备份中有无效训练分块')});
 Object.entries(s.notes).forEach(([k,v])=>{if(!/^(?:[1-9]|[12]\d|30)$/.test(k)||typeof v!=='string'||v.length>2000)throw new Error('备份中有无效笔记')});
 if(s.plan&&(!Array.isArray(s.plan.weights)||s.plan.weights.length!==4||s.plan.weights.some(w=>!Number.isFinite(w)||w<=0)||Math.abs(s.plan.weights.reduce((a,b)=>a+b,0)-1)>.001||!Array.isArray(s.plan.focus)||s.plan.focus.some(k=>!SKILLS.includes(k))||typeof s.plan.mode!=='string'))throw new Error('备份中有无效计划');
 return s;
}
