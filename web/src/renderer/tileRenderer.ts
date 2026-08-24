/**
 * tileRenderer.ts
 * High-Quality 2-Frame Animated Pixel Art Sprite Tile Renderer for Rogue Clone II
 * Features:
 * - 2-Frame breathing/motion sprites for Hero (@) and all 26 Monsters (A-Z)
 * - Automatic Tombstone / High Score / Non-dungeon screen detection and stylized monument rendering
 * - Rich shadow, specular lighting, and CC0 procedural sprite generator
 */

import { RogueCellData } from './asciiRenderer';

export class TileRenderer {
  // Key: character -> [Frame0 Canvas, Frame1 Canvas]
  private tileCache: Map<string, [HTMLCanvasElement, HTMLCanvasElement]> = new Map();
  private customTilesetImage: HTMLImageElement | null = null;
  private customTileSize = 16;
  public animFrame = 0; // 0 or 1, toggled by CanvasRenderer

  private customTileMap: Record<string, { col: number; row: number }> = {
    '.': { col: 0, row: 0 },
    '-': { col: 1, row: 0 },
    '|': { col: 2, row: 0 },
    '#': { col: 3, row: 0 },
    '+': { col: 4, row: 0 },
    '%': { col: 5, row: 0 },
    '^': { col: 6, row: 0 },
    '@': { col: 0, row: 1 },
    '*': { col: 1, row: 1 },
    ')': { col: 2, row: 1 },
    ']': { col: 3, row: 1 },
    '?': { col: 4, row: 1 },
    '!': { col: 5, row: 1 },
    '/': { col: 6, row: 1 },
    '=': { col: 7, row: 1 },
    ':': { col: 8, row: 1 },
    ',': { col: 9, row: 1 },
  };

  constructor() {
    this.initDefaultProceduralTiles();
  }

  public setAnimFrame(frame: number) {
    this.animFrame = frame % 2;
  }

