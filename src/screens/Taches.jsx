import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../lib/useSupabaseTable'
import WhoChip from '../components/WhoChip'

const PHASES = [
  { id: 'avant', label: 'Avant le déménagement' },
  { id: 'pendant', label: 'Pendant le déménagement' },
  { id: 'apres', label: 'Après le déménagement' },
]

function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Taches({ foyer, membres }) {
  const { rows: taches } = useSupabaseTable('taches', foyer.id)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ titre: '', phase: 'avant', assigne_id: '', echeance: '', parent_tache_id: '' })

  const topLevel = (phase) => taches.filter((t) => t.phase === phase && !t.parent_tache_id)
  const sousTaches = (parentId) => taches.filter((t) => t.parent_tache_id === parentId)
  const membreById = (id) => membres.find((m) => m.id === id) || null

  async function toggleStatut(tache) {
    const nouveau = tache.statut === 'fait' ? 'a_faire' : 'fait'
    await supabase.from('taches').update({ statut: nouveau }).eq('id', tache.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.titre.trim()) return
    await supabase.from('taches').insert({
      foyer_id: foyer.id,
      titre: form.titre.trim(),
      phase: form.phase,
      assigne_id: form.assigne_id || null,
      echeance: form.echeance || null,
      parent_tache_id: form.parent_tache_id || null,
    })
    setForm({ titre: '', phase: 'avant', assigne_id: '', echeance: '', parent_tache_id: '' })
    setFormOpen(false)
  }

  return (
    <div>
      <div className="top">
        <h1>Tâches</h1>
        <p>Organisées par phase — avant, pendant, après</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Ajouter</h3>
          <button className="btn-add" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? 'Fermer' : '+ Ajouter une tâche'}
          </button>
        </div>

        <div className={`form-panel ${formOpen ? 'open' : ''}`}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Titre</label>
              <input
                type="text"
                placeholder="Ex : Résilier le contrat internet"
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phase</label>
              <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                {PHASES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Assigné à</label>
              <select value={form.assigne_id} onChange={(e) => setForm({ ...form, assigne_id: e.target.value })}>
                <option value="">Non assigné</option>
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>{m.prenom}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Échéance</label>
              <input type="date" value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} />
            </div>
            <div className="field">
              <label>Sous-tâche de</label>
              <select value={form.parent_tache_id} onChange={(e) => setForm({ ...form, parent_tache_id: e.target.value })}>
                <option value="">Aucune (tâche principale)</option>
                {taches.filter((t) => !t.parent_tache_id).map((t) => (
                  <option key={t.id} value={t.id}>{t.titre}</option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className="btn-submit">Ajouter</button>
            </div>
          </form>
        </div>
      </div>

      {PHASES.map((phase) => (
        <div className="card" key={phase.id}>
          <h3>{phase.label}</h3>
          {topLevel(phase.id).length === 0 && (
            <p style={{ color: 'var(--text-dark-muted)', fontSize: 14 }}>Aucune tâche pour l'instant.</p>
          )}
          {topLevel(phase.id).map((t) => (
            <div key={t.id}>
              <div className={`row ${t.statut === 'fait' ? 'done' : ''}`}>
                <button className={`check ${t.statut === 'fait' ? 'done' : ''}`} onClick={() => toggleStatut(t)} />
                <span className="title">{t.titre}</span>
                <WhoChip membre={membreById(t.assigne_id)} />
                {t.statut === 'fait' ? (
                  <span className="badge done">Fait</span>
                ) : t.echeance ? (
                  <span className="badge urgent">{formatDate(t.echeance)}</span>
                ) : (
                  <span className="badge todo">À faire</span>
                )}
              </div>
              {sousTaches(t.id).map((st) => (
                <div className="subtask" key={st.id}>
                  <button className={`check ${st.statut === 'fait' ? 'done' : ''}`} style={{ width: 13, height: 13 }} onClick={() => toggleStatut(st)} />
                  <span style={{ textDecoration: st.statut === 'fait' ? 'line-through' : 'none' }}>{st.titre}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
