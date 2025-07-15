'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../GameContext'
import { TURN_TIMERS } from '../../lib/gameRules'

const TurnTimer = ({ duration, onExpire }) => {
  const { state } = useGame()
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (state.currentPlayerId === state.currentUserId && state.status === 'playing') {
      setIsActive(true)
      setTimeLeft(TURN_TIMERS[state.mode] || duration)
    } else {
      setIsActive(false)
    }
  }, [state.currentPlayerId, state.currentUserId, state.status, state.mode, duration])

  useEffect(() => {
    let interval = null

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 100)
      }, 100)
    } else if (timeLeft <= 0 && isActive) {
      onExpire()
      setIsActive(false)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft, onExpire])

  const percentage = (timeLeft / duration) * 100
  const isWarning = percentage <= 30
  const isCritical = percentage <= 10

  if (!isActive) return null

  return (
    <div className="flex items-center justify-center space-x-4">
      {/* Circular progress indicator */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="4"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
            animate={{
              strokeDashoffset: `${2 * Math.PI * 28 * (1 - percentage / 100)}`
            }}
            transition={{ duration: 0.1 }}
          />
        </svg>
        
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${
            isCritical ? 'text-red-600' : 
            isWarning ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {Math.ceil(timeLeft / 1000)}
          </span>
        </div>
      </div>
      
      {/* Timer text */}
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700">
          Your Turn
        </div>
        <div className={`text-xs ${
          isCritical ? 'text-red-600' : 
          isWarning ? 'text-yellow-600' : 
          'text-gray-500'
        }`}>
          {Math.ceil(timeLeft / 1000)}s remaining
        </div>
      </div>
      
      {/* Pulsing warning */}
      {isCritical && (
        <motion.div
          className="absolute inset-0 border-2 border-red-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

export default TurnTimer