'use client';

import { ArrowRight, ChevronDown, Lightbulb } from 'lucide-react';
import type { Evaluation } from '@/lib/types';
import { ScoreBars } from './ScoreBar';
import { Button, SourceNotice } from './UI';

export function FeedbackCard({ answer, last, busy, onNext }: { answer: Evaluation; last: boolean; busy: boolean; onNext: () => void }) {
  return <section className="feedback-panel" aria-labelledby="feedback-title"><div className="feedback-heading"><div><p className="muted">Answer feedback</p><h2 id="feedback-title">One answer closer to ready.</h2></div><div className="mini-score">{answer.answerScore.toFixed(1)}<small> / 10</small></div></div><SourceNotice source={answer.source} compact /><ScoreBars scores={answer.scores} /><p className="feedback-copy">{answer.feedback}</p><div className="improvement"><Lightbulb aria-hidden="true" /><div><h3>For your next answer</h3><p>{answer.improvementTip}</p></div></div><details className="model-answer"><summary>See a model answer <ChevronDown aria-hidden="true" /></summary><p>{answer.modelAnswer}</p></details><div className="feedback-bottom"><Button busy={busy} onClick={onNext}>{last ? 'Finish & view report' : 'Next Question'}<ArrowRight aria-hidden="true" /></Button></div></section>;
}
