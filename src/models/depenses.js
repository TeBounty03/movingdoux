import { addRow, useFoyerCollection } from '../lib/data'
import { aujourdhui, texteOuNull } from '../lib/format'

export const COLLECTION = 'depenses'

export const FORMULAIRE_VIDE = { categorie: '', paye_par_id: '', montant_prevu: '', montant_reel: '' }

const montant = (valeur) => (valeur === '' || valeur == null ? null : Number(valeur))

// Document à enregistrer ; null si le poste de dépense manque
export function nouvelleDepense(champs, date = new Date()) {
  const categorie = texteOuNull(champs.categorie)
  if (!categorie) return null
  return {
    categorie,
    paye_par_id: champs.paye_par_id || null,
    montant_prevu: montant(champs.montant_prevu),
    montant_reel: montant(champs.montant_reel),
    date: aujourdhui(date),
  }
}

export function totaux(depenses) {
  return {
    reel: depenses.reduce((s, d) => s + Number(d.montant_reel || 0), 0),
    prevu: depenses.reduce((s, d) => s + Number(d.montant_prevu || 0), 0),
  }
}

// Partage à parts égales : solde > 0 → on doit de l'argent à la personne, < 0 → elle en doit.
// Une dépense payée par quelqu'un qui n'est plus membre compte dans le total mais pour personne.
export function soldes(depenses, membres) {
  if (membres.length === 0) return []
  const paye = Object.fromEntries(membres.map((m) => [m.id, 0]))
  for (const d of depenses) {
    if (d.paye_par_id in paye) paye[d.paye_par_id] += Number(d.montant_reel || 0)
  }
  const part = totaux(depenses).reel / membres.length
  return membres.map((m) => ({ membre: m, paye: paye[m.id], solde: paye[m.id] - part }))
}

// En dessous d'un euro d'écart, on considère que c'est à jour
export const SEUIL_A_JOUR = 1

// ---------- accès aux données ----------

export const useDepenses = (foyerId) => useFoyerCollection(COLLECTION, foyerId)

export async function ajouterDepense(foyerId, champs) {
  const depense = nouvelleDepense(champs)
  if (!depense) return false
  await addRow(foyerId, COLLECTION, depense)
  return true
}
