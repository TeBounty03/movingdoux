import EnTete from '../components/EnTete'
import { BoutonOuvrir, Champ, PanneauFormulaire } from '../components/Formulaire'
import { formatEuros } from '../lib/format'
import { FORMULAIRE_VIDE, SEUIL_A_JOUR, ajouterDepense, soldes, totaux, useDepenses } from '../models/depenses'
import { useFormulaire } from '../lib/useFormulaire'
import './Budget.css'

function Solde({ solde }) {
  if (solde > SEUIL_A_JOUR) return <span className="creance">on lui doit {formatEuros(solde)}</span>
  if (solde < -SEUIL_A_JOUR) return <span>doit {formatEuros(Math.abs(solde))}</span>
  return <span>à jour</span>
}

export default function Budget({ foyer, membres }) {
  const { rows: depenses } = useDepenses(foyer.id)
  const form = useFormulaire(FORMULAIRE_VIDE)
  const total = totaux(depenses)
  const parPersonne = soldes(depenses, membres)

  return (
    <div>
      <EnTete titre="Budget">Dépenses et répartition entre tout le monde</EnTete>

      <div className="balance-card">
        {parPersonne.map(({ membre, paye, solde }) => (
          <div key={membre.id} className="who-line">
            {membre.prenom} a payé {formatEuros(paye)} — <Solde solde={solde} />
          </div>
        ))}
        <div className="amount">{formatEuros(total.reel)} / {formatEuros(total.prevu)} prévus</div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Dépenses</h3>
          <BoutonOuvrir formulaire={form}>+ Ajouter une dépense</BoutonOuvrir>
        </div>

        <PanneauFormulaire formulaire={form} onValider={(v) => ajouterDepense(foyer.id, v)}>
          <Champ label="Poste de dépense" full>
            <input type="text" placeholder="Ex : Location camion" {...form.champ('categorie')} />
          </Champ>
          <Champ label="Payé par">
            <select {...form.champ('paye_par_id')}>
              <option value="">—</option>
              {membres.map((m) => <option key={m.id} value={m.id}>{m.prenom}</option>)}
            </select>
          </Champ>
          <Champ label="Montant prévu (€)">
            <input type="number" step="0.01" inputMode="decimal" {...form.champ('montant_prevu')} />
          </Champ>
          <Champ label="Montant réel (€)">
            <input type="number" step="0.01" inputMode="decimal" {...form.champ('montant_reel')} />
          </Champ>
        </PanneauFormulaire>

        <table className="data-table">
          <thead>
            <tr><th>Poste</th><th>Payé par</th><th className="num">Prévu</th><th className="num">Réel</th></tr>
          </thead>
          <tbody>
            {depenses.map((d) => (
              <tr key={d.id}>
                <td>{d.categorie}</td>
                <td>{membres.find((m) => m.id === d.paye_par_id)?.prenom || '—'}</td>
                <td className="num">{d.montant_prevu ? formatEuros(d.montant_prevu) : '—'}</td>
                <td className="num">{d.montant_reel ? formatEuros(d.montant_reel) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {depenses.length === 0 && <p className="empty">Aucune dépense pour l'instant.</p>}
      </div>
    </div>
  )
}
