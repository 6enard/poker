import React from 'react';
import Card from './Card';
import { Card as CardType } from '../types/game';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

interface HandProps {
  cards: CardType[];
  isPlayable: (card: CardType) => boolean;
  onCardClick?: (card: CardType) => void;
  isVisible?: boolean;
  title?: string;
}

const Hand: React.FC<HandProps> = ({ 
  cards, 
  isPlayable, 
  onCardClick, 
  isVisible = true,
  title
}) => {
  const selectedCards = useGameStore(state => state.selectedCards);
  
  // Calculate the spread width based on number of cards
  const getSpreadWidth = () => {
    // Base width per card, reduced for larger hands
    const baseWidth = Math.max(30, 60 - cards.length * 3);
    return baseWidth * (cards.length - 1);
  };

  const spreadWidth = getSpreadWidth();

  return (
    <div className="flex flex-col items-center gap-2">
      {title && (
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      )}
      <motion.div 
        className="relative h-28"
        style={{ width: `${Math.max(70, 70 + spreadWidth)}px` }}
      >
        {cards.map((card, index) => {
          // Calculate position in the spread
          const offset = cards.length > 1 
            ? (index / (cards.length - 1) - 0.5) * spreadWidth 
            : 0;
          
          const isSelected = selectedCards.some(c => c.id === card.id);
          
          return (
            <div 
              key={card.id} 
              className="absolute top-0"
              style={{ 
                left: '50%',
                transform: `translateX(calc(-50% + ${offset}px)) rotate(${(index - cards.length / 2) * 2}deg) translateY(${isSelected ? '-20px' : '0'})`,
                zIndex: index
              }}
            >
              <Card 
                card={card} 
                isPlayable={isVisible && isPlayable(card)} 
                isFaceDown={!isVisible}
                onClick={onCardClick}
                isSelected={isSelected}
              />
            </div>
          );
        })}
      </motion.div>
      <motion.div 
        className="text-sm font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {cards.length} card{cards.length !== 1 ? 's' : ''}
      </motion.div>
    </div>
  );
};