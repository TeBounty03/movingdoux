import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alice, dataMock, foyer, resetData } from '../test/fakeData'
import Taches from './Taches'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

describe('Tâches', () => {
  beforeEach(() =>
    resetData({
      taches: [
        { id: 't1', titre: 'Résilier la box', phase: 'avant', statut: 'a_faire', assigne_id: alice.id },
        { id: 't2', titre: 'Trouver le numéro client', phase: 'avant', statut: 'fait', parent_tache_id: 't1' },
        { id: 't3', titre: 'Faire le ménage', phase: 'apres', statut: 'fait' },
      ],
    })
  )

  it('range les tâches par phase et les sous-tâches sous leur parent', () => {
    render(<Taches foyer={foyer} membres={[alice]} />)
    const avant = screen.getByRole('heading', { name: 'Avant le déménagement' }).parentElement
    expect(avant).toHaveTextContent('Résilier la box')
    expect(avant).toHaveTextContent('Trouver le numéro client')
    const pendant = screen.getByRole('heading', { name: 'Pendant le déménagement' }).parentElement
    expect(pendant).toHaveTextContent("Aucune tâche pour l'instant.")
    const apres = screen.getByRole('heading', { name: 'Après le déménagement' }).parentElement
    expect(apres).toHaveTextContent('Faire le ménage')
  })

  it('bascule le statut d’une tâche', async () => {
    const user = userEvent.setup()
    const { container } = render(<Taches foyer={foyer} membres={[alice]} />)
    const [premiereCase] = container.querySelectorAll('.row .check')
    await user.click(premiereCase)
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'taches', 't1', { statut: 'fait' })
  })

  it('crée une sous-tâche « à faire » rattachée à sa tâche principale', async () => {
    const user = userEvent.setup()
    render(<Taches foyer={foyer} membres={[alice]} />)
    await user.click(screen.getByRole('button', { name: '+ Ajouter une tâche' }))
    await user.type(screen.getByLabelText('Titre'), 'Rendre le modem')
    await user.selectOptions(screen.getByLabelText('Phase'), 'pendant')
    await user.selectOptions(screen.getByLabelText('Sous-tâche de'), 'Résilier la box')
    await user.click(screen.getByRole('button', { name: 'Ajouter' }))
    expect(dataMock.addRow).toHaveBeenCalledWith('foyer-1', 'taches', {
      titre: 'Rendre le modem',
      phase: 'pendant',
      assigne_id: null,
      echeance: null,
      parent_tache_id: 't1',
      statut: 'a_faire',
    })
  })

  it('ne propose que les tâches principales comme parent', async () => {
    const user = userEvent.setup()
    render(<Taches foyer={foyer} membres={[alice]} />)
    await user.click(screen.getByRole('button', { name: '+ Ajouter une tâche' }))
    const options = [...screen.getByLabelText('Sous-tâche de').options].map((o) => o.textContent)
    expect(options).toEqual(['Aucune (tâche principale)', 'Résilier la box', 'Faire le ménage'])
  })
})
