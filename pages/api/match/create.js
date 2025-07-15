import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { mode = 'classic' } = req.body
    
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Generate unique room code
    const roomCode = generateRoomCode()

    // Create new match
    const { data: match, error: createError } = await supabase
      .from('matches')
      .insert({
        room_code: roomCode,
        mode,
        status: 'waiting',
        current_players: 1,
        game_state: {
          currentPlayerId: userId,
          turnStartTime: Date.now(),
          consecutiveSixCount: 0
        }
      })
      .select()
      .single()

    if (createError) throw createError

    // Add creator as first participant
    const { error: participantError } = await supabase
      .from('match_participants')
      .insert({
        match_id: match.id,
        user_id: userId,
        player_color: 'red',
        player_position: 1
      })

    if (participantError) throw participantError

    // Create tokens for creator
    await createTokensForPlayer(match.id, userId, 'red', mode)

    res.status(200).json({ 
      matchId: match.id,
      roomCode: roomCode,
      status: 'waiting'
    })

  } catch (error) {
    console.error('Create match error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

async function createTokensForPlayer(matchId, userId, color, mode) {
  const tokens = []
  const startPosition = mode === 'quick' ? 0 : -1 // Quick mode starts on board
  
  for (let i = 1; i <= 4; i++) {
    tokens.push({
      match_id: matchId,
      user_id: userId,
      token_number: i,
      color,
      position: startPosition
    })
  }

  const { error } = await supabase
    .from('tokens')
    .insert(tokens)

  if (error) throw error
}