import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import Login from './Login'

// Les liens « Comment ça marche ? » ont besoin d'un routeur
const afficher = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

const signInWithEmail = vi.fn()
vi.mock('../lib/useAuth', () => ({ useAuth: () => ({ signInWithEmail }) }))

describe('Connexion', () => {
  it('envoie le lien magique et invite à regarder sa boîte mail', async () => {
    signInWithEmail.mockResolvedValueOnce({ error: null })
    const user = userEvent.setup()
    afficher(<Login />)
    await user.type(screen.getByPlaceholderText('ton@email.fr'), 'alice@exemple.fr')
    await user.click(screen.getByRole('button', { name: 'Recevoir le lien de connexion' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Moving Doux' })).toBeInTheDocument()
    expect(signInWithEmail).toHaveBeenCalledWith('alice@exemple.fr')
    expect(await screen.findByText(/Regarde ta boîte mail/)).toBeInTheDocument()
  })

  it("affiche une erreur si l'envoi échoue", async () => {
    signInWithEmail.mockResolvedValueOnce({ error: new Error('quota') })
    const user = userEvent.setup()
    afficher(<Login />)
    await user.type(screen.getByPlaceholderText('ton@email.fr'), 'alice@exemple.fr')
    await user.click(screen.getByRole('button', { name: 'Recevoir le lien de connexion' }))
    expect(await screen.findByText(/Un souci est survenu/)).toBeInTheDocument()
  })
})
