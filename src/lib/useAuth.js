import { useEffect, useState } from 'react'
import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../firebase'

const EMAIL_KEY = 'movingdoux-email-connexion'

// Le hook est monté à plusieurs endroits (App, Login) : on ne traite le lien qu'une fois
let linkHandled = false

export function useAuth() {
  const [user, setUser] = useState(auth.currentUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Retour depuis le lien magique reçu par e-mail
    if (!linkHandled && isSignInWithEmailLink(auth, window.location.href)) {
      linkHandled = true
      const email =
        window.localStorage.getItem(EMAIL_KEY) ||
        window.prompt('Confirme ton e-mail pour terminer la connexion')
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => window.localStorage.removeItem(EMAIL_KEY))
          .catch(() => {})
          .finally(() => window.history.replaceState(null, '', window.location.pathname))
      }
    }

    return onAuthStateChanged(auth, (newUser) => {
      setUser(newUser)
      setLoading(false)
    })
  }, [])

  async function signInWithEmail(email) {
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: true,
      })
      window.localStorage.setItem(EMAIL_KEY, email)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return { user, loading, signInWithEmail, signOut }
}
