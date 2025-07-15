/**
 * CORE LUDO GAME RULES
 * Complete implementation of Ludo game logic with all modes and variations
 */

// Constants
export const BOARD_SIZE = 15
export const PATH_LENGTH = 52
export const HOME_STRETCH_LENGTH = 6
export const STAR_CELLS = [8, 21, 34, 47] // Safe spots on the main path
export const MAX_CONSECUTIVE_SIXES = 3
export const CAPTURE_BONUS_STEPS = 2

// Game Modes
export const GAME_MODES = {
  CLASSIC: 'classic',
  SPEED: 'speed',
  QUICK: 'quick'
}

// Turn timers by mode
export const TURN_TIMERS = {
  [GAME_MODES.CLASSIC]: 15000, // 15 seconds
  [GAME_MODES.SPEED]: 10000,   // 10 seconds
  [GAME_MODES.QUICK]: 5000     // 5 seconds
}

// Color positions on board
export const COLOR_POSITIONS = {
  red: { start: 0, home: [1, 2, 3, 4, 5, 6] },
  blue: { start: 13, home: [14, 15, 16, 17, 18, 19] },
  yellow: { start: 26, home: [27, 28, 29, 30, 31, 32] },
  green: { start: 39, home: [40, 41, 42, 43, 44, 45] }
}

/**
 * Roll dice with physics simulation
 */
export function rollDice() {
  return Math.floor(Math.random() * 6) + 1
}

/**
 * Check if a token can leave home base
 */
export function canLeaveHome(diceValue, mode) {
  if (mode === GAME_MODES.QUICK) {
    return true // In quick mode, all tokens start on board
  }
  return diceValue === 6 // Classic and speed modes require exact 6
}

/**
 * Check if a token can enter finish line
 */
export function canEnterFinish(currentPosition, diceValue, mode) {
  const distanceToFinish = PATH_LENGTH - currentPosition
  
  if (mode === GAME_MODES.QUICK) {
    return diceValue >= distanceToFinish // Allow overshoot in quick mode
  }
  
  return diceValue === distanceToFinish // Exact roll required for classic/speed
}

/**
 * Check if a cell is a safe star spot
 */
export function isSafeCell(position) {
  return STAR_CELLS.includes(position)
}

/**
 * Get all legal moves for current player
 */
export function getLegalMoves(tokens, diceValue, mode, currentPlayerId) {
  const playerTokens = tokens.filter(token => token.playerId === currentPlayerId)
  const legalMoves = []

  for (const token of playerTokens) {
    // Token in home
    if (token.position === -1) {
      if (canLeaveHome(diceValue, mode)) {
        const startPosition = COLOR_POSITIONS[token.color].start
        legalMoves.push({
          tokenId: token.id,
          from: -1,
          to: startPosition
        })
      }
      continue
    }

    // Token on main path
    if (token.position < PATH_LENGTH) {
      const newPosition = token.position + diceValue
      
      // Check if can finish
      if (newPosition >= PATH_LENGTH) {
        if (canEnterFinish(token.position, diceValue, mode)) {
          legalMoves.push({
            tokenId: token.id,
            from: token.position,
            to: PATH_LENGTH + (newPosition - PATH_LENGTH)
          })
        }
      } else {
        // Normal move on path
        legalMoves.push({
          tokenId: token.id,
          from: token.position,
          to: newPosition
        })
      }
    }

    // Token in finish stretch
    if (token.position >= PATH_LENGTH && token.position < PATH_LENGTH + HOME_STRETCH_LENGTH) {
      const newPosition = token.position + diceValue
      if (newPosition <= PATH_LENGTH + HOME_STRETCH_LENGTH) {
        legalMoves.push({
          tokenId: token.id,
          from: token.position,
          to: newPosition
        })
      }
    }
  }

  return legalMoves
}

/**
 * Check for token capture
 */
export function checkForCapture(tokens, move) {
  const capturedTokens = []
  
  // Skip if landing on safe cell
  if (isSafeCell(move.to)) {
    return capturedTokens
  }

  // Find tokens at destination that belong to other players
  const movingToken = tokens.find(t => t.id === move.tokenId)
  const tokensAtDestination = tokens.filter(t => 
    t.position === move.to && 
    t.playerId !== movingToken.playerId
  )

  tokensAtDestination.forEach(token => {
    capturedTokens.push(token.id)
  })

  return capturedTokens
}

/**
 * Apply a move to game state
 */
export function applyMove(state, move, skipAnimations = false) {
  const newState = { ...state }
  const tokens = [...newState.tokens]
  
  // Update token position
  const tokenIndex = tokens.findIndex(t => t.id === move.tokenId)
  if (tokenIndex !== -1) {
    tokens[tokenIndex] = { ...tokens[tokenIndex], position: move.to }
  }

  // Check for captures
  const capturedTokenIds = checkForCapture(tokens, move)
  
  // Reset captured tokens to home
  capturedTokenIds.forEach(tokenId => {
    const capturedTokenIndex = tokens.findIndex(t => t.id === tokenId)
    if (capturedTokenIndex !== -1) {
      tokens[capturedTokenIndex] = { ...tokens[capturedTokenIndex], position: -1 }
    }
  })

  newState.tokens = tokens
  newState.lastMove = move
  newState.capturedTokens = capturedTokenIds

  // Award bonus for capture
  if (capturedTokenIds.length > 0) {
    newState.bonusSteps = CAPTURE_BONUS_STEPS
  }

  return newState
}

