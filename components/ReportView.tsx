'use client';

import { useState, type CSSProperties } from 'react';
import { ArrowRight, Download, Printer, ChevronDown, Lightbulb, Info } from 'lucide-react';
import type { Question, Report } from '@/lib/types';
import { formatDate, levelLabel, modeLabel } from '@/lib/client';
import { Button, ErrorNotice, SourceNotice, Stepper } from './UI';
import { ScoreBars } from './ScoreBar';
import { ReadinessBadge } from './ReadinessBadge';
import {ReferenceSummary} from './ReferenceSummary';

function AnswerDetail({ question, index }: { question: Question; index: number }) {
  const answer = question.answer;
  return <details className="question-detail"><summary><span className="detail-number">{String(index + 1).padStart(2, '0')}</span><span className="detail-title">{question.text}<small>{question.type === 'technical' ? 'Technical' : 'Behavioral'} · {question.status === 'answered' ? 'Answered' : question.status === 'skipped' ? 'Skipped' : 'Unanswered'}</small></span><strong>{answer ? `${answer.answerScore.toFixed(1)} / 10` : question.status === 'skipped' ? 'Excluded' : '0 / 10'}</strong><ChevronDown aria-hidden="true" /></summary><div className="detail-body">{answer ? <><SourceNotice source={answer.source} compact /><div className="answer-comparison"><section><h3>Your answer</h3><p>{answer.text}</p></section><section><h3>Model answer</h3><p>{answer.modelAnswer}</p></section></div><ScoreBars scores={answer.scores} /><div className="breakdown-feedback"><h3>Feedback</h3><p>{answer.feedback}</p><h3>Try this next</h3><p>{answer.improvementTip}</p></div></> : <p>{question.status === 'skipped' ? 'You skipped this question. It is excluded from the average.' : 'This question was left unanswered and counts as zero in your overall score.'}</p>}</div></details>;
}

export function ReportView({ report, roleTitle, onAgain }: { report: Report; roleTitle: string; onAgain: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [downloaded, setDownloaded] = useState(false);
  const sources = new Set(report.session.questions.flatMap(q => q.answer ? [q.answer.source] : []));
  const source = sources.size > 1 ? 'mixed' : sources.has('cache') ? 'cache' : sources.has('llm') ? 'llm' : report.session.source;
  async function download() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    try {
      const { downloadReport } = await import('@/lib/pdf');
      await downloadReport(report, roleTitle);
      setDownloaded(true);
    } catch { setError('We couldn’t create the PDF. Try again, or use Print report and choose “Save as PDF”.'); }
    finally { setDownloading(false); }
  }
  return <article className="page report-page"><div className="page-heading"><div><h1>Your next step starts here.</h1><p>{roleTitle} · {levelLabel(report.session.level)} · {modeLabel(report.session.mode)}<br />{formatDate(report.session.completedAt || report.session.createdAt)}</p></div><div className="report-actions no-print"><Button variant="secondary" onClick={onAgain}>Practice Again</Button><Button onClick={() => { void download(); }} busy={downloading}><Download aria-hidden="true" />{downloading ? 'Creating PDF…' : 'Download PDF'}</Button></div></div><Stepper step={2} /><SourceNotice source={source} />{error ? <ErrorNotice message={error} /> : null}{downloaded ? <p role="status" className="download-success no-print">Your PDF is ready. Check your browser’s downloads.</p> : null}
    <ReferenceSummary references={report.session.references}/>
    <div className="report-overview"><section className="result-hero" aria-labelledby="readiness-title"><div className="score-orbit" style={{ '--score': `${Math.max(0, Math.min(10, report.overall)) * 10}%` } as CSSProperties}><div><strong>{report.overall.toFixed(1)}</strong><span>out of 10</span></div></div><div><ReadinessBadge readiness={report.readiness} /><h2 id="readiness-title">{report.readiness.tone === 'success' ? 'Ready for your next challenge.' : report.readiness.tone === 'good' ? 'You’re building momentum.' : 'A clear place to grow.'}</h2><p>Use this feedback to make your next answer more specific, structured, and confident.</p><div className="report-counts"><span><strong>{report.answered}</strong> answered</span><span><strong>{report.skipped}</strong> skipped</span><span><strong>{report.unanswered}</strong> unanswered</span></div>{report.previousScore !== null ? <p className="previous-score">Previous session: {report.previousScore.toFixed(1)} <ArrowRight aria-label="to" /> this session: {report.overall.toFixed(1)}</p> : null}</div></section><section className="dimension-panel"><h2>Your score breakdown</h2><p>Average across applicable questions</p><ScoreBars scores={report.averages} />{report.averages.star === null ? <p className="muted">STAR: not applicable to this session.</p> : null}</section></div>
    <p className="score-explanation"><Info aria-hidden="true" />Scores average applicable dimensions. Unanswered questions count as zero; skipped questions are excluded. STAR applies only to behavioral answers.</p>
    <section className="tips-section"><h2>What to practice next</h2><div className="tips-grid">{report.tips.slice(0, 4).map((tip, i) => <div className="tip-card" key={`${i}-${tip}`}><span>{String(i + 1).padStart(2, '0')}</span><p>{tip}</p></div>)}</div></section>
    <section className="breakdown"><div className="section-title"><h2>A closer look at your answers</h2><span>{report.session.questions.length} questions</span></div>{report.session.questions.map((question, i) => <AnswerDetail key={question.id} question={question} index={i} />)}</section><div className="report-end no-print"><p><Lightbulb aria-hidden="true" />Small improvements add up. Keep practicing.</p><div><Button variant="text" onClick={() => window.print()}><Printer aria-hidden="true" />Print report</Button><Button variant="secondary" onClick={onAgain}>Practice again<ArrowRight aria-hidden="true" /></Button></div></div><p className="print-footer">Generated by PulsePrep · Practice interviews. Get scored. Improve.</p>
  </article>;
}
