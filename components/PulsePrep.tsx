'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, displayError, feedbackKey, storage as accountStorage, type RolesResponse, type Setup } from '@/lib/client';
import type { Report, Session } from '@/lib/types';
import { AppShell, type View } from './AppShell';
import { SetupView } from './SetupView';
import { InterviewView } from './InterviewView';
import { ReportView } from './ReportView';
import { HistoryView } from './HistoryView';
import { RubricView } from './RubricView';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorNotice, LoadingScreen } from './UI';

export function PulsePrep({cloudHistory}:{cloudHistory?:Session[]}) {
  const [storage]=useState(()=>accountStorage.capture());
  const [catalog, setCatalog] = useState<RolesResponse | null>(null);
  const [setup, setSetup] = useState<Setup>({ roleId: '', level: 'fresher', mode: 'practice', demo: false });
  const [session, setSession] = useState<Session | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [view, setView] = useState<View>('setup');
  const [history, setHistory] = useState<Session[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [confirmStart, setConfirmStart] = useState(false);
  const [sampleProgress, setSampleProgress] = useState('');
  const lock = useRef(false);
  const sample = useRef<Session | null>(null);
  useEffect(()=>{if(cloudHistory)setHistory(cloudHistory);},[cloudHistory]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const activeId = storage.read('activeSessionId');
    const reportId = storage.read('lastReportId');
    async function load() {
      const [rolesResult, restoreResult] = await Promise.allSettled([
        api.roles(controller.signal),
        activeId ? api.session(activeId, controller.signal) : reportId ? api.report(reportId) : Promise.resolve(null),
      ]);
      if (controller.signal.aborted) return;
      if (rolesResult.status === 'fulfilled') setCatalog(rolesResult.value);
      else setError(displayError(rolesResult.reason));
      if (restoreResult.status === 'fulfilled' && restoreResult.value) {
        if ('session' in restoreResult.value) {
          const restored = restoreResult.value.session;
          if (restored.status === 'in_progress') { setSession(restored); setView('interview'); }
          else {
            try {
              const result = await api.report(restored.id);
              if (controller.signal.aborted) return;
              setReport(result.report); setView('report');
              storage.remove('activeSessionId'); storage.write('lastReportId', result.report.id);
            } catch (err) { if (!controller.signal.aborted) setError(displayError(err)); }
          }
        } else { setReport(restoreResult.value.report); setView('report'); }
      } else if (restoreResult.status === 'rejected') {
        if (restoreResult.reason instanceof ApiError && restoreResult.reason.code === 'NOT_FOUND') {
          storage.remove(activeId ? 'activeSessionId' : 'lastReportId');
          setError('That saved interview is no longer available in this browser. You can start a new one.');
        } else setError(displayError(restoreResult.reason));
      }
      if (!controller.signal.aborted) setLoading(false);
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [view]);

  function showReport(next: Report, finishedActive = false) {
    setReport(next); setView('report'); storage.write('lastReportId', next.id);
    if (finishedActive) {
      storage.remove('activeSessionId'); storage.remove(feedbackKey(next.sessionId));
      setSession(null);
    }
  }

  async function navigate(target: View) {
    if (lock.current || answerBusy) return;
    if(target!=='setup')setSetup(previous=>({...previous,references:undefined}));
    setError(''); setView(target);
    if (target === 'history') {
      lock.current = true; setBusy('history');
      try { setHistory((await api.history()).sessions); }
      catch (err) { setError(displayError(err)); }
      finally { lock.current = false; setBusy(null); }
    }
  }

  async function start() {
    if (lock.current || !setup.roleId || !catalog) return;
    lock.current = true; setBusy('start'); setError('');
    try {
      const { session: next } = await api.create({ ...setup, demo: setup.demo || !catalog.ai.available || catalog.ai.cacheOnly });
      // Profile drafts are not stored in the browser or silently reused for the next interview.
      setSetup(previous=>({...previous,references:undefined}));
      storage.write('activeSessionId', next.id); storage.remove('lastReportId');
      setSession(next); setView('interview');
    } catch (err) { setError(displayError(err)); }
    finally { lock.current = false; setBusy(null); }
  }

  async function finish() {
    if (lock.current || answerBusy || !session) return;
    lock.current = true; setBusy('finish'); setError('');
    try { showReport((await api.finish(session.id)).report, true); }
    catch (err) { setError(displayError(err)); }
    finally { lock.current = false; setBusy(null); }
  }

  async function openReport(completed: Session) {
    if (lock.current) return;
    lock.current = true; setBusy('report'); setError('');
    try { showReport((await api.report(completed.id)).report); }
    catch (err) { setError(displayError(err)); }
    finally { lock.current = false; setBusy(null); }
  }

  async function sampleReport() {
    const roleId = setup.roleId || catalog?.roles[0]?.id;
    if (lock.current || !roleId) return;
    lock.current = true; setBusy('sample'); setError(''); setSampleProgress('Preparing a demo interview…');
    try {
      // A sample report intentionally uses the generic role bank, not personal profile details.
      let next = sample.current?.roleId === roleId ? (await api.session(sample.current.id)).session : (await api.create({ roleId, level: setup.level, mode: 'full', demo: true })).session;
      sample.current = next;
      for (const question of next.questions) {
        if (question.status !== 'pending') continue;
        if (!question.sampleAnswer) throw new ApiError('The demo answer is unavailable. Please start a demo interview instead.');
        setSampleProgress(`Preparing sample answer ${question.position} of ${next.questions.length}…`);
        next = (await api.answer(next.id, question.id, question.sampleAnswer)).session;
        sample.current = next;
      }
      setSampleProgress('Putting your sample report together…');
      showReport((await api.finish(next.id)).report);
      sample.current = null;
    } catch (err) { setError(displayError(err)); }
    finally { lock.current = false; setBusy(null); setSampleProgress(''); }
  }

  const roleTitle = (id: string) => catalog?.roles.find(role => role.id === id)?.title || id.replaceAll('_', ' ');
  return <AppShell view={view} ai={catalog?.ai || null} busy={!!busy || answerBusy || loading} onNavigate={target => { void navigate(target); }}>
    {error ? <div className="global-error"><ErrorNotice message={error} onRetry={!catalog || loading ? () => setAttempt(value => value + 1) : undefined} /></div> : null}
    {sampleProgress ? <p className="sample-progress" role="status">{sampleProgress}</p> : null}
    {loading ? <LoadingScreen /> : !catalog ? <div className="page"><h1>Let’s get you connected.</h1><p className="muted">Retry above to load your practice workspace.</p></div> : <>
      {view === 'setup' ? <SetupView roles={catalog.roles} setup={setup} ai={catalog.ai} activeSession={session} busy={busy} onChange={setSetup} onStart={() => session?.status === 'in_progress' ? setConfirmStart(true) : void start()} onSample={() => { void sampleReport(); }} onResume={() => { setError(''); setView('interview'); }} /> : null}
      {view === 'interview' && session ? <InterviewView key={session.id} session={session} roleTitle={roleTitle(session.roleId)} finishing={busy === 'finish'} onUpdate={setSession} onFinish={() => { void finish(); }} onBusyChange={setAnswerBusy} /> : null}
      {view === 'report' && report ? <ReportView key={report.id} report={report} roleTitle={roleTitle(report.session.roleId)} onAgain={() => { setSetup(prev => ({ ...prev, roleId: report.session.roleId, level: report.session.level, mode: report.session.mode })); void navigate('setup'); }} /> : null}
      {view === 'history' ? <HistoryView sessions={history} roles={catalog.roles} loading={busy === 'history'} busy={!!busy} onOpen={completed => { void openReport(completed); }} onPractice={() => { void navigate('setup'); }} /> : null}
      {view === 'rubric' ? <RubricView onPractice={() => { void navigate('setup'); }} /> : null}
    </>}
    {confirmStart ? <ConfirmDialog title="Start a fresh interview?" confirmLabel="Start new interview" onCancel={() => setConfirmStart(false)} onConfirm={() => { setConfirmStart(false); void start(); }}><p>Your current interview is unfinished. Starting a new one replaces the interview that resumes on this device. Your completed reports will still be in history.</p></ConfirmDialog> : null}
  </AppShell>;
}
