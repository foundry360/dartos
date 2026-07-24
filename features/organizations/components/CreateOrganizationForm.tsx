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
  boardCount: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  avatarFile?: File | null;
  removeAvatar?: boolean;
}

export interface CreateOrganizationFormValues {
  name?: string | null;
  description?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  boardCount?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
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
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [venueState, setVenueState] = useState(initialValues?.state ?? "");
  const [zip, setZip] = useState(initialValues?.zip ?? "");
  const [boardCount, setBoardCount] = useState(
    String(initialValues?.boardCount && initialValues.boardCount > 0
      ? initialValues.boardCount
      : 4),
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [existingAvatarRemoved, setExistingAvatarRemoved] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const readField = (key: string, fallback: string) => {
      const value = formData.get(key);
      return typeof value === "string" ? value.trim() : fallback.trim();
    };
    const parsedBoards = Number.parseInt(
      readField("boardCount", boardCount) || boardCount,
      10,
    );
    await onSubmit({
      name: readField("name", name),
      description: readField("description", description) || undefined,
      primaryContactName: readField("primaryContactName", primaryContactName) || undefined,
      primaryContactEmail: readField("primaryContactEmail", primaryContactEmail) || undefined,
      primaryContactPhone: readField("primaryContactPhone", primaryContactPhone) || undefined,
      boardCount: Number.isFinite(parsedBoards) ? parsedBoards : 4,
      address: readField("address", address) || undefined,
      city: readField("city", city) || undefined,
      state: readField("state", venueState) || undefined,
      zip: readField("zip", zip) || undefined,
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

      <div className="create-organization-form__row create-organization-form__row--basics">
        <label className="create-organization-form__field">
          <span className="create-organization-form__label">Venue name</span>
          <input
            name="name"
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

        <label className="create-organization-form__field create-organization-form__field--boards">
          <span className="create-organization-form__label">Number of boards</span>
          <input
            name="boardCount"
            type="number"
            inputMode="numeric"
            min={1}
            max={64}
            step={1}
            value={boardCount}
            onChange={(event) => setBoardCount(event.target.value)}
            className="setup-input"
            placeholder="4"
            required
            disabled={submitting}
          />
        </label>
      </div>

      <label className="create-organization-form__field">
        <span className="create-organization-form__label">Address</span>
        <input
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="setup-input"
          placeholder="Street address"
          maxLength={120}
          disabled={submitting}
          autoComplete="street-address"
        />
      </label>

      <div className="create-organization-form__row create-organization-form__row--location">
        <label className="create-organization-form__field">
          <span className="create-organization-form__label">City</span>
          <input
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="setup-input"
            placeholder="City"
            maxLength={80}
            disabled={submitting}
            autoComplete="address-level2"
          />
        </label>

        <label className="create-organization-form__field create-organization-form__field--state">
          <span className="create-organization-form__label">State</span>
          <input
            name="state"
            value={venueState}
            onChange={(event) => setVenueState(event.target.value)}
            className="setup-input"
            placeholder="FL"
            maxLength={40}
            disabled={submitting}
            autoComplete="address-level1"
          />
        </label>

        <label className="create-organization-form__field create-organization-form__field--zip">
          <span className="create-organization-form__label">Zip</span>
          <input
            name="zip"
            value={zip}
            onChange={(event) => setZip(event.target.value)}
            className="setup-input"
            placeholder="ZIP"
            maxLength={10}
            disabled={submitting}
            autoComplete="postal-code"
            inputMode="numeric"
          />
        </label>
      </div>

      <div className="create-organization-form__row">
        <label className="create-organization-form__field">
          <span className="create-organization-form__label">Contact</span>
          <input
            name="primaryContactName"
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
            name="primaryContactEmail"
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
          name="primaryContactPhone"
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

      <label className="create-organization-form__field">
        <span className="create-organization-form__label">Description (optional)</span>
        <textarea
          name="description"
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
        <TouchButton
          type="submit"
          fullWidth
          size="lg"
          disabled={submitting || !name.trim()}
        >
          {submitting ? submittingLabel : submitLabel}
        </TouchButton>
      </div>
    </form>
  );
}
