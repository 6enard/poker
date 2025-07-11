import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card as CardType, CardAction, Suit } from '../types/game';
import { getSuitSymbol } from '../utils/deck';
import { useGameStore } from '../store/gameStore';

interface ActionSelectorProps {
  card: CardType;
  onAction: (cards: CardType[], action: CardAction) => void;
  onCancel: () => void;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({ 
  card, 
  onAction, 
  onCancel 
}) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const selectedCards = useGameStore(state => state.selectedCards);
  const pendingAction = useGameStore(state => state.pendingAction);
  const clearSelectedCards = useGameStore(state => state.clearSelectedCards);
  
  const handleAction = (action: CardAction) => {
    const cardsToPlay = selectedCards.length > 0 ? selectedCards : [card];
    onAction(cardsToPlay, action);
    clearSelectedCards();
  };
  
  const handleCancel = () => {
    clearSelectedCards();
    onCancel();
  };
  
  const renderSuitSelector = () => {
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    return (
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold text-center">Select a suit</h3>
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
            onClick={handleCancel}
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
                handleAction({ type: 'ace', requestedSuit: selectedSuit });
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
    const cards = selectedCards.length > 0 ? selectedCards : [card];
    const value = cards[0].value;
    
    switch (value) {
      case 'A':
        // If there's a pending draw action, play Ace without suit selection
        if (pendingAction?.type === 'drawCards') {
          return (
            <div className="flex flex-col gap-3 items-center">
              <h3 className="text-lg font-medium">Counter Draw Attack</h3>
              <p className="text-sm text-gray-600">Play {cards.length > 1 ? `${cards.length} Aces` : 'Ace'} to counter the draw cards</p>
              
              <div className="flex justify-center gap-3 mt-2">
                <motion.button
                  className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  className="px-4 py-2 bg-blue-600 rounded-md text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAction({ type: 'ace', requestedSuit: null })}
                >
                  Confirm
                </motion.button>
              </div>
            </div>
          );
        }
        return renderSuitSelector();
        
      case '2':
      case '3':
        const totalDraws = cards.reduce((sum, c) => sum + (c.value === '2' ? 2 : 3), 0);
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Draw {totalDraws} Attack</h3>
            <p className="text-sm text-gray-600">
              Playing {cards.length > 1 ? `${cards.length} cards` : 'card'} - opponent will draw {totalDraws} cards
            </p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'draw', count: totalDraws, cards })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
        
      case '8':
      case 'Q':
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Play {cards.length > 1 ? `${cards.length} Cards` : 'Card'}</h3>
            <p className="text-sm text-gray-600">
              Continue playing {cards[0].suit} cards after this
            </p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'question', suit: card.suit })}
              >
                Confirm
              </motion.button>
            </div>
          </div>
        );
        
      case 'J':
        return (
          <div className="flex flex-col gap-3 items-center">
            <h3 className="text-lg font-medium">Skip Turn</h3>
            <p className="text-sm text-gray-600">
              Playing {cards.length > 1 ? `${cards.length} Jacks` : 'Jack'} - play again after this turn
            </p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
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
            <p className="text-sm text-gray-600">
              Playing {cards.length > 1 ? `${cards.length} Kings` : 'King'} - next card must be {cards[0].suit}
            </p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
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
            <h3 className="text-lg font-medium">Play {cards.length > 1 ? `${cards.length} Cards` : 'Card'}</h3>
            <p className="text-sm text-gray-600">
              {cards.length > 1 ? `Playing ${cards.length} ${cards[0].value}s` : `Playing ${cards[0].value} of ${cards[0].suit}`}
            </p>
            
            <div className="flex justify-center gap-3 mt-2">
              <motion.button
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
              >
                Cancel
              </motion.button>
              
              <motion.button
                className="px-4 py-2 bg-blue-600 rounded-md text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction({ type: 'normal', cards })}
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
      onClick={handleCancel}
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