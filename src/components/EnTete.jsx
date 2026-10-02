// Titre et sous-titre en haut de chaque écran
export default function EnTete({ titre, children }) {
  return (
    <div className="top">
      <h1>{titre}</h1>
      {children && <p>{children}</p>}
    </div>
  )
}
