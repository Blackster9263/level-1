'use client';

import { Activity, Play, History, ChartNoAxesColumnIncreasing, GraduationCap, CircleHelp } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AIStatus } from '@/lib/client';

export type View = 'setup' | 'interview' | 'report' | 'history' | 'rubric';
const titles: Record<View, string> = { setup: 'New interview', interview: 'Your interview', report: 'Interview report', history: 'Session history', rubric: 'How scoring works' };

export function AppShell({ view, ai, busy, onNavigate, children }: { view: View; ai: AIStatus | null; busy: boolean; onNavigate: (view: View) => void; children: ReactNode }) {
  const live = ai?.available && !ai.cacheOnly;
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate('setup')} disabled={busy} aria-label="PulsePrep home"><Activity aria-hidden="true" /><span>pulse<span>prep</span></span></button>
      <nav aria-label="Main navigation">{([
        ['setup', Play, 'Practice'], ['history', History, 'Session history'], ['rubric', ChartNoAxesColumnIncreasing, 'How scoring works'],
      ] as const).map(([target, Icon, label]) => <button key={target} className={`nav-item ${(view === target || target === 'setup' && ['interview', 'report'].includes(view)) ? 'active' : ''}`} aria-current={(view === target || target === 'setup' && ['interview', 'report'].includes(view)) ? 'page' : undefined} onClick={() => onNavigate(target)} disabled={busy}><Icon aria-hidden="true" /><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><GraduationCap aria-hidden="true" /><span>Your space to get better.</span></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span aria-hidden="true">/</span><strong>{titles[view]}</strong></div><div className="header-right"><span className="service-status"><i className={live ? 'live' : ''} />{!ai ? 'Connecting…' : live ? 'Live AI ready' : 'Demo available'}</span><button className="help-link" onClick={() => onNavigate('rubric')} disabled={busy}><CircleHelp aria-hidden="true" /><span>Help</span></button></div></header>
      <main id="main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
