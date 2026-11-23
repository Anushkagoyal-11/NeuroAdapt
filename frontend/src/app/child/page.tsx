"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Target,
  Puzzle,
  Lightbulb,
  ChevronRight,
  Flame,
  Star,
  Zap,
  Clock,
  TrendingUp,
  Play,
  Activity,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  ClipboardList,
  BookOpen,
  Mic,
  Smile,
  Shuffle,
  ShieldCheck,
} from "lucide-react";
import { useChildContext } from "./ChildContext";
import InteractiveExerciseGame, { ExercisePlayConfig } from "./components/InteractiveExerciseGame";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                       TYPES                                           */
/* ═══════════════════════════════════════════════════════════════════════ */

interface ActiveAssignment {
  id: number;
  exercise_id: number;
  exercise_name: string;
  pathway?: string;
  domain: string;
  difficulty: number;
  notes: string;
  clinician_name: string;
  assigned_date: string | null;
}

interface RecommendedExercise {
  exercise_id: number;
  name: string;
  pathway: string;
  domain: string;
  difficulty: number;
  description: string;
  instructions: string;
  reason: string;
}

interface DashboardData {
  user: { id: number; name: string; email: string; role: string; age?: number };
  child_id: number | null;
  assigned_pathways: string[];
  stats: {
    total_sessions: number;
    today_sessions: number;
    total_exercises_done: number;
    avg_accuracy: number;
    total_xp: number;
    total_time_min: number;
    streak_days: number;
  };
  pathway_stats?: Record<string, { sessions: number; avg_accuracy: number }>;
  domain_stats: Record<
    string,
    {
      label: string;
      pathway: string;
      sessions: number;
      accuracy: number;
      avg_score: number;
      level: number;
      next_level: number;
      progress: number;
    }
  >;
  active_assignments?: ActiveAssignment[];
  recommended_exercises?: RecommendedExercise[];
  recent_sessions: Array<{
    id: number;
    exercise_id: number;
    exercise: string;
    pathway: string;
    domain: string;
    score: number;
    accuracy: number;
    response_time: number;
    errors: number;
    difficulty: number;
    date: string | null;
    completed: boolean;
  }>;
}

