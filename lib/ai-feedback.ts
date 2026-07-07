// Rule-Based AI Engine for performance feedback
// Analyzes marks and generates constructive feedback per student per term.
// This is a deterministic rule-based engine (no external AI API) that evaluates
// total score, subject-level performance, consistency, and trend indicators.

export interface SubjectMark {
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
}

export interface PerformanceFeedback {
  overallPercentage: number;
  totalObtained: number;
  totalMax: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: string;
  consistency: 'high' | 'moderate' | 'low';
  subjectCount: number;
  rank?: number;
  totalStudents?: number;
}

export function computeGrade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

function consistencyLevel(spread: number): 'high' | 'moderate' | 'low' {
  // spread = max pct - min pct across subjects
  if (spread <= 15) return 'high';
  if (spread <= 30) return 'moderate';
  return 'low';
}

export function generateFeedback(marks: SubjectMark[]): PerformanceFeedback {
  if (!marks.length) {
    return {
      overallPercentage: 0,
      totalObtained: 0,
      totalMax: 0,
      grade: 'N/A',
      strengths: [],
      weaknesses: [],
      summary: 'No marks published yet.',
      recommendation: 'Awaiting mark entry by subject teacher.',
      consistency: 'high',
      subjectCount: 0,
    };
  }

  const totalObtained = marks.reduce((s, m) => s + m.marksObtained, 0);
  const totalMax = marks.reduce((s, m) => s + m.maxMarks, 0);
  const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = computeGrade(overallPercentage);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const pcts: number[] = [];

  marks.forEach((m) => {
    const pct = (m.marksObtained / m.maxMarks) * 100;
    pcts.push(pct);
    if (pct >= 75) {
      strengths.push(`Strong in ${m.subjectName} (${pct.toFixed(0)}%)`);
    } else if (pct < 50) {
      weaknesses.push(`Needs focus in ${m.subjectName} (${pct.toFixed(0)}%)`);
    }
  });

  const spread = Math.max(...pcts) - Math.min(...pcts);
  const consistency = consistencyLevel(spread);

  let summary: string;
  let recommendation: string;

  if (overallPercentage >= 80) {
    summary = `Excellent performance with an overall score of ${overallPercentage.toFixed(1)}% across ${marks.length} subjects.`;
    recommendation = 'Continue the consistent effort and aim for distinction in the next term.';
  } else if (overallPercentage >= 60) {
    summary = `Good performance with an overall score of ${overallPercentage.toFixed(1)}% across ${marks.length} subjects.`;
    recommendation = 'Focus on weaker subjects to push the overall grade higher next term.';
  } else if (overallPercentage >= 40) {
    summary = `Average performance with an overall score of ${overallPercentage.toFixed(1)}% across ${marks.length} subjects.`;
    recommendation = 'Targeted remedial work in weak subjects is strongly recommended.';
  } else {
    summary = `Below-average performance with an overall score of ${overallPercentage.toFixed(1)}% across ${marks.length} subjects.`;
    recommendation = 'Immediate academic intervention and extra coaching are required.';
  }

  // Consistency note
  if (consistency === 'low' && marks.length > 1) {
    recommendation += ' Performance is inconsistent across subjects — work on balancing strengths.';
  } else if (consistency === 'high' && overallPercentage >= 60) {
    recommendation += ' Performance is consistent across all subjects — well done.';
  }

  return {
    overallPercentage,
    totalObtained,
    totalMax,
    grade,
    strengths,
    weaknesses,
    summary,
    recommendation,
    consistency,
    subjectCount: marks.length,
  };
}

// Compute class rank for a student given all students' totals
export function computeRank(
  studentTotal: number,
  allTotals: number[]
): number {
  const sorted = [...allTotals].sort((a, b) => b - a);
  return sorted.indexOf(studentTotal) + 1;
}

// Generate a per-student feedback summary string for embedding in PDF backups
export function feedbackSummary(fb: PerformanceFeedback): string {
  const parts = [
    `Overall: ${fb.overallPercentage.toFixed(1)}% (Grade ${fb.grade})`,
    fb.summary,
    fb.recommendation,
  ];
  if (fb.strengths.length) parts.push(`Strengths: ${fb.strengths.join('; ')}`);
  if (fb.weaknesses.length) parts.push(`Weaknesses: ${fb.weaknesses.join('; ')}`);
  return parts.join(' | ');
}
