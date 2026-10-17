import { Code2, Users } from 'lucide-react';
import type { Question } from '@/lib/types';

export function QuestionPanel({ question, total }: { question: Question; total: number }) {
  return <section className="question-panel" aria-labelledby="question-text"><div className="question-meta"><span className={`badge ${question.type}`}>{question.type === 'technical' ? <Code2 aria-hidden="true" /> : <Users aria-hidden="true" />}{question.type === 'technical' ? 'Technical' : 'Behavioral'}</span><span>{String(question.position).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div><h2 id="question-text">{question.text}</h2>{question.reference?<p className="question-reference">Reference: {question.reference}</p>:null}<p>Take a moment. Clear reasoning matters more than a perfect answer.</p></section>;
}
