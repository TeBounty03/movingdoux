import { useEffect, useState } from 'react'
import { useAuth } from './lib/useAuth'
import { useFoyer } from './lib/useFoyer'
import Login from './components/Login'
import Onboarding from './components/Onboarding'
import Sidebar from './components/Sidebar'
import Dashboard from './screens/Dashboard'
import Taches from './screens/Taches'
import Cartons from './screens/Cartons'
import Budget from './screens/Budget'
import Demarches from './screens/Demarches'
import Meubles from './screens/Meubles'
import Parametres from './screens/Parametres'

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth()
  const {
    loading: foyerLoading,
    foyer,
    membre,
    membres,
    createFoyer,
    joinFoyer,
    addMembreLabel,
    removeMembre,
    setAccentColor,
  } = useFoyer(user)
  const [screen, setScreen] = useState('dashboard')

  // applique la couleur d'accent choisie dans Paramètres à toute l'appli
  useEffect(() => {
    if (foyer?.couleur_accent) {
      document.documentElement.style.setProperty('--gold', foyer.couleur_accent)
    }
  }, [foyer?.couleur_accent])

  if (authLoading) return <div className="loading-screen">Chargement...</div>
  if (!user) return <Login />
  if (foyerLoading) return <div className="loading-screen">Chargement...</div>
  if (!membre) return <Onboarding createFoyer={createFoyer} joinFoyer={joinFoyer} />

  const screens = {
    dashboard: <Dashboard foyer={foyer} membres={membres} />,
    taches: <Taches foyer={foyer} membres={membres} />,
    cartons: <Cartons foyer={foyer} />,
    budget: <Budget foyer={foyer} membres={membres} />,
    demarches: <Demarches foyer={foyer} />,
    meubles: <Meubles foyer={foyer} membres={membres} />,
    parametres: (
      <Parametres
        foyer={foyer}
        membres={membres}
        addMembreLabel={addMembreLabel}
        removeMembre={removeMembre}
        setAccentColor={setAccentColor}
      />
    ),
  }

  return (
    <div className="app">
      <Sidebar current={screen} onChange={setScreen} onSignOut={signOut} foyerNom={foyer.nom} />
      <div className="main">{screens[screen]}</div>
    </div>
  )
}
