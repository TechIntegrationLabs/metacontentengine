/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import * as path from 'path';

/**
 * Polynesian Cultural Center (PCC) Client App
 *
 * Shared Secrets Architecture:
 *
 * Environment variables are loaded in this cascading order:
 * 1. Root .env (shared defaults - checked into git as .env.example)
 * 2. Root .env.local (actual secrets - gitignored)
 * 3. Root .env.[mode] (mode-specific defaults)
 * 4. Root .env.[mode].local (mode-specific secrets - gitignored)
 * 5. App .env.local (app-specific overrides - gitignored)
 *
 * This allows all projects to share the same API keys by default,
 * while individual projects can override with their own keys when needed.
 *
 * Usage:
 * - Put shared secrets in root .env.local
 * - To override for this app, create apps/pcc/.env.local
 */

// Get the workspace root (monorepo root)
const workspaceRoot = path.resolve(import.meta.dirname, '../..');

export default defineConfig(({ mode }) => {
  // Load env files from workspace root first (shared secrets)
  // Then app-specific env files will override
  const rootEnv = loadEnv(mode, workspaceRoot, '');
  const appEnv = loadEnv(mode, import.meta.dirname, '');

  // Merge: app-specific overrides root-level
  const env = { ...rootEnv, ...appEnv };

  return {
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/pcc',

    // Make root env available during build
    envDir: workspaceRoot,

    server: {
      port: 4201,
      host: 'localhost',
    },
    preview: {
      port: 4201,
      host: 'localhost',
    },
    plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    build: {
      outDir: '../../dist/apps/pcc',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    // Define env variables that should be available in the app
    define: {
      // App-specific branding (can be overridden per app)
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'Polynesian Cultural Center'),
      'import.meta.env.VITE_APP_DESCRIPTION': JSON.stringify(env.VITE_APP_DESCRIPTION || 'AI-Powered Content Generation for Polynesian Cultural Center'),
    },
  };
});
