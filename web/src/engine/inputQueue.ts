/**
 * inputQueue.ts
 * Manages async input bridge between JS event listeners and Wasm rgetchar()
 * Full support for Mac Command (Cmd / metaKey), Ctrl, Arrows (^Arrow fast run), Vi keys, and Numpad
 */

export class InputQueue {
  private queue: number[] = [];
  private waiter: ((key: number) => void) | null = null;
  private pressedKeys = new Set<string>();
  private arrowTimeout: number | null = null;

  constructor() {
    this.setupKeyboardListeners();
  }

  /**
   * Called by Wasm Asyncify getch
   */
  public async getNextKey(): Promise<number> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    return new Promise<number>((resolve) => {
      this.waiter = resolve;
    });
  }

  /**
   * Push a character or ASCII code directly into the queue
   */
  public pushKey(key: number | string) {
    const code = typeof key === 'string' ? key.charCodeAt(0) : key;
    if (this.waiter) {
      const resolve = this.waiter;
      this.waiter = null;
      resolve(code);
    } else {
      this.queue.push(code);
    }
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Don't intercept when focusing input fields
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      this.pressedKeys.add(e.key);

      // Handle Arrow keys (with Ctrl/Cmd Fast Run and 2-key diagonal detection)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const isFastRun = e.ctrlKey || e.metaKey;
        this.handleArrowKeys(isFastRun);
        return;
      }

      // Handle Numpad keys (1-9)
      if (e.code.startsWith('Numpad') || (e.key >= '0' && e.key <= '9' && e.location === 3)) {
        e.preventDefault();
        const isFastRun = e.ctrlKey || e.metaKey;
        const numpadMap: Record<string, string> = {
          Numpad7: isFastRun ? 'Y' : 'y',
          Numpad8: isFastRun ? 'K' : 'k',
          Numpad9: isFastRun ? 'U' : 'u',
          Numpad4: isFastRun ? 'H' : 'h',
          Numpad5: '.',
          Numpad6: isFastRun ? 'L' : 'l',
          Numpad1: isFastRun ? 'B' : 'b',
          Numpad2: isFastRun ? 'J' : 'j',
          Numpad3: isFastRun ? 'N' : 'n',
          Numpad0: 's',
          NumpadDecimal: '>',
        };
        const mapped = numpadMap[e.code];
        if (mapped) {
          this.pushKey(mapped);
          return;
        }
      }

      // Special keys
      if (e.key === 'Escape') {
        e.preventDefault();
        this.pushKey(0o33); // 27
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this.pushKey(13); // '\r'
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.pushKey(8);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        this.pushKey(9);
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.pushKey(' ');
        return;
      }

      // Handle Control and Mac Command (metaKey) combinations
      const isModifier = e.ctrlKey || e.metaKey;

      if (e.key.length === 1) {
        if (isModifier) {
          const upper = e.key.toUpperCase().charCodeAt(0);
          if (upper >= 64 && upper <= 95) {
            e.preventDefault(); // Prevent browser shortcuts like Cmd+P (Print), Cmd+R (Reload)
            this.pushKey(upper - 64);
            return;
          }
        } else if (!e.altKey) {
          e.preventDefault();
          this.pushKey(e.key);
          return;
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.pressedKeys.delete(e.key);
    });
  }

  private handleArrowKeys(isFastRun: boolean) {
    if (this.arrowTimeout) {
      clearTimeout(this.arrowTimeout);
      this.arrowTimeout = null;
    }

    const up = this.pressedKeys.has('ArrowUp');
    const down = this.pressedKeys.has('ArrowDown');
    const left = this.pressedKeys.has('ArrowLeft');
    const right = this.pressedKeys.has('ArrowRight');

    const keyU = isFastRun ? 'U' : 'u';
    const keyN = isFastRun ? 'N' : 'n';
    const keyB = isFastRun ? 'B' : 'b';
    const keyY = isFastRun ? 'Y' : 'y';
    const keyK = isFastRun ? 'K' : 'k';
    const keyJ = isFastRun ? 'J' : 'j';
    const keyH = isFastRun ? 'H' : 'h';
    const keyL = isFastRun ? 'L' : 'l';

    // Diagonal combinations
    if (up && right) {
      this.pushKey(keyU);
      return;
    }
    if (down && right) {
      this.pushKey(keyN);
      return;
    }
    if (down && left) {
      this.pushKey(keyB);
      return;
    }
    if (up && left) {
      this.pushKey(keyY);
      return;
    }

    // Small debounce (25ms) to catch near-simultaneous 2-key presses
    this.arrowTimeout = window.setTimeout(() => {
      if (this.pressedKeys.has('ArrowUp') && this.pressedKeys.has('ArrowRight')) {
        this.pushKey(keyU);
      } else if (this.pressedKeys.has('ArrowDown') && this.pressedKeys.has('ArrowRight')) {
        this.pushKey(keyN);
      } else if (this.pressedKeys.has('ArrowDown') && this.pressedKeys.has('ArrowLeft')) {
        this.pushKey(keyB);
      } else if (this.pressedKeys.has('ArrowUp') && this.pressedKeys.has('ArrowLeft')) {
        this.pushKey(keyY);
      } else if (this.pressedKeys.has('ArrowUp')) {
        this.pushKey(keyK);
      } else if (this.pressedKeys.has('ArrowDown')) {
        this.pushKey(keyJ);
      } else if (this.pressedKeys.has('ArrowLeft')) {
        this.pushKey(keyH);
      } else if (this.pressedKeys.has('ArrowRight')) {
        this.pushKey(keyL);
      }
      this.arrowTimeout = null;
    }, 25);
  }
}
