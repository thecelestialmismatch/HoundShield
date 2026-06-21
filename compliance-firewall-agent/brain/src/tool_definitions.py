from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

ToolParameterType = Literal["string", "number", "boolean", "array", "object"]


@dataclass
class ToolParameterSchema:
    type: ToolParameterType
    description: str | None = None
    enum: list[str] | None = None
    items: "ToolParameterSchema | None" = None
    properties: "dict[str, ToolParameterSchema] | None" = None
    required: list[str] | None = None


@dataclass
class ToolParameters:
    type: Literal["object"]
    properties: dict[str, ToolParameterSchema]
    required: list[str]


@dataclass
class ToolDefinition:
    name: str
    description: str
    category: str
    parameters: ToolParameters
    returns_stream: bool | None = None
    requires_auth: bool | None = None


DEFAULT_TOOLS: list[ToolDefinition] = [
    ToolDefinition(
        name="web-search",
        description="Search the web for information using DuckDuckGo. Returns titles, URLs, and snippets.",
        category="research",
        parameters=ToolParameters(
            type="object",
            properties={
                "query": ToolParameterSchema(type="string", description="The search query"),
                "maxResults": ToolParameterSchema(
                    type="number", description="Maximum number of results (default: 5)"
                ),
            },
            required=["query"],
        ),
    ),
    ToolDefinition(
        name="web-browse",
        description="Fetch and extract the text content of a web page.",
        category="research",
        parameters=ToolParameters(
            type="object",
            properties={"url": ToolParameterSchema(type="string", description="The URL to browse")},
            required=["url"],
        ),
    ),
    ToolDefinition(
        name="compliance-scan",
        description="Scan text for CUI, PII, and compliance violations (CMMC/HIPAA/SOC2).",
        category="compliance",
        parameters=ToolParameters(
            type="object",
            properties={
                "text": ToolParameterSchema(type="string", description="Text content to scan"),
                "framework": ToolParameterSchema(
                    type="string",
                    enum=["cmmc", "hipaa", "soc2", "all"],
                    description="Compliance framework to check against",
                ),
            },
            required=["text"],
        ),
    ),
    ToolDefinition(
        name="code-execute",
        description="Execute JavaScript code in a sandboxed environment.",
        category="coding",
        requires_auth=True,
        parameters=ToolParameters(
            type="object",
            properties={
                "code": ToolParameterSchema(type="string", description="JavaScript code to execute"),
                "timeout": ToolParameterSchema(
                    type="number", description="Execution timeout in ms (default: 5000)"
                ),
            },
            required=["code"],
        ),
    ),
    ToolDefinition(
        name="file-analyze",
        description="Parse and analyze a JSON, CSV, or Markdown file.",
        category="analysis",
        parameters=ToolParameters(
            type="object",
            properties={
                "content": ToolParameterSchema(type="string", description="File content as a string"),
                "fileType": ToolParameterSchema(
                    type="string",
                    enum=["json", "csv", "markdown", "auto"],
                    description="File type (use auto to detect)",
                ),
            },
            required=["content"],
        ),
    ),
    ToolDefinition(
        name="data-query",
        description="Run SQL-like queries on JSON data arrays.",
        category="analysis",
        parameters=ToolParameters(
            type="object",
            properties={
                "data": ToolParameterSchema(type="array", description="Array of objects to query"),
                "query": ToolParameterSchema(
                    type="string", description="SQL-like query (SELECT, WHERE, ORDER BY, LIMIT)"
                ),
            },
            required=["data", "query"],
        ),
    ),
    ToolDefinition(
        name="generate-chart",
        description="Generate Chart.js-compatible chart data for visualization.",
        category="visualization",
        parameters=ToolParameters(
            type="object",
            properties={
                "type": ToolParameterSchema(
                    type="string",
                    enum=["bar", "line", "pie", "doughnut", "area", "table"],
                    description="Chart type",
                ),
                "data": ToolParameterSchema(type="object", description="Chart data (labels and datasets)"),
                "title": ToolParameterSchema(type="string", description="Chart title"),
            },
            required=["type", "data"],
        ),
    ),
    ToolDefinition(
        name="knowledge-base",
        description="Store, retrieve, and search compliance knowledge documents.",
        category="knowledge",
        parameters=ToolParameters(
            type="object",
            properties={
                "action": ToolParameterSchema(
                    type="string",
                    enum=["store", "retrieve", "search", "list"],
                    description="Action to perform",
                ),
                "content": ToolParameterSchema(
                    type="string", description="Content to store or search query"
                ),
                "id": ToolParameterSchema(type="string", description="Document ID (for retrieve/delete)"),
                "tags": ToolParameterSchema(type="array", description="Tags for categorization"),
            },
            required=["action"],
        ),
    ),
]


def get_tool_definition(name: str) -> ToolDefinition | None:
    return next((t for t in DEFAULT_TOOLS if t.name == name), None)


def get_tool_definitions(names: list[str] | None = None) -> list[ToolDefinition]:
    if names is None:
        return DEFAULT_TOOLS
    return [t for t in DEFAULT_TOOLS if t.name in names]


def _parameter_schema_to_dict(schema: ToolParameterSchema) -> dict:
    result: dict = {"type": schema.type}
    if schema.description is not None:
        result["description"] = schema.description
    if schema.enum is not None:
        result["enum"] = schema.enum
    if schema.items is not None:
        result["items"] = _parameter_schema_to_dict(schema.items)
    if schema.properties is not None:
        result["properties"] = {k: _parameter_schema_to_dict(v) for k, v in schema.properties.items()}
    if schema.required is not None:
        result["required"] = schema.required
    return result


def to_open_router_tools(defs: list[ToolDefinition]) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description,
                "parameters": {
                    "type": t.parameters.type,
                    "properties": {k: _parameter_schema_to_dict(v) for k, v in t.parameters.properties.items()},
                    "required": t.parameters.required,
                },
            },
        }
        for t in defs
    ]
