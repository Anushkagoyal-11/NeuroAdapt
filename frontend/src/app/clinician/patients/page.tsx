"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Brain,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  BookOpen,
  Mic,
  Activity,
  Check,
} from "lucide-react";
import { useClinicianContext } from "../ClinicianContext";

interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  assigned_pathways?: string[];
  baseline_score: number;
  created_at: string | null;
  total_sessions: number;
  avg_accuracy: number;
  total_score: number;
  last_active: string | null;
  status: "On Track" | "Needs Review" | "Active" | "New";
  domain_breakdown?: Record<string, { sessions: number; accuracy: number }>;
  therapy_plan: {
    id: number;
    target_pathways?: string[];
    target_domains: string[];
    min_difficulty: number;
    max_difficulty: number;
    schedule_notes: string;
  } | null;
}

function getPathwayBadge(pathway: string) {
  switch (pathway.toLowerCase()) {
    case "adhd":
      return { label: "ADHD", bg: "#F3E8FF", color: "#7C3AED", icon: <Activity className="h-3 w-3" /> };
    case "dyslexia":
      return { label: "Dyslexia", bg: "#EFF6FF", color: "#2563EB", icon: <BookOpen className="h-3 w-3" /> };
    case "speech":
      return { label: "Speech", bg: "#ECFDF5", color: "#059669", icon: <Mic className="h-3 w-3" /> };
    default:
      return { label: pathway.toUpperCase(), bg: "#F3F4F6", color: "#4B5563", icon: <Activity className="h-3 w-3" /> };
  }
}

