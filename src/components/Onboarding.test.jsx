import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import Onboarding from './Onboarding'

// Les liens « Comment ça marche ? » ont besoin d'un routeur
const afficher = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('Bienvenue (création / rejoindre un foyer)', () => {
  it('crée un foyer avec le prénom saisi', async () => {
    const createFoyer = vi.fn(async () => ({ error: null }))
    const user = userEvent.setup()
    afficher(<Onboarding createFoyer={createFoyer} joinFoyer={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('Ton prénom'), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Créer le foyer' }))
    expect(createFoyer).toHaveBeenCalledWith('Alice')
  })

  it('rejoint un foyer avec le code', async () => {
    const joinFoyer = vi.fn(async () => ({ error: null }))
    const user = userEvent.setup()
    afficher(<Onboarding createFoyer={vi.fn()} joinFoyer={joinFoyer} />)
    await user.click(screen.getByRole('button', { name: 'Rejoindre' }))
    await user.type(screen.getByPlaceholderText('Ton prénom'), 'Béa')
    await user.type(screen.getByPlaceholderText('Code du foyer (ex: 8f3a1c2b)'), 'abcd1234')
    await user.click(screen.getAllByRole('button', { name: 'Rejoindre' }).at(-1))
    expect(joinFoyer).toHaveBeenCalledWith('abcd1234', 'Béa')
  })

  it('explique quoi faire quand le code est introuvable', async () => {
    const user = userEvent.setup()
    afficher(<Onboarding createFoyer={vi.fn()} joinFoyer={vi.fn(async () => ({ error: new Error('x') }))} />)
    await user.click(screen.getByRole('button', { name: 'Rejoindre' }))
    await user.type(screen.getByPlaceholderText('Ton prénom'), 'Béa')
    await user.type(screen.getByPlaceholderText('Code du foyer (ex: 8f3a1c2b)'), 'mauvais')
    await user.click(screen.getAllByRole('button', { name: 'Rejoindre' }).at(-1))
    expect(await screen.findByText(/Code introuvable/)).toBeInTheDocument()
  })

  it('affiche une erreur si la création échoue, et permet de réessayer', async () => {
    const user = userEvent.setup()
    afficher(<Onboarding createFoyer={vi.fn(async () => ({ error: new Error('x') }))} joinFoyer={vi.fn()} />)
    await user.type(screen.getByPlaceholderText('Ton prénom'), 'Alice')
    await user.click(screen.getByRole('button', { name: 'Créer le foyer' }))
    expect(await screen.findByText('Un souci est survenu, réessaie.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Créer le foyer' })).toBeEnabled()
  })
})
