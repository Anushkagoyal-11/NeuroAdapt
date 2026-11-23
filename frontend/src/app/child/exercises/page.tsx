"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Target,
  Puzzle,
  Lightbulb,
  Play,
  Zap,
  Search,
  BookOpen,
  Mic,
  Activity,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useChildContext } from "../ChildContext";
import InteractiveExerciseGame, { ExercisePlayConfig } from "../components/InteractiveExerciseGame";

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

export default function ExercisesPage() {
  const { user, apiUrl, activePathwayFilter, setActivePathwayFilter } = useChildContext();
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [domainLevels, setDomainLevels] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pathwayFilter, setPathwayFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGameConfig, setActiveGameConfig] = useState<ExercisePlayConfig | null>(null);

  const fetchExercisesAndStats = async () => {
    try {
      const [exRes, dashRes] = await Promise.all([
        fetch(`${apiUrl}/api/exercises`),
        user?.id ? fetch(`${apiUrl}/api/child/dashboard/${user.id}`) : Promise.resolve(null),
      ]);

      if (exRes.ok) {
        const data = await exRes.json();
        setExercises(Array.isArray(data) ? data : []);
      }

      if (dashRes && dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.domain_stats) {
          const lvls: Record<string, number> = {};
          Object.entries(dashData.domain_stats).forEach(([dom, s]: [string, any]) => {
            lvls[dom] = s.level || s.max_difficulty || 1;
          });
          setDomainLevels(lvls);
        }
      }
    } catch {
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercisesAndStats();
  }, [apiUrl, user?.id]);

  const difficultyLabel = (d: number) => (d <= 2 ? "Beginner" : d <= 5 ? "Intermediate" : "Advanced");
  const difficultyColor = (d: string) => {
    if (d === "Beginner") return { bg: "#ECFDF5", text: "#059669" };
    if (d === "Intermediate") return { bg: "#FFF7ED", text: "#D97706" };
    return { bg: "#FEF2F2", text: "#DC2626" };
  };

  const pathwayBadge = (pathway: string) => {
    switch (pathway.toLowerCase()) {
      case "adhd":
        return { label: "ADHD", bg: "#F3E8FF", color: "#7C3AED", icon: <Activity className="h-3.5 w-3.5" /> };
      case "dyslexia":
        return { label: "Dyslexia", bg: "#EFF6FF", color: "#2563EB", icon: <BookOpen className="h-3.5 w-3.5" /> };
      case "speech":
        return { label: "Speech & Language", bg: "#ECFDF5", color: "#059669", icon: <Mic className="h-3.5 w-3.5" /> };
      default:
        return { label: pathway.toUpperCase(), bg: "#F3F4F6", color: "#4B5563", icon: <Sparkles className="h-3.5 w-3.5" /> };
    }
  };

  const filtered = exercises.filter((ex) => {
    const matchesPathway = pathwayFilter === "all" || ex.pathway.toLowerCase() === pathwayFilter.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.description && ex.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPathway && matchesSearch;
  });

  const handleStartGame = (ex: ExerciseData) => {
    const currentLevel = domainLevels[ex.domain] || ex.difficulty || 1;
    setActiveGameConfig({
      exerciseId: ex.id,
      exerciseName: ex.name,
      pathway: ex.pathway,
      domain: ex.domain,
      difficulty: currentLevel,
    });
  };

  if (loading) {
    return (
      <div className="cd-page-loading">
        <div className="cd-loading-spinner" />
        <span>Loading intervention modules...</span>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="cd-page-header">
        <h1 className="cd-page-heading">Intervention Exercises</h1>
        <p className="cd-page-desc">Interactive activities tailored across ADHD, Dyslexia, and Speech pathways</p>
      </div>

      {/* Pathway Tabs & Filter Bar */}
      <div className="cd-filters-bar">
        <div className="cd-search-box">
          <Search className="h-4 w-4 cd-search-icon" />
          <input
            type="text"
            placeholder="Search exercises, skills, words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cd-search-input"
          />
        </div>

        <div className="cd-filter-chips">
          {[
            { id: "all", label: "All Pathways" },
            { id: "adhd", label: "ADHD Pathway" },
            { id: "dyslexia", label: "Dyslexia Pathway" },
            { id: "speech", label: "Speech & Language" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`cd-filter-chip ${pathwayFilter === tab.id ? "cd-filter-chip--active" : ""}`}
              onClick={() => setPathwayFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="cd-exercises-grid">
        {filtered.map((ex) => {
          const badge = pathwayBadge(ex.pathway);
          const diffLvl = domainLevels[ex.domain] || ex.difficulty || 1;
          const diffText = difficultyLabel(diffLvl);
          const diffStyle = difficultyColor(diffText);

          return (
            <div key={ex.id} className="cd-exercise-card">
              <div className="cd-exercise-card-top">
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: badge.bg,
                      color: badge.color,
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      textTransform: "uppercase",
                    }}
                  >
                    {badge.icon} {badge.label}
                  </span>
                  <span
                    style={{
                      background: diffStyle.bg,
                      color: diffStyle.text,
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    Level {diffLvl} ({diffText})
                  </span>
                </div>
              </div>

              <div className="cd-exercise-card-body">
                <h3 className="cd-exercise-card-title">{ex.name}</h3>
                <p style={{ fontSize: "12.5px", color: "#6B6580", margin: "4px 0 12px", lineHeight: 1.4 }}>
                  {ex.description || `Specialized ${badge.label} activity targeting ${ex.domain.replace("_", " ")}.`}
                </p>
                <span style={{ fontSize: "11.5px", color: "#7C3AED", fontWeight: 600 }}>
                  Skill: {ex.domain.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="cd-exercise-card-bottom">
                <button onClick={() => handleStartGame(ex)} className="cd-exercise-play-btn">
                  <Play className="h-4 w-4" fill="currentColor" /> Play Activity
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#6B6580" }}>
          <p>No activities match the selected filter.</p>
        </div>
      )}

      {/* Active Game Modal */}
      {activeGameConfig && user && (
        <InteractiveExerciseGame
          config={activeGameConfig}
          childId={user.id}
          apiUrl={apiUrl}
          onClose={() => {
            setActiveGameConfig(null);
            fetchExercisesAndStats();
          }}
          onComplete={() => {
            fetchExercisesAndStats();
          }}
        />
      )}
    </>
  );
}
