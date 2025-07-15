import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Get user's coin balance
    const { data: coins, error: coinsError } = await supabase
      .from('coins')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (coinsError) {
      // If no coins record exists, create one
      if (coinsError.code === 'PGRST116') {
        const { data: newCoins, error: createError } = await supabase
          .from('coins')
          .insert({
            user_id: userId,
            balance: 100, // Starting balance
            lifetime_earned: 100
          })
          .select()
          .single()

        if (createError) throw createError
        return res.status(200).json(newCoins)
      }
      throw coinsError
    }

    res.status(200).json(coins)

  } catch (error) {
    console.error('Get coins error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}