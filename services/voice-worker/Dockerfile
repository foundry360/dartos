FROM node:22-bookworm-slim

ARG PIPER_VERSION=2023.11.14-2
ARG TARGETARCH

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN case "${TARGETARCH}" in \
      amd64) PIPER_ARCH="x86_64" ;; \
      arm64) PIPER_ARCH="aarch64" ;; \
      *) echo "Unsupported architecture: ${TARGETARCH}" && exit 1 ;; \
    esac \
  && curl -fsSL "https://github.com/rhasspy/piper/releases/download/${PIPER_VERSION}/piper_linux_${PIPER_ARCH}.tar.gz" \
    | tar -xz -C /opt \
  && ln -sf /opt/piper/piper /usr/local/bin/piper

RUN mkdir -p /models \
  && curl -fsSL -o /models/en_GB-alan-medium.onnx \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx" \
  && curl -fsSL -o /models/en_GB-alan-medium.onnx.json \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json"

WORKDIR /app

COPY index.mjs package.json ./

ENV PORT=8787 \
  PIPER_BIN=/usr/local/bin/piper \
  PIPER_MODEL_PATH=/models/en_GB-alan-medium.onnx

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "index.mjs"]
