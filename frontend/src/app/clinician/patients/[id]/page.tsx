"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Brain,
  Target,
  Lightbulb,
  Puzzle,
  Calendar,
  Clock,
  TrendingUp,
  Settings2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  X,
  Edit3,
  Plus,
  ClipboardList,
  Download,
  FileText,
  RotateCcw,
  RefreshCw,
  Sliders,
  Layers,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { useClinicianContext } from "../../ClinicianContext";
import VoiceInterviewSummaryCard, { VoiceInterviewRecord } from "../../components/VoiceInterviewSummaryCard";
import TelegramParentDispatcher from "../../components/TelegramParentDispatcher";

interface ChildDetailResponse {
  child: {
    id: number;
    name: string;
    age: number;
    caregiver_id: number | null;
    clinician_id: number | null;
    condition: string;
    baseline_score: number;
    assigned_pathways?: string[];
    created_at: string | null;
  };
  stats: {
    total_sessions: number;
    avg_accuracy: number;
    total_xp: number;
    avg_response_time_sec: number;
  };
  domain_stats: Record<string, {
    sessions_count: number;
    avg_accuracy: number;
    avg_rt_ms: number;
    max_difficulty: number;
    accuracies_history: number[];
  }>;
  cached_ai_insights?: AIInsights | null;
  therapy_plan: {
    id: number;
    target_pathways?: string[];
    target_domains: string[];
    min_difficulty: number;
    max_difficulty: number;
    schedule_notes: string;
    created_at: string | null;
  } | null;
  session_timeline: Array<{
    session_id: number;
    exercise_name: string;
    domain: string;
    pathway?: string;
    score: number;
    accuracy: number;
    response_time_sec: number;
    errors: number;
    difficulty: number;
    started_at: string | null;
    completed: boolean;
  }>;
}

interface AIInsights {
  child_name: string;
  ai_engine?: string;
  summary: string;
  cognitive_strengths: string[];
  areas_requiring_focus: string[];
  difficulty_recommendation: string;
  fatigue_analysis: string;
  clinical_guidance: string;
  generated_at?: string;
  sessions_at_generation?: number;
}

interface ExerciseOption {
  id: number;
  name: string;
  domain: string;
  pathway?: string;
  difficulty: number;
}

interface AssignmentItem {
  id: number;
  exercise_id: number;
  exercise_name: string;
  domain: string;
  pathway?: string;
  difficulty: number;
  status: "pending" | "completed";
  notes: string;
  assigned_date: string | null;
  completed_at: string | null;
}

const DOMAIN_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  attention: { label: "Attention", color: "#7C3AED", icon: <Target className="h-5 w-5" strokeWidth={1.8} /> },
  working_memory: { label: "Working Memory", color: "#8B5CF6", icon: <Brain className="h-5 w-5" strokeWidth={1.8} /> },
  sequencing: { label: "Sequencing", color: "#6D28D9", icon: <Lightbulb className="h-5 w-5" strokeWidth={1.8} /> },
  letter_recognition: { label: "Letter Recognition", color: "#2563EB", icon: <BookOpen className="h-5 w-5" strokeWidth={1.8} /> },
  vocabulary: { label: "Vocabulary", color: "#059669", icon: <MessageSquare className="h-5 w-5" strokeWidth={1.8} /> },
  sentence_construction: { label: "Sentence Building", color: "#0D9488", icon: <Puzzle className="h-5 w-5" strokeWidth={1.8} /> },
  speech_sound: { label: "Speech Sound", color: "#10B981", icon: <Activity className="h-5 w-5" strokeWidth={1.8} /> },
  memory: { label: "Memory", color: "#8B5CF6", icon: <Brain className="h-5 w-5" strokeWidth={1.8} /> },
  reasoning: { label: "Reasoning", color: "#6D28D9", icon: <Lightbulb className="h-5 w-5" strokeWidth={1.8} /> },
  problem_solving: { label: "Problem Solving", color: "#9333EA", icon: <Puzzle className="h-5 w-5" strokeWidth={1.8} /> },
};

