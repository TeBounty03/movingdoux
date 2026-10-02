// Intégration des notifications push (OneSignal) — désactivée par défaut.
//
// Pour l'activer :
// 1. Crée un compte gratuit sur https://onesignal.com et une "Web Push App"
// 2. Récupère ton App ID et mets-le dans .env : VITE_ONESIGNAL_APP_ID=...
// 3. Ajoute le script OneSignal dans index.html (voir la doc OneSignal
//    "Web Push Setup" — quelques lignes de <script> à coller dans le <head>)
// 4. Appelle initPushNotifications() une fois dans App.jsx, après la
//    connexion (par exemple dans un useEffect qui dépend de `user`)
// 5. Crée une tâche planifiée (cron quotidien, par exemple une GitHub Action
//    avec firebase-admin comme dans activitiesdoux) qui interroge les
//    collections taches/demarches pour les échéances proches et appelle
//    l'API OneSignal — voir src/lib/useFoyer.js pour le modèle de données.

export function isPushConfigured() {
  return Boolean(import.meta.env.VITE_ONESIGNAL_APP_ID)
}

export async function initPushNotifications() {
  if (!isPushConfigured()) {
    // eslint-disable-next-line no-console
    console.info('OneSignal non configuré — VITE_ONESIGNAL_APP_ID est vide (voir README).')
    return
  }

  // Une fois le SDK OneSignal chargé (via le script dans index.html),
  // window.OneSignal est disponible. Exemple d'initialisation :
  //
  // window.OneSignalDeferred = window.OneSignalDeferred || []
  // window.OneSignalDeferred.push(async (OneSignal) => {
  //   await OneSignal.init({ appId: import.meta.env.VITE_ONESIGNAL_APP_ID })
  //   await OneSignal.Notifications.requestPermission()
  // })
}
