'use client';

import { ArrowRight, History } from 'lucide-react';
import type { RoleOption } from '@/lib/client';
import { formatDate, levelLabel, modeLabel } from '@/lib/client';
import type { Session } from '@/lib/types';
import { Button, EmptyState, LoadingScreen, RoleIcon } from './UI';

export function HistoryView({ sessions, roles, loading, busy, onOpen, onPractice }: { sessions: Session[]; roles: RoleOption[]; loading: boolean; busy: boolean; onOpen: (session: Session) => void; onPractice: () => void }) {
  return <div className="page history-page"><div className="page-heading"><div><h1>A little better, every session.</h1><p>Your completed interviews, all in one place.</p></div><Button variant="secondary" onClick={onPractice} disabled={busy}>New interview<ArrowRight aria-hidden="true" /></Button></div>{loading ? <LoadingScreen label="Loading your saved interviews…" /> : sessions.length ? <div className="history-list">{sessions.filter(s => s.status === 'completed').map(session => {
    const role = roles.find(r => r.id === session.roleId);
    return <div className="history-row" key={session.id}><span className="history-icon"><RoleIcon name={role?.icon} /></span><div><h2>{role?.title || session.roleId.replaceAll('_', ' ')}</h2><p>{formatDate(session.completedAt || session.createdAt)} · {levelLabel(session.level)} · {modeLabel(session.mode)}</p></div><Button variant="secondary" disabled={busy} onClick={() => onOpen(session)}>View report<ArrowRight aria-hidden="true" /></Button></div>;
  })}</div> : <EmptyState title="Your progress begins with one interview." action={onPractice}>Finish a practice session and your report will appear here.</EmptyState>}<p className="history-footer"><History aria-hidden="true" />History is private to your signed-in account and saved in Convex.</p></div>;
}
