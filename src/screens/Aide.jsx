import { useMemo } from 'react'
import { NavLink, useLocation } from 'react-router'
import docTechnique from '../../docs/documentation-technique.md?raw'
import guide from '../../docs/guide-utilisation.md?raw'
import EnTete from '../components/EnTete'
import { rendreDoc } from '../lib/markdown'
import './Aide.css'

// Les deux documents vivent dans docs/ (lisibles aussi sur GitHub) : l'écran les affiche tels quels.
// Captures et schémas de docs/ : Vite leur donne leur adresse définitive au build
const IMAGES = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../docs/{images,schemas}/*.{jpg,png}', { eager: true, query: '?url', import: 'default' })
  ).map(([chemin, url]) => [chemin.replace('../../docs/', ''), url])
)

const DOCS = [
  { chemin: '/aide', titre: "Guide d'utilisation", resume: 'Comment utiliser Moving Doux, écran par écran', source: guide },
  { chemin: '/aide/technique', titre: 'Documentation technique', resume: "Comment l'appli est construite, pour la modifier", source: docTechnique },
]

// Accessible connecté (écran « Aide ») ou non (lien depuis la page de connexion)
export default function Aide() {
  const { pathname } = useLocation()
  const doc = DOCS.find((d) => d.chemin === pathname) ?? DOCS[0]
  const { html, sommaire } = useMemo(() => rendreDoc(doc.source, IMAGES), [doc])

  return (
    <div className="aide">
      <EnTete titre="Aide">{doc.resume}</EnTete>

      <div className="aide-onglets" role="group" aria-label="Documents">
        {DOCS.map((d) => (
          <NavLink key={d.chemin} to={d.chemin} end className={({ isActive }) => (isActive ? 'active' : '')}>
            {d.titre}
          </NavLink>
        ))}
      </div>

      <div className="card aide-sommaire">
        <h3>Sommaire</h3>
        <ol>
          {sommaire.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.titre}</a>
            </li>
          ))}
        </ol>
      </div>

      {/* eslint-disable-next-line react/no-danger -- contenu de docs/, versionné avec le code */}
      <article className="card doc" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
