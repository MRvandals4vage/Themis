import { Activity, Bot, GitBranch, ShieldCheck, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHealth } from "@/lib/api";

const metrics = [
  { label: "Open incidents", value: "0", icon: Activity },
  { label: "Connected repositories", value: "0", icon: GitBranch },
  { label: "Agent runs today", value: "0", icon: Bot },
];

const workflow = [
  "Failure Event",
  "Classifier",
  "Root Cause",
  "RAG Retrieval",
  "Fix Recommendation",
  "Reporter",
];

export default async function Home() {
  const health = await getHealth().catch(() => ({
    status: "degraded",
    service: "themis-api",
  }));

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
              Production foundation
            </p>
            <h2 className="text-3xl font-semibold">
              Autonomous CI/CD failure intelligence
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
              <CardTitle>Agent workflow</CardTitle>
              <CardDescription>
                Initial LangGraph topology for failed pipeline investigations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-6">
                {workflow.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-md border bg-background p-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <p className="text-sm font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
