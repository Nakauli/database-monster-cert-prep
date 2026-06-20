import assert from "node:assert/strict";
import test from "node:test";
import {
  AVATAR_MAX_BYTES,
  buildAvatarPath,
  getAvatarPublicUrl,
  validateAvatarFile,
} from "./avatar";

const userId = "53c5ddad-7e5b-4c7e-bc3b-82dff13e11aa";
const uploadId = "44b6e832-cb85-4bc1-89fa-1af73ed19331";

test("accepts supported profile photo files within the size limit", () => {
  assert.equal(validateAvatarFile({ size: AVATAR_MAX_BYTES, type: "image/webp" }), null);
  assert.equal(validateAvatarFile({ size: 200_000, type: "image/jpeg" }), null);
});

test("rejects empty, oversized, and active-content avatar formats", () => {
  assert.match(validateAvatarFile({ size: 0, type: "image/png" }) ?? "", /empty/i);
  assert.match(validateAvatarFile({ size: AVATAR_MAX_BYTES + 1, type: "image/png" }) ?? "", /2 MB/i);
  assert.match(validateAvatarFile({ size: 100_000, type: "image/svg+xml" }) ?? "", /JPEG, PNG, or WebP/i);
});

test("builds owner-scoped immutable avatar paths", () => {
  assert.equal(
    buildAvatarPath(userId, "image/jpeg", uploadId),
    `${userId}/avatar-${uploadId}.jpg`,
  );
});

test("creates public URLs only for valid avatar object paths", () => {
  const path = buildAvatarPath(userId, "image/webp", uploadId);
  assert.equal(
    getAvatarPublicUrl(path, "https://cpvxtbeikqjvbcxjpapf.supabase.co"),
    `https://cpvxtbeikqjvbcxjpapf.supabase.co/storage/v1/object/public/avatars/${path}`,
  );
  assert.equal(getAvatarPublicUrl("../private.txt", "https://example.supabase.co"), null);
});
