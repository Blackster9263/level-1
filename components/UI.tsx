'use client';

import { ArrowRight, Check, CheckCircle2, CircleAlert, Code2, Database, BriefcaseBusiness, PanelsTopLeft, Megaphone, Users, LoaderCircle, Info, Sparkles } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Source } from '@/lib/types';

export function Button({ children, busy, variant = 'primary', className = '', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; variant?: 'primary' | 'secondary' | 'text'; children: ReactNode }) {
  return <button type="button" {...props} disabled={disabled || busy} className={`button ${variant} ${className}`} aria-busy={busy || undefined}>
    {busy ? <LoaderCircle className="spinner" aria-hidden="true" /> : null}{children}
  </button>;
}

const roleIcons = { code: Code2, database: Database, briefcase: BriefcaseBusiness, layout: PanelsTopLeft, megaphone: Megaphone, users: Users, software_engineer: Code2, data_analyst: Database, business_analyst: BriefcaseBusiness, frontend_developer: PanelsTopLeft, marketing_associate: Megaphone, hr_executive: Users };
export function RoleIcon({ name }: { name?: string }) {
  const Icon = roleIcons[name as keyof typeof roleIcons] || BriefcaseBusiness;
  return <Icon aria-hidden="true" />;
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="error-notice" role="alert"><CircleAlert aria-hidden="true" /><p>{message}</p>{onRetry ? <Button variant="secondary" onClick={onRetry}>Try again</Button> : null}</div>;
}

export function SourceNotice({ source, compact = false }: { source: Source | 'mixed'; compact?: boolean }) {
  const demo = source === 'cache';
  return <div className={compact ? `source-label ${demo ? 'source-demo' : ''}` : `source-notice ${demo ? 'source-demo' : ''}`}>
    {demo ? <Info aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
    <span>{demo ? 'Demo mode: local illustrative scoring. Not live AI.' : source === 'mixed' ? 'Mixed scoring: Gemini AI + local illustrative scoring. Sources shown per answer.' : 'Gemini AI'}</span>
  </div>;
}

export function Stepper({ step }: { step: number }) {
  return <ol className="stepper" aria-label="Interview steps">{['Choose a role', 'Practice your answers', 'Get your report'].map((text, i) => <li key={text} className={i === step ? 'current' : i < step ? 'complete' : ''} aria-current={i === step ? 'step' : undefined}>
    <span className="step-circle">{i < step ? <Check aria-hidden="true" /> : `0${i + 1}`}</span><span>{text}</span>
  </li>)}</ol>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: () => void }) {
  return <div className="empty-state"><CheckCircle2 aria-hidden="true" /><h2>{title}</h2><p>{children}</p>{action ? <Button onClick={action}>Start practicing <ArrowRight aria-hidden="true" /></Button> : null}</div>;
}

export function LoadingScreen({ label = 'Getting your workspace ready…' }: { label?: string }) {
  return <div className="loading-screen" role="status"><LoaderCircle className="spinner" aria-hidden="true" /><p>{label}</p><div className="skeleton-grid" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} />)}</div></div>;
}
