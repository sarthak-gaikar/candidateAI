/**
 * Sidebar navigation component with collapsible drawer.
 */

import { AnimatePresence, motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Trophy,
  Users,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  {
    path: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    path: "/candidates",
    icon: Users,
    label: "Candidates",
  },
  {
    path: "/rankings",
    icon: Trophy,
    label: "Rankings",
  },
  {
    path: "/reports",
    icon: FileText,
    label: "Reports",
  },
  {
    path: "/search",
    icon: Search,
    label: "AI Search",
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <motion.aside
      animate={{
        width: collapsed ? 72 : 260,
      }}
      transition={{
        duration: 0.25,
        ease: "easeInOut",
      }}
      className="fixed inset-y-0 left-0 z-40 flex flex-col border-r"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.115 0.012 260), oklch(0.095 0.012 260))",
        borderColor: "var(--sidebar-border)",
      }}
    >
      {/* ============================================================
          Brand
          ============================================================ */}

      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b",
          collapsed ? "justify-center px-2" : "gap-3 px-5"
        )}
        style={{
          borderColor: "var(--sidebar-border)",
        }}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), var(--accent))",
            boxShadow:
              "0 8px 24px oklch(0.76 0.17 178 / 0.16)",
          }}
        >
          <Brain
            className="h-5 w-5"
            style={{
              color: "var(--primary-foreground)",
            }}
          />
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{
                opacity: 0,
                width: 0,
              }}
              animate={{
                opacity: 1,
                width: "auto",
              }}
              exit={{
                opacity: 0,
                width: 0,
              }}
              transition={{
                duration: 0.18,
              }}
              className="min-w-0 overflow-hidden"
            >
              <div className="gradient-text whitespace-nowrap text-base font-bold tracking-tight">
                CandidateAI
              </div>

              <div
                className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em]"
                style={{
                  color: "var(--muted-foreground)",
                }}
              >
                Candidate intelligence
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================
          Navigation
          ============================================================ */}

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
        {!collapsed && (
          <div
            className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{
              color: "var(--muted-foreground)",
            }}
          >
            Workspace
          </div>
        )}

        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center rounded-xl transition-all duration-200",
                collapsed
                  ? "justify-center px-2 py-3"
                  : "gap-3 px-3 py-3",
                isActive
                  ? "shadow-sm"
                  : "hover:bg-white/[0.045]"
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    backgroundColor:
                      "oklch(0.76 0.17 178 / 0.1)",
                    color: "var(--primary)",
                  }
                : {
                    color: "var(--sidebar-foreground)",
                  }
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full"
                    style={{
                      backgroundColor: "var(--primary)",
                      boxShadow:
                        "0 0 10px oklch(0.76 0.17 178 / 0.5)",
                    }}
                  />
                )}

                <item.icon
                  className={cn(
                    "h-[19px] w-[19px] shrink-0 transition-transform",
                    !isActive && "group-hover:scale-105"
                  )}
                />

                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      exit={{
                        opacity: 0,
                      }}
                      className="truncate text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {!collapsed && isActive && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: "var(--primary)",
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ============================================================
          User
          ============================================================ */}

      <div
        className="border-t p-3"
        style={{
          borderColor: "var(--sidebar-border)",
        }}
      >
        <div
          className={cn(
            "flex items-center rounded-xl",
            collapsed
              ? "justify-center p-1"
              : "gap-3 px-2 py-2"
          )}
          style={{
            backgroundColor: collapsed
              ? "transparent"
              : "oklch(0.15 0.012 260 / 0.65)",
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background:
                "linear-gradient(135deg, var(--primary), var(--accent))",
              color: "var(--primary-foreground)",
            }}
          >
            {initials}
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{
                  opacity: 0,
                  width: 0,
                }}
                animate={{
                  opacity: 1,
                  width: "auto",
                }}
                exit={{
                  opacity: 0,
                  width: 0,
                }}
                className="min-w-0 flex-1 overflow-hidden"
              >
                <p
                  className="truncate text-sm font-medium"
                  style={{
                    color: "var(--foreground)",
                  }}
                >
                  {user?.full_name || "User"}
                </p>

                <p
                  className="truncate text-[11px]"
                  style={{
                    color: "var(--muted-foreground)",
                  }}
                >
                  {user?.email || ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
              style={{
                color: "var(--muted-foreground)",
              }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          Collapse Button
          ============================================================ */}

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-all hover:scale-105"
        style={{
          backgroundColor: "var(--sidebar-background)",
          borderColor: "var(--sidebar-border)",
          color: "var(--muted-foreground)",
        }}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </motion.aside>
  );
}