/**
 * Candidate Detail page — tabbed interface with resume, interview, and scoring insights.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileText, Video, BarChart3, Download,
  Star, AlertTriangle, Zap, BookOpen, Award, Briefcase,
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from "recharts";
import api from "@/lib/api";
import { RECOMMENDATION_LABELS, getScoreClass, getScoreLabel } from "@/lib/constants";

type Tab = "overview" | "resume" | "interview" | "report";

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const res = await api.get(`/candidates/${id}`);
      setCandidate(res.data);
    } catch {
      navigate("/candidates");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (format: string) => {
    setGeneratingReport(true);
    try {
      const res = await api.post(`/reports/generate/${id}`, { format });
      if (res.data.file_path) {
        const dl = await api.get(`/reports/${res.data.id}/download`, { responseType: "blob" });
        const url = window.URL.createObjectURL(new Blob([dl.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `report_${candidate.name.replace(/\s+/g, "_")}.${format}`;
        a.click();
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Report generation failed");
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (!candidate) return null;

  const resume = candidate.resume;
  const interview = candidate.interview;
  const score = candidate.score_breakdown;
  const rec = candidate.recommendation ? RECOMMENDATION_LABELS[candidate.recommendation] : null;

  // Radar chart data for interview scores
  const radarData = interview ? [
    { subject: "Communication", score: interview.communication_score || 0 },
    { subject: "Technical", score: interview.technical_score || 0 },
    { subject: "Confidence", score: interview.confidence_score || 0 },
    { subject: "Clarity", score: interview.clarity_score || 0 },
    { subject: "Problem Solving", score: interview.problem_solving_score || 0 },
  ] : [];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "resume", label: "Resume", icon: FileText },
    { id: "interview", label: "Interview", icon: Video },
    { id: "report", label: "Report", icon: Download },
  ];

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/candidates")} className="p-2 rounded-lg border transition-colors hover:bg-white/5"
            style={{ borderColor: "var(--border)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{candidate.name}</h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {candidate.email || "No email"} {candidate.phone ? `• ${candidate.phone}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {candidate.final_score !== null && (
            <div className={`px-4 py-2 rounded-lg text-lg font-bold ${getScoreClass(candidate.final_score)}`}>
              {candidate.final_score}/100
            </div>
          )}
          {rec && (
            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ color: rec.color, backgroundColor: `color-mix(in oklch, ${rec.color} 15%, transparent)` }}>
              {rec.label}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: "var(--secondary)" }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={activeTab === tab.id
              ? { backgroundColor: "var(--card)", color: "var(--primary)" }
              : { color: "var(--muted-foreground)" }
            } id={`tab-${tab.id}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Breakdown */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4" style={{ color: "var(--primary)" }} /> Score Breakdown
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Resume Score", value: score?.resume_score },
                  { label: "Interview Score", value: score?.interview_score },
                  { label: "Skills Match", value: score?.skills_match_score },
                  { label: "Final Score", value: candidate.final_score },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
                      <span className="font-semibold">{item.value !== null && item.value !== undefined ? `${item.value}/100` : "N/A"}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${item.value || 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            {resume?.skills && resume.skills.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "var(--warning)" }} /> Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Radar Chart */}
            {radarData.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" style={{ color: "var(--accent)" }} /> Interview Radar
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                    <Radar dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="glass-card p-6 space-y-4">
              {(resume?.strengths || interview?.strengths) && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Star className="w-4 h-4" style={{ color: "var(--success)" }} /> Strengths
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {resume?.strengths} {interview?.strengths && `\n\n${interview.strengths}`}
                  </p>
                </div>
              )}
              {(resume?.weaknesses || interview?.weaknesses) && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" style={{ color: "var(--warning)" }} /> Areas for Improvement
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {resume?.weaknesses} {interview?.weaknesses && `\n\n${interview.weaknesses}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "resume" && (
          <div className="glass-card p-6 space-y-6">
            {resume ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Resume Analysis</h3>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreClass(resume.overall_score)}`}>
                    Score: {resume.overall_score}/100
                  </span>
                </div>
                {resume.skill_summary && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Skill Summary
                    </h4>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{resume.skill_summary}</p>
                  </div>
                )}
                {resume.experience && resume.experience.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Experience
                    </h4>
                    <div className="space-y-3">
                      {resume.experience.map((exp: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: "var(--secondary)" }}>
                          <div className="flex justify-between">
                            <span className="font-medium text-sm">{exp.title}</span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{exp.duration}</span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>{exp.company}</p>
                          {exp.description && <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resume.education && resume.education.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Education
                    </h4>
                    <div className="space-y-2">
                      {resume.education.map((edu: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: "var(--secondary)" }}>
                          <span className="font-medium text-sm">{edu.degree} in {edu.field}</span>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{edu.institution} • {edu.year}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No resume uploaded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "interview" && (
          <div className="glass-card p-6 space-y-6">
            {interview ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Interview Analysis</h3>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreClass(interview.overall_score)}`}>
                    Score: {interview.overall_score}/100
                  </span>
                </div>
                {interview.summary && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Summary</h4>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{interview.summary}</p>
                  </div>
                )}
                {interview.key_points && interview.key_points.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Key Points</h4>
                    <ul className="space-y-1">
                      {interview.key_points.map((point: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2" style={{ color: "var(--muted-foreground)" }}>
                          <span style={{ color: "var(--primary)" }}>•</span> {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {interview.transcript && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Full Transcript</h4>
                    <div className="p-4 rounded-lg max-h-96 overflow-y-auto text-sm leading-relaxed"
                      style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}>
                      {interview.transcript}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No interview uploaded yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "report" && (
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Generate a comprehensive evaluation report for {candidate.name}. The report includes resume analysis, interview insights, score breakdown, and hiring recommendation.
            </p>
            <div className="flex gap-4">
              <button onClick={() => generateReport("pdf")} disabled={generatingReport}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
                id="generate-pdf-btn">
                <Download className="w-4 h-4" /> {generatingReport ? "Generating..." : "Download PDF"}
              </button>
              <button onClick={() => generateReport("docx")} disabled={generatingReport}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border transition-all hover:bg-white/5 disabled:opacity-50"
                style={{ borderColor: "var(--border)" }}
                id="generate-docx-btn">
                <Download className="w-4 h-4" /> {generatingReport ? "Generating..." : "Download DOCX"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
