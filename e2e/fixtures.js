import { test as base, expect } from '@playwright/test'

// Toute erreur JavaScript ou console.error dans la page fait échouer le test,
// même si l'écran a l'air correct.
export const test = base.extend({
  page: async ({ page }, fournir) => {
    const erreurs = []
    page.on('pageerror', (e) => erreurs.push(`erreur : ${e.message}`))
    page.on('console', (m) => {
      if (m.type() !== 'error') return
      // Le canal temps réel de Firestore est parfois refusé quand sa session expire ;
      // le SDK le rouvre aussitôt tout seul. Ce n'est pas une erreur de l'appli.
      if (m.location().url.includes('/google.firestore.v1.Firestore/Listen/channel')) return
      erreurs.push(`console.error : ${m.text()}`)
    })
    page.erreursConsole = erreurs
    await fournir(page)
    expect(erreurs, 'erreurs dans la console du navigateur').toEqual([])
  },
})

export { expect }
