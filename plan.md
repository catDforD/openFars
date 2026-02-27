# OpenFARS 实施方案（Codex CLI 驱动版）

## Summary
构建一个单机可运行、全自动无人值守的开源科研流水线，前端复用现有 `ui/app`，后端以 `FastAPI + LangGraph` 编排，**Codex 通过 CLI 子进程作为核心科研 Agent**，覆盖选题、文献、实验、分析、写作全流程，并输出结构化报告与 LaTeX 草稿。

## 固定技术决策
1. 后端：Python + FastAPI + LangGraph
2. Agent：Codex CLI（主路径）
3. 前后端实时：WebSocket
4. 存储：SQLite + Chroma + 本地文件系统
5. 执行环境：单机宿主机
6. 数据策略：公开数据/公开论文
7. 协议：Apache-2.0
8. 恢复策略：自动重试 + 断点续跑

## 系统架构
1. `api-server`：REST/WS、项目与 run 管理、状态查询
2. `orchestrator`：LangGraph 流程编排与状态机
3. `codex-runner`：封装 Codex CLI 启动、超时控制、日志采集、结果解析
4. `policy-engine`：命令/路径/环境变量安全策略
5. `artifact-manager`：产物登记、哈希、索引、下载
6. `knowledge-service`：文献检索与向量检索（Chroma）

## Codex CLI 调用实现（核心）
### 1. 进程生命周期
1. 每个 step 启动一个独立 codex 子进程
2. 工作目录固定：`workspace/{project_id}/{run_id}/{step_id}`
3. run 维护 `process_registry`（pid、step_id、start_time、timeout）
4. 支持 `pause/resume/cancel/retry`

### 2. 输入协议（给 Codex）
每次调用生成 `task_spec.json`，字段固定：
1. `goal`
2. `context`（项目背景、已有结论、历史产物）
3. `constraints`（公开数据、预算、时间、不可改项）
4. `allowed_actions`（允许命令类别）
5. `expected_outputs`（必须生成的文件）
6. `acceptance_checks`（必须通过的验证命令）

### 3. 输出协议（Codex 必须返回）
要求 Codex 在最终输出包含：
```text
<openfars_result>
{
  "status": "success|failed",
  "summary": "string",
  "artifacts": ["relative/path/..."],
  "metrics": {"key": "value"},
  "next_inputs": {}
}
</openfars_result>
```
后端仅以该块作为结构化真值；其余 stdout/stderr 仅用于日志展示。

### 4. 超时与重试
1. `soft_timeout`：发送中断信号，等待优雅结束
2. `hard_timeout`：强制终止并标记失败
3. 自动重试：按错误类型（可重试/不可重试）执行，默认最多 2 次
4. checkpoint：每 step 完成写入 `step_state.json`

## Agent 流程（LangGraph）
1. `topic_scoping`
2. `literature_review`
3. `hypothesis_generation`
4. `experiment_planning`
5. `code_and_execute`（Codex CLI）
6. `result_analysis`（Codex CLI）
7. `paper_drafting`（Codex CLI）
8. `final_packaging`

失败分支：进入 `retry_handler`，超过阈值进入 `run_failed`；可从最近成功 step 续跑。

## 安全与边界（CLI 模式最低保护）
1. 禁止越界写路径（仅允许 run workspace）
2. 禁止系统破坏类命令模式
3. API 密钥仅环境注入，不落盘
4. 全量审计：命令、参数、退出码、耗时、产物哈希

## Public API / 类型变更
### REST
1. `POST /api/projects`
2. `GET /api/projects`
3. `POST /api/projects/{id}/runs`
4. `GET /api/runs/{id}`
5. `GET /api/runs/{id}/steps`
6. `GET /api/runs/{id}/jobs`
7. `GET /api/runs/{id}/artifacts`
8. `POST /api/runs/{id}/control` (`pause|resume|cancel|retry`)

### WebSocket
1. `GET /ws/runs/{run_id}`
2. 事件：`run_started`, `step_updated`, `job_log_appended`, `artifact_created`, `stats_updated`, `run_completed`, `run_failed`

### 前端类型（在现有 `ui/app/src/types/index.ts` 扩展）
1. `Project` 增加：`createdAt`, `updatedAt`
2. `ExperimentStep` 增加：`startedAt`, `endedAt`, `errorMessage?`
3. `Job` 增加：`source`, `level`, `raw`
4. `Stats` 增加：`runId`, `tokenCostUsd`, `gpuHours`

## 前端接线计划（不改 UI 风格）
1. 新增 `src/api/client.ts`（REST）
2. 新增 `src/realtime/ws.ts`（WS）
3. 新增 `src/store/runStore.ts`（状态聚合）
4. 将 `mockData` 替换为 API + WS 数据源
5. 组件保持：`ProjectQueue/ExperimentStage/JobMonitor/StatsBar/Header`

## 测试与验收
### 单元测试
1. 状态机流转与失败分支
2. Codex 输出块解析器
3. 安全策略引擎（允许/拒绝）

### 集成测试
1. 创建项目 -> 启动 run -> 完成全流程（mock codex）
2. WS 事件顺序与 UI 状态一致
3. 断点续跑与自动重试正确

### E2E 验收
1. 新建项目后 5 秒内出现 `run_started`
2. 至少一个失败 step 自动重试成功
3. 可下载 `report.json` 与 `paper_draft.tex`
4. 服务重启后 run 可恢复

## 8 周里程碑
1. Week 1：后端骨架、SQLite schema、项目/run API
2. Week 2：WebSocket 事件总线、前端基础接线
3. Week 3：LangGraph 主流程 + checkpoint
4. Week 4：Codex CLI Runner（启动、日志、超时、控制）
5. Week 5：文献检索 + 向量检索（Chroma）
6. Week 6：实验执行与产物管理、统计聚合
7. Week 7：写作模块（结构化报告 + LaTeX）
8. Week 8：稳定性、恢复演练、开源文档与示例项目

## 目录结构（目标）
1. `backend/api/`
2. `backend/orchestrator/`
3. `backend/codex_runner/`
4. `backend/policy_engine/`
5. `backend/knowledge/`
6. `backend/tests/`
7. `workspace/`
8. `docs/architecture.md`, `docs/api.md`, `docs/runbook.md`

## Assumptions
1. 单机 Linux 可持续运行长期任务
2. Codex CLI 在部署机可用且版本可锁定
3. 首版优先稳定与可复现，不追求多机调度
4. 公开数据足以支撑首批演示课题
