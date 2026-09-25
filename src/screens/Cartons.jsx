import { useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../lib/useSupabaseTable'

export default function Cartons({ foyer }) {
  const { rows: cartons } = useSupabaseTable('cartons', foyer.id)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ piece: '', description: '' })

  const parPiece = useMemo(() => {
    const groups = {}
    cartons.forEach((c) => {
      const key = c.piece || 'Autre'
      groups[key] = groups[key] || []
      groups[key].push(c)
    })
    return groups
  }, [cartons])

  async function toggleStatut(carton) {
    const nouveau = carton.statut === 'fait' ? 'a_faire' : 'fait'
    await supabase.from('cartons').update({ statut: nouveau }).eq('id', carton.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.piece.trim()) return
    const numero = cartons.length + 1
    await supabase.from('cartons').insert({
      foyer_id: foyer.id,
      numero,
      piece: form.piece.trim(),
      description: form.description.trim(),
    })
    setForm({ piece: '', description: '' })
    setFormOpen(false)
  }

  return (
    <div>
      <div className="top">
        <h1>Cartons</h1>
        <p>Par pièce de destination dans le T4</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Ajouter un carton</h3>
          <button className="btn-add" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? 'Fermer' : '+ Ajouter'}
          </button>
        </div>
        <div className={`form-panel ${formOpen ? 'open' : ''}`}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label>Pièce de destination</label>
              <input type="text" placeholder="Ex : Salon" value={form.piece} onChange={(e) => setForm({ ...form, piece: e.target.value })} />
            </div>
            <div className="field">
              <label>Contenu (description globale)</label>
              <input type="text" placeholder="Ex : Livres + déco" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className="btn-submit">Ajouter</button>
            </div>
          </form>
        </div>
      </div>

      <div className="cols2">
        {Object.entries(parPiece).map(([piece, list]) => {
          const faits = list.filter((c) => c.statut === 'fait').length
          return (
            <div className="room-card" key={piece}>
              <div className="head">
                <h3>{piece}</h3>
                <span className="count">{faits} / {list.length} faits</span>
              </div>
              {list.map((c) => (
                <div className="box-line" key={c.id} onClick={() => toggleStatut(c)} style={{ cursor: 'pointer' }}>
                  <span className="n">{String(c.numero).padStart(2, '0')}</span>
                  <span style={{ flex: 1, textDecoration: c.statut === 'fait' ? 'line-through' : 'none' }}>{c.description || '—'}</span>
                  {c.statut === 'fait' && <span className="badge done">Fait</span>}
                </div>
              ))}
            </div>
          )
        })}
        {cartons.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Aucun carton pour l'instant.</p>}
      </div>
    </div>
  )
}
