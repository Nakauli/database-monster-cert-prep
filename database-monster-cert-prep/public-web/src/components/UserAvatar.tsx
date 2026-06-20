import Image from "next/image";
import { getAvatarInitials } from "@/lib/leaderboard";
import { cn } from "@/lib/utils";

const avatarPixels = {
  sm: 36,
  md: 44,
  lg: 72,
} as const;

export function UserAvatar({
  alt = "",
  className,
  name,
  size = "sm",
  src,
}: {
  alt?: string;
  className?: string;
  name: string;
  size?: keyof typeof avatarPixels;
  src?: string | null;
}) {
  const pixels = avatarPixels[size];

  return (
    <span className={cn("leaderboard-avatar user-avatar", `user-avatar-${size}`, className)}>
      {src ? (
        <Image
          alt={alt}
          className="user-avatar-image"
          height={pixels}
          sizes={`${pixels}px`}
          src={src}
          unoptimized={src.startsWith("blob:")}
          width={pixels}
        />
      ) : (
        <span aria-hidden="true">{getAvatarInitials(name)}</span>
      )}
    </span>
  );
}
