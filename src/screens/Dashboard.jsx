import { useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../lib/useSupabaseTable'
import StatCard from '../components/StatCard'
import WhoChip from '../components/WhoChip'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Dashboard({ foyer, membres }) {
  const { rows: taches } = useSupabaseTable('taches', foyer.id)
  const { rows: cartons } = useSupabaseTable('cartons', foyer.id)
  const { rows: depenses } = useSupabaseTable('depenses', foyer.id)
  const { rows: demarches } = useSupabaseTable('demarches', foyer.id)

  const tachesFaites = taches.filter((t) => t.statut === 'fait').length
  const cartonsFaits = cartons.filter((c) => c.statut === 'fait').length
  const totalDepense = depenses.reduce((s, d) => s + Number(d.montant_reel || 0), 0)
  const totalPrevu = depenses.reduce((s, d) => s + Number(d.montant_prevu || 0), 0) || 1
  const demarchesFaites = demarches.filter((d) => d.statut === 'fait').length

  const membreById = useMemo(() => Object.fromEntries(membres.map((m) => [m.id, m])), [membres])

  const urgences = useMemo(() => {
    const items = [
      ...taches
        .filter((t) => t.statut !== 'fait' && t.echeance)
        .map((t) => ({ id: `t-${t.id}`, table: 'taches', row: t, titre: t.titre, echeance: t.echeance, assigne: membreById[t.assigne_id] })),
      ...demarches
        .filter((d) => d.statut !== 'fait' && d.echeance)
        .map((d) => ({ id: `d-${d.id}`, table: 'demarches', row: d, titre: d.titre, echeance: d.echeance, assigne: null })),
    ]
    return items.sort((a, b) => new Date(a.echeance) - new Date(b.echeance)).slice(0, 5)
  }, [taches, demarches, membreById])

  async function marquerFait(item) {
    await supabase.from(item.table).update({ statut: 'fait' }).eq('id', item.row.id)
  }

  return (
    <div>
      <div className="top">
        <h1>Aperçu</h1>
        <p>Vue d'ensemble des chantiers du déménagement</p>
      </div>

      <div className="grid">
        <StatCard
          label="Tâches"
          value={`${tachesFaites} / ${taches.length}`}
          percent={taches.length ? (tachesFaites / taches.length) * 100 : 0}
        />
        <StatCard
          label="Cartons"
          value={`${cartonsFaits} / ${cartons.length}`}
          percent={cartons.length ? (cartonsFaits / cartons.length) * 100 : 0}
        />
        <StatCard
          label="Budget dépensé"
          value={`${totalDepense.toFixed(0)} € / ${totalPrevu.toFixed(0)} €`}
          percent={(totalDepense / totalPrevu) * 100}
        />
        <StatCard
          label="Démarches"
          value={`${demarchesFaites} / ${demarches.length}`}
          percent={demarches.length ? (demarchesFaites / demarches.length) * 100 : 0}
        />
      </div>

      <div className="card">
        <h3>À faire bientôt</h3>
        {urgences.length === 0 && <p style={{ color: 'var(--text-dark-muted)', fontSize: 14 }}>Rien d'urgent pour l'instant.</p>}
        {urgences.map((item) => (
          <div className="row" key={item.id}>
            <button className="check" onClick={() => marquerFait(item)} aria-label="Marquer comme fait" />
            <span className="title">{item.titre}</span>
            {item.table === 'taches' && <WhoChip membre={item.assigne} />}
            <span className="badge urgent">{formatDate(item.echeance)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
