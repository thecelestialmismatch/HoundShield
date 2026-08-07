# design-md — portable design systems

Plain-text design documents an AI coding agent can read and build from, in the
[awesome-design-md](https://github.com/VoltAgent/awesome-design-md) format (Google Stitch section
spec).

Each folder is **self-contained and project-agnostic**. Copy one into another repository, point an
agent at its `DESIGN.md`, and it will generate UI in that system without needing this codebase.

```
design-md/
  <product>/
    DESIGN.md      the system — tokens, components, layout, rules
    preview.html   self-contained visual catalog: swatches, type scale, components
```

| Folder | What it is |
|---|---|
| `demo-design-product/` | The Command Center design system, extracted 2026-08-07 and stripped of HoundShield specifics so it can seed a new product |

## How this differs from the repo-root `DESIGN.md`

`/DESIGN.md` describes **this** product. It names HoundShield surfaces, cites its compliance
constraints, and is guarded by `design-md-tokens.test.ts` against `app/globals.css`, so it can never
drift from the shipping code.

The folders here are **exports**. They carry the same visual language with the product-specific
parts removed, and they are deliberately *not* tied to this repo's stylesheets — that is what makes
them portable. They will not track changes to this codebase automatically; re-export when the system
moves.

## Naming

`demo-design-product` is a placeholder. Rename the folder and the `# ` heading inside its
`DESIGN.md` when the real product name is decided.
