import { useState } from 'react'
import EnTete from '../components/EnTete'
import { BoutonOuvrir, Champ, PanneauFormulaire } from '../components/Formulaire'
import WhoChip from '../components/WhoChip'
import {
  FORMULAIRE_VIDE,
  STATUTS,
  ajouterMeuble,
  changerStatutMeuble,
  filtrerParProprietaire,
  useMeubles,
  volumeConseille,
  volumeGarde,
  volumeM3,
} from '../models/meubles'
import { useFormulaire } from '../lib/useFormulaire'
import './Meubles.css'

export default function Meubles({ foyer, membres }) {
  const { rows: meubles } = useMeubles(foyer.id)
  const [filtre, setFiltre] = useState('tous')
  const form = useFormulaire(FORMULAIRE_VIDE)
  const { valeurs } = form

  const volumeSaisi = volumeM3(valeurs.longueur_cm, valeurs.largeur_cm, valeurs.hauteur_cm)
  const visibles = filtrerParProprietaire(meubles, filtre)

  return (
    <div>
      <EnTete titre="Meubles">Liste, mesures, volume et place dans le T4</EnTete>

      <div className="vol-summary">
        <div className="label">Volume total (meubles gardés)</div>
        <div className="value">≈ {volumeGarde(meubles).toFixed(1)} m³</div>
        <div className="note">
          Recommandation à donner aux déménageurs : compter ~{volumeConseille(meubles).toFixed(1)} m³ (marge d'empilement de +25 à 30 % incluse).
        </div>
      </div>

      <div className="filter-tabs" role="group" aria-label="Filtrer par propriétaire">
        <button className={filtre === 'tous' ? 'active' : ''} aria-pressed={filtre === 'tous'} onClick={() => setFiltre('tous')}>
          Tous
        </button>
        {membres.map((m) => (
          <button key={m.id} className={filtre === m.id ? 'active' : ''} aria-pressed={filtre === m.id} onClick={() => setFiltre(m.id)}>
            {m.prenom}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Liste des meubles</h3>
          <BoutonOuvrir formulaire={form}>+ Ajouter un meuble</BoutonOuvrir>
        </div>

        <PanneauFormulaire formulaire={form} onValider={(v) => ajouterMeuble(foyer.id, v)} libelleValider="Ajouter à la liste">
          <Champ label="Nom du meuble" full>
            <input type="text" placeholder="Ex : Canapé 3 places" {...form.champ('nom')} />
          </Champ>
          <Champ label="Propriétaire" full groupe>
            <div className="owner-pick">
              <button type="button" className={valeurs.proprietaire_id === '' ? 'active' : ''} onClick={() => form.set('proprietaire_id', '')}>
                Commun
              </button>
              {membres.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={valeurs.proprietaire_id === m.id ? 'active' : ''}
                  onClick={() => form.set('proprietaire_id', m.id)}
                >
                  {m.prenom}
                </button>
              ))}
            </div>
          </Champ>
          <Champ label="Dimensions (cm)" full groupe>
            <div className="dims-row">
              <input type="number" inputMode="decimal" placeholder="Long." aria-label="Longueur (cm)" {...form.champ('longueur_cm')} />
              <span className="x">×</span>
              <input type="number" inputMode="decimal" placeholder="Larg." aria-label="Largeur (cm)" {...form.champ('largeur_cm')} />
              <span className="x">×</span>
              <input type="number" inputMode="decimal" placeholder="Haut." aria-label="Hauteur (cm)" {...form.champ('hauteur_cm')} />
            </div>
          </Champ>
          <div className="live-volume">
            <span>Volume calculé automatiquement</span>
            <b>{volumeSaisi.toFixed(2)} m³</b>
          </div>
          <Champ label="Pièce de destination" full>
            <input type="text" placeholder="Ex : Salon" {...form.champ('piece_destination')} />
          </Champ>
        </PanneauFormulaire>

        {visibles.map((m) => (
          <div className="furn-row" key={m.id}>
            <WhoChip membre={membres.find((mm) => mm.id === m.proprietaire_id)} />
            <span className="name">{m.nom}</span>
            <span className="dims">{m.longueur_cm}×{m.largeur_cm}×{m.hauteur_cm} cm</span>
            <span className="vol">{Number(m.volume_m3).toFixed(2)} m³</span>
            <select
              className="statut-select"
              aria-label={`Statut de ${m.nom}`}
              value={m.statut}
              onChange={(e) => changerStatutMeuble(foyer.id, m, e.target.value)}
            >
              {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        ))}
        {visibles.length === 0 && <p className="empty">Aucun meuble pour l'instant.</p>}
      </div>
    </div>
  )
}
