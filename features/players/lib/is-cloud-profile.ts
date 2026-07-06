const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCloudProfileId(profileId: string | undefined): profileId is string {
  if (!profileId || profileId.startsWith("guest-")) {
    return false;
  }

  if (profileId.startsWith("account-")) {
    return false;
  }

  return UUID_PATTERN.test(profileId);
}
