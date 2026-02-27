from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from .schemas import CreateProjectRequest, CreateRunRequest, RunControlRequest

api_router = APIRouter(prefix="/api", tags=["openfars"])


@api_router.post("/projects")
async def create_project(payload: CreateProjectRequest, request: Request):
    project = request.app.state.db.create_project(payload.name)
    return {"project": project}


@api_router.get("/projects")
async def list_projects(request: Request):
    projects = request.app.state.db.list_projects()
    return {"projects": projects}


@api_router.post("/projects/{project_id}/runs")
async def create_run(project_id: str, payload: CreateRunRequest, request: Request):
    project = request.app.state.db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    run = request.app.state.orchestrator.create_run(project_id)
    if payload.autoStart:
        request.app.state.orchestrator.start_run(run["id"])
    return {"run": request.app.state.db.get_run(run["id"])}


@api_router.get("/projects/{project_id}/runs/latest")
async def get_latest_run(project_id: str, request: Request):
    project = request.app.state.db.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    run = request.app.state.db.get_latest_run_for_project(project_id)
    if not run:
        return {"run": None}
    return {"run": run}


@api_router.get("/runs/{run_id}")
async def get_run(run_id: str, request: Request):
    run = request.app.state.db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run": run}


@api_router.get("/runs/{run_id}/steps")
async def get_steps(run_id: str, request: Request):
    run = request.app.state.db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"steps": request.app.state.db.list_steps(run_id)}


@api_router.get("/runs/{run_id}/jobs")
async def get_jobs(run_id: str, request: Request):
    run = request.app.state.db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"jobs": request.app.state.db.list_jobs(run_id)}


@api_router.get("/runs/{run_id}/artifacts")
async def get_artifacts(run_id: str, request: Request):
    run = request.app.state.db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"artifacts": request.app.state.db.list_artifacts(run_id)}


@api_router.get("/runs/{run_id}/stats")
async def get_stats(run_id: str, request: Request):
    run = request.app.state.db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"stats": request.app.state.orchestrator.get_stats_view(run_id)}


@api_router.post("/runs/{run_id}/control")
async def run_control(run_id: str, payload: RunControlRequest, request: Request):
    run = request.app.state.db.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    result = await request.app.state.orchestrator.apply_control(run_id, payload.action)
    status_code = 400 if result["status"] == "error" else 200
    if status_code != 200:
        raise HTTPException(status_code=status_code, detail=result["message"])
    return result
