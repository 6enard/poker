import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../types/game';
import { getSuitSymbol, getSuitColor } from '../utils/deck';

interface CardProps {
  card: CardType;
  isPlayable: boolean;
  isFaceDown?: boolean;
  onClick?: (card: CardType) => void;
  scale?: number;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  card, 
  isPlayable, 
  isFaceDown = false, 
  onClick, 
  scale = 1,
  className = ''
}) => {
  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick(card);
    }
  };

  const suitSymbol = getSuitSymbol(card.suit);
  const suitColor = getSuitColor(card.suit);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ 
        width: `${70 * scale}px`, 
        height: `${100 * scale}px` 
      }}
      whileHover={isPlayable ? { scale: 1.05, y: -5 } : {}}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div 
        className={`w-full h-full rounded-lg shadow-md cursor-pointer transform transition-transform duration-150 ${
          isFaceDown 
            ? 'bg-gradient-to-br from-red-800 to-red-900 border-2 border-red-700' 
            : 'bg-white border border-gray-300'
        } ${isPlayable ? 'hover:shadow-lg' : ''}`}
        onClick={handleClick}
      >
        {!isFaceDown && (
          <>
            <div className="absolute top-1 left-2">
              <span className={`font-bold ${suitColor}`}>{card.value}</span>
            </div>
            <div className="absolute bottom-1 right-2 transform rotate-180">
              <span className={`font-bold ${suitColor}`}>{card.value}</span>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center ${suitColor}`}>
              <span className="text-4xl">{suitSymbol}</span>
            </div>
          </>
        )}

        {isFaceDown && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <div className="w-8 h-8 border-2 border-white/40 rounded-full flex items-center justify-center">
              KP
            </div>
          </div>
        )}
      </div>
      
      {isPlayable && !isFaceDown && (
        <motion.div 
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-2 bg-green-500 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
        />
      )}
    </motion.div>
  );
};

export default Card;