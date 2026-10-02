import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataMock, foyer, resetData } from '../test/fakeData'
import Cartons from './Cartons'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

describe('Cartons', () => {
  beforeEach(() =>
    resetData({
      cartons: [
        { id: 'c1', numero: 1, piece: 'Salon', description: 'Livres', statut: 'fait' },
        { id: 'c2', numero: 2, piece: 'Salon', description: 'Déco', statut: 'a_faire' },
        { id: 'c3', numero: 3, piece: 'Cuisine', description: 'Vaisselle', statut: 'a_faire' },
      ],
    })
  )

  it('regroupe les cartons par pièce avec leur avancement', () => {
    render(<Cartons foyer={foyer} />)
    expect(screen.getByRole('heading', { name: 'Salon' }).parentElement).toHaveTextContent('1 / 2 faits')
    expect(screen.getByRole('heading', { name: 'Cuisine' }).parentElement).toHaveTextContent('0 / 1 faits')
    expect(screen.getByText('03')).toBeInTheDocument()
  })

  it('numérote le nouveau carton à la suite', async () => {
    const user = userEvent.setup()
    render(<Cartons foyer={foyer} />)
    await user.click(screen.getByRole('button', { name: '+ Ajouter' }))
    await user.type(screen.getByLabelText('Pièce de destination'), 'Chambre')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(dataMock.addRow).toHaveBeenCalledWith('foyer-1', 'cartons', {
      numero: 4,
      piece: 'Chambre',
      description: '',
      statut: 'a_faire',
    })
  })

  it('coche et décoche un carton', async () => {
    const user = userEvent.setup()
    render(<Cartons foyer={foyer} />)
    await user.click(screen.getByText('Livres'))
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'cartons', 'c1', { statut: 'a_faire' })
    await user.click(screen.getByText('Vaisselle'))
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'cartons', 'c3', { statut: 'fait' })
  })
})
