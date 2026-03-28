"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { AvatarOptions } from "@/lib/avatar";
import { DEFAULT_AVATAR } from "@/lib/avatar";

export function ChapterAvatar({
  username,
  opts,
  size = 36,
}: {
  username: string;
  opts?: AvatarOptions;
  size?: number;
}) {
  return (
    <Avatar
      seed={username}
      options={opts ?? DEFAULT_AVATAR}
      size={size}
      className="!rounded-xl border border-border object-cover shrink-0"
    />
  );
}
