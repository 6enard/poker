import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '../types/game';

interface GameStatusProps {
  currentPlayer: Player;
  lastAction: string;
  turnCount: number;
  isAiThinking: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({ 
  currentPlayer, 
  lastAction, 
  turnCount,
  isAiThinking
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-md w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Game Status</h3>
        <span className="text-sm text-gray-500">Turn {turnCount}</span>
      </div>
      
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">Current Player:</span>
          <motion.span
            key={currentPlayer}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentPlayer === 'human' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-purple-100 text-purple-800'
            }`}
          >
            {currentPlayer === 'human' ? 'You' : 'AI'}
            {isAiThinking && currentPlayer === 'ai' && (
              <motion.span
                className="inline-block ml-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  times: [0, 0.5, 1]
                }}
              >
                thinking...
              </motion.span>
            )}
          </motion.span>
        </div>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md">
        <h4 className="text-sm font-medium text-gray-600 mb-1">Last Action:</h4>
        <motion.p
          key={lastAction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm"
        >
          {lastAction}
        </motion.p>
      </div>
    </div>
  );
};

export default GameStatus;