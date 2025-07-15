import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get user from session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = session.user.id

    // Get user's friends
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_friend_id_fkey(id, username, avatar_url, last_login_date)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')

    if (friendsError) throw friendsError

    // Check which friends are online (logged in within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const onlineFriends = friends.filter(friend => {
      const lastLogin = new Date(friend.friend_profile.last_login_date)
      return lastLogin > fiveMinutesAgo
    })

    // Format response
    const formattedFriends = onlineFriends.map(friend => ({
      id: friend.friend_profile.id,
      username: friend.friend_profile.username,
      avatar_url: friend.friend_profile.avatar_url,
      status: 'online', // In production, you'd check real-time presence
      lastSeen: friend.friend_profile.last_login_date
    }))

    res.status(200).json(formattedFriends)

  } catch (error) {
    console.error('Get online friends error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}