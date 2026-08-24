/**
 * wasmLoader.ts
 * Loads WebAssembly module, binds Asyncify input loop, screen buffer memory views, and restart logic
 */

import { InputQueue } from './inputQueue';
import { RogueCellData } from '../renderer/asciiRenderer';
import { SaveManager } from '../storage/saveManager';

export interface EmscriptenModule {
  _wasm_start_game: (restore: number, namePtr: number) => number;
  _wasm_get_screen_buffer: () => number;
  _wasm_save_current_game: () => number;
  HEAPU8: Uint8Array;
  FS: {
    writeFile: (path: string, data: Uint8Array) => void;
    readFile: (path: string) => Uint8Array;
    unlink: (path: string) => void;
    analyzePath: (path: string) => { exists: boolean };
  };
  stringToUTF8: (str: string, outPtr: number, maxBytesToWrite: number) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
}

declare function createRogueModule(options?: any): Promise<EmscriptenModule>;

export class WasmLoader {
  private module: EmscriptenModule | null = null;
  private inputQueue: InputQueue;
  private onRenderCallback: ((cells: RogueCellData[][]) => void) | null = null;
  private onGameOverCallback: ((score: number, level: number, maxLevel: number, gold: number, reason: string) => void) | null = null;
  private currentName = 'RODNEY';

  constructor(inputQueue: InputQueue) {
    this.inputQueue = inputQueue;
  }

  public setOnRender(cb: (cells: RogueCellData[][]) => void) {
    this.onRenderCallback = cb;
  }

  public setOnGameOver(cb: (score: number, level: number, maxLevel: number, gold: number, reason: string) => void) {
    this.onGameOverCallback = cb;
  }

  public getCurrentName(): string {
    return this.currentName;
  }

  public async initialize(): Promise<void> {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

    return new Promise((resolve, reject) => {
      // Load rogue.js script dynamically if not present
      if (!(window as any).createRogueModule) {
        const script = document.createElement('script');
        script.src = cleanBase + 'rogue.js';
        script.onload = async () => {
          try {
            await this.initModule();
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
      } else {
        this.initModule().then(resolve).catch(reject);
      }
    });
  }

  public async initModule() {
    const baseUrl = import.meta.env.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

    const modConfig = {
      locateFile: (path: string) => {
        if (path.endsWith('.wasm')) {
          return cleanBase + 'rogue.wasm';
        }
        return path;
      },
      onAsyncGetch: async () => {
        return await this.inputQueue.getNextKey();
      },
      onRefresh: () => {
        this.readAndDispatchScreenBuffer();
      },
      onAutoSave: () => {
        this.syncSaveToStorage();
      },
      onGameOver: (score: number, level: number, maxLevel: number, gold: number, reason: string) => {
        SaveManager.deleteSave();
        SaveManager.addScore({
          score,
          level,
          maxLevel,
          gold,
          reason,
          date: new Date().toLocaleDateString('ja-JP'),
          name: this.currentName,
        });
        if (this.onGameOverCallback) {
          this.onGameOverCallback(score, level, maxLevel, gold, reason);
        }
      },
    };

    this.module = await createRogueModule(modConfig);
  }

  public readAndDispatchScreenBuffer(): RogueCellData[][] {
    if (!this.module) return [];
    const ptr = this.module._wasm_get_screen_buffer();
    const buffer = this.module.HEAPU8.buffer;
    const view = new DataView(buffer, ptr, 24 * 80 * 4);

    const cells: RogueCellData[][] = [];
    for (let r = 0; r < 24; r++) {
      const row: RogueCellData[] = [];
      for (let c = 0; c < 80; c++) {
        const offset = (r * 80 + c) * 4;
        const ch = view.getUint16(offset, true);
        const color = view.getUint8(offset + 2);
        const attr = view.getUint8(offset + 3);
        row.push({ ch, color, attr });
      }
      cells.push(row);
    }

    if (this.onRenderCallback) {
      this.onRenderCallback(cells);
    }
    return cells;
  }

  public startGame(restore: boolean, playerName: string) {
    if (!this.module) return;
    this.currentName = playerName || 'RODNEY';

    if (restore) {
      const savedBytes = SaveManager.loadGame();
      if (savedBytes) {
        this.module.FS.writeFile('/rogue.save', savedBytes);
      }
      // Permadeath: delete from LocalStorage on resume
      SaveManager.deleteSave();
    }

    const nameBytes = new TextEncoder().encode(this.currentName + '\0');
    const namePtr = this.module._malloc(nameBytes.length);
    this.module.HEAPU8.set(nameBytes, namePtr);

    // Run game in background via Asyncify
    setTimeout(() => {
      this.module!._wasm_start_game(restore ? 1 : 0, namePtr);
    }, 10);
  }

  public async restartGame(playerName?: string) {
    const name = playerName || this.currentName;
    await this.initModule();
    this.startGame(false, name);
  }

  public saveCurrentGame() {
    if (!this.module) return;
    try {
      this.module._wasm_save_current_game();
      this.syncSaveToStorage();
    } catch (e) {
      console.warn('Auto save current game error:', e);
    }
  }

  public syncSaveToStorage() {
    if (!this.module) return;
    try {
      if (this.module.FS.analyzePath('/rogue.save').exists) {
        const data = this.module.FS.readFile('/rogue.save');
        SaveManager.saveGame(data);
      }
    } catch (e) {
      console.warn('Auto-save sync skipped:', e);
    }
  }
}
