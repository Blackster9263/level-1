import {z} from 'zod';
import {CODING_TOPICS} from './types';
import type {CodingTopic,GithubReference,ReferenceContext,ReferenceInput,Role} from './types';

export const githubUsernameSchema=z.string().trim().regex(/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i,'Enter a GitHub username, not a URL.');
const topicSchema=z.enum(['arrays','hashing','strings','trees','graphs','dp']);
export const referenceInputSchema=z.object({consent:z.literal(true),githubUsername:z.union([z.literal(''),githubUsernameSchema]).default(''),githubSnapshotId:z.string().uuid().optional(),linkedinSkills:z.string().trim().max(1200).default(''),leetcodeTopics:z.array(topicSchema).max(3).default([])}).refine(value=>!!value.githubUsername===!!value.githubSnapshotId,{message:'Import and review GitHub projects before using them.',path:['githubUsername']});
const repoName=z.string().regex(/^[a-z\d_.-]{1,100}$/i).refine(name=>name!=='.'&&name!=='..');
const contextSchema=z.object({github:z.object({username:githubUsernameSchema,fetchedAt:z.iso.datetime(),repos:z.array(z.object({name:repoName,description:z.string().max(280),language:z.string().max(80).nullable(),url:z.string().regex(/^https:\/\/github\.com\/[a-z\d-]+\/[a-z\d_.-]+$/i)})).max(3)}).nullable(),linkedinSkills:z.string().max(1200),leetcodeTopics:z.array(topicSchema).max(3)});
const responseSchema=z.array(z.object({name:repoName,description:z.string().max(10000).nullable().default(null),language:z.string().max(80).nullable().default(null),fork:z.boolean(),archived:z.boolean(),private:z.boolean().optional(),owner:z.object({login:githubUsernameSchema})})).max(12);
export class ReferenceError extends Error {constructor(public code:string,message:string,public status=400){super(message);}}
// ponytail: bounded in-process public-data cache; use shared storage only for a multi-server deployment.
const cache=new Map<string,{expires:number;value:GithubReference}>();
// ponytail: fifty owner-bound reviewed previews in memory; restart/eviction requires explicit re-import, never a silent refetch.
const snapshots=new Map<string,{ownerId:string;github:GithubReference}>();

