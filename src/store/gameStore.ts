import { create } from 'zustand';
import { createDeck, dealCards, getStartingCard, shuffleDeck, isNormalCard, canPlayCard } from '../utils/deck';
import { Card, CardAction, GameState, Player, PendingAction, Suit } from '../types/game';

interface GameStore extends GameState {
  startGame: () => void;
  resetGame: () => void;
  playCard: (card: Card) => void;
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
    return canPlayCard(card, topCard, pendingAction);
  },

  playCard: (card: Card) => {
    const { humanHand, discardPile } = get();
    
    const cardIndex = humanHand.findIndex(c => c.id === card.id);
    if (cardIndex === -1) return;
    
    const newHand = [...humanHand.slice(0, cardIndex), ...humanHand.slice(cardIndex + 1)];
    const newDiscardPile = [...discardPile, card];
    
    let newLastAction = `You played ${card.value} of ${card.suit}`;
    let nextPlayer: Player = 'ai';
    
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
      pendingAction: null,
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
    const { deck, humanHand, currentPlayer } = get();
    
    // Only allow drawing if it's the human's turn and there are cards in the deck
    if (deck.length === 0 || currentPlayer !== 'human') return;
    
    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...humanHand, newCard];
    
    set({
      deck: newDeck,
      humanHand: newHand,
      lastAction: 'You drew a card',
      currentPlayer: 'ai',
      drawCount: get().drawCount + 1
    });
    
    setTimeout(() => get().startAiTurn(), 1000);
  },

  setPendingAction: (action: PendingAction | null) => {
    set({ pendingAction: action });
  },

  startAiTurn: () => {
    const { aiHand, discardPile, deck } = get();
    
    set({ isAiThinking: true });
    
    setTimeout(() => {
      const topCard = discardPile[discardPile.length - 1];
      let playableCards = aiHand.filter(card => canPlayCard(card, topCard, null));
      
      if (playableCards.length > 0) {
        // AI tries to win if possible
        if (aiHand.length === 1) {
          const winningCard = playableCards.find(card => isNormalCard(card.value));
          if (winningCard) {
            playableCards = [winningCard];
          }
        }
        
        const play = playableCards[Math.floor(Math.random() * playableCards.length)];
        const cardIndex = aiHand.findIndex(c => c.id === play.id);
        const newAiHand = [...aiHand.slice(0, cardIndex), ...aiHand.slice(cardIndex + 1)];
        const newDiscardPile = [...discardPile, play];
        
        let newLastAction = `AI played ${play.value} of ${play.suit}`;
        let nextPlayer: Player = 'human';
        
        let newGameStatus = get().gameStatus;
        if (newAiHand.length === 0) {
          if (isNormalCard(play.value)) {
            newGameStatus = 'aiWon';
            newLastAction = 'AI won the game!';
          } else {
            return;
          }
        }
        
        set({
          aiHand: newAiHand,
          discardPile: newDiscardPile,
          pendingAction: null,
          lastAction: newLastAction,
          currentPlayer: nextPlayer,
          turnCount: get().turnCount + 1,
          gameStatus: newGameStatus,
          isAiThinking: false
        });
      } else {
        // AI must draw a card
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
        
        set({
          deck: newDeck,
          aiHand: newHand,
          lastAction: 'AI drew a card',
          currentPlayer: 'human',
          isAiThinking: false,
          drawCount: get().drawCount + 1
        });
      }
    }, 1500);
  }
}));