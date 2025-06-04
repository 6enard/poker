import { create } from 'zustand';
import { createDeck, dealCards, getStartingCard, shuffleDeck, isNormalCard, canPlayCard, SUITS, isSpecialCard } from '../utils/deck';
import { Card, CardAction, GameState, Player, PendingAction, Suit } from '../types/game';

interface GameStore extends GameState {
  startGame: () => void;
  resetGame: () => void;
  playCard: (cards: Card[], action: CardAction) => void;
  drawCard: () => void;
  setPendingAction: (action: PendingAction | null) => void;
  startAiTurn: () => void;
  isCardPlayable: (card: Card) => boolean;
  toggleCardSelection: (card: Card) => void;
  clearSelectedCards: () => void;
  arrangeCards: (cards: Card[]) => void;
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
  selectedCards: [],
  lastPlayedValue: null,
  lastNormalCard: null,
  requiredSuit: null,
  lastDrawCard: null,
  questionEightPlayed: false
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
      selectedCards: [],
      lastPlayedValue: null,
      lastNormalCard: startCard,
      requiredSuit: null,
      lastDrawCard: null,
      questionEightPlayed: false
    });

    if (get().currentPlayer === 'ai') {
      setTimeout(() => get().startAiTurn(), 500);
    }
  },

  resetGame: () => {
    set(initialState);
  },

  toggleCardSelection: (card: Card) => {
    const { selectedCards, humanHand, discardPile, pendingAction, lastPlayedValue, requiredSuit, questionEightPlayed } = get();
    const topCard = discardPile[discardPile.length - 1];

    if (selectedCards.find(c => c.id === card.id)) {
      set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
      return;
    }

    if (requiredSuit && card.suit !== requiredSuit && card.value !== 'A' && card.value !== '8' && card.value !== 'Q') {
      return;
    }

    if (lastPlayedValue) {
      if (card.value !== lastPlayedValue && card.value !== '8' && card.value !== 'Q') return;
    }

    if (selectedCards.length > 0 && selectedCards[0].value !== card.value) {
      return;
    }

    const isDrawCard = card.value === '2' || card.value === '3';
    const hasDrawCards = selectedCards.some(c => c.value === '2' || c.value === '3');
    
    if ((isDrawCard && hasDrawCards) || (!isDrawCard && selectedCards.length === 0) || (selectedCards.length > 0 && selectedCards[0].value === card.value)) {
      if (canPlayCard(card, topCard, pendingAction)) {
        set({ selectedCards: [...selectedCards, card] });
      }
    }
  },

  arrangeCards: (cards: Card[]) => {
    set({ selectedCards: cards });
  },

  clearSelectedCards: () => {
    set({ selectedCards: [] });
  },

  isCardPlayable: (card: Card) => {
    const { discardPile, pendingAction, currentPlayer, selectedCards, lastPlayedValue, requiredSuit, questionEightPlayed } = get();
    if (currentPlayer !== 'human') return false;
    
    const topCard = discardPile[discardPile.length - 1];

    if (card.value === 'A') return true;

    if (requiredSuit) {
      return card.suit === requiredSuit || card.value === 'A' || card.value === '8' || card.value === 'Q';
    }

    if (lastPlayedValue === '8' || lastPlayedValue === 'Q') {
      return card.value === '8' || card.value === 'Q' || card.suit === topCard.suit;
    }

    if (lastPlayedValue) {
      return card.value === lastPlayedValue;
    }

    if (selectedCards.length > 0) {
      const isDrawCard = card.value === '2' || card.value === '3';
      const hasDrawCards = selectedCards.some(c => c.value === '2' || c.value === '3');
      return isDrawCard ? hasDrawCards : card.value === selectedCards[0].value;
    }

    return canPlayCard(card, topCard, pendingAction);
  },

  playCard: (cards: Card[], action: CardAction) => {
    const { humanHand, discardPile, lastNormalCard, selectedCards, lastDrawCard } = get();
    
    const cardsToPlay = selectedCards.length > 0 ? selectedCards : cards;
    
    const newHand = humanHand.filter(card => !cardsToPlay.some(c => c.id === card.id));
    const newDiscardPile = [...discardPile, ...cardsToPlay];
    
    let newLastAction = `You played ${cardsToPlay.length > 1 ? `${cardsToPlay.length} ${cardsToPlay[0].value}s` : `${cardsToPlay[0].value} of ${cardsToPlay[0].suit}`}`;
    let nextPlayer: Player = 'ai';
    let newPendingAction: PendingAction | null = null;
    let newLastPlayedValue: string | null = null;
    let newLastNormalCard = lastNormalCard;
    let newRequiredSuit: Suit | null = null;
    let newLastDrawCard = lastDrawCard;
    let newQuestionEightPlayed = false;
    
    if (action.type === 'ace') {
      if (lastDrawCard) {
        newRequiredSuit = lastDrawCard.suit;
        newLastAction += ` to counter the draw cards`;
      } else if (action.requestedSuit) {
        newPendingAction = {
          type: 'suitRequest',
          suit: action.requestedSuit
        };
        newLastAction += ` and requested ${action.requestedSuit}`;
        if (lastNormalCard) {
          newLastAction += ` (continuing with ${lastNormalCard.value})`;
        }
      }
    } else if (action.type === 'draw') {
      const totalDraws = cardsToPlay.reduce((sum, card) => sum + (card.value === '2' ? 2 : 3), 0);
      newPendingAction = {
        type: 'drawCards',
        count: totalDraws
      };
      newLastDrawCard = cardsToPlay[0];
      newLastAction += ` - opponent must draw ${totalDraws} cards or counter`;
    } else if (cardsToPlay[0].value === 'J') {
      nextPlayer = 'human';
      newLastAction += ' - play again';
    } else if (cardsToPlay[0].value === '8' || cardsToPlay[0].value === 'Q') {
      nextPlayer = 'human';
      newRequiredSuit = cardsToPlay[0].suit;
      newLastAction += ` - play a ${cardsToPlay[0].suit} card or another ${cardsToPlay[0].value}`;
      newLastPlayedValue = cardsToPlay[0].value;
      newQuestionEightPlayed = true;
    } else if (cardsToPlay[0].value === 'K') {
      newRequiredSuit = cardsToPlay[0].suit;
      newLastAction += ` - next card must be ${cardsToPlay[0].suit}`;
    } else if (!isSpecialCard(cardsToPlay[0].value)) {
      newLastNormalCard = cardsToPlay[0];
      newLastDrawCard = null;
    }
    
    let newGameStatus = get().gameStatus;
    if (newHand.length === 0) {
      if (cardsToPlay.length > 1 && cardsToPlay.every(card => card.value === cardsToPlay[0].value && isNormalCard(card.value)) || 
          (cardsToPlay.length === 1 && isNormalCard(cardsToPlay[0].value))) {
        newGameStatus = 'humanWon';
        newLastAction = 'You won the game!';
      } else {
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
      gameStatus: newGameStatus,
      selectedCards: [],
      lastPlayedValue: newLastPlayedValue,
      lastNormalCard: newLastNormalCard,
      requiredSuit: newRequiredSuit,
      lastDrawCard: newLastDrawCard,
      questionEightPlayed: newQuestionEightPlayed
    });
    
    if (nextPlayer === 'ai' && newGameStatus === 'playing') {
      setTimeout(() => get().startAiTurn(), 500);
    }
  },

  drawCard: () => {
    const { deck, humanHand, currentPlayer, pendingAction } = get();
    
    if (deck.length === 0 || currentPlayer !== 'human') return;
    
    const drawCount = pendingAction?.type === 'drawCards' ? pendingAction.count : 1;
    
    if (deck.length < drawCount) return;
    
    const newCards = deck.slice(0, drawCount);
    const newDeck = deck.slice(drawCount);
    const newHand = [...humanHand, ...newCards];
    
    set({
      deck: newDeck,
      humanHand: newHand,
      lastAction: `You drew ${drawCount} card${drawCount > 1 ? 's' : ''}`,
      currentPlayer: 'ai',
      pendingAction: null,
      drawCount: get().drawCount + drawCount,
      selectedCards: [],
      lastPlayedValue: null,
      requiredSuit: null,
      lastDrawCard: null,
      questionEightPlayed: false
    });
    
    setTimeout(() => get().startAiTurn(), 500);
  },

  setPendingAction: (action: PendingAction | null) => {
    set({ pendingAction: action });
  },

  startAiTurn: () => {
    const { aiHand, discardPile, deck, pendingAction, lastPlayedValue, lastNormalCard, requiredSuit, lastDrawCard, questionEightPlayed } = get();
    
    set({ isAiThinking: true });
    
    setTimeout(() => {
      const topCard = discardPile[discardPile.length - 1];
      
      let playableCards = pendingAction?.type === 'drawCards'
        ? aiHand.filter(card => card.value === '2' || card.value === '3' || card.value === 'A')
        : lastPlayedValue === '8' || lastPlayedValue === 'Q'
          ? aiHand.filter(card => card.value === '8' || card.value === 'Q' || card.suit === topCard.suit)
          : requiredSuit
            ? aiHand.filter(card => card.suit === requiredSuit || card.value === 'A' || card.value === '8' || card.value === 'Q')
            : aiHand.filter(card => canPlayCard(card, topCard, pendingAction));
      
      if (playableCards.length > 0) {
        const cardGroups = playableCards.reduce((groups, card) => {
          const value = card.value;
          if (!groups[value]) groups[value] = [];
          groups[value].push(card);
          return groups;
        }, {} as Record<string, Card[]>);

        let selectedCards: Card[] = [];
        Object.values(cardGroups).forEach(group => {
          if (group.length > selectedCards.length) {
            selectedCards = group;
          }
        });

        if (selectedCards.length === 0) {
          selectedCards = [playableCards[Math.floor(Math.random() * playableCards.length)]];
        }

        const newAiHand = aiHand.filter(card => !selectedCards.some(c => c.id === card.id));
        const newDiscardPile = [...discardPile, ...selectedCards];
        
        let newLastAction = `AI played ${selectedCards.length > 1 ? `${selectedCards.length} ${selectedCards[0].value}s` : `${selectedCards[0].value} of ${selectedCards[0].suit}`}`;
        let nextPlayer: Player = selectedCards[0].value === 'J' || selectedCards[0].value === '8' || selectedCards[0].value === 'Q' ? 'ai' : 'human';
        let newPendingAction: PendingAction | null = null;
        let newLastPlayedValue: string | null = null;
        let newLastNormalCard = lastNormalCard;
        let newRequiredSuit: Suit | null = null;
        let newLastDrawCard = lastDrawCard;
        let newQuestionEightPlayed = questionEightPlayed;
        
        if (selectedCards[0].value === 'A') {
          if (lastDrawCard) {
            newRequiredSuit = lastDrawCard.suit;
            newLastAction += ` to counter the draw cards`;
          } else {
            const requestedSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
            newPendingAction = {
              type: 'suitRequest',
              suit: requestedSuit
            };
            newLastAction += ` and requested ${requestedSuit}`;
            if (lastNormalCard) {
              newLastAction += ` (continuing with ${lastNormalCard.value})`;
            }
          }
        } else if (selectedCards[0].value === '2' || selectedCards[0].value === '3') {
          const totalDraws = selectedCards.reduce((sum, card) => sum + (card.value === '2' ? 2 : 3), 0);
          newPendingAction = {
            type: 'drawCards',
            count: totalDraws
          };
          newLastDrawCard = selectedCards[0];
          newLastAction += ` - you must draw ${totalDraws} cards or counter`;
        } else if (selectedCards[0].value === 'J') {
          newLastAction += ' - AI plays again';
        } else if (selectedCards[0].value === '8' || selectedCards[0].value === 'Q') {
          nextPlayer = 'ai';
          newRequiredSuit = selectedCards[0].suit;
          newLastAction += ` - AI must play a ${selectedCards[0].suit} card or another ${selectedCards[0].value}`;
          newLastPlayedValue = selectedCards[0].value;
          newQuestionEightPlayed = true;
        } else if (selectedCards[0].value === 'K') {
          newRequiredSuit = selectedCards[0].suit;
          newLastAction += ` - next card must be ${selectedCards[0].suit}`;
        } else if (!isSpecialCard(selectedCards[0].value)) {
          newLastNormalCard = selectedCards[0];
          newLastDrawCard = null;
          newQuestionEightPlayed = false;
        }
        
        let newGameStatus = get().gameStatus;
        if (newAiHand.length === 0) {
          if (selectedCards.length > 1 && selectedCards.every(card => card.value === selectedCards[0].value && isNormalCard(card.value)) ||
              (selectedCards.length === 1 && isNormalCard(selectedCards[0].value))) {
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
          isAiThinking: false,
          lastPlayedValue: newLastPlayedValue,
          lastNormalCard: newLastNormalCard,
          requiredSuit: newRequiredSuit,
          lastDrawCard: newLastDrawCard,
          questionEightPlayed: newQuestionEightPlayed
        });

        if (nextPlayer === 'ai' && newGameStatus === 'playing') {
          setTimeout(() => get().startAiTurn(), 500);
        }
      } else {
        if (deck.length === 0) {
          set({
            lastAction: 'AI tried to draw but the deck is empty',
            currentPlayer: 'human',
            isAiThinking: false,
            lastPlayedValue: null,
            requiredSuit: null,
            lastDrawCard: null,
            questionEightPlayed: false
          });
          return;
        }
        
        const drawCount = pendingAction?.type === 'drawCards' ? pendingAction.count : 1;
        const newCards = deck.slice(0, drawCount);
        const newDeck = deck.slice(drawCount);
        const newHand = [...aiHand, ...newCards];
        
        set({
          deck: newDeck,
          aiHand: newHand,
          lastAction: `AI drew ${drawCount} card${drawCount > 1 ? 's' : ''}`,
          currentPlayer: 'human',
          isAiThinking: false,
          drawCount: get().drawCount + drawCount,
          pendingAction: null,
          lastPlayedValue: null,
          requiredSuit: null,
          lastDrawCard: null,
          questionEightPlayed: false
        });
      }
    }, 500);
  }
}));