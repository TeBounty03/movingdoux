// Régénère les images de la documentation : `npm run captures`
// - captures du guide (docs/images/*.jpg) : l'appli tourne sur les émulateurs avec les données fictives
//   de donnees.js, chaque scène est photographiée à la taille d'un téléphone avec ses pastilles ;
// - schémas de la doc technique (docs/schemas/*.png) : une page HTML par schéma dans schemas/.
// Rien ne touche la vraie base. Pour une seule image : `npm run captures -- -g budget`.
import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'
import { emailUnique, seConnecter } from '../../e2e/helpers.js'
import { annoter, effacerAnnotations } from './annoter.js'
import { remplirFoyer } from './donnees.js'
import { lister, viderEmulateurs } from './emulateur.js'

const IMAGES = path.resolve('docs/images')
const SCHEMAS_HTML = path.resolve('scripts/captures/schemas')
const SCHEMAS = path.resolve('docs/schemas')
const TELEPHONE = { viewport: { width: 390, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }

test.describe.configure({ mode: 'serial' })

async function photographier(page, nom, { hauteur = 760, reperes = [] } = {}) {
  await page.setViewportSize({ width: 390, height: hauteur })
  await page.evaluate(() => document.fonts.ready)
  await annoter(page, reperes)
  fs.mkdirSync(IMAGES, { recursive: true })
  await page.screenshot({ path: path.join(IMAGES, `${nom}.jpg`), type: 'jpeg', quality: 82 })
  await effacerAnnotations(page)
}

// Fait défiler pour que l'élément soit en haut de l'écran
async function enHaut(page, locator, marge = 12) {
  await locator.first().evaluate((el, m) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - m), marge)
}

const aller = async (page, chemin, titre) => {
  await page.goto(chemin)
  await expect(page.getByRole('heading', { level: 1, name: titre })).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
}

