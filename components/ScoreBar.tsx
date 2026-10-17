import { DIMENSIONS } from '@/lib/types';
import type { Scores } from '@/lib/types';

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const score = Math.max(0, Math.min(10, value));
  return <div className="score-row"><div><span>{label}</span><strong>{score.toFixed(1)}<small> / 10</small></strong></div><div className="score-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={10} aria-valuenow={score} aria-valuetext={`${score.toFixed(1)} out of 10`}><span style={{ width: `${score * 10}%` }} /></div></div>;
}

export function ScoreBars({ scores }: { scores: Scores }) {
  return <div className="score-bars">{Object.entries(DIMENSIONS).map(([key, label]) => {
    const value = scores[key as keyof Scores];
    return value === null ? null : <ScoreBar key={key} label={label} value={value} />;
  })}</div>;
}
