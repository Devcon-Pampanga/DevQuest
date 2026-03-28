"use client";

import { SettingsFormField } from "@/components/settings/SettingsFormField";

const inputClass =
  "w-full bg-[#0f0f18] border border-border rounded-lg px-3 py-2.5 text-sm font-sans text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-highlight transition-colors";

export function SettingsProfileSection({
  avatarUrl,
  onOpenAvatarEditor,
  username,
  setUsername,
  contactNumber,
  setContactNumber,
  linkedinUrl,
  setLinkedinUrl,
  githubUrl,
  setGithubUrl,
  saveError,
  saveSuccess,
  saving,
  onSave,
}: {
  avatarUrl: string;
  onOpenAvatarEditor: () => void;
  username: string;
  setUsername: (v: string) => void;
  contactNumber: string;
  setContactNumber: (v: string) => void;
  linkedinUrl: string;
  setLinkedinUrl: (v: string) => void;
  githubUrl: string;
  setGithubUrl: (v: string) => void;
  saveError: string;
  saveSuccess: boolean;
  saving: boolean;
  onSave: () => void | Promise<void>;
}) {
  return (
    <section className="order-1 lg:order-none rounded-2xl border border-border bg-surface overflow-hidden animate-fade-up" style={{ animationDelay: "0ms" }}>
      <div className="px-5 py-3 border-b border-border">
        <span className="font-heading text-sm text-text-primary">Profile Info</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={onOpenAvatarEditor}
              className="w-16 h-16 rounded-xl overflow-hidden border border-border block focus:outline-none focus:ring-2 focus:ring-accent-highlight"
              style={{ backgroundColor: "#100c1a" }}
              aria-label="Edit avatar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" width={64} height={64} className="w-full h-full object-contain" />
            </button>
            <div
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border border-border pointer-events-none"
              style={{ backgroundColor: "#1a1625", color: "#A1A1AA" }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-sans text-text-primary">Your avatar</p>
            <button
              type="button"
              onClick={onOpenAvatarEditor}
              className="text-xs font-sans text-accent-highlight hover:text-accent-primary transition-colors text-left"
            >
              Change Avatar →
            </button>
          </div>
        </div>

        <div className="border-t border-border" />

        <SettingsFormField label="Username">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
            placeholder="your username"
            autoComplete="off"
          />
        </SettingsFormField>
        <SettingsFormField label="Mobile number">
          <input
            type="tel"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className={inputClass}
            placeholder="+63 9XX XXX XXXX"
          />
        </SettingsFormField>
        <SettingsFormField label="LinkedIn URL">
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className={inputClass}
            placeholder="https://linkedin.com/in/..."
          />
        </SettingsFormField>
        <SettingsFormField label="GitHub URL">
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={inputClass}
            placeholder="https://github.com/..."
          />
        </SettingsFormField>

        {saveError ? (
          <p className="text-xs text-red-400 font-sans animate-fade-in">{saveError}</p>
        ) : null}
        {saveSuccess ? (
          <p className="text-xs text-green-400 font-sans animate-fade-in">Changes saved.</p>
        ) : null}

        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="w-full py-2.5 px-4 rounded-xl font-heading text-sm tracking-wide bg-accent-highlight hover:bg-accent-primary text-white transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </section>
  );
}
