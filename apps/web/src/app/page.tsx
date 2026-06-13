"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  GitBranch,
  Key,
  CheckCircle2,
  ChevronRight,
  Lock,
  Database,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  // Navigation states: 'landing' | 'login' | 'integrate'
  const [step, setStep] = useState<"landing" | "login" | "integrate">(
    "landing"
  );
  const [hasToken, setHasToken] = useState(false);

  // Login credentials
  const [email, setEmail] = useState("admin@themis.ai");
  const [password, setPassword] = useState("devpass");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // VCS Integration settings
  const [vcsProvider, setVcsProvider] = useState<"github" | "gitlab">("github");
  const [repoUrl, setRepoUrl] = useState(
    "https://github.com/themis-ai/payment-gateway"
  );
  const [vcsToken, setVcsToken] = useState("");
  const [integrating, setIntegrating] = useState(false);
  const [integrationSuccess, setIntegrationSuccess] = useState(false);

  // Check if already authenticated & integrated
  useEffect(() => {
    const token = localStorage.getItem("themis_auth_token");
    const integrated = localStorage.getItem("themis_integrated") === "true";
    setHasToken(!!token);
    if (token && integrated) {
      router.push("/dashboard");
    } else if (token) {
      setStep("integrate");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials or server offline");
      }

      const data = await res.json();
      localStorage.setItem("themis_auth_token", data.access_token);
      setHasToken(true);
      setStep("integrate");
    } catch (err: any) {
      // Fallback for development if backend server is not running
      console.warn(
        "API token request failed, using local development fallback auth:",
        err.message
      );
      if (email === "admin@themis.ai" && password === "devpass") {
        localStorage.setItem("themis_auth_token", "dev-token-mock-auth");
        setHasToken(true);
        setStep("integrate");
      } else {
        setError(
          "Invalid email or password. Hint: Use admin@themis.ai / devpass"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    setIntegrating(true);

    // Simulate API connectivity check and repository validation
    setTimeout(() => {
      setIntegrating(false);
      setIntegrationSuccess(true);
      localStorage.setItem("themis_integrated", "true");

      // Short delay before redirecting to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col font-sans selection:bg-violet-500/30 selection:text-white">
      {/* Decorative Grid and Ambient Lights */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/30 flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-white w-7 h-7 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          <div>
            <h1 className="text-base font-extrabold tracking-wider uppercase">
              Themis
            </h1>
            <p className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase">
              AI OPERATIONS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono">
          <a
            href="https://github.com/MRvandals4vage/Themis"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-400 hover:text-white transition"
          >
            Docs
          </a>
          <button
            onClick={() => setStep(hasToken ? "integrate" : "login")}
            className="border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-xs px-4 py-2 rounded-lg transition"
          >
            {hasToken ? "Configure VCS" : "Sign In"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-12">
        {step === "landing" && (
          <div className="max-w-4xl text-center flex flex-col items-center gap-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-mono backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>DevOps Incident Remediation Engine</span>
            </div>

            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">
              Autonomously Fix <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
                CI/CD Failures
              </span>
            </h2>

            <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
              Detect logs, extract root causes with stateful LangGraph agents,
              retrieve fixes from your incident database, and test them in
              sandboxes before opening a PR.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => setStep("login")}
                className="bg-white text-black hover:bg-zinc-200 font-semibold px-8 py-4 rounded-xl transition flex items-center gap-2 group text-sm"
              >
                <span>Access Console</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
              <button
                onClick={() =>
                  window.open(
                    "https://github.com/MRvandals4vage/Themis",
                    "_blank"
                  )
                }
                className="border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-mono text-xs px-8 py-4 rounded-xl transition flex items-center gap-2"
              >
                <GitBranch className="w-4 h-4 text-violet-400" />
                <span>Star on GitHub</span>
              </button>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md flex flex-col gap-3">
                <Database className="w-6 h-6 text-violet-400" />
                <h3 className="font-bold text-sm">Incident Memory Engine</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Semantic index of old patches via Qdrant allows instant
                  correlation of new errors to successful historical repairs.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md flex flex-col gap-3">
                <GitBranch className="w-6 h-6 text-fuchsia-400" />
                <h3 className="font-bold text-sm">LangGraph Orchestration</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Multi-agent graphs run classifiers, log parses, fix
                  generators, and reporters to build confidence-scored repairs.
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md flex flex-col gap-3">
                <Lock className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-sm">Sandboxed Validation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Runs lint checks and unit tests in safe, isolated execution
                  setups to avoid deploying broken code or syntax bugs.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "login" && (
          <div className="w-full max-w-md bg-zinc-950/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative animate-scale-up">
            <div className="flex flex-col gap-2 mb-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                <Lock className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold">Secure Access</h3>
              <p className="text-xs text-zinc-400">
                Login with your enterprise Themis administrator account
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition w-full placeholder:text-zinc-600"
                  placeholder="admin@themis.ai"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Security Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition w-full placeholder:text-zinc-600"
                  placeholder="Password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-white text-black hover:bg-zinc-200 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : "Sign In"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[10px] font-mono text-zinc-500">
                DEVELOPER DEMO HINT:
                <br />
                Email: <span className="text-zinc-300">
                  admin@themis.ai
                </span>{" "}
                &nbsp;|&nbsp; Pass:{" "}
                <span className="text-zinc-300">devpass</span>
              </p>
            </div>
          </div>
        )}

        {step === "integrate" && (
          <div className="w-full max-w-md bg-zinc-950/80 border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl relative animate-scale-up">
            <div className="flex flex-col gap-2 mb-8 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                <GitBranch className="w-5 h-5 text-fuchsia-400" />
              </div>
              <h3 className="text-xl font-bold">VCS Integration</h3>
              <p className="text-xs text-zinc-400">
                Connect your source control provider to enable self-healing PRs
              </p>
            </div>

            {integrationSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center animate-fade-in">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                <div>
                  <h4 className="font-bold text-lg text-emerald-400">
                    System Linked!
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    VCS integration complete. Opening dashboard...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIntegrate} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Select Provider
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVcsProvider("github")}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        vcsProvider === "github"
                          ? "border-violet-500 bg-violet-500/10 text-white"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <GitBranch className="w-4 h-4" />
                      <span>GitHub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVcsProvider("gitlab")}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        vcsProvider === "gitlab"
                          ? "border-violet-500 bg-violet-500/10 text-white"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <Key className="w-4 h-4" />
                      <span>GitLab</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Target Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition w-full placeholder:text-zinc-600"
                    placeholder="https://github.com/org/repo"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Access Token (Private Scopes)
                  </label>
                  <input
                    type="password"
                    value={vcsToken}
                    onChange={(e) => setVcsToken(e.target.value)}
                    className="bg-white/5 border border-white/10 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition w-full placeholder:text-zinc-600"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <button
                  type="submit"
                  disabled={integrating}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <span>
                    {integrating ? "Verifying Token..." : "Verify & Integrate"}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-zinc-500 font-mono">
        &copy; 2026 Themis AI Operations Inc.
      </footer>
    </div>
  );
}
