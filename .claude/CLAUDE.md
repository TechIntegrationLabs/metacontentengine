# content-engine - Claude Code Context

> **Initialized:** 2025-12-10
> **Path:** /c/Users/Disruptors/Documents/personal/metacontentengine/content-engine

## Project Description

Meta Content Engine (Perdia) - A multi-tenant AI-powered content generation platform built with Nx monorepo, React 19, Vite 7, TailwindCSS, and Supabase. Features contributor personas for authentic voice matching, quality scoring, internal linking, and multi-channel publishing.

## Global Tools Available

This project is connected to the Disruptors global development environment.

### Automatic Time Tracking
All work is automatically logged to `~/.claude/timesheet/logs/`
- Sessions, prompts, and tool usage captured
- Time calculated in 15-minute blocks (0.25 hrs each)

### Commands
| Command | Description |
|---------|-------------|
| `/hours` | Quick timesheet summary |
| `/hours week` | Last 7 days summary |
| `/timesheet` | Detailed breakdown |
| `/notion-sync` | Push to Notion |
| `/init` | Re-run this setup |

### MCP Servers
- **Notion** - Page/database management
- **GoHighLevel** - CRM integration

### Subagents
- `timesheet-reporter` - "Generate my timesheet"
- `notion-timesheet` - "Sync to Notion"
- `project-init` - "Initialize this project"

## Project Notes

- Nx monorepo with shared libraries pattern
- Design system: "Kinetic Modernism" / "Frosted Obsidian"
- Multi-tenant via Supabase RLS policies
- AI providers: Grok, Claude, StealthGPT
- Deployed on Netlify

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Main project documentation |
| `nx.json` | Nx monorepo configuration |
| `netlify.toml` | Deployment configuration |
| `apps/geteducated/` | GetEducated tenant app |
| `libs/shared/ui/` | Shared UI components |
| `libs/shared/hooks/` | Shared React hooks |
| `libs/core/generation/` | AI content generation |
| `libs/core/quality/` | Content quality analysis |
| `libs/core/publishing/` | Publishing services |
| `supabase/migrations/` | Database migrations |

---
*Global system docs: ~/Documents/personal/claude-timesheet-system/*
