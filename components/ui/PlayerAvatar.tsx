import { BotIcon, TargetIcon } from "@/components/ui/AvatarPlaceholder";
import { cn } from "@/utils/cn";

function getInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

interface PlayerAvatarProps {
  name: string;
  color: string;
  avatarUrl?: string | null;
  isGuest?: boolean;
  isBot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function PlayerAvatar({
  name,
  color,
  avatarUrl,
  isGuest = false,
  isBot = false,
  size = "md",
  className,
}: PlayerAvatarProps) {
  return (
    <span
      className={cn(
        "player-avatar",
        size === "sm" && "player-avatar--sm",
        isBot && "player-avatar--bot",
        isGuest && !isBot && "player-avatar--guest",
        avatarUrl && "player-avatar--photo",
        className,
      )}
      style={isGuest || isBot || avatarUrl ? undefined : { backgroundColor: color }}
      aria-hidden
    >
      {isBot ? (
        <BotIcon className="player-avatar__icon" />
      ) : isGuest ? (
        <TargetIcon className="player-avatar__icon" />
      ) : avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="player-avatar__image" />
      ) : (
        getInitial(name)
      )}
    </span>
  );
}
