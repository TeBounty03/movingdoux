import { Children, cloneElement, isValidElement, useId } from 'react'

// Formulaire d'ajout repliable, utilisé par tous les écrans :
//
//   const form = useFormulaire(FORMULAIRE_VIDE)   // src/lib/useFormulaire.js
//   <BoutonOuvrir formulaire={form}>+ Ajouter une tâche</BoutonOuvrir>
//   <PanneauFormulaire formulaire={form} onValider={(valeurs) => ajouterTache(foyer.id, valeurs)}>
//     <Champ label="Titre" full><input {...form.champ('titre')} /></Champ>
//   </PanneauFormulaire>
//
// onValider renvoie false si la saisie est incomplète : le formulaire reste alors ouvert.

export function BoutonOuvrir({ formulaire, children }) {
  return (
    <button type="button" className="btn-add" aria-expanded={formulaire.ouvert} onClick={formulaire.basculer}>
      {formulaire.ouvert ? 'Fermer' : children}
    </button>
  )
}

export function PanneauFormulaire({ formulaire, onValider, libelleValider = 'Ajouter', children }) {
  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await onValider(formulaire.valeurs)
    if (ok === false) return
    formulaire.reinitialiser()
    formulaire.fermer()
  }

  return (
    <div className={`form-panel ${formulaire.ouvert ? 'open' : ''}`}>
      <form className="form-grid" onSubmit={handleSubmit}>
        {children}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={formulaire.fermer}>Annuler</button>
          <button type="submit" className="btn-submit">{libelleValider}</button>
        </div>
      </form>
    </div>
  )
}

// Libellé + champ. Le libellé est relié au champ (clic, lecteurs d'écran, tests).
// Avec `groupe`, le contenu est un ensemble de boutons ou de champs : le libellé nomme le groupe.
export function Champ({ label, full = false, groupe = false, children }) {
  const id = useId()
  const classe = `field ${full ? 'full' : ''}`
  if (groupe) {
    return (
      <div className={classe} role="group" aria-labelledby={id}>
        <span className="field-label" id={id}>{label}</span>
        {children}
      </div>
    )
  }
  const enfant = Children.only(children)
  return (
    <div className={classe}>
      <label htmlFor={id}>{label}</label>
      {isValidElement(enfant) ? cloneElement(enfant, { id }) : enfant}
    </div>
  )
}
