"use client";

import { AvatarOptions, DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

interface AvatarProps {
  seed: string;
  options?: AvatarOptions;
  size?: number;
  className?: string;
}

export function Avatar({ seed, options = DEFAULT_AVATAR, size = 40, className = "" }: AvatarProps) {
  const url = buildAvatarUrl(seed, options);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={seed} width={size} height={size} className={`rounded-full ${className}`} />
  );
}
