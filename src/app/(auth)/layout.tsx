export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold text-[var(--color-navy)]">Safqa</p>
        <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
          {children}
        </div>
      </div>
    </div>
  );
}