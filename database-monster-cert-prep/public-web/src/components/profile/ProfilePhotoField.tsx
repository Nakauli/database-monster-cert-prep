"use client";

import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { AVATAR_ACCEPT, validateAvatarFile } from "@/lib/avatar";

export function ProfilePhotoField({
  currentAvatarUrl,
  displayName,
  disabled,
  onFileChange,
  onRemoveChange,
  removeRequested,
}: {
  currentAvatarUrl?: string | null;
  displayName: string;
  disabled?: boolean;
  onFileChange: (file: File | null) => void;
  onRemoveChange: (remove: boolean) => void;
  removeRequested: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    onRemoveChange(false);
    onFileChange(file);
  }

  function removePhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onFileChange(null);
    onRemoveChange(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  function cancelChange() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onFileChange(null);
    onRemoveChange(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const shownAvatarUrl = removeRequested ? null : previewUrl ?? currentAvatarUrl;
  const hasChange = Boolean(previewUrl || removeRequested);

  return (
    <fieldset className="profile-photo-field" disabled={disabled}>
      <legend>Profile photo</legend>
      <div className="profile-photo-row">
        <UserAvatar
          alt={shownAvatarUrl ? `${displayName || "User"} profile photo preview` : ""}
          name={displayName}
          size="lg"
          src={shownAvatarUrl}
        />
        <div className="profile-photo-actions">
          <label className="button outline profile-photo-picker" htmlFor="profile-photo">
            Choose photo
          </label>
          <input
            accept={AVATAR_ACCEPT}
            id="profile-photo"
            onChange={chooseFile}
            ref={inputRef}
            type="file"
          />
          {(shownAvatarUrl || currentAvatarUrl) && (
            <button className="button ghost" onClick={removePhoto} type="button">
              Remove photo
            </button>
          )}
          {hasChange && (
            <button className="button ghost" onClick={cancelChange} type="button">
              Cancel change
            </button>
          )}
        </div>
      </div>
      <p className="field-help">
        JPEG, PNG, or WebP up to 2 MB. Your photo is public when shown on your leaderboard profile.
      </p>
      {error && <p className="form-message error" role="alert">{error}</p>}
    </fieldset>
  );
}
