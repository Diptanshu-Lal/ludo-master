import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'GET') {
    return getMatch(req, res, id)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

async function getMatch(req, res, matchId) {
  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Get match with participants and tokens
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        match_participants (
          *,
          profiles (username, avatar_url)
        )
      `)
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    // Verify user is participant
    const isParticipant = match.match_participants.some(p => p.user_id === userId)
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant in this match' })
    }

    // Get tokens for this match
    const { data: tokens, error: tokensError } = await supabase
      .from('tokens')
      .select('*')
      .eq('match_id', matchId)

    if (tokensError) throw tokensError

    // Get chat messages
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles (username, avatar_url)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (chatError) throw chatError

    // Transform participants to include profile data
    const players = match.match_participants.map(participant => ({
      id: participant.user_id,
      username: participant.profiles?.username || `Bot${participant.player_position}`,
      avatar_url: participant.profiles?.avatar_url,
      color: participant.player_color,
      position: participant.player_position,
      isBot: participant.is_bot,
      difficulty: participant.bot_difficulty
    }))

    res.status(200).json({
      match: {
        id: match.id,
        roomCode: match.room_code,
        mode: match.mode,
        status: match.status,
        gameState: match.game_state,
        settings: match.settings,
        startedAt: match.started_at,
        finishedAt: match.finished_at,
        winnerId: match.winner_id
      },
      players,
      tokens: tokens || [],
      chatMessages: chatMessages || []
    })

  } catch (error) {
    console.error('Get match error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}