import { addRow, updateRow, useFoyerCollection } from '../lib/data'
import { texteOuNull } from '../lib/format'
import { A_FAIRE, basculerFait } from './statuts'

export const COLLECTION = 'cartons'

export const FORMULAIRE_VIDE = { piece: '', description: '' }

// Document à enregistrer ; null si la pièce manque. Le numéro suit les cartons existants.
export function nouveauCarton(champs, cartonsExistants) {
  const piece = texteOuNull(champs.piece)
  if (!piece) return null
  return {
    numero: cartonsExistants.length + 1,
    piece,
    description: (champs.description ?? '').trim(),
    statut: A_FAIRE,
  }
}

// { Salon: [...], Cuisine: [...] } dans l'ordre d'apparition
export function grouperParPiece(cartons) {
  const groupes = {}
  for (const c of cartons) {
    const piece = c.piece || 'Autre'
    ;(groupes[piece] ??= []).push(c)
  }
  return groupes
}

// 3 → '03'
export function numeroAffiche(numero) {
  return String(numero).padStart(2, '0')
}

// ---------- accès aux données ----------

export const useCartons = (foyerId) => useFoyerCollection(COLLECTION, foyerId)

export async function ajouterCarton(foyerId, champs, cartonsExistants) {
  const carton = nouveauCarton(champs, cartonsExistants)
  if (!carton) return false
  await addRow(foyerId, COLLECTION, carton)
  return true
}

export function basculerCarton(foyerId, carton) {
  return updateRow(foyerId, COLLECTION, carton.id, { statut: basculerFait(carton.statut) })
}
