import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { formatDate, formatEuros, texteOuNull } from '../lib/format'
import { grouperParPiece, nouveauCarton, numeroAffiche } from './cartons'
import { CHECKLIST_TYPE, grouperParCategorie, manquantesDeLaChecklist, nouvelleDemarche, statutSuivant } from './demarches'
import { nouvelleDepense, soldes, totaux } from './depenses'
import { prochainesEcheances } from './echeances'
import { COLLECTIONS_FOYER } from './index'
import { filtrerParProprietaire, nouveauMeuble, volumeConseille, volumeGarde, volumeM3 } from './meubles'
import { basculerFait, compterFaits } from './statuts'
import { nouvelleTache, sousTaches, tachesPrincipales } from './taches'

vi.mock('../lib/data', async () => (await import('../test/fakeData')).dataMock)

describe('collections', () => {
  it('chaque collection du foyer est autorisée par firestore.rules', () => {
    const regles = readFileSync('firestore.rules', 'utf8')
    const autorisees = regles.match(/collection in \[([^\]]+)\]/)[1].match(/'([^']+)'/g).map((c) => c.slice(1, -1))
    expect([...autorisees].sort()).toEqual([...COLLECTIONS_FOYER].sort())
  })
})

describe('format', () => {
  it('met en forme dates, montants et textes facultatifs', () => {
    expect(formatDate('2026-11-15')).toBe('15 nov.')
    expect(formatDate(null)).toBeNull()
    expect(formatEuros(179.6)).toBe('180 €')
    expect(formatEuros(undefined)).toBe('0 €')
    expect(texteOuNull('  ')).toBeNull()
    expect(texteOuNull(' Salon ')).toBe('Salon')
  })
})

describe('statuts', () => {
  it('bascule et compte', () => {
    expect(basculerFait('fait')).toBe('a_faire')
    expect(basculerFait('a_faire')).toBe('fait')
    expect(basculerFait('en_cours')).toBe('fait')
    expect(compterFaits([{ statut: 'fait' }, { statut: 'a_faire' }, { statut: 'fait' }])).toBe(2)
  })
})

describe('tâches', () => {
  it('crée une tâche propre ou refuse sans titre', () => {
    expect(nouvelleTache({ titre: '  ', phase: 'avant' })).toBeNull()
    expect(nouvelleTache({ titre: ' Box ', phase: 'apres', assigne_id: '', echeance: '', parent_tache_id: '' })).toEqual({
      titre: 'Box', phase: 'apres', assigne_id: null, echeance: null, parent_tache_id: null, statut: 'a_faire',
    })
  })

  it('sépare tâches principales et sous-tâches', () => {
    const taches = [
      { id: '1', phase: 'avant' },
      { id: '2', phase: 'avant', parent_tache_id: '1' },
      { id: '3', phase: 'apres' },
    ]
    expect(tachesPrincipales(taches).map((t) => t.id)).toEqual(['1', '3'])
    expect(tachesPrincipales(taches, 'avant').map((t) => t.id)).toEqual(['1'])
    expect(sousTaches(taches, '1').map((t) => t.id)).toEqual(['2'])
  })
})

describe('cartons', () => {
  it('numérote à la suite et refuse sans pièce', () => {
    expect(nouveauCarton({ piece: '', description: 'x' }, [])).toBeNull()
    expect(nouveauCarton({ piece: 'Salon', description: ' Livres ' }, [{}, {}])).toEqual({
      numero: 3, piece: 'Salon', description: 'Livres', statut: 'a_faire',
    })
    expect(numeroAffiche(3)).toBe('03')
  })

  it('regroupe par pièce, « Autre » si non renseignée', () => {
    const groupes = grouperParPiece([{ id: 1, piece: 'Salon' }, { id: 2 }, { id: 3, piece: 'Salon' }])
    expect(Object.keys(groupes)).toEqual(['Salon', 'Autre'])
    expect(groupes.Salon).toHaveLength(2)
  })
})

