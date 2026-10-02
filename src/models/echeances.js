import { updateRow } from '../lib/data'
import * as demarches from './demarches'
import { FAIT } from './statuts'
import * as taches from './taches'

// Tâches et démarches non faites qui ont une échéance, de la plus proche à la plus lointaine
export function prochainesEcheances(listeTaches, listeDemarches, membres, limite = 5) {
  const membreParId = Object.fromEntries(membres.map((m) => [m.id, m]))
  const aVenir = (l) => l.statut !== FAIT && l.echeance
  return [
    ...listeTaches.filter(aVenir).map((t) => ({
      cle: `t-${t.id}`, collection: taches.COLLECTION, id: t.id, titre: t.titre, echeance: t.echeance,
      assigne: membreParId[t.assigne_id] ?? null,
    })),
    ...listeDemarches.filter(aVenir).map((d) => ({
      cle: `d-${d.id}`, collection: demarches.COLLECTION, id: d.id, titre: d.titre, echeance: d.echeance,
      assigne: null,
    })),
  ]
    .sort((a, b) => new Date(a.echeance) - new Date(b.echeance))
    .slice(0, limite)
}

export function marquerFait(foyerId, echeance) {
  return updateRow(foyerId, echeance.collection, echeance.id, { statut: FAIT })
}
