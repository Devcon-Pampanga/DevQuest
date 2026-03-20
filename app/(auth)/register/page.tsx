"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, getFriendlyAuthError } from "@/lib/auth-helpers";
import { getPasswordStrength } from "@/utils/password";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  async function handleSignUp() {
    setError("");
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      router.replace("/onboarding");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getFriendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSignUp();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background:
          "radial-gradient(ellipse 100% 60% at 30% 20%, rgba(124,58,237,0.22) 0%, transparent 60%)",
        backgroundColor: "#0a0a0f",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Heading */}
        <h1 className="font-heading text-3xl text-text-primary mb-2">
          Create Account
        </h1>
        <p className="text-text-secondary text-sm mb-8">
          Join the DEVCON Kids volunteer network.
        </p>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="adventurer@devquest.org"
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary text-sm font-sans placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow"
          />
        </div>

        {/* Password */}
        <div className="mb-2">
          <label className="block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-surface border border-border rounded-lg px-4 py-3 pr-12 text-text-primary text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow"
            />
            <button
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Password Strength Bar */}
        <div className="mb-5">
          <div className="flex gap-1 mb-1.5">
            {[1, 2, 3, 4, 5].map((segment) => (
              <div
                key={segment}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  password.length > 0 && segment <= strength.score
                    ? strength.barColor
                    : "bg-border"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-sans uppercase tracking-widest text-text-muted">
              Security Rating
            </span>
            {password.length > 0 && (
              <span
                className={`text-[10px] font-sans uppercase tracking-widest ${strength.labelColor}`}
              >
                {strength.label}
              </span>
            )}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent-highlight transition-shadow"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Account…" : "Begin Your Quest ⚡"}
        </button>

        {/* Sign In Link */}
        <p className="text-center text-text-secondary text-sm mt-6">
          Already have an account?{" "}
          <Link
            href="/"
            className="text-accent-highlight hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>

        {/* Team Color Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {WAVE_COLORS.map((color, i) => (
            <div
              key={color}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: color,
                ...(loading && {
                  animation: "wave-dot 0.6s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }),
              }}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
