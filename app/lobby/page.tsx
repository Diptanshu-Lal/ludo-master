'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Separator } from '../../components/ui/separator'
import { 
  Users, 
  Play, 
  Settings, 
  Trophy, 
  Coins, 
  Copy, 
  Share2, 
  Clock,
  Zap,
  Target,
  Crown,
  Star
} from 'lucide-react'
import { toast } from '../../hooks/use-toast'

const LobbyPage = () => {
  const router = useRouter()
  const [user, setUser] = useState({
    username: 'Player123',
    avatar_url: null,
    is_guest: false
  })
  const [loading, setLoading] = useState(false)
  const [matchmaking, setMatchmaking] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [onlineFriends, setOnlineFriends] = useState([
    { id: 1, username: 'Player1', avatar: null, status: 'online' },
    { id: 2, username: 'Player2', avatar: null, status: 'in-game' },
    { id: 3, username: 'Player3', avatar: null, status: 'online' }
  ])
  const [playerStats, setPlayerStats] = useState({
    totalGames: 47,
    wins: 32,
    losses: 15,
    winRate: 68,
    longestStreak: 8,
    currentStreak: 3
  })
  const [coins, setCoins] = useState(250)
  const [selectedMode, setSelectedMode] = useState('classic')
  const [waitTime, setWaitTime] = useState(0)

  const handleQuickMatch = async () => {
    if (matchmaking) return

    setMatchmaking(true)
    setWaitTime(0)

    try {
      // Start wait timer
      const waitTimer = setInterval(() => {
        setWaitTime(prev => prev + 1)
      }, 1000)

      // Simulate finding a match
      setTimeout(() => {
        clearInterval(waitTimer)
        setMatchmaking(false)
        toast({
          title: "Match found!",
          description: "Joining game...",
        })
        router.push(`/game/demo-match-123`)
      }, 3000 + Math.random() * 7000) // 3-10 seconds

    } catch (error) {
      toast({
        title: "Failed to find match",
        description: "Please try again.",
        variant: "destructive",
      })
      setMatchmaking(false)
    }
  }

  const handleCreateRoom = async () => {
    try {
      // Simulate room creation
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      setCreatedRoom({ code: roomCode, matchId: 'demo-room-123' })
      toast({
        title: "Room created successfully!",
        description: `Room code: ${roomCode}`,
      })
      
    } catch (error) {
      toast({
        title: "Failed to create room",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Please enter a room code",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Joining room...",
        description: `Room code: ${roomCode}`,
      })
      router.push(`/game/demo-room-${roomCode}`)
      
    } catch (error) {
      toast({
        title: "Invalid room code or room is full",
        variant: "destructive",
      })
    }
  }

  const handleCopyRoomCode = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.code)
      toast({
        title: "Room code copied!",
        description: "Share it with your friends.",
      })
    }
  }

  const handleShareRoom = async () => {
    if (!createdRoom) return

    const shareText = `Join my Ludo game! Room code: ${createdRoom.code}`
    const shareUrl = `${window.location.origin}/join/${createdRoom.code}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Ludo game!',
          text: shareText,
          url: shareUrl
        })
      } catch (error) {
        // Fallback to copy
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        toast({
          title: "Share link copied!",
          description: "Send it to your friends via WhatsApp or any messaging app.",
        })
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      toast({
        title: "Share link copied!",
        description: "Send it to your friends via WhatsApp or any messaging app.",
      })
    }
  }

  const handleCancelMatch = () => {
    setMatchmaking(false)
    setWaitTime(0)
    toast({
      title: "Matchmaking cancelled",
    })
  }

  const handleInviteFriend = async (friendId) => {
    toast({
      title: "Invite sent!",
      description: "Your friend will receive a notification.",
    })
  }

  const gameModes = [
    {
      id: 'classic',
      name: 'Classic',
      icon: Crown,
      description: 'Traditional rules, 15s turns',
      duration: '15-20 min'
    },
    {
      id: 'speed',
      name: 'Speed',
      icon: Zap,
      description: 'Fast-paced, 10s turns',
      duration: '10-15 min'
    },
    {
      id: 'quick',
      name: 'Quick',
      icon: Target,
      description: 'One token per turn, 5s turns',
      duration: '5-10 min'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-wood-light to-wood-dark">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-nostalgia-red to-forest-green bg-clip-text text-transparent">
                Ludo Masters
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Coins */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full shadow-lg">
                <Coins className="h-5 w-5" />
                <span className="font-semibold">{coins}</span>
              </div>
              
              {/* User Avatar */}
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.username}</p>
                  <p className="text-xs text-gray-500">
                    {user?.is_guest ? 'Guest Player' : 'Level 12'}
                  </p>
                </div>
              </div>
              
              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="quick-match" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick-match">Quick Match</TabsTrigger>
                <TabsTrigger value="private-room">Private Room</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quick-match" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Play className="h-5 w-5" />
                      <span>Quick Match</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Game Mode Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Select Game Mode</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {gameModes.map((mode) => (
                          <Card
                            key={mode.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedMode === mode.id 
                                ? 'ring-2 ring-blue-500 bg-blue-50' 
                                : 'hover:shadow-lg'
                            }`}
                            onClick={() => setSelectedMode(mode.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <mode.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                              <h4 className="font-semibold">{mode.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                              <Badge variant="secondary" className="mt-2">
                                {mode.duration}
                              </Badge>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Quick Match Button */}
                    <div className="text-center">
                      {matchmaking ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-lg font-medium">Finding match...</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Estimated wait time: {waitTime}s
                          </p>
                          <Button variant="outline" onClick={handleCancelMatch}>
                            Cancel Match
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                          onClick={handleQuickMatch}
                        >
                          <Play className="mr-2 h-5 w-5" />
                          Find Match
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="private-room" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Private Room</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Create Room */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Create Room</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {gameModes.map((mode) => (
                          <Card
                            key={mode.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              selectedMode === mode.id 
                                ? 'ring-2 ring-blue-500 bg-blue-50' 
                                : 'hover:shadow-lg'
                            }`}
                            onClick={() => setSelectedMode(mode.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <mode.icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                              <h4 className="font-semibold">{mode.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{mode.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <Button
                        onClick={handleCreateRoom}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      >
                        Create Room
                      </Button>

                      {createdRoom && (
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-green-800">Room Created!</p>
                                <p className="text-sm text-green-600">
                                  Code: <span className="font-mono font-bold">{createdRoom.code}</span>
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={handleCopyRoomCode}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleShareRoom}>
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <Separator />

                    {/* Join Room */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Join Room</h3>
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter room code"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleJoinRoom} disabled={!roomCode.trim()}>
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Player Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="h-5 w-5" />
                  <span>Your Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {playerStats.wins}
                    </div>
                    <div className="text-sm text-gray-600">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {playerStats.losses}
                    </div>
                    <div className="text-sm text-gray-600">Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {playerStats.winRate}%
                    </div>
                    <div className="text-sm text-gray-600">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {playerStats.currentStreak}
                    </div>
                    <div className="text-sm text-gray-600">Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Online Friends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Online Friends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {onlineFriends.map((friend) => (
                    <div key={friend.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{friend.username}</p>
                          <p className="text-xs text-gray-500">{friend.status}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInviteFriend(friend.id)}
                        disabled={!createdRoom}
                      >
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/profile')}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/leaderboard')}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Leaderboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LobbyPage