// Mise en forme partagée par tous les écrans

// '2026-11-15' → '15 nov.' ; rien si pas de date
export function formatDate(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// 179.6 → '180 €'
export function formatEuros(montant) {
  return `${Number(montant || 0).toFixed(0)} €`
}

// Date du jour au format des champs <input type="date"> : '2026-10-02'
export function aujourdhui(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

// Champ texte facultatif : '  ' → null, ' Salon ' → 'Salon'
export function texteOuNull(valeur) {
  const t = (valeur ?? '').trim()
  return t || null
}
