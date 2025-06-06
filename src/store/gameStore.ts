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

const reshuffleDeck = (discardPile: Card[]): { newDeck: Card[], newDiscardPile: Card[] } => {
  // Keep the top card
  const topCard = discardPile[discardPile.length - 1];
  // Get all other cards to reshuffle
  const cardsToShuffle = discardPile.slice(0, -1);
  // Shuffle the remaining cards
  const newDeck = shuffleDeck(cardsToShuffle);
  // Return new deck and discard pile with only the top card
  return {
    newDeck,
    newDiscardPile: [topCard]
  };
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
    const { selectedCards, discardPile, pendingAction, lastPlayedValue, requiredSuit } = get();
    const topCard = discardPile[discardPile.length - 1];

    // If clicking on an already selected card, remove it
    if (selectedCards.find(c => c.id === card.id)) {
      set({ selectedCards: selectedCards.filter(c => c.id !== card.id) });
      return;
    }

    // If selecting a different value, clear previous selection
    if (selectedCards.length > 0 && selectedCards[0].value !== card.value) {
      set({ selectedCards: [] });
      return;
    }

    // Check if this card can be played
    if (!get().isCardPlayable(card)) {
      return;
    }

    // For multi-card selection of same value
    if (selectedCards.length === 0 || selectedCards[0].value === card.value) {
      const newSelection = [...selectedCards, card];
      
      // Sort cards to prioritize the one that matches the required suit/condition first
      const sortedSelection = newSelection.sort((a, b) => {
        // If there's a required suit, prioritize cards of that suit
        if (requiredSuit) {
          if (a.suit === requiredSuit && b.suit !== requiredSuit) return -1;
          if (b.suit === requiredSuit && a.suit !== requiredSuit) return 1;
        }
        
        // If no required suit, prioritize cards that match the top card's suit
        if (a.suit === topCard.suit && b.suit !== topCard.suit) return -1;
        if (b.suit === topCard.suit && a.suit !== topCard.suit) return 1;
        
        // If values match the top card, prioritize those
        if (a.value === topCard.value && b.value !== topCard.value) return -1;
        if (b.value === topCard.value && a.value !== topCard.value) return 1;
        
        return 0;
      });
      
      set({ selectedCards: sortedSelection });
    }
  },

  arrangeCards: (cards: Card[]) => {
    set({ selectedCards: cards });
  },

  clearSelectedCards: () => {
    set({ selectedCards: [] });
  },

  isCardPlayable: (card: Card) => {
    const { discardPile, pendingAction, currentPlayer, selectedCards, lastPlayedValue, requiredSuit } = get();
    if (currentPlayer !== 'human') return false;
    
    const topCard = discardPile[discardPile.length - 1];

    // If there's a pending draw action, only allow 2s, 3s, or Aces
    if (pendingAction?.type === 'drawCards') {
      return card.value === '2' || card.value === '3' || card.value === 'A';
    }

    // If there's a required suit (from Ace or King), enforce it strictly
    if (requiredSuit) {
      // Only allow the required suit, Ace, or King of the SAME SUIT
      return card.suit === requiredSuit || card.value === 'A' || (card.value === 'K' && card.suit === requiredSuit);
    }

    // If last played was Q or 8, the SAME PLAYER must continue with that suit
    if (lastPlayedValue === 'Q' || lastPlayedValue === '8') {
      // Must play:
      // - Same suit as the Q/8
      // - Another Q (any suit)
      // - An 8 of the SAME SUIT as the Q/8
      // - An Ace (always playable)
      if (card.value === 'A') return true;
      if (card.value === 'Q') return true; // Any Q is allowed
      if (card.value === '8' && card.suit === topCard.suit) return true; // Only 8 of same suit
      return card.suit === topCard.suit; // Same suit as Q/8
    }

    // Ace can always be played (except when there's a specific suit requirement)
    if (card.value === 'A') return true;

    // For multiple card selection, ensure same value and at least one can be played
    if (selectedCards.length > 0) {
      // Must be same value
      if (card.value !== selectedCards[0].value) return false;
      
      // For draw cards (2s and 3s), all must be draw cards
      const isDrawCard = card.value === '2' || card.value === '3';
      const hasDrawCards = selectedCards.some(c => c.value === '2' || c.value === '3');
      if (isDrawCard !== hasDrawCards) return false;
      
      // Check if this specific card would be valid to play
      return canPlayCard(card, topCard, pendingAction);
    }

    return canPlayCard(card, topCard, pendingAction);
  },

  playCard: (cards: Card[], action: CardAction) => {
    const { humanHand, discardPile, lastNormalCard, selectedCards, lastDrawCard, requiredSuit, currentPlayer } = get();
    
    const cardsToPlay = selectedCards.length > 0 ? selectedCards : cards;
    
    // Validate that we can play these cards
    if (cardsToPlay.length === 0) return;
    
    // For multi-card plays, ensure all cards have the same value
    if (cardsToPlay.length > 1 && !cardsToPlay.every(card => card.value === cardsToPlay[0].value)) {
      return;
    }
    
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
        // Counter the draw cards - clear the requirement
        newRequiredSuit = null;
        newLastDrawCard = null;
        newLastAction += ` to counter the draw cards`;
      } else if (action.requestedSuit) {
        // Set the required suit for the next player
        newRequiredSuit = action.requestedSuit;
        newLastAction += ` and requested ${action.requestedSuit}`;
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
      // Q and 8 make the SAME PLAYER continue playing cards of that suit
      nextPlayer = 'human'; // Same player continues
      newRequiredSuit = cardsToPlay[0].suit;
      newLastPlayedValue = cardsToPlay[0].value;
      if (cardsToPlay[0].value === 'Q') {
        newLastAction += ` - continue playing ${cardsToPlay[0].suit} cards, another Q, or an 8 of ${cardsToPlay[0].suit}`;
      } else {
        newLastAction += ` - continue playing ${cardsToPlay[0].suit} cards, another 8, or a Q`;
      }
    } else if (cardsToPlay[0].value === 'K') {
      // King requires the next card to be the same suit or another King of the same suit
      newRequiredSuit = cardsToPlay[0].suit;
      newLastAction += ` - next card must be ${cardsToPlay[0].suit} or another King of ${cardsToPlay[0].suit}`;
    } else if (!isSpecialCard(cardsToPlay[0].value)) {
      newLastNormalCard = cardsToPlay[0];
      newLastDrawCard = null;
      // Clear any previous requirements when playing normal cards
      newRequiredSuit = null;
      newLastPlayedValue = null;
    }
    
    let newGameStatus = get().gameStatus;
    if (newHand.length === 0) {
      // Updated winning condition to allow winning with a matching suit
      const isValidWin = 
        (cardsToPlay.length > 1 && cardsToPlay.every(card => card.value === cardsToPlay[0].value && isNormalCard(card.value))) ||
        (cardsToPlay.length === 1 && isNormalCard(cardsToPlay[0].value)) ||
        (requiredSuit && cardsToPlay[0].suit === requiredSuit) ||
        (discardPile.length > 0 && cardsToPlay[0].value === discardPile[discardPile.length - 1].value);
      
      if (isValidWin) {
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
    const { deck, humanHand, currentPlayer, pendingAction, requiredSuit, discardPile } = get();
    
    if (currentPlayer !== 'human') return;
    
    const drawCount = pendingAction?.type === 'drawCards' ? pendingAction.count : 1;
    
    // If deck is empty, reshuffle discard pile
    let newDeck = [...deck];
    let newDiscardPile = [...discardPile];
    
    if (newDeck.length < drawCount && newDiscardPile.length > 1) {
      const { newDeck: reshuffledDeck, newDiscardPile: updatedDiscardPile } = reshuffleDeck(newDiscardPile);
      newDeck = reshuffledDeck;
      newDiscardPile = updatedDiscardPile;
    }
    
    // If still not enough cards after reshuffling, return
    if (newDeck.length < drawCount) return;
    
    const newCards = newDeck.slice(0, drawCount);
    const remainingDeck = newDeck.slice(drawCount);
    const newHand = [...humanHand, ...newCards];
    
    // Clear pending action after drawing
    // Keep requiredSuit if it was set by Ace/King/Q/8
    
    set({
      deck: remainingDeck,
      humanHand: newHand,
      discardPile: newDiscardPile,
      lastAction: `You drew ${drawCount} card${drawCount > 1 ? 's' : ''}`,
      currentPlayer: 'ai',
      pendingAction: null,
      drawCount: get().drawCount + drawCount,
      selectedCards: [],
      lastPlayedValue: null,
      lastDrawCard: null
    });
    
    setTimeout(() => get().startAiTurn(), 500);
  },

  setPendingAction: (action: PendingAction | null) => {
    set({ pendingAction: action });
  },

  startAiTurn: () => {
    const { aiHand, discardPile, deck, pendingAction, lastPlayedValue, lastNormalCard, requiredSuit, lastDrawCard } = get();
    
    set({ isAiThinking: true });
    
    setTimeout(() => {
      const topCard = discardPile[discardPile.length - 1];
      
      let playableCards: Card[] = [];

      // If there's a pending draw action, only allow 2s, 3s, or Aces
      if (pendingAction?.type === 'drawCards') {
        playableCards = aiHand.filter(card => card.value === '2' || card.value === '3' || card.value === 'A');
      }
      // If there's a required suit (from Ace or King), enforce it strictly
      else if (requiredSuit) {
        playableCards = aiHand.filter(card => 
          card.suit === requiredSuit || card.value === 'A' || (card.value === 'K' && card.suit === requiredSuit)
        );
      }
      // If last played was Q or 8, the AI must continue with that suit
      else if (lastPlayedValue === 'Q' || lastPlayedValue === '8') {
        playableCards = aiHand.filter(card => {
          if (card.value === 'A') return true; // Ace always playable
          if (card.value === 'Q') return true; // Any Q is allowed
          if (card.value === '8' && card.suit === topCard.suit) return true; // Only 8 of same suit
          return card.suit === topCard.suit; // Same suit as Q/8
        });
      }
      // Normal card matching
      else {
        playableCards = aiHand.filter(card => canPlayCard(card, topCard, pendingAction));
      }
      
      if (playableCards.length > 0) {
        // Group cards by value for potential multiple plays
        const cardGroups = playableCards.reduce((groups, card) => {
          const value = card.value;
          if (!groups[value]) groups[value] = [];
          groups[value].push(card);
          return groups;
        }, {} as Record<string, Card[]>);

        let selectedCards: Card[] = [];
        
        // Prioritize Aces if there's a draw action
        if (pendingAction?.type === 'drawCards' && cardGroups['A']) {
          selectedCards = [cardGroups['A'][0]];
        } else {
          // Find the group with the most cards, prioritizing matching suits
          Object.values(cardGroups).forEach(group => {
            if (group.length > selectedCards.length) {
              // Sort cards to prioritize matching suit
              const sortedGroup = [...group].sort((a, b) => {
                // If there's a required suit, prioritize that
                if (requiredSuit) {
                  if (a.suit === requiredSuit && b.suit !== requiredSuit) return -1;
                  if (b.suit === requiredSuit && a.suit !== requiredSuit) return 1;
                }
                
                // Otherwise prioritize matching the top card's suit
                const aMatchesSuit = a.suit === topCard.suit ? -1 : 0;
                const bMatchesSuit = b.suit === topCard.suit ? -1 : 0;
                return aMatchesSuit - bMatchesSuit;
              });
              selectedCards = sortedGroup;
            }
          });
        }

        if (selectedCards.length === 0) {
          selectedCards = [playableCards[Math.floor(Math.random() * playableCards.length)]];
        }

        const newAiHand = aiHand.filter(card => !selectedCards.some(c => c.id === card.id));
        const newDiscardPile = [...discardPile, ...selectedCards];
        
        let newLastAction = `AI played ${selectedCards.length > 1 ? `${selectedCards.length} ${selectedCards[0].value}s` : `${selectedCards[0].value} of ${selectedCards[0].suit}`}`;
        let nextPlayer: Player = 'human';
        let newPendingAction: PendingAction | null = null;
        let newLastPlayedValue: string | null = null;
        let newLastNormalCard = lastNormalCard;
        let newRequiredSuit: Suit | null = requiredSuit;
        let newLastDrawCard = lastDrawCard;
        let newQuestionEightPlayed = false;
        
        if (selectedCards[0].value === 'A') {
          if (lastDrawCard || pendingAction?.type === 'drawCards') {
            // Counter the draw cards - clear the requirement
            newRequiredSuit = null;
            newLastDrawCard = null;
            newLastAction += ` to counter the draw cards`;
          } else {
            // AI strategically chooses a suit it has
            const availableSuits = new Set(newAiHand.map(card => card.suit));
            const requestedSuit = Array.from(availableSuits)[0] || SUITS[Math.floor(Math.random() * SUITS.length)];
            newRequiredSuit = requestedSuit;
            newLastAction += ` and requested ${requestedSuit}`;
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
          nextPlayer = 'ai';
          newLastAction += ' - AI plays again';
        } else if (selectedCards[0].value === '8' || selectedCards[0].value === 'Q') {
          // Q and 8 make the AI continue playing cards of that suit
          nextPlayer = 'ai'; // Same player (AI) continues
          newRequiredSuit = selectedCards[0].suit;
          newLastPlayedValue = selectedCards[0].value;
          if (selectedCards[0].value === 'Q') {
            newLastAction += ` - AI continues playing ${selectedCards[0].suit} cards, another Q, or an 8 of ${selectedCards[0].suit}`;
          } else {
            newLastAction += ` - AI continues playing ${selectedCards[0].suit} cards, another 8, or a Q`;
          }
        } else if (selectedCards[0].value === 'K') {
          newRequiredSuit = selectedCards[0].suit;
          newLastAction += ` - next card must be ${selectedCards[0].suit} or another King of ${selectedCards[0].suit}`;
        } else if (!isSpecialCard(selectedCards[0].value)) {
          newLastNormalCard = selectedCards[0];
          newLastDrawCard = null;
          newRequiredSuit = null;
          newLastPlayedValue = null;
        }
        
        let newGameStatus = get().gameStatus;
        if (newAiHand.length === 0) {
          // Updated winning condition for AI to match human's conditions
          const isValidWin = 
            (selectedCards.length > 1 && selectedCards.every(card => card.value === selectedCards[0].value && isNormalCard(card.value))) ||
            (selectedCards.length === 1 && isNormalCard(selectedCards[0].value)) ||
            (requiredSuit && selectedCards[0].suit === requiredSuit) ||
            (discardPile.length > 0 && selectedCards[0].value === discardPile[discardPile.length - 1].value);
          
          if (isValidWin) {
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
        // AI must draw cards
        let newDeck = [...deck];
        let newDiscardPile = [...discardPile];
        
        if (newDeck.length === 0 && newDiscardPile.length > 1) {
          const { newDeck: reshuffledDeck, newDiscardPile: updatedDiscardPile } = reshuffleDeck(newDiscardPile);
          newDeck = reshuffledDeck;
          newDiscardPile = updatedDiscardPile;
        }
        
        if (newDeck.length === 0) {
          set({
            lastAction: 'AI tried to draw but the deck is empty',
            currentPlayer: 'human',
            isAiThinking: false,
            lastPlayedValue: null,
            lastDrawCard: null
          });
          return;
        }
        
        const drawCount = pendingAction?.type === 'drawCards' ? pendingAction.count : 1;
        const newCards = newDeck.slice(0, drawCount);
        const remainingDeck = newDeck.slice(drawCount);
        const newHand = [...aiHand, ...newCards];
        
        set({
          deck: remainingDeck,
          aiHand: newHand,
          discardPile: newDiscardPile,
          lastAction: `AI drew ${drawCount} card${drawCount > 1 ? 's' : ''}`,
          currentPlayer: 'human',
          isAiThinking: false,
          drawCount: get().drawCount + drawCount,
          pendingAction: null,
          lastPlayedValue: null,
          lastDrawCard: null
        });
      }
    }, 500);
  }
}));