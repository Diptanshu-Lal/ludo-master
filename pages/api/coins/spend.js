import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { itemId, amount } = req.body
    
    if (!itemId || !amount) {
      return res.status(400).json({ error: 'Item ID and amount required' })
    }

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Get current balance
    const { data: coins, error: coinsError } = await supabase
      .from('coins')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (coinsError) throw coinsError

    if (coins.balance < amount) {
      return res.status(400).json({ error: 'Insufficient coins' })
    }

    // Validate item (this would be expanded with actual store items)
    const validItems = {
      'theme_neon': { cost: 100, description: 'Neon board theme' },
      'theme_festival': { cost: 150, description: 'Festival board theme' },
      'dice_golden': { cost: 200, description: 'Golden dice skin' },
      'dice_marble': { cost: 250, description: 'Marble dice skin' }
    }

    if (!validItems[itemId]) {
      return res.status(400).json({ error: 'Invalid item' })
    }

    if (amount !== validItems[itemId].cost) {
      return res.status(400).json({ error: 'Incorrect amount' })
    }

    // Update coins
    const { error: updateError } = await supabase
      .from('coins')
      .update({ 
        balance: supabase.raw(`balance - ${amount}`),
        lifetime_spent: supabase.raw(`lifetime_spent + ${amount}`)
      })
      .eq('user_id', userId)

    if (updateError) throw updateError

    // Record transaction
    const { error: transactionError } = await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        transaction_type: 'purchase',
        description: validItems[itemId].description,
        metadata: { item_id: itemId }
      })

    if (transactionError) throw transactionError

    // Get updated balance
    const { data: updatedCoins, error: updatedCoinsError } = await supabase
      .from('coins')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (updatedCoinsError) throw updatedCoinsError

    res.status(200).json({
      success: true,
      newBalance: updatedCoins.balance,
      spent: amount,
      item: itemId
    })

  } catch (error) {
    console.error('Spend coins error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}