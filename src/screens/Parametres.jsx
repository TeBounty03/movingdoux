import { useState } from 'react'

const PALETTE = ['#7A8F6E', '#A35C6E', '#8A79A8', '#C9973F', '#5C7F8C', '#B98A5A']
const ACCENTS = ['#D9A441', '#7FA37A', '#C97463', '#5C7F8C']

export default function Parametres({ foyer, membres, addMembreLabel, removeMembre, setAccentColor }) {
  const [formOpen, setFormOpen] = useState(false)
  const [nom, setNom] = useState('')
  const [couleur, setCouleur] = useState(PALETTE[0])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nom.trim()) return
    await addMembreLabel(nom.trim(), couleur)
    setNom('')
    setFormOpen(false)
  }

  return (
    <div>
      <div className="top">
        <h1>Paramètres</h1>
        <p>Qui a accès à l'appli, et à quoi elle ressemble</p>
      </div>

      <div className="card">
        <h3>Inviter quelqu'un</h3>
        <p style={{ color: 'var(--text-dark-muted)', fontSize: 13.5 }}>
          Pour qu'une personne puisse se connecter elle-même et voir/modifier les données en direct,
          donne-lui ce code — elle le renseigne sur l'écran « Rejoindre » à sa première connexion.
        </p>
        <div style={{ background: '#fff', border: '1px solid var(--paper-line)', borderRadius: 6, padding: '10px 14px', fontFamily: 'monospace', fontSize: 15, letterSpacing: 1 }}>
          {foyer.code}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Membres</h3>
        </div>
        <div>
          {membres.map((m) => (
            <div className="member-row" key={m.id}>
              <span className="who" style={{ background: m.couleur }}>{m.prenom.charAt(0).toUpperCase()}</span>
              <span className="name" style={{ flex: 1 }}>{m.prenom}</span>
              {!m.user_id && (
                <button className="btn-cancel" onClick={() => removeMembre(m.id)}>Retirer</button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-add" style={{ marginTop: 12 }} onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? 'Fermer' : '+ Ajouter une personne'}
        </button>

        <div className={`form-panel ${formOpen ? 'open' : ''}`}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Prénom</label>
              <input type="text" placeholder="Ex : colocataire, parent qui aide..." value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="field full">
              <label>Couleur</label>
              <div className="swatch-row">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch ${couleur === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setCouleur(c)}
                  />
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className="btn-submit">Ajouter</button>
            </div>
          </form>
        </div>
        <p style={{ color: 'var(--text-dark-muted)', fontSize: 12.5, marginTop: 10 }}>
          Une personne ajoutée ici sert de repère (assignation de tâches, propriétaire de meubles...) mais n'a pas
          de compte tant qu'elle ne rejoint pas elle-même le foyer avec le code ci-dessus.
        </p>
      </div>

      <div className="card">
        <h3>Apparence</h3>
        <div className="field" style={{ marginBottom: 4 }}>
          <label>Couleur d'accent de l'appli</label>
          <div className="swatch-row">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-swatch ${foyer.couleur_accent === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setAccentColor(c)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
