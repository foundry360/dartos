"use client";

import { useId, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  deleteProfileAvatarFile,
  updateProfileAvatar,
  uploadProfileAvatar,
} from "@/lib/supabase/queries/profile";
import { AvatarPlaceholder } from "@/components/ui/AvatarPlaceholder";
import { SettingsMenuIcon } from "@/components/ui/AppMenuIcons";
import { useProfileStore } from "@/features/profile/store/profile-store";
import { cn } from "@/utils/cn";
import { IMAGE_FILE_ACCEPT, isImageFile } from "@/utils/image-file";
import "./profile-avatar.css";

interface ProfileAvatarProps {
  user: User | null;
  displayName: string;
  className?: string;
  interactive?: boolean;
  onEdit?: () => void;
}

function AvatarMedia({ avatarUrl }: { avatarUrl: string | null }) {
  return (
    <span className="profile-avatar__media" aria-hidden>
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="profile-avatar__image" />
      ) : (
        <AvatarPlaceholder iconClassName="profile-avatar__icon" />
      )}
    </span>
  );
}

export function ProfileAvatar({
  user,
  displayName: _displayName,
  className,
  interactive = true,
  onEdit,
}: ProfileAvatarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarUrl = useProfileStore((state) => state.avatarUrl);
  const setAvatarUrl = useProfileStore((state) => state.setAvatarUrl);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !isImageFile(file)) {
      return;
    }

    setUploading(true);
    setError(null);

    try {
      if (user) {
        const supabase = createClient();
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const publicUrl = await uploadProfileAvatar(supabase, user.id, file);
        await updateProfileAvatar(supabase, user.id, publicUrl);
        setAvatarUrl(publicUrl);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setError(null);

    try {
      if (user) {
        const supabase = createClient();
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        await deleteProfileAvatarFile(supabase, user.id);
        await updateProfileAvatar(supabase, user.id, null);
      }

      setAvatarUrl(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to remove photo.");
    } finally {
      setUploading(false);
    }
  };

  if (!interactive) {
    if (!onEdit) {
      return (
        <div className={cn("profile-avatar profile-avatar--display", className)}>
          <span
            className={cn(
              "profile-avatar__button",
              !avatarUrl && "profile-avatar__button--placeholder",
            )}
            role="img"
            aria-label="Profile photo"
          >
            <AvatarMedia avatarUrl={avatarUrl} />
          </span>
        </div>
      );
    }

    return (
      <div className={cn("profile-avatar profile-avatar--display", className)}>
        <button
          type="button"
          className={cn(
            "profile-avatar__button",
            !avatarUrl && "profile-avatar__button--placeholder",
          )}
          aria-label="Edit profile"
          onClick={onEdit}
        >
          <AvatarMedia avatarUrl={avatarUrl} />
          <span className="profile-avatar__badge profile-avatar__badge--icon" aria-hidden>
            <SettingsMenuIcon className="profile-avatar__badge-icon" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("profile-avatar", className)}>
      <button
        type="button"
        className={cn(
          "profile-avatar__button",
          !avatarUrl && "profile-avatar__button--placeholder",
        )}
        aria-label="Change profile photo"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <AvatarMedia avatarUrl={avatarUrl} />
        <span className="profile-avatar__badge">{uploading ? "Saving..." : "Change"}</span>
      </button>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
      />

      {avatarUrl ? (
        <button
          type="button"
          className="profile-avatar__remove"
          disabled={uploading}
          onClick={() => void handleRemove()}
        >
          Remove photo
        </button>
      ) : null}

      {error ? <p className="profile-avatar__hint text-danger">{error}</p> : null}

      {!user ? (
        <p className="profile-avatar__hint">Sign in to sync your profile to the cloud.</p>
      ) : null}
    </div>
  );
}
