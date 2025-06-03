import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, CardAction, Suit } from '../types/game';
import { getSuitSymbol } from '../utils/deck';

interface ActionSelectorProps {
  card: CardType;
  onAction: (card: CardType, action: CardAction) => void;
  onCancel: () => void;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({ 
  card, 
  onAction, 
  onCancel 
}) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  
  const handleAction = (action: CardAction) => {
    onAction(card, action);
  };
  
  const renderSuitSelector = () => {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-medium text-center">Select a suit</h3>
        <div className="flex justify-center gap-3">
          {suits.map(suit => (
            <motion.button
              key={suit}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl 
                ${suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-900'}
                ${selectedSuit === suit ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white border border-gray-300'}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSuit(suit)}
            >
              {getSuitSymbol(suit)}
            </motion.button>
          ))}
        </div>
        
        <div className="flex justify-center gap-3 mt-2">
          <motion.button
            className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
          >
            Cancel
          </motion.button>
          
          <motion.button
            className={`px-4 py-2 rounded-md ${
              selectedSuit 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileHover={selectedSuit ? { scale: 1.05 } : {}}
            whileTap={selectedSuit ? { scale: 0.95 } : {}}
            onClick={() => {
              if (selectedSuit) {
                if (card.value === 'A') {
                  handleAction({ type: 'ace', requestedSuit: selectedSuit });
                } else if (card.value === 'Q' || card.value === '8') {
                  handleAction({ type: 'question', suit: selectedSuit });
                }
              }
            }}
            disabled={!selectedSuit}
          >
            Confirm
          </motion.button>
        </div>
      </div>
    );
  };
  
  const renderActionSelector = () => {
    // Different actions based on card value
    switch (card.value) {
      case 'A':
        return renderSuitSelector();
        
      case '2':
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Draw 2 Attack</h3>
            <p className="text-sm text-gray-600">Your opponent will draw 2 cards</p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'draw', count: 2 })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
        
      case '3':
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Draw 3 Attack</h3>
            <p className="text-sm text-gray-600">Your opponent will draw 3 cards</p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'draw', count: 3 })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
        
      case '8':
      case 'Q':
        return renderSuitSelector();
        
      case 'J':
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Skip Turn</h3>
            <p className="text-sm text-gray-600">Skip your opponent's turn</p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'skip' })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
        
      case 'K':
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Pass Turn</h3>
            <p className="text-sm text-gray-600">End your turn immediately</p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'pass' })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
        
      default:
        // Normal card
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Play Card</h3>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'normal' })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div 
        className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {renderActionSelector()}
      </motion.div>
    </motion.div>
  );
};

export default ActionSelector;