export enum MoonBlockResult {
  DIVINE = 'DIVINE', // One up, one down (Yes)
  LAUGHING = 'LAUGHING', // Two flat up (Laughing/Retry)
  YIN = 'YIN', // Two round up (No)
}

export interface Fortune {
  text: string;
  isGemini: boolean;
}

export type AnimationState = 'idle' | 'animating' | 'showing_result';

export interface AppState {
  mode: 'view' | 'upload' | 'fortune' | 'blocks';
  uploadedImage: string | null;
  blockResult: MoonBlockResult | null;
  fortune: Fortune | null;
  isLoading: boolean;
}
