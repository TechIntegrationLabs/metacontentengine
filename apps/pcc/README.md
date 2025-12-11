# Polynesian Cultural Center - Content Engine

AI-Powered Content Generation Platform for Polynesian Cultural Center.

## Brand Identity

- **Client:** Polynesian Cultural Center
- **Domain:** polynesia.com
- **Industry:** Leisure, Travel & Tourism, Hospitality

### Brand Colors (from polynesia.com)

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Teal | `#2d5a47` | Headers, navigation, primary brand |
| Coral | `#e8734a` | CTAs, Book Now buttons, accents |
| Gold | `#c9a227` | Highlights, sale badges, accents |
| Cream | `#f5f0e6` | Backgrounds (light mode) |
| Dark Brown | `#1a1512` | Dark mode backgrounds |

## Development

```bash
# From the content-engine root
npx nx serve pcc

# Build for production
npx nx build pcc --configuration=production

# Run tests
npx nx test pcc
```

The dev server runs on `http://localhost:4201` (to avoid conflicts with geteducated on 4200).

## Environment Variables

This app inherits shared secrets from the root `.env.local`. Create `apps/pcc/.env.local` only for PCC-specific overrides:

```bash
# App Identity
VITE_APP_NAME=Polynesian Cultural Center
VITE_CLIENT_SLUG=pcc

# Tenant ID (from Supabase tenants table)
VITE_TENANT_ID=your-pcc-tenant-uuid
```

All other variables (Supabase URL, API keys, etc.) are inherited from the root.

## Deployment (Netlify)

### Option 1: Separate Netlify Site (Recommended)

1. Create a new Netlify site
2. Connect to the repository
3. Configure build settings:
   - **Base directory:** `content-engine/`
   - **Build command:** `npx nx build pcc --configuration=production`
   - **Publish directory:** `dist/apps/pcc`
4. Add environment variables in Netlify dashboard

### Option 2: Branch-Based Deployment

Push to a `client-pcc` branch to trigger the PCC-specific build context defined in `netlify.toml`.

## Features

- Dashboard with real-time content metrics
- Content Forge for AI content generation
- Article management with quality scoring
- Contributor persona management
- Analytics dashboard
- Settings and API key management
- Full authentication flow

## Customizations from Base Template

This app was cloned from `geteducated` with the following PCC-specific changes:

1. **Brand Colors:** Teal (#2d5a47), Coral (#e8734a), Gold (#c9a227)
2. **Icon:** Palm tree (Palmtree from lucide-react)
3. **Typography:** Same fonts with warm/tropical aesthetic
4. **Industry Context:** Tourism & Hospitality focused
5. **Default Content Categories:** Culture, Events, Travel, History, Food

## File Structure

```
apps/pcc/
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, etc.
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ContentForge.tsx
│   │   │   ├── Articles.tsx
│   │   │   ├── ArticleEditor.tsx
│   │   │   ├── Contributors.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── MagicSetup.tsx
│   │   └── app.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── styles.css
│   └── main.tsx
├── .env.local
├── .env.example
├── index.html
├── project.json
├── tailwind.config.js
├── vite.config.mts
├── tsconfig.json
└── README.md
```

## Contact

For support, contact the development team.
