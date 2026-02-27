import type { Project, ExperimentStep, Job, Stats } from '@/types';

const MOCK_TIMESTAMP = '2026-02-27T00:00:00Z';

// 项目列表
const projectSeed: Array<Pick<Project, 'id' | 'name' | 'status'>> = [
  { id: 'FA0199', name: 'FA0199', status: 'in_progress' },
  { id: 'FA0255', name: 'FA0255', status: 'in_progress' },
  { id: 'FA0213', name: 'FA0213', status: 'in_progress' },
  { id: 'FA0245', name: 'FA0245', status: 'in_progress' },
  { id: 'FA0205', name: 'FA0205', status: 'in_progress' },
  { id: 'FA0086', name: 'FA0086', status: 'in_progress' },
  { id: 'FA0127', name: 'FA0127', status: 'in_progress' },
  { id: 'FA0179', name: 'FA0179', status: 'in_progress' },
  { id: 'FA0156', name: 'FA0156', status: 'in_progress' },
];

export const projects: Project[] = projectSeed.map((project) => ({
  ...project,
  createdAt: MOCK_TIMESTAMP,
  updatedAt: MOCK_TIMESTAMP,
}));

// 实验步骤
const stepSeed: Array<Pick<ExperimentStep, 'id' | 'number' | 'title' | 'status' | 'subSteps'>> = [
  {
    id: 'step-1',
    number: 1,
    title: 'Dependencies Installation and Project Structure Initialization',
    status: 'completed',
  },
  {
    id: 'step-2',
    number: 2,
    title: 'KIVI/KV2 Baseline on Qwen2-8B AIME24/25 @32k',
    status: 'completed',
  },
  {
    id: 'step-3',
    number: 3,
    title: 'KIVI Dynamic Channel Boost Baseline on Qwen3-8B AIME24/25 @32k',
    status: 'completed',
  },
  {
    id: 'step-4',
    number: 4,
    title: 'FCBoost: Static CA Based Channel Boost on Qwen3-8B AIME24/25 @32k',
    status: 'completed',
  },
  {
    id: 'step-5',
    number: 5,
    title: 'Optimize FCBoost: Static CA Based Channel Boost on Qwen3-8B AIME24/25 @32k',
    status: 'completed',
  },
  {
    id: 'step-6',
    number: 6,
    title: 'FCBoost Effectiveness Assessment on AIME24/25 @32k',
    status: 'completed',
  },
  {
    id: 'step-7',
    number: 7,
    title: 'Random Static Mask Ablation on Qwen3-8B AIME24/25 @32k',
    status: 'running',
    subSteps: [
      {
        id: 'sub-1',
        content: 'Step 1: Create fcboot/analysis/random_mask.py to generate random static masks',
        status: 'completed',
      },
      {
        id: 'sub-2',
        content: 'Step 1b: Verify generated masks (CPU-only checks)',
        status: 'completed',
      },
      {
        id: 'sub-3',
        content: 'Step 2: Debug dry-run with random mask on 1 GPU',
        status: 'completed',
      },
      {
        id: 'sub-4',
        content: 'Step 3: Full evaluation of 3 random mask variants (3 GPU jobs)',
        status: 'running',
      },
      {
        id: 'sub-5',
        content: 'Step 4: Collect results and analyze (comparison table, ablation JSON)',
        status: 'pending',
      },
      {
        id: 'sub-6',
        content: 'Step 5: Update task plan.json, EXPERIMENT_RESULT.json, git commit',
        status: 'pending',
      },
    ],
  },
  {
    id: 'step-8',
    number: 8,
    title: 'CA-Magnitude Overlay Analysis (Premise Gate)',
    status: 'pending',
  },
  {
    id: 'step-9',
    number: 9,
    title: 'Short-Context Evaluation on GSM8K',
    status: 'pending',
  },
];

export const experimentSteps: ExperimentStep[] = stepSeed.map((step) => ({
  ...step,
  runId: 'run_mock',
  stepKey: `mock_step_${step.number}`,
  startedAt: null,
  endedAt: null,
  errorMessage: null,
}));

// 任务列表
const jobSeed: Array<Pick<Job, 'id' | 'time' | 'title' | 'content' | 'status' | 'workedFor'>> = [
  {
    id: 'job-1',
    time: '09:25',
    title: 'Job Monitor',
    content: 'All three jobs are actively computing (50-62% GPU compute utilization). Let me wait for completion. These typically take 2-3 hours for 30 problems at 32k tokens each.',
    status: 'running',
    workedFor: '<1s',
  },
  {
    id: 'job-2',
    time: '09:42',
    title: 'Train Service (git)',
    content: 'Still running. The log output doesn\'t update during generation since lm-eval only writes after all samples are done. Let me verify the GPU is still active and wait for completion.',
    status: 'running',
    workedFor: '<1s',
  },
  {
    id: 'job-3',
    time: '09:42',
    title: 'Job Monitor',
    content: 'All three are actively running with increasing memory usage (82.8%, 72.3%, 60% GPU memory), indicating they\'re at different stages of generation (longer sequences use more KV cache memory). Let me wait until they complete.',
    status: 'running',
    workedFor: '<1s',
  },
  {
    id: 'job-4',
    time: '09:42',
    title: 'Train Service (git)',
    content: 'Monitoring training progress... GPU utilization stable at 75%. Estimated time remaining: 1.5 hours.',
    status: 'running',
    workedFor: '<1s',
  },
];

export const jobs: Job[] = jobSeed.map((job) => ({
  ...job,
  runId: 'run_mock',
  stepId: null,
  source: 'mock',
  level: 'info',
  raw: job.content,
  createdAt: MOCK_TIMESTAMP,
}));

// 统计数据
export const stats: Stats = {
  runId: 'run_mock',
  hypothesis: 354,
  papers: 134,
  tokens: '16.9B',
  cost: '145k',
  elapsedTime: '335:51:07',
  tokenCostUsd: 0,
  gpuHours: 0,
};

// 论文标题
export const paperTitle = 'Frequency Masks for Channel-Wise Precision Boost in 2-bit KV Cache Quantization';
