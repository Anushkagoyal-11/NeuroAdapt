"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Target,
  Shield,
  Clock,
  ArrowRight,
  X,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
} from "lucide-react";
import { useClinicianContext } from "../ClinicianContext";

interface TherapyPlanItem {
  id: number;
  child_id: number;
  child_name: string;
  target_pathways?: string[];
  target_domains: string[];
  min_difficulty: number;
  max_difficulty: number;
  schedule_notes: string;
  created_at: string | null;
}

interface PatientOption {
  id: number;
  name: string;
}

const PATHWAY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  adhd: { label: "ADHD", color: "#7C3AED", bg: "#F5F0FF", border: "#DDD6FE" },
  dyslexia: { label: "Dyslexia", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
  speech: { label: "Speech & Lang", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
};

export default function TherapyPlansPage() {
  const { user, apiUrl, refreshTrigger, triggerRefresh } = useClinicianContext();
  const [plans, setPlans] = useState<TherapyPlanItem[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedPathways, setSelectedPathways] = useState<string[]>(["adhd"]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(["attention", "working_memory", "sequencing"]);
  const [minDiff, setMinDiff] = useState(1);
  const [maxDiff, setMaxDiff] = useState(5);
  const [notes, setNotes] = useState("3 sessions per week, 15 minutes each");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchPlans = async () => {
      setLoading(true);
      try {
        const [plansRes, childrenRes] = await Promise.all([
          fetch(`${apiUrl}/api/clinician/therapy-plans/${user.id}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
          fetch(`${apiUrl}/api/clinician/children/${user.id}`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
        ]);

        setPlans(Array.isArray(plansRes) ? plansRes : []);
        const patList = Array.isArray(childrenRes) ? childrenRes.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })) : [];
        setPatients(patList);
        if (patList.length > 0 && !selectedChildId) {
          setSelectedChildId(patList[0].id);
        }
      } catch {
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [user, apiUrl, refreshTrigger]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/clinician/therapy-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: selectedChildId,
          clinician_id: user?.id,
          target_pathways: selectedPathways,
          target_domains: selectedDomains,
          min_difficulty: Number(minDiff),
          max_difficulty: Number(maxDiff),
          schedule_notes: notes,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        triggerRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
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

  const toggleDomain = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      if (selectedDomains.length > 1) {
        setSelectedDomains(selectedDomains.filter((d) => d !== domain));
      }
    } else {
      setSelectedDomains([...selectedDomains, domain]);
    }
  };

  if (loading) {
    return (
      <div className="cl-loading">
        <div className="cl-loading-spinner" />
        <span>Loading therapy plans...</span>
      </div>
    );
  }

  return (
    <>
      <div className="cl-section-header" style={{ marginBottom: "20px" }}>
        <div>
          <h1 className="cl-topbar-title" style={{ fontSize: "26px" }}>Therapy Plans & Protocols</h1>
          <p className="cl-section-subtitle">
            Configure multi-pathway cognitive training domains and therapeutic safety corridor boundaries
          </p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="cl-topbar-action-btn">
          <Plus className="h-4 w-4" /> Create Therapy Plan
        </button>
      </div>

      {/* Safety Principle Banner */}
      <div
        style={{
          background: "#F5F0FF",
          border: "1px solid #E9DFFF",
          borderRadius: "18px",
          padding: "20px 24px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <Shield className="h-7 w-7 text-violet-600" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#1A1035", margin: "0 0 4px" }}>
            Therapeutic Safety Corridor & Multi-Pathway Alignment
          </h4>
          <p style={{ fontSize: "13px", color: "#6B6580", margin: 0, lineHeight: 1.5 }}>
            Each therapy plan assigns one or more intervention pathways (ADHD, Dyslexia, Speech & Language) and caps adaptive exercise difficulty within clinical min/max safety limits.
          </p>
        </div>
      </div>

      {/* Plans Table */}
      <div className="cl-table-container custom-scrollbar">
        {plans.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "#9A94A9" }}>
            <ClipboardList className="h-12 w-12 text-violet-300" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "16px", color: "#1A1035", fontWeight: 700, margin: "0 0 6px" }}>No Therapy Plans</h3>
            <p style={{ fontSize: "13.5px", maxWidth: "360px", margin: "0 auto 18px" }}>
              Configure structured multi-pathway cognitive protocols and difficulty limits for your patients.
            </p>
            <button onClick={() => setIsModalOpen(true)} className="cl-topbar-action-btn">
              <Plus className="h-4 w-4" /> Create Therapy Plan
            </button>
          </div>
        ) : (
          <table className="cl-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Target Pathways</th>
                <th>Target Domains</th>
                <th>Difficulty Corridor</th>
                <th>Protocol Notes</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td>
                    <div className="cl-patient-name-cell">
                      <div className="cl-patient-avatar">{plan.child_name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="cl-patient-name">{plan.child_name}</div>
                        <div className="cl-patient-age">Patient #{plan.child_id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {(plan.target_pathways || ["adhd"]).map((pw) => {
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
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(plan.target_domains || []).map((d) => (
                        <span
                          key={d}
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
                          {d.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: "#1A1035" }}>
                      Level {plan.min_difficulty} – Level {plan.max_difficulty}
                    </span>
                  </td>
                  <td style={{ color: "#6B6580", fontSize: "12.5px", maxWidth: "240px" }}>
                    {plan.schedule_notes || "Standard home retraining schedule"}
                  </td>
                  <td style={{ color: "#9A94A9", fontSize: "12px" }}>
                    {plan.created_at ? new Date(plan.created_at).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <Link href={`/clinician/patients/${plan.child_id}`} className="cl-table-action-btn">
                      Edit in Profile <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create Therapy Plan */}
      {isModalOpen && (
        <div className="cl-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="cl-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h2 className="cl-modal-title">Create Therapy Plan</h2>
              <button className="cl-modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="cl-modal-form">
              <div className="cl-form-group">
                <label className="cl-form-label">Select Patient *</label>
                {patients.length > 0 ? (
                  <select
                    value={selectedChildId || ""}
                    onChange={(e) => setSelectedChildId(Number(e.target.value))}
                    className="cl-form-select"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (ID: #{p.id})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ fontSize: "13px", color: "#DC2626" }}>No patients available. Please register a patient first.</p>
                )}
              </div>

              {/* Target Pathways Multi-Select */}
              <div className="cl-form-group">
                <label className="cl-form-label">Target Support Pathways * (Multi-Select)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "adhd", label: "ADHD", color: "#7C3AED", bg: "#F5F0FF", border: "#DDD6FE" },
                    { id: "dyslexia", label: "Dyslexia", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
                    { id: "speech", label: "Speech & Lang", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
                  ].map((pw) => {
                    const isSelected = selectedPathways.includes(pw.id);
                    return (
                      <button
                        type="button"
                        key={pw.id}
                        onClick={() => togglePathway(pw.id)}
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
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                        }}
                      >
                        {isSelected ? "✓ " : ""}{pw.label}
                      </button>
                    );
                  })}
                </div>
                <span style={{ fontSize: "11.5px", color: "#77738A", marginTop: "4px", display: "block" }}>
                  Support overlapping needs (e.g. ADHD + Dyslexia). The child will receive exercises from all selected pathways.
                </span>
              </div>

              <div className="cl-form-group">
                <label className="cl-form-label">Target Cognitive Domains *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "attention", label: "Attention" },
                    { id: "working_memory", label: "Working Memory" },
                    { id: "sequencing", label: "Sequencing" },
                    { id: "letter_recognition", label: "Letter Recognition" },
                    { id: "phonological_awareness", label: "Phonological Awareness" },
                    { id: "vocabulary", label: "Vocabulary" },
                    { id: "sentence_construction", label: "Sentence Construction" },
                    { id: "speech_sound", label: "Speech Sound" },
                  ].map((d) => {
                    const isSelected = selectedDomains.includes(d.id);
                    return (
                      <button
                        type="button"
                        key={d.id}
                        onClick={() => toggleDomain(d.id)}
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
                          textAlign: "center",
                        }}
                      >
                        {isSelected ? "✓ " : ""}{d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="cl-form-group">
                  <label className="cl-form-label">Min Difficulty Bound</label>
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
                  <label className="cl-form-label">Max Difficulty Bound</label>
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
                <label className="cl-form-label">Schedule & Clinical Instructions</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="cl-form-textarea"
                />
              </div>

              <div className="cl-modal-actions">
                <button type="button" onClick={() => setIsModalOpen(false)} className="cl-modal-btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !selectedChildId} className="cl-modal-btn-submit">
                  {isSubmitting ? "Saving..." : "Save Protocol"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={{ textAlign: "center", padding: "32px 0 12px", fontSize: "12.5px", color: "#B0ABBD" }}>
        NeuroAdapt Therapy Plan Engine • Multi-Pathway Intervention Corridors
      </footer>
    </>
  );
}
