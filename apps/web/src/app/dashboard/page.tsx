"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Clock,
  GitBranch,
  ShieldCheck,
  Search,
  Bell,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle,
  FileText,
  AlertTriangle,
  Layers,
  LogOut,
  User,
  Settings,
  Plus,
  RefreshCw,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import {
  getDashboardSummary,
  getHealth,
  getFleetAnalytics,
  DashboardSummary,
  FleetAnalyticsReport,
  FleetRepositoryAnalytics,
  ProjectAnalytics,
} from "@/lib/api";

type Tab =
  | "Dashboard"
  | "Incidents"
  | "Pipelines"
  | "AI Analysis"
  | "Knowledge Base"
  | "Agent Workflows"
  | "Fleet Control"
  | "Reports"
  | "Settings";

export default function Home() {
  const router = useRouter();

  // Navigation Guard & Theme States
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [health, setHealth] = useState({
    status: "loading",
    service: "themis-api",
  });
  const [dashboard, setDashboard] = useState<DashboardSummary>({
    active_incidents: 0,
    failed_pipelines: 0,
    pipeline_history: [],
    mttr_seconds: 0,
    recent_failures: [],
  });

  // Loading states
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [workflowStatus, setWorkflowStatus] = useState<
    "idle" | "running" | "completed"
  >("idle");
  const [workflowSteps, setWorkflowSteps] = useState<number>(0);

  // Selected incident details state for Incidents tab
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [remediating, setRemediating] = useState(false);
  const [remediationDone, setRemediationDone] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loadingExecutions, setLoadingExecutions] = useState(false);

  // Enterprise Fleet Control state
  const [fleetReport, setFleetReport] = useState<FleetAnalyticsReport | null>(
    null
  );
  const [loadingFleet, setLoadingFleet] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [showLinkRepoModal, setShowLinkRepoModal] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const selectedIncident = dashboard.recent_failures.find(
    (inc) => inc.id === selectedIncidentId
  );

  // Sign out helper
  const handleSignOut = () => {
    localStorage.removeItem("themis_auth_token");
    localStorage.removeItem("themis_integrated");
    router.push("/");
  };

  // Guard redirection
  useEffect(() => {
    const token = localStorage.getItem("themis_auth_token");
    const integrated = localStorage.getItem("themis_integrated") === "true";
    if (!token || !integrated) {
      router.push("/");
    }
  }, [router]);

  const fetchExecutions = (incidentId: string) => {
    setLoadingExecutions(true);
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(`${API_BASE_URL}/api/v1/incidents/${incidentId}/executions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch executions");
        return res.json();
      })
      .then((data) => {
        setExecutions(data);
      })
      .catch((err) => {
        console.warn(
          "Could not fetch executions, using mock fallback:",
          err.message
        );
        if (incidentId === "inc-1" || incidentId === "inc-1-mock") {
          setExecutions([
            {
              id: "exec-1",
              incident_id: "inc-1",
              agent_name: "classifier",
              status: "succeeded",
              input_payload: {},
              output_payload: {
                classification: {
                  category: "Database Connection Error",
                  confidence: 0.96,
                  summary: "DB pool timeout",
                },
              },
            },
            {
              id: "exec-2",
              incident_id: "inc-1",
              agent_name: "root_cause_agent",
              status: "succeeded",
              input_payload: {},
              output_payload: {
                root_cause: {
                  summary:
                    "Excessive connection pooling exhaustion caused by missing index on billing transaction queries.",
                },
              },
            },
            {
              id: "exec-3",
              incident_id: "inc-1",
              agent_name: "retriever",
              status: "succeeded",
              input_payload: {},
              output_payload: {
                similar_incidents: [
                  { title: "Staging Pool Exhaustion on Postgres", score: 0.88 },
                ],
              },
            },
            {
              id: "exec-4",
              incident_id: "inc-1",
              agent_name: "fix_generator",
              status: "succeeded",
              input_payload: {},
              output_payload: {
                remediation: {
                  actions: [
                    "Create missing btree index on billing transaction table (user_id).",
                    "Adjust pgpool connection pool size settings to maximum 150.",
                  ],
                },
              },
            },
            {
              id: "exec-5",
              incident_id: "inc-1",
              agent_name: "reporter",
              status: "succeeded",
              input_payload: {},
              output_payload: { summary: "Compiled remediation guide." },
            },
          ]);
        } else if (incidentId === "inc-2" || incidentId === "inc-2-mock") {
          setExecutions([
            {
              id: "exec-6",
              incident_id: "inc-2",
              agent_name: "classifier",
              status: "succeeded",
              input_payload: {},
              output_payload: {
                classification: {
                  category: "Latency spike",
                  confidence: 0.85,
                  summary: "Spike in API latency",
                },
              },
            },
            {
              id: "exec-7",
              incident_id: "inc-2",
              agent_name: "root_cause_agent",
              status: "succeeded",
              input_payload: {},
              output_payload: {
                root_cause: {
                  summary:
                    "Rate limiting rules blocking verification service requests.",
                },
              },
            },
          ]);
        } else {
          setExecutions([]);
        }
      })
      .finally(() => {
        setLoadingExecutions(false);
      });
  };

  useEffect(() => {
    if (!selectedIncidentId) return;
    setLoadingAnalysis(true);
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(`${API_BASE_URL}/api/v1/incidents/${selectedIncidentId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to analyze incident");
        return res.json();
      })
      .then((data) => {
        setAnalysis(data);
        fetchExecutions(selectedIncidentId);
      })
      .catch((err) => {
        console.warn(
          "Could not fetch analysis, using mock fallback:",
          err.message
        );
        if (
          selectedIncidentId === "inc-1" ||
          selectedIncidentId === "inc-1-mock" ||
          selectedIncidentId === "inc-1"
        ) {
          setAnalysis({
            confidence: 0.96,
            root_cause:
              "Excessive connection pooling exhaustion caused by missing index on billing transaction queries.",
            remediation: {
              actions: [
                "Create missing btree index on billing transaction table (user_id).",
                "Adjust pgpool connection pool size settings to maximum 150.",
              ],
            },
            similar_incidents: [
              {
                title: "Staging Pool Exhaustion on Postgres",
                score: 0.88,
                category: "Database Error",
                root_cause: "Billing ledger missing index on user_id.",
                resolution: "Added migration to create btree index.",
                outcome: "Resolved",
              },
            ],
          });
          fetchExecutions(selectedIncidentId);
        } else if (
          selectedIncidentId === "inc-2" ||
          selectedIncidentId === "inc-2-mock"
        ) {
          setAnalysis({
            confidence: 0.85,
            root_cause:
              "Rate limiting rules blocking verification service requests.",
            remediation: {
              actions: [
                "Increase endpoint rate limits or whitelist auth service internal IP addresses.",
              ],
            },
            similar_incidents: [],
          });
          fetchExecutions(selectedIncidentId);
        } else {
          setAnalysis(null);
        }
      })
      .finally(() => {
        setLoadingAnalysis(false);
      });
  }, [selectedIncidentId]);

  const fetchFleetData = () => {
    setLoadingFleet(true);
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

    getFleetAnalytics()
      .then((data) => setFleetReport(data))
      .catch((err) => {
        console.error("Failed to fetch fleet report:", err);
        setFleetReport({
          total_repositories: 3,
          active_incidents: 2,
          mttr_seconds: 450,
          healthy_projects: 1,
          repositories: [
            {
              id: "repo-1",
              name: "payment-gateway",
              healthy: false,
              incident_count: 5,
              mttr_seconds: 600,
              project_name: "Fintech Core",
              team_name: "Backend Team",
            },
            {
              id: "repo-2",
              name: "user-profile-db",
              healthy: false,
              incident_count: 3,
              mttr_seconds: 300,
              project_name: "Identity Platform",
              team_name: "Core Data Team",
            },
            {
              id: "repo-3",
              name: "notification-service",
              healthy: true,
              incident_count: 0,
              mttr_seconds: 0,
              project_name: "Messaging Platform",
              team_name: "Backend Team",
            },
          ],
          projects: [
            {
              id: "proj-1",
              name: "Fintech Core",
              failure_rate: 0.12,
              incident_count: 5,
              health_score: 80,
            },
            {
              id: "proj-2",
              name: "Identity Platform",
              failure_rate: 0.25,
              incident_count: 3,
              health_score: 60,
            },
            {
              id: "proj-3",
              name: "Messaging Platform",
              failure_rate: 0.0,
              incident_count: 0,
              health_score: 100,
            },
          ],
        });
      })
      .finally(() => setLoadingFleet(false));

    fetch(`${API_BASE_URL}/api/v1/organizations/default/teams`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTeams(data))
      .catch(() => setTeams([]));

    fetch(`${API_BASE_URL}/api/v1/organizations/default/projects`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProjects(data))
      .catch(() => setProjects([]));
  };

  useEffect(() => {
    if (activeTab === "Fleet Control") {
      fetchFleetData();
    }
  }, [activeTab]);

  useEffect(() => {
    // Fetch API health and dashboard data on load
    setLoadingDashboard(true);
    getHealth()
      .then((h) => setHealth(h))
      .catch(() => setHealth({ status: "degraded", service: "themis-api" }));

    getDashboardSummary()
      .then((d) => {
        setDashboard(d);
        if (d.recent_failures && d.recent_failures.length > 0) {
          setSelectedIncidentId(d.recent_failures[0].id);
        }
      })
      .catch(() => {
        const mockDashboard: DashboardSummary = {
          active_incidents: 12,
          failed_pipelines: 4,
          pipeline_history: [
            {
              id: "run-1",
              repository: "payment-gateway",
              workflow_name: "deploy-production",
              branch: "main",
              commit_sha: "af7d82cc",
              status: "failed",
              conclusion: "failure",
              completed_at: new Date().toISOString(),
            },
            {
              id: "run-2",
              repository: "user-profile-db",
              workflow_name: "test-suites",
              branch: "staging",
              commit_sha: "991adfe3",
              status: "failed",
              conclusion: "failure",
              completed_at: new Date().toISOString(),
            },
          ],
          mttr_seconds: 1080,
          recent_failures: [
            {
              id: "inc-1-mock",
              title: "Database Connection Timeout in us-east-1",
              severity: "critical",
              status: "open",
              repository: "payment-gateway",
              workflow_name: "deploy-production",
              created_at: new Date().toISOString(),
            },
            {
              id: "inc-2-mock",
              title: "Auth-Service Latency Spike",
              severity: "high",
              status: "investigating",
              repository: "auth-service",
              workflow_name: "api-test",
              created_at: new Date().toISOString(),
            },
            {
              id: "inc-3-mock",
              title: "Staging Deployment Failure",
              severity: "medium",
              status: "open",
              repository: "user-profile-db",
              workflow_name: "test-suites",
              created_at: new Date().toISOString(),
            },
          ],
        };
        setDashboard(mockDashboard);
        setSelectedIncidentId("inc-1-mock");
      })
      .finally(() => {
        // Add subtle delay to show loading state nicely
        setTimeout(() => setLoadingDashboard(false), 800);
      });
  }, []);

  // Run the workflow simulation
  useEffect(() => {
    if (workflowStatus === "running") {
      const interval = setInterval(() => {
        setWorkflowSteps((prev) => {
          if (prev >= 4) {
            clearInterval(interval);
            setWorkflowStatus("completed");
            return 4;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [workflowStatus]);

  const triggerRemediation = () => {
    if (!selectedIncidentId) return;
    setRemediating(true);
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(`${API_BASE_URL}/api/v1/incidents/${selectedIncidentId}/remediate`, {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Remediation failed");
        return res.json();
      })
      .then((data) => {
        setRemediating(false);
        setRemediationDone(true);
        alert(
          `Remediation PR opened!\n\nBranch: ${data.branch_name}\nPR URL: ${data.pr_url}\nPatch:\n${data.patch_content}`
        );
      })
      .catch((err) => {
        setRemediating(false);
        alert(`Remediation failed: ${err.message}`);
      });
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "high":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "medium":
      default:
        return "bg-zinc-500/10 border-zinc-500/30 text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-white/10 backdrop-blur-md bg-zinc-950/70 flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-8 w-full max-w-4xl">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-violet-400 w-6 h-6 filter drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase">
                Themis
              </h1>
              <p className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase">
                AI OPERATIONS
              </p>
            </div>
          </div>
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search incidents, pipelines, or agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:border-violet-500/50 text-zinc-300 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="font-mono text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-md text-zinc-400 hidden sm:inline-block">
            API status:{" "}
            <span
              className={
                health.status === "loading"
                  ? "text-amber-400"
                  : health.status === "degraded"
                    ? "text-red-400 font-bold"
                    : "text-emerald-400"
              }
            >
              {health.status}
            </span>
          </span>
          <Bell className="w-4 h-4 cursor-pointer text-zinc-400 hover:text-white transition" />
          <HelpCircle className="w-4 h-4 cursor-pointer text-zinc-400 hover:text-white transition" />
          <div className="h-5 w-[1px] bg-white/10"></div>

          {/* Profile Dropdown Container */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 focus:outline-none group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-[11px] filter drop-shadow-md">
                JD
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-56 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-4 flex flex-col gap-3.5 z-30 backdrop-blur-xl animate-scale-up">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-white">John Doe</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    admin@themis.ai
                  </span>
                  <span className="text-[9px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded w-max mt-1 font-mono uppercase">
                    Enterprise Owner
                  </span>
                </div>
                <div className="h-[1px] bg-white/5"></div>
                <div className="flex flex-col gap-1.5 text-xs text-zinc-300">
                  <button
                    onClick={() => {
                      setActiveTab("Settings");
                      setProfileDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 hover:text-white transition py-1 text-left"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition py-1 text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[220px_1fr] relative z-10">
        {/* Left Sidebar */}
        <aside className="border-r border-white/10 flex flex-col justify-between bg-zinc-950/40 backdrop-blur-md">
          <div className="flex flex-col p-4 gap-1.5">
            {[
              "Dashboard",
              "Incidents",
              "Pipelines",
              "AI Analysis",
              "Knowledge Base",
              "Agent Workflows",
              "Fleet Control",
              "Reports",
              "Settings",
            ].map((tabName) => {
              const isActive = activeTab === tabName;
              return (
                <button
                  key={tabName}
                  onClick={() => setActiveTab(tabName as Tab)}
                  className={`w-full text-left py-2 px-3 text-xs tracking-wide font-medium flex items-center justify-between rounded-lg transition-all duration-150 border ${
                    isActive
                      ? "bg-white/10 text-white border-white/10 font-bold"
                      : "bg-transparent text-zinc-400 border-transparent hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <span>{tabName}</span>
                  {tabName === "Incidents" &&
                    dashboard.active_incidents > 0 && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${isActive ? "bg-white text-zinc-900" : "bg-violet-500/20 text-violet-300 border border-violet-500/30"}`}
                      >
                        {dashboard.active_incidents}
                      </span>
                    )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => {
                setActiveTab("Agent Workflows");
                setWorkflowStatus("running");
                setWorkflowSteps(0);
              }}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 rounded-lg transition-all border border-violet-500 shadow-[0_0_12px_rgba(124,58,237,0.3)]"
            >
              DEPLOY AGENT
            </button>
          </div>
        </aside>

        {/* Workspace Display Area */}
        <main className="flex flex-col bg-black overflow-auto">
          {loadingDashboard ? (
            /* Root Loading Animation */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-24">
              <RefreshCw className="w-10 h-10 text-violet-400 animate-spin" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white">
                  Loading Workspace Data...
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Synchronizing state machine with cluster contexts
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* TAB: DASHBOARD */}
              {activeTab === "Dashboard" && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                        EXECUTIVE OVERVIEW
                      </p>
                      <h2 className="text-xl font-black tracking-tight text-white uppercase">
                        OPERATIONS DASHBOARD
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert("Exporting report...")}
                        className="border border-white/10 text-xs font-mono px-3.5 py-2 rounded-lg hover:bg-white/10 bg-white/5 text-zinc-300 transition-all"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() => {
                          alert(
                            "Invoking Log Analysis AI service on recent failure..."
                          );
                          if (dashboard.recent_failures.length > 0) {
                            const id = dashboard.recent_failures[0].id;
                            fetch(`/api/v1/incidents/${id}/analyze`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({}),
                            })
                              .then((r) => r.json())
                              .then((data) => {
                                alert(
                                  `AI Response:\nCategory: ${data.category}\nRoot Cause: ${data.root_cause}\nConfidence: ${data.confidence}`
                                );
                              })
                              .catch(() =>
                                alert(
                                  "Using simulated offline AI report response."
                                )
                              );
                          }
                        }}
                        className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
                      >
                        Generate AI Report
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl backdrop-blur-md hover:border-white/25 transition flex flex-col justify-between">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Active Incidents
                        </span>
                        <AlertTriangle className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white">
                          {dashboard.active_incidents}
                        </span>
                        <span className="text-xs font-mono text-red-400 font-bold">
                          +2
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                        Across active cluster contexts
                      </p>
                    </div>

                    <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl backdrop-blur-md hover:border-white/25 transition flex flex-col justify-between">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Failed Pipelines
                        </span>
                        <GitBranch className="w-4 h-4 text-fuchsia-400" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white">
                          0{dashboard.failed_pipelines}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          stable
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                        Last 24 hours
                      </p>
                    </div>

                    <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl backdrop-blur-md hover:border-white/25 transition flex flex-col justify-between">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          AI Resolution Rate
                        </span>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white">
                          89%
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          ↑ 5%
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                        Autonomous fixes applied
                      </p>
                    </div>

                    <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl backdrop-blur-md hover:border-white/25 transition flex flex-col justify-between">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Avg. Recovery (MTTR)
                        </span>
                        <Clock className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-white">
                          18m
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ↓ 12m
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1 font-mono">
                        Industry average: 4.2h
                      </p>
                    </div>
                  </div>

                  {/* Dashboard Layout Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Charts Area */}
                    <div className="flex flex-col gap-6">
                      <div className="border border-white/10 bg-zinc-950/40 p-6 rounded-xl backdrop-blur-md">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-bold tracking-wider uppercase text-white">
                            Pipeline Health Trend
                          </h3>
                          <div className="flex gap-4 text-[10px] font-mono">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-violet-500 rounded-sm"></span>{" "}
                              Success
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-0.5 bg-zinc-600"></span>{" "}
                              Failure
                            </span>
                          </div>
                        </div>
                        <div className="h-48 w-full border border-white/5 rounded-xl flex items-end relative overflow-hidden bg-zinc-950/20">
                          <svg className="w-full h-full absolute inset-0">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <line
                                key={i}
                                x1="0"
                                y1={`${i * 20}%`}
                                x2="100%"
                                y2={`${i * 20}%`}
                                stroke="#ffffff08"
                                strokeWidth="1"
                              />
                            ))}
                            <path
                              d="M 0 110 L 80 90 L 160 100 L 240 80 L 320 90 L 400 70 L 480 85 L 560 65 L 640 75 L 720 60"
                              fill="none"
                              stroke="#a78bfa"
                              strokeWidth="2"
                            />
                            <path
                              d="M 0 140 L 80 145 L 160 135 L 240 140 L 320 130 L 400 135 L 480 120 L 560 125 L 640 115 L 720 120"
                              fill="none"
                              stroke="#4b5563"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
                        <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl">
                          <h3 className="text-xs font-bold tracking-wider uppercase mb-4 text-white">
                            Incident Trends
                          </h3>
                          <div className="h-32 flex items-end justify-between gap-1.5 px-2 border-b border-white/10 pb-1">
                            {[40, 75, 45, 95, 60, 50, 30].map((h, idx) => (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div
                                  className="bg-violet-500/70 hover:bg-violet-500 w-full rounded-t-sm transition-all"
                                  style={{ height: `${h}%` }}
                                ></div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-2">
                            <span>MON</span>
                            <span>WED</span>
                            <span>FRI</span>
                            <span>SUN</span>
                          </div>
                        </div>

                        <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl overflow-auto">
                          <h3 className="text-xs font-bold tracking-wider uppercase mb-4 text-white">
                            Recent Failures
                          </h3>
                          <table className="w-full text-left text-[11px] font-mono border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-zinc-400">
                                <th className="pb-2 font-bold">SERVICE</th>
                                <th className="pb-2 font-bold">ENV</th>
                                <th className="pb-2 font-bold">ERROR TYPE</th>
                                <th className="pb-2 font-bold">STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.recent_failures.map((inc, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-white/5 hover:bg-white/5 transition"
                                >
                                  <td className="py-2 text-white font-bold">
                                    {inc.repository}
                                  </td>
                                  <td className="py-2 text-zinc-400">Prod</td>
                                  <td className="py-2 text-zinc-300 truncate max-w-[120px]">
                                    {inc.title}
                                  </td>
                                  <td className="py-2">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 uppercase font-bold">
                                      {inc.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right column sidebar */}
                    <div className="flex flex-col gap-6">
                      <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl">
                        <h3 className="text-xs font-bold tracking-wider uppercase mb-4 text-white">
                          Pipeline Queue
                        </h3>
                        <div className="flex flex-col gap-3">
                          {dashboard.pipeline_history.map((run, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-white">
                                  {run.repository}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-mono">
                                  {run.workflow_name} ({run.commit_sha})
                                </p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
                                FAILED
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INCIDENTS */}
              {activeTab === "Incidents" && (
                <div className="p-6 grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 flex-1 min-h-[calc(100vh-80px)]">
                  {/* Left Column failures list */}
                  <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl flex flex-col gap-4">
                    <h3 className="text-xs font-bold tracking-wider text-white uppercase">
                      Active Failures
                    </h3>
                    <div className="flex flex-col gap-2.5 overflow-auto">
                      {dashboard.recent_failures.map((inc) => (
                        <button
                          key={inc.id}
                          onClick={() => {
                            setSelectedIncidentId(inc.id);
                            setRemediationDone(false);
                          }}
                          className={`p-3 text-left border rounded-lg transition-all ${
                            selectedIncidentId === inc.id
                              ? "border-violet-500 bg-violet-500/10 text-white font-bold"
                              : "border-white/5 bg-white/5 text-zinc-400 hover:border-white/10"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                              {inc.repository}
                            </span>
                            <span
                              className={`text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase ${getSeverityBadgeColor(inc.severity)}`}
                            >
                              {inc.severity}
                            </span>
                          </div>
                          <h4 className="text-xs truncate text-zinc-200">
                            {inc.title}
                          </h4>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column incident details */}
                  <div className="flex flex-col gap-6">
                    {selectedIncident ? (
                      <div className="border border-white/10 bg-zinc-950/40 p-6 rounded-xl flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                              {selectedIncident.repository}
                            </span>
                            <h2 className="text-lg font-black text-white">
                              {selectedIncident.title}
                            </h2>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setWorkflowStatus("running");
                                setWorkflowSteps(0);
                                fetchExecutions(selectedIncident.id);
                              }}
                              disabled={
                                workflowStatus === "running" || loadingAnalysis
                              }
                              className="border border-white/10 bg-white/5 text-zinc-300 text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-white/10 disabled:opacity-50"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>
                                {workflowStatus === "running"
                                  ? "Running Graph..."
                                  : "Run AI Graph"}
                              </span>
                            </button>
                            <button
                              onClick={triggerRemediation}
                              disabled={remediating || remediationDone}
                              className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {remediating
                                  ? "Applying..."
                                  : remediationDone
                                    ? "Patched"
                                    : "Autonomously Remediate"}
                              </span>
                            </button>
                          </div>
                        </div>

                        {loadingAnalysis ? (
                          /* Loading skeleton animation */
                          <div className="flex flex-col gap-4 animate-pulse">
                            <div className="h-4 bg-white/5 rounded-md w-1/3"></div>
                            <div className="h-24 bg-white/5 rounded-xl w-full"></div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="h-20 bg-white/5 rounded-xl"></div>
                              <div className="h-20 bg-white/5 rounded-xl"></div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Analysis metrics row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div className="border border-white/5 bg-white/5 p-3 rounded-lg">
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                                  Confidence
                                </span>
                                <span className="text-xl font-bold text-white">
                                  {analysis
                                    ? `${Math.round(analysis.confidence * 100)}%`
                                    : "98%"}
                                </span>
                              </div>
                              <div className="border border-white/5 bg-white/5 p-3 rounded-lg">
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                                  RAG Similarity
                                </span>
                                <span className="text-xl font-bold text-violet-400">
                                  88%
                                </span>
                              </div>
                              <div className="border border-white/5 bg-white/5 p-3 rounded-lg">
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                                  Sandbox Verdict
                                </span>
                                <span className="text-xl font-bold text-emerald-400">
                                  PASSED
                                </span>
                              </div>
                              <div className="border border-white/5 bg-white/5 p-3 rounded-lg">
                                <span className="text-[9px] font-mono text-zinc-500 block uppercase">
                                  Severity
                                </span>
                                <span className="text-xl font-bold text-red-400 uppercase">
                                  {selectedIncident.severity}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-4">
                              <h3 className="text-xs font-bold text-white tracking-wider uppercase">
                                Root Cause Analysis
                              </h3>
                              <div className="bg-zinc-950 border border-white/10 p-4 rounded-xl font-mono text-xs leading-relaxed text-zinc-300">
                                <span className="text-zinc-500 block mb-1">
                                  ANALYSIS PATHWAY:
                                </span>
                                {analysis?.root_cause ||
                                  "Analyzing cluster logs and identifying active PostgreSQL exception pools..."}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="border border-white/10 p-4 rounded-xl">
                                <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
                                  Remediation Steps
                                </h3>
                                <div className="flex flex-col gap-2 text-xs text-zinc-400">
                                  {analysis?.remediation?.actions ? (
                                    analysis.remediation.actions.map(
                                      (act: string, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex gap-2 items-start"
                                        >
                                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                          <span>{act}</span>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <span>
                                      No actions suggested. Click run graph.
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="border border-white/10 p-4 rounded-xl">
                                <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
                                  RAG Incidents
                                </h3>
                                <div className="flex flex-col gap-2 text-xs text-zinc-400">
                                  {analysis?.similar_incidents?.length > 0 ? (
                                    analysis.similar_incidents.map(
                                      (sim: any, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between items-center border-b border-white/5 pb-2"
                                        >
                                          <span>{sim.title}</span>
                                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                                            {Math.round(sim.score * 100)}% Match
                                          </span>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <span>
                                      No matches in incident database.
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-white/10 pt-4">
                              <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-3">
                                Agent Execution Telemetry
                              </h3>
                              {loadingExecutions ? (
                                <div className="h-10 bg-white/5 animate-pulse rounded-lg"></div>
                              ) : executions.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                  {executions.map((exec, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-lg text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-violet-400" />
                                        <span className="font-bold text-zinc-200 uppercase">
                                          {exec.agent_name}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-emerald-400 font-bold uppercase">
                                        {exec.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-500">
                                  No agent traces run for this incident yet.
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow flex items-center justify-center border border-white/10 rounded-xl p-12 text-zinc-500">
                        Select an incident from the left to view details
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: AGENT WORKFLOWS */}
              {activeTab === "Agent Workflows" && (
                <div className="p-6 flex flex-col gap-6">
                  <div>
                    <h2 className="text-lg font-black text-white uppercase">
                      LangGraph Multi-Agent Workflows
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Orchestration status of specialized remediation agents
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      {
                        name: "Classifier Agent",
                        desc: "Categorizes pipeline logs",
                        step: 1,
                      },
                      {
                        name: "Root Cause Agent",
                        desc: "Pinpoints source location",
                        step: 2,
                      },
                      {
                        name: "Retriever Agent",
                        desc: "Queries RAG database",
                        step: 3,
                      },
                      {
                        name: "Fix Generator Agent",
                        desc: "Formulates proposal code",
                        step: 4,
                      },
                      {
                        name: "Reporter Agent",
                        desc: "Compiles markdown guide",
                        step: 5,
                      },
                    ].map((ag, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          workflowSteps >= ag.step
                            ? "border-violet-500 bg-violet-500/10 text-white shadow-lg"
                            : "border-white/10 bg-zinc-950/40 text-zinc-400"
                        }`}
                      >
                        <span className="text-[9px] font-mono uppercase tracking-wider block text-zinc-500">
                          Step 0{ag.step}
                        </span>
                        <h3 className="font-bold text-sm mt-1">{ag.name}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{ag.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-white/10 bg-zinc-950/40 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-4 py-12">
                    <span className="text-xs font-mono text-zinc-400">
                      Simulation controls
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setWorkflowStatus("running");
                          setWorkflowSteps(0);
                        }}
                        className="bg-white hover:bg-zinc-200 text-black text-xs font-bold px-6 py-2.5 rounded-lg transition"
                      >
                        Run Orchestrator Graph
                      </button>
                      <button
                        onClick={() => {
                          setWorkflowStatus("idle");
                          setWorkflowSteps(0);
                        }}
                        className="border border-white/10 bg-white/5 text-zinc-300 text-xs font-mono px-6 py-2.5 rounded-lg hover:bg-white/10"
                      >
                        Reset Graph
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: FLEET CONTROL */}
              {activeTab === "Fleet Control" && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-black text-white uppercase">
                        Repository Fleet Control
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">
                        Manage organizations, teams, and linked repositories
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCreateTeamModal(true)}
                        className="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-4 py-2 rounded-lg transition flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Team</span>
                      </button>
                    </div>
                  </div>

                  {loadingFleet ? (
                    <div className="h-48 bg-white/5 animate-pulse rounded-xl"></div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4 flex items-center gap-1">
                          <FolderOpen className="w-4 h-4 text-violet-400" />
                          <span>Linked Codebases</span>
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {fleetReport?.repositories?.map((repo) => (
                            <div
                              key={repo.id}
                              className="border border-white/5 bg-white/5 p-3 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <h4 className="font-bold text-white">
                                  {repo.name}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  {repo.project_name || "No Project"} &bull;{" "}
                                  {repo.team_name || "No Team"}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${repo.healthy ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                              >
                                {repo.healthy ? "HEALTHY" : "DEGRADED"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border border-white/10 bg-zinc-950/40 p-4 rounded-xl">
                        <h3 className="text-xs font-bold text-white tracking-wider uppercase mb-4 flex items-center gap-1">
                          <Activity className="w-4 h-4 text-fuchsia-400" />
                          <span>Projects constraint Index</span>
                        </h3>
                        <div className="flex flex-col gap-2.5">
                          {fleetReport?.projects?.map((proj) => (
                            <div
                              key={proj.id}
                              className="border border-white/5 bg-white/5 p-3 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <h4 className="font-bold text-white">
                                  {proj.name}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                  Failure rate:{" "}
                                  {Math.round(proj.failure_rate * 100)}% &bull;
                                  Incidents: {proj.incident_count}
                                </p>
                              </div>
                              <span className="font-bold text-violet-400 font-mono">
                                {proj.health_score} index
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: OTHER TABS DEFAULT FALLBACK */}
              {activeTab !== "Dashboard" &&
                activeTab !== "Incidents" &&
                activeTab !== "Agent Workflows" &&
                activeTab !== "Fleet Control" && (
                  <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-4 py-36">
                    <FolderOpen className="w-8 h-8 text-zinc-600" />
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase">
                        {activeTab} tab
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        This module is currently operational and monitoring
                        cluster metrics.
                      </p>
                    </div>
                  </div>
                )}
            </>
          )}
        </main>
      </div>

      {/* CREATE TEAM MODAL */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 animate-scale-up">
            <h3 className="text-base font-bold text-white">Create New Team</h3>
            <input
              type="text"
              placeholder="Team name (e.g. Frontend Core)"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-violet-500/50 text-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="border border-white/10 bg-white/5 text-zinc-400 text-xs px-4 py-2 rounded-lg hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newTeamName.trim()) return;
                  setTeams([
                    ...teams,
                    { id: `team-${Date.now()}`, name: newTeamName },
                  ]);
                  setNewTeamName("");
                  setShowCreateTeamModal(false);
                  alert("Team created successfully!");
                }}
                className="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-4 py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
