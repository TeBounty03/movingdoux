# Documentation technique

Ce qu'il faut savoir pour modifier l'appli sans rien casser.

## En bref

| | |
| --- | --- |
| Interface | React 19 + Vite, routage `react-router` (une adresse par écran) |
| Données | Cloud Firestore (base `(default)`, région `europe-west9`), temps réel via `onSnapshot` |
| Connexion | Firebase Authentication, lien magique par e-mail (pas de mot de passe) |
| Hébergement | Firebase Hosting, projet `moving-doux` → moving-doux.web.app |
| Tests | Vitest (logique + écrans), émulateur Firestore (règles), Playwright (parcours complets) |
| Langue du code | Français pour le métier (`taches`, `ajouterCarton`), anglais pour les hooks hérités (`useAuth`, `foyer.couleur_accent`) |

Il n'y a **pas de serveur** : le navigateur parle directement à Firestore, et c'est `firestore.rules` qui protège les données.

## Comment l'appli est découpée

Du haut (ce que voit l'utilisateur) vers le bas (la base) :

```
App.jsx          connexion, foyer
 └ ecrans.js     liste des écrans
   └ screens/    affichage
     └ models/   règles métier
       └ lib/data.js
           ↓
       Firestore
```

À côté, `lib/useAuth.js` et `lib/useFoyer.js` gèrent la session et le foyer de la personne connectée.
Firestore est protégé par `firestore.rules`.

**Règle d'or** : un écran n'importe jamais Firebase. Il appelle un modèle (`ajouterTache`, `useCartons`…), qui passe par `lib/data.js`.

| Dossier / fichier | Rôle |
| --- | --- |
| `src/main.jsx` | Point d'entrée : styles de base, routeur, `App`. |
| `src/App.jsx` | Décide quoi afficher (chargement, connexion, création du foyer, appli) et monte les routes. |
| `src/ecrans.js` | **Liste unique des écrans** : adresse, libellé, place dans la barre mobile. |
| `src/screens/` | Un écran = `Ecran.jsx` + `Ecran.css` (facultatif) + `Ecran.test.jsx`. |
| `src/models/` | Un fichier par type de données. Fonctions pures (testables seules) + accès aux données. |
| `src/components/` | Éléments réutilisables : `Sidebar` (navigation), `Formulaire` (ajout repliable), `EnTete`, `StatCard`, `WhoChip`, `Login`, `Onboarding`. |
| `src/lib/` | `useAuth` (session), `useFoyer` (foyer + membres), `data.js` (Firestore), `format.js` (dates, euros), `useFormulaire.js`. |
| `src/styles/` | `base.css` (couleurs, boutons, cartes, formulaires) et `layout.css` (mise en page, navigation). |
| `src/firebase.js` | Initialise Firebase ; bascule sur les émulateurs locaux en mode test. |
| `docs/` | Cette documentation et le guide d'utilisation, affichés aussi dans l'appli (écran **Aide**). |
| `firestore.rules` | Règles de sécurité, déployées avec l'appli. |
| `tests/rules/`, `e2e/` | Tests des règles et parcours complets (voir **Tests**). |

## Données (Firestore)

```
users/{uid}
codes/{code}
foyers/{foyerId}
  ├ membres/{id}
  ├ taches/{id}
  ├ cartons/{id}
  ├ depenses/{id}
  ├ demarches/{id}
  └ meubles/{id}
```

| Document | Champs |
| --- | --- |
| `users/{uid}` | `foyer_id`, `join_code` (si la personne a rejoint avec un code) : le foyer de la personne connectée |
| `codes/{code}` | `foyer_id` : code d'invitation (8 caractères hexadécimaux) → foyer |
| `foyers/{foyerId}` | `nom`, `couleur_accent`, `code`, `membresUids` (uid des comptes membres), `created_at` |
| `membres` | `prenom`, `couleur`, `user_id` (ou `null`), `created_at` |
| `taches` | `titre`, `phase`, `statut`, `assigne_id`, `echeance`, `parent_tache_id`, `created_at` |
| `cartons` | `numero`, `piece`, `description`, `statut`, `created_at` |
| `depenses` | `categorie`, `paye_par_id`, `montant_prevu`, `montant_reel`, `date`, `created_at` |
| `demarches` | `titre`, `categorie`, `organisme`, `echeance`, `statut`, `created_at` |
| `meubles` | `nom`, `proprietaire_id`, `longueur_cm`, `largeur_cm`, `hauteur_cm`, `volume_m3`, `piece_destination`, `statut`, `created_at` |

- **Statuts** : `a_faire` / `en_cours` / `fait` (tâches, cartons, démarches) ; `on_garde` / `a_vendre` / `a_acheter` (meubles). Constantes dans `models/statuts.js` et `models/meubles.js`.
- **Membres** : une personne avec compte a pour id son `uid` (et `user_id = uid`) ; une personne « sans compte » a un id automatique et `user_id = null`.
- **Références** (`assigne_id`, `paye_par_id`, `proprietaire_id`, `parent_tache_id`) : de simples id. Rien n'est supprimé en cascade : l'affichage doit tolérer un id qui ne correspond plus à rien (il affiche « — » ou « ? »).
- `created_at` est posé par le serveur (`serverTimestamp`) et sert à l'ordre d'affichage. `volume_m3` est calculé au moment de l'ajout.
- Dates (`echeance`, `date`) : texte `AAAA-MM-JJ`, comme les champs `<input type="date">`.

## Sécurité (firestore.rules)

| Qui | Peut |
| --- | --- |
| Personne non connectée | Rien. |
| Personne connectée | Lire **un** code d'invitation (pas la liste) ; créer un foyer dont elle est le seul membre ; lire son propre `users/{uid}` et l'écrire seulement vers un foyer dont elle est membre. |
| Membre d'un foyer (`uid` dans `membresUids`) | Lire le foyer, changer nom et couleur (pas le code ni la liste des membres) ; lire/écrire `taches`, `cartons`, `depenses`, `demarches`, `meubles` ; ajouter/retirer les membres **sans compte**. |
| Rejoindre | Ajouter **uniquement soi-même** à `membresUids`, et seulement si `users/{uid}.join_code` pointe vers ce foyer dans `codes/`. |

Une collection qui n'est pas dans la liste de `firestore.rules` est refusée. Un test vérifie que cette liste et `models/index.js` sont identiques.

## Les flux importants

### Connexion par lien magique (`lib/useAuth.js`)

1. `sendSignInLinkToEmail` envoie le lien ; l'e-mail est gardé dans `localStorage` (`movingdoux-email-connexion`).
2. Au retour sur le site, `isSignInWithEmailLink` détecte le lien et `signInWithEmailLink` termine la connexion (l'e-mail est redemandé s'il n'est pas dans ce navigateur).
3. L'adresse est nettoyée (`history.replaceState`). Le hook étant monté deux fois (App et Login), le lien n'est traité qu'une fois (`linkHandled`).

### Créer ou rejoindre un foyer (`lib/useFoyer.js`)

- **Créer** : un seul `writeBatch` écrit le foyer, son code, la fiche membre et `users/{uid}`. Les règles valident l'ensemble avec `getAfter` (l'état après le batch).
- **Rejoindre** : lecture de `codes/{code}`, puis batch : `arrayUnion(uid)` sur le foyer, fiche membre, `users/{uid}` avec `join_code`.
- **Piège déjà rencontré** : Firestore affiche une écriture localement *avant* que le serveur ne l'ait confirmée. Si l'appli se met à écouter le foyer à ce moment-là, le serveur refuse (le foyer n'existe pas encore pour lui) et l'écoute s'arrête définitivement. `useFoyer` ignore donc les instantanés de `users/{uid}` qui ont `hasPendingWrites` et attend la confirmation. Un test de bout en bout couvre ce cas.

### Temps réel et hors ligne

- `useFoyerCollection(nom, foyerId)` (`lib/data.js`) écoute `foyers/{foyerId}/{nom}` trié par `created_at` : tout changement, d'où qu'il vienne, met l'écran à jour.
- Cache persistant (IndexedDB, plusieurs onglets) : les écritures faites hors ligne partent au retour du réseau. En mode test (émulateurs), cache en mémoire.

## Styles

- `styles/base.css` puis `styles/layout.css`, puis le CSS de chaque écran, importé par l'écran lui-même.
- **Mobile** : un seul point de rupture, `@media (max-width: 720px)`, placé en bas de chaque fichier. La navigation devient une barre en bas avec au plus 4 écrans (`barreMobile` dans `ecrans.js`) + « Plus ».
- **Pièges** :
  - les boutons stylés partent de `all: unset`, qui remet aussi `box-sizing` à `content-box` : chaque règle concernée redonne `box-sizing: border-box` (sinon un bouton à `width: 100%` déborde) ;
  - sur mobile, champs en **16 px minimum**, sinon iOS zoome quand on touche le champ ;
  - grilles : `minmax(0, 1fr)` plutôt que `1fr`, sinon un champ peut élargir la grille au-delà de l'écran.
- Couleurs : variables CSS dans `:root` (`--gold`, `--paper`…). `--gold` est remplacée à l'exécution par la couleur d'accent du foyer.

## Ajouter une fonctionnalité

### Un nouvel écran (ex. « Logement »)

1. **Modèle** `src/models/logement.js` : `COLLECTION`, `FORMULAIRE_VIDE`, `nouveauX(champs)` qui construit le document ou renvoie `null` si la saisie est incomplète, les calculs, et `useLogement` / `ajouterX`. Modèle le plus court à copier : `models/cartons.js`.
2. **Collection autorisée** : ajouter le modèle à `COLLECTIONS_FOYER` (`src/models/index.js`) **et** `'logement'` à la liste de `firestore.rules`.
3. **Écran** `src/screens/Logement.jsx` : `EnTete`, `useFormulaire`, `BoutonOuvrir`, `PanneauFormulaire` et `Champ` donnent le formulaire d'ajout en quelques lignes.
4. **Une ligne dans `src/ecrans.js`** : l'écran obtient son adresse et sa place dans la navigation.
5. **Tests** : calculs dans `models/models.test.js`, écran dans `Logement.test.jsx` (copier `Cartons.test.jsx`), une étape dans `e2e/parcours.spec.js`, et une section dans `docs/guide-utilisation.md` (un test vérifie que chaque écran y est décrit).

### Un nouveau champ

Ajouter au `FORMULAIRE_VIDE` et à `nouveauX()` du modèle, puis un `<Champ>` dans l'écran. Les documents existants n'ont pas ce champ : prévoir une valeur par défaut à l'affichage.

### Modifier ou supprimer des données à la main

Pas encore d'interface pour ça. En attendant : console Firebase → Firestore → `foyers/{id}/…`, ou `npx firebase-tools firestore:delete <chemin> --project moving-doux`.

## Tests

| Commande | Ce qui est vérifié | Où |
| --- | --- | --- |
| `npm test` | Calculs des modèles, affichage et formulaires de chaque écran (Firebase simulé via `src/test/fakeData.js`), cohérence code ↔ règles ↔ documentation | `src/**/*.test.js(x)` |
| `npm run test:rules` | Chaque règle de sécurité, avec les mêmes écritures que l'appli | `tests/rules/` |
| `npm run test:e2e` | Parcours réels dans Chromium sur ordinateur, mobile (412 px) et petit mobile (320 px) : connexion, foyer, chaque écran, 2ᵉ personne en direct, adresses, documentation | `e2e/` |
| `npm run test:all` | Tout, plus le lint | |

Garde-fous automatiques des parcours (`e2e/helpers.js`, `e2e/fixtures.js`) : pas de défilement horizontal, rien qui déborde de sa carte, navigation entièrement visible, champs ≥ 16 px sur mobile, pas de colonne de tableau écrasée, **aucune erreur dans la console du navigateur**.

Les parcours démarrent leur propre serveur (port 5174, branché sur les émulateurs). Si ce port est déjà pris, ils s'arrêtent plutôt que de réutiliser un serveur qui pourrait parler à la vraie base.

`test:rules` et `test:e2e` utilisent les émulateurs Firebase (projet `demo-movingdoux`, jamais la vraie base) et demandent **Java 21**. Firestore émulé sur le port **8181** (8080 est pris par un service Windows sur le poste de dev), Auth sur 9099.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Appli en local, **sur la vraie base**. |
| `npm run dev:emulateurs` | Appli sur des données de test ; le lien de connexion s'affiche dans le terminal. |
| `npm run test:all` | Tous les tests. |
| `npm run deploy` | Tests, build, puis mise en ligne (appli + règles). |

La CI (`.github/workflows/tests.yml`) lance tous les tests à chaque push ; en cas d'échec, les captures et traces Playwright sont jointes au run.

## Limites connues

- Pas de modification ni de suppression des éléments dans l'interface ; pas de sortie de foyer.
- Une personne ne peut appartenir qu'à un foyer (`users/{uid}.foyer_id`).
- Numéro de carton = nombre de cartons + 1 : deux ajouts simultanés peuvent avoir le même numéro.
- Notifications push : non branchées (`lib/pushNotifications.js` décrit la marche à suivre).
- Lien de connexion : Firebase limite le nombre d'e-mails envoyés par jour sur l'offre gratuite.
