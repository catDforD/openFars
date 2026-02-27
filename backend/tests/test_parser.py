from __future__ import annotations

import pytest

from backend.codex_runner.parser import parse_openfars_result


def test_parse_openfars_result_success() -> None:
    raw = """
noise
<openfars_result>
{"status":"success","summary":"done","artifacts":["a.txt"],"metrics":{"tokens":12},"next_inputs":{"k":"v"}}
</openfars_result>
"""
    parsed = parse_openfars_result(raw)
    assert parsed.status == "success"
    assert parsed.summary == "done"
    assert parsed.artifacts == ["a.txt"]
    assert parsed.metrics["tokens"] == 12


def test_parse_openfars_result_missing_block() -> None:
    with pytest.raises(ValueError, match="Missing"):
        parse_openfars_result("no result")
