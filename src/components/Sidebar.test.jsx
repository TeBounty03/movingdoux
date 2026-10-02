import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ECRANS } from '../ecrans'
import Sidebar from './Sidebar'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

function AdresseCourante() {
  return <div data-testid="adresse">{useLocation().pathname}</div>
}

function afficher(adresse = '/') {
  return render(
    <MemoryRouter initialEntries={[adresse]}>
      <Sidebar onSignOut={() => {}} />
      <Routes>
        <Route path="*" element={<AdresseCourante />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Navigation', () => {
  it('propose un lien vers chaque écran déclaré dans ecrans.js', () => {
    afficher()
    for (const e of ECRANS) {
      expect(screen.getByRole('link', { name: e.libelle })).toHaveAttribute('href', e.chemin)
    }
  })

  it("signale l'écran courant", () => {
    afficher('/budget')
    expect(screen.getByRole('link', { name: 'Budget' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Aperçu' })).not.toHaveAttribute('aria-current')
  })

  it('ouvre le menu « Plus », navigue et le referme', async () => {
    const user = userEvent.setup()
    afficher()

    const plus = screen.getByRole('button', { name: 'Plus' })
    expect(plus).toHaveAttribute('aria-expanded', 'false')
    await user.click(plus)
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('link', { name: 'Meubles' }))
    expect(screen.getByTestId('adresse')).toHaveTextContent('/meubles')
    expect(screen.getByRole('button', { name: 'Plus' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('met « Plus » en avant quand l’écran courant est dans ce menu', () => {
    afficher('/parametres')
    expect(screen.getByRole('button', { name: 'Plus' })).toHaveClass('active')
  })

  it('garde au plus 4 écrans dans la barre mobile pour que tout tienne sur 320 px', () => {
    expect(ECRANS.filter((e) => e.barreMobile).length).toBeLessThanOrEqual(4)
  })
})
