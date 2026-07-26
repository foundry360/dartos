import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Inline logo for Resend (avoids CDN/cache serving the old black-background asset). */
export const EMAIL_LOGO_CONTENT_ID = "vectoros-logo";
export const EMAIL_LOGO_CID_SRC = `cid:${EMAIL_LOGO_CONTENT_ID}`;

/** Public path for local HTML previews. */
export const EMAIL_LOGO_PUBLIC_PATH = "/vectoros-logo-email.png";

export function getEmailLogoAttachment() {
  const content = readFileSync(
    join(process.cwd(), "public", "vectoros-logo-email.png"),
  ).toString("base64");

  return {
    filename: "vectoros-logo-email.png",
    content,
    content_id: EMAIL_LOGO_CONTENT_ID,
  };
}
