"use client";

import { useState } from "react";
import { TouchButton } from "@/components/ui/TouchButton";
import { VenueAvatarPicker } from "@/features/organizations/components/VenueAvatarPicker";

export interface CreateOrganizationFormInput {
  name: string;
  description?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

export interface CreateOrganizationFormValues {
  name?: string | null;
  description?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  logoUrl?: string | null;
}

interface CreateOrganizationFormProps {
  onSubmit: (input: CreateOrganizationFormInput) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  initialValues?: CreateOrganizationFormValues | null;
  submitLabel?: string;
  submittingLabel?: string;
}

export function CreateOrganizationForm({
  onSubmit,
  onCancel,
  submitting = false,
  error = null,
  initialValues = null,
  submitLabel = "Create venue",
  submittingLabel = "Creating...",
}: CreateOrganizationFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [primaryContactName, setPrimaryContactName] = useState(
    initialValues?.primaryContactName ?? "",
  );
  const [primaryContactEmail, setPrimaryContactEmail] = useState(
    initialValues?.primaryContactEmail ?? "",
  );
  const [primaryContactPhone, setPrimaryContactPhone] = useState(
    initialValues?.primaryContactPhone ?? "",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [existingAvatarRemoved, setExistingAvatarRemoved] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      name,
      description: description.trim() || undefined,
      primaryContactName: primaryContactName.trim() || undefined,
      primaryContactEmail: primaryContactEmail.trim() || undefined,
      primaryContactPhone: primaryContactPhone.trim() || undefined,
      avatarFile,
      removeAvatar: existingAvatarRemoved && !avatarFile,
    });
  };

  return (
    <form
      className="create-organization-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <VenueAvatarPicker
        value={avatarFile}
        existingAvatarUrl={initialValues?.logoUrl}
        existingAvatarRemoved={existingAvatarRemoved}
        onChange={setAvatarFile}
        onRemoveExisting={() => setExistingAvatarRemoved(true)}
        disabled={submitting}
      />

      <label className="create-organization-form__field">
        <span className="create-organization-form__label">Venue name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="setup-input"
          placeholder="e.g. Riverside darts club"
          autoFocus
          required
          maxLength={80}
          disabled={submitting}
        />
      </label>

      <fieldset className="create-organization-form__fieldset">
        <legend className="create-organization-form__legend">
          Primary contact / organizer
        </legend>

        <div className="create-organization-form__row">
          <label className="create-organization-form__field">
            <span className="create-organization-form__label">Contact</span>
            <input
              value={primaryContactName}
              onChange={(event) => setPrimaryContactName(event.target.value)}
              className="setup-input"
              placeholder="Name"
              maxLength={80}
              disabled={submitting}
            />
          </label>

          <label className="create-organization-form__field">
            <span className="create-organization-form__label">Email</span>
            <input
              type="email"
              value={primaryContactEmail}
              onChange={(event) => setPrimaryContactEmail(event.target.value)}
              className="setup-input"
              placeholder="Email"
              maxLength={120}
              disabled={submitting}
              autoComplete="email"
            />
          </label>
        </div>

        <label className="create-organization-form__field">
          <span className="create-organization-form__label">Phone</span>
          <input
            type="tel"
            value={primaryContactPhone}
            onChange={(event) => setPrimaryContactPhone(event.target.value)}
            className="setup-input"
            placeholder="Phone"
            maxLength={40}
            disabled={submitting}
            autoComplete="tel"
          />
        </label>
      </fieldset>

      <label className="create-organization-form__field">
        <span className="create-organization-form__label">Description (optional)</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="setup-input create-organization-form__textarea"
          placeholder="Where is this venue and what should players know?"
          rows={2}
          maxLength={500}
          disabled={submitting}
        />
      </label>

      {error ? <p className="create-organization-form__error">{error}</p> : null}

      <div className="create-organization-form__actions">
        <TouchButton
          type="submit"
          fullWidth
          size="lg"
          disabled={submitting || !name.trim()}
        >
          {submitting ? submittingLabel : submitLabel}
        </TouchButton>
        {onCancel ? (
          <TouchButton
            type="button"
            variant="secondary"
            fullWidth
            size="lg"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </TouchButton>
        ) : null}
      </div>
    </form>
  );
}
