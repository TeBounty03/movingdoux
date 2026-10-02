import EnTete from '../components/EnTete'
import { BoutonOuvrir, Champ, PanneauFormulaire } from '../components/Formulaire'
import { texteOuNull } from '../lib/format'
import { useFormulaire } from '../lib/useFormulaire'
import './Parametres.css'

const PALETTE = ['#7A8F6E', '#A35C6E', '#8A79A8', '#C9973F', '#5C7F8C', '#B98A5A']
const ACCENTS = ['#D9A441', '#7FA37A', '#C97463', '#5C7F8C']

function Pastilles({ couleurs, choisie, onChoisir, nom }) {
  return (
    <div className="swatch-row">
      {couleurs.map((c) => (
        <button
          key={c}
          type="button"
          className={`color-swatch ${choisie === c ? 'active' : ''}`}
          style={{ background: c }}
          aria-label={`${nom} ${c}`}
          aria-pressed={choisie === c}
          onClick={() => onChoisir(c)}
        />
      ))}
    </div>
  )
}

export default function Parametres({ foyer, membres, addMembreLabel, removeMembre, setAccentColor, onSignOut }) {
  const form = useFormulaire({ prenom: '', couleur: PALETTE[0] })

  async function ajouterPersonne({ prenom, couleur }) {
    const nom = texteOuNull(prenom)
    if (!nom) return false
    await addMembreLabel(nom, couleur)
  }

  return (
    <div>
      <EnTete titre="Paramètres">Qui a accès à l'appli, et à quoi elle ressemble</EnTete>

      <div className="card">
        <h3>Inviter quelqu'un</h3>
        <p className="note-parametres">
          Pour qu'une personne puisse se connecter elle-même et voir/modifier les données en direct,
          donne-lui ce code — elle le renseigne sur l'écran « Rejoindre » à sa première connexion.
        </p>
        <div className="code-foyer" data-testid="code-foyer">
          {foyer.code}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Membres</h3>
          <BoutonOuvrir formulaire={form}>+ Ajouter une personne</BoutonOuvrir>
        </div>
        <PanneauFormulaire formulaire={form} onValider={ajouterPersonne}>
          <Champ label="Prénom" full>
            <input type="text" placeholder="Ex : colocataire, parent qui aide..." {...form.champ('prenom')} />
          </Champ>
          <Champ label="Couleur" full groupe>
            <Pastilles couleurs={PALETTE} choisie={form.valeurs.couleur} onChoisir={(c) => form.set('couleur', c)} nom="Couleur" />
          </Champ>
        </PanneauFormulaire>

        {membres.map((m) => (
          <div className="member-row" key={m.id}>
            <span className="who" style={{ background: m.couleur }}>{m.prenom.charAt(0).toUpperCase()}</span>
            <span className="name">{m.prenom}</span>
            {!m.user_id && (
              <button className="btn-cancel" onClick={() => removeMembre(m.id)} aria-label={`Retirer ${m.prenom}`}>
                Retirer
              </button>
            )}
          </div>
        ))}
        <p className="note-parametres petite">
          Une personne ajoutée ici sert de repère (assignation de tâches, propriétaire de meubles...) mais n'a pas
          de compte tant qu'elle ne rejoint pas elle-même le foyer avec le code ci-dessus.
        </p>
      </div>

      <div className="card">
        <h3>Apparence</h3>
        <div className="field" role="group" aria-label="Couleur d'accent de l'appli">
          <span className="field-label">Couleur d'accent de l'appli</span>
          <Pastilles couleurs={ACCENTS} choisie={foyer.couleur_accent} onChoisir={setAccentColor} nom="Accent" />
        </div>
      </div>

      {/* Sur mobile la barre de navigation n'a pas la place pour ce bouton : il est ici pour tous */}
      <div className="card">
        <h3>Compte</h3>
        <button type="button" className="btn-cancel btn-signout" onClick={onSignOut}>Se déconnecter</button>
      </div>
    </div>
  )
}
