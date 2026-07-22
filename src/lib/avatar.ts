type AvatarLike = {
  avatarUrl?: string | null;
  profile?: { photoUrl?: string | null } | null;
};

export function resolveAvatarUrl(user?: AvatarLike | null): string | null {
  if (!user) return null;
  return normalizeAvatarUrl(user.avatarUrl) || normalizeAvatarUrl(user.profile?.photoUrl) || null;
}

function normalizeAvatarUrl(url?: string | null): string | null {
  const clean = url?.trim();
  if (!clean) return null;
  if (clean.startsWith("/uploads/")) return null;
  return clean;
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return initials || "?";
}
