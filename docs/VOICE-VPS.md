# Voice worker VPS setup

Production runs the Kokoro stack on a small Linux VPS with a **stable HTTPS subdomain**. Vercel calls this URL only when a clip is missing from Supabase Storage.

**Production example:** `https://voice.foundry360.us` → IONOS VPS → nginx → `localhost:8787` → Kokoro

**Stack overview:** [`docs/VOICE.md`](./VOICE.md)

---

## Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| vCPU | 1 | 2 |
| RAM | 2 GB (+ 2 GB swap) | 4 GB |
| Disk | 20 GB | 40 GB+ |
| OS | Ubuntu 22.04+ or Alma/RHEL 9 | Ubuntu 24.04 LTS |

Tested providers: IONOS, DigitalOcean, Hetzner, Linode. Any Linux VPS with Docker works.

You also need:

- A domain you control (e.g. GoDaddy) for a subdomain like `voice.yourdomain.com`
- Supabase project with `voice-clips` bucket (migration `20260708190000_voice_clips_storage.sql`)

---

## 1. VPS bootstrap

SSH in as root (or sudo user), then add swap on 2 GB machines:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Install Docker (Ubuntu):

```bash
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

---

## 2. Start the voice worker

```bash
git clone https://github.com/foundry360/dartos.git
cd dartos/services/voice-worker
openssl rand -hex 32   # save this — VOICE_SYNTHESIS_TOKEN
echo 'VOICE_SYNTHESIS_TOKEN=YOUR_TOKEN_HERE' > .env
docker compose up -d --build
curl http://localhost:8787/health
```

Expected: `{"ok":true,"engine":"kokoro","voice":"bm_george","speed":1.2}`

Kokoro can take 1–2 minutes to become ready on first boot.

---

## 3. DNS (GoDaddy or any registrar)

Add an **A record**:

| Type | Name | Value |
|------|------|-------|
| A | `voice` | Your VPS public IPv4 |

Example: `voice.foundry360.us` → `74.208.213.29`

Wait 5–30 minutes for DNS propagation.

---

## 4. HTTPS (nginx + Let's Encrypt)

Open **TCP 80 and 443** in your VPS provider firewall.

```bash
apt-get install -y nginx certbot python3-certbot-nginx

cat > /etc/nginx/sites-available/voice << 'EOF'
server {
    listen 80;
    server_name voice.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/voice /etc/nginx/sites-enabled/voice
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx && systemctl reload nginx

certbot --nginx -d voice.yourdomain.com
curl https://voice.yourdomain.com/health
```

Port **8787** stays on localhost only — nginx terminates TLS on 443.

**Ping may timeout** — many VPS providers block ICMP. Use `curl` to verify instead.

---

## 5. Vercel environment variables

Set in **Project → Settings → Environment Variables** (Production, Preview, Development):

| Variable | Example |
|----------|---------|
| `VOICE_SYNTHESIS_URL` | `https://voice.yourdomain.com` |
| `VOICE_SYNTHESIS_TOKEN` | Same token as `services/voice-worker/.env` on the VPS |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_VOICE_CLIP_PROFILE` | `kokoro-bm-george` |

Redeploy after changing env vars.

---

## 6. Seed clips to Supabase (one-time)

Run **on the VPS** so synthesis uses localhost (no public URL needed for seeding):

```bash
cd /root/dartos
npm ci

cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_VOICE_CLIP_PROFILE=kokoro-bm-george
EOF

VOICE_SYNTHESIS_URL=http://localhost:8787 \
VOICE_SYNTHESIS_TOKEN=YOUR_TOKEN_HERE \
npm run seed-voice-clips
```

Uploads ~900 clips (scores 0–180 + all commentary). Takes 20–60 minutes on a 2 GB VPS. Safe to stop and re-run — each file upserts.

After seeding, normal match play reads clips from **Supabase CDN**. The VPS is only hit for brand-new player names.

Verify a commentary clip:

```
https://YOUR_PROJECT.supabase.co/storage/v1/object/public/voice-clips/kokoro-bm-george/commentary/bobs-27/round-complete.wav
```

---

## Operations

### Update worker after git pull

```bash
cd ~/dartos/services/voice-worker
git pull
docker compose up -d --build
curl http://localhost:8787/health
```

### Monitor

```bash
docker compose ps
docker compose logs -f voice-worker
curl https://voice.yourdomain.com/health
```

### When the VPS is down

- **Pre-seeded clips** (scores, commentary, known player names) — still play from Supabase CDN
- **New player names** — silent until the VPS is back (no browser TTS fallback)

---

## Do not use in production

**Cloudflare quick tunnels** (`cloudflared tunnel --url …` → `*.trycloudflare.com`) rotate on every restart. Fine for local dev experiments only — not for `VOICE_SYNTHESIS_URL` on Vercel.

---

## Alternatives

| Option | Notes |
|--------|-------|
| Home PC + **named** Cloudflare Tunnel | Stable hostname, but depends on home machine uptime |
| GCP Cloud Run | See `services/voice-worker/deploy-cloud-run.sh` — Kokoro packaging is non-trivial |
| Managed TTS API | Different voice; not Kokoro George |

The VPS + subdomain approach is the current production standard for DartOS.
