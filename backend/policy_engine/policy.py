from __future__ import annotations

from pathlib import Path

DENY_PATTERNS = (
    "rm -rf /",
    "shutdown",
    "reboot",
    "mkfs",
    "dd if=",
    "chmod -R 777 /",
    "chown -R /",
)


class PolicyEngine:
    """Minimal host safety policy for CLI execution."""

    def is_workspace_path_allowed(self, workspace_root: Path, target: Path) -> bool:
        root = workspace_root.resolve()
        candidate = target.resolve()
        return root == candidate or root in candidate.parents

    def is_command_allowed(self, command: str) -> bool:
        normalized = command.lower().strip()
        return all(pattern not in normalized for pattern in DENY_PATTERNS)
