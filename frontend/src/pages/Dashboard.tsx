/**
 * Dashboard page — AI recruitment analytics overview.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Plus,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "@/lib/api";
import { RECOMMENDATION_LABELS, getScoreClass } from "@/lib/constants";

const fadeIn = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

type Candidate = {
  id: string;
  name: string;
  email?: string | null;
  final_score?: number | null;
  recommendation?: string | null;
  rank?: number | null;
  status?: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    scored: 0,
    avgScore: 0,
    topRec: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await api.get("/candidates?page_size=100");

      const items: Candidate[] = res.data.items || [];

      setCandidates(items);

      const scored = items.filter(
        (candidate) => candidate.final_score !== null && candidate.final_score !== undefined
      );

      const avg =
        scored.length > 0
          ? scored.reduce(
              (sum, candidate) => sum + Number(candidate.final_score || 0),
              0
            ) / scored.length
          : 0;

      const topRec = items.filter(
        (candidate) =>
          candidate.recommendation === "highly_recommended"
      ).length;

      setStats({
        total: res.data.total ?? items.length,
        scored: scored.length,
        avgScore: Math.round(avg),
        topRec,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const scoreDistribution = useMemo(
    () => [
      {
        range: "90–100",
        count: candidates.filter(
          (c) => Number(c.final_score) >= 90
        ).length,
        fill: "var(--success)",
      },
      {
        range: "70–89",
        count: candidates.filter(
          (c) =>
            Number(c.final_score) >= 70 &&
            Number(c.final_score) < 90
        ).length,
        fill: "var(--primary)",
      },
      {
        range: "50–69",
        count: candidates.filter(
          (c) =>
            Number(c.final_score) >= 50 &&
            Number(c.final_score) < 70
        ).length,
        fill: "var(--warning)",
      },
      {
        range: "0–49",
        count: candidates.filter(
          (c) =>
            c.final_score !== null &&
            c.final_score !== undefined &&
            Number(c.final_score) < 50
        ).length,
        fill: "var(--destructive)",
      },
    ],
    [candidates]
  );

  const recDistribution = useMemo(
    () =>
      [
        {
          name: "Highly Recommended",
          value: candidates.filter(
            (c) => c.recommendation === "highly_recommended"
          ).length,
          fill: "var(--success)",
        },
        {
          name: "Recommended",
          value: candidates.filter(
            (c) => c.recommendation === "recommended"
          ).length,
          fill: "var(--primary)",
        },
        {
          name: "Consider",
          value: candidates.filter(
            (c) => c.recommendation === "consider"
          ).length,
          fill: "var(--warning)",
        },
        {
          name: "Not Recommended",
          value: candidates.filter(
            (c) => c.recommendation === "not_recommended"
          ).length,
          fill: "var(--destructive)",
        },
      ].filter((item) => item.value > 0),
    [candidates]
  );

  const statCards = [
    {
      label: "Total Candidates",
      value: stats.total,
      icon: Users,
      color: "var(--primary)",
      description: "Candidates in pipeline",
    },
    {
      label: "AI Evaluated",
      value: stats.scored,
      icon: FileCheck2,
      color: "var(--accent)",
      description: "Candidates with scores",
    },
    {
      label: "Average Score",
      value: stats.scored > 0 ? `${stats.avgScore}%` : "—",
      icon: TrendingUp,
      color: "var(--warning)",
      description: "Across evaluated candidates",
    },
    {
      label: "Top Rated",
      value: stats.topRec,
      icon: Trophy,
      color: "var(--success)",
      description: "Highly recommended",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-7 w-40" />
            <div className="skeleton mt-3 h-4 w-64" />
          </div>

          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="glass-card h-32 p-5"
            >
              <div className="skeleton h-full w-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="glass-card h-[330px] p-6">
            <div className="skeleton h-full w-full" />
          </div>

          <div className="glass-card h-[330px] p-6">
            <div className="skeleton h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* ------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------ */}

      <motion.div
        initial="hidden"
        animate="visible"
        custom={0}
        variants={fadeIn}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div
            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--primary)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Candidate Intelligence
          </div>

          <h1
            className="text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: "var(--foreground)" }}
          >
            Recruitment Dashboard
          </h1>

          <p
            className="mt-1.5 text-sm"
            style={{ color: "var(--muted-foreground)" }}
          >
            Monitor your candidate pipeline and AI evaluation insights.
          </p>
        </div>

        <button
          id="add-candidate-btn"
          onClick={() => navigate("/candidates")}
          className="group flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "var(--primary-foreground)",
            boxShadow:
              "0 10px 25px oklch(0.72 0.19 169 / 0.12)",
          }}
        >
          <Plus className="h-4 w-4" />
          Add Candidate
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </motion.div>

      {/* ------------------------------------------------------------ */}
      {/* Stats */}
      {/* ------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              custom={index + 1}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="glass-card group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Accent glow */}
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                style={{
                  backgroundColor: stat.color,
                }}
              />

              <div className="relative flex items-start justify-between">
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {stat.label}
                  </p>

                  <p
                    className="mt-2 text-3xl font-bold tracking-tight"
                    style={{
                      color: stat.color,
                    }}
                  >
                    {stat.value}
                  </p>

                  <p
                    className="mt-1.5 text-xs"
                    style={{
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {stat.description}
                  </p>
                </div>

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor:
                      "color-mix(in oklch, " +
                      `${stat.color} 12%, transparent)`,
                  }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: stat.color,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Analytics */}
      {/* ------------------------------------------------------------ */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Score Distribution */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={5}
          variants={fadeIn}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-start justify-between border-b p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">
                Score Distribution
              </h2>

              <p
                className="mt-1 text-xs"
                style={{
                  color: "var(--muted-foreground)",
                }}
              >
                Candidate performance across AI scoring bands
              </p>
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                backgroundColor:
                  "oklch(0.72 0.19 169 / 0.1)",
              }}
            >
              <Target
                className="h-4 w-4"
                style={{
                  color: "var(--primary)",
                }}
              />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {stats.scored > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={235}
              >
                <BarChart
                  data={scoreDistribution}
                  margin={{
                    top: 5,
                    right: 5,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    dataKey="range"
                    tick={{
                      fill: "var(--muted-foreground)",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: "var(--muted-foreground)",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    cursor={{
                      fill: "oklch(1 0 0 / 0.03)",
                    }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      color: "var(--foreground)",
                      boxShadow:
                        "0 12px 30px oklch(0 0 0 / 0.25)",
                    }}
                  />

                  <Bar
                    dataKey="count"
                    radius={[7, 7, 2, 2]}
                  >
                    {scoreDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.fill}
                        />
                      )
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState
                icon={Target}
                text="No scored candidates yet"
              />
            )}
          </div>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={6}
          variants={fadeIn}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-start justify-between border-b p-5 sm:p-6">
            <div>
              <h2 className="text-sm font-semibold">
                Hiring Recommendations
              </h2>

              <p
                className="mt-1 text-xs"
                style={{
                  color: "var(--muted-foreground)",
                }}
              >
                AI-generated candidate recommendation breakdown
              </p>
            </div>

            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                backgroundColor:
                  "oklch(0.55 0.17 261 / 0.1)",
              }}
            >
              <Trophy
                className="h-4 w-4"
                style={{
                  color: "var(--accent)",
                }}
              />
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {recDistribution.length > 0 ? (
              <>
                <ResponsiveContainer
                  width="100%"
                  height={210}
                >
                  <PieChart>
                    <Pie
                      data={recDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {recDistribution.map(
                        (entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.fill}
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "10px",
                        color: "var(--foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {recDistribution.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg px-3 py-2"
                      style={{
                        backgroundColor:
                          "oklch(1 0 0 / 0.025)",
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: item.fill,
                          }}
                        />

                        <span
                          className="truncate text-xs"
                          style={{
                            color:
                              "var(--muted-foreground)",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>

                      <span className="ml-2 text-xs font-semibold">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyChartState
                icon={Trophy}
                text="No recommendations yet"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* Recent Candidates */}
      {/* ------------------------------------------------------------ */}

      <motion.div
        initial="hidden"
        animate="visible"
        custom={7}
        variants={fadeIn}
        className="glass-card overflow-hidden"
      >
        <div
          className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          style={{
            borderColor: "var(--border)",
          }}
        >
          <div>
            <h2 className="text-sm font-semibold">
              Recent Candidates
            </h2>

            <p
              className="mt-1 text-xs"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              Latest candidates in your evaluation pipeline
            </p>
          </div>

          <button
            onClick={() => navigate("/candidates")}
            className="group flex w-fit items-center gap-1.5 text-xs font-semibold"
            style={{
              color: "var(--primary)",
            }}
          >
            View all
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {candidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: "var(--border)",
                  }}
                >
                  <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Candidate
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Score
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Recommendation
                  </th>

                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider">
                    Rank
                  </th>

                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {candidates.slice(0, 8).map((candidate) => {
                  const recommendation =
                    candidate.recommendation
                      ? RECOMMENDATION_LABELS[
                          candidate.recommendation
                        ]
                      : null;

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() =>
                        navigate(
                          `/candidates/${candidate.id}`
                        )
                      }
                      className="group cursor-pointer border-b transition-colors hover:bg-white/[0.025]"
                      style={{
                        borderColor: "var(--border)",
                      }}
                    >
                      {/* Candidate */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.72 0.19 169 / 0.16), oklch(0.55 0.17 261 / 0.16))",
                              color: "var(--primary)",
                            }}
                          >
                            {candidate.name
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {candidate.name}
                            </p>

                            <p
                              className="mt-0.5 max-w-[220px] truncate text-xs"
                              style={{
                                color:
                                  "var(--muted-foreground)",
                              }}
                            >
                              {candidate.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge
                          status={candidate.status}
                        />
                      </td>

                      {/* Score */}
                      <td className="px-4 py-4">
                        {candidate.final_score !== null &&
                        candidate.final_score !== undefined ? (
                          <span
                            className={`inline-flex min-w-[48px] items-center justify-center rounded-md px-2 py-1 text-xs font-bold ${getScoreClass(
                              candidate.final_score
                            )}`}
                          >
                            {Math.round(
                              Number(
                                candidate.final_score
                              )
                            )}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{
                              color:
                                "var(--muted-foreground)",
                            }}
                          >
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Recommendation */}
                      <td className="px-4 py-4">
                        {recommendation ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium"
                            style={{
                              color: recommendation.color,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  recommendation.color,
                              }}
                            />

                            {recommendation.label}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{
                              color:
                                "var(--muted-foreground)",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* Rank */}
                      <td
                        className="px-4 py-4 text-xs font-medium"
                        style={{
                          color:
                            candidate.rank
                              ? "var(--foreground)"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {candidate.rank
                          ? `#${candidate.rank}`
                          : "—"}
                      </td>

                      <td className="px-4 py-4">
                        <ArrowUpRight
                          className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                          style={{
                            color: "var(--primary)",
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundColor:
                  "oklch(0.72 0.19 169 / 0.08)",
              }}
            >
              <Upload
                className="h-6 w-6"
                style={{
                  color: "var(--primary)",
                }}
              />
            </div>

            <h3 className="text-sm font-semibold">
              No candidates yet
            </h3>

            <p
              className="mt-1.5 max-w-sm text-xs leading-5"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              Add your first candidate to start building
              your AI-powered evaluation pipeline.
            </p>

            <button
              onClick={() => navigate("/candidates")}
              className="mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold"
              style={{
                backgroundColor:
                  "oklch(0.72 0.19 169 / 0.1)",
                color: "var(--primary)",
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Candidate
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helper Components                                                   */
/* ------------------------------------------------------------------ */

function EmptyChartState({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex h-[235px] flex-col items-center justify-center text-center">
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          backgroundColor:
            "oklch(1 0 0 / 0.035)",
        }}
      >
        <Icon
          className="h-5 w-5"
          style={{
            color: "var(--muted-foreground)",
          }}
        />
      </div>

      <p
        className="text-xs"
        style={{
          color: "var(--muted-foreground)",
        }}
      >
        {text}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  if (!status) {
    return (
      <span
        className="text-xs"
        style={{
          color: "var(--muted-foreground)",
        }}
      >
        —
      </span>
    );
  }

  const statusConfig: Record<
    string,
    {
      label: string;
      color: string;
      background: string;
    }
  > = {
    pending: {
      label: "Pending",
      color: "var(--muted-foreground)",
      background: "oklch(1 0 0 / 0.05)",
    },
    resume_uploaded: {
      label: "Resume Uploaded",
      color: "var(--info)",
      background: "oklch(0.68 0.16 246 / 0.1)",
    },
    resume_analyzed: {
      label: "Resume Analyzed",
      color: "var(--primary)",
      background: "oklch(0.72 0.19 169 / 0.1)",
    },
    interview_uploaded: {
      label: "Interview Uploaded",
      color: "var(--accent)",
      background: "oklch(0.55 0.17 261 / 0.1)",
    },
    interview_analyzed: {
      label: "Interview Analyzed",
      color: "var(--primary)",
      background: "oklch(0.72 0.19 169 / 0.1)",
    },
    scored: {
      label: "Scored",
      color: "var(--success)",
      background: "oklch(0.72 0.19 142 / 0.1)",
    },
    report_generated: {
      label: "Report Ready",
      color: "var(--success)",
      background: "oklch(0.72 0.19 142 / 0.1)",
    },
  };

  const config =
    statusConfig[status] || {
      label: status.replaceAll("_", " "),
      color: "var(--muted-foreground)",
      background: "oklch(1 0 0 / 0.05)",
    };

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium"
      style={{
        color: config.color,
        backgroundColor: config.background,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{
          backgroundColor: config.color,
        }}
      />

      {config.label}
    </span>
  );
}