/**
 * Dashboard page — stats cards, candidate table, charts.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Trophy, TrendingUp, FileCheck,
  Plus, Upload, ArrowUpRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "@/lib/api";
import { RECOMMENDATION_LABELS, getScoreClass } from "@/lib/constants";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, scored: 0, avgScore: 0, topRec: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await api.get("/candidates?page_size=100");
      const items = res.data.items || [];
      setCandidates(items);

      const scored = items.filter((c: any) => c.final_score !== null);
      const avg = scored.length > 0
        ? scored.reduce((sum: number, c: any) => sum + c.final_score, 0) / scored.length
        : 0;
      const topRec = items.filter((c: any) => c.recommendation === "highly_recommended").length;

      setStats({ total: res.data.total, scored: scored.length, avgScore: Math.round(avg), topRec });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Chart data
  const scoreDistribution = [
    { range: "90-100", count: candidates.filter((c) => c.final_score >= 90).length, fill: "var(--chart-1)" },
    { range: "70-89", count: candidates.filter((c) => c.final_score >= 70 && c.final_score < 90).length, fill: "var(--chart-2)" },
    { range: "50-69", count: candidates.filter((c) => c.final_score >= 50 && c.final_score < 70).length, fill: "var(--chart-3)" },
    { range: "0-49", count: candidates.filter((c) => c.final_score !== null && c.final_score < 50).length, fill: "var(--chart-4)" },
  ];

  const recDistribution = [
    { name: "Highly Recommended", value: candidates.filter((c) => c.recommendation === "highly_recommended").length, fill: "var(--success)" },
    { name: "Recommended", value: candidates.filter((c) => c.recommendation === "recommended").length, fill: "var(--primary)" },
    { name: "Consider", value: candidates.filter((c) => c.recommendation === "consider").length, fill: "var(--warning)" },
    { name: "Not Recommended", value: candidates.filter((c) => c.recommendation === "not_recommended").length, fill: "var(--destructive)" },
  ].filter((d) => d.value > 0);

  const statCards = [
    { label: "Total Candidates", value: stats.total, icon: Users, color: "var(--primary)" },
    { label: "Scored", value: stats.scored, icon: FileCheck, color: "var(--accent)" },
    { label: "Avg Score", value: stats.avgScore, icon: TrendingUp, color: "var(--warning)" },
    { label: "Top Rated", value: stats.topRec, icon: Trophy, color: "var(--success)" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Overview of your candidate evaluation pipeline
          </p>
        </div>
        <button
          id="add-candidate-btn"
          onClick={() => navigate("/candidates")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
        >
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="glass-card p-5 cursor-pointer hover:border-opacity-50 transition-all duration-300"
            style={{ borderColor: stat.color }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in oklch, ${stat.color} 15%, transparent)` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <motion.div initial="hidden" animate="visible" custom={4} variants={fadeIn} className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreDistribution}>
              <XAxis dataKey="range" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recommendation Distribution */}
        <motion.div initial="hidden" animate="visible" custom={5} variants={fadeIn} className="glass-card p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Recommendations</h3>
          {recDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={recDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {recDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px]" style={{ color: "var(--muted-foreground)" }}>
              <p className="text-sm">No scored candidates yet</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {recDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Candidates Table */}
      <motion.div initial="hidden" animate="visible" custom={6} variants={fadeIn} className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold">Recent Candidates</h3>
          <button onClick={() => navigate("/candidates")} className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "var(--primary)" }}>
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Name</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Email</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Score</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Recommendation</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {candidates.slice(0, 8).map((c) => {
                const rec = c.recommendation ? RECOMMENDATION_LABELS[c.recommendation] : null;
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/candidates/${c.id}`)}
                    className="border-b cursor-pointer transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3" style={{ color: "var(--muted-foreground)" }}>{c.email || "—"}</td>
                    <td className="px-5 py-3">
                      {c.final_score !== null ? (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${getScoreClass(c.final_score)}`}>
                          {c.final_score}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {rec ? (
                        <span className="text-xs font-medium" style={{ color: rec.color }}>{rec.label}</span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--muted-foreground)" }}>#{c.rank || "—"}</td>
                  </tr>
                );
              })}
              {candidates.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center" style={{ color: "var(--muted-foreground)" }}>
                    <Upload className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No candidates yet. Add your first candidate to get started!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
