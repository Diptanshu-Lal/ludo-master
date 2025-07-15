/**
 * AI Bot Logic for Ludo Game
 * Placeholder for advanced AI implementation
 */

import { getLegalMoves, checkForCapture, calculatePlayerStats, PATH_LENGTH, HOME_STRETCH_LENGTH } from './gameRules'

// Difficulty levels
export const BOT_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

// Bot personalities
export const BOT_PERSONALITIES = {
  AGGRESSIVE: 'aggressive',    // Prioritizes captures
  DEFENSIVE: 'defensive',      // Plays safe, avoids risks
  BALANCED: 'balanced',        // Mix of strategies
  SPEEDSTER: 'speedster'       // Rushes to finish
}

/**
 * Main bot decision function
 */
export function makeBotMove(state, diceValue, mode, difficulty = BOT_DIFFICULTY.MEDIUM) {
  const legalMoves = getLegalMoves(state.tokens, diceValue, mode, state.currentPlayerId)
  
  if (legalMoves.length === 0) {
    return null
  }

  if (legalMoves.length === 1) {
    return legalMoves[0]
  }

  // Apply difficulty-based strategy
  switch (difficulty) {
    case BOT_DIFFICULTY.EASY:
      return makeEasyMove(state, legalMoves)
    case BOT_DIFFICULTY.MEDIUM:
      return makeMediumMove(state, legalMoves)
    case BOT_DIFFICULTY.HARD:
      return makeHardMove(state, legalMoves)
    default:
      return makeRandomMove(legalMoves)
  }
}

/**
 * Easy bot - mostly random with slight preference for progress
 */
function makeEasyMove(state, legalMoves) {
  // 30% chance to make optimal move, 70% random
  if (Math.random() < 0.3) {
    return makeMediumMove(state, legalMoves)
  }
  
  return makeRandomMove(legalMoves)
}

/**
 * Medium bot - balanced strategy
 */
function makeMediumMove(state, legalMoves) {
  const moveScores = legalMoves.map(move => {
    const token = state.tokens.find(t => t.id === move.tokenId)
    let score = 0

    // Factor 1: Capture opportunities (high priority)
    const capturedTokens = checkForCapture(state.tokens, move)
    if (capturedTokens.length > 0) {
      score += 100 * capturedTokens.length
    }

    // Factor 2: Progress toward finish
    if (move.to >= PATH_LENGTH) {
      score += 50 // Bonus for entering finish stretch
    } else if (move.from === -1) {
      score += 30 // Bonus for leaving home
    }
    
    score += move.to * 2 // Progress points

    // Factor 3: Safety considerations
    if (isTokenSafe(state, move.to)) {
      score += 10 // Bonus for safe positions
    }

    // Factor 4: Avoid clustering
    const tokensAtDestination = state.tokens.filter(t => 
      t.position === move.to && t.playerId === state.currentPlayerId
    ).length
    if (tokensAtDestination > 1) {
      score -= 20 // Penalty for clustering
    }

    return { move, score }
  })

  moveScores.sort((a, b) => b.score - a.score)
  return moveScores[0].move
}

/**
 * Hard bot - advanced strategy with lookahead
 */
function makeHardMove(state, legalMoves) {
  const moveScores = legalMoves.map(move => {
    let score = 0

    // Use medium bot base score
    const mediumScore = scoreMoveForMediumBot(state, move)
    score += mediumScore

    // Advanced factors
    
    // Factor 1: Threat assessment
    const threatScore = assessThreats(state, move)
    score += threatScore

    // Factor 2: Positional advantage
    const positionScore = calculatePositionalAdvantage(state, move)
    score += positionScore

    // Factor 3: Endgame optimization
    if (isEndgame(state)) {
      const endgameScore = calculateEndgameScore(state, move)
      score += endgameScore
    }

    // Factor 4: Blocking opportunities
    const blockingScore = calculateBlockingScore(state, move)
    score += blockingScore

    return { move, score }
  })

  moveScores.sort((a, b) => b.score - a.score)
  
  // Add some randomness even to hard bot (10% chance)
  if (Math.random() < 0.1) {
    const topMoves = moveScores.slice(0, Math.min(3, moveScores.length))
    return topMoves[Math.floor(Math.random() * topMoves.length)].move
  }
  
  return moveScores[0].move
}

/**
 * Personality-based bot behavior
 */
export function makePersonalityMove(state, diceValue, mode, personality) {
  const legalMoves = getLegalMoves(state.tokens, diceValue, mode, state.currentPlayerId)
  
  if (legalMoves.length === 0) return null
  if (legalMoves.length === 1) return legalMoves[0]

  switch (personality) {
    case BOT_PERSONALITIES.AGGRESSIVE:
      return makeAggressiveMove(state, legalMoves)
    case BOT_PERSONALITIES.DEFENSIVE:
      return makeDefensiveMove(state, legalMoves)
    case BOT_PERSONALITIES.SPEEDSTER:
      return makeSpeedsterMove(state, legalMoves)
    default:
      return makeMediumMove(state, legalMoves)
  }
}

/**
 * Aggressive bot - prioritizes captures and attacks
 */
