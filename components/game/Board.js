'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../GameContext'
import Token from './Token'
import { BOARD_SIZE, COLOR_POSITIONS, STAR_CELLS } from '../../lib/gameRules'

const Board = () => {
  const { state, moveToken } = useGame()
  const [highlightedCells, setHighlightedCells] = useState([])
  const [selectedToken, setSelectedToken] = useState(null)

  // Calculate board layout
  const generateBoardCells = () => {
    const cells = []
    
    // Create 15x15 grid
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cellId = `${row}-${col}`
        const isPath = isPathCell(row, col)
        const isHome = isHomeCell(row, col)
        const isStar = isStarCell(row, col)
        const isStart = isStartCell(row, col)
        const isFinish = isFinishCell(row, col)
        
        cells.push({
          id: cellId,
          row,
          col,
          position: getCellPosition(row, col),
          type: isPath ? 'path' : isHome ? 'home' : 'empty',
          isPath,
          isHome,
          isStar,
          isStart,
          isFinish,
          color: getCellColor(row, col)
        })
      }
    }
    
    return cells
  }

  // Check if cell is part of the main path
  const isPathCell = (row, col) => {
    // Top horizontal path
    if (row === 6 && col >= 1 && col <= 8) return true
    if (row === 7 && col >= 1 && col <= 8) return true
    if (row === 8 && col >= 1 && col <= 8) return true
    
    // Bottom horizontal path
    if (row === 6 && col >= 9 && col <= 13) return true
    if (row === 7 && col >= 9 && col <= 13) return true
    if (row === 8 && col >= 9 && col <= 13) return true
    
    // Left vertical path
    if (col === 6 && row >= 1 && row <= 8) return true
    if (col === 7 && row >= 1 && row <= 8) return true
    if (col === 8 && row >= 1 && row <= 8) return true
    
    // Right vertical path
    if (col === 6 && row >= 9 && row <= 13) return true
    if (col === 7 && row >= 9 && row <= 13) return true
    if (col === 8 && row >= 9 && row <= 13) return true
    
    return false
  }

  // Check if cell is a home area
  const isHomeCell = (row, col) => {
    // Red home (top-left)
    if (row >= 1 && row <= 6 && col >= 1 && col <= 6) return true
    
    // Blue home (top-right)
    if (row >= 1 && row <= 6 && col >= 9 && col <= 14) return true
    
    // Yellow home (bottom-right)
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return true
    
    // Green home (bottom-left)
    if (row >= 9 && row <= 14 && col >= 1 && col <= 6) return true
    
    return false
  }

  // Check if cell is a star (safe) cell
  const isStarCell = (row, col) => {
    const position = getCellPosition(row, col)
    return STAR_CELLS.includes(position)
  }

  // Check if cell is a start cell
  const isStartCell = (row, col) => {
    // Red start
    if (row === 6 && col === 1) return true
    // Blue start
    if (row === 1 && col === 8) return true
    // Yellow start
    if (row === 8 && col === 13) return true
    // Green start
    if (row === 13 && col === 6) return true
    
    return false
  }

  // Check if cell is a finish cell
  const isFinishCell = (row, col) => {
    // Center finish area
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return true
    return false
  }

  // Get cell color based on position
  const getCellColor = (row, col) => {
    // Red area
    if (row >= 1 && row <= 6 && col >= 1 && col <= 6) return 'red'
    
    // Blue area
    if (row >= 1 && row <= 6 && col >= 9 && col <= 14) return 'blue'
    
    // Yellow area
    if (row >= 9 && row <= 14 && col >= 9 && col <= 14) return 'yellow'
    
    // Green area
    if (row >= 9 && row <= 14 && col >= 1 && col <= 6) return 'green'
    
    return 'neutral'
  }

  // Get position number for a cell
  const getCellPosition = (row, col) => {
    // This is a simplified mapping - in a real implementation,
    // you'd need to map each cell to its position on the 52-cell path
    return row * BOARD_SIZE + col
  }

  // Get tokens at a specific position
  const getTokensAtPosition = (position) => {
    return state.tokens.filter(token => token.position === position)
  }

  // Handle cell click
  const handleCellClick = (cell) => {
    if (!state.canMove || !state.lastDiceRoll) return

    const tokensAtCell = getTokensAtPosition(cell.position)
    
    if (tokensAtCell.length > 0 && tokensAtCell[0].playerId === state.currentPlayerId) {
      // Select token
      setSelectedToken(tokensAtCell[0])
      // TODO: Highlight legal moves
    } else if (selectedToken && highlightedCells.includes(cell.position)) {
      // Move selected token
      moveToken(selectedToken.id, cell.position)
      setSelectedToken(null)
      setHighlightedCells([])
    }
  }

  // Handle token click
  const handleTokenClick = (token) => {
    if (token.playerId !== state.currentPlayerId || !state.canMove) return
    
    setSelectedToken(token)
    // TODO: Calculate and highlight legal moves
  }

  const cells = generateBoardCells()

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Board background */}
      <div className="aspect-square bg-wood-texture rounded-lg shadow-2xl border-4 border-wood-dark p-2">
        <div className="grid grid-cols-15 gap-1 h-full">
          {cells.map((cell) => (
            <motion.div
              key={cell.id}
              className={`
                relative border border-wood-dark/30 rounded-sm cursor-pointer
                transition-all duration-200 hover:shadow-lg
                ${cell.type === 'path' ? 'bg-white/90' : ''}
                ${cell.type === 'home' ? `bg-ludo-${cell.color}/20` : ''}
                ${cell.type === 'empty' ? 'bg-wood-light/50' : ''}
                ${cell.isStar ? 'bg-yellow-300 shadow-inner' : ''}
                ${cell.isStart ? 'bg-green-400 shadow-inner' : ''}
                ${cell.isFinish ? 'bg-gradient-to-br from-gold-400 to-gold-600 shadow-inner' : ''}
                ${highlightedCells.includes(cell.position) ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                ${selectedToken && getTokensAtPosition(cell.position).some(t => t.id === selectedToken.id) ? 'ring-2 ring-green-500' : ''}
              `}
              onClick={() => handleCellClick(cell)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Star marker */}
              {cell.isStar && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg"></div>
                </div>
              )}
              
              {/* Start marker */}
              {cell.isStart && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full shadow-lg"></div>
                </div>
              )}
              
              {/* Finish marker */}
              {cell.isFinish && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full shadow-lg"></div>
                </div>
              )}
              
              {/* Tokens */}
              <AnimatePresence>
                {getTokensAtPosition(cell.position).map((token, index) => (
                  <motion.div
                    key={token.id}
                    className={`absolute inset-0 ${index > 0 ? 'transform translate-x-1 translate-y-1' : ''}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Token
                      token={token}
                      isSelected={selectedToken?.id === token.id}
                      onClick={() => handleTokenClick(token)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Board decorations */}
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-wood-dark rounded-full shadow-lg"></div>
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-wood-dark rounded-full shadow-lg"></div>
      <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-wood-dark rounded-full shadow-lg"></div>
      <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-wood-dark rounded-full shadow-lg"></div>
    </div>
  )
}

export default Board