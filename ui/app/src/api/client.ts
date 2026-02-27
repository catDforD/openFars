import type { Artifact, ExperimentStep, Job, Project, Run, Stats } from '@/types';

export type RunControlAction = 'pause' | 'resume' | 'cancel' | 'retry';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

interface ApiResponse<T> {
  [key: string]: T;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export async function getProjects(): Promise<Project[]> {
  const data = await requestJson<ApiResponse<Project[]>>('/api/projects');
  return data.projects;
}

export async function createProject(name: string): Promise<Project> {
  const data = await requestJson<ApiResponse<Project>>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return data.project;
}

export async function createRun(projectId: string, autoStart = true): Promise<Run> {
  const data = await requestJson<ApiResponse<Run>>(`/api/projects/${projectId}/runs`, {
    method: 'POST',
    body: JSON.stringify({ autoStart }),
  });
  return data.run;
}

export async function getLatestRun(projectId: string): Promise<Run | null> {
  const data = await requestJson<ApiResponse<Run | null>>(`/api/projects/${projectId}/runs/latest`);
  return data.run;
}

export async function getRun(runId: string): Promise<Run> {
  const data = await requestJson<ApiResponse<Run>>(`/api/runs/${runId}`);
  return data.run;
}

export async function getSteps(runId: string): Promise<ExperimentStep[]> {
  const data = await requestJson<ApiResponse<ExperimentStep[]>>(`/api/runs/${runId}/steps`);
  return data.steps;
}

export async function getJobs(runId: string): Promise<Job[]> {
  const data = await requestJson<ApiResponse<Job[]>>(`/api/runs/${runId}/jobs`);
  return data.jobs;
}

export async function getArtifacts(runId: string): Promise<Artifact[]> {
  const data = await requestJson<ApiResponse<Artifact[]>>(`/api/runs/${runId}/artifacts`);
  return data.artifacts;
}

export async function getStats(runId: string): Promise<Stats> {
  const data = await requestJson<ApiResponse<Stats>>(`/api/runs/${runId}/stats`);
  return data.stats;
}

export async function controlRun(runId: string, action: RunControlAction): Promise<void> {
  await requestJson(`/api/runs/${runId}/control`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export { API_BASE };
