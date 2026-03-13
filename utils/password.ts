export interface PasswordStrength {
  score: number;
  label: string;
  labelColor: string;
  barColor: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return { score: 0, label: "", labelColor: "", barColor: "" };
  }

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password) || /\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const levels: PasswordStrength[] = [
    { score: 0, label: "TOO SHORT",   labelColor: "text-red-500",    barColor: "bg-red-500" },
    { score: 1, label: "WEAK",        labelColor: "text-red-400",    barColor: "bg-red-400" },
    { score: 2, label: "FAIR",        labelColor: "text-yellow-400", barColor: "bg-yellow-400" },
    { score: 3, label: "GOOD",        labelColor: "text-blue-400",   barColor: "bg-blue-400" },
    { score: 4, label: "STRONG",      labelColor: "text-green-400",  barColor: "bg-green-400" },
    { score: 5, label: "VERY STRONG", labelColor: "text-purple-400", barColor: "bg-[#A855F7]" },
  ];

  return levels[score] ?? levels[0];
}
