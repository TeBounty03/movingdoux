// Pastilles numérotées posées sur les captures : un cadre bleu autour de l'élément et son numéro
// dans un rond, repris dans les étapes du guide (« 1. … », « 2. … »).

const BLEU = '#2463EB'

export async function annoter(page, reperes) {
  // Pas de contour de focus sur les captures
  await page.evaluate(() => document.activeElement?.blur())
  const boites = []
  for (const [i, locator] of reperes.entries()) {
    const boite = await locator.first().boundingBox({ timeout: 5000 })
    if (!boite) throw new Error(`repère ${i + 1} introuvable ou invisible : ${locator}`)
    boites.push(boite)
  }
  await page.evaluate(
    ({ boites, bleu }) => {
      document.querySelectorAll('[data-annotation]').forEach((n) => n.remove())
      const largeur = document.documentElement.clientWidth
      boites.forEach((b, i) => {
        const cadre = document.createElement('div')
        cadre.dataset.annotation = ''
        Object.assign(cadre.style, {
          position: 'fixed', left: `${b.x - 4}px`, top: `${b.y - 4}px`, width: `${b.width + 8}px`, height: `${b.height + 8}px`,
          border: `2.5px solid ${bleu}`, borderRadius: '12px', zIndex: 1000, pointerEvents: 'none', boxSizing: 'border-box',
        })
        // Où poser le numéro sans cacher l'élément :
        // - petit élément (case, initiale, montant) : au-dessus ;
        // - élément avec de la marge à sa gauche (ligne, champ, bouton dans une carte) : dans cette marge ;
        // - grand bloc collé au bord de l'écran : sur son coin en haut à gauche.
        const petit = b.height < 44 && b.width < 120
        let gauche, haut
        if (petit) {
          gauche = b.x + b.width / 2 - 13
          haut = b.y - 34
        } else if (b.x >= 30) {
          gauche = b.x - 31
          haut = b.y + Math.min(b.height / 2, 22) - 13
        } else {
          gauche = b.x - 13
          haut = b.y - 13
        }
        gauche = Math.min(Math.max(gauche, 2), largeur - 30)
        haut = Math.max(haut, 4)
        const rond = document.createElement('div')
        rond.dataset.annotation = ''
        rond.textContent = String(i + 1)
        Object.assign(rond.style, {
          position: 'fixed', left: `${gauche}px`, top: `${haut}px`,
          width: '26px', height: '26px', borderRadius: '50%', background: bleu, color: '#fff', zIndex: 1001,
          font: '700 13px/26px "IBM Plex Sans", sans-serif', textAlign: 'center', boxShadow: '0 0 0 2.5px #fff',
          pointerEvents: 'none',
        })
        document.body.append(cadre, rond)
      })
    },
    { boites, bleu: BLEU }
  )
}

export async function effacerAnnotations(page) {
  await page.evaluate(() => document.querySelectorAll('[data-annotation]').forEach((n) => n.remove()))
}
