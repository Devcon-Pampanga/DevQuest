"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { signIn, getFriendlyAuthError } from "@/lib/auth-helpers";

const TEAM_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

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

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.replace("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  async function handleSignIn() {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const { onboardingComplete } = await signIn(email, password);
      router.replace(onboardingComplete ? "/dashboard" : "/onboarding");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getFriendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSignIn();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(124,58,237,0.28) 0%, transparent 65%)",
        backgroundColor: "#0a0a0f",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo + Wordmark */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/logo.png"
            alt="DevQuest logo"
            width={56}
            height={56}
            priority
          />
          <span className="font-heading text-2xl tracking-widest text-white uppercase">
            DevQuest
          </span>
          <p className="text-text-secondary text-sm text-center">
            Turn your volunteer work into your career.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-accent-primary mb-8 w-24 mx-auto" />

        {/* Email */}
        <div className="mb-4">
          <label className="block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="hero@devquest.org"
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

        {/* Forgot Password */}
        <div className="flex justify-end mb-6">
          <Link
            href="/forgot-password"
            className="text-xs text-accent-highlight hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing In…" : "Sign In"}
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-text-secondary text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-accent-highlight hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>

        {/* Team Color Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {TEAM_COLORS.map((color, i) => (
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
