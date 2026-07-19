/**
 * Registration page — matching the login page design.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse at 70% 20%, oklch(0.55 0.17 261.09 / 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at 30% 80%, oklch(0.72 0.19 168.94 / 0.1) 0%, transparent 50%),
          var(--background)
        `
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))" }}>
            <Brain className="w-7 h-7" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Join as a recruiter
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ backgroundColor: "oklch(0.59 0.22 27.33 / 0.15)", color: "var(--destructive)" }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input id="register-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                required className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                placeholder="recruiter@company.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input id="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required minLength={8} className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                placeholder="Min 8 characters" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input id="register-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ backgroundColor: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}
                placeholder="Repeat password" />
            </div>
          </div>

          <button id="register-submit" type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))", color: "var(--primary-foreground)" }}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
