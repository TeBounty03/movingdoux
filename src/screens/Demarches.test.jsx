import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dataMock, foyer, resetData } from '../test/fakeData'
import Demarches from './Demarches'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

describe('Démarches', () => {
  beforeEach(() => resetData())

  it('ajoute la checklist type sans recréer ce qui existe déjà', async () => {
    resetData({ demarches: [{ id: 'd1', titre: 'Banque', categorie: 'Changement d’adresse', statut: 'fait' }] })
    const user = userEvent.setup()
    render(<Demarches foyer={foyer} />)
    await user.click(screen.getByRole('button', { name: '+ Checklist type' }))
    const ajouts = dataMock.addRow.mock.calls
    expect(ajouts).toHaveLength(11)
    expect(ajouts.map(([, , d]) => d.titre)).not.toContain('Banque')
    expect(ajouts.every(([, coll, d]) => coll === 'demarches' && d.statut === 'a_faire')).toBe(true)
  })

  it('fait avancer une démarche : à faire → en cours → fait', async () => {
    resetData({
      demarches: [
        { id: 'd1', titre: 'Impôts', statut: 'a_faire' },
        { id: 'd2', titre: 'Banque', statut: 'en_cours' },
      ],
    })
    const user = userEvent.setup()
    render(<Demarches foyer={foyer} />)
    await user.click(screen.getByText('À faire'))
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'demarches', 'd1', { statut: 'en_cours' })
    await user.click(screen.getByText('En cours'))
    expect(dataMock.updateRow).toHaveBeenCalledWith('foyer-1', 'demarches', 'd2', { statut: 'fait' })
  })

  it('range les démarches sans catégorie dans « Autre »', () => {
    resetData({ demarches: [{ id: 'd1', titre: 'Divers', statut: 'a_faire' }] })
    render(<Demarches foyer={foyer} />)
    expect(screen.getByRole('heading', { name: 'Autre' }).parentElement).toHaveTextContent('Divers')
  })
})
