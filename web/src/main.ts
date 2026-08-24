/**
 * main.ts
 * Application Entry Point for Rogue Clone II Web Edition
 */

import { InputQueue } from './engine/inputQueue';
import { CanvasRenderer } from './renderer/canvasRenderer';
import { VirtualPad } from './ui/virtualPad';
import { Sidebar } from './ui/sidebar';
import { ScoreModal } from './ui/scoreModal';
import { WasmLoader } from './engine/wasmLoader';
import { SaveManager } from './storage/saveManager';

document.addEventListener('DOMContentLoaded', async () => {
  const inputQueue = new InputQueue();
  const canvasRenderer = new CanvasRenderer('game-canvas');
  const virtualPad = new VirtualPad(inputQueue);
  const scoreModal = new ScoreModal();
  new Sidebar(canvasRenderer, virtualPad);
  const wasmLoader = new WasmLoader(inputQueue);

  let playerPos: { col: number; row: number } | null = null;

  // On Screen Refresh from Wasm
  wasmLoader.setOnRender((cells) => {
    // Locate player '@'
    for (let r = 1; r <= 22; r++) {
      for (let c = 0; c < 80; c++) {
        if (cells[r] && cells[r][c] && (cells[r][c].ch & 0xFF) === 64) { // '@'
          playerPos = { col: c, row: r };
          break;
        }
      }
    }
    canvasRenderer.renderFrame(cells);
  });

  // On Game Over from Wasm
  wasmLoader.setOnGameOver((score, level, maxLevel, gold, reason) => {
    setTimeout(() => {
      scoreModal.show({
        score,
        level,
        maxLevel,
        gold,
        reason,
        date: new Date().toLocaleDateString('ja-JP'),
        name: wasmLoader.getCurrentName() || 'RODNEY',
      });
    }, 1200);
  });

  // Mouse Click Navigation on Canvas
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  canvas.addEventListener('click', (e: MouseEvent) => {
    if (!playerPos) return;

    const target = canvasRenderer.getCellAtCanvasPosition(e.clientX, e.clientY);
    if (!target) return;

    const dx = target.col - playerPos.col;
    const dy = target.row - playerPos.row;

    if (dx === 0 && dy === 0) {
      inputQueue.pushKey('.'); // Rest / Wait
      return;
    }

    // Direction mapping
    const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

    const dirMap: Record<string, string> = {
      '0,-1': 'k',  // Up
      '0,1': 'j',   // Down
      '-1,0': 'h',  // Left
      '1,0': 'l',   // Right
      '1,-1': 'u',  // Up-Right
      '1,1': 'n',   // Down-Right
      '-1,1': 'b',  // Down-Left
      '-1,-1': 'y', // Up-Left
    };

    const key = dirMap[`${stepX},${stepY}`];
    if (key) {
      inputQueue.pushKey(key);
    }
  });

  // Auto-save on page unload
  window.addEventListener('beforeunload', () => {
    wasmLoader.saveCurrentGame();
  });

  // Check saved game in LocalStorage
  const hasSave = SaveManager.hasSave();
  const saveFoundBox = document.getElementById('save-found-box');
  const btnResume = document.getElementById('btn-resume-game');
  const btnNewGame = document.getElementById('btn-new-game');
  const startModal = document.getElementById('start-modal');
  const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;

  if (hasSave && saveFoundBox && btnResume) {
    saveFoundBox.classList.remove('hidden');
    btnResume.classList.remove('hidden');
  }

  // Initialize Wasm Module
  try {
    await wasmLoader.initialize();
  } catch (err) {
    console.error('Failed to load WebAssembly module:', err);
    alert('WebAssemblyモジュールの読み込みに失敗しました。');
    return;
  }

  const startAction = (restore: boolean) => {
    const name = playerNameInput?.value.trim() || 'RODNEY';
    if (!restore) {
      SaveManager.deleteSave();
    }
    startModal?.classList.add('hidden');
    wasmLoader.startGame(restore, name);
  };

  // Handle Game Start buttons
  btnNewGame?.addEventListener('click', () => startAction(false));
  btnResume?.addEventListener('click', () => startAction(true));

  playerNameInput?.addEventListener('focus', () => {
    if (playerNameInput.value === 'RODNEY') {
      playerNameInput.value = '';
    } else {
      playerNameInput.select();
    }
  });

  playerNameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      startAction(hasSave);
    }
  });

  // Handle Retry button from Game Over / Score Modal
  document.getElementById('btn-retry-game')?.addEventListener('click', async () => {
    scoreModal.hide();
    const name = playerNameInput?.value.trim() || wasmLoader.getCurrentName() || 'RODNEY';
    SaveManager.deleteSave();
    await wasmLoader.restartGame(name);
  });
});
