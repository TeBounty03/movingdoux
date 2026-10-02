// Accès direct aux émulateurs Firebase pour préparer les données des captures.
// Le jeton « owner » de l'émulateur Firestore ignore les règles de sécurité : à n'utiliser qu'ici.

const PROJET = 'demo-movingdoux'
const FIRESTORE = `http://127.0.0.1:8181/v1/projects/${PROJET}/databases/(default)/documents`
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }

// Valeur JS → valeur typée de l'API REST Firestore
function valeur(v) {
  if (v === null || v === undefined) return { nullValue: null }
  if (v instanceof Date) return { timestampValue: v.toISOString() }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(valeur) } }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  if (typeof v === 'object') return { mapValue: { fields: champs(v) } }
  return { stringValue: String(v) }
}
const champs = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, valeur(v)]))

// Valeur typée → JS (lecture)
function lire(v) {
  if ('stringValue' in v) return v.stringValue
  if ('integerValue' in v) return Number(v.integerValue)
  if ('doubleValue' in v) return v.doubleValue
  if ('booleanValue' in v) return v.booleanValue
  if ('nullValue' in v) return null
  if ('timestampValue' in v) return new Date(v.timestampValue)
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(lire)
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, lire(x)]))
  return undefined
}

async function verifier(res, action) {
  if (!res.ok) throw new Error(`${action} : ${res.status} ${await res.text()}`)
  return res
}

export async function viderEmulateurs() {
  await verifier(await fetch(`http://127.0.0.1:8181/emulator/v1/projects/${PROJET}/databases/(default)/documents`, { method: 'DELETE' }), 'vider Firestore')
  await verifier(await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJET}/accounts`, { method: 'DELETE' }), 'vider Auth')
}

// Écrit (ou remplace) un document ; `chemin` relatif à la racine, ex. 'foyers/abc/taches/t1'
export async function ecrire(chemin, donnees) {
  await verifier(
    await fetch(`${FIRESTORE}/${chemin}`, { method: 'PATCH', headers: OWNER, body: JSON.stringify({ fields: champs(donnees) }) }),
    `écrire ${chemin}`
  )
}

export async function lister(collection) {
  const res = await verifier(await fetch(`${FIRESTORE}/${collection}`, { headers: OWNER }), `lister ${collection}`)
  const { documents = [] } = await res.json()
  return documents.map((d) => ({ id: d.name.split('/').at(-1), ...lire({ mapValue: { fields: d.fields } }) }))
}
