from __future__ import annotations

import argparse
import asyncio
import json
import sys
from dataclasses import asdict, is_dataclass
from typing import Any

from . import (
    BrainAI,
    build_command_graph,
    build_port_manifest,
    create_bootstrap_graph,
    create_default_onboarding_state,
    find_dialog_by_trigger,
    get_active_mode,
    get_all_dialogs,
    get_all_skills,
    get_all_tasks,
    get_global_state,
    get_runtime_mode_report,
    get_task_summary,
    get_total_cost_all_sessions,
    load_command_snapshot,
    load_tool_snapshot,
    manifest_to_markdown,
    render_bootstrap_graph,
    render_command_graph,
    render_command_index,
    render_hook_registry,
    render_onboarding_checklist,
    render_runtime_modes,
    render_state_report,
    render_tool_index,
    render_tool_pool,
    run_bootstrap_graph,
    run_parity_audit,
)
from .manifest import KAELUS_SUBSYSTEMS
from .query import get_query_engine_runtime
from .tool_pool import get_default_tool_pool


def _print_json(value: Any) -> None:
    print(json.dumps(_to_jsonable(value), indent=2, default=str))


def _to_jsonable(value: Any) -> Any:
    if is_dataclass(value) and not isinstance(value, type):
        return {k: _to_jsonable(v) for k, v in asdict(value).items()}
    if isinstance(value, list):
        return [_to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_jsonable(v) for k, v in value.items()}
    return value


def cmd_summary(args: argparse.Namespace) -> None:
    manifest = build_port_manifest()
    print(manifest_to_markdown(manifest))


def cmd_manifest(args: argparse.Namespace) -> None:
    manifest = build_port_manifest()
    if args.json:
        _print_json(manifest)
    else:
        print(manifest_to_markdown(manifest))


def cmd_parity_audit(args: argparse.Namespace) -> None:
    report = run_parity_audit()
    if args.json:
        _print_json(report)
    else:
        print(report.full_report)


def cmd_setup_report(args: argparse.Namespace) -> None:
    report = BrainAI.setup()
    if args.json:
        _print_json(report)
    else:
        from .setup import render_setup_report

        print(render_setup_report(report))


def cmd_command_graph(args: argparse.Namespace) -> None:
    graph = build_command_graph()
    if args.json:
        _print_json(graph)
    else:
        print(render_command_graph(graph))


def cmd_tool_pool(args: argparse.Namespace) -> None:
    pool = get_default_tool_pool()
    if args.json:
        _print_json(pool)
    else:
        print(render_tool_pool(pool))


def cmd_bootstrap_graph(args: argparse.Namespace) -> None:
    if args.run:
        graph = asyncio.run(run_bootstrap_graph())
    else:
        graph = create_bootstrap_graph()
    if args.json:
        _print_json(graph)
    else:
        print(render_bootstrap_graph(graph))


def cmd_subsystems(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(KAELUS_SUBSYSTEMS)
        return
    for s in KAELUS_SUBSYSTEMS:
        print(f"- {s.name} ({s.path}) — {s.file_count} files — {s.notes}")


def cmd_skills(args: argparse.Namespace) -> None:
    from .skills import render_skill_index

    if args.json:
        _print_json(get_all_skills())
    else:
        print(render_skill_index())


def cmd_dialogs(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(get_all_dialogs())
        return
    for d in get_all_dialogs():
        print(f"- {d.id} — {d.name}: {d.description}")


def cmd_tools(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(load_tool_snapshot())
    else:
        print(render_tool_index())


def cmd_commands(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(load_command_snapshot())
    else:
        print(render_command_index())


def cmd_state(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(get_global_state())
    else:
        print(render_state_report(args.session_id))


def cmd_runtime_modes(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(get_runtime_mode_report())
    else:
        print(render_runtime_modes())


def cmd_local_model(args: argparse.Namespace) -> None:
    print(f"Active mode: {get_active_mode()}")


def cmd_onboarding(args: argparse.Namespace) -> None:
    state = create_default_onboarding_state()
    if args.json:
        _print_json(state)
    else:
        print(render_onboarding_checklist(state))


def cmd_tasks(args: argparse.Namespace) -> None:
    if args.json:
        _print_json(get_all_tasks())
        return
    summary = get_task_summary()
    print(f"Total tasks: {summary.total}")
    print(f"By status: {summary.by_status}")
    print(f"By priority: {summary.by_priority}")
    for t in get_all_tasks():
        print(f"- [{t.status}] ({t.priority}) {t.name} — {t.description}")


def cmd_hook_registry(args: argparse.Namespace) -> None:
    print(render_hook_registry())


def cmd_session(args: argparse.Namespace) -> None:
    from .session_store import load_session

    session = asyncio.run(load_session(args.session_id))
    if not session:
        print(f"No session found for: {args.session_id}")
        return
    if args.json:
        _print_json(session)
    else:
        print(f"Session: {session.session_id}")
        print(f"Messages: {len(session.messages)}")
        print(f"Tokens: in={session.input_tokens} out={session.output_tokens}")


def cmd_route(args: argparse.Namespace) -> None:
    runtime = get_query_engine_runtime()
    if args.json:
        _print_json(runtime.route(args.prompt))
    else:
        print(runtime.render_matches(args.prompt))


def cmd_cost(args: argparse.Namespace) -> None:
    from .cost_tracker import format_cost_usd, get_session_cost_summary

    if args.session_id:
        summary = get_session_cost_summary(args.session_id)
        if args.json:
            _print_json(summary)
        else:
            print(f"Session: {args.session_id}")
            print(f"Total cost: {format_cost_usd(summary.total_cost_usd)}")
    else:
        total = get_total_cost_all_sessions()
        if args.json:
            _print_json({"totalCostUsd": total})
        else:
            print(f"Total cost across all sessions: {format_cost_usd(total)}")


def cmd_version(args: argparse.Namespace) -> None:
    print(f"{BrainAI.name} v{BrainAI.version} — {BrainAI.owner}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="brain.src.main", description="Brain AI Python port CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    def add(name: str, func, with_json: bool = True) -> argparse.ArgumentParser:
        p = sub.add_parser(name)
        if with_json:
            p.add_argument("--json", action="store_true", help="Output as JSON")
        p.set_defaults(func=func)
        return p

    add("summary", cmd_summary, with_json=False)
    add("manifest", cmd_manifest)
    add("parity-audit", cmd_parity_audit)
    add("setup-report", cmd_setup_report)
    add("command-graph", cmd_command_graph)
    add("tool-pool", cmd_tool_pool)
    p = add("bootstrap-graph", cmd_bootstrap_graph)
    p.add_argument("--run", action="store_true", help="Actually execute the bootstrap stages")
    add("subsystems", cmd_subsystems)
    add("skills", cmd_skills)
    add("dialogs", cmd_dialogs)
    add("tools", cmd_tools)
    add("commands", cmd_commands)
    p = add("state", cmd_state)
    p.add_argument("--session-id", default=None)
    add("runtime-modes", cmd_runtime_modes)
    add("local-model", cmd_local_model, with_json=False)
    add("onboarding", cmd_onboarding)
    add("tasks", cmd_tasks)
    add("hook-registry", cmd_hook_registry, with_json=False)
    p = add("session", cmd_session)
    p.add_argument("session_id")
    p = add("route", cmd_route)
    p.add_argument("prompt")
    p = add("cost", cmd_cost)
    p.add_argument("--session-id", default=None)
    add("version", cmd_version, with_json=False)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
