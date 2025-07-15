'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../GameContext'

const Dice = () => {
  const { state, rollDice } = useGame()
  const [isAnimating, setIsAnimating] = useState(false)

  // Dice faces for 3D effect
  const diceFaces = [
    { value: 1, dots: [[2, 2]] },
    { value: 2, dots: [[1, 1], [3, 3]] },
    { value: 3, dots: [[1, 1], [2, 2], [3, 3]] },
    { value: 4, dots: [[1, 1], [1, 3], [3, 1], [3, 3]] },
    { value: 5, dots: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]] },
    { value: 6, dots: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]] }
  ]

  const handleDiceRoll = async () => {
    if (state.isRolling || !state.canMove || state.currentPlayerId !== state.currentUserId) return

    setIsAnimating(true)
    await rollDice()
    
    setTimeout(() => {
      setIsAnimating(false)
    }, state.settings.skipAnimations ? 100 : 1000)
  }

  const DiceFace = ({ face, isVisible }) => (
    <div
      className={`
        absolute w-16 h-16 bg-gradient-to-br from-white to-gray-100 
        border-2 border-gray-300 rounded-lg shadow-lg
        flex items-center justify-center
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-300
      `}
    >
      <div className="grid grid-cols-3 gap-1 w-12 h-12">
        {Array.from({ length: 9 }).map((_, index) => {
          const row = Math.floor(index / 3) + 1
          const col = (index % 3) + 1
          const hasDot = face.dots.some(([r, c]) => r === row && c === col)
          
          return (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${hasDot ? 'bg-gray-800 shadow-inner' : 'bg-transparent'}
              `}
            />
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Dice container */}
      <div className="relative">
        <motion.div
          className="relative w-16 h-16 cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDiceRoll}
          animate={isAnimating ? {
            rotateX: [0, 360, 720, 1080],
            rotateY: [0, 360, 720, 1080],
            rotateZ: [0, 180, 360, 540]
          } : {}}
          transition={
            isAnimating ? {
              duration: state.settings.skipAnimations ? 0.1 : 1,
              ease: "easeOut"
            } : {}
          }
        >
          {/* Show current dice value or rolling animation */}
          {!isAnimating && state.lastDiceRoll && (
            <DiceFace 
              face={diceFaces[state.lastDiceRoll - 1]} 
              isVisible={true}
            />
          )}
          
          {/* Rolling animation - show random faces */}
          {isAnimating && (
            <AnimatePresence>
              {diceFaces.map((face, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.1 }}
                >
                  <DiceFace face={face} isVisible={true} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          
          {/* Default state */}
          {!isAnimating && !state.lastDiceRoll && (
            <DiceFace face={diceFaces[0]} isVisible={true} />
          )}
        </motion.div>
        
        {/* Glow effect */}
        {state.canMove && !isAnimating && (
          <motion.div
            className="absolute inset-0 bg-blue-400 rounded-lg opacity-30"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      
      {/* Dice button */}
      <motion.button
        className={`
          px-6 py-3 rounded-lg font-semibold text-white shadow-lg
          transition-all duration-200 disabled:opacity-50
          ${state.canMove && !isAnimating 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
            : 'bg-gray-400 cursor-not-allowed'
          }
        `}
        onClick={handleDiceRoll}
        disabled={state.isRolling || !state.canMove || state.currentPlayerId !== state.currentUserId}
        whileHover={state.canMove ? { scale: 1.05 } : {}}
        whileTap={state.canMove ? { scale: 0.95 } : {}}
      >
        {isAnimating ? 'Rolling...' : 'Roll Dice'}
      </motion.button>
      
      {/* Dice result display */}
      {state.lastDiceRoll && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-2xl font-bold text-gray-800">
            {state.lastDiceRoll}
          </div>
          <div className="text-sm text-gray-600">
            {state.lastDiceRoll === 6 ? 'Roll again!' : 'Move your token'}
          </div>
        </motion.div>
      )}
      
      {/* Consecutive sixes indicator */}
      {state.consecutiveSixCount > 0 && (
        <motion.div
          className="flex items-center space-x-2 bg-yellow-100 border border-yellow-400 rounded-lg px-3 py-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-yellow-800 font-medium">
            Consecutive 6s: {state.consecutiveSixCount}/3
          </div>
          {state.consecutiveSixCount === 2 && (
            <div className="text-xs text-yellow-600">
              One more and you lose your turn!
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default Dice