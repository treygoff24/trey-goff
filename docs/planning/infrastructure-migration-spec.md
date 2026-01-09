# Infrastructure Migration Spec: Vercel → Cloudflare + Hetzner VPS

**Status:** Ready for Implementation
**Date:** January 2026
**Current Stack:** Vercel (managed)
**Target Stack:** Cloudflare (free tier) + Hetzner VPS ($5/mo)
**Based on:** `feature/floating-library` branch (includes 3D library + interactive world)

---

## North Star

Migrate from Vercel's managed hosting to a self-hosted Hetzner VPS with Cloudflare as the CDN/proxy layer. Reduce hosting costs to ~$5/month while maintaining performance, reliability, and developer experience.

**Goals:**
- Monthly cost: ~$5 (down from $0-20 Vercel)
- Zero-downtime migration
- Maintain current performance (Lighthouse 90+)
- Simple, reproducible deployment process
- Easy rollback path

**Non-goals:**
- Kubernetes or complex orchestration
- Multi-region deployment (single VPS is fine for personal site)
- Preview deployments per PR (nice-to-have, not required)

---

## Cost Comparison

| Service | Current (Vercel) | Target (CF + Hetzner) |
|---------|------------------|------------------------|
| Hosting | $0-20/mo (hobby/pro) | $4.51/mo (CX22) |
| CDN | Included | Free (Cloudflare) |
| SSL | Included | Free (Cloudflare) |
| DNS | External or Vercel | Free (Cloudflare) |
| CI/CD | Included | Free (GitHub Actions) |
| **Total** | $0-20/mo | ~$5/mo |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    DNS      │  │  SSL/TLS    │  │    CDN Cache            │  │
│  │  trey.world │  │  (Full)     │  │  Static assets cached   │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                 │
│         └────────────────┼─────────────────────┘                 │
│                          │                                       │
│              ┌───────────▼───────────┐                          │
│              │   Cloudflare Tunnel   │  (alternative to         │
│              │   OR Proxy to VPS IP  │   opening ports)         │
│              └───────────┬───────────┘                          │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      HETZNER VPS (CX22)                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                      Ubuntu 22.04 LTS                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │   Caddy      │  │   Node.js    │  │    PM2           │  │  │
│  │  │   (reverse   │  │   (v20 LTS)  │  │    (process      │  │  │
│  │  │    proxy)    │◄─┤              │◄─┤     manager)     │  │  │
│  │  │   :80/:443   │  │   :3000      │  │                  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Two Ingress Options

**Option A: Cloudflare Tunnel (Recommended)**
- No ports exposed on VPS
- Zero-trust networking
- Automatic SSL
- Simpler firewall config

**Option B: Direct Proxy**
- Cloudflare proxies to VPS public IP
- Requires ports 80/443 open
- Caddy handles SSL termination (or use Cloudflare Full Strict)

**Recommendation:** Start with Option A (Tunnel) for simplicity and security.

---

## Special Considerations: 3D Features

The `feature/floating-library` branch adds significant 3D functionality that affects infrastructure:

### New Dependencies

```
@react-three/fiber      # React Three.js renderer
@react-three/drei       # R3F helpers
@react-three/postprocessing  # Visual effects
@react-three/rapier     # Physics engine
three                   # Three.js core (~500KB gzipped)
zustand                 # State management for 3D scenes
ecctrl                  # Character controller
three-pathfinding       # Navigation meshes
```

### Bundle Isolation Strategy

Three.js is **isolated to specific routes** to avoid bloating the main bundle:

- `/library` - Floating Library (3D book cosmos)
- `/interactive` - Interactive 3D world

The build includes a **bundle isolation check** (`pnpm check-bundle-isolation`) that verifies Three.js chunks don't leak into protected routes like `/`, `/writing`, `/about`, etc.

### 3D Asset Pipeline

```
public/assets/source/*.glb     # Uncompressed source assets
       ↓ (compress-assets.ts)
public/assets/chunks/*.glb     # Meshopt + KTX2 compressed
public/assets/props/*.glb      # Smaller prop assets
public/manifests/assets.manifest.json  # Asset registry
```