/**
 * Handle consecutive sixes logic
 */
export function handleConsecutiveSixes(state, diceValue) {
  const newState = { ...state }
  
  if (diceValue === 6) {
    newState.consecutiveSixCount = (state.consecutiveSixCount || 0) + 1
    
    if (newState.consecutiveSixCount >= MAX_CONSECUTIVE_SIXES) {
      // Forfeit turn
      newState.turnForfeited = true
      newState.consecutiveSixCount = 0
      return newState
    }
  } else {
    newState.consecutiveSixCount = 0
  }

  return newState
}

/**
 * Check if game is over
 */
export function checkGameOver(tokens, playerId) {
  const playerTokens = tokens.filter(t => t.playerId === playerId)
  const finishedTokens = playerTokens.filter(t => t.position === PATH_LENGTH + HOME_STRETCH_LENGTH)
  
  return finishedTokens.length === 4 // All 4 tokens reached finish
}

/**
 * Get next player in turn order
 */
export function getNextPlayer(players, currentPlayerId) {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId)
  const nextIndex = (currentIndex + 1) % players.length
  return players[nextIndex].id
}

/**
 * Bot AI logic - basic heuristic
 */
export function evaluateBotMove(state, diceValue, mode) {
  const legalMoves = getLegalMoves(state.tokens, diceValue, mode, state.currentPlayerId)
  
  if (legalMoves.length === 0) {
    return null
  }

  // Priority 1: Capture opponent tokens
  for (const move of legalMoves) {
    const capturedTokens = checkForCapture(state.tokens, move)
    if (capturedTokens.length > 0) {
      return move
    }
  }

  // Priority 2: Move token closest to finish
  const scoredMoves = legalMoves.map(move => ({
    move,
    score: move.to // Higher position = closer to finish
  }))

  scoredMoves.sort((a, b) => b.score - a.score)

  // Priority 3: Random selection if tied
  const topScore = scoredMoves[0].score
  const topMoves = scoredMoves.filter(m => m.score === topScore)
  
  return topMoves[Math.floor(Math.random() * topMoves.length)].move
}

/**
 * Generate initial game state
 */
export function createInitialGameState(players, mode) {
  const tokens = []
  const colors = ['red', 'blue', 'yellow', 'green']
  
  players.forEach((player, index) => {
    const color = colors[index]
    const startPosition = mode === GAME_MODES.QUICK ? COLOR_POSITIONS[color].start : -1
    
    // Create 4 tokens per player
    for (let i = 0; i < 4; i++) {
      tokens.push({
        id: `${player.id}-${i}`,
        playerId: player.id,
        color,
        position: startPosition
      })
    }
  })

  return {
    tokens,
    currentPlayerId: players[0].id,
    players,
    mode,
    lastDiceRoll: null,
    consecutiveSixCount: 0,
    turnStartTime: Date.now(),
    gameStartTime: Date.now(),
    status: 'playing'
  }
}

/**
 * Auto-move logic for turn timer expiration
 */
export function handleAutoMove(state, diceValue, mode) {
  const legalMoves = getLegalMoves(state.tokens, diceValue, mode, state.currentPlayerId)
  
  if (legalMoves.length === 0) {
    return null // Pass turn
  }

  if (legalMoves.length === 1) {
    return legalMoves[0] // Only one option
  }

  // Use bot logic for multiple options
  return evaluateBotMove(state, diceValue, mode)
}

/**
 * Validate move legality
 */
export function isValidMove(state, move, diceValue, mode) {
  const legalMoves = getLegalMoves(state.tokens, diceValue, mode, state.currentPlayerId)
  
  return legalMoves.some(legal => 
    legal.tokenId === move.tokenId &&
    legal.from === move.from &&
    legal.to === move.to
  )
}

/**
 * Calculate player statistics
 */
export function calculatePlayerStats(tokens, playerId) {
  const playerTokens = tokens.filter(t => t.playerId === playerId)
  
  return {
    tokensInHome: playerTokens.filter(t => t.position === -1).length,
    tokensOnBoard: playerTokens.filter(t => t.position >= 0 && t.position < PATH_LENGTH).length,
    tokensInFinish: playerTokens.filter(t => t.position >= PATH_LENGTH).length,
    tokensFinished: playerTokens.filter(t => t.position === PATH_LENGTH + HOME_STRETCH_LENGTH).length,
    totalProgress: playerTokens.reduce((sum, token) => sum + Math.max(0, token.position), 0)
  }
}

// Export game state type for TypeScript
export const GameStateType = {
  tokens: 'Token[]',
  currentPlayerId: 'string',
  players: 'Player[]',
  mode: 'string',
  lastDiceRoll: 'number',
  consecutiveSixCount: 'number',
  turnStartTime: 'number',
  gameStartTime: 'number',
  status: 'string'
}