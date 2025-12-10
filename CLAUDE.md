# Meta Content Engine (Perdia)

## Project Overview
Meta Content Engine is a multi-tenant AI-powered content generation platform built with an Nx monorepo architecture. The platform enables organizations to generate, manage, and publish high-quality content at scale using multiple AI providers with contributor personas for authentic voice matching.

## Tech Stack
- **Framework**: React 19 + TypeScript + Vite 7
- **Monorepo**: Nx 22 workspace
- **Styling**: TailwindCSS with custom "Kinetic Modernism" design system
- **Database**: Supabase with Row-Level Security (RLS)
- **AI Providers**: Grok (xAI), Claude (Anthropic), StealthGPT
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Rich Text**: TipTap
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Design System - "Kinetic Modernism"
The UI follows a dark, glass-morphism aesthetic called "Frosted Obsidian":

### Colors
- **void**: Dark backgrounds (#02040a to #1a1c24)
- **forge**: Accent colors (orange #f97316, indigo #6366f1, purple #8b5cf6)
- **glass**: Frosted glass surfaces with subtle transparency

### Typography
- Display: Manrope (headings)
- Body: Space Grotesk
- Code: JetBrains Mono

## Directory Structure
```
content-engine/
+-- apps/
|   +-- geteducated/              # GetEducated client app
|       +-- src/
|       |   +-- app/
|       |   |   +-- pages/        # Page components
|       |   |   +-- app.tsx       # Main app with routing
|       |   +-- lib/
|       |   |   +-- supabase.ts   # Supabase client
|       |   +-- styles.css        # Global styles
|       +-- .env.local            # App-specific overrides (gitignored)
|       +-- vite.config.mts       # Vite config with env loading
+-- libs/
|   +-- shared/
|   |   +-- config/               # Environment configuration (@content-engine/config)
|   |   +-- ui/                   # Reusable UI components
|   |   +-- types/                # TypeScript type definitions
|   |   +-- hooks/                # Shared React hooks
|   +-- core/
|       +-- generation/           # AI content generation
|       +-- publishing/           # WordPress publishing
|       +-- quality/              # Content quality analysis
+-- supabase/
|   +-- migrations/               # Database migrations with RLS
|   +-- functions/                # Supabase Edge Functions
|   +-- seed/                     # Seed data
+-- .env.example                  # Environment template (committed)
+-- .env.local                    # Shared secrets (gitignored)
```

## Shared Secrets Architecture

### Overview
This monorepo uses a **cascading environment variable system** that allows all projects to share the same API keys by default, while individual projects can override with their own keys when needed.

### Loading Order
```
1. Root .env           (defaults - committed)
2. Root .env.local     (shared secrets - gitignored)
3. Root .env.[mode]    (mode-specific defaults)
4. Root .env.[mode].local (mode-specific secrets - gitignored)
5. App .env.local      (app-specific overrides - gitignored)
```

Later values override earlier ones.

### Usage

**Shared secrets (all apps use the same):**
```bash
# Root .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-shared-key
GROK_API_KEY=your-grok-key
```

**App-specific overrides:**
```bash
# apps/geteducated/.env.local
VITE_APP_NAME=GetEducated
VITE_TENANT_ID=geteducated-tenant-uuid
```

### Accessing Environment Variables
```typescript
// Use the centralized config library
import { env, validateEnv } from '@content-engine/config';

// Validate on app startup
validateEnv();

// Access configuration
console.log(env.supabaseUrl);
console.log(env.appName);
console.log(env.isDevelopment);
```

## Key Features

### 1. Magic Setup (Onboarding)
- Brand DNA extraction via URL analysis
- Automatic voice/tone detection
- Industry and audience identification

### 2. Content Forge (Generation)
- Multi-contributor persona system
- Pipeline visualization (Context -> Draft -> Humanize -> QA)
- Real-time generation progress tracking

### 3. Article Management
- Full article editor with TipTap
- Quality scoring system
- Status workflow (Draft -> Review -> Scheduled -> Published)

### 4. Contributors
- AI persona management
- Writing style configuration
- Performance analytics per contributor

### 5. Analytics Dashboard
- Traffic overview charts
- Content performance metrics
- Category breakdown visualization

### 6. Settings
- API key management (Grok, Claude, StealthGPT, WordPress)
- Integration connections
- Brand profile configuration

## Multi-Tenancy Architecture
Each tenant is isolated via Supabase RLS policies:
- `auth.tenant_id()` function extracts tenant from JWT claims
- All content tables include `tenant_id` column
- Policies enforce tenant isolation at database level
- API keys encrypted per-tenant in `tenant_api_keys` table

## Build Commands
```bash
# Development
npx nx serve geteducated

# Production build
npx nx build geteducated

# Run tests
npx nx test geteducated

# View project graph
npx nx graph

# Run affected projects only
npx nx affected -t build
```

## Deployment (Netlify)

This project is configured for deployment on **Netlify** via `netlify.toml`.

### Quick Start
1. Connect repo to Netlify
2. Set base directory: `content-engine`
3. Add environment variables in Netlify dashboard (see below)
4. Deploy

### Environment Variables for Netlify
Add these in **Netlify Dashboard > Site Settings > Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_TENANT_ID` | Yes | Tenant UUID for this deployment |
| `VITE_APP_NAME` | No | App display name (default: Perdia) |
| `VITE_ENVIRONMENT` | Auto | Set automatically per context |

### Multi-Client Deployments
Each client app can be deployed as a separate Netlify site:

**Option 1: Separate Sites (Recommended)**
- Create a new Netlify site per client
- Override build command: `npx nx build <client-name> --configuration=production`
- Set publish directory: `dist/apps/<client-name>`

**Option 2: Branch-Based**
- Use branches like `client-acme`, `client-techblog`
- Add context blocks in `netlify.toml` for each

### Deploy Contexts
| Context | Branch | Environment |
|---------|--------|-------------|
| Production | `main` | `production` |
| Staging | `staging` | `staging` |
| Deploy Preview | PR branches | `preview` |

### Build Output
```
dist/apps/geteducated/
+-- index.html
+-- assets/
    +-- *.js (hashed)
    +-- *.css (hashed)
```

### Troubleshooting
- **Build fails**: Check Node version is 20+
- **Routing 404s**: SPA redirects configured in `netlify.toml`
- **Env vars missing**: Ensure `VITE_` prefix for client-side vars

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_TENANT_ID` | - | Default tenant ID |
| `VITE_APP_NAME` | 'Perdia' | Application display name |
| `VITE_ENVIRONMENT` | 'development' | Environment mode |
| `VITE_DEBUG` | 'false' | Enable debug logging |
| `VITE_MOCK_AI` | 'false' | Mock AI responses |

### Server-Side (Supabase Edge Functions)
| Variable | Description |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (never expose to client) |
| `APP_ENCRYPTION_KEY` | API key encryption key |
| `GROK_API_KEY` | Grok API key (fallback) |
| `CLAUDE_API_KEY` | Claude API key (fallback) |
| `STEALTHGPT_API_KEY` | StealthGPT API key (fallback) |

See `.env.example` for the complete list with documentation.

## API Provider Configuration
AI providers are configured at two levels:

1. **Root `.env.local`** - Platform fallback keys for development
2. **Supabase `tenant_api_keys`** - Per-tenant encrypted keys for production

In production, each tenant configures their own keys via the Settings UI.

## Library Imports
```typescript
// Configuration
import { env, validateEnv } from '@content-engine/config';

// UI Components
import { Button, GlassCard, AppLayout } from '@content-engine/ui';

// Types
import type { Tenant, Article, Contributor } from '@content-engine/types';

// Hooks
import { useTenant, useAuth } from '@content-engine/hooks';

// Core functionality
import { generateContent } from '@content-engine/generation';
import { publishToWordPress } from '@content-engine/publishing';
import { analyzeQuality } from '@content-engine/quality';
```

## Future Enhancements
- [x] TipTap rich text editor integration
- [x] Supabase Edge Functions for AI generation
- [ ] Real-time collaboration
- [ ] WordPress auto-publishing
- [ ] Content scheduling calendar
- [ ] A/B testing for headlines
- [ ] Analytics dashboards
