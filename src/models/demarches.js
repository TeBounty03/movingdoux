import { addRow, updateRow, useFoyerCollection } from '../lib/data'
import { texteOuNull } from '../lib/format'
import { A_FAIRE, EN_COURS, FAIT } from './statuts'

export const COLLECTION = 'demarches'

export const FORMULAIRE_VIDE = { titre: '', categorie: '', organisme: '', echeance: '' }

export const CHECKLIST_TYPE = [
  { titre: 'Internet / box', categorie: 'Résiliation / souscription' },
  { titre: 'Électricité — gaz', categorie: 'Résiliation / souscription' },
  { titre: 'Assurance habitation', categorie: 'Résiliation / souscription' },
  { titre: 'Redirection du courrier (La Poste)', categorie: 'Changement d’adresse' },
  { titre: 'Impôts', categorie: 'Changement d’adresse' },
  { titre: 'Sécurité sociale', categorie: 'Changement d’adresse' },
  { titre: 'Banque', categorie: 'Changement d’adresse' },
  { titre: 'Employeur', categorie: 'Changement d’adresse' },
  { titre: 'État des lieux sortant', categorie: 'Logement' },
  { titre: 'État des lieux entrant', categorie: 'Logement' },
  { titre: 'Restitution des clés / caution', categorie: 'Logement' },
  { titre: 'Carte grise / assurance auto', categorie: 'Autre' },
]

// Document à enregistrer ; null si le titre manque
export function nouvelleDemarche(champs) {
  const titre = texteOuNull(champs.titre)
  if (!titre) return null
  return {
    titre,
    categorie: texteOuNull(champs.categorie),
    organisme: texteOuNull(champs.organisme),
    echeance: champs.echeance || null,
    statut: A_FAIRE,
  }
}

// Démarches de la checklist type pas encore présentes (comparées par titre)
export function manquantesDeLaChecklist(demarches) {
  const titres = new Set(demarches.map((d) => d.titre))
  return CHECKLIST_TYPE.filter((c) => !titres.has(c.titre)).map((c) => nouvelleDemarche(c))
}

export function grouperParCategorie(demarches) {
  const groupes = {}
  for (const d of demarches) {
    const categorie = d.categorie || 'Autre'
    ;(groupes[categorie] ??= []).push(d)
  }
  return groupes
}

// Cliquer sur le badge fait avancer : à faire → en cours → fait
export function statutSuivant(statut) {
  if (statut === A_FAIRE) return EN_COURS
  if (statut === EN_COURS) return FAIT
  return statut
}

// ---------- accès aux données ----------

export const useDemarches = (foyerId) => useFoyerCollection(COLLECTION, foyerId)

export async function ajouterDemarche(foyerId, champs) {
  const demarche = nouvelleDemarche(champs)
  if (!demarche) return false
  await addRow(foyerId, COLLECTION, demarche)
  return true
}

export function ajouterChecklist(foyerId, demarchesExistantes) {
  return Promise.all(manquantesDeLaChecklist(demarchesExistantes).map((d) => addRow(foyerId, COLLECTION, d)))
}

export function changerStatutDemarche(foyerId, demarche, statut) {
  return updateRow(foyerId, COLLECTION, demarche.id, { statut })
}
