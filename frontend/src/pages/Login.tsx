/**
 * Login page — polished CandidateAI authentication screen.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 18% 18%,
              oklch(0.76 0.17 178 / 0.12) 0%,
              transparent 38%
            ),
            radial-gradient(
              ellipse at 82% 82%,
              oklch(0.62 0.19 258 / 0.12) 0%,
              transparent 40%
            ),
            var(--background)
          `,
        }}
      />

      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute left-[10%] top-[12%] h-64 w-64 rounded-full blur-3xl"
        style={{
          backgroundColor: "oklch(0.76 0.17 178 / 0.045)",
        }}
      />

      <div
        className="pointer-events-none absolute bottom-[8%] right-[8%] h-72 w-72 rounded-full blur-3xl"
        style={{
          backgroundColor: "oklch(0.62 0.19 258 / 0.045)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_460px]">
          {/* Brand / value proposition */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="hidden lg:block"
          >
            <div className="mb-8 flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--accent))",
                  boxShadow:
                    "0 10px 35px oklch(0.76 0.17 178 / 0.18)",
                }}
              >
                <Brain
                  className="h-6 w-6"
                  style={{
                    color: "var(--primary-foreground)",
                  }}
                />
              </div>

              <div>
                <div className="gradient-text text-lg font-bold">
                  CandidateAI
                </div>

                <div
                  className="text-[10px] font-medium uppercase tracking-[0.16em]"
                  style={{
                    color: "var(--muted-foreground)",
                  }}
                >
                  Candidate intelligence
                </div>
              </div>
            </div>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Evaluate candidates with{" "}
              <span className="gradient-text">AI-powered intelligence.</span>
            </h1>

            <p
              className="mt-5 max-w-lg text-base leading-7"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              Analyze resumes, evaluate interviews, rank candidates and
              generate actionable hiring insights from one workspace.
            </p>

            <div className="mt-8 space-y-3">
              {[
                "Automated resume analysis",
                "AI-powered interview evaluation",
                "Candidate ranking and insights",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-sm"
                  style={{
                    color: "var(--card-foreground)",
                  }}
                >
                  <CheckCircle2
                    className="h-4 w-4 shrink-0"
                    style={{
                      color: "var(--primary)",
                    }}
                  />
                  {feature}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.08,
            }}
            className="glass-card w-full p-7 sm:p-9"
          >
            {/* Mobile brand */}
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--accent))",
                  boxShadow:
                    "0 10px 35px oklch(0.76 0.17 178 / 0.18)",
                }}
              >
                <Brain
                  className="h-7 w-7"
                  style={{
                    color: "var(--primary-foreground)",
                  }}
                />
              </div>

              <h1 className="gradient-text text-2xl font-bold">
                CandidateAI
              </h1>
            </div>

            {/* Header */}
            <div className="mb-7">
              <div
                className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
                style={{
                  color: "var(--primary)",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Recruiter workspace
              </div>

              <h2 className="text-2xl font-bold tracking-tight">
                Welcome back
              </h2>

              <p
                className="mt-1.5 text-sm leading-6"
                style={{
                  color: "var(--muted-foreground)",
                }}
              >
                Sign in to continue managing your candidate pipeline.
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: -5,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mb-5 rounded-xl border p-3.5 text-sm"
                style={{
                  backgroundColor: "oklch(0.63 0.22 27 / 0.09)",
                  borderColor: "oklch(0.63 0.22 27 / 0.22)",
                  color: "var(--destructive)",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                    style={{
                      color: "var(--muted-foreground)",
                    }}
                  />

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border pl-11 pr-4 text-sm transition-all"
                    style={{
                      backgroundColor:
                        "oklch(0.12 0.012 260 / 0.65)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
                    style={{
                      color: "var(--muted-foreground)",
                    }}
                  />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl border pl-11 pr-12 text-sm transition-all"
                    style={{
                      backgroundColor:
                        "oklch(0.12 0.012 260 / 0.65)",
                      borderColor: "var(--border)",
                      color: "var(--foreground)",
                    }}
                    placeholder="Enter your password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                    style={{
                      color: "var(--muted-foreground)",
                    }}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--accent))",
                  color: "var(--primary-foreground)",
                  boxShadow:
                    "0 10px 25px oklch(0.76 0.17 178 / 0.12)",
                }}
              >
                {loading ? (
                  <>
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                      style={{
                        borderColor:
                          "var(--primary-foreground)",
                        borderTopColor: "transparent",
                      }}
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Security */}
            <div
              className="mt-6 flex items-center justify-center gap-2 text-[11px]"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure recruiter authentication
            </div>

            {/* Register */}
            <div
              className="my-6 h-px"
              style={{
                backgroundColor: "var(--border)",
              }}
            />

            <p
              className="text-center text-sm"
              style={{
                color: "var(--muted-foreground)",
              }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold transition-colors hover:underline"
                style={{
                  color: "var(--primary)",
                }}
              >
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}