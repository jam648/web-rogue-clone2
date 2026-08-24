/**
 * virtualPad.ts
 * On-screen touch D-Pad and Action buttons for mobile / tablet play.
 */

import { InputQueue } from '../engine/inputQueue';

export class VirtualPad {
  private container: HTMLElement;
  private inputQueue: InputQueue;

  constructor(inputQueue: InputQueue) {
    this.container = document.getElementById('virtual-pad')!;
    this.inputQueue = inputQueue;
    this.setupButtonEvents();
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.container.classList.remove('hidden');
      this.container.style.display = 'flex';
    } else {
      this.container.classList.add('hidden');
      this.container.style.display = 'none';
    }
  }

  private setupButtonEvents() {
    const buttons = this.container.querySelectorAll<HTMLButtonElement>('.vpad-btn');

    buttons.forEach((btn) => {
      const key = btn.dataset.key;
      if (!key) return;

      const trigger = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        this.inputQueue.pushKey(key);
      };

      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('mousedown', trigger);
    });
  }
}
