/**
 * asciiRenderer.ts
 * Classic 80x24 CUI Terminal ASCII Renderer
 * Robust cell-by-cell UTF-8 grouping for pixel-perfect Tombstone & Japanese alignment
 */

export interface RogueCellData {
  ch: number;
  color: number;
  attr: number;
}

export const ROGUE_COLORS = [
  '#cbd5e1', // 0: Default white/slate
  '#f8fafc', // 1: White
  '#ef4444', // 2: Red
  '#22c55e', // 3: Green
  '#eab308', // 4: Yellow
  '#3b82f6', // 5: Blue
  '#ec4899', // 6: Magenta
  '#06b6d4', // 7: Cyan
  '#f8fafc', // 8: White Rev
  '#ef4444', // 9: Red Rev
  '#22c55e', // 10: Green Rev
  '#eab308', // 11: Yellow Rev
  '#3b82f6', // 12: Blue Rev
  '#ec4899', // 13: Magenta Rev
  '#06b6d4', // 14: Cyan Rev
];

export class AsciiRenderer {
  public render(
    ctx: CanvasRenderingContext2D,
    cells: RogueCellData[][],
    cellW: number,
    cellH: number,
    startRow = 0,
    endRow = 23
  ) {
    ctx.textBaseline = 'middle';

    for (let r = startRow; r <= endRow; r++) {
      const row = cells[r];
      if (!row) continue;

      let c = 0;
      while (c < 80) {
        const cell = row[c];
        if (!cell) {
          c++;
          continue;
        }

        const ch = cell.ch;
        if (ch === 0 || ch === 32 || ch === 0xFFFF) {
          c++;
          continue;
        }

        const x = c * cellW;
        const y = r * cellH;
        const colorIdx = cell.color >= 0 && cell.color < ROGUE_COLORS.length ? cell.color : 0;
        const isReverse = cell.color >= 8 || (cell.attr & 0x01) !== 0;

        if (ch < 0x80) {
          // 1-cell ASCII character
          const char = String.fromCharCode(ch);
          ctx.font = `bold ${Math.floor(cellH * 0.75)}px "Courier New", Courier, monospace`;
          ctx.textAlign = 'center';

          if (isReverse) {
            ctx.fillStyle = ROGUE_COLORS[colorIdx];
            ctx.fillRect(x, y, cellW, cellH);
            ctx.fillStyle = '#000000';
            ctx.fillText(char, x + cellW / 2, y + cellH / 2);
          } else {
            ctx.fillStyle = ROGUE_COLORS[colorIdx];
            ctx.fillText(char, x + cellW / 2, y + cellH / 2);
          }
          c++;
        } else {
          // 2-cell Fullwidth Unicode Character (Japanese Kanji / Kana / Symbols)
          const char = String.fromCharCode(ch);
          ctx.font = `bold ${Math.floor(cellH * 0.78)}px "DotGothic16", monospace`;
          ctx.textAlign = 'left';

          if (isReverse) {
            ctx.fillStyle = ROGUE_COLORS[colorIdx];
            ctx.fillRect(x, y, cellW * 2, cellH);
            ctx.fillStyle = '#000000';
            ctx.fillText(char, x, y + cellH / 2);
          } else {
            ctx.fillStyle = ROGUE_COLORS[colorIdx];
            ctx.fillText(char, x, y + cellH / 2);
          }

          c += 2;
        }
      }
    }
  }
}
