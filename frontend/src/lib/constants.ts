// API base URL and constants
export const API_URL = "/api";

export const RECOMMENDATION_LABELS: Record<string, { label: string; color: string }> = {
  highly_recommended: { label: "Highly Recommended", color: "var(--success)" },
  recommended: { label: "Recommended", color: "var(--primary)" },
  consider: { label: "Consider", color: "var(--warning)" },
  not_recommended: { label: "Not Recommended", color: "var(--destructive)" },
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  resume_uploaded: "Resume Uploaded",
  resume_analyzed: "Resume Analyzed",
  interview_uploaded: "Interview Uploaded",
  interview_analyzed: "Interview Analyzed",
  scored: "Scored",
  report_generated: "Report Generated",
};

export function getScoreClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 85) return "score-excellent";
  if (score >= 70) return "score-good";
  if (score >= 50) return "score-average";
  return "score-poor";
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return "N/A";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Below Average";
}
