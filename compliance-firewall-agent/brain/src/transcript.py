from __future__ import annotations

import json
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Literal

from .models import StoredMessage, StoredSession
from .session_store import load_session

TranscriptFormat = Literal["markdown", "json", "text", "html"]


@dataclass
class TranscriptOptions:
    format: TranscriptFormat = "markdown"
    include_timestamps: bool = False
    include_token_usage: bool = False
    title: str | None = None


async def generate_transcript(session_id: str, options: TranscriptOptions | None = None) -> str | None:
    session = await load_session(session_id)
    if not session:
        return None
    return format_transcript(session, options)


def format_transcript(session: StoredSession, options: TranscriptOptions | None = None) -> str:
    options = options or TranscriptOptions()
    messages = [m for m in session.messages if m.role != "system"]

    if options.format == "markdown":
        return _to_markdown(session, messages, options)
    if options.format == "text":
        return _to_plain_text(session, messages, options)
    if options.format == "json":
        return json.dumps(
            {
                "sessionId": session.session_id,
                "createdAt": datetime.fromtimestamp(session.created_at / 1000, tz=timezone.utc).isoformat(),
                "messages": [{"role": m.role, "content": m.content} for m in messages],
                "tokens": {"input": session.input_tokens, "output": session.output_tokens},
            },
            indent=2,
        )
    if options.format == "html":
        return _to_html(session, messages, options)
    return _to_markdown(session, messages, options)


def _to_markdown(session: StoredSession, messages: list[StoredMessage], opts: TranscriptOptions) -> str:
    created = datetime.fromtimestamp(session.created_at / 1000, tz=timezone.utc).isoformat()
    lines = [
        f"# {opts.title or 'Brain AI Conversation Transcript'}",
        f"**Session ID:** {session.session_id}",
        f"**Date:** {created.split('T')[0]}",
        "",
    ]

    if opts.include_token_usage:
        total = session.input_tokens + session.output_tokens
        lines.append(f"**Tokens used:** {total} ({session.input_tokens} in / {session.output_tokens} out)")
        lines.append("")

    lines.append("---")
    lines.append("")

    for msg in messages:
        label = "**You**" if msg.role == "user" else "**Brain AI**"
        lines.append(label)
        lines.append(msg.content)
        lines.append("")

    return "\n".join(lines)


def _to_plain_text(session: StoredSession, messages: list[StoredMessage], opts: TranscriptOptions) -> str:
    created = datetime.fromtimestamp(session.created_at / 1000, tz=timezone.utc).isoformat()
    lines = [
        opts.title or "Brain AI Conversation Transcript",
        f"Session: {session.session_id}",
        f"Date: {created.split('T')[0]}",
        "",
        "=" * 60,
        "",
    ]

    for msg in messages:
        label = "YOU:" if msg.role == "user" else "BRAIN AI:"
        lines.append(label)
        lines.append(msg.content)
        lines.append("")

    return "\n".join(lines)


def _to_html(session: StoredSession, messages: list[StoredMessage], opts: TranscriptOptions) -> str:
    title = opts.title or "Brain AI Transcript"
    msg_html_parts = []
    for m in messages:
        cls = "user" if m.role == "user" else "assistant"
        label = "You" if m.role == "user" else "Brain AI"
        msg_html_parts.append(
            f'<div class="msg {cls}"><strong>{label}:</strong><p>{_escape_html(m.content)}</p></div>'
        )
    msg_html = "\n".join(msg_html_parts)

    created_date = datetime.fromtimestamp(session.created_at / 1000, tz=timezone.utc).strftime("%-m/%-d/%Y")

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>{_escape_html(title)}</title>
<style>
body{{font-family:system-ui,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#1a1a2e;}}
h1{{color:#4f46e5;}}.msg{{margin:1rem 0;padding:1rem;border-radius:8px;}}
.user{{background:#f0f0ff;border-left:3px solid #6366f1;}}
.assistant{{background:#f0fff4;border-left:3px solid #10b981;}}
strong{{display:block;margin-bottom:.5rem;font-size:.85rem;opacity:.7;}}
p{{margin:0;white-space:pre-wrap;}}
</style>
</head>
<body>
<h1>{_escape_html(title)}</h1>
<p><small>Session: {_escape_html(session.session_id)} · {created_date}</small></p>
{msg_html}
</body>
</html>"""


def _escape_html(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
