"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { getDashboardSummary, getHealth, DashboardSummary } from "@/lib/api";

type Tab =
  | "Dashboard"
  | "Incidents"
  | "Pipelines"
  | "AI Analysis"
  | "Knowledge Base"
  | "Agent Workflows"
  | "Reports"
  | "Settings";

export default function Home() {
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

  const selectedIncident = dashboard.recent_failures.find(
    (inc) => inc.id === selectedIncidentId
  );

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
      })
      .catch((err) => {
        console.error(err);
        setAnalysis(null);
      })
      .finally(() => {
        setLoadingAnalysis(false);
      });
  }, [selectedIncidentId]);

  useEffect(() => {
    // Fetch API health and dashboard data on load
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
        // Mock fallback if backend is offline/local only
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
              id: "inc-1",
              title: "Database Connection Timeout in us-east-1",
              severity: "critical",
              status: "open",
              repository: "payment-gateway",
              workflow_name: "deploy-production",
              created_at: new Date().toISOString(),
            },
            {
              id: "inc-2",
              title: "Auth-Service Latency Spike",
              severity: "high",
              status: "investigating",
              repository: "auth-service",
              workflow_name: "api-test",
              created_at: new Date().toISOString(),
            },
            {
              id: "inc-3",
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
        setSelectedIncidentId("inc-1");
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
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] tracking-tighter">
              JD
            </div>
            <span className="font-mono text-[10px] hidden lg:inline-block">
              API: {health.status}
            </span>
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
                    <span className="text-xs font-mono text-[#ba1a1a] font-bold">
                      +2
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                    Across active Kubernetes contexts
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
                      0{dashboard.failed_pipelines}
                    </span>
                    <span className="text-[10px] font-mono text-[#7e7576]">
                      stable
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                    Last 24 hours
                  </p>
                </div>

                <div className="border border-black bg-white p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[#4c4546]">
                    <span className="text-[10px] font-mono uppercase tracking-wider">
                      AI Resolution Rate
                    </span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold">89%</span>
                    <span className="text-[10px] font-mono text-[#7e7576]">
                      ↑ 5%
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                    Autonomous fixes applied
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
                    <span className="text-3xl font-bold">18m</span>
                    <span className="text-[10px] font-mono text-[#7e7576]">
                      ↓ 12m
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7e7576] mt-1 font-mono">
                    Industry average: 4.2h
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
                          <span className="w-2.5 h-2.5 bg-black"></span> Success
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
                          {[
                            {
                              name: "payment-gateway",
                              env: "Production",
                              err: "Timeout 504",
                              dur: "14m",
                              status: "CRITICAL",
                            },
                            {
                              name: "user-profile-db",
                              env: "Staging",
                              err: "Connection Refused",
                              dur: "2m",
                              status: "RESOLVED",
                            },
                            {
                              name: "cdn-edge-cache",
                              env: "Production",
                              err: "SSL Handshake",
                              dur: "45m",
                              status: "ONGOING",
                            },
                            {
                              name: "search-indexer",
                              env: "Development",
                              err: "OOM Kill",
                              dur: "8m",
                              status: "WARNING",
                            },
                          ].map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-[#efeded] last:border-b-0 hover:bg-[#f5f3f3]"
                            >
                              <td className="py-2.5 font-bold">{row.name}</td>
                              <td className="py-2.5">{row.env}</td>
                              <td className="py-2.5 text-[#ba1a1a]">
                                {row.err}
                              </td>
                              <td className="py-2.5">{row.dur}</td>
                              <td className="py-2.5">
                                <span className="border border-black px-1.5 py-0.5 text-[9px] font-bold">
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
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

                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#cfc4c5] uppercase">
                      Anomaly Detected
                    </span>
                    <p className="text-xs leading-relaxed font-light">
                      Unusual latency spike in &apos;auth-service&apos; v2.4.
                      Probability of cascaded failure: 72%.
                    </p>
                    <button
                      onClick={() => setActiveTab("Incidents")}
                      className="w-fit text-[10px] font-mono border border-white text-white py-1 px-3 mt-2 hover:bg-white hover:text-black transition-all"
                    >
                      RESOLVE NOW
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#cfc4c5] uppercase">
                      Optimization
                    </span>
                    <p className="text-xs leading-relaxed font-light">
                      K8s cluster &apos;pro-east-1&apos; is over-provisioned by
                      40%. Estimated savings: $4.2k/mo.
                    </p>
                    <button className="w-fit text-[10px] font-mono border border-white text-white py-1 px-3 mt-2 hover:bg-white hover:text-black transition-all">
                      VIEW PLAN
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-mono tracking-widest text-[#cfc4c5] uppercase">
                      Security Advisory
                    </span>
                    <p className="text-xs leading-relaxed font-light">
                      Exposed API endpoint detected in
                      &apos;billing-adapter&apos;. Auto-patching initiated.
                    </p>
                  </div>
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
                      {selectedIncident?.title || "DATABASE CONNECTION TIMEOUT"}
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
                          {selectedIncident?.repository || "payment-gateway"}
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
                        {[20, 30, 25, 90, 80, 100, 60, 45, 30].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-black"
                            style={{ height: `${h}%` }}
                          ></div>
                        ))}
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
                          <div className="absolute -left-[30px] top-1.5 w-2 h-2 bg-black rounded-full"></div>
                          <span className="text-[9px] font-mono text-[#7e7576]">
                            14:22:01
                          </span>
                          <h4 className="text-xs font-bold mt-1">
                            Alert: Pipeline Failure
                          </h4>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[30px] top-1.5 w-2 h-2 bg-black rounded-full"></div>
                          <span className="text-[9px] font-mono text-[#7e7576]">
                            14:22:15
                          </span>
                          <h4 className="text-xs font-bold mt-1">
                            AI Agent scanning build logs
                          </h4>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[30px] top-1.5 w-2 h-2 bg-black rounded-full"></div>
                          <span className="text-[9px] font-mono text-[#7e7576]">
                            14:22:48
                          </span>
                          <h4 className="text-xs font-bold mt-1">
                            Identified Root Cause
                          </h4>
                        </div>
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
                                <div key={i} className="flex gap-2 items-start">
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
                                Run standard auto-remediation to fix repository
                                dependency problems.
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
                        <span>SIMILAR PAST INCIDENTS (RAG MATCHES)</span>
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
                                  <strong>Category:</strong> {sim.category}
                                </p>
                                <p>
                                  <strong>Root Cause:</strong> {sim.root_cause}
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
                        setWorkflowStatus("running");
                        setWorkflowSteps(0);
                      }}
                      className="border border-black bg-white text-xs font-mono p-1.5 flex items-center gap-1 hover:bg-black hover:text-white"
                    >
                      <Play className="w-3.5 h-3.5" /> Run Graph
                    </button>
                    <button
                      onClick={() => {
                        setWorkflowStatus("idle");
                        setWorkflowSteps(0);
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
                  <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 relative z-10 w-full max-w-3xl">
                    {/* Trigger Node */}
                    <div className="border border-black bg-white p-4 w-44 shadow-sm flex flex-col">
                      <span className="text-[8px] font-mono uppercase text-[#7e7576] mb-1">
                        Trigger
                      </span>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#ba1a1a]" />
                        <h4 className="text-xs font-bold uppercase">
                          PagerDuty Alert
                        </h4>
                      </div>
                      <span className="text-[9px] font-mono text-[#7e7576] mt-2">
                        prod-cluster-01
                      </span>
                    </div>

                    <div className="w-6 h-[1px] bg-black hidden md:block"></div>

                    {/* Classifier Node */}
                    <div
                      className={`border p-4 w-44 flex flex-col transition-all duration-300 ${
                        workflowSteps >= 1
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
                        LLM-Gpt4o-v2
                      </span>
                    </div>

                    <div className="w-6 h-[1px] bg-black hidden md:block"></div>

                    {/* Root Cause Node */}
                    <div className="flex flex-col gap-4">
                      <div
                        className={`border p-4 w-44 flex flex-col transition-all duration-300 ${
                          workflowSteps >= 2
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
                          K8s-Specialist
                        </span>
                      </div>

                      <div
                        className={`border p-4 w-44 flex flex-col transition-all duration-300 ${
                          workflowSteps >= 3
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
                            Log Analyzer
                          </h4>
                        </div>
                        <span className="text-[8px] font-mono mt-2">
                          CloudWatch-Reader
                        </span>
                      </div>
                    </div>

                    <div className="w-6 h-[1px] bg-black hidden md:block"></div>

                    {/* Resolution Node */}
                    <div
                      className={`border p-4 w-44 flex flex-col transition-all duration-300 ${
                        workflowSteps >= 4
                          ? "border-black bg-white text-black"
                          : "border-[#cfc4c5] bg-white text-[#7e7576]"
                      }`}
                    >
                      <span className="text-[8px] font-mono uppercase mb-1">
                        Resolution
                      </span>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-black" />
                        <h4 className="text-xs font-bold uppercase">
                          Slack Notify
                        </h4>
                      </div>
                      <span className="text-[8px] font-mono mt-2">
                        #ops-critical
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar reasoning summery */}
              <div className="border-l border-black bg-white p-6 flex flex-col gap-6">
                <h3 className="text-xs font-bold tracking-widest uppercase border-b border-black pb-3">
                  REASONING SUMMARY
                </h3>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-mono tracking-wider text-[#7e7576] uppercase">
                    ● ACTIVE TRACE
                  </span>
                  <div className="border-l-2 border-black pl-4 py-1 text-xs">
                    {workflowSteps >= 1 ? (
                      <p className="leading-relaxed">
                        <strong>Classifier:</strong> Identified alert as
                        &quot;High Priority&quot; based on latency threshold
                        breaches (&gt;500ms).
                      </p>
                    ) : (
                      <p className="text-[#7e7576] italic font-mono">
                        Trace pending...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-mono tracking-wider text-[#7e7576] uppercase">
                    STEP ANALYSIS
                  </span>
                  <div className="flex flex-col gap-2 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span>[1] Fetch K8s Pod logs</span>
                      <span
                        className={
                          workflowSteps >= 1
                            ? "text-black font-bold"
                            : "text-[#7e7576]"
                        }
                      >
                        {workflowSteps >= 1 ? "DONE" : "PENDING"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>[2] Parse memory metrics</span>
                      <span
                        className={
                          workflowSteps >= 2
                            ? "text-black font-bold"
                            : "text-[#7e7576]"
                        }
                      >
                        {workflowSteps >= 2 ? "DONE" : "PENDING"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>[3] Cross-ref with Git history</span>
                      <span
                        className={
                          workflowSteps >= 3
                            ? "text-black font-bold"
                            : "text-[#7e7576]"
                        }
                      >
                        {workflowSteps >= 3 ? "DONE" : "PENDING"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>[4] Identifying candidate code</span>
                      <span
                        className={
                          workflowSteps >= 4
                            ? "text-black font-bold"
                            : "text-[#7e7576]"
                        }
                      >
                        {workflowSteps >= 4 ? "v2.4.1-rc2" : "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-mono tracking-wider text-[#7e7576] uppercase">
                    CONFIDENCE SCORE
                  </span>
                  <div className="w-full bg-[#efeded] h-2">
                    <div
                      className="bg-black h-full transition-all duration-500"
                      style={{ width: workflowSteps >= 2 ? "88%" : "0%" }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[#7e7576]">
                    <span>{workflowSteps >= 2 ? "88% Probability" : "0%"}</span>
                    <span>THRESHOLD: 75%</span>
                  </div>
                </div>

                <div className="border border-black bg-[#fbf9f9] p-4 flex flex-col justify-between mt-auto">
                  <span className="text-[9px] font-mono text-[#7e7576] block mb-2 uppercase">
                    RECOMMENDED ACTION
                  </span>
                  <p className="text-xs leading-relaxed mb-4">
                    Rollback service &apos;billing-api&apos; to stable version
                    &apos;v2.4.0&apos;.
                  </p>
                  <button
                    onClick={() => {
                      alert("Remediation execution approved.");
                      setWorkflowStatus("idle");
                      setWorkflowSteps(0);
                    }}
                    className="w-full bg-black text-white font-mono text-xs py-2 border border-black hover:bg-white hover:text-black transition-all"
                  >
                    APPROVE
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OTHER FALLBACKS */}
          {activeTab !== "Dashboard" &&
            activeTab !== "Incidents" &&
            activeTab !== "Agent Workflows" && (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-4 flex-1">
                <AlertTriangle className="w-8 h-8 text-black" />
                <h3 className="text-sm font-bold uppercase">
                  {activeTab} Workspace
                </h3>
                <p className="text-xs text-[#7e7576] max-w-sm">
                  This workflow space is simulated and integrated with active
                  DevOps pipelines. Run log analysis or visit the
                  Dashboard/Incidents for real-time controls.
                </p>
              </div>
            )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="bg-white border-t border-black p-4 grid grid-cols-2 md:grid-cols-5 text-center items-center divide-x divide-black text-[11px] font-mono">
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            THROUGHPUT
          </span>
          <span className="font-bold">12.4 req/s</span>
        </div>
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            SUCCESS RATE
          </span>
          <span className="font-bold text-[#ba1a1a] flex items-center justify-center gap-1">
            99.8% <span className="text-[9px]">↗</span>
          </span>
        </div>
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            AI CONFIDENCE
          </span>
          <span className="font-bold">88.2% AVG</span>
        </div>
        <div className="flex flex-col gap-0.5 justify-center py-1">
          <span className="text-[8px] text-[#7e7576] uppercase">
            SYSTEM HEALTH
          </span>
          <span className="font-bold">STABLE</span>
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
