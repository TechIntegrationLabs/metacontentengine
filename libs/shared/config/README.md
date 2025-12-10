# @content-engine/config

Shared configuration library for the Meta Content Engine monorepo.

## Overview

This library provides centralized access to environment variables and configuration with type safety. All apps and libraries in the monorepo should use this module to access environment variables.

## Installation

The library is available as a workspace package:

```typescript
import { env, validateEnv } from '@content-engine/config';
```

## Usage

### Basic Usage

```typescript
import { env } from '@content-engine/config';

// Access Supabase credentials
const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Check environment
if (env.isDevelopment) {
  console.log('Running in development mode');
}

// Access app configuration
console.log(env.appName);        // 'Perdia' or custom app name
console.log(env.tenantId);       // Tenant ID if set
```

### Validation

Validate environment variables on app startup:

```typescript
import { validateEnv } from '@content-engine/config';

// In your app's entry point (main.tsx)
try {
  validateEnv();
} catch (error) {
  console.error('Environment configuration error:', error);
  // Handle error (show error page, etc.)
}
```

### Debug Logging

Enable debug output:

```typescript
import { logEnvConfig } from '@content-engine/config';

// Logs configuration (without exposing secrets)
logEnvConfig();
```

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
| `VITE_ENVIRONMENT` | 'development' | Environment: development, staging, production |
| `VITE_FLAGSMITH_ENVIRONMENT_ID` | - | Flagsmith feature flags environment |
| `VITE_DEBUG` | 'false' | Enable debug logging |
| `VITE_MOCK_AI` | 'false' | Use mock AI responses |

## Shared Secrets Architecture

This library works with the monorepo's shared secrets architecture:

1. **Root `.env.local`** - Contains shared secrets used by all apps
2. **App `.env.local`** - Contains app-specific overrides

Environment variables cascade: root defaults are overridden by app-specific values.

See the main project README for more details.
