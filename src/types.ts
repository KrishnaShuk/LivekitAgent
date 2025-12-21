export interface SessionUserData {
  userName?: string;
  favoriteGenre?: string;
  storySettingLocation?: string;
  isInfoComplete?: boolean;
  triviaScore?: number;
  triviaQuestionCount?: number;
  rpgState?: RPGState;
}

export interface RPGState {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  inventory: string[];
  location: string;
}
