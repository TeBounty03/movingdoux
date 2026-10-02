import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Ces tests rejouent exactement les écritures faites par src/lib/useFoyer.js
// et les écrans, contre l'émulateur Firestore avec les vraies règles.

let env

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-movingdoux',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8181 },
  })
})
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const db = (uid) => env.authenticatedContext(uid).firestore()
const anonyme = () => env.unauthenticatedContext().firestore()

// Même batch que createFoyer()
async function creerFoyer(uid, { foyerId = 'foyer-1', code = 'abcd1234', prenom = 'Alice' } = {}) {
  const d = db(uid)
  const batch = writeBatch(d)
  batch.set(doc(d, 'foyers', foyerId), {
    nom: 'Notre déménagement',
    couleur_accent: '#D9A441',
    code,
    membresUids: [uid],
    created_at: serverTimestamp(),
  })
  batch.set(doc(d, 'codes', code), { foyer_id: foyerId })
  batch.set(doc(d, 'foyers', foyerId, 'membres', uid), { user_id: uid, prenom, couleur: '#5C7F8C', created_at: serverTimestamp() })
  batch.set(doc(d, 'users', uid), { foyer_id: foyerId })
  return batch.commit()
}

// Même batch que joinFoyer()
function rejoindre(uid, { foyerId = 'foyer-1', code = 'abcd1234', prenom = 'Béa' } = {}) {
  const d = db(uid)
  const batch = writeBatch(d)
  batch.update(doc(d, 'foyers', foyerId), { membresUids: arrayUnion(uid) })
  batch.set(doc(d, 'foyers', foyerId, 'membres', uid), { user_id: uid, prenom, couleur: '#B98A5A', created_at: serverTimestamp() })
  batch.set(doc(d, 'users', uid), { foyer_id: foyerId, join_code: code })
  return batch.commit()
}

describe('créer un foyer', () => {
  it('fonctionne pour une personne connectée', async () => {
    await assertSucceeds(creerFoyer('alice'))
    await assertSucceeds(getDoc(doc(db('alice'), 'foyers', 'foyer-1')))
    await assertSucceeds(getDocs(collection(db('alice'), 'foyers', 'foyer-1', 'membres')))
  })

  it('est refusé sans être connecté', async () => {
    await assertFails(setDoc(doc(anonyme(), 'foyers', 'f'), { code: 'x', membresUids: [] }))
  })

  it("est refusé si on y inscrit quelqu'un d'autre", async () => {
    await assertFails(setDoc(doc(db('alice'), 'foyers', 'f'), { code: 'x', membresUids: ['alice', 'bob'] }))
  })

  it("est refusé si le code d'invitation est déjà pris", async () => {
    await creerFoyer('alice')
    await assertFails(creerFoyer('bob', { foyerId: 'foyer-2', code: 'abcd1234' }))
  })

  it("ne permet pas d'enregistrer un code qui pointe vers le foyer de quelqu'un d'autre", async () => {
    await creerFoyer('alice')
    await assertFails(setDoc(doc(db('bob'), 'codes', 'volé'), { foyer_id: 'foyer-1' }))
  })

  // Régression : l'écoute démarrée dès la création ne doit pas être refusée
  it('le foyer créé est lisible en direct par son créateur', async () => {
    await creerFoyer('alice')
    const lu = await new Promise((resolve, reject) => {
      const stop = onSnapshot(doc(db('alice'), 'foyers', 'foyer-1'), (s) => (stop(), resolve(s.data())), reject)
    })
    expect(lu.membresUids).toEqual(['alice'])
  })
})

describe('rejoindre un foyer', () => {
  beforeEach(() => creerFoyer('alice'))

  it('fonctionne avec le bon code', async () => {
    await assertSucceeds(getDoc(doc(db('bea'), 'codes', 'abcd1234')))
    await assertSucceeds(rejoindre('bea'))
    await assertSucceeds(getDocs(collection(db('bea'), 'foyers', 'foyer-1', 'taches')))
  })

  it('est refusé avec un mauvais code', async () => {
    await assertFails(rejoindre('bea', { code: 'mauvais0' }))
  })

  it("est refusé si on ajoute quelqu'un d'autre que soi", async () => {
    await assertFails(updateDoc(doc(db('bea'), 'foyers', 'foyer-1'), { membresUids: arrayUnion('bea', 'intrus') }))
  })

  it('la liste des codes ne peut pas être parcourue', async () => {
    await assertFails(getDocs(collection(db('bea'), 'codes')))
  })
})

describe('accès aux données du foyer', () => {
  beforeEach(async () => {
    await creerFoyer('alice')
    await creerFoyer('zoe', { foyerId: 'foyer-2', code: 'ffff0000', prenom: 'Zoé' })
  })

  for (const coll of ['taches', 'cartons', 'depenses', 'demarches', 'meubles']) {
    it(`${coll} : un membre lit et écrit, un autre foyer non`, async () => {
      const ref = await assertSucceeds(addDoc(collection(db('alice'), 'foyers', 'foyer-1', coll), { titre: 'x' }))
      await assertSucceeds(updateDoc(doc(db('alice'), 'foyers', 'foyer-1', coll, ref.id), { statut: 'fait' }))
      await assertFails(getDocs(collection(db('zoe'), 'foyers', 'foyer-1', coll)))
      await assertFails(addDoc(collection(db('zoe'), 'foyers', 'foyer-1', coll), { titre: 'x' }))
      await assertFails(getDocs(collection(anonyme(), 'foyers', 'foyer-1', coll)))
    })
  }

  it("une collection inconnue n'est pas accessible", async () => {
    await assertFails(addDoc(collection(db('alice'), 'foyers', 'foyer-1', 'secrets'), { x: 1 }))
  })

  it("on ne lit pas le foyer de quelqu'un d'autre", async () => {
    await assertFails(getDoc(doc(db('zoe'), 'foyers', 'foyer-1')))
    await assertFails(getDoc(doc(db('zoe'), 'users', 'alice')))
  })

  it('un membre change la couleur mais pas le code ni la liste des membres', async () => {
    const ref = doc(db('alice'), 'foyers', 'foyer-1')
    await assertSucceeds(updateDoc(ref, { couleur_accent: '#7FA37A' }))
    await assertFails(updateDoc(ref, { code: 'nouveau0' }))
    await assertFails(updateDoc(ref, { membresUids: ['alice', 'zoe'] }))
  })
})

describe('membres', () => {
  beforeEach(() => creerFoyer('alice'))

  it("on ajoute et retire une personne sans compte", async () => {
    const membres = collection(db('alice'), 'foyers', 'foyer-1', 'membres')
    const ref = await assertSucceeds(addDoc(membres, { user_id: null, prenom: 'Papa', couleur: '#000' }))
    await assertSucceeds(deleteDoc(ref))
  })

  it("on ne retire pas une personne qui a un compte", async () => {
    await assertFails(deleteDoc(doc(db('alice'), 'foyers', 'foyer-1', 'membres', 'alice')))
  })

  it("on ne crée pas de fiche au nom d'un autre compte", async () => {
    await assertFails(setDoc(doc(db('alice'), 'foyers', 'foyer-1', 'membres', 'bob'), { user_id: 'bob', prenom: 'Bob' }))
  })
})
