from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

RESULT_PATTERN = re.compile(
    r"<openfars_result>\s*(\{.*?\})\s*</openfars_result>",
    re.DOTALL,
)


@dataclass
class ParsedResult:
    status: str
    summary: str
    artifacts: list[str]
    metrics: dict[str, Any]
    next_inputs: dict[str, Any]


def parse_openfars_result(raw_output: str) -> ParsedResult:
    """Parse structured result emitted by Codex CLI in `<openfars_result>` block."""
    match = RESULT_PATTERN.search(raw_output)
    if not match:
        raise ValueError("Missing <openfars_result> block in Codex output")

    payload = json.loads(match.group(1))
    status = payload.get("status")
    if status not in {"success", "failed"}:
        raise ValueError("Invalid result status")

    return ParsedResult(
        status=status,
        summary=str(payload.get("summary", "")),
        artifacts=list(payload.get("artifacts", [])),
        metrics=dict(payload.get("metrics", {})),
        next_inputs=dict(payload.get("next_inputs", {})),
    )
