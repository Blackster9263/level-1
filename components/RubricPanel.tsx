import { CircleCheck, Info } from 'lucide-react';
import { DIMENSIONS } from '@/lib/types';

export const rubricDescriptions = {
  clarity: 'A direct answer, a logical sequence, and a clear takeaway.',
  relevance: 'An answer to the actual question, connected to the role.',
  domain: 'Accurate concepts, useful examples, and considered trade-offs.',
  communication: 'Plain language and complete, easy-to-follow explanations.',
  star: 'Situation, Task, Action, Result. Behavioral questions only.',
};

export function RubricPanel({ behavioral }: { behavioral: boolean }) {
  return <aside className="rubric-panel" aria-label="Scoring rubric"><h2>What we look for</h2><div className="rubric-items">{Object.entries(DIMENSIONS).filter(([key]) => key !== 'star' || behavioral).map(([key, label]) => <div key={key}><CircleCheck aria-hidden="true" /><div><strong>{label}</strong><p>{rubricDescriptions[key as keyof typeof rubricDescriptions]}</p></div></div>)}</div><p className="rubric-footnote"><Info aria-hidden="true" />{behavioral ? 'Five dimensions, scored out of 10.' : 'Four dimensions. STAR applies to behavioral questions.'}</p></aside>;
}