const PATHWAY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  adhd: { label: "ADHD", color: "#7C3AED", bg: "#F5F0FF", border: "#DDD6FE" },
  dyslexia: { label: "Dyslexia", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  speech: { label: "Speech & Lang", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const childId = resolvedParams.id;
  const { user, apiUrl } = useClinicianContext();

  const [data, setData] = useState<ChildDetailResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [voiceInterview, setVoiceInterview] = useState<VoiceInterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  // Edit Pathways Modal
  const [isEditPathwaysOpen, setIsEditPathwaysOpen] = useState(false);
  const [selectedPathways, setSelectedPathways] = useState<string[]>(["adhd"]);
  const [updatingPathways, setUpdatingPathways] = useState(false);

  // Edit Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planPathways, setPlanPathways] = useState<string[]>(["adhd"]);
  const [planDomains, setPlanDomains] = useState<string[]>(["attention", "working_memory", "sequencing"]);
  const [minDiff, setMinDiff] = useState(1);
  const [maxDiff, setMaxDiff] = useState(5);
  const [notes, setNotes] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);

  // Assign Exercise Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedExId, setSelectedExId] = useState<number | null>(null);
  const [assignFilterPathway, setAssignFilterPathway] = useState<string>("all");
  const [assignDiff, setAssignDiff] = useState(1);
  const [assignNotes, setAssignNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchChildData = async () => {
    try {
      const [childRes, exRes, assignRes, ivRes] = await Promise.all([
        fetch(`${apiUrl}/api/clinician/child/${childId}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${apiUrl}/api/exercises`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiUrl}/api/child/${childId}/assignments`).then((r) => (r.ok ? r.json() : [])),
        fetch(`${apiUrl}/api/interviews/latest/${childId}`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (childRes) {
        setData(childRes);
        if (childRes.child?.assigned_pathways) {
          setSelectedPathways(childRes.child.assigned_pathways);
        }
        if (childRes.cached_ai_insights) {
          setAiInsights(childRes.cached_ai_insights);
        }
        if (childRes.therapy_plan) {
          setPlanPathways(childRes.therapy_plan.target_pathways || childRes.child?.assigned_pathways || ["adhd"]);
          setPlanDomains(childRes.therapy_plan.target_domains || ["attention", "working_memory", "sequencing"]);
          setMinDiff(childRes.therapy_plan.min_difficulty || 1);
          setMaxDiff(childRes.therapy_plan.max_difficulty || 5);
          setNotes(childRes.therapy_plan.schedule_notes || "");
        }
      }
      const exList = Array.isArray(exRes) ? exRes : [];
      setExercises(exList);
      if (exList.length > 0 && !selectedExId) {
        setSelectedExId(exList[0].id);
      }
      setAssignments(Array.isArray(assignRes) ? assignRes : []);
      if (ivRes) {
        setVoiceInterview(ivRes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildData();
  }, [childId, apiUrl]);

  const handleGenerateAI = async (force: boolean = false) => {
    setAiLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/clinician/ai-insights/${childId}?force_refresh=${force ? "true" : "false"}`, {
        method: "POST",
      });
      if (res.ok) {
        const insights = await res.json();
        setAiInsights(insights);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const togglePathway = (pw: string) => {
    if (selectedPathways.includes(pw)) {
      if (selectedPathways.length > 1) {
        setSelectedPathways(selectedPathways.filter((p) => p !== pw));
      }
    } else {
      setSelectedPathways([...selectedPathways, pw]);
    }
  };

  const handleSavePathways = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPathways.length === 0) return;
    setUpdatingPathways(true);
    try {
      const res = await fetch(`${apiUrl}/api/child/${childId}/pathways`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_pathways: selectedPathways }),
      });
      if (res.ok) {
        setIsEditPathwaysOpen(false);
        await fetchChildData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingPathways(false);
    }
  };

  const togglePlanPathway = (pw: string) => {
    if (planPathways.includes(pw)) {
      if (planPathways.length > 1) {
        setPlanPathways(planPathways.filter((p) => p !== pw));
      }
    } else {
      setPlanPathways([...planPathways, pw]);
    }
  };

  const toggleDomain = (domain: string) => {
    if (planDomains.includes(domain)) {
      if (planDomains.length > 1) {
        setPlanDomains(planDomains.filter((d) => d !== domain));
      }
    } else {
      setPlanDomains([...planDomains, domain]);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPlan(true);
    try {
      const res = await fetch(`${apiUrl}/api/clinician/therapy-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: Number(childId),
          clinician_id: user?.id,
          target_pathways: planPathways,
          target_domains: planDomains,
          min_difficulty: Number(minDiff),
          max_difficulty: Number(maxDiff),
          schedule_notes: notes,
        }),
      });

      if (res.ok) {
        setIsPlanModalOpen(false);
        await fetchChildData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExId) return;

    setAssigning(true);
    try {
      const res = await fetch(`${apiUrl}/api/clinician/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: Number(childId),
          clinician_id: user?.id,
          exercise_id: selectedExId,
          difficulty: Number(assignDiff),
          notes: assignNotes || undefined,
        }),
      });

      if (res.ok) {
        setIsAssignModalOpen(false);
        setAssignNotes("");
        await fetchChildData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="cl-loading">
        <div className="cl-loading-spinner" />
        <span>Loading longitudinal profile...</span>
      </div>
    );
  }

  const { child, stats, domain_stats, therapy_plan, session_timeline } = data;
  const activePathways = child.assigned_pathways || ["adhd"];

  const filteredExercises = exercises.filter((ex) => {
    if (assignFilterPathway === "all") return true;
    return ex.pathway === assignFilterPathway;
  });

  return (
    <>
      {/* Back to Patients navigation */}
      <div style={{ marginBottom: "18px" }}>
        <Link
          href="/clinician/patients"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#7C3AED",
            fontSize: "13.5px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patient Roster
        </Link>
      </div>

      {/* Patient Header Card */}
      <div
        style={{
          background: "white",
          border: "1px solid #F0ECF9",
          borderRadius: "22px",
          padding: "28px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              color: "white",
              fontSize: "24px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 20px rgba(124, 58, 237, 0.25)",
            }}
          >
            {child.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1A1035", margin: 0 }}>{child.name}</h1>
              <span className="cl-status-badge cl-status-badge--on-track">Patient #{child.id}</span>
            </div>
            <div style={{ fontSize: "13.5px", color: "#6B6580", display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
              <span>Age: <strong>{child.age} yrs</strong></span>
              <span>Condition: <strong>{child.condition}</strong></span>
              <span>Baseline: <strong>{child.baseline_score}/100</strong></span>
            </div>

            {/* Assigned Pathways Badges */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: "#6B6580", fontWeight: 600 }}>Active Pathways:</span>
              {activePathways.map((pw) => {
                const conf = PATHWAY_CONFIG[pw] || PATHWAY_CONFIG.adhd;
                return (
                  <span
                    key={pw}
                    style={{
                      background: conf.bg,
                      color: conf.color,
                      border: `1px solid ${conf.border}`,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {conf.label}
                  </span>
                );
              })}
              <button
                onClick={() => {
                  setSelectedPathways(activePathways);
                  setIsEditPathwaysOpen(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7C3AED",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  padding: "2px 6px",
                }}
              >
                <Edit3 className="h-3 w-3" /> Edit Pathways
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setIsAssignModalOpen(true)} className="cl-topbar-action-btn">
            <Plus className="h-4 w-4" /> Assign Exercise
          </button>
          <button
            onClick={() => {
              setSelectedPathways(activePathways);
              setIsEditPathwaysOpen(true);
            }}
            className="cl-table-action-btn"
            style={{ padding: "8px 16px", background: "#FAF8FF", borderColor: "#DDD6FE", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Sliders className="h-4 w-4" /> Manage Pathways
          </button>
          <button
            onClick={() => handleGenerateAI(true)}
            disabled={aiLoading}
            className="cl-table-action-btn"
            style={{ padding: "8px 16px", background: "#FAF8FF", borderColor: "#DDD6FE", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RotateCcw className={`h-4 w-4 ${aiLoading ? "animate-spin" : ""}`} />
            {aiLoading ? "Regenerating..." : (aiInsights ? "🔄 Regenerate AI Analysis" : "Generate AI Insights")}
          </button>
          <button onClick={() => setIsPlanModalOpen(true)} className="cl-table-action-btn" style={{ padding: "8px 16px" }}>
            <Edit3 className="h-4 w-4" /> Therapy Plan
          </button>
          <a
            href={`${apiUrl}/api/clinician/reports/${childId}/pdf?clinician_id=${user?.id || ""}`}
            download={`NeuroAdapt_Clinical_Report_${child.name.replace(/\s+/g, "_")}.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="cl-table-action-btn"
            style={{
              padding: "8px 16px",
              background: "#F5F3FF",
              borderColor: "#7C3AED",
              color: "#6D28D9",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="Download official clinical telemetry and progress PDF report"
          >
            <Download className="h-4 w-4" /> Download PDF Report
          </a>
        </div>
      </div>

      {/* Patient Stats Row */}
      <div className="cl-stats-grid">
        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#7C3AED12", color: "#7C3AED" }}>
            <Activity className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{stats.total_sessions}</span>
            <span className="cl-stat-lbl">Sessions Completed</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#05966912", color: "#059669" }}>
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{stats.avg_accuracy}%</span>
            <span className="cl-stat-lbl">Overall Accuracy</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#8B5CF612", color: "#8B5CF6" }}>
            <Clock className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{stats.avg_response_time_sec}s</span>
            <span className="cl-stat-lbl">Mean Reaction Latency</span>
          </div>
        </div>

        <div className="cl-stat-card">
          <div className="cl-stat-icon" style={{ background: "#9333EA12", color: "#9333EA" }}>
            <Zap className="h-6 w-6" />
          </div>
          <div className="cl-stat-info">
            <span className="cl-stat-val">{stats.total_xp}</span>
            <span className="cl-stat-lbl">Total XP Earned</span>
          </div>
        </div>
      </div>

      {/* AI Clinician Insights Card */}
      {aiInsights && (
        <div className="cl-ai-insights-box">
          <div className="cl-ai-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div className="cl-ai-title-group" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span className="cl-ai-badge">
                <Sparkles className="h-3.5 w-3.5" /> AI Clinician Insights Engine
              </span>
              <span style={{ fontSize: "12px", color: "#9A94A9" }}>
                {aiInsights.ai_engine || "Mistral AI Assisted"}
              </span>
              {aiInsights.generated_at && (
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
                  ⚡ Instant Cache ({new Date(aiInsights.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
            <button
              onClick={() => handleGenerateAI(true)}
              disabled={aiLoading}
              className="cl-table-action-btn"
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "10px",
                background: "#FFFFFF",
                borderColor: "#C4B5FD",
                color: "#6D28D9",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              {aiLoading ? "Regenerating..." : "🔄 Regenerate AI Analysis"}
            </button>
          </div>

          <p className="cl-ai-summary-text">{aiInsights.summary}</p>

          <div className="cl-ai-grid">
            <div className="cl-ai-card">
              <h4 className="cl-ai-card-title">Cognitive Strengths</h4>
              <ul className="cl-ai-card-list">
                {aiInsights.cognitive_strengths.map((s, idx) => (
                  <li key={idx} className="cl-ai-card-item">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cl-ai-card">
              <h4 className="cl-ai-card-title" style={{ color: "#D97706" }}>Areas Requiring Focus</h4>
              <ul className="cl-ai-card-list">
                {aiInsights.areas_requiring_focus.map((f, idx) => (
                  <li key={idx} className="cl-ai-card-item">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="cl-ai-card">
              <h4 className="cl-ai-card-title" style={{ color: "#6D28D9" }}>Adaptive Recommendation</h4>
              <p style={{ fontSize: "13px", color: "#1A1035", fontWeight: 600, margin: "0 0 6px" }}>
                {aiInsights.difficulty_recommendation}
              </p>
              <p style={{ fontSize: "11.5px", color: "#77738A", margin: 0 }}>
                {aiInsights.fatigue_analysis}
              </p>
            </div>
          </div>

          <p className="cl-ai-disclaimer">
            {aiInsights.clinical_guidance} • <em>NeuroAdapt AI operates as clinician support and progress monitoring only and does not formulate autonomous diagnoses.</em>
          </p>
        </div>
      )}

      {/* Prescribed Assignments Section */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Prescribed Exercise Assignments</h2>
            <p className="cl-section-subtitle">Exercises assigned to this child across support pathways</p>
          </div>
          <button onClick={() => setIsAssignModalOpen(true)} className="cl-table-action-btn">
            <Plus className="h-4 w-4" /> New Assignment
          </button>
        </div>

        <div className="cl-table-container custom-scrollbar">
          {assignments.length === 0 ? (
            <div style={{ padding: "36px 24px", textAlign: "center", color: "#9A94A9" }}>
              <ClipboardList className="h-8 w-8 text-violet-300" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#1A1035", margin: "0 0 4px" }}>
                No specific exercises assigned yet
              </p>
              <p style={{ fontSize: "12.5px" }}>
                Click &quot;New Assignment&quot; above to prescribe an exercise directly to this child&apos;s home dashboard.
              </p>
            </div>
          ) : (
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Pathway</th>
                  <th>Domain</th>
                  <th>Assigned Difficulty</th>
                  <th>Status</th>
                  <th>Clinical Notes</th>
                  <th>Assigned Date</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => {
                  const domConf = DOMAIN_CONFIG[a.domain] || DOMAIN_CONFIG.attention;
                  const pwConf = PATHWAY_CONFIG[a.pathway || "adhd"] || PATHWAY_CONFIG.adhd;
                  const isCompleted = a.status === "completed";
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600, color: "#1A1035" }}>{a.exercise_name}</td>
                      <td>
                        <span
                          style={{
                            background: pwConf.bg,
                            color: pwConf.color,
                            border: `1px solid ${pwConf.border}`,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {pwConf.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: `${domConf.color}12`,
                            color: domConf.color,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {domConf.label}
                        </span>
                      </td>
                      <td>Level {a.difficulty}</td>
                      <td>
                        <span
                          className={`cl-status-badge ${
                            isCompleted ? "cl-status-badge--on-track" : "cl-status-badge--active"
                          }`}
                        >
                          {isCompleted ? "✓ Completed" : "⏳ Pending"}
                        </span>
                      </td>
                      <td style={{ color: "#6B6580", fontSize: "12px", maxWidth: "240px" }}>
                        {a.notes || "Standard protocol"}
                      </td>
                      <td style={{ color: "#77738A", fontSize: "12px" }}>
                        {a.assigned_date
                          ? new Date(a.assigned_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td style={{ color: "#77738A", fontSize: "12px" }}>
                        {a.completed_at
                          ? new Date(a.completed_at).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Therapy Plan & Therapeutic Boundaries Card */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Therapy Plan & Therapeutic Boundaries</h2>
            <p className="cl-section-subtitle">Clinician-defined constraints restricting AI difficulty adjustments</p>
          </div>
          <button onClick={() => setIsPlanModalOpen(true)} className="cl-table-action-btn">
            <Settings2 className="h-4 w-4" /> Edit Boundaries
          </button>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #F0ECF9",
            borderRadius: "20px",
            padding: "24px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          <div>
            <span style={{ fontSize: "12px", color: "#9A94A9", textTransform: "uppercase", fontWeight: 700 }}>
              Target Pathways & Domains
            </span>
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "8px", marginBottom: "8px" }}>
              {(therapy_plan?.target_pathways || activePathways).map((pw) => {
                const conf = PATHWAY_CONFIG[pw] || PATHWAY_CONFIG.adhd;
                return (
                  <span
                    key={pw}
                    style={{
                      background: conf.bg,
                      color: conf.color,
                      border: `1px solid ${conf.border}`,
                      padding: "2px 7px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {conf.label}
                  </span>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {(therapy_plan?.target_domains || ["attention", "working_memory"]).map((dom) => (
                <span
                  key={dom}
                  style={{
                    background: "#F5F0FF",
                    color: "#7C3AED",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {dom.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "12px", color: "#9A94A9", textTransform: "uppercase", fontWeight: 700 }}>
              Difficulty Bound Range
            </span>
            <div style={{ marginTop: "8px", fontSize: "18px", fontWeight: 800, color: "#1A1035" }}>
              Level {therapy_plan?.min_difficulty || 1} — Level {therapy_plan?.max_difficulty || 5}
            </div>
            <span style={{ fontSize: "11.5px", color: "#77738A" }}>
              AI difficulty adaptation will stay within this safety corridor.
            </span>
          </div>

          <div>
            <span style={{ fontSize: "12px", color: "#9A94A9", textTransform: "uppercase", fontWeight: 700 }}>
              Clinical Schedule Notes
            </span>
            <div style={{ marginTop: "8px", fontSize: "13.5px", color: "#4C4658", fontWeight: 500 }}>
              {therapy_plan?.schedule_notes || "3 home training sessions per week, 15 minutes each."}
            </div>
          </div>
        </div>
      </div>

      {/* AI Voice Cognitive Interview Summary */}
      {voiceInterview && (
        <div className="cl-section" style={{ marginBottom: "32px" }}>
          <VoiceInterviewSummaryCard interview={voiceInterview} />
        </div>
      )}

      {/* Domain Breakdown Grid */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Cognitive Domain Performance</h2>
            <p className="cl-section-subtitle">Longitudinal accuracy and reaction latency per module</p>
          </div>
        </div>

        <div className="cl-domain-matrix">
          {Object.entries(DOMAIN_CONFIG).slice(0, 4).map(([key, config]) => {
            const ds = domain_stats[key] || { sessions_count: 0, avg_accuracy: 0, avg_rt_ms: 0, max_difficulty: 1 };
            return (
              <div key={key} className="cl-domain-card">
                <div className="cl-domain-card-head">
                  <div className="cl-domain-icon" style={{ background: `${config.color}15`, color: config.color }}>
                    {config.icon}
                  </div>
                  <h3 className="cl-domain-name">{config.label}</h3>
                </div>
                <div className="cl-domain-score">{ds.avg_accuracy}%</div>
                <div className="cl-domain-bar">
                  <div className="cl-domain-fill" style={{ width: `${ds.avg_accuracy}%`, background: config.color }} />
                </div>
                <div className="cl-domain-meta-row">
                  <span>Sessions: <strong>{ds.sessions_count}</strong></span>
                  <span>Max Diff: <strong>Lvl {ds.max_difficulty}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Parent Telegram Dispatcher */}
      <TelegramParentDispatcher
        childId={child.id}
        childName={child.name}
        clinicianId={user?.id}
        clinicianName={user?.name || "Dr. Rajesh Mehta"}
        apiUrl={apiUrl}
      />

      {/* Session Timeline Table */}
      <div className="cl-section">
        <div className="cl-section-header">
          <div>
            <h2 className="cl-section-title">Longitudinal Session Log</h2>
            <p className="cl-section-subtitle">Real telemetry received directly from child&apos;s completed exercises</p>
          </div>
        </div>

        <div className="cl-table-container custom-scrollbar">
          {session_timeline.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#9A94A9" }}>
              <Activity className="h-8 w-8 text-violet-300" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: "14px" }}>No sessions logged yet for this child.</p>
            </div>
          ) : (
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Exercise</th>
                  <th>Pathway</th>
                  <th>Domain</th>
                  <th>Difficulty</th>
                  <th>Accuracy</th>
                  <th>Errors</th>
                  <th>Latency</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {session_timeline.map((s, idx) => {
                  const domConf = DOMAIN_CONFIG[s.domain] || DOMAIN_CONFIG.attention;
                  const pwConf = PATHWAY_CONFIG[s.pathway || "adhd"] || PATHWAY_CONFIG.adhd;
                  return (
                    <tr key={idx}>
                      <td style={{ color: "#4C4658", fontWeight: 500 }}>
                        {s.started_at
                          ? new Date(s.started_at).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: "#1A1035" }}>{s.exercise_name}</td>
                      <td>
                        <span
                          style={{
                            background: pwConf.bg,
                            color: pwConf.color,
                            border: `1px solid ${pwConf.border}`,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          {pwConf.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: `${domConf.color}15`,
                            color: domConf.color,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {domConf.label}
                        </span>
                      </td>
                      <td>Level {s.difficulty}</td>
                      <td>
                        <strong style={{ color: s.accuracy >= 75 ? "#059669" : s.accuracy >= 60 ? "#7C3AED" : "#DC2626" }}>
                          {s.accuracy}%
                        </strong>
                      </td>
                      <td>{s.errors}</td>
                      <td style={{ color: "#77738A" }}>{s.response_time_sec}s</td>
                      <td style={{ fontWeight: 700 }}>{s.score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Edit Assigned Pathways */}
      {isEditPathwaysOpen && (
        <div className="cl-modal-backdrop" onClick={() => setIsEditPathwaysOpen(false)}>
          <div className="cl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">Edit Support Pathways for {child.name}</h2>
              <button className="cl-modal-close-btn" onClick={() => setIsEditPathwaysOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePathways} className="cl-modal-form">
              <p style={{ fontSize: "13px", color: "#6B6580", margin: "0 0 16px" }}>
                Select one or multiple intervention pathways. For children with overlapping developmental profiles (e.g., ADHD + Dyslexia), activities from all checked pathways will be personalized in their dashboard.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {[
                  {
                    id: "adhd",
                    title: "ADHD Pathway",
                    desc: "Focus matrix, working memory flips, step sequencing & cognitive flexibility rules.",
                    color: "#7C3AED",
                    bg: "#F5F0FF",
                  },
                  {
                    id: "dyslexia",
                    title: "Dyslexia Pathway",
                    desc: "Letter recognition, phonological rhyming, sight word sprints & story comprehension.",
                    color: "#2563EB",
                    bg: "#EFF6FF",
                  },
                  {
                    id: "speech",
                    title: "Speech & Language Pathway",
                    desc: "Picture vocabulary, sentence builder, auditory listening & sound articulation practice.",
                    color: "#059669",
                    bg: "#ECFDF5",
                  },
                ].map((pw) => {
                  const isChecked = selectedPathways.includes(pw.id);
                  return (
                    <label
                      key={pw.id}
                      onClick={() => togglePathway(pw.id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "14px",
                        borderRadius: "12px",
                        border: `1.5px solid ${isChecked ? pw.color : "#E8E2F5"}`,
                        background: isChecked ? pw.bg : "white",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: "3px", accentColor: pw.color }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: "#1A1035", fontSize: "14px" }}>{pw.title}</div>
                        <div style={{ fontSize: "12.5px", color: "#6B6580", marginTop: "2px" }}>{pw.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="cl-modal-actions">
                <button type="button" onClick={() => setIsEditPathwaysOpen(false)} className="cl-modal-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={updatingPathways || selectedPathways.length === 0} className="cl-modal-btn-submit">
                  {updatingPathways ? "Saving Pathways..." : "Save Pathways"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Exercise */}
      {isAssignModalOpen && (
        <div className="cl-modal-backdrop" onClick={() => setIsAssignModalOpen(false)}>
          <div className="cl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">Prescribe Exercise Assignment</h2>
              <button className="cl-modal-close-btn" onClick={() => setIsAssignModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="cl-modal-form">
              {/* Pathway Filter Tabs */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "14px", borderBottom: "1px solid #F0ECF9", paddingBottom: "10px" }}>
                {[
                  { id: "all", label: "All Pathways" },
                  { id: "adhd", label: "ADHD" },
                  { id: "dyslexia", label: "Dyslexia" },
                  { id: "speech", label: "Speech & Lang" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setAssignFilterPathway(tab.id);
                      const matching = exercises.filter((ex) => tab.id === "all" || ex.pathway === tab.id);
                      if (matching.length > 0) setSelectedExId(matching[0].id);
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: assignFilterPathway === tab.id ? "#7C3AED" : "#F5F0FF",
                      color: assignFilterPathway === tab.id ? "white" : "#6B6580",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Select Cognitive Exercise *</label>
                <select
                  value={selectedExId || ""}
                  onChange={(e) => setSelectedExId(Number(e.target.value))}
                  className="cl-form-select"
                >
                  {filteredExercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      [{ex.pathway?.toUpperCase() || "CORE"}] {ex.name} — {ex.domain.replace("_", " ").toUpperCase()} (Base Lvl {ex.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Starting Difficulty Level (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={assignDiff}
                  onChange={(e) => setAssignDiff(Number(e.target.value))}
                  className="cl-form-input"
                />
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Clinician Guidance / Home Instructions</label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Focus on accuracy before speed. Complete before evening meal."
                  className="cl-form-textarea"
                />
              </div>

              <div className="cl-modal-actions">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="cl-modal-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={assigning || !selectedExId} className="cl-modal-btn-submit">
                  {assigning ? "Assigning..." : "Assign to Child"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Therapy Plan */}
      {isPlanModalOpen && (
        <div className="cl-modal-backdrop" onClick={() => setIsPlanModalOpen(false)}>
          <div className="cl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">Configure Therapy Plan & Safety Boundaries</h2>
              <button className="cl-modal-close-btn" onClick={() => setIsPlanModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="cl-modal-form">
              {/* Target Pathways */}
              <div className="cl-form-group">
                <label className="cl-form-label">Target Support Pathways *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "adhd", label: "ADHD", color: "#7C3AED", bg: "#F5F0FF" },
                    { id: "dyslexia", label: "Dyslexia", color: "#2563EB", bg: "#EFF6FF" },
                    { id: "speech", label: "Speech & Lang", color: "#059669", bg: "#ECFDF5" },
                  ].map((pw) => {
                    const isSelected = planPathways.includes(pw.id);
                    return (
                      <button
                        type="button"
                        key={pw.id}
                        onClick={() => togglePlanPathway(pw.id)}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          border: "1.5px solid",
                          borderColor: isSelected ? pw.color : "#E8E2F5",
                          background: isSelected ? pw.bg : "white",
                          color: isSelected ? pw.color : "#6B6580",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          cursor: "pointer",
                          textAlign: "center",
                        }}
                      >
                        {isSelected ? "✓ " : ""}{pw.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Target Cognitive Domains *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    "attention",
                    "working_memory",
                    "sequencing",
                    "letter_recognition",
                    "phonological_awareness",
                    "vocabulary",
                    "sentence_construction",
                    "speech_sound",
                  ].map((d) => {
                    const isSelected = planDomains.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleDomain(d)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: "1.5px solid",
                          borderColor: isSelected ? "#7C3AED" : "#E8E2F5",
                          background: isSelected ? "#F5F0FF" : "white",
                          color: isSelected ? "#7C3AED" : "#6B6580",
                          fontWeight: 600,
                          fontSize: "12px",
                          cursor: "pointer",
                          textTransform: "capitalize",
                          textAlign: "center",
                        }}
                      >
                        {isSelected ? "✓ " : ""}{d.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="cl-form-group">
                  <label className="cl-form-label">Min Difficulty Limit (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={minDiff}
                    onChange={(e) => setMinDiff(Number(e.target.value))}
                    className="cl-form-input"
                  />
                </div>
                <div className="cl-form-group">
                  <label className="cl-form-label">Max Difficulty Limit (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxDiff}
                    onChange={(e) => setMaxDiff(Number(e.target.value))}
                    className="cl-form-input"
                  />
                </div>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Clinical Protocol & Schedule Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., 3 home sessions weekly. Emphasize visual attention tasks before dinner."
                  className="cl-form-textarea"
                />
              </div>

              <div className="cl-modal-actions">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="cl-modal-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={savingPlan} className="cl-modal-btn-submit">
                  {savingPlan ? "Saving Plan..." : "Save Therapy Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "32px 0 12px", fontSize: "12.5px", color: "#B0ABBD" }}>
        NeuroAdapt Clinician Portal • Patient #{child.id} Longitudinal Record
      </footer>
    </>
  );
}
