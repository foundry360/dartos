"use client";

import { useEffect, useMemo, useRef } from "react";
import { TargetIcon } from "@/components/ui/AvatarPlaceholder";
import { cn } from "@/utils/cn";
import { IMAGE_FILE_ACCEPT, isImageFile } from "@/utils/image-file";

interface SavedPlayerAvatarPickerProps {
  color: string | null;
  value: File | null;
  existingAvatarUrl?: string | null;
  existingAvatarRemoved?: boolean;
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
  disabled?: boolean;
}

export function SavedPlayerAvatarPicker({
  color,
  value,
  existingAvatarUrl = null,
  existingAvatarRemoved = false,
  onChange,
  onRemoveExisting,
  disabled = false,
}: SavedPlayerAvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filePreviewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  const previewUrl =
    filePreviewUrl ?? (!existingAvatarRemoved && existingAvatarUrl ? existingAvatarUrl : null);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !isImageFile(file)) {
      return;
    }

    onChange(file);
  };

  return (
    <div className="create-player-form__field create-player-form__avatar-field">
      <span className="create-player-form__label">Photo (optional)</span>
      <div className="saved-player-avatar-picker">
        <button
          type="button"
          className={cn(
            "saved-player-avatar-picker__button",
            !previewUrl && "saved-player-avatar-picker__button--placeholder",
          )}
          style={
            !previewUrl && color
              ? {
                  backgroundColor: color,
                  color: "#d4d4d8",
                  boxShadow: "none",
                }
              : undefined
          }
          aria-label="Choose player photo"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <span className="saved-player-avatar-picker__content" aria-hidden>
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="saved-player-avatar-picker__image" />
            ) : (
              <TargetIcon className="saved-player-avatar-picker__icon" />
            )}
          </span>
          <span className="saved-player-avatar-picker__badge">
            {previewUrl ? "Change" : "Add"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_FILE_ACCEPT}
          className="sr-only"
          disabled={disabled}
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <button
            type="button"
            className="saved-player-avatar-picker__remove"
            disabled={disabled}
            onClick={() => {
              if (value) {
                onChange(null);
                return;
              }

              onRemoveExisting?.();
            }}
          >
            Remove photo
          </button>
        ) : null}
      </div>
    </div>
  );
}
