/**
 * AI Search page — natural language candidate search with real-time results.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search as SearchIcon, Sparkles, ArrowRight, Zap, Users } from "lucide-react";
import api from "@/lib/api";
import { RECOMMENDATION_LABELS, getScoreClass } from "@/lib/constants";

const EXAMPLE_QUERIES = [
  "Show candidates with Python and Machine Learning skills",
  "Find candidates with at least 3 years experience",
  "Top-rated candidates with React and Node.js",
  "Candidates recommended for hiring with cloud experience",
];

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  async function handleSearch(q?: string) {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearched(true);
    try {
      const res = await api.post("/search", { query: searchQuery });
      setResults(res.data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6" style={{ color: "var(--primary)" }} /> AI Search
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Search candidates using natural language
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the candidates you're looking for..."
          className="w-full pl-12 pr-32 py-4 rounded-xl border text-base outline-none transition-all focus:ring-2"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          id="ai-search-input"
        />
        <button type="submit" disabled={searching || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "var(--primary-foreground)" }}
          id="ai-search-submit">
          {searching ? (
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Zap className="w-4 h-4" /> Search</>
          )}
        </button>
      </form>

      {/* Example Queries */}
      {!searched && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
            Try these examples:
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((eq) => (
              <button key={eq}
                onClick={() => { setQuery(eq); handleSearch(eq); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:bg-white/5 hover:border-opacity-50"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                {eq}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {searching ? "Searching..." : `Found ${results.length} candidates`}
          </p>

          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((r, i) => {
                const rec = r.recommendation ? RECOMMENDATION_LABELS[r.recommendation] : null;
                return (
                  <motion.div key={r.candidate_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/candidates/${r.candidate_id}`)}
                    className="glass-card p-5 cursor-pointer transition-all hover:border-opacity-50 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{r.name}</h3>
                          {r.match_score && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold"
                              style={{ backgroundColor: "oklch(0.72 0.19 168.94 / 0.15)", color: "var(--primary)" }}>
                              {r.match_score}% match
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                          {r.email || "No email"}
                        </p>
                        {r.skills && r.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {r.skills.slice(0, 8).map((s: string, j: number) => (
                              <span key={j} className="px-1.5 py-0.5 rounded text-xs"
                                style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}>
                                {s}
                              </span>
                            ))}
                            {r.skills.length > 8 && (
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                +{r.skills.length - 8} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {r.final_score !== null && (
                          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getScoreClass(r.final_score)}`}>
                            {r.final_score}
                          </span>
                        )}
                        {rec && (
                          <span className="text-xs font-medium" style={{ color: rec.color }}>{rec.label}</span>
                        )}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: "var(--primary)" }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : !searching ? (
            <div className="glass-card p-16 text-center" style={{ color: "var(--muted-foreground)" }}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No matching candidates found</p>
              <p className="text-xs mt-1">Try broadening your search query</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
