from __future__ import annotations

from pathlib import Path

from backend.policy_engine.policy import PolicyEngine


def test_policy_path_and_command_rules() -> None:
    policy = PolicyEngine()
    workspace = Path("/tmp/openfars/workspace")

    assert policy.is_workspace_path_allowed(workspace, workspace / "run/a")
    assert not policy.is_workspace_path_allowed(workspace, Path("/etc/passwd"))

    assert policy.is_command_allowed("python run.py")
    assert not policy.is_command_allowed("rm -rf /")
