from __future__ import annotations

import asyncio
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket


class EventBus:
    """In-memory pub/sub event bus for run-scoped websocket streams."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, run_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._subscribers[run_id].add(websocket)

    async def unsubscribe(self, run_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if run_id in self._subscribers and websocket in self._subscribers[run_id]:
                self._subscribers[run_id].remove(websocket)
            if run_id in self._subscribers and not self._subscribers[run_id]:
                del self._subscribers[run_id]

    async def publish(self, run_id: str, event: str, payload: dict[str, Any]) -> None:
        async with self._lock:
            subscribers = list(self._subscribers.get(run_id, set()))

        if not subscribers:
            return

        message = {
            "event": event,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        dead: list[WebSocket] = []
        for socket in subscribers:
            try:
                await socket.send_json(message)
            except Exception:
                dead.append(socket)

        if dead:
            async with self._lock:
                for socket in dead:
                    if socket in self._subscribers.get(run_id, set()):
                        self._subscribers[run_id].remove(socket)
                if run_id in self._subscribers and not self._subscribers[run_id]:
                    del self._subscribers[run_id]
