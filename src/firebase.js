import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

// Configuration publique de l'app web Firebase (projet moving-doux).
// Ces valeurs ne sont pas secrètes : la sécurité est assurée par firestore.rules.
// `npm run dev:emulateurs` et les tests de bout en bout utilisent les émulateurs
// Firebase locaux (voir firebase.json) : rien ne touche la vraie base.
// Le préfixe demo- garantit qu'aucune ressource réelle n'est utilisée.
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

const firebaseConfig = {
  apiKey: 'AIzaSyC5k8s9Xtretn5SvsmcVwqLXjnraf0dUz0',
  authDomain: 'moving-doux.firebaseapp.com',
  projectId: useEmulators ? 'demo-movingdoux' : 'moving-doux',
  storageBucket: 'moving-doux.firebasestorage.app',
  messagingSenderId: '754174276275',
  appId: '1:754174276275:web:e5e132d0efb450fcdd76c6',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// Cache local : l'appli reste utilisable hors ligne et se resynchronise ensuite
export const db = initializeFirestore(app, {
  localCache: useEmulators
    ? memoryLocalCache()
    : persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8181)
}
