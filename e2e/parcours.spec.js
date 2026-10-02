import { expect, test } from './fixtures'
import { allerSur, creerFoyer, emailUnique, seConnecter, verifierAffichage } from './helpers'

test('connexion, création du foyer et utilisation de chaque écran', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Recevoir le lien de connexion' })).toBeVisible()
  await verifierAffichage(page, testInfo, '01-connexion')

  await seConnecter(page, emailUnique('alice'))
  await expect(page.getByRole('heading', { name: 'Bienvenue' })).toBeVisible()
  await verifierAffichage(page, testInfo, '02-bienvenue')

  // Régression : la création du foyer restait bloquée sur cet écran
  await creerFoyer(page, 'Alice')
  await verifierAffichage(page, testInfo, '03-apercu-vide')

  // Tâches : une tâche principale et une sous-tâche
  await allerSur(page, 'Tâches')
  await page.getByRole('button', { name: '+ Ajouter une tâche' }).click()
  await page.getByPlaceholder('Ex : Résilier le contrat internet').fill('Résilier la box internet')
  await page.getByLabel('Assigné à').selectOption({ label: 'Alice' })
  await page.getByLabel('Échéance').fill('2026-11-15')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(page.getByText('Résilier la box internet').filter({ visible: true })).toBeVisible()
  await page.getByRole('button', { name: '+ Ajouter une tâche' }).click()
  await page.getByPlaceholder('Ex : Résilier le contrat internet').fill('Trouver le numéro client')
  await page.getByLabel('Sous-tâche de').selectOption({ label: 'Résilier la box internet' })
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(page.getByText('Trouver le numéro client').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '04-taches')

  // Cartons
  await allerSur(page, 'Cartons')
  await page.getByRole('button', { name: '+ Ajouter' }).click()
  await page.getByPlaceholder('Ex : Salon').fill('Salon')
  await page.getByPlaceholder('Ex : Livres + déco').fill('Livres, bougies et cadres photo')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(page.getByText('Livres, bougies et cadres photo').filter({ visible: true })).toBeVisible()
  await expect(page.getByText('0 / 1 faits').filter({ visible: true })).toBeVisible()
  await page.getByText('Livres, bougies et cadres photo').filter({ visible: true }).click()
  await expect(page.getByText('1 / 1 faits').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '05-cartons')

  // Budget
  await allerSur(page, 'Budget')
  await page.getByRole('button', { name: '+ Ajouter une dépense' }).click()
  await page.getByPlaceholder('Ex : Location camion').fill('Location camion 20 m³')
  await page.getByLabel('Payé par').selectOption({ label: 'Alice' })
  await page.getByLabel('Montant prévu (€)').fill('150')
  await page.getByLabel('Montant réel (€)').fill('180')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Location camion 20 m³' })).toBeVisible()
  await expect(page.getByText('180 € / 150 € prévus').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '06-budget')

  // Démarches : checklist type
  await allerSur(page, 'Démarches')
  await page.getByRole('button', { name: '+ Checklist type' }).click()
  await expect(page.getByText('Redirection du courrier (La Poste)').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '07-demarches')

  // Meubles : le volume est calculé
  await allerSur(page, 'Meubles')
  await page.getByRole('button', { name: '+ Ajouter un meuble' }).click()
  await page.getByPlaceholder('Ex : Canapé 3 places').fill('Canapé 3 places')
  await page.getByPlaceholder('Long.').fill('200')
  await page.getByPlaceholder('Larg.').fill('90')
  await page.getByPlaceholder('Haut.').fill('85')
  await expect(page.getByText('1.53 m³').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '08-meubles-formulaire')
  await page.getByRole('button', { name: 'Ajouter à la liste' }).click()
  await expect(page.getByText('Canapé 3 places').filter({ visible: true })).toBeVisible()
  await expect(page.getByText('≈ 1.5 m³').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '09-meubles')

  // Menu « Plus » (mobile uniquement)
  if (testInfo.project.use.isMobile) {
    await page.getByRole('navigation').getByRole('button', { name: 'Plus' }).click()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Paramètres' })).toBeVisible()
    await verifierAffichage(page, testInfo, '10-menu-plus')
    await page.getByRole('navigation').getByRole('button', { name: 'Fermer' }).click()
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Paramètres' })).toBeHidden()
  }

  // Paramètres
  await allerSur(page, 'Paramètres')
  await page.getByRole('button', { name: '+ Ajouter une personne' }).click()
  await page.getByPlaceholder('Ex : colocataire, parent qui aide...').fill('Papa')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(page.getByText('Papa').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '11-parametres')

  // L'aperçu reflète tout ce qui a été saisi
  await allerSur(page, 'Aperçu')
  await expect(page.getByText('Résilier la box internet').filter({ visible: true })).toBeVisible()
  await verifierAffichage(page, testInfo, '12-apercu')

  // Les données sont toujours là après rechargement
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
  await expect(page.getByText('Résilier la box internet').filter({ visible: true })).toBeVisible()

  // On peut se déconnecter, y compris sur mobile
  await allerSur(page, 'Paramètres')
  await page.locator('.main').getByRole('button', { name: 'Se déconnecter' }).click()
  await expect(page.getByRole('button', { name: 'Recevoir le lien de connexion' })).toBeVisible()
})

