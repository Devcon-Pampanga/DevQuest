"use client";

export function SettingsAccountSection({
  onLogout,
  logoutLoading,
  deleteLoading,
  confirmDelete,
  setConfirmDelete,
  deleteError,
  setDeleteError,
  onDeleteAccount,
}: {
  onLogout: () => void | Promise<void>;
  logoutLoading: boolean;
  deleteLoading: boolean;
  confirmDelete: boolean;
  setConfirmDelete: (v: boolean) => void;
  deleteError: string;
  setDeleteError: (v: string) => void;
  onDeleteAccount: () => void | Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface overflow-hidden animate-fade-up" style={{ animationDelay: "120ms" }}>
      <div className="px-5 py-3 border-b border-border">
        <span className="font-heading text-sm text-text-primary">Account</span>
      </div>
      <div className="px-5 py-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void onLogout()}
          disabled={logoutLoading || deleteLoading}
          className="w-full py-2.5 px-4 rounded-xl font-heading text-sm tracking-wide border border-border text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
        >
          {logoutLoading ? "Signing out…" : "Log Out"}
        </button>

        <div className="pt-2 border-t border-border">
          <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(true);
                  setDeleteError("");
                }}
                disabled={logoutLoading || deleteLoading}
                className="w-full py-2.5 px-4 rounded-xl font-sans text-sm border border-red-800/60 text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                Delete Account
              </button>
            ) : (
              <div className="animate-fade-in">
                <p className="text-text-secondary text-xs text-center leading-relaxed mb-1">
                  This will permanently delete your account and all associated data.
                </p>
                <p className="text-red-400/80 text-xs text-center mb-4">This cannot be undone.</p>
                {deleteError ? (
                  <p className="text-xs text-red-400 font-sans text-center mb-3">{deleteError}</p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleteLoading}
                    className="flex-1 border border-border text-text-muted hover:text-text-primary font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteAccount()}
                    disabled={deleteLoading}
                    className="flex-1 border border-red-500/40 text-red-400 hover:bg-red-500/10 font-sans text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleteLoading ? "Deleting…" : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
