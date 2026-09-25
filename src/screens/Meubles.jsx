import { useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../lib/useSupabaseTable'
import WhoChip from '../components/WhoChip'

const STATUTS = [
  { id: 'on_garde', label: 'On garde' },
  { id: 'a_vendre', label: 'À vendre / donner' },
  { id: 'a_acheter', label: 'À acheter neuf' },
]

export default function Meubles({ foyer, membres }) {
  const { rows: meubles } = useSupabaseTable('meubles', foyer.id)
  const [ownerFilter, setOwnerFilter] = useState('tous')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    nom: '', proprietaire_id: '', longueur_cm: '', largeur_cm: '', hauteur_cm: '', piece_destination: '',
  })

  const liveVolume = useMemo(() => {
    const l = Number(form.longueur_cm) || 0
    const w = Number(form.largeur_cm) || 0
    const h = Number(form.hauteur_cm) || 0
    return (l * w * h) / 1000000
  }, [form.longueur_cm, form.largeur_cm, form.hauteur_cm])

  const volumeTotal = meubles
    .filter((m) => m.statut === 'on_garde')
    .reduce((s, m) => s + Number(m.volume_m3 || 0), 0)

  const visibles = ownerFilter === 'tous' ? meubles : meubles.filter((m) => m.proprietaire_id === ownerFilter)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nom.trim() || !form.longueur_cm || !form.largeur_cm || !form.hauteur_cm) return
    await supabase.from('meubles').insert({
      foyer_id: foyer.id,
      nom: form.nom.trim(),
      proprietaire_id: form.proprietaire_id || null,
      longueur_cm: Number(form.longueur_cm),
      largeur_cm: Number(form.largeur_cm),
      hauteur_cm: Number(form.hauteur_cm),
      piece_destination: form.piece_destination.trim() || null,
    })
    setForm({ nom: '', proprietaire_id: '', longueur_cm: '', largeur_cm: '', hauteur_cm: '', piece_destination: '' })
    setFormOpen(false)
  }

  async function changerStatut(meuble, statut) {
    await supabase.from('meubles').update({ statut }).eq('id', meuble.id)
  }

  return (
    <div>
      <div className="top">
        <h1>Meubles</h1>
        <p>Liste, mesures, volume et place dans le T4</p>
      </div>

      <div className="vol-summary">
        <div className="label">Volume total (meubles gardés)</div>
        <div className="value">≈ {volumeTotal.toFixed(1)} m³</div>
        <div className="note">
          Recommandation à donner aux déménageurs : compter ~{(volumeTotal * 1.28).toFixed(1)} m³ (marge d'empilement de +25 à 30 % incluse).
        </div>
      </div>

      <div className="filter-tabs">
        <button className={ownerFilter === 'tous' ? 'active' : ''} onClick={() => setOwnerFilter('tous')}>Tous</button>
        {membres.map((m) => (
          <button key={m.id} className={ownerFilter === m.id ? 'active' : ''} onClick={() => setOwnerFilter(m.id)}>
            {m.prenom}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Liste des meubles</h3>
          <button className="btn-add" onClick={() => setFormOpen((v) => !v)}>
            {formOpen ? 'Fermer' : '+ Ajouter un meuble'}
          </button>
        </div>

        <div className={`form-panel ${formOpen ? 'open' : ''}`}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label>Nom du meuble</label>
              <input type="text" placeholder="Ex : Canapé 3 places" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            </div>
            <div className="field full">
              <label>Propriétaire</label>
              <div className="owner-pick">
                <button type="button" className={form.proprietaire_id === '' ? 'active' : ''} onClick={() => setForm({ ...form, proprietaire_id: '' })}>Commun</button>
                {membres.map((m) => (
                  <button type="button" key={m.id} className={form.proprietaire_id === m.id ? 'active' : ''} onClick={() => setForm({ ...form, proprietaire_id: m.id })}>
                    {m.prenom}
                  </button>
                ))}
              </div>
            </div>
            <div className="field full">
              <label>Dimensions (cm)</label>
              <div className="dims-row">
                <input type="number" placeholder="Long." value={form.longueur_cm} onChange={(e) => setForm({ ...form, longueur_cm: e.target.value })} />
                <span className="x">×</span>
                <input type="number" placeholder="Larg." value={form.largeur_cm} onChange={(e) => setForm({ ...form, largeur_cm: e.target.value })} />
                <span className="x">×</span>
                <input type="number" placeholder="Haut." value={form.hauteur_cm} onChange={(e) => setForm({ ...form, hauteur_cm: e.target.value })} />
              </div>
            </div>
            <div className="live-volume">
              <span>Volume calculé automatiquement</span>
              <b>{liveVolume.toFixed(2)} m³</b>
            </div>
            <div className="field full">
              <label>Pièce de destination</label>
              <input type="text" placeholder="Ex : Salon" value={form.piece_destination} onChange={(e) => setForm({ ...form, piece_destination: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className="btn-submit">Ajouter à la liste</button>
            </div>
          </form>
        </div>

        {visibles.map((m) => {
          const proprietaire = membres.find((mm) => mm.id === m.proprietaire_id)
          return (
            <div className="furn-row" key={m.id}>
              <WhoChip membre={proprietaire} />
              <span className="name">{m.nom}</span>
              <span className="dims">{m.longueur_cm}×{m.largeur_cm}×{m.hauteur_cm} cm</span>
              <span className="vol">{Number(m.volume_m3).toFixed(2)} m³</span>
              <select value={m.statut} onChange={(e) => changerStatut(m, e.target.value)} style={{ fontSize: 12, border: 'none', background: 'transparent', color: 'var(--text-dark-muted)' }}>
                {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          )
        })}
        {visibles.length === 0 && <p style={{ color: 'var(--text-dark-muted)', fontSize: 14 }}>Aucun meuble pour l'instant.</p>}
      </div>
    </div>
  )
}
