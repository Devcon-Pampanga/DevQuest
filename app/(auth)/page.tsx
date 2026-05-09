"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { signIn, signInWithGoogle, getFriendlyAuthError } from "@/lib/auth-helpers";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

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
  const { firebaseUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (firebaseUser) router.replace("/dashboard");
  }, [firebaseUser, router]);

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

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      const { onboardingComplete } = await signInWithGoogle();
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

        {/* OR Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-muted text-[11px] uppercase tracking-widest">
            or
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-surface border border-border hover:border-accent-highlight text-text-primary font-sans text-sm py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          Continue with Google
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
