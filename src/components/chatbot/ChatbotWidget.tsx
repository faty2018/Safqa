"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { askChatbot } from "@/lib/actions/chatbot";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const MESSAGE_ACCUEIL: Message = {
  role: "assistant",
  content:
    "Bonjour 👋 Je suis l'assistant Safqa. Posez-moi une question sur l'utilisation de la plateforme (recherche d'AO, analyse IA, alertes, assistance experts...).",
};

export function ChatbotWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([MESSAGE_ACCUEIL]);
  const [saisie, setSaisie] = useState("");
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  function handleEnvoyer() {
    const texte = saisie.trim();
    if (!texte) return;

    const nouvelHistorique: Message[] = [
      ...messages,
      { role: "user", content: texte },
    ];
    setMessages(nouvelHistorique);
    setSaisie("");

    startTransition(async () => {
      // On n'envoie que user/assistant au modèle, pas le message d'accueil statique si tu préfères l'exclure du contexte — ici on le garde, ça ne coûte rien
      const { data, error } = await askChatbot(
        nouvelHistorique.map(({ role, content }) => ({ role, content }))
      );

      if (error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ ${error}` },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data! },
      ]);
    });
  }

  return (
    <>
      {ouvert && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col rounded-lg border border-[var(--color-border)] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-navy)] p-4 rounded-t-lg">
            <p className="text-sm font-semibold text-white">Assistant Safqa</p>
            <button
              onClick={() => setOuvert(false)}
              className="text-white/80 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "assistant"
                    ? "bg-[var(--color-accent-light)]"
                    : "ml-auto bg-[var(--color-navy)] text-white"
                }`}
              >
                {m.content}
              </div>
            ))}
            {isPending && (
              <div className="max-w-[85%] rounded-lg bg-[var(--color-accent-light)] px-3 py-2 text-sm text-[var(--color-muted)]">
                En train d&apos;écrire...
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="flex gap-2 border-t border-[var(--color-border)] p-3">
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnvoyer()}
              placeholder="Posez votre question..."
              className="flex-1 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            />
            <button
              onClick={handleEnvoyer}
              disabled={isPending}
              className="rounded-md bg-[var(--color-navy)] px-3 py-2 text-white disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOuvert((prev) => !prev)}
        aria-label="Ouvrir l'assistant Safqa"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-navy)] text-white shadow-lg hover:opacity-90"
      >
        {ouvert ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}