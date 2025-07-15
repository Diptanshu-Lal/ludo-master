/*
  # Ludo Game Database Schema
  
  1. New Tables
    - `profiles` - User profiles and settings
    - `matches` - Game matches and state
    - `tokens` - Individual game tokens
    - `chat_messages` - In-game chat messages
    - `coins` - User currency and transactions
    - `friends` - Friend relationships
    - `match_participants` - Many-to-many relationship for matches and users
    - `daily_streaks` - Track daily login streaks
    - `achievements` - User achievements and unlocks

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Separate policies for different user roles
    - Protect sensitive data like game state

  3. Indexes
    - Add indexes for frequently queried columns
    - Composite indexes for complex queries
    - Unique indexes for constraints

  4. Functions
    - Auto-update functions for timestamps
    - Game state validation functions
    - Coin transaction functions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  country TEXT DEFAULT 'US',
  is_guest BOOLEAN DEFAULT false,
  last_login_date DATE DEFAULT CURRENT_DATE,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE,
  mode TEXT NOT NULL DEFAULT 'classic' CHECK (mode IN ('classic', 'speed', 'quick')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished', 'abandoned')),
  max_players INTEGER DEFAULT 4,
  current_players INTEGER DEFAULT 0,
  winner_id UUID REFERENCES profiles(id),
  game_state JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match participants (many-to-many)
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  player_color TEXT NOT NULL CHECK (player_color IN ('red', 'blue', 'yellow', 'green')),
  player_position INTEGER NOT NULL CHECK (player_position BETWEEN 1 AND 4),
  is_bot BOOLEAN DEFAULT false,
  bot_difficulty TEXT CHECK (bot_difficulty IN ('easy', 'medium', 'hard')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  UNIQUE(match_id, user_id),
  UNIQUE(match_id, player_color),
  UNIQUE(match_id, player_position)
);

-- Game tokens table
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token_number INTEGER NOT NULL CHECK (token_number BETWEEN 1 AND 4),
  color TEXT NOT NULL CHECK (color IN ('red', 'blue', 'yellow', 'green')),
  position INTEGER NOT NULL DEFAULT -1, -- -1 = home, 0-51 = path, 52+ = finish
  is_safe BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(match_id, user_id, token_number)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'emote', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User coins/currency table
CREATE TABLE IF NOT EXISTS coins (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  last_daily_bonus DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coin transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for earned, negative for spent
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('win', 'daily', 'streak', 'purchase', 'ads', 'referral')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

-- Daily streaks table
CREATE TABLE IF NOT EXISTS daily_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_login_date DATE DEFAULT CURRENT_DATE,
  streak_rewards_claimed JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('games', 'wins', 'streak', 'tokens', 'special')),
  requirement_value INTEGER NOT NULL DEFAULT 1,
  reward_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (unlocked achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Game statistics table
CREATE TABLE IF NOT EXISTS game_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  tokens_moved INTEGER DEFAULT 0,
  tokens_captured INTEGER DEFAULT 0,
  tokens_lost INTEGER DEFAULT 0,
  dice_rolls INTEGER DEFAULT 0,
  sixes_rolled INTEGER DEFAULT 0,
  game_duration_seconds INTEGER DEFAULT 0,
  placement INTEGER CHECK (placement BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'game_invite', 'achievement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Matches: Users can read matches they participate in
CREATE POLICY "Users can read their matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT match_id FROM match_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their matches"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT match_id FROM match_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Match participants: Users can read all participants in their matches
CREATE POLICY "Users can read match participants"
  ON match_participants FOR SELECT
  TO authenticated
  USING (
    match_id IN (
      SELECT match_id FROM match_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert themselves as participants"
  ON match_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Tokens: Users can read tokens in their matches
CREATE POLICY "Users can read match tokens"
  ON tokens FOR SELECT
  TO authenticated
  USING (
    match_id IN (
      SELECT match_id FROM match_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tokens"
  ON tokens FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Chat messages: Users can read messages in their matches
CREATE POLICY "Users can read match chat"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    match_id IN (
      SELECT match_id FROM match_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Coins: Users can only access their own coins
CREATE POLICY "Users can read own coins"
  ON coins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own coins"
  ON coins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own coins"
  ON coins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Coin transactions: Users can only read their own transactions
CREATE POLICY "Users can read own transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Friends: Users can read their own friend relationships
CREATE POLICY "Users can read own friends"
  ON friends FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can manage own friendships"
  ON friends FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Daily streaks: Users can only access their own streaks
CREATE POLICY "Users can read own streaks"
  ON daily_streaks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own streaks"
  ON daily_streaks FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own streaks"
  ON daily_streaks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Achievements: Everyone can read achievements
CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- User achievements: Users can only access their own achievements
CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Game statistics: Users can read their own stats
CREATE POLICY "Users can read own statistics"
  ON game_statistics FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own statistics"
  ON game_statistics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Notifications: Users can only access their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_room_code ON matches(room_code);
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_match_id ON tokens(match_id);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_match_id ON chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_streaks_updated_at
  BEFORE UPDATE ON daily_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coins_updated_at
  BEFORE UPDATE ON coins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default achievements
INSERT INTO achievements (achievement_key, name, description, icon, category, requirement_type, requirement_value, reward_coins) VALUES
  ('first_win', 'First Victory', 'Win your first game', '🏆', 'gameplay', 'wins', 1, 50),
  ('win_streak_5', 'On Fire', 'Win 5 games in a row', '🔥', 'gameplay', 'streak', 5, 100),
  ('win_streak_10', 'Unstoppable', 'Win 10 games in a row', '⚡', 'gameplay', 'streak', 10, 200),
  ('games_played_10', 'Getting Started', 'Play 10 games', '🎯', 'gameplay', 'games', 10, 30),
  ('games_played_50', 'Experienced', 'Play 50 games', '🎮', 'gameplay', 'games', 50, 100),
  ('games_played_100', 'Veteran', 'Play 100 games', '🏅', 'gameplay', 'games', 100, 250),
  ('daily_login_7', 'Dedicated', 'Login for 7 days in a row', '📅', 'social', 'streak', 7, 75),
  ('daily_login_30', 'Committed', 'Login for 30 days in a row', '🗓️', 'social', 'streak', 30, 300),
  ('tokens_captured_100', 'Hunter', 'Capture 100 opponent tokens', '🎯', 'gameplay', 'tokens', 100, 150),
  ('perfect_game', 'Flawless Victory', 'Win without losing any tokens', '💎', 'gameplay', 'special', 1, 500)
ON CONFLICT (achievement_key) DO NOTHING;

-- Function to handle daily login streaks
CREATE OR REPLACE FUNCTION handle_daily_login(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  streak_record RECORD;
  coins_earned INTEGER := 0;
  result JSONB;
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record FROM daily_streaks WHERE user_id = user_uuid;
  
  IF NOT FOUND THEN
    INSERT INTO daily_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (user_uuid, 1, 1, CURRENT_DATE);
    coins_earned := 10;
  ELSE
    IF streak_record.last_login_date = CURRENT_DATE THEN
      -- Already logged in today, no bonus
      coins_earned := 0;
    ELSIF streak_record.last_login_date = CURRENT_DATE - INTERVAL '1 day' THEN
      -- Consecutive day, increase streak
      UPDATE daily_streaks SET
        current_streak = streak_record.current_streak + 1,
        longest_streak = GREATEST(streak_record.longest_streak, streak_record.current_streak + 1),
        last_login_date = CURRENT_DATE
      WHERE user_id = user_uuid;
      coins_earned := 10 + (streak_record.current_streak * 2); -- Bonus increases with streak
    ELSE
      -- Streak broken, reset
      UPDATE daily_streaks SET
        current_streak = 1,
        last_login_date = CURRENT_DATE
      WHERE user_id = user_uuid;
      coins_earned := 10;
    END IF;
  END IF;
  
  -- Award coins if earned
  IF coins_earned > 0 THEN
    UPDATE coins SET 
      balance = balance + coins_earned,
      lifetime_earned = lifetime_earned + coins_earned
    WHERE user_id = user_uuid;
    
    INSERT INTO coin_transactions (user_id, amount, transaction_type, description)
    VALUES (user_uuid, coins_earned, 'daily', 'Daily login bonus');
  END IF;
  
  result := jsonb_build_object(
    'coins_earned', coins_earned,
    'current_streak', COALESCE((SELECT current_streak FROM daily_streaks WHERE user_id = user_uuid), 1)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;