interface ExerciseData {
  id: number;
  name: string;
  pathway: string;
  domain: string;
  difficulty: number;
  description?: string;
  instructions?: string;
  configuration: Record<string, unknown>;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     PATHWAY CONFIG HELPERS                            */
/* ═══════════════════════════════════════════════════════════════════════ */

function getPathwayBadge(pathway: string) {
  switch (pathway?.toLowerCase()) {
    case "adhd":
      return {
        label: "ADHD Pathway",
        short: "ADHD",
        bg: "#F3E8FF",
        border: "#DDD6FE",
        color: "#7C3AED",
        icon: <Activity className="h-4 w-4" />,
      };
    case "dyslexia":
      return {
        label: "Dyslexia Pathway",
        short: "Dyslexia",
        bg: "#EFF6FF",
        border: "#BFDBFE",
        color: "#2563EB",
        icon: <BookOpen className="h-4 w-4" />,
      };
    case "speech":
      return {
        label: "Speech & Language",
        short: "Speech",
        bg: "#ECFDF5",
        border: "#A7F3D0",
        color: "#059669",
        icon: <Mic className="h-4 w-4" />,
      };
    default:
      return {
        label: "General Skill",
        short: "Skill",
        bg: "#F3F4F6",
        border: "#E5E7EB",
        color: "#4B5563",
        icon: <Sparkles className="h-4 w-4" />,
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        WELCOME HERO                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

function WelcomeHero({
  userName,
  stats,
  assignedPathways,
  recommended,
  onStartSession,
}: {
  userName: string;
  stats: DashboardData["stats"];
  assignedPathways: string[];
  recommended?: RecommendedExercise | null;
  onStartSession: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="cd-welcome-hero">
      <div className="cd-welcome-hero-bg" />
      <div className="cd-welcome-hero-content">
        <div className="cd-welcome-hero-left">
          <div className="cd-welcome-badge">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Today&apos;s Training • Multi-Pathway Personalization</span>
          </div>

          <h1 className="cd-welcome-heading">
            {greeting}, <span className="cd-welcome-name">{userName}</span>! 👋
          </h1>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "10px 0 14px" }}>
            {assignedPathways.map((p) => {
              const badge = getPathwayBadge(p);
              return (
                <span
                  key={p}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "rgba(255, 255, 255, 0.22)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.35)",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "white",
                  }}
                >
                  {badge.icon} {badge.label}
                </span>
              );
            })}
          </div>

          <p className="cd-welcome-subtitle">
            {recommended
              ? `Recommended for your goals: ${recommended.name} (${recommended.pathway.toUpperCase()} • Level ${recommended.difficulty}). Let's practice!`
              : stats.total_sessions > 0
              ? "You're making steady progress! Complete today's recommended activities to build your skills."
              : "Welcome to NeuroAdapt! Start your personalized developmental exercises below."}
          </p>

          <div className="cd-welcome-stats-row">
            <div className="cd-welcome-stat">
              <Flame className="h-4.5 w-4.5 text-orange-400" />
              <span className="cd-welcome-stat-value">{stats.streak_days}</span>
              <span className="cd-welcome-stat-label">day streak</span>
            </div>
            <div className="cd-welcome-stat-divider" />
            <div className="cd-welcome-stat">
              <Star className="h-4.5 w-4.5 text-amber-300" />
              <span className="cd-welcome-stat-value">{stats.total_xp.toLocaleString()}</span>
              <span className="cd-welcome-stat-label">total XP</span>
            </div>
            <div className="cd-welcome-stat-divider" />
            <div className="cd-welcome-stat">
              <Activity className="h-4.5 w-4.5 text-violet-200" />
              <span className="cd-welcome-stat-value">{stats.total_sessions}</span>
              <span className="cd-welcome-stat-label">sessions</span>
            </div>
          </div>
        </div>

        <div className="cd-welcome-hero-right">
          <button onClick={onStartSession} className="cd-start-session-btn">
            <div className="cd-start-session-icon">
              <Play className="h-6 w-6" fill="currentColor" />
            </div>
            <div className="cd-start-session-text">
              <span className="cd-start-session-title">
                {recommended ? `Play ${recommended.name}` : "Start Activity"}
              </span>
              <span className="cd-start-session-sub">
                {recommended ? `${recommended.pathway.toUpperCase()} • Level ${recommended.difficulty}` : "Begin Session"}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        MAIN DASHBOARD PAGE                            */
/* ═══════════════════════════════════════════════════════════════════════ */

export default function ChildDashboard() {
  const { user, apiUrl, activePathwayFilter, setActivePathwayFilter } = useChildContext();
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGameConfig, setActiveGameConfig] = useState<ExercisePlayConfig | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [dashRes, exRes] = await Promise.all([
        fetch(`${apiUrl}/api/child/dashboard/${user.id}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${apiUrl}/api/exercises`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);

      if (dashRes) {
        setDashData(dashRes);
      }
      setExercises(Array.isArray(exRes) ? exRes : []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, apiUrl]);

  const assignedPathways = dashData?.assigned_pathways || user?.assigned_pathways || ["adhd"];

  const handleStartPrimarySession = () => {
    if (dashData?.active_assignments && dashData.active_assignments.length > 0) {
      const a = dashData.active_assignments[0];
      setActiveGameConfig({
        exerciseId: a.exercise_id,
        exerciseName: a.exercise_name,
        pathway: a.pathway || "adhd",
        domain: a.domain,
        difficulty: a.difficulty,
        assignmentId: a.id,
        notes: a.notes,
      });
      return;
    }

    if (dashData?.recommended_exercises && dashData.recommended_exercises.length > 0) {
      const r = dashData.recommended_exercises[0];
      setActiveGameConfig({
        exerciseId: r.exercise_id,
        exerciseName: r.name,
        pathway: r.pathway,
        domain: r.domain,
        difficulty: r.difficulty,
      });
      return;
    }

    if (exercises.length > 0) {
      const firstEx = exercises[0];
      setActiveGameConfig({
        exerciseId: firstEx.id,
        exerciseName: firstEx.name,
        pathway: firstEx.pathway,
        domain: firstEx.domain,
        difficulty: firstEx.difficulty,
      });
    }
  };

  const handlePlayExercise = (exId: number, name: string, pathway: string, domain: string, diff: number, notes?: string, assignId?: number) => {
    setActiveGameConfig({
      exerciseId: exId,
      exerciseName: name,
      pathway,
      domain,
      difficulty: diff,
      notes,
      assignmentId: assignId || null,
    });
  };

  if (loading) {
    return (
      <div className="cd-page-loading">
        <div className="cd-loading-spinner" />
        <span>Loading your personalized dashboard...</span>
      </div>
    );
  }

  const displayName = user?.name || "Learner";
  const stats = dashData?.stats || {
    total_sessions: 0,
    today_sessions: 0,
    total_exercises_done: 0,
    avg_accuracy: 0,
    total_xp: 0,
    total_time_min: 0,
    streak_days: 0,
  };

  const recommendedOne = dashData?.recommended_exercises?.[0] || null;

  // Filter recommendations or activities by selected pathway tab
  const displayedRecommendations = (dashData?.recommended_exercises || []).filter((rec) => {
    if (activePathwayFilter === "all") return true;
    return rec.pathway.toLowerCase() === activePathwayFilter.toLowerCase();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 1. Welcome Hero */}
      <WelcomeHero
        userName={displayName}
        stats={stats}
        assignedPathways={assignedPathways}
        recommended={recommendedOne}
        onStartSession={handleStartPrimarySession}
      />

      {/* 2. Pathway Switcher Tabs */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
            Your Intervention Pathways
          </h2>
          <span style={{ fontSize: "12.5px", color: "#7C3AED", fontWeight: 600 }}>
            Assigned: {assignedPathways.map((p) => p.toUpperCase()).join(" + ")}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActivePathwayFilter("all")}
            className={`cd-filter-chip ${activePathwayFilter === "all" ? "cd-filter-chip--active" : ""}`}
          >
            All Pathways (Unified)
          </button>
          {assignedPathways.map((p) => {
            const badge = getPathwayBadge(p);
            return (
              <button
                key={p}
                onClick={() => setActivePathwayFilter(p)}
                className={`cd-filter-chip ${activePathwayFilter === p ? "cd-filter-chip--active" : ""}`}
              >
                {badge.icon} {badge.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Clinician Assignments (if any) */}
      {dashData?.active_assignments && dashData.active_assignments.length > 0 && (
        <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: "18px", padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <ClipboardList className="h-5 w-5 text-violet-700" />
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#4C1D95", margin: 0 }}>
              Active Clinician Prescriptions ({dashData.active_assignments.length})
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {dashData.active_assignments.map((a) => {
              const badge = getPathwayBadge(a.pathway || "adhd");
              return (
                <div
                  key={a.id}
                  style={{
                    background: "white",
                    border: "1px solid #E5DEFF",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: 700, color: badge.color, background: badge.bg, padding: "2px 6px", borderRadius: "4px" }}>
                        {badge.short}
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#6D28D9" }}>Level {a.difficulty}</span>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#1A1035" }}>{a.exercise_name}</div>
                    <div style={{ fontSize: "11.5px", color: "#6B6580" }}>{a.notes || `Prescribed by ${a.clinician_name}`}</div>
                  </div>
                  <button
                    onClick={() => handlePlayExercise(a.exercise_id, a.exercise_name, a.pathway || "adhd", a.domain, a.difficulty, a.notes, a.id)}
                    style={{
                      background: "#7C3AED",
                      color: "white",
                      border: "none",
                      borderRadius: "10px",
                      padding: "8px 14px",
                      fontSize: "12.5px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Play className="h-3.5 w-3.5" fill="currentColor" /> Play
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Today's Recommended Activities */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1035", margin: 0 }}>
              Recommended Activities Today
            </h3>
            <span style={{ fontSize: "12.5px", color: "#7C3AED", fontWeight: 600 }}>
              Tailored to your progress across assigned pathways
            </span>
          </div>
          <Link href="/child/exercises" style={{ fontSize: "13px", fontWeight: 700, color: "#7C3AED", display: "flex", alignItems: "center", gap: "4px" }}>
            View All Exercises <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "14px" }}>
          {(displayedRecommendations.length > 0 ? displayedRecommendations : exercises.slice(0, 3)).map((item: any) => {
            const badge = getPathwayBadge(item.pathway || "adhd");
            return (
              <div
                key={item.exercise_id || item.id}
                style={{
                  background: "white",
                  border: "1px solid #EDE9FE",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 15px rgba(124, 58, 237, 0.04)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: badge.bg,
                        color: badge.color,
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {badge.icon} {badge.label}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", background: "#FAF5FF", padding: "3px 8px", borderRadius: "6px" }}>
                      Level {item.difficulty || 1}
                    </span>
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#1A1035", margin: "0 0 6px" }}>
                    {item.name}
                  </h4>
                  <p style={{ fontSize: "12.5px", color: "#6B6580", margin: "0 0 12px", lineHeight: 1.4 }}>
                    {item.description || item.reason || `Targeted practice for ${item.domain}`}
                  </p>
                </div>

                <button
                  onClick={() =>
                    handlePlayExercise(
                      item.exercise_id || item.id,
                      item.name,
                      item.pathway || "adhd",
                      item.domain,
                      item.difficulty || 1,
                      item.instructions
                    )
                  }
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #9333EA)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.18)",
                  }}
                >
                  <Play className="h-4 w-4" fill="currentColor" /> Start Activity
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Pathway Skills Progress Cards */}
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1035", marginBottom: "12px" }}>
          Skills Progress Breakdown
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {Object.entries(dashData?.domain_stats || {})
            .filter(([_, d]) => activePathwayFilter === "all" || d.pathway.toLowerCase() === activePathwayFilter.toLowerCase())
            .slice(0, 8)
            .map(([key, d]) => {
              const badge = getPathwayBadge(d.pathway);
              return (
                <div
                  key={key}
                  style={{
                    background: "white",
                    border: "1px solid #EDE9FE",
                    borderRadius: "16px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: badge.color }}>{badge.short}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED" }}>Lvl {d.level}</span>
                  </div>
                  <h5 style={{ fontSize: "14px", fontWeight: 800, color: "#1A1035", margin: "0 0 6px" }}>
                    {d.label}
                  </h5>
                  <div style={{ height: "6px", background: "#F3E8FF", borderRadius: "10px", overflow: "hidden", marginBottom: "6px" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(8, d.progress))}%`,
                        background: badge.color,
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#6B6580" }}>
                    <span>{d.sessions} sessions</span>
                    <span style={{ fontWeight: 700, color: d.accuracy >= 80 ? "#059669" : "#6D28D9" }}>{d.accuracy}% acc</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 6. Recent Sessions Feed */}
      <div>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1A1035", marginBottom: "12px" }}>
          Recent Activity History
        </h3>
        {dashData?.recent_sessions && dashData.recent_sessions.length > 0 ? (
          <div style={{ background: "white", border: "1px solid #EDE9FE", borderRadius: "18px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#FAF7FF", borderBottom: "1px solid #EDE9FE", textAlign: "left", color: "#5B21B6", fontWeight: 700 }}>
                  <th style={{ padding: "12px 16px" }}>Activity</th>
                  <th style={{ padding: "12px 16px" }}>Pathway</th>
                  <th style={{ padding: "12px 16px" }}>Level</th>
                  <th style={{ padding: "12px 16px" }}>Accuracy</th>
                  <th style={{ padding: "12px 16px" }}>XP</th>
                  <th style={{ padding: "12px 16px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {dashData.recent_sessions.map((s) => {
                  const badge = getPathwayBadge(s.pathway);
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #F5F3FF" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1A1035" }}>{s.exercise}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: badge.color, background: badge.bg, padding: "2px 6px", borderRadius: "4px" }}>
                          {badge.short}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#6B6580" }}>Level {s.difficulty}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: s.accuracy >= 80 ? "#059669" : "#D97706" }}>
                        {s.accuracy}%
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#7C3AED" }}>+{s.score}</td>
                      <td style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: "12px" }}>
                        {s.date ? new Date(s.date).toLocaleDateString() : "Today"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ background: "white", padding: "24px", borderRadius: "16px", textAlign: "center", color: "#6B6580", border: "1px solid #EDE9FE" }}>
            No completed sessions yet. Start your first activity above!
          </div>
        )}
      </div>

      {/* Active Game Modal */}
      {activeGameConfig && user && (
        <InteractiveExerciseGame
          config={activeGameConfig}
          childId={user.id}
          apiUrl={apiUrl}
          onClose={() => {
            setActiveGameConfig(null);
            fetchData();
          }}
          onComplete={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
