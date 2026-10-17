'use client';

import { useEffect, useRef } from 'react';
import { Button } from './UI';

export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: { title: string; children: React.ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); };
  }, []);
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby="dialog-title" aria-describedby="dialog-copy" onCancel={event => { event.preventDefault(); onCancel(); }}><h2 id="dialog-title">{title}</h2><div id="dialog-copy">{children}</div><div className="dialog-actions"><Button variant="secondary" autoFocus onClick={onCancel}>Keep practicing</Button><Button onClick={onConfirm}>{confirmLabel}</Button></div></dialog>;
}
