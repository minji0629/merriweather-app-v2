import { createContext } from 'react';
import { DimensionScores, ResidentKey } from '@/constants/questions';

export type Page =
  | 'landing'
  | 'nickname'
  | 'transition'
  | 'lu'
  | 'question'
  | 'loading'
  | 'result'
  | 'premium'
  | 'payment'
  | 'gift'
  | 'paymentSuccess'
  | 'paymentFail'
  | 'authCallback'
  | 'archive'
  | 'notice'
  | 'contact'
  | 'sharedResult'
  | 'developerNote'
  | 'travelPlaza';

export interface Answer {
  questionId: number;
  choice: string;
  scores: DimensionScores;
  residentWeights?: ResidentKey[];
}

export interface AppState {
  nickname: string;
  setNickname: (name: string) => void;
  currentPage: Page;
  previousPage: Page | null;
  setCurrentPage: (page: Page) => void;
  answers: Answer[];
  addAnswer: (answer: Answer) => void;
  resetAnswers: () => void;
  residentKey: ResidentKey | null;
  setResidentKey: (key: ResidentKey | null) => void;
  secondResidentKey: ResidentKey | null;
  setSecondResidentKey: (key: ResidentKey | null) => void;
  selectedResultId: string | null;
  setSelectedResultId: (id: string | null) => void;
  selectedResidentKey: ResidentKey | null;
  setSelectedResidentKey: (key: ResidentKey | null) => void;
  sharedResultId: string | null;
  setSharedResultId: (id: string | null) => void;
  sharedResultScope: 'basic' | 'full' | null;
  restart: () => void;
}

export const AppContext = createContext<AppState | undefined>(undefined);
