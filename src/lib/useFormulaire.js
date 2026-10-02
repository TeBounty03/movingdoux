import { useState } from 'react'

// État d'un formulaire d'ajout repliable (voir components/Formulaire.jsx) :
// ouvert/fermé + valeurs des champs.
export function useFormulaire(valeursVides) {
  const [ouvert, setOuvert] = useState(false)
  const [valeurs, setValeurs] = useState(valeursVides)

  const set = (nom, valeur) => setValeurs((v) => ({ ...v, [nom]: valeur }))

  return {
    ouvert,
    valeurs,
    set,
    // Props à étaler sur un <input> ou <select> : value + onChange
    champ: (nom) => ({ value: valeurs[nom], onChange: (e) => set(nom, e.target.value) }),
    basculer: () => setOuvert((o) => !o),
    fermer: () => setOuvert(false),
    reinitialiser: () => setValeurs(valeursVides),
  }
}
