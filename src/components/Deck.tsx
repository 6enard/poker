import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { Card as CardType } from '../types/game';

interface DeckProps {
  cardsLeft: number;
  onDraw: () => void;
  canDraw: boolean;
}

const Deck: React.FC<DeckProps> = ({ cardsLeft, onDraw, canDraw }) => {
  // Create a placeholder card for the deck
  const placeholderCard: CardType = {
    id: 'deck-placeholder',
    suit: 'spades',
    value: 'A',
    isPlayable: false
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-sm font-medium text-gray-700">Deck</h3>
      <div className="relative">
        {cardsLeft > 0 ? (
          <>
            {/* Stack effect */}
            {[...Array(Math.min(3, cardsLeft))].map((_, i) => (
              <div 
                key={`stack-${i}`} 
                className="absolute"
                style={{ 
                  top: `${-i * 1}px`, 
                  left: `${-i * 1}px`,
                  zIndex: 1 - i
                }}
              >
                <Card 
                  card={placeholderCard} 
                  isPlayable={false} 
                  isFaceDown={true} 
                />
              </div>
            ))}
            
            {/* Clickable top card */}
            <motion.div
              whileHover={canDraw ? { scale: 1.05 } : {}}
              className={`relative ${canDraw ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={canDraw ? onDraw : undefined}
            >
              <Card 
                card={placeholderCard} 
                isPlayable={canDraw} 
                isFaceDown={true} 
              />
              
              {canDraw && (
                <motion.div 
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-2 bg-blue-500 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
            </motion.div>
          </>
        ) : (
          <div className="h-[100px] w-[70px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">Empty</span>
          </div>
        )}
      </div>
      <div className="text-sm font-medium">
        {cardsLeft} card{cardsLeft !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default Deck;