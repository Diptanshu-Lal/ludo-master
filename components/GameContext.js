'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { supabase, subscribeToMatch } from '../lib/supabase'
import { createInitialGameState, applyMove, handleConsecutiveSixes, checkGameOver } from '../lib/gameRules'
import { toast } from 'react-hot-toast'

const GameContext = createContext()

// Game state reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_GAME':
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      }
    
    case 'UPDATE_GAME_STATE':
      return {
        ...state,
        ...action.payload
      }
    
    case 'ROLL_DICE':
      return {
        ...state,
        lastDiceRoll: action.payload,
        isRolling: true
      }
    
    case 'DICE_ROLLED':
      return {
        ...state,
        isRolling: false,
        canMove: true
      }
    
    case 'MOVE_TOKEN':
      const newState = applyMove(state, action.payload)
      return {
        ...state,
        ...newState,
        canMove: false
      }
    
    case 'END_TURN':
      return {
        ...state,
        currentPlayerId: action.payload.nextPlayerId,
        canMove: false,
        lastDiceRoll: null,
        turnStartTime: Date.now()
      }
    
    case 'GAME_OVER':
      return {
        ...state,
        status: 'finished',
        winner: action.payload.winner,
        gameOverTime: Date.now()
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case 'RECONNECT':
      return {
        ...state,
        connected: true,
        reconnecting: false
      }
    
    case 'DISCONNECT':
      return {
        ...state,
        connected: false,
        reconnecting: true
      }
    
    default:
      return state
  }
}

// Initial state
const initialState = {
  matchId: null,
  tokens: [],
  currentPlayerId: null,
  players: [],
  mode: 'classic',
  lastDiceRoll: null,
  consecutiveSixCount: 0,
  turnStartTime: null,
  gameStartTime: null,
  status: 'waiting',
  loading: true,
  error: null,
  connected: false,
  reconnecting: false,
  canMove: false,
  isRolling: false,
  winner: null,
  gameOverTime: null,
  chatMessages: [],
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    theme: 'wood',
    skipAnimations: false
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // Initialize game from match ID
  const initializeGame = async (matchId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // Fetch match data
      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (error) throw error

      // Fetch tokens
      const { data: tokens, error: tokensError } = await supabase
        .from('tokens')
        .select('*')
        .eq('match_id', matchId)

      if (tokensError) throw tokensError

      // Fetch players
      const { data: players, error: playersError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Object.keys(match.state.players || {}))

      if (playersError) throw playersError

      dispatch({
        type: 'INIT_GAME',
        payload: {
          matchId,
          ...match.state,
          tokens,
          players,
          connected: true
        }
      })

      // Subscribe to real-time updates
      const subscription = subscribeToMatch(matchId, (payload) => {
        handleRealtimeUpdate(payload)
      })

      return subscription
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      toast.error('Failed to initialize game')
    }
  }

  // Handle real-time updates
  const handleRealtimeUpdate = (payload) => {
    if (payload.eventType === 'UPDATE') {
      const newState = payload.new.state
      dispatch({
        type: 'UPDATE_GAME_STATE',
        payload: newState
      })
    }
  }

  // Roll dice
  const rollDice = async () => {
    if (!state.connected || state.isRolling) return

    try {
      const response = await fetch(`/api/match/${state.matchId}/roll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to roll dice')

      const { diceValue } = await response.json()
      
      dispatch({ type: 'ROLL_DICE', payload: diceValue })
      
      // Simulate dice animation
      setTimeout(() => {
        dispatch({ type: 'DICE_ROLLED' })
      }, state.settings.skipAnimations ? 100 : 1000)

    } catch (error) {
      toast.error('Failed to roll dice')
    }
  }

  // Move token
  const moveToken = async (tokenId, newPosition) => {
    if (!state.canMove) return

    try {
      const response = await fetch(`/api/match/${state.matchId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          newPosition,
          diceValue: state.lastDiceRoll
        })
      })

      if (!response.ok) throw new Error('Invalid move')

      const { gameState } = await response.json()
      
      dispatch({
        type: 'MOVE_TOKEN',
        payload: {
          tokenId,
          from: state.tokens.find(t => t.id === tokenId)?.position,
          to: newPosition
        }
      })

      // Check for game over
      if (checkGameOver(gameState.tokens, state.currentPlayerId)) {
        dispatch({
          type: 'GAME_OVER',
          payload: { winner: state.currentPlayerId }
        })
      }

    } catch (error) {
      toast.error('Invalid move')
    }
  }

  // Send chat message
  const sendChatMessage = async (message) => {
    try {
      const response = await fetch(`/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: state.matchId,
          message
        })
      })

      if (!response.ok) throw new Error('Failed to send message')

    } catch (error) {
      toast.error('Failed to send message')
    }
  }

  // Update settings
  const updateSettings = (newSettings) => {
    dispatch({
      type: 'UPDATE_GAME_STATE',
      payload: {
        settings: { ...state.settings, ...newSettings }
      }
    })
    
    // Save to localStorage
    localStorage.setItem('ludoGameSettings', JSON.stringify({
      ...state.settings,
      ...newSettings
    }))
  }

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('ludoGameSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      updateSettings(settings)
    }
  }, [])

  // Reconnection logic
  useEffect(() => {
    if (state.matchId && !state.connected && !state.loading) {
      dispatch({ type: 'DISCONNECT' })
      
      // Attempt to reconnect
      const reconnectTimeout = setTimeout(() => {
        initializeGame(state.matchId)
      }, 3000)

      return () => clearTimeout(reconnectTimeout)
    }
  }, [state.connected, state.matchId, state.loading])

  const value = {
    state,
    dispatch,
    initializeGame,
    rollDice,
    moveToken,
    sendChatMessage,
    updateSettings
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}