from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CreateProjectRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class CreateRunRequest(BaseModel):
    autoStart: bool = True


class RunControlRequest(BaseModel):
    action: Literal["pause", "resume", "cancel", "retry"]


class ProjectModel(BaseModel):
    id: str
    name: str
    status: Literal["in_progress", "completed"]
    createdAt: str
    updatedAt: str


class RunModel(BaseModel):
    id: str
    projectId: str
    status: str
    currentStepIndex: int
    createdAt: str
    updatedAt: str
    startedAt: str | None = None
    endedAt: str | None = None


class StepModel(BaseModel):
    id: str
    runId: str
    stepKey: str
    number: int
    title: str
    status: Literal["completed", "running", "pending", "error"]
    startedAt: str | None = None
    endedAt: str | None = None
    errorMessage: str | None = None


class JobModel(BaseModel):
    id: str
    runId: str
    stepId: str | None = None
    time: str
    title: str
    content: str
    status: Literal["completed", "running", "pending", "error"]
    workedFor: str
    source: str
    level: str
    raw: str
    createdAt: str


class ArtifactModel(BaseModel):
    id: str
    runId: str
    stepId: str | None = None
    path: str
    size: int
    sha256: str
    createdAt: str


class StatsModel(BaseModel):
    runId: str
    hypothesis: int
    papers: int
    tokens: str
    cost: str
    elapsedTime: str
    tokenCostUsd: float
    gpuHours: float
