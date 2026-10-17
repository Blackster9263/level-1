'use client';

import type { RoleOption } from '@/lib/client';
import { RoleIcon } from './UI';

export function RoleCard({ role, selected, disabled, onSelect }: { role: RoleOption; selected: boolean; disabled?: boolean; onSelect: () => void }) {
  return <label className={`role-card ${selected ? 'selected' : ''}`}>
    <input type="radio" name="role" value={role.id} checked={selected} onChange={onSelect} disabled={disabled} className="choice-input" />
    <span className="selection-dot" aria-hidden="true" /><span className="role-icon"><RoleIcon name={role.icon} /></span><strong>{role.title}</strong><span className="description">{role.description}</span>
  </label>;
}
