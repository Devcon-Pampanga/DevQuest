"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { sendPasswordReset, getFriendlyAuthError } from "@/lib/auth-helpers";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(getFriendlyAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
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

        {sent ? (
          /* Success state */
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(6,182,212,0.15)" }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 className="font-heading text-lg tracking-wide text-text-primary">
              Check your inbox
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              If an account exists for{" "}
              <span className="text-text-primary font-medium">{email}</span>,
              you&apos;ll receive a password reset link shortly.
            </p>
            <Link
              href="/"
              className="text-sm text-accent-highlight hover:underline mt-2"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          /* Default state */
          <>
            <div className="mb-6">
              <p className="text-text-secondary text-sm text-center leading-relaxed">
                Enter the email address linked to your account and we&apos;ll
                send you a reset link.
              </p>
            </div>

            {/* Email */}
            <div className="mb-6">
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

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-accent-highlight hover:bg-accent-primary text-white font-heading text-sm tracking-widest uppercase py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>

            {/* Back to Sign In */}
            <p className="text-center text-text-secondary text-sm mt-6">
              Remember your password?{" "}
              <Link href="/" className="text-accent-highlight hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* Wave dots */}
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
