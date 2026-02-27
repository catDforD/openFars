from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class StepDefinition:
    key: str
    number: int
    title: str
    codex_enabled: bool


STEP_DEFINITIONS: list[StepDefinition] = [
    StepDefinition("topic_scoping", 1, "Topic Scoping", False),
    StepDefinition("literature_review", 2, "Literature Review", False),
    StepDefinition("hypothesis_generation", 3, "Hypothesis Generation", True),
    StepDefinition("experiment_planning", 4, "Experiment Planning", True),
    StepDefinition("code_and_execute", 5, "Code and Execute", True),
    StepDefinition("result_analysis", 6, "Result Analysis", True),
    StepDefinition("paper_drafting", 7, "Paper Drafting", True),
    StepDefinition("final_packaging", 8, "Final Packaging", False),
]


def step_definitions_as_dict() -> list[dict[str, object]]:
    return [
        {
            "key": step.key,
            "number": step.number,
            "title": step.title,
            "codex_enabled": step.codex_enabled,
        }
        for step in STEP_DEFINITIONS
    ]