function makeAggressiveMove(state, legalMoves) {
  // Always go for captures first
  for (const move of legalMoves) {
    const capturedTokens = checkForCapture(state.tokens, move)
    if (capturedTokens.length > 0) {
      return move
    }
  }

  // Look for positions that threaten opponents
  const threateningMoves = legalMoves.filter(move => {
    return canThreatenOpponents(state, move)
  })

  if (threateningMoves.length > 0) {
    return threateningMoves[0]
  }

  // Fall back to medium strategy
  return makeMediumMove(state, legalMoves)
}

/**
 * Defensive bot - plays safe and avoids risks
 */
function makeDefensiveMove(state, legalMoves) {
  // Prioritize safe moves
  const safeMoves = legalMoves.filter(move => isTokenSafe(state, move.to))
  
  if (safeMoves.length > 0) {
    // Among safe moves, pick the one with most progress
    safeMoves.sort((a, b) => b.to - a.to)
    return safeMoves[0]
  }

  // If no safe moves, pick the least risky one
  const riskScores = legalMoves.map(move => ({
    move,
    risk: calculateRiskScore(state, move)
  }))

  riskScores.sort((a, b) => a.risk - b.risk)
  return riskScores[0].move
}

/**
 * Speedster bot - rushes to finish line
 */
function makeSpeedsterMove(state, legalMoves) {
  // Always prioritize tokens closest to finish
  const movesByProgress = legalMoves.map(move => {
    const token = state.tokens.find(t => t.id === move.tokenId)
    return {
      move,
      progress: move.to,
      isFinishMove: move.to >= PATH_LENGTH
    }
  })

  // Sort by progress (finish moves first)
  movesByProgress.sort((a, b) => {
    if (a.isFinishMove && !b.isFinishMove) return -1
    if (!a.isFinishMove && b.isFinishMove) return 1
    return b.progress - a.progress
  })

  return movesByProgress[0].move
}

/**
 * Utility functions for bot logic
 */

function makeRandomMove(legalMoves) {
  return legalMoves[Math.floor(Math.random() * legalMoves.length)]
}

function isTokenSafe(state, position) {
  // TODO: Implement safe position checking
  // Consider star cells, home stretch, etc.
  return false
}

function scoreMoveForMediumBot(state, move) {
  // Simplified version of medium bot scoring
  let score = move.to * 2
  
  const capturedTokens = checkForCapture(state.tokens, move)
  if (capturedTokens.length > 0) {
    score += 100 * capturedTokens.length
  }

  return score
}

function assessThreats(state, move) {
  // TODO: Implement threat assessment logic
  // Check if opponents can capture this token next turn
  return 0
}

function calculatePositionalAdvantage(state, move) {
  // TODO: Implement positional scoring
  // Consider board control, piece distribution, etc.
  return 0
}

function isEndgame(state) {
  // Check if any player has 3+ tokens in finish stretch
  const players = [...new Set(state.tokens.map(t => t.playerId))]
  
  return players.some(playerId => {
    const playerTokens = state.tokens.filter(t => t.playerId === playerId)
    const finishTokens = playerTokens.filter(t => t.position >= PATH_LENGTH)
    return finishTokens.length >= 3
  })
}

function calculateEndgameScore(state, move) {
  // TODO: Implement endgame-specific scoring
  // Prioritize finishing tokens, blocking opponents, etc.
  return 0
}

function calculateBlockingScore(state, move) {
  // TODO: Implement blocking logic
  // Score moves that can block opponent progress
  return 0
}

function canThreatenOpponents(state, move) {
  // TODO: Implement threat calculation
  // Check if this move puts opponents at risk
  return false
}

function calculateRiskScore(state, move) {
  // TODO: Implement risk assessment
  // Calculate how likely this token is to be captured
  return Math.random() * 10 // Placeholder
}

/**
 * Bot player creation
 */
export function createBotPlayer(name, difficulty = BOT_DIFFICULTY.MEDIUM, personality = BOT_PERSONALITIES.BALANCED) {
  return {
    id: `bot-${Date.now()}-${Math.random()}`,
    name,
    isBot: true,
    difficulty,
    personality,
    avatar: `/bots/avatar-${personality}.png`,
    created_at: new Date().toISOString()
  }
}

/**
 * Bot names for random selection
 */
export const BOT_NAMES = [
  'RoboLudo', 'DiceBot', 'TokenMaster', 'BoardKing', 'LudoAI',
  'CyberPlayer', 'GameBot', 'SmartDice', 'AutoLudo', 'BotChampion',
  'DigitalDice', 'TechPlayer', 'RoboChamp', 'AILudo', 'BotMaster'
]

/**
 * Get random bot name
 */
export function getRandomBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]
}

/**
 * Bot thinking delay simulation
 */
export function getBotThinkingDelay(difficulty) {
  switch (difficulty) {
    case BOT_DIFFICULTY.EASY:
      return 1000 + Math.random() * 2000 // 1-3 seconds
    case BOT_DIFFICULTY.MEDIUM:
      return 1500 + Math.random() * 2500 // 1.5-4 seconds
    case BOT_DIFFICULTY.HARD:
      return 2000 + Math.random() * 3000 // 2-5 seconds
    default:
      return 1000
  }
}

/**
 * Export for future advanced AI integration
 */
export const AdvancedAI = {
  // Placeholder for machine learning integration
  loadModel: () => Promise.resolve(null),
  predictMove: (state) => Promise.resolve(null),
  trainModel: (gameData) => Promise.resolve(null)
}