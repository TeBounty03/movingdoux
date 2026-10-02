import EnTete from '../components/EnTete'
import { BoutonOuvrir, Champ, PanneauFormulaire } from '../components/Formulaire'
import { formatDate } from '../lib/format'
import {
  FORMULAIRE_VIDE,
  ajouterChecklist,
  ajouterDemarche,
  changerStatutDemarche,
  grouperParCategorie,
  statutSuivant,
  useDemarches,
} from '../models/demarches'
import { useFormulaire } from '../lib/useFormulaire'
import { A_FAIRE, EN_COURS, FAIT } from '../models/statuts'

// Badge d'état ; cliquer dessus fait avancer la démarche (à faire → en cours → fait)
function BadgeStatut({ demarche, onAvancer }) {
  if (demarche.statut === FAIT) return <span className="badge done">Fait</span>
  const [classe, texte] =
    demarche.statut === EN_COURS
      ? ['progress', 'En cours']
      : demarche.echeance
        ? ['urgent', formatDate(demarche.echeance)]
        : ['todo', 'À faire']
  return (
    <button type="button" className={`badge ${classe}`} title="Faire avancer" onClick={onAvancer}>
      {texte}
    </button>
  )
}

export default function Demarches({ foyer }) {
  const { rows: demarches } = useDemarches(foyer.id)
  const form = useFormulaire(FORMULAIRE_VIDE)
  const parCategorie = grouperParCategorie(demarches)

  return (
    <div>
      <EnTete titre="Démarches">Checklist pré-remplie, à ajuster à votre cas</EnTete>

      <div className="card">
        <div className="card-head">
          <h3>Ajouter</h3>
          <div className="card-actions">
            <button type="button" className="btn-add" onClick={() => ajouterChecklist(foyer.id, demarches)}>
              + Checklist type
            </button>
            <BoutonOuvrir formulaire={form}>+ Démarche</BoutonOuvrir>
          </div>
        </div>

        <PanneauFormulaire formulaire={form} onValider={(v) => ajouterDemarche(foyer.id, v)}>
          <Champ label="Titre" full>
            <input type="text" {...form.champ('titre')} />
          </Champ>
          <Champ label="Catégorie">
            <input type="text" placeholder="Ex : Changement d'adresse" {...form.champ('categorie')} />
          </Champ>
          <Champ label="Organisme">
            <input type="text" {...form.champ('organisme')} />
          </Champ>
          <Champ label="Échéance">
            <input type="date" {...form.champ('echeance')} />
          </Champ>
        </PanneauFormulaire>
      </div>

      {Object.entries(parCategorie).map(([categorie, liste]) => (
        <div className="card" key={categorie}>
          <h3>{categorie}</h3>
          {liste.map((d) => (
            <div className={`row ${d.statut === FAIT ? 'done' : ''}`} key={d.id}>
              <button
                className={`check ${d.statut === FAIT ? 'done' : ''}`}
                aria-label={`${d.statut === FAIT ? 'Rouvrir' : 'Terminer'} « ${d.titre} »`}
                onClick={() => changerStatutDemarche(foyer.id, d, d.statut === FAIT ? A_FAIRE : FAIT)}
              />
              <span className="title">{d.titre}</span>
              <BadgeStatut demarche={d} onAvancer={() => changerStatutDemarche(foyer.id, d, statutSuivant(d.statut))} />
            </div>
          ))}
        </div>
      ))}
      {demarches.length === 0 && (
        <p className="empty on-dark">
          Aucune démarche pour l'instant — clique sur « + Checklist type » pour partir d'une base.
        </p>
      )}
    </div>
  )
}