**Compression stack:**
- **Meshopt** - Geometry compression (significant size reduction)
- **KTX2** - Texture compression (requires `toktx` CLI, optional)

### Asset Budgets (Enforced)

| Budget | Limit |
|--------|-------|
| Per-chunk download | <2MB |
| Per-chunk triangles | <100K |
| Scene total triangles | <300K |
| Scene draw calls | <100 |
| Peak memory (2 chunks) | <500MB |

### Build Memory Requirements

Building with Three.js and asset compression requires more memory:

- **Minimum:** 4GB RAM (CX22 VPS has this)
- **Recommended:** Build in CI (GitHub Actions has 7GB)
- **Strategy:** Build artifacts in CI, deploy only the standalone output

---

## Code Changes Required

### 1. Next.js Configuration

**File:** `next.config.ts`

Add standalone output mode for self-hosting:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',  // ← ADD THIS

  // Existing config...
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'books.google.com' },
    ],
  },
}

export default nextConfig
```

**Why:** The `standalone` output creates a minimal production server that doesn't require `node_modules`. Reduces deployment size from ~500MB to ~50MB.

---

### 2. Server Entry Point

**File:** `server.js` (new file in project root)

```javascript
// Custom server wrapper for production
// This is only used in production - dev still uses `next dev`

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
```

**Note:** With `output: 'standalone'`, Next.js generates its own server at `.next/standalone/server.js`. You can use that directly instead of this custom server. The standalone server is preferred.

---

### 3. Environment Variables

**File:** `.env.production` (new, not committed)

```bash
# Production environment
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Site URL (for RSS, OG images, canonical URLs)
NEXT_PUBLIC_SITE_URL=https://trey.world

# Buttondown (newsletter)
BUTTONDOWN_API_KEY=your-production-key

# Optional: Google Books API for higher rate limits
GOOGLE_BOOKS_API_KEY=your-key
```

**File:** `.env.example` (update existing)

```bash
# Required for production
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SITE_URL=https://trey.world

# Newsletter integration
BUTTONDOWN_API_KEY=

