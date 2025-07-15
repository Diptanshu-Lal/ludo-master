import GamePage from '../../../pages/game/[matchId]'

export default function GameRoute({ params }: { params: { matchId: string } }) {
  return <GamePage />
}import { MessageSquare, Volume2, VolumeX, Settings, EditIcon as ExitIcon, Crown, Clock, Users, Trophy, Target, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'