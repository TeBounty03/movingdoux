import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

// Charge les lignes d'une table pour le foyer courant, et se met à jour
// automatiquement (pour tous les membres connectés) via Supabase Realtime.
export function useSupabaseTable(table, foyerId, orderBy = 'created_at') {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!foyerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('foyer_id', foyerId)
      .order(orderBy, { ascending: true })
    if (!error) setRows(data ?? [])
    setLoading(false)
  }, [table, foyerId, orderBy])

  useEffect(() => {
    load()
    if (!foyerId) return

    const channel = supabase
      .channel(`${table}-${foyerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `foyer_id=eq.${foyerId}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, foyerId, load])

  return { rows, loading, reload: load }
}
