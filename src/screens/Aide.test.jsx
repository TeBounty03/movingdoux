import { readdirSync, readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ECRANS } from '../ecrans'
import { COLLECTIONS_FOYER } from '../models'
import Aide from './Aide'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

const guide = readFileSync('docs/guide-utilisation.md', 'utf8')
const technique = readFileSync('docs/documentation-technique.md', 'utf8')

function afficher(adresse) {
  return render(
    <MemoryRouter initialEntries={[adresse]}>
      <Routes>
        <Route path="/aide/*" element={<Aide />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('documentation à jour', () => {
  it("le guide d'utilisation a une section pour chaque écran", () => {
    const sections = [...guide.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim())
    for (const e of ECRANS.filter((e) => e.id !== 'aide')) {
      expect(sections, `section « ## ${e.libelle} » manquante dans docs/guide-utilisation.md`).toContain(e.libelle)
    }
  })

  it('la documentation technique décrit chaque collection et chaque écran', () => {
    for (const c of COLLECTIONS_FOYER) {
      expect(technique, `collection ${c} absente de docs/documentation-technique.md`).toContain(`${c}/{id}`)
    }
    expect(technique).toContain('src/ecrans.js')
  })

  it('la documentation technique cite les vrais fichiers du projet', () => {
    const chemins = [...technique.matchAll(/`((?:src|docs|e2e|tests)\/[\w./-]+\.(?:js|jsx|css|md))`/g)]
      .map((m) => m[1])
      .filter((c) => !/logement/i.test(c)) // exemple fictif du tutoriel « Ajouter une fonctionnalité »
    expect(chemins.length).toBeGreaterThan(5)
    for (const chemin of chemins) {
      expect(() => readFileSync(chemin), `${chemin} cité dans la doc technique mais introuvable`).not.toThrow()
    }
  })
})

describe('images de la documentation', () => {
  const citees = [...`${guide}\n${technique}`.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1])
  const presentes = ['images', 'schemas'].flatMap((d) => readdirSync(`docs/${d}`).map((f) => `${d}/${f}`))

  it('chaque image citée existe (sinon : npm run captures)', () => {
    expect(citees.length).toBeGreaterThan(10)
    for (const image of citees) expect(presentes, `${image} citée mais absente de docs/`).toContain(image)
  })

  it('chaque image générée est citée dans la doc', () => {
    for (const image of presentes) expect(citees, `${image} n'est citée nulle part`).toContain(image)
  })

  it('chaque schéma HTML a son image', () => {
    const sources = readdirSync('scripts/captures/schemas').filter((f) => f.endsWith('.html'))
    for (const f of sources) expect(presentes).toContain(`schemas/${f.replace('.html', '.png')}`)
  })
})

describe('écran Aide', () => {
  it('affiche les captures et les schémas', () => {
    const { container } = afficher('/aide')
    const captures = container.querySelectorAll('img.doc-capture')
    expect(captures.length).toBeGreaterThan(10)
    expect(captures[0]).toHaveAttribute('alt', 'Écran de connexion')
  })

  it("affiche le guide d'utilisation avec son sommaire", () => {
    afficher('/aide')
    expect(screen.getByRole('link', { name: "Guide d'utilisation" })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Premiers pas' })).toHaveAttribute('href', '#premiers-pas')
    expect(screen.getByRole('heading', { level: 2, name: 'Premiers pas' })).toHaveAttribute('id', 'premiers-pas')
    expect(screen.getByRole('heading', { level: 3, name: 'Créer le foyer (première personne)' })).toBeInTheDocument()
  })

  it('passe à la documentation technique', async () => {
    const user = userEvent.setup()
    afficher('/aide')
    await user.click(screen.getByRole('link', { name: 'Documentation technique' }))
    expect(screen.getByRole('heading', { level: 2, name: "Comment l'appli est découpée" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Documentation technique' })).toHaveAttribute('aria-current', 'page')
  })
})
