from __future__ import annotations

from typing import Any


class KnowledgeService:
    """Placeholder interface for future paper search and vector retrieval."""

    def search_papers(self, query: str) -> list[dict[str, Any]]:
        return [{"title": "Mock Paper", "query": query, "source": "placeholder"}]
