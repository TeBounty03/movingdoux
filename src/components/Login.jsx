import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../lib/useAuth'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    const { error } = await signInWithEmail(email)
    setStatus(error ? 'error' : 'sent')
  }

  return (
    <div className="login-screen">
      <form className="login-box" onSubmit={handleSubmit}>
        <h1>Nid</h1>
        <p>Organiser le déménagement, à plusieurs.</p>
        <input
          type="email"
          required
          placeholder="ton@email.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn-submit" type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Envoi...' : 'Recevoir le lien de connexion'}
        </button>
        {status === 'sent' && (
          <div className="login-msg">Regarde ta boîte mail — clique sur le lien reçu pour te connecter.</div>
        )}
        {status === 'error' && (
          <div className="login-error">Un souci est survenu, réessaie dans un instant.</div>
        )}
        <Link to="/aide" className="login-aide">Comment ça marche ?</Link>
      </form>
    </div>
  )
}
