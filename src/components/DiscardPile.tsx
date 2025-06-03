import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { Card as CardType } from '../types/game';

interface DiscardPileProps {
  cards: CardType[];
}

const DiscardPile: React.FC<DiscardPileProps> = ({ cards }) => {
  // Show the top 3 cards in the pile, with the most recent on top
  const visibleCards = cards.slice(-3).reverse();

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-sm font-medium text-gray-700">Discard Pile</h3>
      <div className="relative h-28 w-20">
        {visibleCards.map((card, index) => {
          const isTopCard = index === 0;
          const zIndex = visibleCards.length - index;
          
          return (
            <motion.div
              key={card.id}
              className="absolute"
              initial={{ 
                x: 200, 
                y: -100, 
                opacity: 0, 
                rotateZ: Math.random() * 20 - 10 
              }}
              animate={{ 
                x: 0, 
                y: 0, 
                opacity: 1, 
                rotateZ: (Math.random() * 6 - 3) 
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                duration: 0.5
              }}
              style={{
                zIndex,
                top: `${index * 3}px`,
                left: `${index * 2}px`,
              }}
            >
              <Card
                card={card}
                isPlayable={false}
                scale={isTopCard ? 1 : 0.95}
                className={isTopCard ? 'ring-2 ring-yellow-400 ring-opacity-70' : ''}
              />
            </motion.div>
          );
        })}
        
        {cards.length > 3 && (
          <div className="absolute -bottom-5 left-0 text-xs text-gray-500">
            +{cards.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscardPile;