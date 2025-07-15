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

    // Look for existing waiting matches
    const { data: waitingMatches, error: searchError } = await supabase
      .from('matches')
      .select('*, match_participants(*)')
      .eq('status', 'waiting')
      .eq('mode', mode)
      .lt('current_players', 4)
      .order('created_at', { ascending: true })
      .limit(1)

    if (searchError) {
      throw searchError
    }

    let match

    if (waitingMatches && waitingMatches.length > 0) {
      // Join existing match
      match = waitingMatches[0]
      
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
      const { error: updateError } = await supabase
        .from('matches')
        .update({ 
          current_players: match.current_players + 1,
          status: match.current_players + 1 >= 2 ? 'playing' : 'waiting'
        })
        .eq('id', match.id)

      if (updateError) throw updateError

      // Create tokens for the new player
      await createTokensForPlayer(match.id, userId, availableColor, mode)

    } else {
      // Create new match
      const { data: newMatch, error: createError } = await supabase
        .from('matches')
        .insert({
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
          match_id: newMatch.id,
          user_id: userId,
          player_color: 'red',
          player_position: 1
        })

      if (participantError) throw participantError

      // Create tokens for creator
      await createTokensForPlayer(newMatch.id, userId, 'red', mode)

      match = newMatch
    }

    // If we have at least 2 players, start the game
    if (match.current_players >= 2) {
      // Add bots if needed
      const botsNeeded = 4 - match.current_players
      if (botsNeeded > 0) {
        await addBotsToMatch(match.id, botsNeeded)
      }
      
      // Update match to playing status
      const { error: startError } = await supabase
        .from('matches')
        .update({ 
          status: 'playing',
          started_at: new Date().toISOString()
        })
        .eq('id', match.id)

      if (startError) throw startError
    }

    res.status(200).json({ 
      matchId: match.id,
      status: match.status,
      playersNeeded: Math.max(0, 2 - match.current_players)
    })

  } catch (error) {
    console.error('Quick match error:', error)
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

async function addBotsToMatch(matchId, botCount) {
  const availableColors = ['red', 'blue', 'yellow', 'green']
  
  // Get existing participants to see which colors are taken
  const { data: existingParticipants } = await supabase
    .from('match_participants')
    .select('player_color, player_position')
    .eq('match_id', matchId)

  const usedColors = existingParticipants.map(p => p.player_color)
  const usedPositions = existingParticipants.map(p => p.player_position)
  const availableColorsForBots = availableColors.filter(color => !usedColors.includes(color))

  const botNames = ['RoboLudo', 'DiceBot', 'TokenMaster', 'BoardKing']
  
  for (let i = 0; i < Math.min(botCount, availableColorsForBots.length); i++) {
    const color = availableColorsForBots[i]
    const position = Math.max(...usedPositions) + 1
    
    // Create bot user profile
    const botId = `bot-${matchId}-${i}`
    
    const { error: participantError } = await supabase
      .from('match_participants')
      .insert({
        match_id: matchId,
        user_id: botId, // Using string ID for bots
        player_color: color,
        player_position: position,
        is_bot: true,
        bot_difficulty: 'medium'
      })

    if (participantError) throw participantError

    // Create tokens for bot
    await createTokensForPlayer(matchId, botId, color, 'classic')
  }

  // Update match player count
  const { error: updateError } = await supabase
    .from('matches')
    .update({ 
      current_players: existingParticipants.length + botCount
    })
    .eq('id', matchId)

  if (updateError) throw updateError
}