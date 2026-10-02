import { expect } from '@playwright/test'

const AUTH_EMULATOR = 'http://127.0.0.1:9099/emulator/v1/projects/demo-movingdoux'

export function emailUnique(prefixe) {
  return `${prefixe}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@exemple.fr`
}

// Connexion par lien magique : l'émulateur n'envoie pas d'e-mail,
// on récupère le lien qu'il a généré et on l'ouvre comme si on cliquait dessus.
export async function seConnecter(page, email) {
  await page.goto('/')
  await page.getByPlaceholder('ton@email.fr').fill(email)
  await page.getByRole('button', { name: 'Recevoir le lien de connexion' }).click()
  await expect(page.getByText('Regarde ta boîte mail')).toBeVisible()

  const res = await page.request.get(`${AUTH_EMULATOR}/oobCodes`)
  const { oobCodes } = await res.json()
  const code = oobCodes.filter((c) => c.email === email && c.requestType === 'EMAIL_SIGNIN').at(-1)
  expect(code, `lien de connexion pour ${email}`).toBeTruthy()
  await page.goto(code.oobLink)
}

export async function creerFoyer(page, prenom) {
  await page.getByPlaceholder('Ton prénom').fill(prenom)
  await page.getByRole('button', { name: 'Créer le foyer' }).click()
  await expect(page.getByRole('heading', { name: 'Aperçu' })).toBeVisible()
}

export async function allerSur(page, ecran) {
  const nav = page.getByRole('navigation')
  const lien = nav.getByRole('link', { name: ecran, exact: true })
  // Sur mobile, certains écrans sont dans le menu « Plus »
  if (!(await lien.isVisible())) await nav.getByRole('button', { name: 'Plus' }).click()
  await lien.click()
  await expect(page.getByRole('heading', { level: 1, name: ecran })).toBeVisible()
}

// Vérifications d'affichage communes à tous les écrans
export async function verifierAffichage(page, testInfo, nom) {
  const mesure = await page.evaluate(() => {
    const largeur = document.documentElement.clientWidth
    const fautifs = [...document.querySelectorAll('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && (r.right > largeur + 1 || r.left < -1)
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className}`)
    return { largeurPage: document.documentElement.scrollWidth, largeur, fautifs }
  })
  expect.soft(mesure.largeurPage, `défilement horizontal sur « ${nom} » : ${JSON.stringify(mesure)}`).toBeLessThanOrEqual(
    mesure.largeur
  )

  // Rien ne doit dépasser de sa carte (bouton, champ, texte)
  const debordements = await page.evaluate(() =>
    [...document.querySelectorAll('.card, .room-card, .login-box, .balance-card, .vol-summary, .stat')].flatMap((carte) => {
      const c = carte.getBoundingClientRect()
      // Le contenu d'une zone qui défile (bloc de code de la doc...) a le droit d'être plus large qu'elle
      const dansZoneDefilante = (el) => {
        for (let p = el.parentElement; p && p !== carte; p = p.parentElement) {
          if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX)) return true
        }
        return false
      }
      return [...carte.querySelectorAll('*')]
        .filter((el) => el.offsetParent !== null && getComputedStyle(el).position !== 'fixed')
        .filter((el) => !dansZoneDefilante(el))
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1)
        })
        .map((el) => `${el.tagName.toLowerCase()}.${el.className} dans .${carte.className.split(' ')[0]}`)
    })
  )
  expect.soft(debordements, `éléments qui débordent de leur carte (« ${nom} »)`).toEqual([])

  // Aucune cellule de tableau écrasée au point d'afficher le texte lettre par lettre
  const cellulesEcrasees = await page.evaluate(() =>
    [...document.querySelectorAll('td, th')]
      .filter((c) => {
        if (c.offsetParent === null || c.textContent.trim().length <= 3) return false
        const { width, height } = c.getBoundingClientRect()
        const ligne = parseFloat(getComputedStyle(c).lineHeight) || 20
        // étroite ET sur plus de 3 lignes : le texte se casse à chaque lettre
        return width < 60 && height > ligne * 3.5
      })
      .map((c) => c.textContent.trim().slice(0, 30))
  )
  expect.soft(cellulesEcrasees, `cellules de tableau trop étroites (« ${nom} »)`).toEqual([])

  // Chaque bouton de la navigation doit être entièrement à l'écran
  const nav = page.getByRole('navigation')
  if (await nav.count()) {
    const coupes = await nav.evaluate((el) =>
      [...el.querySelectorAll('a, button')]
        .filter((b) => b.offsetParent !== null)
        .filter((b) => {
          const r = b.getBoundingClientRect()
          return r.left < 0 || r.right > window.innerWidth || r.bottom > window.innerHeight
        })
        .map((b) => b.textContent)
    )
    expect.soft(coupes, `boutons de navigation coupés (« ${nom} »)`).toEqual([])
  }

  if (testInfo.project.use.isMobile) {
    // En dessous de 16 px, iOS zoome automatiquement quand on touche un champ
    const petitsChamps = await page.evaluate(() =>
      [...document.querySelectorAll('input, select, textarea')]
        .filter((el) => el.offsetParent !== null && parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => el.placeholder || el.name || el.tagName)
    )
    expect.soft(petitsChamps, `champs trop petits sur mobile (« ${nom} »)`).toEqual([])
  }

  await page.screenshot({ path: testInfo.outputPath(`${nom}.png`), fullPage: true })
}
