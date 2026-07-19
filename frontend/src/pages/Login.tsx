/**
 * Login page — glassmorphic card with gradient background.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
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
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 30% 20%, oklch(0.72 0.19 168.94 / 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, oklch(0.55 0.17 261.09 / 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, oklch(0.80 0.17 84.43 / 0.05) 0%, transparent 50%),
          var(--background)
        `
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          >
            <Brain className="w-7 h-7" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <h1 className="text-2xl font-bold gradient-text">CandidateAI</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            AI-Powered Candidate Evaluation
          </p>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: "oklch(0.59 0.22 27.33 / 0.15)", color: "var(--destructive)" }}
          >
            {error}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:ring-2"
                style={{
                  backgroundColor: "var(--secondary)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
                placeholder="recruiter@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  backgroundColor: "var(--secondary)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--accent))",
              color: "var(--primary-foreground)",
            }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary-foreground)", borderTopColor: "transparent" }} />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
