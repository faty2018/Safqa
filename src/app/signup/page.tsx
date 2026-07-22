import { SignupForm } from "@/components/auth/SignupForm";
import { GlobeScene } from "@/components/three/GlobeScene";

export default function SignupPage() {
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
            La veille des marchés publics, automatisée pour vous.
          </h1>
          <p className="text-sm leading-relaxed text-white/70">
            Safqa surveille en continu les appels d&apos;offres marocains et vous
            alerte dès qu&apos;une opportunité correspond à votre secteur.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "Collecte automatique quotidienne",
              "Filtrage par secteur d'activité",
              "Analyse et assistance à la réponse",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#4A90D9]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex w-full items-center justify-center bg-[var(--background)] px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}