'use client';

import {useState} from 'react';
import {GitFork,Link2} from 'lucide-react';
import {api,displayError} from '@/lib/client';
import {CODING_TOPICS} from '@/lib/types';
import type {CodingTopic,GithubReference,ReferenceInput} from '@/lib/types';
import {Button,ErrorNotice} from './UI';
import {ReferenceSummary} from './ReferenceSummary';

export function ReferencePanel({value,onChange,disabled,onBusyChange}:{value?:ReferenceInput;onChange:(value:ReferenceInput|undefined)=>void;disabled:boolean;onBusyChange:(busy:boolean)=>void}){
  const [username,setUsername]=useState('');
  const [skills,setSkills]=useState(value?.linkedinSkills||'');
  const [topics,setTopics]=useState<CodingTopic[]>(value?.leetcodeTopics||[]);
  const [github,setGithub]=useState<GithubReference|null>(null);
  const [snapshotId,setSnapshotId]=useState<string>();
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  function invalidate(){onChange(undefined);setError('');}
  async function importGithub(){
    if(loading||disabled)return;
    invalidate();setGithub(null);setLoading(true);onBusyChange(true);
    try{const imported=await api.github(username.trim());setGithub(imported.github);setSnapshotId(imported.snapshotId);}
    catch(err){setError(displayError(err));}
    finally{setLoading(false);onBusyChange(false);}
  }
  const hasData=!!github?.repos.length||!!skills.trim()||topics.length>0;
  const needsImport=!!username.trim()&&!github;
  return <details className="reference-panel">
    <summary><Link2 aria-hidden="true" /><span>Personalize your interview<small>Optional · your projects, skills & coding topics</small></span></summary>
    <div className="reference-content">
      <p className="muted">Review the details below, then opt in. No account passwords or access tokens are needed.</p>
      <fieldset disabled={disabled||loading}><legend><GitFork aria-hidden="true" /> GitHub public projects</legend>
        <label htmlFor="github-username">GitHub username</label><div className="github-import"><input id="github-username" autoComplete="off" autoCapitalize="none" spellCheck={false} maxLength={39} value={username} placeholder="e.g. octocat" onChange={event=>{setUsername(event.target.value);setGithub(null);invalidate();}}/><Button variant="secondary" disabled={!username.trim()||loading} busy={loading} onClick={()=>void importGithub()}>{loading?'Importing…':'Import projects'}</Button></div>
        <p className="muted">Read-only, public repositories only. Up to 3 recent projects; demo templates discuss the first one.</p>
        {github ? <><ReferenceSummary open references={{github,linkedinSkills:'',leetcodeTopics:[]}}/><Button variant="text" onClick={()=>{setUsername('');setGithub(null);invalidate();}}>Clear GitHub</Button></>:null}
      </fieldset>
      {error ? <ErrorNotice message={error}/>:null}
      <fieldset disabled={disabled||loading}><legend>LinkedIn skills / experience <span className="muted">· manual</span></legend><label htmlFor="linkedin-skills">Paste only the skills or experience you want to practice</label><textarea id="linkedin-skills" className="skills-input" rows={3} maxLength={1200} value={skills} placeholder="React, SQL; a campus dashboard project…" onChange={event=>{setSkills(event.target.value);invalidate();}}/><p className="muted">Self-reported, not fetched from LinkedIn. Don’t include contact details or confidential information.</p></fieldset>
      <fieldset disabled={disabled||loading}><legend>LeetCode weak topics <span className="muted">· manual</span></legend><p className="muted">Choose up to 3 topics. No LeetCode account or solved history is accessed.</p><div className="topic-options">{(Object.entries(CODING_TOPICS) as [CodingTopic,string][]).map(([topic,label])=><label key={topic} className={topics.includes(topic)?'selected':''}><input type="checkbox" checked={topics.includes(topic)} disabled={!topics.includes(topic)&&topics.length>=3} onChange={event=>{setTopics(event.target.checked?[...topics,topic]:topics.filter(item=>item!==topic));invalidate();}}/>{label}</label>)}</div><p className="muted">Original coding practice—not copied LeetCode questions. No code is executed.</p></fieldset>
      <label className="reference-consent"><input type="checkbox" checked={!!value} disabled={disabled||loading||!hasData||needsImport} onChange={event=>onChange(event.target.checked?{consent:true,githubUsername:github?.repos.length?github.username:'',githubSnapshotId:github?.repos.length?snapshotId:undefined,linkedinSkills:skills.trim(),leetcodeTopics:topics}:undefined)}/><span>Use these reviewed details to tailor this interview<small>GitHub previews are stored privately in Convex and usable for 30 minutes. Later imports or Delete my history remove old previews. Opted-in details are saved with your interview; browser drafts clear on sign-out. No details are sent to an AI provider. Editing a detail or leaving setup requires a fresh opt-in.</small></span></label>
      <p role="status" className="reference-status">{value?'Personalization enabled. Your next interview will use these references.':needsImport?'Import or clear the GitHub username before opting in.':'Personalization is off. Details are not used or saved with interviews until you opt in.'}</p>
      <Button variant="text" disabled={disabled||loading} onClick={()=>{setUsername('');setSkills('');setTopics([]);setGithub(null);invalidate();}}>Clear all references</Button>
    </div>
  </details>;
}
