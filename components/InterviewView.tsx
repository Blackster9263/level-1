'use client';

import { useRef, useState } from 'react';
import { ArrowRight, Check, CircleCheck, Minus } from 'lucide-react';
import { api, ApiError, displayError, draftKey, feedbackKey, levelLabel, modeLabel, storage as accountStorage } from '@/lib/client';
import type { Evaluation, Question, Session } from '@/lib/types';
import { AnswerBox } from './AnswerBox';
import { QuestionPanel } from './QuestionPanel';
import { RubricPanel } from './RubricPanel';
import { FeedbackCard } from './FeedbackCard';
import { ConfirmDialog } from './ConfirmDialog';
import { Button, ErrorNotice, SourceNotice } from './UI';
import {ReferenceSummary} from './ReferenceSummary';

type Feedback = { question: Question; answer: Evaluation };
function restoredFeedback(session: Session,storage:ReturnType<typeof accountStorage.capture>): Feedback | null {
  if (session.mode !== 'practice') return null;
  const question = session.questions.find(q => q.id === storage.read(feedbackKey(session.id)));
  return question?.answer ? { question, answer: question.answer } : null;
}

export function InterviewView({ session, roleTitle, finishing, onUpdate, onFinish, onBusyChange }: { session: Session; roleTitle: string; finishing: boolean; onUpdate: (session: Session) => void; onFinish: () => void; onBusyChange: (busy: boolean) => void }) {
  const [storage]=useState(()=>accountStorage.capture());
  const [feedback, setFeedback] = useState<Feedback | null>(() => restoredFeedback(session,storage));
  const [busy, setBusy] = useState<'answer' | 'skip' | null>(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const lock = useRef(false);
  const pending = session.questions.filter(q => q.status === 'pending');
  const current = session.questions[session.current];
  const question = feedback?.question || (current?.status === 'pending' ? current : pending[0]);
  const done = session.questions.length - pending.length;
  const blocked = !!busy || finishing;

  async function act(action: 'answer' | 'skip', text = '') {
    if (lock.current || !question || feedback || finishing) return;
    lock.current = true;
    setBusy(action);
    onBusyChange(true);
    setError('');
    try {
      if (action === 'answer') {
        const result = await api.answer(session.id, question.id, text);
        if (session.mode === 'practice' && result.answer) {
          // The server has already moved current; keep the submitted question visible until Next.
          setFeedback({ question, answer: result.answer });
          storage.write(feedbackKey(session.id), question.id);
        }
        storage.remove(draftKey(session.id, question.id));
        onUpdate(result.session);
      } else {
        const result = await api.skip(session.id, question.id);
        storage.remove(draftKey(session.id, question.id));
        onUpdate(result.session);
      }
      if (session.mode === 'full' || action === 'skip') document.getElementById('main')?.focus({ preventScroll: true });
    } catch (err) {
      // A lost response or a second tab can leave the server ahead of the screen.
      // Reconcile only committed state; keep an unsaved draft intact on failure.
      if (err instanceof ApiError && ['ALREADY_ANSWERED', 'SESSION_FINISHED', 'NETWORK'].includes(err.code)) {
        try {
          const latest = (await api.session(session.id)).session;
          const saved = latest.questions.find(item => item.id === question.id);
          if (saved && saved.status !== 'pending') {
            if (session.mode === 'practice' && saved.answer && latest.status !== 'completed') {
              setFeedback({ question: saved, answer: saved.answer });
              storage.write(feedbackKey(session.id), saved.id);
            }
            storage.remove(draftKey(session.id, question.id));
            onUpdate(latest);
            return;
          }
        } catch { /* The original message is more useful; the draft remains available. */ }
      }
      setError(displayError(err));
    }
    finally { lock.current = false; setBusy(null); onBusyChange(false); }
  }

  function next() {
    setError('');
    if (!pending.length) { onFinish(); return; }
    storage.remove(feedbackKey(session.id));
    setFeedback(null);
    document.getElementById('main')?.focus({ preventScroll: true });
  }

  return <div className="page interview-page"><div className="interview-heading"><div><p className="context-label">{roleTitle} <span>/</span> {levelLabel(session.level)} <span>/</span> {modeLabel(session.mode)}</p><h1>A little practice.<br />A stronger answer.</h1></div><Button variant="secondary" disabled={blocked} onClick={() => pending.length ? setConfirm(true) : onFinish()}>{pending.length ? 'Finish early' : 'Finish Interview'}</Button></div>
    <div className="progress-head"><strong>{question ? `Question ${question.position} of ${session.questions.length}` : 'All questions complete'}</strong><span>{done} of {session.questions.length} complete</span></div><div className="progress-track" role="progressbar" aria-label="Interview progress" aria-valuemin={0} aria-valuemax={session.questions.length} aria-valuenow={done}><span style={{ width: `${done / Math.max(1, session.questions.length) * 100}%` }} /></div>
    <SourceNotice source={session.source} compact />
    <ReferenceSummary references={session.references}/>
    {session.mode === 'full' ? <p className="full-mode-note">Full mock: your scores and feedback will appear after you finish.</p> : null}
    <div className="interview-layout"><div className="interview-primary">{question ? <>
      <QuestionPanel question={question} total={session.questions.length} />
      {error ? <ErrorNotice message={error} /> : null}
      {feedback ? <FeedbackCard answer={feedback.answer} last={!pending.length} busy={finishing} onNext={next} /> : <AnswerBox key={question.id} sessionId={session.id} question={question} busy={busy} disabled={finishing} onSubmit={text => { void act('answer', text); }} onSkip={() => { void act('skip'); }} />}
    </> : <section className="complete-panel"><CircleCheck aria-hidden="true" /><h2>You’ve put in the practice.</h2><p>{session.mode === 'full' ? 'Finish your interview to reveal your scores, feedback, and model answers.' : 'Your answers are saved. Let’s bring your feedback together.'}</p>{error ? <ErrorNotice message={error} /> : null}<Button busy={finishing} onClick={onFinish}>Finish & view report<ArrowRight aria-hidden="true" /></Button></section>}</div>
    <div className="interview-aside"><RubricPanel behavioral={question?.type === 'behavioral'} /><div className="question-nav"><h2>Your session</h2><ol>{session.questions.map((item, i) => <li key={item.id} className={item.id === question?.id ? 'current' : ''} aria-current={item.id === question?.id ? 'step' : undefined}><span>{item.status === 'answered' ? <Check aria-hidden="true" /> : item.status === 'skipped' ? <Minus aria-hidden="true" /> : i + 1}</span><div><strong>Question {i + 1}</strong><small>{item.status === 'pending' ? item.type : item.status}</small></div></li>)}</ol></div></div></div>
    {confirm ? <ConfirmDialog title="Finish this interview?" confirmLabel="Finish & view report" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); onFinish(); }}><p>{pending.length} {pending.length === 1 ? 'question is' : 'questions are'} still unanswered. Unsubmitted answers count as zero; skipped questions are excluded from your average. Your current draft will not be submitted.</p></ConfirmDialog> : null}
  </div>;
}
