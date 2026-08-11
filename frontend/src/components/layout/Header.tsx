/**
 * Top application header.
 */

import { Bell, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-2xl"
      style={{
        backgroundColor: "oklch(0.12 0.012 260 / 0.82)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex h-[72px] items-center gap-4 px-5 sm:px-6 lg:px-8">
        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="relative min-w-0 flex-1"
        >
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--muted-foreground)" }}
          />

          <input
            id="global-search"
            type="text"
            placeholder="Search candidates, skills, experience..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border pl-10 pr-20 text-sm shadow-sm transition-all"
            style={{
              backgroundColor: "oklch(0.17 0.014 260 / 0.8)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />

          <div
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium sm:flex"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
              backgroundColor: "oklch(0.2 0.014 260)",
            }}
          >
            <span>⌘</span>
            <span>K</span>
          </div>
        </form>

        {/* AI Search shortcut */}
        <button
          type="button"
          onClick={() => navigate("/search")}
          className="hidden h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-all hover:bg-white/5 lg:flex"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
            backgroundColor: "oklch(0.16 0.012 260 / 0.7)",
          }}
          title="AI Search"
        >
          <Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <span>AI Search</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          id="notifications-btn"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all hover:bg-white/5"
          style={{
            borderColor: "var(--border)",
            color: "var(--muted-foreground)",
            backgroundColor: "oklch(0.16 0.012 260 / 0.7)",
          }}
          title="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />

          <span
            className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: "var(--primary)",
              boxShadow: "0 0 8px oklch(0.76 0.17 178 / 0.7)",
            }}
          />
        </button>
      </div>
    </header>
  );
}