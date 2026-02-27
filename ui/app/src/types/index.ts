// 项目状态
export type ProjectStatus = 'in_progress' | 'completed';

// 运行状态
export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

// 步骤状态
export type StepStatus = 'completed' | 'running' | 'pending' | 'error';

// 项目
export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

// 子步骤
export interface SubStep {
  id: string;
  content: string;
  status: StepStatus;
}

// 实验步骤
export interface ExperimentStep {
  id: string;
  runId: string;
  stepKey: string;
  number: number;
  title: string;
  status: StepStatus;
  startedAt?: string | null;
  endedAt?: string | null;
  errorMessage?: string | null;
  subSteps?: SubStep[];
}

// 任务
export interface Job {
  id: string;
  runId: string;
  stepId?: string | null;
  time: string;
  title: string;
  content: string;
  status: StepStatus;
  workedFor: string;
  source: string;
  level: string;
  raw: string;
  createdAt: string;
}

// 阶段
export type Stage = 'ideation' | 'planning' | 'experiment' | 'writing';

// 统计数据
export interface Stats {
  runId: string;
  hypothesis: number;
  papers: number;
  tokens: string;
  cost: string;
  elapsedTime: string;
  tokenCostUsd: number;
  gpuHours: number;
}

// 运行
export interface Run {
  id: string;
  projectId: string;
  status: RunStatus;
  currentStepIndex: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
}

// 产物
export interface Artifact {
  id: string;
  runId: string;
  stepId?: string | null;
  path: string;
  size: number;
  sha256: string;
  createdAt: string;
}
