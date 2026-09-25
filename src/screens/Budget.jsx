import { useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../lib/useSupabaseTable'

export default function Budget({ foyer, membres }) {
  const { rows: depenses } = useSupabaseTable('depenses', foyer.id)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ categorie: '', paye_par_id: '', montant_prevu: '', montant_reel: '' })

  const totalReel = depenses.reduce((s, d) => s + Number(d.montant_reel || 0), 0)
  const totalPrevu = depenses.reduce((s, d) => s + Number(d.montant_prevu || 0), 0)

  const soldes = useMemo(() => {
    if (membres.length === 0) return []
    const parPersonne = Object.fromEntries(membres.map((m) => [m.id, 0]))
    depenses.forEach((d) => {
      if (d.paye_par_id && parPersonne[d.paye_par_id] !== undefined) {
        parPersonne[d.paye_par_id] += Number(d.montant_reel || 0)
      }
    })
    const moyenne = totalReel / membres.length
    return membres.map((m) => ({
      membre: m,
      paye: parPersonne[m.id] || 0,
      solde: (parPersonne[m.id] || 0) - moyenne,
    }))
  }, [depenses, membres, totalReel])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.categorie.trim()) return
    await supabase.from('depenses').insert({
      foyer_id: foyer.id,
      categorie: form.categorie.trim(),
      paye_par_id: form.paye_par_id || null,
      montant_prevu: form.montant_prevu ? Number(form.montant_prevu) : null,
      montant_reel: form.montant_reel ? Number(form.montant_reel) : null,
    })
    setForm({ categorie: '', paye_par_id: '', montant_prevu: '', montant_reel: '' })
    setFormOpen(false)
  }

  return (
    <div>
      <div className="top">
        <h1>Budget</h1>
        <p>Dépenses et répartition entre tout le monde</p>
      </div>

      <div className="balance-card">
        {soldes.map(({ membre, paye, solde }) => (
          <div key={membre.id} className="who-line">
            {membre.prenom} a payé {paye.toFixed(0)} €
            {' — '}
            {solde > 1 ? (
              <span style={{ color: 'var(--gold)' }}>on lui doit {solde.toFixed(0)} €</span>
            ) : solde < -1 ? (
              <span>doit {Math.abs(solde).toFixed(0)} €</span>
            ) : (
              <span>à jour</span>
            )}
          </div>
        ))}
        <div className="amount" style={{ marginTop: 10 }}>{totalReel.toFixed(0)} € / {totalPrevu.toFixed(0)} € prévus</div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Dépenses</h3>
          <button className="btn-add" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? 'Fermer' : '+ Ajouter une dépense'}
          </button>
        </div>

        <div className={`form-panel ${formOpen ? 'open' : ''}`}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Poste de dépense</label>
              <input type="text" placeholder="Ex : Location camion" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
            </div>
            <div className="field">
              <label>Payé par</label>
              <select value={form.paye_par_id} onChange={(e) => setForm({ ...form, paye_par_id: e.target.value })}>
                <option value="">—</option>
                {membres.map((m) => <option key={m.id} value={m.id}>{m.prenom}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Montant prévu (€)</label>
              <input type="number" step="0.01" value={form.montant_prevu} onChange={(e) => setForm({ ...form, montant_prevu: e.target.value })} />
            </div>
            <div className="field">
              <label>Montant réel (€)</label>
              <input type="number" step="0.01" value={form.montant_reel} onChange={(e) => setForm({ ...form, montant_reel: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className="btn-submit">Ajouter</button>
            </div>
          </form>
        </div>

        <table className="data-table">
          <thead>
            <tr><th>Poste</th><th>Payé par</th><th className="num">Prévu</th><th className="num">Réel</th></tr>
          </thead>
          <tbody>
            {depenses.map((d) => (
              <tr key={d.id}>
                <td>{d.categorie}</td>
                <td>{membres.find((m) => m.id === d.paye_par_id)?.prenom || '—'}</td>
                <td className="num">{d.montant_prevu ? `${Number(d.montant_prevu).toFixed(0)} €` : '—'}</td>
                <td className="num">{d.montant_reel ? `${Number(d.montant_reel).toFixed(0)} €` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {depenses.length === 0 && <p style={{ color: 'var(--text-dark-muted)', fontSize: 14, marginTop: 10 }}>Aucune dépense pour l'instant.</p>}
      </div>
    </div>
  )
}
