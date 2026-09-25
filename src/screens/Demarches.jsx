import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../lib/useSupabaseTable'

const CHECKLIST_TYPE = [
  { titre: 'Internet / box', categorie: 'Résiliation / souscription' },
  { titre: 'Électricité — gaz', categorie: 'Résiliation / souscription' },
  { titre: 'Assurance habitation', categorie: 'Résiliation / souscription' },
  { titre: 'Redirection du courrier (La Poste)', categorie: 'Changement d\u2019adresse' },
  { titre: 'Impôts', categorie: 'Changement d\u2019adresse' },
  { titre: 'Sécurité sociale', categorie: 'Changement d\u2019adresse' },
  { titre: 'Banque', categorie: 'Changement d\u2019adresse' },
  { titre: 'Employeur', categorie: 'Changement d\u2019adresse' },
  { titre: 'État des lieux sortant', categorie: 'Logement' },
  { titre: 'État des lieux entrant', categorie: 'Logement' },
  { titre: 'Restitution des clés / caution', categorie: 'Logement' },
  { titre: 'Carte grise / assurance auto', categorie: 'Autre' },
]

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Demarches({ foyer }) {
  const { rows: demarches } = useSupabaseTable('demarches', foyer.id)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ titre: '', categorie: '', organisme: '', echeance: '' })

  async function toggleStatut(d, prochain) {
    await supabase.from('demarches').update({ statut: prochain }).eq('id', d.id)
  }

  async function seedChecklist() {
    const aInserer = CHECKLIST_TYPE.filter((c) => !demarches.some((d) => d.titre === c.titre)).map((c) => ({
      foyer_id: foyer.id,
      titre: c.titre,
      categorie: c.categorie,
    }))
    if (aInserer.length) await supabase.from('demarches').insert(aInserer)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titre.trim()) return
    await supabase.from('demarches').insert({
      foyer_id: foyer.id,
      titre: form.titre.trim(),
      categorie: form.categorie.trim() || null,
      organisme: form.organisme.trim() || null,
      echeance: form.echeance || null,
    })
    setForm({ titre: '', categorie: '', organisme: '', echeance: '' })
    setFormOpen(false)
  }

  const parCategorie = demarches.reduce((acc, d) => {
    const key = d.categorie || 'Autre'
    acc[key] = acc[key] || []
    acc[key].push(d)
    return acc
  }, {})

  return (
    <div>
      <div className="top">
        <h1>Démarches</h1>
        <p>Checklist pré-remplie, à ajuster à votre cas</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Ajouter</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-add" onClick={seedChecklist}>+ Checklist type</button>
            <button className="btn-add" onClick={() => setFormOpen((v) => !v)}>
              {formOpen ? 'Fermer' : '+ Démarche'}
            </button>
          </div>
        </div>

        <div className={`form-panel ${formOpen ? 'open' : ''}`}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Titre</label>
              <input type="text" value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div className="field">
              <label>Catégorie</label>
              <input type="text" placeholder="Ex : Changement d'adresse" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
            </div>
            <div className="field">
              <label>Organisme</label>
              <input type="text" value={form.organisme} onChange={(e) => setForm({ ...form, organisme: e.target.value })} />
            </div>
            <div className="field">
              <label>Échéance</label>
              <input type="date" value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className="btn-submit">Ajouter</button>
            </div>
          </form>
        </div>
      </div>

      {Object.entries(parCategorie).map(([categorie, list]) => (
        <div className="card" key={categorie}>
          <h3>{categorie}</h3>
          {list.map((d) => (
            <div className={`row ${d.statut === 'fait' ? 'done' : ''}`} key={d.id}>
              <button className={`check ${d.statut === 'fait' ? 'done' : ''}`} onClick={() => toggleStatut(d, d.statut === 'fait' ? 'a_faire' : 'fait')} />
              <span className="title">{d.titre}</span>
              {d.statut === 'fait' ? (
                <span className="badge done">Fait</span>
              ) : d.statut === 'en_cours' ? (
                <span className="badge progress" onClick={() => toggleStatut(d, 'fait')} style={{ cursor: 'pointer' }}>En cours</span>
              ) : d.echeance ? (
                <span className="badge urgent" onClick={() => toggleStatut(d, 'en_cours')} style={{ cursor: 'pointer' }}>{formatDate(d.echeance)}</span>
              ) : (
                <span className="badge todo" onClick={() => toggleStatut(d, 'en_cours')} style={{ cursor: 'pointer' }}>À faire</span>
              )}
            </div>
          ))}
        </div>
      ))}
      {demarches.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Aucune démarche pour l'instant — clique sur « + Checklist type » pour partir d'une base.
        </p>
      )}
    </div>
  )
}
