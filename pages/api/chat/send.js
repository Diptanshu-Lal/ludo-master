import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { matchId, message, messageType = 'text' } = req.body
    
    if (!matchId || !message) {
      return res.status(400).json({ error: 'Match ID and message required' })
    }

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Verify user is participant in this match
    const { data: participant, error: participantError } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', matchId)
      .eq('user_id', userId)
      .single()

    if (participantError || !participant) {
      return res.status(403).json({ error: 'Not a participant in this match' })
    }

    // Validate message content
    if (message.length > 200) {
      return res.status(400).json({ error: 'Message too long' })
    }

    // Basic profanity filter (in production, use a proper service)
    const profanityWords = ['damn', 'shit', 'fuck'] // Very basic example
    const containsProfanity = profanityWords.some(word => 
      message.toLowerCase().includes(word.toLowerCase())
    )

    if (containsProfanity) {
      return res.status(400).json({ error: 'Message contains inappropriate content' })
    }

    // Insert message
    const { data: chatMessage, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        match_id: matchId,
        user_id: userId,
        message,
        message_type: messageType
      })
      .select('*, profiles(username, avatar_url)')
      .single()

    if (insertError) throw insertError

    res.status(200).json({
      success: true,
      message: chatMessage
    })

  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}