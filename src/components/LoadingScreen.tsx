'use client';

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface-strong)] p-8 text-center shadow-xl backdrop-blur">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-300/30 border-t-cyan-400" />
        </div>

        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          GameOps Platform
        </h2>

        <p className="mt-3 text-sm text-[var(--foreground-soft)]">
          Loading application...
        </p>
      </div>
    </div>
  );
}