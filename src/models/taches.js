import { addRow, updateRow, useFoyerCollection } from '../lib/data'
import { texteOuNull } from '../lib/format'
import { A_FAIRE, basculerFait } from './statuts'

export const COLLECTION = 'taches'

export const PHASES = [
  { id: 'avant', label: 'Avant le déménagement' },
  { id: 'pendant', label: 'Pendant le déménagement' },
  { id: 'apres', label: 'Après le déménagement' },
]

export const FORMULAIRE_VIDE = { titre: '', phase: 'avant', assigne_id: '', echeance: '', parent_tache_id: '' }

// Document à enregistrer à partir du formulaire ; null si le titre manque
export function nouvelleTache(champs) {
  const titre = texteOuNull(champs.titre)
  if (!titre) return null
  return {
    titre,
    phase: champs.phase || 'avant',
    assigne_id: champs.assigne_id || null,
    echeance: champs.echeance || null,
    parent_tache_id: champs.parent_tache_id || null,
    statut: A_FAIRE,
  }
}

export function tachesPrincipales(taches, phase) {
  return taches.filter((t) => !t.parent_tache_id && (phase === undefined || t.phase === phase))
}

export function sousTaches(taches, parentId) {
  return taches.filter((t) => t.parent_tache_id === parentId)
}

// ---------- accès aux données ----------

export const useTaches = (foyerId) => useFoyerCollection(COLLECTION, foyerId)

export async function ajouterTache(foyerId, champs) {
  const tache = nouvelleTache(champs)
  if (!tache) return false
  await addRow(foyerId, COLLECTION, tache)
  return true
}

export function basculerTache(foyerId, tache) {
  return updateRow(foyerId, COLLECTION, tache.id, { statut: basculerFait(tache.statut) })
}
