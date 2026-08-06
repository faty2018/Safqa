"use client";

import { useState, useTransition } from "react";
import { sauvegarderReponse } from "@/lib/actions/reponses";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";
import { Loader2, Download, Save } from "lucide-react";

type Section = { titre: string; contenu: string };

export function ReponseEditor({
  reponseId,
  trameInitiale,
  statut,
  aoReference,
  aoIntitule,
}: {
  reponseId: string;
  trameInitiale: { sections: Section[] };
  statut: string;
  aoReference: string;
  aoIntitule: string;
}) {
  const [sections, setSections] = useState<Section[]>(trameInitiale?.sections ?? []);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  function modifierSection(idx: number, contenu: string) {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, contenu } : s)));
  }

  function sauvegarder() {
    setMessage(null);
    startTransition(async () => {
      const res = await sauvegarderReponse(reponseId, { sections });
      setMessage(res.error ? "Erreur lors de la sauvegarde" : "Enregistré ✓");
    });
  }

  async function exporterWord() {
    setExporting(true);
    try {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: aoIntitule,
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                text: aoReference,
                spacing: { after: 300 },
              }),
              ...sections.flatMap((s) => [
                new Paragraph({
                  text: s.titre,
                  heading: HeadingLevel.HEADING_2,
                  spacing: { before: 300, after: 150 },
                }),
                ...s.contenu.split("\n").map(
                  (ligne) =>
                    new Paragraph({
                      text: ligne,
                      spacing: { after: 100 },
                    })
                ),
              ]),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reponse-${aoReference || reponseId}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {statut === "brouillon" ? "Brouillon" : statut}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={sauvegarder}
            disabled={isPending}
            className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
          <button
            onClick={exporterWord}
            disabled={exporting}
            className="flex items-center gap-2 rounded-md bg-[var(--color-navy)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Exporter en Word
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-slate-500">{message}</p>}

      <div className="space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              {section.titre}
            </label>
            <textarea
              value={section.contenu}
              onChange={(e) => modifierSection(idx, e.target.value)}
              rows={6}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}