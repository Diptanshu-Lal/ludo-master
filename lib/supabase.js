import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uasbytoylpscodczsnxh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhc2J5dG95bHBzY29kY3pzbnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTc5NDUsImV4cCI6MjA2ODEzMzk0NX0.WCDdfeDDcEckLDFZ0zf7E3kHqd4subGB0UEWVt60ckA'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Real-time subscription helper
export const subscribeToMatch = (matchId, callback) => {
  return supabase
    .channel(`match:${matchId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      callback
    )
    .subscribe()
}

// Chat subscription helper
export const subscribeToChatMessages = (matchId, callback) => {
  return supabase
    .channel(`chat:${matchId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `match_id=eq.${matchId}` },
      callback
    )
    .subscribe()
}

// Presence helper for online users
export const subscribeToPresence = (matchId, userId, callback) => {
  return supabase
    .channel(`presence:${matchId}`)
    .on('presence', { event: 'sync' }, callback)
    .on('presence', { event: 'join' }, callback)
    .on('presence', { event: 'leave' }, callback)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Track user presence
        supabase.channel(`presence:${matchId}`).track({ userId, online_at: new Date().toISOString() })
      }
    })
}