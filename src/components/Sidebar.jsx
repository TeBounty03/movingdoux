import { useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { ECRANS } from '../ecrans'

// Sur mobile, la barre du bas n'affiche que les écrans `barreMobile` ;
// les autres sont dans le menu « Plus ». Sur ordinateur, tout est listé.
const PRINCIPAUX = ECRANS.filter((e) => e.barreMobile)
const AUTRES = ECRANS.filter((e) => !e.barreMobile)

function Lien({ ecran, onClick }) {
  return (
    <NavLink
      to={ecran.chemin}
      end={!ecran.sousPages}
      className={({ isActive }) => `nav-lien ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {ecran.libelle}
    </NavLink>
  )
}

export default function Sidebar({ onSignOut, foyerNom }) {
  const [plusOpen, setPlusOpen] = useState(false)
  const { pathname } = useLocation()
  const plusActive = AUTRES.some((e) => e.chemin === pathname || (e.sousPages && pathname.startsWith(`${e.chemin}/`)))
  const fermer = () => setPlusOpen(false)

  return (
    <div className="sidebar">
      <div className="brand">Nid</div>
      <div className="brand-sub">{foyerNom || 'Déménagement'}</div>
      <nav className="main-nav">
        {PRINCIPAUX.map((e) => <Lien key={e.id} ecran={e} onClick={fermer} />)}
        <div className={`nav-autres ${plusOpen ? 'open' : ''}`}>
          {AUTRES.map((e) => <Lien key={e.id} ecran={e} onClick={fermer} />)}
        </div>
        <button
          type="button"
          className={`nav-lien plus-toggle ${plusActive ? 'active' : ''}`}
          aria-expanded={plusOpen}
          onClick={() => setPlusOpen((v) => !v)}
        >
          {plusOpen ? 'Fermer' : 'Plus'}
        </button>
      </nav>
      {plusOpen && <div className="plus-backdrop" onClick={fermer} />}
      <button className="signout" onClick={onSignOut}>Se déconnecter</button>
    </div>
  )
}
