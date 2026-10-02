import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { alice, dataMock, foyer, resetData } from '../test/fakeData'
import Dashboard from './Dashboard'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

describe('Aperçu', () => {
  beforeEach(() => resetData())

  it('affiche les compteurs de chaque chantier', () => {
    resetData({
      taches: [{ id: 't1', titre: 'A', statut: 'fait' }, { id: 't2', titre: 'B', statut: 'a_faire' }],
      cartons: [{ id: 'c1', statut: 'fait' }],
      depenses: [{ id: 'd1', montant_prevu: 300, montant_reel: 150 }],
      demarches: [{ id: 'x', titre: 'X', statut: 'a_faire' }],
    })
    render(<Dashboard foyer={foyer} membres={[alice]} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
    expect(screen.getByText('150 € / 300 €')).toBeInTheDocument()
    expect(screen.getByText('0 / 1')).toBeInTheDocument()
  })

  it("n'invente pas de budget prévu quand il n'y en a pas", () => {
    resetData({ depenses: [{ id: 'd1', montant_reel: 40 }] })
    render(<Dashboard foyer={foyer} membres={[]} />)
    expect(screen.getByText('40 €')).toBeInTheDocument()
    expect(screen.queryByText(/\/ 1 €/)).not.toBeInTheDocument()
  })

  it('liste les 5 échéances les plus proches, tâches et démarches confondues', () => {
    resetData({
      taches: [
        { id: 't1', titre: 'Tâche 20 nov', statut: 'a_faire', echeance: '2026-11-20', assigne_id: alice.id },
        { id: 't2', titre: 'Tâche faite', statut: 'fait', echeance: '2026-10-01' },
        { id: 't3', titre: 'Tâche sans date', statut: 'a_faire' },
        { id: 't4', titre: 'Tâche 5 nov', statut: 'a_faire', echeance: '2026-11-05' },
        { id: 't5', titre: 'Tâche 1 déc', statut: 'a_faire', echeance: '2026-12-01' },
        { id: 't6', titre: 'Tâche 2 déc', statut: 'a_faire', echeance: '2026-12-02' },
      ],
      demarches: [{ id: 'd1', titre: 'Démarche 10 nov', statut: 'en_cours', echeance: '2026-11-10' }],
    })
    render(<Dashboard foyer={foyer} membres={[alice]} />)
    const carte = screen.getByRole('heading', { name: 'À faire bientôt' }).parentElement
    const titres = within(carte)
      .getAllByText(/^(Tâche|Démarche)/)
      .map((el) => el.textContent)
    expect(titres).toEqual(['Tâche 5 nov', 'Démarche 10 nov', 'Tâche 20 nov', 'Tâche 1 déc', 'Tâche 2 déc'])
  })

  it('marque une échéance comme faite dans la bonne collection', async () => {
    resetData({ demarches: [{ id: 'd1', titre: 'Impôts', statut: 'a_faire', echeance: '2026-11-10' }] })
    const user = userEvent.setup()
    render(<Dashboard foyer={foyer} membres={[]} />)
    await user.click(screen.getByRole('button', { name: 'Marquer comme fait' }))
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'demarches', 'd1', { statut: 'fait' })
  })
})
