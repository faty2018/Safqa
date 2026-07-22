import { LoginForm } from "@/components/auth/LoginForm";
import { GlobeScene } from "@/components/three/GlobeScene";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche — globe 3D */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[var(--color-navy)] lg:flex">
        <div className="absolute inset-0">
          <GlobeScene />
        </div>

        <div className="relative z-10 max-w-md px-10 text-white pointer-events-none">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/60">
            Safqa
          </p>
          <h1 className="mb-4 text-3xl font-semibold leading-tight">
            Bienvenue de retour.
          </h1>
          <p className="text-sm leading-relaxed text-white/70">
            Vos appels d&apos;offres surveillés, vos alertes, votre veille — tout
            vous attend.
          </p>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex w-full items-center justify-center bg-[var(--background)] px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}