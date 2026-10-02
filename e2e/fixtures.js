import { test as base, expect } from '@playwright/test'

// Toute erreur JavaScript ou console.error dans la page fait échouer le test,
// même si l'écran a l'air correct.
export const test = base.extend({
  page: async ({ page }, fournir) => {
    const erreurs = []
    page.on('pageerror', (e) => erreurs.push(`erreur : ${e.message}`))
    page.on('console', (m) => {
      if (m.type() === 'error') erreurs.push(`console.error : ${m.text()}`)
    })
    page.erreursConsole = erreurs
    await fournir(page)
    expect(erreurs, 'erreurs dans la console du navigateur').toEqual([])
  },
})

export { expect }
