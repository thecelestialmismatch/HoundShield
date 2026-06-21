from __future__ import annotations

import random
import time
from dataclasses import dataclass, field, replace
from typing import Any, Literal

TaskStatus = Literal["pending", "in_progress", "complete", "skipped", "failed"]
TaskPriority = Literal["critical", "high", "medium", "low"]
TaskCategory = Literal["compliance", "remediation", "assessment", "onboarding", "integration", "internal"]


@dataclass
class BrainAITask:
    id: str
    name: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    category: TaskCategory
    created_at: int
    updated_at: int
    metadata: dict[str, Any] = field(default_factory=dict)
    assigned_to: str | None = None
    due_date: int | None = None
    subtasks: list["BrainAITask"] | None = None


def get_default_tasks() -> list[BrainAITask]:
    now = int(time.time() * 1000)
    return [
        BrainAITask(
            id="root-module-parity",
            name="Root Module Parity",
            description="Ensure all Brain AI core modules are implemented and exported",
            status="complete",
            priority="critical",
            category="internal",
            created_at=now,
            updated_at=now,
            metadata={
                "modules": ["models", "session-store", "query-engine", "commands", "tools", "runtime"]
            },
        ),
        BrainAITask(
            id="directory-parity",
            name="Directory Structure Parity",
            description="Ensure lib/brain-ai/ directory matches full feature set",
            status="complete",
            priority="high",
            category="internal",
            created_at=now,
            updated_at=now,
            metadata={},
        ),
        BrainAITask(
            id="parity-audit",
            name="Parity Audit",
            description="Run feature coverage audit to verify completeness",
            status="in_progress",
            priority="high",
            category="internal",
            created_at=now,
            updated_at=now,
            metadata={"auditEndpoint": "/api/brain-ai/audit"},
        ),
        BrainAITask(
            id="cmmc-assessment-flow",
            name="CMMC Assessment Flow",
            description="Complete CMMC Level 2 gap assessment for organization",
            status="pending",
            priority="critical",
            category="compliance",
            created_at=now,
            updated_at=now,
            metadata={"controls": 110, "domains": 14},
        ),
        BrainAITask(
            id="gateway-integration",
            name="Gateway Integration",
            description="Connect AI gateway to Brain AI for compliance screening",
            status="pending",
            priority="high",
            category="integration",
            created_at=now,
            updated_at=now,
            metadata={"endpoint": "/api/gateway/stream"},
        ),
    ]


_task_store: dict[str, BrainAITask] = {}
_initialized = False


def _ensure_init() -> None:
    global _initialized
    if _initialized:
        return
    for task in get_default_tasks():
        _task_store[task.id] = task
    _initialized = True


def get_all_tasks() -> list[BrainAITask]:
    _ensure_init()
    return list(_task_store.values())


def get_task(id_: str) -> BrainAITask | None:
    _ensure_init()
    return _task_store.get(id_)


def create_task(
    name: str,
    description: str,
    status: TaskStatus,
    priority: TaskPriority,
    category: TaskCategory,
    assigned_to: str | None = None,
    due_date: int | None = None,
    metadata: dict[str, Any] | None = None,
    subtasks: list[BrainAITask] | None = None,
) -> BrainAITask:
    _ensure_init()
    now = int(time.time() * 1000)
    rand = "".join(random.choices("0123456789abcdefghijklmnopqrstuvwxyz", k=4))
    task_id = f"task-{now}-{rand}"
    new_task = BrainAITask(
        id=task_id,
        name=name,
        description=description,
        status=status,
        priority=priority,
        category=category,
        created_at=now,
        updated_at=now,
        metadata=metadata or {},
        assigned_to=assigned_to,
        due_date=due_date,
        subtasks=subtasks,
    )
    _task_store[task_id] = new_task
    return new_task


def update_task(id_: str, **updates: Any) -> BrainAITask | None:
    _ensure_init()
    existing = _task_store.get(id_)
    if not existing:
        return None
    updated = replace(existing, **updates, id=id_, updated_at=int(time.time() * 1000))
    _task_store[id_] = updated
    return updated


def delete_task(id_: str) -> bool:
    _ensure_init()
    if id_ in _task_store:
        del _task_store[id_]
        return True
    return False


def get_tasks_by_status(status: TaskStatus) -> list[BrainAITask]:
    _ensure_init()
    return [t for t in _task_store.values() if t.status == status]


def get_tasks_by_category(category: TaskCategory) -> list[BrainAITask]:
    _ensure_init()
    return [t for t in _task_store.values() if t.category == category]


@dataclass
class TaskSummary:
    total: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    critical_pending: list[BrainAITask]


def get_task_summary() -> TaskSummary:
    _ensure_init()
    tasks = list(_task_store.values())
    by_status = {"pending": 0, "in_progress": 0, "complete": 0, "skipped": 0, "failed": 0}
    by_priority = {"critical": 0, "high": 0, "medium": 0, "low": 0}

    for t in tasks:
        by_status[t.status] += 1
        by_priority[t.priority] += 1

    return TaskSummary(
        total=len(tasks),
        by_status=by_status,
        by_priority=by_priority,
        critical_pending=[t for t in tasks if t.priority == "critical" and t.status == "pending"],
    )
