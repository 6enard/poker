import { create } from 'zustand';
import { createDeck, dealCards, getStartingCard, shuffleDeck, isNormalCard } from '../utils/deck';
import { Card, CardAction, GameState, Player, PendingAction, Suit } from '../types/game';

interface GameStore extends GameState {
  startGame: () => void;
  resetGame: () => void;
  playCard: (card: Card, action?: CardAction) => void;
  drawCard: () => void;
  setPendingAction: (action: PendingAction | null) => void;
  startAiTurn: () => void;
  isCardPlayable: (card: Card) => boolean;
}

const initialState: GameState = {
  deck: [],
  humanHand: [],
  aiHand: [],
  discardPile: [],
  currentPlayer: 'human',
  lastAction: '',
  pendingAction: null,
  gameStatus: 'setup',
  drawCount: 0,
  turnCount: 0,
  isAiThinking: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  startGame: () => {
    let deck = shuffleDeck(createDeck());
    const { cards: humanCards, remainingDeck: deckAfterHuman } = dealCards(deck, 4);
    const { cards: aiCards, remainingDeck: deckAfterAi } = dealCards(deckAfterHuman, 4);
    const { card: startCard, remainingDeck: finalDeck } = getStartingCard(deckAfterAi);
    
    if (!startCard) {
      get().startGame();
      return;
    }
    
    set({
      deck: finalDeck,
      humanHand: humanCards,
      aiHand: aiCards,
      discardPile: [startCard],
      currentPlayer: Math.random() < 0.5 ? 'human' : 'ai',
      gameStatus: 'playing',
      lastAction: 'Game started',
      pendingAction: null,
      drawCount: 0,
      turnCount: 0,
      isAiThinking: false,
    });

    if (get().currentPlayer === 'ai') {
      setTimeout(() => get().startAiTurn(), 1000);
    }
  },

  resetGame: () => {
    set(initialState);
  },

  isCardPlayable: (card: Card) => {
    const { discardPile, pendingAction, currentPlayer } = get();
    
    if (currentPlayer !== 'human') return false;
    
    const topCard = discardPile[discardPile.length - 1];
    
    if (pendingAction) {
      switch (pendingAction.type) {
        case 'suitRequest':
          return card.suit === pendingAction.suit;
          
        case 'questionCard':
          return card.suit === pendingAction.suit || card.value === 'Q' || card.value === '8';
          
        case 'drawCards':
          return (card.value === '2') || 
                 (card.value === '3' && card.suit === topCard.suit);
      }
    }
    
    return card.value === topCard.value || 
           card.value === 'A' || 
           card.value === 'J' || 
           card.value === 'K' ||
           card.value === '2' || 
           card.value === '3' ||
           card.value === 'Q' || 
           card.value === '8';
  },

  playCard: (card: Card, action?: CardAction) => {
    const { humanHand, discardPile, pendingAction } = get();
    
    const cardIndex = humanHand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    
    const newHand = [...humanHand.slice(0, cardIndex), ...humanHand.slice(cardIndex + 1)];
    const newDiscardPile = [...discardPile, card];
    
    let newPendingAction: PendingAction | null = null;
    let newLastAction = `You played ${card.value} of ${card.suit}`;
    let nextPlayer: Player = 'ai';
    
    if (action) {
      switch (action.type) {
        case 'ace':
          newPendingAction = { type: 'suitRequest', suit: action.requestedSuit };
          newLastAction += ` and requested ${action.requestedSuit}`;
          break;
          
        case 'draw':
          newPendingAction = { type: 'drawCards', count: action.count };
          newLastAction += ` - AI must draw ${action.count} cards or counter`;
          break;
          
        case 'question':
          newPendingAction = { type: 'questionCard', suit: action.suit };
          newLastAction += ` - must play ${action.suit}`;
          break;
          
        case 'skip':
          nextPlayer = 'human';
          newLastAction += ` - skipped AI's turn`;
          break;
          
        case 'pass':
          newLastAction += ` - passed turn`;
          break;
      }
    }
    
    let newGameStatus = get().gameStatus;
    if (newHand.length === 0) {
      if (isNormalCard(card.value)) {
        newGameStatus = 'humanWon';
        newLastAction = 'You won the game!';
      } else {
        newHand.push(card);
        newDiscardPile.pop();
        return;
      }
    }
    
    set({
      humanHand: newHand,
      discardPile: newDiscardPile,
      pendingAction: newPendingAction,
      lastAction: newLastAction,
      currentPlayer: nextPlayer,
      turnCount: get().turnCount + 1,
      gameStatus: newGameStatus
    });
    
    if (nextPlayer === 'ai' && newGameStatus === 'playing') {
      setTimeout(() => get().startAiTurn(), 1000);
    }
  },

  drawCard: () => {
    const { deck, humanHand, pendingAction, currentPlayer } = get();
    
    if (deck.length === 0 || currentPlayer !== 'human') return;
    
    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...humanHand, newCard];
    
    let newPendingAction = pendingAction;
    let newLastAction = 'You drew a card';
    let nextPlayer: Player = 'human';
    
    if (pendingAction?.type === 'drawCards') {
      if (pendingAction.count > 1) {
        newPendingAction = { ...pendingAction, count: pendingAction.count - 1 };
        newLastAction = `You drew ${pendingAction.count} cards (${pendingAction.count - 1} remaining)`;
      } else {
        newPendingAction = null;
        nextPlayer = 'ai';
      }
    } else {
      nextPlayer = 'ai';
    }
    
    set({
      deck: newDeck,
      humanHand: newHand,
      pendingAction: newPendingAction,
      lastAction: newLastAction,
      currentPlayer: nextPlayer,
      drawCount: get().drawCount + 1
    });
    
    if (nextPlayer === 'ai') {
      setTimeout(() => get().startAiTurn(), 1000);
    }
  },

  setPendingAction: (action: PendingAction | null) => {
    set({ pendingAction: action });
  },

  startAiTurn: () => {
    const { aiHand, discardPile, pendingAction, deck } = get();
    
    set({ isAiThinking: true });
    
    setTimeout(() => {
      const topCard = discardPile[discardPile.length - 1];
      let playableCards: { card: Card, action?: CardAction }[] = [];
      
      if (pendingAction) {
        switch (pendingAction.type) {
          case 'suitRequest':
            playableCards = aiHand
              .filter(card => card.suit === pendingAction.suit)
              .map(card => ({ card }));
            break;
            
          case 'questionCard':
            playableCards = aiHand
              .filter(card => card.suit === pendingAction.suit || card.value === 'Q' || card.value === '8')
              .map(card => {
                if (card.value === 'Q' || card.value === '8') {
                  return { 
                    card, 
                    action: { type: 'question', suit: card.suit } as CardAction 
                  };
                }
                return { card };
              });
            break;
            
          case 'drawCards':
            playableCards = aiHand
              .filter(card => 
                (card.value === '2') || 
                (card.value === '3' && card.suit === topCard.suit))
              .map(card => ({ 
                card, 
                action: { 
                  type: 'draw', 
                  count: card.value === '2' ? 2 : 3 
                } as CardAction 
              }));
            break;
        }
      } else {
        aiHand.forEach(card => {
          if (card.value === topCard.value) {
            playableCards.push({ card });
          }
          else if (card.value === 'A') {
            const suitCounts = aiHand.reduce((acc, c) => {
              acc[c.suit] = (acc[c.suit] || 0) + 1;
              return acc;
            }, {} as Record<Suit, number>);
            
            let bestSuit: Suit = 'hearts';
            let maxCount = 0;
            
            for (const suit in suitCounts) {
              if (suitCounts[suit as Suit] > maxCount) {
                maxCount = suitCounts[suit as Suit];
                bestSuit = suit as Suit;
              }
            }
            
            playableCards.push({ 
              card, 
              action: { type: 'ace', requestedSuit: bestSuit } as CardAction 
            });
          }
          else if (card.value === 'J') {
            playableCards.push({ 
              card, 
              action: { type: 'skip' } as CardAction 
            });
          }
          else if (card.value === 'K') {
            playableCards.push({ 
              card, 
              action: { type: 'pass' } as CardAction 
            });
          }
          else if (card.value === '2' || card.value === '3') {
            playableCards.push({ 
              card, 
              action: { 
                type: 'draw', 
                count: card.value === '2' ? 2 : 3 
              } as CardAction 
            });
          }
          else if (card.value === 'Q' || card.value === '8') {
            playableCards.push({ 
              card, 
              action: { type: 'question', suit: card.suit } as CardAction 
            });
          }
        });
      }
      
      if (pendingAction?.type === 'suitRequest' && Math.random() < 0.3) {
        playableCards = [];
      }
      
      if (playableCards.length > 0) {
        if (aiHand.length === 2) {
          const winningPlay = playableCards.find(p => isNormalCard(p.card.value));
          if (winningPlay) {
            playableCards = [winningPlay];
          }
        }
        
        const play = playableCards[Math.floor(Math.random() * playableCards.length)];
        
        const cardIndex = aiHand.findIndex(c => c.id === play.card.id);
        const newAiHand = [...aiHand.slice(0, cardIndex), ...aiHand.slice(cardIndex + 1)];
        const newDiscardPile = [...discardPile, play.card];
        
        let newPendingAction: PendingAction | null = null;
        let newLastAction = `AI played ${play.card.value} of ${play.card.suit}`;
        let nextPlayer: Player = 'human';
        
        if (play.action) {
          switch (play.action.type) {
            case 'ace':
              newPendingAction = { 
                type: 'suitRequest', 
                suit: play.action.requestedSuit 
              };
              newLastAction += ` and requested ${play.action.requestedSuit}`;
              break;
              
            case 'draw':
              newPendingAction = { 
                type: 'drawCards', 
                count: play.action.count 
              };
              newLastAction += ` - you must draw ${play.action.count} cards or counter`;
              break;
              
            case 'question':
              newPendingAction = { 
                type: 'questionCard', 
                suit: play.action.suit 
              };
              newLastAction += ` - must play ${play.action.suit}`;
              break;
              
            case 'skip':
              nextPlayer = 'ai';
              newLastAction += ` - skipped your turn`;
              break;
              
            case 'pass':
              newLastAction += ` - passed turn`;
              break;
          }
        }
        
        let newGameStatus = get().gameStatus;
        if (newAiHand.length === 0) {
          if (isNormalCard(play.card.value)) {
            newGameStatus = 'aiWon';
            newLastAction = 'AI won the game!';
          } else {
            return;
          }
        }
        
        set({
          aiHand: newAiHand,
          discardPile: newDiscardPile,
          pendingAction: newPendingAction,
          lastAction: newLastAction,
          currentPlayer: nextPlayer,
          turnCount: get().turnCount + 1,
          gameStatus: newGameStatus,
          isAiThinking: false
        });
        
        if (nextPlayer === 'ai' && newGameStatus === 'playing') {
          setTimeout(() => get().startAiTurn(), 1000);
        }
      } else {
        if (deck.length === 0) {
          set({
            lastAction: 'AI tried to draw but the deck is empty',
            currentPlayer: 'human',
            isAiThinking: false
          });
          return;
        }
        
        const newCard = deck[0];
        const newDeck = deck.slice(1);
        const newHand = [...aiHand, newCard];
        
        let newPendingAction = pendingAction;
        let newLastAction = 'AI drew a card';
        
        if (pendingAction?.type === 'drawCards') {
          if (pendingAction.count > 1) {
            newPendingAction = { ...pendingAction, count: pendingAction.count - 1 };
            newLastAction = `AI drew ${pendingAction.count} cards (${pendingAction.count - 1} remaining)`;
            
            set({
              deck: newDeck,
              aiHand: newHand,
              pendingAction: newPendingAction,
              lastAction: newLastAction,
              isAiThinking: false,
              drawCount: get().drawCount + 1
            });
            
            setTimeout(() => get().startAiTurn(), 500);
            return;
          } else {
            newPendingAction = null;
          }
        }
        
        set({
          deck: newDeck,
          aiHand: newHand,
          pendingAction: newPendingAction,
          lastAction: newLastAction,
          currentPlayer: 'human',
          isAiThinking: false,
          drawCount: get().drawCount + 1
        });
      }
    }, 1500);
  }
}));