# Safqa — Frontend

Next.js (App Router) + Supabase + Tailwind, structuré autour des 7 modules validés dans les
maquettes Stitch.

## Démarrer en local

```bash
npm install
cp .env.local.example .env.local   # puis remplir avec tes vraies valeurs Supabase
npm run dev
```

Ouvre http://localhost:3000 — ça redirige direct vers /dashboard.

## Structure du projet

```
src/
├── app/
│   ├── page.tsx                  → redirige vers /dashboard
│   ├── layout.tsx                → layout racine (police, <html>, etc.)
│   ├── globals.css               → tokens de design (couleurs, voir plus bas)
│   └── (app)/                    → "route group" : toutes les pages internes
│       ├── layout.tsx            → Sidebar + Header, partagés par les 7 modules
│       ├── dashboard/page.tsx
│       ├── recherche/page.tsx
│       ├── analyse-ia/page.tsx
│       ├── reponses/page.tsx
│       ├── assistance-experts/page.tsx
│       ├── alertes/page.tsx
│       └── parametres/page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           → navigation, ordre fixe des 7 modules
│   │   └── Header.tsx            → recherche, notifications, assistance, avatar
│   └── ui/
│       ├── StatusBadge.tsx       → les 3 statuts uniquement (nouveau/en_cours/cloture)
│       └── StatCard.tsx          → carte KPI réutilisable (dashboard)
└── lib/
    ├── types.ts                  → types métier (Tender, Organisme, Alert, etc.)
    └── supabase/
        ├── client.ts             → client Supabase pour les Client Components
        └── server.ts             → client Supabase pour Server Components / API routes
```

### Pourquoi un "route group" (app) ?

Le dossier (app) a des parenthèses : ça veut dire que Next.js ne l'ajoute PAS à l'URL.
(app)/dashboard/page.tsx devient bien /dashboard, pas /app/dashboard. L'intérêt : tous les
écrans dans ce groupe partagent le même layout.tsx (Sidebar + Header), et plus tard, un groupe
(auth) séparé pourra contenir les pages login/signup sans cette sidebar.

### Pourquoi les couleurs sont dans globals.css et pas éparpillées ?

C'est le problème qu'on a eu avec Stitch : chaque écran généré séparément dérivait sur sa propre
palette. Ici, toutes les couleurs (bleu marine, accent, statuts) sont définies une seule fois en
haut de globals.css, puis utilisées partout via var(--color-navy) etc. Si un jour tu changes
le bleu marine, tu le changes à un seul endroit.

### Où sont les vraies données ?

Nulle part encore — chaque page a des données factices (mock) ou un TODO en attendant que les
tables Supabase existent. Le prochain gros morceau, c'est de créer le schéma Supabase
(categories, domaines, sous_domaines, organismes, tenders, companies, responses,
alerts...) à partir de ton diagramme de classes, puis de remplacer les mocks par de vraies
requêtes (createClient().from("tenders").select("*")).

### Prochaines étapes suggérées

1. Créer le projet Supabase, récupérer l'URL + clé anon, remplir .env.local
2. Traduire le diagramme de classes en tables Supabase (SQL ou éditeur visuel)
3. Brancher l'authentification (login/signup, multi-tenant via company_id)
4. Remplacer les mocks de dashboard/page.tsx et recherche/page.tsx par de vraies requêtes
5. Construire les écrans encore en TODO (Analyse IA, Réponses, etc.) en suivant le même
   pattern que Dashboard
