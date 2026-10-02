# Moving Doux — organiser le déménagement, à plusieurs

Webapp React + Firebase (Firestore, Authentication, Hosting). Projet Firebase : `moving-doux`. Documentation complète dans [`docs/`](docs/).

Écrans : Aperçu, Tâches, Cartons, Budget, Démarches, Meubles, Paramètres.

En ligne : https://moving-doux.web.app

## 1. Configuration Firebase (déjà faite, pour mémoire)

- Base **Firestore** en `europe-west9` (Paris). Les règles de sécurité sont dans `firestore.rules` : chaque foyer ne voit que ses propres données.
- **Authentication > Sign-in method** : fournisseur « E-mail/Mot de passe » activé avec l'option « Lien envoyé par e-mail (connexion sans mot de passe) ».
- `localhost` et `moving-doux.web.app` sont des domaines autorisés par défaut (**Authentication > Paramètres > Domaines autorisés**).
- La configuration de l'app web est dans `src/firebase.js` (valeurs publiques, pas besoin de `.env`).

## 2. Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:5173`. À la première connexion : tu reçois un lien magique par e-mail, puis tu choisis "Créer" un foyer (tu deviens le premier membre). Pour que ta copine rejoigne : elle se connecte avec son propre e-mail, puis choisit "Rejoindre" avec le code affiché dans l'écran **Paramètres**.

Attention : `npm run dev` utilise la vraie base Firestore. Pour travailler sans risque sur des données de test :

```bash
npm run dev:emulateurs   # app + émulateurs Firebase locaux (interface sur http://localhost:4000)
```

Avec les émulateurs, aucun e-mail n'est envoyé : le lien de connexion s'affiche dans le terminal (et dans l'interface des émulateurs, onglet Authentication).

## 3. Déployer (Firebase Hosting)

```bash
npm run deploy   # tests, build, puis envoi de l'app et des règles Firestore
```

La première fois : `npx firebase-tools login`.

## 4. Tests automatiques

Trois niveaux, pour qu'une modification ne casse rien sans qu'on le voie :

| Commande | Ce qui est testé | Durée |
| --- | --- | --- |
| `npm test` | Logique et affichage de chaque écran (calculs du budget, volume des meubles, tri des échéances, formulaires...), Firebase simulé | ~5 s |
| `npm run test:rules` | Règles de sécurité Firestore : un foyer ne voit que ses données, on ne rejoint qu'avec le bon code... | ~15 s |
| `npm run test:e2e` | Parcours complets dans un vrai navigateur, sur ordinateur, mobile (412 px) et petit mobile (320 px) : connexion par lien magique, création du foyer, chaque écran, arrivée d'une 2e personne, mises à jour en direct. Vérifie aussi l'affichage : pas de défilement horizontal, rien qui déborde, navigation entièrement visible, champs assez grands pour iOS | ~30 s |
| `npm run test:all` | Tout ce qui précède + lint | ~1 min |

`test:rules` et `test:e2e` tournent sur les émulateurs Firebase (jamais sur la vraie base) et demandent **Java 21** (`winget install EclipseAdoptium.Temurin.21.JRE`). La première fois : `npx playwright install chromium`.

`npm run deploy` lance `test:all` avant de mettre en ligne : si un test échoue, rien n'est déployé.

Sur GitHub, `.github/workflows/tests.yml` lance tous les tests à chaque push. En cas d'échec, les captures d'écran et traces Playwright sont jointes au run (artefact `playwright-report`). En local : `npx playwright show-report`.

## 5. Notifications push (étape suivante, pas encore branchée)

Le code contient un stub prêt à l'emploi dans `src/lib/pushNotifications.js`. Les instructions (compte OneSignal, script à ajouter, tâche planifiée qui lit Firestore) sont commentées dans ce fichier. C'est volontairement laissé pour plus tard : ça demande de créer un compte externe (OneSignal) que je ne peux pas faire à ta place.

## 6. Ce qui n'est pas encore fait

- **Plan de pièce visuel** (positionner les meubles à l'échelle dans une pièce) — annoncé comme un morceau pour une v2 dans le cadrage, pas encore codé.
- **Notifications push** — voir point 4.

## Documentation

- [Guide d'utilisation](docs/guide-utilisation.md) : comment utiliser l'appli, écran par écran.
- [Documentation technique](docs/documentation-technique.md) : découpage du code, données, sécurité, flux importants, comment ajouter une fonctionnalité.

Les deux sont aussi consultables dans l'appli : écran **Aide** (`/aide`), accessible même sans être connecté depuis le lien « Comment ça marche ? ».
Quand tu modifies l'appli, mets-les à jour : des tests vérifient que chaque écran est décrit dans le guide et que les fichiers cités dans la doc technique existent.

## Commandes utiles

```bash
npm run dev      # serveur de développement
npm run build    # build de production (vérifie qu'il n'y a pas d'erreurs)
npm run lint     # vérifie la qualité du code
npm test         # tests unitaires et composants
npm run test:all # tous les tests
npm run captures # régénère les captures et schémas de la doc (docs/images, docs/schemas)
npm run deploy   # met en ligne sur Firebase
```
