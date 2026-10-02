import EnTete from '../components/EnTete'
import { BoutonOuvrir, Champ, PanneauFormulaire } from '../components/Formulaire'
import WhoChip from '../components/WhoChip'
import { formatDate } from '../lib/format'
import { FAIT } from '../models/statuts'
import {
  FORMULAIRE_VIDE,
  PHASES,
  ajouterTache,
  basculerTache,
  sousTaches,
  tachesPrincipales,
  useTaches,
} from '../models/taches'
import { useFormulaire } from '../lib/useFormulaire'
import './Taches.css'

export default function Taches({ foyer, membres }) {
  const { rows: taches } = useTaches(foyer.id)
  const form = useFormulaire(FORMULAIRE_VIDE)
  const membreParId = (id) => membres.find((m) => m.id === id) || null

  return (
    <div>
      <EnTete titre="Tâches">Organisées par phase — avant, pendant, après</EnTete>

      <div className="card">
        <div className="card-head">
          <h3>Ajouter</h3>
          <BoutonOuvrir formulaire={form}>+ Ajouter une tâche</BoutonOuvrir>
        </div>

        <PanneauFormulaire formulaire={form} onValider={(v) => ajouterTache(foyer.id, v)}>
          <Champ label="Titre" full>
            <input type="text" placeholder="Ex : Résilier le contrat internet" {...form.champ('titre')} />
          </Champ>
          <Champ label="Phase">
            <select {...form.champ('phase')}>
              {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Champ>
          <Champ label="Assigné à">
            <select {...form.champ('assigne_id')}>
              <option value="">Non assigné</option>
              {membres.map((m) => <option key={m.id} value={m.id}>{m.prenom}</option>)}
            </select>
          </Champ>
          <Champ label="Échéance">
            <input type="date" {...form.champ('echeance')} />
          </Champ>
          <Champ label="Sous-tâche de">
            <select {...form.champ('parent_tache_id')}>
              <option value="">Aucune (tâche principale)</option>
              {tachesPrincipales(taches).map((t) => <option key={t.id} value={t.id}>{t.titre}</option>)}
            </select>
          </Champ>
        </PanneauFormulaire>
      </div>

      {PHASES.map((phase) => {
        const principales = tachesPrincipales(taches, phase.id)
        return (
          <div className="card" key={phase.id}>
            <h3>{phase.label}</h3>
            {principales.length === 0 && <p className="empty">Aucune tâche pour l'instant.</p>}
            {principales.map((t) => (
              <div key={t.id}>
                <div className={`row ${t.statut === FAIT ? 'done' : ''}`}>
                  <button
                    className={`check ${t.statut === FAIT ? 'done' : ''}`}
                    aria-label={`${t.statut === FAIT ? 'Rouvrir' : 'Terminer'} « ${t.titre} »`}
                    onClick={() => basculerTache(foyer.id, t)}
                  />
                  <span className="title">{t.titre}</span>
                  <WhoChip membre={membreParId(t.assigne_id)} />
                  {t.statut === FAIT ? (
                    <span className="badge done">Fait</span>
                  ) : t.echeance ? (
                    <span className="badge urgent">{formatDate(t.echeance)}</span>
                  ) : (
                    <span className="badge todo">À faire</span>
                  )}
                </div>
                {sousTaches(taches, t.id).map((st) => (
                  <div className={`subtask ${st.statut === FAIT ? 'done' : ''}`} key={st.id}>
                    <button
                      className={`check ${st.statut === FAIT ? 'done' : ''}`}
                      aria-label={`${st.statut === FAIT ? 'Rouvrir' : 'Terminer'} « ${st.titre} »`}
                      onClick={() => basculerTache(foyer.id, st)}
                    />
                    <span>{st.titre}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
