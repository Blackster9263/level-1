import type { Evaluation, GithubReference, ReferenceInput, Report, Role, Session } from './types';

export type RoleOption = Pick<Role, 'id' | 'title' | 'description' | 'icon'>;
export type AIStatus = { available: boolean; cacheOnly: boolean; model: string };
export type RolesResponse = { roles: RoleOption[]; levels: Session['level'][]; ai: AIStatus };
export type Setup = Pick<Session, 'roleId' | 'level' | 'mode'> & { demo: boolean;references?:ReferenceInput };

export class ApiError extends Error {
  constructor(message: string, public code = 'REQUEST_FAILED') {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const startedForAccount=accountRevision;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError('We couldn’t connect. Check that PulsePrep is running, then try again. Your draft is still here.', 'NETWORK');
  }
  const data = await response.json().catch(() => null) as {error?:{message?:string;code?:string}}|null;
  if(startedForAccount!==accountRevision)throw new ApiError('Your account changed. Reopen this action in your current workspace.','ACCOUNT_CHANGED');
  if (!response.ok) {
    throw new ApiError(data?.error?.message || 'Something went wrong. Please try again. Your draft is still here.', data?.error?.code);
  }
  if (!data) throw new ApiError('We couldn’t read that response. Please try again.');
  return data as T;
}

const sessionPath = (id: string) => `/sessions/${encodeURIComponent(id)}`;
export const api = {
  github: (username:string) => request<{github:GithubReference;snapshotId:string}>('/references/github',{username}),
  roles: (signal?: AbortSignal) => request<RolesResponse>('/roles', undefined, signal),
  history: (signal?: AbortSignal) => request<{ sessions: Session[] }>('/sessions', undefined, signal),
  create: (setup: Setup) => request<{ session: Session }>('/sessions', setup),
  session: (id: string, signal?: AbortSignal) => request<{ session: Session }>(sessionPath(id), undefined, signal),
  answer: (id: string, questionId: string, text: string) => request<{ session: Session; answer: Evaluation | null }>(`${sessionPath(id)}/answers`, { questionId, text }),
  skip: (id: string, questionId: string) => request<{ session: Session }>(`${sessionPath(id)}/skip`, { questionId }),
  finish: (id: string) => request<{ report: Report }>(`${sessionPath(id)}/finish`, {}),
  report: (id: string) => request<{ report: Report }>(`/reports/${encodeURIComponent(id)}`),
  clearHistory: () => request<{deleted:number}>('/history/clear',{}),
};

let prefix:string|null=null;
let accountRevision=0;
export function configureStorage(userId:string|null){const next=userId?'pulseprep:account:v1:'+encodeURIComponent(userId)+':':null;if(next!==prefix){prefix=next;accountRevision++;}}
function captureStorage(){
  const capturedPrefix=prefix,capturedRevision=accountRevision;
  const isCurrent=()=>capturedPrefix!==null&&capturedRevision===accountRevision;
  return {
  isCurrent,
  read(key: string): string | null {
    if(!isCurrent())return null;try { return window.localStorage.getItem(capturedPrefix + key); } catch { return null; }
  },
  write(key: string, value: string): boolean {
    if(!isCurrent())return false;try { window.localStorage.setItem(capturedPrefix + key, value); return true; } catch { return false; }
  },
  remove(key: string) {
    if(!isCurrent())return;try { window.localStorage.removeItem(capturedPrefix + key); } catch { /* Storage can be unavailable in private windows. */ }
  },
  // Clearing an old scope after sign-out may delete only that account's drafts.
  clear(){if(!capturedPrefix)return;try{const keys=Array.from({length:window.localStorage.length},(_,i)=>window.localStorage.key(i));for(const key of keys)if(key?.startsWith(capturedPrefix))window.localStorage.removeItem(key);}catch{/* Private browsing may disable storage. */}},
  };
}
export const storage = {
  capture:captureStorage,
  read:(key:string)=>captureStorage().read(key),
  write:(key:string,value:string)=>captureStorage().write(key,value),
  remove:(key:string)=>captureStorage().remove(key),
  clear:()=>captureStorage().clear(),
};
export const draftKey = (sessionId: string, questionId: string) => `draft:${sessionId}:${questionId}`;
export const feedbackKey = (sessionId: string) => `feedback:${sessionId}`;
export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
export const displayError = (error: unknown) => error instanceof ApiError ? error.message : 'That didn’t work. Please try again. Your saved work is still available.';
export const levelLabel = (level: Session['level']) => level === 'fresher' ? 'Fresher' : '0–1 year';
export const modeLabel = (mode: Session['mode']) => mode === 'practice' ? 'Practice mode' : 'Full mock';
export const formatDate = (date: string) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date));
