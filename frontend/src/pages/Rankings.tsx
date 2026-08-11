/**
 * Rankings page — candidate leaderboard with configurable weights.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Sliders, RefreshCw, Crown, Medal, Award } from "lucide-react";
import api from "@/lib/api";
import { RECOMMENDATION_LABELS, getScoreClass } from "@/lib/constants";

export default function Rankings() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWeights, setShowWeights] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const [resumeWeight, setResumeWeight] = useState(0.35);
  const [interviewWeight, setInterviewWeight] = useState(0.40);
  const [skillsWeight, setSkillsWeight] = useState(0.25);

  useEffect(() => {
    fetchRankings();
  }, []);

  async function fetchRankings() {
    try {
      const res = await api.get("/rankings");
      setRankings(res.data);
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
    } finally {
      setLoading(false);
    }
  }

  const recalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api.post("/rankings/recalculate", {
        resume_weight: resumeWeight,
        interview_weight: interviewWeight,
        skills_match_weight: skillsWeight,
      });
      setRankings(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Recalculation failed");
    } finally {
      setRecalculating(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5" style={{ color: "var(--warning)" }} />;
    if (rank === 2) return <Medal className="w-5 h-5" style={{ color: "oklch(0.7 0.01 264)" }} />;
    if (rank === 3) return <Award className="w-5 h-5" style={{ color: "oklch(0.65 0.12 55)" }} />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold" style={{ color: "var(--muted-foreground)" }}>#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6" style={{ color: "var(--warning)" }} /> Rankings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Candidate leaderboard based on weighted scores
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowWeights(!showWeights)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:bg-white/5"
            style={{ borderColor: "var(--border)" }} id="toggle-weights-btn">
            <Sliders className="w-4 h-4" /> Weights
          </button>
          <button onClick={recalculate} disabled={recalculating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
            id="recalculate-btn">
            <RefreshCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Recalculating..." : "Recalculate"}
          </button>
        </div>
      </div>

      {/* Weights Panel */}
      {showWeights && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4">Scoring Weights (must sum to 1.0)</h3>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Resume Score", value: resumeWeight, setter: setResumeWeight },
              { label: "Interview Score", value: interviewWeight, setter: setInterviewWeight },
              { label: "Skills Match", value: skillsWeight, setter: setSkillsWeight },
            ].map((w) => (
              <div key={w.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: "var(--muted-foreground)" }}>{w.label}</span>
                  <span className="font-mono font-semibold">{(w.value * 100).toFixed(0)}%</span>
                </div>
                <input type="range" min="0" max="100" value={w.value * 100}
                  onChange={(e) => w.setter(Number(e.target.value) / 100)}
                  className="w-full accent-current" style={{ color: "var(--primary)" }} />
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: (resumeWeight + interviewWeight + skillsWeight) === 1 ? "var(--success)" : "var(--destructive)" }}>
            Total: {((resumeWeight + interviewWeight + skillsWeight) * 100).toFixed(0)}%
          </p>
        </motion.div>
      )}

      {/* Leaderboard */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              {["Rank", "Candidate", "Resume", "Interview", "Skills Match", "Final Score", "Recommendation"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-medium text-xs uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-3"><div className="skeleton h-4 w-16 rounded" /></td>
                  ))}
                </tr>
              ))
            ) : rankings.length > 0 ? (
              rankings.map((r, i) => {
                const rec = r.recommendation ? RECOMMENDATION_LABELS[r.recommendation] : null;
                return (
                  <motion.tr key={r.candidate_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/candidates/${r.candidate_id}`)}
                    className="border-b cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3">{getRankIcon(r.rank)}</td>
                    <td className="px-5 py-3 font-medium">{r.candidate_name}</td>
                    <td className="px-5 py-3">
                      {r.resume_score !== null ? <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreClass(r.resume_score)}`}>{r.resume_score}</span> : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {r.interview_score !== null ? <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreClass(r.interview_score)}`}>{r.interview_score}</span> : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {r.skills_match_score !== null ? <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreClass(r.skills_match_score)}`}>{r.skills_match_score}</span> : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-sm font-bold ${getScoreClass(r.final_score)}`}>{r.final_score}</span>
                    </td>
                    <td className="px-5 py-3">
                      {rec ? <span className="text-xs font-semibold" style={{ color: rec.color }}>{rec.label}</span> : "—"}
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No ranked candidates yet</p>
                  <p className="text-xs mt-1">Upload resumes and interviews to generate rankings</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
