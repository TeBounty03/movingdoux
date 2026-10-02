import { Suspense, useEffect } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import Login from './components/Login'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import { ECRAN_AIDE, ECRANS } from './ecrans'
import { useAuth } from './lib/useAuth'
import { useFoyer } from './lib/useFoyer'
import './styles/layout.css'

// Remonte en haut de page à chaque changement d'écran
function RemonterEnHaut() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const chargement = <div className="loading-screen">Chargement...</div>

// L'aide est consultable avant d'être connecté (lien depuis la page de connexion)
function AideHorsConnexion() {
  const Aide = ECRAN_AIDE.Composant
  return (
    <div className="aide-autonome">
      <RemonterEnHaut />
      <Link to="/" className="aide-retour">← Retour à l'appli</Link>
      <Suspense fallback={chargement}>
        <Aide />
      </Suspense>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const surAide = pathname === ECRAN_AIDE.chemin || pathname.startsWith(`${ECRAN_AIDE.chemin}/`)
  const { user, loading: authLoading, signOut } = useAuth()
  const { loading: foyerLoading, foyer, membre, membres, createFoyer, joinFoyer, ...actionsFoyer } = useFoyer(user)

  // applique la couleur d'accent choisie dans Paramètres à toute l'appli
  useEffect(() => {
    if (foyer?.couleur_accent) {
      document.documentElement.style.setProperty('--gold', foyer.couleur_accent)
    }
  }, [foyer?.couleur_accent])

  if (authLoading) return chargement
  if (!user) return surAide ? <AideHorsConnexion /> : <Login />
  if (foyerLoading) return chargement
  if (!membre) return surAide ? <AideHorsConnexion /> : <Onboarding createFoyer={createFoyer} joinFoyer={joinFoyer} />

  const props = { foyer, membres, onSignOut: signOut, ...actionsFoyer }

  return (
    <div className="app">
      <RemonterEnHaut />
      <Sidebar onSignOut={signOut} foyerNom={foyer.nom} />
      <main className="main">
        <Suspense fallback={chargement}>
          <Routes>
            {ECRANS.map(({ id, chemin, Composant, sousPages }) => (
              <Route key={id} path={sousPages ? `${chemin}/*` : chemin} element={<Composant {...props} />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}
