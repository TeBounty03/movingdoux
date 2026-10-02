import { addRow, updateRow, useFoyerCollection } from '../lib/data'
import { texteOuNull } from '../lib/format'

export const COLLECTION = 'meubles'

export const STATUTS = [
  { id: 'on_garde', label: 'On garde' },
  { id: 'a_vendre', label: 'À vendre / donner' },
  { id: 'a_acheter', label: 'À acheter neuf' },
]
export const ON_GARDE = 'on_garde'

// Marge d'empilement à annoncer aux déménageurs (+25 à 30 %)
export const MARGE_EMPILEMENT = 1.28

export const FORMULAIRE_VIDE = {
  nom: '', proprietaire_id: '', longueur_cm: '', largeur_cm: '', hauteur_cm: '', piece_destination: '',
}

// Dimensions en cm → volume en m³
export function volumeM3(longueur, largeur, hauteur) {
  return ((Number(longueur) || 0) * (Number(largeur) || 0) * (Number(hauteur) || 0)) / 1_000_000
}

// Volume des meubles qu'on emmène
export function volumeGarde(meubles) {
  return meubles.filter((m) => m.statut === ON_GARDE).reduce((s, m) => s + Number(m.volume_m3 || 0), 0)
}

export function volumeConseille(meubles) {
  return volumeGarde(meubles) * MARGE_EMPILEMENT
}

// 'tous' ou l'id d'un membre
export function filtrerParProprietaire(meubles, filtre) {
  return filtre === 'tous' ? meubles : meubles.filter((m) => m.proprietaire_id === filtre)
}

// Document à enregistrer ; null si le nom ou une dimension manque
export function nouveauMeuble(champs) {
  const nom = texteOuNull(champs.nom)
  if (!nom || !champs.longueur_cm || !champs.largeur_cm || !champs.hauteur_cm) return null
  const longueur_cm = Number(champs.longueur_cm)
  const largeur_cm = Number(champs.largeur_cm)
  const hauteur_cm = Number(champs.hauteur_cm)
  return {
    nom,
    proprietaire_id: champs.proprietaire_id || null,
    longueur_cm,
    largeur_cm,
    hauteur_cm,
    volume_m3: volumeM3(longueur_cm, largeur_cm, hauteur_cm),
    piece_destination: texteOuNull(champs.piece_destination),
    statut: ON_GARDE,
  }
}

// ---------- accès aux données ----------

export const useMeubles = (foyerId) => useFoyerCollection(COLLECTION, foyerId)

export async function ajouterMeuble(foyerId, champs) {
  const meuble = nouveauMeuble(champs)
  if (!meuble) return false
  await addRow(foyerId, COLLECTION, meuble)
  return true
}

export function changerStatutMeuble(foyerId, meuble, statut) {
  return updateRow(foyerId, COLLECTION, meuble.id, { statut })
}
