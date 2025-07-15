import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { source, amount } = req.body
    
    if (!source || !amount) {
      return res.status(400).json({ error: 'Source and amount required' })
    }

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Validate source and amount
    const validSources = {
      'win': { max: 50, description: 'Match victory' },
      'streak': { max: 100, description: 'Win streak bonus' },
      'daily': { max: 50, description: 'Daily login bonus' },
      'ads': { max: 100, description: 'Watched advertisement' },
      'achievement': { max: 500, description: 'Achievement unlocked' }
    }

    if (!validSources[source]) {
      return res.status(400).json({ error: 'Invalid source' })
    }

    if (amount > validSources[source].max) {
      return res.status(400).json({ error: 'Amount exceeds maximum' })
    }

    // Update coins
    const { error: updateError } = await supabase
      .from('coins')
      .update({ 
        balance: supabase.raw(`balance + ${amount}`),
        lifetime_earned: supabase.raw(`lifetime_earned + ${amount}`)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Record transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        transaction_type: source,
        description: validSources[source].description
      })

    if (transactionError) throw transactionError

    // Get updated balance
    const { data: coins, error: coinsError } = await supabase
      .from('coins')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (coinsError) throw coinsError

    res.status(200).json({
      success: true,
      newBalance: coins.balance,
      earned: amount,
      source
    })

  } catch (error) {
    console.error('Earn coins error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}