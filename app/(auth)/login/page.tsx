"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./login.css";

const PRESET_ACCOUNTS = {
  admin: {
    name: "Sarah Chen",
    email: "sarah.chen@lexiguard.internal",
    password: "CorporateLegal2026!",
    role: "admin",
    roleLabel: "General Counsel",
  },
  reviewer: {
    name: "David Ross",
    email: "david.ross@lexiguard.internal",
    password: "Reviewer2026!",
    role: "reviewer",
    roleLabel: "Senior Contracts Reviewer",
  },
  viewer: {
    name: "Alex Rivera",
    email: "alex.rivera@lexiguard.internal",
    password: "Viewer2026!",
    role: "viewer",
    roleLabel: "Legal Ops Analyst",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [selectedPersona, setSelectedPersona] = useState<"admin" | "reviewer" | "viewer">("admin");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("LexiGuard Global Corp");
  const [email, setEmail] = useState(PRESET_ACCOUNTS.admin.email);
  const [password, setPassword] = useState(PRESET_ACCOUNTS.admin.password);
  const [role, setRole] = useState<"admin" | "reviewer" | "viewer">("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // If URL has ?mode=signup
  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    }
  }, [searchParams]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const handleSelectPersona = (personaKey: "admin" | "reviewer" | "viewer") => {
    setSelectedPersona(personaKey);
    const p = PRESET_ACCOUNTS[personaKey];
    setEmail(p.email);
    setPassword(p.password);
    setRole(p.role as "admin" | "reviewer" | "viewer");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Authentication failed. Please verify credentials.");
        }

        // Store client cache indicators
        localStorage.setItem("lexiguard_authenticated", "true");
        if (data.profile?.id) {
          localStorage.setItem("lexiguard_user_id", data.profile.id);
        }

        triggerToast(`Welcome back, ${data.profile?.full_name || "Counsel"}`);
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 600);
      } else {
        // Sign Up
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName.trim() || "Legal Counsel",
            organization_name: orgName.trim() || "Enterprise Workspace",
            email,
            password,
            role,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Signup failed. Please try again.");
        }

        localStorage.setItem("lexiguard_authenticated", "true");
        if (data.profile?.id) {
          localStorage.setItem("lexiguard_user_id", data.profile.id);
        }

        triggerToast("Account created successfully! Loading workspace...");
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
      triggerToast(err.message || "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSignIn = () => {
    handleSelectPersona("admin");
    setMode("signin");
    setLoading(true);

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: PRESET_ACCOUNTS.admin.email,
        password: PRESET_ACCOUNTS.admin.password,
        role: "admin",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem("lexiguard_authenticated", "true");
        if (data.profile?.id) {
          localStorage.setItem("lexiguard_user_id", data.profile.id);
        }
        triggerToast("Logged in as Sarah Chen (General Counsel)");
        setTimeout(() => {
          router.push(redirectUrl);
          router.refresh();
        }, 500);
      })
      .catch((err) => {
        setErrorMessage(err.message || "Quick demo sign in failed");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="auth-stage">
      {/* Background layer */}
      <div className="auth-bg" aria-hidden="true">
        <video
          id="bgv"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src="/login%20page%20video.mp4"
        />
      </div>

      <div className="auth-shade" aria-hidden="true" />
      <div className="auth-grain" aria-hidden="true" />

      {/* Floating decorative clause deviation flags */}
      <div className="auth-flag f1">
        <span className="dot" />
        <span>Critical deviation • §14.2 Limitation of Liability uncapped</span>
      </div>

      <div className="auth-flag f2">
        <span className="dot" />
        <span>Warning • §9 Net 90 payment violates Net 30 standard</span>
      </div>

      {/* Main Grid Content */}
      <div className="auth-wrap">
        {/* Left Column: Brand Hero */}
        <div>
          <div className="auth-brand">
            <div className="auth-logo">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <span style={{ fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.01em" }}>LexiGuard</span>
          </div>

          <h1 className="auth-h1">
            Contract risk, <br />
            <span className="auth-grad">engineered away.</span>
          </h1>

          {/* Left panel video replacing text per instructions */}
          <div className="auth-panel-video-wrap">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="auth-panel-video"
              src="/login%20page%20video.mp4"
            >
              <source src="/login%20page%20video.mp4" type="video/mp4" />
              <source src="/videos/login%20page%20video.mp4" type="video/mp4" />
            </video>
            <div className="auth-panel-video-glow" />
          </div>

          <div className="auth-flow">
            <span>01 UPLOAD</span>
            <i>→</i>
            <span>02 PARSE</span>
            <i>→</i>
            <span>03 VECTOR MATCH</span>
            <i>→</i>
            <span>04 REDLINE</span>
            <i>→</i>
            <span>05 EXPORT</span>
          </div>

          <div className="auth-chips">
            <span className="auth-chip c1">
              <b />
              SOC-2 READY
            </span>
            <span className="auth-chip c2">
              <b />
              STRICT NO-TRAINING
            </span>
            <span className="auth-chip c3">
              <b />
              99.4% CLAUSE RECALL
            </span>
          </div>
        </div>

        {/* Right Column: Glassmorphic Auth Card */}
        <div>
          <div className="auth-card">
            {/* Elevated glowing logo badge */}
            <div className="auth-mark">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a99bff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>

            <h2>{mode === "signin" ? "Welcome back" : "Create an account"}</h2>
            <p className="auth-sub">
              {mode === "signin"
                ? "Sign in to access your organization's legal playbook"
                : "Set up your legal workspace and start reviewing contracts"}
            </p>

            {/* Mode Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage("");
                }}
                className={`auth-tab ${mode === "signin" ? "active" : ""}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                }}
                className={`auth-tab ${mode === "signup" ? "active" : ""}`}
              >
                Sign Up
              </button>
            </div>

            {/* Quick Persona Selector for Testing */}
            {mode === "signin" && (
              <div>
                <span className="auth-label" style={{ marginTop: 0 }}>Select Testing Persona</span>
                <div className="auth-role-tabs">
                  <button
                    type="button"
                    onClick={() => handleSelectPersona("admin")}
                    className={`auth-role-btn ${selectedPersona === "admin" ? "active" : ""}`}
                  >
                    👑 Sarah (Admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPersona("reviewer")}
                    className={`auth-role-btn ${selectedPersona === "reviewer" ? "active" : ""}`}
                  >
                    ⚖️ David (Reviewer)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPersona("viewer")}
                    className={`auth-role-btn ${selectedPersona === "viewer" ? "active" : ""}`}
                  >
                    👁️ Alex (Viewer)
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Sign Up Fields */}
              {mode === "signup" && (
                <>
                  <label className="auth-label" htmlFor="fullName">Full Name</label>
                  <div className="auth-field">
                    <svg className="l" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="fullName"
                      className="auth-input"
                      type="text"
                      placeholder="e.g. Sarah Chen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <label className="auth-label" htmlFor="orgName">Organization Name</label>
                  <div className="auth-field">
                    <svg className="l" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <input
                      id="orgName"
                      className="auth-input"
                      type="text"
                      placeholder="e.g. Global Tech Enterprise"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>

                  <label className="auth-label">Assign Initial Role</label>
                  <div className="auth-role-tabs">
                    <button
                      type="button"
                      onClick={() => setRole("admin")}
                      className={`auth-role-btn ${role === "admin" ? "active" : ""}`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("reviewer")}
                      className={`auth-role-btn ${role === "reviewer" ? "active" : ""}`}
                    >
                      Reviewer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("viewer")}
                      className={`auth-role-btn ${role === "viewer" ? "active" : ""}`}
                    >
                      Viewer
                    </button>
                  </div>
                </>
              )}

              {/* Email */}
              <label className="auth-label" htmlFor="email">Work Email</label>
              <div className="auth-field">
                <svg className="l" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errorMessage}
                  required
                />
              </div>

              {/* Password */}
              <div className="auth-row">
                <label className="auth-label" htmlFor="password">Password</label>
                {mode === "signin" && (
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerToast("Demo password reset instructions sent to " + email);
                    }}
                  >
                    Forgot?
                  </a>
                )}
              </div>

              <div className="auth-field">
                <svg className="l" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errorMessage}
                  required
                />
                <button
                  type="button"
                  className="auth-eye"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Error readout */}
              {errorMessage && <div className="auth-err">{errorMessage}</div>}

              {/* Options */}
              {mode === "signin" && (
                <div className="auth-opts">
                  <label>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember this device</span>
                  </label>
                  <span style={{ fontSize: "0.78rem", color: "#8f98b8" }}>Enterprise SSO Ready</span>
                </div>
              )}

              {/* Submit button */}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading && <span className="auth-spin" />}
                <span>
                  {loading
                    ? mode === "signin"
                      ? "Signing In..."
                      : "Creating Account..."
                    : mode === "signin"
                      ? "Sign In"
                      : "Create Account"}
                </span>
                {!loading && (
                  <svg className="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                )}
              </button>

              {/* Or separator */}
              <div className="auth-or">OR</div>

              {/* 1-Click Demo Sign In */}
              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                disabled={loading}
                className="auth-g"
                title="Instant access as General Counsel (Admin)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                <span>Instant Demo Access (Sarah Chen, Admin)</span>
              </button>

              {/* Toggle Mode */}
              <div className="auth-new">
                {mode === "signin" ? (
                  <>
                    <span>Don&apos;t have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErrorMessage("");
                      }}
                    >
                      Create one
                    </button>
                  </>
                ) : (
                  <>
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setErrorMessage("");
                      }}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>

              {/* Security Footnote */}
              <div className="auth-foot">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Encrypted in transit &amp; at rest • Strict tenant isolation • Zero data retention for LLM training
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      <div className={`auth-toast ${showToast ? "show" : ""}`} role="status">
        {toastMessage}
      </div>
    </div>
  );
}
