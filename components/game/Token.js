'use client'

import React from 'react'
import { motion } from 'framer-motion'

const Token = ({ token, isSelected, onClick, className = '' }) => {
  const colorClasses = {
    red: 'bg-gradient-to-br from-red-400 to-red-600 border-red-700',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-700',
    yellow: 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-700',
    green: 'bg-gradient-to-br from-green-400 to-green-600 border-green-700'
  }

  return (
    <motion.div
      className={`
        relative w-8 h-8 rounded-full border-2 shadow-lg cursor-pointer
        transition-all duration-200
        ${colorClasses[token.color]}
        ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      animate={isSelected ? { 
        scale: [1, 1.1, 1],
        y: [0, -4, 0]
      } : {}}
      transition={isSelected ? {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      {/* Token shine effect */}
      <div className="absolute inset-1 rounded-full bg-white opacity-30" />
      
      {/* Token center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full shadow-inner" />
      </div>
      
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          className="absolute -inset-2 border-2 border-blue-500 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white opacity-0"
        whileHover={{ opacity: 0.2 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}

export default Token