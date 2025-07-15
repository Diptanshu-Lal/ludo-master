import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { friendId, matchId } = req.body
    
    if (!friendId) {
      return res.status(400).json({ error: 'Friend ID required' })
    }

    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Verify friendship
    const { data: friendship, error: friendshipError } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .eq('status', 'accepted')
      .single()

    if (friendshipError || !friendship) {
      return res.status(403).json({ error: 'Not friends with this user' })
    }

    // Get user and friend profiles
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: friendId,
        type: 'game_invite',
        title: 'Game Invitation',
        message: `${userProfile.username} invited you to play Ludo!`,
        data: {
          from_user_id: userId,
          match_id: matchId
        }
      })

    if (notificationError) throw notificationError

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully'
    })

  } catch (error) {
    console.error('Send invite error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}