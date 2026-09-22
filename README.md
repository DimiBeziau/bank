# Bank

PWA de gestion de budget personnel : comptes multi-utilisateurs (chaque
personne a son propre espace isolé), cycles mensuels configurables, dépenses
récurrentes ou ponctuelles, wishlist, et projections sur les mois à venir.
Design glassmorphism, responsive mobile → desktop, installable en PWA.

## Sommaire

- [Stack](#stack)
- [Démarrage local](#démarrage-local)
- [Variables d'environnement](#variables-denvironnement)
- [Docker](#docker)
- [Déploiement en production](#déploiement-en-production)
- [Modèle de données](#modèle-de-données)
- [Règles métier](#règles-métier)
- [Tests](#tests)
- [Limites connues](#limites-connues)

## Stack

| Domaine       | Choix                                                            |
| ------------- | ------------------------------------------------------------------ |
| Framework     | Next.js 16 (App Router, TypeScript strict), Server Actions          |
| UI            | Tailwind CSS v4, Radix UI (accessibilité), design glassmorphism     |
| Données       | Prisma 7 + SQLite (adaptateur `better-sqlite3`)                    |
| Auth          | Sessions JWT signées (`jose`) en cookie httpOnly, mots de passe hashés (`bcryptjs`) |
| Validation    | Zod                                                                |
| Dates         | date-fns                                                           |
| État UI       | Zustand (usage ponctuel, pas pour les données persistées)          |
| Tests         | Vitest — logique de périodicité / prévision (`lib/services/`)     |
| PWA           | Manifest + service worker maison (cache des assets statiques)     |

## Démarrage local

```bash
npm install
cp .env.example .env         # puis renseigner SESSION_SECRET (openssl rand -hex 32)
npm run prisma:migrate       # crée prisma/dev.db et applique le schéma
npm run dev
```

L'app redirige automatiquement vers `/login` tant qu'aucun compte n'est
connecté ; créer un compte depuis `/signup` crée aussi ses catégories par
défaut et ses réglages initiaux.

Autres commandes utiles :

```bash
npm run test                # tests unitaires (périodicité, prévisions)
npm run lint                 # ESLint
npm run build && npm start   # build de production, servi en local
```

## Variables d'environnement

| Variable         | Rôle                                                         | Défaut (local)         |
| ---------------- | -------------------------------------------------------------- | ------------------------ |
| `DATABASE_URL`   | Chemin de la base SQLite (format `file:...`)                  | `file:./prisma/dev.db` |
| `SESSION_SECRET` | Secret de signature des sessions JWT (32+ caractères aléatoires) | _(aucun — obligatoire)_ |

`SESSION_SECRET` est requis : l'app refuse de signer/vérifier une session sans
lui (voir `lib/auth/jwt.ts`). Générer une valeur avec `openssl rand -hex 32`.
Voir `.env.example`.

## Docker

```bash
cp .env.example .env   # renseigner SESSION_SECRET
docker compose up -d --build
```

- Build multi-stage : dépendances → build Next.js → image de production.
  Les binaires Prisma (moteur de migration) sont pré-téléchargés pendant le
  build, le conteneur applicatif n'a donc pas besoin d'accès réseau au démarrage.
- Au démarrage, le conteneur applique automatiquement les migrations Prisma
  (`prisma migrate deploy`).
- La base SQLite est persistée dans `./data/bank.db` sur l'hôte, montée en
  volume dans le conteneur (`./data:/app/data`).
- `docker-compose.yml` lit `SESSION_SECRET` depuis `.env` (à la racine du
  projet, non commité) et refuse de démarrer si elle est absente.
- Le conteneur s'appelle `bank` (voir `container_name` dans
  `docker-compose.yml`) et rejoint le réseau Docker externe `public` — c'est
  le nom qu'un reverse proxy sur ce même réseau utilise pour l'atteindre
  (`http://bank:3000`). **Renommer la clé `public:` dans `docker-compose.yml`
  si le réseau Docker réel de ton reverse proxy porte un autre nom** (voir
  section suivante pour le trouver — ne pas confondre avec le réglage
  "Accès : Publique" de l'interface Nginx Proxy Manager, qui est une liste
  d'accès HTTP et n'a rien à voir avec le nom du réseau Docker).

**Test local sans reverse proxy** : le port n'est plus publié sur l'hôte par
défaut (voir section suivante), et le réseau externe `public` n'existe pas
forcément en local. Deux options :
- le plus simple : utiliser `npm run dev` pour tester en local ;
- ou, pour tester l'image Docker telle quelle : `docker network create public`,
  et décommenter le bloc `ports: ["3000:3000"]` dans `docker-compose.yml`.

Pour arrêter :

```bash
docker compose down
```

Les données persistent dans `./data` tant que ce dossier n'est pas supprimé.

## Déploiement en production

Déploiement manuel via SSH sur un serveur qui a Docker + Docker Compose installés.

**Première installation :**

```bash
ssh <user>@<serveur>
git clone https://github.com/DimiBeziau/bank.git
cd bank
cp .env.example .env
# éditer .env : SESSION_SECRET, généré avec `openssl rand -hex 32`
docker compose up -d --build
```

**Mises à jour suivantes :**

```bash
ssh <user>@<serveur>
cd bank
git pull
docker compose up -d --build
```

`docker compose up -d --build` réapplique automatiquement les migrations
Prisma au démarrage — pas d'étape manuelle supplémentaire pour les futures
évolutions du schéma. Les données restent dans `./data/bank.db` sur le
serveur, indépendamment des rebuilds.

### Configurer le reverse proxy (Nginx Proxy Manager)

Le port du conteneur n'est **pas** publié sur l'hôte (`ports:` est commenté
dans `docker-compose.yml`) : Nginx Proxy Manager doit atteindre l'app via le
réseau Docker, en la désignant par le nom de son conteneur (`bank`), pas par
localhost:3000 ni par une IP.

1. **Trouver le réseau Docker de Nginx Proxy Manager**, sur le serveur :
   ```bash
   docker inspect <conteneur-npm> --format '{{json .NetworkSettings.Networks}}'
   ```
   (remplacer `<conteneur-npm>` par le nom réel du conteneur NPM, ex.
   `docker ps | grep nginx-proxy-manager` pour le trouver). Le résultat donne
   le(s) nom(s) de réseau réel(s) — ne pas confondre avec le réglage
   "Accès : Publique" de l'interface NPM (une liste d'accès HTTP, sans rapport
   avec le nom du réseau Docker).

2. **`docker-compose.yml` référence ce réseau sous la clé `public`** :
   ```yaml
   networks:
     public:
       external: true
   ```
   Si le nom trouvé à l'étape 1 diffère de `public`, renommer cette clé (et
   la ligne `networks: - public` du service `bank`) pour qu'elle corresponde
   exactement au nom réel, puis :
   ```bash
   docker compose up -d --build
   ```
   `bank` rejoint alors ce réseau externe — le conteneur reste joignable par
   NPM sous le nom `bank`.

3. **Dans l'interface NPM**, créer/vérifier le Proxy Host :
   - Domain Names : `bank.beziau.dev`
   - Scheme : `http`, Forward Hostname/IP : `bank`, Forward Port : `3000`
   - Onglet SSL : certificat Let's Encrypt + **Force SSL** activé
   - Access : Publique (ou restreint selon besoin)

4. **Vérifier** : `docker exec <conteneur-npm> ping -c1 bank` doit résoudre et
   répondre — si ça échoue, `bank` et NPM ne sont pas sur le même réseau
   Docker (revoir l'étape 2). Puis visiter `https://bank.beziau.dev` : un 502
   Bad Gateway à ce stade signifie généralement ce même problème de réseau
   plutôt qu'un souci applicatif.

**Points d'attention avant d'exposer l'app publiquement :**

- Le pare-feu du serveur n'a besoin d'ouvrir que 80/443 (gérés par NPM) — pas
  le port 3000, qui n'est plus jamais exposé côté hôte en configuration prod.
- Sauvegarder `./data/bank.db` régulièrement (c'est la seule donnée à
  perdre — le reste est reconstruit par `docker compose up --build`).
- `SESSION_SECRET` doit être différent de celui utilisé en local/dev, et ne
  jamais être commité (`.env` est dans `.gitignore`).

## Modèle de données

- **User** : email + mot de passe hashé. Racine de l'isolation des données —
  chaque autre modèle est rattaché à un `userId`.
- **Settings** (un par utilisateur) : capital de départ du mois, jour de
  début de cycle.
- **Category** (par utilisateur) : nom + couleur (utilisée pour l'UI).
- **Expense** : dépense périodique ou ponctuelle, avec case "prise en compte"
  qui la déduit du budget du cycle en cours dès qu'elle est cochée et que son
  échéance tombe dans ce cycle.
- **WishlistItem** : item avec budget prévu, déduit du cycle en cours dès
  qu'il est coché "achetée" (pas de récurrence).

## Règles métier

Voir `lib/services/periodicity.ts` et `lib/services/forecast.ts` (logique pure, testée).

- Le cycle courant est la fenêtre `[jour de début de cycle du mois, jour de
  début de cycle du mois suivant)`. Le jour est clampé sur les mois plus
  courts (ex. jour 31 → 28/29 en février).
- Le budget restant du cycle = capital de départ − dépenses cochées échues
  dans le cycle − items wishlist cochés.
- Les prévisions sur N mois recalculent, pour chaque cycle futur, les
  occurrences projetées des dépenses (cochées ou non) et repartent à chaque
  fois du même capital configuré — l'hypothèse retenue est que le capital est
  resaisi chaque mois plutôt que reporté d'un cycle à l'autre.

## Tests

```bash
npm run test
```

12 tests unitaires couvrent les bornes de cycle, le calcul d'occurrences
périodiques et les projections de budget — la partie du brief jugée la plus
sensible aux erreurs silencieuses.

## Limites connues

- Pas de réinitialisation de mot de passe (pas d'envoi d'email configuré) :
  en cas d'oubli, il faut recréer un compte ou éditer `passwordHash` en base.
