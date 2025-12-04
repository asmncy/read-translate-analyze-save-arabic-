export interface WordMapping {
  arabic: string;
  french: string;
}

export interface Flashcard {
  id: string;
  originalText: string; // Raw Arabic
  vocalizedText?: string; // Arabic with Tashkeel
  translatedText: string; // French
  words?: WordMapping[];
  context?: string;
  createdAt: number;
}

export interface SelectionResult {
  originalText: string;
  vocalizedText: string;
  translatedText: string;
  words: WordMapping[];
  confidence?: number;
}

export enum AppMode {
  VIEW = 'VIEW',
  SELECT_REGION = 'SELECT_REGION',
}

export enum AppView {
  READER = 'READER',
  FLASHCARDS = 'FLASHCARDS',
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}