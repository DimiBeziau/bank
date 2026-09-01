# BudgetFlow — Plan d'implémentation

## Stack retenue (avec justification)
- **Next.js 16**, App Router, TypeScript strict — imposé.
- **Tailwind CSS v4** pour le style (glassmorphism via `backdrop-blur`, `bg-white/10`, coins arrondis) — le plus direct pour ce DA, pas de runtime CSS-in-JS à gérer en Docker.
- **Radix UI primitives** (Dialog, Checkbox) sous Tailwind — accessibilité (focus trap, ARIA) sans réinventer les composants interactifs.
- **Prisma + SQLite** — confirmé, adapté à un usage mono-utilisateur auto-hébergé. Fichier monté en volume Docker.
- **Server Actions** (Next 16) pour tout le CRUD, pas de couche API REST séparée ni de client-state library pour les données serveur (React re-render via `revalidatePath`). Plus simple qu'ajouter React Query pour un usage mono-utilisateur.
- **Zustand** uniquement pour l'état UI éphémère (modals ouverts, filtres de catégorie) — pas pour les données persistées.
- **Zod** pour valider les payloads des Server Actions (formulaires + garde-fous serveur).
- **date-fns** pour les calculs de dates (occurrences, bornes de cycle).
- **Vitest** pour tester unitairement la logique de périodicité/prévision (exigence T).
- **PWA manuelle** (manifest.json + service worker artisanal minimal, pas de lib `next-pwa` dont la compat Next 16/App Router est incertaine) — cache des assets statiques + fallback offline basique.

## Modèle de données (Prisma)
```prisma
enum PeriodicityUnit { DAY WEEK MONTH }

model Settings {
  id              Int      @id @default(1)
  startingCapital Float
  cycleStartDay   Int      // 1-28, jour de début du cycle mensuel
  updatedAt       DateTime @updatedAt
}

model Category {
  id    String @id @default(cuid())
  name  String @unique
  color String // hex, pour l'UI
  expenses      Expense[]
  wishlistItems WishlistItem[]
}

model Expense {
  id               String   @id @default(cuid())
  name             String
  amount           Float
  categoryId       String
  category         Category @relation(fields: [categoryId], references: [id])
  isOneTime        Boolean  @default(false)
  periodicityUnit  PeriodicityUnit? // null si ponctuelle
  periodicityValue Int?             // null si ponctuelle
  dueDate          DateTime         // date de référence / date d'échéance si ponctuelle
  isChecked        Boolean  @default(false) // "prise en compte"
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model WishlistItem {
  id           String   @id @default(cuid())
  name         String
  categoryId   String
  category     Category @relation(fields: [categoryId], references: [id])
  budget       Float
  isPurchased  Boolean  @default(false)
  createdAt    DateTime @default(now())
}
```

## Règle métier clé à valider avant codage
- **Cycle courant** = fenêtre [jour de début du cycle du mois en cours, jour de début du cycle du mois suivant).
- **Budget restant du cycle courant** = capital de départ − Σ(dépenses cochées dont une occurrence tombe dans le cycle courant) − Σ(wishlist cochées, déduites du cycle courant en cours, peu importe leur date).
- **Prévisions N mois** : pour chaque cycle futur, je pars du même capital de départ configuré (hypothèse : l'utilisateur le resaisit chaque mois) moins la somme des occurrences *projetées* (pas besoin d'être cochées, puisqu'elles ne le sont pas encore) des dépenses périodiques qui tombent dans ce cycle futur. Les dépenses ponctuelles ne comptent que dans le cycle où tombe leur `dueDate`. Les wishlist ne sont pas projetées dans le futur (pas de récurrence).
→ Cette hypothèse sur le report du capital entre mois est la seule zone grise du brief ; dites-moi si vous préférez un autre comportement (ex. report du solde restant au lieu de reset au capital configuré).

## Arborescence
```
app/
  layout.tsx            # meta PWA, SW registration, nav
  page.tsx              # redirect -> /budget
  budget/page.tsx
  wishlist/page.tsx
components/
  ui/                    # GlassCard, ProgressRing, Button, Checkbox, Modal, Input, Select
  budget/                # SettingsForm, ExpenseList, ExpenseForm, ForecastStrip, CategoryBreakdown
  wishlist/              # WishlistList, WishlistForm
  nav/                   # BottomNav (mobile), Sidebar (desktop)
lib/
  db.ts                  # Prisma client singleton
  actions/               # settings.ts, expenses.ts, wishlist.ts ('use server')
  services/
    periodicity.ts        # getCycleBounds, getOccurrencesInRange, isDueInCycle (pur, testable)
    forecast.ts            # computeCurrentCycleBudget, projectFutureCycles (pur, testable)
  validation/schemas.ts   # zod
  types.ts
prisma/
  schema.prisma
  seed.ts                 # catégories par défaut + couleurs
tests/
  periodicity.test.ts
  forecast.test.ts
public/
  manifest.json
  icons/ (192, 512, maskable)
  sw.js
Dockerfile
docker-compose.yml
.dockerignore
README.md
```

## Étapes d'implémentation (résumé après chacune)
1. Scaffolding Next.js 16 + TS strict + Tailwind v4 + config ESLint/Prettier + Vitest.
2. Modèle de données : schema Prisma + migration + seed catégories, puis `lib/services/periodicity.ts` et `forecast.ts` avec tests Vitest en premier (logique critique du brief).
3. Page Budget : Settings form, CRUD dépenses (Server Actions), liste filtrable/groupée par catégorie, calcul temps réel, vue anneaux/cartes glass, bandeau prévisions N mois.
4. Page Wishlist : CRUD items, checkbox achat, total engagé du mois.
5. Nav (bottom nav mobile / sidebar desktop) + design system glass (cartes, couleurs néon/pastel par catégorie).
6. PWA : manifest, icônes, service worker cache-first pour assets statiques, meta tags iOS/Android.
7. Docker : Dockerfile multi-stage (standalone output Next), docker-compose avec volume SQLite, .dockerignore.
8. README (lancement local + Docker) + relecture finale + `tasks/lessons.md` mis à jour si besoin.
