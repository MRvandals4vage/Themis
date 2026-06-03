const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function getHealth() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    next: { revalidate: 15 },
  });
  if (!response.ok) {
    throw new Error("Themis API health check failed");
  }
  return response.json() as Promise<{ status: string; service: string }>;
}

export type DashboardSummary = {
  active_incidents: number;
  failed_pipelines: number;
  pipeline_history: Array<{
    id: string;
    repository: string;
    workflow_name: string;
    branch: string;
    commit_sha: string;
    status: string;
    conclusion: string | null;
    completed_at: string | null;
  }>;
  mttr_seconds: number;
  recent_failures: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    repository: string;
    workflow_name: string;
    created_at: string;
  }>;
};

export async function getDashboardSummary() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/dashboard`, {
    next: { revalidate: 10 },
  });
  if (!response.ok) {
    throw new Error("Themis dashboard summary request failed");
  }
  return response.json() as Promise<DashboardSummary>;
}

export type FleetRepositoryAnalytics = {
  id: string;
  name: string;
  healthy: boolean;
  incident_count: number;
  mttr_seconds: number;
  project_name: string | null;
  team_name: string | null;
};

export type ProjectAnalytics = {
  id: string;
  name: string;
  failure_rate: number;
  incident_count: number;
  health_score: number;
};

export type FleetAnalyticsReport = {
  total_repositories: number;
  active_incidents: number;
  mttr_seconds: number;
  healthy_projects: number;
  repositories: Array<FleetRepositoryAnalytics>;
  projects: Array<ProjectAnalytics>;
};

export async function getFleetAnalytics() {
  const response = await fetch(`${API_BASE_URL}/api/v1/analytics/fleet`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Themis fleet analytics request failed");
  }
  return response.json() as Promise<FleetAnalyticsReport>;
}
