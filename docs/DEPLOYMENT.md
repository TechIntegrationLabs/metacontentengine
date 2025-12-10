# Deployment Guide

This guide covers deploying Meta Content Engine client applications to Netlify.

## Prerequisites

- GitHub repository connected to Netlify
- Supabase project with database migrations applied
- Environment variables ready

## Architecture Overview

```
                    +------------------+
                    |    Netlify CDN   |
                    |  (Static Assets) |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
        +-----+----+  +------+-----+  +-----+-----+
        | Client A |  | Client B   |  | Client C  |
        | (Site 1) |  | (Site 2)   |  | (Site 3)  |
        +-----+----+  +------+-----+  +-----+-----+
              |              |              |
              +--------------+--------------+
                             |
                    +--------+---------+
                    |    Supabase      |
                    | (Shared Backend) |
                    +------------------+
```

Each client is deployed as a separate Netlify site, all connecting to the same Supabase backend with tenant isolation via RLS.

## Quick Deploy

### 1. Connect Repository

1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Select your GitHub repository
4. Configure build settings:
   - **Base directory**: `content-engine`
   - **Build command**: `npx nx build geteducated --configuration=production`
   - **Publish directory**: `content-engine/dist/apps/geteducated`

### 2. Configure Environment Variables

In Netlify Dashboard > Site Settings > Environment Variables:

#### Required Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Supabase anonymous/public key |
| `VITE_TENANT_ID` | `uuid-here` | Tenant UUID from `tenants` table |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_APP_NAME` | `Perdia` | Display name in UI |
| `VITE_DEBUG` | `false` | Enable debug logging |

### 3. Deploy

Click "Deploy site" or push to your connected branch.

## Multi-Client Deployment

### Option A: Separate Netlify Sites (Recommended)

Create one Netlify site per client:

| Client | Netlify Site | Build Command |
|--------|--------------|---------------|
| GetEducated | `geteducated.netlify.app` | `npx nx build geteducated` |
| Acme Corp | `acme-content.netlify.app` | `npx nx build acme` |
| TechBlog | `techblog-engine.netlify.app` | `npx nx build techblog` |

Each site has its own:
- Environment variables (different `VITE_TENANT_ID`)
- Custom domain
- Deploy previews

### Option B: Branch-Based Deployment

Use Git branches to deploy different clients from one Netlify site:

```
main        -> production (default client)
staging     -> staging environment
client-acme -> Acme Corp production
```

Add to `netlify.toml`:

```toml
[context.client-acme]
  command = "npx nx build acme --configuration=production"
  publish = "dist/apps/acme"

  [context.client-acme.environment]
    VITE_TENANT_ID = "acme-tenant-uuid"
    VITE_APP_NAME = "Acme Content Hub"
```

## Custom Domains

### Setting Up a Custom Domain

1. Go to **Site Settings > Domain Management**
2. Click "Add custom domain"
3. Enter your domain (e.g., `content.acmecorp.com`)
4. Configure DNS:
   - **CNAME**: Point to `<your-site>.netlify.app`
   - Or use Netlify DNS for automatic SSL

### SSL Certificates

Netlify provides free SSL via Let's Encrypt. Certificates auto-renew.

## Build Configuration

### netlify.toml Reference

```toml
[build]
  base = "content-engine/"
  command = "npx nx build geteducated --configuration=production"
  publish = "dist/apps/geteducated"

  [build.environment]
    NODE_VERSION = "20"

# SPA routing
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Build Optimization

The production build includes:
- Tree shaking (removes unused code)
- Code splitting (lazy-loaded routes)
- Asset hashing (cache busting)
- Minification (smaller bundles)

## Deploy Previews

Every pull request automatically gets a deploy preview:

- URL format: `deploy-preview-{PR#}--{site-name}.netlify.app`
- Isolated environment for testing
- Comments added to PR with preview link

### Preview Environment Variables

Deploy previews use the `deploy-preview` context:

```toml
[context.deploy-preview]
  [context.deploy-preview.environment]
    VITE_ENVIRONMENT = "preview"
```

## Monitoring & Logs

### Build Logs

View build logs at: **Deploys > [Deploy] > Deploy log**

Common issues:
- `npm ERR!` - Check Node version, clear cache
- `Cannot find module` - Check dependencies in package.json
- `VITE_*` undefined - Add env vars in Netlify dashboard

### Function Logs

If using Netlify Functions: **Functions > [Function] > Logs**

### Analytics

Enable Netlify Analytics for:
- Page views
- Top pages
- Bandwidth usage

## Rollbacks

To rollback to a previous deploy:

1. Go to **Deploys**
2. Find the working deploy
3. Click **"Publish deploy"**

Instant rollback, no rebuild required.

## CI/CD Integration

### GitHub Actions (Optional)

For more control, use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: content-engine/package-lock.json

      - name: Install & Build
        working-directory: content-engine
        run: |
          npm ci
          npx nx build geteducated --configuration=production

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=content-engine/dist/apps/geteducated
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Troubleshooting

### Build Failures

| Error | Solution |
|-------|----------|
| `Node version mismatch` | Set `NODE_VERSION = "20"` in netlify.toml |
| `Out of memory` | Add `NODE_OPTIONS=--max_old_space_size=4096` |
| `Cannot resolve @content-engine/*` | Check tsconfig paths, ensure libs built |

### Runtime Issues

| Issue | Solution |
|-------|----------|
| Blank page | Check browser console, verify env vars |
| 404 on refresh | SPA redirect should handle, check netlify.toml |
| API errors | Verify Supabase URL/key, check CORS settings |

### Clear Build Cache

In Netlify Dashboard: **Deploys > Trigger deploy > Clear cache and deploy site**

## Security Checklist

- [ ] Never commit `.env.local` files
- [ ] Use Netlify environment variables for secrets
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Review security headers in netlify.toml
- [ ] Supabase RLS policies tested for tenant isolation
- [ ] API keys stored in Supabase `tenant_api_keys` (encrypted)

## Cost Considerations

### Netlify Free Tier
- 100GB bandwidth/month
- 300 build minutes/month
- 1 concurrent build

### Recommended for Production
- **Pro Plan** ($19/month): More bandwidth, faster builds
- **Business Plan**: Team features, SAML SSO

### Optimizations
- Enable asset optimization in Netlify
- Use deploy previews sparingly for large teams
- Consider build caching for faster deploys
