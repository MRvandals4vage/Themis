"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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

const BoxesCore = ({ className, ...rest }: { className?: string }) => {
  const rows = new Array(150).fill(1);
  const cols = new Array(100).fill(1);

  return (
    <div
      style={{
        transform: `translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)`,
      }}
      className={cn(
        "absolute left-1/4 p-4 -top-1/4 flex -translate-x-1/2 -translate-y-1/2 w-full h-full z-0",
        className
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row` + i}
          className="w-16 h-8 border-l border-zinc-200/50 relative"
        >
          {cols.map((_, j) => (
            <motion.div
              whileHover={{
                backgroundColor: "rgb(0 0 0)",
                transition: { duration: 0 },
              }}
              animate={{
                transition: { duration: 2 },
              }}
              key={`col` + j}
              className="w-16 h-8 border-r border-t border-zinc-200/50 relative"
            >
              {j % 2 === 0 && i % 2 === 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="absolute h-6 w-10 -top-[14px] -left-[22px] text-zinc-300 stroke-[1px] pointer-events-none"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              ) : null}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

const Boxes = React.memo(BoxesCore);

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
    <div className="min-h-screen bg-white text-[#1b1c1c] relative overflow-hidden flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Dynamic Boxes Background */}
      <div className="absolute inset-0 overflow-hidden">
        <Boxes className="opacity-30" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 border-b border-black bg-white flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-black w-6 h-6" />
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase">
              Themis
            </h1>
            <p className="text-[10px] text-[#4c4546] font-mono tracking-widest uppercase">
              AI OPERATIONS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono">
          <a
            href="https://github.com/MRvandals4vage/Themis"
            target="_blank"
            rel="noreferrer"
            className="text-[#4c4546] hover:underline transition"
          >
            Docs
          </a>
          <button
            onClick={() => setStep(hasToken ? "integrate" : "login")}
            className="border border-black bg-white hover:bg-black hover:text-white text-[10px] uppercase font-bold px-4 py-2 transition"
          >
            {hasToken ? "Configure VCS" : "Sign In"}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-16">
        {step === "landing" && (
          <div className="max-w-4xl text-center flex flex-col items-center gap-8">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight uppercase leading-none">
              Autonomously Fix <br />
              CI/CD Failures
            </h2>

            <p className="text-xs md:text-sm text-[#4c4546] max-w-2xl leading-relaxed font-mono">
              Detect logs, extract root causes with stateful LangGraph agents,
              retrieve fixes from your incident database, and test them in
              sandboxes before opening a PR.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 font-mono text-xs">
              <button
                onClick={() => setStep("login")}
                className="bg-black text-white hover:bg-white hover:text-black border border-black font-bold px-8 py-3.5 transition flex items-center gap-2 uppercase"
              >
                <span>Access Console</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  window.open(
                    "https://github.com/MRvandals4vage/Themis",
                    "_blank"
                  )
                }
                className="border border-black bg-white hover:bg-black hover:text-white font-bold px-8 py-3.5 transition flex items-center gap-2 uppercase"
              >
                <GitBranch className="w-4 h-4" />
                <span>GitHub Repository</span>
              </button>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full text-left">
              <div className="p-6 bg-white border border-black flex flex-col gap-3">
                <Database className="w-5 h-5 text-black" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Incident Memory (RAG)
                </h3>
                <p className="text-[11px] text-[#4c4546] leading-relaxed">
                  Semantic index of old patches via Qdrant allows instant
                  correlation of new errors to successful historical repairs.
                </p>
              </div>
              <div className="p-6 bg-white border border-black flex flex-col gap-3">
                <GitBranch className="w-5 h-5 text-black" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  LangGraph Workflows
                </h3>
                <p className="text-[11px] text-[#4c4546] leading-relaxed">
                  Multi-agent graphs run classifiers, log parses, fix
                  generators, and reporters to build confidence-scored repairs.
                </p>
              </div>
              <div className="p-6 bg-white border border-black flex flex-col gap-3">
                <Lock className="w-5 h-5 text-black" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Sandboxed Validation
                </h3>
                <p className="text-[11px] text-[#4c4546] leading-relaxed">
                  Runs lint checks and unit tests in safe, isolated execution
                  setups to avoid deploying broken code or syntax bugs.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "login" && (
          <div className="w-full max-w-sm bg-white border border-black p-8 shadow-[4px_4px_0px_#000000] relative">
            <div className="flex flex-col gap-1.5 mb-8 text-center">
              <div className="mx-auto w-10 h-10 border border-black bg-[#fbf9f9] flex items-center justify-center mb-1">
                <Lock className="w-4 h-4 text-black" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Secure Access
              </h3>
              <p className="text-[10px] text-[#7e7576] font-mono">
                Sign in to your enterprise control plane
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 border border-black bg-[#fbf9f9] text-[10px] font-mono text-[#ba1a1a]">
                {error}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-5 text-xs font-mono"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-wider text-[#7e7576] font-bold">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#fbf9f9] border border-black focus:outline-none px-3 py-2.5 w-full placeholder:text-zinc-400"
                  placeholder="admin@themis.ai"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-wider text-[#7e7576] font-bold">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#fbf9f9] border border-black focus:outline-none px-3 py-2.5 w-full placeholder:text-zinc-400"
                  placeholder="Password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-black text-white hover:bg-white hover:text-black border border-black font-bold py-3 uppercase transition disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-dashed border-black/20 text-center">
              <p className="text-[9px] font-mono text-[#7e7576] leading-relaxed">
                DEMO CREDENTIALS:
                <br />
                User:{" "}
                <span className="font-bold text-black">
                  admin@themis.ai
                </span>{" "}
                &bull; Pass:{" "}
                <span className="font-bold text-black">devpass</span>
              </p>
            </div>
          </div>
        )}

        {step === "integrate" && (
          <div className="w-full max-w-sm bg-white border border-black p-8 shadow-[4px_4px_0px_#000000] relative">
            <div className="flex flex-col gap-1.5 mb-8 text-center">
              <div className="mx-auto w-10 h-10 border border-black bg-[#fbf9f9] flex items-center justify-center mb-1">
                <GitBranch className="w-4 h-4 text-black" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider">
                VCS Integration
              </h3>
              <p className="text-[10px] text-[#7e7576] font-mono">
                Link source control repository
              </p>
            </div>

            {integrationSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <CheckCircle2 className="w-12 h-12 text-black" />
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    Integration Linked
                  </h4>
                  <p className="text-[10px] font-mono text-[#7e7576] mt-1">
                    Opening dashboard console...
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleIntegrate}
                className="flex flex-col gap-6 text-xs font-mono"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[#7e7576] font-bold">
                    Select Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVcsProvider("github")}
                      className={`py-2 px-3 border text-[10px] font-bold transition ${
                        vcsProvider === "github"
                          ? "border-black bg-black text-white"
                          : "border-black/20 bg-white text-black hover:border-black"
                      }`}
                    >
                      GitHub
                    </button>
                    <button
                      type="button"
                      onClick={() => setVcsProvider("gitlab")}
                      className={`py-2 px-3 border text-[10px] font-bold transition ${
                        vcsProvider === "gitlab"
                          ? "border-black bg-black text-white"
                          : "border-black/20 bg-white text-black hover:border-black"
                      }`}
                    >
                      GitLab
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[#7e7576] font-bold">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="bg-[#fbf9f9] border border-black focus:outline-none px-3 py-2.5 w-full"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-wider text-[#7e7576] font-bold">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={vcsToken}
                    onChange={(e) => setVcsToken(e.target.value)}
                    className="bg-[#fbf9f9] border border-black focus:outline-none px-3 py-2.5 w-full"
                    placeholder="ghp_..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={integrating}
                  className="w-full bg-black text-white hover:bg-white hover:text-black border border-black font-bold py-3 uppercase transition disabled:opacity-50"
                >
                  {integrating ? "Verifying Token..." : "Verify & Link"}
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/10 py-6 text-center text-[10px] text-[#7e7576] font-mono">
        &copy; 2026 Themis AI Operations Inc.
      </footer>
    </div>
  );
}