test('captures du guide d’utilisation', async ({ browser }) => {
  test.setTimeout(180_000)
  await viderEmulateurs()

  const contexteLea = await browser.newContext(TELEPHONE)
  const page = await contexteLea.newPage()

  // ---------- connexion ----------
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Recevoir le lien de connexion' })).toBeVisible()
  await page.getByPlaceholder('ton@email.fr').fill('lea@exemple.fr')
  await photographier(page, 'connexion', {
    hauteur: 640,
    reperes: [
      page.getByPlaceholder('ton@email.fr'),
      page.getByRole('button', { name: 'Recevoir le lien de connexion' }),
      page.getByRole('link', { name: 'Comment ça marche ?' }),
    ],
  })

  // ---------- Léa crée le foyer ----------
  await seConnecter(page, 'lea@exemple.fr')
  await page.getByPlaceholder('Ton prénom').fill('Léa')
  await photographier(page, 'creer-foyer', {
    hauteur: 640,
    reperes: [page.getByRole('button', { name: 'Créer', exact: true }), page.getByPlaceholder('Ton prénom'), page.getByRole('button', { name: 'Créer le foyer' })],
  })
  await page.getByRole('button', { name: 'Créer le foyer' }).click()
  await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
  const [foyer] = await lister('foyers')

  // ---------- Sam rejoint avec le code ----------
  const contexteSam = await browser.newContext(TELEPHONE)
  const pageSam = await contexteSam.newPage()
  await seConnecter(pageSam, emailUnique('sam'))
  await pageSam.getByRole('button', { name: 'Rejoindre' }).click()
  await pageSam.getByPlaceholder('Ton prénom').fill('Sam')
  await pageSam.getByPlaceholder('Code du foyer (ex: 8f3a1c2b)').fill(foyer.code)
  await photographier(pageSam, 'rejoindre-foyer', {
    hauteur: 640,
    reperes: [
      pageSam.getByRole('button', { name: 'Rejoindre' }).first(),
      pageSam.getByPlaceholder('Ton prénom'),
      pageSam.getByPlaceholder('Code du foyer (ex: 8f3a1c2b)'),
      pageSam.getByRole('button', { name: 'Rejoindre' }).last(),
    ],
  })
  await pageSam.getByRole('button', { name: 'Rejoindre' }).last().click()
  await expect(pageSam.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
  await contexteSam.close()

  const membres = await lister(`foyers/${foyer.id}/membres`)
  const id = (prenom) => membres.find((m) => m.prenom === prenom).id
  await remplirFoyer(foyer.id, { lea: id('Léa'), sam: id('Sam') })

  // ---------- Aperçu ----------
  await aller(page, '/', 'Aperçu')
  await expect(page.getByText('Résilier la box internet')).toBeVisible()
  const nav = page.getByRole('navigation')
  await photographier(page, 'apercu', {
    hauteur: 860,
    reperes: [page.locator('.grid'), page.getByRole('heading', { name: 'À faire bientôt' }).locator('..'), page.getByRole('button', { name: 'Marquer comme fait' }).first(), nav],
  })

  // ---------- menu Plus ----------
  await nav.getByRole('button', { name: 'Plus' }).click()
  await photographier(page, 'menu-plus', {
    hauteur: 520,
    reperes: [nav.getByRole('button', { name: 'Fermer' }), page.locator('.nav-autres')],
  })
  await nav.getByRole('button', { name: 'Fermer' }).click()

  // ---------- Tâches ----------
  await aller(page, '/taches', 'Tâches')
  await expect(page.getByText('Retrouver le numéro client')).toBeVisible()
  const box = page.locator('.row', { hasText: 'Résilier la box internet' })
  await photographier(page, 'taches', {
    hauteur: 900,
    reperes: [
      page.getByRole('button', { name: '+ Ajouter une tâche' }),
      box.locator('.check'),
      box.locator('.who'),
      box.locator('.badge'),
      page.locator('.subtask', { hasText: 'Retrouver le numéro client' }),
    ],
  })
  await page.getByRole('button', { name: '+ Ajouter une tâche' }).click()
  await page.getByLabel('Titre').fill('Prévenir le gardien')
  await page.getByLabel('Phase').selectOption('avant')
  await page.getByLabel('Assigné à').selectOption({ label: 'Sam' })
  await enHaut(page, page.locator('.form-panel'))
  await photographier(page, 'tache-formulaire', {
    hauteur: 700,
    reperes: [page.getByLabel('Titre'), page.getByLabel('Phase'), page.getByLabel('Assigné à'), page.getByLabel('Échéance'), page.getByLabel('Sous-tâche de'), page.getByRole('button', { name: 'Ajouter', exact: true })],
  })
  await page.getByRole('button', { name: 'Annuler' }).click()

  // ---------- Cartons ----------
  await aller(page, '/cartons', 'Cartons')
  const salon = page.locator('.room-card', { hasText: 'Salon' })
  await expect(salon).toBeVisible()
  await photographier(page, 'cartons', {
    hauteur: 820,
    reperes: [
      page.getByRole('button', { name: '+ Ajouter' }),
      salon.locator('.head'),
      salon.locator('.count'),
      salon.locator('.box-line.done').first(),
      salon.locator('.box-line:not(.done)').first(),
    ],
  })

  // ---------- Budget ----------
  await aller(page, '/budget', 'Budget')
  await expect(page.getByRole('cell', { name: 'Location camion 20 m³' })).toBeVisible()
  await photographier(page, 'budget', {
    hauteur: 900,
    reperes: [page.locator('.who-line').first(), page.locator('.balance-card .amount'), page.getByRole('button', { name: '+ Ajouter une dépense' }), page.locator('table.data-table')],
  })

  // ---------- Démarches ----------
  await aller(page, '/demarches', 'Démarches')
  const internet = page.locator('.row', { hasText: 'Internet / box' })
  await expect(internet).toBeVisible()
  await photographier(page, 'demarches', {
    hauteur: 820,
    reperes: [page.getByRole('button', { name: '+ Checklist type' }), page.getByRole('button', { name: '+ Démarche' }), internet.locator('.check'), internet.locator('.badge')],
  })

  // ---------- Meubles ----------
  await aller(page, '/meubles', 'Meubles')
  const canape = page.locator('.furn-row', { hasText: 'Canapé 3 places' })
  await expect(canape).toBeVisible()
  await photographier(page, 'meubles', {
    hauteur: 900,
    reperes: [page.locator('.vol-summary'), page.locator('.filter-tabs'), canape.locator('.vol'), canape.locator('.statut-select')],
  })
  await page.getByRole('button', { name: '+ Ajouter un meuble' }).click()
  await page.getByLabel('Nom du meuble').fill('Commode')
  await page.getByRole('group', { name: 'Propriétaire', exact: true }).getByRole('button', { name: 'Léa' }).click()
  await page.getByPlaceholder('Long.').fill('90')
  await page.getByPlaceholder('Larg.').fill('45')
  await page.getByPlaceholder('Haut.').fill('80')
  await enHaut(page, page.locator('.form-panel'))
  await photographier(page, 'meuble-formulaire', {
    hauteur: 700,
    reperes: [page.getByRole('group', { name: 'Propriétaire', exact: true }), page.getByRole('group', { name: 'Dimensions (cm)', exact: true }), page.locator('.live-volume')],
  })
  await page.getByRole('button', { name: 'Annuler' }).click()

  // ---------- Paramètres ----------
  await aller(page, '/parametres', 'Paramètres')
  await expect(page.getByText('Mamie Jo')).toBeVisible()
  await photographier(page, 'parametres', {
    hauteur: 1100,
    reperes: [
      page.getByTestId('code-foyer'),
      page.getByRole('button', { name: '+ Ajouter une personne' }),
      page.locator('.member-row', { hasText: 'Mamie Jo' }),
      page.getByRole('group', { name: "Couleur d'accent de l'appli" }),
      page.locator('.main').getByRole('button', { name: 'Se déconnecter' }),
    ],
  })

  await contexteLea.close()
})

test('schémas de la documentation technique', async ({ page }) => {
  fs.mkdirSync(SCHEMAS, { recursive: true })
  const noms = fs.readdirSync(SCHEMAS_HTML).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5))
  expect(noms.length).toBeGreaterThan(0)
  await page.setViewportSize({ width: 440, height: 400 })
  for (const nom of noms) {
    await page.goto(`file://${path.join(SCHEMAS_HTML, `${nom}.html`).replace(/\\/g, '/')}`)
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(SCHEMAS, `${nom}.png`), fullPage: true })
  }
})
