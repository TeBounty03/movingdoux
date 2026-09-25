const SCREENS = [
  { id: 'dashboard', label: 'Aperçu' },
  { id: 'taches', label: 'Tâches' },
  { id: 'cartons', label: 'Cartons' },
  { id: 'budget', label: 'Budget' },
  { id: 'demarches', label: 'Démarches' },
  { id: 'meubles', label: 'Meubles' },
  { id: 'parametres', label: 'Paramètres' },
]

export default function Sidebar({ current, onChange, onSignOut, foyerNom }) {
  return (
    <div className="sidebar">
      <div className="brand">Nid</div>
      <div className="brand-sub">{foyerNom || 'Déménagement'}</div>
      <nav className="main-nav">
        {SCREENS.map((s) => (
          <button
            key={s.id}
            className={current === s.id ? 'active' : ''}
            onClick={() => onChange(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>
      <button className="signout" onClick={onSignOut}>Se déconnecter</button>
    </div>
  )
}
