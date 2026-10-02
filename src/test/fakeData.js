import { vi } from 'vitest'

// Remplace src/lib/data.js dans les tests de composants :
// chaque collection renvoie les lignes fournies par le test, et les écritures sont espionnées.
export const collections = {}

export const dataMock = {
  useFoyerCollection: (name) => ({ rows: collections[name] ?? [], loading: false }),
  addRow: vi.fn(async () => {}),
  updateRow: vi.fn(async () => {}),
}

export function resetData(initial = {}) {
  for (const k of Object.keys(collections)) delete collections[k]
  Object.assign(collections, initial)
  dataMock.addRow.mockClear()
  dataMock.updateRow.mockClear()
}

export const foyer = { id: 'foyer-1', nom: 'Notre déménagement', code: 'abcd1234', couleur_accent: '#D9A441' }
export const alice = { id: 'm-alice', prenom: 'Alice', couleur: '#5C7F8C', user_id: 'uid-alice' }
export const bea = { id: 'm-bea', prenom: 'Béa', couleur: '#B98A5A', user_id: 'uid-bea' }