# Optional: Higher rate limits for book cover resolution
GOOGLE_BOOKS_API_KEY=
```

---

### 4. Package.json Scripts

**File:** `package.json`

The floating-library branch has a more complex build pipeline. Add `start:standalone`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "start:standalone": "node .next/standalone/server.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",

    // Prebuild (runs before next build)
    "prebuild": "tsx scripts/resolve-book-covers.ts && tsx scripts/generate-search-index.ts && tsx scripts/generate-interactive-manifests.ts && tsx scripts/compress-assets.ts",

    // Postbuild validation (runs after next build)
    "postbuild": "tsx scripts/validate-asset-budgets.ts && tsx scripts/check-bundle-isolation.ts",

    // Individual scripts
    "covers": "tsx scripts/resolve-book-covers.ts",
    "generate-search": "tsx scripts/generate-search-index.ts",
    "generate-manifests": "tsx scripts/generate-interactive-manifests.ts",
    "compress-assets": "tsx scripts/compress-assets.ts",
    "validate-budgets": "tsx scripts/validate-asset-budgets.ts",
    "check-bundle-isolation": "tsx scripts/check-bundle-isolation.ts",

    // Testing
    "test": "node --import tsx --test test/*.test.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Build pipeline order:**
1. `prebuild` - Resolve covers, generate search index, compress 3D assets
2. `next build` - Build Next.js app
3. `postbuild` - Validate asset budgets, verify bundle isolation

**Note:** `start:standalone` is for the VPS. The standalone server includes everything needed.

---

### 5. Health Check Endpoint

**File:** `app/api/health/route.ts` (new)

```typescript
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
```

**Why:** For monitoring and load balancer health checks.

---

### 6. Static Asset Headers (Required for 3D Assets)

**File:** `next.config.ts` (add headers)

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',

  // Cache static assets aggressively
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // 3D assets (GLB files are content-hashed, safe to cache forever)
      {
        source: '/assets/chunks/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/assets/props/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Book covers (also content-hashed)
      {
        source: '/covers/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ... rest of config
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml` (new)

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '9'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SITE_URL: ${{ secrets.SITE_URL }}

      # Postbuild validations are run automatically by npm/pnpm
      # They verify asset budgets and bundle isolation

      - name: Run E2E tests (optional)
        run: |
          npx playwright install --with-deps chromium
          pnpm test:e2e --project=chromium
        continue-on-error: true  # Don't fail deploy on E2E failures initially

      - name: Prepare standalone
        run: |
          # Copy static files to standalone
          cp -r .next/static .next/standalone/.next/static
          cp -r public .next/standalone/public

          # Create deployment archive
          tar -czf deploy.tar.gz -C .next/standalone .

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: standalone-build
          path: deploy.tar.gz
          retention-days: 7

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: standalone-build

      - name: Deploy to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: deploy.tar.gz
          target: /tmp/

      - name: Extract and restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e

            # Backup current deployment
            if [ -d /var/www/trey-world ]; then
              cp -r /var/www/trey-world /var/www/trey-world.backup
            fi

            # Extract new deployment
            mkdir -p /var/www/trey-world-new
            tar -xzf /tmp/deploy.tar.gz -C /var/www/trey-world-new

            # Copy environment file
            cp /var/www/trey-world/.env.production /var/www/trey-world-new/.env.production 2>/dev/null || true

            # Swap directories
            rm -rf /var/www/trey-world.old
            mv /var/www/trey-world /var/www/trey-world.old 2>/dev/null || true
            mv /var/www/trey-world-new /var/www/trey-world

            # Restart application
            pm2 restart trey-world --update-env || pm2 start /var/www/trey-world/server.js --name trey-world

            # Cleanup
            rm /tmp/deploy.tar.gz
            rm -rf /var/www/trey-world.old

            echo "Deployment complete!"

      - name: Health check
        run: |
          sleep 10
          curl -f https://trey.world/api/health || exit 1
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Hetzner VPS IP address |
| `VPS_USER` | SSH user (e.g., `deploy`) |
| `VPS_SSH_KEY` | Private SSH key for deployment |
| `SITE_URL` | `https://trey.world` |

---

## VPS Setup

### 1. Initial Server Setup

```bash
# SSH into fresh Hetzner VPS
ssh root@<vps-ip>

# Update system
apt update && apt upgrade -y

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Setup SSH key auth for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Disable password auth (after confirming key works)
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 2. Install Node.js

```bash
# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # v20.x.x
npm --version   # 10.x.x

# Install pnpm globally (optional, not needed for standalone)
npm install -g pnpm
```

### 3. Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd -u deploy --hp /home/deploy
```

### 4. Create Application Directory

```bash
sudo mkdir -p /var/www/trey-world
sudo chown deploy:deploy /var/www/trey-world
```

### 5. PM2 Ecosystem File

**File:** `/var/www/ecosystem.config.js`

```javascript
module.exports = {
  apps: [{
    name: 'trey-world',
    script: '/var/www/trey-world/server.js',
    cwd: '/var/www/trey-world',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_file: '/var/www/trey-world/.env.production',

    // Logging
    error_file: '/var/log/pm2/trey-world-error.log',
    out_file: '/var/log/pm2/trey-world-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

    // Restart policy
    max_restarts: 10,
    restart_delay: 1000,

    // Memory limit (restart if exceeded)
    max_memory_restart: '500M',
  }]
}
```

---

## Cloudflare Setup

### Option A: Cloudflare Tunnel (Recommended)

#### 1. Install cloudflared on VPS

```bash
# Download and install
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create trey-world

# Note the tunnel ID from output
```

#### 2. Configure Tunnel

**File:** `/etc/cloudflared/config.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/deploy/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: trey.world
    service: http://localhost:3000
  - hostname: www.trey.world
    service: http://localhost:3000
  - service: http_status:404
```

