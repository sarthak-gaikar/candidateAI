/**
 * Top header with search bar and user actions.
 */

import { Bell, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b backdrop-blur-xl"
      style={{
        backgroundColor: "oklch(0.14 0.004 285.82 / 0.8)",
        borderColor: "var(--border)",
      }}
    >
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          type="text"
          placeholder="Search candidates... (e.g., 'Python developer with 3 years experience')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border outline-none transition-colors"
          style={{
            backgroundColor: "var(--secondary)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          id="global-search"
        />
      </form>

      {/* Actions */}
      <div className="flex items-center gap-3 ml-4">
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--muted-foreground)" }}
          id="notifications-btn"
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--primary)" }}
          />
        </button>
      </div>
    </header>
  );
}
