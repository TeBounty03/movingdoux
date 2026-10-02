// Données fictives des captures du guide : un couple (Léa et Sam) qui déménage fin novembre 2026,
// aidé par Mamie Jo (personne sans compte). Modifier ici pour changer ce que montrent les captures.
import { ecrire } from './emulateur.js'

// Les documents sont horodatés juste après la création du foyer, une minute d'écart chacun :
// ordre d'affichage stable, et les membres créés par l'interface (Léa, Sam) restent en premier
let horloge = 0
const ensuite = () => new Date((horloge += 60_000))

export async function remplirFoyer(foyerId, { lea, sam }) {
  horloge = Date.now()
  const ajouter = (collection, id, doc) => ecrire(`foyers/${foyerId}/${collection}/${id}`, { ...doc, created_at: ensuite() })

  await ajouter('membres', 'mamie', { user_id: null, prenom: 'Mamie Jo', couleur: '#7A8F6E' })

  // Tâches : un peu de chaque phase, une sous-tâche, des échéances proches pour l'Aperçu
  const taches = [
    ['t1', { titre: 'Réserver le camion de location', phase: 'avant', assigne_id: sam, echeance: '2026-10-20', statut: 'fait' }],
    ['t2', { titre: 'Résilier la box internet', phase: 'avant', assigne_id: lea, echeance: '2026-10-24', statut: 'a_faire' }],
    ['t3', { titre: 'Retrouver le numéro client', phase: 'avant', parent_tache_id: 't2', statut: 'fait' }],
    ['t4', { titre: 'Demander des cartons au supermarché', phase: 'avant', assigne_id: 'mamie', echeance: '2026-10-27', statut: 'a_faire' }],
    ['t5', { titre: 'Trier les vêtements', phase: 'avant', assigne_id: lea, statut: 'a_faire' }],
    ['t6', { titre: 'Relever les compteurs', phase: 'pendant', assigne_id: sam, echeance: '2026-11-28', statut: 'a_faire' }],
    ['t7', { titre: 'Monter le lit en premier', phase: 'pendant', statut: 'a_faire' }],
    ['t8', { titre: 'Pendre la crémaillère', phase: 'apres', statut: 'a_faire' }],
  ]
  for (const [id, t] of taches) {
    await ajouter('taches', id, { assigne_id: null, echeance: null, parent_tache_id: null, ...t })
  }

  const cartons = [
    ['Salon', 'Livres et BD', 'fait'],
    ['Salon', 'Déco, cadres photo', 'fait'],
    ['Cuisine', 'Vaisselle fragile', 'fait'],
    ['Salon', 'Câbles, console', 'a_faire'],
    ['Cuisine', 'Casseroles', 'a_faire'],
    ['Chambre', 'Linge de lit', 'a_faire'],
    ['Bureau', 'Papiers importants', 'a_faire'],
  ]
  for (const [i, [piece, description, statut]] of cartons.entries()) {
    await ajouter('cartons', `c${i + 1}`, { numero: i + 1, piece, description, statut })
  }

  const depenses = [
    ['Location camion 20 m³', sam, 150, 180],
    ['Cartons et scotch', lea, 40, 32],
    ['Pizzas pour les amis qui aident', lea, 60, 74],
    ['Ménage de fin de bail', null, 120, null],
  ]
  for (const [i, [categorie, paye_par_id, montant_prevu, montant_reel]] of depenses.entries()) {
    await ajouter('depenses', `d${i + 1}`, { categorie, paye_par_id, montant_prevu, montant_reel, date: '2026-10-15' })
  }

  const demarches = [
    ['Internet / box', 'Résiliation / souscription', 'en_cours', null],
    ['Électricité — gaz', 'Résiliation / souscription', 'fait', null],
    ['Assurance habitation', 'Résiliation / souscription', 'a_faire', '2026-11-25'],
    ['Redirection du courrier (La Poste)', 'Changement d’adresse', 'a_faire', '2026-11-20'],
    ['Impôts', 'Changement d’adresse', 'a_faire', null],
    ['Banque', 'Changement d’adresse', 'fait', null],
    ['État des lieux sortant', 'Logement', 'a_faire', '2026-11-30'],
  ]
  for (const [i, [titre, categorie, statut, echeance]] of demarches.entries()) {
    await ajouter('demarches', `m${i + 1}`, { titre, categorie, organisme: null, echeance, statut })
  }

  const meubles = [
    ['Canapé 3 places', null, 210, 90, 85, 'Salon', 'on_garde'],
    ['Bibliothèque', lea, 80, 30, 200, 'Salon', 'on_garde'],
    ['Lit 160', null, 200, 160, 50, 'Chambre', 'on_garde'],
    ['Bureau', sam, 120, 60, 75, 'Bureau', 'on_garde'],
    ['Vieux fauteuil', sam, 80, 80, 95, null, 'a_vendre'],
    ['Table basse', null, 100, 60, 45, 'Salon', 'a_acheter'],
  ]
  for (const [i, [nom, proprietaire_id, longueur_cm, largeur_cm, hauteur_cm, piece_destination, statut]] of meubles.entries()) {
    await ajouter('meubles', `f${i + 1}`, {
      nom, proprietaire_id, longueur_cm, largeur_cm, hauteur_cm, piece_destination, statut,
      volume_m3: (longueur_cm * largeur_cm * hauteur_cm) / 1_000_000,
    })
  }
}
