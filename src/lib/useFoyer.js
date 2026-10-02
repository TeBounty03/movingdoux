import { useEffect, useState } from 'react'
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase'
import { addRow, foyerCollection, snapshotRows } from './data'

const OWNER_PALETTE = ['#5C7F8C', '#B98A5A', '#7A8F6E', '#A35C6E', '#8A79A8', '#C9973F']

// Code d'invitation : 8 caractères hexadécimaux
function genererCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// Modèle Firestore :
//   users/{uid}                 → { foyer_id } : le foyer de la personne connectée
//   codes/{code}                → { foyer_id } : code d'invitation → foyer
//   foyers/{foyerId}            → nom, couleur_accent, code, membresUids
//   foyers/{foyerId}/membres/…  → personnes (avec compte : id = uid ; sans compte : "label")
export function useFoyer(user) {
  const uid = user?.uid ?? null
  // Chaque valeur est mémorisée avec l'id écouté ; undefined = en cours de chargement
  const [profilState, setProfil] = useState({ uid: null, value: undefined })
  const [foyerState, setFoyer] = useState({ id: null, value: undefined })
  const [membresState, setMembres] = useState({ id: null, value: undefined })

  useEffect(() => {
    if (!uid) return
    return onSnapshot(
      doc(db, 'users', uid),
      { includeMetadataChanges: true },
      (snap) => {
        // Tant que le serveur n'a pas confirmé la création / l'arrivée dans le foyer,
        // les règles refuseraient de le lire et l'écoute s'arrêterait : on attend.
        if (snap.metadata.hasPendingWrites) return
        setProfil({ uid, value: snap.exists() ? snap.data() : null })
      },
      () => setProfil({ uid, value: null })
    )
  }, [uid])

  const profil = profilState.uid === uid ? profilState.value : undefined
  const foyerId = profil?.foyer_id ?? null

  useEffect(() => {
    if (!foyerId) return
    const stopFoyer = onSnapshot(
      doc(db, 'foyers', foyerId),
      (snap) => setFoyer({ id: foyerId, value: snap.exists() ? { id: snap.id, ...snap.data() } : null }),
      () => setFoyer({ id: foyerId, value: null })
    )
    const stopMembres = onSnapshot(
      query(foyerCollection(foyerId, 'membres'), orderBy('created_at')),
      (snap) => setMembres({ id: foyerId, value: snapshotRows(snap) }),
      () => setMembres({ id: foyerId, value: [] })
    )
    return () => {
      stopFoyer()
      stopMembres()
    }
  }, [foyerId])

  const foyer = foyerState.id === foyerId ? foyerState.value : undefined
  const membres = membresState.id === foyerId ? membresState.value : undefined

  const loading = Boolean(uid) && (profil === undefined || (foyerId && (foyer === undefined || membres === undefined)))
  const membre = (foyer && membres?.find((m) => m.user_id === uid)) || null

  // Crée un nouveau foyer et y rattache l'utilisateur courant comme premier membre
  async function createFoyer(prenom) {
    const foyerRef = doc(collection(db, 'foyers'))
    const code = genererCode()
    const batch = writeBatch(db)
    batch.set(foyerRef, {
      nom: 'Notre déménagement',
      couleur_accent: '#D9A441',
      code,
      membresUids: [uid],
      created_at: serverTimestamp(),
    })
    batch.set(doc(db, 'codes', code), { foyer_id: foyerRef.id })
    batch.set(doc(foyerRef, 'membres', uid), {
      user_id: uid,
      prenom,
      couleur: OWNER_PALETTE[0],
      created_at: serverTimestamp(),
    })
    batch.set(doc(db, 'users', uid), { foyer_id: foyerRef.id })
    try {
      await batch.commit()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Rejoint un foyer existant via son code d'invitation (voir écran Paramètres)
  async function joinFoyer(code, prenom) {
    const joinCode = code.trim().toLowerCase()
    try {
      const codeSnap = await getDoc(doc(db, 'codes', joinCode))
      if (!codeSnap.exists()) return { error: new Error('Code introuvable') }
      const cibleId = codeSnap.data().foyer_id

      const batch = writeBatch(db)
      batch.update(doc(db, 'foyers', cibleId), { membresUids: arrayUnion(uid) })
      batch.set(doc(db, 'foyers', cibleId, 'membres', uid), {
        user_id: uid,
        prenom,
        couleur: OWNER_PALETTE[Math.floor(Math.random() * OWNER_PALETTE.length)],
        created_at: serverTimestamp(),
      })
      // join_code permet aux règles de vérifier que la personne connaît bien le code
      batch.set(doc(db, 'users', uid), { foyer_id: cibleId, join_code: joinCode })
      await batch.commit()
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  // Ajoute une personne "label" (sans compte) pour pouvoir lui assigner des choses
  async function addMembreLabel(prenom, couleur) {
    if (!foyer) return { error: new Error('Pas de foyer') }
    try {
      await addRow(foyer.id, 'membres', { user_id: null, prenom, couleur })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async function removeMembre(id) {
    try {
      await deleteDoc(doc(db, 'foyers', foyer.id, 'membres', id))
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async function setAccentColor(couleur) {
    if (!foyer) return
    await updateDoc(doc(db, 'foyers', foyer.id), { couleur_accent: couleur })
  }

  return {
    loading,
    foyer: foyer ?? null,
    membre,
    membres: membres ?? [],
    createFoyer,
    joinFoyer,
    addMembreLabel,
    removeMembre,
    setAccentColor,
    palette: OWNER_PALETTE,
  }
}
