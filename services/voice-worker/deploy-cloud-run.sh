#!/usr/bin/env bash
set -euo pipefail

# Deploy dartos-voice-worker to GCP Cloud Run (serverless Docker).
#
# Prerequisites:
#   1. GCP project with billing enabled (free tier still requires a billing account)
#   2. gcloud CLI installed: https://cloud.google.com/sdk/docs/install
#   3. Run once: gcloud auth login && gcloud config set project YOUR_PROJECT_ID
#
# Usage:
#   ./deploy-cloud-run.sh
#   GCP_PROJECT=my-project GCP_REGION=us-central1 ./deploy-cloud-run.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="${GCP_SERVICE_NAME:-dartos-voice-worker}"
PROJECT_ID="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-us-central1}"
VOICE_TOKEN="${VOICE_SYNTHESIS_TOKEN:-}"

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "Set a GCP project: gcloud config set project YOUR_PROJECT_ID"
  echo "Or run: GCP_PROJECT=YOUR_PROJECT_ID ./deploy-cloud-run.sh"
  exit 1
fi

echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo "Service:  ${SERVICE_NAME}"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  --project "${PROJECT_ID}"

ENV_VARS="PIPER_BIN=/usr/local/bin/piper,PIPER_MODEL_PATH=/models/en_GB-alan-medium.onnx"
if [[ -n "${VOICE_TOKEN}" ]]; then
  ENV_VARS="${ENV_VARS},VOICE_SYNTHESIS_TOKEN=${VOICE_TOKEN}"
fi

gcloud run deploy "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --source "${ROOT_DIR}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 60 \
  --min-instances 0 \
  --max-instances 3 \
  --port 8787 \
  --set-env-vars "${ENV_VARS}"

SERVICE_URL="$(gcloud run services describe "${SERVICE_NAME}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --format 'value(status.url)')"

echo ""
echo "Deployed: ${SERVICE_URL}"
echo ""
echo "Test:"
echo "  curl -sS ${SERVICE_URL}/health"
echo ""
echo "Add to Vercel (and .env.local for local Next.js testing against prod worker):"
echo "  VOICE_SYNTHESIS_URL=${SERVICE_URL}"
if [[ -n "${VOICE_TOKEN}" ]]; then
  echo "  VOICE_SYNTHESIS_TOKEN=${VOICE_TOKEN}"
fi
echo "  SUPABASE_SERVICE_ROLE_KEY=<from Supabase Dashboard → Settings → API>"
