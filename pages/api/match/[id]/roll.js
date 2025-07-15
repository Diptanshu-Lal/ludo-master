import { supabase } from '../../../../lib/supabase'
import { rollDice } from '../../../../lib/gameRules'

export default async function handler(req, res) {
  const { id: matchId } = req.query

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    // Verify it's the user's turn
    if (match.game_state.currentPlayerId !== userId) {
      return res.status(400).json({ error: 'Not your turn' })
    }

    // Roll the dice
    const diceValue = rollDice()

    // Update game state
    const updatedGameState = {
      ...match.game_state,
      lastDiceRoll: diceValue,
      canMove: true,
      turnStartTime: Date.now()
    }

    const { error: updateError } = await supabase
      .from('matches')
      .update({
        game_state: updatedGameState
      })
      .eq('id', matchId)

    if (updateError) throw updateError

    res.status(200).json({
      diceValue,
      gameState: updatedGameState
    })

  } catch (error) {
    console.error('Roll dice error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}