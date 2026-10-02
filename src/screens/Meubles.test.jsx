import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alice, bea, dataMock, foyer, resetData } from '../test/fakeData'
import Meubles from './Meubles'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

const canape = { id: 'a', nom: 'Canapé', proprietaire_id: alice.id, longueur_cm: 200, largeur_cm: 90, hauteur_cm: 85, volume_m3: 1.53, statut: 'on_garde' }
const armoire = { id: 'b', nom: 'Armoire', proprietaire_id: bea.id, longueur_cm: 100, largeur_cm: 60, hauteur_cm: 200, volume_m3: 1.2, statut: 'on_garde' }
const chaise = { id: 'c', nom: 'Vieille chaise', proprietaire_id: alice.id, longueur_cm: 50, largeur_cm: 50, hauteur_cm: 100, volume_m3: 0.25, statut: 'a_vendre' }

describe('Meubles', () => {
  beforeEach(() => resetData({ meubles: [canape, armoire, chaise] }))

  it('ne compte que les meubles gardés dans le volume, avec la marge pour les déménageurs', () => {
    render(<Meubles foyer={foyer} membres={[alice, bea]} />)
    expect(screen.getByText('≈ 2.7 m³')).toBeInTheDocument() // 1.53 + 1.2
    expect(screen.getByText(/compter ~3\.5 m³/)).toBeInTheDocument() // 2.73 × 1.28
  })

  it('filtre la liste par propriétaire', async () => {
    const user = userEvent.setup()
    render(<Meubles foyer={foyer} membres={[alice, bea]} />)
    await user.click(screen.getAllByRole('button', { name: 'Béa' })[0])
    expect(screen.getByText('Armoire')).toBeInTheDocument()
    expect(screen.queryByText('Canapé')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tous' }))
    expect(screen.getByText('Canapé')).toBeInTheDocument()
  })

  it('calcule le volume en direct et l’enregistre avec le meuble', async () => {
    resetData()
    const user = userEvent.setup()
    render(<Meubles foyer={foyer} membres={[alice]} />)
    await user.click(screen.getByRole('button', { name: '+ Ajouter un meuble' }))
    await user.type(screen.getByLabelText('Nom du meuble'), 'Lit')
    await user.type(screen.getByPlaceholderText('Long.'), '200')
    await user.type(screen.getByPlaceholderText('Larg.'), '160')
    await user.type(screen.getByPlaceholderText('Haut.'), '50')
    expect(screen.getByText('1.60 m³')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ajouter à la liste' }))
    expect(dataMock.addRow).toHaveBeenCalledWith(
      'foyer-1',
      'meubles',
      expect.objectContaining({
        nom: 'Lit',
        proprietaire_id: null,
        longueur_cm: 200,
        largeur_cm: 160,
        hauteur_cm: 50,
        volume_m3: 1.6,
        statut: 'on_garde',
      })
    )
  })

  it('refuse un meuble sans dimensions', async () => {
    resetData()
    const user = userEvent.setup()
    render(<Meubles foyer={foyer} membres={[alice]} />)
    await user.click(screen.getByRole('button', { name: '+ Ajouter un meuble' }))
    await user.type(screen.getByLabelText('Nom du meuble'), 'Lit')
    await user.click(screen.getByRole('button', { name: 'Ajouter à la liste' }))
    expect(dataMock.addRow).not.toHaveBeenCalled()
  })

  it('change le statut d’un meuble', async () => {
    const user = userEvent.setup()
    render(<Meubles foyer={foyer} membres={[alice, bea]} />)
    await user.selectOptions(screen.getByLabelText('Statut de Canapé'), 'a_vendre')
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'meubles', 'a', { statut: 'a_vendre' })
  })
})
