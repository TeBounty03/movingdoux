import EnTete from '../components/EnTete'
import { BoutonOuvrir, Champ, PanneauFormulaire } from '../components/Formulaire'
import {
  FORMULAIRE_VIDE,
  ajouterCarton,
  basculerCarton,
  grouperParPiece,
  numeroAffiche,
  useCartons,
} from '../models/cartons'
import { FAIT, compterFaits } from '../models/statuts'
import { useFormulaire } from '../lib/useFormulaire'
import './Cartons.css'

export default function Cartons({ foyer }) {
  const { rows: cartons } = useCartons(foyer.id)
  const form = useFormulaire(FORMULAIRE_VIDE)
  const parPiece = grouperParPiece(cartons)

  function basculer(e, carton) {
    if (e.type === 'keydown') {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
    }
    basculerCarton(foyer.id, carton)
  }

  return (
    <div>
      <EnTete titre="Cartons">Par pièce de destination dans le T4</EnTete>

      <div className="card">
        <div className="card-head">
          <h3>Ajouter un carton</h3>
          <BoutonOuvrir formulaire={form}>+ Ajouter</BoutonOuvrir>
        </div>
        <PanneauFormulaire formulaire={form} onValider={(v) => ajouterCarton(foyer.id, v, cartons)}>
          <Champ label="Pièce de destination">
            <input type="text" placeholder="Ex : Salon" {...form.champ('piece')} />
          </Champ>
          <Champ label="Contenu (description globale)">
            <input type="text" placeholder="Ex : Livres + déco" {...form.champ('description')} />
          </Champ>
        </PanneauFormulaire>
      </div>

      <div className="cols2">
        {Object.entries(parPiece).map(([piece, liste]) => (
          <div className="room-card" key={piece}>
            <div className="head">
              <h3>{piece}</h3>
              <span className="count">{compterFaits(liste)} / {liste.length} faits</span>
            </div>
            {liste.map((c) => (
              <div
                className={`box-line ${c.statut === FAIT ? 'done' : ''}`}
                key={c.id}
                role="button"
                tabIndex={0}
                aria-pressed={c.statut === FAIT}
                onClick={(e) => basculer(e, c)}
                onKeyDown={(e) => basculer(e, c)}
              >
                <span className="n">{numeroAffiche(c.numero)}</span>
                <span className="contenu">{c.description || '—'}</span>
                {c.statut === FAIT && <span className="badge done">Fait</span>}
              </div>
            ))}
          </div>
        ))}
        {cartons.length === 0 && <p className="empty on-dark">Aucun carton pour l'instant.</p>}
      </div>
    </div>
  )
}
