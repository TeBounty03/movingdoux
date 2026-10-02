// Statuts communs aux tâches, cartons et démarches
export const A_FAIRE = 'a_faire'
export const EN_COURS = 'en_cours'
export const FAIT = 'fait'

// Case à cocher : fait ↔ à faire
export function basculerFait(statut) {
  return statut === FAIT ? A_FAIRE : FAIT
}

export function compterFaits(lignes) {
  return lignes.filter((l) => l.statut === FAIT).length
}
