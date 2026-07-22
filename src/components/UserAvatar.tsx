"use client";

import { useEffect, useState } from "react";
import { getInitials } from "@/lib/avatar";

type UserAvatarProps = {
  name?: string | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function UserAvatar({ name, src, size = "md", className = "" }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const cleanSrc = src?.trim() || "";

  useEffect(() => {
    setFailed(false);
  }, [cleanSrc]);

  const classes = `${sizeClass[size]} shrink-0 rounded-full border border-border bg-accent/20 text-accent flex items-center justify-center font-medium object-cover ${className}`;

  if (cleanSrc && !failed) {
    // Plain img is intentional: avatars can be Google-hosted, data URLs, or local uploads.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cleanSrc} alt={name ? `Avatar de ${name}` : "Avatar"} className={classes} onError={() => setFailed(true)} />;
  }

  return <div className={classes}>{getInitials(name)}</div>;
}
