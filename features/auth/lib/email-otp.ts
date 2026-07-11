/** Must match Supabase Dashboard → Authentication → Email → Email OTP length */
export const EMAIL_OTP_LENGTH = 6;

export const EMAIL_OTP_MIN_LENGTH = 6;
export const EMAIL_OTP_MAX_LENGTH = 10;

export function normalizeEmailOtp(value: string): string {
  return value.replace(/\D/g, "").slice(0, EMAIL_OTP_MAX_LENGTH);
}

export function isCompleteEmailOtp(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (
    digits.length >= EMAIL_OTP_MIN_LENGTH &&
    digits.length <= EMAIL_OTP_MAX_LENGTH &&
    digits.length === EMAIL_OTP_LENGTH
  );
}
