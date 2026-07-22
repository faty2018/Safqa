"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, User, Check } from "lucide-react";
import { signup } from "@/app/signup/actions";

const STEPS = ["Entreprise", "Compte admin"] as const;

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    raisonSociale: "",
    ice: "",
    nomAdmin: "",
    emailAdmin: "",
    motDePasse: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    setError(null);
    if (step === 0) {
      if (!form.raisonSociale.trim() || !form.ice.trim()) {
        setError("Merci de renseigner la raison sociale et l'ICE.");
        return;
      }
      setStep(1);
    }
  }

  function goBack() {
    setError(null);
    setStep(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nomAdmin.trim() || !form.emailAdmin.trim() || form.motDePasse.length < 8) {
      setError("Merci de compléter tous les champs (mot de passe : 8 caractères minimum).");
      return;
    }

    startTransition(async () => {
      const result = await signup(form);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
    });
  }

  return (
    <div>
      {/* Indicateur d'étapes */}
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                i < step
                  ? "bg-[var(--color-navy)] text-white"
                  : i === step
                  ? "border-2 border-[var(--color-navy)] text-[var(--color-navy)]"
                  : "border border-[var(--color-border)] text-[var(--color-muted)]"
              }`}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i <= step ? "text-[var(--color-navy)]" : "text-[var(--color-muted)]"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-px flex-1 bg-[var(--color-border)]" />
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-1 text-lg font-semibold text-[var(--color-navy)]">
        {step === 0 ? "Votre entreprise" : "Votre compte administrateur"}
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {step === 0
          ? "Ces informations identifient votre entreprise sur Safqa."
          : "Vous serez administrateur de ce compte entreprise."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`space-y-4 transition-all duration-300 ${
            step === 0 ? "opacity-100" : "hidden"
          }`}
        >
          <Field
            icon={<Building2 size={15} />}
            label="Raison sociale"
            value={form.raisonSociale}
            onChange={(v) => update("raisonSociale", v)}
            placeholder="Ex: Atlas Conseil SARL"
          />
          <Field
            label="ICE"
            value={form.ice}
            onChange={(v) => update("ice", v)}
            placeholder="000000000000000"
          />
        </div>

        <div
          className={`space-y-4 transition-all duration-300 ${
            step === 1 ? "opacity-100" : "hidden"
          }`}
        >
          <Field
            icon={<User size={15} />}
            label="Nom complet"
            value={form.nomAdmin}
            onChange={(v) => update("nomAdmin", v)}
            placeholder="Ex: Youssef Bakkali"
          />
          <Field
            label="Email professionnel"
            type="email"
            value={form.emailAdmin}
            onChange={(v) => update("emailAdmin", v)}
            placeholder="vous@entreprise.ma"
          />
          <Field
            label="Mot de passe"
            type="password"
            value={form.motDePasse}
            onChange={(v) => update("motDePasse", v)}
            placeholder="8 caractères minimum"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          {step === 1 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3.5 py-2 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-accent-light)]"
            >
              <ArrowLeft size={14} /> Retour
            </button>
          )}

          {step === 0 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[var(--color-navy)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Continuer <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-1 rounded-md bg-[var(--color-navy)] px-3.5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {isPending ? "Création en cours..." : "Créer mon compte"}
            </button>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
        Déjà inscrit ?{" "}
        <a href="/login" className="font-medium text-[var(--color-navy)] hover:underline">
          Se connecter
        </a>
      </p>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase text-[var(--color-muted)]">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2.5 focus-within:border-[var(--color-navy)]">
        {icon && <span className="text-[var(--color-muted)]">{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
      </div>
    </div>
  );
}