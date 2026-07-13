#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PROJECT_REF = "iopucyjntleuozjkjpzu";

function loadEnvFile(filePath) {
  const vars = {};

  if (!fs.existsSync(filePath)) {
    return vars;
  }

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index < 0) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

function requireEnv(env, key) {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing ${key}. Add it to .env.local (see .env.example).`);
  }

  return value;
}

async function patchAuthConfig(accessToken, body) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase auth config update failed (${response.status}): ${
        typeof payload === "string" ? payload : JSON.stringify(payload)
      }`,
    );
  }

  return payload;
}

async function main() {
  const env = {
    ...loadEnvFile(path.join(ROOT, ".env")),
    ...loadEnvFile(path.join(ROOT, ".env.local")),
    ...process.env,
  };

  const resendApiKey = requireEnv(env, "RESEND_API_KEY");
  const accessToken = requireEnv(env, "SUPABASE_ACCESS_TOKEN");
  const senderEmail = env.RESEND_SENDER_EMAIL?.trim() || "jgelsomino@foundry360.us";
  const senderName = env.RESEND_SENDER_NAME?.trim() || "VectorOS";

  const templatePath = path.join(ROOT, "supabase/templates/confirm-signup.html");
  const confirmationTemplate = fs.readFileSync(templatePath, "utf8").trim();

  const payload = {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    smtp_host: "smtp.resend.com",
    smtp_port: "465",
    smtp_user: "resend",
    smtp_pass: resendApiKey,
    smtp_admin_email: senderEmail,
    smtp_sender_name: senderName,
    smtp_max_frequency: 30,
    rate_limit_email_sent: 120,
    mailer_otp_length: 6,
    mailer_subjects_confirmation: "Your VectorOS verification code",
    mailer_templates_confirmation_content: confirmationTemplate,
  };

  const result = await patchAuthConfig(accessToken, payload);

  console.log("Resend SMTP configured for Supabase project:", PROJECT_REF);
  console.log("Sender:", `${senderName} <${senderEmail}>`);
  console.log("Confirm-signup template updated with {{ .Token }} OTP (6 digits).");
  console.log("SMTP host:", result.smtp_host || "smtp.resend.com");
  console.log("");
  console.log("Next:");
  console.log("1. Sign up again in the app — you should receive a 6-digit code.");
  console.log("2. Ensure foundry360.us is verified in Resend for", senderEmail);
  console.log(
    "3. Add production redirect URL in Supabase if needed:",
    "https://dartos-black.vercel.app/auth/callback",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
