---
name: gui-automation
description: Use when you need to visually interact with a GUI — test buttons, fill forms, verify visual layouts, fuzz web pages, automate user flows, take screenshots, or perform end-to-end QA on any application. Works on cloud VMs, Docker containers, local machines, and sandboxes. Install: pip install cua.
---

# GUI Automation

CUA gives you **eyes and hands on a real computer**: see the screen, move the mouse, click, type, drag, and manage windows — like a human at the keyboard.

Use this skill for **visual interaction** that can't be done via shell or API.

## Setup

```bash
cua --version          # check install; if missing: pip install cua

# Connect to target (pick one)
cua do switch cloud my-vm
cua do switch docker my-container
cua do-host-consent && cua do switch host   # local machine (one-time consent)
```

> `ANTHROPIC_API_KEY` is optional. With it, `cua do snapshot` returns an AI-annotated screen with element coordinates.

## Workflow

**Look → Act → Verify** — repeat until done, then share:

```bash
cua do screenshot          # look
cua do click 450 280       # act
cua do screenshot          # verify
cua trajectory share       # share replay link with user
```

> Re-screenshot after every UI change — coordinates go stale when the screen changes.

## Hound Shield E2E Flows

### Test onboarding flow
```bash
cua do switch host
cua do open http://localhost:3000
cua do screenshot
# Verify hero section "Proof, not policy." is visible
cua do click [signup-button-coords]
cua do screenshot
```

### Test proxy scan
```bash
# Verify 403 response for CUI content
cua do shell "curl -X POST http://localhost:8080/openai/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{\"messages\":[{\"role\":\"user\",\"content\":\"CUI//SP-CTI secret contract info\"}]}'"
cua do screenshot
```

### Test PDF export
```bash
cua do open http://localhost:3000/dashboard
cua do screenshot
cua do click [export-pdf-button-coords]
cua do screenshot
# Verify PDF download dialog appears
```

## Common Scenarios

### Click a button
```bash
cua do screenshot
cua do click 450 280
cua do screenshot
```

### Fill a form
```bash
cua do screenshot
cua do click 400 200 && cua do type "jane@contractor.mil"
cua do key tab && cua do type "SecureP@ss123"
cua do click 400 500
cua do screenshot
```

### Fuzz compliance form (security testing)
```bash
cua do screenshot
cua do click 400 200
cua do type "<script>alert(1)</script>"
cua do key tab && cua do type "CUI//SP-CTI ITAR Export Controlled"
cua do key tab && cua do type "SSN: 123-45-6789"
cua do click 400 500
cua do screenshot              # verify proxy blocks or UI handles correctly
```

### Zoom in for precision clicks
```bash
cua do zoom "Google Chrome"   # crop to Chrome window
cua do screenshot
cua do click 112 44           # precise click
cua do screenshot
cua do unzoom
```

## Quick Reference

| Action              | Command                                      |
| ------------------- | -------------------------------------------- |
| Connect to target   | `cua do switch <provider> [name]`            |
| Screenshot          | `cua do screenshot`                          |
| AI-annotated screen | `cua do snapshot ["instructions"]`           |
| Click               | `cua do click <x> <y>`                       |
| Double-click        | `cua do dclick <x> <y>`                      |
| Type text           | `cua do type "text"`                         |
| Press key           | `cua do key <key>`                           |
| Hotkey              | `cua do hotkey <combo>` (e.g. `ctrl+c`)      |
| Scroll              | `cua do scroll <direction> [amount]`         |
| Drag                | `cua do drag <x1> <y1> <x2> <y2>`            |
| Shell command       | `cua do shell "command"`                     |
| Open URL/file       | `cua do open <url\|path>`                    |
| Zoom to window      | `cua do zoom "App Name"`                     |
| Share trajectory    | `cua trajectory share`                       |

## Trajectory

Every action is auto-recorded to `~/.cua/trajectories/{machine}/{session}/`.

```bash
cua trajectory share           # upload and get shareable HTTPS link — always do at end
cua trajectory ls              # list sessions
cua trajectory export          # generate HTML report
```

Tell the user: `"Here is the trajectory of my session: {url}"`
