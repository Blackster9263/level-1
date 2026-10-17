import { CircleCheck, CircleAlert, TrendingUp } from 'lucide-react';
import type { Readiness } from '@/lib/types';

export function ReadinessBadge({ readiness }: { readiness: Readiness }) {
  const Icon = readiness.tone === 'success' ? CircleCheck : readiness.tone === 'warning' ? CircleAlert : TrendingUp;
  return <span className={`badge readiness ${readiness.tone}`}><Icon aria-hidden="true" />{readiness.label}</span>;
}
