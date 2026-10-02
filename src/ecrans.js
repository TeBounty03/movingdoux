import { lazy } from 'react'
import Budget from './screens/Budget'
import Cartons from './screens/Cartons'
import Dashboard from './screens/Dashboard'
import Demarches from './screens/Demarches'
import Meubles from './screens/Meubles'
import Parametres from './screens/Parametres'
import Taches from './screens/Taches'

// Liste unique des écrans : l'ordre est celui de la navigation, le chemin est l'adresse
// (moving-doux.web.app/budget...). Pour ajouter un écran : créer src/screens/MonEcran.jsx
// et l'ajouter ici — l'app et la navigation le prennent en compte automatiquement.
//
// barreMobile : visible directement dans la barre du bas sur mobile (sinon dans « Plus »).
// sousPages : l'écran a des adresses en dessous de la sienne (/aide/technique).
// Chaque écran reçoit les mêmes props : { foyer, membres, onSignOut, ...actions du foyer }.
export const ECRANS = [
  { id: 'dashboard', chemin: '/', libelle: 'Aperçu', Composant: Dashboard, barreMobile: true },
  { id: 'taches', chemin: '/taches', libelle: 'Tâches', Composant: Taches, barreMobile: true },
  { id: 'cartons', chemin: '/cartons', libelle: 'Cartons', Composant: Cartons, barreMobile: true },
  { id: 'budget', chemin: '/budget', libelle: 'Budget', Composant: Budget, barreMobile: true },
  { id: 'demarches', chemin: '/demarches', libelle: 'Démarches', Composant: Demarches },
  { id: 'meubles', chemin: '/meubles', libelle: 'Meubles', Composant: Meubles },
  { id: 'parametres', chemin: '/parametres', libelle: 'Paramètres', Composant: Parametres },
  { id: 'aide', chemin: '/aide', libelle: 'Aide', Composant: lazy(() => import('./screens/Aide')), sousPages: true },
]

// Écrans affichables sans être connecté
export const ECRAN_AIDE = ECRANS.find((e) => e.id === 'aide')
