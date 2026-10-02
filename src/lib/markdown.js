import { Marked } from 'marked'

// 'Créer le foyer (première personne)' → 'creer-le-foyer-premiere-personne'
export function ancre(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Convertit la documentation (docs/*.md, contenu du dépôt donc de confiance) en HTML.
// Les titres reçoivent une ancre ; le sommaire liste les titres de niveau 2.
export function rendreDoc(source) {
  const sommaire = []
  const marked = new Marked({
    renderer: {
      heading(html, niveau, texte) {
        const id = ancre(texte)
        if (niveau === 2) sommaire.push({ id, titre: texte })
        return `<h${niveau} id="${id}">${html}</h${niveau}>\n`
      },
    },
  })
  // Le titre principal (# ...) est affiché par l'écran lui-même
  const html = marked.parse(source.replace(/^# .*\n/, ''))
  return { html, sommaire }
}
