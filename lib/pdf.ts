import type { Report } from './types';
import { CODING_TOPICS,DIMENSIONS } from './types';
import { formatDate, levelLabel, modeLabel } from './client';

// Standard PDF fonts are ASCII-safe; normalize punctuation and strip unsupported glyphs.
function ascii(text: string): string {
  return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2010-\u2015]/g, '-').replace(/\u2026/g, '...').replace(/\u2192/g, ' -> ').replace(/[^\x20-\x7e\n\r\t]/g, '?');
}

export async function downloadReport(report: Report, roleTitle: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const margin = 18;
  const width = 174;
  const bottom = 273;
  let y = 28;
  let appendix = false;
  function header() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(55, 48, 163);
    doc.text('pulseprep', margin, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(appendix ? 'YOUR ANSWERS & FEEDBACK' : 'INTERVIEW REPORT', 192, 14, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 18, 192, 18);
  }
  function nextPage() { doc.addPage(); y = 28; header(); }
  function text(value: string, size = 11, bold = false, color: [number, number, number] = [15, 23, 42]) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(ascii(value), width) as string[];
    const lineHeight = size * 0.48;
    for (const line of lines) {
      if (y + lineHeight > bottom) {
        nextPage();
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(...color);
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 3;
  }
  function section(title: string) { if (y + 20 > bottom) nextPage(); y += 4; text(title, 13, true, [55, 48, 163]); }
  header();
  text(roleTitle, 22, true);
  text(`${levelLabel(report.session.level)} | ${modeLabel(report.session.mode)} | ${formatDate(report.session.completedAt || report.session.createdAt)}`, 10);
  const sources = new Set(report.session.questions.flatMap(q => q.answer ? [q.answer.source] : []));
  const source = sources.size > 1 ? 'Mixed scoring: Gemini AI + local illustrative scoring. See each answer for its source.' : sources.has('cache') || (!sources.size && report.session.source === 'cache') ? 'Demo mode: local illustrative scoring. Not live AI.' : 'Gemini AI';
  text(source, 10, false, [71, 85, 105]);
  const references=report.session.references;
  if(references){section('Interview references');if(references.github){text(`GitHub @${references.github.username}: public metadata retrieved ${references.github.fetchedAt}. Ownership and proficiency not verified.`,9);for(const repo of references.github.repos)text(`${repo.name}${repo.language?' | '+repo.language:''} | ${repo.url}`,9);}if(references.linkedinSkills)text('LinkedIn skills/experience (self-reported): '+references.linkedinSkills,9);if(references.leetcodeTopics.length)text('Self-reported weak topics: '+references.leetcodeTopics.map(topic=>CODING_TOPICS[topic]).join(', ')+'. Original PulsePrep exercises, not copied LeetCode questions.',9);}
  section('Your readiness');
  text(`${report.overall.toFixed(1)} / 10 - ${report.readiness.label}`, 20, true);
  text(`${report.answered} answered | ${report.skipped} skipped | ${report.unanswered} unanswered`, 11);
  if (report.previousScore !== null) text(`Previous session: ${report.previousScore.toFixed(1)} -> this session: ${report.overall.toFixed(1)}`);
  section('Score breakdown');
  for (const [key, label] of Object.entries(DIMENSIONS)) {
    const score = report.averages[key as keyof typeof report.averages];
    text(`${label}: ${score === null ? 'Not applicable' : `${score.toFixed(1)} / 10`}`);
  }
  section('What to practice next');
  report.tips.slice(0, 4).forEach((tip, i) => text(`${i + 1}. ${tip}`));
  text('Unanswered questions count as zero. Skipped questions are excluded. STAR applies only to behavioral answers. Scores guide preparation, not hiring decisions.', 9, false, [71, 85, 105]);
  appendix = true;
  nextPage();
  text('Your answers & feedback', 20, true);
  for (let i = 0; i < report.session.questions.length; i++) {
    const question = report.session.questions[i];
    section(`Question ${i + 1} | ${question.type} | ${question.status}`);
    text(question.text, 12, true);
    if(question.reference)text('Reference: '+question.reference,9);
    if (!question.answer) {
      text(question.status === 'skipped' ? 'Skipped. Excluded from the average.' : 'Unanswered. Counts as zero.');
      continue;
    }
    const answer = question.answer;
    text(`Score: ${answer.answerScore.toFixed(1)} / 10 | ${answer.source === 'cache' ? 'Demo mode: local illustrative scoring. Not live AI.' : 'Gemini AI'}`, 10);
    text(Object.entries(DIMENSIONS).filter(([key]) => answer.scores[key as keyof typeof answer.scores] !== null).map(([key, label]) => `${label}: ${answer.scores[key as keyof typeof answer.scores]}/10`).join(' | '), 9);
    text('Your answer', 11, true); text(answer.text);
    text('Feedback', 11, true); text(answer.feedback);
    text('Try this next', 11, true); text(answer.improvementTip);
    text('Model answer', 11, true); text(answer.modelAnswer);
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 280, 192, 280);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text('Generated by PulsePrep', margin, 287);
    doc.text(`${page} / ${pages}`, 192, 287, { align: 'right' });
  }
  const role = report.session.roleId.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  doc.save(`interview-report-${role}.pdf`);
}
