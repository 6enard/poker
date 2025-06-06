import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Card as CardType, CardAction } from '../types/game';
import Hand from './Hand';
import DiscardPile from './DiscardPile';
import Deck from './Deck';
import GameStatus from './GameStatus';
import ActionSelector from './ActionSelector';
import { Play, RotateCcw, Plus, PlaySquare } from 'lucide-react';

const GameBoard: React.FC = () => {
  const {
    deck,
    humanHand,
    aiHand,
    discardPile,
    currentPlayer,
    lastAction,
    pendingAction,
    gameStatus,
    turnCount,
    isAiThinking,
    isCardPlayable,
    playCard,
    drawCard,
    startGame,
    resetGame,
    requiredSuit,
    lastPlayedValue
  } = useGameStore();
  
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  
  const handleCardClick = (card: CardType) => {
    if (isCardPlayable(card)) {
      setSelectedCard(card);
    }
  };
  
  const handleAction = (cards: CardType[], action: CardAction) => {
    playCard(cards, action);
    setSelectedCard(null);
  };
  
  const handleDrawCard = () => {
    if (pendingAction?.type === 'drawCards') {
      // Automatically draw the required number of cards
      for (let i = 0; i < pendingAction.count; i++) {
        drawCard();
      }
    } else {
      drawCard();
    }
  };

  const getCurrentRequirement = () => {
    if (pendingAction?.type === 'drawCards') {
      return `Draw ${pendingAction.count} cards or counter with 2/3/A`;
    }
    if (requiredSuit) {
      return `Play a ${requiredSuit} card or Ace`;
    }
    if (lastPlayedValue === 'Q') {
      const topCard = discardPile[discardPile.length - 1];
      return `Play a ${topCard.suit} card, another Q, or an 8 of ${topCard.suit}`;
    }
    if (lastPlayedValue === '8') {
      const topCard = discardPile[discardPile.length - 1];
      return `Play a ${topCard.suit} card, another 8, or a Q`;
    }
    return null;
  };
  
  const renderGameContent = () => {
    if (gameStatus === 'setup') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold mb-2 text-red-900">🃏 Kenyan Poker</h1>
            <p className="text-gray-600 mb-6">A Kenyan twist on classic card gameplay</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-lg max-w-lg"
          >
            <h2 className="text-xl font-semibold mb-4">How to Play</h2>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Take turns playing cards that match the value or suit of the last card</li>
              <li>Use special power cards strategically</li>
              <li>If you can't play, draw a card and skip your turn</li>
              <li>First player to get rid of all cards wins</li>
              <li>You can only win with a normal number card (4, 5, 6, 7, 9, or 10)</li>
            </ul>
            
            <div className="mt-6 flex justify-center">
              <motion.button
                className="px-6 py-3 bg-red-800 text-white rounded-lg font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
              >
                <Play size={20} />
                Start Game
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }
    
    if (gameStatus === 'humanWon' || gameStatus === 'aiWon') {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 15
            }}
            className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"
          >
            <h1 className="text-3xl font-bold mb-4">
              {gameStatus === 'humanWon' ? '🎉 You Won!' : '😔 AI Won!'}
            </h1>
            <p className="text-gray-600 mb-6">
              {gameStatus === 'humanWon' 
                ? 'Congratulations! You mastered Kenyan Poker!' 
                : 'Better luck next time! The AI outplayed you.'}
            </p>
            
            <div className="mt-6">
              <motion.button
                className="px-6 py-3 bg-red-800 text-white rounded-lg font-medium flex items-center gap-2 mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
              >
                <RotateCcw size={20} />
                Play Again
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col h-full">
        {/* Game Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6">
          {/* AI Hand */}
          <div className="flex justify-center">
            <Hand 
              cards={aiHand} 
              isPlayable={() => false} 
              isVisible={false}
              title="Opponent"
            />
          </div>
          
          {/* Game Status */}
          <div className="flex justify-center">
            <GameStatus
              currentPlayer={currentPlayer}
              lastAction={lastAction}
              turnCount={turnCount}
              isAiThinking={isAiThinking}
            />
          </div>
          
          {/* Empty space for balance */}
          <div className="hidden md:block"></div>
        </div>
        
        {/* Game Board */}
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16">
            <div className="flex justify-center items-center">
              <Deck 
                cardsLeft={deck.length} 
                onDraw={handleDrawCard}
                canDraw={currentPlayer === 'human' && !isAiThinking}
              />
            </div>
            
            <div className="flex justify-center items-center">
              {discardPile.length > 0 && (
                <DiscardPile cards={discardPile} />
              )}
            </div>
            
            <div className="col-span-2 md:col-span-1 flex justify-center items-center">
              {getCurrentRequirement() && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm max-w-xs text-center">
                  <div className="font-semibold text-amber-800 mb-1">Current Requirement:</div>
                  <div className="text-amber-700">{getCurrentRequirement()}</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Player Area */}
        <div className="relative pb-24">
          {/* Player's Hand */}
          <div className="flex justify-center mb-20">
            <Hand 
              cards={humanHand} 
              isPlayable={isCardPlayable}
              onCardClick={handleCardClick}
              title="Your Hand"
            />
          </div>

          {/* Action Buttons */}
          {currentPlayer === 'human' && !isAiThinking && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
              <div className="container max-w-md mx-auto flex gap-4">
                <motion.button
                  className="flex-1 py-3 px-4 bg-red-800 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDrawCard}
                  disabled={deck.length === 0}
                >
                  <Plus size={20} />
                  {pendingAction?.type === 'drawCards' 
                    ? `Draw ${pendingAction.count} Cards` 
                    : 'Draw Card'}
                </motion.button>
                <motion.button
                  className="flex-1 py-3 px-4 bg-emerald-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const playableCard = humanHand.find(card => isCardPlayable(card));
                    if (playableCard) {
                      handleCardClick(playableCard);
                    }
                  }}
                  disabled={!humanHand.some(card => isCardPlayable(card))}
                >
                  <PlaySquare size={20} />
                  Play Card
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-red-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto h-[calc(100vh-2rem)]">
        {renderGameContent()}
        
        <AnimatePresence>
          {selectedCard && (
            <ActionSelector
              card={selectedCard}
              onAction={handleAction}
              onCancel={() => setSelectedCard(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GameBoard;