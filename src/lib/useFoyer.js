import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const OWNER_PALETTE = ['#5C7F8C', '#B98A5A', '#7A8F6E', '#A35C6E', '#8A79A8', '#C9973F']

export function useFoyer(user) {
  const [loading, setLoading] = useState(true)
  const [foyer, setFoyer] = useState(null)
  const [membre, setMembre] = useState(null) // le membre correspondant à l'utilisateur connecté
  const [membres, setMembres] = useState([]) // tous les membres du foyer

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)

    const { data: mine } = await supabase
      .from('membres')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!mine) {
      setMembre(null)
      setFoyer(null)
      setMembres([])
      setLoading(false)
      return
    }

    setMembre(mine)

    const [{ data: foyerData }, { data: membresData }] = await Promise.all([
      supabase.from('foyers').select('*').eq('id', mine.foyer_id).single(),
      supabase.from('membres').select('*').eq('foyer_id', mine.foyer_id).order('created_at'),
    ])

    setFoyer(foyerData ?? null)
    setMembres(membresData ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  // Crée un nouveau foyer et y rattache l'utilisateur courant comme premier membre
  async function createFoyer(prenom) {
    const { data: newFoyer, error: foyerError } = await supabase
      .from('foyers')
      .insert({ nom: 'Notre déménagement' })
      .select()
      .single()
    if (foyerError) return { error: foyerError }

    const { error: membreError } = await supabase.from('membres').insert({
      foyer_id: newFoyer.id,
      user_id: user.id,
      prenom,
      couleur: OWNER_PALETTE[0],
    })
    if (membreError) return { error: membreError }

    await load()
    return { error: null }
  }

  // Rejoint un foyer existant via son code d'invitation (voir écran Paramètres)
  async function joinFoyer(code, prenom) {
    const { data: foyerId, error: rpcError } = await supabase.rpc('foyer_id_from_code', {
      p_code: code.trim(),
    })
    if (rpcError || !foyerId) return { error: rpcError ?? new Error('Code introuvable') }

    const { error: membreError } = await supabase.from('membres').insert({
      foyer_id: foyerId,
      user_id: user.id,
      prenom,
      couleur: OWNER_PALETTE[Math.floor(Math.random() * OWNER_PALETTE.length)],
    })
    if (membreError) return { error: membreError }

    await load()
    return { error: null }
  }

  // Ajoute une personne "label" (sans compte) pour pouvoir lui assigner des choses
  async function addMembreLabel(prenom, couleur) {
    if (!foyer) return { error: new Error('Pas de foyer') }
    const { error } = await supabase.from('membres').insert({
      foyer_id: foyer.id,
      prenom,
      couleur,
    })
    if (!error) await load()
    return { error }
  }

  async function removeMembre(id) {
    const { error } = await supabase.from('membres').delete().eq('id', id)
    if (!error) await load()
    return { error }
  }

  async function setAccentColor(couleur) {
    if (!foyer) return
    await supabase.from('foyers').update({ couleur_accent: couleur }).eq('id', foyer.id)
    setFoyer((f) => ({ ...f, couleur_accent: couleur }))
  }

  return {
    loading,
    foyer,
    membre,
    membres,
    createFoyer,
    joinFoyer,
    addMembreLabel,
    removeMembre,
    setAccentColor,
    palette: OWNER_PALETTE,
    refresh: load,
  }
}