export default function PatientsPage() {
  const { user, apiUrl, refreshTrigger, triggerRefresh } = useClinicianContext();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pathwayFilter, setPathwayFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState(8);
  const [newPatientCondition, setNewPatientCondition] = useState("ADHD & Attention Deficit");
  const [newPatientBaseline, setNewPatientBaseline] = useState(70);
  const [selectedPathways, setSelectedPathways] = useState<string[]>(["adhd"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/api/clinician/children/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setPatients(Array.isArray(data) ? data : []);
        } else {
          setPatients([]);
        }
      } catch {
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user, apiUrl, refreshTrigger]);

  const toggleModalPathway = (p: string) => {
    if (selectedPathways.includes(p)) {
      if (selectedPathways.length > 1) {
        setSelectedPathways(selectedPathways.filter((item) => item !== p));
      }
    } else {
      setSelectedPathways([...selectedPathways, p]);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      setSubmitError("Patient name is required.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`${apiUrl}/api/clinician/children`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatientName.trim(),
          age: Number(newPatientAge),
          clinician_id: user?.id,
          condition: newPatientCondition,
          baseline_score: Number(newPatientBaseline),
          assigned_pathways: selectedPathways,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to register child patient.");
      }

      setNewPatientName("");
      setNewPatientAge(8);
      setSelectedPathways(["adhd"]);
      setIsModalOpen(false);
      triggerRefresh();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error creating patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.id).includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();

    const pathways = p.assigned_pathways || ["adhd"];
    const matchesPathway =
      pathwayFilter === "all" || pathways.includes(pathwayFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPathway;
  });

  if (loading) {
    return (
      <div className="cl-loading">
        <div className="cl-loading-spinner" />
        <span>Loading patient records...</span>
      </div>
    );
  }

  return (
    <>
      <div className="cl-section-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="cl-topbar-title" style={{ fontSize: "26px" }}>Patient Longitudinal Roster</h1>
          <p className="cl-section-subtitle">Oversee child profiles, multi-pathway assignments, and progress metrics</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="cl-topbar-action-btn">
          <Plus className="h-4 w-4" /> Register New Patient
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1", minWidth: "260px" }}>
          <Search className="h-4 w-4" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9A94A9" }} />
          <input
            type="text"
            placeholder="Search patient name, condition, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="cl-form-input"
            style={{ paddingLeft: "38px" }}
          />
        </div>

        {/* Pathway Filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Pathways" },
            { id: "adhd", label: "ADHD" },
            { id: "dyslexia", label: "Dyslexia" },
            { id: "speech", label: "Speech" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPathwayFilter(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: pathwayFilter === tab.id ? "#7C3AED" : "#EDE9FE",
                background: pathwayFilter === tab.id ? "#F5F0FF" : "white",
                color: pathwayFilter === tab.id ? "#7C3AED" : "#6B6580",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["all", "on track", "needs review", "active", "new"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid",
                borderColor: statusFilter === status ? "#1E1B4B" : "#EDE9FE",
                background: statusFilter === status ? "#1E1B4B" : "white",
                color: statusFilter === status ? "white" : "#6B6580",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table Container */}
      <div className="cl-table-container custom-scrollbar">
        {filteredPatients.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#9A94A9" }}>
            <Users className="h-12 w-12 text-violet-300" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", color: "#1A1035", fontWeight: 700, margin: "0 0 6px" }}>
              {patients.length === 0 ? "No Patients Registered" : "No matching patients"}
            </h3>
            <p style={{ fontSize: "13.5px", maxWidth: "360px", margin: "0 auto 18px" }}>
              {patients.length === 0
                ? "Register a patient to assign ADHD, Dyslexia, or Speech pathways."
                : "Try adjusting your search query or pathway filters."}
            </p>
            {patients.length === 0 && (
              <button onClick={() => setIsModalOpen(true)} className="cl-topbar-action-btn">
                <Plus className="h-4 w-4" /> Register Patient
              </button>
            )}
          </div>
        ) : (
          <table className="cl-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Assigned Pathways</th>
                <th>Condition</th>
                <th>Sessions</th>
                <th>Avg Accuracy</th>
                <th>Status</th>
                <th>Therapy Bounds</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => {
                const statusClass =
                  p.status === "On Track"
                    ? "cl-status-badge--on-track"
                    : p.status === "Needs Review"
                    ? "cl-status-badge--needs-review"
                    : p.status === "Active"
                    ? "cl-status-badge--active"
                    : "cl-status-badge--new";

                const pathways = p.assigned_pathways || ["adhd"];

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="cl-patient-name-cell">
                        <div className="cl-patient-avatar">{p.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="cl-patient-name">{p.name}</div>
                          <div className="cl-patient-age">Age {p.age} • ID: #{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {pathways.map((pw) => {
                          const badge = getPathwayBadge(pw);
                          return (
                            <span
                              key={pw}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                                background: badge.bg,
                                color: badge.color,
                                padding: "2px 7px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {badge.icon} {badge.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#1A1035", fontSize: "13px" }}>{p.condition}</div>
                      <div style={{ fontSize: "11px", color: "#9A94A9" }}>
                        Baseline: {p.baseline_score}/100
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{p.total_sessions}</td>
                    <td>
                      <strong style={{ color: p.avg_accuracy >= 75 ? "#059669" : p.avg_accuracy >= 60 ? "#7C3AED" : "#DC2626" }}>
                        {p.avg_accuracy}%
                      </strong>
                    </td>
                    <td>
                      <span className={`cl-status-badge ${statusClass}`}>{p.status}</span>
                    </td>
                    <td>
                      {p.therapy_plan ? (
                        <div style={{ fontSize: "12px", color: "#6B6580" }}>
                          <span style={{ fontWeight: 600, color: "#7C3AED" }}>
                            Diff {p.therapy_plan.min_difficulty}–{p.therapy_plan.max_difficulty}
                          </span>
                          <div style={{ fontSize: "11px", color: "#9A94A9" }}>
                            {p.therapy_plan.target_domains.length} domains targeted
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#D97706" }}>Standard Protocol</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <Link href={`/clinician/patients/${p.id}`} className="cl-table-action-btn">
                          Profile <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <a
                          href={`${apiUrl}/api/clinician/reports/${p.id}/pdf?clinician_id=${user?.id || ""}`}
                          download={`NeuroAdapt_Report_${p.name.replace(/\s+/g, "_")}.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cl-table-action-btn"
                          style={{ background: "#F5F3FF", color: "#6D28D9", borderColor: "#DDD6FE", textDecoration: "none" }}
                          title="Download Patient Clinical PDF Report"
                        >
                          <Download className="h-3.5 w-3.5" /> PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Register Patient with Pathway Selection */}
      {isModalOpen && (
        <div className="cl-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="cl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">Register Child Patient</h2>
              <button className="cl-modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitError && (
              <div style={{ padding: "10px 14px", background: "#FEF2F2", color: "#DC2626", borderRadius: "10px", fontSize: "13px", marginBottom: "14px" }}>
                {submitError}
              </div>
            )}

            <form onSubmit={handleRegisterPatient} className="cl-modal-form">
              <div className="cl-form-group">
                <label className="cl-form-label">Full Name of Child *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Aarav Sharma"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="cl-form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="cl-form-group">
                  <label className="cl-form-label">Age (years) *</label>
                  <input
                    type="number"
                    min="3"
                    max="18"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(Number(e.target.value))}
                    className="cl-form-input"
                  />
                </div>
                <div className="cl-form-group">
                  <label className="cl-form-label">Baseline Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newPatientBaseline}
                    onChange={(e) => setNewPatientBaseline(Number(e.target.value))}
                    className="cl-form-input"
                  />
                </div>
              </div>

              {/* Assign Pathways in Modal */}
              <div className="cl-form-group">
                <label className="cl-form-label">Assign Support Pathways (Multi-Pathway Support):</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                  {[
                    { id: "adhd", label: "ADHD Pathway", desc: "Attention, working memory & sequencing" },
                    { id: "dyslexia", label: "Dyslexia Pathway", desc: "Letter recognition, phonics & reading" },
                    { id: "speech", label: "Speech & Language Pathway", desc: "Vocabulary, sentence construction & articulation" },
                  ].map((pw) => {
                    const isChecked = selectedPathways.includes(pw.id);
                    return (
                      <button
                        key={pw.id}
                        type="button"
                        onClick={() => toggleModalPathway(pw.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          border: `2px solid ${isChecked ? "#7C3AED" : "#E5DEFF"}`,
                          background: isChecked ? "#F5F0FF" : "white",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: `2px solid ${isChecked ? "#7C3AED" : "#D1D5DB"}`,
                            background: isChecked ? "#7C3AED" : "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                          }}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1035" }}>{pw.label}</div>
                          <div style={{ fontSize: "11px", color: "#6B6580" }}>{pw.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Condition Notes</label>
                <input
                  type="text"
                  value={newPatientCondition}
                  onChange={(e) => setNewPatientCondition(e.target.value)}
                  placeholder="e.g., ADHD with phonological processing difficulty"
                  className="cl-form-input"
                />
              </div>

              <div className="cl-modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cl-modal-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="cl-modal-btn-submit">
                  {isSubmitting ? "Registering..." : "Register Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
