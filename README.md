# Meta Content Engine (Perdia)

AI-powered multi-tenant content generation platform built with Nx monorepo architecture.

## Overview

Meta Content Engine is a production-ready platform for generating, managing, and publishing high-quality content at scale. It uses multiple AI providers with contributor personas for authentic voice matching.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 7
- **Monorepo**: Nx 22
- **Styling**: TailwindCSS (Kinetic Modernism design system)
- **Database**: Supabase with Row-Level Security (RLS)
- **AI Providers**: Grok, Claude, StealthGPT
- **State**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Rich Text**: TipTap
- **Charts**: Recharts
- **Animations**: Framer Motion

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account (or local Supabase CLI)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd content-engine

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# (See Environment Variables section below)

# Start development server
npx nx serve geteducated
```

The app will be available at `http://localhost:4200`

## Project Structure

```
content-engine/
+-- apps/
|   +-- geteducated/         # GetEducated client app
+-- libs/
|   +-- shared/
|   |   +-- config/          # Environment configuration
|   |   +-- hooks/           # Shared React hooks
|   |   +-- types/           # TypeScript type definitions
|   |   +-- ui/              # Reusable UI components
|   +-- core/
|       +-- generation/      # AI content generation
|       +-- publishing/      # WordPress publishing
|       +-- quality/         # Content quality analysis
+-- supabase/
    +-- migrations/          # Database migrations with RLS
    +-- functions/           # Supabase Edge Functions
    +-- seed/                # Seed data
```

## Environment Variables

### Shared Secrets Architecture

This monorepo uses a **cascading environment variable system**:

1. **Root `.env.example`** - Template with documentation (committed to git)
2. **Root `.env.local`** - Shared secrets for ALL apps (gitignored)
3. **App `.env.local`** - Per-app overrides (gitignored)

**Environment loading order**:
```
Root .env -> Root .env.local -> Root .env.[mode] -> Root .env.[mode].local -> App .env.local
```

Later values override earlier ones, so app-specific settings take precedence.

### Setup

1. Copy the template:
   ```bash
   cp .env.example .env.local
   ```

2. Add your credentials to `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. (Optional) Create app-specific overrides:
   ```bash
   # apps/geteducated/.env.local
   VITE_APP_NAME=GetEducated
   VITE_TENANT_ID=your-tenant-uuid
   ```

### Required Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_TENANT_ID` | - | Default tenant ID |
| `VITE_APP_NAME` | 'Perdia' | Application name |
| `VITE_ENVIRONMENT` | 'development' | Environment mode |
| `VITE_DEBUG` | 'false' | Enable debug logging |

See `.env.example` for the complete list with documentation.

## Development

### Commands

```bash
# Start development server
npx nx serve geteducated

# Build for production
npx nx build geteducated

# Run tests
npx nx test geteducated

# Lint
npx nx lint geteducated

# Run affected projects only
npx nx affected -t build

# View project graph
npx nx graph
```

### Adding a New App

```bash
# Generate a new React app
npx nx g @nx/react:app my-client

# The app will automatically use root .env.local
# Create app-specific overrides in apps/my-client/.env.local
```

### Adding a New Library

```bash
# Generate a shared library
npx nx g @nx/react:lib my-lib --directory=libs/shared

# Generate a core library
npx nx g @nx/js:lib my-core-lib --directory=libs/core
```

## Multi-Tenancy

The platform supports multiple tenants (organizations) with complete data isolation:

- **Row-Level Security (RLS)**: All tables enforce tenant isolation at the database level
- **JWT Claims**: `auth.tenant_id()` extracts tenant from user's JWT
- **API Key Encryption**: Per-tenant API keys stored with pgcrypto encryption

### Tenant Setup

1. Create tenant via Supabase dashboard or API
2. Assign users to tenant via `app_metadata.tenant_id`
3. Configure API keys in Settings UI

## AI Providers

### Supported Providers

| Provider | Purpose | Documentation |
|----------|---------|---------------|
| **Grok (xAI)** | Primary drafting | [x.ai/api](https://x.ai/api) |
| **Claude (Anthropic)** | Quality analysis | [console.anthropic.com](https://console.anthropic.com) |
| **StealthGPT** | Humanization | [stealthgpt.ai](https://stealthgpt.ai) |

### Key Management

API keys are managed at two levels:

1. **Root `.env.local`** - Platform fallback keys (for development)
2. **Supabase `tenant_api_keys`** - Per-tenant encrypted keys (for production)

In production, tenants configure their own keys via the Settings UI.

## Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build command: `npx nx build geteducated`
4. Set output directory: `dist/apps/geteducated`

### Environment-Specific Variables

| Environment | Recommendations |
|-------------|-----------------|
| **Development** | Use local Supabase, mock AI enabled |
| **Staging** | Real Supabase, test API keys |
| **Production** | Real Supabase, production API keys, `VITE_ENVIRONMENT=production` |

## Architecture Decisions

### Why Nx Monorepo?

- **Code sharing**: Reusable libraries across multiple client apps
- **Build caching**: Faster CI/CD with Nx Cloud
- **Consistency**: Shared tooling and configuration
- **Scalability**: Easy to add new apps for different clients

### Why Supabase?

- **Postgres**: Full SQL capabilities with RLS
- **Auth**: Built-in authentication with JWT
- **Edge Functions**: Serverless API for AI operations
- **Real-time**: Live updates for collaborative features

### Why Multiple AI Providers?

- **Flexibility**: Different providers excel at different tasks
- **Reliability**: Fallback options if one provider is unavailable
- **Cost optimization**: Route tasks to cost-effective providers
- **Tenant choice**: Let tenants bring their own API keys

## Contributing

1. Create a feature branch
2. Make changes
3. Run tests: `npx nx affected -t test`
4. Run lint: `npx nx affected -t lint`
5. Submit pull request

## License

MIT

---

Built with Nx. [Learn more about Nx](https://nx.dev)
