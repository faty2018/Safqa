"use server";

import Groq from "groq-sdk";
import {
  compterAO,
  listerMesReponses,
  listerMesDemandesExperts,
  listerMesAlertes,
} from "./chatbot-tools";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Tu es l'assistant intégré à Safqa, une plateforme qui centralise les appels d'offres publics marocains et aide les entreprises à préparer leurs réponses.

Tu as accès à des outils pour interroger les VRAIES données de la plateforme (nombre d'AO, réponses de l'entreprise, demandes d'assistance, alertes configurées). Utilise-les systématiquement dès qu'une question porte sur des chiffres, des comptages, des dates, ou l'état actuel de quelque chose — ne réponds JAMAIS de mémoire ou en inventant des chiffres.

Pour les questions générales sur l'utilisation de la plateforme (comment faire X), réponds directement sans outil.

Ne donne aucun conseil juridique, aucune analyse experte sur un AO précis en dehors de ce que les outils retournent. Si la question sort de ton périmètre, invite l'utilisateur à utiliser "Assistance experts".

Réponds toujours en français, de façon concise (2-4 phrases sauf si une liste est nécessaire).`;

const TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "compter_ao",
      description:
        "Compte et liste les appels d'offres selon des filtres de date d'échéance et/ou montant.",
      parameters: {
        type: "object",
        properties: {
          date_debut: {
            type: "string",
            description: "Date de début au format YYYY-MM-DD",
          },
          date_fin: {
            type: "string",
            description: "Date de fin au format YYYY-MM-DD",
          },
          montant_min: { type: "number" },
          montant_max: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lister_mes_reponses",
      description:
        "Liste les réponses aux AO préparées par l'entreprise de l'utilisateur, filtrable par statut (brouillon, en_revision, soumis).",
      parameters: {
        type: "object",
        properties: {
          statut: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lister_mes_demandes_experts",
      description:
        "Liste les demandes d'assistance expert de l'entreprise de l'utilisateur, filtrable par statut (en_attente, en_cours, resolu).",
      parameters: {
        type: "object",
        properties: {
          statut: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lister_mes_alertes",
      description:
        "Liste les critères d'alertes configurés par l'entreprise de l'utilisateur.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executerOutil(nom: string, args: any) {
  switch (nom) {
    case "compter_ao":
      return compterAO(args);
    case "lister_mes_reponses":
      return listerMesReponses(args);
    case "lister_mes_demandes_experts":
      return listerMesDemandesExperts(args);
    case "lister_mes_alertes":
      return listerMesAlertes();
    default:
      return { erreur: "Outil inconnu" };
  }
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function askChatbot(historique: ChatMessage[]) {
  try {
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historique,
    ];

    // Premier appel : le modèle décide s'il a besoin d'un outil
    let completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      max_tokens: 512,
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });

    let message = completion.choices[0]?.message;

    // Boucle : tant que le modèle demande des outils, on les exécute
    let iterations = 0;
    while (message?.tool_calls && message.tool_calls.length > 0 && iterations < 3) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const resultat = await executerOutil(toolCall.function.name, args);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(resultat),
        });
      }

      completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        max_tokens: 512,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
      });

      message = completion.choices[0]?.message;
      iterations++;
    }

    const reponse = message?.content;

    if (!reponse) {
      return { error: "Réponse vide du modèle" };
    }

    return { data: reponse };
  } catch (err) {
    console.error("Erreur chatbot Groq:", err);
    return { error: "Une erreur est survenue, réessayez." };
  }
}