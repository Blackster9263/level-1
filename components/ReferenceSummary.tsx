import {CODING_TOPICS} from '@/lib/types';
import type {ReferenceContext} from '@/lib/types';

export function ReferenceSummary({references,open=false}:{references:ReferenceContext|null|undefined;open?:boolean}){
  if(!references)return null;
  return <details className="reference-summary" open={open}>
    <summary>Interview references</summary>
    <div>
      {references.github ? <section><h3>GitHub · public metadata</h3><p className="muted">@{references.github.username} · Retrieved {new Date(references.github.fetchedAt).toLocaleString()} · Ownership and proficiency not verified.</p>{references.github.repos.length ? <ul>{references.github.repos.map(repo=><li key={repo.url}><a href={repo.url} target="_blank" rel="noopener noreferrer">{repo.name}</a>{repo.language ? <span> · {repo.language}</span>:null}{repo.description ? <p>{repo.description}</p>:null}</li>)}</ul>:<p>No eligible public projects found. Forks and archived projects are excluded.</p>}</section>:null}
      {references.linkedinSkills ? <section><h3>LinkedIn skills / experience · self-reported</h3><p>{references.linkedinSkills}</p></section>:null}
      {references.leetcodeTopics.length ? <section><h3>LeetCode weak topics · self-reported</h3><p>{references.leetcodeTopics.map(topic=>CODING_TOPICS[topic]).join(', ')}. Exercises are original PulsePrep questions, not copied from LeetCode.</p></section>:null}
      <p className="muted">These references guide practice questions, not your score or a hiring decision. Saved interviews keep their original snapshot.</p>
    </div>
  </details>;
}
