import * as cartons from './cartons'
import * as demarches from './demarches'
import * as depenses from './depenses'
import * as meubles from './meubles'
import * as taches from './taches'

// Collections de données rangées sous foyers/{foyerId}/…
// Toute collection ajoutée ici doit aussi être autorisée dans firestore.rules
// (un test le vérifie : src/models/models.test.js).
export const COLLECTIONS_FOYER = [taches, cartons, depenses, demarches, meubles].map((m) => m.COLLECTION)
