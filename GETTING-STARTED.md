# Meta Content Engine - Getting Started Guide

## Table of Contents
1. [Quick Start](#quick-start)
2. [Understanding the Monorepo Architecture](#understanding-the-monorepo-architecture)
3. [Directory Structure Explained](#directory-structure-explained)
4. [Multi-Tenancy Model](#multi-tenancy-model)
5. [Environment Configuration](#environment-configuration)
6. [Making Changes: Shared vs Instance-Specific](#making-changes-shared-vs-instance-specific)
7. [Common Workflows](#common-workflows)
8. [Nx Commands Reference](#nx-commands-reference)
9. [Adding a New Client/Tenant](#adding-a-new-clienttenant)
10. [Best Practices](#best-practices)

---

## Quick Start

```bash
# 1. Navigate to the project
cd content-engine

# 2. Install dependencies
npm install

# 3. Create your environment file
cp apps/geteducated/.env.example apps/geteducated/.env.local

# 4. Start the development server
npx nx serve geteducated

# 5. Open in browser
# http://localhost:4200
```

---

## Understanding the Monorepo Architecture

### What is a Monorepo?
A monorepo (mono-repository) is a single repository containing multiple related projects. In our case:
- **Multiple client apps** (GetEducated, and future clients)
- **Shared libraries** (UI components, types, hooks, services)

### Why Nx?
Nx provides:
- **Dependency graph**: Understands which projects depend on which
- **Affected commands**: Only rebuilds what changed
- **Caching**: Speeds up builds by caching results
- **Code generation**: Scaffolds new apps/libs consistently

### The Key Concept: Apps vs Libs

```
┌─────────────────────────────────────────────────────────┐
│                        APPS                              │
│  (Deployable applications - one per client)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ geteducated  │  │  client-b    │  │  client-c    │  │
│  │   (React)    │  │   (React)    │  │   (React)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └────────────────┼─────────────────┘          │
│                          │                             │
│                          ▼                             │
│  ┌─────────────────────────────────────────────────┐  │
│  │                     LIBS                         │  │
│  │  (Shared code - used by all apps)               │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
│  │  │shared/ui│ │shared/  │ │shared/  │           │  │
│  │  │         │ │ types   │ │ hooks   │           │  │
│  │  └─────────┘ └─────────┘ └─────────┘           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │  │
│  │  │  core/  │ │  core/  │ │  core/  │           │  │
│  │  │generation│ │publishing│ │ quality │           │  │
│  │  └─────────┘ └─────────┘ └─────────┘           │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Apps** = Deployable client instances (each client gets their own app)
**Libs** = Shared code that apps import from

---

## Directory Structure Explained

```
content-engine/
│
├── apps/                          # 🎯 CLIENT APPLICATIONS
│   └── geteducated/               # GetEducated client app
│       ├── src/
│       │   ├── app/
│       │   │   ├── pages/         # Page components (Dashboard, Settings, etc.)
│       │   │   └── app.tsx        # Main app component with routing
│       │   ├── main.tsx           # Entry point
│       │   └── styles.css         # App-specific global styles
│       ├── public/                # Static assets
│       ├── index.html             # HTML template
│       ├── .env.local             # 🔐 CLIENT-SPECIFIC environment variables
│       ├── tailwind.config.js     # Can override shared Tailwind config
│       ├── vite.config.ts         # Vite configuration
│       └── project.json           # Nx project configuration
│
├── libs/                          # 📚 SHARED LIBRARIES
│   ├── shared/                    # Shared across ALL apps
│   │   ├── ui/                    # 🎨 UI Component Library
│   │   │   └── src/lib/
│   │   │       ├── components/    # Reusable components
│   │   │       │   ├── GlassCard.tsx
│   │   │       │   ├── StatCard.tsx
│   │   │       │   └── PipelineVisualizer.tsx
│   │   │       ├── primitives/    # Base components (Button, Input)
│   │   │       ├── layout/        # Layout components (Sidebar, AppLayout)
│   │   │       └── feedback/      # Loading states, toasts
│   │   │
│   │   ├── types/                 # 📝 TypeScript Type Definitions
│   │   │   └── src/lib/
│   │   │       ├── tenant.ts      # Tenant types
│   │   │       ├── user.ts        # User types
│   │   │       ├── content.ts     # Article, ContentIdea types
│   │   │       ├── contributor.ts # Contributor persona types
│   │   │       ├── pipeline.ts    # Generation pipeline types
│   │   │       └── index.ts       # Barrel export
│   │   │
│   │   └── hooks/                 # 🪝 Shared React Hooks
│   │       └── src/lib/
│   │           ├── useTenant.tsx  # Tenant context & hook
│   │           └── useAuth.tsx    # Auth context & hook
│   │
│   └── core/                      # Core business logic
│       ├── generation/            # 🤖 AI Content Generation
│       │   └── src/lib/
│       │       ├── providers/     # AI provider implementations
│       │       │   ├── grok.ts
│       │       │   └── claude.ts
│       │       ├── types.ts       # Generation-specific types
│       │       └── generation.ts  # Provider factory
│       │
│       ├── publishing/            # 📤 WordPress Publishing
│       │   └── src/lib/
│       │       └── wordpress.ts   # WP REST API client
│       │
│       └── quality/               # ✅ Content Quality Analysis
│           └── src/lib/
│               └── analyzer.ts    # Quality scoring
│
├── supabase/                      # 🗄️ DATABASE
│   └── migrations/                # SQL migrations with RLS
│       ├── 001_create_tenant_infrastructure.sql
│       ├── 002_create_content_tables.sql
│       └── 003_create_pipeline_tables.sql
│
├── .env                           # 🔐 SHARED environment variables (optional)
├── nx.json                        # Nx workspace configuration
├── package.json                   # Dependencies
├── tsconfig.base.json             # Base TypeScript config
└── CLAUDE.md                      # Project documentation
```

---

## Multi-Tenancy Model

### How Multi-Tenancy Works

We use a **single database, multiple schemas** approach with Row-Level Security (RLS):

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  tenants table                    │   │
│  │  id | name         | slug         | plan        │   │
│  │  1  | GetEducated  | geteducated  | enterprise  │   │
│  │  2  | ClientB      | clientb      | pro         │   │
│  └─────────────────────────────────────────────────┘   │
│                          │                              │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              articles table (with RLS)           │   │
│  │  id | tenant_id | title          | content      │   │
│  │  1  | 1         | MBA Guide      | ...          │   │
│  │  2  | 1         | Data Science   | ...          │   │
│  │  3  | 2         | ClientB Post   | ...          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  RLS Policy: WHERE tenant_id = auth.tenant_id()        │
│  (Users can ONLY see their own tenant's data)          │
└─────────────────────────────────────────────────────────┘
```

### Key RLS Function

```sql
-- This function extracts tenant_id from the JWT token
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid,
    NULL
  )
$$;
```

### How Users Are Assigned to Tenants

1. User signs up or is invited
2. Admin assigns user to tenant via `tenant_users` table
3. Custom Access Token Hook adds `tenant_id` to JWT claims
4. Every query is automatically filtered by `tenant_id`

---

## Environment Configuration

### Environment File Hierarchy

```
content-engine/
├── .env                           # 🌍 SHARED (all apps) - committed to repo
├── .env.local                     # 🔒 SHARED (all apps) - NOT committed
│
└── apps/
    └── geteducated/
        ├── .env                   # 🌍 APP-SPECIFIC - committed to repo
        └── .env.local             # 🔒 APP-SPECIFIC - NOT committed (secrets here!)
```

### Priority Order (highest to lowest)
1. `apps/geteducated/.env.local` (app-specific secrets)
2. `apps/geteducated/.env` (app-specific defaults)
3. `.env.local` (shared secrets)
4. `.env` (shared defaults)

### Example Environment Files

**Root `.env` (shared defaults, committed):**
```env
# Shared configuration for all apps
VITE_APP_NAME=Meta Content Engine
VITE_DEFAULT_LANGUAGE=en
```

**Root `.env.local` (shared secrets, NOT committed):**
```env
# Shared API keys (if same across all clients)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**`apps/geteducated/.env` (app defaults, committed):**
```env
# GetEducated-specific configuration
VITE_APP_TITLE=Perdia - GetEducated
VITE_BRAND_NAME=GetEducated
VITE_PRIMARY_COLOR=#6366f1
```

**`apps/geteducated/.env.local` (app secrets, NOT committed):**
```env
# GetEducated-specific secrets
VITE_TENANT_ID=uuid-for-geteducated
VITE_GROK_API_KEY=xai-xxx
VITE_CLAUDE_API_KEY=sk-ant-xxx
VITE_WP_API_URL=https://geteducated.com/wp-json
VITE_WP_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Accessing Environment Variables

```typescript
// In your code (Vite exposes VITE_ prefixed vars)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const tenantId = import.meta.env.VITE_TENANT_ID;

// Type-safe approach (recommended)
// Create a file: apps/geteducated/src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_TENANT_ID: string;
  // add more...
}
```

---

## Making Changes: Shared vs Instance-Specific

### Decision Tree

```
                    What do you want to change?
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
     Affects ALL clients?            Affects ONE client?
              │                               │
              ▼                               ▼
      Edit in /libs/                 Edit in /apps/client/
              │                               │
    ┌─────────┴─────────┐           ┌────────┴────────┐
    ▼                   ▼           ▼                 ▼
UI Component?     Business Logic?   Page Layout?    Branding?
    │                   │           │                 │
    ▼                   ▼           ▼                 ▼
libs/shared/ui/   libs/core/     apps/client/    apps/client/
                  generation/    src/app/pages/  tailwind.config
```

### Examples

#### Example 1: Change the GlassCard component for ALL clients
```bash
# Edit the shared component
code libs/shared/ui/src/lib/components/GlassCard.tsx

# All apps using <GlassCard> will get the update
```

#### Example 2: Change Dashboard layout for ONLY GetEducated
```bash
# Edit the app-specific page
code apps/geteducated/src/app/pages/Dashboard.tsx

# Only GetEducated is affected
```

#### Example 3: Add a new AI provider for ALL clients
```bash
# 1. Add the provider in shared lib
code libs/core/generation/src/lib/providers/openai.ts

# 2. Export it from the index
code libs/core/generation/src/lib/index.ts

# 3. All apps can now use it
```

#### Example 4: Custom branding colors for ONE client
```bash
# Edit app-specific Tailwind config
code apps/geteducated/tailwind.config.js

# Or use CSS variables in app-specific styles
code apps/geteducated/src/styles.css
```

### Import Patterns

**Importing from shared libs:**
```typescript
// ✅ Correct - import from lib barrel
import { GlassCard, StatCard } from '@content-engine/shared/ui';
import { Article, Contributor } from '@content-engine/shared/types';
import { useTenant, useAuth } from '@content-engine/shared/hooks';
import { createProvider, GrokProvider } from '@content-engine/core/generation';

// ❌ Wrong - don't import from internal paths
import { GlassCard } from '@content-engine/shared/ui/src/lib/components/GlassCard';
```

**The barrel exports are defined in each lib's index.ts:**
```typescript
// libs/shared/ui/src/index.ts
export * from './lib/components/GlassCard';
export * from './lib/components/StatCard';
export * from './lib/primitives/Button';
// etc.
```

---

## Common Workflows

### Workflow 1: Starting Development

```bash
# Start GetEducated app
npx nx serve geteducated

# Start with specific port
npx nx serve geteducated --port=3000

# Start multiple apps in parallel
npx nx run-many --target=serve --projects=geteducated,clientb
```

### Workflow 2: Building for Production

```bash
# Build single app
npx nx build geteducated

# Build all apps
npx nx run-many --target=build --all

# Build only affected apps (based on git changes)
npx nx affected --target=build
```

### Workflow 3: Running Tests

```bash
# Test single lib
npx nx test shared-ui

# Test single app
npx nx test geteducated

# Test everything affected by changes
npx nx affected --target=test
```

### Workflow 4: Generating New Code

```bash
# Generate a new React component in shared UI lib
npx nx g @nx/react:component MyComponent --project=shared-ui

# Generate a new page in an app
npx nx g @nx/react:component NewPage --project=geteducated --directory=app/pages

# Generate a new library
npx nx g @nx/react:library my-feature --directory=libs/features
```

### Workflow 5: Visualizing Dependencies

```bash
# Open dependency graph in browser
npx nx graph

# See what's affected by your changes
npx nx affected:graph
```

---

## Nx Commands Reference

| Command | Description |
|---------|-------------|
| `npx nx serve <app>` | Start dev server for an app |
| `npx nx build <app>` | Production build for an app |
| `npx nx test <project>` | Run tests for a project |
| `npx nx lint <project>` | Lint a project |
| `npx nx graph` | Visualize project dependencies |
| `npx nx affected --target=<target>` | Run target on affected projects |
| `npx nx run-many --target=<target> --all` | Run target on all projects |
| `npx nx list` | List installed Nx plugins |
| `npx nx reset` | Clear Nx cache |

---

## Adding a New Client/Tenant

### Step 1: Create the App

```bash
# Generate new React app
npx nx g @nx/react:application clientb --directory=apps/clientb --style=tailwind
```

### Step 2: Configure the App

```bash
# Copy configuration from existing app
cp apps/geteducated/tailwind.config.js apps/clientb/
cp apps/geteducated/vite.config.ts apps/clientb/

# Create environment file
touch apps/clientb/.env.local
```

### Step 3: Set Up Environment Variables

```env
# apps/clientb/.env.local
VITE_TENANT_ID=uuid-for-clientb
VITE_APP_TITLE=Perdia - ClientB
VITE_BRAND_NAME=ClientB
```

### Step 4: Copy/Customize App Code

```bash
# Option A: Copy and customize from existing app
cp -r apps/geteducated/src/app/* apps/clientb/src/app/

# Option B: Start fresh, importing shared components
# Just import from @content-engine/shared/* libs
```

### Step 5: Create Tenant in Database

```sql
-- Insert the new tenant
INSERT INTO tenants (name, slug, settings)
VALUES ('ClientB', 'clientb', '{"features": {"ai_generation": true}}');

-- Assign admin user
INSERT INTO tenant_users (tenant_id, user_id, role)
VALUES ('uuid-for-clientb', 'admin-user-uuid', 'owner');
```

### Step 6: Deploy

Each app can be deployed independently to:
- Vercel (separate projects)
- Netlify (separate sites)
- Custom domains with different configurations

---

## Best Practices

### 1. Keep Apps Thin
Apps should primarily be:
- Configuration (env vars, branding)
- Page composition (assembling shared components)
- App-specific overrides

Most logic should live in `/libs/`.

### 2. Use TypeScript Strictly
```typescript
// In tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 3. Follow the Single Responsibility Principle for Libs
```
libs/
├── shared/ui/          # ONLY UI components
├── shared/types/       # ONLY type definitions
├── shared/hooks/       # ONLY React hooks
├── core/generation/    # ONLY AI generation logic
```

### 4. Use Affected Commands in CI
```yaml
# .github/workflows/ci.yml
- name: Test affected
  run: npx nx affected --target=test --base=origin/main

- name: Build affected
  run: npx nx affected --target=build --base=origin/main
```

### 5. Document Shared Components
Add Storybook or documentation for shared components:
```bash
npx nx g @nx/storybook:configuration shared-ui
npx nx storybook shared-ui
```

### 6. Keep Environment Variables Organized
- Shared vars in root `.env`
- Client-specific vars in `apps/<client>/.env`
- Secrets ONLY in `.env.local` files (gitignored)

### 7. Use Path Aliases Consistently
```typescript
// ✅ Good
import { Button } from '@content-engine/shared/ui';

// ❌ Bad (relative imports across projects)
import { Button } from '../../../libs/shared/ui/src';
```

---

## Troubleshooting

### "Cannot find module '@content-engine/...'"
```bash
# Rebuild TypeScript project references
npx nx reset
npm install
```

### "Nx workspace out of sync"
```bash
# Reset Nx daemon and cache
npx nx reset
npx nx daemon --stop
```

### "Environment variable is undefined"
1. Check file exists: `apps/<app>/.env.local`
2. Ensure variable starts with `VITE_`
3. Restart dev server after changes

### "Changes not reflected in other apps"
Shared lib changes require rebuilding dependent apps:
```bash
npx nx affected --target=build
```

---

## Quick Reference Card

| I want to... | Edit this location |
|--------------|-------------------|
| Change UI component for all | `libs/shared/ui/src/lib/` |
| Change types for all | `libs/shared/types/src/lib/` |
| Change AI generation logic | `libs/core/generation/src/lib/` |
| Change page for one client | `apps/<client>/src/app/pages/` |
| Change branding for one client | `apps/<client>/tailwind.config.js` |
| Add environment variable | `apps/<client>/.env.local` |
| Add database migration | `supabase/migrations/` |
| Configure Nx | `nx.json` |
| Configure TypeScript | `tsconfig.base.json` |
