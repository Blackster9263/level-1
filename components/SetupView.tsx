'use client';

import {useState} from 'react';
import { ArrowRight, FileText, List, Clock3, CircleCheck, Play, Sparkles } from 'lucide-react';
import type { AIStatus, RoleOption, Setup } from '@/lib/client';
import type { Session } from '@/lib/types';
import { DIMENSIONS } from '@/lib/types';
import { Button, RoleIcon, SourceNotice, Stepper } from './UI';
import { RoleCard } from './RoleCard';
import {ReferencePanel} from './ReferencePanel';

export function SetupView({ roles, setup, ai, activeSession, busy, onChange, onStart, onSample, onResume }: { roles: RoleOption[]; setup: Setup; ai: AIStatus; activeSession: Session | null; busy: string | null; onChange: (setup: Setup) => void; onStart: () => void; onSample: () => void; onResume: () => void }) {
  const role = roles.find(item => item.id === setup.roleId);
  const [importing,setImporting]=useState(false);
  const live = ai.available && !ai.cacheOnly;
  const demo = setup.demo || !live;
  return <div className="page setup-page">
    <div className="page-heading"><div><h1>Your next interview starts here.</h1><p>Practice interviews. Get scored. Improve before the real drive.</p></div><Button variant="secondary" className="sample-button" busy={busy === 'sample'} disabled={!!busy} onClick={onSample}><FileText aria-hidden="true" />{busy === 'sample' ? 'Building sample report…' : 'View sample report'}</Button></div>
    {activeSession?.status === 'in_progress' ? <div className="resume-banner"><Play aria-hidden="true" /><p>Your interview is saved. Pick up where you left off.</p><Button variant="secondary" onClick={onResume} disabled={!!busy}>Resume interview</Button></div> : null}
    <Stepper step={0} />
    <div className="setup-layout"><div>
      <fieldset className="role-fieldset" disabled={!!busy}><legend>What role are you preparing for?</legend><div className="role-grid">{roles.map(item => <RoleCard key={item.id} role={item} selected={item.id === setup.roleId} onSelect={() => onChange({ ...setup, roleId: item.id })} />)}</div></fieldset>
      <fieldset disabled={!!busy}><legend>What’s your experience level?</legend><div className="segmented">{(['fresher', '0-1'] as const).map(level => <label key={level} className={setup.level === level ? 'selected' : ''}><input type="radio" name="level" className="choice-input" checked={setup.level === level} onChange={() => onChange({ ...setup, level })} /><span>{level === 'fresher' ? 'Fresher' : '0–1 year'}</span></label>)}</div></fieldset>
      <fieldset disabled={!!busy}><legend>How do you want to practice?</legend><div className="mode-grid">{([
        ['practice', 'Practice mode', 'Feedback after every answer'], ['full', 'Full mock', 'Your report at the end'],
      ] as const).map(([mode, title, description]) => <label key={mode} className={`mode-option ${setup.mode === mode ? 'selected' : ''}`}><input type="radio" name="mode" className="choice-input" checked={setup.mode === mode} onChange={() => onChange({ ...setup, mode })} /><span className="selection-dot" aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span></label>)}</div></fieldset>
      <ReferencePanel value={setup.references} disabled={!!busy} onBusyChange={setImporting} onChange={references=>onChange({...setup,references})}/>
    </div><aside className="session-summary" aria-label="Session summary"><h2>Your practice, your pace</h2><div className="summary-role"><span><RoleIcon name={role?.icon} /></span><strong>{role?.title || 'Choose your role'}</strong></div><ul className="session-facts"><li><List aria-hidden="true" />6–8 questions</li><li><FileText aria-hidden="true" />Technical + behavioral</li><li><Clock3 aria-hidden="true" />Around 10 minutes</li></ul><div className="rubric-summary"><h3>What we look for</h3>{Object.entries(DIMENSIONS).map(([key, label]) => <div key={key}><CircleCheck aria-hidden="true" /><span>{label}{key === 'star' ? ' (behavioral)' : ''}</span></div>)}</div>
      <div className="scoring-choice">{live ? <label className="demo-toggle"><input type="checkbox" checked={setup.demo} onChange={event => onChange({ ...setup, demo: event.target.checked })} disabled={!!busy} /><span>Use demo scoring</span></label> : <p className="muted"><Sparkles aria-hidden="true" />{ai.cacheOnly ? 'Demo scoring enabled' : 'Live AI unavailable. Demo ready.'}</p>}</div>
      {setup.references?<p className="reference-status">Reviewed references enabled</p>:null}<Button className="start-button" busy={busy === 'start'} disabled={!role || !!busy||importing} onClick={onStart}>{busy === 'start' ? 'Preparing your interview…' : 'Start Interview'}<ArrowRight aria-hidden="true" /></Button><p className="center muted">No sign-up. No pressure.</p>
    </aside></div>
    <SourceNotice source={demo ? 'cache' : 'llm'} />
  </div>;
}
