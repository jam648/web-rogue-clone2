/**
 * canvasRenderer.ts
 * Main Canvas Rendering Engine (combining Tile, ASCII, animated frames, and UI overlays)
 */

import { AsciiRenderer, RogueCellData } from './asciiRenderer';
import { TileRenderer } from './tileRenderer';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private asciiRenderer: AsciiRenderer;
  private tileRenderer: TileRenderer;
  private renderMode: 'tile' | 'ascii' = 'tile';
  private lastCells: RogueCellData[][] | null = null;
  private animInterval: number | null = null;

  // 80 columns x 24 rows
  public readonly cols = 80;
  public readonly rows = 24;

  // Grid dimensions (1280 / 80 = 16, 768 / 24 = 32)
  public cellW = 16;
  public cellH = 32;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d', { alpha: false })!;
    this.asciiRenderer = new AsciiRenderer();
    this.tileRenderer = new TileRenderer();

    this.cellW = Math.floor(this.canvas.width / this.cols);
    this.cellH = Math.floor(this.canvas.height / this.rows);

    this.setupResizeHandler();
    this.startAnimationLoop();
  }

  public setRenderMode(mode: 'tile' | 'ascii') {
    this.renderMode = mode;
    if (this.lastCells) {
      this.renderFrame(this.lastCells);
    }
  }

  public getRenderMode(): 'tile' | 'ascii' {
    return this.renderMode;
  }

  public destroy() {
    if (this.animInterval !== null) {
      clearInterval(this.animInterval);
      this.animInterval = null;
    }
  }

  private startAnimationLoop() {
    let frame = 0;
    this.animInterval = window.setInterval(() => {
      if (this.renderMode === 'tile' && this.lastCells) {
        frame = (frame + 1) % 2;
        this.tileRenderer.setAnimFrame(frame);
        this.renderFrame(this.lastCells);
      }
    }, 450);
  }

  private setupResizeHandler() {
    const resize = () => {
      const container = this.canvas.parentElement;
      if (!container) return;

      const contW = container.clientWidth;
      const contH = container.clientHeight;

      // Maintain 1280:768 aspect ratio
      const targetAspect = this.canvas.width / this.canvas.height;
      let newW = contW;
      let newH = contW / targetAspect;

      if (newH > contH) {
        newH = contH;
        newW = contH * targetAspect;
      }

      this.canvas.style.width = `${Math.floor(newW)}px`;
      this.canvas.style.height = `${Math.floor(newH)}px`;
    };

    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
  }

  public getCellAtCanvasPosition(clientX: number, clientY: number): { col: number; row: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const col = Math.floor(canvasX / this.cellW);
    const row = Math.floor(canvasY / this.cellH);

    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      return { col, row };
    }
    return null;
  }

  /**
   * Render a complete 80x24 frame
   */
  public renderFrame(cells: RogueCellData[][]) {
    this.lastCells = cells;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = '#08090e';
    ctx.fillRect(0, 0, w, h);

    // 1. Render Row 0 (Top Message Bar)
    this.renderMessageBar(ctx, cells[0]);

    // 2. Render Rows 1 to 22 (Dungeon Grid)
    if (this.renderMode === 'tile') {
      this.tileRenderer.render(ctx, cells, this.cellW, this.cellH, 1, 22);
    } else {
      this.asciiRenderer.render(ctx, cells, this.cellW, this.cellH, 1, 22);
    }

    // 3. Render Row 23 (Bottom Stats Bar)
    this.renderStatusBar(ctx, cells[23]);
  }

  private renderMessageBar(ctx: CanvasRenderingContext2D, row: RogueCellData[] | undefined) {
    if (!row) return;
    const str = this.extractRowString(row);
    if (!str.trim()) return;

    const y = 0;
    const barH = this.cellH;

    ctx.fillStyle = '#1e1b4b'; // Dark Indigo banner
    ctx.fillRect(0, y, this.canvas.width, barH);
    ctx.fillStyle = '#fbbf24'; // Amber text
    ctx.font = 'bold 16px "DotGothic16", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, 12, y + barH / 2);
  }

  private renderStatusBar(ctx: CanvasRenderingContext2D, row: RogueCellData[] | undefined) {
    if (!row) return;
    const str = this.extractRowString(row);
    if (!str.trim()) return;

    const y = 23 * this.cellH;
    const barH = this.cellH;

    ctx.fillStyle = '#0f172a'; // Slate dark bar
    ctx.fillRect(0, y, this.canvas.width, barH);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(0, y, this.canvas.width, 1);

    ctx.fillStyle = '#38bdf8'; // Sky blue text
    ctx.font = 'bold 15px "DotGothic16", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(str, 12, y + barH / 2);
  }

  private extractRowString(row: RogueCellData[]): string {
    if (!row) return '';
    let lastValid = row.length - 1;
    while (lastValid >= 0 && (row[lastValid]?.ch === 0 || row[lastValid]?.ch === 32 || row[lastValid]?.ch === 0xFFFF)) {
      lastValid--;
    }
    if (lastValid < 0) return '';

    let res = '';
    for (let c = 0; c <= lastValid; c++) {
      const code = row[c]?.ch ?? 0;
      if (code === 0xFFFF) continue;
      if (code === 0) {
        res += ' ';
      } else {
        res += String.fromCharCode(code);
      }
    }
    return res;
  }
}