#### 3. Route DNS

```bash
# Add DNS record pointing to tunnel
cloudflared tunnel route dns trey-world trey.world
cloudflared tunnel route dns trey-world www.trey.world
```

#### 4. Run as Service

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Option B: Direct Proxy (Traditional)

#### 1. Install Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### 2. Configure Caddy

**File:** `/etc/caddy/Caddyfile`

```caddyfile
trey.world {
    reverse_proxy localhost:3000

    # Cloudflare real IP
    header_up X-Real-IP {http.request.header.CF-Connecting-IP}

    # Compression
    encode gzip zstd

    # Logging
    log {
        output file /var/log/caddy/access.log
        format json
    }
}

www.trey.world {
    redir https://trey.world{uri} permanent
}
```

#### 3. Cloudflare DNS Settings

In Cloudflare dashboard:
- Add A record: `trey.world` → `<VPS_IP>` (Proxied)
- Add A record: `www` → `<VPS_IP>` (Proxied)
- SSL/TLS mode: **Full (Strict)**

#### 4. Firewall

```bash
# UFW setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Cloudflare Configuration

### SSL/TLS Settings

| Setting | Value |
|---------|-------|
| SSL/TLS encryption mode | Full (strict) |
| Always Use HTTPS | On |
| Minimum TLS Version | TLS 1.2 |
| Opportunistic Encryption | On |
| TLS 1.3 | On |

### Caching Rules

**Page Rules or Cache Rules:**

| Rule | Setting |
|------|---------|
| `trey.world/_next/static/*` | Cache Level: Cache Everything, Edge TTL: 1 month |
| `trey.world/fonts/*` | Cache Level: Cache Everything, Edge TTL: 1 month |
| `trey.world/assets/chunks/*` | Cache Level: Cache Everything, Edge TTL: 1 month |
| `trey.world/assets/props/*` | Cache Level: Cache Everything, Edge TTL: 1 month |
| `trey.world/covers/*` | Cache Level: Cache Everything, Edge TTL: 1 month |
| `trey.world/manifests/*` | Cache Level: Standard, Edge TTL: 1 hour |
| `trey.world/api/*` | Cache Level: Bypass |
| `trey.world/*.xml` | Cache Level: Standard, Edge TTL: 1 hour |

**Note:** 3D assets (GLB files) are content-hashed, so aggressive caching is safe. The manifests are checked more frequently to pick up new asset versions.

### Security Settings

| Setting | Value |
|---------|-------|
| Security Level | Medium |
| Bot Fight Mode | On |
| Browser Integrity Check | On |
| Hotlink Protection | On (optional) |

---

## Monitoring & Alerting

### Basic Uptime Monitoring

Use free tier of one of:
- **UptimeRobot** (free, 5-min checks)
- **Betterstack** (free tier)
- **Cloudflare Health Checks** (if on paid plan)

Configure to check:
- `https://trey.world/api/health`
- Alert via email/Slack on failure

### Log Management

```bash
# PM2 logs
pm2 logs trey-world

# View last 100 lines
pm2 logs trey-world --lines 100

# Caddy logs (if using Option B)
tail -f /var/log/caddy/access.log
```

### Simple Disk/Memory Alerts

**File:** `/home/deploy/scripts/monitor.sh`

```bash
#!/bin/bash

DISK_THRESHOLD=80
MEM_THRESHOLD=80

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
MEM_USAGE=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')

if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}%"
fi

if [ "$MEM_USAGE" -gt "$MEM_THRESHOLD" ]; then
    echo "ALERT: Memory usage is ${MEM_USAGE}%"
fi
```

Add to cron: `0 * * * * /home/deploy/scripts/monitor.sh | mail -s "VPS Alert" you@email.com`

---

## Migration Checklist

### Pre-Migration

- [ ] Hetzner VPS provisioned (CX22, Ubuntu 22.04)
- [ ] SSH access configured with key auth
- [ ] Domain DNS currently managed (note TTL)
- [ ] Current site working on Vercel
- [ ] All code changes from this spec applied to codebase
- [ ] Build passes locally with `output: 'standalone'`

### VPS Setup

- [ ] System updated and secured
- [ ] Node.js 20 installed
- [ ] PM2 installed and configured
- [ ] Application directory created
- [ ] Environment variables configured

### Cloudflare Setup

- [ ] Domain added to Cloudflare (if not already)
- [ ] Tunnel created and configured (Option A) OR Caddy configured (Option B)
- [ ] DNS records pointing to VPS/tunnel
- [ ] SSL/TLS set to Full (Strict)
- [ ] Caching rules configured

### CI/CD Setup

- [ ] GitHub Actions workflow added
- [ ] GitHub Secrets configured (VPS_HOST, VPS_USER, VPS_SSH_KEY, SITE_URL)
- [ ] Test deployment triggered and verified

### Verification

- [ ] Site loads via new infrastructure
- [ ] All pages render correctly
- [ ] Newsletter signup works
- [ ] RSS feeds accessible
- [ ] API health endpoint returns 200
- [ ] Lighthouse score 90+ (on non-3D pages)
- [ ] No console errors

**3D-Specific Verification:**

- [ ] `/library` loads and displays floating books
- [ ] `/interactive` loads (if 3D assets are present)
- [ ] GLB assets load from Cloudflare CDN (check Network tab)
- [ ] WebGL fallback works on unsupported browsers
- [ ] Mobile touch controls work for 3D navigation

### Post-Migration

- [ ] Monitor for 24-48 hours
- [ ] Remove Vercel project (optional, can keep as backup)
- [ ] Update any external services pointing to old infrastructure
- [ ] Document any issues and resolutions

---

## Rollback Plan

### Quick Rollback (< 5 min)

If issues occur immediately after deployment:

```bash
# SSH to VPS
ssh deploy@<vps-ip>

# Restore backup
rm -rf /var/www/trey-world
mv /var/www/trey-world.backup /var/www/trey-world
pm2 restart trey-world
```

### Full Rollback to Vercel

If VPS infrastructure fails completely:

1. Update Cloudflare DNS to point to Vercel
   - Remove A records pointing to VPS
   - Add CNAME to Vercel (or re-enable Vercel DNS)
2. Redeploy on Vercel (should auto-deploy from main branch)
3. Wait for DNS propagation (set low TTL beforehand)

### Zero-Downtime Migration Strategy

1. Keep Vercel deployment running during migration
2. Set Cloudflare DNS TTL to 5 minutes before migration
3. Deploy to VPS and verify via direct IP or hosts file
4. Switch DNS from Vercel to VPS
5. Monitor for issues
6. Keep Vercel available for 48 hours as fallback

---

## Performance Considerations

### Next.js Standalone vs Vercel

| Aspect | Vercel | Standalone on VPS |
|--------|--------|-------------------|
| Cold starts | Serverless cold starts | None (always running) |
| Image optimization | Edge-optimized | Node.js (slower but fine) |
| Static caching | Automatic CDN | Via Cloudflare |
| ISR | Automatic | Supported |
| Edge functions | Yes | No (use Node.js) |

### Expected Performance

With Cloudflare caching static assets:
- **TTFB:** Similar or better (VPS is always warm)
- **Static assets:** Same (served from Cloudflare edge)
- **Dynamic routes:** Slightly slower (single origin vs edge)
- **Overall Lighthouse:** Should maintain 90+

### Optimizations if Needed

1. **Enable Cloudflare Argo** (~$5/mo) - Smarter routing
2. **Use Cloudflare Workers** for edge logic if needed
3. **Upgrade VPS** to CX32 if memory constrained
4. **Add Redis** for session/cache if needed (unlikely for this site)

---

## Security Considerations

### VPS Hardening

```bash
# Automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Secrets Management

- **Never commit `.env.production`** to git
- Store secrets in:
  - GitHub Secrets (for CI/CD)
  - `/var/www/trey-world/.env.production` on VPS (manual setup)
- Rotate API keys periodically

### Cloudflare Security

- Enable **WAF** rules (free tier has basic protection)
- Enable **Bot Fight Mode**
- Consider **Rate Limiting** on `/api/*` endpoints

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `next.config.ts` | Modified | Add `output: 'standalone'`, cache headers for 3D assets |
| `package.json` | Modified | Add `start:standalone` script (other scripts already exist) |
| `app/api/health/route.ts` | New | Health check endpoint |
| `.env.example` | Modified | Document required vars |
| `.github/workflows/deploy.yml` | New | CI/CD pipeline with E2E tests |
| `.gitignore` | Modified | Ensure `.env.production` ignored |

**Already Present in floating-library branch:**

| File | Description |
|------|-------------|
| `scripts/compress-assets.ts` | GLB compression pipeline |
| `scripts/validate-asset-budgets.ts` | Asset size validation |
| `scripts/check-bundle-isolation.ts` | Three.js bundle leak detection |
| `scripts/generate-interactive-manifests.ts` | Asset manifest generation |
| `playwright.config.ts` | E2E test configuration |
| `e2e/*.e2e.ts` | End-to-end tests |

---

## Implementation Phases

### Phase 1: Code Changes (1-2 hours)

1. Merge `feature/floating-library` into `main` (if not already)
2. Add `output: 'standalone'` to next.config.ts
3. Add cache headers for static/3D assets
4. Add health check endpoint
5. Add `start:standalone` script to package.json
6. Test local build with standalone output
7. Verify postbuild validations pass (bundle isolation, asset budgets)
8. Commit changes

### Phase 2: VPS Provisioning (1 hour)

1. Create Hetzner VPS (CX22, Ubuntu 22.04)
2. Initial server setup (users, SSH, firewall)
3. Install Node.js and PM2
4. Create application directory structure

### Phase 3: Cloudflare Setup (30 min)

1. Add domain to Cloudflare (if needed)
2. Create and configure tunnel
3. Configure SSL/TLS settings
4. Set up caching rules

### Phase 4: CI/CD Setup (30 min)

1. Add GitHub Actions workflow
2. Configure GitHub Secrets
3. Test deployment pipeline

### Phase 5: Migration (1 hour)

1. Lower DNS TTL
2. Deploy to VPS
3. Verify via direct access
4. Switch DNS
5. Monitor and verify

### Phase 6: Cleanup (30 min)

1. Verify everything working for 24-48 hours
2. Remove or pause Vercel project
3. Document any issues
4. Set up monitoring alerts

**Total Estimated Time:** 4-5 hours

---

## Open Questions

1. **Domain:** Is the domain already on Cloudflare, or does it need to be transferred/added?
2. **Tunnel vs Direct:** Preference for Cloudflare Tunnel (simpler, more secure) or traditional proxy (more control)?
3. **Monitoring:** Preference for monitoring service (UptimeRobot, Betterstack, etc.)?
4. **Backup strategy:** Want automated VPS snapshots on Hetzner (~20% of VPS cost)?
5. **3D Assets:** Are the GLB source files stored in the repo, or do they need to be fetched from elsewhere during build?
6. **E2E Tests:** Should deployment fail if E2E tests fail, or just warn?

---

## Summary of 3D Feature Impact

The `feature/floating-library` branch adds significant complexity but the infrastructure migration approach remains the same:

| Aspect | Impact |
|--------|--------|
| Bundle size | Larger, but isolated to specific routes |
| Build time | Longer (asset compression, validation) |
| Build memory | Higher (recommend CI build, not VPS) |
| Static assets | More (GLB files, covers, manifests) |
| Caching strategy | Same approach, more cache rules |
| Runtime requirements | Same (Node.js standalone) |
| VPS resources | CX22 still sufficient for serving |

The main change is ensuring aggressive CDN caching for 3D assets and running builds in CI where memory is less constrained.

---

*This spec provides a complete migration path from Vercel to self-hosted infrastructure, updated for the 3D features in the floating-library branch.*
