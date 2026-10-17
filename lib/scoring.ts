import type {Evaluation,Question,QuestionType,Readiness,Role,Source,Scores} from './types';
import {evaluationSchema} from './schemas';
import {PROMPT_VERSION} from './prompts';
export const mean=(values:number[])=>values.length?Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)):0;
export const readiness=(score:number):Readiness=>score>=7.5?{label:'Interview ready',tone:'success'}:score>=5?{label:'Good',tone:'good'}:{label:'Needs improvement',tone:'warning'};
export function normalizeEvaluation(value:unknown,type:QuestionType,text:string,source:Source):Evaluation {
  const parsed=evaluationSchema.parse(value);
  if(type==='technical')parsed.scores.star=null;
  if(type==='behavioral'&&parsed.scores.star===null)throw new Error('Behavioral STAR score is required');
  return {...parsed,text,wordCount:text.trim().split(/\s+/).filter(Boolean).length,answerScore:mean(Object.values(parsed.scores).filter((v):v is number=>v!==null)),source,promptVersion:PROMPT_VERSION};
}
export function summarize(questions:Question[]){
  const included=questions.filter(q=>q.status!=='skipped');
  const averages:Scores={clarity:0,relevance:0,domain:0,communication:0,star:null};
  for(const key of ['clarity','relevance','domain','communication','star'] as const){
    const applicable=included.filter(q=>key!=='star'||q.type==='behavioral');
    if(key==='star')averages.star=applicable.length?mean(applicable.map(q=>q.answer?.scores.star??0)):null;
    else averages[key]=mean(applicable.map(q=>q.answer?.scores[key]??0));
  }
  const overall=mean(included.map(q=>q.answer?.answerScore??0));
  const tips=[...new Set(included.filter(q=>q.answer).sort((a,b)=>(a.answer?.answerScore??0)-(b.answer?.answerScore??0)).map(q=>q.answer!.improvementTip))];
  for(const tip of ['Use a concrete example and explain your own contribution.','End with a result or a lesson, using only numbers you can support.','Review a model answer, then try explaining it in your own words.'])if(tips.length<3)tips.push(tip);
  return {overall,readiness:readiness(overall),averages,tips:tips.slice(0,4),answered:questions.filter(q=>q.status==='answered').length,skipped:questions.filter(q=>q.status==='skipped').length,unanswered:questions.filter(q=>q.status==='pending').length};
}
export function offlineScore(question:Role['questions'][number],text:string):Evaluation {
  const words=text.trim().split(/\s+/).filter(Boolean).length;
  const signals=question.concepts.filter(term=>text.toLowerCase().includes(term.toLowerCase()));
  const ratio=signals.length/Math.max(1,question.concepts.length);
  const signposted=/\b(first|then|because|however|for example|finally|result)\b/i.test(text);
  const star=[/\b(situation|project|during|when|team)\b/i,/\b(task|responsibility|goal|needed|had to)\b/i,/\b(I would|I built|I created|I led|action|I tested|I proposed)\b/i,/\b(result|improved|reduced|learned|delivered|outcome)\b/i].filter(p=>p.test(text)).length;
  const relevant=ratio>0||(question.type==='behavioral'&&star>=2);
  // ponytail: lexical demo signals cannot assess correctness; replace with Gemini for live evaluation.
  const scores={clarity:relevant?Math.min(9,Math.round(3+words/25)+(signposted?1:0)):3,relevance:relevant?Math.min(9,Math.round(5+ratio*4)):2,domain:relevant?Math.min(9,Math.round(4+ratio*5)):1,communication:relevant?Math.min(9,Math.round(4+words/30)):4,star:question.type==='behavioral'?Math.min(9,1+star*2):null};
  const excerpt=text.split(/\s+/).slice(0,12).join(' ');
  return normalizeEvaluation({scores,feedback:`Demo lexical review of "${excerpt}…": ${signals.length?'found '+signals.slice(0,3).join(', '):'the main topic signals were not found'}. These signals do not verify factual correctness.`,improvementTip:relevant?(question.type==='behavioral'&&star<4?'Make the situation, task, action and result explicit.':'Explain a concrete example and a limitation or trade-off, then close with the result.'):'Respond directly to '+(question.concepts.slice(0,2).join(' and ')||'the question')+' before adding an example.',modelAnswer:question.modelAnswer},question.type as QuestionType,text,'cache');
}
