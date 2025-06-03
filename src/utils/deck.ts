import { Card, Suit, Value } from "../types/game";

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
export const VALUES: Value[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const NORMAL_CARDS: Value[] = ["4", "5", "6", "7", "9", "10"];
export const SPECIAL_CARDS: Value[] = ["A", "2", "3", "8", "J", "Q", "K"];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  
  SUITS.forEach(suit => {
    VALUES.forEach(value => {
      deck.push({
        id: `${value}-${suit}`,
        suit,
        value,
        isPlayable: false
      });
    });
  });
  
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  
  return newDeck;
};

export const dealCards = (deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } => {
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  
  return { cards, remainingDeck };
};

export const getStartingCard = (deck: Card[]): { card: Card | null, remainingDeck: Card[] } => {
  // Find the first normal card (4, 5, 6, 7, 9, or 10)
  const index = deck.findIndex(card => NORMAL_CARDS.includes(card.value));
  
  if (index === -1) {
    return { card: null, remainingDeck: deck };
  }
  
  const card = deck[index];
  const remainingDeck = [...deck.slice(0, index), ...deck.slice(index + 1)];
  
  return { card, remainingDeck };
};

export const isNormalCard = (value: Value): boolean => {
  return NORMAL_CARDS.includes(value);
};

export const isSpecialCard = (value: Value): boolean => {
  return SPECIAL_CARDS.includes(value);
};

export const getSuitSymbol = (suit: Suit): string => {
  switch (suit) {
    case "hearts": return "♥";
    case "diamonds": return "♦";
    case "clubs": return "♣";
    case "spades": return "♠";
  }
};

export const getSuitColor = (suit: Suit): string => {
  return suit === "hearts" || suit === "diamonds" ? "text-red-600" : "text-gray-900";
};

export const canPlayCard = (card: Card, topCard: Card, pendingAction: any): boolean => {
  if (!topCard) return true;
  
  // Can play if values match
  if (card.value === topCard.value) return true;
  
  // Can play if suits match and it's a 2 or 3
  if ((card.value === '2' || card.value === '3') && card.suit === topCard.suit) return true;
  
  // If there's a draw action pending, can counter with same value
  if (pendingAction?.type === 'drawCards') {
    return card.value === topCard.value;
  }
  
  return false;
};