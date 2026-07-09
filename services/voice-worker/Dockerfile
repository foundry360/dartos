FROM node:22-bookworm-slim

WORKDIR /app

COPY index.mjs package.json ./

ENV PORT=8787 \
  VOICE_ENGINE=kokoro \
  KOKORO_URL=http://kokoro:7860 \
  KOKORO_VOICE=bm_george

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8787) + '/health').then(r => r.json()).then(j => process.exit(j.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.mjs"]
