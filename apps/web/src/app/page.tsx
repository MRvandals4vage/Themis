import { Activity, Clock, GitBranch, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardSummary, getHealth } from "@/lib/api";

export default async function Home() {
  const health = await getHealth().catch(() => ({
    status: "degraded",
    service: "themis-api",
  }));
  const dashboard = await getDashboardSummary().catch(() => ({
    active_incidents: 0,
    failed_pipelines: 0,
    pipeline_history: [],
    mttr_seconds: 0,
    recent_failures: [],
  }));
  const metrics = [
    {
      label: "Active incidents",
      value: String(dashboard.active_incidents),
      icon: Activity,
    },
    {
      label: "Failed pipelines",
      value: String(dashboard.failed_pipelines),
      icon: GitBranch,
    },
    {
      label: "MTTR",
      value: formatDuration(dashboard.mttr_seconds),
      icon: Clock,
    },
  ];

  return (
    <main className="min-h-screen">
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Themis</p>
              <h1 className="text-lg font-semibold">
                DevOps Intelligence Console
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm">
            API: {health.status}
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-2 text-sm text-muted-foreground">
          {[
            "Overview",
            "Incidents",
            "Pipelines",
            "Repositories",
            "Agents",
            "RAG Knowledge",
          ].map((item) => (
            <Button
              key={item}
              variant={item === "Overview" ? "default" : "ghost"}
              className="justify-start"
            >
              {item}
            </Button>
          ))}
        </aside>

        <section className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-muted-foreground">
              GitHub Actions integration
            </p>
            <h2 className="text-3xl font-semibold">
              Live CI/CD failure intelligence
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {metric.label}
                    <metric.icon className="text-primary" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pipeline history</CardTitle>
              <CardDescription>
                Normalized CI/CD executions received from webhook ingestion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {dashboard.pipeline_history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No pipeline runs ingested yet.
                  </p>
                ) : (
                  dashboard.pipeline_history.map((run) => (
                    <div
                      key={run.id}
                      className="grid gap-2 rounded-md border bg-background p-3 md:grid-cols-[1.5fr_1fr_1fr_120px]"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {run.workflow_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {run.repository}
                        </p>
                      </div>
                      <p className="text-sm">{run.branch}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {run.commit_sha.slice(0, 8)}
                      </p>
                      <p className="text-sm capitalize">
                        {run.conclusion ?? run.status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent failures</CardTitle>
              <CardDescription>
                Incidents created automatically from failed pipeline executions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {dashboard.recent_failures.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active failures have been recorded.
                  </p>
                ) : (
                  dashboard.recent_failures.map((incident) => (
                    <div
                      key={incident.id}
                      className="rounded-md border bg-background p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{incident.title}</p>
                        <p className="text-xs uppercase text-muted-foreground">
                          {incident.severity}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {incident.repository} / {incident.workflow_name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function formatDuration(seconds: number) {
  if (seconds <= 0) {
    return "0m";
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.round(minutes / 60)}h`;
}
