import EnTete from '../components/EnTete'
import StatCard from '../components/StatCard'
import WhoChip from '../components/WhoChip'
import { formatDate, formatEuros } from '../lib/format'
import { useCartons } from '../models/cartons'
import { useDemarches } from '../models/demarches'
import { totaux, useDepenses } from '../models/depenses'
import { marquerFait, prochainesEcheances } from '../models/echeances'
import { compterFaits } from '../models/statuts'
import { useTaches } from '../models/taches'
import './Dashboard.css'

const pourcentage = (fait, total) => (total ? (fait / total) * 100 : 0)

export default function Dashboard({ foyer, membres }) {
  const { rows: taches } = useTaches(foyer.id)
  const { rows: cartons } = useCartons(foyer.id)
  const { rows: depenses } = useDepenses(foyer.id)
  const { rows: demarches } = useDemarches(foyer.id)

  const budget = totaux(depenses)
  const echeances = prochainesEcheances(taches, demarches, membres)

  return (
    <div>
      <EnTete titre="Aperçu">Vue d'ensemble des chantiers du déménagement</EnTete>

      <div className="grid">
        <StatCard label="Tâches" value={`${compterFaits(taches)} / ${taches.length}`} percent={pourcentage(compterFaits(taches), taches.length)} />
        <StatCard label="Cartons" value={`${compterFaits(cartons)} / ${cartons.length}`} percent={pourcentage(compterFaits(cartons), cartons.length)} />
        <StatCard
          label="Budget dépensé"
          value={budget.prevu ? `${formatEuros(budget.reel)} / ${formatEuros(budget.prevu)}` : formatEuros(budget.reel)}
          percent={pourcentage(budget.reel, budget.prevu)}
        />
        <StatCard label="Démarches" value={`${compterFaits(demarches)} / ${demarches.length}`} percent={pourcentage(compterFaits(demarches), demarches.length)} />
      </div>

      <div className="card">
        <h3>À faire bientôt</h3>
        {echeances.length === 0 && <p className="empty">Rien d'urgent pour l'instant.</p>}
        {echeances.map((e) => (
          <div className="row" key={e.cle}>
            <button className="check" onClick={() => marquerFait(foyer.id, e)} aria-label="Marquer comme fait" />
            <span className="title">{e.titre}</span>
            {e.collection === 'taches' && <WhoChip membre={e.assigne} />}
            <span className="badge urgent">{formatDate(e.echeance)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
