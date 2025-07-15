import { supabase } from '../../../../lib/supabase'
import { 
  isValidMove, 
  applyMove, 
  handleConsecutiveSixes, 
  checkGameOver,
  getNextPlayer 
} from '../../../../lib/gameRules'

export default async function handler(req, res) {
  const { id: matchId } = req.query

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { tokenId, newPosition, diceValue } = req.body
    
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Get match with current state
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        match_participants (*),
        tokens (*)
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    // Verify user is participant and it's their turn
    const participant = match.match_participants.find(p => p.user_id === userId)
    if (!participant) {
      return res.status(403).json({ error: 'Not a participant in this match' })
    }

    if (match.game_state.currentPlayerId !== userId) {
      return res.status(400).json({ error: 'Not your turn' })
    }

    // Validate the move
    const move = {
      tokenId,
      from: match.tokens.find(t => t.id === tokenId)?.position,
      to: newPosition
    }

    if (!isValidMove(match, move, diceValue, match.mode)) {
      return res.status(400).json({ error: 'Invalid move' })
    }

    // Apply the move
    const newGameState = applyMove(match.game_state, move)

    // Handle consecutive sixes
    const sixResult = handleConsecutiveSixes(newGameState, diceValue)
    if (sixResult.turnForfeited) {
      newGameState.turnForfeited = true
    }

    // Update token position
    const { error: tokenError } = await supabase
      .from('tokens')
      .update({ position: newPosition })
      .eq('id', tokenId)

    if (tokenError) throw tokenError

    // Check for game over
    const isGameOver = checkGameOver(match.tokens, userId)
    let gameStatus = match.status
    let winnerId = null

    if (isGameOver) {
      gameStatus = 'finished'
      winnerId = userId
      
      // Award coins for winning
      const { error: coinsError } = await supabase
        .from('coins')
        .update({ 
          balance: supabase.raw('balance + 20'),
          lifetime_earned: supabase.raw('lifetime_earned + 20')
        })
        .eq('user_id', userId)

      if (coinsError) console.error('Error awarding coins:', coinsError)

      // Record coin transaction
      const { error: transactionError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: 20,
          transaction_type: 'win',
          description: 'Match victory bonus'
        })

      if (transactionError) console.error('Error recording transaction:', transactionError)
    }

    // Determine next player
    let nextPlayerId = userId
    if (diceValue !== 6 && !sixResult.turnForfeited && !isGameOver) {
      nextPlayerId = getNextPlayer(match.match_participants, userId)
    }

    // Update match state
    const updatedGameState = {
      ...newGameState,
      currentPlayerId: nextPlayerId,
      turnStartTime: Date.now(),
      lastDiceRoll: null,
      canMove: false
    }

    const { error: updateError } = await supabase
      .from('matches')
      .update({
        game_state: updatedGameState,
        status: gameStatus,
        winner_id: winnerId,
        finished_at: isGameOver ? new Date().toISOString() : null
      })
      .eq('id', matchId)

    if (updateError) throw updateError

    res.status(200).json({
      success: true,
      gameState: updatedGameState,
      nextPlayerId,
      gameOver: isGameOver,
      winner: winnerId
    })

  } catch (error) {
    console.error('Move error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}