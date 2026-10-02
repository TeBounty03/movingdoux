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
// `images` associe un chemin relatif à docs/ (« images/budget.jpg ») à son adresse une fois l'appli construite.
export function rendreDoc(source, images = {}) {
  const sommaire = []
  const marked = new Marked({
    renderer: {
      heading(html, niveau, texte) {
        const id = ancre(texte)
        if (niveau === 2) sommaire.push({ id, titre: texte })
        return `<h${niveau} id="${id}">${html}</h${niveau}>\n`
      },
      // Captures (images/) à la taille d'un téléphone, schémas (schemas/) un peu plus larges
      image(href, _titre, texte) {
        const classe = href.startsWith('schemas/') ? 'doc-schema' : 'doc-capture'
        return `<img class="${classe}" src="${images[href] ?? href}" alt="${texte}" loading="lazy">`
      },
    },
  })
  // Le titre principal (# ...) est affiché par l'écran lui-même
  const html = marked.parse(source.replace(/^# .*\n/, ''))
  return { html, sommaire }
}
