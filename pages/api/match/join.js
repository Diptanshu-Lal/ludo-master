import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { roomCode } = req.body
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' })
    }

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Find match by room code
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, match_participants(*)')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')
      .single()

    if (matchError || !match) {
      return res.status(404).json({ error: 'Room not found or already started' })
    }

    // Check if room is full
    if (match.current_players >= 4) {
      return res.status(400).json({ error: 'Room is full' })
    }

    // Check if user is already in this match
    const isAlreadyInMatch = match.match_participants.some(p => p.user_id === userId)
    if (isAlreadyInMatch) {
      return res.status(400).json({ error: 'Already in this match' })
    }

    // Add user to match
    const availableColors = ['red', 'blue', 'yellow', 'green']
    const usedColors = match.match_participants.map(p => p.player_color)
    const availableColor = availableColors.find(color => !usedColors.includes(color))
    
    const { error: joinError } = await supabase
      .from('match_participants')
      .insert({
        match_id: match.id,
        user_id: userId,
        player_color: availableColor,
        player_position: match.current_players + 1
      })

    if (joinError) throw joinError

    // Update match player count
    const newPlayerCount = match.current_players + 1
    const { error: updateError } = await supabase
      .from('matches')
      .update({ 
        current_players: newPlayerCount,
        status: newPlayerCount >= 2 ? 'playing' : 'waiting',
        started_at: newPlayerCount >= 2 ? new Date().toISOString() : null
      })
      .eq('id', match.id)

    if (updateError) throw updateError

    // Create tokens for the new player
    await createTokensForPlayer(match.id, userId, availableColor, match.mode)

    res.status(200).json({ 
      matchId: match.id,
      playerColor: availableColor,
      playerPosition: newPlayerCount,
      status: newPlayerCount >= 2 ? 'playing' : 'waiting'
    })

  } catch (error) {
    console.error('Join match error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
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