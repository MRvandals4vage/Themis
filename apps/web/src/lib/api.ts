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