  public async loadCustomTileset(imageSrc: string, tileSize = 16): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.customTilesetImage = img;
        this.customTileSize = tileSize;
        resolve();
      };
      img.onerror = (err) => reject(err);
      img.src = imageSrc;
    });
  }

  public resetToDefaultTileset() {
    this.customTilesetImage = null;
  }

  private createStaticTile(
    char: string,
    drawer: (ctx: CanvasRenderingContext2D) => void
  ) {
    const c0 = document.createElement('canvas');
    c0.width = 32;
    c0.height = 32;
    const ctx0 = c0.getContext('2d')!;
    ctx0.imageSmoothingEnabled = false;
    drawer(ctx0);

    // Static tile uses same image for both frames
    this.tileCache.set(char, [c0, c0]);
  }

  private createAnimatedTile(
    char: string,
    drawer0: (ctx: CanvasRenderingContext2D) => void,
    drawer1: (ctx: CanvasRenderingContext2D) => void
  ) {
    const c0 = document.createElement('canvas');
    c0.width = 32;
    c0.height = 32;
    const ctx0 = c0.getContext('2d')!;
    ctx0.imageSmoothingEnabled = false;
    drawer0(ctx0);

    const c1 = document.createElement('canvas');
    c1.width = 32;
    c1.height = 32;
    const ctx1 = c1.getContext('2d')!;
    ctx1.imageSmoothingEnabled = false;
    drawer1(ctx1);

    this.tileCache.set(char, [c0, c1]);
  }

  private initDefaultProceduralTiles() {
    // 1. Floor '.'
    this.createStaticTile('.', (ctx) => {
      ctx.fillStyle = '#14141e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#1e1e2c';
      ctx.fillRect(1, 1, 30, 30);
      ctx.fillStyle = '#2a2a3e';
      ctx.fillRect(5, 7, 4, 4);
      ctx.fillRect(21, 19, 4, 4);
      ctx.fillRect(13, 23, 3, 3);
      ctx.fillStyle = '#111119';
      ctx.fillRect(0, 31, 32, 1);
      ctx.fillRect(31, 0, 1, 32);
    });

    // 2. Horizontal Wall '-'
    this.createStaticTile('-', (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 6, 32, 20);
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 8, 32, 16);
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 9, 13, 6);
      ctx.fillRect(17, 9, 13, 6);
      ctx.fillRect(8, 16, 15, 6);
      ctx.fillStyle = '#64748b'; // Specular highlight
      ctx.fillRect(2, 9, 13, 2);
      ctx.fillRect(17, 9, 13, 2);
      ctx.fillRect(8, 16, 15, 2);
      ctx.fillStyle = '#0f172a'; // Mortar shadow
      ctx.fillRect(0, 6, 32, 2);
      ctx.fillRect(0, 24, 32, 2);
      ctx.fillRect(15, 8, 2, 8);
      ctx.fillRect(7, 16, 2, 8);
      ctx.fillRect(23, 16, 2, 8);
    });

    // 3. Vertical Wall '|'
    this.createStaticTile('|', (ctx) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 0, 20, 32);
      ctx.fillStyle = '#334155';
      ctx.fillRect(8, 0, 16, 32);
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, 2, 14, 7);
      ctx.fillRect(9, 11, 14, 7);
      ctx.fillRect(9, 20, 14, 7);
      ctx.fillStyle = '#64748b'; // Highlight
      ctx.fillRect(9, 2, 14, 2);
      ctx.fillRect(9, 11, 14, 2);
      ctx.fillRect(9, 20, 14, 2);
      ctx.fillStyle = '#0f172a'; // Mortar
      ctx.fillRect(6, 0, 2, 32);
      ctx.fillRect(24, 0, 2, 32);
      ctx.fillRect(8, 9, 16, 2);
      ctx.fillRect(8, 18, 16, 2);
      ctx.fillRect(8, 27, 16, 2);
    });

    // 4. Passage / Corridor '#'
    this.createStaticTile('#', (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(4, 4, 24, 24);
      ctx.fillStyle = '#3730a3';
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(13, 13, 6, 6);
    });

    // 5. Door '+'
    this.createStaticTile('+', (ctx) => {
      ctx.fillStyle = '#14141e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, 3, 22, 26);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(7, 5, 18, 22);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(9, 7, 6, 8);
      ctx.fillRect(17, 7, 6, 8);
      ctx.fillRect(9, 17, 6, 8);
      ctx.fillRect(17, 17, 6, 8);
      ctx.fillStyle = '#334155'; // Iron bands
      ctx.fillRect(5, 9, 22, 2);
      ctx.fillRect(5, 21, 22, 2);
      ctx.fillStyle = '#f59e0b'; // Gold handle
      ctx.fillRect(20, 14, 4, 4);
    });

    // 6. Stairs '%'
    this.createStaticTile('%', (ctx) => {
      ctx.fillStyle = '#14141e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#020617';
      ctx.fillRect(5, 5, 22, 22);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 7, 18, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(9, 12, 14, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(11, 16, 10, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(13, 20, 6, 4);
    });

    // 7. Trap '^'
    this.createStaticTile('^', (ctx) => {
      ctx.fillStyle = '#14141e';
      ctx.fillRect(0, 0, 32, 32);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(6, 6, 20, 20);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(8, 8, 16, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(9, 22); ctx.lineTo(12, 10); ctx.lineTo(15, 22);
      ctx.moveTo(16, 22); ctx.lineTo(19, 10); ctx.lineTo(22, 22);
      ctx.fill();
    });

    // 8. Player Hero '@' (Animated: Frame 0 Stand / Frame 1 Breathe + Cape + Sword gleam)
    this.createAnimatedTile(
      '@',
      (ctx) => {
        // Frame 0: Standard Heroic Pose
        ctx.fillStyle = '#dc2626'; // Cape
        ctx.fillRect(6, 11, 20, 17);
        ctx.fillStyle = '#0284c7'; // Blue tunic
        ctx.fillRect(9, 10, 14, 14);
        ctx.fillStyle = '#38bdf8'; // Chest plate highlight
        ctx.fillRect(11, 11, 10, 8);
        ctx.fillStyle = '#78350f'; // Belt
        ctx.fillRect(9, 18, 14, 3);
        ctx.fillStyle = '#fbbf24'; // Buckle
        ctx.fillRect(14, 18, 4, 3);
        ctx.fillStyle = '#fed7aa'; // Face
        ctx.fillRect(11, 5, 10, 7);
        ctx.fillStyle = '#0f172a'; // Eyes
        ctx.fillRect(13, 7, 2, 2);
        ctx.fillRect(17, 7, 2, 2);
        ctx.fillStyle = '#15803d'; // Green Hat
        ctx.beginPath();
        ctx.moveTo(9, 6); ctx.lineTo(16, 1); ctx.lineTo(23, 6);
        ctx.fill();
        ctx.fillStyle = '#ef4444'; // Red Feather
        ctx.fillRect(20, 0, 3, 6);
        // Sword at side
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(23, 11, 3, 11);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(22, 10, 5, 2);
      },
      (ctx) => {
        // Frame 1: Dynamic Motion (Cape flutter + 1px breathing bob + sword glint)
        ctx.fillStyle = '#ef4444'; // Cape flaring wider
        ctx.beginPath();
        ctx.moveTo(5, 12); ctx.lineTo(27, 12); ctx.lineTo(25, 30); ctx.lineTo(7, 30);
        ctx.fill();
        ctx.fillStyle = '#0284c7'; // Tunic lowered 1px
        ctx.fillRect(9, 11, 14, 14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(11, 12, 10, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(9, 19, 14, 3);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(14, 19, 4, 3);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(11, 6, 10, 7);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(13, 8, 2, 2);
        ctx.fillRect(17, 8, 2, 2);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(9, 7); ctx.lineTo(16, 2); ctx.lineTo(23, 7);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(20, 1, 3, 6);
        // Sword angled + Sparkle Star Gleam
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(24, 12, 3, 11);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(23, 11, 5, 2);
        // 4-point golden sparkle glint
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(24, 9, 3, 3);
        ctx.fillRect(25, 7, 1, 7);
        ctx.fillRect(22, 10, 7, 1);
      }
    );

    // 9. Items
    this.createStaticTile('*', (ctx) => {
      // Gold
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(16, 18, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(12, 14, 8, 4);
      ctx.fillStyle = '#a16207';
      ctx.fillRect(14, 21, 6, 2);
    });

    this.createStaticTile(')', (ctx) => {
      // Weapon / Sword
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(16, 3); ctx.lineTo(19, 20); ctx.lineTo(13, 20);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(15, 6, 2, 12);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(10, 20, 12, 3);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(14, 23, 4, 6);
    });

    this.createStaticTile(']', (ctx) => {
      // Armor
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 8, 16, 18);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(10, 10, 5, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(14, 12, 4, 6);
    });

    this.createStaticTile('?', (ctx) => {
      // Scroll
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(8, 6, 16, 20);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(6, 14, 20, 4);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.createStaticTile('!', (ctx) => {
      // Potion
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(16, 18, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(13, 5, 6, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(12, 2, 8, 3);
    });

    this.createStaticTile('/', (ctx) => {
      // Wand
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 22, 16, 3);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(26, 23, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    this.createStaticTile('=', (ctx) => {
      // Ring
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(16, 17, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(14, 6, 4, 4);
    });

    this.createStaticTile(':', (ctx) => {
      // Food
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(16, 16, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(10, 14, 12, 4);
    });

    this.createStaticTile(',', (ctx) => {
      // Amulet of Yendor
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(16, 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(16, 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 10. Monsters A through Z (High-Detail 2-Frame Animated Sprites)
    const monsterConfig: Record<string, { bg0: string; bg1: string; eye: string; name: string; type: string }> = {
      A: { bg0: '#06b6d4', bg1: '#22d3ee', eye: '#ffffff', name: 'Aquator', type: 'slime' },
      B: { bg0: '#9333ea', bg1: '#a855f7', eye: '#fef08a', name: 'Bat', type: 'bat' },
      C: { bg0: '#059669', bg1: '#10b981', eye: '#ffffff', name: 'Centaur', type: 'quad' },
      D: { bg0: '#dc2626', bg1: '#ef4444', eye: '#facc15', name: 'Dragon', type: 'dragon' },
      E: { bg0: '#475569', bg1: '#64748b', eye: '#38bdf8', name: 'Emu', type: 'bird' },
      F: { bg0: '#ea580c', bg1: '#f97316', eye: '#fef08a', name: 'Flytrap', type: 'plant' },
      G: { bg0: '#65a30d', bg1: '#84cc16', eye: '#ef4444', name: 'Griffin', type: 'winged' },
      H: { bg0: '#ca8a04', bg1: '#eab308', eye: '#ef4444', name: 'Hobgoblin', type: 'humanoid' },
      I: { bg0: '#93c5fd', bg1: '#bfdbfe', eye: '#0284c7', name: 'IceMonster', type: 'crystal' },
      J: { bg0: '#db2777', bg1: '#ec4899', eye: '#ffffff', name: 'Jabberwock', type: 'beast' },
      K: { bg0: '#d97706', bg1: '#f59e0b', eye: '#ffffff', name: 'Kestrel', type: 'bird' },
      L: { bg0: '#7c3aed', bg1: '#8b5cf6', eye: '#facc15', name: 'Leprechaun', type: 'humanoid' },
      M: { bg0: '#4b5563', bg1: '#6b7280', eye: '#ef4444', name: 'Medusa', type: 'gorgon' },
      N: { bg0: '#0d9488', bg1: '#14b8a6', eye: '#ffffff', name: 'Nymph', type: 'fairy' },
      O: { bg0: '#4d7c0f', bg1: '#65a30d', eye: '#ef4444', name: 'Orc', type: 'humanoid' },
      P: { bg0: '#e11d48', bg1: '#f43f5e', eye: '#ffffff', name: 'Phantom', type: 'ghost' },
      Q: { bg0: '#be123c', bg1: '#e11d48', eye: '#fef08a', name: 'Quasit', type: 'imp' },
      R: { bg0: '#84cc16', bg1: '#a3e635', eye: '#000000', name: 'Rattlesnake', type: 'snake' },
      S: { bg0: '#2563eb', bg1: '#3b82f6', eye: '#ffffff', name: 'Snake', type: 'snake' },
      T: { bg0: '#166534', bg1: '#15803d', eye: '#ef4444', name: 'Troll', type: 'brute' },
      U: { bg0: '#d97706', bg1: '#f59e0b', eye: '#ffffff', name: 'Ur-vile', type: 'shadow' },
      V: { bg0: '#3b0764', bg1: '#581c87', eye: '#ef4444', name: 'Vampire', type: 'vampire' },
      W: { bg0: '#0369a1', bg1: '#0284c7', eye: '#38bdf8', name: 'Wraith', type: 'ghost' },
      X: { bg0: '#991b1b', bg1: '#b91c1c', eye: '#facc15', name: 'Xeroc', type: 'mimic' },
      Y: { bg0: '#c7d2fe', bg1: '#e0e7ff', eye: '#38bdf8', name: 'Yeti', type: 'beast' },
      Z: { bg0: '#334155', bg1: '#475569', eye: '#22c55e', name: 'Zombie', type: 'humanoid' },
    };

    for (let i = 65; i <= 90; i++) {
      const ch = String.fromCharCode(i);
      const conf = monsterConfig[ch] || { bg0: '#ef4444', bg1: '#f87171', eye: '#ffffff', name: ch, type: 'humanoid' };

      this.createAnimatedTile(
        ch,
        (ctx) => this.drawMonsterFrame(ctx, ch, conf, 0),
        (ctx) => this.drawMonsterFrame(ctx, ch, conf, 1)
      );
    }
  }

  private drawMonsterFrame(
    ctx: CanvasRenderingContext2D,
    letter: string,
    conf: { bg0: string; bg1: string; eye: string; name: string; type: string },
    frame: number
  ) {
    const bg = frame === 0 ? conf.bg0 : conf.bg1;
    const dy = frame === 1 ? -1 : 0; // 1px motion / breathing bob

    if (conf.type === 'bat') {
      // Bat (Wings Folded Frame 0 vs Wings Flapping Frame 1)
      ctx.fillStyle = bg;
      if (frame === 0) {
        ctx.beginPath();
        ctx.arc(16, 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(9, 11, 4, 10);
        ctx.fillRect(19, 11, 4, 10);
      } else {
        ctx.beginPath();
        ctx.arc(16, 15, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(3, 10); ctx.lineTo(16, 16); ctx.lineTo(29, 10); ctx.lineTo(24, 20); ctx.lineTo(8, 20);
        ctx.fill();
      }
      ctx.fillStyle = conf.eye;
      ctx.fillRect(13, 14 + dy, 2, 2);
      ctx.fillRect(17, 14 + dy, 2, 2);
    } else if (conf.type === 'dragon') {
      // Dragon (Horns + Snout + Frame 1 Fire Puff)
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(16, 16 + dy, 10, 0, Math.PI * 2);
      ctx.fill();
      // Golden Horns
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(11, 9 + dy); ctx.lineTo(7, 3 + dy); ctx.lineTo(13, 7 + dy);
      ctx.moveTo(21, 9 + dy); ctx.lineTo(25, 3 + dy); ctx.lineTo(19, 7 + dy);
      ctx.fill();
      // Eyes
      ctx.fillStyle = conf.eye;
      ctx.fillRect(12, 13 + dy, 3, 3);
      ctx.fillRect(17, 13 + dy, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(13, 14 + dy, 1, 2);
      ctx.fillRect(18, 14 + dy, 1, 2);
      if (frame === 1) {
        // Fire Breath puff
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(16, 26, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(15, 25, 2, 2);
      }
    } else if (conf.type === 'snake') {
      // Snake / Rattlesnake (Coiled body with flicking tongue on Frame 1)
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(16, 18 + dy, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16, 11 + dy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = conf.eye;
      ctx.fillRect(13, 10 + dy, 2, 2);
      ctx.fillRect(17, 10 + dy, 2, 2);
      if (frame === 1) {
        // Red Forked Tongue
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(15, 5, 2, 4);
        ctx.fillRect(14, 4, 1, 2);
        ctx.fillRect(17, 4, 1, 2);
      }
    } else if (conf.type === 'mimic') {
      // Mimic Xeroc (Closed Box Frame 0 vs Snapping Box Frame 1)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(6, 10 + dy, 20, 16);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(14, 16 + dy, 4, 4);
      if (frame === 1) {
        // Red inside + sharp white teeth
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(7, 12, 18, 5);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(9, 12, 2, 2);
        ctx.fillRect(13, 12, 2, 2);
        ctx.fillRect(17, 12, 2, 2);
        ctx.fillRect(21, 12, 2, 2);
      }
    } else {
      // Standard / Humanoid / Brute Animated Shape
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(16, 16 + dy, 11, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = conf.eye;
      ctx.fillRect(11, 13 + dy, 3, 3);
      ctx.fillRect(18, 13 + dy, 3, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, 14 + dy, 2, 2);
      ctx.fillRect(19, 14 + dy, 2, 2);
      if (frame === 1) {
        // Specular glow or highlight on upper crest
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14, 7, 4, 2);
      }
    }

    // Letter badge in bottom corner
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(11, 22, 10, 9);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 16, 27);
  }

  /**
   * Checks if the current 24-row frame is a special text / tombstone / menu screen
   */
  private isSpecialTextScreen(cells: RogueCellData[][]): boolean {
    for (let r = 0; r < 24; r++) {
      const row = cells[r];
      if (!row) continue;
      let rowChars = '';
      for (let c = 0; c < 80; c++) {
        const code = row[c]?.ch ?? 0;
        if (code > 0 && code !== 0xFFFF) {
          rowChars += String.fromCharCode(code);
        }
      }
      if (
        rowChars.includes('ここに眠る') ||
        rowChars.includes('安らかに') ||
        rowChars.includes('REST IN PEACE') ||
        rowChars.includes('Top  Ten') ||
        rowChars.includes('Rank   Score') ||
        rowChars.includes('順位') ||
        rowChars.includes('ランキング') ||
        rowChars.includes('スコア') ||
        rowChars.includes('________)/') ||
        rowChars.includes('XXXX     XXXX')
      ) {
        return true;
      }
    }
    return false;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    cells: RogueCellData[][],
    cellW: number,
    cellH: number,
    startRow = 1,
    endRow = 22
  ) {
    ctx.imageSmoothingEnabled = false;

    // Check if whole screen is a Tombstone / Score / Options screen
    const isSpecial = this.isSpecialTextScreen(cells);

    for (let r = startRow; r <= endRow; r++) {
      const row = cells[r];
      if (!row) continue;

      // Detect if this row contains a text overlay (e.g. inventory on right side)
      let textStartCol = 80;
      if (!isSpecial) {
        for (let c = 0; c < 80; c++) {
          if ((row[c]?.ch ?? 0) >= 0x80) {
            // Found Japanese text. Trace back to find start of menu prefix (e.g. " a) ")
            let start = c;
            while (start > 0 && (row[start - 1]?.ch ?? 0) !== 0) {
              const prev = row[start - 1]?.ch ?? 0;
              // Stop if we hit dungeon wall or open tile delimiters
              if (prev === 32 && start - 2 >= 0 && row[start - 2]?.ch === 32) {
                start -= 1;
                break;
              }
              start--;
            }
            textStartCol = Math.max(0, start);
            break;
          }
        }
      }

      let c = 0;
      while (c < 80) {
        const cell = row[c];
        if (!cell || cell.ch === 0 || cell.ch === 32 || cell.ch === 0xFFFF) {
          c++;
          continue;
        }

        const ch = cell.ch;
        const x = c * cellW;
        const y = r * cellH;

        if (ch >= 0x80) {
          // Fullwidth Unicode Japanese character (2 cells)
          const char = String.fromCharCode(ch);
          ctx.fillStyle = '#08090e';
          ctx.fillRect(x, y, cellW * 2, cellH);

          ctx.fillStyle = '#f8fafc';
          ctx.font = `bold ${Math.floor(cellH * 0.78)}px "DotGothic16", monospace`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, x, y + cellH / 2);
          c += 2;
          continue;
        }

        // Halfwidth ASCII character (1 cell)
        const char = String.fromCharCode(ch);

        // Render as text if in Special Screen OR in text overlay region (inventory menu)
        if (isSpecial || c >= textStartCol) {
          ctx.fillStyle = '#08090e';
          ctx.fillRect(x, y, cellW, cellH);
          ctx.fillStyle = '#f8fafc';
          ctx.font = `bold ${Math.floor(cellH * 0.75)}px "Courier New", Courier, monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, x + cellW / 2, y + cellH / 2);
          c++;
          continue;
        }

        // Standard Dungeon Gameplay Tile Rendering
        if (this.customTilesetImage) {
          const map = this.customTileMap[char];
          if (map) {
            ctx.drawImage(
              this.customTilesetImage,
              map.col * this.customTileSize,
              map.row * this.customTileSize,
              this.customTileSize,
              this.customTileSize,
              x,
              y,
              cellW,
              cellH
            );
            c++;
            continue;
          }
        }

        const tilePair = this.tileCache.get(char);
        if (tilePair) {
          const tile = tilePair[this.animFrame] || tilePair[0];
          // Draw floor under entities
          if (char === '@' || (char >= 'A' && char <= 'Z') || '*)[?!/=%^,:'.includes(char)) {
            const floorPair = this.tileCache.get('.');
            if (floorPair) {
              ctx.drawImage(floorPair[0], x, y, cellW, cellH);
            }
          }
          ctx.drawImage(tile, x, y, cellW, cellH);
        } else {
          ctx.fillStyle = '#08090e';
          ctx.fillRect(x, y, cellW, cellH);
          ctx.fillStyle = '#f8fafc';
          ctx.font = `bold ${Math.floor(cellH * 0.75)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(char, x + cellW / 2, y + cellH / 2);
        }
        c++;
      }
    }
  }
}
