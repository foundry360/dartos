"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { TouchButton } from "@/components/ui/TouchButton";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  SUPPORT_ACCOUNT_TYPES,
  accountTypeFromPlan,
  type SupportAccountTypeId,
} from "@/features/support/lib/support-account-types";
import {
  SUPPORT_CATEGORIES,
  getSupportCategory,
  type SupportCategoryId,
} from "@/features/support/lib/support-categories";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { IMAGE_FILE_ACCEPT, isImageFile } from "@/utils/image-file";
import { cn } from "@/utils/cn";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function SupportRequestScreen() {
  const { user } = useAuth();
  const displayName = useProfileStore((state) => state.displayName);
  const imageInputId = useId();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<SupportCategoryId | null>(null);
  const [accountType, setAccountType] = useState<SupportAccountTypeId>("unsure");
  const [alternativeEmail, setAlternativeEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const selectedCategory = category ? getSupportCategory(category) : null;

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/subscription/status")
      .then((response) => response.json())
      .then((payload: { plan?: string | null }) => {
        if (!cancelled) {
          setAccountType(accountTypeFromPlan(payload.plan));
        }
      })
      .catch(() => {
        // Keep default account type when status is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetFormFields = () => {
    setSubject("");
    setMessage("");
    setAlternativeEmail("");
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const resetToCategories = () => {
    setCategory(null);
    resetFormFields();
    setError(null);
    setSubmitted(false);
  };

  const handleImageChange = (file: File | null) => {
    setError(null);

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!isImageFile(file)) {
      setError("Attachment must be an image (PNG, JPG, GIF, or WebP).");
      setImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 4 MB or smaller.");
      setImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      return;
    }

    setImageFile(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!category) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("category", category);
      formData.set("accountType", accountType);
      formData.set("subject", subject);
      formData.set("message", message);
      formData.set("alternativeEmail", alternativeEmail.trim());
      if (imageFile) {
        formData.set("image", imageFile);
      }

      const response = await fetch("/api/support", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to send support request.");
      }

      setSubmitted(true);
      resetFormFields();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send support request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <GlassPanel className="support-page__panel">
        <h2 className="support-page__heading">Request sent</h2>
        <p className="support-page__lead">
          Thanks{displayName ? `, ${displayName}` : ""}. We received your support request and will
          follow up by email{user?.email ? ` at ${user.email}` : ""}.
        </p>
        <TouchButton type="button" fullWidth size="lg" className="mt-4" onClick={resetToCategories}>
          Submit another request
        </TouchButton>
      </GlassPanel>
    );
  }

  if (!selectedCategory) {
    return (
      <div className="support-page__chooser">
        <header className="support-page__header">
          <h2 className="support-page__heading">Submit a request</h2>
          <p className="support-page__lead">
            What can we help you with? Please select the relevant category.
          </p>
        </header>

        <div className="support-page__cards" role="list">
          {SUPPORT_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="listitem"
              className="support-page__card"
              onClick={() => {
                setCategory(item.id);
                setError(null);
              }}
            >
              <span className="support-page__card-title">{item.label}</span>
              <span className="support-page__card-description">{item.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <GlassPanel className="support-page__panel">
      <button type="button" className="support-page__back" onClick={resetToCategories}>
        ← All categories
      </button>
      <h2 className="support-page__heading">{selectedCategory.label}</h2>
      <p className="support-page__lead">{selectedCategory.description}</p>

      <form className="support-page__form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="support-page__field">
          <span className="support-page__label">Account type</span>
          <select
            className="support-page__input support-page__select"
            value={accountType}
            disabled={submitting}
            required
            onChange={(event) => setAccountType(event.target.value as SupportAccountTypeId)}
          >
            {SUPPORT_ACCOUNT_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="support-page__field">
          <span className="support-page__label">Alternative email address</span>
          <input
            className="support-page__input"
            type="email"
            value={alternativeEmail}
            disabled={submitting}
            autoComplete="email"
            placeholder="Optional — if different from your account email"
            onChange={(event) => setAlternativeEmail(event.target.value)}
          />
        </label>

        <label className="support-page__field">
          <span className="support-page__label">Subject</span>
          <input
            className="support-page__input"
            type="text"
            value={subject}
            maxLength={120}
            required
            disabled={submitting}
            placeholder="Short summary"
            onChange={(event) => setSubject(event.target.value)}
          />
        </label>

        <label className="support-page__field">
          <span className="support-page__label">Description</span>
          <textarea
            className={cn("support-page__input", "support-page__textarea")}
            value={message}
            maxLength={5000}
            required
            disabled={submitting}
            rows={8}
            placeholder="Describe the issue or request."
            onChange={(event) => setMessage(event.target.value)}
          />
          <span className="support-page__helper">
            Please provide as much detail as possible, including what you were doing, what you
            expected, and what happened instead.
          </span>
        </label>

        <div className="support-page__field">
          <span className="support-page__label">Image</span>
          <input
            ref={imageInputRef}
            id={imageInputId}
            className="sr-only"
            type="file"
            accept={IMAGE_FILE_ACCEPT}
            disabled={submitting}
            onChange={(event) => handleImageChange(event.target.files?.[0] ?? null)}
          />
          <div className="support-page__image-row">
            <TouchButton
              type="button"
              variant="secondary"
              size="md"
              disabled={submitting}
              onClick={() => imageInputRef.current?.click()}
            >
              {imageFile ? "Change image" : "Add image"}
            </TouchButton>
            {imageFile ? (
              <button
                type="button"
                className="support-page__image-remove"
                disabled={submitting}
                onClick={() => handleImageChange(null)}
              >
                Remove
              </button>
            ) : null}
          </div>
          {imageFile ? (
            <p className="support-page__helper">{imageFile.name}</p>
          ) : (
            <span className="support-page__helper">Optional screenshot or photo (max 4 MB).</span>
          )}
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt="Selected support attachment preview"
              className="support-page__image-preview"
            />
          ) : null}
        </div>

        {error ? <p className="support-page__error">{error}</p> : null}

        <TouchButton type="submit" fullWidth size="lg" disabled={submitting}>
          {submitting ? "Sending…" : "Submit request"}
        </TouchButton>

        <p className="support-page__terms">
          By submitting this request, you agree to our{" "}
          <Link href="/terms" className="support-page__terms-link">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="support-page__terms-link">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </GlassPanel>
  );
}
