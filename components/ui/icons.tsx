// Shared SVG icon components.
// All icons accept a `size` prop (default 16) and pass remaining props to the <svg>.
// Use stroke="currentColor" variants; set color via Tailwind text-* or style.

import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps(size: number): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function LockIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function CheckIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function InfoCircleIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function QRCodeIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h.01M14 18h.01M18 14h.01M18 18h.01M18 21v.01M21 18h.01M21 21h.01" />
    </svg>
  );
}

export function UserIcon({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...baseProps(size)} {...rest}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
