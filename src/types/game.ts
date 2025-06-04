export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Value = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  id: string;
  suit: Suit;
  value: Value;
  isPlayable: boolean;
}

export type Player = "human" | "ai";

export interface GameState {
  deck: Card[];
  humanHand: Card[];
  aiHand: Card[];
  discardPile: Card[];
  currentPlayer: Player;
  lastAction: string;
  pendingAction: PendingAction | null;
  gameStatus: "setup" | "playing" | "humanWon" | "aiWon";
  drawCount: number;
  turnCount: number;
  isAiThinking: boolean;
  selectedCards: Card[];
  lastPlayedValue: string | null;
  lastNormalCard: Card | null;
  requiredSuit: Suit | null;
  lastDrawCard: Card | null;
}

export type CardAction = 
  | { type: "normal"; cards: Card[] }
  |  { type: "ace"; requestedSuit: Suit | null }
  | { type: "draw"; count: number; cards: Card[] }
  | { type: "question"; suit: Suit }
  | { type: "skip" }
  | { type: "pass" };

export type PendingAction = 
  | { type: "suitRequest"; suit: Suit }
  | { type: "questionCard"; suit: Suit }
  | { type: "drawCards"; count: number };

export type GameAction = 
  | { type: "START_GAME" }
  | { type: "PLAY_CARD"; card: Card; action?: CardAction }
  | { type: "DRAW_CARD" }
  | { type: "SET_PENDING_ACTION"; action: PendingAction | null }
  | { type: "AI_TURN_START" }
  | { type: "AI_TURN_END"; card?: Card; action?: CardAction };