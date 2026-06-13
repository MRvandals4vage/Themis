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
  RefreshCw,
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

  useEffect(() => {
    const token = localStorage.getItem("themis_auth_token");
    const integrated = localStorage.getItem("themis_integrated") === "true";
    if (!token || !integrated) {
      router.push("/");
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
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

  // State for simulated workflow run in Agent Workflows tab
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

  const successfulRuns = dashboard.pipeline_history.filter(
    (run) =>
      run.status === "succeeded" ||
      run.conclusion === "success" ||
      run.status === "success"
  ).length;
  const totalRuns = dashboard.pipeline_history.length;
  const successRate =
    totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 100;

  const mttrMinutes =
    dashboard.mttr_seconds > 0 ? Math.round(dashboard.mttr_seconds / 60) : 0;
  const mttrDisplay =
    mttrMinutes > 0 ? `${mttrMinutes}m` : `${dashboard.mttr_seconds}s`;

  const avgConfidence = analysis?.confidence
    ? `${Math.round(analysis.confidence * 100)}%`
    : dashboard.recent_failures.length > 0
      ? "85%"
      : "N/A";

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
        console.warn("Could not fetch executions:", err.message);
        setExecutions([]);
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
        console.warn("Could not fetch analysis:", err.message);
        setAnalysis(null);
        fetchExecutions(selectedIncidentId);
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
        setFleetReport(null);
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

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(`${API_BASE_URL}/api/v1/organizations/default/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create team");
        return res.json();
      })
      .then(() => {
        setNewTeamName("");
        setShowCreateTeamModal(false);
        fetchFleetData();
        alert("Team created successfully!");
      })
      .catch((err) => alert(err.message));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(`${API_BASE_URL}/api/v1/organizations/default/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProjectName,
        description: newProjectDesc,
        team_id: selectedTeamId ? selectedTeamId : null,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create project");
        return res.json();
      })
      .then(() => {
        setNewProjectName("");
        setNewProjectDesc("");
        setSelectedTeamId("");
        setShowCreateProjectModal(false);
        fetchFleetData();
        alert("Project created successfully!");
      })
      .catch((err) => alert(err.message));
  };

  const handleLinkRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId || !selectedProjectId) return;
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
    fetch(
      `${API_BASE_URL}/api/v1/organizations/default/projects/${selectedProjectId}/repositories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository_id: selectedRepoId }),
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to link repository");
        return res.json();
      })
      .then(() => {
        setSelectedRepoId("");
        setSelectedProjectId("");
        setShowLinkRepoModal(false);
        fetchFleetData();
        alert("Repository linked to project successfully!");
      })
      .catch((err) => alert(err.message));
  };

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
      .catch((err) => {
        console.error("Failed to fetch dashboard summary:", err);
        setDashboard({
          active_incidents: 0,
          failed_pipelines: 0,
          pipeline_history: [],
          mttr_seconds: 0,
          recent_failures: [],
        });
        setSelectedIncidentId(null);
      })
      .finally(() => {
        setLoadingDashboard(false);
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
      case "high":
        return "border-black bg-black text-white";
      case "medium":
      default:
        return "border-black text-black bg-transparent";
    }
  };

  const hasClassifier = executions.some((e) => e.agent_name === "classifier");
  const hasRootCause = executions.some(
    (e) => e.agent_name === "root_cause_agent"
  );
  const hasRetriever = executions.some((e) => e.agent_name === "retriever");
  const hasFixGenerator = executions.some(
    (e) => e.agent_name === "fix_generator"
  );
  const hasReporter = executions.some((e) => e.agent_name === "reporter");

  return (
    <div className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-black flex items-center justify-between px-6 py-3 bg-white">
        <div className="flex items-center gap-8 w-full max-w-4xl">
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
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7e7576]" />
            <input
              type="text"
              placeholder="Search operations, agents, or logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#fbf9f9] border border-black py-2 pl-9 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button className="hover:underline hidden sm:block">Support</button>
          <Bell className="w-4 h-4 cursor-pointer hover:opacity-75" />
          <HelpCircle className="w-4 h-4 cursor-pointer hover:opacity-75" />
          <div className="h-4 w-[1px] bg-black"></div>
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] tracking-tighter hover:opacity-85 focus:outline-none"
            >
              JD
            </button>
            <span className="font-mono text-[10px] hidden lg:inline-block">
              API: {health.status}
            </span>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-8 w-48 bg-white border border-black p-3 flex flex-col gap-2 z-30 font-mono text-[10px] text-[#1b1c1c] shadow-lg">
                <div className="flex flex-col gap-0.5 border-b border-black pb-2">
                  <span className="font-bold">John Doe</span>
                  <span className="text-[#7e7576]">admin@themis.ai</span>
                  <span className="text-[8px] border border-black w-max px-1.5 py-0.5 mt-1 bg-black text-white uppercase font-bold">
                    Owner
                  </span>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("themis_auth_token");
                    localStorage.removeItem("themis_integrated");
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-1.5 text-red-600 hover:underline text-left mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr] border-b border-black">
        {/* Left Sidebar */}
        <aside className="border-r border-black flex flex-col justify-between bg-white">
          <div className="flex flex-col p-4 gap-2">
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
                  className={`w-full text-left py-2 px-3 text-xs tracking-wide font-medium flex items-center justify-between border ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "bg-transparent text-[#1b1c1c] border-transparent hover:bg-[#f5f3f3]"
                  } transition-all duration-75`}
                  style={{ borderRadius: "0px" }}
                >
                  <span>{tabName}</span>
                  {tabName === "Incidents" &&
                    dashboard.active_incidents > 0 && (
                      <span
                        className={`text-[9px] px-1 font-mono ${
                          isActive
                            ? "bg-white text-black"
                            : "bg-black text-white"
                        }`}
                      >
                        {dashboard.active_incidents}
                      </span>
                    )}
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-black">
            <button
              onClick={() => {
                setActiveTab("Agent Workflows");
                setWorkflowStatus("running");
                setWorkflowSteps(0);
              }}
              className="w-full bg-black text-white text-xs font-bold py-2 border border-black hover:bg-white hover:text-black transition-all duration-150"
              style={{ borderRadius: "0px" }}
            >
              DEPLOY AGENT
            </button>
          </div>
        </aside>

        {/* Workspace Display Area */}
        <main className="flex flex-col bg-[#fbf9f9] overflow-auto">
          {loadingDashboard ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-3 py-36 font-mono text-xs text-[#1b1c1c]">
              <RefreshCw className="w-8 h-8 animate-spin text-black" />
              <span>SYNCHRONIZING CONTAINER ORCHESTRATORS...</span>
            </div>
          ) : (
            <>
              {health.status !== "ok" && (
                <div className="bg-[#ba1a1a] text-white text-[10px] font-mono py-2 px-6 tracking-wide flex justify-between items-center">
                  <span>
                    OFFLINE MODE: THEMIS API IS CURRENTLY UNREACHABLE. TELEMETRY
                    REFLECTS CACHED OR LOCAL STATES.
                  </span>
                  <span className="border border-white px-2 py-0.5 font-bold uppercase">
                    DISCONNECTED
                  </span>
                </div>
              )}
              {/* TAB: DASHBOARD */}
              {activeTab === "Dashboard" && (
                <div className="p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-[10px] text-[#4c4546] font-mono tracking-widest uppercase">
                        EXECUTIVE OVERVIEW
                      </p>
                      <h2 className="text-xl font-bold tracking-tight uppercase">
                        OPERATIONS DASHBOARD
                      </h2>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert("Exporting report...")}
                        className="border border-black text-xs font-mono px-3 py-1.5 hover:bg-black hover:text-white transition-all bg-white"
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
                                alert("Failed to fetch. Check backend server.")
                              );
                          }
                        }}
                        className="bg-black text-white text-xs font-mono px-3 py-1.5 hover:bg-white hover:text-black border border-black transition-all"
                      >
                        Generate AI Report
                      </button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border border-black bg-white p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[#4c4546]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Active Incidents
                        </span>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {dashboard.active_incidents}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                        Current open incident cases
                      </p>
                    </div>

                    <div className="border border-black bg-white p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[#4c4546]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Failed Pipelines
                        </span>
                        <GitBranch className="w-3.5 h-3.5" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {dashboard.failed_pipelines}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                        Last 24 hours
                      </p>
                    </div>

                    <div className="border border-black bg-white p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[#4c4546]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Pipeline Success Rate
                        </span>
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {successRate}%
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                        Completed vs failed pipelines
                      </p>
                    </div>

                    <div className="border border-black bg-white p-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-[#4c4546]">
                        <span className="text-[10px] font-mono uppercase tracking-wider">
                          Avg. Recovery (MTTR)
                        </span>
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold">
                          {mttrDisplay}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                        Database calculated average
                      </p>
                    </div>
                  </div>

                  {/* Dashboard Layout Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                    {/* Charts Area */}
                    <div className="flex flex-col gap-6">
                      {/* Pipeline Health Trend */}
                      <div className="border border-black bg-white p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xs font-bold tracking-wider uppercase">
                            Pipeline Health Trend
                          </h3>
                          <div className="flex gap-4 text-[10px] font-mono">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 bg-black"></span>{" "}
                              Success
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-0.5 bg-[#cfc4c5]"></span>{" "}
                              Failure
                            </span>
                          </div>
                        </div>
                        {/* SVG Chart */}
                        <div className="h-48 w-full border border-black flex items-end relative overflow-hidden bg-[#fbf9f9]">
                          <svg className="w-full h-full absolute inset-0">
                            {/* Grid lines */}
                            {[1, 2, 3, 4, 5].map((i) => (
                              <line
                                key={i}
                                x1="0"
                                y1={`${i * 20}%`}
                                x2="100%"
                                y2={`${i * 20}%`}
                                stroke="#e3e2e2"
                                strokeWidth="1"
                              />
                            ))}
                            {/* Success Trend */}
                            <path
                              d="M 0 110 L 80 90 L 160 100 L 240 80 L 320 90 L 400 70 L 480 85 L 560 65 L 640 75 L 720 60"
                              fill="none"
                              stroke="black"
                              strokeWidth="2"
                            />
                            {/* Failure Trend */}
                            <path
                              d="M 0 140 L 80 145 L 160 135 L 240 140 L 320 130 L 400 135 L 480 120 L 560 125 L 640 115 L 720 120"
                              fill="none"
                              stroke="#7e7576"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* bottom trend and failures */}
                      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
                        <div className="border border-black bg-white p-4">
                          <h3 className="text-xs font-bold tracking-wider uppercase mb-4">
                            Incident Trends
                          </h3>
                          {/* Bar chart mockup */}
                          <div className="h-32 flex items-end justify-between gap-1 px-2 border-b border-black">
                            {[40, 75, 45, 95, 60, 50, 30].map((h, idx) => (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center"
                              >
                                <div
                                  className="bg-black w-full"
                                  style={{ height: `${h}%` }}
                                ></div>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-[#7e7576] mt-2">
                            <span>MON</span>
                            <span>WED</span>
                            <span>FRI</span>
                            <span>SUN</span>
                          </div>
                        </div>

                        <div className="border border-black bg-white p-4 overflow-auto">
                          <h3 className="text-xs font-bold tracking-wider uppercase mb-4">
                            Recent Failures
                          </h3>
                          <table className="w-full text-left text-[11px] font-mono border-collapse">
                            <thead>
                              <tr className="border-b border-black text-[#4c4546]">
                                <th className="pb-2 font-bold">SERVICE</th>
                                <th className="pb-2 font-bold">ENVIRONMENT</th>
                                <th className="pb-2 font-bold">ERROR TYPE</th>
                                <th className="pb-2 font-bold">DURATION</th>
                                <th className="pb-2 font-bold">STATUS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.recent_failures &&
                              dashboard.recent_failures.length > 0 ? (
                                dashboard.recent_failures.map((inc, idx) => {
                                  const env =
                                    inc.workflow_name
                                      ?.toLowerCase()
                                      .includes("production") ||
                                    inc.severity === "critical"
                                      ? "Production"
                                      : "Staging";
                                  const createdDate = new Date(inc.created_at);
                                  const durationMs =
                                    Date.now() - createdDate.getTime();
                                  const durationMins = Math.max(
                                    Math.round(durationMs / 60000),
                                    1
                                  );
                                  const durStr =
                                    durationMs > 0 && durationMins < 60
                                      ? `${durationMins}m ago`
                                      : createdDate.toLocaleTimeString();

                                  return (
                                    <tr
                                      key={inc.id || idx}
                                      onClick={() => {
                                        setSelectedIncidentId(inc.id);
                                        setActiveTab("Incidents");
                                      }}
                                      className="border-b border-[#efeded] last:border-b-0 hover:bg-[#f5f3f3] cursor-pointer"
                                    >
                                      <td className="py-2.5 font-bold">
                                        {inc.repository}
                                      </td>
                                      <td className="py-2.5">{env}</td>
                                      <td className="py-2.5 text-[#ba1a1a]">
                                        {inc.title}
                                      </td>
                                      <td className="py-2.5">{durStr}</td>
                                      <td className="py-2.5">
                                        <span className="border border-black px-1.5 py-0.5 text-[9px] font-bold">
                                          {inc.status.toUpperCase()}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              ) : (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-4 text-center text-xs text-[#7e7576] italic font-mono"
                                  >
                                    No recent failures reported.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* AI Insights Sidebar */}
                    <div className="border border-black bg-black text-white p-6 flex flex-col gap-6">
                      <h3 className="text-xs font-bold tracking-widest uppercase border-b border-[#7e7576] pb-3">
                        AI Insights
                      </h3>

                      {dashboard.recent_failures &&
                      dashboard.recent_failures.length > 0 ? (
                        dashboard.recent_failures
                          .slice(0, 3)
                          .map((failure, idx) => (
                            <div
                              key={failure.id || idx}
                              className="flex flex-col gap-2"
                            >
                              <span className="text-[9px] font-mono tracking-widest text-[#cfc4c5] uppercase">
                                Anomaly Detected
                              </span>
                              <p className="text-xs leading-relaxed font-light font-mono">
                                Failure on repository &apos;{failure.repository}
                                &apos; in workflow &apos;
                                {failure.workflow_name}&apos;. Status:{" "}
                                {failure.status.toUpperCase()}.
                              </p>
                              <button
                                onClick={() => {
                                  setSelectedIncidentId(failure.id);
                                  setActiveTab("Incidents");
                                }}
                                className="w-fit text-[10px] font-mono border border-white text-white py-1 px-3 mt-1 hover:bg-white hover:text-black transition-all"
                              >
                                ANALYZE FAILURE
                              </button>
                            </div>
                          ))
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-mono tracking-widest text-[#cfc4c5] uppercase">
                            System Status
                          </span>
                          <p className="text-xs leading-relaxed font-light">
                            All services operational. No active pipeline
                            failures or resource anomalies detected.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: INCIDENTS */}
              {activeTab === "Incidents" && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr] border-t border-black">
                  {/* Incidents List */}
                  <div className="border-r border-black bg-white flex flex-col">
                    <div className="p-4 border-b border-black flex justify-between items-center">
                      <h3 className="text-xs font-bold tracking-wider uppercase">
                        Active Incidents ({dashboard.recent_failures.length})
                      </h3>
                    </div>
                    <div className="flex-1 divide-y divide-black">
                      {dashboard.recent_failures.map((inc) => {
                        const isSelected = selectedIncidentId === inc.id;
                        return (
                          <div
                            key={inc.id}
                            onClick={() => {
                              setSelectedIncidentId(inc.id);
                              setRemediationDone(false);
                            }}
                            className={`p-4 cursor-pointer hover:bg-[#f5f3f3] transition-all ${
                              isSelected ? "bg-[#efeded]" : ""
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] font-mono mb-2">
                              <span className="border border-black px-1 uppercase tracking-tight font-bold">
                                {inc.severity}
                              </span>
                              <span className="text-[#7e7576]">14:22 UTC</span>
                            </div>
                            <h4 className="text-xs font-bold leading-snug mb-1">
                              {inc.title}
                            </h4>
                            <p className="text-[9px] font-mono text-[#7e7576]">
                              {inc.repository} / {inc.workflow_name}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Incident Details view */}
                  <div className="p-6 flex flex-col gap-6">
                    <div className="flex justify-between items-start border-b border-black pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[9px] font-mono bg-black text-white px-2 py-0.5">
                            CASE #
                            {selectedIncidentId?.slice(0, 8).toUpperCase() ||
                              "INC-942-03"}
                          </span>
                          <span className="text-[9px] font-mono border border-black px-2 py-0.5">
                            {analysis?.category?.toUpperCase() ||
                              "INVESTIGATION IN PROGRESS"}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight uppercase">
                          {selectedIncident?.title ||
                            "DATABASE CONNECTION TIMEOUT"}
                        </h2>
                        <p className="text-xs leading-relaxed text-[#4c4546] max-w-2xl mt-1">
                          {analysis?.summary ||
                            "Forensic analysis of a cascading failure within the " +
                              "primary build service pipeline."}
                        </p>
                      </div>

                      <div className="border border-black bg-white p-4 text-center">
                        <span className="text-[9px] font-mono text-[#7e7576] block uppercase mb-1">
                          AI Confidence
                        </span>
                        <span className="text-3xl font-bold">
                          {analysis
                            ? `${Math.round(analysis.confidence * 100)}%`
                            : "98%"}
                        </span>
                      </div>
                    </div>

                    {loadingAnalysis ? (
                      <div className="border border-black bg-white p-12 text-center flex flex-col items-center justify-center gap-3 font-mono text-xs text-[#1b1c1c] my-6">
                        <RefreshCw className="w-6 h-6 animate-spin text-black" />
                        <span>RUNNING NEURAL PIPELINE CORRELATIONS...</span>
                      </div>
                    ) : (
                      <>
                        {/* Middle details split grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                          {/* Left Column: Root Cause analysis & Latency profile */}
                          <div className="flex flex-col gap-6">
                            <div className="border border-black bg-white p-4">
                              <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                                <FileText className="w-4 h-4" />
                                <span>ROOT CAUSE ANALYSIS</span>
                              </div>
                              <div className="bg-black text-white p-4 font-mono text-[10px] leading-relaxed mb-4">
                                <p className="text-[#cfc4c5]">
                                  DETECTED:{" "}
                                  {analysis?.root_cause ||
                                    "Excessive connection pooling exhaustion caused by " +
                                      "'ORDER BY' operations on non-indexed transaction table."}
                                </p>
                              </div>
                              <div className="border border-black bg-[#fbf9f9] p-3 font-mono text-[9px] text-[#4c4546] overflow-x-auto">
                                <p className="text-[#7e7576]">
                                  SERVICE:{" "}
                                  {selectedIncident?.repository ||
                                    "payment-gateway"}
                                </p>
                                <p className="mt-2 text-[#7e7576]">
                                  WORKFLOW:{" "}
                                  {selectedIncident?.workflow_name ||
                                    "deploy-production"}
                                </p>
                              </div>
                            </div>

                            {/* Latency profile */}
                            <div className="border border-black bg-white p-4">
                              <h3 className="text-xs font-bold tracking-wider uppercase mb-4">
                                Latency Profile
                              </h3>
                              <div className="h-24 flex items-end gap-1 px-4 border-b border-black">
                                {[20, 30, 25, 90, 80, 100, 60, 45, 30].map(
                                  (h, i) => (
                                    <div
                                      key={i}
                                      className="flex-1 bg-black"
                                      style={{ height: `${h}%` }}
                                    ></div>
                                  )
                                )}
                              </div>
                              <div className="flex justify-between text-[8px] font-mono text-[#7e7576] mt-2">
                                <span>T-30M</span>
                                <span>NOW</span>
                                <span>+15M EST</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Timeline & Proposed Remediation/Actions */}
                          <div className="flex flex-col gap-6">
                            <div className="border border-black bg-white p-4">
                              <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                                <Clock className="w-4 h-4" />
                                <span>EVENT TIMELINE</span>
                              </div>
                              <div className="relative border-l border-black ml-3 pl-6 py-2 flex flex-col gap-6">
                                <div className="relative">
                                  <div className="absolute -left-[30px] top-1.5 w-2.5 h-2.5 bg-black rounded-full"></div>
                                  <span className="text-[9px] font-mono text-[#7e7576]">
                                    {selectedIncident
                                      ? new Date(
                                          selectedIncident.created_at
                                        ).toLocaleTimeString()
                                      : "14:22:01"}
                                  </span>
                                  <h4 className="text-xs font-bold mt-1">
                                    Alert: Pipeline Failure
                                  </h4>
                                </div>
                                {executions && executions.length > 0 ? (
                                  executions.map((exec, idx) => (
                                    <div
                                      key={exec.id || idx}
                                      className="relative"
                                    >
                                      <div className="absolute -left-[30px] top-1.5 w-2.5 h-2.5 bg-black rounded-full"></div>
                                      <span className="text-[9px] font-mono text-[#7e7576]">
                                        {new Date(
                                          exec.created_at
                                        ).toLocaleTimeString()}
                                      </span>
                                      <h4 className="text-xs font-bold mt-1">
                                        {exec.agent_name
                                          .replace("_", " ")
                                          .toUpperCase()}
                                        : {exec.status.toUpperCase()}
                                      </h4>
                                    </div>
                                  ))
                                ) : (
                                  <div className="relative">
                                    <div className="absolute -left-[30px] top-1.5 w-2.5 h-2.5 bg-[#7e7576] rounded-full"></div>
                                    <span className="text-[9px] font-mono text-[#7e7576]">
                                      Pending
                                    </span>
                                    <h4 className="text-xs font-bold mt-1">
                                      Agent Orchestration Pending...
                                    </h4>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Proposed remediation steps / issue preview */}
                            <div className="border border-black bg-white p-4 flex flex-col justify-between">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold">
                                  PROPOSED REMEDIATION ACTIONS
                                </span>
                              </div>
                              <div className="border border-[#efeded] p-3 text-xs leading-relaxed">
                                <h4 className="font-bold mb-2">Fix Strategy</h4>
                                <div className="flex flex-col gap-2 text-[11px] text-[#4c4546]">
                                  {analysis?.remediation?.actions ? (
                                    analysis.remediation.actions.map(
                                      (act: string, i: number) => (
                                        <div
                                          key={i}
                                          className="flex gap-2 items-start"
                                        >
                                          <span className="font-mono text-black font-bold">
                                            •
                                          </span>
                                          <span>{act}</span>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className="flex gap-2 items-start">
                                      <span className="font-mono text-black font-bold">
                                        •
                                      </span>
                                      <span>
                                        Run standard auto-remediation to fix
                                        repository dependency problems.
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Similar Past Incidents (RAG Matches) */}
                        {analysis?.similar_incidents &&
                          analysis.similar_incidents.length > 0 && (
                            <div className="border border-black bg-white p-4">
                              <div className="flex items-center gap-2 mb-4 text-xs font-bold">
                                <Layers className="w-4 h-4" />
                                <span>
                                  SIMILAR PAST INCIDENTS (RAG MATCHES)
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysis.similar_incidents.map(
                                  (sim: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="border border-[#efeded] p-3 text-xs leading-relaxed bg-[#fbf9f9] hover:bg-[#efeded] transition-all"
                                    >
                                      <div className="flex justify-between items-start mb-2 border-b border-black/10 pb-1">
                                        <h4 className="font-bold uppercase tracking-tight text-[11px]">
                                          {sim.title || "Untitled Match"}
                                        </h4>
                                        <span className="text-[9px] font-mono border border-black px-1.5 py-0.5 bg-white">
                                          Match: {Math.round(sim.score * 100)}%
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1 text-[10px] text-[#4c4546]">
                                        <p>
                                          <strong>Category:</strong>{" "}
                                          {sim.category}
                                        </p>
                                        <p>
                                          <strong>Root Cause:</strong>{" "}
                                          {sim.root_cause}
                                        </p>
                                        {sim.resolution && (
                                          <p>
                                            <strong>Resolution:</strong>{" "}
                                            {sim.resolution}
                                          </p>
                                        )}
                                        {sim.patch && (
                                          <pre className="mt-2 bg-white p-2 text-[8px] font-mono overflow-x-auto border border-[#efeded]">
                                            {sim.patch}
                                          </pre>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {/* Bottom actions panel */}
                        <div className="flex justify-end gap-3 border-t border-black pt-6 bg-white">
                          <button
                            onClick={() => alert("Alert dismissed")}
                            className="border border-black text-xs font-mono py-2 px-6 hover:bg-black hover:text-white bg-white transition-all duration-100"
                          >
                            DISMISS ALERT
                          </button>
                          <button
                            onClick={triggerRemediation}
                            disabled={remediating || remediationDone}
                            className="bg-black text-white text-xs font-mono py-2 px-6 border border-black hover:bg-white hover:text-black transition-all duration-100 disabled:opacity-50"
                          >
                            {remediating
                              ? "EXECUTING..."
                              : remediationDone
                                ? "REMEDIATED SUCCESSFULLY"
                                : "EXECUTE AUTO-REMEDIATION"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: AGENT WORKFLOWS */}
              {activeTab === "Agent Workflows" && (
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] border-t border-black">
                  {/* Flowchart canvas workspace */}
                  <div className="p-6 flex flex-col gap-6 relative bg-white">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-[#4c4546] font-mono tracking-widest uppercase">
                          ACTIVE FLOWCHART
                        </span>
                        <h2 className="text-xl font-bold tracking-tight uppercase">
                          Agent Orchestration Graph
                        </h2>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!selectedIncidentId) return;
                            setWorkflowStatus("running");
                            const API_BASE_URL =
                              process.env.NEXT_PUBLIC_API_BASE_URL ??
                              "http://localhost:8000";
                            fetch(
                              `${API_BASE_URL}/api/v1/incidents/${selectedIncidentId}/analyze`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({}),
                              }
                            )
                              .then((res) => {
                                if (!res.ok)
                                  throw new Error("Failed to analyze");
                                return res.json();
                              })
                              .then((data) => {
                                setAnalysis(data);
                                fetchExecutions(selectedIncidentId);
                                setWorkflowStatus("completed");
                              })
                              .catch((err) => {
                                console.error(err);
                                setWorkflowStatus("idle");
                              });
                          }}
                          disabled={workflowStatus === "running"}
                          className="border border-black bg-white text-xs font-mono p-1.5 flex items-center gap-1 hover:bg-black hover:text-white disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          {workflowStatus === "running"
                            ? "Running..."
                            : "Run Graph"}
                        </button>
                        <button
                          onClick={() => {
                            setWorkflowStatus("idle");
                            setExecutions([]);
                          }}
                          className="border border-black bg-white text-xs font-mono p-1.5 flex items-center gap-1 hover:bg-black hover:text-white"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                      </div>
                    </div>

                    {/* SVG Graph Canvas */}
                    <div className="flex-1 border border-black bg-[#fbf9f9] min-h-[400px] relative flex items-center justify-center p-6 select-none">
                      {/* Dot Grid Background */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          backgroundImage:
                            "radial-gradient(#000000 1px, transparent 0)",
                          backgroundSize: "20px 20px",
                        }}
                      ></div>

                      {/* SVG Nodes Layout */}
                      <div className="flex flex-wrap items-center justify-center gap-6 relative z-10 w-full max-w-4xl">
                        {/* Trigger Node */}
                        <div className="border border-black bg-white p-4 w-40 shadow-sm flex flex-col transition-all">
                          <span className="text-[8px] font-mono uppercase text-[#7e7576] mb-1">
                            Trigger
                          </span>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                            <h4 className="text-xs font-bold uppercase">
                              Build Failure
                            </h4>
                          </div>
                          <span className="text-[9px] font-mono text-[#7e7576] mt-2">
                            {selectedIncident?.repository || "payment-gateway"}
                          </span>
                        </div>

                        <div className="w-4 h-[1px] bg-black hidden xl:block"></div>

                        {/* Classifier Agent */}
                        <div
                          className={`border p-4 w-40 flex flex-col transition-all duration-300 ${
                            hasClassifier
                              ? "border-black bg-black text-white"
                              : "border-[#cfc4c5] bg-white text-[#7e7576]"
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase mb-1">
                            Agent Node
                          </span>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase">
                              Classifier Agent
                            </h4>
                          </div>
                          <span className="text-[8px] font-mono mt-2">
                            {hasClassifier ? "SUCCESS" : "PENDING"}
                          </span>
                        </div>

                        <div className="w-4 h-[1px] bg-black hidden xl:block"></div>

                        {/* Root Cause Agent */}
                        <div
                          className={`border p-4 w-40 flex flex-col transition-all duration-300 ${
                            hasRootCause
                              ? "border-black bg-black text-white"
                              : "border-[#cfc4c5] bg-white text-[#7e7576]"
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase mb-1">
                            Agent Node
                          </span>
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase">
                              Root Cause Agent
                            </h4>
                          </div>
                          <span className="text-[8px] font-mono mt-2">
                            {hasRootCause ? "SUCCESS" : "PENDING"}
                          </span>
                        </div>

                        <div className="w-4 h-[1px] bg-black hidden xl:block"></div>

                        {/* Retriever Agent */}
                        <div
                          className={`border p-4 w-40 flex flex-col transition-all duration-300 ${
                            hasRetriever
                              ? "border-black bg-black text-white"
                              : "border-[#cfc4c5] bg-white text-[#7e7576]"
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase mb-1">
                            Agent Node
                          </span>
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase">
                              Retriever Agent
                            </h4>
                          </div>
                          <span className="text-[8px] font-mono mt-2">
                            {hasRetriever ? "SUCCESS" : "PENDING"}
                          </span>
                        </div>

                        <div className="w-4 h-[1px] bg-black hidden xl:block"></div>

                        {/* Fix Generator Agent */}
                        <div
                          className={`border p-4 w-40 flex flex-col transition-all duration-300 ${
                            hasFixGenerator
                              ? "border-black bg-black text-white"
                              : "border-[#cfc4c5] bg-white text-[#7e7576]"
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase mb-1">
                            Agent Node
                          </span>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase">
                              Fix Generator
                            </h4>
                          </div>
                          <span className="text-[8px] font-mono mt-2">
                            {hasFixGenerator ? "SUCCESS" : "PENDING"}
                          </span>
                        </div>

                        <div className="w-4 h-[1px] bg-black hidden xl:block"></div>

                        {/* Reporter Agent */}
                        <div
                          className={`border p-4 w-40 flex flex-col transition-all duration-300 ${
                            hasReporter
                              ? "border-black bg-black text-white"
                              : "border-[#cfc4c5] bg-white text-[#7e7576]"
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase mb-1">
                            Agent Node
                          </span>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <h4 className="text-xs font-bold uppercase">
                              Reporter Agent
                            </h4>
                          </div>
                          <span className="text-[8px] font-mono mt-2">
                            {hasReporter ? "COMPLETED" : "PENDING"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar reasoning summary */}
                  <div className="border-l border-black bg-white p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-140px)]">
                    <h3 className="text-xs font-bold tracking-widest uppercase border-b border-black pb-3">
                      AGENT AUDIT LOGS
                    </h3>

                    <div className="flex flex-col gap-4">
                      {executions.length === 0 ? (
                        <p className="text-xs text-[#7e7576] italic font-mono">
                          No executions recorded. Run the graph to analyze the
                          incident.
                        </p>
                      ) : (
                        executions.map((exec, idx) => (
                          <div
                            key={exec.id}
                            className="border border-black bg-[#fbf9f9] p-4 flex flex-col gap-2 transition-all"
                          >
                            <div className="flex justify-between items-center border-b border-[#cfc4c5] pb-2">
                              <span className="text-[10px] font-mono font-bold uppercase tracking-tight text-black">
                                [{idx + 1}] {exec.agent_name.replace("_", " ")}
                              </span>
                              <span className="text-[9px] font-mono text-[#7e7576]">
                                {new Date(exec.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-[10px] font-mono">
                              <strong>STATUS:</strong>{" "}
                              <span className="font-bold uppercase">
                                {exec.status}
                              </span>
                            </p>
                            <details className="mt-1">
                              <summary className="text-[9px] font-mono text-[#7e7576] cursor-pointer hover:text-black">
                                VIEW LOG PAYLOAD
                              </summary>
                              <pre className="mt-2 bg-white border border-[#efeded] p-2 text-[8px] font-mono overflow-x-auto max-h-48">
                                {JSON.stringify(exec.output_payload, null, 2)}
                              </pre>
                            </details>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border border-black bg-[#fbf9f9] p-4 flex flex-col justify-between mt-auto">
                      <span className="text-[9px] font-mono text-[#7e7576] block mb-2 uppercase">
                        RECOMMENDED ACTION
                      </span>
                      <p className="text-xs leading-relaxed mb-4">
                        {analysis?.remediation?.actions?.[0] ||
                          "Rollback service or apply auto-remediation patches."}
                      </p>
                      <button
                        onClick={() => {
                          alert("Remediation execution approved.");
                          setWorkflowStatus("idle");
                        }}
                        className="w-full bg-black text-white font-mono text-xs py-2 border border-black hover:bg-white hover:text-black transition-all"
                      >
                        APPROVE
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: FLEET CONTROL */}
              {activeTab === "Fleet Control" && (
                <div className="p-6 flex flex-col gap-6">
                  <div>
                    <p className="text-[10px] text-[#4c4546] font-mono tracking-widest uppercase">
                      SaaS Fleet Telemetry
                    </p>
                    <h2 className="text-xl font-bold tracking-tight uppercase">
                      Repository Fleet Control
                    </h2>
                  </div>

                  {/* Analytics Summary */}
                  {fleetReport && (
                    <div className="grid grid-cols-1 md:grid-cols-4 border border-black divide-y md:divide-y-0 md:divide-x divide-black bg-white">
                      <div className="p-4 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-[#7e7576] uppercase">
                          Total Fleet Repositories
                        </span>
                        <span className="text-2xl font-bold font-mono">
                          {fleetReport.total_repositories}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-[#7e7576] uppercase">
                          Degraded / Failures
                        </span>
                        <span className="text-2xl font-bold font-mono text-[#ba1a1a]">
                          {fleetReport.active_incidents}
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-[#7e7576] uppercase">
                          Fleet Mean Recovery Time
                        </span>
                        <span className="text-2xl font-bold font-mono">
                          {fleetReport.mttr_seconds}s
                        </span>
                      </div>
                      <div className="p-4 flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-[#7e7576] uppercase">
                          Healthy Fleet Projects
                        </span>
                        <span className="text-2xl font-bold font-mono">
                          {fleetReport.healthy_projects}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Control Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateTeamModal(true)}
                      className="border border-black text-xs font-mono px-4 py-2 hover:bg-black hover:text-white transition-all bg-white"
                    >
                      Create Team
                    </button>
                    <button
                      onClick={() => setShowCreateProjectModal(true)}
                      className="border border-black text-xs font-mono px-4 py-2 hover:bg-black hover:text-white transition-all bg-white"
                    >
                      Create Project
                    </button>
                    <button
                      onClick={() => setShowLinkRepoModal(true)}
                      className="border border-black text-xs font-mono px-4 py-2 hover:bg-black hover:text-white transition-all bg-white"
                    >
                      Link Repository
                    </button>
                  </div>

                  {/* Repositories & Projects Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                    {/* Repository Fleet List */}
                    <div className="border border-black bg-white flex flex-col">
                      <div className="border-b border-black p-4 bg-[#fbf9f9]">
                        <h3 className="text-xs font-bold uppercase font-mono">
                          Fleet Repositories
                        </h3>
                      </div>
                      <div className="divide-y divide-black overflow-auto max-h-[400px]">
                        {fleetReport?.repositories.map((repo) => (
                          <div
                            key={repo.id}
                            className="p-4 flex items-center justify-between hover:bg-[#f5f3f3] transition-all"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono">
                                  {repo.name}
                                </span>
                                {repo.healthy ? (
                                  <span className="text-[8px] bg-black text-white px-1.5 py-0.5 uppercase tracking-widest font-mono">
                                    Healthy
                                  </span>
                                ) : (
                                  <span className="text-[8px] bg-[#ba1a1a] text-white px-1.5 py-0.5 uppercase tracking-widest font-mono">
                                    Degraded
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 text-[10px] text-[#7e7576] font-mono">
                                <span>
                                  Project: {repo.project_name || "None"}
                                </span>
                                <span>•</span>
                                <span>Team: {repo.team_name || "None"}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-right font-mono text-xs">
                              <span>Incidents: {repo.incident_count}</span>
                              <span className="text-[10px] text-[#7e7576]">
                                MTTR: {repo.mttr_seconds}s
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Projects Health */}
                    <div className="border border-black bg-white flex flex-col">
                      <div className="border-b border-black p-4 bg-[#fbf9f9]">
                        <h3 className="text-xs font-bold uppercase font-mono">
                          Project Health Index
                        </h3>
                      </div>
                      <div className="divide-y divide-black overflow-auto max-h-[400px] p-4 flex flex-col gap-4">
                        {fleetReport?.projects.map((proj) => (
                          <div key={proj.id} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold">{proj.name}</span>
                              <span className="font-mono">
                                Score: {proj.health_score}/100
                              </span>
                            </div>
                            <div className="w-full h-1 bg-[#efeded]">
                              <div
                                className="h-full bg-black"
                                style={{ width: `${proj.health_score}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-[#7e7576] font-mono">
                              <span>Fail Rate: {proj.failure_rate * 100}%</span>
                              <span>Incidents: {proj.incident_count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Create Team Modal */}
                  {showCreateTeamModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white border border-black p-6 w-full max-w-sm flex flex-col gap-4">
                        <h3 className="text-xs font-bold uppercase font-mono">
                          Create SaaS Team
                        </h3>
                        <form
                          onSubmit={handleCreateTeam}
                          className="flex flex-col gap-4"
                        >
                          <input
                            type="text"
                            placeholder="Team Name"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            className="border border-black text-xs font-mono p-2 w-full outline-none"
                          />
                          <div className="flex justify-end gap-2 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setShowCreateTeamModal(false)}
                              className="border border-black px-3 py-1 hover:bg-[#f5f3f3]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-black text-white px-3 py-1 border border-black hover:bg-white hover:text-black"
                            >
                              Create
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Create Project Modal */}
                  {showCreateProjectModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white border border-black p-6 w-full max-w-sm flex flex-col gap-4">
                        <h3 className="text-xs font-bold uppercase font-mono">
                          Create Project Group
                        </h3>
                        <form
                          onSubmit={handleCreateProject}
                          className="flex flex-col gap-4"
                        >
                          <input
                            type="text"
                            placeholder="Project Name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="border border-black text-xs font-mono p-2 w-full outline-none"
                            required
                          />
                          <textarea
                            placeholder="Description"
                            value={newProjectDesc}
                            onChange={(e) => setNewProjectDesc(e.target.value)}
                            className="border border-black text-xs font-mono p-2 w-full outline-none h-20"
                          />
                          <select
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="border border-black text-xs font-mono p-2 w-full outline-none"
                          >
                            <option value="">Assign to Team (Optional)</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-end gap-2 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setShowCreateProjectModal(false)}
                              className="border border-black px-3 py-1 hover:bg-[#f5f3f3]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-black text-white px-3 py-1 border border-black hover:bg-white hover:text-black"
                            >
                              Create
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Link Repository Modal */}
                  {showLinkRepoModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white border border-black p-6 w-full max-w-sm flex flex-col gap-4">
                        <h3 className="text-xs font-bold uppercase font-mono">
                          Link Repository to Project
                        </h3>
                        <form
                          onSubmit={handleLinkRepo}
                          className="flex flex-col gap-4"
                        >
                          <select
                            value={selectedRepoId}
                            onChange={(e) => setSelectedRepoId(e.target.value)}
                            className="border border-black text-xs font-mono p-2 w-full outline-none"
                            required
                          >
                            <option value="">Select Repository</option>
                            {fleetReport?.repositories.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedProjectId}
                            onChange={(e) =>
                              setSelectedProjectId(e.target.value)
                            }
                            className="border border-black text-xs font-mono p-2 w-full outline-none"
                            required
                          >
                            <option value="">Select Project</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex justify-end gap-2 text-xs font-mono">
                            <button
                              type="button"
                              onClick={() => setShowLinkRepoModal(false)}
                              className="border border-black px-3 py-1 hover:bg-[#f5f3f3]"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-black text-white px-3 py-1 border border-black hover:bg-white hover:text-black"
                            >
                              Link
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: OTHER FALLBACKS */}
              {activeTab !== "Dashboard" &&
                activeTab !== "Incidents" &&
                activeTab !== "Agent Workflows" &&
                activeTab !== "Fleet Control" && (
                  <div className="p-8 flex flex-col items-center justify-center text-center gap-4 flex-1">
                    <AlertTriangle className="w-8 h-8 text-black" />
                    <h3 className="text-sm font-bold uppercase">
                      {activeTab} Workspace
                    </h3>
                    <p className="text-xs text-[#7e7576] max-w-sm">
                      This workflow space is simulated and integrated with
                      active DevOps pipelines. Run log analysis or visit the
                      Dashboard/Incidents for real-time controls.
                    </p>
                  </div>
                )}
            </>
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="bg-white border-t border-black p-4 grid grid-cols-2 md:grid-cols-5 text-center items-center divide-x divide-black text-[11px] font-mono">
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            CONNECTION STATUS
          </span>
          <span className="font-bold">
            {health.status === "ok" ? "ACTIVE" : "OFFLINE"}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            SUCCESS RATE
          </span>
          <span className="font-bold text-black flex items-center justify-center gap-1">
            {successRate}%
          </span>
        </div>
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            AI CONFIDENCE
          </span>
          <span className="font-bold">{avgConfidence}</span>
        </div>
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            SYSTEM HEALTH
          </span>
          <span className="font-bold">{health.status.toUpperCase()}</span>
        </div>
        <div className="flex justify-center items-center py-1 col-span-2 md:col-span-1">
          <button
            onClick={() => alert("Exposing agent debug logs...")}
            className="border border-black bg-white py-1.5 px-4 text-[9px] hover:bg-black hover:text-white transition-all"
          >
            VIEW LOGS
          </button>
        </div>
      </footer>
    </div>
  );
}
