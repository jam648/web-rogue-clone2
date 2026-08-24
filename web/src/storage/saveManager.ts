/**
 * saveManager.ts
 * Manages Permadeath save/load in LocalStorage and persistent high score records.
 */

export interface ScoreRecord {
  score: number;
  level: number;
  maxLevel: number;
  gold: number;
  reason: string;
  date: string;
  name: string;
}

export interface AppSettings {
  renderMode: 'tile' | 'ascii';
  showVPad: boolean;
}

const SAVE_KEY = 'rogue_save_v1';
const SCORES_KEY = 'rogue_scores_v1';
const SETTINGS_KEY = 'rogue_settings_v1';

export class SaveManager {
  /**
   * Checks if an existing suspended save is present
   */
  public static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Save binary dungeon state to LocalStorage
   */
  public static saveGame(data: Uint8Array): void {
    try {
      let binary = '';
      const len = data.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
      }
      const b64 = btoa(binary);
      localStorage.setItem(SAVE_KEY, b64);
    } catch (err) {
      console.error('Failed to save game state to LocalStorage:', err);
    }
  }

  /**
   * Load binary dungeon state from LocalStorage and return Uint8Array
   */
  public static loadGame(): Uint8Array | null {
    try {
      const b64 = localStorage.getItem(SAVE_KEY);
      if (!b64) return null;
      const binary = atob(b64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (err) {
      console.error('Failed to read save game from LocalStorage:', err);
      return null;
    }
  }

  /**
   * Permadeath: delete save data immediately upon restoring or death
   */
  public static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  /**
   * Add high score record
   */
  public static addScore(record: ScoreRecord): void {
    const list = this.getScores();
    list.push(record);
    // Sort descending by score
    list.sort((a, b) => b.score - a.score);
    // Keep top 50
    const top50 = list.slice(0, 50);
    localStorage.setItem(SCORES_KEY, JSON.stringify(top50));
  }

  /**
   * Get all recorded high scores
   */
  public static getScores(): ScoreRecord[] {
    try {
      const raw = localStorage.getItem(SCORES_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as ScoreRecord[];
    } catch {
      return [];
    }
  }

  /**
   * Get application settings
   */
  public static getSettings(): AppSettings {
    const isMobile = window.innerWidth <= 768;
    const defaults: AppSettings = {
      renderMode: 'tile',
      showVPad: isMobile,
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  }

  /**
   * Save application settings
   */
  public static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }
}
