'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Sparkles, LockKeyhole } from 'lucide-react';
import { countWords, draftKey, storage as accountStorage } from '@/lib/client';
import type { Question } from '@/lib/types';
import { Button } from './UI';

export function AnswerBox({ sessionId, question, busy, disabled = false, onSubmit, onSkip }: { sessionId: string; question: Question; busy: 'answer' | 'skip' | null; disabled?: boolean; onSubmit: (text: string) => void; onSkip: () => void }) {
  const key = draftKey(sessionId, question.id);
  const [storage]=useState(()=>accountStorage.capture());
  const [text, setText] = useState(() => storage.read(key) || '');
  const [validation, setValidation] = useState('');
  const [storageBlocked, setStorageBlocked] = useState(false);
  const field = useRef<HTMLTextAreaElement>(null);
  const words = countWords(text);
  function change(value: string) {
    setText(value);
    setValidation('');
    setStorageBlocked(!storage.write(key, value));
  }
  function submit() {
    if (busy || disabled) return;
    if (words < 10) {
      setValidation('Write at least 10 words to get useful feedback. A few clear sentences are a good start.');
      field.current?.focus();
      return;
    }
    onSubmit(text);
  }
  return <form className="answer-panel" aria-busy={!!busy || disabled} onSubmit={event => { event.preventDefault(); submit(); }}><div className="answer-label"><label htmlFor="answer">Your answer</label>{question.sampleAnswer ? <Button variant="text" disabled={!!busy || disabled} onClick={() => { change(question.sampleAnswer!); field.current?.focus(); }}><Sparkles aria-hidden="true" />Try an example</Button> : null}</div>
    <textarea id="answer" ref={field} value={text} onChange={event => change(event.target.value)} onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); submit(); } }} readOnly={!!busy || disabled} aria-invalid={!!validation} aria-describedby="answer-hint answer-error answer-words" placeholder="Answer as you would in a real interview." maxLength={12000} />
    <div className="answer-footer"><span id="answer-words">{words} {words === 1 ? 'word' : 'words'} · minimum 10</span><span id="answer-hint">Ctrl / ⌘ + Enter to submit</span></div>
    {validation ? <p className="input-error" id="answer-error" role="alert">{validation}</p> : <span id="answer-error" />}
    {storageBlocked ? <p className="input-error" role="status">Browser storage is unavailable. Keep this page open to preserve your draft.</p> : null}
    <div className="answer-actions"><Button variant="secondary" disabled={!!busy || disabled} busy={busy === 'skip'} onClick={onSkip}>Skip question</Button><Button type="submit" disabled={!!busy || disabled} busy={busy === 'answer'}>{busy === 'answer' ? 'Saving your answer…' : 'Submit answer'}<ArrowRight aria-hidden="true" /></Button></div>
    <p className="privacy-line"><LockKeyhole aria-hidden="true" />Saved to your private practice session on this device.</p>
  </form>;
}
