import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

// Les données d'un foyer vivent dans des sous-collections :
// foyers/{foyerId}/taches, cartons, depenses, demarches, meubles, membres
export function foyerCollection(foyerId, name) {
  return collection(db, 'foyers', foyerId, name)
}

export function snapshotRows(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
}

// Lit une collection du foyer courant et se met à jour automatiquement
// (pour tous les membres connectés) grâce aux écouteurs Firestore.
export function useFoyerCollection(name, foyerId) {
  // Les lignes sont mémorisées avec la collection écoutée : si elle change,
  // on repasse en chargement sans réinitialiser l'état dans l'effet
  const key = foyerId ? `${foyerId}/${name}` : null
  const [state, setState] = useState({ key: null, rows: [] })

  useEffect(() => {
    if (!key) return
    const q = query(foyerCollection(foyerId, name), orderBy('created_at'))
    return onSnapshot(
      q,
      (snapshot) => setState({ key, rows: snapshotRows(snapshot) }),
      () => setState({ key, rows: [] })
    )
  }, [key, name, foyerId])

  const ready = state.key === key
  return { rows: ready ? state.rows : [], loading: !ready }
}

export function addRow(foyerId, name, data) {
  return addDoc(foyerCollection(foyerId, name), { ...data, created_at: serverTimestamp() })
}

export function updateRow(foyerId, name, id, data) {
  return updateDoc(doc(db, 'foyers', foyerId, name, id), data)
}