test('une deuxième personne rejoint le foyer avec le code et voit les données en direct', async ({
  page,
  browser,
}, testInfo) => {
  await seConnecter(page, emailUnique('alice'))
  await creerFoyer(page, 'Alice')
  await allerSur(page, 'Paramètres')
  const code = (await page.getByTestId('code-foyer').textContent()).trim()
  expect(code).toMatch(/^[0-9a-f]{8}$/)

  const contexte = await browser.newContext({ ...testInfo.project.use, baseURL: testInfo.project.use.baseURL })
  const page2 = await contexte.newPage()
  await seConnecter(page2, emailUnique('bea'))
  await page2.getByRole('button', { name: 'Rejoindre' }).click()
  await page2.getByPlaceholder('Ton prénom').fill('Béa')
  await page2.getByPlaceholder('Code du foyer (ex: 8f3a1c2b)').fill(code)
  await page2.getByRole('button', { name: 'Rejoindre' }).last().click()
  await expect(page2.getByRole('heading', { name: 'Aperçu' })).toBeVisible()

  // Béa apparaît chez Alice sans rechargement
  await expect(page.getByText('Béa').filter({ visible: true })).toBeVisible()

  // Ce qu'Alice ajoute apparaît chez Béa en direct
  await allerSur(page, 'Cartons')
  await page.getByRole('button', { name: '+ Ajouter' }).click()
  await page.getByPlaceholder('Ex : Salon').fill('Cuisine')
  await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await allerSur(page2, 'Cartons')
  await expect(page2.getByRole('heading', { name: 'Cuisine' })).toBeVisible()

  await contexte.close()
})

test('un code de foyer inconnu affiche une erreur', async ({ page }) => {
  await seConnecter(page, emailUnique('intrus'))
  await page.getByRole('button', { name: 'Rejoindre' }).click()
  await page.getByPlaceholder('Ton prénom').fill('Intrus')
  await page.getByPlaceholder('Code du foyer (ex: 8f3a1c2b)').fill('00000000')
  await page.getByRole('button', { name: 'Rejoindre' }).last().click()
  await expect(page.getByText('Code introuvable').filter({ visible: true })).toBeVisible()
})

test('chaque écran a son adresse : rechargement, lien direct et bouton retour', async ({ page }) => {
  await seConnecter(page, emailUnique('alice'))
  await creerFoyer(page, 'Alice')
  await expect(page).toHaveURL(/\/$/)

  await allerSur(page, 'Budget')
  await expect(page).toHaveURL(/\/budget$/)
  await allerSur(page, 'Meubles')
  await expect(page).toHaveURL(/\/meubles$/)

  // Le rechargement garde l'écran
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Meubles' })).toBeVisible()

  // Le bouton retour revient à l'écran précédent
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1, name: 'Budget' })).toBeVisible()

  // Lien direct, et adresse inconnue → Aperçu
  await page.goto('/demarches')
  await expect(page.getByRole('heading', { level: 1, name: 'Démarches' })).toBeVisible()
  await page.goto('/nimporte-quoi')
  await expect(page.getByRole('heading', { level: 1, name: 'Aperçu' })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
})

test("la documentation se consulte sans compte, depuis la page de connexion", async ({ page }, testInfo) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Comment ça marche ?' }).click()
  await expect(page).toHaveURL(/\/aide$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Premiers pas' })).toBeVisible()
  await verifierAffichage(page, testInfo, '20-aide-guide')

  // Le sommaire mène à la bonne section
  await page.getByRole('link', { name: 'Questions fréquentes' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Questions fréquentes' })).toBeInViewport()

  await page.getByRole('link', { name: 'Documentation technique' }).click()
  await expect(page).toHaveURL(/\/aide\/technique$/)
  await expect(page.getByRole('heading', { level: 2, name: "Comment l'appli est découpée" })).toBeVisible()
  await verifierAffichage(page, testInfo, '21-aide-technique')

  await page.getByRole('link', { name: "← Retour à l'appli" }).click()
  await expect(page.getByRole('button', { name: 'Recevoir le lien de connexion' })).toBeVisible()
})

test("la documentation est dans la navigation une fois connecté", async ({ page }, testInfo) => {
  await seConnecter(page, emailUnique('alice'))
  await creerFoyer(page, 'Alice')
  await allerSur(page, 'Aide')
  await expect(page.getByRole('heading', { level: 2, name: 'Premiers pas' })).toBeVisible()
  await page.getByRole('link', { name: 'Documentation technique' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Données (Firestore)' })).toBeVisible()
  // L'onglet Aide reste actif sur la sous-page
  if (testInfo.project.use.isMobile) {
    await expect(page.getByRole('navigation').getByRole('button', { name: 'Plus' })).toHaveClass(/active/)
  } else {
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Aide' })).toHaveClass(/active/)
  }
  await verifierAffichage(page, testInfo, '22-aide-connecte')
})
