import { useState } from 'react'

export default function Onboarding({ createFoyer, joinFoyer }) {
  const [mode, setMode] = useState('create') // create | join
  const [prenom, setPrenom] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!prenom) return
    setBusy(true)
    setError('')
    const result = mode === 'create' ? await createFoyer(prenom) : await joinFoyer(code, prenom)
    setBusy(false)
    if (result.error) {
      setError(
        mode === 'join'
          ? "Code introuvable — vérifie qu'il est bien copié depuis l'écran Paramètres de l'autre personne."
          : "Un souci est survenu, réessaie."
      )
    }
  }

  return (
    <div className="login-screen">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1>Bienvenue</h1>
        <p>{mode === 'create' ? 'Créez votre espace partagé.' : 'Rejoignez le foyer déjà créé.'}</p>

        <div className="owner-pick" style={{ marginBottom: 16 }}>
          <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
            Créer
          </button>
          <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
            Rejoindre
          </button>
        </div>

        <input
          type="text"
          required
          placeholder="Ton prénom"
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
        />

        {mode === 'join' && (
          <input
            type="text"
            required
            placeholder="Code du foyer (ex: 8f3a1c2b)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        )}

        <button className="btn-submit" type="submit" disabled={busy}>
          {busy ? 'Un instant...' : mode === 'create' ? 'Créer le foyer' : 'Rejoindre'}
        </button>

        {error && <div className="login-error">{error}</div>}
      </form>
    </div>
  )
}
