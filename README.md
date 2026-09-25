# Nid — organiser le déménagement, à plusieurs

Webapp React + Supabase. Voir `architecture-technique-nid.html` (doc fourni séparément) pour le détail des choix techniques et les schémas.

Écrans : Aperçu, Tâches, Cartons, Budget, Démarches, Meubles, Paramètres.

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com), crée un compte et un nouveau projet (gratuit).
2. Dans **SQL Editor**, colle le contenu de `supabase/schema.sql` puis **Run**. Ça crée les 7 tables et les règles de sécurité (RLS).
3. Dans **Authentication > Providers**, vérifie que "Email" est activé avec le mode "Magic Link" (activé par défaut).
4. Dans **Authentication > URL Configuration**, ajoute `http://localhost:5173` comme "Redirect URL" pour le développement local (tu ajouteras l'URL Vercel plus tard).
5. (Optionnel mais recommandé) Dans **Database > Replication**, active le temps réel sur les tables `taches`, `cartons`, `depenses`, `demarches`, `meubles`, `membres` — ou décommente les lignes à la fin de `schema.sql` et ré-exécute-les.
6. Récupère l'URL et la clé "anon public" dans **Project Settings > API**.

## 2. Lancer le projet en local

```bash
npm install
cp .env.example .env
# édite .env avec ton URL et ta clé Supabase
npm run dev
```

Ouvre `http://localhost:5173`. À la première connexion : tu reçois un lien magique par e-mail, puis tu choisis "Créer" un foyer (tu deviens le premier membre). Pour que ta copine rejoigne : elle se connecte avec son propre e-mail, puis choisit "Rejoindre" avec le code affiché dans l'écran **Paramètres**.

## 3. Déployer (Vercel)

1. Pousse le projet sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com), "Add New Project" → importe le dépôt.
3. Vercel détecte Vite automatiquement. Ajoute les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans les réglages du projet Vercel (mêmes valeurs que ton `.env`).
4. Déploie. Ajoute ensuite l'URL Vercel obtenue dans Supabase (**Authentication > URL Configuration > Redirect URLs**), sinon le lien magique ne fonctionnera pas en production.

## 4. Notifications push (étape suivante, pas encore branchée)

Le code contient un stub prêt à l'emploi dans `src/lib/pushNotifications.js`. Les instructions (compte OneSignal, script à ajouter, Edge Function Supabase planifiée) sont commentées dans ce fichier. C'est volontairement laissé pour plus tard : ça demande de créer un compte externe (OneSignal) que je ne peux pas faire à ta place.

## 5. Ce qui n'est pas encore fait

- **Plan de pièce visuel** (positionner les meubles à l'échelle dans une pièce) — annoncé comme un morceau pour une v2 dans le cadrage, pas encore codé.
- **Notifications push** — voir point 4.
- Pas de tests automatisés, projet volontairement simple vu l'usage (quelques personnes, quelques mois).

## Structure du projet

```
src/
  lib/               hooks (auth, foyer, lecture temps réel des tables)
  components/        éléments réutilisables (connexion, navigation, badges...)
  screens/           un fichier par écran
  supabaseClient.js  connexion à Supabase
  styles.css         tous les styles (mêmes tokens que la maquette)
supabase/
  schema.sql         tables + sécurité, à exécuter dans Supabase
```

## Commandes utiles

```bash
npm run dev      # serveur de développement
npm run build    # build de production (vérifie qu'il n'y a pas d'erreurs)
npm run lint     # vérifie la qualité du code
```
