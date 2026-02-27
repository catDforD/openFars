import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  controlRun,
  createProject,
  createRun,
  getArtifacts,
  getJobs,
  getLatestRun,
  getProjects,
  getRun,
  getStats,
  getSteps,
  type RunControlAction,
} from '@/api/client';
import { RunWebSocketClient, type RunEvent } from '@/realtime/ws';
import type { Artifact, ExperimentStep, Job, Project, Run, Stats } from '@/types';

const DEFAULT_STATS: Stats = {
  runId: '',
  hypothesis: 0,
  papers: 0,
  tokens: '0',
  cost: '0.00',
  elapsedTime: '00:00:00',
  tokenCostUsd: 0,
  gpuHours: 0,
};

function upsertStep(steps: ExperimentStep[], incoming: ExperimentStep): ExperimentStep[] {
  const index = steps.findIndex((step) => step.id === incoming.id);
  if (index < 0) {
    return [...steps, incoming].sort((a, b) => a.number - b.number);
  }
  const cloned = [...steps];
  cloned[index] = incoming;
  return cloned;
}

interface SnapshotPayload {
  run?: Run;
  steps?: ExperimentStep[];
  jobs?: Job[];
  artifacts?: Artifact[];
  stats?: Stats;
}

export function useRunStore() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [run, setRun] = useState<Run | null>(null);
  const [steps, setSteps] = useState<ExperimentStep[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [paperTitle, setPaperTitle] = useState('OpenFARS Autonomous Research Pipeline');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<RunWebSocketClient | null>(null);

  const disconnectWebsocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const handleRunEvent = useCallback((event: RunEvent) => {
    const payload = (event.payload ?? {}) as SnapshotPayload & {
      step?: ExperimentStep;
      job?: Job;
      artifact?: Artifact;
      run?: Run;
      stats?: Stats;
    };

    switch (event.event) {
      case 'snapshot':
        setRun(payload.run ?? null);
        setSteps(payload.steps ?? []);
        setJobs(payload.jobs ?? []);
        setArtifacts(payload.artifacts ?? []);
        setStats(payload.stats ?? DEFAULT_STATS);
        return;
      case 'run_started':
      case 'run_completed':
      case 'run_failed':
        if (payload.run) {
          setRun(payload.run);
        }
        if (payload.stats) {
          setStats(payload.stats);
        }
        if (payload.artifacts) {
          setArtifacts(payload.artifacts);
        }
        return;
      case 'step_updated':
        if (payload.step) {
          setSteps((current) => upsertStep(current, payload.step as ExperimentStep));
        }
        if (payload.run) {
          setRun(payload.run);
        }
        return;
      case 'job_log_appended':
        if (payload.job) {
          setJobs((current) => [payload.job as Job, ...current]);
        }
        return;
      case 'artifact_created':
        if (payload.artifact) {
          setArtifacts((current) => [payload.artifact as Artifact, ...current]);
        }
        return;
      case 'stats_updated':
        if (payload.stats) {
          setStats(payload.stats as Stats);
        }
        return;
      default:
        return;
    }
  }, []);

  const connectWebsocket = useCallback(
    (runId: string) => {
      disconnectWebsocket();
      const client = new RunWebSocketClient();
      wsRef.current = client;
      client.connect(runId, handleRunEvent, setConnected);
    },
    [disconnectWebsocket, handleRunEvent],
  );

  const hydrateRun = useCallback(
    async (runId: string) => {
      const [nextRun, nextSteps, nextJobs, nextArtifacts, nextStats] = await Promise.all([
        getRun(runId),
        getSteps(runId),
        getJobs(runId),
        getArtifacts(runId),
        getStats(runId),
      ]);

      setRun(nextRun);
      setSteps(nextSteps);
      setJobs(nextJobs);
      setArtifacts(nextArtifacts);
      setStats(nextStats);
      connectWebsocket(runId);
    },
    [connectWebsocket],
  );

  const ensureProjectRun = useCallback(
    async (projectId: string) => {
      let nextRun = await getLatestRun(projectId);
      if (!nextRun) {
        nextRun = await createRun(projectId, true);
      }
      await hydrateRun(nextRun.id);
    },
    [hydrateRun],
  );

  const reloadProjects = useCallback(async (): Promise<Project[]> => {
    const list = await getProjects();
    if (list.length > 0) {
      setProjects(list);
      return list;
    }

    const seed = await createProject('OpenFARS Demo Project');
    const seededList = [seed];
    setProjects(seededList);
    return seededList;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await reloadProjects();
        if (cancelled || list.length === 0) {
          return;
        }
        const project = list[0];
        setSelectedProjectId(project.id);
        setPaperTitle(`${project.name} - OpenFARS Autonomous Research Pipeline`);
        await ensureProjectRun(project.id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to initialize OpenFARS session');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
      disconnectWebsocket();
    };
  }, [disconnectWebsocket, ensureProjectRun, reloadProjects]);

  const selectProject = useCallback(
    async (projectId: string) => {
      if (projectId === selectedProjectId) {
        return;
      }
      setSelectedProjectId(projectId);
      setError(null);

      const project = projects.find((item) => item.id === projectId);
      if (project) {
        setPaperTitle(`${project.name} - OpenFARS Autonomous Research Pipeline`);
      }

      try {
        await ensureProjectRun(projectId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to switch project');
      }
    },
    [ensureProjectRun, projects, selectedProjectId],
  );

  const createAndSelectProject = useCallback(async () => {
    setError(null);
    try {
      const project = await createProject(`OpenFARS-${Date.now().toString().slice(-6)}`);
      setProjects((current) => [project, ...current]);
      setSelectedProjectId(project.id);
      setPaperTitle(`${project.name} - OpenFARS Autonomous Research Pipeline`);
      await ensureProjectRun(project.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  }, [ensureProjectRun]);

  const sendControl = useCallback(
    async (action: RunControlAction) => {
      if (!run) {
        return;
      }
      try {
        await controlRun(run.id, action);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to ${action} run`);
      }
    },
    [run],
  );

  return useMemo(
    () => ({
      projects,
      selectedProjectId,
      run,
      steps,
      jobs,
      artifacts,
      stats,
      paperTitle,
      connected,
      loading,
      error,
      selectProject,
      createAndSelectProject,
      sendControl,
    }),
    [
      projects,
      selectedProjectId,
      run,
      steps,
      jobs,
      artifacts,
      stats,
      paperTitle,
      connected,
      loading,
      error,
      selectProject,
      createAndSelectProject,
      sendControl,
    ],
  );
}
