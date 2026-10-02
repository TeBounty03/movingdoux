import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alice, bea, dataMock, foyer, resetData } from '../test/fakeData'
import Budget from './Budget'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

describe('Budget', () => {
  beforeEach(() => resetData())

  it('répartit les dépenses à parts égales entre les membres', () => {
    resetData({
      depenses: [
        { id: 'd1', categorie: 'Camion', paye_par_id: alice.id, montant_prevu: 150, montant_reel: 180 },
        { id: 'd2', categorie: 'Cartons', paye_par_id: bea.id, montant_prevu: 50, montant_reel: 20 },
      ],
    })
    render(<Budget foyer={foyer} membres={[alice, bea]} />)

    // Total 200 € → 100 € chacune : Alice a avancé 80 € de trop, Béa en doit 80
    expect(screen.getByText(/Alice a payé 180 €/)).toHaveTextContent('on lui doit 80 €')
    expect(screen.getByText(/Béa a payé 20 €/)).toHaveTextContent('doit 80 €')
    expect(screen.getByText('200 € / 200 € prévus')).toBeInTheDocument()
  })

  it('affiche « à jour » quand tout le monde a payé autant', () => {
    resetData({
      depenses: [
        { id: 'd1', categorie: 'A', paye_par_id: alice.id, montant_reel: 50 },
        { id: 'd2', categorie: 'B', paye_par_id: bea.id, montant_reel: 50 },
      ],
    })
    render(<Budget foyer={foyer} membres={[alice, bea]} />)
    expect(screen.getByText(/Alice a payé 50 €/)).toHaveTextContent('à jour')
    expect(screen.getByText(/Béa a payé 50 €/)).toHaveTextContent('à jour')
  })

  it('compte les dépenses d’une personne retirée du foyer sans les lui attribuer', () => {
    resetData({ depenses: [{ id: 'd1', categorie: 'X', paye_par_id: 'm-parti', montant_reel: 40 }] })
    render(<Budget foyer={foyer} membres={[alice]} />)
    expect(screen.getByText(/Alice a payé 0 €/)).toHaveTextContent('doit 40 €')
    // Colonne « Payé par » : personne inconnue
    expect(screen.getAllByRole('cell')[1]).toHaveTextContent('—')
  })

  it('enregistre une dépense avec des montants numériques et la date du jour', async () => {
    const user = userEvent.setup()
    render(<Budget foyer={foyer} membres={[alice, bea]} />)

    await user.click(screen.getByRole('button', { name: '+ Ajouter une dépense' }))
    await user.type(screen.getByLabelText('Poste de dépense'), '  Location camion  ')
    await user.selectOptions(screen.getByLabelText('Payé par'), 'Béa')
    await user.type(screen.getByLabelText('Montant prévu (€)'), '150')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))

    expect(dataMock.addRow).toHaveBeenCalledWith('foyer-1', 'depenses', {
      categorie: 'Location camion',
      paye_par_id: bea.id,
      montant_prevu: 150,
      montant_reel: null,
      date: new Date().toISOString().slice(0, 10),
    })
  })

  it("n'enregistre rien sans intitulé", async () => {
    const user = userEvent.setup()
    render(<Budget foyer={foyer} membres={[alice]} />)
    await user.click(screen.getByRole('button', { name: '+ Ajouter une dépense' }))
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(dataMock.addRow).not.toHaveBeenCalled()
  })
})
