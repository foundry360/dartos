import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  OrganizationRow,
} from "@/lib/supabase/database.types";
import {
  uploadOrganizationAvatar,
  updateOrganizationLogoUrl,
  deleteOrganizationAvatarFiles,
} from "@/lib/supabase/queries/organization-avatars";

export type OrganizationRole = "owner" | "admin" | "member";

export interface OrganizationMembership {
  organization: OrganizationRow;
  role: OrganizationRole;
}

const ORGANIZATION_SELECT = `
  id,
  name,
  slug,
  description,
  logo_url,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  created_by,
  created_at,
  updated_at
` as const;

function isOrganizationRole(value: string): value is OrganizationRole {
  return value === "owner" || value === "admin" || value === "member";
}

export function formatOrganizationRole(role: OrganizationRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "member":
      return "Member";
  }
}

export async function fetchMyOrganizations(
  supabase: SupabaseClient<Database>,
): Promise<OrganizationMembership[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organization:organizations (
        ${ORGANIZATION_SELECT}
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const memberships: OrganizationMembership[] = [];

  for (const row of data ?? []) {
    const organization = row.organization as OrganizationRow | OrganizationRow[] | null;
    const org = Array.isArray(organization) ? organization[0] : organization;

    if (!org || !isOrganizationRole(row.role)) {
      continue;
    }

    memberships.push({
      organization: org,
      role: row.role,
    });
  }

  return memberships;
}

export async function fetchOrganizationBySlug(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<OrganizationMembership | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select(ORGANIZATION_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (organizationError) {
    throw organizationError;
  }

  if (!organization) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership || !isOrganizationRole(membership.role)) {
    return null;
  }

  return {
    organization,
    role: membership.role,
  };
}

export interface CreateOrganizationInput {
  name: string;
  description?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  avatarFile?: File | null;
}

export async function createOrganization(
  supabase: SupabaseClient<Database>,
  input: CreateOrganizationInput,
): Promise<OrganizationMembership> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Venue name is required.");
  }

  const trimmedDescription = input.description?.trim() || null;
  const trimmedContactName = input.primaryContactName?.trim() || null;
  const trimmedContactEmail = input.primaryContactEmail?.trim() || null;
  const trimmedContactPhone = input.primaryContactPhone?.trim() || null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to create a venue.");
  }

  const { data, error } = await supabase.rpc("create_organization", {
    org_name: trimmedName,
    org_description: trimmedDescription,
    contact_name: trimmedContactName,
    contact_email: trimmedContactEmail,
    contact_phone: trimmedContactPhone,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("elite subscription required") ||
      message.includes("league pro subscription required")
    ) {
      throw new Error("League Pro subscription is required for league management.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to create venue.");
  }

  let organization = data;

  if (input.avatarFile) {
    const logoUrl = await uploadOrganizationAvatar(
      supabase,
      user.id,
      organization.id,
      input.avatarFile,
    );
    organization = await updateOrganizationLogoUrl(supabase, organization.id, logoUrl);
  }

  return {
    organization,
    role: "owner",
  };
}

export interface UpdateOrganizationInput {
  organizationId: string;
  name: string;
  description?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

export async function updateOrganization(
  supabase: SupabaseClient<Database>,
  input: UpdateOrganizationInput,
): Promise<OrganizationRow> {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Venue name is required.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in to update this venue.");
  }

  const { data, error } = await supabase
    .from("organizations")
    .update({
      name: trimmedName,
      description: input.description?.trim() || null,
      primary_contact_name: input.primaryContactName?.trim() || null,
      primary_contact_email: input.primaryContactEmail?.trim() || null,
      primary_contact_phone: input.primaryContactPhone?.trim() || null,
    })
    .eq("id", input.organizationId)
    .select(ORGANIZATION_SELECT)
    .single();

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("row-level security") ||
      message.includes("permission") ||
      message.includes("policy")
    ) {
      throw new Error("Only venue owners can edit venue details.");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Unable to update venue.");
  }

  let organization = data as OrganizationRow;

  if (input.avatarFile) {
    const logoUrl = await uploadOrganizationAvatar(
      supabase,
      user.id,
      organization.id,
      input.avatarFile,
    );
    organization = await updateOrganizationLogoUrl(supabase, organization.id, logoUrl);
  } else if (input.removeAvatar) {
    await deleteOrganizationAvatarFiles(supabase, user.id, organization.id);
    organization = await updateOrganizationLogoUrl(supabase, organization.id, null);
  }

  return organization;
}
