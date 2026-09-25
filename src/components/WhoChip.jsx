export default function WhoChip({ membre }) {
  if (!membre) {
    return (
      <span className="who" style={{ background: '#B9AF97' }} title="Non assigné">
        ?
      </span>
    )
  }
  return (
    <span className="who" style={{ background: membre.couleur }} title={membre.prenom}>
      {membre.prenom.charAt(0).toUpperCase()}
    </span>
  )
}
