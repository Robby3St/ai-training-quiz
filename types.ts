export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  title: string;
  text: string;
  options: Option[];
  correctAnswerId: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum QuizState {
  INTRO = 'INTRO',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export enum VisualMode {
  IDLE = 'IDLE',
  FLOWER = 'FLOWER',
  CLOUD = 'CLOUD',
}