describe('dépenses', () => {
  const alice = { id: 'a' }
  const bea = { id: 'b' }

  it('convertit les montants saisis et date la dépense', () => {
    expect(nouvelleDepense({ categorie: ' ', montant_reel: '10' })).toBeNull()
    expect(nouvelleDepense({ categorie: 'Camion', paye_par_id: '', montant_prevu: '0', montant_reel: '' }, new Date('2026-10-02T12:00:00Z'))).toEqual({
      categorie: 'Camion', paye_par_id: null, montant_prevu: 0, montant_reel: null, date: '2026-10-02',
    })
  })

  it('calcule totaux et parts égales', () => {
    const depenses = [
      { paye_par_id: 'a', montant_prevu: 100, montant_reel: 90 },
      { paye_par_id: 'b', montant_reel: 30 },
      { paye_par_id: 'parti', montant_reel: 30 },
    ]
    expect(totaux(depenses)).toEqual({ reel: 150, prevu: 100 })
    expect(soldes(depenses, [alice, bea])).toEqual([
      { membre: alice, paye: 90, solde: 15 },
      { membre: bea, paye: 30, solde: -45 },
    ])
    expect(soldes(depenses, [])).toEqual([])
  })
})

describe('démarches', () => {
  it('ne propose que les démarches de la checklist pas encore présentes', () => {
    expect(manquantesDeLaChecklist([])).toHaveLength(CHECKLIST_TYPE.length)
    const manquantes = manquantesDeLaChecklist([{ titre: 'Banque' }, { titre: 'Impôts' }])
    expect(manquantes).toHaveLength(CHECKLIST_TYPE.length - 2)
    expect(manquantes.map((d) => d.titre)).not.toContain('Banque')
    expect(manquantes.every((d) => d.statut === 'a_faire')).toBe(true)
  })

  it('avance à faire → en cours → fait, puis reste fait', () => {
    expect(statutSuivant('a_faire')).toBe('en_cours')
    expect(statutSuivant('en_cours')).toBe('fait')
    expect(statutSuivant('fait')).toBe('fait')
  })

  it('crée une démarche avec ses champs facultatifs', () => {
    expect(nouvelleDemarche({ titre: '' })).toBeNull()
    expect(nouvelleDemarche({ titre: 'Banque', categorie: ' ', organisme: 'BNP', echeance: '' })).toEqual({
      titre: 'Banque', categorie: null, organisme: 'BNP', echeance: null, statut: 'a_faire',
    })
    expect(Object.keys(grouperParCategorie([{ categorie: 'Logement' }, {}]))).toEqual(['Logement', 'Autre'])
  })
})

describe('meubles', () => {
  const meubles = [
    { id: 1, proprietaire_id: 'a', volume_m3: 1.5, statut: 'on_garde' },
    { id: 2, proprietaire_id: 'b', volume_m3: 0.5, statut: 'on_garde' },
    { id: 3, proprietaire_id: 'a', volume_m3: 2, statut: 'a_vendre' },
  ]

  it('calcule les volumes', () => {
    expect(volumeM3(200, 90, 85)).toBeCloseTo(1.53)
    expect(volumeM3('', 90, 85)).toBe(0)
    expect(volumeGarde(meubles)).toBe(2)
    expect(volumeConseille(meubles)).toBeCloseTo(2.56)
  })

  it('filtre par propriétaire', () => {
    expect(filtrerParProprietaire(meubles, 'tous')).toHaveLength(3)
    expect(filtrerParProprietaire(meubles, 'a').map((m) => m.id)).toEqual([1, 3])
  })

  it('crée un meuble avec son volume, ou refuse sans dimensions', () => {
    expect(nouveauMeuble({ nom: 'Lit', longueur_cm: '200', largeur_cm: '', hauteur_cm: '50' })).toBeNull()
    expect(nouveauMeuble({ nom: 'Lit', proprietaire_id: '', longueur_cm: '200', largeur_cm: '160', hauteur_cm: '50', piece_destination: '' })).toEqual({
      nom: 'Lit', proprietaire_id: null, longueur_cm: 200, largeur_cm: 160, hauteur_cm: 50, volume_m3: 1.6, piece_destination: null, statut: 'on_garde',
    })
  })
})

describe('échéances', () => {
  it('trie tâches et démarches non faites par date et rattache la personne assignée', () => {
    const alice = { id: 'a', prenom: 'Alice' }
    const liste = prochainesEcheances(
      [
        { id: 't1', titre: 'T1', statut: 'a_faire', echeance: '2026-11-20', assigne_id: 'a' },
        { id: 't2', titre: 'T2', statut: 'fait', echeance: '2026-10-01' },
        { id: 't3', titre: 'T3', statut: 'a_faire' },
      ],
      [{ id: 'd1', titre: 'D1', statut: 'en_cours', echeance: '2026-11-10' }],
      [alice],
      5
    )
    expect(liste.map((e) => [e.titre, e.collection])).toEqual([['D1', 'demarches'], ['T1', 'taches']])
    expect(liste[1].assigne).toBe(alice)
  })
})