export async function fetchGithub(username:string,fetcher:typeof fetch=fetch):Promise<GithubReference>{
  const parsed=githubUsernameSchema.safeParse(username);
  if(!parsed.success)throw new ReferenceError('INVALID_GITHUB','Enter a GitHub username, not a URL.');
  username=parsed.data;
  const key=username.toLowerCase(),saved=cache.get(key);
  if(fetcher===fetch&&saved&&saved.expires>Date.now())return saved.value;
  try{
    const response=await fetcher(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=12&sort=updated&type=owner`,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'PulsePrep-Hackathon'},redirect:'error',credentials:'omit',signal:AbortSignal.timeout(6000)});
    if(response.status===404)throw new ReferenceError('GITHUB_NOT_FOUND','That GitHub user was not found. Check the username.',404);
    if([403,429].includes(response.status))throw new ReferenceError('GITHUB_LIMIT','GitHub is limiting requests. Try later, or clear GitHub and use manual references.',429);
    if(!response.ok)throw new ReferenceError('GITHUB_UNAVAILABLE','GitHub is unavailable. Try again, or continue without importing.',502);
    const reader=response.body?.getReader();if(!reader)throw new Error('Empty body');
    let raw='',bytes=0;const decoder=new TextDecoder();
    try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>512*1024){await reader.cancel();throw new Error('Oversized body');}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();}finally{reader.releaseLock();}
    const rows=responseSchema.parse(JSON.parse(raw));
    if(rows.some(repo=>repo.owner.login.toLowerCase()!==key))throw new Error('Unexpected repository owner');
    const value:GithubReference={username:rows[0]?.owner.login||username,fetchedAt:new Date().toISOString(),repos:rows.filter(repo=>!repo.fork&&!repo.archived&&!repo.private).slice(0,3).map(repo=>({name:repo.name,description:(repo.description||'').slice(0,280),language:repo.language,url:`https://github.com/${encodeURIComponent(repo.owner.login)}/${encodeURIComponent(repo.name)}`}))};
    if(fetcher===fetch){cache.delete(key);if(cache.size>=50)cache.delete(cache.keys().next().value!);cache.set(key,{expires:Date.now()+300000,value});}
    return value;
  }catch(error){if(error instanceof ReferenceError)throw error;throw new ReferenceError('GITHUB_UNAVAILABLE','We could not read GitHub safely. Check your connection, retry, or clear GitHub to continue.',502);}
}

export async function importGithubReference(ownerId:string,username:string,fetcher:typeof fetch=fetch){
  const github=await fetchGithub(username,fetcher),snapshotId=crypto.randomUUID();
  if(snapshots.size>=50)snapshots.delete(snapshots.keys().next().value!);
  snapshots.set(snapshotId,{ownerId,github});
  return {snapshotId,github};
}

export async function buildReferences(input?:ReferenceInput,ownerId=''):Promise<ReferenceContext|null>{
  if(!input)return null;
  let github:GithubReference|null=null;
  if(input.githubUsername){const snapshot=snapshots.get(input.githubSnapshotId||'');
    if(!snapshot||snapshot.ownerId!==ownerId||snapshot.github.username.toLowerCase()!==input.githubUsername.toLowerCase())throw new ReferenceError('REIMPORT_GITHUB','This GitHub preview is no longer available. Import and review it again, or clear GitHub.',409);
    github=snapshot.github;
  }
  const context={github:github?.repos.length?github:null,linkedinSkills:input.linkedinSkills,leetcodeTopics:[...new Set(input.leetcodeTopics)]};
  return context.github||context.linkedinSkills||context.leetcodeTopics.length?context:null;
}
export function readReferences(raw:string):ReferenceContext|null{
  try{const result=contextSchema.safeParse(JSON.parse(raw));return result.success?result.data:null;}catch{return null;}
}

const exercises:Record<CodingTopic,{text:string;concepts:string[];answer:string}>={
  arrays:{text:'Given an integer array and target k, find the longest contiguous segment whose sum is k. Negative values are allowed. Explain your algorithm, complexity and edge cases.',concepts:['prefix sum','hash map','earliest','O(n)','negative'],answer:'Use a running prefix sum and a hash map from each prefix sum to its earliest index, initially 0 to -1. At index i, look for prefix sum minus k; that yields a matching segment. Keep the earliest index to maximize length. This works with negative values, unlike a positive-only sliding window. For [1,-1,5,-2,3] and k=3 the answer is length 4. Time is O(n), space O(n); test an empty array, zero target and no match.'},
  hashing:{text:'An ordered stream contains event labels. Return the first label that occurs exactly once. Explain a hash-map approach, complexity and what happens when no label is unique.',concepts:['hash map','frequency','order','O(n)','empty'],answer:'First count each label in a hash map of frequencies. Then scan the original order and return the first label with frequency one. For [a,b,a,c], return b. If no unique label exists, return an explicit empty result. Expected time is O(n), space O(u) for u unique labels. Test empty input, all duplicates and case-sensitive labels; define normalization before counting.'},
  strings:{text:'Find the length of the longest substring without repeated characters. Explain a sliding window, complexity and your assumptions about Unicode text.',concepts:['sliding window','last index','left','O(n)','Unicode'],answer:'Use a sliding window and a hash map of each character’s last index. Advance left to max(left, last index + 1) when a character repeats, update the last index and track the best length. For abba the result is 2; the left boundary must never move backward. Time is O(n), space O(u). Test empty input and all repeats. For Unicode, define whether characters mean code points or grapheme clusters before choosing iteration.'},
  trees:{text:'Find the minimum depth of a binary tree, measured in nodes from root to the nearest leaf. Explain why a missing child is not a leaf and compare BFS with DFS.',concepts:['BFS','queue','leaf','O(n)','empty'],answer:'Use BFS with a queue of node/depth pairs, starting with root at depth 1. Return at the first leaf, which has neither left nor right child. A missing child alone is not a leaf. An empty tree has depth 0. Time is O(n) in the worst case and space O(w) for maximum width. DFS is also valid if missing subtrees are handled carefully. Test a skewed tree and a root with only one child.'},
  graphs:{text:'A set of tasks has prerequisite edges. Determine whether all tasks can be scheduled, and produce a valid order if possible. Explain cycle detection and disconnected tasks.',concepts:['indegree','queue','cycle','O(V+E)','disconnected'],answer:'Build adjacency lists and an indegree count. Put all zero-indegree tasks in a queue. Repeatedly remove one, append it to the order and decrement its outgoing neighbors’ indegrees. Add newly zero-indegree tasks to the queue. If fewer than V tasks are emitted, there is a cycle. Complexity is O(V+E) time and space. Include isolated and disconnected tasks, and test self-loops and an empty graph.'},
  dp:{text:'Each item has a benefit, but adjacent items cannot both be chosen. Find the maximum total benefit, allowing an empty selection. Explain a dynamic-programming recurrence and space optimization.',concepts:['recurrence','previous','O(n)','O(1)','negative'],answer:'The recurrence is best[i] = max(best[i-1], best[i-2] + benefit[i]). Initialize empty selections to zero, so all negative values produce zero. Only the previous two states are needed: O(n) time and O(1) additional space for the value alone. For [2,7,9,3,1], the best value is 12. To reconstruct selected indices, keep decisions or the DP table. Test empty input, one item, ties and negative values.'},
};

export function personalizedSeeds(role:Role,context:ReferenceContext|null):Role['questions']{
  if(!context)return role.questions;
  const technical:Role['questions']=[];const behavioral:Role['questions']=[];
  const repo=context.github?.repos[0];
  if(repo){const answer='I would first verify the repository requirements and describe my actual contribution without claiming other contributors’ work. Then I would trace one user flow, explain an architecture decision and trade-off, test validation and failure paths, and identify a limitation. I would use reproducible tests or measurements to support any claimed result, rather than treating the language or repository name as proof of proficiency.';
    technical.push({id:'ref-project',type:'technical',text:`For the ${role.title} role, use the public repository "${repo.name}"${repo.language?' (primary language: '+repo.language+')':''} as a discussion reference. Explain one design decision, its trade-off, and how you would test a failure path. If it is not your project, say so and discuss it as a review exercise.`,concepts:['requirements','trade-off','test','validation','failure'],modelAnswer:answer,sampleAnswer:answer,reference:'GitHub public metadata — ownership and proficiency not verified'});
  }
  for(const topic of context.leetcodeTopics){const exercise=exercises[topic];technical.push({id:'ref-topic-'+topic,type:'technical',text:exercise.text,concepts:exercise.concepts,modelAnswer:exercise.answer,sampleAnswer:exercise.answer,reference:`${CODING_TOPICS[topic]} — self-reported weak topic; original PulsePrep exercise, not a LeetCode problem`});}
  if(context.linkedinSkills){const answer='Use a real situation from your own experience. Describe the situation and task, then the action you personally took using the relevant skill. Explain a trade-off, validation or test you performed, and the result or lesson learned. Do not invent metrics or achievements. If you have not used the skill yet, say so and clearly distinguish a proposed approach from a completed project.';
    behavioral.push({id:'ref-skills',type:'behavioral',text:`Your supplied skills/experience: "${context.linkedinSkills.slice(0,360)}". Describe a real situation where you used one of these skills: situation, task, your action, and result. If you lack experience, explain that and describe how you would approach a small project.`,concepts:['situation','task','action','result','trade-off'],modelAnswer:answer,sampleAnswer:'In a team project, the situation was unclear requirements. My task was to validate one user flow. I proposed a small prototype, explained a trade-off, and I tested validation and failure paths. The result was a clearer design; I learned to check assumptions early. This is an illustrative example, not a claim about your experience.',reference:'LinkedIn skills/experience — self-reported, not retrieved or verified by LinkedIn'});
  }
  return role.questions.map(question=>(question.type==='technical'?technical:behavioral).shift()||question);
}
