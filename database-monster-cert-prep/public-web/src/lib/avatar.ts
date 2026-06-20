export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_ACCEPT = AVATAR_ALLOWED_TYPES.join(",");

type AvatarFileDescriptor = {
  size: number;
  type: string;
};

const uuidPattern = "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const avatarPathPattern = new RegExp(
  `^${uuidPattern}/avatar-${uuidPattern}\\.(?:jpg|png|webp)$`,
  "i",
);

export function validateAvatarFile(file: AvatarFileDescriptor) {
  if (file.size <= 0) return "The selected profile photo is empty.";
  if (file.size > AVATAR_MAX_BYTES) return "Profile photos must be 2 MB or smaller.";
  if (!AVATAR_ALLOWED_TYPES.includes(file.type as (typeof AVATAR_ALLOWED_TYPES)[number])) {
    return "Choose a JPEG, PNG, or WebP image.";
  }
  return null;
}

export function avatarExtension(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  throw new Error("Unsupported avatar content type.");
}

export function buildAvatarPath(userId: string, contentType: string, uploadId = crypto.randomUUID()) {
  return `${userId}/avatar-${uploadId}.${avatarExtension(contentType)}`;
}

export function isAvatarPath(path: string | null | undefined) {
  return Boolean(path && avatarPathPattern.test(path));
}

export function getAvatarPublicUrl(path: string | null | undefined, supabaseUrl?: string | null) {
  if (!isAvatarPath(path) || !supabaseUrl) return null;

  try {
    const url = new URL(supabaseUrl);
    const encodedPath = path!
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    url.pathname = `/storage/v1/object/public/${AVATAR_BUCKET}/${encodedPath}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
