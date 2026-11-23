"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Brain,
  User,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  BookOpen,
  Mic,
  Activity,
} from "lucide-react";
import Image from "next/image";

type Role = "child" | "clinician" | "admin";
type Step = "select" | "form";
type Mode = "login" | "register";

/* ─────────────────── Logo (horizontal for form) ─────────────────── */
function FormLogo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="NeuroAdapt home">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute inset-0 rounded-xl bg-violet-100/60 blur-sm" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200/60 bg-white shadow-sm">
          <Brain className="h-5.5 w-5.5 text-violet-600" strokeWidth={1.8} />
        </div>
      </div>
      <span className="text-xl font-bold tracking-tight text-[#21164d]">
        Neuro<span className="text-violet-600">Adapt</span>
      </span>
    </Link>
  );
}

/* ─────────────────── Role Card (Portal Selection) ─────────────────── */
function RoleCard({
  title,
  description,
  badge,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full max-w-[360px] overflow-hidden rounded-[28px] border border-violet-200/70 bg-white/75 p-7 text-left backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-violet-300 hover:bg-white/95 hover:shadow-[0_25px_70px_rgba(109,61,245,0.18)] focus:outline-none focus:ring-4 focus:ring-violet-300/30"
    >
      <div className="absolute bottom-0 left-0 right-0 h-[3px] origin-center scale-x-0 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 transition-transform duration-500 group-hover:scale-x-100" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-200/30 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {badge && (
        <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
          {badge}
        </span>
      )}

      <div className="relative">
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-[90px] w-[90px] items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-violet-100/80 blur-xl transition-all duration-500 group-hover:scale-125 group-hover:bg-violet-200/80" />
            <div className="relative flex h-[82px] w-[82px] items-center justify-center rounded-full border border-violet-100 bg-gradient-to-br from-white to-violet-50 shadow-[0_10px_30px_rgba(124,58,237,0.10)] transition-transform duration-500 group-hover:scale-105">
              <div className="text-violet-600">{icon}</div>
            </div>
          </div>
        </div>
        <h2 className="text-center text-[24px] font-bold tracking-[-0.6px] text-[#17102f]">{title}</h2>
        <p className="mx-auto mt-2 max-w-[280px] text-center text-[14.5px] leading-6 text-[#716b82]">{description}</p>
        <div className="mt-6 flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-sm transition-all duration-500 group-hover:border-violet-300 group-hover:bg-violet-600 group-hover:text-white group-hover:shadow-[0_8px_25px_rgba(124,58,237,0.25)]">
            <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ─────────────────── Centered Logo (for select step) ─────────────────── */
function CenteredLogo() {
  return (
    <Link href="/" className="group flex flex-col items-center" aria-label="NeuroAdapt home">
      <div className="relative mb-3 flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-violet-100/80 blur-md transition-all duration-500 group-hover:bg-violet-200" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200/80 bg-white/80 shadow-[0_8px_30px_rgba(124,58,237,0.12)] backdrop-blur">
          <Brain className="h-8 w-8 text-violet-600 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.7} />
        </div>
      </div>
      <div className="text-[25px] font-bold tracking-[-0.8px] text-[#21164d]">
        Neuro<span className="text-violet-600">Adapt</span>
      </div>
    </Link>
  );
}

/* ═════════════════════════════════════════════════════════════════════ */
/*                          MAIN COMPONENT                            */
/* ═════════════════════════════════════════════════════════════════════ */

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("select");
  const [role, setRole] = useState<Role>("child");
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | string>(9);
  const [selectedPathways, setSelectedPathways] = useState<string[]>(["adhd"]);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Automatically pre-warm backend health on load
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${backendUrl}/api/health`, { cache: "no-store" }).catch(() => {});
  }, []);

  const selectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    setEmail("");
    setPassword("");
    setName("");
    setAge(9);
    setSelectedPathways(selectedRole === "child" ? ["adhd", "dyslexia"] : ["adhd"]);
    setErrorMessage("");
    setInfoMessage("");
    setStep("form");
  };

  useEffect(() => {
    const roleParam = searchParams.get("role");
    const demoParam = searchParams.get("demo");

    const selected =
      roleParam === "clinician" || demoParam === "clinician"
        ? "clinician"
        : roleParam === "admin" || demoParam === "admin"
          ? "admin"
          : roleParam === "child" || demoParam === "child"
            ? "child"
            : null;

    if (selected) {
      setRole(selected);
      setStep("form");
      setEmail("");
      setPassword("");
      setName("");
      setAge(9);
      setSelectedPathways(selected === "child" ? ["adhd", "dyslexia"] : ["adhd"]);
      setErrorMessage("");
      setInfoMessage("");
    }
  }, [searchParams]);

  // Demo account quick-fill
  const fillDemoAccount = (demoEmail: string, demoRole: Role, pathwaysDesc?: string) => {
    setRole(demoRole);
    setEmail(demoEmail);
    setPassword("password123");
    setErrorMessage("");
    setInfoMessage(`Filled credentials for ${demoEmail} (${demoRole.toUpperCase()}${pathwaysDesc ? ` • ${pathwaysDesc}` : ""}). Click Log In.`);
  };

  const togglePathway = (p: string) => {
    if (selectedPathways.includes(p)) {
      if (selectedPathways.length > 1) {
        setSelectedPathways(selectedPathways.filter((item) => item !== p));
      }
    } else {
      setSelectedPathways([...selectedPathways, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      if (mode === "register") {
        const res = await fetch(`${backendUrl}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || email.split("@")[0],
            email: email.trim().toLowerCase(),
            password: password,
            role: role,
            age: role === "child" ? Number(age) || 8 : undefined,
            pathways: role === "child" ? selectedPathways : undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: "Registration failed." }));
          throw new Error(errData.detail || "Registration failed. Please check your details.");
        }

        const newUser = await res.json();
        const userObj = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          age: newUser.age,
          assigned_pathways: newUser.assigned_pathways || selectedPathways,
        };

        localStorage.setItem("neuroadapt_user", JSON.stringify(userObj));
        setIsLoading(false);

        if (userObj.role === "child") {
          router.push("/child");
        } else if (userObj.role === "clinician") {
          router.push("/clinician");
        } else {
          router.push("/");
        }
      } else {
        const res = await fetch(`${backendUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password,
            role: role,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ detail: "Login failed." }));
          throw new Error(errData.detail || "Invalid email or password.");
        }

        const data = await res.json();
        const userObj = data.user;

        localStorage.setItem("neuroadapt_user", JSON.stringify(userObj));
        if (data.access_token) {
          localStorage.setItem("neuroadapt_token", data.access_token);
        }
        setIsLoading(false);

        // Redirect to verified role portal
        if (userObj.role === "child") {
          router.push("/child");
        } else if (userObj.role === "clinician") {
          router.push("/clinician");
        } else {
          router.push("/");
        }
      }
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    }
  };

  /* ───── Portal Selection Step ───── */
  if (step === "select") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#fbfaff] font-sans text-[#17102f]">
        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
          <section className="flex w-full max-w-[850px] flex-col items-center">
            <CenteredLogo />

            <div className="mt-8 text-center" style={{ marginBottom: "40px" }}>
              <h1 className="text-[40px] font-bold tracking-[-1.5px] text-[#17102f] sm:text-[52px]">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  NeuroAdapt
                </span>
              </h1>

              <p className="mt-3 text-[16px] text-[#78728a] max-w-[540px] mx-auto">
                Personalized intervention pathways for ADHD, Dyslexia, and Speech & Language development.
              </p>

              <div className="mx-auto mt-4 h-[2px] w-12 rounded-full bg-gradient-to-r from-violet-400 to-purple-500" />
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-6 sm:flex-row" style={{ marginBottom: "40px" }}>
              <RoleCard
                title="Child Portal"
                description="Interactive games supporting attention, reading fluency, and speech skills."
                badge="3 Pathways"
                icon={<User className="h-10 w-10" strokeWidth={1.6} />}
                onClick={() => selectRole("child")}
              />

              <RoleCard
                title="Clinician Portal"
                description="Longitudinal telemetry, pathway titration, therapy plans, and clinical reports."
                badge="Clinical Oversight"
                icon={<Stethoscope className="h-10 w-10" strokeWidth={1.6} />}
                onClick={() => selectRole("clinician")}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-[13.5px] text-[#8e889e]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-violet-600" /> Multi-Pathway Support
              </span>
              <span className="h-1 w-1 rounded-full bg-violet-300" />
              <span className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-violet-600" /> Private & Secure
              </span>
              <span className="h-1 w-1 rounded-full bg-violet-300" />
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-violet-600" /> Adaptive Titration
              </span>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* ───── Login / Register Step (Split Layout) ───── */
  return (
    <main className="auth-split-layout">
      {/* Left: Landscape */}
      <div className="auth-left-panel">
        <Image
          src="/authBg.png"
          alt="NeuroAdapt platform illustration"
          fill
          className="object-cover"
          style={{ objectPosition: "25% center" }}
          priority
        />

        <button
          type="button"
          onClick={() => setStep("select")}
          className="auth-back-button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to portals
        </button>
      </div>

      {/* Right: Form Card */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          {/* Logo */}
          <div className="auth-form-logo">
            <FormLogo />
          </div>

          {/* Heading */}
          <div className="auth-form-heading">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100/80 px-3 py-1 text-xs font-semibold text-violet-700 mb-2">
              {role === "child" ? "Child Portal" : role === "clinician" ? "Clinician Portal" : "Admin Portal"}
            </div>
            <h1>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p>
              {mode === "login" ? (
                <>Sign in to continue <span className="auth-purple-text">personalized developmental care</span>.</>
              ) : (
                <>Register to start <span className="auth-purple-text">your intervention journey</span>.</>
              )}
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-600 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Info Toast */}
          {infoMessage && (
            <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-700 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-violet-600 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Quick Demo Fill Buttons */}
          <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5">
            <div className="text-[11.5px] font-semibold text-violet-900 uppercase tracking-wide mb-2">
              ⚡ Quick Test Credentials (1-Click Fill):
            </div>
            {role === "child" ? (
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("aarav.child@neuroadapt.org", "child", "ADHD + Dyslexia")}
                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-violet-800 hover:bg-violet-100/60 transition"
                >
                  <span className="font-semibold block truncate">Aarav Sharma</span>
                  <span className="text-[10.5px] text-violet-600">ADHD + Dyslexia</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("leo.adhd@neuroadapt.org", "child", "ADHD")}
                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-violet-800 hover:bg-violet-100/60 transition"
                >
                  <span className="font-semibold block truncate">Leo Miller</span>
                  <span className="text-[10.5px] text-violet-600">ADHD Pathway</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("maya.dyslexia@neuroadapt.org", "child", "Dyslexia")}
                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-violet-800 hover:bg-violet-100/60 transition"
                >
                  <span className="font-semibold block truncate">Maya Patel</span>
                  <span className="text-[10.5px] text-violet-600">Dyslexia Pathway</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("sam.speech@neuroadapt.org", "child", "Speech")}
                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-1.5 text-left text-xs font-medium text-violet-800 hover:bg-violet-100/60 transition"
                >
                  <span className="font-semibold block truncate">Samira Khan</span>
                  <span className="text-[10.5px] text-violet-600">Speech Pathway</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount("dr.mehta@neuroadapt.org", "clinician", "Supervising Clinician")}
                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-left text-xs font-medium text-violet-800 hover:bg-violet-100/60 transition"
                >
                  <span className="font-semibold block truncate">Dr. Rajesh Mehta</span>
                  <span className="text-[10.5px] text-violet-600">Clinician Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount("clinician@neuroadapt.org", "clinician", "Pediatric Specialist")}
                  className="rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-left text-xs font-medium text-violet-800 hover:bg-violet-100/60 transition"
                >
                  <span className="font-semibold block truncate">Dr. Sarah Jenkins</span>
                  <span className="text-[10.5px] text-violet-600">Pediatric Care</span>
                </button>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name field for register */}
            {mode === "register" && (
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    type="text"
                    placeholder="Full name"
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Child Age field for child register */}
            {mode === "register" && role === "child" && (
              <div className="auth-input-group">
                <div className="auth-input-wrapper">
                  <Sparkles className="auth-input-icon" />
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    type="number"
                    min="3"
                    max="18"
                    placeholder="Child age (years, e.g. 9)"
                    className="auth-input"
                  />
                </div>
              </div>
            )}

            {/* Pathway Selection for Child Registration */}
            {mode === "register" && role === "child" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#544d65] mb-2">
                  Select Intervention Pathways (Choose one or multiple):
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: "adhd", label: "ADHD Pathway", icon: <Activity className="h-3.5 w-3.5 text-purple-600" />, desc: "Focus, working memory & sequencing" },
                    { id: "dyslexia", label: "Dyslexia Pathway", icon: <BookOpen className="h-3.5 w-3.5 text-blue-600" />, desc: "Letter recognition, phonics & reading" },
                    { id: "speech", label: "Speech & Language Pathway", icon: <Mic className="h-3.5 w-3.5 text-emerald-600" />, desc: "Vocabulary, sentence building & articulation" },
                  ].map((p) => {
                    const active = selectedPathways.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePathway(p.id)}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                          active
                            ? "border-violet-500 bg-violet-50/80 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            active ? "border-violet-600 bg-violet-600 text-white" : "border-gray-300 bg-white"
                          }`}
                        >
                          {active && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                            {p.icon}
                            {p.label}
                          </div>
                          <div className="text-[11px] text-gray-500">{p.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="Email address"
                  className="auth-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="auth-input auth-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye-button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5 text-gray-400" />
                  ) : (
                    <Eye className="h-4.5 w-4.5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember */}
            {mode === "login" && (
              <div className="auth-remember-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span className="auth-checkbox-custom">
                    {rememberMe && (
                      <svg viewBox="0 0 12 12" fill="none" className="auth-check-icon">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  Remember this device
                </label>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-button"
            >
              {isLoading ? (
                <div className="auth-spinner" />
              ) : (
                <>
                  {mode === "login" ? `Sign In to ${role === "child" ? "Child" : "Clinician"} Portal` : "Create Account"}
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="auth-toggle-text">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErrorMessage("");
                setInfoMessage("");
              }}
              className="auth-toggle-link"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fbfaff]">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
